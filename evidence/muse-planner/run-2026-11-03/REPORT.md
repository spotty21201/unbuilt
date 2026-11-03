# Ask Muse Wonder — 3 November 2026

Implemented the owner's requested residential planning partner using **Muse Wonder** (`muse-wonder-1.0`) and reduced the planner's explanatory copy. Work stays local; no staging, commit, push or deployment.

## What is working

**Ask Muse** appears at the top of the residential inspector, with “Your intelligent master-planning assistant.” It receives the current residential inputs, selected object, actual engine findings and up to four in-memory exchanges. It can:

- Explain the plan with a brief qualitative planning assessment and actual measured evidence.
- Test higher-yield, shorter-road or closer-mix alternatives through the existing bounded geometry search.
- Prepare a new structure from saved site commitments, asking about dead ends versus cul-de-sacs where necessary.
- Test residual fill with existing products.
- Propose an explicit entrance offset, an unlocked street displacement, a whole facing-section product assignment, or a specified flexible-space vertex adjustment.

A request interprets intent; the model cannot accept a plan. Geometry proposals run in the background worker, then show quantities in the Muse card. **Preview on plan** enters the existing whole-operation preview. The planner accepts or cancels; accepted geometry and schedules remain held until acceptance. Existing history, locks, save and reopening are reused without a persistence-format change.

The [active custom instruction](../../../docs/MUSE-MASTER-PLANNER.md) defines Muse's role, concise style, objective, held inputs, coherent facing groups, numeric grounding, unknowns, supported tools and approval limits. The server reads it at startup. It is reviewable source, not an invisible additional user preference.

## Concise interface

Repeated explanation paragraphs and notices were shortened. A completed layout collapses **Site, roads & products**, while unfinished site setup stays available. Controls open when deliberately selected; the initial inspector no longer selects a fictitious gate by default. Detailed engineering/source controls and SOP reports remain accessible. Muse shows its assessment and primary fact first, with supporting measured evidence expandable.

Search feedback distinguishes **failures on the proposed scenario** from **rejected other trials**. Screenshot inspection caught an initial new-panel mistake that treated the latter as blockers; it was fixed and covered by a targeted browser assertion. A valid shorter-road proposal is explicitly checked as acceptable. A failed mix/dimensional proposal still cannot be accepted.

## Model connection and credential handling

The private local routing connection now targets `https://api.meta.ai/v1/chat/completions`, model `muse-wonder-1.0`, label Muse Wonder. The owner-supplied credential is stored outside the repository in the existing private server configuration, with file mode0600. It is absent from source, frontend bundles, browser storage, project exports and evidence. No administrator token was invented or enabled; administration still uses its existing separate access mechanism.

The adapter was shared between the existing assistant and residential route. Hosted Meta uses **auto** tool choice and disables parallel calls; generic compatible connections preserve the old required-tool behavior. This follows [Meta's model catalog](https://dev.meta.ai/docs/models) and [Chat Completions documentation](https://dev.meta.ai/docs/protocols/chat-completions), and was verified against the real endpoint. Exactly one supported call must pass application validation. No tool, multiple tools, arbitrary plain prose, unsupported keys, fabricated fact IDs and invalid numbers are refused rather than accepted as measurements. Provider errors never return raw upstream bodies or keys.

Public health now reports the actual active model, rather than the unused legacy Muse Spark default. “Ready” means configured; “connected” follows a verified response. The existing global connection indicator is refreshed after a Muse response. Provider calls are bounded and cancellable, share the existing two-request concurrency cap, and never silently switch routes. Generic timeout remains twenty seconds; Meta timeout is sixty seconds. Pending answers are cancelled when inputs/selection change or the editor closes; stale replies cannot update the plan. A model's qualitative interpretation remains advisory; all quantities are engine-owned.

Tool service restarted with its original command/environment and port5174. Static preview remains5173. No frontend API key or new SDK/dependency was added.

## Actual model and geometry evidence

The following are **real Muse Wonder exchanges**, not a scripted demonstration:

1. [Initial live response](live-explanation.json): actual28 valid lots,18 Compact/10 Family,64.29/35.71%, both within the required tolerance.
2. [Live editor workflow](browser/results.json): imported original31-lot fixture through the visible collection import. Asked Muse to move the existing south entrance60→63m. It selected the precise entrance tool; the worker measured31→28 valid lots and190→190.2m road. Accepted inputs stayed unchanged while asking/testing. Preview cancelled exactly; a second request was accepted, then complete undo/redo and save/reopen reproduced geometry and schedules. A request to move protected woodland was refused.
3. [Final planning assessment and search](final-browser/results.json): Muse advised investigating permitted residual fit while protecting committed features/access, selected current evidence, and then interpreted a request for shorter internal roads. The existing engine found a real31-lot190→180m candidate in14 trials, with entrance and spaces exact. It entered review without auto-acceptance; cancellation preserved the original scenario. Rejected reasons from other trials do not mark this passing candidate as failing.

Screenshots: [ready](final-browser/ask-muse-ready.png), [planning assessment](final-browser/planning-assessment.png), [shorter-road trial](final-browser/shorter-road-proposal.png), [entrance trial](browser/live-entrance-trial.png), [actual preview](browser/entrance-proposed-on-plan.png), [protection refusal](browser/protection-refused.png). Screenshots were opened and inspected. Initial screenshots with excessive supporting text and the rejected-trial feedback mistake are retained under `final-browser/attempt-1`.

The browser cancellation test deliberately delays one controlled response to test late-answer rejection. That specific case is identified as controlled latency; it is not claimed as a live model exchange. The other recorded exchanges above are real Wonder calls. Scripted-provider server tests are separately labelled and never use the owner's key.

## Verification

- Existing full root suite:1044 PASS assertions, including95 residential SOP,56 V2 and42 preparation checks. Output redirected to this new run; historical evidence untouched. A nonexistent isolated routing path prevents regression tests using the owner's real connection.
- Existing AI contracts/service:12+19 passing checks, including concurrency, timeout, configuration revision, cancellation, secret handling and origin checks, using a scripted provider.
- Residential Muse domain:20 checks; residential API:17 scripted-provider checks; three search actions tested for exact held entrance/spaces and immutable original inputs.
- Live browser workflow:19 checks; final Wonder/concise-interface review:13 checks. Existing residential browser26 and fresh26-action workflow25 pass. The final visual review additionally asserts that other rejected trials do not create false blockers and that a passing candidate can be accepted.
- TypeScript/Vite build and lint pass; existing non-fatal large-bundle warning retained. Exact assets, commands, logs and browser version are in [verification summary](verification-summary.json).

Retained iteration logs explain all failures: first domain positive-move fixture was itself locked, so a separate explicitly unlocked fictitious test input was used while locked refusal remains tested; initial hook-lint warnings were fixed; screenshot review found the trial-feedback issue and led to the specific regression above. No failed run is silently relabelled as passing. [Preservation record](preservation.json) compares the starting tree, all historical evidence and unchanged HEAD. The first existing report's eleven alternatives remain unchanged.

## Review locally

Open [localhost:5173](http://localhost:5173), enter **Residential planning**, then **Ask Muse**. Try “Explain this plan”, “Test shorter internal roads while holding entrance and open spaces”, or an explicit displacement of a selected unlocked object. New geometry first appears as a tested proposal; Preview on plan, then accept/cancel. Completed setup can be reopened under Site, roads & products.

Representative commands (always redirect old output-writing tests):

```
node --experimental-strip-types --no-warnings tests/residential-muse.mjs
node --experimental-strip-types --no-warnings tests/residential-muse-server.mjs
node tests/residential-muse-browser.cjs
node tests/residential-muse-review-browser.cjs
npm run test:ai
UNBUILT_AI_CONFIG=/tmp/unbuilt-regression-no-model.json UNBUILT_EVIDENCE_DIR=evidence/muse-planner/run-2026-11-03/regression npm test
npm run build --prefix web
npm run lint --prefix web
```

The two Muse browser scripts call the live configured model and consume provider usage. Other provider fixtures are isolated. Requests are not sent simply by opening the panel: only public local health is queried automatically.

## Scope and remaining limits

This is a bounded planning partner, not unrestricted natural-language CAD or exhaustive optimization. Search reuses supported geometry trials and its existing shortlist limit. A no-improvement result does not establish impossibility; its tested scope is reported. Search holds entrance and all space geometry unless the planner explicitly requests a supported space edit. Model suggestions cannot unlock, redraw the site, change protection, relax mix, resize products or change road widths. Those remain deliberate manual inputs.

Real-model coverage includes explanations, entrance movement, shorter-road search and protection refusal; not every phrasing of every supported tool was tested. Chats are ephemeral, not saved project content. Detailed vehicle manoeuvres, verified survey/access rights, approved engineering dimensions, detailed house feasibility and statutory approval remain separate and unresolved unless supplied. Missing costs remain unpriced. No professional approval, practical saleable optimum or complete development estimate is claimed.

Primary changes: `src/residential-muse.ts`, `server/ai-model.mjs`, `server/residential-muse.mjs`, existing `server/ai-assistant.mjs`/`server/intent.mjs`, `ResidentialMuse.tsx`, planner/setup/worker/CSS, the custom instruction, focused tests and appended current documentation. No unrelated work or historical evidence was discarded.
