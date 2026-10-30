# UNBUILT v0.10 — Editable development streets

The owner authorized Feature 5: street editing. Features 1–4 remain available;
features 6–15 remain future discussion. Earlier PRDs are historical and preserved.
This increment is a preliminary orthogonal planning tool, not road engineering.

## Planner journey

Select **Streets / Circulation → Edit street network** on a generated plan.
Convert the displayed development roads into a clearly unapplied network draft.
Keep the canvas dominant and show accepted-plan → draft consequences beside it.

- Select a centreline or choose a segment in the inspector. Draw on the canvas or
  with coordinates. A diagonal pick creates a visible orthogonal bend. Enter or
  Finish street ends the stroke; Escape cancels it. Apply/Cancel separately accepts
  or discards the whole draft. Do not replace accepted work on stroke completion.
- Crossings join at grade and split into shared junctions. Drag handles, use arrow
  keys (1 m, Shift 10 m), or type endpoint coordinates. Move connected horizontal
  rows and vertical columns together to retain orthogonality. Explain possible
  entrance detachment; never silently move the accepted gate.
- Set segment widths to 6–12 m, remove segments and use draft Undo/Redo. Widths
  are planning assumptions, not adopted standards. Pointer/arrow edits snap to 1 m;
  finite typed coordinates retain decimals. Blank coordinates must not become zero.
- Start at entrance begins at the existing gate connection. Connect entrance
  proposes an inset 6 m link to the nearest street, subject to the same validation
  and review. This does not establish public or legal access.
- Show homes, street surface and works cost, retained park and land allowance
  against accepted values. Valid changes regenerate the drawing live. Invalid
  changes disable Apply, identify a correction and show proposed centrelines over
  accepted geometry. Never price invalid geometry as a valid new scheme.
- Apply creates one plan-history step. Cancel restores accepted work. Returning to
  generated routing must be a parameter preview with explicit Apply/Cancel.

## Engine contract

Store optional `planning.streetNetwork.segments`: stable ID, two local-metre
endpoints and width. Support 1–64 horizontal/vertical segments, at least 1 m long,
within the existing 0–500 m workspace. Split crossings and shared endpoints.
Reject duplicate/overlapping collinear centrelines, non-finite coordinates,
malformed data, unsupported widths and diagonal segments.

Every street must connect by centreline to the one existing entrance connection.
Full corridor rectangles must remain inside the actual site polygon and outside
Open space A and its chosen clearance. Retain an explicit boundary-edge entrance's
measured apron. Refuse unsupported geometry instead of substituting generated roads.

Generate complete rectangular lots beside the corridors. Check polygon containment,
park clearance, footprint fit and overlaps with roads, lots and apron. Preserve
compatible manual lot edits through the existing conflict review and retain
removed-home reservations. This bounded greedy layout is not a maximum-yield solver;
new streets may redistribute lot identities.

Use true polygon area and unioned road surface, counting junction overlap once.
Include the existing apron in street totals. Recalculate homes, parcel/open-space/
unallocated land, construction costs and financial outcomes from the same geometry.
Surrounding-street references remain informational; they do not become development
streets, protected areas or legal access connections.

## Persistence, alternatives and assistant

Manual networks use project **7**, decision record **8**, scenario snapshot **6**
and capability `editable-orthogonal-streets`. Earlier projects remain compatible;
older envelopes cannot silently carry newer generation inputs. Shared validation
covers imports, snapshots, search and server tools. Accepted networks survive
autosave, reload, backups/import, project copies and plan history. Survey media,
drafts and session history retain their existing persistence limits.

Search holds manual streets fixed and explores supported Spine frontage choices.
Fixed Loop cannot overwrite them; explicitly preview generated routing first.
Comparisons and server explanations measure the same network and widths. Input
changes clear stale answers/results and reject in-flight old-state responses.
No new model connection or autonomous street design is included.

## Verification and limits

Run root tests, web build/lint, street engine/server/browser checks and relevant
project, boundary, context and assistant regressions. Independently check a
120 × 100 m site: 120 × 6 m trunk = 720 m²; a 40 × 6 m T branch gives 942 m²;
an 8 m branch gives 1,016 m². Verify invalid edits, connectivity, full-width
containment, fixed park, irregular sites, history, reload and alternatives.
Inspect 1440 × 900, 1024 × 768 and 375 × 812 screenshots, actual 200% browser
zoom, keyboard alternatives and representative touch emulation.

Unsupported: curved/diagonal corridors, grade-separated crossings, turning radii,
vehicle sweeps, engineered cul-de-sacs, traffic capacity, pedestrian assessment,
multiple entrances, automatic external-street linkage, terrain/drainage and
regulatory approval. Engineering, physical-device touch, real survey/access and
human planner acceptance remain independent gates. Evidence:
`evidence/street-editing/README.md`.

## Street-editor planner review follow-up

Address the six reported street-editing concerns before starting Feature 6.
Horizontal pointer drags must preserve the junction's original Y coordinate,
including off-centre grabs and viewport changes caused by warnings. Capture the
pointer offset and projection at gesture start; show coordinates and ΔX/ΔY live.
Keep deliberate vertical movement, access validation and transaction history.

Pointer street drawing offers a visible green Join cue near existing centrelines
and junctions, with a 12 CSS-pixel snap radius independent of canvas zoom. Preserve
exact typed coordinates. A disconnected typed draft shows its measured gap and an
explicit endpoint-to-centreline repair in the draft; never silently accept it.

The editor and generator share the same first conflict diagnosis. Show full-width
proposed corridors, the offending street, the gap/protected region/affected boundary,
and the portion outside the outline. Keep accepted geometry distinct. Proposed
entrance links are orange with a callout; outline affected accepted lot footprints.
These footprints may have moved or been repartitioned, not necessarily lost homes.

Manual-street proposals must state that street geometry and widths are held and
name the exact four supported frontage choices (9, 10, 11, 12 m, Spine only). The
approved run uses that same range rather than enumerating unsupported fixed Loop.
Keep the post-run scope statement, Reject and stale-proposal protections.

At narrow widths, keep a compact selected-street/draft consequence strip directly
below the drawing, outside geometry and scale. Full review retains selected street
identity; View drawing returns to the same camera and selection. Detailed properties
remain stacked for readability. Physical-device and independent planner acceptance
remain open; no road engineering or real-model capability is introduced.
