// Tester-owned independent fixtures. Expected values derived by hand from PRD v0.2.
// Fixture: N=40, P=850m/780m, C=18.52bn, s=3%, t=15%, L=10bn.
import { evaluateFinance } from "../src/finance.ts";

const BN = 1_000_000_000;
const M = 1_000_000;
let failures = 0;
function check(name, actual, expected, tol = 1) {
  const ok = actual === expected || (typeof actual === "number" && Math.abs(actual - expected) <= tol);
  console.log(`${ok ? "PASS" : "FAIL"} ${name}: actual=${actual} expected=${expected}`);
  if (!ok) failures++;
}

const C = 18_520 * M; // 18.52bn per PRD build-up
const base = { n: 40, costNonLand: C, sellFraction: 0.03, ownerExpectation: 10 * BN, targetFraction: 0.15 };

// P = 850m column
let r = evaluateFinance({ ...base, pricePerHome: 850 * M });
check("rev@850", r.revenue, 34 * BN);
check("surplus@850", r.surplus, 4_460 * M);
check("margin@850", r.margin, 0.13118, 1e-5);
check("allow@850", r.landAllowance, 9_360 * M);
check("gap@850", r.ownerGap, 640 * M);

// P = 780m column
r = evaluateFinance({ ...base, pricePerHome: 780 * M });
check("rev@780", r.revenue, 31.2 * BN);
check("surplus@780", r.surplus, 1_744 * M);
check("margin@780", r.margin, 0.0559, 1e-4);
check("allow@780", r.landAllowance, 7_064 * M);
check("gap@780", r.ownerGap, 2_936 * M);
check("reqPrice", r.requiredPrice, 869_512_195.122, 1);

// Invariants: L change leaves allowance unchanged; t change leaves revenue/cost path unchanged
const a = evaluateFinance({ ...base, pricePerHome: 850 * M });
const b = evaluateFinance({ ...base, pricePerHome: 850 * M, ownerExpectation: 12 * BN });
check("L-change allowance stable", b.landAllowance, a.landAllowance, 0);
check("L-change gap moves", b.ownerGap - a.ownerGap, 2 * BN, 0);
const c = evaluateFinance({ ...base, pricePerHome: 850 * M, targetFraction: 0.2 });
check("t-change revenue stable", c.revenue, a.revenue, 0);
check("t-change surplus stable", c.surplus, a.surplus, 0);

// Edges: negative allowance preserved; zero homes -> null ratios; invalid denominator -> null price
const neg = evaluateFinance({ n: 10, pricePerHome: 100 * M, costNonLand: 5 * BN, sellFraction: 0.03, ownerExpectation: 10 * BN, targetFraction: 0.15 });
check("negative allowance kept", neg.landAllowance < 0, true);
const zero = evaluateFinance({ n: 0, pricePerHome: 850 * M, costNonLand: C, sellFraction: 0.03, ownerExpectation: 10 * BN, targetFraction: 0.15 });
check("zero-home margin null", zero.margin, null);
check("zero-home price null", zero.requiredPrice, null);
const badDen = evaluateFinance({ ...base, pricePerHome: 850 * M, sellFraction: 0.9, targetFraction: 0.2 });
check("invalid denom price null", badDen.requiredPrice, null);

if (failures > 0) { console.error(`${failures} FAILURES`); process.exit(1); }
console.log("ALL FIXTURES PASS");
