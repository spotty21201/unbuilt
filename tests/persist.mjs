// Persistence fixtures (Coder-owned). Round-trip, decision-record import,
// and every refusal path use hand-built values, never implementation output.
import { parseProject, serializeProject } from "../src/persist.ts";

let failures = 0;
function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${ok ? "PASS" : "FAIL"} ${name}: actual=${JSON.stringify(actual)}`);
  if (!ok) { console.log(`  expected=${JSON.stringify(expected)}`); failures++; }
}

const state = {
  spec: { family: "spine", frontage: 10 },
  green: { x: 78, y: 62, w: 24, h: 20 },
  entrance: { edge: "west", offset: 50, width: 8 },
  lots: { "0,27,10,20": [{ x: 0, y: 28 }, { x: 10, y: 28 }, { x: 10, y: 47 }, { x: 0, y: 47 }] },
  profileId: "starter-150",
  greenLocked: true,
  priceS: "850",
  ceilingS: "850",
  ownerS: "10000",
  targetS: "15",
  baseSpec: { w: 120, h: 100 },
};
const decisions = [{ t: "2026-01-01T00:00:00.000Z", kind: "edit", detail: "x" }];

const saved = serializeProject(state, decisions);
const back = parseProject(JSON.parse(JSON.stringify(saved)));
check("roundtrip-ok", back.ok, true);
if (back.ok) {
  check("roundtrip-state", back.project.state, state);
  check("roundtrip-decisions", back.project.decisions, decisions);
  check("photo-never", back.project.photo.included, false);
}

// Decision-record (export v2) import restores the accepted plan, no drafts.
const record = {
  app: "UNBUILT decision record",
  exportVersion: 2,
  exportedAt: "2026-01-01T00:00:00.000Z",
  units: "m",
  state: {
    site: { w: 140, h: 110, provenance: "x" },
    entrance: { edge: "east", offset: 55, width: 8 },
    openSpace: { geometry: { x: 80, y: 60, w: 20, h: 18 }, locked: true, surface: "s", costBasisRpPerM2: 1 },
    plan: { family: "loop", frontage: 11, profile: "starter-150", roads: [], parcels: [], lotReshapes: {}, draftPending: null },
    quantities: null,
    economics: null,
    assumptions: { assumedPriceRp: 850000000, ceilingRp: 850000000, ownerExpectationRp: 10000000000, targetFraction: 0.15, profileSource: "s" },
  },
  events: [{ t: "t", kind: "run", detail: "d" }],
  history: { undoDepth: 0, redoDepth: 0, note: "n" },
};
const imp = parseProject(record);
check("record-ok", imp.ok, true);
if (imp.ok) {
  check("record-site", imp.project.state.baseSpec, { w: 140, h: 110 });
  check("record-entrance", imp.project.state.entrance, { edge: "east", offset: 55, width: 8 });
  check("record-green", imp.project.state.green, { x: 80, y: 60, w: 20, h: 18 });
  check("record-lock", imp.project.state.greenLocked, true);
  check("record-target", imp.project.state.targetS, "15");
  check("record-family", imp.project.state.spec, { family: "loop", frontage: 11 });
  check("record-assume", [imp.project.state.priceS, imp.project.state.ceilingS, imp.project.state.ownerS], ["850", "850", "10"]);
}

// Refusals: every one carries a reason, nothing partially restores.
check("refuse-version", parseProject({ ...saved, version: 99 }).ok, false);
check("refuse-format", parseProject({ ...saved, format: "nope" }).ok, false);
check("refuse-string", parseProject("hello").ok, false);
check("refuse-null", parseProject(null).ok, false);
const nanCoords = JSON.parse(JSON.stringify({ ...saved, state: { ...saved.state, green: { x: null, y: 62, w: 24, h: 20 } } }));
check("refuse-null-coord", parseProject(nanCoords).ok, false);
check("refuse-many-corners", parseProject({ ...saved, state: { ...saved.state, lots: { k: Array.from({ length: 13 }, () => ({ x: 1, y: 1 })) } } }).ok, false);
check("refuse-few-corners", parseProject({ ...saved, state: { ...saved.state, lots: { k: [{ x: 1, y: 1 }] } } }).ok, false);
check("refuse-bad-edge", parseProject({ ...saved, state: { ...saved.state, entrance: { edge: "north", offset: 5, width: 8 } } }).ok, false);
check("refuse-bad-decisions", parseProject({ ...saved, decisions: [{ kind: "x" }] }).ok, false);
check("refuse-record-nostate", parseProject({ app: "UNBUILT decision record", exportVersion: 2 }).ok, false);
// Every refusal explains itself.
check(
  "refuse-reasons",
  [parseProject(null), parseProject({ ...saved, version: 99 })].every((r) => !r.ok && typeof r.error === "string" && r.error.length > 0),
  true,
);

if (failures > 0) { console.error(`${failures} FAILURES`); process.exit(1); }
console.log("ALL PERSIST FIXTURES PASS");
