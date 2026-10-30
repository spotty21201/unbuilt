# Feature 8 — open spaces

Implemented named polygon parks, pocket spaces and green corridors. Current
requirements: `docs/PRD_v0.13.md`. All work remains uncommitted. Feature 9 was not
started. The earlier tester retest prompt is preserved unchanged at
`evidence/housing-review-followup/TESTER-PROMPT.md` (SHA-256
`3c719f0025d90912e84141dd85f030594d355e7456b25fbc8eb24dc453f7e9dc`).

## Supported behavior

- Up to twelve named simple outlines, three to twenty-four corners each, true
  area at least 1 m² and finite local 0–500 m coordinates. Parks, pockets and
  corridors are selectable and named on the drawing and in the inspector.
- Canvas point placement and closure, rectangle entry, straight corridor from
  endpoints plus a 1–50 m width, pointer corner movement with preserved grab
  offset, arrow/Shift+arrow movement, coordinate fields, corner addition/removal
  and deletion. Existing locked park migrates only into the unapplied draft.
- Individual fixed shape/location and minimum area, plus combined green minimum.
  Overlap, crossing, repeated edges, invalid coordinates and actual irregular-site
  containment block approval. Crossed segments are highlighted. Correct or Cancel
  without changing the accepted scheme. Unfinished-outline Undo remains editable.
- Explicit before/after green area, homes, roads, assumed green works and provisional
  land allowance. Apply/Cancel, draft history, plan Undo/Redo, accepted-state
  Save/reload, record export and import as a separate project.
- True polygon area enters aggregate green quantity and green-works cost. Example:
  480 m² park + 120 m² pocket + 160 m² corridor = 760 m². A concave pocket with a
  120 m² bounding extent contributes 72 m². A rotated 50 × 4 m corridor contributes
  200 m², rather than its larger axis-aligned extent. Roads, lots, green and
  unallocated land reconcile to the actual site area.
- Boundary-only projects can design and retain spaces before generating a layout.
  Starter generation preserves the collection. Clear layout removes it and its
  minima; Undo restores the exact accepted collection. Legacy projects stay readable.
  Project v10 / decision record v11 / snapshot v9 reject disguised older envelopes. The record labels its legacy rectangle as a compatibility reference only.
- Search holds all outlines and names the scope before approval. Locking a specific
  pocket and starting search now share the approved plan snapshot, avoiding an
  immediately stale result. Preview, server-measured explanation, Cancel and stale
  in-flight-response rejection were exercised. The tool service is deterministic;
  the interface says no model. No real model was configured or verified.

## Limits visible in the product

Streets and whole lots conservatively avoid each polygon's bounding extent plus
shared clearance. The dashed selected extent is a routing exclusion, not designed
park. Extra excluded land stays unallocated; the app does not claim optimum yield.
Spine uses bounded orthogonal routing. Loop is fixed and refuses a conflicting
ring. Manual streets, lots, polygon lot edits and housing assignments retain their
protections; a conflicting green draft is blocked rather than silently replacing
them. Arbitrary polygon block subdivision remains outside scope.

No holes, curves, overlapping green allocations, planting schedule, paths,
ecological connectivity, drainage design or statutory open-space compliance is
implemented. A corridor starts as a buffered straight segment but subsequent
corner edits do not certify a continuous width or connection. Green works and
housing finances use shared illustrative assumptions, not market or engineering
verification. Drafts, history, comparison/search results and original source media
remain session-only under the existing save contract.

Production preview verified at `http://localhost:5173`, serving
`/assets/index-BuiQJVHB.js`; the current deterministic tool service runs on 5174
and reports no configured model. Per-suite JSON records retain the asset each
suite actually exercised.

## Verification and artifacts

- `npm test`: **615 passing checks**, including **22 new open-space checks**.
  `root-tests.log`, `open-space-tests.log`.
- `npm run build --prefix web`: passed. `build.log`. The existing large-entry-bundle
  advisory remains; no additional dependency was added for this feature.
- `npm run lint --prefix web`: passed without diagnostics. `lint.log`.
- `tests/open-spaces-browser.cjs`: **31 checks**. `browser-results.json` includes
  the served production asset. Pointer drawing, off-centre drag, repeated keyboard
  movement, unfinished/draft/plan history, invalid repair, minima/locks, Apply,
  Cancel, exact reload and record export were exercised.
- `tests/open-spaces-integration.cjs`: **17 checks**. `integration-results.json`.
  Separate-copy record import, selected-feature proposal/search/preview,
  server-measured explanation, input change during an arriving response,
  clear/Undo, held housing-partition conflict, boundary-only reservation/generation
  and emulated touch were exercised. `server-explanation.json` is actual tool-server
  output with 760 m² on both measured sides; it is not model output.
- `tests/open-spaces-zoom.cjs`: actual browser zoom **2.0**, verified using the
  browser tab zoom API, same outer window and half CSS viewport/DPR 2. Tested create,
  selected-space fit, keyboard edit, draft Undo, review, Apply and plan Undo/Redo.
  `zoom-results.json`; `zoom-200-open-space-plan.png` and
  `zoom-200-open-space-review.png`. Fit reserves screen room for the floating toolbar.
- Existing browser regressions: housing review **34**, blocks/lots **43**, street
  review **33**, dynamic inspector **59**. Their logs and evidence subdirectories
  are preserved here. These are focused regressions, not a claim that every
  historical journey or physical-device gesture was independently retested.

Visually inspected screenshots at **1440×900, 1024×768, 375×812** and actual browser
200% zoom. `drawing-1440.png`, `drawing-1024.png`, `drawing-375.png` and matching
`review-*` views. Also inspect `invalid-outline.png`, `held-lot-conflict.png`,
`alternative-explanation.png` and `touch-375.png`. The laptop screenshot retains a
previous user zoom (cropping the full site); Fit site restores the whole plan and
Fit selected space locates the active pocket without resetting unrelated gestures.

## Open gates

Independent human planner sign-off, real survey/alignment and independently
confirmed access, physical touch/device testing, legal/engineering/cost review,
ecological/path/drainage design and a verified real-model round trip remain open.
Automated emulation and measured geometry do not establish professional suitability.
A full cross-feature audit of every irregular lot, sloping entrance, project media
recovery and all keyboard routes was not repeated in this increment.

Planner retest prompt: `TESTER-PROMPT.md`. Return planner-facing comments as concrete
implementation prompts with evidence and explicit tested/not-tested scope.
