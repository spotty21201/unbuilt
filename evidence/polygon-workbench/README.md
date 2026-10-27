# Polygon workbench verification — 27 October 2026

Verification was performed before committing. The pre-existing modified and
untracked project work was retained. This review independently opened the supplied reference
images, inspected the running production preview and ran browser workflows.
Earlier acceptance and visual-review claims were treated as historical evidence.

## Running build

- On takeover, port 5173 served production asset `index-6-6nXSzb.js`, matching
  the reported handoff. `before-1440.png` captures that running interface.
- Current port 5173 serves `index-BBpbEAfo.js` and `index-CeDCwCFo.css` from
  `web/dist`. The preview process remains on port 5173.
- The deterministic tool server was restarted against the changed source on
  port 5174. Health reports `modelConfigured: false`; measured explanations
  below are actual deterministic HTTP calls, not a model round trip.

## Problems found and repaired

Rectangular site area, containment and serialization assumptions extended through
the entire product. Added an authoritative polygon contract in `src/boundary.ts`
and carried it through generation, lot editing, area reconciliation, snapshots,
server calculations, search, comparison and export/import.

The prior shell was a useful foundation. Browser and visual review found
canvas padding made the screen-to-metre transform inaccurate on narrow pages;
floating tools could cover geometry; scale-bar text intercepted a corner tap;
assistant text and comparison quantity labels had weak contrast; comparison
crowded the plan; preview annotation text collided with lot numbers; and mobile
outcomes were duplicated or far below the controls. These were repaired and the
resulting screenshots were opened and visually inspected. This is implementation
review; human aesthetic acceptance remains open.

Invalid imported frontage could make subdivision unbounded; finite 1–500 m
frontage is now required by project/snapshot validation and both generators.

Decision-record export multiplied neither the selected price nor ceiling into
base currency units. Import divided the owner's base-unit price by millions
instead of billions and dropped target return. Corrected and verified roundtrip.

## Supported boundary and planning behavior

One simple closed polygon, 3–64 vertices, no holes or separate pieces. Local
coordinates are 0–500 m, area at least 1 m², either winding. Closing is implicit.
Users can draw/close, drag vertices, insert at a midpoint, delete, use a numeric
coordinate table, correct invalid geometry, cancel, apply and undo/redo. Pointer
edits snap to 1 m. Draft undo includes whole drag gestures; plan Apply is one
history entry. Invalid drafts never replace the accepted/saved plan.

Generation is limited to the existing axis-aligned spine/loop families. Entire
roads, full west/east gate span and green rectangle must fit. Whole outside lots
are omitted; lots are not clipped into unverified shapes. Convex and concave
sites can work within this envelope. Unsupported shapes remain saved/editable;
the layout is unavailable, no roads/lots are presented as valid, UI economics
are withheld, search cannot qualify that layout, and explanations return 422.
Assistant facts derive geometry even when economics are unavailable; unsupported
layouts keep the real polygon remainder. Assistant instances are keyed by the
scenario/comparison version, clearing answers in the same render as an input
change and aborting requests on unmount.

No sloping-road routing, north/south gate, holes, multipolygons, road drawing,
lot split/merge, automatic home relocation, georeferencing or new export format
is claimed. JSON is the supported persistence/export format.

Polygon projects and snapshots use version 2; legacy rectangular version 1 is
still readable. Polygon record exports use version 3; rectangular record exports
remain version 2. Older builds refuse the newer polygon formats. New boundary
edits preserve compatible manual lots; removal conflicts require the existing
explicit choice. Retained edits that violate the proposed boundary block Apply.
Searches and comparisons remain session-only, as before.

Independent hand calculation used throughout:

```
(0,0), (120,0), (120,100), (50,100), (0,60)
Area = 120 × 100 − (50 × 40 / 2) = 11,000 m²
Spine, 10 m frontage: 18 homes; road 720 m²; green 480 m²
Parcels 3,600 m²; unallocated 6,200 m²
11,000 = 720 + 480 + 3,600 + 6,200
Fictional sample finance: land allowance Rp2,795,600,000
```

## Test evidence

| Verification | Result | Evidence |
|---|---|---|
| Original root suite | Passed | `baseline-tests.log` |
| Current `npm test` | 379 PASS checks | `tests.log` |
| Polygon validation/area/containment/generation/persistence/snapshots/history | 15 grouped checks, many adversarial assertions | `tests/boundary.mjs`, included in root suite |
| Actual HTTP polygon search/explain/refusals | Passed; 12 added checks | `tests/server.mjs`, included in root suite |
| Web production build | Passed | `build.log` |
| Browser journey | 50 checks passed, no uncaught browser errors | `browser.log`, `browser-results.json`, `tests/boundary-browser.cjs` |
| Actual 200% browser zoom | Passed, including coordinate creation/close/apply | `zoom.log`, `zoom-results.json`, `tests/browser-zoom.cjs` |
| Web lint | Passed, zero warnings | `lint.log` |
| Real model round trip | Open: not configured | Health probe; no successful call claimed |

Browser checks cover drawing and hand-verified area; scale-invariant handles;
move/add/remove; draft and plan undo/redo; crossing rejection/correction;
Cancel/Escape; reload; lot reshape; open-space edit; entrance coordinate edit and
drag; pan over lots; zoom without quantity changes; request → reviewed proposal
→ search → preview → apply; two geometrically different plans (18 vs 15 homes);
server-measured explanation; changed-input clearing; delayed real-response
rejection after input change; JSON export/import with correct currency units;
unsupported-layout behavior; and native Chromium touch-event drawing/dragging.

`browser-zoom.cjs` sets browser zoom with the browser extension API and separately
checks `getZoom() === 2`, a constant 1440 px outer window, CSS width 1440 → 720,
and DPR 1 → 2. It does not use CSS zoom or substitute viewport/DPR emulation.
Native screenshot capture avoids a full-page capture bug at actual zoom. Browser
content captures are 1440×901; the one-pixel window decoration difference is
recorded, not relabeled as a 900 px viewport.

Commands (Playwright is installed elsewhere on this host, not an app dependency):

```
npm test
npm run build --prefix web
npm run lint --prefix web
PLAYWRIGHT_MODULE=/home/spotty/projects/studioos/node_modules/playwright node tests/boundary-browser.cjs
PLAYWRIGHT_MODULE=/home/spotty/projects/studioos/node_modules/playwright xvfb-run -a node tests/browser-zoom.cjs
```

## Screenshots opened for visual inspection

- `default-1440.png`, `default-1024.png`, `default-375.png`: settled workspace.
- `polygon-1440.png`, `polygon-1024.png`, `polygon-375.png`: actual viewport
  captures at 1440×900, 1024×768 and 375×812; accepted 11,000 m² polygon.
- `polygon-375-full.png`: mobile properties and assistant, full page.
- `boundary-draft.png`, `boundary-invalid.png`: drawing/edit and correction.
- `unsupported-boundary.png`: saved boundary with unavailable layout.
- `comparison.png`: complete 18-home and 15-home plans, selectors and return.
- `measured-explanation.png`: server-measured result in the readable assistant.
- `touch-boundary.png`: touch-emulated boundary reshaping, full page.
- `zoom-200-actual.png`, `zoom-200-editor.png`: native browser zoom captures.

## Open gates and limits

Physical-device touch and a screen-reader walkthrough were not tested. Touch
checks use Chromium touch emulation; they do not prove physical-device behavior.
A real model/tool/result round trip is not possible with the current unconfigured
server and was not attempted or inferred. Unrehearsed human planning validation,
aesthetic acceptance and milestone sign-off remain open. No broad optimality,
regulatory, performance or real-world financial claim follows from these checks.
