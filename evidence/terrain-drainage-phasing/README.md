# Feature 12 evidence

30 October 2026. Current production asset `/assets/index-BR3nNjEc.js` on 5173;
updated tool service on 5174. No actual elevation/storm/schedule data was supplied.
No real model was contacted, and no independent planner/civil/financial review
was launched. All example data and recorded calculations here are fictional.

Read `docs/PRD_v0.17.md` for scope and `docs/DEVELOPMENT-CALCULATIONS.md` for
methods, data preparation and primary references. This initial tool reports
screening quantities and schedules accepted budgets; it does not establish
engineering, access, financing or local regulatory suitability.

- `root-tests.txt`: 711 passing checks, including 22 development checks. Analytic
  surfaces include a plane split by the platform, a flat surface, reversed and
  concave boundaries and a valley with opposing local gradients. Exact cut/fill,
  disjoint runoff areas/SI units, mixed home sizes, contingency once, explicit zero
  budgets, month-end accounting and accepted-surplus reconciliation are checked.
  Input/version/downgrade/binding/privacy and partial applicability cases pass.
- `web-build.txt`, `web-lint.txt`: production build and lint pass; the existing
  large entry chunk advisory remains.
- `browser-results.json`, `browser-log.txt`: 39 checks on the served build.
  Invalid/missing inputs, explicit fictional choices, real elevation file import,
  negative platform entry, applicability/short-duration checks, map/table phase
  assignments, monthly ledger, Apply/Cancel/Reset/Escape/history, reload, saved
  scheme isolation and source/result comparison, record v14 import/export,
  stale-reference/remapping, insufficient coverage, retained data after boundary
  deletion and Undo, local/server agreement and narrow reflow are covered.
- `zoom-200/`: 40 checks using the browser's actual native zoom API, DPR 2 and
  initial half CSS width (1440→720) with outer window unchanged at 1440. Final
  narrow checks run at 375 CSS px. Screenshots use native surface capture.
- `regression-feasibility/`: 33 checks; `regression-schemes/`: 36;
  `regression-ai/`: 28. The AI check uses an isolated scripted completion fixture,
  not actual model access. Original evidence/prompt directories were not replaced.
- Desktop, narrow and actual-zoom screenshots were visually inspected. Fixed
  low-contrast result labels, screen-sized map text/focus indication and map
  height at zoom. Accessible phase tables accompany small-map lot selection.
  Physical-device gestures and independent professional acceptance are untested.

Terrain refuses extrapolation and does not automatically exclude/move homes on
slopes. Gross platform quantities omit material factors and prices. Rational peak
requires entered catchment/storage applicability; gross rainfall volume cannot
size runoff storage. Outfalls are declared references, not connected networks.
Phase cash excludes intramonth funding, missing budgets, absorption, escalation,
tax/debt and infrastructure readiness. Valid observations may persist while a
calculation remains unavailable; no unavailable result is presented as zero.

Tester prompts for Feature 11 and Feature 12 are saved, with hashes recorded in
WORK-CONTEXT.md. Earlier tester hashes remain unchanged. None was dispatched.
All Feature 10–12 work remains uncommitted as requested by the workspace rules.

Reproduce with `npm test`, production web build/lint, and
`PLAYWRIGHT_MODULE=/home/spotty/projects/studioos/node_modules/playwright node
 tests/development-browser.cjs`. For actual zoom add
`UNBUILT_DEVELOPMENT_ZOOM=2`, a separate `UNBUILT_EVIDENCE_DIR`, and `xvfb-run -a`.
Both production preview 5173 and the current tool service 5174 must be running.
