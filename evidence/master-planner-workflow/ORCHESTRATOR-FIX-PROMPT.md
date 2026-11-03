# Orchestrator implementation prompt — independent master-planner findings

You are the implementation Orchestrator for UNBUILT. Implement and verify the corrections below in `/home/spotty/projects/unbuilt`. Complete the product fixes and their regression coverage; do not stop at a plan or a documentation-only response.

The objective is a dependable residential planning sequence from supplied site inputs to a saved preferred alternative, with real geometry, honest constraints and reproducible quantities. Do not optimise for a predetermined lot count.

## Read first and preserve the baseline

Read applicable `AGENTS.md` instructions, `docs/WORK-CONTEXT.md`, `docs/PREPARE-LAYOUT.md`, `docs/SOP-CONTINUATION.md`, and the independent report:

`evidence/master-planner-workflow/run-independent-2026-11-02/REPORT.md`

Call that evidence directory **E** below. Its `TEST-MATRIX.md`, `observations.jsonl`, `independent-metrics.json`, screenshots and input files are supporting evidence. Import `E/Master-Planner-Workflow-Test.project.json` through Projects to inspect the saved study and its 11 alternatives.

The tested build was commit `b6c660f8c13402e853968ad47d0f75428d7ca50c` with substantial uncommitted work; served JS was `/assets/index-FEUX2Fqt.js`. Recheck the current tree and served build. Reproduce each finding before changing it; if already corrected, demonstrate that with a fresh regression rather than making a redundant change.

Preserve unrelated modified/untracked files, branding, owner projects, original prompts and historical evidence. Do not reset, clean, discard, stage, commit, push or deploy. Keep work local. Preserve the existing preview/tool-service configuration on 5173/5174 and do not install credentials. Record the starting state and write new verification artifacts to a fresh correction-run directory. Some existing browser/calculation scripts write into historical evidence directories: redirect their outputs or run adapted copies; do not overwrite the original run.

## Fixed reproduction inputs

Use **Master Planner Workflow Test**, with these fictitious supplied requirements:

- Rectangle `(0,0), (120,0), (120,100), (0,100)` metres; fixed gross area 12,000 m².
- South Main Road, 12 m full width, physically adjoining the southern boundary outside the site. External-road and internal-road quantities remain separate. Full south access frontage is a provisional test permission, not an approval.
- Internal corridor 8 m, explicitly provisional. Carriageway, approved radii/returns, design vehicle, widening and engineering/access decisions remain unknown unless actually supplied.
- Compact: 6 m serving-street frontage × 12 m depth. Family: 8 × 16 m. Mandatory target 60/40 by **valid lot count**, tolerance ±5 percentage points; transparent integer allocation.
- Retain the tested product limits: frontage/depth ±10%, area ±20%, maximum saleable areas 86.4/153.6 m², rear/front ratio 0.7, irregular shapes permitted. These are provisional test assumptions.
- Fixed woodland: `(92,76), (109,75), (115,86), (107,96), (94,93)`; provisional 2 m buffer, no development or crossings, source geometry locked.
- Initial flexible recreation: `(5,70), (20,70), (24,80), (16,88), (5,84)`; area 268 m², minimum 250 m², recreation function, measured road access required, within the declared northwest location region. Use the exact stored region from the fixture rather than silently replacing it.

Never obtain success by shrinking products/corridors, removing park access, loosening mandatory mix, stretching boundaries, moving fixed protection or inventing entrances. Changes to adjustable geometry must be explicit and reviewable. Keep missing information visibly unknown; successful screening does not establish saleability, vehicle manoeuvres or statutory approval.

## Priority 1 — numerical geometry and the preparation workflow

### D1. Mixed-radius loop triggers a polygon-overlay exception

Reproduce with `E/technical-r4.json` and `E/reproduce-curve-failure.mjs`, and through the visible road editor. Starting from F44, Street 2 is:

`(60,20) → (12,20) → (12,70) → (30,70) → (30,60)`

Its curve entries are `2,8`, `3,4`, `4,4` (one-based interior vertex, radius metres). Retain the fixture's 8 m corridor, eastern turning heads, groups and recreation constraints. The observed error was `Unable to find segment ... in SweepLine tree`; the accepted plan survived but the preview could not calculate.

Trace the complete curve-to-corridor-to-overlay path and correct numerical robustness at the appropriate shared boundary. Do not merely suppress the exception, substitute empty geometry, silently drop a road/lot, or broadly round coordinates until the test happens to pass. If the shape is inadmissible, return a specific geometric conflict supported by the actual footprint rather than a library exception.

**Acceptance:** The exact fixture reaches a measured preview or a defensible planning conflict without an overlay exception. Valid proposed geometry has current lots, unioned road quantities and a reconciled land budget. Rendering and measurements use the same physical footprint. Add nearby mixed-radius/junction/head cases. Unexpected calculation failures still preserve accepted geometry/quantities, block acceptance and show a useful user-facing recovery message. Cancel/undo/reopen remain safe. Preserve supported older geometry/persistence contracts; do not silently regenerate saved accepted plans on load.

### D2. Prepare Layout fails to service the committed recreation space

Using the initial fixed inputs above, Prepare Layout reported no tested layout fitting the inputs, including missing park road-edge access. Manual roads could service the park without relaxing constraints. Angled and concave variants had the same preparation gap. The bounded-search disclaimer was honest; this is a workflow/search capability gap, not evidence of a false global-impossibility claim.

Allow planners to save pre-layout **input commitments** before their future access has been constructed. Distinguish those commitments from a completed, usable park allocation. Preserve its required access/minimum area/location and show the unresolved obligation. Then make the preparation search account for that access obligation when constructing connected full-width roads and deliberate product groups.

**Acceptance:** From the visible boundary → external road → entrance/features/space → products/mix → road requirements sequence, inputs can be saved and reopened without falsely claiming a completed layout. Prepare Layout produces a reviewable connected candidate meeting the exact mandatory test constraints, without manual road construction or hidden relaxation. If search genuinely exhausts its supported options, clearly separate rejected-trial reasons, search limitations and demonstrated binding constraints. Do not treat bounded-search exhaustion as proof of infeasibility. Do not hardcode this fixture or a target yield. Use 31/43/50/55 only as historical observations, never acceptance thresholds or saleability claims. Non-looped alternatives require an explicit end-treatment decision and measured turning-head land.

## Priority 2 — editing, feedback and identification

### D3. Southern boundary is obstructed during external-road drawing

At 1440×1000, starting the adjacent-road drawing expanded the controls and left the southern endpoints behind the footer: point y≈921, footer top≈910. Clicks hit the footer and placed zero points. One manual zoom-out was required. See `E/05-draw-road.png` and observation `03-obstructed-road-input`.

**Acceptance:** Both fitted south endpoints are pointer-accessible immediately after entering road name/width, without a camera workaround. Fit uses the actual available canvas area as toolbar/footer/status content changes. Metre coordinates, pointer snap and the boundary remain unchanged. Check 1440×1000 and 1440×1100 plus a narrower layout; do not solve by disabling useful controls or changing world geometry.

### D4. Rebalance wrongly describes a passing current plan as failing

On `E/road-after.json`, the retained plan has 28 valid lots: 18 Compact/10 Family, 64.29/35.71%, within tolerance. Rebalance found no closer whole-section allocation but appended “Mandatory product composition is outside tolerance or undefined.” See `E/32-rebalance-complete.txt`.

**Acceptance:** Current-plan validity is distinct from failed trial reasons. Report current counts, denominator and mix correctly and say no closer tested allocation was found. A failing trial cannot label a passing retained plan as failing. Genuine mix failures still block acceptance. Clear obsolete operation feedback when it could misrepresent subsequent edits.

### D5. Project summary says “Boundary only” despite a saved residential study

Save/reopen the supplied project: the real residential study persists, but the library/outer Plan can say “Boundary only” or no layout generated, making it appear lost.

**Acceptance:** Before opening the residential editor, the project summary identifies the saved residential study and its current screened valid yield, preferred/shortlist state where applicable, and unresolved qualification status, with a direct continuation action. Distinguish any separate legacy plan representation. Do not silently merge the two geometry contracts, migrate legacy layouts or rewrite financial assumptions to fix a summary label.

### D6. Selected lots show opaque identifiers instead of planning names

The selected 122.2 m² Family head lot shows `product_2` and timestamp-based group/street IDs. See `E/74-curved-head-family-lot.png`.

**Acceptance:** Show product name, a human-readable section/group label, serving-street name, stable lot reference, actual area/frontage/depth, validity/exceptions and explicit lock status. Keep stable IDs for persistence/history and expose them as secondary details. Resolve names from current data and handle renamed/deleted references safely. Do not replace measurements with nominal dimensions.

## Priority 3 — absent values and validation feedback

### D7. Empty denominators display “Undefined”

Site-only plans show “Undefined m / valid lot”; zero-count product schedules show “Undefined / Undefined / Undefined” area ranges.

**Acceptance:** Explain that ratios/ranges are unavailable because there are no valid lots. Retain real zero counts, correct denominator rules and mandatory mix validation. Missing rates remain **unpriced**, never invented zero-cost estimates. No NaN/Infinity/Undefined user-facing quantities.

Also make the existing 200-character rate-source constraint discoverable with a visible limit or specific validation message. A longer source currently produces a generic common-rate error despite valid units/date/scope. Preserve scoped-rate requirements and double-count protections.

## Verification and completion criteria

Start each corrected workflow in the visible application. Use technical checks afterwards to explain or verify it; do not inject internal storage/state to fabricate UI success. Implement focused regressions using the supplied fixtures, then run relevant existing checks, web build and lint. The independent run had 95 residential SOP + 56 V2 regressions passing, while the focused curve regression failed. Inspect actual served screenshots; do not infer UI usability from tests or CSS alone.

Re-run the main 26-step sequence and the core angled/concave/narrow-neck tests. Keep the 8 m corridor out of the 6 m neck even when its centreline fits; reject full-footprint boundary escape. No invented second entrance. Retain checks for:

- Boundary/protection locks; permitted entrance movement and locked refusal.
- Real corridor, junction, bend, turning-head and neighbouring-lot regeneration.
- Whole street-section product changes and opposing-product relationships.
- Product dimension changes with explicit dimensional/saleable limits; original fixed products restored for final comparisons.
- Invalid/inaccessible/oversized lots excluded from valid yield and per-valid-lot costs. The 72 m² polygon with 9 m frontage and 8 m depth remains dimensionally invalid despite its area.
- Residual fill returning permitted valid polygons or binding-constraint explanations, without invented products/parks.
- A newly focused **space-only edit affecting occupied lot land**, which the first run did not isolate: demonstrate actual dependent-lot regeneration or a clear conflict while retaining the space's commitments and fixed protection. Treat this as missing coverage, not an already reproduced defect.
- Land categories, gap and overlap separately reconciled to fixed gross within declared tolerance; junction overlaps counted once and external roads excluded from internal quantities.
- Current valid-count costs, unpriced missing scopes, review/accept/cancel, complete-operation undo/redo, saved alternatives, selection reasons, locks, close/reopen and portable import in a fresh profile.

Retain old accepted data on rejected/cancelled/failed operations. Keep provisionally accepted inputs, missing project data, planning preferences and implemented validity checks distinct. Do not mark all unknowns confirmed or claim global optimality, practical saleability or professional approval merely to produce a green status. Vehicle approval, detailed house feasibility and statutory review remain external validation requirements.

Finish with a fresh evidence directory containing:

1. A D1–D7 correction matrix: reproduced baseline, root cause, implementation, tests, result and remaining limits; include the rate-source feedback and missing space-edit coverage.
2. The updated 26-step results, secondary-site outcomes and before/after screenshots for the corrected interactions.
3. Independent quantity/mix/cost reconciliation, retained failure logs, exact build/asset/browser/viewport, commands and passing/failing test totals. Disclose any shared geometry-kernel limitation in the independent checks.
4. A portable saved project with compared alternatives and an explained conditional preferred decision, plus undo/cancel/save/reopen evidence.
5. A concise change summary and preservation evidence for unrelated work. Update current work-context/decision/acceptance documents without rewriting historical reports.

Complete the runnable corrections and verification autonomously. Report genuine unavailable external prerequisites as Blocked/Not tested while continuing the rest. Do not replace an unresolved defect with a disclaimer, fabricated data or a weaker assertion. Do not commit, push or deploy.
