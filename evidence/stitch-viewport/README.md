# Continuous drafting viewport and supplied visual reference

This revision implements the supplied `screen.png` and `code.html` composition
inside the working app. Attached documents were treated as design references,
not instructions to execute their scripts or replace working planning logic.
The screenshot's light field/slate/violet direction takes precedence over the
attached text's conflicting dark-canvas palette and microscopic controls.

## Result

- Flush square dark shell, narrow icon rail, floating select/pan/view tools,
  technical grid and dimensions, violet cross-hatched park with a measured area
  callout, cyan entrance tag, compact evaluator and activity strips.
- The SVG is the **entire drawing viewport**, with a camera based on its actual
  measured size. There is no fixed inner artboard. Blank areas at either edge
  accept pan/zoom; the real site boundary and geometry remain proportionate.
- Grid, cursor positions, dimensions and scale use the same local-metre transform.
  The scale is checked against rendered site metres, including on mobile.
  Untouched views fit on resize; manually adjusted views preserve scale/centre.
- The inspector has a compact object picker and contextual controls. Park width,
  depth and clearance lead when the park is selected. Subdivision parameters,
  template, constraints, advanced object/source tools and assumptions remain
  accessible. Request review, assistant and optimization retain their real flows.
- Local SVG icons perform supported actions. Grid, dimension, footprint and label
  switches change presentation only. Export JSON calls the existing accepted-plan
  record export. No fictional scenario, solar, zoning, CRS or CAD format was added.

The engine geometry was preserved: actual lot counts and empty/unallocated land
remain visible rather than stretching or inventing features to mimic a picture.
The project worktree remains uncommitted.

## Checks

- Root `npm test`: **413 checks passed**, including shared geometry, persistence,
  search, finance, snapshots and HTTP server fixtures (`engine-tests.log`).
- Production build and lint passed without warnings (`build.log`, `lint.log`).
- **59 planning browser checks passed** (`planning-browser.log`,
  `browser-results.json`): editing, locks, template/park/street regeneration,
  undo/redo, save/reload, proposal/search/preview/apply, comparison, stale and
  delayed-response rejection, legacy compatibility and touch template controls.
- **38 viewport browser checks passed** (`viewport-tests.log`,
  `viewport-results.json`): full-size viewport, complete site fit, scale calibration,
  no horizontal overflow at all sizes, edge panning, anchored zoom, stable manual
  scale, layers, rail/toolbar synchronization, measured assistant facts, real JSON
  download and touch edge interaction.
- Actual browser zoom **2.0**, checked with the browser zoom API, CSS viewport and
  DPR; keyboard coordinate creation, closing and applying a boundary passed at
  that zoom (`zoom-results.json`, `zoom.log`).

The final production asset and check counts are in `verification.json`.

## Screenshots visually inspected

- [1600×1280 reference composition](viewport-1600.png)
- [1440×900](viewport-1440.png), [1024×768](viewport-1024.png),
  [375×812](viewport-375.png)
- [Polygon 1440](polygon-1440.png), [1024](polygon-1024.png),
  [375](polygon-375.png)
- [Live boundary draft](boundary-live-preview.png),
  [park rerouting](park-reroute-1440.png),
  [shared template](template-draft-1440.png), [comparison](comparison.png)
- [Assistant](assistant-1440.png), [mobile controls](mobile-controls.png),
  [actual 200% browser zoom](zoom-200-actual.png),
  [boundary editing at 200%](zoom-200-editor.png)

The draft banner initially intercepted top-corner placement after the toolbar
became floating. It now sits in the lower viewport clearance. A mobile-only CSS
scale shrink was also caught and corrected. Iteration captures/failure records
are retained in `iterations/`; the logs above describe the final build.

## Remaining gates

The panel scrolls on short desktop displays and stacks below the drawing on
mobile. Touch was emulated in Chromium; physical touch and independent human
visual/task acceptance remain open. No real model is configured and no real-model
round trip is claimed. The existing bounded orthogonal routing, one rectangular
park, west/east entrance and one-floor template limits are unchanged; PRD v0.6
and the prior dynamic-inspector evidence describe them.

## Reproduce

Run the production preview on port 5173 and tool server on 5174, then:

```sh
npm test
npm run build --prefix web
npm run lint --prefix web
PLAYWRIGHT_MODULE=/path/to/playwright node tests/stitch-viewport-browser.cjs
UNBUILT_EVIDENCE_DIR=evidence/stitch-viewport PLAYWRIGHT_MODULE=/path/to/playwright node tests/dynamic-inspector-browser.cjs
UNBUILT_EVIDENCE_DIR=evidence/stitch-viewport PLAYWRIGHT_MODULE=/path/to/playwright xvfb-run -a node tests/browser-zoom.cjs
```
