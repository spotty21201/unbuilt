# Release verification · 30 October 2026

The owner requested testing all completed work, then committing and pushing. Features 10–12 and the earlier planning workflows were checked against production asset `/assets/index-BR3nNjEc.js`. No product defect was found by this verification. No new feature scope was added.

- Root calculations, validation, project formats and HTTP service contracts: **711 passing checks** in `root-tests.txt`.
- Browser workflows: **971 passing checks across 35 suite runs**, in [the complete matrix](browser-matrix.md) and `verification-results.json`. Fresh disposable contexts/profiles preserve the owner's browser data.
- Production TypeScript/build and lint: passed (`web-build.txt`, `web-lint.txt`). The existing large-entry-bundle advisory remains.
- All nine saved tester prompts match their pre-test SHA-256 hashes (`prompt-hashes-before.txt`). Independent planner acceptance was not performed.
- Read-only review covered persistence/version gates, independent scheme copies and reopening, exact proposal binding, request/settings changes, key handling, HTTP limits, geometry/cash calculations and their UI callers. No release-blocking finding at the documented single-server, trusted private deployment scope.
- Credential-pattern scan of new/changed text found no private keys or access tokens. AI settings remain outside the repository. Fixture credentials are non-secret test strings.

`verification-results.json` is the final machine-readable result. `browser-matrix.json` records the initial run. Initial failures/screenshots remain as diagnostic evidence; `rerun.log` is authoritative where present. Counts use printed checks, or the explicit check list in a zoom result when that script prints only a summary.

The older boundary suite used retired object buttons, an obsolete entrance label, JSON property-order equality, and assumed hidden options were visible and asynchronous search had finished. It now uses the current accessible controls, structural comparisons and explicit waits. Planner/open-space checks now expect the current open-space/saved-preview wording and explicit unconfigured-AI label. Geometry, finance, accepted-state and in-flight protection assertions remain checked. No application behavior was changed to satisfy obsolete tests.

Desktop, tablet, 375px narrow layouts, keyboard actions and emulated touch are exercised across the matrix. Actual 200% browser zoom uses the native tabs API, with unchanged outer window, halved CSS width and DPR 2. Screenshots of the new phase ledger, terrain map at zoom and narrow AI administration were inspected, alongside earlier feature evidence.

## Reproduce

Run `npm test`, `npm run build --prefix web`, and `npm run lint --prefix web`. Serve production preview on port 5173 and `server/intent.mjs` on port 5174. Browser scripts use `PLAYWRIGHT_MODULE=/path/to/playwright` and `UNBUILT_EVIDENCE_DIR=/separate/output/directory`; run the listed tests with Node. Dedicated `*-zoom.cjs` and `browser-zoom.cjs` scripts require `xvfb-run -a` on a headless host. The AI browser script requires Node's `--experimental-strip-types --no-warnings`; its fixture/service use ports 5184/5183, so run normal and zoom variants sequentially. Set `UNBUILT_AI_ZOOM=2` or `UNBUILT_DEVELOPMENT_ZOOM=2` under `xvfb-run -a` for those variants. Open-space integration consumes `green-study.json` from its browser run; use the same output directory and run them sequentially.

## Limits

AI checks use a scripted protocol fixture, not a real model endpoint/credential. No actual survey/storm/phase data was supplied. These checks verify calculations and review flows with declared fictional data, not engineering suitability, market evidence, legal access or regulatory compliance. Physical-device gestures and independent planner review remain open. The preserved Feature 11 and Feature 12 tester prompts are ready for later review.
