// Rotated lot generation fixtures (Coder-owned). Hand-derived:
// - 100 m level segment, 6 m street, 10 m frontage, 20 m depth: 10 lots
//   per side from the kerb line (3 m), each exactly 200 m2.
// - 30-degree segment keeps true areas and reports its angle.
// - Boundary, pavement and open-space conflicts skip with reasons.
import { fitsRotatedHome, generateRotatedLots, rotatedParcelArea } from "../src/rotated.ts";

let failures = 0;
function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${ok ? "PASS" : "FAIL"} ${name}: actual=${JSON.stringify(actual)}`);
  if (!ok) { console.log(`  expected=${JSON.stringify(expected)}`); failures++; }
}
const near = (name, actual, expected, tol = 0.001) =>
  check(name, typeof actual === "number" && Math.abs(actual - expected) <= tol, true);

const BIG = [{ x: -10, y: -40 }, { x: 110, y: -40 }, { x: 110, y: 40 }, { x: -10, y: 40 }];
const base = {
  a: { x: 0, y: 0 }, b: { x: 100, y: 0 }, streetWidth: 6, frontage: 10, depth: 20,
  boundary: BIG, pavement: [], spaces: [], clearance: 0,
};

// Level segment, both sides: 10 + 10 lots, kerb offset exactly 3 m.
const both = generateRotatedLots({ ...base, side: "both" });
check("rot-count", both.lots.length, 20);
check("rot-skips", both.skipped.length, 0);
near("rot-area", both.lots[0].area, 200, 0.0001);
near("rot-total-area", rotatedParcelArea(both.lots), 4000, 0.001);
near("rot-segment", both.segmentLength, 100);
near("rot-angle", both.lots[0].angleDeg, 0);
near("rot-kerb-offset", Math.min(...both.lots[0].pts.map((p) => p.y)), 3, 0.0001);
// Left only, clearance 2 m pushes the kerb line to 5 m.
const left = generateRotatedLots({ ...base, side: "left", clearance: 2 });
check("rot-left-count", left.lots.length, 10);
near("rot-left-offset", Math.min(...left.lots[0].pts.map((p) => p.y)), 5, 0.0001);

// 30-degree segment: length 100, frontage 25 -> 4 lots, true areas.
const diag = generateRotatedLots({
  ...base, b: { x: 100 * Math.cos(Math.PI / 6), y: 100 * Math.sin(Math.PI / 6) }, side: "left", frontage: 25, depth: 20,
  boundary: [{ x: -60, y: -10 }, { x: 140, y: -10 }, { x: 140, y: 110 }, { x: -60, y: 110 }],
});
check("rot-diag-count", diag.lots.length, 4);
near("rot-diag-angle", diag.lots[0].angleDeg, 30, 0.0001);
near("rot-diag-area", diag.lots[0].area, 500, 0.001);

// Boundary clipping at x=60: lots 0-5 fit, 6-9 skip with the reason.
const clip = generateRotatedLots({
  ...base, side: "left", depth: 10,
  boundary: [{ x: -5, y: -5 }, { x: 60, y: -5 }, { x: 60, y: 30 }, { x: -5, y: 30 }],
});
check("rot-clip-count", clip.lots.length, 6);
check("rot-clip-skips", clip.skipped.length, 4);
check("rot-clip-reason", clip.skipped.every((s) => s.reason === "outside site boundary"), true);

// Pavement blanket over the left band: nothing generates, reason recorded.
const pave = generateRotatedLots({
  ...base, side: "left", depth: 10,
  pavement: [[{ x: -5, y: 2 }, { x: 105, y: 2 }, { x: 105, y: 14 }, { x: -5, y: 14 }]],
});
check("rot-pave-count", pave.lots.length, 0);
check("rot-pave-reason", pave.skipped[0]?.reason, "overlaps street pavement");

// Open space spanning 2.1 lot widths: three lots conflict, seven generate.
const park = generateRotatedLots({
  ...base, side: "left", depth: 10,
  spaces: [[{ x: -1, y: 2 }, { x: 21, y: 2 }, { x: 21, y: 14 }, { x: -1, y: 14 }]],
});
check("rot-park-count", park.lots.length, 7);
check("rot-park-skips", park.skipped.filter((s) => s.reason === "overlaps open space").length, 3);

// Cap: at most maxLots generated; the rest skip with the cap reason.
const capped = generateRotatedLots({ ...base, side: "both", maxLots: 3 });
check("rot-cap-count", capped.lots.length, 3);
check("rot-cap-reason", capped.skipped.some((s) => s.reason === "generation cap reached"), true);

// Degenerate inputs generate nothing rather than throwing.
check("rot-degenerate", generateRotatedLots({ ...base, b: { x: 0, y: 0 }, side: "left" }).lots.length, 0);
check("rot-bad-frontage", generateRotatedLots({ ...base, frontage: 0, side: "left" }).lots.length, 0);

// Home fit along lot axes in either orientation (10 x 20 lot).
const lot = both.lots[0];
check("fit-straight", fitsRotatedHome(lot, 8, 12), true);
check("fit-rotated", fitsRotatedHome(lot, 12, 8), true);
check("fit-too-big", fitsRotatedHome(lot, 25, 8), false);

if (failures > 0) { console.error(`${failures} FAILURES`); process.exit(1); }
console.log("ALL FIXTURES PASS");
