# Feature 6 — Blocks and lots

Implemented 29 October 2026. Work remains uncommitted. Feature 7 has not started.
Current requirements: [PRD v0.11](../../docs/PRD_v0.11.md). Earlier PRDs and prior
workspace work are preserved.

## What a planner can do

Select a lot and use the contextual **Blocks & lots** controls:

- Split one rectangular lot east–west or north–south at a chosen percentage.
- Merge adjacent rectangular lots whose complete union is a rectangle.
- Subdivide an existing connected rectangular block into 2–100 equal strips.
  Blocks come from existing edge-adjacent lots; this does not draw new development
  blocks in unallocated land.
- Reshape a resulting lot as a simple polygon with pointer handles, coordinate
  inputs, add/remove corner controls and keyboard arrows. Draft Undo/Redo is
  separate from accepted-plan history; a pointer gesture is one history step.
- Preview changes on the drawing and review accepted/proposed lots, homes, true
  lot area and allowance before Apply. Cancel preserves accepted work. Changing
  an operation input requires a fresh preview. Invalid proposed rectangles remain
  visible with an explanation and blocked Apply.
- Explicitly create vacant resulting lots when the existing home does not fit.
  Vacant parcels contribute area, but no home count, revenue or home construction
  cost. Existing removed-home reservations remain conservative through partition
  changes; they never silently restore a home.
- Apply as one plan-history step; Undo/Redo, save/reload and JSON backup/import
  retain manual rectangles, compatible polygon outlines and vacancy reservations.

Roads, entrance apron and open space stay fixed during lot operations. The engine
checks actual irregular-site containment, parcel overlap, infrastructure conflicts,
frontage and occupied-home fit. Subsequent infrastructure edits hold the manual
partition and block conflicts rather than silently clipping or regenerating it.
Clear layout removes the partition; Undo restores it.

Manual partitions use project v8, decision record v9 and snapshot v7 with capability
`manual-rectangular-lots`. Older supported projects still open. Older envelopes
cannot hide manual geometry; hashes and server validation include the partition.

## Search and assistant behavior

Frontage search cannot repartition a held manual lot plan. The inspector, proposal
parser, search engine and server state this limitation. No identical fixed plan is
presented as different frontage alternatives. Measured current-plan explanations use
the real saved partition; an inapplicable frontage comparison is refused.

**Preview generated lots** offers an explicit way back to generator-driven search.
The preview can be cancelled. Applying reviews incompatible polygon work before
removing it, and Undo restores the manual partition and outlines. No real model
connection was added or verified. The application continues to disclose “no model.”

## Independent numerical checks

On the unchanged 120 × 100 m sample:

| Operation | Lots / homes | Area checks |
| --- | --- | --- |
| Merge adjacent 200 m² lots | 20 → 19 / 20 → 19 | Result 400 m²; total lots 4,000 m² |
| Split that merged lot in half | 19 → 20 / 19 → 20 | Two 200 m² lots; total 4,000 m² |
| Repartition south 120 × 20 m block into ten | 18 / 18 | Each 240 m²; total 4,000 m² |
| Split one standard lot into two explicit vacant lots | 21 / 19 | Two 100 m² vacant lots; total 4,000 m² |

Each retains 720 m² of streets and 480 m² of park. A small occupied split is
blocked rather than priced as two fitting homes. A depth split with inaccessible
rear lots is blocked even when vacant. Rectangular operations refuse road gaps,
holes, disconnected sources, overlaps and genuinely reshaped polygons.

The irregular example `(0,0), (120,0), (120,100), (50,100), (0,60)` has
12,000 − (50 × 40 / 2) = **11,000 m²**. Subdivision, true area reconciliation,
containment and persistence were checked on that site. Its bounding rectangle was
not substituted for its area or parcel containment.

## Verification

Final live preview: `http://localhost:5173`, production asset
`/assets/index-UCa4rHjM.js`. Tool server: port 5174. Browser and zoom result JSONs
identify this same asset. Tests use isolated browser profiles and fictional studies.

| Check | Result / evidence |
| --- | --- |
| Root `npm test` | 563 checks passed, including 21 new lot-engine checks and HTTP/persistence coverage — [root.log](root.log) |
| Focused Feature 6 browser | 43 checks passed — [browser-results.json](browser-results.json), [browser.log](browser.log) |
| Actual browser zoom 200% | Passed merge/review/Apply/Undo/Redo and reflow; browser API zoom=2, same physical window, 1,440→720 CSS width, DPR 1→2 — [zoom-results.json](zoom-results.json), [zoom.log](zoom.log) |
| Street follow-up regression | 33 passed — [streets.log](streets.log) |
| Inspector regression | 59 passed — [inspector.log](inspector.log) |
| Projects regression | 55 passed — [projects.log](projects.log) |
| Lifecycle regression | 20 passed — [lifecycle.log](lifecycle.log) |
| Site-context regression | 33 passed — [context.log](context.log) |
| Web production build / lint | Passed — [build.log](build.log), [lint.log](lint.log) |
| Whitespace validation | `git diff --check` passed |

The build reports a nonfatal main-chunk size warning (about 503 kB minified).
The lot editor is lazy loaded. The warning threshold was not changed.

Focused browser coverage includes invalid/cancel/apply, changes invalidating a
preview, plan and reshape-draft history, off-centre horizontal pointer dragging,
keyboard repair of an invalid polygon, save/reload, record export/import as a
separate project, held-lot street conflicts, generated restoration with incompatible
outline review, clear-layout recovery, irregular-site subdivision, responsive
drawing/review round trips and emulated touch selection/preview/application.

Screenshots were opened and visually inspected, rather than judged from CSS or
test results alone:

- [Merge review, 1440 × 900](merge-draft-1440.png)
- [Block subdivision](block-subdivision.png)
- [Invalid occupied split](invalid-split.png)
- [Editor, 1440 × 900](editor-1440.png)
- [Editor, 1024 × 768](editor-1024.png)
- [Review, 375 × 812](editor-375.png) and [drawing](drawing-375.png)
- [Actual 200% drawing](zoom-200-lot-plan.png) and [review](zoom-200-lot-editor.png)
- [Irregular-site lots](irregular-lots.png)
- [Emulated touch result](touch-applied.png)

Inspection fixed a sticky-action overlap with the comparison and removed an
overlapping canvas readout/source caption. Final focused browser and zoom checks
were rerun against the rebuilt asset after that correction. Regression suites were
run earlier during this increment; their result files retain their own asset IDs.

## Limits and open gates

- No polygon boolean split/union, curved or holed parcels, nonrectangular block
  clipping, new block drawing in unallocated land, multiple homes per lot or
  independent housing mix. Rectangle dimensions are at least 1 m; maximum 500
  manual lots. Reshape retains the existing maximum 12 corners.
- A merged occupied lot represents one home. Economic outputs retain the existing
  profile assumptions, with applicability warnings for changed dimensions. They
  are not new market evidence. Existing vacancy reservations can keep a merged
  lot vacant; restoring homes requires the separate fit check.
- Polygon reshape retains the placed-home plus 2 m ring rule. Full 3 m front/rear
  polygon setbacks are not verified and remain disclosed. Geometry validity does
  not establish cadastral approval, traffic/turning compliance or legal access.
- Source images, unaccepted drafts/alternatives and session history retain their
  previous recovery limits. This increment does not create saved scenario comparison.
- Physical-device touch, independent human planner acceptance, engineering/cost
  review, a suitable real survey, external access confirmation and a real-model
  round trip remain open. Touch emulation is not physical-device validation.

[Human planner test prompt](TESTER-PROMPT.md) requests reproduced observations and
actionable improvement prompts, clearly separating defects from future discovery.
