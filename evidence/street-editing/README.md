# Feature 5 — Street editing implementation and verification

Feature 5 is implemented for owner and planner review. All work remains uncommitted;
existing workspace changes were retained. Requirements: `docs/PRD_v0.10.md`.
Tester handoff: `TESTER-PROMPT.md`. This is implementation verification, not an
independent human planner's acceptance report.

## What changed

The earlier circulation controls only positioned two generated cross streets.
They did not support a planner-drawn network or per-segment widths. Street editing
now opens an explicit draft from the displayed development roads. The light plan
remains the workspace; blue shared-junction handles and selectable centrelines
support drawing, endpoint movement, per-segment 6–12 m widths and removal. Crossings
join at grade. Coordinates and arrow keys provide alternatives to pointer gestures.

The inspector reviews accepted → draft homes, surface, street works, retained park
and land allowance. Valid edits regenerate lots and costs live. Disconnected,
outside-boundary and park-conflicting edits block Apply, show red proposed lines
and retain accepted geometry/quantities. Finish stroke is separate from Apply
network. Draft Undo/Redo, Cancel and one-step plan Undo/Redo are supported. Re-entering
an unchanged coordinate does not consume history; repeated arrow moves keep focus.

Start at entrance and Connect entrance use the one existing gate connection. The
latter proposes a 6 m inset route to the nearest street for review; it may fail
park/boundary checks and require manual rerouting. Explicit boundary-edge gates keep
their measured access apron. Generated routing can replace manual streets only
through a preview and Apply. Clearing/deleting the layout removes its network;
Undo restores it. Mobile View drawing / canvas Review streets connect the two views.

## Supported calculations and data

- 1–64 horizontal/vertical segments, minimum 1 m length, widths 6–12 m and local
  coordinates 0–500 m. Diagonal picks create orthogonal bends; diagonal imported
  segments, duplicate/overlapping collinear lines and malformed data are refused.
  Manual and generated cross-street inputs cannot silently coexist.
- Centreline connectivity to the existing entrance; full corridor containment in
  the true simple site polygon; fixed rectangular park and its selected clearance.
  Complete contained rectangular lots with fitting home footprints and no road,
  apron, park-clearance or other-lot overlap. Compatible manual lot shapes use the
  existing conflict review; removed-home region reservations remain effective.
- True polygon site area; exact unioned street surface with intersection overlap
  counted once, plus the measured access apron where present. Home count, land
  budget, construction costs and economics use this same generated geometry.
- On the unchanged sample, trunk 120 × 6 = 720 m²; T branch 40 × 6 adds 222 m²
  (942 total), width 8 adds 296 m² (1,016 total), width 7 gives 979 total. Surface
  works use the existing Rp800,000/m² assumption; these are illustrative inputs.
- Accepted networks survive autosave/reload and portable JSON project/record
  import/export. Manual project format v7, decision record v8, snapshot v6 with
  `editable-orthogonal-streets`; older formats remain compatible and cannot hide
  newer inputs. Original survey media, drafts and session history retain earlier
  exclusions. No CAD export format is added.
- Search/preview/apply/comparison and tool-server explanation retain and measure
  the manual network. Search varies supported frontage choices, not street design.
  Fixed Loop cannot overwrite it. Changes clear stale answers/results and reject
  arriving explanations for old inputs. No real model connection was added/tested.

## Checks actually run

Actual application: Vite production preview at `http://localhost:5173`, deterministic
tool server at port 5174. Final street browser and zoom runs loaded
`/assets/index-BopW0fE6.js`. Source build, live asset and per-run asset metadata were
checked; a passing earlier build was not treated as evidence for this feature.
Browser tests used isolated fictional projects and temporary browser profiles.

| Check | Result | Evidence |
|---|---|---|
| Root `npm test` | 522 checks passed, including 25 street and 7 added server checks | `root-tests.log`, `tests/streets.mjs`, `tests/server.mjs` |
| Web production build and lint | Passed, no lint warnings | `web-build.log`, `web-lint.log` |
| Street browser journey | 57 checks passed | `tests/streets-browser.cjs` |
| Actual Chrome 200% zoom | Passed; chrome.tabs zoom=2, same 1440 px window, CSS width 1440→720, DPR 1→2, no horizontal overflow | `zoom-results.json`, `zoom-tests.log`, `tests/streets-zoom.cjs` |
| Dynamic inspector / park / boundary / assistant regression | 59 checks passed | `regression-dynamic-inspector-browser/browser-results.json`, `regression-dynamic-inspector-browser.log` |
| Project management regression | 55 checks passed | `regression-projects-browser.log` |
| Project lifecycle / boundary / home restoration regression | 20 checks passed | `regression-project-lifecycle-browser.log` |
| Site-context regression | 33 checks passed | `regression-site-context-browser.log` |
| Planner follow-up regression | 26 checks passed | `regression-planner-review-followup-browser.log` |
| Planner access / locks / explanations / responsive regression | 41 checks passed | `regression-planner-feedback.log` |

The regression suites ran during implementation; each suite's JSON retains its
own loaded build ID. Final street/zoom runs exercise the final build. Focused
street coverage includes coordinate and pointer drawing, keyboard width changes,
repeated arrow moves, shared-node gestures, draft and plan history, incomplete
inputs, branch removal, disconnected/park/full-width conflicts, entrance reconnection,
return to generated routing, clearing/recovery, manual lot conflict review, irregular
sites, reload, JSON record import, request → proposal → search → preview → apply,
comparison, server remeasurement and an input changed while an answer was in flight.
No uncaught page errors occurred in the street journey. Touch is Chromium emulation.

Screenshots were opened and visually inspected, including:

- `accepted-1440.png`, `editor-1440.png`, `draft-1440.png`
- `accepted-1024.png`, `editor-1024.png`
- `accepted-375.png`, `editor-375.png`, `street-canvas-375.png`
- `invalid-disconnected.png`, `entrance-reconnection.png`, `comparison.png`
- `irregular-streets.png`, `sloping-entrance-streets.png`
- `zoom-200-editor.png`, `zoom-200-street-canvas.png`, `zoom-200-plan.png`

The desktop/laptop canvas remains dominant. Mobile deliberately stacks controls
below the plan; View drawing and Review streets return focus between them. Small
fit-to-site labels still need selected-object inspection or zoom. This is an
observed limit, not a claim of completed owner aesthetic acceptance.

Reproduce with the existing preview/tool server running:

```sh
npm test
npm run build --prefix web
npm run lint --prefix web
PLAYWRIGHT_MODULE=/home/spotty/projects/studioos/node_modules/playwright node tests/streets-browser.cjs
PLAYWRIGHT_MODULE=/home/spotty/projects/studioos/node_modules/playwright xvfb-run -a node tests/streets-zoom.cjs
```

## Limits and remaining gates

This is preliminary orthogonal planning. Rectangular butt-ended corridors and
at-grade crossings do not establish turning radii, swept paths, engineered
junctions/cul-de-sacs, gradients, emergency/service access, traffic capacity or
pedestrian quality. Curved/diagonal corridors, multiple entrances, terrain/drainage,
external-road linkage and regulatory/legal approval are outside this increment.
Only the existing park/clearance is reserved; site-context markers remain reference
annotations, not enforced easements or protected areas.

Lot generation is deterministic and greedy, not a maximum-capacity solver. Moving
streets can reorder/repartition generated lots. Manual streets are held through
search; the optimizer does not design alternate networks. A new gate location may
require returning to generated routing before redrawing/reconnecting the network.
Invalid boundary changes may still be saved as an unassessed site, following the
existing honest layout-unavailable workflow; manual streets are not silently clipped.

Still open: independent residential-planner and owner acceptance, real touch-device
validation, full assistive-technology/keyboard audit, independently checked real
survey/access and road engineering. A real model round trip remains unverified;
the exercised server tools are deterministic. No deployment, commit or push was
performed. The tester prompt requests observations as actionable improvement prompts
for the next implementation revision; that independent test has not been run here.
