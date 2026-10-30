# UNBUILT v0.11 — Blocks and lots

Feature 6 is authorized: subdivide blocks; split, merge and reshape lots. Preserve
Features 1–5 and the street-review corrections. Features 7–15 are outside this
increment. Earlier PRDs remain historical. This is preliminary site planning, not
an approved cadastral subdivision or road-access assessment.

## Planner workflow

Select a lot on the drawing or choose All home lots. **Blocks & lots** appears in
the contextual inspector, with Split lot, Merge lots, Subdivide block and Edit lot
outline. Shift-selection on the plan supplies several source lots. The accepted
scheme remains unchanged while the planner explores an operation.

- Split a rectangular lot with a vertical or horizontal cut and a supplied first
  lot percentage. Both resulting lots must have dimensions of at least 1 m.
- Merge two or more adjacent rectangular lots only when their complete union is
  one rectangle. Refuse disconnected selections, road gaps, holes, overlaps and
  genuinely reshaped polygon sources; never fill a bounding rectangle implicitly.
- Identify connected groups of existing lots as blocks. Show their lot count and
  bounds, distinguishing nonrectangular groups. Choose a rectangular group or
  rectangular subset, cut direction and 2–100 equal lots. Subdivision preserves
  the full selected area without leftover slivers. This increment does not reserve
  a new block drawn in unallocated land or define legal block boundaries.
- Existing polygon reshaping remains available after split/merge/subdivision:
  drag corners, use keyboard arrows or coordinate inputs, add/remove corners up
  to the existing 12-vertex limit. Preserve the placed home on occupied lots,
  true polygon area, minimum verified setbacks, road frontage and neighbor checks.
  Make Apply/Cancel sticky and give reshape drafts local Undo/Redo. One pointer
  gesture is one draft history step; pointer offset/projection stays fixed.
- Explicitly Preview the chosen split/merge/subdivision. Show proposed lots on the
  canvas and accepted → proposed lots, homes, lot area and land allowance. Streets
  and open-space areas remain visible and held. Invalid proposed rectangles stay
  visible over the accepted plan, with an actionable error and disabled Apply.
  Changing operation inputs invalidates the prior preview approval.
- Occupied resulting lots must fit the current shared home template/setbacks.
  Offer an explicit **Create resulting lots as vacant** choice for small parcels.
  Vacant lots contribute lot area but no home count, home revenue or construction
  cost. Road frontage is still required. Existing removed-home reservations stay
  conservative through merges/splits: no silent resurrection of removed homes.
- Apply commits the entire transaction as one plan-history step. Cancel keeps the
  accepted plan. Plan Undo/Redo, local autosave, reopen and portable backups retain
  exact geometry and compatible polygon outlines.

## Geometry and data contract

Use optional `planning.lotPlan: Rect[]` as the saved manual partition, bounded at
500 lots. Rectangles have finite local metre coordinates inside 0–500 m and minimum
1 m width/depth. Empty arrays explicitly represent no lots while retaining the
supported road/park layout. Do not confuse this with a boundary-only empty plan.
Stable rectangle keys continue to carry existing polygon outlines. Blocks are
computed from current edge-adjacent lots, not a second competing plan store.

Generators retain the actual roads, entrance apron and park, then validate the
manual lot partition instead of regenerating it. Check complete containment in
the actual site polygon, lot overlaps, road/park/clearance/apron intersections,
frontage and occupied-home fit. Preserve true polygon area for subsequent reshapes.
Road union area and the site/parcel/open-space/unallocated budget remain consistent.
A merged occupied lot models one home; this may reduce home count and allowance.
Profile applicability warnings remain visible; larger/smaller lots do not acquire
unsupported price evidence simply because their geometry is valid.

Street, park, entrance or boundary changes hold manual lots. Block conflicting
layout application, highlight held-lot/street conflicts, or retain the existing
honest unassessed-boundary workflow. Never silently clip or repartition saved lots.
Clear/delete layout removes its manual partition; Undo restores it. Existing site
context keeps its independent persistence and reference-only semantics.

## Search, assistant and compatibility

Frontage search cannot meaningfully repartition held manual lots. Disable that
search, explain the limitation before approval and in tool results, and direct the
planner to a direct edit or an explicit generated-lot preview. Returning to generated
lots uses Apply/Cancel and existing review before discarding incompatible polygon
work. Do not display identical held partitions as different frontage alternatives.
Read-only measured facts and tools use the actual saved partition. Refuse an
inapplicable frontage comparison against a held lot plan. Input changes retain the
existing stale-answer/proposal protections. No new real model connection is added.

Manual lot plans use project **v8**, decision record **v9**, scenario snapshot **v7**
and capability `manual-rectangular-lots`. Accept older supported formats unchanged;
refuse manual geometry hidden inside an older envelope. Include the partition in
canonical hashes, plan history, autosave, JSON backups/import and server validation.
Original media, session history, drafts and unaccepted alternatives retain their
existing persistence limits.

## Verification and scope limits

Independently verify the sample: merging adjacent 200 m² lots creates one 400 m²
lot (20→19 homes), splitting it restores two fitting lots (19→20), and repartitioning
the 2,400 m² south block into ten lots gives 18 homes total. Total lot area stays
4,000 m², roads 720 m² and park 480 m². Splitting a standard lot into two 100 m²
vacant lots gives 21 lots and 19 homes; occupied small lots must be blocked.

Test invalid sources/cuts, frontage, home fit, vacancies, polygon reshaping,
Apply/Cancel, history, save/reload/import, street conflicts, generated restoration,
actual irregular-site containment, truthful assistant/search scope and input
staleness. Run root tests, web build/lint, browser regressions, desktop/laptop/mobile
visual inspection, actual 200% browser zoom and representative touch emulation.

This increment supports rectangular split/merge/block subdivision plus the existing
simple polygon reshape. Polygon boolean split/union, nonrectangular block clipping,
new block drawing in unallocated land, holes, curves, independent home placement,
multi-home lots, housing mix and saved scenario comparison remain outside scope.
Full 3 m front/rear setbacks on reshaped polygons are not verified; the existing
placed-home plus 2 m ring rule remains labelled. Legal frontage, approval, traffic,
turning, survey accuracy, physical-device and independent human acceptance remain
open. Evidence: `evidence/blocks-and-lots/README.md`.
