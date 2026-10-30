# UNBUILT v0.12 — Housing mix and lot-review clarity

Feature 7 is authorized after the Feature 6 planner-review concerns are addressed.
Earlier PRDs remain historical. Feature 8 and later are outside this increment.

## Feature 6 follow-up requirements

- Identify inaccessible proposed lots with one-based references and highlight them
  on the drawing. Explain missing street frontage and keep Apply blocked.
- Show source lot occupancy, resulting vacancy and the occupied homes a merge will
  remove. Never restore a removed home through repartitioning.
- Trace accepted-to-proposed numbers during lot review, including unchanged geometry.
  These are planning references, not stable cadastral identifiers.
- Keep provisional pricing beside allowances and unverified deeper polygon setbacks
  beside selected-lot metrics. Preserve measured values and inspectable assumptions.
- Carry the invalid-draft reason into the mobile drawing/review handoff; preserve
  selection, draft geometry and viewport rather than refitting on every transition.
- Retain irregular block definition and subdivision as future discovery. The current
  rectangular partition and polygon-reshape protections stay in place. A later
  increment needs an independently checkable nonrectangular block example, full
  containment/frontage/home-fit checks and explicit consequence review.

## Feature 7 planner workflow

Select home lots and choose **Edit housing mix**. Open a dedicated inspector draft
canvas workflow, not a permanently expanded library. A blank/boundary-only study
can manage its library before generating a layout.

1. Create, name, edit and delete reusable home templates. Retain the existing
   one-storey, rotatable rectangular footprint model: width and depth 4–16 m,
   at most 20 uniquely named templates. Do not invent bedrooms, multi-storey area,
   multiple homes per lot, market prices or engineering approval.
2. Start the library from the accepted legacy width/depth. Merely opening or
   cancelling the editor must not change accepted geometry or costs.
3. Choose a default template for unassigned lots. Assign another template to one
   lot, a native multiple selection, an edge-connected block or all lots. Show
   exact target references and currently assigned names. Vacant lots can reserve
   a template but remain vacant until the existing explicit home-restoration action.
4. Hold the current parcel partition while editing or applying a mix. Use exact
   base-rectangle identities, not array indices, for saved assignments. A reshape
   retains its base identity. Show template codes and colors on footprints and a
   matching schedule/readout; labels must have a non-color equivalent.
5. Preview template edits and assignments. Show accepted/proposed home count, total
   built area, home construction cost and land allowance before Apply. Invalid or
   unpreviewed form fields block Apply. Existing lots, roads, park and selling price
   stay fixed. Fit errors identify affected lots and highlight rectangular fit
   conflicts over the accepted plan. Last-valid figures remain explicitly marked.
6. Reuse placement, rotation and rectangular setbacks for the assigned template.
   Existing polygon outlines must retain that template's placed footprint and 2 m
   ring. Deeper 3 m front/rear polygon setbacks remain unverified and labelled.
7. Apply the library and assignments as one accepted-plan Undo/Redo step. Cancel
   retains the entire accepted library, partition, vacancy and cost assumptions.
   A template used as default or by explicit assignments cannot be deleted until
   the planner reassigns it. No silent fallback to a deleted template.
8. Sum each occupied template's width × depth for built area and construction.
   Do not multiply all homes by the default's area. Show counts and built area per
   template, total homes, vacant lots and total built area. Unused templates count
   zero. This increment keeps one shared selling-price assumption and construction
   rate; pricing remains provisional, not template-specific market evidence.

## Interaction with other planning work

Manual lot plans remain held during streets, park, entrance and boundary edits;
conflicting applications are blocked. Rectangular split/subdivision children inherit
one common source template. A merge of differing templates uses the chosen default,
with the result and rule disclosed in the lot review before Apply. Compatible exact
lot identities retain assignments. No stale references may be silently ignored.

Returning to generated lots requires clearing explicit lot assignments through the
reviewed Housing mix action first. Keep the reusable library. Existing generated-lot
preview/Apply/Cancel then applies. This scope does not automatically optimize a mix
or vary lot frontage while holding lot-specific assignments. Search must state its
actual held geometry and reject misleading alternatives.

Clear/delete layout removes assignments to the deleted parcels and keeps the library
with project assumptions. Undo restores the full mix. New dimensions clear the old
assignments too. Boundary-only library editing provides a recovery path if the chosen
default cannot fit a subsequently generated layout.

## Data and deterministic integration

Optional `planning.housing` contains `{templates, defaultId, assignments}`. Each
template has `{id, name, width, depth}`. Each assignment key is the exact base
rectangle `x,y,w,h`, and its value references an existing template ID. Validate
names, IDs, dimensions, limits, rectangle keys and all references at trust boundaries.
Geometry assessment refuses orphan assignments. The legacy shared-template fields
remain compatible for older plans and are used when no housing library exists.

Persist mixed plans in project **v9**, decision record **v10**, scenario snapshot
**v8** with capability `housing-mix`. Older supported formats remain readable; older
envelopes must refuse hidden housing data. Hash templates and assignments, include
all in backups/import and apply the same validation on the server. Measured
explanations use actual template counts, total built area and costs. Existing input
staleness and delayed-response protections apply to library and assignment changes.
No real model connection is added or implied.

## Acceptance examples and limits

On the unchanged 20-home sample with 60 m² homes:

- Assign one 8 × 6 m Courtyard home: 19 × 60 + 48 = **1,188 m²**, 20 homes;
  construction at the existing Rp5m/m² becomes **Rp5.94bn**. Roads/park/lot areas
  and assumed revenue are unchanged. With existing 5% contingency, allowance rises
  Rp63m; this is a measured cost difference, not new evidence of achievable price.
- Assign twelve 6 × 6 m Garden homes to the south block: 12 × 36 + 8 × 60 =
  **912 m²**, retaining 20 homes and all infrastructure.
- A vacant lot assigned Courtyard contributes no built area or revenue. If it is
  the sole Courtyard reservation, the remaining nineteen homes total **1,140 m²**.
- A 16 × 16 m assignment that cannot fit blocks Apply and retains the accepted plan.

Test creation/edit/deletion, default changes, individual/block/all assignments,
vacancy, invalid fit/recovery, polygons, lot inheritance, costs, history, save/reload,
backup/import, clear-layout recovery, server measurements, search scope and stale
responses. Run root tests, build/lint, existing inspector/street/lot browser checks,
responsive screenshots, actual 200% browser zoom and touch emulation.

Physical devices, independent planner acceptance, survey/access/legal/engineering
review and real-model verification remain separate open gates. See
`evidence/lot-review-followup/` and `evidence/housing-mix/` for evidence and tester prompts.

## Housing-mix planner review follow-up

- Restoration failures must remain readable beside Restore removed homes, naming
  the vacant lot, reserved design and dimensions. Provide direct reassignment and
  outline-edit routes; only explicit restoration after a valid repair adds a home.
- Preview generated lots opens the default-assignment prerequisite review directly.
  Identify released explicit assignments and preserve the library. First approval
  saves default-following assignments and opens a separate generated-lot preview;
  its second approval replaces the lot partition. Cancel before the first approval
  retains the original mix. Cancel after it keeps the approved defaults; Undo can
  restore the earlier mix. Disclose these two stages in the review itself.
- Distinguish explicit assignments from default-following lots in target options,
  selected-lot text and before/after review. Assigning the current default explicitly
  fixes that template ID too. Separate actions release selected/all lots to follow
  the default. Before previewing a default change, identify affected inherited lots
  and held explicit assignments. Preserve common explicit source assignments during
  subdivision, including an assignment equal to the default.
- At narrow sizes, place a text-based selected-template readout and expandable home
  design legend next to the drawing. Codes, names, per-home areas and counts must
  identify the mix without color. Preserve the draft and zoom during review.
- Housing review exposes the actual shared selling price, construction rate and
  physical-works contingency. Show measured construction/contingency/allowance
  differences separately from unverified market assumptions. Use deterministic
  arithmetic, without implying a new model connection or verified sale price.
