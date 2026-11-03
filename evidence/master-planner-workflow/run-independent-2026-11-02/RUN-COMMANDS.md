# Reproduction

Run from `/home/spotty/projects/unbuilt` on the tested tree. The loose run and archive contain fixtures and evidence only; the application repository is required. Start the same build on localhost5173 before browser replays. The recorded environment reused Playwright from `/home/spotty/projects/studioos/node_modules/playwright`.

```bash
npm run test:residential
node evidence/master-planner-workflow/run-independent-2026-11-02/edit-evidence.cjs
node evidence/master-planner-workflow/run-independent-2026-11-02/audit.mjs
node evidence/master-planner-workflow/run-independent-2026-11-02/verify-artifacts.mjs
node --experimental-strip-types --no-warnings evidence/master-planner-workflow/run-independent-2026-11-02/reproduce-curve-failure.mjs
```

The last command is expected to FAIL on this tested build: it asserts that a fitting mixed-radius configuration must calculate without a numerical exception. The saved failure is a product regression, not a passing acceptance test. Do not remove the assertion to get a green run.

The interactive first journey is recorded in `commands.jsonl` with `explore.cjs`; it is a sequential transcript, not an unattended all-in-one runner. `make-additional-sites.mjs` creates clearly labelled input fixtures. `write-report.py` is the original report-generation source; the final Markdown additionally contains manually reviewed wording/spacing and verification-summary updates.

Import `Master-Planner-Workflow-Test.project.json` through Projects to inspect the preferred study and11 alternatives in a fresh browser. The standalone screenshot gallery and full report use relative artifact links. No owner browser profile was used.
