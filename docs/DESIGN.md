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
