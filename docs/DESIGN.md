# UNBUILT — Adopted project design spec (v0.4, from Stitch package)

Resolves the packaged references against owner feedback and v0.35. The Stitch
screenshot (light drafting field, slate frame, violet open-space accent)
governs the starting direction. The packaged `DESIGN.md` dark canvas
(`#131313`), cyan/green accents, 9–12 px text, 20–28 px controls, 4 px
handles, and hidden scrollbars are explicitly overridden below — they lose to
the owner's readability complaint, not to taste. The two references are not
identical and this spec does not claim they are.

## Excluded consultant claims (never requirements, never rendered)

Solar hours, zoning/FAR/legal setbacks, runoff, universal 1:250 scale,
EPSG:27700 or any CRS, 142-home yield, DXF/IFC, R-3 zoning, "Deterministic:
Validated" badge, sub-50 ms deltas, 60 fps claims, "Scenario A1" saved text,
macro telemetry footer, client profile, arbitrary price locks. A technical
grid is illustrative, labeled, meters-based, and consistent with the local
Cartesian system.

## Tokens

Typography (system stacks only — no webfont downloads, no CDN):
- Primary UI 16 px, secondary labels ≥14 px, drawing labels actual screen
  size (never geometry-scaled below 14 px CSS). Tabular numerals everywhere
  metrics appear (`font-variant-numeric: tabular-nums`).
- Mono for coordinates/currency/hashes only.

Color (light drafting field, slate frame):
- `--paper: #f4f2ec` drawing field; `--ink: #1d1d1f` linework/labels;
- `--slate-900: #202328` top bar/frame; `--slate-700: #2e3238` rails;
- `--accent-open: #6d5bd0` open space (violet, from the screenshot);
- `--accent-road: #4a5560` roads; `--accent-select: #0b5fff` selection;
- `--accent-warn: #b3541e` warnings; `--accent-invalid: #8c1d18` invalid;
- `--accent-ok: #1e6f43` meets/positive. Every state also has a non-color
  cue (dash pattern, label text, or icon) — color is never the only signal.

Spacing/lineweight: 4 px base rhythm; site boundary 2.5 px, lots 1.5 px,
footprints dashed 1 px, grid hairline 0.5 px at 10 m + 1 m snap dots off.
Targets: 44×44 px primary/touch, 24 px minimum for handles/close controls.
Focus: 2 px solid outline, always visible. Contrast: ink-on-paper ≈ 15:1;
secondary text ≥ 4.5:1. Scrollbars always visible. 200% zoom: layout holds
(single column ≤900 px, no page-level horizontal scroll at 375 px).

## Structure (maps 1:1 to implemented components)

- Top bar: project + scenario state, Undo/Redo, save status, truthful model
  status (local parser / server mock / Meta + model id / unavailable reason).
- Tool rail (left, collapsible): Select (V), Pan (H). Reshape happens through
  selection (corner handles, numeric fields) — there is intentionally no
  Split/Measure/Envelope/3D/DXF control to mislead.
- Centered canvas filling available area (no fixed height cap): pan/zoom/Fit
  stable across selection, drafts, proposals, comparison, refresh. Light
  paper, subtle grid, screen-size lot numbers at centroids, dimensions on the
  selected lot, scale bar + illustrative north, validity watermarking on
  invalid plans.
- Contextual inspector (right, 300 px, collapses to a sheet ≤900 px): exactly
  one object — Site / Entrance / Open space / Circulation / Lot — with
  identity, true measurements, lock state, and supported actions. Object list
  and canvas selection mirror each other; shape/location lock semantics are
  preserved exactly (never swapped for an area-only checkbox).
- Outcomes strip (persistent, under canvas): homes, open space, road, land
  allowance, owner outcome — same-version values with deltas; details,
  assumptions, and provenance on demand in tabs.
- Assistant ("Ask about this plan"), bound to the current selection:
  expandable beside the inspector, never covering the site. Explicit state
  indicator: ready / thinking / clarifying / hypothesizing / proposing /
  reporting / unavailable (+ reason). Supported edits work without any model.
- Comparison workspace: two distinct snapshots, aligned camera, Fit both,
  whole plans visible, traceable deltas with priced-at assumptions; stale
  results blocked or regenerated, never silently shown.

## States (shared language, all objects)

Selected (blue outline + label), editing (handles), draft-valid (blue dash),
draft-invalid (red dash + reason), locked (lock tag), carried-reshape (corner
dots), conflict-listed (amber tag), stale (banner + disabled actions),
preview (ghost overlay + "changes not applied"). Invalid never resembles
valid.

## v0.5 boundary and workspace revision (27 October 2026)

Current requirements: `PRD_v0.5.md` supersedes rectangular-only site scope.
Draw site is a first-class rail/inspector action. Boundary editing is explicit:
a dashed blue or red draft over a dimmed accepted plan, screen-sized corner and
midpoint targets, a readable area, and Apply/Cancel actions beside the canvas
and in the inspector. The coordinate table provides the keyboard alternative.
Undo/Redo uses draft history until Apply, then plan history. Invalid/incomplete
area is never presented as valid; unsupported layouts are explicitly unavailable.

View controls are docked above paper at every size, keeping geometry uncovered.
Scale labels do not intercept drawing input. SVG labels use actual screen font
sizes; pattern ids are unique across comparison canvases. Violet hatching marks
open space. Dark panel buttons support the drawing instead of competing with it;
assistant text and comparison quantity labels use the same dark-panel contrast.
The background grid is an illustrative paper texture, not a surveyed grid or CRS.

At narrow widths, the tool rail remains available while properties collapse;
exactly one visible outcome strip stays beside the plan. Expanded comparison
replaces the working-plan region with two complete plans, selectors, measured
deltas and a return action. Selecting an option closes the results dock to give
its preview the working area; Show options returns to the alternatives.

Implementation evidence is not human design acceptance. The earlier paragraph
saying there is intentionally no drawing tool is superseded by this revision;
unsupported Split/Measure/Envelope/3D/export controls remain excluded.

## Dynamic inspector and live planning — v0.6 (28 October 2026)

The right panel now leads with Spatial inspector, object tabs and a four-cell
measured summary. Geometric sliders, shared housing template, contextual park
or cross-street tools and invariant checkboxes follow. The existing contextual
object editors and site source remain under Object tools & site source; request
review, the assistant and Run optimization remain accessible in the same panel.
Readability and 44 px primary targets take priority over fitting every section
into a short viewport; the panel scrolls while the drawing remains available.

Violet controls signal planning parameters, blue marks selected/editable canvas
geometry, and Live draft distinguishes previews from accepted work. Sliders and
the template corner preview continuously; explicit Apply/Cancel controls define
the transaction. Park handles remain screen-sized across zoom. Lots support
Shift-click and Shift-Enter aggregation, plus existing single-lot editing.
Responsive Spine may draw connected doglegs around a park and expose cross-street
handles. No solar, legal FAR, map coordinates or decorative telemetry is added.
The excluded-claims list above still applies.

The implementation uses the existing React state/draft/history system and shared
engine parameters, rather than introducing a separate event bus. A new project's
geometry follows the responsive generator; legacy projects retain their original
generator until the planner previews and applies conversion. See PRD v0.6 for the
bounded routing and template capability envelope.

## Current viewport and visual composition

The supplied screen reference now governs the flush, square slate shell, pale
blue-grey drawing field, narrow icon rail, floating tool palette, violet park
cross-hatching, white area callout, technical boundary dimensions, cyan entrance
tag and compact evaluator/status strips. This supersedes the earlier rounded
shell, cream field and docked-toolbar layout. The accompanying design text's dark
canvas and microscopic controls do not override the supplied image or readable
interaction targets. Icons are local SVG linework; no prototype CDN scripts or
external font dependencies are shipped.

The SVG covers the entire available drawing viewport. Camera aspect and bounds
come from its actual measured size and the real site outline. The old local
projection is retained for coordinate/edit compatibility only; it no longer
creates an inner screen rectangle or limits panning. Untouched views fit on
resize; manually adjusted views preserve their centre and scale. Fit restores
full-site framing with clearance for the floating toolbar, dimensions and scale.
The metre grid, scale and cursor readouts use that same camera transform.

The inspector uses a compact object picker and selection-specific controls.
Selecting the park leads with its width/depth and park clearance; subdivision
parameters and the shared housing template remain available in disclosures.
Request review and bounded optimization precede advanced object/source tools.
Every icon performs a supported action. Export JSON reuses the accepted-plan
record export. Layer toggles affect grid, dimensions, footprints and labels only;
these view changes never alter measured quantities. Boundary draft actions sit
in the lower viewport clearance, so they cannot intercept top-corner placement.

Short desktop panels scroll independently; mobile keeps a full-width drawing and
places the inspector below it with an explicit controls toggle. The viewport and
planning checks, source comparison and captures are in
`evidence/stitch-viewport/README.md`. Human aesthetic acceptance remains open.

## Planner-feedback interaction revision

Boundary editing leads with a before/after decision review (homes, real street
and park area, land allowance, owner outcome), then access placement and corner
controls. Display unavailable outcomes explicitly before Apply. Highlight only
the conflicting edges strongly in red, name their numbered endpoints and keep
accepted geometry available for Cancel/Undo. Number draft edges for the entrance
selector. Boundary gate markers follow the actual edge and keep screen-sized hit
areas; road aprons use the existing circulation graphics.

Site selection exposes access beside its measured summary. Park commitments say
whether they preserve exact shape/location or minimum area. Successful search
results show the bounded scope and whether allowance improves or worsens.
Assistant capacity responses identify what remains unmeasured, and comparison
text is editable and grounded in the two measured schemes. Save disclosure is
available beside the saved state. On narrow screens a selected-object area and
Inspect selection action open and focus the contextual inspector.

## Projects, blank plans and removal

Projects opens a native modal library styled with the workbench's slate shell,
purple selection and readable controls. The active name is repeated in the
context strip; Save and accepted-plan download keep the persistence scope clear.
New projects default to an empty drawing, with the fictional sample optional.
Opening another project replaces the workspace session, including its results,
drafts and history. The library itself remains independent of plan history.

Blank plans show drawing guidance directly in the full viewport and inspector.
Applying the first outline leaves a boundary-only plan; Generate layout is a
separate, explicitly assumed starter arrangement. Neither empty state displays
invented streets, park allocations or economic outcomes. Failed generation keeps
the accepted outline. Existing plans retain measured before/after boundary review.

Plan actions distinguish removal of homes, clearing a layout and clearing its
boundary. Confirm consequences before destructive changes. Removed homes leave
dashed, vacant lots; their original lot regions remain reserved through
regeneration until Restore removed homes. Keep actual home count, footprint
visibility, revenue and construction costs synchronized. Undo restores the whole
accepted plan operation. Project deletion has a separate session recovery action.
Dialogs constrain keyboard focus, Escape cancels, and closing returns focus to
an existing opener. On narrow screens the library scrolls within the viewport.

## Features 1–3 owner-feedback refinements

The boundary inspector leads with visible pointer precision and decimal-coordinate
help. Its Apply/Cancel row stays at the top of its scrolling region, and becomes
page-sticky in the narrow stacked layout. Instructions, comparisons and field
rows wrap within the inspector; keyboard focus uses a light blue outline against
the slate panel. The draft area shows up to two decimal places; comparison-strip
quantities retain their declared whole-square-metre display rounding.

Plan actions distinguish Clear layout from Delete boundary and layout. The latter
also serves the previous Start blank plan function, avoiding two identical reset
choices. Confirmations name retained project assumptions, photo visibility and
session Undo lifetime. The library provides real project downloads, browser-local
save guidance and conditional leave warnings. Draft discard and project leave are
separate decisions. Retained photos remain accessible in Site source on empty
plans; explicit photo removal affects only the reference image.

## Pointer boundary drawing within the local workspace

New boundary drawing frames the local origin inside the paper while preserving
clearance for corner handles and the lower action toolbar. Pointer placement,
vertex dragging and arrow-key movement stop at 0 and 500 m. A subtle shade marks
paper outside that supported range after fitting, zooming or panning; the nearby
precision note explains the stops. Typed decimal coordinates remain explicit
inputs and receive the existing range/geometry validation. This changes neither
the coordinate domain nor accepted plans, and introduces no map/survey claim.

## Site context and survey sources — feature 4

The Context rail action uses a local layers icon and a selected state. It opens a
single inspector for Survey reference, Boundary file, and Surroundings/access;
Back to plan returns to the normal object inspector. Inspecting a plan object
also returns there when no context draft is pending. Pending context edits stay
protected from project/mode switches and geometry gestures.

Survey preview marks A/B with a keyboard coordinate alternative. A known distance
is required, with explicit local anchor and direction fields. Draft filename/page
and accepted source/scale are distinct. The plan renders the reference through
the same metre projection, lightly showing the accepted outline over the source.
A visibility checkbox changes only presentation. Empty-plan guidance does not
cover an attached reference. PDF page selection works before calibration.

File boundaries preview units, candidate/layer, area and optional origin shift,
then enter the existing boundary review with Apply/Cancel. Street context uses
brown dashed lines; existing features and possible access use labelled markers.
Each annotation carries source and uncertainty, and remains visually distinct
from the generated development network. Neither category establishes permission
or changes measured quantities. The panel wraps/scrolls with keyboard focus and
retains the existing dark shell, light canvas and mobile stacked layout.

## Planner review: reachable actions and blocked restoration

Projects leads with a New project action that scrolls to and focuses the existing
creation form, including on narrow screens. Keep the local/private-storage warning
visible. Put the longer accepted-state and backup-exclusion explanation behind a
clearly named disclosure; keep its full content and separate-copy import behavior.

Beside a disabled Restore removed homes action, name the pending edit or preview
and its Apply/Cancel path. Associate the explanation with the control for assistive
technology. Waiting for an edit to finish does not establish a home-fit conflict;
fit remains a separate checked outcome when restoration is attempted.

Larger recovery, access-link and protected-area requests are recorded separately
in `PLANNER-REVIEW-FOLLOWUP.md`; these small changes do not implement them.

## Editable streets — Feature 5

Choose Circulation → Edit street network. Blue centrelines and constant-screen-size
junction handles sit on the light canvas. Selection strengthens the line; invalid
drafts use red dashes over accepted geometry. The inspector supplies coordinates,
widths, stroke actions, correction feedback and before/after homes, street surface/
works, retained park and land allowance. Apply/Cancel stays available while scrolling.
A canvas banner offers Review streets or Finish/Cancel stroke. Hide the passive
viewport readout during this mode so it does not sit behind those actions. No inner
viewport frame is added.

Streets are horizontal/vertical; diagonal picks form visible orthogonal bends.
Crossings join at grade. Moving a shared junction shifts connected rows/columns.
Pointer/arrow edits snap to 1 m, Shift-arrow to 10 m; typed inputs retain decimals
and blank fields never mean zero. Enter finishes a stroke; Escape cancels it.
Draft Undo/Redo precedes plan history. Apply accepts one transaction; Cancel leaves
saved work untouched. At 375 px retain the plan and compact outcome strip, using
Show controls / Review streets to reach the flowing inspector and View drawing to return. Inspector touch
targets are at least 44 px, canvas hit regions 32 px. Physical-device acceptance
remains open. Show the single-entrance, orthogonal scope and engineering limits.

### Street-review follow-up

A junction grab preserves its offset from the node centre. Its captured screen
projection prevents a warning-induced resize from changing the intended movement.
Show (X,Y), ΔX/ΔY and the effect on connected rows/columns during the gesture.
Drawing near an existing centreline shows a green Join ring and exact coordinate
before placement; pointer picks snap within 12 CSS px, typed inputs remain exact.

Full-width translucent blue corridors identify the proposed network. Red corridors
and gap/park/boundary cues identify the actual first conflict; the out-of-site part
is filled through the site mask. Accepted fallback geometry remains grey. An
explicit Join highlighted gap action repairs the draft only. Orange connector
legs have a callout; orange dashed lot footprints show accepted lots affected by
the total draft, including moving the main street. Full review explains the legend
and retained access assumptions.

Below 900 CSS px, the selected street, width, length and compact accepted → draft
homes/street quantities sit in a strip below the paper rather than over its scale.
Review streets and View drawing retain the same selection and camera. Full Apply/
Cancel and input controls remain readable in the detailed inspector below.

## Feature 6 — Contextual blocks and lots

Keep the plan as the workspace. Selecting a lot exposes Split lot, Merge lots,
Subdivide block and Edit lot outline in the inspector. A dedicated lot-plan draft
shows source selection, cut direction, count/ratio and explicit vacancy choice.
Preview returns attention to the measured accepted → proposed review. Apply/Cancel
remain sticky; changed inputs require another Preview. Native multiple selection
and ordinary fields provide keyboard and touch alternatives.

Use a dashed blue source extent and the existing added/ghost lot styling. Invalid
proposed child rectangles appear red over accepted geometry. A compact plan banner
links to the review and carries proposed lot/home counts; passive viewport readouts
are hidden during this mode to avoid overlapping it. At narrow widths, the banner
flows below the paper. Preserve camera and draft through the review/drawing round
trip. Do not add an inner viewport frame.

Polygon outline controls keep their placed-home/setback limitations visible.
Make Apply/Cancel sticky, expose draft area and history, and allow focused corner
arrows/Delete in addition to coordinate fields and pointer gestures. A drag keeps
its pointer offset through the original canvas transform. Clearly distinguish
changing a lot partition from removing a home, and a vacant lot from a counted home.

## Housing mix — Feature 7

Select home lots to reveal the compact Housing mix summary and Edit housing mix.
The editor replaces the inspector during a draft; it does not expand permanently
beside the plan. Use the existing dark shell, sticky Apply/Cancel, light drawing
surface and measured before/after cards. Named templates have stable T-codes and
muted footprint colors, matched by a schedule and selected-lot text, so color is not
the sole identifier. Native multiple selection and a connected-block picker support
batch assignments with keyboard/touch alternatives.

Preview template edits before applying. Assignment previews bring the measured
comparison into view. Missing fit is highlighted over the accepted plan, with an
unavailable-proposed-metrics label. The drawing/review banner retains the draft and
viewport on narrow screens. Library fields must not let unpreviewed values slip
through Apply. Source lot occupancy, reference transitions and resulting-template
inheritance accompany lot-operation review. Provisional allowances and the existing
unverified polygon setbacks travel beside affected figures/selection.

## Housing-mix review refinements

Recovery must stay beside the action. A restoration conflict panel names the vacant
lot and reserved template and links directly to its reassignment or outline editor.
It remains visible until the accepted fit is repaired; the status strip is secondary.

Default changes have a compact pre-preview impact summary and per-lot provenance.
Use “Explicit” and “Follows default” in the target selector/readout even when names
match. Keep the longer before/after trace expandable. Returning to generated lots
opens this review directly and explains the two separate approvals and cancellation
outcomes. The template library remains reusable.

On narrow screens, keep a selected-template text readout and expandable design key
immediately after the drawing, ahead of review navigation. Identify home designs by
code/name/area/count rather than color alone. Cost assumptions expand inside the
housing comparison, with exact monetary differences and provisional pricing labels.

## Feature 8 — Open-space collection

The inspector exposes a compact named schedule and **Edit open spaces**. Editing
uses an explicit draft with an accepted/proposed comparison; the canvas remains
the main work surface. A boundary-only study can reserve spaces before generating
homes. Parks use lavender, pockets pale green and corridors mint, with readable
names and true area labels so color is not the sole identifier. Selected outlines
show accessible corner handles and a dashed conservative routing extent.

Draw an outline, enter a rectangle, or construct a straight corridor from endpoints
and width. Coordinates, arrow keys, add/remove corner and Finish outline provide
keyboard alternatives. Freeze the SVG-to-screen projection for each drag and
retain the initial grab offset. On mobile the drawing banner carries draft status,
selected-space readout and a direct review action; switching to review preserves
the same canvas viewport. Apply/Cancel remain explicit and readable.

An unlocked feature can be edited directly; all features remain held during
search. Shape/location locks differ from individual and combined minimum areas.
True polygons determine areas and green works. Whole lots and orthogonal streets
avoid bounding extents plus clearance; extra excluded land remains unallocated.
The editor discloses this scope and the lack of path/ecology/compliance verification.
See `docs/PRD_v0.13.md` for the current requirements and persisted-data contract.

## Feasibility experiments — 29 October 2026

The inspector exposes Feasibility experiments beside Assumptions. A native modal
review holds a frozen accepted baseline beside a trial, retaining the existing
plan drawing and camera controls. Design inputs and eight cost assumptions are
explicit; manual lot work disables design regeneration while allowing cost tests.
Before/trial/change figures and sequential cost attribution support review.
Apply commits one history step; Cancel/Close/Escape retain accepted work. Narrow
layouts stack controls and drawings; monetary tables scroll within their region,
while the Apply/Cancel footer remains reachable. Held price and market uncertainty
remain visible. See PRD v0.14 and feasibility evidence for scope and verification.

## Saved alternatives — owner Feature 10

Alternatives in the workspace navigation opens the project's saved scheme review;
the inspector and blank-plan setup also expose Saved alternatives. Independent
named inputs and notes sit beside two real drawings and measured comparison.
Each scheme uses its own geometry and financial assumptions. Reopening explicitly
reviews the working plan against the snapshot, then replaces working inputs in
one undoable step. Metadata and collection edits do not rewrite plan history.
Native modal focus, reachable close/reopen controls, stacked narrow drawings and
contained table scrolling preserve the established review behavior. Notes remain
plain multiline text with explicit Save/Cancel. See PRD v0.15.

## Feature 11 — AI investigations and administration

The planning assistant separates AI investigation from local measured tools. A selection-bound intention yields a clarifying question, known limitation, measured finding selection or explicit hypothetical trial. Inputs are reviewable before Run; measured results precede the existing two-drawing feasibility review; Apply is the single history boundary. Discard, cancellation and stale-response rejection retain the accepted plan.

AI settings is a native modal outside project data. Administrator credentials and replacement key drafts are ephemeral; primary/alternate routes and write-only saved keys live on the server. Unsaved routing is guarded, focus returns to the opener and the modal reflows at narrow width and real browser zoom. Availability distinguishes unconfigured, untested and a verified tool response without claiming verified feasibility.

## Feature 12 — development study review

Terrain, drainage and phasing opens a native draft review beside existing feasibility tools and from blank/boundary-only setup. Three study views share the frozen plan context, a viewport-fitted screening map, accepted-versus-draft results and explicit Apply/Cancel. No project inputs are supplied on open. Source metadata, applicability declarations, numerical entry and example choices remain visible. Phase assignment supports map selection and an accessible lot table, with a named color key and screen-sized focus/text.

Results distinguish quantities from declared assumptions and verified design. Terrain coverage gaps, inapplicable peak methods and stale/unassigned phase references withhold their calculations while preserving entered data. Source snapshots survive history, project lifecycle, portable files and saved alternatives; comparisons expose each side's independent sources/assumptions. Additional civil budgets still require the existing separate cost review.
