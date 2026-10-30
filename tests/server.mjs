import {generateSpine} from '../src/geometry.ts';
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

  const scoped=await fetch(`${base}/api/intent`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({text:'Search alternatives',ctx:{selected:sel,selectedPrice:850*M,search:{manualStreets:true,families:['spine'],frontages:[9,10,11,12]}}})});
  const scopedResult=await scoped.json();
  check('intent-manual-scope-status',scoped.status,200);
  check('intent-manual-scope-holds-streets',scopedResult.text.includes('manual street geometry and widths held fixed')&&!scopedResult.text.includes('circulation pattern'),true);
  const invalidScope=await fetch(`${base}/api/intent`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({text:'Search',ctx:{selected:null,selectedPrice:850*M,search:{manualStreets:'yes',families:['unknown'],frontages:[null]}}})});
  check('intent-invalid-search-scope-refused',invalidScope.status,400);

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

  const planning = { lotDepth: 20, greenBuffer: 0, homeWidth: 12, homeDepth: 6, streets: [], siteLocked: true, priceLocked: true };
  const parametric = { ...snapshot, version: 3, site: { ...snapshot.site, planning } };
  const px = await post("/api/explain", { snapshot: parametric, base: { family: "spine", frontage: 10 }, other: { family: "spine", frontage: 11 } });
  const pm = await px.json();
  check("parametric-explain-status", px.status, 200);
  check("parametric-server-home-count", pm.base.quantities.n, 20);
  check("parametric-server-template-cost-effect", pm.base.landAllowance, 2299600000);
  check("parametric-downgrade-refused", (await post("/api/search", { snapshot: { ...parametric, version: 2 }, ranges: { families: ["spine"], frontages: [10] }, budget: 8 })).status, 400);
  check("parametric-invalid-input-refused", (await post("/api/search", { snapshot: { ...parametric, site: { ...parametric.site, planning: { ...planning, homeWidth: 0 } } }, ranges: { families: ["spine"], frontages: [10] }, budget: 8 })).status, 400);
  const triangle = { ...parametric, site: { ...parametric.site, boundary: [{ x: 0, y: 0 }, { x: 120, y: 50 }, { x: 0, y: 100 }] }, green: { x: 10, y: 20, w: 15, h: 10 } };
  const tx = await post("/api/explain", { snapshot: triangle, base: { family: "spine", frontage: 10 }, other: { family: "spine", frontage: 11 } });
  const tm = await tx.json();
  check("parametric-triangle-explain", tx.status, 200);
  check("parametric-triangle-road-area", tm.base.quantities.roadArea, 672);
  const noCeiling = { ...parametric, site: { ...parametric.site, planning: { ...planning, priceLocked: false } }, assumptions: { ...parametric.assumptions, ceiling: 800000000 } };
  const nc = await (await post("/api/search", { snapshot: noCeiling, ranges: { families: ["spine"], frontages: [10] }, budget: 8 })).json();
  check("parametric-server-price-lock-off", nc.qualified, 1);
  check("parametric-server-never-changes-price", nc.candidates[0].finance.revenue, 17000000000);

  const edgeSnapshot = { ...parametric, version: 4, entrance: { ...snapshot.entrance, boundaryEdge: 3 }, site: { ...parametric.site, planning: { ...planning, minGreenArea: 480 } } };
  const es = await post("/api/search", { snapshot: edgeSnapshot, ranges: { families: ["spine", "loop"], frontages: [10, 11] }, budget: 8 });
  const em = await es.json();
  check("boundary-edge-search-status", es.status, 200);
  check("boundary-edge-server-measured-apron", em.candidates[0].quantities.roadArea, 723);
  check("boundary-edge-only-supported-family", em.candidates.every(c => c.family === "spine"), true);
  const ee = await post("/api/explain", { snapshot: edgeSnapshot, base: { family: "spine", frontage: 10 }, other: { family: "spine", frontage: 11 } });
  const eem = await ee.json();
  check("boundary-edge-explain-status", ee.status, 200);
  check("boundary-edge-explain-same-geometry", eem.base.quantities.roadArea, 723);
  check("boundary-edge-downgrade-refused", (await post("/api/search", { snapshot: { ...edgeSnapshot, version: 3 }, ranges: { families: ["spine"], frontages: [10] }, budget: 8 })).status, 400);

  const blank = { ...parametric, version: 5, site: { ...parametric.site, contents: { boundary: false, layout: false, removedHomes: [] } } };
  check("blank-explanation-refuses-fake-economics", (await post("/api/explain", { snapshot: blank, base: { family: "spine", frontage: 10 }, other: { family: "spine", frontage: 11 } })).status, 422);
  const emptySearch = await (await post("/api/search", { snapshot: blank, ranges: { families: ["spine"], frontages: [10] }, budget: 8 })).json();
  check("blank-search-has-no-candidates", emptySearch.candidates.length, 0);

  const streetNetwork = {segments:[{id:'main-a',a:{x:0,y:50},b:{x:40,y:50},width:6},{id:'main-b',a:{x:40,y:50},b:{x:120,y:50},width:6},{id:'branch',a:{x:40,y:50},b:{x:40,y:90},width:6}]};
  const manual = {...parametric,version:6,site:{...parametric.site,planning:{...planning,homeWidth:10,streetNetwork}}};
  const ms = await post('/api/search',{snapshot:manual,ranges:{families:['spine','loop'],frontages:[10,11]},budget:8});
  const mr = await ms.json();
  check('manual-streets-search-status',ms.status,200);
  check('manual-streets-search-retains-measured-area',mr.candidates.every(c=>c.quantities.roadArea===942),true);
  check('manual-streets-search-does-not-replace-network-with-loop',mr.candidates.length>0&&mr.candidates.every(c=>c.family==='spine'),true);
  const me = await post('/api/explain',{snapshot:manual,base:{family:'spine',frontage:10},other:{family:'spine',frontage:11}});
  const mm = await me.json();
  check('manual-streets-explain-status',me.status,200);
  check('manual-streets-explain-measures-road-surface',mm.base.quantities.roadArea,942);
  check('manual-streets-explain-holds-road-geometry',mm.deltas.roadArea,0);
  check('manual-streets-snapshot-downgrade-refused',(await post('/api/search',{snapshot:{...manual,version:5},ranges:{families:['spine'],frontages:[10]},budget:8})).status,400);
  const parcelSite={...parametric.site,planning:{...planning,homeWidth:10},green:snapshot.green,entrance:snapshot.entrance};
  const originalLots=generateSpine(parcelSite).parcels;
  const lotPlan=[{...originalLots[0],w:20},...originalLots.filter((_,i)=>i!==0&&i!==2)];
  const parcelSnapshot={...parametric,version:7,site:{...parametric.site,planning:{...planning,homeWidth:10,lotPlan}}};
  const parcelSearch=await post('/api/search',{snapshot:parcelSnapshot,ranges:{families:['spine'],frontages:[10,11]},budget:8});
  const parcelRun=await parcelSearch.json();
  check('manual-lots-search-status',parcelSearch.status,200);
  check('manual-lots-no-false-frontage-alternatives',parcelRun.tested,0);
  check('manual-lots-search-actionable-blocker',parcelRun.blockers[0].includes('Manual lots are held'),true);
  const parcelExplain=await post('/api/explain',{snapshot:parcelSnapshot,base:{family:'spine',frontage:10},other:{family:'spine',frontage:10}});
  const parcelMeasurement=await parcelExplain.json();
  check('manual-lots-measured-explanation-status',parcelExplain.status,200);
  check('manual-lots-server-home-count',parcelMeasurement.base.quantities.n,19);
  check('manual-lots-server-true-area',parcelMeasurement.base.quantities.parcelArea,4000);
  check('manual-lots-server-retained-roads',parcelMeasurement.base.quantities.roadArea,720);
  check('manual-lots-inapplicable-frontage-comparison-refused',(await post('/api/explain',{snapshot:parcelSnapshot,base:{family:'spine',frontage:10},other:{family:'spine',frontage:11}})).status,422);
  check('manual-lots-downgrade-refused',(await post('/api/search',{snapshot:{...parcelSnapshot,version:6},ranges:{families:['spine'],frontages:[10]},budget:8})).status,400);

  const housingSnapshot=structuredClone(parcelSnapshot);housingSnapshot.version=8;
  const firstLot=housingSnapshot.site.planning.lotPlan[0];
  housingSnapshot.site.planning.housing={templates:[{id:'h1',name:'Original home',width:10,depth:6},{id:'h2',name:'Courtyard',width:8,depth:6}],defaultId:'h1',assignments:{[`${firstLot.x},${firstLot.y},${firstLot.w},${firstLot.h}`]:'h2'}};
  housingSnapshot.capabilities.push('housing-mix');
  const mixExplain=await post('/api/explain',{snapshot:housingSnapshot,base:{family:'spine',frontage:10},other:{family:'spine',frontage:10}}),mixMeasure=await mixExplain.json();
  check('housing-server-measured-status',mixExplain.status,200);
  check('housing-server-true-built-area',mixMeasure.base.builtArea,1128);
  check('housing-server-template-counts',mixMeasure.base.housing.rows.map(r=>r.count),[18,1]);
  check('housing-server-home-count-unchanged',mixMeasure.base.quantities.n,19);
  check('housing-server-allowance-from-actual-built-area',mixMeasure.base.landAllowance-parcelMeasurement.base.landAllowance,63e6);
  check('housing-snapshot-old-envelope-refused',(await post('/api/explain',{snapshot:{...housingSnapshot,version:7},base:{family:'spine',frontage:10},other:{family:'spine',frontage:10}})).status,400);
  const unknownMix=structuredClone(housingSnapshot);unknownMix.site.planning.housing.defaultId='missing';
  check('housing-invalid-template-reference-refused',(await post('/api/search',{snapshot:unknownMix,ranges:{families:['spine'],frontages:[10]},budget:8})).status,400);
  check('housing-missing-capability-refused',(await post('/api/search',{snapshot:{...housingSnapshot,capabilities:housingSnapshot.capabilities.filter(c=>c!=='housing-mix')},ranges:{families:['spine'],frontages:[10]},budget:8})).status,400);


  const costSnapshot={...snapshot,version:10,site:{...snapshot.site,costAssumptions:{constructionPerM2:4e6,roadPerM2:8e5,greenWorksPerM2:15e4,setupAllowance:8e8,otherWorksAllowance:12e8,professionalAllowance:13e8,contingencyFraction:.05,sellFraction:.03}},capabilities:[...snapshot.capabilities,'editable-cost-assumptions']};
  const ce=await post('/api/explain',{snapshot:costSnapshot,base:{family:'spine',frontage:10},other:{family:'loop',frontage:10}}),cm=await ce.json();
  check('cost-snapshot-server-status',ce.status,200);
  check('cost-snapshot-server-base-cost',cm.base.costNonLand,9120400000);
  check('cost-snapshot-server-base-allowance',cm.base.landAllowance,4819600000);
  const cs=await post('/api/search',{snapshot:costSnapshot,ranges:{families:['spine'],frontages:[10]},budget:8}),cr=await cs.json();
  check('cost-snapshot-server-search-cost',cr.candidates[0].costNonLand,9120400000);
  check('cost-snapshot-server-hash-agrees',cr.planHash,cm.planHash);
  check('cost-snapshot-downgrade-refused',(await post('/api/search',{snapshot:{...costSnapshot,version:9},ranges:{families:['spine'],frontages:[10]},budget:8})).status,400);
  const corruptCost=structuredClone(costSnapshot);corruptCost.site.costAssumptions.sellFraction=-1;
  check('invalid-cost-snapshot-refused',(await post('/api/explain',{snapshot:corruptCost,base:{family:'spine',frontage:10},other:{family:'loop',frontage:10}})).status,400);

  // Meta adapter without a key: honest 503, never an attempted call.
  const meta = await fetch(`${base}/api/intent`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: "hi", ctx: { selected: null, selectedPrice: 1 }, adapter: "meta" }) });
  check("meta-no-key", meta.status, 503);
  check("meta-fallback", (await meta.json()).fallback, "local");
} finally {
  child.kill();
}

if (failures > 0) { console.error(`${failures} FAILURES`); process.exit(1); }
console.log("ALL SERVER FIXTURES PASS");
