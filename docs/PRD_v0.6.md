# UNBUILT — Product requirements v0.6

28 October 2026. This supplements v0.5 with the dynamic inspector and responsive
planning workflow. Earlier PRDs remain historical. Financial assumptions,
explicit proposal review and last-valid-plan protection still apply.

## Interaction contract

The drawing remains the main workspace. A dark contextual inspector follows
Site, Open space A, Circulation or Homes selection. Selected area and site share
come from actual polygons, road union or parcel geometry. Homes selects the
whole collection; Shift-click or Shift-Enter on individual lots aggregates their
areas. Aggregate selection cannot be reshaped as if it were a single parcel.

Frontage, lot depth and park clearance sliders update a pending layout and its
measured quantities/costs continuously. Apply parameters accepts the complete
transaction as one undo step; Cancel or Escape restores the accepted plan.
Pointer and keyboard inputs share this state. Drafts are not autosaved as
accepted geometry or sent to server measurements. Regeneration that removes
manual lot reshapes still requires the existing explicit conflict review.

A one-floor housing template has editable width/depth and a draggable corner.
All fitting home footprints use those dimensions, rotating when necessary.
Construction cost uses width × depth × modeled homes × declared Rp/m². No ADU,
roof, driveway, multiple-floor, solar or zoning model is implied. Lots that
cannot fit the template and declared setbacks are omitted. A zero-home layout
is never recommended by alternative search.

Open space A remains one rectangle. Unlocking exposes live park width/depth
controls and canvas move/resize handles. Valid pointer release applies one park
edit; numeric/range drafts offer Apply park and Cancel park. Park growth removes
impacted lots and reroutes supported Spine streets; invalid geometry remains a
correctable draft with the accepted drawing/values retained.

## Responsive geometry

New projects use responsive planning. Spine uses a bounded orthogonal visibility
graph to connect a six-metre street from the entrance around one fixed park and
its clearance. Corridor ends are tested against the actual site polygon. It can
route doglegs and up to two additional cross streets; position controls and
canvas handles use the same pending parameter transaction. Every modeled road,
lot and park must be wholly inside the site, lots must fit homes, road access
and network connectivity must validate, and land allocations must reconcile to
true site area. Remaining land and park-clearance strips are unallocated.

This is a bounded heuristic, not arbitrary subdivision or an optimal routing
claim. It does not create diagonal/curved roads, turning heads, traffic capacity,
legal access or surveyed setbacks. A feasible route may exist outside the tested
visibility coordinates; failure is reported, never replaced with outside-site
geometry. Entrance support remains a straight west/east boundary segment and a
gate wide enough for the modeled street. Holes and separate site parts remain
unsupported. Loop keeps its fixed ring: it refuses park crossings and additional
cross streets. Its lot depth/template/clearance settings are validated normally.

Valid existing-boundary drags preview regeneration before Apply. Invalid shape
or layout previews retain the accepted drawing and quantities. Drawing a new
boundary keeps the explicit close/apply workflow; assumed park and entrance
positions must be reviewed if they cannot fit the new shape.

## Locks and optimization

- Site boundary lock prevents boundary editing and rectangle replacement.
- Open-space lock fixes both shape and location and disables its direct edits.
- Buyer-price lock enforces the entered ceiling during validation/search.
  Switching it off does not change the assumed selling price. An accepted
  request to cap selling price turns the ceiling lock back on.
- Search holds boundary, park, housing template, depth, clearance and cross
  streets fixed; it tests two circulation families × four frontages. Unlocking
  a geometric object permits direct edits; it does not promise autonomous
  movement by search.

Run optimization shows a cancellable busy state and blocks canvas gestures. It
produces reviewable alternatives; it never automatically applies one. Results
and explanations bind to geometry, template, locks and assumptions. Changes
cancel pending work and clear previews/answers; restoring an old input does not
silently reopen its preview. Request → proposal → Accept and run → preview →
Apply remains available. Comparison shows two explicit plans with measured
quantities and costs.

## Compatibility and verification

Parametric projects/snapshots use version 3; decision records use version 4.
Versions 1/2 projects and snapshots and version 2/3 decision records remain
readable with their original generators. The inspector identifies a legacy plan
and offers Enable live planning as a reviewable draft. Downgrading a new project
or snapshot to an older version is refused rather than ignoring parameters.
Every setting and lock participates in persistence, undo, canonical scenario
hashes, server search/explanations, candidate rebuilds and record export/import.

Current evidence: `evidence/dynamic-inspector/README.md`. Actual browser zoom,
keyboard and emulated touch are tested separately from screenshots. Real model
configuration, physical touch, independent human task validation and visual
acceptance remain separate open gates.
