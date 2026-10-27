# UNBUILT — Product requirements v0.5

27 October 2026. This supplements v0.4 and replaces its rectangular-site-only
contract and deferral of AC-40. Earlier PRD versions remain historical.
Financial, assumption, lock, proposal and provenance contracts continue.

## Site geometry

The accepted site is one closed simple polygon, 3–64 ordered vertices, without
holes or separate parts. Coordinates are local Cartesian metres, x east and y
north, between 0 and 500 m; minimum area is 1 m². Both windings are accepted.
The closing edge is implicit; do not repeat the first vertex. Coordinate extents
w/h are the greatest x/y values from the existing local origin, not site area.
Area comes from the polygon shoelace formula. Self contact, crossings, adjacent
backtracking, repeated vertices and non-finite coordinates are refused.

Existing rectangular projects retain their implicit four-vertex outline.
Drawing a new site proposes new default entrance/open space; editing the existing
boundary keeps these objects in their existing coordinates. There is no automatic
georeferencing, image calibration, coordinate translation or moving of homes.

## Drawing and editing

- Draw site: place vertices on the canvas; click the first vertex, choose Close
  outline/Close boundary, or press Enter on the canvas to close it.
- Edit boundary: drag vertices, use midpoint + targets to insert a vertex,
  delete a focused vertex, or use the coordinate table and Add/Remove actions.
  Pointer coordinates snap to whole metres; typed coordinates retain precision.
- Arrow keys move a focused vertex 1 m; Shift+Arrow moves 10 m. Every handle has
  a screen-sized target; focus and invalid outlines have explicit visual states.
- Undo/Redo operates within an open draft (a drag is one step). Apply records one
  complete plan Undo step. Cancel/Escape discards the draft. Invalid drafts show
  reasons and cannot replace the accepted plan or its saved data.
- Area updates for valid closed drafts. Incomplete/invalid drafts do not display
  their shoelace result as a valid area. Plan quantities remain accepted until
  Apply. Apply revalidates retained manual lots; incompatible removed lots use
  the existing explicit preserve/discard review.

## Supported layout envelope

Imported and generated lot frontage must be finite and between 1 and 500 m;
invalid values must not start unbounded subdivision.

Irregular boundaries are normal editable site geometry. Road routing remains
bounded to the existing axis-aligned spine and loop families. Generation:

1. Validates the polygon and complete entrance span. Entrance is still limited
   to a straight west/east segment at x=0 or x=w; arbitrary sloping, north/south
   entrances are unavailable. A gate crossing a missing segment is refused.
2. Requires every road rectangle and the entire reserved open-space rectangle
   to be inside the polygon, including concave edge cases.
3. Keeps only whole generated rectangular lots inside the polygon. Edge lots
   are omitted, rather than clipped into unverified parcels. Existing footprint,
   setback, access, overlap and manual-lot validations continue.
4. Uses actual parcel/road/open-space areas. Unallocated remainder equals true
   polygon area minus parcels, unioned roads and green. It is not designed green.

Convex and concave outlines can work when these conditions hold. If the road
network or green cannot fit, save the boundary but label the layout unavailable:
no roads/lots are drawn as valid, economics are withheld, search cannot return
that layout as a qualifying candidate, and server explanations refuse it with
422. The planner can change family, repair open space or reshape the boundary.
This is contained use of existing generators, not arbitrary polygon road routing.

## Versions and downstream behavior

Boundary geometry is included in Undo/Redo, scenario hashes, search snapshots,
comparison canvases, autosave, JSON exports/imports and server requests. A changed
boundary invalidates previous searches, previews, proposals and assistant answers.
New boundary edits also invalidate in-flight assistant answers.

Polygon autosaves use project version 2 and polygon server snapshots version 2;
legacy rectangular version 1 remains readable. Polygon decision records use
export version 3; existing rectangular version 2 records remain readable. Older
builds refuse the newer formats instead of silently regenerating a rectangle.
Photos, draft state, histories, searches and comparisons remain session-only.

## Workspace

Compact dark shell, light drafting field, Select/Pan/Draw site rail, docked view
controls, contextual boundary/object inspector, violet green-space linework and
one visible compact outcome strip. Mobile outcomes sit next to the plan.
Selecting an alternative returns attention to its full plan; Show options reopens
results. Expanded comparison gives two whole plans their own workspace and a
return control. Assistant and measurements use readable contrast on dark panels.
No unsupported planning quantities or file formats are introduced.

## Verification and open gates

See `evidence/polygon-workbench/README.md`, executable boundary/browser tests,
and the current acceptance matrix. Verify actual browser zoom independently
from viewport emulation. Touch automation is evidence of Chromium touch-event
behavior, not proof on a physical device. Real model integration, an unrehearsed
human planning task, aesthetic acceptance and milestone sign-off remain separate
open gates. A deterministic server explanation is not a model response.
