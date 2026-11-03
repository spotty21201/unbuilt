# External-road-first preparation verification

2 November 2026. Fictitious inputs only. Running local app:
http://localhost:5173. Tools service remains on 5174. Existing browser projects
were not cleared; browser checks use isolated contexts.

The gap matrix, implementation details, planner instructions and precise limits
are in [docs/PREPARE-LAYOUT.md](../../docs/PREPARE-LAYOUT.md). The complete 26-step
SOP matrix remains in [docs/SOP-CONTINUATION.md](../../docs/SOP-CONTINUATION.md).

## Reproducible fixtures

All four sites use supplied West Road, 10 m full corridor, permitted actual
west frontage, two products (6 × 12 m and 8 × 16 m), 50/50 unit mix with ±5
percentage points, an 8 m provisional internal corridor, and explicit dead-end
choice. Products retain their declared dimensional/area/saleable limits.

| Site | Valid lots | Unresolved/invalid lots | Full corridor / protected constraints | Mix | Land gap/overlap |
|---|---:|---|---|---|---|
| Rectangle | 65 | 0 / 0 | No implemented check fails | Pass | Below 0.01 m² |
| Angled | 58 | 0 / 0 | No implemented check fails | Pass | Below 0.01 m² |
| Concave | 44 | 0 / 0 | No implemented check fails | Pass | Below 0.01 m² |
| Narrow neck | 48 | 0 / 0 | No implemented check fails | Pass | Below 0.01 m² |

These are measured valid lots under implemented geometry checks, not engineering
approval or a global optimum. Exact inputs, actual polygons, street relationships,
product schedules and all pass/fail/unknown issues are in the four
`*-scenario.json` records. A single-product rectangular fixture produces a real curved loop with 73 valid
lots. A separate 120 × 40 m fixture, too narrow for the tested loop spacing,
requires the explicit end choice and produces 34 valid lots with physical
cul-de-sac heads. Another fixture produces 52 while retaining the supplied
no-touch natural feature exactly. These fixtures use different constraints and
should not be compared as like-for-like alternatives.

## Automated checks

- Existing root regression: **1,004 PASS assertions**, including residential
  v1/v2, old project formats, project management, quantities and costs.
- New prepare-layout domain/integration tests: **42 passed**. External road
  outside placement, winding/corners, access refusal, product scaling, four site
  geometries, integer mix, real containment/land budget, entrance movement and
  locks, explicit end choice, cul-de-sac footprints, protection, deterministic
  persistence and unchanged fixed boundary. See `domain-tests.log` and
  `domain-summary.json`.
- Existing coupled planner browser regression: **26 passed**. Includes actual
  entrance/road/group/space edits, measured quantities, alternatives/common scale,
  project export, save/reopen and 1440/1024/375 px views. See
  `coupled-browser-regression.log` and `regression-browser/browser-results.json`.
- Existing site-first browser regression: **21 passed**, including supplied
  wetland geometry/hole, irregular five-corner park, clear/reset, stable product
  IDs and complete undo/reopen. See `site-browser-regression.log` and
  `../sop-continuation/site-browser-results.json`.
- Advanced browser regression: **11 passed**, covering real curves/turning
  geometry, scoped costs, vehicle refusal, manual lot polygons, scenario
  combination, the 26-step report and collection persistence. See
  `advanced-browser-regression.log`.
- New end-to-end preparation browser test: **20 passed**, including actual
  external-road drawing/width/name edits, products, asynchronous preparation,
  explicit end choice, entrance/street mouse movement, cancellation, undo/redo
  and exact save/reload. See `browser-tests.log` and `browser-results.json`.
- Production TypeScript/Vite build and oxlint passed. Vite still reports its
  existing large-chunk advisory; lint reports no errors or warnings.

New browser verification results are recorded in `browser-results.json` and
`browser-tests.log`; before/after scenario records accompany actual mouse edits.

## Observed quantities during the new browser flow

Fictitious 120 × 100 m site, West Road 10 m, internal corridor 8 m, 6 × 12 m
Compact / 8 × 16 m Family products at 50/50 unit mix ±5 percentage points.

| Actual browser action | Valid lots before → after | Internal road area before → after | Constraint result |
|---|---|---|---|
| Prepare; explicitly choose cul-de-sacs | 0 → 59 | 0 → 3,162.28 m² | No implemented check fails; supplied engineering/approval inputs remain unresolved |
| Mouse-drag entrance south 3 m | 59 → 58 | 3,162.28 → 3,162.95 m² | Physical connection/shared streets and lots regenerate; mix still passes |
| Mouse-drag first residential street 1 m | 58 → 56 | 3,162.95 → 3,163.61 m² | Corridor and dependent lots change; network remains connected; mix still passes |
| Cancel product-depth preview | 56 → 56 accepted | Accepted geometry retained | Complete accepted product/quantity record unchanged |
| Undo / redo street operation | 56 → 58 → 56 | Restores corresponding measured areas | Full inputs/geometry/schedules restored together |
| Save / browser reload / reopen | 56 → 56 | Exact accepted record retained | Products, groups, locks, assumptions and relationships identical |

A width edit 10 → 12 m moved the actual external centreline from x = −5 to
x = −6 m while retaining the site boundary. Renaming the road left internal
geometry and lot schedules exact. No failed automated checks remain in the final
runs. Build, lint, full root suite and all four browser suites exited successfully;
`verification-summary.json` records their counts.

## Evidence to inspect

- `before.png`, `before.txt`: inspected baseline before this increment.
- `road-products-inputs.png`: named adjacent road with width, dimensional table.
- `prepared-cul-de-sacs.png`: real automatic internal layout, two products,
  measured turning heads and quantities.
- `entrance-moved.png`, `road-moved-lots-regenerated.png`: coupled mouse edits.
- `saved-reopened.png`: accepted result after browser reload.
- `browser-results.json`: starting inputs, actions, full resulting geometry,
  schedules, quantity differences and constraint statuses for the new flow.
- `regression-browser/{entrance-move,road-move,product-group,flexible-space,
  alternatives-comparison,saved-reopened}.png` and `browser-results.json`:
  six SOP evidence actions re-run against this build.

Early browser assertions were corrected during verification: a tangent
corner's tiny access interval is not a substantial frontage; the test must wait
for the separate preview calculation; real pointer events allow screen-pixel
precision while pure domain movement is tested at exact metre offsets. Findings
also led to real fixes: road corner snapping, coupled shared-node gate movement,
search cancellation on preview cancellation, blocking incomplete numeric
product inputs, and keeping pending notices below the plan so they cannot shift
its coordinate frame mid-drag. A separate loop assertion exposed a failing
near-coincident road-strip union: only failed numerical unions now retry on a
1-micrometre coordinate grid, leaving successful existing results exact. Final successful logs supersede `browser-failure.*` diagnostics.

## Run and review

```sh
npm test
npm run test:prepare
npm run build --prefix web
npm run lint --prefix web
node --experimental-strip-types --no-warnings tests/prepare-layout-browser.cjs
UNBUILT_EVIDENCE_DIR=evidence/prepare-layout/regression-browser node --experimental-strip-types --no-warnings tests/residential-browser.cjs
node --experimental-strip-types --no-warnings tests/residential-site-browser.cjs
```

If the preview is not running:

```sh
npm run preview --prefix web -- --host 0.0.0.0 --port 5173 --strictPort
```

Build before opening the preview; rebuilding replaces dist asset names. Review
**Residential planning → Prepare your layout**. Existing legacy tools and their
saved data remain separate. All work stays local/uncommitted.

Changed implementation: `src/prepare-residential.ts`, additive records and
validation in `src/residential.ts`, `src/residential-site.ts`, new-site defaults in
`src/residential-inputs.ts`, `web/src/unbuilt/ResidentialSetup.tsx`, planner/canvas/
worker/view integration, numerical retry in `src/road-surfaces.ts` and
residential CSS. Reproducible tests are in
`tests/prepare-residential.mjs`, `tests/prepare-layout-browser.cjs`; existing two
browser tests received the supplied-centreline button label update. Package
scripts now include preparation regression checks. Existing dirty work was kept.

Next priorities: broader adaptive network/packing search for difficult sites,
explicit user steering of automatic orientation/organizing ideas, and detailed
vehicle-junction swept-path work where project inputs make those checks possible.
