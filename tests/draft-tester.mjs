// Tester-owned counterfactual checks for the draft machine (T10c).
// Boundary tolerance, non-positive/negative drafts, and empty-history
// undo/redo edges. Expectations derived by hand from the stated rules.
import { applyDraftEdit, commitDraft, pushUndo, redo, undo } from "../src/draft.ts";

let failures = 0;
function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${ok ? "PASS" : "FAIL"} ${name}: actual=${JSON.stringify(actual)}`);
  if (!ok) { console.log(`  expected=${JSON.stringify(expected)}`); failures++; }
}

const SITE = { w: 120, h: 100 };
const g0 = { x: 78, y: 62, w: 24, h: 20 };

// Boundary: rect edge exactly on the site edge commits; 1 cm past it blocks.
let d = applyDraftEdit(g0, { x: "96", y: "62", w: "24", h: "20" }, SITE);
check("edge-exact-commits", commitDraft(d).committed, { x: 96, y: 62, w: 24, h: 20 });
d = applyDraftEdit(g0, { x: "96.01", y: "62", w: "24", h: "20" }, SITE);
check("edge-past-blocked", commitDraft(d).committed, null);
check("edge-past-keeps-committed", d.committed, g0);

// Counterfactual: zero width and negative origin can never become the plan.
d = applyDraftEdit(g0, { x: "80", y: "62", w: "0", h: "20" }, SITE);
check("zero-width-blocked", commitDraft(d).committed, null);
d = applyDraftEdit(g0, { x: "-1", y: "62", w: "24", h: "20" }, SITE);
check("negative-x-blocked", commitDraft(d).committed, null);
check("negative-x-keeps-committed", d.committed, g0);

// Empty history: undo/redo return null and leave the stacks untouched.
const h0 = { past: [], future: [] };
const u = undo(h0, "cur");
check("undo-empty-null", u.snap, null);
check("undo-empty-hist", u.hist, { past: [], future: [] });
const r = redo(h0, "cur");
check("redo-empty-null", r.snap, null);
check("redo-empty-hist", r.hist, { past: [], future: [] });

// Three-deep stack pops in LIFO order; a new push then clears redo.
let h = pushUndo(pushUndo(pushUndo(h0, "a"), "b"), "c");
const u1 = undo(h, "cur");
const u2 = undo(u1.hist, u1.snap);
check("lifo-order", [u1.snap, u2.snap], ["c", "b"]);
const h2 = pushUndo(u2.hist, "d");
check("push-clears-deep-redo", h2.future, []);
check("redo-after-push-null", redo(h2, "d").snap, null);

if (failures > 0) { console.error(`${failures} FAILURES`); process.exit(1); }
console.log("ALL DRAFT-TESTER COUNTERFACTUALS PASS");
