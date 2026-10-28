# UNBUILT — Canvas-first redesign spec (Designer output, v0.35 §6)

Status: SPEC ONLY. No visual implementation is committed against this spec;
correctness repairs (audit findings 1–8, 11) are already in code. This spec
is the mandatory precursor the audit prompt requires before restyling.

## Non-goals (do not touch)

- Financial and validation contracts (v0.3 + v0.35): quantities from measured
  geometry, remainder reconciliation, server-enforced locks, staged polygon
  rules, version-bound proposals.
- Deterministic engine behavior and fixture wording.
- The staged capability envelope (D27): no new solver powers hidden in a
  restyle. Any control the solver cannot support stays out.

## Target layout, desktop ≥1280 px

```
┌ topbar: site name · profile · determinism badge · Undo/Redo · save state ┐
│ Objects │  CENTERED PLAN (largest live region)  │ Contextual inspector   │
│ projects│  toolbar: Fit · zoom · Expand · layers │ selection-driven:      │
│ site    │                                       │  nothing: site summary │
│ open sp │  persistent strip (below plan):       │  lot: identity+reshape │
│ lots    │  homes · green · road · allowance ·   │  open space: dims+lock │
│ entrance│  owner outcome, each with its change  │  entrance: edge+offset│
│ compare │  issues count → jumps to Issues       │  circulation: fam/frnt │
├ dock tabs: Options · Compare · Request · Record · Issues (counts) ───────┤
```

- Plan column flexes; inspector fixed 300 px; objects rail 200 px collapsible.
- The request composer lives in the Request tab AND as a compact bar under
  the strip (same handler, one code path), never covering the plan.
- The assistant verdict appears directly under the composer; proposal review
  shows its frozen-scenario hash (first 8) so staleness is legible.

## Screen-sized labels

- SVG geometry text is banned for reading-size content: lot numbers move to
  ≥11 px screen-space labels anchored to centroids (recompute on zoom, never
  scale with geometry). Dimensions live in the inspector + a single caption
  line under the plan, not on the canvas.
- Minimum touch/click target 24 px for handles; vertex handles 12 px min with
  4 px halo hit area.

## States (every object, every mode)

- Selected / editing / draft-valid / draft-invalid / locked / carried-reshape /
  conflict-listed: exactly one visual language each, shared by lots, open
  space, and entrance. Invalid never resembles valid (red dashed, never solid).
- Drafts render ghosted over a dimmed committed plan; metrics strip shows
  "Preview — changes not applied" whenever any draft is open.

## Comparison workspace

- Dedicated Compare tab content (not a cramped dock corner): A/B selectors
  over working + cards, Fit both, Expand to 72 vh, delta table with the same
  formatting functions as the strip. Saved comparisons stay OUT (v0.3 AC-24
  unbuilt) — label snapshots "this run only".

## Responsive rules

- ≤900 px: single column (plan → strip → inspector → dock), no page-level
  horizontal scroll at 375 px; vertex table fieldsets wrap (already true).
- Canvas toolbar wraps; Expand becomes full-width plan with inspector below.

## Acceptance of the redesign itself

- Re-run the audit's five screenshots at 1440×900: settled plan ≥700 px
  wide; labels legible without zoom; composer reachable without scrolling
  past the plan; no assistant panel overlapping geometry.
- All existing browser acceptance tests still pass (implementer re-runs the
  audit prompt's independent checks, not their own click-through).

## Current implementation note — v0.5

The SPEC ONLY status above describes the original proposal. The implemented
workspace and boundary interaction are now governed by `DESIGN.md` and
`PRD_v0.5.md`; see `evidence/polygon-workbench/README.md` for current-build evidence.
The original proposed layout and capability deferrals are retained as history.

## Implemented visual viewport revision

The latest supplied screen/HTML reference is implemented through the existing
workbench rather than a separate static mockup. See the current viewport section
in DESIGN.md for the adopted composition and `evidence/stitch-viewport/README.md`
for screenshots and actual browser evidence. The light drafting field, square
slate shell, floating tools, hatch/callout graphics, local stroke icons and
measured annotations replace the earlier card-like presentation.

The drawing fills its full DOM viewport with an aspect-correct camera; there is
no inner fixed-size artboard. Viewport-edge pan, cursor-anchored zoom, fit,
resize stability, touch, layer controls and scale calibration are checked in a
separate browser suite. Existing planning generation, geometry, costs, accepted
projects and draft/history contracts remain authoritative. No fabricated solar,
zoning, CRS, saved scenario or DXF/IFC capabilities are introduced by the visual
reference.

### Planner-feedback extension

Keep the continuous canvas composition. In boundary mode, lead the inspector
with measured consequences before Apply; access placement follows. Use actual
edge/corner numbers, highlight conflicting segments, and display the measured
access apron as circulation. Site selection places access controls beside its
summary. Minimum park area is separate from a fixed park shape/location.
Successful options disclose what was explored and what stayed fixed. Mobile
selection exposes its area and a direct inspector action. Saved-state disclosure
must explain accepted-plan recovery and session-only work without implying that
preview alternatives or undo history are saved. See PRD v0.7 for the scope.
