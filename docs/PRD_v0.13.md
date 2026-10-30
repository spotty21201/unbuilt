# UNBUILT v0.13 — Multiple open spaces

Feature 8 adds named parks, pocket spaces and green corridors. Earlier PRDs remain
historical. Feature 9 and later are outside this increment. The housing-review
retest prompt remains at `evidence/housing-review-followup/TESTER-PROMPT.md`.

## Planner workflow

Choose **Edit open spaces** in the inspector, or **Design open spaces** on a
boundary-only project. The original park migrates into the draft without changing
the accepted project. Cancel keeps the original data and plan.

- Create, name, select and delete up to twelve spaces. Choose Park, Pocket space or
  Green corridor. Each outline has three to twenty-four vertices, at least 1 m²,
  finite local coordinates within 0–500 m, and must be inside the actual site.
- Draw corners on the plan; click the first corner or Finish outline to close.
  Rectangle entry and a straight corridor from endpoints plus width are explicit
  alternatives. The latter starts as a rotated rectangular outline; later edits
  do not guarantee a constant corridor width.
- Drag corners with an offset-preserving pointer gesture, use arrow keys (Shift
  for 10 m), enter coordinates, add a corner to the longest edge or remove one.
  Numeric entry provides a keyboard alternative to point placement. Escape
  cancels the whole open-space draft. Draft Undo/Redo and plan Undo/Redo remain
  distinct. A completed pointer gesture is one draft history step.
- Show each true polygon area and combined total. Validate self-crossing,
  repeated/zero edges, containment, unique names/IDs and inter-space overlap.
  Spaces may share an edge; positive-area overlaps are blocked to avoid duplicate
  green quantities. Highlight conflicting outline segments. Invalid edits keep
  the accepted plan and disable Apply.
- Protect individual shape/location and minimum area. An explicit unlock allows
  a direct geometry edit or deletion. A combined minimum protects neighborhood
  green area. Every space stays fixed during bounded alternative search,
  including those unlocked for direct editing.
- Review accepted → proposed green area, homes, street surface, green works and
  provisional land allowance before Apply. Display the shared illustrative
  green-works rate. Cancel leaves the accepted plan unchanged; Apply is undoable.
- Save/reload and portable backup/import retain accepted outlines, names, types,
  protections and minima. Draft/history/search/session-media exclusions remain
  explicit. Clear layout/delete boundary remove all designed green spaces;
  plan Undo restores them. Creating a replacement rectangular site resets them.

## Geometry and layout contract

True polygon area, never the bounding box, contributes to green quantity and
cost. Area reconciliation leaves all other land explicitly unallocated. Current
routing and lot generation remain orthogonal: they conservatively avoid every
space's bounding extent plus the shared routing clearance. Show that extent
on selected draft geometry and disclose that extra excluded land is unallocated,
not park area. Reject unsupported routing instead of claiming a usable scheme.
Spine can route around several obstacles. Loop retains its fixed ring and is
unavailable if that ring conflicts with a space.

Manual streets, manual lots, polygon lot edits, removed-home reservations and
housing assignments retain their protections. A proposed space that conflicts
with held geometry must not silently remove or reassign it. Require a separate
reviewed change or cancel the open-space draft. Generated whole lots and roads
may change, and their consequences must be visible before approval.

Green corridors are land reservations, not a verified path network, ecological
connection, drainage design or continuous-width standard. Holes, curved edges,
arbitrary street routing, planting schedules and statutory green-compliance
claims remain unsupported. No solar, zoning, FAR or legal-access claims are added.

## Compatibility and assistance

Optional `planning.openSpaces` is canonical when present, including `[]` for no
spaces. Its absence keeps the legacy single rectangular park workflow unchanged.
The legacy `green` rectangle remains a compatibility reference, not another
allocation. New data uses project v10, decision record v11 and snapshot v9 with
`multiple-open-spaces`. Older envelopes must refuse hidden new data.

Search, comparison and measured explanations use the same accepted collection
and true aggregate quantities. Proposal scope holds every named outline. A green
lock request must identify the selected feature; do not guess among multiple
spaces. Material input changes invalidate results and answers. No real model is
claimed or added in this increment. AI could later explain measured trade-offs
or prepare a reviewable investigation; it must not invent compliance or change
geometry without planner approval.

## Verification

Cover validation, concave and rotated area, overlap, actual-site containment,
minima, conservative exclusion, held-lot conflicts, costing, empty collection,
legacy migration, project/record/snapshot envelopes, bounded alternatives and
starter generation. Exercise browser drawing, selection, dragging, keyboard,
invalid repair, lock, review, Apply/Cancel, history and persistence. Inspect
1440×900, 1024×768, 375×812 and actual 200% browser zoom. Keep human planner,
physical-device, survey/access, legal and engineering gates open.
