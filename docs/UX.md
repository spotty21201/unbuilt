# UNBUILT — Interaction Spec (Designer, T11)

Current boundary and workspace contract: `PRD_v0.5.md` and the v0.5 revision in `DESIGN.md`. Earlier rectangular-only and floating-toolbar descriptions below are preserved as design history and are superseded for this workflow.

Source of truth for UI behavior. Implements PRD v0.2 §6 (UX), honors §7–9
contracts, §10 tool path, §11 state model, §12–13 acceptance/failures, and
BUILD_PLAN frozen contracts. This spec governs Coder implementation and Tester
browser verification.

Conventions: MUST = blocking requirement. All quantities in meters / Rp base
units; display rounding never affects qualification. Fictional sample data is
always labeled fictional.

## 1. Principles

1. Site-first, task-led: recognizable site → explicit commitments → tested
   alternatives with consequences. Never chat-first or spreadsheet-first.
2. Commitments are explicit and locked: the UI shows what is locked, what may
   change, and what was tested. No silent mutation of locks (§6, AC-19).
3. Preview ≠ commit: selecting a result previews exact geometry + metrics;
   only Apply commits, preserving the previous version (§6 Stage 5, AC-23/24).
4. Honest states: no-result, unsupported, incomplete, stale, and
   model-unavailable states are first-class UI, never faked success (§6, §13).
5. Pointer, keyboard, and numeric paths are equivalent: same parameter edited
   by drag, keypress, or typed value MUST yield identical geometry and metrics
   (AC-10).
6. Product language in UI; schema names, tool names, and logs stay in devtools.

## 2. Global layout (desktop-first, 1024px)

Regions, in visual priority order:

1. **Canvas** (dominant, center-left): SVG plan rendering exact modeled
   geometry. Stable across alternative changes: same site origin/corner,
   same scale, zoom-to-site available; alternative switches never re-center
   or rescale unless the user zooms. Browser resize/zoom never changes
   physical quantities.
2. **Commitments panel** (compact, right or above cards): locked vs. unlocked
   list. Each row: name, value + unit, lock icon + text label ("Locked" /
   "Free"), provenance tag (Supplied / Confirmed / Assumed / Unconfirmed).
   Lock toggles require explicit user action; model proposals can request a
   lock change but never apply it without acceptance (AC-17/19).
3. **Alternative cards** (up to three, below or beside canvas): see §7.
4. **Instruction bar** (small, above or below canvas): one-line current task
   + typed-request input + status slot. Never a large chat transcript.
5. **Drawer** (hidden by default): full quantity → cost → land-allowance
   chain, assumption detail, SearchRun scope, provenance. Opens on demand;
   does not dominate the layout.

View controls (Stage 4+): **Existing / Proposed / Compare** segmented control
next to canvas. Existing = source image/model as supplied; Proposed = exact
current working geometry; Compare = same-coordinate aligned before/after
(split or overlay with labels — never two differently scaled plans).

Undo: one complete drag = one undo action; one Apply = one undo action.
Undo restores geometry + metrics + commitments version together. No silent
adjustment of any other field during undo. Saved comparisons are immutable
snapshots and never mutate with later edits (AC-24).

Persistence indicator: visible Saved / Saving / Unsaved / Save-failed states.
Save failure offers JSON export; reset affects only the selected project
(AC-26).

## 3. Stage 1 — Bring the site

Goal: enter with a recognizable site in under a minute.

- Primary action: **Try Cedar Market** button. Opens the prepared 120 × 100 m
  fictional case immediately with fictional label, dimensions, source note.
- Secondary action: **Upload a plan/image** (P1). PNG/JPEG only, recommended
  ≤10 MB and ≤20 MP. Validate actual image content, not extension.
  Oversized/invalid input → recoverable inline error, upload preserved,
  supported formats restated (AC-02, §13).
- Map search MUST NOT appear as a working control. If referenced at all, it
  is absent or explicitly labeled unavailable — never a button that implies
  function (§6, "no control implies working functionality when unavailable").
- Compact requirement statement next to upload: "Top-down plan with uniform
  scale. You will confirm width/depth or a known-length line before any
  measured conclusion."
- Unsupported files (PDF/DWG/SKP, arbitrary geo): helpful explanation of
  what IS supported, no fake analysis.

Keyboard: Tab reaches both actions; Enter activates. Numeric path: none at
this stage (no parameters yet).

Empty state: first-run shows the two actions + requirement statement; no
placeholder plan, no fake recents.

## 4. Stage 2 — Confirm understanding

Goal: separate what is known from what is not before any economics.

Canvas behavior:

- Source image fills canvas; editable rectangular boundary overlay on top.
- Pointer: drag edges/corners to resize, drag inside to move, rotate handle
  to rotate (uniform scale only). All display coordinates convert to canonical
  meter coordinates.
- Numeric: width, depth, rotation, origin X/Y fields. Pointer and numeric
  edits produce identical geometry (AC-10).
- Keyboard: overlay selected → arrows move (Shift = 1 m step, default 0.1 m);
  [ / ] rotate; Enter commits; Esc reverts in-progress drag.
- Entrance marker: click edge to place/move; numeric edge + offset fields;
  listbox alternative.
- Green-space object (axis-aligned rectangle, inside site): click to select,
  drag to move/resize; numeric X/Y/W/D fields; selected-object name + extent
  shown in panel and canvas label.

Calibration (one of, user-chosen):

1. Confirm width + depth mapped onto rectangle; or
2. Known-length line + uniform pixel-to-meter scale → computed width/depth
   shown for confirmation.
3. Area-only: allowed ONLY if user explicitly accepts drawn aspect ratio;
   disclose "dimensions derived from area + drawn ratio, not surveyed."

Confirm control ("Confirm site") enabled only with valid scale + positive
dimensions. On confirm: source image preserved unchanged; supplied vs.
user-confirmed vs. unconfirmed tags set; area + dimensions shown before
acceptance. Unconfirmed/unsupported scale blocks measured economic
conclusions (AC-04): economics panels read "Incomplete — confirm scale."

Out-of-scope geometry (non-rectangular parcel, skewed perspective photo):
inline explanation + "Use Cedar Market sample instead" action. Never
force-fit an arbitrary boundary silently; never rectify a street photo into
a measured site.

Object list (accessibility): every selectable object (boundary, green,
entrance) appears in a listbox mirroring canvas selection both ways.

## 5. Stage 3 — Set intentions

Goal: a few consequential inputs; everything else tucked away.

Above the fold (consequential inputs only):

- Assumed selling-price **ceiling** (max) and **selected selling price**
  (transaction assumption, ≤ ceiling). Two separate fields; sample may ship
  the same number in both, explicitly labeled. Ceiling ≠ achievable price.
- Price scenario selector (Low / Base / High from active product profile).
- Owner land expectation (L).
- Target surplus/revenue (t).
- Spatial commitments summary (green preservation, min green area) with
  lock toggles.

Expandable **Assumptions panel**: product dimensions, price ranges,
construction rates, site allowances (demolition/setup, utilities, green
works, contingency %, professional/approval, selling-cost %). Unknowns stay
"Unknown" — never zero. A deliberate zero requires an inclusion basis note
(AC-28). Never import sample prices invisibly into an uploaded case.

Blocking rule: required unknowns block commercial qualification (cards show
"Economics incomplete"), but the plan stays explorable — geometry, counts,
areas remain visible and editable.

Numeric path is primary here; every field is a real input with unit label,
range validation, and inline error (e.g. "Selected price exceeds ceiling").
Pointer path: n/a except lock toggles and scenario radio. Keyboard: full Tab
order, radios arrow-navigable, errors announced via aria-describedby/live.

## 6. Stage 4 — Explore futures

Goal: distinct residential futures, comparable at a glance.

Layout: large plan central; Existing/Proposed/Compare control; compact
commitments panel; ≤3 alternative cards; small instruction bar; calculations
in drawer.

Search/run behavior:

- Search runs against an immutable ScenarioSnapshot (site + product +
  commitments + costs + accepted-change IDs) with server-enforced locks,
  seed, ranges, budget (≤250 candidates starting point).
- Status line in instruction bar: Idle / Running (N tested…) / Done
  (N tested, M valid, K qualified + ms) / Failed / Cancelled. Cancel button
  during run; cancelling preserves accepted state. Late/stale responses
  attach to their original version and never mutate newer state (AC-20).
- Editing project inputs after a run marks prior results **Stale** with
  "Rerun against new snapshot" action.

Card rules (each card):

- Shows: homes (N = exact modeled valid footprints, AC-06), shared green
  area, residual land allowance L* or owner gap G, critical blockers
  (geometry / completeness / price-applicability / commercial-target icons
  + text, never color alone).
- Title generated from measured differences ("More shared green, −road
  area"), never a fixed label regardless of result.
- Meaningful difference required: more green, lower road area, different
  supported product, etc. Geometric duplicates removed; no hidden blended
  score. If only two distinct candidates exist, show two + "No third
  distinct option in tested scope" note (AC-11, §13).
- Selecting a card previews that EXACT candidate: plan + metrics swap
  together; highlight added/removed homes, changed circulation, retained
  regions with labels/patterns/line styles in addition to color. Returning
  (deselect / back to current) restores the working version exactly (AC-23).

Drawer content (per previewed or current candidate): derived quantities with
geometry basis, full cost lines (§9 table), surplus/gap math, SearchRun scope
(ranges, locks, seed, counts), provenance per assumption. Road savings line
shows area-delta × rate + declared scope changes (AC-08).

## 7. Stage 5 — Challenge and decide

Goal: state what matters, test what can change, decide next action.

Selection:

- Pointer: click green-space object on canvas → selected (name + extent
  shown). Click empty space deselects.
- Keyboard/list: object list selection mirrors canvas; arrow keys move
  between objects, Enter selects.
- "Keep this…" with no selection → inline clarification request naming how
  to select; MUST NOT pick an arbitrary object (AC-18).

Proposal flow (typed request → grounded investigation):

1. User types request in instruction bar (e.g. signature: "Keep this green
   space. Do not increase the home selling price. What else can change?").
2. System returns an explicit **operation proposal**: which variables will
   change, which locks remain, what the investigation will test, plus
   ambiguities and affected locks. Unsupported parts become clarification or
   a stated limit — never a silent substitution (§10, §13).
3. User confirms once (Accept / Edit / Reject). Reject leaves state
   unchanged; repeated Accept cannot apply twice (AC-17). Contradictory
   locks stay unresolved until the user chooses.
4. Bounded deterministic investigation runs without repeated approval
   dialogs (single confirmation covers the bounded run). Progress +
   Cancel visible.
5. Result states: physical trade-off, cost drivers, changed land allowance,
   unresolved commitments. Numbers bind to immutable result IDs; any
   model-written explanation inconsistent with results is replaced by the
   checked deterministic summary (AC-21).

Apply / decision:

- Selecting a result previews; **Apply** makes it current and preserves the
  previous version for undo. Editing after Apply starts a new working
  version; saved comparisons (≤3) stay immutable.
- **Save comparison** stores immutable snapshot (geometry + economics +
  provenance). **Decision record**: chosen candidate, comparison, unresolved
  conditions, next action, exclusions; printable; retains fictional status,
  assumptions, source version (AC-27). Saving sends nothing anywhere.
- Next actions offered: Investigate this proposition / Discuss expectation /
  Seek evidence / Stop under tested conditions.

No-result state (AC-22): report tested scope (ranges, locks, profiles, seed,
counts) + principal blockers + one-change counterfactual hints ("Relaxing X
alone changes…; relaxing X+Y would be needed for…"). Never claim all
conceivable designs are impossible. Model MUST NOT invent causal
explanations beyond the counterfactual tests.

Failure states in this stage: API error → deterministic editing stays fully
usable, model features clearly marked unavailable (AC-32); timeout →
Cancel/Retry without losing accepted state; changed assumption mid-run →
prior results marked stale, rerun offered.

## 8. Input equivalence matrix

| Parameter | Pointer | Keyboard | Numeric | Must match |
| --- | --- | --- | --- | --- |
| Boundary rect | drag/move/rotate | arrows, [/], Enter/Esc | W/D/rot/origin fields | AC-10 |
| Green rect | drag/move/resize | arrows + Enter/Esc | X/Y/W/D fields | AC-10 |
| Entrance | click edge, drag | listbox + arrows | edge + offset fields | identical placement |
| Prices / L / t | — (toggles/radios) | Tab + arrows | typed values + units | single validation path |
| Locks | toggle click | Space on toggle | — (explicit toggle only) | no model-only mutation |
| Cards/preview | click card | Tab + Enter | — | exact candidate swap |
| Apply/undo | buttons | shortcuts (Ctrl+Z etc.) | — | version-preserving |

One complete drag = one undo entry. Numeric commit (Enter/blur) = one undo
entry. No field silently adjusts another.

## 9. Canvas rules (all stages)

- SVG exact geometry: what is drawn = what is calculated (parcels, roads,
  footprints, green, boundary, entrance). No decorative symbols disconnected
  from quantities.
- Stable transform: alternative/preview switches keep pan/zoom; zoom-to-site
  button always available; 1 mm coordinate tolerance documented for
  equality/retention tests.
- Selection: visible focus ring + name/extent label; color + pattern/line
  label redundancy for status (existing/proposed/added/removed/retained).
- Contrast: text and status cues meet readable contrast; focus always
  visible; status never color-only.

## 10. Empty / error / no-result catalog

| State | Trigger | UI |
| --- | --- | --- |
| First-run empty | no project yet | Stage 1 actions + requirement note; no fake plan |
| Reference-only image | unconfirmed/skewed scale | banner "Reference only — confirm scale"; economics blocked |
| Invalid upload | bad content/size/type | inline error, upload preserved, formats restated, retry |
| Unsupported request | retained building, mixed product, PDF/DWG | stated limit + supported alternative; no silent substitution |
| Incomplete economics | required unknown | "Economics incomplete" on cards/drawer; plan explorable |
| Invalid geometry | containment/overlap/access/area fail | blocker chip + drawer detail; excluded from recommended |
| No qualifying candidate | search yields none | tested scope + blockers + counterfactual hints; no impossibility claim |
| Fewer than 3 distinct | dedup/dominance | show what exists + tested-scope note |
| Model unavailable | API error/creds/timeout | deterministic UI usable; model slot marked unavailable + retry |
| Stale results | input edited after run | "Stale" badge + rerun action; late responses version-bound |
| Save failure | IndexedDB error | visible error + JSON export offer |
| Schema mismatch | unsupported import version | safe failure, active project untouched |

## 11. Responsive rules

### 1024px (desktop baseline, desktop-first)

- Full multi-region layout: canvas dominant; commitments + cards alongside;
  drawer overlays or docks without reflowing canvas geometry.
- Instruction bar single line; cards in a row of up to three.
- AC-31 keyboard path complete at this width.

### 375px (narrow)

- Stack vertically: canvas → view controls → commitments → cards → drawer
  trigger → instruction bar. Canvas remains usable (min usable height,
  zoom-to-site, pinch/wheel zoom where available).
- Every pointer-only gesture gets a numeric alternative: boundary/green
  numeric fields, entrance listbox, card list fully tappable.
- No overall-page horizontal scrolling (AC-31): page-level `overflow-x`
  MUST NOT occur; only inner regions (drawer table, wide cost breakdown)
  may scroll horizontally, clearly bounded.
- Touch targets ≥44px for primary actions; drawer becomes full-width sheet;
  cards full-width stacked.

## 12. Accessibility

- Main journey keyboard-usable end to end (AC-31): stages, canvas objects
  via listbox, cards, proposal accept/reject, Apply/undo, drawer.
- Visible focus everywhere; skip link to canvas-alternative (object list).
- Live region announces: selection, proposal arrival, search status changes,
  preview swaps, stale flags, errors.
- Non-color status cues: icons + text + pattern/line-style redundancy.
- Errors inline at the field with `aria-describedby`; never color-only.

## 13. Language

- Buttons say what happens: "Preview", "Apply", "Save comparison",
  "Confirm site", "Rerun", "Export JSON".
- Commitments read as sentences: "Keep Grove A at 1,240 m² where it is."
- Fictional/sample data always tagged: "Sample — fictional prices."
- Exclusions visible in decision record: timing, financing, taxes,
  compliance, demand, survey accuracy — "not assessed."

## 14. Out of scope (MUST NOT appear as working UI)

Voice input, map search, PDF/DWG/SKP import, irregular-site solving,
terrain/3D editing, mixed-product allocation, online market research,
compliance checks, phasing/cash-flow/debt/IRR/JV, accounts/billing,
multi-user, generalized document AI. Any such affordance shown for roadmap
purposes MUST be explicitly labeled non-functional text, not a control.

## 15. Direct-manipulation delta — canvas-led workspace (T11c)

This section extends, never contradicts, §§1–14. It governs pointer-led
editing on the plan canvas. All prior rules (preview ≠ commit, no silent
mutation, honest states, input equivalence) still apply.

### Pan / zoom / fit-site

- Pan (drag empty canvas with space held, or wheel-drag), zoom (wheel /
  pinch, keyboard +/−), and **Fit site** button adjust the view transform
  only. Physical quantities MUST never change from view operations.
- Alternative/preview switches keep the current pan/zoom; Fit site is
  always available next to the view controls. Minimum canvas height is
  preserved at 375px so the plan stays usable when stacked.

### Grove select → unlock → drag/resize

- Click (or listbox/Enter) selects the grove: focus ring + name/extent
  label + handles appear. Click empty canvas deselects.
- A locked grove shows handles dimmed with a "Locked" tag; dragging is
  disabled until the user explicitly taps **Unlock** (panel toggle or
  canvas badge). Locking requires no confirmation; unlocking a
  search-bound grove marks prior results Stale.
- Unlocked grove: drag inside to move, drag edge/corner handles to
  resize (axis-aligned, clamped inside the site). Live readout shows
  Width / Depth / position in meters during the drag; invalid positions
  clamp with an inline note, never a silent jump elsewhere.

### Draft vs committed, Preview-not-applied labeling

- Any canvas drag/resize creates a **draft**: canvas + metrics show draft
  values immediately, badged **"Preview — not applied"** on the canvas
  and in the metrics strip. The working (committed) version is untouched
  until Apply.
- Draft metrics render in the same strip with the badge prefix; drawer
  shows draft math while a draft is active, committed math otherwise.

### Apply / Cancel placement

- When a draft is active, an Apply bar docks directly under the canvas:
  **Apply** (primary) + **Cancel** (secondary) + one-line delta summary
  ("Moves Grove A 2.0 m east; +0 homes, +0 m² road"). No Apply control
  lives anywhere else for canvas drafts — one place, next to the change.
- Apply commits the draft as one undo entry and clears the badge.
  Cancel discards the draft and restores the committed plan exactly.
  Esc cancels an in-progress drag; a completed-but-unapplied draft
  requires explicit Cancel (Esc also works when canvas is focused).

### One-drag-one-undo

- One complete pointer drag (move or resize, down → up) = exactly one
  undo entry covering geometry + derived metrics. Releasing outside the
  canvas cancels that drag (no entry). Numeric commits (Enter/blur) each
  count as one entry. Undo restores geometry + metrics + commitments
  version together; redo is not required for M2/M3.

### Inspector states

The inspector (commitments-side panel) shows exactly one state:

1. **Nothing selected**: site summary (dimensions, area, entrance,
   fictional tag) + "Select the grove or a card to inspect." prompt.
2. **Grove selected**: name, extent, Locked/Free + provenance, plain
   **Width**, **Depth**, **X**, **Y** fields in meters (labels use those
   words, not `w`/`h`), Unlock/Lock toggle, and the draft delta line
   when a draft is active.
3. **Layout/card selected**: candidate summary (homes, green, road,
   allowance/gap, blockers) + Preview / Apply actions; numeric fields
   hidden, geometry read-only here.

### Compact cards

- Cards stay one line of title + one metrics line + one blocker line +
  Preview/Apply buttons. Deltas inline ("42 homes (+2)"). Full math
  lives in the drawer, never expanded into the card. ≤3 cards in a row
  at 1024px, stacked full-width at 375px.

### Stays out (MUST NOT be built from this section)

- Road drawing or reshaping, arbitrary (non-rectangular) boundaries,
  individual home editing (move/resize/delete footprints or parcels).
  Circulation changes arrive only via generated alternatives; homes are
  read-only geometry. Any UI hinting at these MUST be absent, not
  disabled decoration.

## 16. Workbench layout (T11d)

What changed since §15: the stacked page becomes a viewport workbench.
Canvas stays dominant and exact; the rail, inspector, and dock rearrange
established regions (§2) without adding new powers. All prior rules
(preview ≠ commit, no silent mutation, honest states, input equivalence)
still apply.

### Viewport workbench: top bar, 280px rail, bottom dock

- **Top bar**: product title + fictional tag + model-availability badge
  (existing badges, unchanged meaning) + Fit site + Existing / Proposed
  / Compare view control. One row at 1024px; wraps to two rows at 375px,
  never page-level horizontal scroll.
- **Left rail (280px)**: object list on top, inspector below it.
  Fixed 280px at 1024px; becomes a stacked full-width sheet section at
  375px (canvas → view controls → rail → cards → dock, per §11 order).
- **Bottom dock**: always-visible one-line summary (homes, green, road,
  allowance/gap, Preview-not-applied or Stale badge when active) with
  tabs: **Cards** (≤3 compact alternatives, §15 rules), **Drawer**
  (quantity → cost → allowance chain, §6), **Issues** (see below).
  Draft Apply/Cancel bar still docks directly under the canvas (§15),
  never inside the dock.

### Object list drives the inspector

- Object list entries: **Site**, **Grove** (named, e.g. Grove A),
  **Circulation**, **Homes** (count). Selecting an entry selects the
  corresponding canvas object(s) and switches the inspector (§15 states:
  nothing / grove / layout selected); canvas clicks mirror back to the
  list. One selection model — list and canvas can never disagree.
- Site row: boundary + entrance summary. Circulation row: family +
  unioned road area, read-only. Homes row: count + product profile,
  read-only. Only the Grove row exposes editable numerics (Width /
  Depth / X / Y) and the lock toggle.
- Keyboard: list is a real listbox — arrows move, Enter selects, Esc
  follows gesture-then-deselect (below).

### 1 m pointer snap vs typed precision

- Pointer drags (grove move/resize) snap to **1 m** increments by
  default; the live readout shows snapped values. Holding Alt (Option)
  during a drag disables snapping for fine placement.
- Typed numeric fields accept arbitrary precision (up to the 1 mm
  coordinate tolerance) and are never rounded to the snap grid.
  Pointer and typed edits to the same final values MUST still yield
  identical geometry and metrics (AC-10); snap only changes which
  values the pointer lands on, shown live before release.

### Esc gesture-then-deselect semantics

- Esc acts in stages, one per press: (1) cancel an in-progress drag
  (no undo entry); (2) if a completed-but-unapplied draft is active,
  Cancel it (restore committed plan); (3) otherwise clear the current
  selection (canvas + list + inspector return to nothing-selected).
- Esc never Applies, never toggles locks, never switches views.

### Last-change delta retention

- After Apply (canvas draft or card apply), the dock summary keeps a
  one-line **last-change delta** ("Applied: Grove A +2.0 m east; +0
  homes, −120 m² road") until the next edit, preview, or run replaces
  it. The delta is informational — it is not a control and re-applying
  is impossible (AC-17).
- Undo restores the pre-Apply version and replaces the delta line with
  "Undone: <what was restored>."

### Previous-layout toggle

- While previewing a card (or reviewing a just-applied change), a
  **Previous layout** toggle next to the view control flips the canvas
  between the previewed/applied layout and the immediately previous
  committed layout at the same pan/zoom. Metrics strip follows the
  shown layout, badged Preview-not-applied or Last-applied
  accordingly. Toggling is view-only: it creates no draft and no undo
  entry, and leaving preview returns to the committed plan exactly.

### Dock Issues tab

- The **Issues** tab lists current blockers for the shown layout across
  the four status axes (geometry validity, input completeness,
  price/profile applicability, commercial target): each row states the
  axis, the failing check in product language, and the affected object
  (clicking selects it in canvas + list + inspector).
- Empty state: "No issues in the shown layout." Issues never block plan
  exploration; economics-affecting issues mark cards/drawer per §10.
  No issue row may invent causality beyond the checks run.

## 17. M3 journey (T11e)

What M3 adds on top of §§1–16: user-supplied sites, side-by-side
comparison, and the decision record. All prior rules (preview ≠ commit,
no silent mutation, honest states, input equivalence, draft semantics)
still apply. The five-stage journey (§§3–7) is now fully traversable:
Bring site → Confirm understanding → Set intentions → Explore futures →
Challenge and decide.

### Reference-image upload

- Stage 1 secondary action **Upload a plan/image**: PNG/JPEG only,
  recommended ≤10 MB / ≤20 MP. Actual image content is validated, not
  the extension. Invalid/oversized input yields a recoverable inline
  error; the upload is preserved and supported formats are restated.
- Every uploaded image is labeled **Reference only** from the moment it
  loads until scale is confirmed — and remains labeled as the source
  backdrop afterwards. The reference-only banner reads "Reference only
  — confirm scale" and economics stay blocked ("Incomplete — confirm
  scale", AC-04).
- A **backdrop toggle** (Show / Hide reference) controls image
  visibility under the modeled geometry. Hiding the backdrop never
  changes geometry, quantities, or confirmation state.
- The image is NEVER a dimension source: no pixel is converted to
  meters except through the explicit scale-confirmation step below.
  Skewed/perspective photos are reference-only or rejected with a
  helpful note — never silently rectified into a measured site.

### Rectangular boundary + scale confirmation semantics

- The user positions, rotates, and sizes a rectangular boundary overlay
  on the reference (pointer drag per §4, mirrored numeric W/D/rotation/
  origin fields, keyboard arrows + [ / ] + Enter/Esc). Display
  coordinates convert to canonical meters only via the confirmed scale.
- Scale is confirmed by exactly one chosen method: (a) confirmed width
  + depth mapped onto the rectangle, or (b) known-length line + uniform
  pixel-to-meter scale with computed W/D shown for confirmation, or
  (c) area + explicitly accepted drawn aspect ratio with the disclosed
  "derived from area + drawn ratio, not surveyed" note.
- **Confirm site** enables only with valid scale + positive dimensions.
  On confirm: source image preserved unchanged; supplied vs.
  user-confirmed vs. unconfirmed tags set; area + dimensions shown
  before acceptance. Out-of-scope geometry gets the inline explanation
  + "Use Cedar Market sample instead" action — never a silent force-fit.

### Custom-site creation rules

- Confirming an uploaded site creates a new working project; the Cedar
  Market sample is never overwritten and sample prices are never
  imported invisibly (all price/cost assumptions start Unknown or
  user-entered, per §5).
- A custom site starts with: confirmed boundary, entrance (user-placed
  on an edge, numeric edge + offset alternative), and one
  user-drawn axis-aligned green rectangle (or none — green is optional
  until committed). Each gets an object-list entry driving the
  inspector per §16.
- Reset / New site affects only the selected project; the sample stays
  intact and re-openable. Save failure shows visibly with a JSON export
  offer (AC-26).

### Compare-view layout

- The Compare view control (§2) shows **two plans + delta table**: the
  committed working layout and the previewed candidate (or the previous
  layout per §16 toggle), rendered at the same coordinates, scale, and
  pan/zoom — never two differently scaled plans.
- Below (1024px: beside; 375px: stacked under) the plans, a delta table
  lists per-side values and differences: homes, green area, road area,
  non-land costs, surplus, land allowance, owner gap. Added/removed
  homes, changed circulation, and retained regions carry the same
  label/pattern/line-style redundancy as §9 canvas rules.
- Compare is view-only: no drafts, no Apply, no undo entries. Leaving
  Compare returns to the exact pre-Compare view state.

### Decision-record panel + JSON export contents

- The **decision-record panel** (dock tab or drawer section, printable)
  contains: chosen candidate ID + snapshot hash, the up-to-three saved
  comparisons it was weighed against, assumptions with provenance,
  commitments with lock state, unresolved conditions, selected next
  action (Investigate / Discuss expectation / Seek evidence / Stop),
  exclusions ("not assessed": timing, financing, taxes, compliance,
  demand, survey accuracy), fictional status, and source image
  reference/hash. Saving or printing sends nothing anywhere (AC-27).
- **JSON export** contains: project schema + version, site geometry and
  calibration method, features, product profile, assumptions with
  provenance, commitments, scenario snapshots, candidates with
  quantities + economics, search runs (ranges, locks, seed, counts),
  proposals with acceptance state, and decision records. The background
  raster may be excluded only with an explicit warning; import without
  it restores usable geometry and decisions. Credentials are never
  serialized; unsupported schema versions fail safely without touching
  the active project.
