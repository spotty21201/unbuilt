// Server seam protocol fixtures (Coder-owned). Spawns the real server on a
// test port and asserts the HTTP contract with hand-derived expectations:
// health shape, mock intent, bounded search determinism, refusals, and the
// honest 503 without a model key. No real model call is attempted.
import { spawn } from "node:child_process";

const PORT = 5179;
let failures = 0;
function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${ok ? "PASS" : "FAIL"} ${name}: actual=${JSON.stringify(actual)}`);
  if (!ok) failures++;
}

const child = spawn("node", ["--experimental-strip-types", "--no-warnings", "server/intent.mjs", "--port", String(PORT)], {
  cwd: new URL("..", import.meta.url).pathname,
  env: { ...process.env, UNBUILT_MODEL_KEY: "" },
  stdio: ["ignore", "pipe", "pipe"],
});
child.stdout.on("data", () => {});
child.stderr.on("data", () => {});
await new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error("server never listened")), 15000);
  const onData = (d) => {
    if (String(d).includes("listening")) {
      clearTimeout(timer);
      child.stdout.off("data", onData);
      resolve(null);
    }
  };
  child.stdout.on("data", onData);
  child.on("exit", () => reject(new Error("server exited early")));
});

try {
  const base = `http://127.0.0.1:${PORT}`;
  // Health discloses configuration, never secrets.
  const health = await (await fetch(`${base}/api/health`)).json();
  check("health-adapter", health.adapter, "mock");
  check("health-model-unset", health.modelConfigured, false);
  check("health-no-key", JSON.stringify(health).includes("UNBUILT_MODEL_KEY"), false);

  // Restricted CORS: the real app origin is echoed, preflight answered,
  // unlisted origins refused, direct no-Origin calls unaffected.
  const APP_ORIGIN = "http://100.117.187.86:5173";
  const corsHealth = await fetch(`${base}/api/health`, { headers: { origin: APP_ORIGIN } });
  check("cors-health-status", corsHealth.status, 200);
  check("cors-health-echo", corsHealth.headers.get("access-control-allow-origin"), APP_ORIGIN);
  check("cors-health-vary", corsHealth.headers.get("vary"), "Origin");
  const preflight = await fetch(`${base}/api/explain`, {
    method: "OPTIONS",
    headers: { origin: APP_ORIGIN, "access-control-request-method": "POST", "access-control-request-headers": "content-type" },
  });
  check("cors-preflight", preflight.status, 204);
  check("cors-preflight-methods", (preflight.headers.get("access-control-allow-methods") ?? "").includes("POST"), true);
  const evilHealth = await fetch(`${base}/api/health`, { headers: { origin: "http://evil.example" } });
  check("cors-evil-health", evilHealth.status, 403);
  const evilPreflight = await fetch(`${base}/api/explain`, { method: "OPTIONS", headers: { origin: "http://evil.example" } });
  check("cors-evil-preflight", evilPreflight.status, 403);
  const evilPost = await fetch(`${base}/api/explain`, {
    method: "POST",
    headers: { origin: "http://evil.example", "content-type": "application/json" },
    body: JSON.stringify({ snapshot: null, base: { family: "spine", frontage: 10 }, other: { family: "loop", frontage: 10 } }),
  });
  check("cors-evil-post", evilPost.status, 403);

  // Mock intent: hand-derived proposal for the signature request.
  const M = 1_000_000;
  const sel = { id: "grove-a", kind: "green", name: "Open space A" };
  const intentRes = await fetch(`${base}/api/intent`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ requestId: "r1", text: "Keep this open space. Do not increase the home selling price. What else can change?", ctx: { selected: sel, selectedPrice: 850 * M } }),
  });
  const intent = await intentRes.json();
  check("intent-status", intentRes.status, 200);
  check("intent-kind", intent.kind, "proposal");
  check("intent-lock", intent.operations.lockGreen, true);
  check("intent-ceiling", intent.operations.priceCeiling, 850 * M);
  check("intent-echo", intent.requestId, "r1");

  // Shape refusals carry reasons.
  const bad1 = await fetch(`${base}/api/intent`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: "hi" }) });
  check("intent-no-ctx", bad1.status, 400);
  const bad2 = await fetch(`${base}/api/intent`, { method: "POST", headers: { "content-type": "application/json" }, body: "{oops" });
  check("intent-malformed", bad2.status, 400);
  const bad3 = await fetch(`${base}/api/intent`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: "hi", ctx: { selected: { id: "x" }, selectedPrice: 1 } }) });
  check("intent-bad-sel", bad3.status, 400);

  // Bounded search: hand-derived Cedar expectations (spine-10, 20 homes).
  const site = { w: 120, h: 100, entrance: { edge: "west", offset: 50, width: 8 }, green: { x: 78, y: 62, w: 24, h: 20 } };
  const locks = { green: { x: 78, y: 62, w: 24, h: 20 }, priceCeiling: 850 * M, ownerExpectation: 10000 * M, targetFraction: 0.15 };
  const searchBody = { requestId: "s1", site, profile: "family-200", selectedPrice: 850 * M, locks, ranges: { families: ["spine", "loop"], frontages: [9, 10, 11, 12] }, seed: 7, budget: 250, lotEdits: {} };
  const s1 = await (await fetch(`${base}/api/search`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(searchBody) })).json();
  check("search-tested", s1.tested, 8);
  check("search-valid", s1.valid, 6);
  check("search-breakdown", s1.breakdown.geometryValid, 6);
  const spine10 = s1.candidates.find((c) => c.id === "spine-f10");
  check("search-spine10", spine10.quantities.n, 20);
  // Same request twice: identical snapshot hash (deterministic seam).
  const s2 = await (await fetch(`${base}/api/search`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(searchBody) })).json();
  check("search-deterministic", s2.snapshotHash, s1.snapshotHash);
  // Budget beyond the PRD cap refuses; unknown route 404s.
  const over = await fetch(`${base}/api/search`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...searchBody, budget: 251 }) });
  check("search-budget-cap", over.status, 400);
  const missing = await fetch(`${base}/api/nope`);
  check("unknown-route", missing.status, 404);

  // Snapshot search: same Cedar plan as a validated snapshot carries planHash.
  const snapshot = {
    version: 1,
    site: { w: 120, h: 100 },
    entrance: { edge: "west", offset: 50, width: 8 },
    green: { x: 78, y: 62, w: 24, h: 20 },
    greenLocked: true,
    lots: {},
    spec: { family: "spine", frontage: 10 },
    profileId: "family-200",
    assumptions: { price: 850 * M, ceiling: 850 * M, owner: 10000 * M, target: 0.15 },
    provenance: { sample: "cedar", photo: false },
    capabilities: ["rect-site", "rect-lots", "poly-reshape-12", "entrance-west-east", "open-space-lock", "bounded-search", "explain-deltas"],
    selected: { kind: "green", id: "grove-a" },
  };
  const ss = await (await fetch(`${base}/api/search`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ requestId: "s3", snapshot, ranges: { families: ["spine", "loop"], frontages: [9, 10, 11, 12] }, budget: 250 }) })).json();
  check("snap-tested", ss.tested, 8);
  check("snap-spine10", ss.candidates.find((c) => c.id === "spine-f10").quantities.n, 20);
  check("snap-hash-present", typeof ss.planHash, "string");
  const badSnap = await fetch(`${base}/api/search`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ snapshot: { ...snapshot, profileId: "tower-99" }, ranges: { families: ["spine"], frontages: [10] }, budget: 250 }) });
  check("snap-rejected", badSnap.status, 400);

  // Explain: hand-verified Cedar spine-10 vs loop-10 (area reconciles to
  // 120x100 = 12000 on both sides; loop n=17 observed independently).
  const ex = await (await fetch(`${base}/api/explain`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ requestId: "e1", snapshot, base: { family: "spine", frontage: 10 }, other: { family: "loop", frontage: 10 } }) })).json();
  check("explain-hash", ex.planHash, ss.planHash);
  check("explain-base-n", ex.base.quantities.n, 20);
  check("explain-base-road", ex.base.quantities.roadArea, 720);
  check("explain-base-allow", ex.base.landAllowance, 3559600000);
  check("explain-other-n", ex.other.quantities.n, 17);
  check("explain-other-road", ex.other.quantities.roadArea, 2076);
  check("explain-other-allow", ex.other.landAllowance, 1274560000);
  check("explain-d-homes", ex.deltas.homes, -3);
  check("explain-d-road", ex.deltas.roadArea, 1356);
  check("explain-d-allow", ex.deltas.landAllowance, -2285040000);
  check("explain-d-gap", ex.deltas.ownerGap, 2285040000);
  check("explain-valid", ex.base.validationErrors.length + ex.other.validationErrors.length, 0);
  const badSpec = await fetch(`${base}/api/explain`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ snapshot, base: { family: "ring", frontage: 10 }, other: { family: "loop", frontage: 10 } }) });
  check("explain-bad-spec", badSpec.status, 400);

  // Polygon snapshots must reach the engine unchanged through both endpoints.
  const boundary = [{ x: 0, y: 0 }, { x: 120, y: 0 }, { x: 120, y: 100 }, { x: 50, y: 100 }, { x: 0, y: 60 }];
  const polygonSnapshot = { ...snapshot, version: 2, site: { ...snapshot.site, boundary }, provenance: { sample: "custom", photo: false } };
  const post = (path, body) => fetch(`${base}${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const ps = await (await post("/api/search", { snapshot: polygonSnapshot, ranges: { families: ["spine", "loop"], frontages: [10, 11] }, budget: 250 })).json();
  const p10 = ps.candidates.find((c) => c.id === "spine-f10");
  check("polygon-server-n", p10.quantities.n, 18);
  check("polygon-server-remainder", p10.quantities.unallocatedArea, 6200);
  check("polygon-server-allowance", p10.finance.landAllowance, 2795600000);
  check("polygon-server-loop-omitted", ps.candidates.every((c) => c.family === "spine"), true);
  const pe = await (await post("/api/explain", { snapshot: polygonSnapshot, base: { family: "spine", frontage: 10 }, other: { family: "spine", frontage: 11 } })).json();
  check("polygon-explain-n", pe.base.quantities.n, 18);
  check("polygon-explain-remainder", pe.base.quantities.unallocatedArea, 6200);
  check("polygon-explain-allowance", pe.base.landAllowance, 2795600000);
  check("polygon-explain-version", pe.planHash, ps.planHash);
  const unsupported = await post("/api/explain", { snapshot: polygonSnapshot, base: { family: "spine", frontage: 10 }, other: { family: "loop", frontage: 10 } });
  check("polygon-unsupported-explain", unsupported.status, 422);
  check("polygon-unsupported-no-finance", (await unsupported.json()).landAllowance, undefined);
  check("polygon-downgrade-refused", (await post("/api/search", { snapshot: { ...polygonSnapshot, version: 1 }, ranges: { families: ["spine"], frontages: [10] }, budget: 250 })).status, 400);
  check("polygon-legacy-malformed-refused", (await post("/api/search", { ...searchBody, site: { ...site, boundary: {} } })).status, 400);

  // Meta adapter without a key: honest 503, never an attempted call.
  const meta = await fetch(`${base}/api/intent`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: "hi", ctx: { selected: null, selectedPrice: 1 }, adapter: "meta" }) });
  check("meta-no-key", meta.status, 503);
  check("meta-fallback", (await meta.json()).fallback, "local");
} finally {
  child.kill();
}

if (failures > 0) { console.error(`${failures} FAILURES`); process.exit(1); }
console.log("ALL SERVER FIXTURES PASS");
