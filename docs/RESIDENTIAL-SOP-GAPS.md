# Residential SOP v2.0 baseline and implementation plan

**Latest continuation:** the step-by-step updated matrix and implementation
evidence are in [SOP-CONTINUATION.md](SOP-CONTINUATION.md) and
[the continuation report](../evidence/sop-continuation/REPORT.md). The matrix and
remaining-work section below record the earlier increment, retained as history.

1 November 2026. Owner's SOP supersedes rectangular-preparation, single-product,
house-feasibility-first and roadmap authorization restrictions. Existing PRDs and
uncommitted work are preserved. Baseline: running production planner at 5173,
`evidence/residential-sop/baseline.png` and `baseline-ui.txt`; full existing root
suite passed (`/tmp/unbuilt-sop-baseline.log`). Inspection covered App state,
geometry, road surfaces, site context, parcels, housing, open spaces, persistence,
project library, alternatives, source/calibration UI and browser tests.

Status below describes the observed baseline, not a promise or inferred demo.

| SOP | Baseline status and code evidence | Gap | Planned change | Verification |
|---|---|---|---|---|
| 1 assignment | Partial: `brief.ts`, App session-only brief | Objective/source/unknowns not durable | Durable residential brief with separated inputs | round trip |
| 2 boundary | Partial: `boundary.ts`, BoundaryEditor, SiteContextEditor validate simple polygons, CSV/DXF and raster calibration | Independent dimension check and survey assurance incomplete | Reuse accepted outline; explicit boundary lock/source/calibration; coordinate editing | rectangle, angled, concave, neck invariance |
| 3 adjoining roads | Missing: `site-context.ts` annotations explicitly non-operative | No access eligibility model | External alignment, ROW/carriageway, permitted gate intervals | prohibited frontage test |
| 4 entrances | Partial: `access.ts`, EntranceEditor moves apron and generated routing | No owner-fixed entrance lock or serving external road | Explicit fixed/adjustable entrance and real connection regeneration | move, lock, cancel |
| 5 protection | Partial: `open-spaces.ts` locked polygon with bbox clearance | Feature versus envelope and prohibition not separate | Original polygon and measured buffer, fixed reservations | encroachment rejection |
| 6 products | Missing: `housing.ts` describes houses, `schema.ts` profile is pricing eligibility | One frontage/depth generator, house fit gates small lots | Separate stable lot products and dimensional checks | multiple sizes, area/depth/taper |
| 7 mix/groups | Missing: housing assignment is not lot product allocation | No target denominator or coherent street groups | Street-section allocations shared by both sides, counts/area targets | integer mix and allocation search |
| 8 road inputs | Partial: `streets.ts` full 6–12 m width, `road-surfaces.ts` kerb fillets | ROW conflated with pavement, missing requirements | Corridor versus carriageway; explicit unknowns, bounded entrance widening | footprint widths |
| 9 entrance connection | Partial: `access.ts` real apron | No external-road physical dependency | Gate/transition footprint and external dependency checks | move entrance and compare |
| 10 structure | Implemented within limits: manual angled networks/branches/loops | Rectangle-dependent lot generation | Reuse unioned corridor engine; generate off actual kerbs | concave and narrow-neck |
| 11 junctions/curves | Partial: actual polygonised kerb fillets already measured | No swept vehicle or designed centreline curves | Reuse physical returns; regenerate bordering lots; unknown vehicle checks | return area/lot changes |
| 12 blocks/groups | Partial: `parcels.ts` rectangular connected blocks | Arbitrary development polygons/groups missing | Polygon subtraction and deliberate street sections | holes and protected subtraction |
| 13 lots | Partial: `geometry.ts` rectangular generated lots | Products/rotated polygons not coupled to workbench | Polygon lot records, actual frontage/depth/area | real polygon tests |
| 14 curved/corner | Partial: polygon reshapes, separate `rotated.ts` engine | Not generated from actual kerbs or taper rules | Curb-chain candidates and declared depth/taper checks | irregular and rounded road fixtures |
| 15 residual | Partial: `residual.ts` classification only | No permitted-product fill | Bounded dimensional fill trials and explicit residual reasons | feasible and blocked fill |
| 16 rebalance | Missing: search changes global frontage only | Product geometry not changed by mix | Bounded whole-section allocation search | composition recalculation |
| 17 coupled edits | Partial: App parameter drafts regenerate, held manual edits block | No product-dependent polygon graph | Residential preview/accept transaction, stable lot identities and locks | road/product changes, undo |
| 18 protection checks | Partial: polygon guard plus conservative bbox avoidance | Need actual buffered exclusions | Actual intersections after every edit | fixed shape/encroachment |
| 19 flexible space | Partial: OpenSpacesEditor real polygons/minimums | Access/function not established | Flexible polygon with minima, function and access checks | reshape and regenerate |
| 20 land budget | Partial: quantities + `residual.ts` polygon subtraction | Protection/reservations not separately reconciled | Union-based partition; explicit overlap/gap tolerance | junction union + reconciliation |
| 21 schedules | Partial: housing/parcel counts from current layout | Valid/unresolved/invalid products absent | Same-scenario lot/product/group schedules | reproduce sums |
| 22 costs | Partial: existing economics has global defaults | Missing rates treated as assumptions, no product lot rates | Valid count × optional scoped rate, missing cost list | zero and missing rates |
| 23 scorecard | Partial: real areas and existing economics | Objective is finance-heavy, road length proxy | Residential yield, actual centreline length, mix, status and scoped costs | independently recompute |
| 24 alternatives | Partial: `search.ts` Spine/Loop/global frontage; saved geometry genuine | No multi-product alternatives | Bounded real road/allocation candidates, organising idea/tradeoff | distinct geometry |
| 25 ranking | Partial: finance/search sorts | No fixed→mix→objective gates | Transparent qualification and declared objective ordering | unknowns exclude qualification |
| 26 selection | Partial: `SavedAlternatives.tsx` snapshots and notes | New polygon scenarios unsupported | Named residential alternatives, common-frame comparison, shortlist and reasons | selection and reopen |
| transactions/history | Implemented for existing supported edits: App, `draft.ts` | Polygon product state absent | One accepted residential operation per undo; cancel preserves state | browser and integration |
| project lifecycle | Implemented: Projects, `projects.ts`, `persist.ts` | New data must not disappear on old tools | Additive versioned project field, legacy unchanged; save/export/import | legacy and new round trips |

Implementation stages: additive domain/persistence; deterministic road/land/lot
engine; central plan and transactional editor; schedules/search/alternatives;
fixtures and browser evidence. This is a separate residential scenario within the
same project; accepting it never rewrites legacy Rect allocations. Importing the
existing inputs is explicit, and limitations are reported in the final evidence.

## Verified result of this increment

Evidence and reproducible commands: `evidence/residential-sop/REPORT.md`.
“Implemented” below means the bounded behavior described, not all future
interpretations of a domain step. The SOP as a whole is **not yet complete**.

| Steps | Current status | Implemented code/evidence | Remaining work |
|---|---|---|---|
| 1 | Implemented | `residential.ts` inputs, ResidentialPlanner brief; project roundtrip | Custom objectives are recorded and manually compared, without an invented formula |
| 2 | Partial | Reused boundary/import tools; locked metre-coordinate polygon, source and check record; 4 boundary fixtures | Independent check is a recorded input, not a second calibration computation; existing 0–500 m local frame |
| 3–4 | Partial | Real external alignment/width, explicit eligible intervals, locked or adjustable gate, perpendicular transition and measured off-site connection | One entrance; off-site permission/design remains unknown; an external ROW extending into the site is a blocker requiring separate resolution |
| 5 | Partial | Original feature, measured rounded protection envelope, actual intersections, fixed geometry, buffer provenance | Selective permissions remain conservatively reserved; approved crossings cannot yet be designed |
| 6 | Implemented | Stable lot products, frontage/depth/area variation, taper, saleable ceiling, colour and optional scoped per-lot rates | House design and statutory criteria stay separate |
| 7 | Partial | Coherent facing groups, percentage/count targets, denominator, tolerance, mandatory/preferred and largest remainder | Opposing-side exceptions are not implemented; both sides always share the section product |
| 8–11 | Partial | Full corridor union, separate carriageway input, bounded entrance taper, connected polylines, real corner-return additions and conflicts | Designed centreline arcs, turning vehicles, detailed entrance engineering and junction-angle exceptions remain unresolved |
| 12–13 | Implemented within supported rules | Hole-aware block subtraction, section products, actual polygon lots with serving-road/group records and dimensional validation | Greedy deterministic subdivision, not optimal packing; conservative rejects remain residual |
| 14–15 | Partial | Actual polygonised curved frontage, primary-frontage measurements, 3-ray usable depth, actual maximum depth, rear ratio, saleable cap and actual-residual fill | Difficult curve/corner cases can be rejected; no automatic road relocation/rotation driven by residual analysis |
| 16–17 | Implemented within supported rules | Draft mix rebalance tests allocations/transition positions, coupled road/product regeneration, locks and explicit preview/accept/cancel | Search is at most 64 configurations; unaffected polygons regenerate and may change phase; only held lots are guaranteed verbatim |
| 18 | Implemented for no-touch protection | Envelope checks run on every preview and restore; fixed feature tests | Conditional crossing authorisation does not remove geometry blockers |
| 19 | Partial | Flexible polygon edges, minimum area, intended function, boundary containment and measured road access; browser reshape evidence | Location commitments beyond fixed geometry/locks are brief text, not an additional permitted-region constraint |
| 20–23 | Implemented within declared measurements | Polygon unions/differences, separate physical/valid lot areas, gap/overlap tolerance, schedules, integer mix, cost scopes, true road length, undefined zero-count ratios | Costs are supplied assumptions; scope partially covered by lot rates stays visibly incomplete |
| 24–25 | Partial | Distinct road and section-allocation alternatives, same metric definitions, explicit constraint gates and declared objective ordering | Small bounded candidate set, no global optimum proof, no entrance/orientation search; unknown vehicle/off-site checks prevent qualification |
| 26 | Partial | Named snapshots, same-frame comparison, client shortlist up to 2, reasons, reviewed selection, full project export/reopen | Combining scenarios is not implemented; residential study and legacy plan remain explicitly separate geometry contracts |
| Transactions | Implemented inside residential editor | Failed preview preserves accepted state; acceptance is one undoable geometry/schedule operation; exact Undo/Redo tested | Residential history is session-only and ends when this editor closes; legacy and residential histories are separate |
| Persistence/lifecycle | Implemented | Project v15 / record v16; all older formats still readable; canonical recomputation rejects tampered saved schedules; legacy lifecycle suites pass | New residential data requires this app version; source media and undo history remain outside backups |
