# Geometry and financial-status clarity review

The owner requested review and correction of two misleading Cedar Market states. This follow-up changes presentation and financial-review visibility; it does not alter geometry, finance formulas, defaults or saved project formats. Existing tester prompts/evidence and the unrelated untracked video document are preserved. No commit, push or deployment is part of this review task.

## Causes and changes

| Concern | Cause | Correction |
| --- | --- | --- |
| Header says “spine 10 m” while the street is 6 m | The header rendered `spec.frontage` without naming it. It is the generated **lot-frontage setting**, not road width. Default road width is the shared `ROAD_W = 6`; the 120 m street therefore correctly measures 720 m². The value was ambiguously labeled rather than a stale road measurement. | Name the frontage setting and actual street width separately. Read generated width from the shared constant or actual segment widths from the active manual network. List multiple widths. Mark parameter edits as Draft and use their active frontage/width values; Apply, Cancel and restore return the appropriate accepted values. |
| Owner shortfall/loss alongside “No open issues… no blockers” | `issueCount` counted geometry/profile errors, incomplete inputs, ceiling errors and search blockers. It never included computed owner shortfall or surplus below target. Valid numerical inputs were consequently mistaken for a clean overall outcome. | Keep geometry/input validation separate from a Financial review section. Count modeled financial concerns in Issues, expose a header button opening that review, show exact owner shortfall and surplus percentage, and label geometry success “Geometry valid.” Remove the broad no-open-issues reassurance. |

Financial review uses the same `econShown` finance object as the evaluator: working plan, valid unapplied draft, unapplied search option or explicitly labeled last-valid accepted figures. It displays owner-benchmark shortfall at the entered target, negative surplus after owner payment, positive surplus below target, or absent home revenue as appropriate. A met modeled target clears the concerns with an explicit assumptions/viability qualification. Missing inputs and boundary-only plans show unavailable financial outcomes. These are financial concerns under declared assumptions, not geometry blockers or permission to apply a trial automatically.

The Economics explanation also drops “the scheme works” and “what the land is worth.” It describes a modeled allowance at the entered target and the surplus calculation without claiming market value or viability. Longer Issues content now has a named, focusable result region so keyboard users can scroll the financial findings.

## Reproduced figures

`before.json` and `before-issues.png` capture the served build before the changes: ambiguous “spine 10 m,” road 720 m², owner shortfall Rp6.44bn, surplus −22.88%, yet no open issues/no blockers.

The default 6 m case retains 20 homes and 720 m² road. At 8 m, the full 120 m street measures 960 m², street works cost 960 × Rp800,000 = Rp768,000,000, and non-land costs become Rp10,582,000,000. Revenue remains Rp17,000,000,000. At the entered Rp10bn owner benchmark, 15% target and 3% selling cost, modeled shortfall is Rp6,642,000,000 and surplus is −Rp4,092,000,000 (−24.07% of revenue). The UI displays Rp6.64bn and −24.07%; exported values are checked against independent arithmetic. Editing the road does not reinterpret the 10 m frontage setting.

## Verification

Final results are recorded in `verification-results.json`.

| Check | Result |
| --- | --- |
| Full root calculations/services | 736 passing checks; `root-tests.log` |
| Production build / lint | Passed; existing bundle-size advisory retained |
| Targeted UI regression | 36 passed; `browser-release/results.json` |
| Complete final browser matrix | 38/38 runs passed; `regressions-release/results.json` |
| Existing open-space drawing workflow | 31 passed; `drawing-release.log` |
| Rapid drawing / header stability | Three runs: 120 m² each; header stays 57 px throughout; `drawing-header-results.json` |
| Targeted accessibility scan | Zero detected violations; `browser-release/axe.json` |
| Existing prompts/evidence and unrelated video draft | 999 baseline files unchanged; `preservation-check.json` |

The verified served asset is `/assets/index-D2MdHq77.js`. Default, tablet and narrow screenshots were opened and inspected. The compact financial indicator brings the financial findings into view and focuses the scrollable results region on narrow layouts. The targeted script is `tests/geometry-finance-browser.cjs`. It checks the default case, financial-issue count/navigation, geometry-valid editing despite loss, width changes, full-width drawing, draft quantities, active financial scope, Apply/Cancel, Undo/Redo, Save/reload, portable restore, exact exported arithmetic, mixed widths, invalid-draft fallback, below-target positive surplus, satisfied targets, missing inputs, preview scope, 1024/375 px reflow, boundary-only/zero-revenue cases, keyboard scrolling and accessibility.

Production build/lint logs are `build.log` and `lint.log`. Root verification is `root-tests.log`. The initial browser matrix is under `regressions/`; a fresh final run after the keyboard-focus correction is under `regressions-final/`. Do not count the pre-correction failure as a final pass. `browser-before-focus.log` and `axe-before-focus.json` preserve the detected scrollable-region accessibility failure. Early harness runs also retained an incorrectly hand-rounded expected 8 m margin and an improperly versioned zero-home fixture; both were corrected without weakening the product checks.

Final targeted results and screenshots are in `browser-release/` with the log `browser-release.log`. The final complete matrix is in `regressions-release/`, after the compact header and narrow-screen review navigation refinement. Earlier `regressions-final/` results retain the drawing-reflow failure and its missing dependent import fixture; they are not final acceptance evidence. `drawing-reflow-before.json` records a header height change from about 88 to 57 px during point entry. Keep the financial indicator compact and put the accepted/draft scope inside its review. The final open-space drawing suite is also exercised separately in `drawing-release/` (31 checks). Inspect the default Issues page and tablet/narrow financial reviews. The final automated test uses isolated Chromium profiles on the actual production preview, not the reviewer's existing browser profile. Chrome-extension operation, a real screen reader, physical devices, real-model access and professional financial acceptance are not established by this software check.

## Reproduction

From `/home/spotty/projects/unbuilt`, use root/web installed dependencies, `npm run build --prefix web`, `npm run lint --prefix web` and `npm test`. Production preview is on 5173; deterministic tools are on 5174. Set `PLAYWRIGHT_MODULE=/home/spotty/projects/studioos/node_modules/playwright` and `UNBUILT_EVIDENCE_DIR` to a fresh output directory, then run:

```
node --experimental-strip-types --no-warnings tests/geometry-finance-browser.cjs
```

The accessibility scan reuses the installed axe dependency in the same browser-tool workspace. For the complete browser matrix, run the preserved `evidence/combined-independent-review/run-2026-10-30-corrections/run-browser-matrix.py` with a fresh absolute `UNBUILT_EVIDENCE_DIR`. It discovers the added test automatically. Avoid concurrent runs using the same scripted AI fixture ports.
