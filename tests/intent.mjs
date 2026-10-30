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

r = parseIntent('Search alternatives', {selected:sel,selectedPrice:850000000,search:{manualStreets:true,families:['spine'],frontages:[9,10,11,12]}});
check('manual proposal holds street geometry and widths',r.text.includes('manual street geometry and widths held fixed'),true);
check('manual proposal gives exact supported range before approval',r.text.includes('spine × 9, 10, 11, 12 m frontages')&&!r.text.includes('circulation pattern'),true);

r=parseIntent('Search alternatives',{selected:sel,selectedPrice:850000000,search:{manualStreets:false,manualLots:true,families:['spine','loop'],frontages:[9,10,11,12]}});
check('manual-lot-proposal-states-search-limitation',r.kind,'limitation');
check('manual-lot-request-does-not-run-or-change-plan',r.operations.runSearch,false);

// Explicit ceiling number.
r = parseIntent("Cap the selling price at Rp 800m.", { selected: null, selectedPrice: 850000000 });
check("cap-kind", r.kind, "proposal");
check("cap-value", r.operations.priceCeiling, 800000000);

// Unit grammar (hand-derived): thousands groupings, decimals, magnitudes.
r = parseIntent("Cap price at Rp1,000m.", { selected: null, selectedPrice: 850000000 });
check("thousands-comma", r.operations.priceCeiling, 1000000000);
r = parseIntent("Cap price at Rp1.000m.", { selected: null, selectedPrice: 850000000 });
check("thousands-dot", r.operations.priceCeiling, 1000000000);
r = parseIntent("Cap price at Rp850,5m.", { selected: null, selectedPrice: 850000000 });
check("decimal-comma", r.operations.priceCeiling, 850500000);
r = parseIntent("Cap price at Rp1.5bn.", { selected: null, selectedPrice: 850000000 });
check("billion", r.operations.priceCeiling, 1500000000);
r = parseIntent("Cap price at Rp2miliar.", { selected: null, selectedPrice: 850000000 });
check("miliar", r.operations.priceCeiling, 2000000000);
r = parseIntent("Cap price at Rp850jt.", { selected: null, selectedPrice: 850000000 });
check("juta", r.operations.priceCeiling, 850000000);
// Ambiguous punctuation or missing magnitude is refused, never guessed.
r = parseIntent("Cap price at Rp1,00,0m.", { selected: null, selectedPrice: 850000000 });
check("weird-groups", r.kind, "clarification");
check("weird-no-ceiling", r.operations.priceCeiling, null);
r = parseIntent("Cap the price at 800.", { selected: null, selectedPrice: 850000000 });
check("bare-number", r.kind, "clarification");
check("bare-no-ceiling", r.operations.priceCeiling, null);

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
