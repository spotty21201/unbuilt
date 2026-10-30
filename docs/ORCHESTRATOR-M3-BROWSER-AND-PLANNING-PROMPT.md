# Orchestrator prompt — M3 browser feedback and planning controls

From: independent UI/UX browser reviewer, Unbuilt Astra Tester.
Reference build: http://100.117.187.86:5173/, served asset `index-Bk0UvSYN.js`, SHA-256 `46e2756ccdbdc31a0a9f3f8e5217b41afe42010abda33f54835507378efa5b9b`.

The user wants a more flexible, direct planning tool. Please address the browser findings and add three requested capabilities: irregular lot polygons and configuration, movable compound entrance, and the term **open space**. Use the existing workbench and preserve the uncommitted changes. Do not claim the model, human-validation, or complete M3 gates passed without their own evidence.

## Independently observed browser findings

I tested Chromium at 1440×900, 1024×768 and 375×812. `npm test` passed all nine suites. The test evidence is in `evidence/m3-browser-review/`. These are agent-driven checks, not a human-user study.

1. **Upload is lost when confirming the site — high priority.** Upload a PNG, enter 140×110 m, and click “Use this site”: the reference image disappears. The same happens when confirming the original 120×100 dimensions. Undo restores the old site metrics but not the image. The expected upload → declare dimensions → work on site flow is interrupted. Retain an uploaded image while confirming dimensions for that same source. If the user switches to a genuinely different source, offer an explicit replace/remove action and make its behavior clear. Preserve the source image through Undo or accurately explain when that is impossible. Keep it labeled reference-only until actual calibration is implemented.

2. **Invalid image bytes are accepted — high priority.** An input named `fake.png` with PNG MIME type but non-image text is reported as “Reference photo loaded,” with no error. Validate actual PNG/JPEG decoding, MIME/content and implementation size limits before accepting; surface a helpful inline error, preserve the last valid image, and revoke unused blob URLs. Test broken, wrong-type, oversize and valid PNG/JPEG files. File extensions and the input's `accept` attribute are insufficient.

3. **JSON does not describe the current geometry — high priority.** After moving the green region, export includes site width/depth, family/frontage, metrics and a free-text edit log, but no structured current region position/shape, entrance location or parcel/road geometry. After moving X=78→74 and Undo, the record still contains an append-only “moved to 74” event while the actual current X=78 is absent. The record cannot unambiguously describe or reproduce the current plan. Export a versioned, explicit snapshot of current accepted site boundary, coordinate system/units, entrance, open-space geometry and lock, plan parameters, model outputs and assumptions, with either full modeled parcel/road geometry or enough versioned inputs to reproduce it; keep chronological events clearly separate from current state and record undo/redo if used as a history. Validate by exporting before and after Undo and independently checking the snapshot against the displayed plan. Do not include image bytes, credentials or paths without a user-facing reason.

4. **Compare is functionally correct but difficult to inspect.** With a 20-home working plan and 17-home option the displayed values agree: road 720→720 m², allowance Rp3.56bn→Rp2.41bn, shortfall Rp6.44bn→Rp7.59bn. After owner input changes, stale compare correctly disappears. However two ~511px tall plan panels sit inside a dock ~268px high, so they cannot be viewed together in full. Provide a dedicated expandable comparison workspace/panel with two plans and their deltas visible together; synchronize framing/zoom or provide Fit both, preserve the same site coordinates and label the compared snapshots. Support choosing any two distinct options, including working plan, rather than only working-plan vs one result. Do not imply saved-scheme persistence until it exists. Evidence: `compare-in-view.png`, `followup.log`.

5. **New-site labeling and errors need work.** A 100×100 m site is rejected by the current 120×100 scope policy, but the error only appears in the distant top status line with no error beside the width/depth fields. Put scope errors beside the controls and explain what to change. Newly generated entrances and open spaces are defaults, not confirmed observations of a user-uploaded site; visibly mark them as “assumed — review” and do not call sample pricing evidence for the new site. Current UI labels fictional prices, which is useful.

6. **Plan area can use the available canvas better.** The prior desktop clipping and initial mobile overflow are improved: 1024/1440 fit the SVG and request; 375px measured 375px scroll width. At 1440 the plan remains about 473px wide in a 1114px column, leaving extensive empty space. Let the user expand the plan while retaining inspector and summary visibility; use responsive sizing instead of a permanently small fixed illustration. This is a usability improvement, not a claim the site is clipped.

7. **Use open-space language consistently and preserve the intent contract.** The current “Grove A” is `Site.green`: a user-editable, reserved shared-green rectangle whose area is calculated, kept clear of parcels/roads and used in a green-works cost assumption. It is not a surveyed tree inventory and it is separate from private lot gardens. Rename the user-facing feature “Open space A” and explain its currently modeled type as landscaped/shared green until other surface types and cost assumptions are explicitly modeled. Update canvas, object list, inspector, commitments, comparison, request examples, record and error copy together. Support both “open space” and existing “green space/grove” vocabulary in the intent interpreter and migration of stored/exported identifiers as needed. Browser test: “Keep this open space. Do not increase the home selling price. What else can change?” currently yields a price-only proposal both with and without a selected object; no selection clarification or explicit open-space lock is proposed. With a selected open space, propose preserving its exact location/shape; without selection, ask which one. Never silently change a green-works assumption merely because a broader display label is used.

## User-requested planning capabilities

These requests expand the current PRD's rectangular-solver boundary. Treat them as real product requirements, not decorative handles. If the engine cannot safely solve a shape yet, show the limitation and keep the last valid accepted plan. Update the product contract and acceptance matrix with the supported geometry and any staged limits.

### A. Irregular polygon lot shapes and configuration

The user specifically asks for **individual residential lot shapes/configuration** to be editable as irregular polygons. Also support defining an irregular compound/site boundary as a related capability where the engine can model it; do not conflate the two. The designer should show site boundary, individual lot, shared open space and circulation as separately selectable objects.

- Create/edit polygon vertices directly on the canvas with visible handles, add/remove vertices, snap and numeric/keyboard alternatives. Display area, edge lengths and selected parcel identity; handle Undo/Redo as complete gestures. Include explicit Apply/Cancel if a multi-step polygon draft needs confirmation.
- Persist actual polygon coordinates in meters, selections and locks, not a bounding rectangle or a cosmetic SVG overlay. Validate simple, non-self-intersecting polygons, minimum size, boundary containment and overlaps; provide an explanatory error and maintain the last valid state.
- Extend the layout engine, candidate search, quantity/finance calculation, preview/compare, export and history together. A parcel needs a footprint that fits and road access; preserve the non-overlap and area-reconciliation invariants. Frontage and product applicability must use the true relevant edges, not rectangle averages.
- Avoid silently modifying neighbors or moving a protected open-space polygon. A user's manual lot edit must not be silently erased by regeneration. Define and communicate whether individual lots are locked, transformed, or regenerated; warn and require an explicit user action if a change would discard manual work.
- Initial delivery may bound complexity to simple polygons (no holes/multipolygons) and a specific supported family if clearly described; ask the user for an actual scope decision only if irregular-lot behavior cannot be delivered without a material product tradeoff. Do not claim support for arbitrary parcels until the engine and tests do.

### B. Move the compound entrance

Make Entrance a selectable object in the object list and canvas. Let the user drag it along supported site edges and enter an exact edge/offset or coordinates. Show the actual gate width, edge, position, access context and assumed/confirmed state. Support moving to different edges as a product requirement; if delivered in stages, label available edges and explain unsupported positions.

The generators currently assume a west-edge entrance (`src/site.ts` and `src/geometry.ts`); changing the marker alone is incorrect. Connect the actual generated circulation graph to the selected gate, validate access and geometry for each supported family/edge, and update plan, quantities, preview/compare, results staleness, record, history and export together. Reject invalid positions/access clearly; do not assert legal right of access. Any connected street shown on a sample is schematic unless sourced/confirmed.

### C. Open space as a meaningful object

Implement the naming/intent changes in finding 7. Provide clear selection, preserve/unlock, dimensions, area and numeric/keyboard controls. Distinguish shared open space from private gardens, roads and unallocated land. If future open-space types include paved areas, make surface type and its cost basis explicit instead of automatically applying landscaped-green costs. Preserve exact geometry and location when the user locks it.

## Acceptance and delivery

- Run independent geometry fixtures for irregular lots, self-intersections, adjacency/access, overlaps, concave site containment, area reconciliation, lock preservation and cost quantities; include east/north/south entrance cases as those edges are supported. Test search and invalid/no-result states without fabricated geometry.
- Browser test the full upload → confirm → edit → search → compare → export → Undo sequence. Ensure the uploaded source survives dimension confirmation; decode failures never replace it. Verify full current geometry in exported JSON before and after Undo.
- Test manual irregular-lot edits and movable entrance with pointer and numeric/keyboard inputs, zoom/pan, cancel, invalid drafts and Undo/Redo. Changing site, lot, open space, entrance or assumptions invalidates dependent results. Verify all snapshots and displayed calculations match.
- Test “open space” with and without selection, as well as legacy “green space/grove” requests. Preserve the stated lock and ask for clarification when object identity is missing.
- Capture screenshots at 1440×900, 1024×768 and 375×812. Verify plan/inspector/summary visibility, usable comparison and no page overflow. Do not substitute CSS-hidden controls for accessible responsive layout.
- Report what is implemented versus staged, limitations and actual checks. Keep the existing deterministic-mode disclosure. The independent model and human-unrehearsed gates remain separate.

Do not commit, publish, or contact anyone as part of this prompt. When implementation is ready, provide the built asset ID and evidence to an independent tester.
