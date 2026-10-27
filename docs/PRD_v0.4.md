# UNBUILT — Product Requirements Document v0.4

Version 0.4, 27 October 2026. Self-contained successor to v0.3 (with v0.35 supplement). Where this document is silent, v0.3 governs; where they conflict, v0.4 governs. Preserved unchanged: `docs/PRD_v0.2.md`, `docs/PRD_v0.3.md`, `docs/PRD_v0.35.md`, root `UNBUILT_PRD_v0.2.md`.

## 1. Audience and problem

Professional users (master planners, architects, feasibility managers, owners) need a drawing-first planning tool for early residential feasibility: a legible plan, measurable consequences of spatial choices, and honest comparisons — usable while leading an owner discussion. Prior builds proved the engine but presented a small plan surrounded by repetitive controls; reviewers would not lead an unsupervised owner discussion with it. v0.4 rebuilds the workspace around the canvas and wires an assistant that connects spatial changes to calculations through validated deterministic tools.

## 2. Product promise (unchanged)

Bring a site. Explore possible residential futures. Understand what each would require. Tagline: Find the future that works. Working name: UNBUILT.

The defining interaction: select a green-space region → "Keep this green space. Do not increase the home selling price. What else can change?" → review explicit commitments → run an actual bounded investigation → see the changed plan, quantities, economics, and remaining conflict. An honest unsuccessful search is useful. A fabricated successful layout is not.

## 3. Physical contracts (carried from v0.3)

- Local Cartesian meters, y-up from the south edge. No georeferencing, no CRS, no map import.
- Flat rectangular sites only (declared/confirmed boundary; photo never measures). Irregular outer boundary is a separate, unbuilt capability (AC-40).
- Axis-aligned generated circulation (spine/loop families) and rectangular lots; individually reshaped lots are simple polygons (≤12 corners) that must keep the placed home, a 2 m setback ring, road access, and clear neighbors. Homes never move. Holes and multipolygons are out.
- Compound entrance `{edge west|east, offset, width 8 m}`; circulation derives from the gate; a gate the road network cannot reach never commits.
- Open space is shared landscaped green with explicit cost basis — never private lot garden, never a tree inventory. A lock preserves shape AND location (1 mm).
- Setbacks 2 m sides, 3 m front/rear, verified 2 m uniform on reshaped lots (3 m labeled unverified). Footprints 10×6 m placed centered/rotated.
- Area reconciliation is exact: parcels + roads + green + unallocated remainder = site. Unknown cost is never zero; invalid geometry never qualifies.

## 4. Financial contracts (carried from v0.3)

- Revenue = homes × assumed price; selling costs 3%; non-land costs from measured quantities plus declared setup/other/contingency/professional allowances; target surplus fraction; residual land allowance; owner gap vs expectation.
- **Land allowance** = what the land is worth to the scheme before paying the owner. **Surplus** additionally subtracts the owner's asking price. Positive allowance with negative surplus means the scheme works but not at this price.
- Buyer-price ceiling is distinct from assumed achievable price. No silent changes to price, expectation, return, or profile. Negative allowance and undefined ratios preserved exactly.
- Sample rates/notes are fictional and labeled; on custom sites, sample pricing is explicitly provisional, never evidence.

## 5. Candidate status and search (carried from v0.3)

Bounded deterministic enumeration over circulation families × frontages (seed 7, budget ≤250, seed recorded, snapshot hash covers all material inputs including carried lot edits). Per-combo counts reported separately: geometrically valid, profile-fit, within ceiling, target-surplus-compliant. Shown alternatives are the top distinct outcomes (fewer than three shown when fewer qualify). The owner expectation is a **benchmark**, never a counted constraint or a "met constraint" claim. Manual lot reshapes carry by stable base-rect identity wherever the tested geometry reproduces them; incompatible combos run clean, and applying a geometry that removes reshaped lots requires an explicit preserve-vs-discard choice.

## 6. The assistant: three questions

The integrated product must answer, for the current plan:

1. **What is true in this plan?** Selected object, geometry, quantities, commitments, assumptions, validity, commercial outcome — with observed/calculated results distinguished from estimates and unknowns.
2. **Why did it change?** Two immutable versions, measured deltas in homes/road/open space/cost drivers/allowance, every quantitative statement tied to deterministic outputs. No cause assigned without evidence.
3. **What could we try?** A bounded investigation proposal: what would change, which locks hold, what is uncertain, what the engine will test. Read-only counterfactuals run against immutable snapshots; applying anything requires explicit acceptance.

Workflow: selection/context → intent/clarification → proposed investigation → validated tool execution → grounded explanation → preview/compare → explicit Apply/Undo/decision. A plain language question may be read-only; nobody is forced through a proposal dialog to ask "why". Accepted commitments and working geometry change only by explicit, reviewable action. Proposals freeze their scenario version; any later edit stales them and blocks acceptance until re-reviewed.

## 7. Assistant boundaries (model contract)

- The model reasons, asks follow-ups, suggests strategies, and explains trade-offs. Its proposals are hypotheses until the deterministic engine tests them.
- It never invents a site, rate, market value, legal compliance, feasible layout, or monetary result. Authoritative numbers come only from validated tools; prose that cannot be reconciled falls back to deterministic explanation.
- Narrow typed tools only, all actually implemented: `inspect_scenario`, `inspect_selected_object`, `evaluate_current`, `compare_versions`, `generate_alternatives`, `test_counterfactual` (only where the engine supports it), `propose_commitment_changes` (returns a proposal, never applies). Every call validated: schema, identity, units, finiteness, price scope, locks, budget. Bounded rounds/time, safe errors.
- Structured answers: short interpretation; facts with units and tool/result references; assumptions and unknowns with provenance; labeled hypotheses; exact proposal scope on requested change; results with independent statuses. No generated number without a source.
- Required-price vs achievable-price and benchmark-vs-constraint distinctions are rendered from the product contract, never softened.
- Provider state is strictly separate from the app: no key/network/timeout leaves manual planning, calculations, and a truthfully labeled fallback intact. No automatic upload of private images or notes; image sending needs explicit consent with provider/data disclosure. Explanations bind to immutable result IDs. Duplicate acceptance is blocked by idempotency; stale/out-of-order responses cannot mutate the plan.

## 8. Staged capabilities and sequencing (proposal — owner decision required)

v0.3 left milestone priorities for these unassigned; v0.4 proposes, the owner disposes. Nothing below claims owner approval.

| Capability | Status in v0.4 | Proposed milestone |
|---|---|---|
| Irregular individual lots (simple polygons, staged limits above) | Implemented behind validation + carry rules | Immediate (current slice) |
| Movable compound entrance, west+east | Implemented, connectivity-proven | Immediate (current slice) |
| Shared open-space terminology + cost basis | Implemented | Immediate (current slice) |
| Irregular outer boundary | Explicitly unsupported; no silent bounding-box substitution | Separate release, needs domain design |
| North/south entrance edges | Unsupported | Separate release |
| Road drawing, lot split/merge, home relocation | Unsupported | Separate release |
| Saved schemes/comparisons | Unsupported (snapshots are run-only) | Separate release |
| DXF/IFC, FAR/zoning, solar, runoff, CRS, 3D, accounts | Excluded (consultant mockup claims, not requirements) | Not planned |

Material scope choices flagged: polygon holes/multipolygons, auto-relocating homes, and full-edge entrance support each need real solver work, not UI stand-ins.

## 9. Truth table

| Axis | Values | Rule |
|---|---|---|
| Evidence | Supplied / confirmed / assumed / unknown | Confirmed = user-confirmed boundary/scale; assumed = generated defaults labeled "assumed — review"; unknown = shown as unknown, never zero-filled |
| Plan state | Working / draft / preview / hypothetical / saved | Drafts ghost over dimmed committed plans with metrics labeled; previews rebuild from run snapshots; hypotheticals isolated and labeled; saved = accepted plan only |
| Validity | Geometry-valid / profile-fit / within-ceiling / target-ok / owner-benchmark | First four counted separately per search; the benchmark is reported best-first, never as a met constraint |
| Open space | Shared landscaped green, explicit surface + cost | Not private garden; amenity suitability not assessed |

## 10. Source images

PNG/JPEG only, verified by signature bytes, 10 MB maximum, 20 MP maximum, actual decode required; failures keep the last valid photo with a reason. Photos are reference-only illustrations retained across confirmation and Undo, removable by explicit action; never geometry, never calibration. Dimension-only rectangles may be modeled from independently confirmed dimensions but never presented as image calibration. AC-03 calibration (overlay / known-length methods) remains unbuilt.

## 11. Export, persistence, comparison

- Versioned JSON export/import of the accepted plan: units, scenario version, objects/locks, entrance, site/lot/open-space geometry, assumptions, provenance, calculated results, exclusions. Append-only events separate from current state. Photos never persist; restores say so. Refusals carry reasons; nothing partially restores.
- Durable local persistence with visible saved/failed status and a stated save contract (accepted plan, assumptions, reshapes, event log — not searches, comparisons, drafts, undo, photos).
- Two eligible versions compared with aligned coordinates, Fit both, measured deltas, priced-at assumptions; cameras preserved per canvas. Saved comparisons reflect implementation (run-only), never mockup "Scenario A1" text.

## 12. Acceptance and gates

Retain AC-01–AC-40 and the U/L/R criteria with the mapping in `docs/ACCEPTANCE.md` (v0.4 rows continue past AC-63; v0.3 IDs/priorities stand). New coverage: model tool round trip, unsupported requests, stale/concurrent proposals, cancellation, lock preservation, verified calculations, honest zero-result, storage, keyboard, responsive rendering, human unrehearsed task. Priorities and evidence per row; agent walkthrough is never human validation.

Gates (all honest, none auto-passed): M2 signature interaction, M3 journey, model tool round trip (only a real authorized call counts — mock, parser, scripted answers, and screenshots do not substitute), browser behavior at named viewports, human unrehearsed planning.

## 13. Revision and evidence map

- Owner-driven changes vs v0.3/v0.35: canvas-first workspace (§14), assistant three-question contract (§6–7), staged-capability sequencing proposal (§8), truth table (§9), benchmark language (§5).
- Stitch suggestions adopted: light drafting field + slate frame, centered canvas primacy, contextual inspector, compact consequences strip, selection-bound assistant entry, token system. Rejected/overridden: 9–12 px text, 20–28 px controls, 4 px handles, hidden scrollbars, dark canvas, cyan/green accents as specified.
- Mockup capabilities excluded as requirements: solar hours, zoning/FAR/legal setbacks, runoff, 1:250 scale claim, EPSG:27700, 142-home yield, DXF/IFC, R-3, "Deterministic: Validated" badge, sub-50 ms / 60 fps claims. A technical grid is illustrative, labeled, and consistent with the local coordinate system.
- Timestamps/build IDs appear only where evidenced (decision log, handoffs). Screenshots are references, never proof of behavior.

## 14. Workspace (implements REDESIGN-SPEC as adopted in `docs/DESIGN.md`)

Compact top bar (project, scenario state, Undo/Redo, save status, truthful model status). Flexible centered canvas using available area (no fixed height cap), stable pan/zoom/Fit, readable dimensions and selection. Minimal tool rail with labeled supported tools only — Select, Pan, and reshape-through-selection; no Split/zoning/road-draw/3D/DXF stand-ins. Contextual inspector for Site, Entrance, Open space, Circulation, Lot; object list and canvas mirror selection; shape/location lock semantics preserved exactly. Persistent outcomes strip with same-version deltas; details on demand. Selection-bound "Ask about this plan", expandable without covering the site, with an explicit assistant-state indicator (ready/thinking/clarifying/hypothesizing/proposing/reporting/unavailable). Dedicated comparison workspace for two distinct snapshots with aligned camera and traceable deltas; stale blocked or regenerated.
