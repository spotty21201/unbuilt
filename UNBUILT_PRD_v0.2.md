# UNBUILT
## Product requirements document · v0.2

**Working tagline:** Find the future that works.  
**Product promise:** Bring a site. Explore possible residential futures. Understand what each would require.  
**Owner:** Spotty (Doddy Samiaji)  
**Prepared by:** Monty  
**Revision date:** 25 October 2026 · America/Chicago  
**Delivery environment:** Muse CLI in the user's Herder environment, with Orchestrator, Designer, Coder and Tester roles.  
**Status:** Build brief following storyboard review; implementation and professional validation remain outstanding. This document does not assert event acceptance, model access or completed functionality.

This is a separate successor to Development_Decision_Workspace_PRD_v0.1.md. Preserve v0.1 unchanged. For new implementation, v0.2 governs where the documents conflict. The user accepted the storyboard as sufficient to begin the PRD and a working prototype; this is not evidence of market demand or approval of every technical detail below.

## 1. Product judgment and revision rationale

UNBUILT is an early residential redevelopment exploration tool for a professional working with a landowner or small developer. It starts with a recognizable site, turns a small number of intentions into explicit commitments, and investigates physical and commercial alternatives.

The central question is: **What can design resolve, and what still requires a changed expectation or better evidence?**

The earlier PRD emphasized a development negotiation workspace, evidence ingestion, financial worksheets and scenario history. Those mechanisms remain useful underneath the product, but the new experience is spatial and task-led. The distinctive interaction is selecting something on a plan, stating what matters, and seeing a tested response with its consequences.

### Revision map

| v0.1 emphasis | v0.2 decision |
| --- | --- |
| Prepared financial/design workspace | Site-first entry and five-stage journey |
| Broker-note extraction as defining model use | Spatially grounded intent interpretation and tool-based investigation |
| Large worksheet and alternatives graph | Dominant plan, compact commitments, alternative cards, inspectable calculation drawer |
| Many draft/preview/branch workflows | Current proposition, temporary preview and up to three saved comparisons |
| One fixed subdivision pattern | Small bounded layout system with meaningfully different circulation/green-space configurations |
| Highest residual land allowance | Explicit trade-offs; no hidden weighted score |
| Hand-entered illustrative savings | Measured quantities and declared cost assumptions must earn all savings |
| Builder-neutral sequence | Herder agent ownership, shared contracts, integration gates and independent testing |

UNBUILT is a working name. Trademark and domain availability have not been checked. Do not spend the first build milestone on branding extensions, a marketing website or generated imagery.

## 2. Problem, audience and outcome

**Primary user:** architect, planner or development strategist conducting an early residential proposition discussion. The interface should be understandable to an owner, but the first product is not an autonomous valuation service for an unassisted public user.

**Trigger:** a site has potential, but the owner's expectation, the assumed buyer price, physical capacity and target return do not align.

**Current-workflow hypothesis:** people move among plans, spreadsheets and conversation; changes become disconnected, or teams keep redesigning a proposition whose obstacle is commercial. This remains a hypothesis to validate with observed use.

**Useful outcome:** a user understands the differences between tested propositions, their commercial consequences, which commitments hold, and the next action. That next action may be investigate, negotiate, obtain evidence or stop under the tested conditions.

**Not promised:** survey accuracy, market demand, legal compliance, market valuation, affordability underwriting, project funding sufficiency or bankable feasibility. A buyer-price ceiling is a user assumption, not proof of household affordability. A green-space area is a spatial commitment, not a comprehensive measure of livability.

**Commercial hypothesis:** professionals may pay for or deliver preliminary studies supported by this workflow. No demand, willingness-to-pay or productivity claim is established yet.

## 3. The demonstration and first proof

Use fictional **Cedar Market**, a 120 × 100 m flat site formerly occupied by retail. It has an explicitly supplied boundary, scale, street-side entrance and selected green area. All default market and cost data are fictional and visibly labeled.

The opening minute should communicate:

1. Recognizable source/site.
2. Confirmed boundary and scale.
3. A few explicit priorities.
4. Distinct residential alternatives.
5. One spatial intervention with visible consequences.

Signature request: **“Keep this green space. Do not increase the home selling price. What else can change?”**

The system must associate “this” with a selected object, resolve what is locked, investigate allowed changes, and show actual differences in plan quantities and economics. It must not turn the request into a decorative chat response.

The first release milestone is one working end-to-end interaction on the prepared site, including a genuine model call, deterministic tools and independent verification. Uploads, optional voice and secondary workflow features follow that milestone.

### Storyboard-to-product boundary

The reviewed storyboard contains prepared 36/40/44-home alternatives, indicative green-space areas, and a revised 40-home proposition. Its Rp0.62 billion reduction in non-land costs is an illustrative assumption, not a measured saving. Its diagrams are schematic and are not dimensional source geometry. Its upload/map buttons are placeholders. It has no live model or search engine.

Do not copy those values into production as generator outputs. Build physically coherent fixtures, derive quantities, and allow the resulting numbers to differ. The five-stage journey and interaction priorities are the reference; hardcoded outcomes are not requirements. Browser verification of the storyboard was not completed in this authoring environment because the available automation package lacked a browser binary; JavaScript syntax was checked. This must not be reported as a passed end-to-end test.

## 4. Scope and delivery priorities

### P0 — working proof on the sample

- Dimensioned rectangular site, deterministic geometry and editable numeric parameters.
- Selectable green-space object and explicit locks.
- Two supported circulation families, such as a spine and loop, producing valid alternatives rather than cosmetic variants.
- Inspectable quantity-to-cost-to-land-allowance calculations.
- Typed intention interpreted through Meta Model API into constrained proposals/tool calls.
- Search with current commitments held fixed; compare up to three materially distinct results.
- Before/after plan, quantity and financial deltas.
- Honest no-result and unsupported-assumption states.
- Tester verification plus an unrehearsed user change.

### P1 — complete hackathon MVP

- Local PNG/JPEG top-down image upload, boundary alignment and scale confirmation.
- Five-stage journey, original/proposed/compare views and keyboard/numeric equivalents.
- Two explicit product profiles; one profile per candidate, second-profile comparison only when enabled.
- Assumption drawer, optional pasted note with reviewable changes and source reference.
- Current proposition, temporary preview, up to three saved comparisons, local persistence and JSON export/import.
- Concise printable decision record and truthful demonstration evidence.

### P2 — at most one optional enhancement

Voice input, assisted image feature selection, or illustrative rendered views. Select only after the complete P0/P1 flow works, and only for a demonstrated benefit.

### Deferred

Google Maps integration, arbitrary geographic imports, PDF/DWG/SKP ingestion, automatic cadastral interpretation, arbitrary parcel subdivision, irregular-site solving, terrain/earthworks, 3D editing, mixed product allocation, online market research, regulatory compliance, phasing, absorption, cash flow, debt/IRR/JV models, accounts, billing, multi-user collaboration and generalized document intelligence.

A general “use any data” upload promise is outside scope. Unsupported files should receive a helpful explanation, not a fake analysis.

## 5. Input and calibration contract

### Prepared case

Open immediately with supplied geometry and clearly fictional assumptions. Never infer real geography or market validity from the sample name. Editing the sample creates a working version without destroying its original.

### User-supplied image

Support PNG and JPEG initially, with documented implementation limits (recommended 10 MB and 20 megapixels). Validate actual image content, not only extension. Show the image locally; do not send it to the model automatically.

The user positions, rotates and sizes a rectangular site overlay. The MVP works only where a top-down plan/image can be represented with uniform scale. Skewed perspective photography must be treated as reference-only or replaced with a suitable source; do not silently rectify an ordinary street photograph into a measured site.

Calibration supports one of:

- Confirmed width and depth mapped onto the rectangular overlay.
- A known-length line plus a uniform pixel-to-meter scale for a top-down image; confirm resulting width/depth.

Known area alone does not uniquely establish dimensions unless the user explicitly accepts the drawn rectangle's aspect ratio. If used, disclose that assumption and compute both dimensions from area and ratio; never claim a survey measurement.

Show the resulting area and dimensions before accepting. Boundary ownership, legal access and external road rights remain unverified. An address is not a property polygon.

### Feature selection

Initial supported retained feature: a user-defined axis-aligned rectangular green-space region inside the normalized site. It can be selected, moved and numerically edited before locking. Convert all source display coordinates to canonical meter coordinates. Unsupported retained-building requests must be identified as unsupported; they cannot silently become demolition.

Optional model-assisted feature suggestions are previews only. The user confirms their identity, dimensions and meaning. SAM masks cannot establish ownership, scale or engineering constraints.

## 6. User experience specification

### Stage 1 — Bring the site

Primary action: Try Cedar Market. Secondary action: Upload a plan/image when P1 is implemented. Map search is absent from the released MVP rather than presented as a working control. Provide accepted formats and a compact statement of what is required to establish scale.

### Stage 2 — Confirm understanding

Source image fills the canvas, with an editable boundary overlay. Dimensions, area, entrance and green-space object are inspectable. Separate supplied, user-confirmed and unconfirmed information. Confirming requires valid scale and positive dimensions; preserve the source image unchanged.

If the site exceeds supported geometry, explain the limit and offer the sample. Do not force-fit an arbitrary boundary without the user understanding the modeled rectangle.

### Stage 3 — Set intentions

Show only consequential inputs first: assumed selling-price ceiling, selected price scenario, owner expectation, target surplus/sales and selected spatial commitments. A ceiling is not automatically an achievable selling price: use a separate selected selling-price assumption at or below it. The sample may use the same number for both, explicitly labeled.

An expandable assumptions panel supplies product dimensions, price ranges, construction rates and site allowances. Required unknowns block commercial qualification; the plan can remain explorable with economics marked incomplete. Never import sample prices invisibly into a user-uploaded case.

### Stage 4 — Explore futures

A large plan is central. Existing / Proposed / Compare are view controls. Show a compact commitments panel, up to three alternative cards, and a small instruction bar. Keep long calculations in a drawer; do not make chat or a spreadsheet dominate.

Cards should express meaningful differences such as more shared green, lower infrastructure area or a different supported product. Titles are generated from measured differences, not assigned regardless of result. Every card shows homes, green area, land allowance/gap and critical blockers. Do not fabricate a third result if only two distinct candidates exist.

Selecting a card previews that exact candidate without committing it. Highlight added/removed homes, changed circulation and retained regions. Color is supplemented by labels, patterns or line styles. Existing view preserves the source; proposed view presents exact modeled geometry; comparison aligns the same coordinates.

### Stage 5 — Challenge and decide

Click a green-space object or select it from an accessible object list. Display selected-object name and extent. Typed request is interpreted into an explicit operation proposal: which variables will change, which locks remain and what the investigation will test.

The user confirms the proposal once. Bounded deterministic investigation can then run without repeated approval dialogs. Selecting a result is a preview; Apply makes it current and preserves the previous version.

The result must state the physical trade-off, cost drivers, changed land allowance and unresolved commitments. Offer relevant next actions: investigate this proposition, discuss an expectation, seek evidence, or stop under the tested conditions. Saving a decision does not send it to anyone.

### General interaction behavior

- Numeric and pointer edits must yield identical geometry and metrics.
- A complete drag is one undo action; no silent adjustment of another field.
- Maintain a stable canvas on alternative changes and provide zoom-to-site.
- Show model/search status; permit cancellation and discard stale responses.
- No voice, upload, map or export control should imply working functionality when unavailable.
- Desktop-first at 1024 px; stack views and provide numeric alternatives at 375 px. No forced horizontal scrolling of the overall page.
- Maintain visible focus, readable contrast and non-color status cues.
- Product language should explain choices; developer logs and schema names stay out of the main experience.

## 7. Geometry and quantities

Canonical geometry uses meters in a local Cartesian coordinate system. Raster placement is a separate image-to-site transform. Resizing the browser or zooming never changes physical quantities.

The initial solver supports a flat rectangular site, rectangular reserved green region, explicit entrance, and a small set of parameterized circulation families. Each generator must yield a genuine connected road network, parcel polygons and house footprints, not drawing symbols disconnected from calculations.

Parameters include road width, road positions, lot frontage/depth bounds, house area/footprint dimensions, simplified setbacks and green-space reservation. Fictional defaults must not be labeled regulations.

Validate:

1. Positive geometry and containment inside the site.
2. No overlapping parcels, roads or reserved green space.
3. Footprints fit their parcels and stated simplified setbacks.
4. Every residential parcel has modeled access to a connected road reaching the declared entrance.
5. Site area reconciles to parcel, road, shared green and explicitly unallocated area.
6. Road intersections are unioned so construction area is not counted twice.
7. Locked regions retain both area and location unless the user's lock is explicitly area-only.

Private lot gardens are part of parcel area and cannot also be counted as shared green. A preserved grove is a geometric region, not just a total-area target. Do not move it elsewhere while reporting preservation.

Engineering junctions, turning radii, grades, emergency access and legal frontage remain unverified. Label this as conceptual geometry rather than code compliance.

**Savings contract:** a road cost change must equal measured road-area change × the applicable rate, plus separately declared scope changes if any. If geometry cannot produce the storyboard's illustrated saving, report the actual result. Never tune a hidden lump sum to make a candidate win.

## 8. Market, commitments and candidate selection

A product profile defines allowed home area, lot-area range, frontage requirements, low/base/high gross prices per home, source description and applicability. One profile applies to all homes in a candidate for MVP. Mixed products are deferred.

Every lot must meet profile applicability, not just the average. Smaller lots do not inherit the old price automatically. Evidence applicability and evidence credibility are separate: a correctly scoped broker statement remains a reported assumption, not a verified sale.

A commitment has a type, target, operator, unit, scope, lock status and provenance. Supported types include exact preservation of a selected region, minimum shared-green area, maximum assumed selling price, fixed owner expectation and target surplus/sales. User preferences must not be confused with legal constraints.

Search receives a versioned snapshot, parameter ranges, locked fields, enabled profiles, a seed and candidate budget. Recommended starting budget: at most 250 candidates. Use bounded sampling/enumeration; do not claim global optimality.

Select up to three distinct candidates using transparent objectives: highest green area, lowest road area, highest residual allowance, or a user-selected ordering. Remove geometric duplicates and dominated options where appropriate; explain ties. Do not assign a hidden blended score to unlike sacrifices.

Candidate status has four independent dimensions: geometry validity, input completeness, price/profile applicability and commercial-target status. A candidate may be physically valid and miss the economic target; it remains useful for comparison. Invalid candidates cannot become recommended propositions.

If none qualify, show the tested scope and principal blockers. Diagnosis should use controlled counterfactual tests: change one permitted condition in a separate preview, keep other locks fixed, and report the resulting differences. If relaxing multiple conditions is necessary, state that explicitly. The model may not invent a causal explanation unsupported by these tests.

## 9. Financial contract

This remains static, indicative, pre-tax and before-finance screening. Exclude timing, absorption, financing, taxes and capital sufficiency visibly. Deferred payments or a JV are not economic solutions in this static model.

Let N be the count of valid modeled homes, P the selected assumed gross selling price/home, R=N×P, C modeled non-land costs excluding selling costs, s selling costs as a fraction of revenue, L owner land expectation, and t target surplus/revenue.

- Surplus S = R×(1−s)−C−L.
- Surplus margin = S/R when R>0.
- Residual land allowance L* = R×(1−s−t)−C.
- Owner gap G = L−L*. Positive means a shortfall; negative means headroom.
- Required price P* = (C+L)/[N×(1−s−t)] when N>0 and 1−s−t>0.

P* is a requirement under fixed geometry/costs, never a market prediction. Negative allowance remains negative. Zero revenue yields unavailable ratios, not infinity or 0%. Changing L alone changes gap and actual surplus, not L*. Changing t changes L*, not actual revenue or cost.

### Cost basis

| Line | Quantity / basis |
| --- | --- |
| Home construction | Count × modeled built area/home × rate |
| Roads | Unioned road area × road rate |
| Green works | Shared-green area × rate where included |
| Demolition/setup | Explicit scope and allowance; not automatically zero |
| Utilities/drainage/other works | Separate entered allowances or declared quantity bases |
| Contingency | Declared percentage of named physical-cost lines |
| Professional/approval allowances | Separate entered items |
| Selling costs | s × gross revenue |
| Land | Owner's economic expectation, regardless of book value |

An unknown is not zero. A deliberate zero needs an inclusion basis. Shared costs are counted once. Use base currency amounts internally and explicit display units (Rp million/home, Rp million/m², Rp billion totals). Display rounding must not affect qualification/ranking.

### Independent arithmetic fixture retained from v0.1

N=40, home area=60 m², construction Rp5m/m², roads=3,000 m² at Rp0.8m/m², setup=Rp0.8bn, other physical works=Rp1.2bn. Physical subtotal=Rp16.4bn; 5% contingency=Rp0.82bn; professional/approval=Rp1.3bn; C=Rp18.52bn. s=3%, t=15%, L=Rp10bn.

| Metric | P=Rp850m | P=Rp780m |
| --- | ---: | ---: |
| Revenue, Rp bn | 34.000 | 31.200 |
| Surplus, Rp bn | 4.460 | 1.744 |
| Margin | 13.118% | 5.590% |
| Land allowance, Rp bn | 9.360 | 7.064 |
| Owner gap, Rp bn | 0.640 | 2.936 |

Required price is approximately Rp869.512m/home. This checks arithmetic only; it is not evidence that the site generator yields 40 valid homes or 3,000 m² of roads.

## 10. Meta model responsibilities and architecture

### Technology choices

| Component | Default | Reason / limit |
| --- | --- | --- |
| UI | React + TypeScript | Shared types and rapid interaction development |
| 2D display | SVG | Inspectable, selectable exact geometry; switch only after measurement |
| Application state | Explicit typed reducer/store | No second financial state hidden in UI components |
| Validation | Runtime schemas, e.g. Zod | Reject malformed model/project inputs |
| Domain engine | Pure TypeScript modules | Independent deterministic tests |
| Bounded search | TypeScript; worker if needed | Keep interaction responsive |
| API boundary | Small server-side TypeScript service | Secrets and tool authorization remain server-side |
| Runtime model | Muse Spark via Meta Model API | Intent interpretation and constrained investigation |
| Storage | IndexedDB for project/image; JSON project export | No accounts/database server required for MVP |
| Tests | Unit/integration runner plus real-browser automation | Verify calculations and complete journey |
| Build tooling | Muse CLI in inspected Herder environment | User-selected agent development workflow |

Do not scaffold a second framework if an appropriate existing repository already supplies these capabilities. Choose exact package versions from the inspected environment and current official documentation. Record them in the lockfile.

### Rust decision

Do not use Rust initially. Consider a Rust/WASM geometry/search module only if profiling shows a core computation repeatedly misses the agreed budget after reasonable TypeScript improvements, or an essential robust geometry capability is only practical through a suitable library. Record benchmark, alternatives, integration complexity, browser packaging and maintenance impact in an architecture decision. Preserve the TypeScript API and golden fixtures. Rust is not a judging feature or a prerequisite.

### Model inventory

Meta's official documentation describes Muse Spark tool calling, Muse Voice Transcribe speech input, SAM 3.1 segmentation, Muse Image generation/editing, and Muse Code development tooling [S1]. This does not prove this account's access or reliability.

- **Required:** Muse Spark for typed intent → schema-valid proposal → actual domain tools → grounded result explanation.
- **Optional:** Voice Transcribe after typed flow; transcription confirmation uses the same proposal path.
- **Optional:** Spark image understanding or SAM for suggested feature selection; geometry requires confirmation.
- **Optional:** Muse Image for labeled illustrative views; never for measured geometry, quantities or validation.
- **Development only:** Muse Code; Muse Wonder may assist coding if available, without becoming a runtime dependency by default.

Verify available identifiers, credentials, quotas and one real tool round trip in the first milestone. Do not assume an installed CLI grants runtime API access. No credentials in browser assets, exports, recordings or logs.

### Agent tool contract inside the application

The application's model is separate from the four development agents. Expose narrow functions, not shell, arbitrary file access or unrestricted external requests:

| Tool | Purpose |
| --- | --- |
| inspect_project(version) | Return permitted geometry, assumptions, locks and current result |
| propose_commitments(version, operations) | Validate a proposed change; no mutation before user acceptance |
| generate_alternatives(snapshot, ranges, budget) | Run deterministic bounded search with server-enforced locks |
| evaluate_candidate(candidate_id, version) | Retrieve validated quantities and economics |
| test_counterfactual(version, explicit_relaxation) | Separate hypothetical result; never overwrite locked case |
| compare_candidates(ids, version) | Return exact physical and economic deltas |
| prepare_decision(candidate_id, next_action) | Produce a reviewable record; no sending or publishing |

The model receives selected object ID, confirmed geometry metadata, user request, version, supported operations and relevant assumptions. It must not infer selection from pixels when an object ID is already available.

Proposed changes include scope, old/new values, units, rationale, ambiguities and affected locks. Unsupported requests generate clarification or a clear limitation. Two requests with contradictory locks remain unresolved until the user chooses.

The server validates all tool arguments and enforces locks independently of model text. Explanations bind to immutable result IDs; numeric claims are checked against results or replaced by deterministic summaries. Source notes are untrusted content. Limits: bounded tool rounds, execution budget, cancellation, and no invisible retries that distort evaluation evidence.

## 11. Shared data and state contract

Define schema before parallel feature implementation. Minimum entities:

- **Project:** ID, schemaVersion, title, fictional flag, currency, source image reference/hash, site version.
- **Site:** normalized boundary, dimensions, entrance, calibration method/transform, confirmation state.
- **Feature:** ID, type, geometry, source, confirmation, retention policy.
- **ProductProfile:** dimensional applicability, price scenarios, source and credibility description.
- **Assumption:** value or unknown, unit, inclusion basis, source, timestamp, author/acceptance.
- **Commitment:** scope/object ID, operator, value/unit, locked status, provenance.
- **ScenarioSnapshot:** immutable site, product, commitments, costs and accepted-change IDs.
- **Candidate:** geometry, derived quantities, validation results, calculation result, snapshot ID, generator parameters.
- **SearchRun:** snapshot hash, version, seed, ranges, locks, tested/valid/qualified counts and timings.
- **Proposal:** source request, context version, operations, ambiguities and acceptance status.
- **DecisionRecord:** chosen candidate, comparison, unresolved conditions, next action and exclusions.

States: original case → working version → temporary preview → applied working version. Saved comparisons are immutable snapshots. Editing the project invalidates search/proposal applicability; late model responses stay attached to their original version. No hidden replacement of current state.

Autosave to IndexedDB with visible saved/unsaved status. Export JSON includes project schema, assumptions, geometry, results and provenance. The optional background raster may be excluded with an explicit warning; importing without it still restores usable geometry and decisions. Credentials are never serialized. Unsupported schema versions fail safely without overwriting the active project.

## 12. Acceptance criteria

All criteria below are requirements, not passed results. P0 criteria must pass before optional work. P1 completes MVP.

| ID | Priority | Verifiable behavior |
| --- | --- | --- |
| AC-01 | P0 | Sample opens with fictional label, site dimensions, source and populated assumptions. |
| AC-02 | P1 | Valid PNG/JPEG loads locally; invalid/oversized input gives a recoverable error. |
| AC-03 | P1 | Calibration maps known pixel distance to meters; zoom/viewport changes leave quantities unchanged. |
| AC-04 | P1 | Unconfirmed or unsupported scale blocks measured economic conclusions. |
| AC-05 | P0 | All accepted geometry passes containment, overlap, access and area reconciliation checks. |
| AC-06 | P0 | Displayed home count exactly equals modeled valid footprints. |
| AC-07 | P0 | Every cost-driving quantity is derived from its displayed geometry or explicit allowance basis. |
| AC-08 | P0 | Road savings reconcile to changed unioned road area and declared rate; intersections are counted once. |
| AC-09 | P0 | Selected-region preservation retains location and shape within tolerance, not just total area. |
| AC-10 | P0 | Numeric and pointer edits to the same parameter produce identical results. |
| AC-11 | P0 | At least two distinct circulation/green-space configurations can be generated; duplicate outputs are not marketed as separate futures. |
| AC-12 | P0 | All candidates enforce locks and selected price ceiling; unsupported profile applicability is flagged per lot. |
| AC-13 | P0 | Golden arithmetic fixture, negative residual, zero-home and invalid denominator cases pass. |
| AC-14 | P0 | Changing owner expectation leaves residual allowance unchanged, all else equal. |
| AC-15 | P0 | Changing target leaves actual revenue/cost unchanged. |
| AC-16 | P0 | A real Meta request produces a reviewable structured proposal and invokes actual calculation/search tools. |
| AC-17 | P0 | Rejection leaves state unchanged; repeated acceptance cannot apply changes twice. |
| AC-18 | P0 | “Keep this” with no selected object requests clarification; no arbitrary object is selected. |
| AC-19 | P0 | A user request cannot silently change locked price, owner expectation, target or retained geometry. |
| AC-20 | P0 | Stale or out-of-order responses cannot mutate the latest scenario. |
| AC-21 | P0 | Explanation numbers match immutable calculation results; unsupported causal claims are removed. |
| AC-22 | P0 | No-result state reports tested ranges/conditions and does not claim all conceivable designs are impossible. |
| AC-23 | P0 | Preview selection changes the exact plan and its metrics together; returning restores the working version. |
| AC-24 | P1 | Apply and undo preserve expected versions; saved comparisons do not mutate with later edits. |
| AC-25 | P1 | Refresh and JSON round trip retain geometry, assumptions, commitments and decision references. |
| AC-26 | P1 | Save failure is visible and offers export; reset affects only selected project. |
| AC-27 | P1 | Printed decision retains fictional status, assumptions, source version and exclusions. |
| AC-28 | P0 | Unknown costs never become zero; explicit zero has a basis. |
| AC-29 | P0 | Source text attempting instructions cannot invoke unauthorized tools or expose secrets. |
| AC-30 | P0 | An unrehearsed supported change works end-to-end without hardcoded response routing. |
| AC-31 | P1 | Main journey is keyboard-usable; narrow layout has no overall horizontal overflow. |
| AC-32 | P0 | API error leaves manual geometry/economics usable and clearly marks model unavailability. |

Recommended numeric tolerances: area reconciliation ≤0.01 m² on supported fixtures; arithmetic differences ≤Rp1 for independent golden fixtures. Choose and document a coordinate tolerance, recommended 1 mm, for equality/retention tests. Do not confuse display rounding with computational tolerances.

Performance targets on the recorded demo machine: ordinary deterministic edit ≤200 ms; up to 250 candidates ≤2 seconds where practical. Measure, record and optimize before adding a second language. Model latency is separately measured, with status and cancellation; no invented guarantee.

## 13. Evaluation and failure handling

Tester owns independent fixtures and browser evidence; Coder owns implementation tests. Avoid tests that simply repeat the same implementation formula without independently known expected results.

Minimum model evaluation set: selected grove preservation, same request with no selection, price ceiling below selected price, conflicting owner/return constraints, out-of-profile lots, ambiguous monetary units, unsupported retained-building request, malicious source note, stale response, and no qualifying alternative. Record expected operations, actual tool calls, numeric consistency, retries and model version. Every case must preserve no-silent-mutation and no-invented-value requirements.

Use real-browser tests for upload/calibration, selection, proposal review, candidate preview, apply/undo, no-result state, refresh and export/import. Record missing browser infrastructure as blocked, never passed. Agent inspection is not user validation.

At the first product review, ask Spotty to change one unplanned supported input and explain the result. If possible, observe an additional professional without builder narration. Record confusion, corrections and completion, not just compliments. Do not invent productivity metrics.

| Failure | Response |
| --- | --- |
| No API access | Continue deterministic work; disclose blocker and do not claim completed model gate |
| Bad image/scale | Preserve upload; explain supported input and allow correction |
| Missing financial input | Keep physical exploration available, mark economics incomplete |
| Invalid geometry | Show blocker; exclude from recommended results |
| No distinct third option | Show fewer options and explain tested scope |
| Search/model timeout | Cancel/retry without losing accepted state |
| Changed assumption | Mark prior results stale; rerun against new snapshot |
| Inconsistent generated explanation | Replace with checked deterministic summary |
| Unsupported request | State limit; offer supported operation without silently substituting |

## 14. Herder development workflow

The four roles are development collaborators, not four autonomous investment advisors in the product. Use the user's actual installed Herder orchestration mechanisms. No command syntax, agent API, credentials, repository or concurrent-execution capability is assumed.

### Responsibilities and ownership

| Role | Owns | Required handoff |
| --- | --- | --- |
| Orchestrator | Product contract, task graph, integration, scope and decision log | Current milestone, dependency map, file ownership, resolved decisions and release status |
| Designer | Interaction specification, visual system, component behavior, accessibility review | Screen/state specs, control behavior, error states and review of implemented UX |
| Coder | Domain engine, API integration, UI implementation and developer tests | Runnable increment, touched files, commands, results, limitations and migration notes |
| Tester | Independent fixtures, acceptance matrix, model evaluation, browser testing | Reproduction steps, expected/actual, severity, evidence and retest result |

Suggested ownership: Orchestrator owns docs/decisions and integration configuration; Designer owns docs/ux and approved style/component specifications; Coder owns source; Tester owns independent tests and evidence. If Designer edits UI source, assign explicit files before work. Shared schemas require Orchestrator coordination and cross-role review.

### Coordination rules

1. Read repository instructions and inspect the environment before scaffolding.
2. Publish contracts for units, geometry, state and tool arguments before dependent parallel work.
3. Use separate branches/worktrees if supported; otherwise assign non-overlapping file ownership. Never reset or overwrite another agent's changes.
4. Handoff includes task ID, base revision, files, assumptions, verification commands/results and open issues.
5. Tester validates integrated behavior independently. The author must not mark their own assertion as independent review.
6. Orchestrator maintains a concise acceptance matrix with Passed / Failed / Blocked / Not run plus evidence.
7. Integrate frequently, in small complete slices. Do not wait for four separate subsystems at the end.
8. Continue routine reversible implementation autonomously. Ask only for essential missing information, real credentials, material scope trade-offs or explicitly reserved external actions.
9. Checkpoint reviews are demonstration opportunities, not automatic permission stops for every task. Continue independent work while awaiting feedback; do not treat silence as approval of a material scope change.
10. Publishing, event submission and contacting others are outside this build brief unless separately authorized.

## 15. Milestones and gates

Use relative milestones because actual start time and team capacity must be inspected. The official overview currently lists an Oct 26 start and Nov 4, 9 PM ET submission deadline (8 PM Chicago); final rules and reuse permissions must be checked before competition work [S2]. Do not assume the historical preparation counts as new competition work.

| Milestone | Deliverable | Exit evidence |
| --- | --- | --- |
| M0: environment and contracts | Inspected repo/Herder, rules/access notes, schemas, task map, model/tool smoke call | Exact commands/capabilities recorded; no invented access |
| M1: deterministic core | Valid sample geometry, alternate configurations, quantities and economics | Independent geometry and arithmetic fixtures pass |
| M2: signature interaction | Select grove → typed request → reviewed locks → real search → exact plan/economic deltas | Genuine API tool path plus independent browser proof and unrehearsed change |
| M3: complete journey | Calibrated image input, alternatives, comparisons and decision state | Five-stage flow passes; no hardcoded storyboard outcomes |
| M4: reliability | Persistence/export, failures, accessibility and evaluation | P0/P1 acceptance matrix, user feedback, defects resolved or disclosed |
| M5: packaging | Demo, capability inventory and submission material drafts | Claims tied to actual evidence; owner reviews submission separately |

Reserve approximately the final fifth of available time for integration, user review and demo reliability. M2 is the principal product gate. If it feels like a spreadsheet with a chat interface, revise the interaction before expanding the feature set.

Cut order: optional rendered images, SAM, voice, advanced note comparison, extra search controls, second-product comparison UI, elaborate export formatting. Preserve the site/intent/geometry/economics chain, exact lock enforcement, truthful status and clear visual comparison. If P1 must be reduced, document a revised MVP openly; do not silently mark excluded criteria passed.

## 16. Submission narrative and honest claims

| Section | Narrative direction / evidence requirement |
| --- | --- |
| Inspiration | The distance between imagining a better use for a site and reconciling competing expectations |
| What it does | Turns a supplied site and explicit intentions into tested residential propositions with visible trade-offs |
| How we built it | Shared geometry/data contract, constrained model tools, deterministic calculations and agent-team delivery |
| Challenges | Spatial reference resolution, lock preservation, meaningful alternatives and truthful commercial consequences |
| Accomplishments | Only demonstrated capabilities: real tool calls, valid layouts, measured deltas, unrehearsed input |
| What we learned | Observed user behavior and technical failures; no prewritten claims of validation |
| What's next | Real professional trial, then consequential missing capabilities such as irregular sites or timing |
| Built with | Actual versions and used technologies, not every model available to the event |

Target a concise demonstration, not a walkthrough of every panel. Show the source, intentions, conflict, investigation, changed plan and next action. Recorded outputs must be labeled recorded. No synthetic example proves real-world market feasibility.

## 17. Immediate implementation instructions

Use the companion **UNBUILT_Muse_Herder_First_Prompt_v0.2.md** as the starting instruction. Supply this PRD; supply the storyboard if available as a visual reference. Its absence must not block M0–M2 because this PRD describes the journey.

Start with environment inspection, contracts, deterministic core and a real model tool round trip. Do not restart ideation, create another decorative storyboard, introduce Rust without evidence, or build optional model features before M2 works.

## 18. Sources and remaining uncertainties

[S1] Meta developer overview, checked 25 October 2026: https://dev.meta.ai/docs/overview . Supports the described model/tool categories, not this team's access or application reliability. Runtime identifiers and API behavior must be verified at implementation.

[S2] Official event overview, checked 25 October 2026: https://dev.meta.ai/events/global-hackathon . Supports current overview dates and indie-track framing. Final rules, allowed reuse, submission format, team requirements, eligibility and permitted development workflows require direct verification.

[I1] Development_Decision_Workspace_PRD_v0.1.md supplied in this conversation.  
[I2] UNBUILT five-stage interactive storyboard and subsequent user acceptance to begin PRD/build work.  
[I3] User-selected Muse CLI / Herder / Orchestrator–Designer–Coder–Tester workflow.

Unverified: Herder commands/version/capabilities; repository and credentials; model/API access; detailed event requirements; real market evidence; commercial demand; actual solver performance. These are implementation or validation tasks, not reasons to fabricate completeness.
