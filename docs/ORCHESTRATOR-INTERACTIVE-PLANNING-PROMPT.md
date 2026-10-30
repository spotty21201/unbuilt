# Orchestrator prompt: interactive UNBUILT planning workspace

From: Unbuilt Astra Tester
Reference: TestFit, “Parking Solver — What's Included?” https://www.youtube.com/watch?v=4SVRaZ_FS6A&t=5s

Implement the following bounded redesign of UNBUILT's design/planning panel. Preserve the existing deterministic geometry/economics contracts and user's uncommitted work. This is an interaction redesign with real solver integration, not a visual mockup.

## Reference observations

The reviewer inspected video frames across the 83-second demonstration, including these sequences. These observations do not establish actual solver latency, undo semantics or implementation details.

- Around 10–25s: the selected building has outline handles and dimensions; its properties occupy the lower left rail, below an object hierarchy. The plan switches between 2D and 3D within the workspace.
- Around 30–40s: quantities and then financial results occupy a bottom dock while the plan remains visible.
- Around 45–60s: selecting stalls exposes width/depth/angle controls; selecting a particular subtype reduces the inspector to relevant properties. Detailed type configuration opens separately.
- Around 65–70s: circulation selection exposes blue control points and circulation properties.
- Around 70–75s: schemes and comparative data occupy the bottom dock.

The transferable pattern is synchronized selection, contextual controls, direct geometry editing and persistent consequences. The behavior specified below is our proposed UNBUILT contract, not a claim that TestFit implements every detail this way.

## 1. Workspace layout

Replace the long document-like page with a viewport-sized desktop workbench:

- Compact top bar: project/sample name, Working/Preview status, Undo/Redo, model-mode disclosure.
- One left rail, approximately 280px wide: object list at the top, selected-object inspector underneath. Use collapsible groups and internal scrolling. Do not add a second permanently open inspector on the right.
- Central canvas fills remaining space. Provide Select, Pan, zoom in/out and Fit site. Keep camera position stable across edits and alternatives; fit only when explicitly requested or initially opening the site.
- Persistent bottom dock: compact summary always visible; expandable tabs for Quantities, Economics, Options and Issues. Opening a tab must leave useful canvas space visible.
- Compact request entry integrated into the workbench; expandable when needed. Do not put a large chat panel between the user and the plan.

At 1440×900 and 1024×768, users must see the site, selected-object controls and key outcomes together without scrolling the whole page. At 375px, use a collapsible inspector/bottom sheet and touch-friendly controls rather than shrinking the desktop rail. No horizontal page overflow.

## 2. Object selection drives the inspector

Provide a simple object list: Site, Grove A, Circulation, Homes. Canvas and list selection must mirror each other. Hover is a subtle cue; selection is a persistent outline with a label. Clicking empty canvas deselects. Escape cancels an active gesture first, then deselects.

- Site: supplied dimensions and area; sample provenance. Boundary editing is outside this increment.
- Grove A: preservation lock, width/depth, position, area; movement/resizing controls only when unlocked.
- Circulation: supported Spine/Loop switch, measured road area; fixed road width displayed as read-only unless the engine already supports valid width variation.
- Homes: product profile, supported lot-frontage values, home count and lot-area information. Individual home selection may inspect a generated parcel but must not imply independent placement/editing.

Only show properties relevant to the selection. Keep project-wide selling price, ceiling, owner expectation and target in an easy-to-open Assumptions section with a persistent summary. Avoid cryptic X/Y/W/H-only labels.

## 3. Direct editing contract

For unlocked Grove A, provide body dragging and rectangular resize handles, dimension labels and numeric equivalents. Pointer coordinates must map through the current pan/zoom transform into canonical meters. Use a documented 1m snap by default; typed input may retain supported precision. Keep it axis-aligned.

During a gesture, render a temporary draft and recompute the fixed-family/fixed-frontage layout plus measured outcomes. This is local regeneration, not an automatic global search. Label draft state clearly. If computation lags, display Updating and discard obsolete responses; do not label old numbers as current.

On valid pointer release, commit the direct edit as ONE undoable operation. Escape/pointer cancellation restores the gesture's initial state. An invalid release restores the last committed geometry with a clear reason. Do not silently move or shrink another object to make the edit fit.

Numeric inputs retain editable strings while typing: empty is not zero. Commit valid values on Enter/blur; invalid/empty drafts show an adjacent error and do not alter accepted geometry or economics. A deliberate zero is accepted only where meaningful. Keyboard equivalents must use the same validation and computation as pointer edits.

Locked green can be selected and inspected but cannot be dragged, resized or numerically altered. Describe search behavior accurately: this bounded search holds the drawn green rectangle fixed even when manual editing is unlocked.

This refines the earlier brief: routine manual edits do not require Apply after each drag. Search-generated alternatives still use Preview → Apply/Cancel. Every accepted edit is recoverable through full-state Undo/Redo.

## 4. Solver controls and visible consequences

Expose Spine/Loop and frontage values the engine truly supports (currently 9/10/11/12m; inspect current code before binding). Discrete choices should look discrete. If a combination fails validation or profile applicability, show why; do not silently substitute another configuration.

Keep homes, shared green, road area, land allowance, owner shortfall/headroom and validity visible in the bottom summary. During a gesture compare against its starting version; after commit retain the last-change delta until the next edit. Candidate previews compare against the accepted working plan. Name the comparison basis.

Separate geometry validity, input completeness, profile applicability and commercial outcome. Valid geometry does not mean the owner target is met. Use positive “Headroom” wording when allowance exceeds expectation. Never infer that commercial expectations are the sole cause from eight bounded trials.

## 5. Alternatives and comparison

Use compact option thumbnails/rows in the Options dock, not three full-page cards. Clearly identify the working baseline and suppress its redundant Apply action. Name actual trade-offs: e.g. larger lots with fewer homes. Explain equivalent outcomes without pretending they are distinct economic wins.

Selecting a candidate updates the same canvas and inspector context with a prominent Preview state. Apply/Cancel stay adjacent to the preview. Apply commits the candidate; Cancel restores the accepted plan. Preserve the camera.

Comparison overlays must keep proposed footprints readable. Render old geometry beneath new geometry or as transparent dashed outlines; opaque removed-parcel hatches must not obscure new homes. Provide a simple previous/current toggle. Label retained green and any changed circulation.

Any relevant accepted edit invalidates search results from a different snapshot. Disable stale preview/apply and offer rerun. Saved comparisons, if implemented in this slice, must retain their own complete snapshots and stay distinct from current search results; otherwise defer saving explicitly.

## 6. Scope and prerequisites

Fix these confirmed defects before or alongside the redesign:
- Opaque removed-parcel overlays hide proposed homes.
- Mixed-result summary says all miss when some meet; empty results show a success sentence.
- Cleared owner/coordinate fields silently become zero.

Keep 3D, map/parcel acquisition, arbitrary boundaries, arbitrary road control points, custom home placement, mixed product allocation and road engineering out of this increment. The reference's blue road nodes are a future capability, not permission to add decorative handles disconnected from valid connected-road geometry. Do not clone TestFit's full dense parameter catalog.

Preserve the typed request → reviewed proposal → bounded search flow for broader investigations. Direct manipulation works without a model call. Continue truthful deterministic-mode disclosure.

## 7. Independent browser acceptance

1. Initial site, homes, grove and entrance visibly render; canvas and object-list selection agree.
2. Locked grove resists pointer and numeric edits. Unlock and move it; pointer and equivalent typed values produce identical geometry/metrics.
3. Repeat the move after zoom/pan: canonical movement remains correct. Resizing the browser changes no quantities.
4. Resize within bounds, try outside bounds, press Escape mid-drag and cancel a pointer gesture. Invalid edits never commit or silently adjust other fields.
5. One long drag = one Undo. Undo/Redo restore geometry, assumptions, locks and metrics consistently; numeric edits also have coherent history.
6. Clear owner expectation and coordinates: show a missing draft, never a zero-value financial conclusion or silent relocation.
7. Change frontage and circulation: actual plan and measured results update together, with explicit validation failures when relevant.
8. Preview/Apply/Cancel remain readable and consistent. Old overlays never hide new footprints. Owner 10→20 invalidates old candidates; rerun gives matching preview/apply economics.
9. Owner expectation 3bn produces an accurate mixed-result summary. Zero candidates produce no success claim. The default miss remains scoped to tested layouts.
10. Rapid successive edits never display an older response as current. Capture responsiveness measurements rather than claiming instant performance from a demo video.
11. Test desktop 1440×900, 1024×768 and mobile 375px, plus keyboard selection/editing. No page scrolling needed between desktop plan and essential controls.

Deliver a working increment, changed-file summary, limitations and screenshots/video of the full edit/undo/preview sequence. Request an independent tester re-walk. Implementation tests alone do not close M2; genuine model integration and human unrehearsed validation remain separate gates. Do not commit or publish as part of this prompt.
