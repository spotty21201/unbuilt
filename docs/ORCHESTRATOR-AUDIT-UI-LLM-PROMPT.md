# Orchestrator prompt — product audit, canvas-first redesign and model integration

From: independent product/code reviewer. Reference requirements: `docs/PRD_v0.3.md` plus draft supplement `docs/PRD_v0.35.md`. This is a review and implementation brief; preserve both earlier PRD versions and existing user work.

What this repo does: UNBUILT is a single-user, local early-residential planning prototype. It generates layouts, computes indicative land economics, and offers open-space, entrance and staged polygon-lot editing. The audit assumes one professional using the browser, not concurrent multi-user deployment. Application code inspected: `src/geometry.ts`, `polygon.ts`, `site.ts`, `search.ts`, `intent.ts`, `economics.ts`, `finance.ts`, `schema.ts`, `draft.ts`, and the principal flows in `web/src/App.tsx`, `PlanCanvas.tsx`, styles, build setup and tests. The UI is client-only today.

Reference build: `index-C8qvZpCE.js`, SHA-256 `7cfe9e799cc9f864fd83973bbc5cef300295268a04eef5579b75b1386bc4e3dd`. Chromium screenshots: `evidence/product-audit-2026-10-26/{desktop,laptop,mobile,expanded}.png`. Automated `npm test`: ten suites passed. `npm run lint`: exit 0, four React warnings (three memoization, one impure Date render); no conclusion that warnings caused the defects below. Audit scenarios and outputs: `evidence/product-audit-2026-10-26/`. Earlier browser checks are historical: retest against the exact build under review.

## Must fix

1. **Coincident lot polygons are treated as non-overlapping** (`src/polygon.ts:171`, `src/polygon.ts:197`, `src/geometry.ts:163`).
   - What this is: polygon predicates are the authority for accepting edited parcels.
   - Problem: `polysOverlap(p,p)` and `polyOverlapsRect` for the identical rectangle both return false because all tested points are on the boundary. A direct engine fixture assigning the same 20×20 rectangle to adjacent lot edits 0 and 1 returns `validateLayout(...) = []` and counts both polygon areas. This is a domain-level constructed input; this audit has not established a normal UI path that creates the exact duplicate.
   - Fix: detect positive-area coincident/collinear overlap robustly, preserving legal edge-only touches. Add independent equal, partial coincident, adjacent, containment, concave and tolerance fixtures.
   - If skipped: imported/future model/tool state or a reachable edge case can be accepted with overlapping parcels and double-counted area.

2. **Edited lots can violate the declared setback while labeled valid** (`src/geometry.ts:123`, `src/geometry.ts:302`).
   - What this is: the sample has a simplified 2m side setback, and the application labels fitted homes valid.
   - Problem: in the live UI, select Homes → Lot 1 → Reshape, set x of corners 1 and 4 to 1m (from 0m), and Apply. It accepts a 180m² lot with 9m frontage, while the fixed footprint starts at x=2m: only 1m separates it from the new left boundary. `validateLotPoly` checks the footprint is inside the polygon, not the setback buffer; the later setback test checks the original rectangle.
   - Fix: validate the required simplified front/side/rear setbacks against the actual polygon, or label edited-lot setback status unverified and block any assertion it passes. Define the road/front-side semantics for irregular lots.
   - If skipped: the plan claims its own design assumptions are met when they are not.

3. **Clearing a lot vertex silently writes zero** (`web/src/App.tsx:1236`, `web/src/App.tsx:1244`).
   - What this is: X/Y numeric fields edit polygon vertices.
   - Problem: clearing Lot 1 corner 2's X=10 turns it into `0`, because `Number('')` is 0. This changes the draft geometry while the user is trying to enter a number.
   - Fix: keep string-held drafts, represent empty as incomplete, and validate before applying, as the existing open-space inputs do.
   - If skipped: a typo or field replacement can move a corner to the site origin or create a misleading geometry error.

4. **Proposals are not bound to the version the user reviewed** (`web/src/App.tsx:363`, `web/src/App.tsx:380`).
   - What this is: Send interprets the selected object and creates a proposal; Accept runs it.
   - Problem: I sent the default request with owner expectation Rp10bn, changed the assumption to Rp20bn while the proposal stayed open, then accepted it. The app ran against the new Rp20bn state without requiring a new review. An outstanding selected-object or lock change has the same class of risk; the test specifically reproduced the owner change.
   - Fix: freeze a complete canonical scenario/version when making the proposal; visibly stale and disable Accept on any dependent edit. Revalidate and compare the version at execution on both client and server.
   - If skipped: a user approves an operation under one context and runs it under another.

5. **A refresh loses the project** (`web/src/App.tsx:76`, `docs/PRD_v0.3.md` §11/AC-25). 
   - What this is: accepted geometry, assumptions, locks, search and history are component state.
   - Problem: I changed owner expectation from Rp10bn to Rp20bn, reloaded, and the value silently returned to Rp10bn. There is no IndexedDB/localStorage persistence or tested import path. The JSON decision-record download is not a restore mechanism.
   - Fix: add versioned durable local project persistence and explicit saved/unsaved/error state; preserve current scenario and include a tested export/import recovery path. Handle local-storage denial visibly.
   - If skipped: a refresh, browser crash or tab closure loses the work.

6. **The current fallback can misinterpret numeric units** (`src/intent.ts:38`).
   - What this is: a local regex interpreter handles typed requests until a real model exists.
   - Problem: `Cap price at Rp1,000m` yields a proposal for `Rp1m`; a comma can mean a thousands separator or decimal mark depending on convention. The review proposal displays the wrong interpretation, but that is not reliable error handling.
   - Fix: accept only unambiguous documented formats and ask the user to clarify ambiguous punctuation and units. Normalize currency in a typed domain object with tests for Indonesian/English formats; keep the same validation regardless of provider.
   - If skipped: an owner may accept a ceiling three orders of magnitude off.

7. **Manual polygon edits shut down the central exploration loop** (`web/src/App.tsx:95`, `web/src/App.tsx:104`, `src/search.ts:62`).
   - What this is: a polygon edit is kept as an index-based override on a generated layout.
   - Problem: after committing a reshape, search, circulation, frontage, entrance and open-space regeneration are blocked until the user explicitly discards all reshapes. This is disclosed and protects work, but the user cannot investigate alternatives while preserving the feature they just designed. SearchRequest has no lot edits, so the solver cannot carry them.
   - Fix: make manual lots part of the versioned scenario with stable identity and explicit lock/compatibility rules; run only operations that preserve them or show a meaningful preserve-vs-discard choice before a conflicting operation. Avoid a destructive automatic reset.
   - If skipped: the product's interactive polygon feature and its signature exploration flow cannot be used together.

## Should fix

8. **Polygon validation accepts non-finite coordinates at the predicate boundary** (`src/polygon.ts:99`, `src/polygon.ts:151`).
   - What this is: `isSimple` and site containment are reusable domain functions likely to receive imported or server/model-derived data.
   - Problem: direct call `isSimple([{x:NaN,y:0},{x:10,y:0},{x:10,y:10},{x:0,y:10}])` returns true and area is NaN. The current vertex UI filters non-finite values, so that direct call is not by itself proof of a current UI exploit.
   - Fix: reject all non-finite coordinates and malformed structures at the shared domain/schema boundary, then test negative/NaN/infinite values.
   - If skipped: future imports and model/tool calls can bypass UI assumptions and generate invalid results.

9. **The model path is absent and the local parser has a limited operation contract** (`web/src/App.tsx:363`, `src/intent.ts`, `docs/MODEL_EVALUATION.md`).
   - What this is: the instruction bar currently calls `parseIntent` directly in the browser.
   - Problem: there is no application API server, model call, runtime output schema, immutable proposal version or executed model tool loop. Model evaluation is marked not run. The current deterministic badge is honest; a passing parser suite is not the model gate.
   - Fix: implement the server-side proposal/tool path below, keeping parser fallback clearly labeled. Start with the selected-open-space signature flow and no-selection clarification.
   - If skipped: the product's P0 model-tool interaction remains unproven.

10. **One component coordinates unrelated flows and is hard to verify** (`web/src/App.tsx:76`; 1,767 lines in the audited tree).
    - What this is: the same component owns geometry drafts, gestures, scenario history, file upload, economics, assistant proposals, search, comparison and export.
    - Problem: proposal state and scenario version drifted apart, and lot inputs bypass the empty-value handling used elsewhere. The monolith also makes a new server boundary easy to couple to rendering state.
    - Fix: extract a small typed scenario/state module, a proposal/search service, and focused workspace/inspector/compare components around real responsibilities. Preserve the existing pure deterministic domain modules; avoid creating a general framework.
    - If skipped: each new workflow must reason about all others and regression risk grows.

11. **The source image validation's documented envelope is incomplete** (`web/src/App.tsx:469`).
    - What this is: upload now limits size and requires the browser to decode the image, which is an improvement.
    - Problem: the code checks declared MIME and generic browser image decoding, not the actual byte format nor a 20-megapixel bound. A file mislabeled as PNG whose bytes are another browser-supported image type may decode. This is a code-path observation, not a recorded live-file reproduction in this audit.
    - Fix: inspect magic bytes for the two supported formats, decode, enforce documented byte and pixel bounds, preserve the previous accepted photo, and test all paths.
    - If skipped: unsupported content can be reported as a valid PNG/JPEG and large decoded images can strain a user's browser.

## Redesign the UI around the owner's complaint

The current settled 1440×900 page allocates a 473×414px SVG to an 1114px-wide model column; the rest is mostly empty. “Expand plan” increases it to ~637×558px but reduces the inspector and still relies on an arbitrary viewport-height cap (`PlanCanvas.tsx:86`). Primary buttons use 14px; much secondary UI uses 13px; SVG labels use 10–13 viewBox units and shrink further when fitted. The same information is spread across an upload/object rail, tool hints, prompt row, status line and a large bottom dock. Compare/review increases dock height and pushes focus away from the plan. Desktop and mobile screenshots are in the evidence folder.

Implement the v0.35 target as an integrated design, not a restyling pass:

- Give the model the full available central work area by default, centered and proportionally fitted. Use real available container dimensions, not `innerHeight * 0.46`; maintain stable camera/view across state changes. Make a focused model/compare mode available without making important actions disappear.
- Keep one compact, collapsible/resizable inspector. It follows selection: Site/Entrance, Open space, Circulation, Lot. Put upload and assumptions behind their own accessible controls; show chosen object, numeric values and current lock clearly. A selected lot may be edited without shifting the user away from the canvas.
- Show a persistent compact strip for homes, open space, road, allowance and shortfall/headroom; open detailed calculations/options/compare only as needed. Design a dedicated two-plan comparison surface with synchronized Fit and usable full plans, not two tall drawings in a short scroll region.
- Make input and primary interface text around 16px at default zoom; secondary text at least 14px target and headings 18–24px. Guarantee SVG label size in screen pixels (or use accessible overlays/selected-object detail) so 10px viewBox labels do not become 6px text. Respect 200% zoom, keyboard focus, contrast and 44px interaction targets or equivalent controls.
- Move the ask/review interaction into a small contextual composer linked to the selected object. Keep direct editing immediate. Clearly identify working plan, draft, proposal, preview and stale states. Use human terms; “Open space” must replace leftover user-facing “Green” where appropriate, without changing the underlying cost assumption.
- At 375px, use an accessible object/inspector sheet and compact summary near the canvas; stack compare when necessary. No page-level horizontal overflow, no essential control trapped below an inaccessible panel, and test on a real touch-capable browser as well as mouse emulation.
- Before committing implementation, Designer should produce a screen/state spec (working, selected lot, draft, model proposal, preview, comparison, error, mobile) with dimensions and hierarchy. Verify with browser screenshots, measured plan area/text sizes and one uninterrupted select → edit → undo → ask → compare walkthrough. An independent tester must review; don't equate a prettier static mockup with working interaction.

## LLM wiring — precise integration plan

Current seam: `web/src/App.tsx` `submitRequest` calls `parseIntent` directly; `acceptProposal` calls `runSearch` from the browser; there is no server/API. Keep `src/geometry.ts`, `src/search.ts` and `src/economics.ts` as the deterministic source of truth. Do not let an LLM draw geometry, set results or silently bypass locks.

1. Define a versioned, runtime-validated `ScenarioSnapshot` that includes site boundary/dimensions, entrance, open-space geometry/lock, lot geometry and locks, profile, selected assumed price and ceiling, owner expectation, target, cost assumptions, generator version and supported-operation envelope. Assign stable object IDs; index-only lot overrides are not sufficient across regeneration. Serialize snapshots canonically and attach a version/hash. The existing search hash omits manually edited lots and is not an authorization or collision-resistant version token.
2. Introduce a minimal server endpoint, e.g. `POST /api/intent`, receiving user text, selected object ID/type, snapshot/version and permitted operations. The browser's snapshot is untrusted: validate it and recompute all relevant geometry/finance server-side. Keep source images/notes out by default. Keep provider key server-side only. Authoritative accepted scenario may remain browser-local for a one-user prototype only if both sides validate the same full version before results are applied; document this limitation.
3. Add a provider adapter for the required Meta Model API with configuration for model/version and an injectable mock adapter for tests. Meta's official tool-calling reference documents `muse-spark-1.3` and a tool-call/result loop: https://dev.meta.ai/docs/cookbook/tool-function-calling . Official overview documents the compatible API and authentication: https://dev.meta.ai/docs/overview . Verify actual credentials, model access and exact API behavior in the environment; do not infer access from an installed CLI. Do not send sensitive snapshots to a provider without the product's clear user-facing data policy.
4. Model produces only schema-valid `clarification | limitation | proposal`, including selected object, intent operations, exact values/units, preserved locks, current/proposed values, explicit unknowns and snapshot version. A read-only `inspect_project` tool may inspect the provided version; calculations/search should be deterministic narrow functions. Use runtime schemas on every model tool argument and returned payload; enforce allowed operations, all locks and resource budgets outside the model.
5. Present a reviewable proposal. Accept performs the deterministic `generate_alternatives` and `evaluate_candidate` functions against precisely that snapshot; Reject never mutates. Do not execute mutating operations or expand a fixed price/space lock before approval. Implement an idempotency token and stale checks before applying. Handle cancellation, timeout, repeated/parallel tool calls and malicious source instructions. For multiple model tool calls, return one matching result per tool-call identifier per official protocol; cap total rounds and execution budget.
6. Bind numeric summaries to deterministic result IDs/versions. Explain facts from checked values and use deterministic text when unsupported. Do not claim affordability, compliance, valuation or market demand from the model. Distinguish geometry/input/profile/commercial status; keep a physically valid but commercially shortfall option useful.
7. Offer honest deterministic fallback when the model is unavailable; no hardcoded “connected” badge and no raw key/client bundle/log/export leakage. Keep direct interaction responsive and independent of model latency. Add adapter mock/protocol tests and then a real-key smoke test with actual tool calls; mark the real model gate blocked until genuine provider evidence exists.

Implementation order: repair findings 1–6 and protect manual-lot work; establish a typed full-scenario/version and deterministic seam; design and build the canvas-first UI; wire the model and verify with a real call; then run independent browser, security/data and human-unrehearsed evaluation. Parallelize only with clear ownership and user-authorized workflow. User-facing acceptance is in `docs/PRD_v0.35.md` U-01–U-05/L-01–L-04/R-01–R-02 plus v0.3 ACs.

Verdict: fix geometry validation, stale approvals, data loss and numeric editing first; the current UI needs a coherent canvas-first redesign before it can support confident interactive planning.
Not checked: full accessibility audit/screen-reader or real touch device, multi-user load, live Meta API call/credential availability, legal/regulatory compliance, every browser/image format, all files in `evidence/` or all future polygon shapes. The two-polygon duplicate is an engine fixture, not a demonstrated normal UI edit. Audit does not mark M2/M3 or human/model gates passed. No application files were edited for this review. The PRD v0.35 is a proposed supplement, not an automatic milestone sign-off.
