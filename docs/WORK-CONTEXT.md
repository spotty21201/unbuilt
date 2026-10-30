# Unbuilt — current work context

Updated 29 October 2026. Workspace: `/home/spotty/projects/unbuilt`.

## Current decision

The owner explicitly authorized **Feature #9: Feasibility experiments — test
design changes and editable cost assumptions** on 29 October 2026. This is the
requested title and scope; historical roadmap item 9 (Planning brief) remains
unimplemented, while feasibility was historical item 12. Feature 9 is now
implemented for review under `docs/PRD_v0.14.md`. No later feature is authorized.

Feature 8 independent planner testing remains deferred. Preserve its tester
prompt and the housing retest prompt unchanged. Do not launch those independent
reviews as a substitute for waiting for the owner's next instruction.

## Working rules

- Preserve the extensive modified and untracked tree. It contains valuable work
  from Features 1–8 and their reviews. Do not reset, clean, discard, stage, commit
  or push unless explicitly requested. Current work remains uncommitted.
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

1. `evidence/feasibility-experiments/README.md` and `docs/PRD_v0.14.md` — current feature, tests and limits.
2. `evidence/open-spaces/README.md` — complete Feature 8 report, evidence and limits.
3. `docs/PRD_v0.13.md` — current Feature 8 requirements and data contract.
4. `docs/DESIGN.md`, `docs/DECISIONS.md`, `docs/ACCEPTANCE.md`.
5. `docs/PRD_v0.12.md` — housing mix and lot-review requirements.
6. `evidence/housing-review-followup/README.md` — addressed housing concerns.
7. `docs/PRD_v0.8.md` — combined roadmap; its original status table is historical.
   Later PRDs and explicit owner instructions supersede earlier approval labels.
8. Original context as needed: `docs/PRD_v0.4.md`, `docs/REDESIGN-SPEC.md`,
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

- Feature 8: `evidence/open-spaces/TESTER-PROMPT.md`
  SHA-256 `74af0d6db6410119a2df43e8038ae33e212865811ecba030e39777bbe7067b05`.
- Housing retest: `evidence/housing-review-followup/TESTER-PROMPT.md`
  SHA-256 `3c719f0025d90912e84141dd85f030594d355e7456b25fbc8eb24dc453f7e9dc`.

Testing is deferred at the owner's request. Do not launch or rewrite these reviews
as a substitute for waiting for the next task. They request planner-facing
comments as concrete implementation prompts with evidence and explicit uncertainty.

## Current Feature 9 verification

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
- Both earlier tester prompt hashes still match. Feature 8 independent testing
  was not launched. All source, docs, evidence and prompts remain uncommitted.

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
budget and walkability remain unimplemented. Saved alternatives,
terrain/drainage/phasing and real assistant integration also remain unapproved.
The owner explicitly advanced feasibility experiments under Feature #9; that
approval does not authorize these remaining roadmap topics.

Open validation: independent planner sign-off, physical-device gestures, actual
survey alignment, externally confirmed access, legal/engineering/cost suitability
and a real-model round trip. No paths, ecological connections, drainage analysis,
statutory open-space compliance, holes or curves are established by the new green
outlines. Original media, drafts/history, comparisons and search results remain
session-only under the existing explicit save contract.
