# Independent combined review — 30 October 2026

**Verdict: corrections required before accepting the integrated AI workflow or declaring the review complete.** An accepted boundary edit makes a valid AI reply look stale until reload. A valid minimum-spacing elevation grid is rejected. Comparison drawings also have overlapping scale/dimension labels, and automated accessibility checks flag the canvas semantics. **No accepted-work loss was observed** in the tested cancellations, history, reloads, imports or storage-failure recovery.

This review was performed by an automated testing agent. It is not human planner acceptance, a real-screen-reader walkthrough, physical-device validation or professional sign-off. All project data, source notes and service responses used here are fictional/test fixtures. No real model, owner credentials, survey or commercial evidence was used.

## Build and evidence

- Commit: `38ce2f6870d9b83ab85e6ba2ed11dd46f6021048`.
- Served app: `http://localhost:5173`, JS `/assets/index-BR3nNjEc.js`, CSS `/assets/index-6D583crq.css`. The production rebuild retained these assets.
- Browser: Playwright Chromium **149.0.7827.55**, Linux x86_64. Desktop 1440×900, tablet 1024×768, narrow 375×812, and separate touch-emulated contexts. Native browser zoom 2.0 was verified using the tabs API, initially 1440→720 CSS px, DPR 1→2, outer width unchanged. Exact measurements are in each zoom result.
- Existing preview/service on 5173/5174 were used without restarting or reconfiguring them. AI fixture services used 5183/5184, 5193/5194 and 5195/5196 and 5197/5198 in separate runs with private temporary configuration, removed on exit. No live routing or real credentials changed.
- The owner's pre-existing modification to `docs/WORK-CONTEXT.md` and all prompts remain unchanged. `preservation-before.json`, `preservation-after.json` and `preservation-check.json` record this. Only this fresh evidence directory contains new scripts/reports; no product source, historical test or historical evidence was edited. No staging, commit, push or deployment was performed.

[TEST-MATRIX.md](TEST-MATRIX.md) includes the combined procedure, original-prompt reconciliation, fresh per-assertion results and external gates. [EXPLORATION-NOTES.md](EXPLORATION-NOTES.md) separates the first visible-control exploration from the technical pass. [COMMANDS.md](COMMANDS.md) gives reproduction commands and explains the deliberately failing regressions.

## Fresh results

| Work performed | Result | Evidence |
|---|---|---|
| Existing calculation/validation/service suite | **711 passed** on this run | `root-tests/run.log` |
| Existing browser suite matrix | **971 checks passed across 35 runs**, including actual zoom, storage restart and scripted AI integration | `existing-results.json`, `existing-runner.log`, suite logs/JSON |
| Production build and lint | Passed; existing large-bundle advisory remains | `web-build/run.log`, `web-lint/run.log` |
| Added independent arithmetic | 9 passed: nonuniform/maximum grids, negative levels, concave/reversed surface integral, runoff and full cash ledger | `independent-calculations.json` |
| Added keyboard-only journeys | 7 passed using Tab/Enter/Space/arrows/typing, including focus return | `keyboard-rerun/keyboard-results.json` |
| Added two-tab scheme recovery | 2 passed; durable and in-memory collections remain separately exportable | `scheme-conflict/results.json` |
| Added remaining limit/stale-housing cases | 6 passed: full20-scheme UI boundary, removal recovery/export, and a real fixture reply held across an accepted housing-library/assignment edit | `limit-and-housing-delay/results.json` |
| Added procedural gaps | 5 passed: street proposal rejection, merge Cancel, persistent restoration guidance, concave green UI, study retention through clear/generate/resize | `gaps/results.json` |
| Connected multi-feature study | 11 checkpoints passed; **AI checkpoint failed**. Manual cost review completed subsequent recovery/comparison checks and is explicitly distinguished | `connected-results.json`, `J07-stable-plan-rejected.png`, `connected-study.json` |
| Reduced AI boundary reproduction | Before edit and after reload passed; after edit and unchanged retry **failed** | `ai-boundary-repro/results.json` |
| Snapshot transport regression | **Failed**, expected binding equality is preserved as an assertion | `hash-transport-regression.log` |
| Decimal-grid UI/validation regression | **Failed** | `fine-grid/results.json` |
| Automated accessibility | 12 surfaces scanned; 8 fail the same canvas nested-interactive rule, 4 have no detected violations. Incomplete contrast checks are explicitly retained | `accessibility-final/accessibility-results.json`, individual axe JSON |
| Small-comparison labels | **Failed**: both scale labels intersect the bottom site dimension | `comparison-labels/results.json` |

The 711/971 figures above come from fresh executions, not copied baseline observations. They reproduce the earlier counts but do not overturn the new failures. Repeated manifestations of the same problem are not independent product defects. There are three reproduced product defects below and one accessibility improvement requiring assistive-technology validation.

## Findings as implementation prompts

### F1 — Important: AI rejects accepted boundary edits as a changed plan

**Classification:** Reproduced defect.

**Observed:** In a fresh sample, ask the scripted AI fixture to test construction at Rp4m/m²: a reviewable proposal appears. Close the assistant, choose Edit boundary → Add after 1 → Apply boundary. This adds a collinear vertex without changing the 12,000 m² site. Ask the same intention without changing the plan or selection while the response arrives. The service returns HTTP 200, a validated proposal and the correct hash of the transmitted snapshot, but the app displays **“Plan changed while the request was running. Ask again.”** Retrying the unchanged request fails again. Saving/reloading then asking succeeds. The connected study also reproduced this after combining streets, vacant split lots, housing, green reservations and development studies. It prevents the intended proposal→measurement→review journey on an ordinary accepted edit; accepted work is retained.

The separately identified technical pass recorded own properties `site.development: undefined` and `site.costAssumptions: undefined` after boundary application. JSON transport omits these properties; the canonical hash includes them locally. In the connected study the remaining undefined property was `site.costAssumptions`. The focused regression demonstrates unequal hashes for two representations of the same supported JSON snapshot. See `App.tsx` boundary application and `src/snapshot.ts` canonicalization. No product correction was made.

**Prompt to implementer:** Make accepted snapshots bind consistently before and after JSON transport, including absent optional development/cost fields introduced by boundary/starter workflows. Preserve exact numeric precision, selection/configuration binding, invalid snapshot rejection, cancellation and genuine stale-response protection. Verify that both post-boundary and unchanged-retry cases in `ai-boundary-repro.mjs` produce reviewable proposals without reload, that `hash-transport-regression.mjs` passes, and that existing stale-plan/selection/configuration tests still reject obsolete work. Then rerun the connected journey with its AI branch completing measurement and explicit Apply.

**Evidence:** Disposable sample and “Independent end-to-end fictional study”; commit/asset/browser above; 1440×900. `ai-boundary-repro/AI-B02-after-boundary.png`, `AI-B03-retry-unchanged.png`, `results.json` (wire requests/responses); `J07-stable-plan-rejected.png`, `J07-undefined-paths.json`; failing hash log. `ai-boundary-repro/accepted-after-boundary.json` is the accepted state, not an applied AI trial.

**Not verified:** Real-model language quality or service entitlement. Export/reload removes undefined properties, so importing the portable record alone is insufficient reproduction; perform the visible boundary edit in the current session. Other workflows introducing optional undefined fields have not all been individually reduced.

### F2 — Refinement: a supported 0.01 m elevation-grid spacing is rejected

**Classification:** Reproduced defect.

**Observed:** Open Terrain, drainage and phasing → Load fictional terrain example. Replace the CSV with `fine-grid/valid-decimal-grid.csv`: x coordinates `0,0.01,0.02,0.03,120`, y coordinates `0,100`, every combination present, levels from `z=100+0.01x+0.02y`. This is a complete ten-point grid with minimum decimal spacing exactly 0.01 m, within the documented 2–20-coordinate/400-point bounds. Expected: valid inputs and analytic terrain results. Actual: “complete rectangular grid … spacing at least 0.01 m” error, unavailable draft terrain and disabled Apply. The old accepted inputs remain safe. Technical validation compares the binary difference `0.03−0.02 = 0.009999999999999998` directly with `.01`.

**Prompt to implementer:** Respect the documented decimal 0.01 m minimum when validating grid spacing. Bound floating-point tolerance to arithmetic representation error; keep genuinely subminimum spacing, duplicate/missing cells, nonfinite numbers and coordinate limits rejected. Verify this CSV is accepted with slope approximately 2.23607%, cut 8,033.333 m³ and fill 833.333 m³ at platform 101 m, while a 0.009 m interval is still rejected. Keep invalid-draft protection and accepted data preservation.

**Evidence:** Fresh sample, 1440×900, same commit/asset/browser. `fine-grid/decimal-grid-rejected.png`, `.txt`, `results.json`, `valid-decimal-grid.csv`; `fine-grid-regression.mjs` exits 1. Independently derived surface expectations are also in `independent-calculations.mjs`.

**Not verified:** Survey accuracy, need for centimetre-spaced real data, or professional suitability. Other valid nonuniform and 400-point grids passed; the defect is specifically the minimum decimal boundary.

### F3 — Important: give the interactive plan appropriate accessible semantics

**Classification:** Usability improvement, with a reproduced automated accessibility failure.

**Observed:** Axe-core 4.11.3 flags `nested-interactive` (serious) on the focusable `svg.canvas` with `role="img"`, which contains focusable lot/green/street/edit controls. It repeats on the working plan, street/lot/housing/green editors, both feasibility canvases, both saved-scheme canvases and AI workspace. The phasing map uses group semantics and did not trigger this rule. Seven keyboard-only journeys passed. Chromium's native accessibility tree exposes named lot buttons in this tested browser; this review therefore does **not** claim that a real screen reader cannot reach them. The semantic conflict remains unresolved across browser/assistive-technology combinations.

**Prompt to implementer:** Give interactive plan containers semantics that support their named descendants, and keep static exported imagery separately described where needed. Preserve keyboard object selection, corner movement, coordinate alternatives, focus visibility, modal containment and accessible names. Verify the affected axe rule is clear on working/edit/comparison canvases, rerun `keyboard.cjs`, then perform a named real-screen-reader walkthrough of lot selection, street-junction movement, error recovery and comparison navigation.

**Evidence:** Disposable samples, same build, desktop 1440×900; `accessibility-final/AX-01-desktop.axe.json` through relevant scans, accompanying PNGs, `desktop-native-AX-tree.json`, `keyboard-rerun/keyboard-results.json`. Narrow development scans were 375×812 and did not show this rule.

**Not verified:** Actual screen-reader announcements/navigation; no real screen reader was available. Axe reports incomplete contrast decisions on several SVG/obscured text nodes. Zero detected violations on four surfaces is not accessibility certification.

### F4 — Refinement: comparison scale and dimension labels overlap

**Classification:** Reproduced defect.

**Observed:** At 1024×768, open Feasibility experiments on the unchanged sample. In both small drawings the bottom `120.0 m` site dimension intersects the scale bar's `50 m` label. In the accepted drawing the dimension box is x=494.66–549.52, y=548.32–563.32 CSS px; the scale label is x=491.50–518.37, y=545.27–558.27. The trial repeats it 314 px to the right. Page/dialog overflow checks pass despite this collision. A planner comparing drawings cannot read both measurement cues cleanly; tabular quantities are unaffected.

**Prompt to implementer:** Reserve separate screen space for scale and boundary dimension labels in small comparison canvases, or move one cue without shrinking its readable text. Preserve true geometry, camera Fit/pan/zoom, independent scheme fitting and unobstructed review actions. Verify zero label-box intersections in `comparison-labels.cjs` at 1024×768 and inspect desktop, narrow and actual 200% comparison screenshots after the change.

**Evidence:** Same commit/asset/browser, unchanged fictional sample, tablet viewport emulation. `comparison-labels/tablet-overlap.png`, `results.json`, `comparison-labels.log`; `feasibility-browser/tablet-experiment.png`; `comparison-label-overlap.json` and `17-comparison-label-overlap.png` independently corroborate the collision.

**Not verified:** Every comparison canvas size, every manual pan/zoom, physical tablet use. This finding does not imply incorrect modelled dimensions or financial calculations.

## Calculation and workflow assessment

Independent terrain integration agrees on four-corner, nonuniform, 400-point and sign-reversed surfaces. For the 120×100 m plane, mean slope is `sqrt(5)%`; fill below 101 m is `2500/3` m³; net cut minus fill is 7,200 m³; gross cut is `24100/3` m³. Concave/reversed boundaries exclude their missing area rather than using the bounding rectangle. The minimum-spacing rejection is a validation failure, not a demonstrated wrong volume.

The unchanged runoff partition is 1,200/720/480/9,600 m². Effective weighted area is 5,148 m²; C=0.429, peak=0.143 m³/s and gross rainfall=600 m³. Zero C gives zero peak without changing gross rainfall. Applicability declarations, duration and optional capacity remain separate. An external outfall reference at (500,500) was retained and the map expands to include it; no connection or permission is inferred.

For the unchanged sample, non-land costs are Rp10.3804bn. Each equal phase receives Rp5.1902bn, spends one third in its three build months, and receives Rp8.5bn with Rp255m selling cost in its sales month. The owner is paid Rp10bn once. The separately constructed seven-row ledger gives closing −Rp3.8904bn and maximum month-end deficit Rp15.1902bn. Infrastructure-only phases and a later owner payment also reconcile. The model remains month-end accounting, not a financing or infrastructure-readiness approval.

Housing and feasibility arithmetic agree with the supplied independent expectations: one 48 m² Courtyard gives 1,188 m² and Rp63m allowance improvement; the unchanged 1,200 m² cost-only trial gives Rp1.26bn improvement. True green areas 120/160/72 m² and the combined quantities are retained. Held-lot and frontage errors block invalid acceptance. Default/explicit inheritance, the two generated-lot approval stages and persistent oversized-home guidance are exercised, including additional Cancel checks.

The connected study created a named project, refined its boundary, added a fictional context note and street branch, split a lot into vacant children, assigned Courtyard, protected a separate pocket, loaded declared fictional studies, reviewed held cost controls, saved annotated schemes, attempted AI, compared/reopened/undid schemes, reloaded and imported a portable copy. Its final 19 homes / 942 m² roads / 600 m² green / 4,000 m² lots / 6,458 m² unallocated reconcile to 12,000 m². The AI stage failed and subsequent cost application was **manual**, so the complete connected AI journey is **Fail**, not a successful AI-assisted study.

## Lost-work outcomes and remaining gates

No accepted-work loss was observed. Invalid street/lot/green/housing/study drafts could not replace accepted work; Cancel and plan/draft history retained tested geometry. Reopening Undo retained the independent saved collection. A conflicting tab preserved the last durable scheme while the first tab's new in-memory scheme could be downloaded. Quota simulation likewise retained a downloadable recovery copy. Importing into another project and editing its notes did not change the original. These are tested recovery cases, not guarantees against device failure, browser cleanup or all possible concurrency interleavings.

- **Blocked:** real-model access/quality/alternate-provider evaluation. Owner-supplied routing, credentials and authorization were absent. Scripted completion fixtures establish software protocol behavior only.
- **Blocked:** site-specific terrain/drainage/phase/cost suitability. No actual aligned survey/datum, storm/concentration/catchment/outfall, delivery schedule, cost evidence or qualified reviewer was supplied.
- **Not tested:** physical phone/tablet gestures, hardware keyboard behavior and a real screen reader. Emulation, native browser zoom and DOM/axe checks do not replace these.
- **Not tested:** human planner comprehension/acceptance and professional access/legal/civil/financial sign-off; other browser engines. Untested hardware, assistive-technology and professional cases remain explicitly identified in the matrix.
- **Unclear:** full contrast/accessibility conformance; unresolved automated semantics failures and incomplete SVG contrast decisions remain.

The implemented deterministic planning workflows show substantial tested recovery and calculation coverage. Acceptance should remain conditional on the corrections above, rerunning their preserved failing checks, completing the connected AI path without a manual fallback, and obtaining the external validation appropriate to the intended use.
