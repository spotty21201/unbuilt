// Coder developer test for the draft machine (direct-manipulation increment).
// Hand-derived: empty is incomplete, invalid cannot commit, undo restores all.
import { applyDraftEdit, commitDraft, parseMeter, pushUndo, redo, undo } from "../src/draft.ts";

let failures = 0;
function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${ok ? "PASS" : "FAIL"} ${name}: actual=${JSON.stringify(actual)}`);
  if (!ok) { console.log(`  expected=${JSON.stringify(expected)}`); failures++; }
}

check("empty-null", parseMeter(""), null);
check("spaces-null", parseMeter("   "), null);
check("word-null", parseMeter("abc"), null);
check("zero-is-zero", parseMeter("0"), 0);
check("decimal", parseMeter("78.5"), 78.5);

const SITE = { w: 120, h: 100 };
const g0 = { x: 78, y: 62, w: 24, h: 20 };

// Valid draft commits and reports itself applicable.
let d = applyDraftEdit(g0, { x: "80", y: "62", w: "24", h: "20" }, SITE);
check("draft-valid", d.draftable, true);
check("draft-rect", d.draft, { x: 80, y: 62, w: 24, h: 20 });
check("commit-ok", commitDraft(d).committed, { x: 80, y: 62, w: 24, h: 20 });

// Outside site: draft held for display, commit blocked, last-good preserved.
d = applyDraftEdit(g0, { x: "200", y: "62", w: "24", h: "20" }, SITE);
check("outside-draftable", d.draftable, false);
check("outside-error", d.errors.length > 0, true);
check("outside-blocked", commitDraft(d).committed, null);

// Empty field: incomplete, not zero; committed value untouched.
d = applyDraftEdit(g0, { x: "", y: "62", w: "24", h: "20" }, SITE);
check("empty-draftable", d.draftable, false);
check("empty-keeps-x", d.draft.x, 78);

// Undo stack: push snapshots, pop restores all, new push clears redo.
const s0 = { n: "s0" };
const s1 = { n: "s1" };
let h = pushUndo({ past: [], future: [] }, s0);
h = pushUndo(h, s1);
check("past-len", h.past.length, 2);
const u = undo(h, { n: "current" });
check("undo-snap", u.snap.n, "s1");
check("undo-redo", u.hist.future.map((s) => s.n), ["current"]);
const r = redo(u.hist, u.snap);
check("redo-snap", r.snap.n, "current");
const h2 = pushUndo(u.hist, { n: "s2" });
check("push-clears-redo", h2.future.length, 0);

// History is capped: 60 pushes keep the newest 50.
let hc = { past: [], future: [] };
for (let i = 0; i < 60; i++) hc = pushUndo(hc, { n: i });
check("history-cap", hc.past.length, 50);
check("history-cap-newest", hc.past[49].n, 59);

if (failures > 0) { console.error(`${failures} FAILURES`); process.exit(1); }
console.log("ALL DRAFT FIXTURES PASS");
