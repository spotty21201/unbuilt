# Unbuilt — current work context

Updated 31 October 2026. Workspace: `/home/spotty/projects/unbuilt`.

## Current decision

The current consolidated product specification is [PRD v0.19](PRD_v0.19.md),
issued 31 October 2026 at the owner's request. It records the implemented scope,
angled/rounded roads, corrected tester findings, data compatibility and remaining
validation needs. This is a documentation revision; no additional feature is
authorized. Earlier PRDs and all tester prompts remain preserved.

The owner authorized **Feature 12: Terrain, drainage and phasing — introduce
these with appropriate data and calculations**, after completing Feature 11.
Feature 12 is implemented under `docs/PRD_v0.17.md`; calculation/data requirements
are in `docs/DEVELOPMENT-CALCULATIONS.md`. No actual elevation, storm or phase
inputs were supplied. The tool opens without invented results and offers explicit
fictional examples for review.

The owner requested keeping tester prompts for both Feature 11 and Feature 12.
They are saved under `evidence/ai-assistant/TESTER-PROMPT.md` and
`evidence/terrain-drainage-phasing/TESTER-PROMPT.md`. Their individual reviews
were initially deferred; the combined automated tester review below now covers
them. Preserve all prompts. Human planner/professional acceptance remains open.

The owner subsequently requested testing everything, then committing and pushing
once verified. This authorizes the Features 10–12 checkpoint and its test evidence.
The earlier Feature 9 checkpoint is on GitHub main as
`e2dc09fdc7375d0fe7e0e91be61d843e263f6c71`. Release verification is recorded in
`evidence/release-verification-2026-10-30/README.md`. Feature 11 routing/keys and
real-model verification remain deferred; setup is in `docs/AI-ADMIN.md`.

The owner then requested consolidating the outstanding tester procedures into
one prompt, and deployed the tester. The preserved assignment is
`evidence/combined-independent-review/TESTER-PROMPT.md`; the report is in
`evidence/combined-independent-review/run-2026-10-30-independent/REPORT.md`.
The owner authorized implementing all four findings: AI snapshot transport,
minimum decimal grid spacing, canvas accessibility semantics and comparison
label collisions. Corrections and fresh evidence are in
`evidence/combined-independent-review/run-2026-10-30-corrections/README.md`.
All original prompts and the independent tester's evidence remain unchanged.
The earlier Features 10–12 checkpoint is `38ce2f6870d9b83ab85e6ba2ed11dd46f6021048`. The owner subsequently authorized angled streets and rounded turning corners; see `docs/PRD_v0.18.md` and `evidence/angled-rounded-streets/README.md`. The owner has now requested committing and pushing this verified extension together with the four corrections, preserved tester prompts and evidence.

The owner's titles/numbering supersede the historical roadmap. Planning brief,
land budget and walkability remain unimplemented. Angled streets and corner fillets are now authorized. No other subsequent roadmap feature is authorized.

## Working rules

- Preserve the extensive modified and untracked tree. It contains valuable work
  from Features 1–12 and their reviews. Do not reset, clean, discard, stage, commit
  or push unless explicitly requested. The earlier authorization to commit/push the Features 10–12 checkpoint is complete. The owner has now explicitly requested committing and pushing the verified corrections and angled-road extension.
- Preserve project branding. Do not add model-provider branding, attribution,
  trademarks, development signatures or names to product/source/docs/assets or
  commit metadata. Do not claim unsupported development provenance.
- Implement only the authorized feature. Preserve earlier PRDs and append the
  new requirements/decisions rather than rewriting history.
- The product is a professional, canvas-first residential planning workbench:
  compact dark shell, large light plan, narrow rail, contextual inspector,
  compact outcomes and explicit review before replacing accepted work.
- Generated geometry and finances must be deterministic and truthful. Invalid
  drafts retain the accepted plan. Preserve selection, pan/zoom, Apply/Cancel,
  draft and plan history, persistence, proposal/search/preview/apply/comparison,
  measured explanations and stale/in-flight response protection.
- Do not infer visual quality from checks or CSS. Test the actual served build,
  inspect screenshots and distinguish measured results from planning assumptions.

## Read first

- `docs/PRD_v0.19.md` — current consolidated product requirements and acceptance limits.

- `docs/PRD_v0.18.md` and `evidence/angled-rounded-streets/README.md` — current angled/rounded street extension. Install root dependencies (`npm ci`) as well as web dependencies before building or starting tools.

0. `docs/PRD_v0.17.md`, `docs/DEVELOPMENT-CALCULATIONS.md` and
   `evidence/terrain-drainage-phasing/README.md` — current Feature 12 scope/evidence.

1. `evidence/saved-alternatives/README.md` and `docs/PRD_v0.15.md` — current feature and evidence.
2. `evidence/feasibility-experiments/README.md` and `docs/PRD_v0.14.md` — current feature, tests and limits.
3. `evidence/open-spaces/README.md` — complete Feature 8 report, evidence and limits.
4. `docs/PRD_v0.13.md` — current Feature 8 requirements and data contract.
5. `docs/DESIGN.md`, `docs/DECISIONS.md`, `docs/ACCEPTANCE.md`.
6. `docs/PRD_v0.12.md` — housing mix and lot-review requirements.
7. `evidence/housing-review-followup/README.md` — addressed housing concerns.
8. `docs/PRD_v0.8.md` — combined roadmap; its original status table is historical.
   Later PRDs and explicit owner instructions supersede earlier approval labels.
9. Original context as needed: `docs/PRD_v0.4.md`, `docs/REDESIGN-SPEC.md`,
   `docs/ORCHESTRATOR-PROMPT-PRD04-STITCH-LLM.md`, `stitch/`,
   `evidence/ui-reference/`, `evidence/prd04-independent-retest/`.

## Completed product scope

Features 1–3: named browser-local projects, blank/sample creation, Save/reopen,
rename, deletion/recovery, portable copies; remove/restore homes, clear layout,
delete boundary; closed irregular boundary drawing and corner editing with true
area, draft review and history.

Feature 4: site context and source/reference workflow. Consult PRD v0.9 and its
evidence for exact formats and limits. Context annotations do not establish legal
access, reserve land or verify survey accuracy. Original source media generally
must be reattached after reopening.

Feature 5: editable connected orthogonal streets, junctions, widths, entrance
connector proposals, measured draft review and history. Review fixes preserve
off-centre horizontal pointer intent, centreline connection snapping, full conflict
corridors and exact pre-approval search scope. Not road engineering.

Feature 6: rectangular lot split/merge and connected rectangular block subdivision;
individual polygon reshapes; frontage/home-fit validation, vacancy protection,
source/result reference and occupancy explanations. Arbitrary polygon blocks and
nonrectangular merges remain outside scope. Lot numbers are planning references,
not stable legal identifiers. Deeper polygon setbacks remain partly unverified.

Feature 7: reusable named rectangular home templates, explicit/default assignments
to selected lots/blocks, measured built area and costs, vacancies, review/history
and persistence. Housing follow-up fixed persistent oversized-restoration guidance,
direct default-assignment review before generated lots, assignment provenance,
a readable mobile key and inspectable shared cost/price assumptions.

Feature 8:

- Up to 12 named parks, pockets and green corridors. Each is a simple polygon
  with 3–24 corners, at least 1 m², inside the actual site and local 0–500 m frame.
- Pointer drawing/closure, rectangle entry and straight-corridor creation from
  endpoints and 1–50 m width. Corner dragging preserves grab offset and freezes
  the screen projection. Coordinates, arrows/Shift+arrows, add/remove corners,
  deletion, unfinished-draft Undo/Redo, Apply/Cancel and plan history are supported.
- Individual fixed shape/location, individual minimum area, combined minimum.
  Crossing, overlap, containment and invalid input block Apply. Conflicting edges
  are highlighted. The accepted plan remains safe.
- True polygon areas drive combined green quantity and green-works cost.
  Streets and whole lots conservatively avoid bounding extents plus clearance;
  excess exclusion is unallocated, not designed green. Spine routes orthogonally;
  fixed Loop refuses conflicts. No optimal-capacity claim.
- Manual lots, streets, polygon edits and housing assignments retain protections.
  A new space cannot silently remove/reassign held homes. Conflicts require a
  separately reviewed edit. Generated whole lots may change; consequences appear
  before approval.
- Boundary-only reservations persist through starter generation. Explicitly empty
  collections mean no green. Clear/delete reset them; Undo restores them.
- Saved projects, record import/export, search, comparison and server-measured
  explanations carry the same collection. An accepted green-lock proposal and
  its search now use the same approved snapshot, avoiding immediately stale results.
- Selected-space fit reserves room for toolbar/corner targets, including actual
  200% browser zoom. Drawing controls are outside the clipped drawing stage.

## Feature 9 — feasibility experiments

- Open Feasibility experiments beside Assumptions on a valid generated plan.
  Native modal compares frozen accepted and unapplied trial drawings/results.
- Trial Spine/Loop, generated frontage (6–30 m) and lot depth (12–40 m), plus
  eight explicit project cost inputs: construction, streets, green works, setup,
  other physical works, contingency, professional allowance and selling costs.
- Manual lots, polygon lot reshapes and assigned homes hold design regeneration;
  cost-only trials remain usable. Manual street geometry/widths, named spaces,
  entrance, boundary, vacancies, templates and shared selling-price assumptions
  stay held. Unsupported edits use their existing separate review workflows.
- Before/trial/change figures cover measured land quantities and cost lines,
  revenue, surplus, land allowance and owner outcome. Required price and ceiling
  warning; sequential attribution: design at accepted costs, then cost changes.
- Empty/invalid costs and geometry block Apply without partial trial figures.
  Reset to accepted inputs, explicit illustrative defaults, Close/Cancel/Escape,
  one-step Apply/Undo/Redo, accepted-state save/reload and portable record import.
- `src/costs.ts`: shared defaults, complete numeric cost contract and validation.
  Optional `SiteFrame.costAssumptions` is read by `src/economics.ts` so local and
  server search/explanations, comparisons and housing/open-space summaries agree.
  `src/experiments.ts`: held-work guard and deterministic measured trial.
  `web/src/unbuilt/FeasibilityExperiments.tsx`: review; App/drafting.css integrate
  entry, history, persistence, rates and narrow/zoom layout.
- Explicit costs require project v11, decision record v12, snapshot v10 and
  `editable-cost-assumptions`. Legacy projects without costs keep original
  defaults and envelopes. Exact cost-input precision participates in hashes.
- Costs survive clear/delete, boundary replacement, resize and starter generation.
  An unapplied trial is session-only. No persistent named alternatives, price
  market verification, cost feed, arbitrary street experiment or optimum claim.

## Feature 10 — saved alternatives

- Alternatives in workspace navigation, or Saved alternatives in the inspector
  and blank-plan setup, opens the project collection. Up to 20 independent
  names/snapshots with scheme-level multiline notes; Save/Cancel details, rename,
  confirmed removal and one session Undo removal.
- Save the accepted plan or explicitly select a current search preview. A preview
  can be kept without applying it. Working edits and annotation changes never
  overwrite saved inputs; save a new name to retain an edited version.
- Snapshots include geometry, manual lots/reshapes, housing assignments, vacancies,
  streets, named spaces and commitments, prices/costs and site context. Original
  media, drafts, global history and searches remain outside the snapshot.
- Compare any two saved schemes, working plan or current preview, with each side's
  own assumptions. Real drawings fit independently; quantity/finance tables and
  an assumption table expose actual differences. Unsupported results stay unavailable.
- Reopening reviews working versus saved inputs before explicit confirmation.
  Undo/Redo restores prior working state without deleting schemes/notes. Reopening
  from blank works. Orphaned edits/invalid geometry block rather than disappear.
- Project v12 / record v13 carry the collection and reject older disguised
  envelopes, including empty arrays. Legacy project formats remain readable.
  Active-plan tool snapshots remain at their existing format; collections are not
  sent to calculation tools. Save/reload and portable import/export retain schemes.
- `src/persist.ts`: saved record types, validation and formats;
  `src/alternatives.ts`: exact state matching and independent assessment;
  `web/src/unbuilt/SavedAlternatives.tsx`: review and metadata controls;
  App/drafting.css: collection save, preview capture, reopen history and footer.
- Browser quota/conflict recovery keeps disk data and an exportable in-memory
  project. Narrow/zoom review footer stays above canvas toolbars. No cloud
  collaboration, scenario tree, automatic merging or per-scheme history replay.

## Feature 11 — AI assistant and server administration

- AI investigation in the planning assistant interprets intentions using a real
  completion-protocol adapter. The selected object is visible context. A checked
  response is a proposal, clarification, measured-fact selection or known limit.
  It is separate from the preserved local measured tools/fixed-rule search.
- Review exact hypothetical design/cost changes, Run reviewed experiment, inspect
  engine measurements, optionally request AI-selected measured explanations, then
  Review on plan. Existing feasibility drawings/inputs lead to explicit Apply.
  Discard and Cancel retain accepted work; Apply supports Undo/Redo and named
  alternatives. No autonomous application or search/optimality claim.
- `src/ai-assistant.ts`: strict tool validation, actual-selection checks, held-work
  guard, measured fact catalog, privacy-filtered model context and exact binding.
  Engine geometry/finance remains authoritative. Unsupported geometry/mutations,
  unknown fields, invented prose results and invalid held-work changes refuse.
- `server/ai-assistant.mjs`: one upstream tool call per action, 20-second deadline,
  two concurrent calls, bounded payloads, abort propagation, no automatic retries
  or provider switching. `server/intent.mjs` adds AI routes and truthful health.
- `server/ai-config.mjs`: primary/alternate profiles, administrator authorization,
  revision-guarded save, write-only keys, atomic mode-0600 private configuration,
  explicit retain/replace/remove, status/test and restart behavior. Config is
  outside the repo; no real file/key was installed during implementation.
- `web/src/unbuilt/AISettings.tsx`, `AIInvestigation.tsx`: settings modal and review
  workflow; App/Assistant/FeasibilityExperiments connect status, snapshots, review
  and plan history. Shared snapshot hashing adds opt-in exact precision for these
  receipts without changing existing tool hashes. No persistence version change
  is needed for ephemeral AI requests; keys/transcripts are not exported.
- Only supported inputs and measured findings leave the tool server for the
  active model connection. Source notes/media, original source geometry and saved
  schemes are excluded. User-entered intention text is sent intentionally.
- Single-server/shared-administrator prototype; no user accounts or encrypted
  secrets vault. Completion-protocol endpoints only. The owner supplies endpoints
  and secrets later; actual service access and language quality remain unverified.

## Feature 11 verification (historical)

Served production asset: `/assets/index-DQKhB3TR.js`. Static preview on port 5173;
refreshed tool service on 5174. Live health: unconfigured, administrator access
not yet enabled. No real provider was contacted. See `evidence/ai-assistant/`.

- Root suite: 689 passing checks, including 12 AI contract and 19 service checks.
- Production build and lint pass; the existing large-bundle advisory remains.
- Desktop/narrow browser: 28 checks. Actual 200% browser zoom: 29 checks, including
  a verified zoom factor 2, half CSS width/DPR 2 and unchanged initial outer window.
- Full browser → real isolated service → scripted protocol fixture → engine →
  review → Apply/Undo/Redo → named scheme/reload/export. Fixture results are not
  real-model verification. Invalid tools/prose, failures, cancellation, stale
  selection, admin access, explicit switching and credential exclusion are covered.
- Service checks also verify private file permissions, restart/revisions, bounds,
  concurrency, client abort and a real 20-second provider timeout without retry.
- Browser regressions: feasibility 33, saved alternatives 36. Evidence uses new
  directories; preserved earlier prompts/evidence have not been replaced.
- Narrow and actual-zoom screenshots inspected. Automated touch/planner acceptance
  is not claimed. Real endpoint/key installation and real-model testing remain open.

Reproduce: `npm test`, `npm run build --prefix web`, `npm run lint --prefix web`;
`PLAYWRIGHT_MODULE=/home/spotty/projects/studioos/node_modules/playwright node
--experimental-strip-types --no-warnings tests/ai-browser.mjs`. For actual zoom,
add `UNBUILT_AI_ZOOM=2`, use `xvfb-run -a`, and set a separate evidence directory.
The browser script uses isolated ports 5183/5184, service tests 5181/5182.

## Feature 12 — terrain, drainage and phasing

- Terrain, drainage and phasing opens beside Feasibility experiments and from
  blank/boundary-only setup. Three independent study groups use declared inputs;
  no source data/results are supplied on opening. Explicit examples are fictional.
  Source, datum/date, applicability, accepted-versus-draft quantities, a responsive
  screening map, Apply/Cancel/Reset/Escape and one-step plan history are included.
- Complete local-metre elevation grid: 2–20 distinct x/y coordinates, 4–400 points,
  80 KB CSV, no gaps/duplicates. SW–NE planar cell triangles are clipped to the
  actual concave boundary. Slope/extrema/threshold areas and exact separate gross
  cut/fill to an optional whole-site level are measured without extrapolation.
  Grid/datum preparation is external; no breakline/earthworks/retaining design.
- Rational peak screening uses measured home footprints, streets, designed green
  and remaining site areas with entered C/intensity/duration/concentration values.
  Full-site catchment and no-significant-storage declarations are required.
  Outfall position/capacity is entered and unverified. Gross rainfall volume is
  separate from runoff/detention. No routing, flood/pipe or local compliance claim.
- Up to eight phases assign occupied lots using stable keys and expose build/
  sales months, shared budget percentages, single owner payment and a calendar
  cash ledger. Actual home construction plus contingency follows assignments;
  remaining accepted costs follow shares totaling 100%. Closing cash reconciles
  to accepted modeled surplus. Month-end deficit excludes intramonth financing,
  absorption/tax/debt, missing budgets and phased infrastructure readiness.
- Missing/obsolete references, insufficient grid coverage and inapplicable storm
  assumptions withhold affected results. Valid observations can still be retained;
  malformed values cannot be applied. Geometry changes/clear/delete/starter/resize
  retain data, do not relocate a survey and never reassign lots automatically.
- `src/development-inputs.ts`: strict contracts, finite bounds, grid/phase/date and
  CSV validation. `src/terrain.ts`: clipping, planar surface, slope and integration.
  `src/development.ts`: independent calculations, budget/cash reconciliation and
  measured findings. `boundary`/`geometry` carry optional `development` inputs.
- `DevelopmentEditor`, `DevelopmentMap`, `DevelopmentResults`: input review,
  scope/status and accessible map/table interaction. App connects history,
  lifecycle and export. Saved alternatives show each side's own results, sources
  and assumptions; feasibility trials disclose stale phases and study impacts.
- Project v13 / record v14 / snapshot v11 plus `terrain-drainage-phasing` gate the
  inputs, including studies existing only in saved schemes. Older disguised
  envelopes reject; earlier valid files remain readable. Exact input precision
  participates in hashes. Server explanations and AI carry computed findings;
  raw grids/source descriptions remain outside model payloads.
- Additional earthworks/drainage budgets require separate existing cost review;
  they are not silently added to base economics or phase accounting. No actual
  survey/hydrology/commercial suitability or independent planner acceptance exists.

## Current Feature 12 verification

Production asset `/assets/index-BR3nNjEc.js` on 5173. Refreshed tool service on 5174;
AI remains unconfigured with administrator access not enabled. No real model
was contacted. See `evidence/terrain-drainage-phasing/`.

- Root: 711 passing checks, including 22 new development checks (analytic planes,
  concave cut/fill, a valley, disjoint runoff conversion, mixed home sizes, zero
  costs, monthly reconciliation, partial studies, imports/version/privacy/bindings).
- Production build and lint pass; existing large-bundle advisory remains.
- Development browser: 39 checks. Actual native 200% browser zoom: 40 checks,
  initial 1440→720 CSS px, DPR 1→2, outer window still 1440. The final narrow
  checks use 375 CSS px; physical touch is not claimed.
- Real file import, Apply/Cancel/history, named schemes with independent
  assumptions, v14 export/import into a separate project, stale assignments,
  explicit remapping, boundary deletion/Undo and server/local agreement pass.
- Browser regressions: feasibility 33, saved alternatives 36 and AI 28 (scripted
  upstream, not a real model). Regressions write only new evidence directories.
- Desktop/narrow and actual-zoom screenshots inspected. Result-label contrast,
  SVG screen-sized labels, focus strokes and zoom map fitting were corrected.
- All earlier tester hashes remain unchanged. Feature 11/12 tester prompts are
  saved below; no independent reviewer was launched. Actual project data, civil/
  financial suitability, physical-device touch and real-model verification remain open.

Reproduce: `npm test`, `npm run build --prefix web`, `npm run lint --prefix web`;
`PLAYWRIGHT_MODULE=/home/spotty/projects/studioos/node_modules/playwright node
 tests/development-browser.cjs`. For actual zoom set `UNBUILT_DEVELOPMENT_ZOOM=2`,
use `xvfb-run -a` and a separate `UNBUILT_EVIDENCE_DIR`. Static production preview
and the current tool service must both be running. See the methods document for
exact formulas, data requirements and primary references.

## Feature 8 implementation map

- `src/open-spaces.ts`: model, validation, true areas, conservative extents,
  legacy migration helper and straight-corridor outline.
- `src/planning.ts`: optional canonical `openSpaces` collection.
- `src/geometry.ts`, `src/access.ts`, `src/site.ts`: multi-obstacle routing,
  actual containment, held-geometry conflicts, quantities, starter preservation.
- `src/persist.ts`, `src/snapshot.ts`: project v10, decision record v11,
  snapshot v9 and `multiple-open-spaces` capability; downgrade protection.
- `src/search.ts`, `src/intent.ts`: collection preservation and truthful scope.
- `web/src/App.tsx`: draft/selection/history, approval, save/export, assistant
  snapshot binding, accepted-search snapshot and clear/reset integration.
- `web/src/unbuilt/OpenSpacesEditor.tsx`, `OpenSpaceLayer.tsx`: new controls
  and interactive SVG geometry. `PlanCanvas.tsx`, `DynamicInspector.tsx` and
  `web/src/drafting.css` connect them to the workbench.

Compatibility: absence of `planning.openSpaces` retains the legacy rectangular
park workflow. Presence, including `[]`, makes it canonical. The old `green` rect
is only a compatibility reference, explicitly labeled in new exported records;
never count or render it as another allocation. Do not downgrade the new formats.

## Preserved tester prompts

- Combined assignment (prepared, not launched):
  `evidence/combined-independent-review/TESTER-PROMPT.md`. When the owner assigns
  its execution, its named scope consolidates the historical per-feature review
  deferrals; other features and external credential/data gates remain separate.

- Feature 11: `evidence/ai-assistant/TESTER-PROMPT.md`
  SHA-256 `641deaf378e409db54cfa54cc8a89c71103b72deebdb781febcdd8d388b640e8`.
- Feature 12: `evidence/terrain-drainage-phasing/TESTER-PROMPT.md`
  SHA-256 `a45952b1e23c9784849915494e477f12b39573c4395bbc5b1505c9158cef6e43`.

- Feasibility: `evidence/feasibility-experiments/TESTER-PROMPT.md`
  SHA-256 `7eb2aa6a2fefaf6d8cb762cf263a4c2540f007ca1f37445b1755a1046d81f834`.
- Saved alternatives: `evidence/saved-alternatives/TESTER-PROMPT.md`
  SHA-256 `466a48256fb0ddba691bc4d7f807ea4b228fd99f20e5cade8f2393fc89de6034`.
- Feature 8: `evidence/open-spaces/TESTER-PROMPT.md`
  SHA-256 `74af0d6db6410119a2df43e8038ae33e212865811ecba030e39777bbe7067b05`.
- Housing retest: `evidence/housing-review-followup/TESTER-PROMPT.md`
  SHA-256 `3c719f0025d90912e84141dd85f030594d355e7456b25fbc8eb24dc453f7e9dc`.

These prompts were deferred when prepared and are now covered by the combined
automated review described above. Preserve them unchanged; do not launch further
independent reviews without the owner's request. Human/physical/professional and
real-model validation remain separate from the automated tester's findings.

## Feature 10 verification (historical)

Current served asset: `/assets/index-D1h10OYF.js`.
See `evidence/saved-alternatives/` for screenshots and logs.
Production preview remains on 5173, deterministic tool service on 5174. No real
model or independent planner verification is claimed.

- Root tests: 658 passing checks, including 18 saved-alternative checks.
- Production web build and lint pass; existing large-bundle advisory remains.
- Saved-alternative browser: 36 checks, including storage failure with actual
  backup, saved preview, isolation after import and blank-to-saved reopening.
- Actual 200% browser zoom: unchanged outer window, half CSS width and DPR 2;
  save, notes, comparison, reopening, Undo/Redo, Escape, overflow and hit-target checks.
- Separate browser regressions: projects 55, lifecycle 20, feasibility 33.
- Desktop, tablet, narrow emulated touch and actual zoom screenshots inspected.
  A floating-toolbar/footer overlap was corrected and explicitly checked.
- All three earlier tester prompts retain their recorded hashes. A new Feature
  10 tester prompt is prepared but no independent review has been launched.

Reproduce: `npm test`, `npm run build --prefix web`, `npm run lint --prefix web`,
then Playwright scripts `tests/saved-alternatives-browser.cjs` and (under xvfb-run)
`tests/saved-alternatives-zoom.cjs`, with the same PLAYWRIGHT_MODULE path below.

## Feature 9 handoff verification (historical)


Production preview: `http://localhost:5173`, serving `/assets/index-B91xjAE3.js`. Deterministic tool service: 5174,
refreshed for snapshot v10; no configured model or real-model round trip.
See `evidence/feasibility-experiments/` for the exact served asset and logs.

- Root tests: 640 checks, including 18 feasibility checks and 7 added server checks.
- Web build and lint pass; existing large-entry-bundle advisory remains.
- Feasibility browser: 33 checks; actual 200% browser zoom verifies half CSS width,
  DPR 2, unchanged outer window, edits/review/Apply/history/Escape and no overflow.
- Housing review regression: 34 checks in a separate evidence directory.
- Desktop/tablet/narrow touch and actual zoom screenshots inspected. Touch is
  emulated; physical-device and independent planner acceptance remain open.
- Earlier tester prompt hashes still match. Feature 8 independent testing
  was not launched. This was an uncommitted handoff; it is now in the pushed Feature 9 checkpoint.

Commands: `npm test`, `npm run build --prefix web`, `npm run lint --prefix web`;
`PLAYWRIGHT_MODULE=/home/spotty/projects/studioos/node_modules/playwright node
tests/feasibility-browser.cjs`; same environment with `xvfb-run -a node
tests/feasibility-zoom.cjs` for actual browser zoom. See evidence README for details.

## Feature 8 handoff environment and checks (historical)

At handoff the production preview responds at `http://localhost:5173`, serving
`/assets/index-BuiQJVHB.js`. Deterministic tool service: port 5174. Its health reports
`modelConfigured: false`; the UI says no model. No verified real-model connection
or round trip exists. Recheck live processes/build on continuation; these are
observations, not a guarantee the environment is unchanged.

- Root `npm test`: 615 passing checks, including 22 open-space checks.
- `npm run build --prefix web` and `npm run lint --prefix web`: passed.
  Existing large-entry-bundle advisory remains.
- Open-space browser: 31 checks; integration: 17 checks. Export/import, search,
  preview/server explanation, stale/in-flight clearing, manual housing conflict,
  boundary-only generation, last-space deletion/Undo and emulated touch covered.
- Actual browser zoom 2.0 verified through browser tab zoom API, unchanged outer
  window, half CSS width and DPR 2. Creation, fit, keyboard edit, review, Apply and
  history passed; corner targets clear the floating toolbar.
- Existing focused browser regressions: housing follow-up 34, blocks/lots 43,
  street review 33, dynamic inspector 59.
- Screenshots inspected at 1440×900, 1024×768, 375×812 and actual 200% zoom.
  Logs, exact served assets and screenshots: `evidence/open-spaces/`.

Useful commands:

```sh
npm test
npm run build --prefix web
npm run lint --prefix web
PLAYWRIGHT_MODULE=/home/spotty/projects/studioos/node_modules/playwright node tests/open-spaces-browser.cjs
PLAYWRIGHT_MODULE=/home/spotty/projects/studioos/node_modules/playwright node tests/open-spaces-integration.cjs
PLAYWRIGHT_MODULE=/home/spotty/projects/studioos/node_modules/playwright xvfb-run -a node tests/open-spaces-zoom.cjs
```

The integration script consumes the record generated by the browser script, so
run those sequentially. Use separate evidence output directories for regressions;
do not overwrite the preserved prompts. Existing server tests use their own test
port. Do not print credentials/environment values while checking configuration.

## Remaining roadmap and gates

Await the owner's next instruction. Historical Planning brief and rules, land
budget and walkability remain unimplemented. Saved alternatives is now implemented
under the owner’s Feature 10 request. The real assistant (Feature 11) and initial
terrain/drainage/phasing studies (Feature 12) are implemented above. Actual site
data and model endpoint/key delivery/verification remain open. These approvals
do not authorize other roadmap topics.

Open validation: independent planner sign-off, physical-device gestures, actual
survey alignment, externally confirmed access, legal/engineering/cost suitability
and a real-model round trip. Feature 12 adds only its declared terrain/runoff/
phase screening; it does not establish drainage design, statutory compliance,
paths, ecological connections, holes or curves for the green outlines. Original media, active drafts/history, comparison selections and search results
remain session-only; explicitly saved scheme inputs and notes are now durable
under the browser-local project save contract.

## Current angled/rounded street extension — 31 October 2026

The owner requested corner fillets and roads at angles other than 90°. Implemented
under `docs/PRD_v0.18.md`. Open Circulation → Edit street network; Any angle draws
direct segments, Right angles retains orthogonal drawing. Corner fillet radius
accepts 0–50 m, with a 4 m preset; short kerbs report limited effective radii.
Unioned measured pavement, bounded miter/bevel joins and circular fillets with
5 mm maximum chord deviation drive rendering, costs, drainage, containment,
conflicts and frontage. Existing legacy networks remain unchanged until edited.
Whole rectangular lot generation remains on horizontal/vertical legs; angled
frontage land stays explicitly unallocated. No swept-path or engineering approval
is implied.

Advanced roads use project/record/snapshot 14/15/12 with downgrade guards,
including alternative-only upgrades. Root `polygon-clipping` dependency is pinned;
run root `npm ci` as well as `npm ci --prefix web` before starting/building.
Normal production preview remains on 5173, refreshed deterministic tools on 5174;
served asset is `/assets/index-B8kEmCUI.js`. Live AI remains unconfigured.

Full root checks: 736 pass. Existing browser matrix: 35 established runs plus the
new-road initial run, 36/36 pass. Final advanced-road workflow: 27 checks; added
native 200% zoom: 5 checks; build/lint pass. Advanced canvas/editor accessibility
scan has no detected violations. All 999 preserved prompt/tester-evidence files
remain unchanged. Evidence, reproduction and limits are in
`evidence/angled-rounded-streets/README.md`. The owner has now requested committing and pushing this verified checkpoint,
including all prior corrections and preserved tester evidence. Consult git log
and the remote branch for the checkpoint identity; earlier uncommitted labels
in implementation evidence describe their original verification turn.
