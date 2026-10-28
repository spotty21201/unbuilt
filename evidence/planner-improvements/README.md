# Residential planner feedback — implemented and verified

This revision addresses the supplied first-visit observations. The original
observations and screenshots remain in `../planner-first-visit/`; they are
feedback, not proof of current behavior. No commit or push was made.

## Changes

- Boundary-edge entrance selection, along-edge distance and projected/snap-aware
  dragging, including sloping edges. Explicit midpoint checks offer measured
  geometric choices without claiming public access or choosing automatically.
- A contained, disjoint tapered access apron joins supported entrances to live
  orthogonal Spine streets. True apron area contributes to road quantities,
  costs, search, server explanations, comparison and exported geometry.
- Boundary review leads with accepted/proposed area, homes, road area including
  access, park, allowance and owner outcome before Apply. New-site previews and
  Apply use the same geometry. Unsupported layouts are explicitly unavailable.
- Red conflict segments and numbered endpoints identify invalid outline repairs;
  invalid drafts cannot apply. Accepted plans remain available through Cancel,
  Undo and Redo. New-site preview inputs keep stable references between edits.
- A minimum open-space area is independent of fixing exact park shape/location.
  Both commitments persist and are validated in generation and search.
- Every successful search discloses the tested family/frontage scope and the
  inputs held. Options identify measured allowance improvements/deteriorations.
- Local question routing recognizes capacity limits and investigation language;
  it states when a binding constraint is unmeasured. Client comparison text is
  editable, grounded in measured plans and explicit about unverified causes.
  A replacement question cancels the prior in-flight answer.
- Selected-object summaries reset to the top of the inspector. A mobile area
  readout opens/focuses that inspector. Save disclosure explains accepted-plan
  recovery and provides a download without promising saved previews/history.
- New semantics require project/scenario version 4 and record version 5. Earlier
  projects retain their interpretation; older envelopes carrying new fields
  are refused. Prior PRDs are preserved; current requirements are in v0.7.

## Verification

- `npm test`: **438 checks passed**, including **19 new planner-feedback checks**
  and server tests for versioned boundary access and measured road area.
- `npm run build --prefix web`: passed.
- `npm run lint --prefix web`: passed without warnings.
- `git diff --check`: passed.
- `tests/planner-feedback-browser.cjs`: **41 checks passed** on the production
  preview, with no page or console errors.
- `tests/dynamic-inspector-browser.cjs`: **59 checks passed**, retaining object,
  template, park/street, request/proposal/search/preview/apply, comparison,
  persistence, stale/in-flight response and emulated-touch regression coverage.
- `tests/stitch-viewport-browser.cjs`: **38 checks passed**, including full-stage
  SVG, calibrated scale, cursor zoom, edge pan, layer controls and touch pan.
- `tests/browser-zoom.cjs`: actual Chrome tab zoom **2.0**, independently read via
  the tab API: same physical window, CSS width 1440 → 720, DPR 1 → 2. Keyboard
  boundary creation/close/apply and no horizontal overflow passed.

There are **138 browser checks**, plus the separate actual-browser zoom checks.
`verification.json` records the build asset shared by these browser runs and the
live preview. Logs and per-suite JSON results are in this directory and its
`regression/`, `viewport/` and `zoom/` subdirectories.

### Verified planning cases

1. Draw a five-corner site: (10,0), (60,0), (120,10), (110,100), (0,90).
   Its hand-calculated area is **10,250 m²**. The initial assumed west access is
   unavailable before Apply. Selecting edge 5 gives **16 homes**, **480 m²** park,
   **663.3575240641609 m²** road including the apron, approximately **Rp2.08bn**
   land allowance and **Rp7.92bn** shortfall at the sample assumptions. Displayed
   square-metre summaries round for readability; calculations do not.
2. Choose a midpoint, apply, undo/redo, reload, change entrance distance, drag
   along the sloping edge and undo. Download/import the version 5 record and
   confirm exactly restored coordinates and gate. `sloping-site-record.json`
   is the actual browser download.
3. Cross two edges, identify the red segments, repair their coordinates and
   cancel. Apply remains disabled while the outline is invalid.
4. Set a 480 m² minimum, unlock exact shape, reject a 460 m² park and accept a
   500 m² park. Geometry and constraints survive the alternative save workflow.
5. Ask the two supplied planning questions, review/run the resulting proposal,
   inspect search scope, preview 11 m frontage, request a server-measured
   explanation and edit/clear the client text. Apply the alternative, download,
   undo, import and reload it. `reviewed-alternative.json` is that download.
6. Inspect the polygon at 1440×900, 1024×768 and 375×812. Select a mobile lot and
   open/focus its inspector without horizontal overflow.

Engine fixtures additionally test all four sloping approaches in both boundary
windings, blocked/corner-spanning gates, connectivity, containment, allocation
conflicts, true-area reconciliation, road-cost inclusion, invalid minimums,
legacy quantities and version downgrade refusals. A rectangular boundary-edge
apron has a hand-calculated **21 m²** area; its joined street totals **723 m²**.

### Screenshots visually inspected

- `sloping-access-review.png`: consequences before Apply.
- `sloping-access-applied.png`: measured irregular plan and entrance apron.
- `conflicting-edges.png`: specific segments and repair feedback.
- `minimum-park-area.png`: independent minimum-area commitment.
- `capacity-investigation.png`: supported investigation without a claimed cause.
- `client-explanation.png`: measured comparison and editable client text.
- `viewport-1440.png`, `viewport-1024.png`, `viewport-375.png`: live polygon views.
- `mobile-selection.png`: selected lot's focused inspector.
- `zoom/zoom-200-editor.png`: actual 200% keyboard boundary workflow.
- `viewport/viewport-1600.png`: full reference-size drawing composition.

Earlier exploratory captures are preserved under `iterations/`.

## Limits and remaining gates

This is bounded orthogonal routing with one rectangular park, whole lots and a
checked tapered entrance apron. A safe apron/road path may not exist at a chosen
edge/position. Midpoint checks do not explore every entrance position. The fixed
Loop accepts only legacy west/east gates. Imported legacy projects can opt into
live planning through the existing explicit preview/apply conversion.

No external street connection, access permission, turning radius, traffic
capacity, surveyed location, curved network, zoning or solar performance is
verified. Search varies family/frontage only; it does not prove site capacity or
optimize park location, boundary, home template or selling price. A minimum area
allows direct park edits; search still holds its current shape and location.

Accepted plans and downloaded, applied alternatives can be reopened. Unapplied
previews, comparison sets, searches, undo history, drafts and photos remain
session-only; no multi-scheme project library is claimed.

The live tool server is online with a mock intent adapter and **no configured
model**. Geometry/search/explanations are deterministic measurements. A real model
round trip, physical touch hardware, and follow-up independent planner task and
visual acceptance remain open. Automated Chromium touch emulation and visual
inspection do not close those gates.

## Reproduction

With the production preview on port 5173 and the tool server on 5174:

```sh
npm test
npm run build --prefix web
npm run lint --prefix web
PLAYWRIGHT_MODULE=/path/to/playwright node tests/planner-feedback-browser.cjs
UNBUILT_EVIDENCE_DIR=evidence/planner-improvements/regression PLAYWRIGHT_MODULE=/path/to/playwright node tests/dynamic-inspector-browser.cjs
UNBUILT_EVIDENCE_DIR=evidence/planner-improvements/viewport PLAYWRIGHT_MODULE=/path/to/playwright node tests/stitch-viewport-browser.cjs
UNBUILT_EVIDENCE_DIR=evidence/planner-improvements/zoom PLAYWRIGHT_MODULE=/path/to/playwright xvfb-run -a node tests/browser-zoom.cjs
```

Use an installed Playwright package and its matching Chromium. Create the zoom
output directory before running that separate script.
