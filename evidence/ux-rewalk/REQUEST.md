# Independent browser re-walk request — workbench increment

Build under test: production `web/dist`, served at http://100.117.187.86:5173/
(verified HTTP 200). Engine gate green (7 suites). No commits since the last
walk; all work below is uncommitted local work.

## What changed since the last walk (ORCHESTRATOR-HANDOFF.md)

- Viewport workbench: top bar, 280 px rail, bottom dock with tabs.
- Grove drag/resize with 1 m snap, draft Apply/Cancel, full Undo/Redo.
- Preview geometry rebuilds from the run snapshot; preview-bar Apply guarded.
- Working-plan profile applicability shown as a warning.
- Zero/some/all/none commercial verdicts; no causal overclaim.
- Escape/pointer-cancel gesture safety; blur-committed assumption history.

## The 11 tests (prompt section 7)

Run each at 1440×900, 1024×768, and 375 px unless noted. Save one screenshot
per test plus console output and a results note in this directory.

1. Initial render; canvas/list selection agree (all four objects).
2. Locked grove resists pointer + numeric edits; unlock, drag, and type an
   equivalent integer move — geometry and metrics must match exactly.
3. Repeat the move after zoom + pan; resize the browser — quantities unchanged.
4. Resize inside/outside bounds; Escape mid-drag; pointer-cancel; invalid
   edits never commit and never adjust other fields.
5. One long drag = one Undo; Undo/Redo restore geometry, assumptions, locks,
   metrics; blur an assumption field and undo it.
6. Clear owner expectation and a grove coordinate — missing draft, never a
   zero-value conclusion or silent relocation.
7. Switch Spine/Loop and frontage — plan and results update together; try a
   combination outside the active profile and confirm the warning.
8. Preview/Apply/Cancel with the previous-layout toggle; owner 10→20 must
   invalidate old cards; rerun must give matching preview/apply economics.
9. Owner 3bn run — mixed summary must read "X of Y meet"; ceiling 800 rerun
   — zero case must read as no-result, never success.
10. Rapid successive edits — no older numbers shown as current; note
    perceived responsiveness (no formal timing hooks exist yet).
11. Keyboard-only selection/editing pass; confirm no desktop scroll between
    plan and essential controls and no mobile horizontal overflow.

## Out of scope for this walk

Genuine model integration (badge reads deterministic mode), human
unrehearsed validation, full accessibility audit, upload/compare/persistence.
