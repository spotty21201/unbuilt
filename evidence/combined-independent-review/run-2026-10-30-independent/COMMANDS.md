# Reproduction and evidence

Run from `/home/spotty/projects/unbuilt`. Preview 5173 and the tool service 5174 must already be serving the production build. Do not change the owner's routing or credentials. Dependencies were reused from `web/node_modules` and `/home/spotty/projects/studioos/node_modules`; nothing was installed.

Preserve this run. Most new scripts write beside themselves. To repeat, create a **new sibling run directory at the same depth** under `evidence/combined-independent-review/`, copy the new `.cjs`, `.mjs` and `.py` scripts there, and invoke those copies. Existing browser scripts respect `UNBUILT_EVIDENCE_DIR`. Relative imports in the new scripts assume that directory depth.

## Commands executed

```bash
python3 evidence/combined-independent-review/run-2026-10-30-independent/run-existing.py
node --experimental-strip-types --no-warnings evidence/combined-independent-review/run-2026-10-30-independent/independent-calculations.mjs
node evidence/combined-independent-review/run-2026-10-30-independent/keyboard.cjs
node evidence/combined-independent-review/run-2026-10-30-independent/scheme-conflict.cjs
node --experimental-strip-types --no-warnings evidence/combined-independent-review/run-2026-10-30-independent/limit-and-housing-delay.mjs
node evidence/combined-independent-review/run-2026-10-30-independent/gaps-browser.cjs
node --experimental-strip-types --no-warnings evidence/combined-independent-review/run-2026-10-30-independent/connected-browser.mjs
node --experimental-strip-types --no-warnings evidence/combined-independent-review/run-2026-10-30-independent/ai-boundary-repro.mjs
node --experimental-strip-types --no-warnings evidence/combined-independent-review/run-2026-10-30-independent/hash-transport-regression.mjs
node --experimental-strip-types --no-warnings evidence/combined-independent-review/run-2026-10-30-independent/fine-grid-regression.mjs
node evidence/combined-independent-review/run-2026-10-30-independent/comparison-labels.cjs
UNBUILT_EVIDENCE_DIR=evidence/combined-independent-review/run-2026-10-30-independent/accessibility-final node evidence/combined-independent-review/run-2026-10-30-independent/accessibility.cjs
```

`run-existing.py` runs `npm test`, `npm run build --prefix web`, `npm run lint --prefix web`, the 35 browser suites and zoom variants with exact subprocess commands/environments in `existing-results.json`. It uses two ordinary subprocess workers for independent suites, not delegated agents. AI normal/zoom runs are sequential because they share fixture ports. Browser contexts/profiles are disposable. Normal UI suites use the actual service; scripted AI uses an isolated service.

The runner initially stopped before open-space integration because its own environment construction supplied `UNBUILT_EVIDENCE_DIR` twice. All preceding suites passed. The runner was corrected, and the missing integration was executed explicitly:

```bash
PLAYWRIGHT_MODULE=/home/spotty/projects/studioos/node_modules/playwright \
UNBUILT_EVIDENCE_DIR=evidence/combined-independent-review/run-2026-10-30-independent/open-spaces-browser \
node tests/open-spaces-integration.cjs
```

Its 17 passes are recorded in `open-spaces-integration/run.log` and `open-spaces-browser/integration-results.json`. `existing-results.json` was then completed with that explicit run; `existing-runner.log` retains the original runner error. The final runner code executes the dependency in the correct order and no longer has that construction error.

## Exit codes are meaningful

- Existing suites, arithmetic, keyboard, two-tab recovery and gap checks: exit 0.
- `connected-browser.mjs`, `ai-boundary-repro.mjs`, `hash-transport-regression.mjs`, `fine-grid-regression.mjs`, `comparison-labels.cjs`: exit **1**, preserving reproduced failures. Do not replace their expected behavior with the current broken behavior to obtain a pass.
- `accessibility.cjs`: exit **1** with canvas rule violations; the final results contain all 12 scans. Earlier scan versions logged the same violations but did not propagate them to process exit. The final version does.
- The connected script records failed AI review, then explicitly uses manual feasibility to complete later comparison/recovery checks; its overall status remains failure.

## Added scripts and why

| Script | Coverage gap addressed |
|---|---|
| `explore.cjs` + command journal | First visible-control walkthrough, screenshots and exact exploratory actions without storage shortcuts |
| `independent-calculations.mjs` | Nonuniform/400-point/sign-reversed terrain and an independently assembled full monthly cash oracle |
| `keyboard.cjs` | Complete Tab-based journeys instead of direct `.focus()` checks |
| `limit-and-housing-delay.mjs` | Full20-scheme UI limit and removal/Undo/export; actual housing edit while a valid fixture reply is held in flight |
| `scheme-conflict.cjs` | Conflicting **saved-scheme collections** across two real tabs, with both recovery exports |
| `gaps-browser.cjs` | Reject-before-approval, merge Cancel, persistent warning after outline Cancel, concave UI area, study lifecycle |
| `connected-browser.mjs` | One study spanning all requested features and real browser→isolated service→scripted upstream integration |
| `ai-boundary-repro.mjs` | Reduced first-call/post-boundary/retry/reload reproduction with wire evidence |
| `hash-transport-regression.mjs` | Small expected-failing test of the actual JSON transport invariant |
| `fine-grid-regression.mjs` | Visible CSV and validator test at the documented decimal minimum |
| `accessibility.cjs` | Axe checks across editing, comparison, administration, phase maps and narrow invalid inputs |
| `comparison-labels.cjs` | Measured intersections missed by page-overflow assertions |
| `make-matrix.py` | Case/evidence ledger generation; no product behavior |

The AI diagnostic wrappers record optional undefined paths before the app calls `JSON.stringify`; they return the original serialization unchanged. Request/response inspection is a labeled technical pass. They do not change snapshots, server responses or application behavior. Keys in all fixture settings are deliberately non-secret test strings; private temporary configurations are removed on exit.

Initial harness mistakes are preserved: wrong accessible-name selectors in the exploration journal, `Cancel details` instead of `Cancel scheme details` in the first keyboard run, unconditional Show controls in the first narrow accessibility scan, malformed `name` instead of `label` in the initial fixture setup, and missing `Saved:` option prefixes in the connected comparison. The intended assertions were retained while correcting harness selectors/configuration. A north pocket conflicting with newly held lots was correctly blocked; the final connected script asserts that protection and deliberately creates its accepted pocket in unallocated south land. Historical tests/product code were unchanged.

The unperformed cases and gates are in the matrix. Actual browser zoom is established by native tabs zoom, not CSS transforms or a reduced viewport. Touch tests are emulated; no physical device or real screen reader was attached.

The initial independent-calculation JSON had a concave-case expected-value metadata typo (`16600`). Its actual assertion always required `17300`, the independently derived integral. The metadata was corrected to match that assertion and the nine cases were rerun; `initial-independent-calculations.*` retains the first output. No assertion was weakened.
