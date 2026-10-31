import {developmentFindings} from '../src/development.ts';
import { handleAI } from './ai-assistant.mjs';
import { publicAIStatus } from './ai-config.mjs';
import {housingSummary} from '../src/housing.ts';
// UNBUILT deterministic server seam (Coder-owned). No dependencies; stdlib only.
//
// Run:  node --experimental-strip-types --no-warnings server/intent.mjs [--port 5174]
// Env:  UNBUILT_MODEL_KEY (secret, never logged), UNBUILT_MODEL_URL
//       (default https://api.meta.ai/v1/chat/completions),
//       UNBUILT_MODEL (default muse-spark-1.3).
//       UNBUILT_APP_ORIGIN (comma-separated trusted app origins for the
//       browser CORS policy; defaults cover the Tailscale + local dev app).
// Browser access is same-policy gated: requests carrying a non-listed
// Origin are refused (403), preflight is answered explicitly, and direct
// no-Origin calls (curl, tests) keep working with no CORS headers.
//
// Contract: the browser never interprets language and never invents geometry.
// POST /api/intent  -> validated intent operations (mock adapter: the local
//                     deterministic parser; meta adapter: Muse Spark tool call
//                     whose output is re-validated before it leaves).
// POST /api/search -> bounded deterministic search; locks enforced inside.
//   Accepts the legacy field form, or {snapshot, ranges, seed, budget} where
//   snapshot is a validated ScenarioSnapshot. Snapshot responses carry
//   planHash (hash of the validated snapshot) so the caller can prove the
//   server evaluated the plan it holds.
// POST /api/explain -> read-only measured deltas between two layout specs
//   evaluated against one validated snapshot. No mutation, no proposal.
// Without UNBUILT_MODEL_KEY the meta adapter answers 503 model_not_configured
// (honest, testable); model failure answers 502 with a local fallback hint.
import http from "node:http";
import { hasHome, hasLayout } from "../src/contents.ts";
import { siteFrameErrors } from "../src/boundary.ts";
import { parseIntent } from "../src/intent.ts";
import { BASE_PROFILE, COMPACT_PROFILE, failingLots, runSearch } from "../src/search.ts";
import { snapshotHash, validateSnapshot } from "../src/snapshot.ts";
import { deriveQuantities, editsForLayout, generateLoop, generateSpine, validateLayout } from "../src/geometry.ts";
import { evaluateLayout } from "../src/economics.ts";

const PORT = Number(process.argv.includes("--port") ? process.argv[process.argv.indexOf("--port") + 1] : 5174);
const MODEL_URL = process.env.UNBUILT_MODEL_URL ?? "https://api.meta.ai/v1/chat/completions";
const MODEL = process.env.UNBUILT_MODEL ?? "muse-spark-1.3";
const MODEL_KEY = process.env.UNBUILT_MODEL_KEY ?? "";
const BODY_LIMIT = 1_000_000;
const SEARCH_BUDGET_MAX = 250;
const DEFAULT_ORIGINS = ["http://100.117.187.86:5173", "http://localhost:5173", "http://127.0.0.1:5173"];
const ALLOWED_ORIGINS = [
  ...DEFAULT_ORIGINS,
  ...(process.env.UNBUILT_APP_ORIGIN ?? "").split(",").map((s) => s.trim()).filter(Boolean),
];

const PROFILES = { "starter-150": COMPACT_PROFILE, [BASE_PROFILE.id]: BASE_PROFILE };

function send(res, status, body) {
  const text = JSON.stringify(body);
  res.writeHead(status, { "content-type": "application/json", "content-length": Buffer.byteLength(text) });
  res.end(text);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > BODY_LIMIT) {
        chunks.length = 0;
        reject(new Error("body too large"));
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function isRecord(v) {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function num(v) {
  return typeof v === "number" && Number.isFinite(v);
}

function checkCtx(ctx) {
  if (!isRecord(ctx)) return "ctx must be an object";
  const sel = ctx.selected;
  if (sel !== null) {
    if (!isRecord(sel) || typeof sel.id !== "string" || typeof sel.name !== "string") {
      return "ctx.selected must be null or {id, kind, name}";
    }
    if (sel.kind !== "green" && sel.kind !== "boundary" && sel.kind !== "entrance") {
      return "ctx.selected.kind must be green|boundary|entrance";
    }
  }
  if (!num(ctx.selectedPrice)) return "ctx.selectedPrice must be a finite number";
  if (ctx.search !== undefined) {
    const s=ctx.search;
    if (!isRecord(s) || typeof s.manualStreets !== 'boolean' || (s.manualLots!==undefined&&typeof s.manualLots!=='boolean') || !Array.isArray(s.families) || !s.families.length || s.families.length>2 || s.families.some(f=>!['spine','loop'].includes(f)) || !Array.isArray(s.frontages) || !s.frontages.length || s.frontages.length>20 || s.frontages.some(f=>!num(f)||f<1||f>500)) return 'ctx.search must name supported families, frontages and manualStreets';
  }
  return null;
}

function checkSearch(body) {
  if (!isRecord(body)) return "body must be an object";
  const site = body.site;
  if (!isRecord(site) || !num(site.w) || !num(site.h) || !isRecord(site.green) || !isRecord(site.entrance)) {
    return "site must carry numeric w/h plus green and entrance";
  }
  if (site.boundary !== undefined && (!Array.isArray(site.boundary) || !site.boundary.every((p) => isRecord(p) && num(p.x) && num(p.y)))) return "boundary must contain finite coordinates";
  const shapeErrors = siteFrameErrors(site);
  if (shapeErrors.length) return shapeErrors[0];
  if (typeof body.profile !== "string" || !PROFILES[body.profile]) return "profile must be a known product id";
  const locks = body.locks;
  if (!isRecord(locks) || !num(locks.priceCeiling) || !num(locks.ownerExpectation) || !num(locks.targetFraction)) {
    return "locks must carry numeric priceCeiling/ownerExpectation/targetFraction";
  }
  if (!isRecord(locks.green)) return "locks.green must be a rect or null";
  const ranges = body.ranges;
  if (!isRecord(ranges) || !Array.isArray(ranges.families) || !Array.isArray(ranges.frontages)) {
    return "ranges must carry families[] and frontages[]";
  }
  if (!Number.isInteger(body.seed)) return "seed must be an integer";
  if (!Number.isInteger(body.budget) || body.budget < 1 || body.budget > SEARCH_BUDGET_MAX) {
    return `budget must be an integer 1..${SEARCH_BUDGET_MAX}`;
  }
  if (body.lotEdits !== undefined && !isRecord(body.lotEdits)) return "lotEdits must be an object when present";
  return null;
}

// Meta tool-calling adapter (Meta chat-completions protocol: Bearer key,
// {model, messages, tools, tool_choice}). Model output is data, never a
// decision: arguments are re-validated against the same narrow grammar as the
// local parser before the envelope is returned.
const PROPOSE_TOOL = {
  type: "function",
  function: {
    name: "propose_search",
    description: "Propose a bounded UNBUILT search: lock the selected open space, cap the price, pick a profile, run.",
    parameters: {
      type: "object",
      additionalProperties: false,
      properties: {
        lockGreen: { type: "boolean" },
        greenId: { type: ["string", "null"] },
        priceCeiling: { type: ["number", "null"] },
        profileId: { type: ["string", "null"] },
        runSearch: { type: "boolean" },
      },
      required: ["lockGreen", "greenId", "priceCeiling", "profileId", "runSearch"],
    },
  },
};

const SYSTEM_PROMPT = [
  "You interpret typed requests for UNBUILT, a residential site planner.",
  "Reply ONLY by calling propose_search with this grammar:",
  "- lockGreen true only to keep the user-selected open space (greenId from context);",
  "- priceCeiling in integer Rp or null (never invent a number);",
  "- profileId one of starter-150, family-200, or null;",
  "- runSearch true only when the user asks to search, test, or investigate alternatives.",
  "Anything else (buildings, financing, maps, 3D, vague asks) means runSearch false, all fields null/false.",
  "Never invent objects, prices, geometry, or tool calls outside propose_search.",
].join(" ");

async function metaIntent(text, ctx) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch(MODEL_URL, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${MODEL_KEY}` },
      signal: ctrl.signal,
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Request: ${text}\nSelection: ${JSON.stringify(ctx.selected)}\nSelected price Rp: ${ctx.selectedPrice}` },
        ],
        tools: [PROPOSE_TOOL],
        tool_choice: { type: "function", function: { name: "propose_search" } },
      }),
    });
    if (!res.ok) return { error: `model_http_${res.status}` };
    const data = await res.json();
    const call = data?.choices?.[0]?.message?.tool_calls?.[0];
    if (!call || call.function?.name !== "propose_search") return { error: "model_no_tool_call" };
    let args = null;
    try {
      args = JSON.parse(call.function.arguments ?? "null");
    } catch {
      return { error: "model_bad_arguments" };
    }
    if (!isRecord(args) || typeof args.lockGreen !== "boolean" || typeof args.runSearch !== "boolean") {
      return { error: "model_shape_rejected" };
    }
    if (args.priceCeiling !== null && (!num(args.priceCeiling) || args.priceCeiling <= 0)) {
      return { error: "model_shape_rejected" };
    }
    if (args.profileId !== null && !PROFILES[args.profileId]) return { error: "model_shape_rejected" };
    if (args.greenId !== null && typeof args.greenId !== "string") return { error: "model_shape_rejected" };
    return {
      operations: {
        lockGreen: args.lockGreen,
        greenId: args.greenId,
        priceCeiling: args.priceCeiling === null ? null : Math.round(args.priceCeiling),
        profileId: args.profileId,
        runSearch: args.runSearch,
      },
    };
  } catch (e) {
    return { error: e?.name === "AbortError" ? "model_timeout" : "model_unreachable" };
  } finally {
    clearTimeout(timer);
  }
}

const server = http.createServer(async (req, res) => {
  try {
    // Restricted CORS: only listed app origins reach the API from a
    // browser. Preflight is answered explicitly; anything else carrying a
    // non-listed Origin is refused before routing.
    const origin = req.headers.origin ?? null;
    const trusted = origin !== null && ALLOWED_ORIGINS.includes(origin);
    if (req.method === "OPTIONS") {
      if (!trusted) {
        send(res, 403, { error: "origin_not_allowed" });
        return;
      }
      res.writeHead(204, {
        "Access-Control-Allow-Origin": origin,
        Vary: "Origin",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "content-type, authorization",
        "Access-Control-Max-Age": "600",
      });
      res.end();
      return;
    }
    if (origin !== null) {
      if (!trusted) {
        send(res, 403, { error: "origin_not_allowed" });
        return;
      }
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
    }
    if (req.method === "GET" && req.url === "/api/health") {
      res.setHeader("Cache-Control", "no-store");
      send(res, 200, { ok: true, adapter: MODEL_KEY ? "meta" : "mock", model: MODEL, modelConfigured: publicAIStatus().configured, ai: publicAIStatus() });
      return;
    }
    if (req.url?.startsWith('/api/ai/')) {
      let body;
      if (req.method === 'POST') {
        try { body = JSON.parse(await readBody(req)); }
        catch { send(res, 400, {error:'Malformed JSON or body too large.'}); return; }
      }
      await handleAI(req,res,body,send);
      return;
    }
    if (req.method === "POST" && (req.url === "/api/intent" || req.url === "/api/search" || req.url === "/api/explain")) {
      let body = null;
      try {
        body = JSON.parse(await readBody(req));
      } catch {
        send(res, 400, { error: "malformed JSON or body too large" });
        return;
      }
      if (req.url === "/api/intent") {
        if (!isRecord(body) || typeof body.text !== "string") {
          send(res, 400, { error: "body.text must be a string" });
          return;
        }
        const ctxErr = checkCtx(body.ctx);
        if (ctxErr) {
          send(res, 400, { error: ctxErr });
          return;
        }
        const requestId = typeof body.requestId === "string" ? body.requestId : null;
        if (body.adapter === "meta") {
          if (!MODEL_KEY) {
            send(res, 503, { error: "model_not_configured", fallback: "local" });
            return;
          }
          const r = await metaIntent(body.text, body.ctx);
          if (r.error) {
            send(res, 502, { error: r.error, fallback: "local" });
            return;
          }
          send(res, 200, { requestId, adapter: "meta", model: MODEL, kind: "proposal", operations: r.operations });
          return;
        }
        const r = parseIntent(body.text, body.ctx);
        send(res, 200, { requestId, adapter: "mock", kind: r.kind, text: r.text, operations: r.operations });
        return;
      }
      if (req.url === "/api/search") {
        let req_args = null;
        let planHash = null;
        if (body.snapshot !== undefined) {
          const v = validateSnapshot(body.snapshot);
          if (!v.ok) {
            send(res, 400, { error: `snapshot rejected: ${v.error}` });
            return;
          }
          const s = v.snapshot;
          if (typeof body.seed !== "undefined" && !Number.isInteger(body.seed)) {
            send(res, 400, { error: "seed must be an integer" });
            return;
          }
          if (!Number.isInteger(body.budget) || body.budget < 1 || body.budget > SEARCH_BUDGET_MAX) {
            send(res, 400, { error: `budget must be an integer 1..${SEARCH_BUDGET_MAX}` });
            return;
          }
          const ranges = body.ranges;
          if (!isRecord(ranges) || !Array.isArray(ranges.families) || !Array.isArray(ranges.frontages)) {
            send(res, 400, { error: "ranges must carry families[] and frontages[]" });
            return;
          }
          req_args = {
            site: { ...s.site, entrance: s.entrance, green: s.green },
            profile: PROFILES[s.profileId],
            selectedPrice: s.assumptions.price,
            // Generators reproduce site.green either way, so the reserved
            // region travels with the search; the lock flag governs UI
            // commits, not geometry the engine cannot move.
            locks: {
              green: s.green,
              priceCeiling: s.assumptions.ceiling,
              ownerExpectation: s.assumptions.owner,
              targetFraction: s.assumptions.target,
            },
            ranges,
            seed: body.seed ?? 7,
            budget: body.budget,
            lotEdits: s.lots,
          };
          planHash = snapshotHash(s);
        } else {
          const err = checkSearch(body);
          if (err) {
            send(res, 400, { error: err });
            return;
          }
          req_args = {
            site: body.site,
            profile: PROFILES[body.profile],
            selectedPrice: body.selectedPrice ?? body.locks.priceCeiling,
            locks: body.locks,
            ranges: body.ranges,
            seed: body.seed,
            budget: body.budget,
            lotEdits: body.lotEdits ?? {},
          };
        }
        const run = runSearch(req_args);
        send(res, 200, {
          requestId: typeof body.requestId === "string" ? body.requestId : null,
          adapter: "mock",
          tested: run.tested,
          valid: run.valid,
          qualified: run.qualified,
          breakdown: run.breakdown,
          vetoes: run.vetoes,
          snapshotHash: run.snapshotHash,
          elapsedMs: run.elapsedMs,
          candidates: run.candidates,
          ...(run.blockers?{blockers:run.blockers}:{}),
          ...(planHash === null ? {} : { planHash }),
        });
        return;
      }
      // POST /api/explain: read-only measured comparison of two layout specs
      // against one validated snapshot. Explains invalid sides too, labeled.
      const v = validateSnapshot(body.snapshot);
      if (!v.ok) {
        send(res, 400, { error: `snapshot rejected: ${v.error}` });
        return;
      }
      const specErr = (sp) =>
        !isRecord(sp) || (sp.family !== "spine" && sp.family !== "loop") || !num(sp.frontage) || sp.frontage <= 0
          ? "specs must be {family spine|loop, positive finite frontage}"
          : null;
      const be = specErr(body.base);
      const oe = specErr(body.other);
      if (be ?? oe) {
        send(res, 400, { error: be ?? oe });
        return;
      }
      const s = v.snapshot;
      const site = { ...s.site, entrance: s.entrance, green: s.green };
      if (!hasLayout(site)) { send(res, 422, { error: "Generate a layout before comparing economics.", layoutUnavailable: true }); return; }
      const profile = PROFILES[s.profileId];
      if(site.planning?.lotPlan!==undefined && (body.base.family!==body.other.family||body.base.frontage!==body.other.frontage)){send(res,422,{error:'Manual lots are held. A changed frontage specification does not define a different parcel plan; preview generated lots before comparing frontage alternatives.'});return;}
      const explainSide = (sp) => {
        const layout = sp.family === "spine" ? generateSpine(site, sp.frontage) : generateLoop(site, sp.frontage);
        const carried = editsForLayout(layout.parcels, s.lots);
        const validationErrors = validateLayout(site, layout, carried);
        const failing = failingLots(layout.parcels, profile, { lotEdits: carried, roads: layout.roads, roadSurface: layout.roadSurface }).filter(i => hasHome(site, layout.parcels[i]));
        const econ = evaluateLayout(
          site,
          layout,
          s.assumptions.price,
          { ownerExpectation: s.assumptions.owner, targetFraction: s.assumptions.target },
          carried,
        );
        return {
          spec: sp,
          quantities: deriveQuantities(site, layout, carried),
          builtArea:econ.builtArea,
          housing:housingSummary(site,layout.parcels),
          ...(site.development?{development:developmentFindings(site,layout,carried,econ,s.assumptions.price,s.assumptions.owner)}:{}),
          revenue: econ.finance.revenue,
          costNonLand: econ.costNonLand,
          landAllowance: econ.finance.landAllowance,
          ownerGap: econ.finance.ownerGap,
          surplus: econ.finance.surplus,
          validationErrors,
          applicable: failing.length === 0,
          failingLots: failing.length,
          carriedReshapes: carried.size,
        };
      };
      const support = [body.base, body.other].map((sp) => (sp.family === "spine" ? generateSpine(site, sp.frontage) : generateLoop(site, sp.frontage)).supportError).find(Boolean);
      if (support) { send(res, 422, { error: support, layoutUnavailable: true }); return; }
      const baseSide = explainSide(body.base);
      const otherSide = explainSide(body.other);
      const delta = (a, b) => (a === null || b === null || typeof a !== "number" || typeof b !== "number" ? null : b - a);
      send(res, 200, {
        requestId: typeof body.requestId === "string" ? body.requestId : null,
        adapter: "mock",
        planHash: snapshotHash(s),
        pricedAt: { price: s.assumptions.price, owner: s.assumptions.owner, target: s.assumptions.target },
        base: baseSide,
        other: otherSide,
        deltas: {
          homes: delta(baseSide.quantities.n, otherSide.quantities.n),
          roadArea: delta(baseSide.quantities.roadArea, otherSide.quantities.roadArea),
          greenArea: delta(baseSide.quantities.greenArea, otherSide.quantities.greenArea),
          parcelArea: delta(baseSide.quantities.parcelArea, otherSide.quantities.parcelArea),
          landAllowance: delta(baseSide.landAllowance, otherSide.landAllowance),
          ownerGap: delta(baseSide.ownerGap, otherSide.ownerGap),
        },
      });
      return;
    }
    send(res, 404, { error: "unknown route" });
  } catch {
    try {
      send(res, 500, { error: "internal" });
    } catch {
      // already closed
    }
  }
});

server.listen(PORT, () => {
  console.log(`unbuilt-server listening on ${PORT}`);
});
