# Residential SOP continuation — implementation and verification

Owner request: 1 November 2026 (client date). Full requirement-by-requirement
baseline, changes, current status and limitations:
[docs/SOP-CONTINUATION.md](../../docs/SOP-CONTINUATION.md).
This report supersedes the outstanding implementation gaps of the earlier
`evidence/residential-sop/REPORT.md`; that earlier report remains as history.

## Practical outcome

The residential workbench now starts before any entrance or lots exist. Establish
and lock the boundary, draw/import the **actual existing main road**, enter its
ROW/carriageway and permitted frontage, then select an entrance from that
physical frontage. A distant road or a restricted edge cannot supply valid
access. External roads remain outside internal-road quantities; ROW physically
inside the site is an explicit other reservation.

Natural features retain their **given position and irregular source outline**,
including holes and portions outside the site. Original geometry and protection
buffer are distinguishable. Proposed open spaces can be **freely drawn/imported
irregular polygons**, with road-edge snapping, vertex editing, minima, access,
location commitments and lock handling. Whole-space moves also move its holes.
Fixed-source correction requires an authorizing record retaining previous
geometry; ordinary layout edits cannot move fixed protection.

All 26 SOP steps have an in-app review connected to actual inputs and calculated
results. The workflow also supports real centreline arcs, junction returns,
turning heads, declared rigid-body screening, selective protection/crossing
envelopes, side-specific product exceptions, manual held lot outlines, scoped
costs, meaningful bounded alternatives, two-option shortlisting and combination.
A combination and a revision of a saved option get distinct scenario identities.

Calculations and searches run in cancelable background work. Failed/stale work
cannot replace the accepted scenario. Proposed quantities are pending while the
last accepted quantities remain identified; accept commits the complete result.
One undo restores geometry, inputs, schedules and workspace decisions together.
Session history survives closing/reopening the residential editor. Saved project
v16 / decision record v17 preserve new relationships, locks, calibration,
alternatives and decisions; the original v1 residential calculator is frozen.
A reviewed upgrade recalculates old studies instead of silently changing them.

## Automated results

- Full `npm test` passed, including the original 95 residential checks and 56 new
  version-2 checks. See `root-tests.log` and `residential-tests.log`.
- Production TypeScript/Vite build passed: `build.log`.
- Frontend lint passed without warnings: `lint.log`.
- Site-first browser path: 21 checks in `site-browser.log` /
  `site-browser-results.json`.
- Coupled editing, quantities, mix, alternative search, common-frame comparison,
  cancel/history, full export/reopen and 1440/1024/375 px layout: 26 checks in
  `coupled-browser.log` / `coupled/browser-results.json`.
- Advanced curves/vehicle/cost/manual-lot/combination workflow: 11 checks in
  `advanced-browser.log` / `advanced-browser-results.json`.
- Direct residential reference calibration and independent dimension: 7 checks
  in `scale-browser.log` / `scale-browser-results.json`.
- Existing project lifecycle, clear/delete, history, cross-project asynchronous
  isolation and emulated touch boundary tools: 20 checks in `lifecycle.log`.
- Existing survey/CSV/DXF/PDF/calibration/source persistence and responsive
  source tools: 33 checks in `site-context.log`.

Browser contexts are isolated; these tests do not clear the owner's browser
projects. Fictitious inputs are used throughout. The root fixtures cover
rectangular, angled, concave and narrow-neck boundaries, multiple products,
fixed protection, flexible space and an independently reproducible curved-road
screening case (`residentialEngineeredFixture`).

## Required editing evidence

Full starting inputs, actual resulting polygons, quantities and constraint
states are recorded in the JSON evidence, not inferred from screenshot counts.
`quantity-differences.json` indexes the coupled and advanced records.

| Action | Fictitious starting inputs / edit | Measured result | Constraint evidence |
|---|---|---|---|
| Place main road first | 120 × 100 m boundary, no roads/products/gate; draw southern centreline y = −5 m, ROW 10 m, carriageway 6 m | Site stage stays at zero lots; only actual southern frontage offers permitted gates | `site-browser-results.json`, `external-road-first.png`; contact alone grants no access |
| Given natural feature | Import seven-corner wetland partly outside site, plus a polygon hole | Original coordinates/hole retained; physical protected area clipped to site | `site-browser-results.json`, `given-feature-irregular-space.png`; original fixed after acceptance |
| Move entrance | Fixture west-edge offset 50 → 54 m | Valid yield 27 → 26; connection and lot polygons change | `coupled/entrance-move.png`, corresponding action JSON; boundary/protection unchanged, no failed constraints |
| Move road | Move unlocked Main Street bend north 2 m, keeping gate connection | Yield remains 26; road, block and lot geometry regenerate | `coupled/road-move.png` and action JSON; reconciled land, no failed constraints |
| Change product group | West section Compact → Family, both sides | Valid yield 26 → 22; current Compact valid count becomes zero; dimensions/area change | `coupled/product-group.png` and action JSON; actual integer mix recalculated |
| Reshape flexible space | Move park west edge x = 80 → 72 m | Valid yield 22 → 21; flexible area increases | `coupled/flexible-space.png` and action JSON; minimum/access retained, protection unchanged |
| Draw irregular space | Five corners along actual southern entrance-street edge | Valid yield 8 → 7; actual polygon area reserved | `site-browser-results.json`; no road encroachment, actual road-edge access |
| Compare alternatives | Test real alignments, return-loop structures, group allocations and flexible edges | Distinct measured scenarios, identical scale/orientation frame; chosen tested option has 32 valid lots | `coupled/alternatives-comparison.png`; unresolved checks remain visible; no global optimum claim |
| Save and reopen | Save accepted option and shortlist, close/reload/reopen | Same 32 valid lots, exact stored polygons, schedules, alternatives and reasons | `coupled/saved-reopened.png`, exported `coupled/project-record.json` round trip |
| Curved road | Declared vehicle and source/rates; centreline radius 15 → 18 m | Yield remains 24; real road surface and lot outlines change; prices recomputed | `advanced-browser-results.json`; vehicle wider than carriageway refuses acceptance |
| Manual lot | Inward rear-corner adjustment to a selected lot | Held real polygon; area changes; frontage/depth/status recalculated | `advanced-browser-results.json`; valid measured lot retained, then lock deliberately released |
| Combine shortlist | Two real curve strategies, source chosen for network/groups/spaces | New scenario ID/parents, recalculated lots/costs, two-option shortlist retained | `advanced-comparison.png`; full accepted collection reproduces on reopen |
| Calibrate source | Attach fictitious PNG; 20 m known line, independent 50 m dimension with 1 m tolerance | Calibration maps actual source pixel points; independent check calculated; wrong 60 m input fails | `scale-browser-results.json`, `calibrated-source.png`; boundary stays 120 × 100 m |
| Clear / undo | Clear residential lot allocations while retaining source/fixed geometry | Zero yield; one undo restores complete pre-clear scenario | `site-browser-results.json`; source/main road/protection preserved |

## Defects found and corrected during verification

- Initial creation assumed an entrance and rectangular feature/open-space shapes.
  These have been replaced by the site-first and free polygon paths.
- Click precision could create tiny park/road overlaps or gaps; explicit actual
  road-edge snapping now makes valid adjoining spaces practical to draw.
- Sampled centreline vertices were incorrectly treated as junction return
  corners. V2 applies returns to genuine junctions; original caller behavior is
  preserved for the legacy application.
- A dense swept-envelope buffer union could fail numerically. Screening now
  tests conservative convex body envelopes individually against the actual
  corridor; a curved-vehicle regression fixture reproduces the corrected path.
- Held curved lots previously used only their longest edge as primary frontage.
  They now retain the full measured contiguous serving-curb chain.
- Editing an accepted saved option reused the saved alternative's identity.
  Changes now fork a revision and preserve the saved snapshot.
- Select/textarea labels contained their values/options in accessible names.
  Explicit accessible labels support reliable form interaction.
- Pending/failed report labels could describe accepted quantities as proposed.
  Reports now identify accepted values and use their matching input definitions.
- Cost metadata on a geometry-locked group required an unnecessary unlock.
  The lock now protects its product geometry while allowing repricing.

Drawing Undo/Redo shortcuts also preserve the accepted scenario while editing
uncommitted points; accepted-history shortcuts are blocked during a pending
preview. Intermediate failure captures are retained in `resolved-failures/`.

No remaining failures were observed in the executed suites. The existing Vite
large-bundle advisory remains non-fatal. Checks still unresolved in real projects
are not automatically treated as passes.

## Limits and remaining project inputs

This is a bounded residential planning implementation, not a claim of complete
engineering or global optimization. Detailed steering/axle/articulated swept
paths and all junction manoeuvres remain separate checks. Off-site approvals,
house fit, survey/legal assurance and statutory approval are not established by
geometry passes. Open-space usefulness beyond measured access/minima and its
recorded function needs planner review.

Generation can miss feasible arrangements. Search is limited to 64 tested
configurations; curved geometry is polygonised; irregular depth uses the
explicit three-ray method. Source media are session-only; geographic CRS
reprojection, automatic source recognition and curved CAD entity import are not
implemented. Existing finance/house/AI Rect tools remain separate from the SOP
residential geometry. Reload preserves accepted project state, not undo history.

Real source/scale, access permissions and movements, road dimensions/design
vehicle/turning requirements, protected buffers/crossing decisions, usable-space
commitments, product targets and dated scoped rates remain owner inputs. Empty
or provisional inputs stay visible. No application-generated value is a legal
or statutory requirement.

Next priorities are independent planner/engineering benchmarks, expanded routing
and packing search, full vehicle-movement design integration, shared legacy-tool
migration and Safari/screen-reader/physical-device verification. These limits
are also recorded against the relevant SOP rows in the gap matrix.

## Run and review

The running preview is at **http://localhost:5173**. Refresh and choose
**Residential planning**, including from a blank project. Start with the source
and boundary, choose **Draw external main road**, enter its dimensions and
permitted frontage, then choose an offered entrance. Draw/import actual features
and irregular spaces; define products and street groups before relying on yield.
Use **SOP procedure**, schedules, constraints and alternatives for the same
current scenario. All pending changes require review and acceptance.

Build/run (Node with TypeScript stripping):

```sh
npm ci
npm ci --prefix web
npm run build --prefix web
npm run preview --prefix web -- --host 0.0.0.0 --port 5173 --strictPort
```

Legacy tool server, if needed separately:

```sh
node --experimental-strip-types --no-warnings server/intent.mjs --port 5174
```

Residential geometry does not need an AI provider or that server. Test commands:

```sh
npm test
npm run test:residential
npm run lint --prefix web
node tests/residential-site-browser.cjs
node --experimental-strip-types --no-warnings tests/residential-browser.cjs
node tests/residential-advanced-browser.cjs
node tests/residential-scale-browser.cjs
```

Set `PLAYWRIGHT_MODULE` to your installed Playwright module when needed.
`residential-browser.cjs` accepts `UNBUILT_TEST_URL` and
`UNBUILT_EVIDENCE_DIR`; the added site/advanced/scale scripts use isolated
contexts at localhost:5173 and write here. The advanced script uses the supplied
`advanced-input.json` fictitious workspace. Existing browser suite commands and
logs are retained here. No commit, push or deployment was performed.
