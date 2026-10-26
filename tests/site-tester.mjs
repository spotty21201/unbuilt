// Tester-owned counterfactual checks for custom sites (T10e).
// Validator boundaries, factory invariants across a size sweep, and the
// pinned scope rule: below-minimum sizes are rejected even where the
// (now site-scaled) generators would still validate.
import { generateLoop, generateSpine, validateLayout } from "../src/geometry.ts";
import { makeSite, siteSizeErrors } from "../src/site.ts";

let failures = 0;
function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${ok ? "PASS" : "FAIL"} ${name}: actual=${JSON.stringify(actual)}`);
  if (!ok) { console.log(`  expected=${JSON.stringify(expected)}`); failures++; }
}

// Boundaries: just under rejects, minimum and maximum accept, just over rejects.
check("under-w-rejected", siteSizeErrors(119.9, 100).length > 0, true);
check("under-h-rejected", siteSizeErrors(120, 99.9).length > 0, true);
check("min-accepted", siteSizeErrors(120, 100).length, 0);
check("max-accepted", siteSizeErrors(500, 500).length, 0);
check("over-w-rejected", siteSizeErrors(500.1, 500).length > 0, true);
check("over-h-rejected", siteSizeErrors(500, 500.1).length > 0, true);
check("nan-rejected", siteSizeErrors(NaN, 100).length > 0, true);
check("negative-rejected", siteSizeErrors(-120, 100).length > 0, true);
check("infinity-rejected", siteSizeErrors(Infinity, 100).length > 0, true);

// Factory invariants hold at every swept accepted size: green positive and
// inside, entrance a west-edge gate of width 8 centered within 0.5 m.
// (Shape updated by Coder for the deliberate entrance-model change; Tester to audit.)
let invariantBad = 0;
for (let w = 120; w <= 500; w += 13) {
  for (let h = 100; h <= 500; h += 17) {
    const s = makeSite(w, h);
    const g = s.green;
    const e = s.entrance;
    const ok =
      g.w > 0 && g.h > 0 && g.x >= 0 && g.y >= 0 && g.x + g.w <= w && g.y + g.h <= h &&
      e.edge === "west" && e.width === 8 && Math.abs(e.offset - h / 2) <= 0.5;
    if (!ok) { invariantBad++; console.log(`  invariant break at ${w}x${h}: ${JSON.stringify(s)}`); }
  }
}
check("factory-invariants", invariantBad, 0);

// Counterfactual: 100x100 validates geometrically for every supported
// frontage in both families, yet the size validator still rejects it.
// The 120x100 minimum is therefore a scope rule, not a validation cliff.
const small = makeSite(100, 100);
let geoErrs = 0;
for (const f of [10, 11, 12]) {
  geoErrs += validateLayout(small, generateSpine(small, f)).length;
  geoErrs += validateLayout(small, generateLoop(small, f)).length;
}
check("small-validates-geometrically", geoErrs, 0);
check("small-rejected-by-scope", siteSizeErrors(100, 100).length > 0, true);

if (failures > 0) { console.error(`${failures} FAILURES`); process.exit(1); }
console.log("ALL SITE-TESTER COUNTERFACTUALS PASS");
