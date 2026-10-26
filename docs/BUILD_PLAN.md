# UNBUILT — Build plan (Orchestrator)

PRD: `docs/PRD_v0.2.md` (v0.2 governs). Fictional sample: Cedar Market, 120 x 100 m.

## Contract outline (frozen before parallel work)
- Geometry: meters, local Cartesian, site origin at corner. Display/zoom never changes quantities. Tolerance: 1 mm equality, 0.01 m2 area reconciliation.
- Image-to-site transform: separate overlay (translate/rotate/uniform scale). Photos without confirmed scale are reference-only.
- Currency: integer base units internally (Rp); display in Rp million/billion. Rounding never affects qualification.
- Entities: Project, Site, Feature, ProductProfile, Assumption, Commitment, ScenarioSnapshot (immutable), Candidate, SearchRun, Proposal, DecisionRecord — per PRD section 11.
- Snapshots immutable; proposals version-bound; late/stale model responses never mutate newer state.
- Locks: region-preservation = shape AND location (tolerance); price ceiling distinct from assumed price; L/t changes obey PRD section 9 (L changes gap not allowance; t changes allowance not revenue).
- Candidate status: 4 independent axes (geometry validity, input completeness, price applicability, commercial target). Invalid geometry never recommended.
- Savings: road saving = unioned road-area delta x rate + declared scope changes only. Intersections unioned once.
- Model tools (server-side, narrow): inspect_project, propose_commitments, generate_alternatives, evaluate_candidate, test_counterfactual, compare_candidates, prepare_decision. Server validates + enforces locks.

## File ownership
- Orchestrator: `docs/` decisions/plans/acceptance, `package.json`, `tsconfig.json`, integration config.
- Designer: `docs/UX.md`, plus approved component specs (claims exact files before editing UI).
- Coder: `src/**` implementation.
- Tester: `tests/**` (independent fixtures), `evidence/**` (never edited by Coder).
- Shared schemas (`src/schema.ts`): Orchestrator coordinates, cross-role review required.

## Milestones + status
- M0 environment/contracts: IN PROGRESS — env inspected, PRD read, Herdr verified, event/model docs checked, API creds BLOCKED. Remaining: this plan + schema stub + smoke test record.
- M1 deterministic core: DONE (first slice) — dimensioned 120x100 rectangle, spine/loop circulation, parcels/footprints, green reserve, quantities + economics, 36 golden fixtures green. Remaining: second product profile + parameter ranges + candidate search budget (toward M2).
- M2 signature interaction: gated on M1 + real model tool path + browser proof + unrehearsed change.
- M3 complete journey: image input, calibration, 5 stages, comparisons, decision record.
- M4 reliability: persistence/export, failures, a11y, browser tests, evaluation, user review.
- M5 packaging: demo + submission drafts only; no publish without separate authorization.

## Task board (IDs)
- T01 [Orchestrator, done]: inspect env/repo/rules.
- T02 [Orchestrator, done]: read PRD v0.2 fully.
- T03 [Orchestrator, done]: verify Herdr coordination surface.
- T04 [Orchestrator, done]: check event dates/rules baseline + model IDs; record API blocker.
- T05 [Orchestrator, in-progress]: plan/contracts/ownership/acceptance docs.
- T06 [Coder, next]: schema stub + finance golden fixture (PRD arithmetic case).
- T07 [Coder, next]: rectangle geometry + spine/loop generator + validators.
- T08 [Tester, next]: independent geometry/arithmetic fixtures + first browser smoke (record Blocked if no infra).
- T09 [Orchestrator, done]: git init (no commit w/o user request).
- T10 [Tester, IN PROGRESS, blocked on approvals]: agent `unbuilt-tester` live in w7:p2 with brief; parked at approval prompt. Unblock via full-auto flags or /permissions, then it writes evidence/M1-tester-report.md.
- T11 [Designer, next]: full interaction spec from docs/UX.md stub; claims UI files before editing.
- T12 [Coder, next]: second product profile + search budget + server boundary (M2 path); owns src/**.
