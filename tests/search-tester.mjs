// Tester-owned counterfactual checks for bounded search (T10b).
// Independent of tests/search.mjs: moved green lock, ceiling far below
// selected price, and run determinism. Expectations derived by hand.
import { cedarMarket } from "../src/geometry.ts";
import { BASE_PROFILE, runSearch } from "../src/search.ts";

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
const req = { site, profile: BASE_PROFILE, selectedPrice: 850 * M, locks, ranges, seed: 7, budget: 250 };

// Counterfactual 1: green lock moved 5 m east. Geometry still 6/8 valid and
// price/profile still fine, but every combo breaks the lock -> 0 qualified.
const moved = runSearch({ ...req, locks: { ...locks, green: { ...site.green, x: site.green.x + 5 } } });
check("moved-qualified-0", moved.qualified, 0);
check("moved-candidates-0", moved.candidates.length, 0);
check("moved-tested-8", moved.tested, 8);
check("moved-green-blocker", moved.blockers.some((b) => b.includes("Green lock broken: 8")), true);

// Counterfactual 2: ceiling (Rp100m) far below selected price (Rp850m).
// All 8 combos price-vetoed -> honest no-result, nothing hidden.
const deep = runSearch({ ...req, locks: { ...locks, priceCeiling: 100 * M } });
check("deep-qualified-0", deep.qualified, 0);
check("deep-candidates-0", deep.candidates.length, 0);
check("deep-price-blocker", deep.blockers.some((b) => b.includes("Price above Rp100m ceiling: 8")), true);

// Determinism: same request twice -> same hash, same qualified set.
const a = runSearch(req);
const b = runSearch(req);
check("deterministic-hash", b.snapshotHash, a.snapshotHash);
check("deterministic-qualified", b.qualified, a.qualified);
check("deterministic-ids", b.candidates.map((c) => c.id).join(","), a.candidates.map((c) => c.id).join(","));

if (failures > 0) { console.error(`${failures} FAILURES`); process.exit(1); }
console.log("ALL SEARCH-TESTER COUNTERFACTUALS PASS");
