# Residential master-planning SOP v2.0 — implemented increment

Date: 1 November 2026. This delivers a connected working residential planning
path, **not completion of every SOP capability**. The owner's latest direction
supersedes old prepared-rectangle, single-product and house-template-first
restrictions. The full baseline and final status matrix is
[RESIDENTIAL-SOP-GAPS.md](../../docs/RESIDENTIAL-SOP-GAPS.md).

## Baseline and preservation

Inspected the running production planner before editing: [baseline](baseline.png)
and [visible workflow](baseline-ui.txt). Read repository architecture, current
PRDs, implementation/handoff notes, geometry, records, persistence and tests.
No applicable AGENTS.md exists in this repository. Baseline root suite: **856
passing checks**, recorded in [baseline-tests.log](baseline-tests.log).

The baseline has genuine road unions, polygon boundary/lot edits, park locks,
transaction previews, plan history and durable named projects. Its housing mix
means house templates, not residential lot products. Its generated parcels are
Rect-based and site-road context does not confer access permission. Session-only
brief rules do not persist. These are code findings, not assumptions from demos.

The pre-existing extensive dirty/untracked tree is retained. No reset, staging,
commit, push, deployment, dependency installation or external message was made.
The already-running local preview serves the updated production build. Old
geometry engines and their saved data remain intact.

## Practical changes

Open **Residential planning** in the site status strip. Establish a boundary in
the existing project first; this entry remains available on tablet/mobile.

The residential editor stores a separate polygon scenario within the same named
project. Explicitly import the accepted site's boundary, road inputs and spaces,
or load a clearly fictitious fixture. Import does not invent access permission:
the external road needs an eligible gate interval. Existing house assignments,
manual lot reshapes and finances are preserved in the legacy plan; they are not
silently converted to polygon products.

- A durable brief separates fixed requirements, preferences, adjustable variables,
  unknowns, sources, scale status and the declared objective.
- Stable lot products define frontage first, depth, dimensional variation, actual
  area limits, irregular permission, minimum rear/front span and maximum saleable
  area. Products retain graphic identities and optional sourced/date/scoped rates.
- A road section assigns the same product to both sides. Targets support valid
  unit percentages, actual valid lot-area percentages or integer counts; tolerance,
  mandatory/preferred status and largest-remainder rounding are explicit.
- External alignment, ROW and carriageway are separate inputs. Only explicitly
  eligible frontage allows the one supported entrance. The gate, perpendicular
  internal transition and off-site connection are real polygons. Existing external
  ROW inside the site raises a blocker rather than silently producing lots there.
- Full-width internal corridors are unioned. Corner returns add physical land;
  they cannot trim the declared minimum corridor strips. Blocks subtract the
  road footprint and protection/reservation envelopes, preserving polygon holes.
- Lot generation follows actual merged kerb chains, including polygonised returns.
  Whole and clipped irregular lots must pass frontage, usable/maximum depth,
  area, taper, containment and overlap checks. Difficult candidates remain
  residual and report their binding rejection reason.
- Fill tests actual residual polygons with existing products and permitted
  dimensions. A positive fixture grows from **19 to 21 valid lots**; blocked
  candidates remain residual. There is no area-only invented capacity.
- Road, entrance, group/product and flexible-space edits regenerate dependencies.
  Held lots retain exact geometry; fixed protection and locks resist edits.
  A failed calculation labels the retained drawing/figures as **Last accepted**,
  never as calculated proposed quantities. Accept commits geometry/schedules in
  one operation; Cancel and Undo/Redo are verified.
- Mix rebalance works inside an unaccepted draft, including a failing mandatory
  target. It tests actual whole-group allocations and transition positions and
  regenerates polygons. It does not relabel isolated lots or just change a chart.
- Schedules distinguish valid/unresolved/invalid records. Valid yield, area,
  composition and cost use the same current scenario. Physical lot allocations
  of all statuses remain separate for land reconciliation. Zero-count shares and
  metres per valid lot are undefined.
- Land reports separate lots, unioned internal roads, fixed protection, flexible
  space, other reservations and residual, with explicit gap and overlap errors.
  External roads and off-site connections are excluded from internal quantities.
- Per-lot costs use current valid product counts. Missing rates remain unpriced.
  Common works use measured m or m² and cannot duplicate an included scope.
  Partially included scopes retain a missing-cost explanation.
- Alternatives change unlocked road structure or group allocation/transition.
  Search tests at most **64** configurations and keeps up to five distinct results.
  Qualification gates precede the declared objective; there are no weighted
  scores or optimum/impossibility claims. Unknowns prevent qualification.
- Save named alternatives, compare at the same frame/orientation, shortlist up to
  two, record reasons and review an alternative before accepting it. Full project
  backups preserve all scenarios, locks, inputs, schedules and decisions.

## Automated and browser verification

- **951 root checks pass**, comprising the preserved 856 and **95 new residential
  geometry/integration checks**. See [regression log](regression-tests.log) and
  [targeted residential log](geometry-tests.log).
- **26 residential browser checks pass**, including the six requested evidence
  cases, mandatory draft rebalance, failed-calculation retention, locking,
  cancellation, Undo/Redo, export/reopen and 1440/1024/375 px layouts. No uncaught
  browser errors. See [browser results](browser-results.json) and
  [browser log](browser-tests.log).
- **203 distinct legacy browser checks pass**: 20 project lifecycle, 36 saved
  alternatives, 57 street editing, 31 open spaces and 59 dynamic-inspector checks.
  The project lifecycle also passed again on the final entry layout. Logs are
  `legacy-projects.log`, `legacy-projects-final.log`, `legacy-alternatives.log`,
  `legacy-streets.log`, `legacy-spaces.log`, `legacy-inspector.log`.
- TypeScript/production build and lint pass: [build](build.log), [lint](lint.log).
  Vite reports a chunk-size advisory; this is not a build failure.
- Four reproducible fictitious boundaries cover rectangle, angled, concave and
  narrow neck. Separate cases cover multiple products, protected envelopes,
  flexible space, branching junctions and accepted curved-frontage polygons.
- Reviewed screenshots of the baseline, updated plan, comparison and responsive
  layouts. Automated screenshots/checks do not establish professional acceptance,
  physical-device behavior, screen-reader quality or cross-browser correctness.

All 20 requested verification topics are exercised within the implemented
contracts. Topics involving flexible location commitments, opposing-side
exceptions, centreline arcs, crossing design and broader optimization remain
partial as listed in the status matrix. No current automated failure is hidden
by marking those features complete.

## Required edit evidence

[Full evidence JSON](browser-results.json) contains starting inputs, actions,
resulting inputs and actual lot polygons, quantity changes and constraint states
for each case. `project-record.json` is a reproducible full project export.
The table below is generated from the browser evidence after the final run.

| Case | Valid lots before → after | Road area m² before → after | Physical lot area m² before → after | Constraint result |
|---|---|---|---|---|
| [Entrance movement](entrance-move.png) | 27 → 26 | 908.00 → 910.27 | 2560.00 → 2431.11 | 0 failures; 3 unknown checks retained |
| [Road bend movement](road-move.png) | 26 → 26 | 910.27 → 913.61 | 2431.11 → 2429.61 | 0 failures; 3 unknown checks retained |
| [West product group](product-group.png) | 26 → 22 | 913.61 → 913.61 | 2429.61 → 2814.09 | 0 failures; 3 unknown checks retained |
| [Flexible park reshape](flexible-space.png) | 22 → 21 | 913.61 → 913.61 | 2814.09 → 2683.87 | 0 failures; 3 unknown checks retained |
| [Alternative comparison](alternatives-comparison.png) | 6 saved alternatives including named accepted snapshot | Same frame/definitions | Real road/section geometry | Qualification and unresolved status visible |
| [Save / reopen](saved-reopened.png) | 22 → 22 | 1047.20 → 1047.20 | 2792.84 → 2792.84 | 0 failures; 3 unknown checks retained |

## Known limits and unresolved inputs

1. **One entrance**; owner-fixed and adjustable modes work. Additional entrances,
   entrance-candidate search and off-site engineering/permission are not resolved.
2. **Polyline centrelines and kerb returns**; designed centreline arcs, vehicle
   swept paths, turning-head engineering and detailed junction-angle exceptions
   are not verified. Typed turning requirements do not become a passed check.
3. **Conservative protection**; original features and buffered envelopes are
   measured polygons. Selective permissions stay conservatively reserved.
   Recording an approved crossing does not make its missing design valid.
4. **Declared measurements**; local frame is 0–500 m, coordinate tolerance 1 mm,
   land reconciliation tolerance 0.01 m² and numeric operation coordinates snap
   to 1 µm. Curves/buffers are polygonised with approximately 5 mm chord error.
   Frontage is shared polygonised primary kerb length; usable depth samples rear
   intersections at 10/50/90% of its chord, maximum depth uses the full polygon,
   and rear taper is the rear span/front chord ratio. These are planning methods,
   not statutory definitions. The independent dimension check is a saved input;
   this editor does not itself perform a second raster calibration.
5. **Bounded generation/search**; at most 5,000 lots, 1,000 stations per kerb-chain
   pass and 64 searched configurations. Generation is greedy; curves/edges may
   reject usable arrangements the search does not find. Some edits can change
   subdivision phase in otherwise similar groups. Held geometry remains exact.
   Large scenarios still run synchronously; no performance guarantee was measured.
6. **Grouping/space commitments**; opposing sides share products without an
   exception mechanism. Flexible minimum area, access, shape locks and site
   containment are checked; additional location commitments are brief text.
7. **Persistence**; project v15 and decision record v16 add residential scenarios.
   Earlier versions remain readable without silent conversion. New-version files
   need this application version. Reproduction checks use numerical tolerances,
   exact discrete counts and identities; materially altered saved schedules or
   polygons are refused while preserving the file. Source media are not embedded.
8. **Two geometry contracts**; the residential study and legacy Rect plan are
   explicitly separate. New edits do not synchronize to legacy finance/AI tools.
   Residential Undo/Redo operates within the open editor and is not retained
   after closing/reloading it. Full project backups preserve alternative
   collections; the residential-only import intentionally previews the accepted
   scenario and says to use a full project backup for collections.
9. **Incomplete product direction**; combining alternatives into a newly
   recalculated scenario, manual lot polygon reshaping in this editor and broader
   automated routing/orientation are not implemented.
10. **No real assignment data supplied**; fixtures are fictitious. Survey assurance,
    real access permission, road dimensions/turning requirements, protection
    authorisations and rate provenance remain editable project inputs. Missing
    costs are not zero. A saved study and geometry pass are not approvals.

## Run and review

The local production preview is already at `http://localhost:5173`.
Open an existing project with a boundary and choose **Residential planning**.
For a repeatable example, open **Start or reset residential study → Load
fictitious rectangle**, inspect its products/unknowns, then Accept. Try entrance
offset 50 → 54 m, move a street bend, reassign the west product group, and move
the park's west edge. Use reports/alternatives before accepting changes.

From a fresh checkout (Node supporting `--experimental-strip-types`):

```sh
npm ci
npm ci --prefix web
npm run build --prefix web
npm run preview --prefix web -- --host 0.0.0.0 --port 5173 --strictPort
```

For the legacy tool server in another terminal:

```sh
node --experimental-strip-types --no-warnings server/intent.mjs --port 5174
```

The new residential geometry does not require AI or that server. Source media
must be reattached through the existing site-context tools if needed.

```sh
npm test
npm run test:residential
npm run lint --prefix web
PLAYWRIGHT_MODULE=/path/to/playwright node --experimental-strip-types --no-warnings tests/residential-browser.cjs
```

The test defaults to the local preview; `UNBUILT_TEST_URL` and
`UNBUILT_EVIDENCE_DIR` override its address/output. Legacy browser suites accept
the same Playwright module variable. Test browser contexts are isolated from
existing user browser projects.

## Changed files and next increments

New implementation: `src/residential.ts`, `src/residential-fixtures.ts`,
`web/src/unbuilt/ResidentialPlanner.tsx`, `web/src/unbuilt/residential.css`.
Integration: `src/persist.ts`, the residential additions to `web/src/App.tsx`,
`web/src/drafting.css` and `package.json`. Reproducible tests:
`tests/residential.mjs`, `tests/residential-browser.cjs`. Documentation:
`docs/RESIDENTIAL-SOP-GAPS.md`, appended WORK-CONTEXT/DECISIONS and this evidence.
Other already-dirty files were preserved. No new commit was made.

Next priorities, in order:

1. Engineered centreline curves, vehicle turning/junction validation and explicit
   off-site/multiple-entrance contracts, with swept-path fixtures.
2. Supported conditional crossings, selective land permissions, enforceable
   flexible-space location regions and facing-group exceptions.
3. Shared canvas/history and scenario combination, with an explicit migration
   strategy for legacy manual parcels, homes and finance/AI consumers.
4. Broader orientation/routing/packing search and asynchronous geometry previews
   for larger sites; compare results against independent planner layouts.
5. Independent survey-dimension verification and professional/cross-browser,
   screen-reader and physical-device review using actual assignment data.
