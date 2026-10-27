// Coder developer test for bounded search (M1->M2). Locks, ceiling, applicability,
// selection honesty. Hand-checked expectations noted inline.
import { cedarMarket, generateSpine, generateLoop, validateLayout } from "../src/geometry.ts";
import { BASE_PROFILE, COMPACT_PROFILE, failingLots, runSearch, selectUpToThree } from "../src/search.ts";

const M = 1_000_000;
let failures = 0;
function check(name, actual, expected) {
  const ok = actual === expected;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}: actual=${actual} expected=${expected}`);
  if (!ok) failures++;
}

const site = cedarMarket();
const locks = {
  green: { ...site.green },
  priceCeiling: 850 * M,
  ownerExpectation: 10_000 * M,
  targetFraction: 0.15,
};
const ranges = { families: ["spine", "loop"], frontages: [9, 10, 11, 12] };

// Full grid: 2 x 4 = 8 tested. The two 9 m-frontage combos are geometrically
// invalid: a 10x6 m house cannot meet 2 m side setbacks on a 9 m lot.
// Verified directly (not via the search): only those two fail, on footprints.
check("spine9-footprint", validateLayout(site, generateSpine(site, 9)).every((e) => e.startsWith("footprint")) && validateLayout(site, generateSpine(site, 9)).length > 0, true);
check("loop9-footprint", validateLayout(site, generateLoop(site, 9)).every((e) => e.startsWith("footprint")) && validateLayout(site, generateLoop(site, 9)).length > 0, true);
const run = runSearch({ site, profile: BASE_PROFILE, selectedPrice: 850 * M, locks, ranges, seed: 7, budget: 250 });
check("tested-8", run.tested, 8);
check("valid-6", run.valid, 6);
check("qualified-gt0", run.qualified > 0, true);
check("green-held-all", run.candidates.every((c) => c.greenHeld), true);
check("ceiling-held-all", run.candidates.every((c) => c.priceOk), true);

// Spine-10 under base profile is the known M1 case: 20 homes, applicable.
const spine10 = run.candidates.find((c) => c.family === "spine" && c.frontage === 10);
check("spine10-n", spine10.quantities.n, 20);
check("spine10-applicable", spine10.applicable, true);
check("spine10-no-lots", JSON.stringify(spine10.lots), "{}");

// Manual reshapes carry by stable identity: the bottom-trimmed lot 0 (area
// 190, applicable) rides along on spine-10, whose geometry reproduces that
// lot verbatim; other combos run clean. Quantities use the true area.
import { lotKey } from "../src/geometry.ts";
const trim = [
  { x: 0, y: 28 }, { x: 10, y: 28 }, { x: 10, y: 47 }, { x: 0, y: 47 },
];
const stable = { [lotKey({ x: 0, y: 27, w: 10, h: 20 })]: trim };
const carried = runSearch({ site, profile: BASE_PROFILE, selectedPrice: 850 * M, locks, ranges, seed: 7, budget: 250, lotEdits: stable });
const cSpine10 = carried.candidates.find((c) => c.family === "spine" && c.frontage === 10);
check("carry-present", cSpine10 !== undefined, true);
check("carry-lots", JSON.stringify(cSpine10.lots["0"].map((p) => [p.x, p.y])), JSON.stringify([[0, 28], [10, 28], [10, 47], [0, 47]]));
check("carry-area", cSpine10.quantities.parcelArea < spine10.quantities.parcelArea, true);
check("carry-applicable", cSpine10.applicable, true);
// An edit whose base lot no tested layout reproduces changes nothing.
const ghost = runSearch({ site, profile: BASE_PROFILE, selectedPrice: 850 * M, locks, ranges, seed: 7, budget: 250, lotEdits: { "1,1,5,5": trim } });
check("ghost-clean", ghost.candidates.every((c) => JSON.stringify(c.lots) === "{}"), true);
check("ghost-same-n", ghost.qualified, run.qualified);
// Breakdown counts: hand-checked Cedar grid — 6 geometrically valid of 8;
// applicability/price/target counted per combo, owner expectation never one.
check("break-geo", run.breakdown.geometryValid, 6);
check("break-geo-eq-valid", run.breakdown.geometryValid, run.valid);
check("break-bounded", run.breakdown.applicable <= run.tested && run.breakdown.priceOk <= run.tested && run.breakdown.targetOk <= run.tested, true);

// Ceiling below selected price: honest no-result with blockers, no candidates hidden.
const tight = runSearch({
  site, profile: BASE_PROFILE, selectedPrice: 850 * M,
  locks: { ...locks, priceCeiling: 800 * M }, ranges, seed: 7, budget: 250,
});
check("tight-qualified-0", tight.qualified, 0);
check("tight-blockers", tight.blockers.length > 0, true);
check("tight-candidates-0", tight.candidates.length, 0);

// Compact profile (140-220 m2) disqualifies loop's 280 m2 side lots and spine-12's
// 240 m2 lots. Disqualified combos never reach candidates; only counts tell.
// Hand-verified: spine-f10 (200) and spine-f11 (220) pass; rest fail applicability.
const compact = runSearch({ site, profile: COMPACT_PROFILE, selectedPrice: 680 * M, locks: { ...locks, priceCeiling: 700 * M }, ranges, seed: 7, budget: 250 });
check("compact-qualified-2", compact.qualified, 2);
check("compact-ids", compact.candidates.map((c) => c.id).join(","), "spine-f10,spine-f11");
check("compact-narrows-base", compact.qualified < run.qualified, true);

// Selection: at most three, distinct, ordered, with reasons; fewer when grid is tiny.
const sel = selectUpToThree(run.candidates, "lowest-road");
check("sel-max3", sel.length <= 3, true);
check("sel-distinct", new Set(sel.map((c) => c.id)).size, sel.length);
check("sel-reasons", sel.every((c) => typeof c.reason === "string" && c.reason.length > 0), true);
const roads = sel.map((c) => c.quantities.roadArea);
check("sel-ordered", roads.every((v, i) => i === 0 || roads[i - 1] <= v), true);
const tiny = runSearch({
  site, profile: BASE_PROFILE, selectedPrice: 850 * M, locks,
  ranges: { families: ["spine"], frontages: [10] }, seed: 7, budget: 250,
});
check("tiny-one", selectUpToThree(tiny.candidates, "lowest-road").length, 1);

// Budget caps enumeration and says so.
const capped = runSearch({ site, profile: BASE_PROFILE, selectedPrice: 850 * M, locks, ranges, seed: 7, budget: 3 });
check("capped-tested", capped.tested, 3);
check("capped-truncated", capped.truncated, true);

// Shared applicability helper: base admits spine-10 lots, compact does not admit 280 m2 loop sides.
check("failing-base-none", failingLots(generateSpine(cedarMarket(), 10).parcels, BASE_PROFILE).length, 0);
check("failing-compact-loop", failingLots(generateLoop(cedarMarket(), 11).parcels, COMPACT_PROFILE).length > 0, true);

// Geometric duplicates collapse: same frontage twice tests twice but selects once.
const dup = runSearch({
  site, profile: BASE_PROFILE, selectedPrice: 850 * M, locks,
  ranges: { families: ["spine"], frontages: [10, 10] }, seed: 7, budget: 250,
});
check("dup-tested", dup.tested, 2);
check("dup-selected-1", selectUpToThree(dup.candidates, "lowest-road").length, 1);

if (failures > 0) { console.error(`${failures} FAILURES`); process.exit(1); }
console.log("ALL SEARCH FIXTURES PASS");
