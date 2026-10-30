# Browser acceptance pre-pass (static, no browser)

- Task ID: T10d
- Role: Tester (static pre-pass; NO browser available, none attempted)
- Date (UTC): 2026-10-26
- Scope: section 7 of `docs/ORCHESTRATOR-INTERACTIVE-PLANNING-PROMPT.md`,
  judged by reading `web/src/App.tsx` (845 lines) and
  `web/src/unbuilt/PlanCanvas.tsx` (339 lines) only. No browser
  installed or launched; no other files edited or relied upon for
  verdicts (prior-turn unit results cited only as background).
- No commands run: verdicts are static code analysis, not executions.

## Per-test verdicts

| # | Test (short) | Verdict | Basis in code |
|---|---|---|---|
| 1 | Initial render; canvas/list selection agree | PARTIAL | Render wiring present: site/roads/parcels+footprints/green/entrance/caption all emitted (`PlanCanvas.tsx` 238–335); initial plan is spine/10 (`App.tsx` 84, 139, 379–383). Two-way selection for grove/circulation/homes: list↔`selected` (423–436), canvas→`onSelectGreen`/`onSelectKind` (118–123, 261–266, 276–280), highlight mirrored via `greenSelected`/`selectedKind` + `aria-selected` (423–434, 593, 603). Gaps: Site is list-only (no canvas affordance); actual visibility/overlap/CSS needs a browser |
| 2 | Locked grove resists edits; pointer ≡ typed after unlock | COVERED-BY-CODE | Pointer blocked: `editing = greenSelected && !greenLocked` (`App.tsx` 594); `!editing` → select-only, no drag (`PlanCanvas.tsx` 118–123); handles hidden unless editing (204). Numeric blocked: `disabled={greenLocked}` (`App.tsx` 475). Both paths write the same `greenDraftF` → same `applyDraftEdit` → same `applyDraft` commit (476, 610–618, 330–339); metrics derive from the same draft (`App.tsx` 137–153). Caveat: pointer snaps to whole meters (`PlanCanvas.tsx` 55), so "equivalent" typed values must be integers |
| 3 | Move correct after zoom/pan; resize changes no quantities | COVERED-BY-CODE | Drag deltas map both endpoints through the drag-start-frozen viewBox + current bounding rect (`PlanCanvas.tsx` 183–188, 146–156), so pan/zoom only change the view transform, never canonical meters. `vb` persists across edits (reset only via Fit/zoom controls, 79–87, 214). Quantities/economics never read `vb`, window size, or bounding rects (`App.tsx` 136–153; scale `s` fixed from constants, `PlanCanvas.tsx` 36) |
| 4 | Resize in/out of bounds; Escape/cancel mid-gesture; invalid never commits | PARTIAL | Invalid release restores committed + reason: `onDraftCommit` guard resets fields and statuses (`App.tsx` 611–618); `applyDraft` also null-guards (330–335). DEFECTS (see D1, D2, D10): Escape mid-drag does not clear the drag ref — post-Escape moves re-dirty and release still commits (incl. a no-op undo push); no `onPointerCancel` handler; Escape requires focus inside the SVG and never deselects (spec §2 wants gesture-cancel-then-deselect); resize rounds untouched edges too |
| 5 | One drag = one Undo; undo restores all; numeric history coherent | PARTIAL | Single push per gesture: moves only set fields (610), one `pushUndo` in `applyDraft` (337); spec/profile/apply each push once (292–298, 356–368). Snapshot restores spec/green/drafts/profile/assumptions, clears preview (275–290); stale search auto-disables after undo (156–165, 370, 740–746). DEFECTS (D3–D5): `greenLocked` is NOT in `Snapshot` — locks never restored; assumption keystrokes create no undo entries of their own; `lastDelta` goes stale across undo/redo |
| 6 | Cleared owner/coords: missing draft, never zero-conclusion/relocation | COVERED-BY-CODE | Empty→`NaN`, never 0 (`App.tsx` 74); `inputsOk` false → economics null → dock "Incomplete" + "Economics inputs incomplete" alert, search blocked (115–119, 147–154, 578–582, 693–695, 230, 253–256); `priceError` isFinite-guarded (171–174). Cleared coordinate → draft error + Apply disabled + metrics stay on committed plan (121–134, 141–154, 481–490, 634–646) |
| 7 | Frontage/circulation update plan + results; failures explicit | PARTIAL | `changeSpec` regenerates layout, quantities, economics from the same spec (139–153, 356–361); geometry failures surface under canvas + Issues tab with "before results can be trusted" framing (140–141, 637–646, 816–828); no substitution. GAP (D6): working-plan profile applicability is never evaluated or shown — only candidates get applicability verdicts — so e.g. starter-150 × 12 m working lots render + price with no flag |
| 8 | Preview/Apply/Cancel consistent; overlays readable; owner change invalidates; rerun matches | PARTIAL | Preview bar adjacent with Apply/Cancel + previous/current toggle (621–633); baseline Apply suppressed (782, 802–806); camera untouched by preview; ghost outlines paint FIRST with comment "drawn first so nothing is covered", footprints after parcels (241–254, 282–283). Owner 10→20 flips `stale` (156–165) → preview nulled (370), cards replaced by rerun offer (740–746). Rerun rebuilds run+snap from current committed inputs (253–268, 181–196). DEFECTS (D7, D8): preview canvas uses draft-following `site` while preview economics stay run-frozen (dirty-draft mismatch); preview-bar Apply lacks the `draftDirty` guard every other commit path has. Ghost transparency/dashing is CSS → needs browser |
| 9 | Mixed summary @3bn; zero-case no success; miss scoped | COVERED-BY-CODE | `VerdictLine` (52–68): mixed ("X of Y shown meet…"), all-miss with largest shortfall + "observed within the tested ranges only", all-meet; zero-case `commercial=null`, accepted summary + status say "no valid option in the tested scope" (198–208), `noresult` block with tested-scope accounting + blockers (760–774). Minor wart (D9): "Every option below is geometrically valid…" still renders above an empty list |
| 10 | No stale responses; responsiveness measured | PARTIAL | Stale-response hazard absent by construction: edit path is fully synchronous derived render (136–153, `useMemo`), no async/model calls, Deterministic-mode badge (410–412). GAP (D11): no responsiveness instrumentation in the UI (`elapsedMs` never displayed) — measurement needs a browser + added hooks |
| 11 | 1440×900 / 1024×768 / 375px; keyboard; no desktop scroll | NEEDS-BROWSER | Viewport layout, scroll behavior, and overflow are CSS (`App.css` classes), unverifiable from TSX (structure + skiplink only, 394–398). Keyboard sub-notes from code: grove canvas node focusable with Enter/Space select (292–300); object list/inputs/selects/buttons natively keyboardable; canvas circulation/homes selection is mouse-only (list covers keyboard); Escape only reaches `onDraftCancel` with SVG focus and never deselects; no arrow-key canvas nudging (numeric inputs are the keyboard equivalent, same validation) |

## Logic defects found (static)

- D1 (T4, P1): Escape mid-drag does not cancel the gesture.
  `onDraftCancel`/`cancelDraft` only reset the fields (`App.tsx`
  351–354); the gesture ref (`kind`, `moved`, `origGreen`) in
  `PlanCanvas.tsx` (40–48, 190–200) is untouched, so further pointer
  movement re-dirties the draft and release calls `onDraftCommit`.
  Even with no further movement, `moved=true` commits the
  reset-to-committed draft — pushing a no-op undo entry with
  "Committed one change". Fix: clear the drag ref on cancel
  (e.g. a cancel token/flag checked in `onMove`/`onUp`), and route
  Escape to deselect when no draft is dirty (spec §2).
- D2 (T4, P2): no `onPointerCancel` handler on the canvas SVG
  (`PlanCanvas.tsx` 219–231). A browser-cancelled touch leaves the
  drag ref stuck until the next pointer-up; moves stop but state
  claims a gesture is active.
- D3 (T5, P1): `greenLocked` excluded from undo `Snapshot`
  (`App.tsx` 100–103, 275–290). Lock toggles (462) and
  proposal-applied locks (243) create no/restore no history, so
  Undo demonstrably does not "restore locks" as T5 requires.
- D4 (T5, P2): assumption keystrokes (price/ceiling/owner/target,
  553–572) never push undo entries; they are only restored as a
  side effect of geometry/profile snapshots. Undo after typing a
  new owner value jumps to the last structural snapshot instead of
  the previous keystroke state. (May be intended coarseness, but it
  contradicts "every accepted edit is recoverable" read strictly.)
- D5 (T5, P3): `lastDelta` is set on commit (340–348) but never
  cleared or restored by `doUndo`/`doRedo`/undo of spec changes —
  after Undo the dock still advertises the undone change's delta.
- D6 (T7, P1): working-plan profile applicability is never computed.
  `workingErrors` = green + geometry errors only (141); nothing
  checks working lots against `profile.lotAreaMin/Max/frontageMin`
  (shown as text at 541). A working plan outside the active profile
  renders and prices without any flag.
- D7 (T8, P1): preview canvas follows the dirty draft while preview
  economics stay frozen. `planShown` regenerates the candidate on
  draft-following `site` (379–383, 137), but `previewEcon` is the
  run-time stored finance (373–375); `stale` ignores draft fields
  (156–165) and preview buttons are only disabled at *selection*
  time (789, 803). Sequence: preview → type in grove inspector →
  canvas and dock disagree, with unvalidated geometry on canvas.
- D8 (T8, P2): preview-bar Apply has no `draftDirty` guard
  (`App.tsx` 628), unlike option-row Apply (803), Accept (657),
  acceptProposal/rerun (234, 258), and preview-toggle (789).
  Reachable: preview → dirty the draft → preview-bar Apply commits
  the candidate under a dirty draft, bypassing the uniform
  "Apply or Cancel first" contract.
- D9 (T9, P3): with zero cards, `VerdictLine` still prints "0 valid
  of N tested layouts. Every option below is geometrically valid
  and fits the … profile." (62–66) directly above the "No valid
  option" block. Vacuous and confusing; suppress the second sentence
  when `cards.length === 0`.
- D10 (T4/T2, P3): pointer resize snaps all four fields
  (`PlanCanvas.tsx` 179), including untouched edges — a fractional
  committed `x` (via typed `78.5`) rounds on an east-only resize.
  The move path already preserves `w/h` exactly (154–155); resize
  should preserve the fixed edges the same way.
- D11 (T10, P2): no responsiveness instrumentation rendered;
  `SearchRun.elapsedMs` is never displayed in `App.tsx`. T10's
  measurement clause cannot pass without added timing hooks.

## Notes

- Resolved since T10c: `draftDirty` now compares parsed values, so
  retyping an equivalent value ("078") is no longer dirty, while
  unparsable fields still count as dirty (`App.tsx` 123–127).
- `doRun` correctly searches `committedSite`, and run snapshots pin
  green/spec/assumptions for staleness (`App.tsx` 181–196) — the
  search-never-runs-on-draft contract holds except via D7/D8 paths.
- Genuine model integration and human unrehearsed validation remain
  open per the prompt's own gates; this static pass closes neither.
