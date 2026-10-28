# Dynamic inspector and responsive planning verification

28 October 2026. Work is uncommitted. Earlier handoff evidence was not treated as
current verification. The production preview serves `web/dist` on port 5173;
the deterministic tool server runs separately on 5174. The exact served asset
and final checks are recorded in `verification.json`.

## Reference reviewed

The actual [reference video](https://www.youtube.com/shorts/GQ9_nIoKwBQ) was
played through in Chromium. Its media duration was 29.641 seconds; playback
samples/timestamps are in `video-review.json`, with `video-00.png` through
`video-29.png`. This is distinct from the older parking video evidence elsewhere
in the repository.

Observed interaction sequence:

- Roughly 1–5 seconds: the pointer moves a perimeter corner; streets and lots
  change while dragging, followed by populated housing footprints.
- Roughly 8–12 seconds: the pointer resizes the shared housing template; its
  gross-area display changes from 647 to 786 in the sampled frames.
- Roughly 15–28 seconds: an inserted/growing park removes homes and changes
  street routing; the main plan reflects the shared template.

The supplied mockup informed panel hierarchy and colors. Its solar, zoning,
legal FAR, mapping and export claims were not copied into the product.

## Implemented behavior

The inspector has selection-based true areas/share, live geometric parameters,
real invariant controls, the existing contextual assistant/request review and a
cancellable bounded search action. Shift-click/Shift-Enter aggregates lot areas.
A resizable one-floor home template drives canvas footprints, fitting-lot count
and construction costs. Park move/resize and dimension controls reroute the
responsive Spine and remove impacted lots. Up to two cross streets share
inspector/canvas controls. Parameter Apply is one undo step; invalid drafts and
Cancel retain the accepted plan. Preview metrics describe the actual displayed
alternative, with edits disabled until that alternative is applied or cancelled.

The final visual review also found and repaired canvas resizing during a park
gesture: draft/error feedback now belongs in the inspector, so the drawing's
pointer mapping stays stable. Search no longer qualifies zero-home alternatives.
Comparison labels and its outcome strip describe the two explicitly chosen plans.

Legacy projects retain their original generators and convert only through a
reviewable Enable live planning draft. Projects/snapshots with parameters are
version 3; decision records are version 4. New fields are rejected in older
versions, not silently ignored.

## Final verification

- Root `npm test`: **413 checks passed**, including **25 planning checks** and
  new live HTTP server cases. See `engine-tests.log`.
- `npm run build --prefix web`: passed; see `build.log`.
- `npm run lint --prefix web`: passed without warnings; see `lint.log`.
- Current production browser suite: **59 checks passed**, no uncaught page
  errors; see `browser-tests.log` and `browser-results.json`.
- Actual browser zoom: **2.0**, same 1440 px window, CSS viewport width 720 and
  DPR 2, no horizontal overflow. Keyboard coordinate creation/close/apply also
  passed at that zoom. See `zoom-results.json` and `zoom.log`.

Browser coverage includes mouse sliders and template/park/boundary/street-handle
movement; live boundary lot-count changes before Apply; combined lot selection;
locks and accepted-price-cap re-locking; draft cancel/apply/undo/redo; save/reload;
invalid boundary/park protection; manual lot editing; proposal/search/preview/apply;
two distinct plans; live measured explanation; changed-input/in-flight rejection;
search cancellation; pan/fit/zoom; export/import; legacy conversion/undo; keyboard
and Chromium touch template resize.

Hand-derived checks include a 11,000 m² five-vertex browser-drawn site and a
6,000 m² triangle with 672 m² of contained street in engine/server tests.
Twenty 12 × 6 m modeled homes use 1,440 m² of construction area at the declared
rate, changing the sample land allowance to Rp2,299,600,000. Park allocations,
road unions, parcel areas and remainder reconcile to actual site area.

## Screenshots inspected

- [Default 1440×900](default-1440.png), [1024×768](default-1024.png),
  [375×812](default-375.png).
- [Polygon 1440×900](polygon-1440.png), [1024×768](polygon-1024.png),
  [375×812](polygon-375.png).
- [Housing template draft](template-draft-1440.png),
  [park rerouting](park-reroute-1440.png),
  [live boundary regeneration](boundary-live-preview.png),
  [invalid boundary](boundary-invalid.png), [comparison](comparison.png).
- [Actual browser 200%](zoom-200-actual.png),
  [boundary editor at 200%](zoom-200-editor.png),
  [emulated touch template](touch-template.png).

The short laptop panel scrolls; mobile places controls below the drawing with a
show/hide action. The plan and adjacent outcomes remain accessible. Earlier
iteration captures/failures are preserved under `iterations/`; they are not the
final verification result.

## Limits and open gates

Responsive routing is a bounded orthogonal heuristic around one rectangular park,
with whole rectangular lots. A route may exist beyond its tested visibility
coordinates. Loop retains its fixed ring and refuses park/cross-street conflicts.
Entrances still require a straight west/east boundary segment and sufficient gate
width. Curved/diagonal streets, cul-de-sac turning geometry, traffic capacity,
holes, multiple site parts, ADUs, roof/driveway templates, multiple floors,
solar exposure and zoning/legal FAR are not modeled. Park clearance is reserved
unallocated land, not a site-perimeter landscape calculation.

The tool server reports the **mock adapter with no model configured**. Measured
server explanations were tested; no real model round trip is claimed. Physical
touch hardware, independent human task validation, aesthetic acceptance and
milestone sign-off remain open.

## Reproduction

With the production preview and tool server running:

```sh
npm test
npm run build --prefix web
npm run lint --prefix web
PLAYWRIGHT_MODULE=/path/to/playwright node tests/dynamic-inspector-browser.cjs
UNBUILT_EVIDENCE_DIR=evidence/dynamic-inspector PLAYWRIGHT_MODULE=/path/to/playwright xvfb-run -a node tests/browser-zoom.cjs
```
