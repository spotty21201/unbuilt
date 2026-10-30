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

## v0.6 dynamic inspector (28 October 2026)

PRD v0.6 adds bounded park-aware routing and a shared housing template; it does
not claim general arbitrary-site subdivision. Current evidence and exact test
commands are in `evidence/dynamic-inspector/README.md`.

| ID | Priority | Status | Evidence / limit |
|---|---|---|---|
| AC-89 | P0 | Passed | Live parameter/template previews, Apply/Cancel, one-step Undo/Redo and measured construction costs; planning/browser tests |
| AC-90 | P0 | Passed | Park growth reroutes connected orthogonal Spine roads, removes impacted lots and reconciles true allocations; engine and pointer tests |
| AC-91 | P0 | Passed | Triangle uses 6,000 m² true area, 672 m² contained road; impossible corridors/park crossings refuse generation; engine/server fixtures |
| AC-92 | P1 | Passed | Up to two cross streets, inspector position and canvas handle share one draft; connected-network checks |
| AC-93 | P0 | Passed | Versioned settings/lock persistence, record import/export, template-aware server explanation and scenario hashes; compatibility fixtures |
| AC-94 | P1 | Passed | Site/park locks control edits, price lock controls qualification, explicit price cap re-locks; supported UI and engine paths |
| AC-95 | P1 | Passed | Proposal/search/preview/apply, distinct comparison, cancelled optimization, stale/in-flight explanation rejection; browser evidence |
| AC-96 | P1 | Passed | Readable desktop/laptop/mobile captures, actual 200% browser zoom, keyboard inputs and emulated touch template resize |
| AC-97 | P1 | Open | Physical device and unrehearsed human task/aesthetic acceptance; no model configured, real model round trip remains open |

## Current visual viewport verification

| ID | Priority | Status | Evidence / limit |
|---|---|---|---|
| AC-98 | P0 | Passed | SVG fills the actual drawing viewport at 1600, 1440, 1024 and 375 px; no inner frame; viewport-edge mouse/touch pan and full-site fit |
| AC-99 | P0 | Passed | Cursor-anchored zoom, manual scale preserved on inspector resize, measured scale calibration at all target sizes; viewport browser suite |
| AC-100 | P1 | Passed | Supplied visual composition adopted: slate shell, pale grid, floating tools, local icons, park hatch/callout, dimensions, entrance tag and evaluator strip; screenshots inspected |
| AC-101 | P1 | Passed | Layer toggles change graphics without changing quantities; toolbar/rail synchronize; real JSON export action |
| AC-102 | P0 | Passed | All 59 planning browser checks retained with the contextual object picker; root engine/server checks, build and lint pass |
| AC-103 | P1 | Passed | Actual browser 200% zoom and keyboard boundary workflow; touch edge pan and controls access |
| AC-104 | P1 | Open | Physical device, independent human task/aesthetic acceptance and real model round trip remain open; see current evidence |

## Residential planner feedback verification

| ID | Priority | Status | Evidence / limit |
|---|---|---|---|
| AC-105 | P0 | Passed within scope | Select/drag entrances on sloping boundary edges; contained/disjoint apron, connected Spine roads, true street area/costs; Loop restriction explicit |
| AC-106 | P0 | Passed | Newly drawn and edited outlines show accepted/proposed quantities and economics before Apply; unavailable layouts disclosed before approval |
| AC-107 | P1 | Passed | Conflicting segments and numbered endpoints highlighted; coordinate repair, disabled invalid Apply and Cancel preserve accepted plan |
| AC-108 | P1 | Passed | Minimum park area independent of exact shape/location; enforced in geometry, search, saved data and server scenarios |
| AC-109 | P1 | Passed | Capacity questions state unmeasured limits; investigation phrasing routes to a reviewable proposal rather than requiring comparison |
| AC-110 | P1 | Passed | Successful search discloses scope and measured allowance trade-offs; server comparison provides editable evidence-limited client explanation |
| AC-111 | P1 | Passed | Version 4 projects/scenarios, record version 5, downgrade refusals; polygon access and applied alternative download/import/reload tested |
| AC-112 | P1 | Passed | Selection reveals contextual summary; mobile lot area/action opens and focuses inspector; desktop/laptop/mobile and actual 200% zoom verified |
| AC-113 | P0 | Passed | 438 root checks, 138 browser checks plus actual zoom checks, production build/lint, screenshots inspected; `evidence/planner-improvements/README.md` |
| AC-114 | P1 | Open | Real model round trip, physical touch hardware and follow-up independent human acceptance remain open; no general route/capacity/access-compliance claim |

## Features 1–3: projects, removal and boundary editing

| ID | Priority | Status | Evidence / limit |
|---|---|---|---|
| AC-115 | P0 | Passed | Named blank/sample project creation, rename/name validation, autosave/Save, open/reload, confirmed deletion and session recovery; independent accepted plans |
| AC-116 | P0 | Passed | Legacy single-project migration retains its original entry; imports create separate projects; project/scenario v5 and record v6 preserve blank/vacant semantics and reject downgrades |
| AC-117 | P0 | Passed | Remove selected homes keeps vacant lots and changes revenue/construction cost; reservations survive regeneration/reload; restore checks edited-lot fit before changing accepted state |
| AC-118 | P0 | Passed | Clear layout keeps boundary; delete boundary/start blank remove dependent geometry and obsolete entrance references; confirmations, locks and plan Undo/Redo verified |
| AC-119 | P0 | Passed | Blank-to-five-sided 11,000 m² site, pointer/coordinate corner movement, add/remove, invalid highlight/blocked Apply, Cancel, draft history, accepted history and explicit contained starter generation |
| AC-120 | P0 | Passed | Failed-save backup contains current accepted in-memory edit; corrupt library unchanged without explicit replacement; stale cross-tab writer refuses overwrite; isolated async answers/history on project switch |
| AC-121 | P1 | Passed within scope | 1440×900, 1024×768, 375×812 captures inspected; keyboard/dialog focus; emulated touch drawing and drag; actual browser 200% zoom. Synthetic post-drag click needs recovery; physical touch remains open |
| AC-122 | P0 | Passed | 465 root checks, 213 browser checks plus 7 actual-zoom assertions; production build and lint pass. `evidence/projects-and-reset/README.md` |
| AC-123 | P1 | Open | Owner task/aesthetic acceptance, physical-device touch, real-model integration/round trip; features 4–15 remain unapproved for implementation |

## Features 1–3 owner-feedback refinements (28 October 2026)

These rows record the follow-up fixes; preceding milestone rows remain historical.
Evidence and exact viewport matrix: `evidence/planner-feedback-fixes/README.md`.

| ID | Priority | Status | Evidence / limit |
|---|---|---|---|
| AC-124 | P1 | Passed within scope | Inspector wraps at six documented 100% viewports; 64-vertex keyboard focus and sticky actions; 12 actual window/zoom combinations, 100–200%. Original clipping not reproduced; original window dimensions unavailable. |
| AC-125 | P1 | Passed | Identical blank-reset choices consolidated as Delete boundary and layout; matching dialog, explicit retained assumptions/photo behavior and session Undo lifetime; Cancel/Undo/Redo verified. |
| AC-126 | P0 | Passed | Real library/deletion downloads restore accepted geometry and assumptions as separate projects; exclusions/private-session/site-data guidance; ordinary profile restart and disposable site-data clearing tested. |
| AC-127 | P0 | Passed | Boundary draft keep/discard, conditional actual-departure warnings for history/photos, straightforward fresh-session switch and native reload warning; accepted plan cannot become an unapproved draft. Browser warning policy remains outside app control. |
| AC-128 | P1 | Passed | Visible unchanged 1 m pointer snap, decimal coordinate input, two-decimal draft area, accessible invalid-coordinate errors; retained photo controls on blank plans and corrected image-removal handler. |
| AC-129 | P0 | Passed | 465 core and 267 browser checks, 12 real-zoom combinations, 7 real-200%-zoom creation assertions, 2 storage-restart/clearing checks; production build/lint. Editor enabled text/control contrast ≥7.34:1 in tested default state. |
| AC-130 | P1 | Open | Owner task/aesthetic acceptance, original Chrome clipping environment, physical touch-device validation and Incognito-session closure behavior; no durable/cloud, survey or private-mode detection claim. |

## Pointer boundary range correction (28 October 2026)

| ID | Priority | Status | Evidence / limit |
|---|---|---|---|
| AC-131 | P0 | Passed | Reproduced six-point manual drawing creating −13 m coordinates. Corrected new-draft framing and bounded pointer/arrow editing; shaded outside-range paper; typed validation retained. 31 focused browser checks at 1440×900, 1024×768 and 375×812. |
| AC-132 | P0 | Passed within scope | 465 root checks, 59 inspector, 38 viewport, 55 project/storage and 20 lifecycle checks; 9 real-200%-zoom creation/cancel assertions including six pointer clicks; production build/lint. Physical touch hardware remains unverified. See `evidence/boundary-pointer-range/README.md`. |

## Feature 4 — Site context (28 October 2026)

Requirements: `docs/PRD_v0.9.md`; evidence: `evidence/site-context/README.md`.

| ID | Priority | Status | Evidence / limit |
|---|---|---|---|
| AC-133 | P0 | Passed | Local multi-page PDF and PNG/JPEG references; two-point known-distance calibration, uniform scale/rotation, actual 100 m alignment and readable bundled-font PDF labels; no guessed distance accepted. |
| AC-134 | P0 | Passed within scope | CSV and straight closed 2D model-space DXF; units, origin translation, candidate/layer/source preview; invalid/unsupported geometry refused; existing boundary consequence Apply/Cancel and coherent Undo. |
| AC-135 | P0 | Passed | Surrounding-street lines, feature/access markers, required source and uncertainty, canvas/coordinate placement, edit/remove/Undo; no changes to generated geometry, quantities or access status. |
| AC-136 | P0 | Passed | Project v6 / record v7 roundtrip and downgrade refusals; metadata persists, media excluded; matching source/page reattachment, project isolation and failed-save backups verified. |
| AC-137 | P1 | Passed within scope | 1440/1024/375 feature viewports, keyboard controls, emulated touch markers and 8 actual 100–200% zoom combinations; pending-edit protection and boundary lock/reference separation. |
| AC-138 | P0 | Passed | 490 core checks, 354 browser checks plus 8 real-zoom combinations and 9 existing zoom groups; production build/lint, screenshots inspected. Exact commands and artifacts in evidence. |
| AC-139 | P1 | Open | Owner task/aesthetic acceptance and physical touch hardware; real-world export compatibility beyond tested subset. No full CAD, cloud/media storage, georeferencing, surveyed/legal access or later-roadmap claim. |

## Planner review follow-up

| ID | Priority | Status | Evidence / limit |
|---|---|---|---|
| AC-140 | P1 | Passed | Disabled home restoration names the pending edit, explains that fit is not yet decided and becomes usable after Apply or Cancel; restored generated homes checked. |
| AC-141 | P1 | Passed | Top-level New project action is visible and keyboard-focuses creation at 1440/1024/375; backup scope remains accessible; mobile lot readout/inspector retained. |
| AC-142 | P0 | Passed within scope | Existing boundary highlights, pointer repair, valid Apply and invalid-draft Cancel rechecked; 490 root checks, 165 browser checks and 9 actual-200%-zoom assertions; production build/lint. `evidence/planner-review-followup/README.md` |
| AC-143 | P1 | Open | Draft continuity, saved client materials, linked access and enforced protected areas require follow-up scope; real survey, legal access, physical-device and owner validation remain open. No model integration added. |

## Feature 5 — Street-editing acceptance gate

Requirements: `docs/PRD_v0.10.md`. Automated evidence and remaining limits:
`evidence/street-editing/README.md`. Automated passes do not close these human gates.

- [ ] Planner can draw, select, move, resize and remove streets and understand
  lot, land and cost consequences before Apply.
- [ ] Planner can recover disconnected/outside/park-conflicting drafts, reconnect
  the entrance, cancel safely and use draft/plan history.
- [ ] Independently review 720 → 942 → 1,016 m² examples, irregular containment,
  save/reopen, fixed-network alternatives, comparison and measured explanations.
- [ ] Owner accepts desktop/laptop/mobile composition and actual 200% zoom workflow.
- [ ] Physical-device touch and a real site/survey/access review completed.

No compliant turning/traffic/pedestrian/legal-access design or real-model round trip
is established by this milestone.

### Street-review follow-up gate

Six planner findings are tracked in `evidence/street-review-followup/README.md`:
off-centre horizontal dragging, centreline joining, truthful proposal scope,
full-width conflict visuals, connector review and mobile continuity. Focused
browser verification is separate from human acceptance. Feature 6 has not started.

- [ ] Tester repeats horizontal grab after three arrow moves: X changes, Y=50.
- [ ] Tester joins a branch with the pointer cue and repairs an explicit typed gap.
- [ ] Tester sees the same fixed-network/four-frontage scope before and after search.
- [ ] Tester identifies and directly repairs a full-width conflict on the drawing.
- [ ] Tester reviews orange connector/affected-lot cues and cancels safely.
- [ ] Tester reviews width/outcomes on mobile and returns to the same selected branch.

Engineering, legal access, real survey, physical-device and real-model gates stay
open; these interface corrections do not establish them.

## Feature 6 — Blocks and lots acceptance gate

Owner-authorized requirements: `docs/PRD_v0.11.md`. Automated evidence and limits:
`evidence/blocks-and-lots/README.md`. Earlier Feature 6 deferrals are historical;
Feature 7 has not started. Independent acceptance remains separate from test passes.

- [ ] Planner can split, merge and subdivide a rectangular group, understand
  resulting lot/home counts and review effects before Apply.
- [ ] Invalid/inaccessible/undersized occupied lots are blocked; explicit vacant
  parcels remain measurable and are not counted or priced as homes.
- [ ] Planner can reshape a resulting lot using drawing and keyboard controls,
  recover invalid edits and use draft/plan Undo/Redo without losing accepted work.
- [ ] Save/reopen and portable import preserve manual partition and polygon edits.
- [ ] Street/park changes respect held lots, and generated restoration/search limits
  are understandable before any manual work is replaced.
- [ ] Desktop/laptop/mobile/actual-200% and physical-device workflows accepted.

Cadastral approval, real survey/access, traffic/turning, model connection and owner
workflow/aesthetic acceptance remain open. Rectangular operations and polygon
reshape do not establish arbitrary polygon splitting/union or legal subdivision.

## Feature 6 review and Feature 7 housing mix

- [x] One-based proposed frontage warning and affected parcel highlight; mobile
  warning stays beside the drawing with the draft retained.
- [x] Merge review shows source occupancy, removed occupied homes and resulting
  vacancy, with accepted-to-proposed references for unchanged parcels.
- [x] Provisional allowance and selected polygon-setback limitations are adjacent
  to relevant outcomes; irregular-block planning retained as future discovery.
- [x] Create/name/edit templates; protect in-use deletion; choose a default and
  assign individual lots, connected blocks, native multi-selection or all lots.
- [x] Actual assigned footprints, schedule/counts/built area and summed construction;
  vacant assignments create no homes/revenue, bad fit blocks application.
- [x] Preview/Apply/Cancel, history, save/reload and versioned JSON backup/import;
  held partition, lot inheritance and clear-layout recovery retain exact work.
- [x] Shared server validation and measured costs include housing; previous envelope
  versions reject hidden housing data. Existing proposal/stale-response gates retained.
- [ ] Independent planner acceptance of the revised review and housing mix.
- [ ] Physical-device touch and survey/access/legal/engineering verification.
- [ ] Real-model round trip; no model connection is claimed by this increment.

## Housing-mix planner review follow-up

- [x] Oversized vacant reservation: persistent lot/template/dimension explanation,
  direct reassignment and outline recovery, fitting repair and explicit restoration.
- [x] Generated-lot prerequisite opens directly, identifies released assignments,
  supports Cancel, preserves library, and retains two explicit approvals/Undo steps.
- [x] Default change identifies inherited and held lots before preview; target list
  and selected readout distinguish same-name explicit/default homes.
- [x] Mobile text key identifies selected design and mix without color; review
  round trip preserves the zoomed viewport and draft.
- [x] Review exposes shared price/rate/contingency and measured cost differences;
  market assumptions remain provisional.
- [ ] Independent human acceptance and physical-device touch retest.

## Feature 8 — open-space verification

Current requirements: `docs/PRD_v0.13.md`. Evidence and open gates:
`evidence/open-spaces/README.md`; planner retest:
`evidence/open-spaces/TESTER-PROMPT.md`. Keep the separate housing-review retest
prompt intact at `evidence/housing-review-followup/TESTER-PROMPT.md`.

Acceptance requires true aggregate polygon area/cost, valid containment and
non-overlap, no conflicting generated geometry, truthful unsupported-route states,
held manual geometry/assignments, explicit preview approval, draft/plan history and
portable accepted-state recovery. Browser proof must include real interactions,
responsive screenshots and actual browser zoom; checks alone do not establish
professional planning suitability. Physical touch, survey/access confirmation,
engineering/legal review, independent human sign-off and a real-model round trip
remain separate gates.

## Feasibility experiments — PRD v0.14

- [x] Frozen accepted/trial design and editable cost review, with generated
  circulation/frontage/depth, eight costs, measured deltas and sequential attribution.
- [x] Complete finite cost validation, explicit zero behavior, no partial invalid
  finances, no accepted-state mutation before Apply; Cancel and Escape preserve work.
- [x] Manual lots, lot reshapes and assigned homes protected; their costs remain editable.
- [x] Apply/Undo/Redo, reload, shared economics displays, record export/import,
  project v11 / record v12 / snapshot v10 gating and cost-sensitive hashes.
- [x] Local and real HTTP search/explanation use accepted costs consistently.
- [x] Served build browser checks, narrow touch emulation and actual 200% browser
  zoom; inspect captured desktop/tablet/mobile/zoom screenshots.
- [ ] Independent planner acceptance, physical-device gestures and verified
  site-specific cost/market evidence. No real-model verification is claimed.

See `evidence/feasibility-experiments/README.md` for results and limits. Feature 8
independent planner testing remains deferred; the preserved prompts are unchanged.

## Saved alternatives — PRD v0.15

- [x] Named independent copies of accepted plans and unapplied search previews,
  with unique names, explicit scheme-level notes and metadata updates.
- [x] Two-scheme measured comparison with saved geometry, costs and assumptions;
  unavailable finances are explicit and do not become zeros.
- [x] Review/confirm/Cancel reopening, prior-plan Undo/Redo, collection independent
  of plan history, and safe access from blank working plans.
- [x] Collection save/reload, project/record downloads and import into a separate
  project; whole-envelope validation and format downgrade protection.
- [x] Confirmed removal with session recovery; browser save failure retains current
  disk data and an exportable in-memory project.
- [x] Complete served-build browser, touch, actual 200% zoom and focused regression
  checks; record results and screenshot inspection in saved-alternatives evidence.
- [ ] Independent planner acceptance, physical-device interaction and verified
  market/cost evidence. Existing earlier tester prompts remain unchanged.

## Feature 11 — real assistant, with routing credentials deferred

- A real completion-protocol adapter accepts only four validated tools; unknown fields, unmeasured numeric prose, multiple tool calls, invalid assumptions and nonexistent selections refuse without plan mutation.
- Supported proposals display exact hypothetical input changes and held commitments. Run measures only the reviewed snapshot; Review on plan opens the existing drawings; Apply is explicit and supports one-step Undo/Redo and saved alternatives.
- Current and trial explanations select deterministic measured statements. Source notes, media, saved schemes and model transcripts do not enter the model payload/project exports respectively. Selection changes, new input, cancellation, timeout and configuration revisions reject old answers.
- Administrator authorization protects settings and connection tests. Primary/alternate routing, key retain/replace/remove, private file permissions, restart persistence and revision conflicts are verified with a scripted fixture. No automatic alternate-provider routing or retry.
- Production build, lint, full root checks and browser/actual-zoom evidence are recorded in evidence/ai-assistant. Automated fixtures are not real-model verification. Endpoint/secret delivery and later independent acceptance remain open; existing tester prompts remain preserved.

## Feature 12 — terrain, drainage and phasing introduction

- No automatic terrain/storm/schedule results without input data. Bounded CSV grid/source/datum/date validation, concave clipping, slope/threshold area and split positive/negative cut/fill have analytic ground-truth checks; no extrapolation or grading/earthworks-price claim.
- Measured disjoint runoff areas, weighted C and SI Rational peak require declared catchment/storage applicability and sufficient intensity duration. Gross rainfall volume stays separate from runoff/storage. Optional outfall position/capacity is an unverified reference, not a drainage network or compliance result.
- Phases use actual assigned occupied-home sizes, contingency once, explicit shared percentages, build/sale months and a single owner payment. Unrounded monthly totals reconcile to accepted modeled surplus. Vacancies and changed references are not automatically reassigned; maximum month-end deficit excludes financing/intramonth assumptions.
- Apply/Cancel/Reset/Escape, history, local save/reload, file import/export, saved-scheme isolation/comparison, geometry-trial warnings and retained inputs through clear/delete are verified. Invalid values cannot publish partial totals; valid data with unresolved applicability stays clearly unavailable.
- Project v13, record v14, snapshot v11/capability and full-precision bindings reject disguised downgrades. Server and local findings agree. AI receives computed screening statements, excluding raw grids/source descriptions.
- Production build/lint, root checks, desktop/narrow and actual 200% browser-zoom evidence are in evidence/terrain-drainage-phasing. Both requested tester prompts are saved and deferred. Actual site data, civil/financial suitability, physical touch and independent planner acceptance remain open.
