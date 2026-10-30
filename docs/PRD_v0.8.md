# UNBUILT — Product requirements v0.8: combined feature roadmap

**Status: features 1–3 approved for implementation by the owner. Features
4–15 remain a discussion roadmap and require separate approval.**

This revision records the combined residential master-planning feature list.
The owner subsequently approved implementing project management, delete/restart
and boundary editing together. Review that milestone before proceeding to the
next feature. Earlier PRDs remain unchanged.

The owner's explicit additions are project creation/deletion/saving, deletion
and restarting a plan, and vertex-based boundary modification. These needs are
retained as priorities 1–3. Their detailed interaction designs still need review.
Items 4–15 retain the brainstormed ideas for discussion; inclusion does not
approve their scope, implementation order or delivery date.

## Product direction

Unbuilt is a residential master-planning workbench. A planner should be able to
understand a site, shape a neighborhood, explore alternatives and explain the
consequences for housing, movement, open space and economics.

The plan remains the main workspace. Direct drawing and editing controls remain
available alongside contextual assistance. Planning intentions, measured results
and assumptions must stay distinguishable.

## Current baseline

[PRD v0.6](PRD_v0.6.md) and [PRD v0.7](PRD_v0.7.md) describe the existing planning
and review workflows. Current verification and limitations are recorded in the
[planner-feedback evidence](../evidence/planner-improvements/README.md).

- Simple irregular boundaries already support drawing, closure, vertex
  move/add/remove, actual polygon area, draft Apply/Cancel and Undo/Redo.
- Layout generation uses bounded orthogonal Spine routing or a fixed Loop,
  whole lots, one rectangular park and one shared housing template. Supported
  boundary-edge entrances use measured access aprons with Spine.
- Parameters and park edits can preview geometry and measured outcomes.
  Boundary edits show consequences before Apply. Exact park shape/location and
  minimum park area are separate commitments.
- Before this milestone the browser saved one accepted working project. The
  features 1–3 milestone adds a named browser/device project library and keeps
  accepted-plan JSON download/import as the portable backup path.
- Search and comparison exist, but unapplied alternatives, comparisons,
  searches, drafts, undo history and photos are session-only.
- Requests and assistant answers currently use local rules and deterministic
  measurements. A real model connection is not implemented and verified in the
  normal request workflow.

This roadmap does not extend those capabilities merely by describing them.
The PRD version is independent of project, snapshot and record format versions.

## Combined roadmap

The numbers below are the agreed review order. Only features 1–3 are approved
for this implementation milestone; the remaining items retain their baseline status.

| ID | Feature | Planner-facing intent | Current status |
|---|---|---|---|
| 1 | Project management | Create, name, save, open and delete projects; understand which project is active and what has been saved. | **Implemented for review:** named device library, blank/sample creation, rename, autosave/Save, open, confirmed deletion and session recovery. |
| 2 | Delete and restart | Remove houses or the boundary, clear a layout, or begin a blank plan through an understandable New/reset action. | **Implemented for review:** remove selected homes into vacant lots, restore homes, clear layout, delete boundary or start blank; confirm and Undo/Redo. |
| 3 | Boundary editing | Draw and modify an irregular boundary by moving, adding and removing vertices, with area updates, correction guidance and Undo/Redo. | **Implemented for review:** existing drawing/editing retained for blank plans, true area/history and before-Apply review; entrance identity survives vertex insertion/removal. |
| 4 | Site context | Bring in a scaled survey or supported boundary file; identify surrounding streets, existing features and access assumptions. | **New / extension:** an illustrative image backdrop and project JSON exist; scaled survey/context import is not established. |
| 5 | Street editing | Draw streets, connect entrances, move junctions and adjust widths while seeing consequences for the subdivision. | **Needs improvement:** limited generated streets and cross-street controls exist; general street-network editing does not. |
| 6 | Blocks and lots | Form development blocks and subdivide them; split, merge and reshape lots while retaining usable access and fitting homes. | **Needs improvement / new operations:** individual lot reshaping exists; block-based subdivision and split/merge operations do not. |
| 7 | Housing mix | Create multiple housing templates and assign them to lots or blocks; understand the resulting unit mix and declared costs. | **Needs improvement:** one shared one-floor template exists; multiple templates and housing types are new scope. |
| 8 | Open spaces | Design multiple parks, pocket spaces and green corridors with clear purposes and commitments. | **Needs improvement:** one rectangular park is supported; multiple spaces, types and irregular forms need new modeling. |
| 9 | Planning brief and rules | Define targets, preferences and hard constraints for housing, streets, setbacks, parking and open space, with sources where relevant. | **Needs improvement:** some parameters and commitments exist; a coherent brief, preference handling and sourced rule management do not. |
| 10 | Land budget | Account for every part of the site and highlight the geometry behind each category, including reserved and unassigned land. | **Needs improvement:** measured quantities and explicit remainder exist; interactive allocation and additional land-use categories need definition. |
| 11 | Walkability | Create pedestrian connections and measure actual routes between homes, parks, entrances and amenities. | **New:** pedestrian-network and route-distance calculations are not modeled. |
| 12 | Feasibility experiments | Test supported design changes and editable cost assumptions, with controlled comparisons and measured trade-offs. | **Needs improvement:** bounded family/frontage search and economics exist; wider sensitivity experiments and editable cost bases are new scope. |
| 13 | Saved alternatives | Name, reopen, branch, compare and annotate schemes within a project, recording why a preferred option was selected. | **Needs improvement:** session comparison exists; persistent named schemes, branching and annotations do not. |
| 14 | Terrain, drainage and phasing | Introduce terrain constraints, drainage planning and development phases using appropriate inputs and calculations. | **New, later scope:** each needs separate discussion and supporting data; no analysis is implied by a visual layer alone. |
| 15 | Real AI assistant | Translate intentions into reviewable investigations, use supported calculation tools and explain measured results in context. | **New integration / existing UI extension:** assistant controls exist, but the current rule-based workflow is not a verified real-model connection. |

## Discussion and approval process

For each feature, agree:

1. The planner's task and the problem it solves.
2. What already works and should be preserved.
3. The intended canvas, inspector or project-management interaction.
4. The smallest useful scope, dependencies and explicit exclusions.
5. Effects on geometry, measurements, economics and saved work where applicable.
6. Observable acceptance criteria, including relevant recovery, keyboard,
   mobile and zoom behavior.
7. Whether AI adds useful assistance and which direct controls remain available.

Record the agreed requirements after that discussion. Implementation begins only
when the owner explicitly asks to proceed with the agreed feature or milestone.
No later roadmap item is implicitly approved by approval of an earlier item.

## Next discussion: project management

The following choices define the approved features 1–3 milestone.

### 1. Named projects

- Projects opens a device library; the active name stays visible in the workbench.
  Create a named blank plan by default, or choose the fictional Cedar sample.
  Names are required, 1–100 characters and unique without regard to case.
- Autosave accepted state and provide Save. Open restores that project's accepted
  boundary, layout parameters, home removals, manual lot edits, commitments,
  economics inputs and decision log. Pending edits must be applied or cancelled
  before switching. Each opened project has a separate session history/results.
- Saving is browser/device-local. No account, cloud synchronization or shared
  project access is included. Downloads are the portable backup. Imports create
  a separate project, with a unique suffix where necessary.
- Migrate the previous single saved project without changing its accepted plan;
  retain its original storage entry. Accept supported older project/record files.
- Project deletion requires confirmation and affects only the chosen project.
  Offer session Undo for the most recent project deletion; clearly state that
  this recovery does not survive leaving/reloading the session. Empty libraries
  show project creation rather than silently resurrecting a sample.
- Storage failures, unreadable libraries and conflicting writes from another tab
  must be visible. Preserve original data; allow downloading current accepted
  in-memory work. Do not claim a successful save when persistence failed.

### 2. Delete and restart

- Removing selected homes keeps their lots vacant and removes the footprints,
  unit revenue and construction cost. Generated lots overlapping the original
  removed-home lot regions remain vacant until explicitly restored. State this
  reservation rule; it is not permanent lot identity or a land-use designation.
- Clear layout removes generated homes, lots, streets and park, including the
  park commitment, while keeping the boundary and project assumptions. Confirm
  that consequence. The site becomes boundary-only, with no priced layout claim.
- Delete boundary removes dependent layout geometry. Start blank plan has the
  same reset effect and keeps the current project name and economic assumptions.
  These actions respect the site-boundary lock, require confirmation and create
  one recoverable plan history step. Reference photos are hidden, session-only.
- Undo/Redo restores boundary, layout flags, homes and commitments together while
  the project remains open. It does not cross projects or survive a reload.

### 3. Boundary creation and editing

- A blank plan has no implicit rectangle. Draw a simple closed 3–64 vertex
  polygon by pointer/touch or coordinates; measure actual polygon area in m².
  Local coordinates span 0–500 m. Rectangle dimensions remain an optional tool.
- Move, add or remove corners with screen-sized handles and keyboard controls.
  Show live valid area; highlight conflicting segments on invalid outlines.
  Apply is disabled until the outline is valid; Cancel keeps accepted geometry.
- Draft Undo/Redo steps through drawing/editing. Apply creates one accepted-plan
  history step. Review measured before/after consequences where a layout exists.
  Vertex insertion/removal must preserve the entrance's physical edge position
  as closely as possible; edited gates still require geometric validation.
- A newly drawn blank project becomes boundary-only. Generate layout is explicit
  and uses a bounded, checked starter Spine arrangement with assumed park/access
  positions. It must either yield contained, validated geometry or retain the
  boundary-only plan with a specific limitation. It proves neither maximum
  capacity nor legal/public access. Existing unsupported routing limits remain.

### Milestone acceptance

A planner can create two named projects, develop a five-sided 11,000 m² site,
edit/cancel/apply its corners, generate a supported contained layout, remove a
home without removing its lot, clear/restart and recover through Undo/Redo.
Save/reload and switching preserve each accepted project independently.
Deletion, corrupt storage, failed saves and multi-tab conflicts cannot silently
replace another saved project. Verify desktop/laptop/mobile, keyboard, emulated
touch and actual 200% browser zoom. Evidence is recorded in
[projects-and-reset](../evidence/projects-and-reset/README.md).

## Principles to preserve across future milestones

- Keep the canvas dominant and object properties contextual, with readable
  controls at desktop, laptop, mobile and 200% browser zoom.
- Preserve useful work and provide clear review/recovery for changes that remove
  or replace it. Do not silently erase manual design decisions during generation.
- Measure actual supported geometry. Do not infer site area from a bounding box
  or present outside-site roads, lots or homes as valid.
- Clearly distinguish supplied facts, assumptions, calculated results and
  untested suggestions. Unsupported analysis must be labeled unavailable.
- Bind proposals, alternatives and explanations to the relevant plan version;
  invalidate stale results when inputs change.
- Preserve compatible saved projects through explicit, versioned migration.
- A model may interpret intentions, ask clarifying questions and prepare
  investigations. Calculations remain grounded in tools; proposed plan changes
  require review. Do not claim a real model connection without testing it.
- Regulatory, terrain, drainage, access and financial capabilities require their
  own defined inputs, calculations and verification; this roadmap grants none
  automatically.

## Implementation status

Features 1–3 are implemented for owner review. Features 4–15 remain unapproved
for implementation. This milestone adds no real model integration or cloud
persistence. Human task/aesthetic acceptance and physical touch-device validation
remain open. Work is left uncommitted for review.

## Owner feedback: features 1–3 refinements (28 October 2026)

The follow-up Chrome review authorizes focused fixes within this milestone:
responsive boundary controls, explicit reset consequences, precision guidance,
portable backups and warnings when leaving session-only work. It does not approve
features 4–15.

- Preserve the before/after boundary review. Wrap inspector content and keep
  Apply/Cancel reachable while scrolling a long coordinate list. Show the
  existing 1 m pointer snap beside the controls, distinguish decimal coordinate
  entry, and label local coordinates and displayed area rounding.
- Consolidate the identical Delete boundary / Start blank operations into
  **Delete boundary and layout**, with a matching confirmation. Clear layout
  remains separate and keeps the outline. Confirm retained name, assumptions,
  reference-photo behavior and the lifetime of Undo/Redo.
- Offer accepted-project downloads from each library entry and from project
  deletion confirmation. State browser-local/private-session/site-data limits
  and backup exclusions; importing a backup creates another project.
- A pending boundary draft offers Keep editing or explicit Discard before opening
  Projects. Opening the library alone preserves accepted-plan history/photos.
  Actual switching/creation/import warns if undo/redo or a photo will be lost.
  Reload/close requests a browser warning when session work is at risk; browser
  policy controls whether that warning is shown.
- Keep retained photo controls available on blank/boundary-only plans. Remove
  photo must remove the image without changing planning locks.

Reproduction, checks and remaining limitations are in
[feedback-fix evidence](../evidence/planner-feedback-fixes/README.md). Owner
workflow/aesthetic acceptance and physical-device touch remain independent gates.

## Subsequent owner approval: feature 4

On 28 October 2026 the owner requested implementation of Site context, including
DXF/PDF support. The approved scope, formats, interaction and persistence contract
are now recorded in [PRD v0.9](PRD_v0.9.md). The earlier approval/status wording in
this document records the features 1–3 milestone; features 5–15 remain unapproved.

## Subsequent owner approval: feasibility experiments

On 29 October 2026 the owner explicitly requested **Feature #9: Feasibility
experiments — test design changes and editable cost assumptions**. The requested
title defines this increment, corresponding to historical roadmap item 12 above.
Requirements and implementation contract are appended in `PRD_v0.14.md`. The
historical Planning brief and rules item is not implemented by this approval.
Feature 8 independent testing remains deferred; later roadmap items remain
outside this increment.

## Subsequent owner approval: saved alternatives

The owner requested **Feature 10: Saved alternatives — name, reopen, compare and
annotate different schemes**, following the feasibility checkpoint. This uses the
owner's numbering; the same topic was historical roadmap item 13. Requirements
are appended in `PRD_v0.15.md`. Other roadmap topics remain outside this increment.

Feature 11 owner update (30 October 2026): Real AI assistant is implemented under
PRD_v0.16 with reviewable feasibility tools and measured explanations. Changeable
primary/alternate routing and write-only API-key administration are included.
The owner will supply endpoints and secrets later; real-model verification remains
open. This supersedes historical item numbering without authorizing other roadmap work.

Feature 12 owner update (30 October 2026): Terrain, drainage and phasing is
introduced under PRD_v0.17 with entered elevation grids, Rational runoff screening
and stable-lot monthly phase accounting. No actual project data or civil/financial
suitability is inferred. Methods and data requirements are documented separately;
Feature 11 and Feature 12 tester prompts are saved for later independent review.
