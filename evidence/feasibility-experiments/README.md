# Feasibility experiments — owner Feature #9

Implemented for review on 29 October 2026. Requirements: `docs/PRD_v0.14.md`.
The owner's title defines this increment; this was item 12 in the historical
combined roadmap. Planning brief and rules remains outside this implementation.
All work remains uncommitted; no project work was staged, reset or discarded.
Feature 8 independent testing remains deferred.

## Supported review

Open **Feasibility experiments** beside Assumptions on a generated accepted plan.
Compare Spine/Loop, generated frontage/depth and eight editable project cost
assumptions against the frozen accepted plan. Side-by-side drawings use the
existing plan canvas with shared coordinates, Fit, pan, zoom and layers.

The review shows before/trial/change quantities and every cost line, revenue,
surplus after owner payment, land allowance, owner shortfall/headroom and required
price. It identifies a required price above the buyer ceiling and warns about
profile applicability. Attribution explicitly measures design at accepted costs,
then changed costs on the trial design. The selling price remains assumed and
held even when the design changes; savings do not establish saleability.

Manual lot plans, stable polygon edits and explicit housing assignments hold the
design controls. Their projects support cost-only tests. Manual streets, boundary,
entrance, green outlines/minima, vacancies and home templates retain their existing
protections. Invalid geometry or incomplete/negative costs produce no partial
trial results and cannot be applied.

Reset trial returns to accepted inputs. Use illustrative costs changes only the
trial to original defaults. Cancel/Close/Escape retain accepted work. Apply commits
one history step and an event; Undo/Redo restores exact accepted inputs. Applied
costs survive reload, portable record export/import and layout clearing/regeneration.
The shared evaluator feeds economics details, housing/open-space summaries,
search/comparison and real deterministic HTTP tool explanations.

Explicit costs require project v11, record v12 and snapshot v10 with the cost
capability. Older disguised envelopes refuse. Legacy projects without costs retain
original defaults, including their original format versions. Scenario hashes
include exact cost precision to distinguish financially material fraction edits.

## Verification

- `root-tests.log`: **640 passing checks**, including **18 feasibility checks**
  and **7 added HTTP server checks**. Hand-derived construction, physical works,
  contingency, selling costs and allowance results; zero/invalid inputs; design
  attribution; no input mutation; held work; round trips and downgrade refusals.
- `build.log`, `lint.log`: successful production build and lint. The existing
  large-entry-bundle advisory remains; no dependency was added.
- `browser-results.json`, `browser.log`: **33 checks** against the actual served
  production asset identified in the JSON. Trial calculations, empty/negative
  input, invalid selling/target split, combined review, exact Cancel, Apply,
  search invalidation, Undo/Redo, reload, fractional rates, live tool server,
  export/import, held housing, clear/regenerate, touch and tablet overflow.
- `server-explanation.json`: real HTTP snapshot v10 at Rp4m/m² construction,
  20 homes, 1,200 m² built, Rp9.1204bn non-land costs, Rp4.8196bn land allowance.
  Search agrees with the explanation's scenario hash and costs.
- `accepted-experiment.json`: actual downloaded decision record v12, imported
  through the product as a separate project without replacing its original.
- `zoom-results.json`, `zoom.log`: actual browser zoom **2.0** through the browser
  tabs API: outer window 1,440 px, CSS width 1,440 → 720 and DPR 1 → 2. Inputs,
  review, Apply, Undo/Redo, Escape and page/dialog overflow checked.
- `regression-housing/`: **34 existing housing-review checks** pass, including
  restoration protection, assignments, construction/contingency and mobile key.
- Screenshots inspected: `desktop-experiment.png`, `tablet-experiment.png`,
  `touch-375-inputs.png`, `touch-375-review.png`, `zoom-200-inputs.png`,
  `zoom-200-review.png`. Low-contrast explanatory text found during inspection
  was corrected, then screenshots and affected checks were repeated.

Reproduction from the project root:

```sh
npm test
npm run build --prefix web
npm run lint --prefix web
PLAYWRIGHT_MODULE=/home/spotty/projects/studioos/node_modules/playwright node tests/feasibility-browser.cjs
PLAYWRIGHT_MODULE=/home/spotty/projects/studioos/node_modules/playwright xvfb-run -a node tests/feasibility-zoom.cjs
```

The static preview on 5173 serves the production build, `/assets/index-B91xjAE3.js`
in the final feasibility and zoom suites. Each regression JSON also identifies
its tested asset. The deterministic tool
service on 5174 was refreshed for the new snapshot contract. It reports no model
configured; no real-model call is claimed. Browser tests use isolated browser
contexts and do not modify the owner's browser-local project library.

## Limits and preserved reviews

One accepted baseline and one session trial; no persistent named experiment
ledger, scenario branching, batch sensitivity sweep, arbitrary street-width/park
experiments, optimizer, funding/timing/tax model or market-data integration.
Use existing editors for other design changes, then run another cost review.
Costs, prices and commercial feasibility remain illustrative and unverified.
Physical-device interaction and independent planner acceptance remain open.

Feature 8's independent test was not launched. Both earlier prompts are unchanged:

- `evidence/open-spaces/TESTER-PROMPT.md` SHA-256
  `74af0d6db6410119a2df43e8038ae33e212865811ecba030e39777bbe7067b05`.
- `evidence/housing-review-followup/TESTER-PROMPT.md` SHA-256
  `3c719f0025d90912e84141dd85f030594d355e7456b25fbc8eb24dc453f7e9dc`.

A separate Feature 9 review prompt is preserved in `TESTER-PROMPT.md`. Preparing
it does not launch a review or change the owner's deferral of Feature 8 testing.
