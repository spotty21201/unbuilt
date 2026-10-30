# UNBUILT v0.9 — Site context and source imports

Feature **4** was approved by the owner on 28 October 2026. Their latest format
preference makes DXF or PDF essential; PNG/JPEG and CSV are also supported.
Features 1–3 remain implemented for review. Features **5–15 remain discussion
items** and are not authorized by this milestone. Earlier PRDs remain historical.

## Planner workflow

Open **Context** in the tool rail, or **Site context & survey** from the inspector.
A survey/reference workflow must work on both blank and developed projects and
must keep the plan canvas dominant. Reference work must not silently replace
accepted geometry, grant access, reserve land or alter feasibility numbers.

### Survey reference

- Read a PDF page, PNG or JPEG locally, with explicit error messages and bounded
  input/render sizes. PDF page selection works before accepting any calibration.
  A failed or cancelled replacement retains the current accepted reference.
- In the preview, choose A/B or enter pixel coordinates. Require a supplied known
  separation in metres. Set A's local location and A→B direction, with 0° east
  and 90° north. Apply commits a uniform scale/rotation; Cancel preserves accepted
  calibration. The image then uses the same local-metre projection as the plan.
- Display the source name/page, declared scale and location, and distinguish draft
  calibration from accepted information. Visibility is a presentation choice.
  Calibration does not correct perspective, certify survey accuracy or define CRS.
- Save calibration and source identity with the project. Media bytes remain
  session-only: keep and reattach the original file after switching/reopening.
  The same file/page restores its calibration; another file requires a new one.
  Warn before ending a session containing attached media. Backups must state
  explicitly that media bytes are excluded.

### Boundary import

- CSV accepts ordered x,y or easting,northing pairs, optional header, comma/tab/
  semicolon separators and an optional repeated closing point.
- ASCII DXF accepts straight, closed model-space LWPOLYLINE and 2D POLYLINE.
  Preserve separate candidates and require selection where several exist. Report
  omitted unsupported polylines. No flattening of curved/3D entities or implicit
  adoption of block, paper-space or hole geometry.
- Declare file units (metres, millimetres or international feet); DXF metadata is
  a suggestion to review. Optionally translate survey coordinates to local (0,0),
  preserving scale/angles and recording the original origin in metres. No CRS
  transformation is performed. Resulting outlines must meet the existing simple
  3–64 vertex, 0–500 m and minimum-area validation rules.
- Preview source, units, outline and true area, then use the existing boundary
  draft and consequence review. Apply commits geometry and source together as one
  plan history step; Cancel leaves accepted work untouched. Respect boundary locks
  and existing review of incompatible manual lot edits.

### Surroundings and access

- Add a surrounding-street polyline (2–20 points), an existing-feature marker or
  an access-assumption marker. Locate by canvas clicks or coordinate fields.
- Require a label and source/basis. Record assumed/unverified versus documented
  in the supplied source. Neither status verifies legal/public access.
- Render labelled reference graphics distinct from generated development streets.
  They do not generate road connections, reserve a building footprint, constrain
  the solver or change measured land/economic totals.
- Edit/remove with plan Undo/Redo. Save up to 100 annotations per project, including
  points, labels, source, notes and uncertainty. Context coordinates may extend
  beyond the site (−500 to 1,000 m). These references survive plan reset; users must
  review alignment after changing the site's local position.
- Pending context edits must be finished/cancelled before switching projects or
  plan editing modes. A locked boundary still permits reference work.

## Persistence and compatibility

Project **version 6** and decision-record **version 7** carry optional `siteContext`.
Older projects remain compatible; older envelopes may not silently contain these
fields. Context metadata uses strict validation and rejects media payload or executable
resource-URL fields. Sources may contain user-supplied citation text. Accepted context travels through autosave, portable project and
record backups, import as a separate project, and plan history. Original media,
drafts and history remain outside durable project state.

Scenario snapshots remain version 5 because this increment adds reference
information, not generation inputs. The deterministic assistant/server do not
interpret reference notes or derive quantities from survey pixels. No real model
connection is added.

## Checks and scope limits

Verify known-distance alignment; rectangular and irregular imports; units and
origin translation; invalid/unsupported files; Apply/Cancel/history; reload,
reattachment, independent import/projects and failed-save backups; accessible
inputs, desktop/mobile layouts and actual browser zoom. Run existing project,
geometry, planning and viewport regressions. Evidence and exact supported limits:
`evidence/site-context/README.md`.

No DWG, general CAD viewer, curved/hole/multi-part boundary model, GeoJSON/CRS
conversion, automatic PDF tracing/OCR, terrain/drainage, development street editing
or verified access/legal/survey analysis is included. Physical-device and owner
workflow/aesthetic acceptance remain independent checks.
