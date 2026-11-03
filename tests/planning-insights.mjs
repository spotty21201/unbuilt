// Land budget, planning brief and open-space access fixtures (Coder-owned).
// Hand-derived: Cedar sample 120x100 (12000 m2), 20 homes, parcels 4000,
// roads 720, green 480, remainder 6800. Access: one 10x10 space at origin;
// lot A abuts at 2 m, lot C sits 100 m east, lot B 160 m east.
import { landBudget } from "../src/landbudget.ts";
import { evaluateBrief } from "../src/brief.ts";
import { lotAccess } from "../src/catchment.ts";

let failures = 0;
function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${ok ? "PASS" : "FAIL"} ${name}: actual=${JSON.stringify(actual)}`);
  if (!ok) { console.log(`  expected=${JSON.stringify(expected)}`); failures++; }
}
const near = (name, actual, expected, tol = 0.01) =>
  check(name, typeof actual === "number" && Math.abs(actual - expected) <= tol, true);

// --- land budget on Cedar quantities
const b = landBudget(12000, { n: 20, roadArea: 720, greenArea: 480, parcelArea: 4000, unallocatedArea: 6800 });
near("budget-gross-ha", b.grossHa, 1.2);
near("budget-density-gross", b.densityGross, 16.6667, 0.001);
near("budget-net-area", b.netArea, 5200);
near("budget-density-net", b.densityNet ?? -1, 38.4615, 0.001);
near("budget-pct-parcels", b.pctParcels, 33.3333, 0.001);
near("budget-pct-green", b.pctGreen, 4);
near("budget-pct-road", b.pctRoad, 6);
near("budget-pct-unalloc", b.pctUnallocated, 56.6667, 0.001);
near("budget-road-per-home", b.roadPerHome ?? -1, 36);
// Degenerate: empty site keeps zeros, net density null, road per home null.
const empty = landBudget(0, { n: 0, roadArea: 0, greenArea: 0, parcelArea: 0, unallocatedArea: 0 });
check("budget-empty", [empty.densityNet, empty.roadPerHome, empty.densityGross], [null, null, 0]);

// --- brief against the Cedar budget
const res = evaluateBrief(b, { densityMinHa: 20, greenMinPct: 3, unallocatedMaxPct: 50 });
check("brief-check-count", res.checks.length, 3);
check("brief-failed", res.failed.map((c) => c.id), ["density-min", "unallocated-max"]);
check("brief-unset", res.unset, 1);
check("brief-green-passes", res.checks.find((c) => c.id === "green-min")?.pass, true);
near("brief-margin-density", res.checks[0].margin, -3.3333, 0.001);
const noRules = evaluateBrief(b, {});
check("brief-none", [noRules.checks.length, noRules.unset], [0, 4]);
// Non-positive rules are ignored, not evaluated as zero thresholds.
const badRules = evaluateBrief(b, { greenMinPct: 0, densityMinHa: Number.NaN });
check("brief-ignores-bad", [badRules.checks.length, badRules.unset], [0, 4]);

// --- open-space access: space square 0..10, lots at 12 / 110 / 170
const space = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }];
const lots = [
  { x: 12, y: 0, w: 10, h: 10 },
  { x: 110, y: 0, w: 10, h: 10 },
  { x: 170, y: 0, w: 10, h: 10 },
];
const acc = lotAccess(lots, [space]);
check("access-present", acc !== null, true);
near("access-dist-a", acc.perLot[0].edgeDistance, 2, 0.0001);
check("access-adjacent-a", acc.perLot[0].adjacent, true);
near("access-dist-c", acc.perLot[1].edgeDistance, 100, 0.0001);
check("access-adjacent-count", acc.adjacentCount, 1);
check("access-bucket-150", acc.buckets[0].count, 2);
near("access-share-150", acc.buckets[0].share, 66.6667, 0.001);
check("access-bucket-300", acc.buckets[1].count, 3);
check("access-bucket-400", acc.buckets[2].count, 3);
// Overlapping lot: zero distance, adjacent. Empty inputs refuse silently.
const inside = lotAccess([{ x: 2, y: 2, w: 4, h: 4 }], [space]);
near("access-inside", inside.perLot[0].edgeDistance, 0, 0.0001);
check("access-null-spaces", lotAccess(lots, []), null);
check("access-null-lots", lotAccess([], [space]), null);
// Diagonal distance uses the true corner, not centre distance.
const diag = lotAccess([{ x: 20, y: 20, w: 5, h: 5 }], [space]);
near("access-diagonal", diag.perLot[0].edgeDistance, Math.hypot(10, 10), 0.0001);

if (failures > 0) { console.error(`${failures} FAILURES`); process.exit(1); }
console.log("ALL FIXTURES PASS");
