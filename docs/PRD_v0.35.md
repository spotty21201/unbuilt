# UNBUILT — Product requirements supplement v0.35

**Owner:** Spotty (Doddy Samiaji)  
**Date:** 26 October 2026 UTC  
**Status:** Draft interaction and integration refinement, based on PRD v0.3, the owner's feedback and an independent code/browser audit. This supplement is reviewable product direction, not proof that any feature, model gate or user validation has passed.

## 1. Relationship to v0.3

Read this supplement with [PRD v0.3](PRD_v0.3.md). The v0.3 financial formulas, geometry invariants, requirements, unsupported-data rules and AC-01–AC-40 remain in force. Where this supplement adds or sharpens a requirement, the more specific wording applies. Preserve the earlier PRD versions.

Owner feedback: typography is too small, the model area should be much larger, and the present interface makes users lose focus. The intent is a calm, responsive, canvas-first planning workspace that allows a professional and owner to reason about spatial and commercial consequences together.

This is not authorization to claim real-world site accuracy, commercial viability or completed model integration. Irregular-lot and entrance scope/priorities remain as recorded in v0.3; this supplement does not assign their MVP milestone.

## 2. Product outcome and interaction

The user should be able to understand the site, select an object, make a supported change, see its consequences, compare with the accepted plan and decide a next action without losing the plan or their place. Direct manipulation and a language assistant both use the same scenario and deterministic calculations. Manual interaction does not wait on the model.

### Main desktop workspace

- One resizable central workspace is the primary surface. Fit the site to the actual remaining space instead of capping canvas height at a fixed fraction of the viewport. Center the fitted site; preserve coordinates and aspect ratio. Pan/zoom changes view only, and switching between objects and options does not reset the camera.
- A compact top bar identifies the project and sample/assumption status, working/preview state, Undo/Redo and save status. Prioritize the plan over repeated explanatory status text.
- One collapsible or resizable inspector shows object selection and relevant controls. Site setup, detailed assumptions and decisions are accessible on demand. Selecting an object on canvas, object list or keyboard reveals the same inspector state. Make entrances, lots, open space and circulation visually identifiable without relying on color alone.
- A compact persistent consequences strip shows homes, open-space area, road area, land allowance and owner shortfall/headroom, clearly labeled as working or preview values. Additional calculations and options open in a resizable panel without covering the action being reviewed. Show a true baseline and meaningful deltas.
- A small contextual “Ask about this plan” entry opens the assistant near the plan or inspector. It can be collapsed and must not conceal the site or imply a model call when unavailable. Visibly identify the selected object sent with a request.
- The displayed plan, inspector, active request/proposal, comparison and relevant metrics remain attributable to one scenario version. A stale proposal or candidate cannot be accepted/applied until reviewed or regenerated against current state.

### Readability and focus

- Primary interface text and editable values target 16px at the browser's default zoom. Secondary labels target at least 14px; headings have a clear 18–24px hierarchy. Maintain sufficient contrast and visible keyboard focus. Respect browser zoom and OS text scaling.
- SVG text and interactive handles must remain legible and usable in rendered screen pixels across supported zoom and viewport sizes, not merely have a large SVG `font-size`. Use screen-space labels, a detail inspector, or appropriate label suppression when needed; do not shrink 10px SVG labels to unreadable sizes. Preserve a 44×44 CSS-pixel target or equivalent accessible keyboard action for primary pointer/touch controls.
- Selected objects, committed edits, temporary drafts, model proposals and candidate previews use distinct text labels and consistent colors/borders. The information needed for the user's current task appears near it. Avoid mixing explanatory/technical messages with the main action area.
- At 1440×900 and 1024×768 the whole site, object controls, outcomes and current action are visible together without scrolling the overall page or hiding essential controls inside nested panels. Measure actual settled geometry after resizing; no arbitrary 46vh plan cap. The fitted canvas should use the available area while leaving inspector and compact results readable.
- At 375×812, keep plan and essential outcomes near the top; use an accessible collapsible inspector/bottom sheet, scrollable internally when necessary. No horizontal page overflow and no essential controls outside the viewport. Test at 200% browser zoom and keyboard-only; report actual behavior rather than assuming mobile touch is equivalent to mouse.

### Edit and comparison behavior

- Valid direct edits commit at the documented gesture boundary with one-step Undo/Redo; multi-step polygon drafts may use explicit Apply/Cancel. Show invalid draft reason without changing the accepted plan. Empty numeric fields are incomplete, never automatic zero.
- An edited manual lot is preserved until the user explicitly discards or changes it. If a generator cannot preserve edits, offer a clear choice before any destructive replacement, and keep the working state and Undo. Merely switching the user into a dead-end where search and other major operations are all disabled is a temporary implementation limit, not the target interaction.
- Compare any two eligible snapshots at shared coordinates and matched framing; users can see both full plans and physical/economic deltas at once. A previous-layout toggle means a clearly labeled previous plan, or is explicitly named as an overlay. Do not hide new footprints under removed geometry. User actions that change assumptions or geometry mark dependent results and proposals stale.

## 3. Where the language model fits

The application model interprets intent and explains evidence. It does not determine authoritative geometry, financial quantities, locks, cost rates or feasibility. PRD v0.3 §10 remains the governing tool and safety contract.

1. A server-side `POST /api/intent` receives a bounded request: user text, current selected object ID/type, explicit supported operations, unit conventions, and a complete versioned snapshot (or a server-held snapshot ID). Do not include image bytes or private source notes automatically.
2. A provider adapter sends the model a narrowly scoped prompt and tool definitions. Use a configured Meta Model API model where access is available; the API key stays in server environment/configuration only. Check actual entitlement and model identity through a real call, not a UI badge or presence of a CLI.
3. The model proposes schema-valid operations or requests clarification. The application validates object identity, units, bounds, constraints and all existing locks independently. Before user acceptance, model calls may inspect the immutable snapshot and make bounded read-only calculations, but may not mutate the accepted working state.
4. Show a reviewable proposal with selected object, exact changes, held commitments, assumptions, scope and snapshot version. Accept executes the deterministic geometry/search/economics functions against the same validated snapshot; Reject changes nothing. A version mismatch, cancellation, duplicate acceptance, timeout or conflicting lock must not apply an obsolete result.
5. Return structured, version-bound results from the deterministic tools. Render all numbers and status axes from those results; model prose may summarize them but must never invent figures or causal explanations. Use a deterministic fallback if a generated explanation cannot be checked.
6. Missing credentials, network failure or timeout leaves direct editing and deterministic calculations usable. Clearly disclose model availability and distinguish the local parser from an actual model call. Do not report a real-model gate from mocked tests.

The browser currently holds its scenario in React state. For an initial single-user prototype, the server may receive the complete snapshot and independently validate/recompute it; do not assume untrusted client data is authoritative. Bind the proposal to a deterministic, canonical snapshot version covering site, entrance, open space, manually edited lots, assumptions, locks, profile and parameters. Recheck that version in the browser and on the server immediately before execution. Later shared/multi-user persistence would require server-side concurrency controls; it is not implied by this draft.

## 4. Data and trust requirements

- Preserve accepted project state across refresh in durable local storage with explicit saved/unsaved/failure status; export/import uses a versioned representation and reports whether the reference image is included. A decision-record export alone is not a complete project round-trip unless the importer and all required geometry/assumptions are tested.
- Treat uploaded material and model output as untrusted. Validate file bytes, dimensions and resource limits; validate model output against schemas. Treat uploaded notes as data, never as authority to invoke tools or access secrets.
- Polygon validation must catch coincident overlapping shapes and enforce stated setbacks on the actual edited shape. Do not claim a valid or applicable lot until both geometric and profile checks are true. Engineering rules remain conceptual assumptions, not legal compliance.

## 5. Acceptance additions

- **U-01:** At 1440×900 and 1024×768, a fresh loaded workbench uses the available central area for the site; essential controls and summary are visible and usable without nested scrolling. Record screenshot and settled canvas/viewport measurements.
- **U-02:** Primary text is 16px target, secondary text at least 14px target, essential plan labels legible at actual rendered size. Verify at default and 200% browser zoom; note trade-offs at mobile widths.
- **U-03:** The user can select an object, edit it, Undo, request a supported investigation, review a proposal, preview an alternative and return to the working version without losing focus, camera or scenario identity.
- **U-04:** At 375×812, no horizontal page overflow; key plan/outcome/selected-object actions are reachable by keyboard and touch; inspect a real touch-capable environment separately from mouse emulation.
- **U-05:** Two aligned selected plans and their deltas are fully visible in the comparison workspace. No false output from an opaque overlay, stale result or unsupported combination.
- **L-01:** An actual provider call returns a validated, reviewable proposal for the selected open space. An independent test records model/version, tool calls, snapshot ID and deterministic numerical results. A mock proves only the adapter/protocol path.
- **L-02:** Changing a relevant value after proposal generation prevents acceptance until the user reviews a fresh proposal. Reject, retry, timeout, duplicate acceptance, stale/out-of-order response and malicious source text never silently mutate accepted state.
- **L-03:** A server-side validated tool run produces the same geometry and economics as the manual deterministic path on the same snapshot. Provider output cannot override locks, authoritative calculations or unsupported geometry.
- **L-04:** With no key/network, manual exploration remains available and the UI truthfully identifies offline/deterministic mode. No credential is returned to the client, logged, exported or embedded in an asset.
- **R-01:** Refresh restores accepted state or offers a visible, tested recovery path, including full geometry, assumptions and locks. Saved and unsaved status is accurate.
- **R-02:** Independent polygon tests include equal/coincident polygons, touching vs overlapping edges, concave crossings, finite coordinates and minimum setbacks on edited lots. The actual supported envelope and tolerances are documented.

## 6. Release and evidence

First address incorrect geometry, state loss and stale proposals, then build the server boundary and redesign the workspace in vertical slices. The release plan must give the owner a reviewable design and preserve the stated geometry and model limits. Do not replace M2's genuine model/browser/human gates with a screenshot, a stub, passing unit tests or an agent-only walkthrough.

This supplement was informed by the code/browser audit prompt and screenshots in `evidence/product-audit-2026-10-26/`. Exact runtime capabilities should be verified against the provider's current documentation and actual account access. A prototype may use mocks for development, clearly labeled as such.
