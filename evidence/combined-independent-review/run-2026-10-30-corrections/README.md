# Independent review corrections — 30 October 2026

All four implementation concerns in the [original tester report](../run-2026-10-30-independent/REPORT.md) are addressed. Its report, original failing regressions, evidence and every saved tester prompt remain unchanged. This directory contains separate correction evidence. No new roadmap feature was started, real credential installed, commit made or push performed during this correction task.

Verified production build: `/assets/index-CCOuMecx.js`. The preview is on port 5173; the local deterministic service was absent and was started on port 5174 without changing routing/settings. It remains unconfigured for real AI. AI checks use isolated temporary services and scripted completion fixtures. The workspace baseline is commit `38ce2f6870d9b83ab85e6ba2ed11dd46f6021048` plus the uncommitted corrections.

## Findings and implementation

| Finding | Correction | Direct evidence |
| --- | --- | --- |
| F1: Accepted boundary edits cause valid AI replies to look stale | `src/snapshot.ts` canonicalization omits undefined optional object fields as JSON transport does, and retains undefined/sparse array positions as JSON nulls. Exact numeric precision, explicit nulls, selection/configuration binding and genuine stale-response rejection remain. The fix is shared by all snapshot consumers; it does not bypass the client response guard or require a reload. | `hash-before.log` preserves the failed invariant before the fix; `hash-after.log` shows equal client/server hashes. All four reduced boundary/retry/reload cases pass in `ai-boundary-repro/results.json`. |
| F2: Valid decimal 0.01 m grid is rejected | `src/development-inputs.ts` permits only coordinate subtraction roundoff using a bound derived from machine precision and the two coordinates. The documented minimum remains 0.01 m. Added checks accept decimal minimum intervals near zero and 500 m, but reject 0.009 m and near-minimum genuinely short intervals. Duplicate/missing cells, finite numeric bounds and invalid-draft protection remain. | `fine-grid/results.json` passes. Root tests check the analytic slope √5%, cut 24,100/3 m³ and fill 2,500/3 m³ for the supplied plane. |
| F3: Interactive plan has conflicting image semantics | Shared `PlanCanvas` SVG containers now use named group semantics. Focusable named lots, junctions and editing controls stay descendants with their existing keyboard behavior. No interactive descendants are hidden to silence the rule. | All 12 surfaces in `accessibility/accessibility-results.json` have zero detected violations, including the previously failing working/edit/comparison/AI surfaces. Seven keyboard-only journeys pass. Real screen-reader validation remains open. |
| F4: Comparison dimensions overlap scale labels | `PlanCanvas` comparison views put scale and camera readouts in a separate wrapping strip below the clipped drawing, styled in `web/src/drafting.css`. Geometry, camera/scale arithmetic and readable label sizes stay unchanged. The working canvas retains its previous layout. | Original tablet overlap assertion passes in `comparison-labels/results.json`. Additional checks cover feasibility and saved-scheme comparisons at 1440/1024/375 px and native 200% browser zoom, with no label intersections or horizontal overflow. |

The complete connected study now reaches AI interpretation, deterministic measurement, drawing review and explicit Apply. All 12 checkpoints pass in `connected-results.json`; the earlier manual fallback was not used. `J07-AI-reviewed-held-study.png` shows the actual AI trial with manual streets/lots, vacancies, housing, protected green and declared studies held. Subsequent scheme comparison, reopening/Undo, reload/export and independent imported notes also pass.

## Verification

| Check | Result | Evidence |
| --- | --- | --- |
| Full calculations/validation/service suite | 716 passing checks, including five new regressions | `root-tests.log` |
| Production TypeScript/build and lint | Passed; existing entry-bundle size advisory remains | `web-build.log`, `web-lint.log` |
| Existing browser matrix | All 35 runs / 971 checks passed | `regressions/results.json`, `regressions.log`, per-suite output |
| Snapshot transport | Before-fix assertion fails; after-fix assertion passes | `hash-before.log`, `hash-after.log` |
| Post-boundary AI and unchanged retry | 4 passed, including before-edit and after-reload controls | `ai-boundary-repro/results.json` |
| Connected multi-feature AI journey | 12 passed; no manual fallback | `connected-results.json` |
| Original fine-grid / tablet-label failures | Both now pass | `fine-grid/results.json`, `comparison-labels/results.json` |
| Accessibility scans | All 12 surfaces: no detected violations | `accessibility/accessibility-results.json` and raw axe files |
| Keyboard-only journeys | 7 passed | `keyboard-results.json` |
| Independent calculation oracles | 9 passed | `independent-calculations.json` |
| Housing-edit delayed-response rejection and scheme limits | 6 passed | `limit-and-housing-delay/results.json` |
| Conflicting saved-scheme tabs | 2 passed; durable and memory-only recovery retained | `scheme-conflict/results.json` |
| Other procedural protections | 5 passed | `gaps/results.json` |
| Additional comparison layouts and native zoom | 31 + 12 checks passed | `comparison-layouts/results.json`, `comparison-layouts-zoom/results.json` |
| Original evidence and prompt preservation | 550 files checked, none changed | `preservation-before.json`, `preservation-check.json` |

`verification-results.json` records the final machine-readable results. The 971 browser checks are the established suite count; added regressions are listed separately rather than relabeled as independent planner acceptance. Genuine stale-plan, selection, settings-revision, cancellation and timeout behavior remains covered by the full root/AI suites, browser matrix and the delayed housing-edit check.

Tablet, narrow and native-zoom screenshots were opened and inspected. Prefer `comparison-layouts/*-scale-*.png` and `comparison-layouts-zoom/*-scale-*.png` for the updated scale placement. The native zoom result records the same 1440 px physical window with CSS width 1440→720 and DPR 1→2. Plan-view zoom remains a separate control and can correctly display 100% inside a browser zoomed to 200%.

An initial additional screenshot harness captured locator clips incorrectly at native browser zoom and sampled a viewport before layout had settled. These diagnostic captures/logs are retained, including `initial-locator-capture.png` and `comparison-layouts-zoom-initial.log`; they are not visual acceptance evidence. The harness now waits for a measured viewport, scrolls the scale strip centrally above sticky actions and uses native surface capture. It retains the actual zoom, label-intersection, reflow and action-reachability assertions.

## Reproduction

Run from `/home/spotty/projects/unbuilt` with production preview on 5173 and deterministic tools on 5174. Preserve this directory: copy its `.cjs`/`.mjs` scripts into a fresh sibling directory at the same depth before rerunning, since they write beside themselves and use relative imports. Browser dependencies are reused from `/home/spotty/projects/studioos/node_modules`; no new application dependency was added.

Use `npm test`, `npm run build --prefix web` and `npm run lint --prefix web` for the core checks. Run the copied `hash-transport-regression.mjs`, `ai-boundary-repro.mjs`, `fine-grid-regression.mjs`, `connected-browser.mjs`, `independent-calculations.mjs` and `limit-and-housing-delay.mjs` with `node --experimental-strip-types --no-warnings`. Run the copied `comparison-labels.cjs`, `accessibility.cjs`, `keyboard.cjs`, `scheme-conflict.cjs`, `gaps-browser.cjs` and `comparison-layouts.cjs` with Node. The full browser matrix is reproducible with the included `run-browser-matrix.py`; set `UNBUILT_EVIDENCE_DIR` to a fresh output directory.

For native comparison zoom, run the copied `comparison-layouts.cjs` under `xvfb-run -a` with `UNBUILT_CANVAS_ZOOM=2` and a separate `UNBUILT_EVIDENCE_DIR`. Scripted AI uses disposable settings and ports 5193/5194, 5195/5196 and 5197/5198; established AI regression suites use 5183/5184. Do not run scripts sharing a fixture port concurrently. No test needs a real model key or a change to live routing.

## Remaining validation

These corrections and checks were performed by an automated implementation agent. They are not a new independent human acceptance report. No real screen reader, physical phone/tablet or professional project review was available. Axe still marks some contrast decisions incomplete; no detected violations is not full accessibility certification. A named real-screen-reader walkthrough, human planner acceptance and physical-device gestures remain open.

Real-model access/quality and site-specific survey/storm/cost/phase suitability remain blocked on the same owner-supplied data, credentials and qualified review identified by the tester. No real-model, compliance, legal-access, market or engineering suitability claim is made. Original failure evidence remains available for an independent retest.
