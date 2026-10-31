# Angled streets and rounded corners

Implemented the owner's request under `docs/PRD_v0.18.md`. Existing independent-review corrections, uncommitted work and tester prompts are retained. No commit, push, deployment, real model setup or new numbered roadmap feature was performed.

In **Circulation → Edit street network**, choose **Any angle** to connect drawing picks directly, or **Right angles** for the existing orthogonal behavior. Set **Corner fillet radius (m)**, or use **Round corners · 4 m**. Review the draft pavement and quantities, then Apply streets. Zero preserves square corners. Legacy accepted roads remain unchanged until edited.

## Implementation

`src/road-surfaces.ts` offsets straight segments at their true bearing and width, closes outside bend wedges with bounded offset-kerb intersections, unions crossings and retains holes. Extreme hairpins use a bevel. Circular kerb fillets cap tangent distances to 45% of adjacent edges; the editor reports smaller effective radii on short corners. Entrance and terminal caps keep their full width. Curves use polygon chords with at most 5 mm deviation. Actual drawn polygons drive areas, road costs, drainage screening, boundary/park/lot checks and frontage.

Whole rectangular lots generate along horizontal/vertical road legs only. Land beside angled legs is explicitly unallocated. Manual lots/reshapes and assigned housing retain existing review/conflict protections. Rotated frontage parcels, vehicle swept paths and engineered road/kerb drainage design remain outside this extension.

Angles and corner radius survive node edits, widths/removal, Apply/Cancel, draft/plan Undo/Redo, save/reload, saved-scheme comparison/reopening, feasibility, search and measured AI cost proposals. Project v14, decision record v15 and snapshot v12 plus `angled-rounded-streets` reject disguised downgrades, including advanced roads only in saved alternatives. The root lockfile pins the polygon union dependency; install root dependencies as well as the web workspace.

## Verification

| Check | Result | Evidence |
| --- | --- | --- |
| Full calculation/validation/service suite | 736 passing checks, including 20 advanced-road checks | `root-tests.log`, `road-tests.log` |
| Production TypeScript/build and lint | Passed; existing bundle-size advisory remains | `build.log`, `lint.log` |
| Established browser regressions | All 35 established runs passed, alongside the initial new-road run (36/36 total) | `regressions/results.json`, `regressions.log` |
| Final new-road browser workflow | 27 checks passed; includes a later added pointer projection check | `browser/results.json`, `browser.log` |
| Dedicated native 200% zoom | 5 passed; CSS width 1440→720, DPR 1→2 in the same physical window | `native-zoom/results.json`, `native-zoom/zoom-metrics.json`, `native-zoom.log` |
| Accessibility | Zero detected violations for advanced-road canvas/editor, plus keyboard node editing | `browser/axe.json`, browser results |
| Previous prompts and tester evidence | All 999 baseline files unchanged | `preservation-before.json`, `preservation-check.json` |

Analytical checks cover segment area and width, diagonal crossing intersection counted once, clean mitered bend closure, T-filleting area within chord approximation, hole subtraction and conflicts, reduced radii, full-width containment, park and held-lot conflicts, real frontage, reconciled land/cost/drainage quantities, a sloping entrance's separate apron, persistence/downgrade guards, search locks and stale AI bindings. Legacy street checks still pass with their original areas/home counts.

The browser suite uses the actual served build. It covers typed arbitrary angles/decimals, pointer projection to an angled centreline, radius validation, drawing paths, Apply/Cancel, history, exact reload, saved round-versus-square comparison/reopening, keyboard junction edits, right-angle mode, boundary/park blockers, held-road cost trials, v15 export, local v12 search and 1024/375 px layouts. `browser/angled-roads-record.json` includes the derived pavement outline and original editable network. `browser/service-search.json` is the actual local tool response.

Desktop, narrow and native-zoom screenshots were opened and inspected. Prefer `browser/angled-rounded-accepted.png` for the final clean bend, `browser/rounded-versus-square-comparison.png` for alternatives, `browser/angled-road-375.png` for narrow drawing, and the two `native-zoom/*.png` named for drawing/comparison. Early diagnostic logs/screenshots retain the initial strip-notch rendering, an obsolete wording assertion and harness-only selector/zoom-startup failures; they do not represent the final passing result. Native zoom is explicitly set and verified through the browser API after page startup.

## Reproduce

From `/home/spotty/projects/unbuilt`, install `npm ci` and `npm ci --prefix web`. Use `npm test`, `npm run test:streets`, `npm run build --prefix web` and `npm run lint --prefix web`.

The production preview runs on 5173 and the refreshed deterministic service on 5174 (`node --experimental-strip-types --no-warnings server/intent.mjs --port 5174`). Live AI remains unconfigured. For browser checks, set `PLAYWRIGHT_MODULE=/home/spotty/projects/studioos/node_modules/playwright` and `UNBUILT_EVIDENCE_DIR` to a **fresh** directory, then run `node --experimental-strip-types --no-warnings tests/angled-roads-browser.cjs`. It also uses the existing axe dependency from that workspace. Run `tests/angled-roads-zoom.cjs` under `xvfb-run -a`, with its own fresh evidence directory. These use temporary browser profiles, not user project data.

The existing matrix runner is preserved at `evidence/combined-independent-review/run-2026-10-30-corrections/run-browser-matrix.py`; set `UNBUILT_EVIDENCE_DIR` to a fresh absolute destination. Its dynamic test list now also includes the new dedicated zoom test, so a new complete run has 37 entries rather than the 36 captured before that test was added. Shared fixture ports must not run concurrently outside its sequenced conventions.

These are implementation-agent software checks, not independent human planner or professional acceptance. No real screen reader, physical device, survey/project data or real model credentials were supplied. Radius/width assumptions and engineering suitability still need project-specific review.
