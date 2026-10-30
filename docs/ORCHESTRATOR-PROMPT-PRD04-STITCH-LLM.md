# Orchestrator prompt — PRD v0.4, Stitch UI and design/economics assistant

From: independent product reviewer, 27 October 2026. Product owner: Spotty.

## Your assignment

Continue the existing UNBUILT project. Create a coherent `docs/PRD_v0.4.md`, reconcile and implement the Stitch `DESIGN.md` as a real canvas-first UI, and wire the LLM so it helps a planner move between design decisions and the calculations behind them. Preserve the working domain engine and uncommitted work. Deliver a functional, tested vertical slice; a screenshot or static mockup alone is not the result.

Start by inspecting the actual current repository and running status/tests; the prior review and handoffs refer to specific earlier builds and are not a substitute for current evidence. Preserve `docs/PRD_v0.2.md`, `docs/PRD_v0.3.md`, `docs/PRD_v0.35.md` and the root v0.2 unchanged. Do not overwrite another collaborator's edits. No commit, publish, deployment, submission or external contact without the owner's instruction.

## Read these inputs

1. `docs/PRD_v0.3.md` and `docs/PRD_v0.35.md`: governing product direction, geometry, finance, model, interaction and acceptance contracts.
2. `stitch/unbuilt_project_brief_prd_v1.0.md`: consultant's proposal; valuable input, not an already accepted replacement PRD or proof of working capabilities.
3. `stitch/stitch_architectural_drafting_tool.zip`: contains `DESIGN.md`, `screen.png`, and `code.html`. Read all three safely. The screenshot is a visual reference; the HTML is a static prototype containing illustrative values and controls, not a functioning, verified solver.
4. `docs/REDESIGN-SPEC.md`, `docs/ORCHESTRATOR-AUDIT-UI-LLM-PROMPT.md`, `docs/ORCHESTRATOR-M3-BROWSER-AND-PLANNING-PROMPT.md`, `evidence/planner-review/HANDOFF.md`, `evidence/audit-repair/HANDOFF.md`, and current acceptance/decision logs. Re-test repairs that matter; do not repeat outdated findings as if verified against the current build.
5. Current `web/src/App.tsx`, `web/src/unbuilt/PlanCanvas.tsx`, `src/{geometry,polygon,search,economics,finance,intent,persist,schema}.ts`, `server/intent.mjs`, and tests. Note: there is now a server seam with mock and Meta adapters, while the current browser request path still uses the local parser. Do not scaffold a second competing backend.

## Product direction from the owner

The professional user needs a drawing-first planning tool. The plan should occupy the maximum useful area and stay legible. The interface must support focus, rather than presenting a tiny plan surrounded by repetitive controls and status text. The LLM should be a real thinking partner that connects a spatial change to physical and commercial consequences, not a decorative chat box or merely a keyword-to-button translator.

### Three questions the integrated product must answer

- **What is true in this plan?** Inspect the selected object, geometry, quantities, commitments, assumptions, validity and commercial outcome. Clearly distinguish observed/calculated results from estimates and unknowns.
- **Why did it change?** Compare two immutable versions; identify the measured changes in homes, road area, open space, cost drivers and land allowance. Tie every quantitative statement to deterministic outputs; don't assign a cause without evidence.
- **What could we try?** Suggest a bounded spatial or commercial investigation; show what would change, which locks remain, what is uncertain and what the engine will test. Run read-only alternatives/counterfactuals against an immutable snapshot, then let the user preview and explicitly apply a choice.

The assistant can reason, ask follow-up questions, suggest strategies and explain trade-offs. Its proposals are hypotheses until the deterministic engine tests them. It never invents a site, rate, market value, legal compliance, feasible layout or monetary result. It may use arithmetic or describe results, but authoritative values always come from validated geometry/economics tools.

## 1. Create PRD v0.4

Create `docs/PRD_v0.4.md` as a self-contained successor, not just a short note that leaves the team guessing which version governs. Carry forward v0.3's audience, problem, physical and financial contracts, sample assumptions, four candidate-status dimensions, model boundaries, original acceptance criteria and model/browser/human gates. Incorporate v0.35's interactive workspace and real-model integration refinements.

Explicitly add:

- The three assistant questions above and a concrete workflow: selection/context → intent/clarification → proposed investigation → validated tool execution → grounded physical/financial explanation → preview/compare → explicit Apply/Undo/decision. A normal language question can be read-only; the owner should not be forced through a proposal dialog just to ask “why”. Changes to accepted commitments or working geometry require an explicit, reviewable user action.
- User-requested irregular individual lots, movable compound entrance, shared open-space terminology, and irregular outer boundary as a distinct capability. Describe actual supported shapes/edges and honest staged limits. Do not retroactively claim every requested edge or arbitrary site shape is implemented. The v0.3 milestone priorities for these requirements are unassigned: propose a sequencing recommendation and flag material scope choices; do not silently downgrade them or claim owner approval.
- A truth table for supplied/confirmed/assumed/unknown, current working/draft/preview/hypothetical/saved states, and valid geometry versus profile/price/financial status. Open space is not private lot garden; landscape surface type and its cost are explicit.
- Source-image behavior: verified PNG/JPEG bytes and limits; retain the source across confirmation and Undo; reference-only vs actually calibrated image is explicit; no invented scale. Dimension-only rectangles may be modeled if dimensions are independently confirmed but never presented as image calibration. Sample assumptions on a custom case must be explicit and appropriately provisional or unknown.
- True current-state JSON export/import and persistence with units, scenario versions, objects/locks, entrance, site/lot/open-space geometry, assumptions, provenance, calculated results and exclusions. Separate append-only events from current state, expose image exclusions and recovery errors.
- Comparison of two eligible versions, with aligned coordinate views and measured deltas; preserve the camera and actual snapshots. Saved comparison availability must reflect implementation, not the mockup's “Scenario A1” text.
- Explicit acceptance tests, priorities/status evidence and dependency gates, including model tool round trip, unsupported requests, stale and concurrent proposals, cancellation, lock preservation, verified calculations, honest zero-result states, storage, keyboard, responsive rendering and a human unrehearsed task. Retain AC-01–AC-40 and U/L/R criteria or provide a traceable mapping, rather than silently deleting requirements or declaring tests passed.
- A short revision/evidence map: which owner requests change v0.3/v0.35, which Stitch suggestions are adopted, and which mockup capabilities/metrics are deferred, unverified or excluded. Use real timestamps/build IDs only where evidenced. Agent walkthrough is not human validation.

Do not copy consultant mockup marketing claims into requirements as facts. In particular no invented solar hours, zoning/FAR/legal setbacks, runoff, universal 1:250 scale, EPSG:27700/georeferenced coordinates, 142-home yield, or DXF/IFC support. A technical grid may be illustrative if labeled and consistent with the actual local coordinate system. Do not assert “validated,” “optimal,” or sub-50ms/60fps as a demonstrated fact; if performance targets are adopted, specify how they will be measured on a named device.

## 2. Implement and reconcile `DESIGN.md`

The Stitch design's useful direction is a restrained architectural drafting surface: broad centered canvas, subtle grid, clear lineweights, dark/slate surrounding chrome, contextual inspector, minimal tools and a compact consequences strip. The screenshot uses a light drawing field with slate chrome and a violet open-space accent; the packaged `DESIGN.md` also describes a much darker canvas with cyan/green accents. Resolve this inconsistency explicitly in an adopted project design spec (e.g. `docs/DESIGN.md`): follow the screenshot's calm light drafting field/slate frame as the starting direction, and use accessible semantic accents consistently rather than claiming the references are identical.

The reference's 9–12px text, 20–28px controls, 4px handles and hidden scrollbars directly conflict with the owner's complaint and v0.35. Override them. Target 16px primary UI text, at least 14px secondary labels, legible actual screen-size drawing labels, 44×44px primary/touch targets or a usable accessible equivalent, visible focus, readable contrast and support for 200% zoom. At 1440×900 and 1024×768 fit the site, selected-object controls, action and compact outcome strip in the usable workspace without clipping; at 375px use a collapsible inspector/sheet and no overall horizontal overflow. Percentages like “80% of screen” are aspirations subject to real inspector and text constraints, not inflexible acceptance numbers.

Translate the actual reference into functioning React/CSS components and existing SVG geometry; do not merely paste `code.html`, import its CDN scripts, or replace the solver with a decorative screenshot. Use a coherent token system for typography, spacing, colors, surface elevation, lineweights, focus, selected/locked/draft/invalid/stale/preview states. Include clear non-color labels and patterns. Bind each visible number, label, lock, and action to real state and measured data.

Design structure:

- Compact top bar with project, current scenario state, Undo/Redo, save status and truthful model status.
- Flexible, centered, spatial work surface that uses available area; stable pan/zoom/Fit and readable dimensions/selection; no `0.46vh` height cap. Light drafting field from the reference, with visually distinct site boundary, road, individual lots, footprints and open space.
- Minimal tool rail with labeled/accessible supported tools only. Do not show Split, zoning envelope, editable road drawing, 3D or DXF/IFC as working controls unless they actually exist and are validated. Disabled decoration is not a substitute for scope honesty.
- A contextual inspector for Site, Entrance, Open space, Circulation and an individual Lot. Object list and canvas selection mirror each other. Preserve exact lock semantics: shape/location lock differs from minimum-area lock; do not replace one with the other just to match a visual checkbox.
- A compact persistent outcomes strip (homes, open space, road, land allowance, owner shortfall/headroom), with labels and deltas tied to the same version. Detailed calculations, assumptions and provenance appear on demand.
- Contextual “Ask about this plan” associated with current selection, expandable but not covering the working site. A user should understand whether the assistant is ready, thinking, awaiting clarification, offering a hypothesis, proposing a change, reporting tested alternatives, or unavailable. A supported spatial edit remains usable without the model.
- Dedicated comparison workspace: choose two distinct available snapshots, aligned camera/Fit both, whole plans visible together, traceable difference and inputs/assumptions; no unlabeled fake delta or clipped nested scrolling. Stale results are clearly blocked or regenerated.

Avoid the consultant's misleading illustrative features: mock `Deterministic: Validated`, fictional `R-3`, legal setback/FAR labels, “solar 6.4 hours”, CRS, runoff, global status numbers, fake client profile, arbitrary 450m price lock, and hardcoded results. The original scenario's real values must render from domain state. If a feature is not implemented, leave it out or label the limitation in context.

## 3. Wire the LLM as a design/economics partner

### Existing state and integration point

`web/src/App.tsx` currently uses local `parseIntent`; a proposal is reviewed/accepted and deterministic search is run locally. `server/intent.mjs` now exposes `/api/health`, `/api/intent` and `/api/search` with a mock parser and a Meta tool-call adapter, but its mere presence and protocol tests do not prove that the UI invokes it, that live credentials work, or that it runs a full model/tool/result explanation loop. Inspect and reuse/refactor this seam. Avoid the outdated assertion that there is no server.

### Required flow

1. Build a complete, versioned, validated `ScenarioSnapshot` including site/source/units, actual gate, open-space geometry and its preservation mode, stable lot IDs/edits/locks, layout family/frontage, profiles, rate/price/owner/target assumptions, economics, source/provenance and capability envelope. Identify the selected object explicitly. Treat incoming client snapshots as untrusted; validate them and independently derive geometry and results server-side. Use a canonical version/hash that covers all material fields; recheck at application time. Don't use a short UI label as a security guarantee.
2. Add a clear provider adapter boundary. Use the official Meta Model API selected by the existing product requirement, with server-only credentials, timeout/cancellation and deterministic mock/fallback for development. Verify runtime model, API access and current protocol with a real authorized account when available. Documentation: https://dev.meta.ai/docs/cookbook/tool-function-calling and https://dev.meta.ai/docs/overview. Do not claim real-model success from a mock or configured key alone. Do not expose provider keys in frontend assets, logs, exported records or prompts.
3. Give the model narrow typed tools; expose only functions actually implemented. Suitable read-only tools are `inspect_scenario`, `inspect_selected_object`, `evaluate_current`, `compare_versions`, `generate_alternatives`, and a controlled `test_counterfactual` when the engine actually supports it. `propose_commitment_changes` returns a proposal, never applies it. Validate every schema, object identity, unit, finite value, price scope, lock and computational budget. The model may request tools; the server executes allowed deterministic calls and returns actual results. Handle all returned tool calls/IDs according to provider protocol, with bounded rounds/time and safe error paths.
4. Provide decision-quality answers with structured evidence:
   - `answer`: short plain-language interpretation;
   - `facts[]`: measured values, units and tool/result references;
   - `assumptions[]` and `unknowns[]`: with provenance;
   - `hypotheses[]`: labeled untested design ideas or supported investigations;
   - `proposal`: exact change scope, current/new values, locks preserved, scenario version, affected manual edits, and acceptance requirement when there is a requested change;
   - `results[]`: candidate IDs, geometry/quantity/cost/finance and independent statuses; no generated number without a source.

   This is a contract example, not a demand to expose raw JSON to the user. Validate schema and result consistency; render authoritative numbers directly from tools, and fall back to a deterministic explanation when prose cannot be reconciled.
5. For a question such as “If I keep this open space and don't raise the selling price, what else can we change?”, resolve “this” to an actual selected open-space ID. If identity is ambiguous, ask. Review the lock and immutable snapshot, then run a bounded exploration after the user confirms scope. Show best supported options, actual differences, costs/allowance, constraint misses and uncertainties. A model may suggest a road change but must state if the current solver cannot test it. Never fabricate a counterfactual or causal claim.
6. To bridge design and calculation on an existing result, provide read-only explanations: e.g. homes change from 20→17; land allowance from Rp3.56bn→Rp2.41bn; show the measured revenue/cost drivers that actually changed, based on the same result snapshot. Values here are example observations, not fixed UI content or guaranteed results. Distinguish a requirement such as needed price from predicted market price; owner expectation is labeled according to the actual product contract and solver, not presented as a met constraint when it is a benchmark.
7. Before any operation that changes accepted state, show exact changes and held locks, require user acceptance, recheck the snapshot/version, and use an idempotency key to prevent double apply. A stale or out-of-order model response cannot mutate the latest plan. A read-only counterfactual may run without extra approval only within already authorized conditions; any hypothetical relaxation is isolated and clearly labeled and never changes actual locks. Preserve manual lot edits unless the user explicitly chooses to discard incompatible work.
8. Strictly separate provider state from the deterministic app. Missing key/network/timeout leaves manual planning, calculations and a truthfully labeled fallback available. Do not automatically upload private images or notes; disclose the model provider/data sent and get explicit consent where sending the source image is proposed. Bind any explanation to immutable result IDs.

### LLM evaluation — required, with honest status

Write independent fixtures and browser tests for: selected open space; no-selection ambiguity; “why did the allowance change?” tied to checked numbers; a requested layout not supported by the solver; required-price vs achievable-price distinction; ambiguous monetary units; conflicting locks; out-of-profile lot; explicit no-result; model timeout and malformed output; malicious source note; duplicate acceptance; stale/out-of-order response after an edit; and a model asking to mutate a lock or invent a cost. Verify accepted results against independently calculated deterministic values.

First run a deterministic mock adapter test for transport/state and a separate real provider smoke test when account access exists. Record model/version, input scope, tool calls, selected ID, snapshot, response, retries, latency, failure, and checked numeric outputs without leaking sensitive data. Only the real tool round trip counts for the model gate. Do not substitute a mock, the regex parser, a scripted answer or a screenshot. Human unrehearsed planning remains a separate gate.

## Delivery order and acceptance

1. Inspect current state and capture existing tests; write a short design/implementation plan tied to the real code and v0.4.
2. Produce `docs/PRD_v0.4.md` and a reviewed project `docs/DESIGN.md` derived from the package, recording deliberate typography/accessibility and mock-data corrections. Preserve existing specs and reconcile their conflicts; no unsupported new P0 features by accident.
3. Implement the functional Stitch-inspired workspace in vertical slices against real geometry, preserving current interactions, user edits, export/import and fixes. Preserve the user's camera/focus and data through editing, undo, proposal, comparison and refresh. Do not trade away data correctness for visuals.
4. Integrate and test the server/model path as specified above. Use one real signature workflow end to end if credentials are available; otherwise finish testable pieces and report the external blocker plainly, with deterministic manual use intact.
5. Run appropriate domain/server tests and independent browser tests at 1440×900, 1024×768 and 375×812. Capture current-build screenshots and measured actual canvas/text sizes, 200% zoom and keyboard behavior, one realistic unprompted planning task, upload, edit, undo, stale handling, compare, persistence/export/import and failure/no-result. Test touch on real touch-capable infrastructure when available; mouse emulation alone is not proof.
6. Deliver a concise owner review: files changed, actual live-vs-mock capabilities, tested build/asset ID, pass/fail/blocked evidence, design deviations and next decisions. Keep M2/M3/model/human acceptance gates honest. Do not publish or commit unless the owner explicitly asks.

## Decision notes for Orchestrator

- Consultant PRD v1.0 is a proposal with useful aesthetic direction and several unsupported planning claims, not a source of real site facts or an authoritative override of v0.3.
- The packaged design's typography and touch target sizes are specifically rejected by the owner's readability feedback. Fix the design tokens, not just one font rule.
- Features such as irregular boundaries, all-edge entrance support, arbitrary road editing, account sharing and import/export formats require explicit planning and real domain validation; no cosmetic stand-ins.
- Some earlier audit items were reported repaired in later handoffs. Reproduce the current issue before claiming it persists or is closed. The model provider, server trust boundary and user-facing interaction still require end-to-end verification.
