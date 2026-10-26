// Tester-style developer test for intent parsing (Coder-owned impl test).
// Expectations hand-derived from PRD section 10 + UX spec stage 5.
import { parseIntent } from "../src/intent.ts";

let failures = 0;
function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${ok ? "PASS" : "FAIL"} ${name}: actual=${JSON.stringify(actual)}`);
  if (!ok) { console.log(`  expected=${JSON.stringify(expected)}`); failures++; }
}

const sel = { id: "grove-a", kind: "green", name: "Grove A" };

// Signature request with selection -> green lock + ceiling lock + search.
let r = parseIntent("Keep this green space. Do not increase the home selling price. What else can change?", { selected: sel, selectedPrice: 850000000 });
check("sig-kind", r.kind, "proposal");
check("sig-green", r.operations.lockGreen, true);
check("sig-ceiling", r.operations.priceCeiling, 850000000);
check("sig-run", r.operations.runSearch, true);

// Same request with no selection -> clarification, no arbitrary object.
r = parseIntent("Keep this green space. What else can change?", { selected: null, selectedPrice: 850000000 });
check("nosel-kind", r.kind, "clarification");
check("nosel-no-object", r.operations.lockGreen, false);

// Renamed object: "Keep this open space" triggers the same preservation proposal.
r = parseIntent("Keep this open space. Do not increase the home selling price. What else can change?", { selected: sel, selectedPrice: 850000000 });
check("open-kind", r.kind, "proposal");
check("open-green", r.operations.lockGreen, true);
check("open-ceiling", r.operations.priceCeiling, 850000000);
check("open-run", r.operations.runSearch, true);

// Explicit ceiling number.
r = parseIntent("Cap the selling price at Rp 800m.", { selected: null, selectedPrice: 850000000 });
check("cap-kind", r.kind, "proposal");
check("cap-value", r.operations.priceCeiling, 800000000);

// Profile switch to compact.
r = parseIntent("Try the starter homes profile.", { selected: null, selectedPrice: 680000000 });
check("profile-kind", r.kind, "proposal");
check("profile-id", r.operations.profileId, "starter-150");

// Unsupported: retained building -> limitation, never silent demolition.
r = parseIntent("Keep the old mall building.", { selected: null, selectedPrice: 850000000 });
check("bld-kind", r.kind, "limitation");

// Gibberish / out of scope -> clarification.
r = parseIntent("Make it pop.", { selected: null, selectedPrice: 850000000 });
check("vague-kind", r.kind, "clarification");

// Model-explanation requests are not tools.
r = parseIntent("Explain the allowance math.", { selected: null, selectedPrice: 850000000 });
check("explain-kind", r.kind, "clarification");

if (failures > 0) { console.error(`${failures} FAILURES`); process.exit(1); }
console.log("ALL INTENT FIXTURES PASS");
