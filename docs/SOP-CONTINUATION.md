# SOP continuation — owner request of 1 November 2026 (client date)

The owner requests continuing all 26 SOP steps, with particular corrections to
external-road-first site setup, fixed supplied natural-feature geometry and
irregular proposed open space. This work preserves the existing dirty tree and
all project formats. A visible control or stored note is not completion evidence.

Implementation and verification order:

1. Site-input stage before generation; boundary/source/scale; actual external
   alignment and access-derived entrances; supplied natural-feature polygons;
   freely drawn/imported irregular flexible spaces.
2. Road and access structure: multiple permitted entrances, true centreline
   curves, corridor/junction/turning geometry and explicit screening requirements.
3. Protection permissions and authorisations, space location/access commitments,
   opposing-group exceptions, manual lot adjustment and residual classification.
4. Product/mix refinement, broader bounded alternatives, transparent ranking,
   selection/combination and complete issue records.
5. Complete transactional history, safe format evolution, source/calibration,
   async previews, schedules and browser workflow checks against all 26 steps.

Version 1 residential calculations are frozen in `src/residential-v1.ts` so the
new physical road/protection rules cannot silently rewrite existing projects.
Version 2 is an explicit reviewed upgrade. Unknown statutory/house checks remain
external; implemented engineering screening must name its actual method.

Progress and evidence will be appended as each increment is verified.

## Implemented workflow and scope changes

This continuation replaces the previous assumed-entrance/rectangular-space start
with a version 2 **site-input stage**. A study can be saved before there is an
entrance, road network, product or lot. Start with the boundary and actual main
road, mark permitted physical frontage, then deliberately choose a gate. Nothing
uses a site centroid to choose access. Existing rectangular finance/house plans
remain separate and intact; the residential study is the SOP workflow.

Earlier prepared-rectangle, single-product, 0–500 m residential-frame and
house-feasibility-first restrictions do not apply to this workflow. Existing
legacy tools retain their own contracts. New local boundary coordinates permit
±100,000 m and arbitrary simple outlines within the documented vertex limits.
There is no geographic CRS conversion or terrain/house optimization.

### Evidence-backed gap matrix

“Implemented” means the concrete bounded behavior below; it does not mean an
engineering approval, exhaustive packing search or a global maximum. The
baseline column describes the application actually inspected at the beginning
of this continuation, including the prior residential increment.

| SOP | Observed baseline and code evidence | Gap | Implemented change / current status | Verification |
|---|---|---|---|---|
| 1 Assignment | Implemented: residential brief fields | Keep identity and unknowns durable | **Implemented**: project/scenario identity; objective, fixed requirements, preferences, variables, source and unknowns; declared custom objective remains manual | workspace/project round trips; procedure review |
| 2 Boundary | Partial: locked coordinate outline; calibration/check were labels or separate legacy tools | No independent calculated dimension or direct tracing here | **Implemented within import limits**: metre/feet/mm GeoJSON/CSV, straight ASCII DXF boundary, source raster/PDF tracing and two-point calibration, independent measured dimension, explicit unlock; generation never changes boundary | four outline fixtures; scale-browser; wrong dimension rejection |
| 3 Existing roads | Partial: a presumed west-edge line in `fromLegacy` | Main road did not precede gate choice; no physical adjacency restriction | **Implemented**: draw/import actual polyline, separate ROW/carriageway/source/lock, physical contact intervals intersect explicit eligible frontage; restricted remainder; existing ROW inside site is separate reservation | south-road-first browser; ROW-area and refused remote-road tests |
| 4 Entrance strategy | Partial: single gate supplied at initial setup | Additional permitted gates/candidates unavailable | **Implemented**: primary plus up to seven explicit additional entrances, candidate permission, role/movements/locks, actual local road tangent, owner connection decision; adjustable gate rebuilds dependent geometry | entrance movement/cancel/locks browser; additional-gate tests |
| 5 Given features | Partial: fixed rectangles initially; coordinate polygons later | No supplied-source shape/holes/line source, selective permissions or crossing authorization | **Implemented**: original irregular polygon/holes or buffered river alignment, source position retained even beyond site; protection envelope, prohibition, named-road crossing envelope and decision; explicit authorized source correction retains previous geometry | imported seven-corner wetland/hole browser; crossing/prohibition/correction tests |
| 6 Products | Implemented dimensional products | Preserve definitions while editing | **Implemented**: stable ID/name/colour, nominal and variable frontage/depth, area/taper/irregular/saleable limits, optional scoped rate; unused product removal | dimensional, saleable cap and scoped-cost tests |
| 7 Mix/groups | Partial: both sides always matched | No explicit side exception | **Implemented**: deliberate street intervals, both/left/right groups, facing mismatch fails unless reason recorded; unit/area target denominator, counts, tolerance, mandatory status, largest remainder | side-specific tests; coupled group-change/rebalance browser |
| 8 Road inputs | Partial: fields existed but centreline radius was not built | Actual curves/turning footprint and missing inputs | **Implemented**: corridor/carriageway distinction, curve minimum, junction angle/tolerance/exception, returns, turning requirement, bounded gate widening; provisional/missing inputs remain visible | width/neck/curve/angle/vehicle tests |
| 9 Entrance connection | Partial: apron and off-site strip | Main-road tangent and external junction returns absent | **Implemented geometry**: perpendicular local-road connection, widening/transition, full exterior junction footprint and corner returns; inside/off-site portions measured separately, dependency/permission unknown unless recorded | changed connections and lot polygons; advanced curved fixture |
| 10 Road structure | Partial: line segments and branches | No designed centreline arcs; limited start workflow | **Implemented within network limits**: draw straight/bent streets, radius arcs, connected branches/loops, full-corridor containment, explicit entrance continuity; locks preserved | constrained neck, curved network, loop search, move-road browser |
| 11 Junctions/curves | Partial: polygonised kerb fillets; vehicle always unknown | Centreline curves and configured turning heads missing | **Implemented bounded geometry/screening; detailed manoeuvres unresolved**: real tangent arcs, junction-only returns, angle checks/exceptions, disk turning heads, declared rigid-body corridor sweep and conservative circular head envelope. Junction turning movements remain explicitly unknown | analytic arc length, radius-fit failure, curve+return regression, real screening pass/fail fixture |
| 12 Blocks/groups | Implemented polygon subtraction | Groups needed sides and geometry-guided spacing | **Implemented**: actual corridor/protection/reservation subtraction; groups remain street sections, not blocks; parallel-loop trials use two product depths plus corridor spacing | land unions, side groups, meaningful structure search |
| 13 Nominal lots | Implemented kerb-chain polygon generation | Preserve same-scenario identities and counts | **Implemented bounded generation**: actual curb frontage, product/group/street relationships, polygon validation; count only passing lots | all four site fixtures; schedule sums; manual lot regression |
| 14 Curved/corner lots | Partial: irregular curb lots; held frontage used one edge | Holding a curved lot could lose its full primary frontage | **Implemented declared measurement method**: whole primary curb chain, three usable-depth rays, polygon area, taper/saleable limits; actual returns removed before lots. Detailed house fit remains separate | curved multi-vertex lot and held-curb-chain tests |
| 15 Boundary/residuals | Partial: bounded dimension fill; aggregate skipped reasons | No per-component residual assessment/manual outline editor | **Implemented bounded/manual refinement**: permitted widths/depths, actual residual components and access/size reasons, street/group/flexible-edge adjustment and manual held polygons. No claim every feasible packing is found | positive/blocked fill, inaccessible/oversize rejection; advanced manual polygon edit |
| 16 Rebalance | Implemented section-allocation search | Search blocked UI; count-mode presentation needed care | **Implemented bounded search**: async whole-section allocations, real regenerated geometry, integer/area denominator and tolerance; count targets/deviation displayed in units, actual shares separately | mandatory mix browser; integer arithmetic tests |
| 17 Coupled iteration | Partial: synchronous previews, local dialog history | Responsiveness and saved identity preservation | **Implemented**: cancelable background calculation/search, pending quantities, stale proposals discarded, accepted-state preservation, lock guards, complete operation history; saved alternative edits fork revisions | cancel/failure/undo/redo, move-road/group/space browsers |
| 18 Protection recheck | Partial: conservative blanket exclusions | Authorized crossing/selective land prohibition absent | **Implemented**: actual original/envelope intersections on every affected calculation; named road and approved envelope/reference/date/authority; unauthorized fixed-source changes rejected | selective-road/lot protection, crossing and fixed-source correction tests |
| 19 Flexible space | Partial: polygon coordinate editing, rectangular creation | Free irregular drawing/import, holes, location commitment, safe removal missing | **Implemented geometry/commitments**: arbitrary polygon corners/imported holes, minimum area, road-edge access, function and permitted location region; whole movement carries holes; locked/fixed geometry resists dragging; commitment releases accepted separately | five-corner drawing; coupled reshape; min/location/access failure tests |
| 20 Land reconciliation | Implemented internal unions | External ROW, selective allocations and functional overlays incomplete | **Implemented**: six physical categories, external ROW reservation, original feature/overlays separately identified; actual unions and subtraction, gap/overlap reported, 0.01 m² tolerance | all fixture partitions, junction overlap, selective protection tests |
| 21 Schedules | Implemented measured product/lot schedules | Stale quantities during pending edits and count labels | **Implemented**: same-scenario results; accepted quantities clearly retained while pending/failed; valid/unresolved/invalid, measured lots, groups, targets/counts/shares/deviation, areas and CSV; no fabricated estimates | computed schedules and browser quantity deltas |
| 22 Costs | Implemented scoped optional lot/common rates | Verify changed geometry/counts and scope duplication | **Implemented**: valid count × supplied scoped rate, source/date, missing rates unpriced, measured road m/m² and space m²; duplicate common scope refused | cost arithmetic tests and advanced priced browser fixture |
| 23 Scorecard | Implemented basic residential metrics | Needed fixed/flexible totals and new check status | **Implemented**: gross, counts, actual valid area, internal roads/length/per-lot, protection/flexible/residual, cost and missing scopes, constraints; zero-denominator metrics undefined | four fixtures and priced/current-scenario browser |
| 24 Alternatives | Partial: road shift and product allocations only | Gate candidates, structure and flexible-edge variants missing | **Implemented bounded search**: explicitly permitted gates, unlocked alignments, parallel return-loop structure, section allocation and flexible edges; at most 64 trials, retain up to five distinct credible tests | spatial distinctness/locks/search-conflict tests; compare browser |
| 25 Ranking | Partial: count of issues before objective | Avoid implicit weighting of issue counts | **Implemented**: fixed fail/unknown gates, mandatory mix/group gates, declared objective and visible road trade-off; custom objective is manual. Best found among tested candidates only | constrained search/ranking tests; comparison/qualified fixture |
| 26 Select/issue | Partial: shortlist/reasons; accepted-only residential import | Combination and full collection persistence absent | **Implemented**: one/two shortlist, reasons, same-frame comparison, combination creates new ID/parents and recalculates; complete collection merge/import/export preserves existing alternatives and refuses capacity loss | combined/scoped-cost browser; collection merge and full project v17 round trips |
| Transactions/history | Partial: local synchronous operation stack lost when dialog closed | Background failure/race and reopening behavior | **Implemented**: coherent preview/accept/cancel, one undo for complete geometry+schedule+decisions; close/reopen retains session history. Reload retains accepted scenario, not undo stack | site and coupled browser tests |
| Existing project lifecycle | Implemented in legacy app | New formats must preserve old user projects | **Implemented additive versioning**: v1 residential calculator frozen, reviewed v2 upgrade, project v16 / decision record v17; old formats retained, no silent geometry migration | original 95 residential checks, frozen identity test, project lifecycle/touch/browser regression |

### Source files

Domain: `src/residential.ts`, `src/residential-site.ts`,
`src/residential-inputs.ts`, `src/residential-procedure.ts`,
`src/residential-fixtures.ts`, frozen `src/residential-v1.ts`.
Road-return reuse: optional junction-only calculation in `src/road-surfaces.ts`
leaves its existing one-argument behavior intact. Persistence: `src/persist.ts`.

Interface: `web/src/unbuilt/ResidentialPlanner.tsx`, `ResidentialCanvas.tsx`,
`ResidentialSiteTools.tsx`, `useResidentialPreview.ts`,
`residential.worker.ts`, `residential-view.ts`, `residential.css`.
Integration: `web/src/App.tsx`. Tests and evidence are referenced in
`evidence/sop-continuation/REPORT.md`. Existing unrelated dirty work was retained;
no commit, push or deployment was made.

### Limits and next priorities

- Real survey/access/protection/turning inputs and rate provenance have not been
  supplied. Source scale/authority are planner inputs, with a calculated
  independent dimension where supplied; the app cannot authenticate a survey or
  legal permission.
- Rigid-body screening is not steering/axle/articulated-vehicle simulation. All
  junction movements, detailed manoeuvres, off-site design assurance, house fit
  and statutory approval require separate checks. The app distinguishes these
  unknowns and never converts them into approval.
- Kerb/centreline arcs use maximum chord deviations of approximately 5/2 mm;
  calculations snap to micrometre coordinates, compare linear measures within
  1 mm and reconcile physical land within 0.01 m². Irregular usable depth uses
  10/50/90% frontage-chord rays; taper is rear/front span. These are declared
  screening methods, not statutory dimension definitions.
- Generation is greedy and bounded (5,000 lots, 1,000 placements per curb-chain
  pass; 64 alternative trials; 20 saved alternatives). It can miss feasible
  layouts. The next yield priority is independent planner benchmarks and a
  broader routing/packing search, with the same locks and deterministic checks.
- Imports support local-coordinate GeoJSON/CSV and closed straight ASCII DXF
  site outlines. Geographic reprojection, CAD curved-entity import, automatic
  feature recognition and rich CAD editing are not implemented. PDF tracing
  initially uses page 1; reattachment honors the saved page. Source media must
  be reattached after reload; their calibration/fingerprint remain saved.
- Existing Rect/house/finance/AI work stays separate from residential scenarios.
  Shared legacy-tool migration remains a later integration project; there is no
  automatic conversion of manually edited houses into lot products.
- Current browser verification is Chromium desktop, responsive widths and the
  existing lifecycle suite’s emulated touch. Safari, screen-reader testing,
  physical touch devices and independent engineering review remain next checks.


## Owner clarification — 2 November 2026

The road-first setup existed but was too dispersed and still required manual
street/group construction before any useful layout. The six concrete concerns
are addressed by the connected **Prepare Layout** increment, documented in
[PREPARE-LAYOUT.md](PREPARE-LAYOUT.md), including an evidence-backed baseline/change
matrix. Named width-controlled adjoining road drawing, a product/unit-mix table,
auto street/loop/lot preparation with access-derived gate, explicit termination
choice, shared-node mouse editing and complete transactions are implemented.
Actual supplied natural-feature geometry and irregular open spaces are retained.
See `evidence/prepare-layout/REPORT.md` for bounded capability limits and results;
the domain-step statuses above must be read with those limits, not as universal
engineering or optimization guarantees.
