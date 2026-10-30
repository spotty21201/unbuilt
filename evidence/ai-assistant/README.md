# Feature 11 evidence

30 October 2026. Production asset `/assets/index-DQKhB3TR.js` on port 5173.
The current normal service on 5174 is **unconfigured**, with no administrator
secret or model credential installed. The owner will supply routing and secrets
later. No real model was contacted; no independent planner review was launched.

The integration checks use a real isolated copy of the tool service and a
**scripted completion-protocol fixture**, with temporary non-secret routing
profiles. They establish protocol integration and deterministic review behavior,
not model access, reasoning quality or real-world planning acceptance.

- `root-tests.txt`: 689 checks, including 12 new contract and 19 service checks.
  Configuration tests cover authorization, privacy/permissions, retain/remove,
  explicit switching, revision conflicts, restart, a fixed 20-second timeout,
  concurrency limits and client cancellation. Invalid tools, unmeasured numeric
  prose, invalid selections and stale snapshots refuse without application.
- `web-build.txt`, `web-lint.txt`: production build and lint pass. Existing large
  entry chunk advisory remains.
- `browser-results.json`, `browser-log.txt`: 28 browser checks, including honest
  unconfigured state, administrator flow, proposal/review/run, measured AI finding
  selection, drawing review, Cancel/Apply/Undo/Redo, errors, discard/cancellation,
  stale selection, saved scheme/reload, portable export and credential exclusion.
- `zoom-200/`: same flow, 29 checks including actual browser zoom 2.0 established
  with the native browser zoom API. Initial viewport changes 1440 CSS px to 720,
  DPR 1 to 2, with outer window width remaining 1440. Final narrow reflow checks
  use 375 CSS px at that zoom. Screenshots use native surface capture at zoom.
- `regression-feasibility/`: 33 existing browser checks pass.
- `regression-schemes/`: 36 existing saved-alternative browser checks pass.
- Desktop and narrow screenshots, plus actual zoom screenshots, were visually
  inspected. The AI settings helper contrast and focus restoration were fixed.
  Physical-device touch and independent planner acceptance were not tested.

No existing tester prompt was rewritten. Feasibility, open-spaces, housing retest
and saved-alternative prompt hashes match the values in docs/WORK-CONTEXT.md.
No new independent tester prompt/review was launched for this increment.

Reproduce using `npm test`, the web build/lint scripts and
`tests/ai-browser.mjs` with the served production build. Set PLAYWRIGHT_MODULE
to `/home/spotty/projects/studioos/node_modules/playwright`. For actual zoom use
`UNBUILT_AI_ZOOM=2`, a separate UNBUILT_EVIDENCE_DIR, and `xvfb-run -a`.
Administrative setup and storage limits are in `docs/AI-ADMIN.md`.

The feature and Feature 10 remain uncommitted, preserving the owner's workspace.
