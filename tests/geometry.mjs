// Tester-owned M1 geometry fixtures. Hand-computed expectations, independent of src/.
import {
  cedarMarket,
  generateSpine,
  generateLoop,
  deriveQuantities,
  validateLayout,
  checkGreenLock,
  unionArea,
} from "../src/geometry.ts";
import { evaluateLayout } from "../src/economics.ts";

const M = 1_000_000;
let failures = 0;
function check(name, actual, expected, tol = 0.011) {
  const ok = Math.abs(actual - expected) <= tol;
  console.log(`${ok ? "PASS" : "FAIL"} ${name}: actual=${actual} expected=${expected}`);
  if (!ok) failures++;
}

const site = cedarMarket();
const spine = generateSpine(site);
const loop = generateLoop(site);

// Union math: two 10x10 squares offset by (5,5) share 25 -> 175.
check("union-overlap", unionArea([{ x: 0, y: 0, w: 10, h: 10 }, { x: 5, y: 5, w: 10, h: 10 }]), 175, 1e-9);

// Spine hand values: road 120x6=720; green 24x20=480; 24 lots minus 4 green-cut = 20.
const sq = deriveQuantities(site, spine);
check("spine-road", sq.roadArea, 720, 1e-9);
check("spine-green", sq.greenArea, 480, 1e-9);
check("spine-n", sq.n, 20);
check("spine-parcels", sq.parcelArea, 20 * 200, 1e-9);

// Loop hand values: arms 600+600+480+480, connector 96, minus 4x36 corners and 36 connector overlap = 2076.
const lq = deriveQuantities(site, loop);
check("loop-road", lq.roadArea, 2076, 1e-6);
check("loop-n", lq.n, 16);

// Distinct patterns, both valid.
check("distinct-road", Math.abs(sq.roadArea - lq.roadArea) > 100 ? 1 : 0, 1);
check("spine-valid", validateLayout(site, spine).length, 0);
check("loop-valid", validateLayout(site, loop).length, 0);

// Green lock: same rect passes; moved copy fails.
check("lock-kept", checkGreenLock(site.green, spine.green).length, 0);
check(
  "lock-moved",
  checkGreenLock(site.green, { ...site.green, x: site.green.x + 5 }).length > 0 ? 1 : 0,
  1,
);

// Negative: overlapping parcel supplement must fail validation.
const bad = { ...spine, parcels: [...spine.parcels, { ...spine.parcels[0] }] };
check("overlap-caught", validateLayout(site, bad).length > 0 ? 1 : 0, 1);

// Economics reconcile to measured geometry: road cost = area x rate; saving = delta x rate.
const P = 850 * M;
const se = evaluateLayout(site, spine, P);
const le = evaluateLayout(site, loop, P);
check("spine-roadcost", se.roadCost, 720 * 800_000, 1);
check("loop-roadcost", le.roadCost, 2076 * 800_000, 1);
check("road-saving", le.roadCost - se.roadCost, (2076 - 720) * 800_000, 1);
check("spine-homes-cost", se.homeCost, 20 * 60 * 5 * M, 1);

if (failures > 0) { console.error(`${failures} FAILURES`); process.exit(1); }
console.log("ALL GEOMETRY FIXTURES PASS");
