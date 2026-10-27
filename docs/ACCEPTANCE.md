# UNBUILT — Acceptance matrix

Status values: Passed / Failed / Blocked / Not run. Evidence required for Passed.

| ID | Pri | Status | Evidence / blocker |
|----|-----|--------|--------------------|
| AC-01 | P0 | Not run | Sample view not built yet |
| AC-02 | P1 | Not run | Upload not built yet |
| AC-03 | P1 | Not run | Calibration not built yet |
| AC-04 | P1 | Not run | — |
| AC-05 | P0 | Passed | npm test geometry suite: containment/overlap/access/reconciliation validators green |
| AC-06 | P0 | Passed | spine N=20 / loop N=16 equal modeled valid footprints; footprint-fit validator green |
| AC-07 | P0 | Passed | road/home/green costs derived from measured geometry; allowances declared in src/economics.ts |
| AC-08 | P0 | Passed | road-saving fixture: 1356 m2 delta x Rp0.8m reconciles exactly; intersections unioned once |
| AC-09 | P0 | Passed | green-lock check: shape+location within 1 mm; moved copy fails |
| AC-10 | P0 | Not run | — |
| AC-11 | P0 | Passed | spine vs loop: distinct road areas (720 vs 2076) and counts; both validate |
| AC-12 | P0 | Passed | Engine: locks + ceiling enforced, per-lot failingLots recorded (search suite); UI surfacing pending |
| AC-13 | P0 | Passed | golden arithmetic + negative/zero-home/bad-denominator fixtures green |
| AC-14 | P0 | Passed | L-change leaves allowance unchanged (fixture green) |
| AC-15 | P0 | Passed | t-change leaves revenue/cost unchanged (fixture green) |
| AC-16 | P0 | Blocked | No app API credentials configured; CLI auth is not app proof |
| AC-17 | P0 | Not run | — |
| AC-18 | P0 | Not run | — |
| AC-19 | P0 | Passed | Engine: moved green lock and over-ceiling price veto every combo (tester counterfactuals); UI proposal flow pending |
| AC-20 | P0 | Not run | — |
| AC-21 | P0 | Not run | — |
| AC-22 | P0 | Passed | Engine: zero-qualified run returns tested scope + blockers, no impossibility claim; UI pending |
| AC-23 | P0 | Not run | — |
| AC-24 | P1 | Not run | — |
| AC-25 | P1 | Not run | — |
| AC-26 | P1 | Not run | — |
| AC-27 | P1 | Not run | — |
| AC-28 | P0 | Not run | — |
| AC-29 | P0 | Not run | — |
| AC-30 | P0 | Not run | — |
| AC-31 | P1 | Not run | — |
| AC-32 | P0 | Not run | Model error path pending |
| AC-33 | Priority unassigned | Passed | 47 polygon fixtures green: canonical vertices, area, simplicity, containment, touch-vs-overlap, road access, footprint fit, true-frontage applicability |
| AC-34 | Priority unassigned | Not run | Engine reshape validation green (joint fixtures); pointer/numeric equivalence + one-step Undo implemented, browser verification pending |
| AC-35 | Priority unassigned | Passed | Engine: east-edge valid, positions rejected, gate invalidates results (fixtures green); UI drag/numeric/edge implemented, browser verification pending |
| AC-36 | P0 | Passed | Intent fixtures green: "keep this open space" proposes the selected lock, no-selection asks, legacy synonyms understood |
| AC-37 | P1 | Not run | Photo retain + decode/10 MB validation implemented, browser verification pending |
| AC-38 | P1 | Not run | Any-two compare + Fit both + expandable dock implemented, browser verification pending |
| AC-39 | P1 | Not run | Export v2 snapshot (accepted state vs append-only events incl. undo/redo) implemented, verification pending |
| AC-40 | Owner priority 1 | Partial | Simple polygon creation/editing, true area, persistence and contained spine/loop generation implemented and tested; arbitrary road routing, holes and multipolygons remain unsupported. See v0.5 and current evidence. |
| AC-41 | P1 | Not run | Field-level site errors + assumed-review badges implemented, browser verification pending |
| AC-42 | P1 | Not run | Expandable plan implemented, browser verification pending |
| AC-43 | Priority unassigned | Not run | Lot reshape UI (select/drag/type/add/remove/apply-cancel/lock-discard) implemented, browser verification pending |
| AC-44 | P0 | Passed | Coincident/partial-duplicate lots and lot-vs-rect duplicates overlap (fixtures); touches still do not |
| AC-45 | P0 | Passed | Non-finite corners rejected at validate/isSimple/failingLots (fixtures); unknown never passes |
| AC-46 | P0 | Passed | 2 m setback ring enforced on edited shape (audit case rejected); 3 m front/rear labeled unverified in UI |
| AC-47 | P0 | Not run | Cleared vertex coordinate leaves the corner (incomplete, never zero) implemented, browser verification pending |
| AC-48 | P0 | Not run | Proposal freezes its scenario; any later edit stales it and blocks Accept, implemented, browser verification pending |
| AC-49 | P1 | Passed | Project serialize/parse fixtures green (round-trip, v2 import, all refusals); browser autosave/import pending |
| AC-50 | P0 | Passed | Unit grammar fixtures green (thousands/decimal/magnitudes; ambiguous refused, never guessed) |
| AC-51 | Priority unassigned | Passed | Stable carry fixtures green (search carries matching lots, ghosts inert); conflict-choice UI implemented, browser verification pending |
| AC-52 | P1 | Not run | Signature + 10 MB + decode + 20 MP image gates implemented, browser verification pending |
| AC-53 | P1 | Passed | Server seam protocol fixtures green (19 checks: health/intent/search/refusals/honest 503); real model call unverified |
| AC-54 | P1 | Not run | Redesign spec written (docs/REDESIGN-SPEC.md); visual implementation pending |
| AC-55 | P0 | Passed | Disconnected gate rejected pre-commit (fixture); validity pinned above live metrics |
| AC-56 | P0 | Passed | Search breakdown counts fixtures green; owner expectation a labeled benchmark in Options/Record/summary |
| AC-57 | P1 | Not run | Object-gesture pan separation + fixed-home hint implemented, browser verification pending |
| AC-58 | P1 | Not run | Lot dims, remainder label, scale bar, illustrative north, per-lot highlight implemented, browser verification pending |
| AC-59 | P1 | Not run | Save-scope contract + reload scope statement implemented, browser verification pending |
| AC-60 | P1 | Not run | Allowance waterfall + surplus distinction implemented, browser verification pending |
| AC-61 | P1 | Not run | Best-first verdict + fuller compare deltas with priced-at assumptions implemented, browser verification pending |
| AC-62 | P2 | Not run | Capability disclosure + single-locked-green resolve implemented, browser verification pending |
| AC-63 | P2 | Not run | Print meeting summary implemented, browser verification pending |
| AC-64 | P1 | Passed | PRD v0.4 self-contained successor written; v0.1–v0.35 retained; conflicts resolved in favor of v0.4 where stated |
| AC-65 | P1 | Passed | DESIGN.md adopts Stitch direction with overrides (type/targets/scrollbars) and mockup-claim exclusions; no pasted code.html/CDN |
| AC-66 | P0 | Passed | Canonical hashed snapshots: stability, tamper-sensitivity, 14 refusal cases green |
| AC-67 | P1 | Passed | Snapshot search + read-only explain on the server seam; hand-verified Cedar deltas; refusals green |
| AC-68 | P1 | Passed | Assistant core eval: routing, fact echo, no-invention check, hypothesis labels green |
| AC-69 | P1 | Not run | Canvas-first workspace (tool rail, right inspector, tokens, handle targets) implemented, browser verification pending |
| AC-70 | P1 | Not run | Assistant panel (true/why/try, server-first with local fallback, hash-mismatch refusal) implemented, browser verification pending |
| AC-71 | P0 | Passed | Restricted CORS + preflight fixtures green (8 checks); real-origin browser health/explain verified in Playwright |
| AC-72 | P0 | Passed | Assistant answers version-bound: owner-edit clears panel to Ready, preview gone, zero console errors in Playwright |
| AC-73 | P1 | Passed | Canvas ~617×540 centered at 1440×900, request visible at 1024×768, no overflow at 3 viewports, disclosure contrast fixed in Playwright |
| AC-74 | P0 | Passed | Composer + Send fully in view at 1440×900 and 1024×768 without inner scroll (Playwright boxes) |
| AC-75 | P1 | Passed | Screen-space labels render ≥13px at 1024/375 with measured contrast ≥4.5; lots carry accessible titles |
| AC-76 | P1 | Passed | Mobile mini-outcomes adjacent to plan, collapsible controls, touch-tap selection, no overflow (Playwright) |
| AC-77 | P2 | Passed | Keyboard Enter/V/H/Escape, two-plan comparison with real deltas, delayed in-flight discard, true-geometry 200% zoom without page overflow; machine pixel inspection recorded (Playwright + r3-pixel.json; human aesthetic review still requested) |
| AC-78 | P1 | Passed | Canvas-led shell verified against target screenshot side by side: dark chrome, icon rail, floating toolbar, dark inspector, strip; composer + Send in view 1440/1024; no prototype-only claims added |
| AC-79 | P1 | Passed | Floating toolbar never covers worked geometry (mobile tap veto caught and fixed by south-edge docking); composer textarea basis fix verified at 200% zoom |
| AC-80 | P2 | Not run | Independent visual review of new-ui-*.png vs target-stitch.png and human validation still open |

Tolerances: area reconcile <= 0.01 m2; arithmetic <= Rp1; coordinate tolerance 1 mm.


## v0.5 current verification (27 October 2026)

Earlier entries preserve historical evidence; current results are in
`evidence/polygon-workbench/README.md`. PRD v0.5 supersedes the earlier
rectangular-only AC-40 scope. Historical “true-geometry zoom” screenshots did not
prove browser zoom; the new zoom test checks the actual browser zoom API.

| ID | Priority | Status | Evidence / limit |
|---|---|---|---|
| AC-81 | P0 | Passed | Draw, close, reshape, insert/delete, invalid crossing and correction, cancel, apply; browser test and screenshots |
| AC-82 | P0 | Passed | True area, concavity containment, full gate span, retained lots, unallocated reconciliation; boundary and HTTP server tests |
| AC-83 | P0 | Passed | Draft Undo/Redo, one plan Undo step, versioned persistence, reload and JSON roundtrip; no silent rectangle fallback |
| AC-84 | P0 | Passed | Unsupported layouts have no roads/lots, no qualifying search candidates, no displayed economics and 422 explanations |
| AC-85 | P1 | Passed | Request/proposal/search/preview/apply; distinct-plan comparison; measured server explanation; changed-input/in-flight stale rejection |
| AC-86 | P1 | Passed | Named desktop/mobile captures, actual 200% browser zoom, keyboard coordinate workflow, Chromium touch drawing/dragging |
| AC-87 | P1 | Open | Physical touch device, human unrehearsed task, aesthetic acceptance and milestone sign-off |
| AC-88 | P0 | Open | Real authorized model/tool/result round trip; live health says no model configured |
