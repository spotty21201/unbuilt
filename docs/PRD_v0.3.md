# UNBUILT
## Product requirements document · v0.3

**Working tagline:** Find the future that works.  
**Product promise:** Bring a site. Explore possible residential futures. Understand what each would require.  
**Owner:** Spotty (Doddy Samiaji)  
**Prepared by:** Codex, from v0.2 and subsequent user feedback  
**Revision date:** 26 October 2026 · UTC  
**Delivery environment:** Existing project and user-selected development workflow.  
**Status:** Working product requirements revision. User-requested capabilities are requirements; their MVP placement and supported geometry limits remain to be decided. Requirements and test evidence are not claims of completed implementation, model access, user validation or event acceptance.

This is a separate successor to `docs/PRD_v0.2.md`. Preserve both v0.2 copies and any older PRDs unchanged. For future work v0.3 governs where it explicitly changes v0.2. Existing implementation, UX specifications and team decisions must be reconciled against this revision; a discrepancy does not automatically invalidate previously tested behavior. Nothing in this document authorizes a commit, deployment, publication or external contact.

## 1. Product judgment and revision rationale

UNBUILT is an early residential redevelopment exploration tool for a professional working with a landowner or small developer. It starts with a recognizable site, turns a small number of intentions into explicit commitments, and investigates physical and commercial alternatives.

The central question is: **What can design resolve, and what still requires a changed expectation or better evidence?**

The earlier PRD emphasized a development negotiation workspace, evidence ingestion, financial worksheets and scenario history. Those mechanisms remain useful underneath the product, but the new experience is spatial and task-led. The distinctive interaction is selecting something on a plan, stating what matters, and seeing a tested response with its consequences.

### Revision map

The following v0.2 decisions remain the foundation:

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

### Changes in v0.3

- The primary interaction is an interactive, canvas-led design workbench, with contextual controls and visible physical and commercial consequences.
- “Open space” is the user-facing term for the shared retained region. Its existing sample cost basis remains landscaped green until another surface and its costs are explicitly defined.
- The user requests editable irregular individual lot polygons and configuration, and a movable compound entrance. Irregular outer site boundaries are a related but distinct target. The first supported shapes, sides and milestone priority remain open decisions; unsupported shapes must be disclosed rather than approximated silently.
- Reference-image preservation, actual-content validation, usable comparison and complete current-state exports are explicit contracts informed by browser findings. The existing M3 image is an illustration only, not a calibrated image.
- Proposed requirements, implementation status and verification evidence are distinct. Engine checks and agent browser tests do not establish model integration or human validation.

UNBUILT is a working name. Trademark and domain availability have not been checked. Do not spend the first build milestone on branding extensions, a marketing website or generated imagery.

## 2. Problem, audience and outcome

**Primary user:** architect, planner or development strategist conducting an early residential proposition discussion. The interface should be understandable to an owner, but the first product is not an autonomous valuation service for an unassisted public user.

**Trigger:** a site has potential, but the owner's expectation, the assumed buyer price, physical capacity and target return do not align.

**Current-workflow hypothesis:** people move among plans, spreadsheets and conversation; changes become disconnected, or teams keep redesigning a proposition whose obstacle is commercial. This remains a hypothesis to validate with observed use.

**Useful outcome:** a user understands the differences between tested propositions, their commercial consequences, which commitments hold, and the next action. That next action may be investigate, negotiate, obtain evidence or stop under the tested conditions.

**Not promised:** survey accuracy, market demand, legal compliance, market valuation, affordability underwriting, project funding sufficiency or bankable feasibility. A buyer-price ceiling is a user assumption, not proof of household affordability. A shared open-space area is a spatial commitment, not a comprehensive measure of livability.

**Commercial hypothesis:** professionals may pay for or deliver preliminary studies supported by this workflow. No demand, willingness-to-pay or productivity claim is established yet.

## 3. The demonstration and first proof

Use fictional **Cedar Market**, a 120 × 100 m flat site formerly occupied by retail. It has an explicitly supplied boundary, scale, street-side entrance and selectable shared open space. All default market and cost data are fictional and visibly labeled.

The opening minute should communicate:

1. Recognizable source/site.
2. Confirmed boundary and scale.
3. A few explicit priorities.
4. Distinct residential alternatives.
5. One spatial intervention with visible consequences.

Signature request: **“Keep this open space. Do not increase the home selling price. What else can change?”**

The system must associate “this” with a selected object, resolve what is locked, investigate allowed changes, and show actual differences in plan quantities and economics. It must not turn the request into a decorative chat response.

The first release milestone is one working end-to-end interaction on the prepared site, including a genuine model call, deterministic tools and independent verification. Uploads, optional voice and secondary workflow features follow that milestone.

### Storyboard-to-product boundary

The reviewed storyboard contains prepared 36/40/44-home alternatives, indicative green-space areas, and a revised 40-home proposition. Its Rp0.62 billion reduction in non-land costs is an illustrative assumption, not a measured saving. Its diagrams are schematic and are not dimensional source geometry. Its upload/map buttons are placeholders. It has no live model or search engine.

Do not copy those values into production as generator outputs. Build physically coherent fixtures, derive quantities, and allow the resulting numbers to differ. The five-stage journey and interaction priorities are the reference; hardcoded outcomes are not requirements. Browser verification of the storyboard was not completed in this authoring environment because the available automation package lacked a browser binary; JavaScript syntax was checked. This must not be reported as a passed end-to-end test.

## 4. Scope and delivery priorities

### P0 — working proof on the sample

- Dimensioned rectangular site, deterministic geometry and editable numeric parameters.
- Selectable shared open-space object and explicit locks.
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

### New requested planning capabilities — priority to be assigned

- Create and edit individual residential lots as irregular polygons, with actual geometry, calculation, validation and user control of configuration. This is a requested product requirement; no claim is made that the current rectangle-based engine supports it.
- Select and move the compound entrance along supported boundary edges. The connected circulation and measured results must follow the selected gate.
- Support irregular outer site boundaries as a related, separate target where the solver can uphold the geometry contract. An individual lot polygon and the compound boundary are different objects; do not use a bounding rectangle as a silent substitute for either.

These requirements expand v0.2 scope. Whether each is part of the immediate MVP or a subsequent milestone, and the initial supported polygon/entrance limits, has not been decided. Propose bounded increments with their product consequences; do not silently defer them, claim arbitrary-geometry support, or mark M2/M3 complete because of these additions. Simple polygons without holes or multipolygons may be a first implementation if its limitations are visible and the product owner accepts the material scope trade-off. The exact support envelope must be recorded in the acceptance matrix.

### Deferred

Google Maps integration, arbitrary geographic imports, PDF/DWG/SKP ingestion, automatic cadastral interpretation, unrestricted subdivision beyond the explicitly supported polygon capabilities above, terrain/earthworks, 3D editing, mixed product allocation, online market research, regulatory compliance, phasing, absorption, cash flow, debt/IRR/JV models, accounts, billing, multi-user collaboration and generalized document intelligence.

A general “use any data” upload promise is outside scope. Unsupported files should receive a helpful explanation, not a fake analysis.

## 5. Input and calibration contract

### Prepared case

Open immediately with supplied geometry and clearly fictional assumptions. Never infer real geography or market validity from the sample name. Editing the sample creates a working version without destroying its original.

### User-supplied image

Support PNG and JPEG initially, with documented implementation limits (recommended 10 MB and 20 megapixels). Verify actual decodable image content and size, not only extension or declared MIME type. Reject malformed, unsupported or oversized files with an inline recoverable error and preserve the last valid source. Show the image locally; do not send it to the model automatically.

Preserve the source image through dimension/scale confirmation, edits and Undo. Replacing or removing it must be explicit. If the image is unavailable after restoring a project or Undo, clearly report that condition; never suggest that an image was preserved when it was not. Source-image pixels alone never establish site dimensions or ownership. A reference-only image may accompany a separately declared measured site, but it must not imply that the site boundary is aligned to or measured from that image.

For a calibrated image, the user positions, rotates and sizes a rectangular or supported polygonal site overlay. The image flow works only where a top-down plan/image can be represented with uniform scale. Skewed perspective photography must be treated as reference-only or replaced with a suitable source; do not silently rectify an ordinary street photograph into a measured site.

For a top-down image, calibration supports at least one of the following methods in a released calibrated-image flow, and clearly identifies the chosen method:

- Confirmed width and depth mapped onto an aligned rectangular overlay, with an explicit uniform-scale/aspect-ratio check. For irregular boundaries, this method requires a declared alignment and enough known dimensions to establish a valid uniform transform; do not infer an arbitrary polygon from its bounding box.
- A known-length line plus a uniform pixel-to-meter scale; show resulting dimensions for confirmation.

AC-03 accepts either implemented method. Declaring a rectangle's dimensions without an image-to-site mapping establishes the declared mathematical rectangle only; it is not image calibration. A known-length line is not mandatory if the width/depth method is correctly implemented.

Known area alone does not uniquely establish dimensions unless the user explicitly accepts the drawn rectangle's aspect ratio. If used, disclose that assumption and compute both dimensions from area and ratio; never claim a survey measurement.

Show the resulting area and dimensions before accepting. Boundary ownership, legal access and external road rights remain unverified. An address is not a property polygon.

### Feature selection

The initial retained feature is a user-defined shared open-space region inside the normalized site. The current bounded implementation may use an axis-aligned rectangle; its extent, position, provenance, surface and preservation lock are explicit. It can be selected, moved and numerically edited before locking. User-facing names use “open space”; legacy “green space” and “grove” remain understood in requests and existing records. Convert all source display coordinates to canonical meter coordinates. Unsupported retained-building requests must be identified as unsupported; they cannot silently become demolition.

Optional model-assisted feature suggestions are previews only. The user confirms their identity, dimensions and meaning. SAM masks cannot establish ownership, scale or engineering constraints.

## 6. User experience specification

### Canvas-led workbench

The workbench keeps the plan central: a compact top bar, object list and contextual inspector, canvas tools, visible summary of consequences and a dock for quantities, economics, options and issues. Selecting an object on the canvas or in the list selects the same object in both places and exposes only relevant controls. Supported objects include site, open space, entrance, circulation and individual lots when editing them is supported. The request bar complements direct manipulation and remains easy to reach.

Provide pan, zoom, Fit site and stable framing across edits and alternative previews. Numeric and keyboard equivalents must use the same canonical geometry and validation as pointer edits. At 1024px and 1440×900, show the meaningful plan, its essential controls and key outcomes together without scrolling the whole page; at 375px use an accessible collapsible inspector or stacked layout without page-level horizontal overflow. Do not add disabled or decorative controls for capabilities the solver cannot perform.

### Stage 1 — Bring the site

Primary action: Try Cedar Market. Secondary action: Upload a plan/image when P1 is implemented. Map search is absent from the released MVP rather than presented as a working control. Provide accepted formats and a compact statement of what is required to establish scale.

### Stage 2 — Confirm understanding

When an image is used as a measured source, show it with an aligned editable boundary overlay. Dimensions, area, entrance and open-space objects are inspectable. Separate supplied, user-confirmed and unconfirmed information. Confirming requires valid scale and positive dimensions; preserve the source image unchanged.

If the site exceeds supported geometry, explain the limit and offer the sample. Do not force-fit an arbitrary boundary into a modeled rectangle or present it as an exact survey.

### Stage 3 — Set intentions

Show only consequential inputs first: assumed selling-price ceiling, selected price scenario, owner expectation, target surplus/sales and selected spatial commitments. A ceiling is not automatically an achievable selling price: use a separate selected selling-price assumption at or below it. The sample may use the same number for both, explicitly labeled.

An expandable assumptions panel supplies product dimensions, price ranges, construction rates and site allowances. Required unknowns block commercial qualification; the plan can remain explorable with economics marked incomplete. Never import sample prices invisibly into a user-uploaded case.

### Stage 4 — Explore futures

A large interactive plan is central. Provide working, preview and comparison states, a compact commitments/inspector panel, up to three meaningful alternatives, and a small instruction bar. Keep detailed calculations in an expandable dock or drawer. Direct manipulation updates geometry and dependent metrics together; typed investigation serves broader questions and must not be required for routine supported edits.

Cards should express meaningful differences such as more shared open space, lower infrastructure area or a different supported product. Titles are generated from measured differences, not assigned regardless of result. Every card shows homes, open-space area, land allowance/gap and critical blockers. Do not fabricate a third result if only two distinct candidates exist.

Selecting a card previews that exact candidate without committing it. Highlight added/removed homes, changed circulation and retained regions without obscuring the proposed plan. Color is supplemented by labels, patterns or line styles. Source view preserves the source; proposed view presents exact modeled geometry. Provide an expandable comparison workspace with two selectable distinct versions, including the working plan, aligned coordinates and framing, explicit snapshot labels, and physical and financial values and deltas. Distinguish current search results from immutable saved comparisons; do not imply persistence before it exists.

### Stage 5 — Challenge and decide

Click an open-space object or select it from an accessible object list. Display selected-object name and extent. Typed request is interpreted into an explicit operation proposal: which variables will change, which locks remain and what the investigation will test.

The user confirms the proposal once. Bounded deterministic investigation can then run without repeated approval dialogs. Selecting a result is a preview; Apply makes it current and preserves the previous version.

The result must state the physical trade-off, cost drivers, changed land allowance and unresolved commitments. Offer relevant next actions: investigate this proposition, discuss an expectation, seek evidence, or stop under the tested conditions. Saving a decision does not send it to anyone.

### General interaction behavior

- Numeric, pointer and keyboard edits to the same values yield identical accepted geometry and metrics. Editing buffers retain empty/invalid input as a draft, not zero.
- A complete valid drag is one undo action; cancel/Escape restores the previous accepted geometry. A valid direct drag may commit on release; a multi-step polygon draft may require explicit Apply/Cancel. Previewed search candidates always require explicit Apply to become current. No silent adjustment of another field or loss of manually edited lots.
- While a draft or calculation is pending, clearly label it and keep geometry, metrics and the comparison baseline consistent. Invalid drafts never become accepted results. Undo/Redo restore the full relevant accepted version, including locks and assumptions.
- Make validity, input completeness, profile applicability and commercial result independently legible. An owner shortfall is not proof that layout cannot improve, and “valid layout” is not a claim of commercial success.
- Maintain a stable canvas on alternative changes and provide zoom-to-site.
- Show model/search status; permit cancellation and discard stale responses.
- No voice, upload, map or export control should imply working functionality when unavailable.
- Desktop-first at 1024 px; stack views and provide numeric alternatives at 375 px. No forced horizontal scrolling of the overall page.
- Maintain visible focus, readable contrast and non-color status cues.
- Product language should explain choices; developer logs and schema names stay out of the main experience.

## 7. Geometry and quantities

Canonical geometry uses meters in a local Cartesian coordinate system. Raster placement is a separate image-to-site transform. Resizing the browser or zooming never changes physical quantities.

The currently evidenced solver supports a flat rectangular site, rectangular reserved shared-green region, a west-edge entrance and a small set of parameterized circulation families. It must not be described as an arbitrary polygon solver. The requested target extends this contract to editable simple irregular individual lot polygons and movable entrances, and separately to irregular site polygons within an explicitly supported envelope. Each generator must yield a genuine connected road network, parcel polygons and house footprints, not drawing symbols disconnected from calculations.

Polygon vertices are canonical meter coordinates, not SVG-only decorations or bounding-box approximations. The initial supported polygon class, tolerance and complexity must be documented. Validate positive area, simple non-self-intersecting rings, containment (including concave boundaries), overlaps, road access, footprint fit, lot-specific frontage and area reconciliation. Unsupported holes, disconnected regions or other shapes receive an explicit explanation; preserve the last accepted version. No shape simplification or movement of a locked region is silent.

Provide vertex addition/removal and movement with visible handles, dimension/area feedback and numeric/keyboard equivalents when that polygon capability is delivered. Changes affecting neighboring lots or manually edited geometry require a clear preview and explicit user action if they would discard or alter that work. Search must preserve manual edits and locks under a declared policy, or request explicit approval before replacing them.

Make the entrance selectable in canvas and object list, with gate width, boundary edge/offset and assumed/confirmed provenance. Drag and numeric controls must address the same actual gate. Road networks must reach the selected entrance, including across each supported edge and circulation family; an unsupported edge must be stated rather than visually moved without a connected solution. Label legal rights and external access as unverified.

Parameters include road width, road positions, lot frontage/depth bounds, house area/footprint dimensions, simplified setbacks and open-space reservation. Fictional defaults must not be labeled regulations.

Validate:

1. Positive geometry and containment inside the site.
2. No overlapping parcels, roads or reserved shared open space.
3. Footprints fit their parcels and stated simplified setbacks.
4. Every residential parcel has modeled access to a connected road reaching the declared entrance.
5. Site area reconciles to parcel, road, shared green and explicitly unallocated area.
6. Road intersections are unioned so construction area is not counted twice.
7. Locked regions retain both area and location unless the user's lock is explicitly area-only.

Private lot gardens are part of parcel area and cannot also be counted as shared open space. Open space is distinct from roads and explicitly unallocated land. A preserved open-space region is exact geometry, not just a total-area target. Do not move it elsewhere while reporting preservation. Surface type and cost basis are separate from the name “open space”: the current sample's green-works rate applies only to its declared landscaped-green assumption; paved or other types need an explicit basis.

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
| Open-space works | Measured area × declared rate for its stated surface/type, where included |
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
- **Site:** versioned normalized boundary geometry, units/coordinate reference, dimensions where applicable, entrance geometry and edge/offset, calibration method/transform, provenance and confirmation state.
- **Feature:** stable ID, type and surface, geometry, source, confirmation, retention policy and lock. Shared open space, site boundary, entrance and individual residential lots remain distinguishable objects.
- **ProductProfile:** dimensional applicability, price scenarios, source and credibility description.
- **Assumption:** value or unknown, unit, inclusion basis, source, timestamp, author/acceptance.
- **Commitment:** scope/object ID, operator, value/unit, locked status, provenance.
- **ScenarioSnapshot:** immutable site, product, commitments, costs and accepted-change IDs.
- **Candidate:** geometry, derived quantities, validation results, calculation result, snapshot ID, generator parameters.
- **SearchRun:** snapshot hash, version, seed, ranges, locks, tested/valid/qualified counts and timings.
- **Proposal:** source request, context version, operations, ambiguities and acceptance status.
- **DecisionRecord:** chosen candidate, comparison, unresolved conditions, next action and exclusions.

States: original case → working version → temporary preview → applied working version. Saved comparisons are immutable snapshots. Editing the project invalidates search/proposal applicability; late model responses stay attached to their original version. No hidden replacement of current state.

Autosave to IndexedDB with visible saved/unsaved status. Export JSON includes a schema/version and a structured snapshot of the current accepted site boundary, coordinate system/units, entrance, open-space geometry and lock, manual lot geometry/locks, layout parameters, assumptions and provenance, quantities, calculations and result status. Include modeled parcels/roads/footprints or sufficient versioned generator inputs and implementation identification to reproduce them; do not claim reproducibility when they are absent. Preserve scenario/search references, commitments, decisions and exclusions.

A chronological event log is distinct from the current snapshot. If Undo/Redo are represented as history, capture them or otherwise make final accepted state unambiguous; never infer the current version from an incomplete edit log. Test export after an edit and after Undo against the visible accepted plan. The optional background raster may be excluded with an explicit warning; importing without it still restores usable geometry and decisions. Credentials are never serialized. Unsupported schema versions fail safely without overwriting the active project.

## 12. Acceptance criteria

All criteria below are requirements, not passed results. P0 criteria must pass before optional work. P1 completes MVP.

| ID | Priority | Verifiable behavior |
| --- | --- | --- |
| AC-01 | P0 | Sample opens with fictional label, site dimensions, source and populated assumptions. |
| AC-02 | P1 | Valid PNG/JPEG loads locally; invalid/oversized input gives a recoverable error. |
| AC-03 | P1 | A supported calibration method maps the aligned image to meters using confirmed overlay dimensions or a known-length line and a uniform transform; zoom/viewport changes leave quantities unchanged. A dimension-only rectangle does not count as image calibration. |
| AC-04 | P1 | Unconfirmed or unsupported modeled dimensions or scale block measured economic conclusions. Independently confirmed site dimensions may support a mathematical plan while an uncalibrated image remains clearly reference-only; the image must not be presented as aligned or measured. |
| AC-05 | P0 | All accepted geometry passes containment, overlap, access and area reconciliation checks. |
| AC-06 | P0 | Displayed home count exactly equals modeled valid footprints. |
| AC-07 | P0 | Every cost-driving quantity is derived from its displayed geometry or explicit allowance basis. |
| AC-08 | P0 | Road savings reconcile to changed unioned road area and declared rate; intersections are counted once. |
| AC-09 | P0 | Selected-region preservation retains location and shape within tolerance, not just total area. |
| AC-10 | P0 | Numeric and pointer edits to the same parameter produce identical results. |
| AC-11 | P0 | At least two distinct circulation/open-space configurations can be generated; duplicate outputs are not marketed as separate futures. |
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
| AC-33 | Priority unassigned | Supported irregular individual lot polygons have canonical vertices, valid containment/non-overlap, road access, fitting footprints, lot-specific applicability and exact measured quantities; invalid or unsupported geometry cannot silently become a rectangle. |
| AC-34 | Priority unassigned | Editing a polygon by pointer or numeric/keyboard controls produces the same canonical geometry; cancellation and one-step Undo restore the prior accepted version, and regeneration cannot silently discard manual lots or locks. |
| AC-35 | Priority unassigned | For every supported site edge and layout family, a moved entrance is connected to the real modeled road network; invalid/unsupported locations are explained and changing the gate invalidates dependent results. |
| AC-36 | P0 | “Keep this open space” resolves the selected object and explicitly proposes its location/shape lock; without selection it asks for clarification. Legacy “green space/grove” inputs remain understood. |
| AC-37 | P1 | Valid uploaded source survives site confirmation and Undo; invalid image bytes, unsupported format and documented size-limit violations yield recoverable errors without replacing the last valid source. |
| AC-38 | P1 | A comparison of two selected versions shows both plans and matched geometry/financial deltas at aligned coordinates without requiring users to infer hidden or stale values. |
| AC-39 | P1 | Structured export describes the currently accepted entrance, open-space/lot geometry and locks, assumptions, versions and outcomes after an edit and after Undo, separately from the event log. |
| AC-40 | Priority unassigned | For each supported irregular outer boundary, concave containment, area reconciliation and all parcel/road/entrance invariants hold; unsupported boundary forms are explicitly blocked. |

Recommended numeric tolerances: area reconciliation ≤0.01 m² on supported fixtures; arithmetic differences ≤Rp1 for independent golden fixtures. Choose and document a coordinate tolerance, recommended 1 mm, for equality/retention tests. Do not confuse display rounding with computational tolerances.

Performance targets on the recorded demo machine: ordinary deterministic edit ≤200 ms; up to 250 candidates ≤2 seconds where practical. Measure, record and optimize before adding a second language. Model latency is separately measured, with status and cancellation; no invented guarantee.

## 13. Evaluation and failure handling

Tester owns independent fixtures and browser evidence; Coder owns implementation tests. Avoid tests that simply repeat the same implementation formula without independently known expected results.

Minimum model evaluation set: selected open-space preservation (including “open space” and legacy synonyms), same request with no selection, price ceiling below selected price, conflicting owner/return constraints, out-of-profile lots, ambiguous monetary units, unsupported retained-building request, malicious source note, stale response, and no qualifying alternative. Record expected operations, actual tool calls, numeric consistency, retries and model version. Every case must preserve no-silent-mutation and no-invented-value requirements.

Use real-browser tests for upload/calibration and source preservation, selection, proposal review, direct edits, supported irregular-lot/entrance changes, candidate preview, comparison, apply/undo, no-result state, refresh and export/import. Record missing browser infrastructure as blocked, never passed. Agent inspection is not user validation.

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
| M2: signature interaction | Select open space → typed request → reviewed locks → real search → exact plan/economic deltas | Genuine API tool path plus independent browser proof and unrehearsed change |
| M3: complete journey | Calibrated image input, alternatives, comparisons and decision state | Five-stage flow passes; no hardcoded storyboard outcomes |
| M4: reliability | Persistence/export, failures, accessibility and evaluation | P0/P1 acceptance matrix, user feedback, defects resolved or disclosed |
| M5: packaging | Demo, capability inventory and submission material drafts | Claims tied to actual evidence; owner reviews submission separately |

The user-requested polygon-lot and movable-entrance capabilities need explicit milestone placement; do not relabel them complete or silently relegate them to deferred scope. A bounded first polygon/entrance release may be sequenced separately from M2/M3 if the product owner accepts the scope and dependencies. Keep the original model, browser and human validation gates intact.

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
| What's next | Real professional trial, followed by remaining explicitly scoped geometry and timing capabilities |
| Built with | Actual versions and used technologies, not every model available to the event |

Target a concise demonstration, not a walkthrough of every panel. Show the source, intentions, conflict, investigation, changed plan and next action. Recorded outputs must be labeled recorded. No synthetic example proves real-world market feasibility.

## 17. Immediate implementation instructions

Continue from the existing project and the latest verified evidence; do not restart scaffolding or discard uncommitted work. Reconcile `docs/UX.md`, `docs/BUILD_PLAN.md`, `docs/ACCEPTANCE.md` and the decision log against this document. Record explicit support limits and priority decisions for irregular individual lots, irregular outer boundaries and movable entrances before claiming those capabilities or their milestone complete.

Fix the verified source-image, invalid-image, current-state export and comparison usability defects; retain evidence from the exact build tested. Continue the real model tool round trip when available. Do not restart ideation, create another decorative storyboard, introduce Rust without evidence, or build optional model features before the required gates work.

## 18. Sources and remaining uncertainties

[S1] Meta developer overview, checked 25 October 2026: https://dev.meta.ai/docs/overview . Supports the described model/tool categories, not this team's access or application reliability. Runtime identifiers and API behavior must be verified at implementation.

[S2] Official event overview, checked 25 October 2026: https://dev.meta.ai/events/global-hackathon . Supports current overview dates and indie-track framing. Final rules, allowed reuse, submission format, team requirements, eligibility and permitted development workflows require direct verification.

[I1] Development_Decision_Workspace_PRD_v0.1.md supplied in this conversation.  
[I2] UNBUILT five-stage interactive storyboard and subsequent user acceptance to begin PRD/build work.  
[I3] User-selected Muse CLI / Herder / Orchestrator–Designer–Coder–Tester workflow.

Additional project inputs: `docs/DECISIONS.md`, `docs/UX.md`, `docs/ORCHESTRATOR-INTERACTIVE-PLANNING-PROMPT.md`, `docs/ORCHESTRATOR-M3-BROWSER-AND-PLANNING-PROMPT.md`, `evidence/ux-rewalk/RESULTS.md`, and `evidence/m3-browser-review/` (browser observations on the build identified in that handoff). The TestFit parking-solver video is interaction inspiration, not evidence that UNBUILT has TestFit features: https://www.youtube.com/watch?v=4SVRaZ_FS6A&t=5s.

### Evidence snapshot, 26 October 2026

At the last independent M3 browser review, the served build exposed a canvas-led deterministic workbench, rectangular dimensions, an illustration-only reference image, a bounded signature search, a working-vs-option comparison and a partial JSON export. Nine engine suites passed in that review. The browser tests found the image cleared on site confirmation, invalid image content was accepted, current geometry was missing from export, and comparison was cramped. Those observations refer to that tested build; re-test later builds before repeating or closing them.

The deterministic badge was visible. A real model/API round trip and an unrehearsed human session were not demonstrated in that review. Current credentials, subsequent changes, detailed event rules, market evidence, commercial demand and performance remain to be verified. A browser agent is not a human participant. Historical development-workflow and infrastructure statements should be rechecked rather than copied as current facts.
