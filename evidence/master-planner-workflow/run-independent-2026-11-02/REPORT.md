# UNBUILT — residential master-planner workflow test

**Verdict: Partial.** A conditional concept plan can be prepared and refined with substantial manual work. The tested polygon quantities and persistence are credible within the implemented checks. The automated input-to-layout route failed with the committed recreation requirement, and a valid curve-edit configuration hit a geometry-engine exception. **This run does not establish the greatest practical saleable yield.**

The saved preferred study is **G — preferred curved west loop, east heads 43**: **43 screened valid lots, 27 Compact and 16 Family (62.79%/37.21%)**, no unresolved or invalid *lots*. The scenario still has **14 unknown checks** and `qualified:false`; those must not be confused with the zero unresolved-lot count. Survey scale, access decisions, carriageway, design vehicle and detailed junction/turning feasibility remain unresolved. Higher 55/50-lot capacity options are retained but were not preferred over explicit turning treatment.

This is an automated independent planning-workflow assessment, not a practising planner's or qualified professional's sign-off. No product fixes, commits, pushes, deployments, service reconfiguration or owner-storage edits were performed. All **7,323 pre-existing files** retain their original SHA-256 hashes. See [preservation evidence](preservation-after.json).

## Saved deliverables and test conditions

- [Portable named project — import through Projects](Master-Planner-Workflow-Test.project.json). Contains accepted preferred geometry, products, groups, source/assumption notes, locks, 11 alternatives and selection reasons. Browser work used isolated profiles; this file is the durable handover.
- [Final residential collection](preferred-complete-after-reopen.json), [screenshot gallery](SCREENSHOTS.html), [quantity CSV](quantity-differences.csv), [independent geometry/quantity calculations](independent-metrics.json).
- Tested 2026-11-02 UTC, localhost 5173, commit `b6c660f8c13402e853968ad47d0f75428d7ca50c` with pre-existing uncommitted work. Served JS `/assets/index-FEUX2Fqt.js`, CSS `/assets/index-CpdSNjde.css`.
- Chromium 149.0.7827.55, Linux, isolated Playwright context. Initial viewport 1440×1000; remainder 1440×1100 after the south-edge obstruction. Mouse pointer automation, not a physical touch device or human usability panel.
- First journey through visible controls; then separately identified source-assisted diagnosis/calculation checks. No internal storage used to fabricate UI success. Files imported for additional sites/replays are explicitly authored fixtures. Historical reports are background, not new acceptance evidence.
- [Exact UI command transcript](commands.jsonl), [observations](observations.jsonl), [environment](environment.json), [replay script](edit-evidence.cjs), [replay results](edit-replay-results.json). Locator errors, an initially asymmetric rate-exclusion comparison in the artifact verifier, and the initially dismissed beforeunload dialog are harness errors recorded in [driver-errors.log](driver-errors.log) and [initial verifier log](verify-artifacts-initial-harness-error.log), not product defects. Some original screenshots caught calculation pending; the stable replay pairs below replace those as edit comparison evidence. [Uncaught page errors](page-errors.json): none.

## Inputs and assumptions retained

| Class | Input / status |
|---|---|
| Supplied fictitious | Project objective; rectangle(0, 0),(120, 0),(120,100),(0,100), 12,000 m²; South Main Road 12 m full width on south; Compact 6 m frontage×12 m depth; Family 8×16; mandatory 60/40±5 pp by valid lot count |
| Supplied tester feature | Fixed NE woodland(92, 76),(109, 75),(115, 86),(107, 96),(94, 93); source 359 m², all development prohibited, no crossing, locked |
| Explicitly provisional | Woodland 2 m protection buffer; internal 8 m corridor; full south frontage access permission for this fictitious exercise; entry width 8 m/transition 12 m; product tolerances/default irregular rules; corner-return 0, 90°±10° preference with oblique junctions allowed |
| Flexible commitment | Initial recreation(5, 70),(20, 70),(24, 80),(16, 88),(5, 84), 268 m²; minimum 250 m²; recreation; measured road access required throughout; NW permitted region roughly x 2–32/y 65–95 m. Pointer-derived allowed region exact in export: x 1.8–31.9,y 65–95.1. Final polygon(5, 74),(28, 74),(30, 84),(20, 92),(5, 88), 370 m², within this region |
| Provisional final road choices | Western return loop with 8 m centreline radii at 3 bends; eastern 6 m-radius cul-de-sac heads. Chosen as test geometry; no vehicle/standard was asserted. Neither width nor product dimensions were reduced to fit |
| Accepted product defaults | Compact frontage 5.4–6.6/depth 10.8–13.2/area 57.6–86.4/maxsaleable 86.4; Family 7.2–8.8/14.4–17.6/102.4–153.6/maxsaleable 153.6. Rear/front ratio 0.7, irregular shapes allowed. These are test assumptions, not statutory or market evidence |
| Unknown / not qualified | Survey/title/georeference, legal access and permissible movements, carriageways, approved curvature/junction/turning/widening requirements, design vehicle and swept movements, drainage/utilities, environmental authority and actual buffer, market saleability, building setbacks/house feasibility, real cost/rate scope and approvals |

The boundary, woodland source points/buffer and nominal products stayed fixed across the retained main-site alternatives. Only permitted entrances, unlocked road geometry, whole-section group allocations and flexible space changed. A temporary Compact depth 13 m trial was cancelled, not included in the preferred assumptions.

## 26-step results

**16 Pass · 9 Partial · 1 Fail.** Status assesses demonstrated application support; missing project data is identified separately and is not called an application defect.

| Step | Action | Observed result | Status | Evidence |
|---|---|---|---|---|
| 1 | Create named project and record brief. | Created Master Planner Workflow Test. Objective, source, fixed requirements, preferences, adjustable variables and unknowns recorded in Assignment and site. Road confirmation and source scale have explicit states; other assumptions rely on prose. | **Partial** | [View](01-new-project.png) |
| 2 | Establish and lock 120×100 m boundary; submit a bowtie first. | Crossing outline refused with Apply disabled and offending edges identified. Corrected rectangle accepted at 12,000 m²; boundary locked. Four 120/100 m edges reproduced in exports. | **Pass** | [View](02-invalid-boundary.png) |
| 3 | Use external-road action immediately after boundary. | Draw external road was the next action without lots/internal roads. South Main Road saved 12 m full width, centreline(0,-6)–(120,-6), outside site. Southern drawing clicks hit the footer at 1440×1000 until zooming out. | **Partial** | [View](05-draw-road.png) |
| 4 | Choose a permitted south entrance before layout. | Only south-edge suggestions 60/32/88 m. Chose 60 m; additional entrances have an explicit add action. Choice automatically introduced a 40 m internal entrance stub, not a complete lot plan. Entry lock later resisted movement. | **Pass** | [View](08-preferred-entry-before-layout.png) |
| 5 | Enter a five-vertex supplied protected feature. | NE woodland exact outline retained; 359 m² source, 2 m provisional buffer, 517.223820 m² envelope. Source/restrictions recorded; protected and locked. Later pointer drag refused with an explanation and unchanged export. | **Pass** | [View](70-protected-drag-refused.png) |
| 6 | Commit irregular recreation space before layout. | 268 m² initial polygon, 250 m² minimum, recreation function, measured road access required and drawn NW location region. Separate from protection/residual. Could not accept commitment while future road access was absent; kept requirement in draft until a road reached it. | **Partial** | [View](11-space-accept-blocked.png) |
| 7 | Define Compact 6×12 and Family 8×16; inspect tolerances. | First dimension explicitly serving-kerb frontage; second depth. Accepted defaults provisionally:±10% frontage/depth,±20% area, rear/front ratio 0.7, irregular allowed. Max saleable 86.4/153.6 m². Rates initially unpriced. Nominal products stayed fixed in preferred plan. | **Pass** | [View](12-products-and-defaults.png) |
| 8 | Require 60/40 by valid lot count,±5 pp. | Mandatory checkbox, denominator and largest-remainder integer targets visible. Counts, percentages and deviations reproduced independently. Invalid held lot excluded from valid count and costs. | **Pass** | [View](72-preferred-final-schedule.png) |
| 9 | Enter provisional 8 m internal corridor; inspect other road inputs. | Corridor, carriageway, corner return, centreline radius, preferred angle, turning text and vehicle are separate. Oblique allowed; 90° is a preference. Carriageway, vehicle and approval requirements remain unknown. Zero corner-return default retained provisionally, not an engineering standard. | **Pass** | [View](13-road-requirements.png) |
| 10 | Press Prepare Layout and inspect connected polygons/end treatment. | Automatic preparation found no fit with the committed park access and retained products/mix. Manual connected streets yielded 31; later 50 and 55 screened lots. Explicit 6 m-radius heads occupied measured land. Final western loop/east heads yields 43. This required substantial manual work. | **Fail** | [View](17-prepare-no-fit.png) |
| 11 | Review proposal; accept or cancel whole operation. | Before/proposed quantities and conflicts visible; acceptance blocked on hard conflicts/mix. Cancelling a turning-head trial exactly restored the 31-lot accepted workspace. Accepted successful complete operations separately. | **Pass** | [View](22-cul-de-sac-draft.png) |
| 12 | Inspect entrance, full corridors, bends, junctions and heads. | Physical road footprints change with geometry. Off-site link shown separately; heads/curves measured. Northern 6 m-head trial and 6 m-neck crossing refused for full-footprint boundary encroachment. Vehicle swept manoeuvres and engineering decisions remain unknown. | **Partial** | [View](60-northern-head-conflict.png) |
| 13 | Review street spacing and deliberate product groups. | Compact west and Family east groups assigned to both facing sides. Second cross street split into deliberate Compact/Family sections with actual polygons; schedules report facing match. Junctions/heads reduce usable sections. No facing-product exception was needed. | **Pass** | [View](57-upper-street-50-review.png) |
| 14 | Inspect interior, boundary, junction and curved lots. | Read product/group/street IDs, actual area/frontage/depth, exceptions and Hold this lot geometry control. Examples 72 m²6×12; 128 m²8×16; curved Compact 69.8 m²depth 11.6–12; head Family 122.2 m²depth 15.7–16. Equal-area 72 m²9×8 replacement became invalid. Opaque IDs weaken identification; detailed house/corner-setback feasibility outside scope. | **Partial** | [View](74-curved-head-family-lot.png) |
| 15 | Move entrance with mouse; then lock and repeat. | Moved 60→63 m on permitted frontage. Shared gate/transition connections and lots regenerated 31→28. Undo/redo exact. Locked entry refused subsequent drag and explained why. | **Pass** | [View](edit-entry-after.png) |
| 16 | Drag road, adjust bend, test oblique and loop. | Street 3 drag rotated its free endpoint(112, 20)→(112, 21); shared entrance transition stayed pinned. Real lot paths/road area changed. Radius 8 bend and return loops generated measured geometry. Mixed 8/4/4 m loop curves produced a reproducible polygon-clipping exception; accepted state preserved. | **Partial** | [View](63-curved-loop-calculation-error.png) |
| 17 | Reassign a whole street section. | Family→Compact changed 28→32 lots and regenerated polygon paths, not only colour.100/0 mix blocked acceptance; cancelled. Later split cross-street allocation produced acceptable 50-lot composition and final grouped 43-lot scheme. | **Pass** | [View](edit-group-after.png) |
| 18 | Change a product dimension; inspect limits and dependencies. | Temporary Compact depth 12→13 changed 18 lot areas 72→78 m² and residential area+108 m² with 28 lots. Advanced depth/area/saleable bounds remained explicitly unchanged(10.8–13.2 m; 86.4 m² maxsaleable). Trial cancelled because agreed nominal product was fixed. | **Pass** | [View](30-product-dimension-preview.png) |
| 19 | Rebalance integer mix through street groups. | Tested whole-section rebalance; no closer mix found for two groups, but message incorrectly described mandatory mix as outside tolerance while current 28-lot schedule passed. Manual split/main-street groups achieved 27/16=62.79/37.21% in preferred scheme. | **Partial** | [View](32-rebalance-complete.png) |
| 20 | Attempt permitted residual fill. | 28-lot plan produced one additional real Compact polygon: 29 total, but 19/10=65.52/34.48% failed mandatory mix. Kept preview separate and cancelled. Fill on 31 and 55 plans added no lots; named rejection reasons retained. No invented product or nominal residual park. | **Pass** | [View](33-fill-residual.png) |
| 21 | Reshape flexible space by mouse while protecting fixed feature. | Vertex(16, 88)→(18, 88): 268→272 m², residual−4 m²; valid lots unchanged because edit touched no lot. Source protection exact. Later allowed space expanded/shifted to 370 m² with road access for curved loop. Isolated occupied-lot regeneration from a space-only edit was not demonstrated. | **Partial** | [View](edit-space-after.png) |
| 22 | Reconcile physical land allocations. | Preferred 43 plan:lots 3980.304555+roads 2519.482855+protection 517.223820+flexible 370+reservations 0+residual 4612.988770≈12000 m². Separate overlap≈0.000000213 m² and gap 0; tolerance 0.01 m². External road excluded. Independent aggregation agrees. | **Pass** | [View](68-preferred-land-budget.png) |
| 23 | Review lot/group/road/space quantities and scoped fictitious costs. | Preferred 43 valid/0unresolved lots/0invalid; road 309.696 m. Rp 1 m/Compact lot and 1.5 m/Family lot for connections only, plusRp 100k/m² internal road civil works. Current priced scopesRp 302,948,285.49; spaces remain unpriced. This is not a total development estimate. | **Pass** | [View](68-preferred-land-budget.png) |
| 24 | Retain spatial alternatives and compare at equal scale. | Saved 11 alternatives: 7 manually developed options plus 4 bounded-search variants from 14 tested configurations. Compared 43 versus 55 and 50; SVG cameras have identical viewBox and 540×468.21875px canvases. Organising idea/advantage/compromise recorded in this report. | **Pass** | [View](66-preferred43-vs55.png) |
| 25 | Select/refine preferred with constraints before yield. | Selected G 43 as conditional practical concept:real western curves/loop, measured eastern heads, recreation access and required mix.55 and 50 capacity studies lack satisfactory tested turning treatment.43 is best found under this provisional organising approach; no verified saleable optimum or professional approval. Selection reasons/changed assumptions saved. | **Partial** | [View](67-preferred43-vs50.png) |
| 26 | Verify whole-operation undo/redo, save, close/reopen and portable import. | Entrance operation undo/redo reproduced complete exported workspace exactly. Final plan saved, switched to another project and reopened; products/groups/entrances/locks/assumptions/11 alternatives/shortlist/quantities exact. Full project imported in fresh profile with exact residential workspace. No lost accepted work observed. | **Pass** | [View](71-fresh-context-import.png) |

## Before/after mouse and group evidence

These four stable pairs replay the same original operations through visible UI imports in separate disposable projects. Original-journey screenshots/exports remain alongside them. Geometry change is established from rendered polygon paths and accepted exported coordinates, not colour or control state alone.

| Operation | Before | After | Outcome |
|---|---|---|---|
| Entrance movement | [31-lot plan](edit-entry-before.png) | [Gate at 63 m; 28 lots](edit-entry-after.png) | Physical gate/transition/shared nodes and lots change; accepted |
| Road movement | [East road before](edit-road-before.png) | [Free endpoint north 1 m](edit-road-after.png) | Gate transition pinned; road becomes oblique; lot paths change; accepted |
| Whole product group | [Family street](edit-group-before.png) | [Compact street](edit-group-after.png) |28→32 actual polygons; 100/0 mix blocks acceptance; cancel restores accepted plan |
| Flexible-space corner | [268 m² park](edit-space-before.png) | [272 m² park](edit-space-after.png) | Real polygon/area change; unchanged lots expected because no lot is touched; accepted |

| Edit | Valid lots | Lot area m² | Road area m² | Road length m | Flexible m² | Residual m² | Outcome |
|---|---:|---:|---:|---:|---:|---:|---|
|Entrance 60→63 m|31→28 (-3)|2904.000→2576.000|1456.000→1457.432|190.000→190.224|268→268|6854.776→7181.344|Accepted; undo/redo exact|
|Street 3 free end north 1 m|28→28 (+0)|2576.000→2576.000|1457.432→1457.550|190.224→190.234|268→268|7181.344→7181.226|Accepted; rendered lot paths change|
|Whole east group Family→Compact|28→32 (+4)|2576.000→2304.000|1457.550→1457.550|190.234→190.234|268→268|7181.226→7453.226|Blocked 100/0 mix; cancelled|
|Space vertex east 2 m|28→28 (+0)|2576.000→2576.000|1457.550→1457.550|190.234→190.234|268→272|7181.226→7177.226|Accepted; no lots intersect this change|


Protection remains 517.223820 m² and gross 12,000 m² in every edit. At these early stages prices were unentered: displayed Rp 0 means no priced scopes, not a zero development estimate. Road length/area use full precision in JSON/CSV; small changes round away in the one-decimal display.

Additional quantified trials:

- Compact depth 12→13 m: 18 Compact lots change 72→78 m², total lot area 2576→2684 m²; 28 lots remain; bounds explicitly inspected and trial cancelled.
-6 m eastern head on A: roads 1456→1524.9 m², 31→29 screened lots; 19/10 mix 65.52/34.48 blocked acceptance. Cancel exactly restored A.
-8 m west bend on A: 31→29 lots, roads 1456→1428.523 m² and length 190→186.565 m. Selected curved Compact measured 69.8 m² and depth 11.6–12 m.
- Equal-area invalid lot: replace a held Compact polygon with(8, 8),(17, 8),(17, 16),(8, 16). Area remains 72 m², but frontage 9 m/depth 8 m fail product rules. Accepted 44-lot plan's preview becomes 42 valid/1 invalid after neighbouring reallocation. Invalid 72 m² excluded from valid area and priced valid-lot count. Acceptance disabled; cancelled. [Evidence](64-area-only-lot-invalid.png).
- Final refinement F→G: 44→43 lots; roads 2601.800→2519.483 m²; length 320→309.696 m; space 268→370 m². Several operations changed together, so do not attribute the entire lot delta to space alone.

## Alternative comparison and preferred decision

| Alternative | Organising idea | Valid C/F | Actual C/F % | Road m / m² | Priced scopes Rp | Advantage | Compromise |
|---|---|---:|---:|---:|---:|---|---|
|B — east-shifted entrance, oblique east street 28|Shift entrance 3 m east; rotate free eastern street end|28: 18/10|64.29/35.71|190.23 / 1457.55|178,754,995.40|Demonstrates actual connection/group regeneration|3 fewer lots than A|
|Option 8|Reshape flexible space with same road structure|28: 18/10|64.29/35.71|190.23 / 1457.55|178,754,995.40|Keeps 28 lots and road burden|Park larger; residual falls without yield gain|
|Option 10|Lengthen/shift unlocked road geometry|28: 18/10|64.29/35.71|200.16 / 1537.14|186,714,250.47|Spatially distinct and quantities current|Same 28 lots; more roads/cost than B|
|Option 12|Lengthen/shift unlocked road geometry|28: 18/10|64.29/35.71|210.12 / 1616.91|194,690,696.76|Spatially distinct and quantities current|Same 28 lots; more roads/cost than B|
|Option 2|Automatic parallel return loop|24: 14/10|58.33/41.67|290.46 / 2000.80|229,079,526.88|Different connected loop tested with same fixed inputs|Only 24 valid lots; 290.46 m road; unresolved checks|
|A — central entrance and two product streets 31|Central entrance; western Compact and eastern Family streets|31: 19/12|61.29/38.71|190.00 / 1456.00|182,600,000.00|Simple 190 m street system; good count mix|Unresolved dead-end/bend treatment; much residual|
|C — west bend radius 8, 29 lots|A with 8 m centreline radius at west bend|29: 17/12|58.62/41.38|186.57 / 1428.52|177,852,298.96|Actual tangent curve and kerb measurements|2 fewer lots; other ends unresolved|
|D — second cross street, 50 screened lots|Second cross street at y 60; deliberate two-product sections|50: 31/19|62.00/38.00|292.00 / 2240.00|283,500,000.00|19 more screened lots than A|End treatment incomplete; 292 m roads|
|E — northern frontage, highest screened yield 55|Additional northern frontage street at y 96|55: 34/21|61.82/38.18|384.00 / 2912.00|356,700,000.00|Highest screened lot count tested|6 m head leaves boundary; not selected for practical concept|
|F — west return loop and east cul-de-sacs 44|Western return loop; measured 6 m heads on eastern dead ends|44: 26/18|59.09/40.91|320.00 / 2601.80|313,180,028.23|Explicit terminal geometry; 26/18 mix very close|Western angular bends still have no driving curves|
|G — preferred curved west loop, east heads 43|G: radius 8 western loop; eastern 6 m heads; recreation 370 m²|43: 27/16|62.79/37.21|309.70 / 2519.48|302,948,285.49|Measured curves/heads, park access and 62.79/37.21 mix|Lower count/greater road burden than capacity studies; engineering unknown|


The application searched 14 bounded configurations from B and retained 4 variants; it did not prove optimality. Manual road and product-section exploration found materially higher capacity with unchanged fixed inputs. Additional source-assisted trials are in `technical-*-trials.json`/`technical-curved-loop-allocations.json`; these are labelled technical explorations, not UI successes or additional saved alternatives. Only schemes actually reviewed/accepted in the UI appear in the saved library.

[43 versus 55](66-preferred43-vs55.png), [43 versus 50](67-preferred43-vs50.png). Both comparison SVGs used identical `viewBox="-15.24 -109.24 150.48000000000002 130.48"` and 540×468.21875px canvases with the same y-up orientation. This confirms common scale, beyond the presence of a comparison button.

**Preferred G is a conditional planning recommendation.** It carries a real western return loop, three defined 8 m centreline curves, two measured 6 m-radius eastern heads, accessible 370 m² recreation and 27/16 count mix.55 has the highest screened count but its northern street's 6 m-radius head leaves the fixed boundary; that head edit was rejected, not accommodated by clipping, changing products or extending the site.50 lacks complete turning treatment; 44 has undetailed angular bends. The 6 m/8 m geometry choices are provisional, not invented statutory requirements. G is the best found under that more resolved organising approach, pending vehicle and access review; it is not demonstrated to be the greatest practical or saleable scheme across all possible designs. A qualified planner may appropriately prefer a different design after supplying missing requirements.

## Land budget, quantities and costs

| Physical allocation | Preferred G m² |
|---|---:|
| Residential lot polygons, all valid in accepted G |3980.304555|
| Unioned internal road corridors/curves/heads |2519.482855|
| Fixed protected envelope |517.223820|
| Flexible recreation |370.000000|
| Other reservations |0|
| Residual |4612.988770|
| Sum |12000.000000213|
| Fixed gross |12000.000000000|

Gap 0; overlap approximately 0.000000213 m², below stated 0.01 m² tolerance. Junction overlaps are included once in the road union. The original woodland remains visibly identifiable within its envelope. External South Main Road runs outside the boundary and is excluded from internal-road quantities; its 12 m width is not an internal-road rate quantity. Residual remains residual, including inaccessible/undersized rejection explanations, rather than becoming an invented product or park.

The independent pass uses shoelace areas, line-segment lengths, counts, shared-edge checks, cost multiplication and aggregation on UI-exported polygons. All accepted alternatives were checked for lot containment, lot overlap and land reconciliation. Preferred G had no lot-area discrepancies, no lot-lot overlap, no lot/road boundary escape and only≈0.000000195 m² lot/exclusion numerical contact. **Boolean operations use the installed polygon-clipping kernel also used by the application**; this is an independent aggregation/checking implementation, not a second independent geometry engine or engineering proof. [Calculation script](audit.mjs), [results](independent-metrics.json).

Fictitious cost scopes entered with sources/dates:

- Compact connections only: 27×Rp 1,000,000=Rp 27,000,000.
- Family connections only: 16×Rp 1,500,000=Rp 24,000,000.
- Internal road civil works only, excluded from those lot rates: 2519.482854909 m²×Rp 100,000=Rp 251,948,285.49.
- **Priced scopes total Rp 302,948,285.49.** Spaces remain unpriced. Land, houses, approvals, financing and other unspecified development scopes are not a complete estimate. The invalid-lot trial correctly reduced cost using only current valid counts.

## Additional sites

These were separately named projects using explicitly supplied metre-coordinate fixtures, not boundary alterations to rescue the main plan. Same Compact/Family definitions, 60/40±5 pp, 8 m provisional corridor, South Main Road 12 m, NE source protection/buffer and NW recreation/access/minimum were carried in before preparation. Imports were through the visible Projects interface. [Fixture construction script](make-additional-sites.mjs). Every fixture starts with no internal roads/groups/lots; inputs were not depicted as generated results.

| Site | Fixed coordinates / gross | Core result | Status / evidence |
|---|---|---|---|
| Angled |(0, 0),(120, 0),(118,100),(2,100); 11800 m²|Prepare found no fit with required park access. Manual connected west/east groups yielded 31 valid(19/12), 1456 m² roads, 6654.776 m² residual. Protection and outline unchanged; portable reopen exact.|**Partial**: automatic path failed; [manual plan](additional-angled-manual.png), [accepted](additional-angled-accepted.json), [portable reopen](additional-angled-portable-reopen.png)|
| Concave |(0, 0),(120, 0),(120,100),(80,100),(80, 60),(40, 60),(40,100),(0,100); 10400 m²|Same bounded Prepare failure. Manual connected plan below/in the two wings yielded 31 valid(19/12), 1456 m² roads, 5254.776 m² residual. Full accepted road/lot polygons contained; portable reopen exact.|**Partial**: [manual](additional-concave-manual.png), [accepted](additional-concave-accepted.json), [portable reopen](additional-concave-portable-reopen.png)|
| Narrow neck |(0, 0),(45, 0),(45, 20),(75, 20),(75, 0),(120, 0),(120,100),(75,100),(75, 26),(45, 26),(45,100),(0,100); 9180 m²|Two useful side areas joined by 30 m-long, 6 m-high neck. Candidates only on two genuinely adjoining south intervals. Prepare no fit. Manual centreline(22.5, 23)→(97.5, 23) fits through neck; 8 m corridor y 19–27 crosses its y 20–26 boundary. Full-footprint failure blocked acceptance; 0 valid/13 unresolved lots, not inflated yield. Cancel exactly restored site inputs. No extra entrance invented.|**Pass** for refusing invalid corridor; **Blocked** for a valid through-neck 8 m layout. [Actual measured conflict](additional-neck-corridor-final.png), [input](additional-neck-before.json), [cancelled state](additional-neck-after-cancel-final.json)|

The central 30 m neck section alone has at least 30×(8−6)=60 m² of corridor outside the boundary. It cannot carry this full corridor without an explicit different access strategy or changed requirements. Neither was silently invented. The neck project's saved state is an input study, not a valid subdivision. Full 26-step refinements were performed on the main rectangle; secondary tests repeat the core input→Prepare→manual/full-corridor check→persistence/cancel sequence, not every edit/cost comparison.

## Persistence and lost-work evidence

Complete exported workspaces compare exactly, not just screenshots or displayed totals:

| Check | Exact result |
|---|---|
| A before / after cancelling turning-head preview |Same complete workspace|
| A / one Undo after accepted entrance move |Same complete workspace|
| Entrance move / one Redo |Same complete workspace|
| Locked entrance before / refused mouse drag |Same complete workspace|
| Final G before save / close to another project / reopen |Same complete workspace|
| Final G / project import in fresh isolated browser context |Same complete workspace|
| Protection before / refused drag |Same complete workspace|
| Angled and concave / portable project reimport |Each same complete residential workspace|
| Neck site inputs / cancelled invalid corridor |Same complete workspace|

[JSON equality results](independent-metrics.json) contain input, result and complete-workspace comparisons. Preferred shortlist ID, reasons, 11 alternatives, group/road/entrance/source geometry and locks reproduce. Some exports contain an accepted revision ID separate from its saved alternative ID; geometry/input equality is preserved. Project UI states plan Undo/Redo history is not restored on reopening; within-session operation Undo/Redo was verified. No lost accepted work occurred in this run. Recovery from storage quota/corrupt libraries was not retested in this latest planning workflow.

## Prioritized findings and implementer prompts

### D 1 · P 1 · Fitting mixed-radius loop cannot calculate

**Classification:** Reproduced application defect.

**Reproduce:** Load the accepted F 44 input from `loop-heads-44.json`. Street 2 path is(60, 20)→(12, 20)→(12, 70)→(30, 70)→(30, 60). Enter curve radii `2,8` / `3,4` / `4,4` in its curve field, blur and wait. These radii fit their adjacent segment lengths. Keep 8 m corridor, eastern 6 m heads, park access and fixed source constraints.

**Expected:** Calculate measured corridors/lots, or report an actual geometric/planning conflict with proposed geometry. Accepted work remains recoverable.

**Actual:** Preview unavailable; acceptance disabled; raw `Unable to find segment #4531 [28.351141,69.236068] -> [28.351141000000116,69.23606800000016] in SweepLine tree.` Accepted 44-lot values retained. The focused technical regression fails with the same library exception.

**Prompt to implementer:** Stabilise polygon overlay precision for this exact fitting curve/head combination and return a planner-readable error if calculation still fails. Preserve accepted-state isolation and measured corridor widths; do not solve by changing source/product geometry. Acceptance check: reproduce the saved case without a raw overlay exception and independently verify containment, land reconciliation and current lot schedule.

**Evidence:** [UI failure](63-curved-loop-calculation-error.png), [exact inputs/stack](technical-r4.json), [failing regression](reproduce-curve-failure.mjs), [failure log](curve-regression-FAIL.log). Tested build/device as above.

**Not verified:** General robustness across arbitrary curved networks; vehicle suitability of 4 m/8 m curves remains outside these numerical checks.

### D 2 · P 1 · Prepare Layout does not service a committed recreation polygon

**Classification:** Reproduced workflow capability gap, not a false impossibility claim.

**Reproduce:** Use the rectangle, south road 12 m, Compact 6×12/Family 8×16, mandatory 60/40±5 pp, 8 m corridor, fixed buffered NE woodland and initial NW recreation 268 m²/min 250 requiring road access. Press Prepare Layout. Repeat on angled/concave inputs.

**Expected:** Test connected road structures that service the declared recreation access commitment as well as lots, or clearly identify a binding project constraint that prevents it. A future access requirement should be retainable as an input commitment before a finished layout.

**Actual:** No tested full-corridor layout fits; reported park road-edge access failure. Numerical trials may also be discarded. Cannot accept that early park commitment with the initial entrance stub; continued in draft. Manual road to(12, 70) satisfies access without moving protection or changing products/mix; later manually developed viable screened plans demonstrate that the simple study is not generally infeasible. The app does correctly disclose bounded search, so this is not evidence it falsely claims global impossibility.

**Prompt to implementer:** Include required flexible-space access in generation/routing and distinguish an input commitment from a completed usable-park allocation. Preserve area/location/protection constraints and mixed-product rules. Acceptance check: this exact project can retain its pre-layout commitments and Prepare produces at least one connected reviewed candidate satisfying them, or a precise defensible binding constraint.

**Evidence:** [initial failure](17-prepare-no-fit.png), [park acceptance block](11-space-accept-blocked.png), [manual 31](20-manual-valid-review.png), [manual 50](57-upper-street-50-review.png), three additional site Prepare screenshots.

**Not verified:** Global optimisation or feasibility for every allowed input; generated scheme engineering approval remains separate.

### D 3 · P 2 · South-edge drawing target is behind footer

**Classification:** Reproduced interaction defect.

**Reproduce:** At 1440×1000, start adjacent external-road drawing immediately after rectangle acceptance. Attempt to click southern endpoints at the fitted view. Southern point y≈921 lies below footer top≈910.

**Expected:** All fitted editable boundary edges accessible to pointer, or view automatically accommodates drawing/status/footer.

**Actual:** Footer receives click; zero points placed. Zoom out once makes the road drawable. Boundary unchanged.

**Prompt to implementer:** Fit the actual interactive canvas into its available scroll/viewport area when drawing controls/footer change. Preserve world geometry, metre scale and pointer snap. Acceptance check: both south endpoints are clickable at this viewport without manual camera adjustment.

**Evidence:** [screenshot](05-draw-road.png), `03-obstructed-road-input` entry in [observations](observations.jsonl) includes coordinates and `elementFromPoint` footer result.

**Not verified:** Physical mobile touch or all browser zoom/viewport combinations.

### D 4 · P 2 · Rebalance status misstates accepted mix

**Classification:** Reproduced misleading feedback.

**Reproduce:** On the 28-lot 18/10 accepted plan, run Rebalance draft mix with two whole-street groups. Wait for completion.

**Expected:** State current mix passes 64.29/35.71 and no closer tested whole-section allocation was found; trial failures identified separately.

**Actual:** “Tested 2 permitted whole-section allocations; no closer mix found. Mandatory product composition is outside tolerance or undefined.” Current schedule still passes. Message appears to describe failing trials as the current plan's condition.

**Prompt to implementer:** Separate current-plan validity from rejected search-trial reasons and report the unchanged current denominator/counts. Preserve mandatory gates and bounded-search wording. Acceptance check: a passing retained plan never receives a current-mix failure statement merely because alternative trials failed.

**Evidence:** [completed rebalance text](32-rebalance-complete.txt), [current 18/10 inputs/result](road-after.json).

**Not verified:** All other objective/search feedback variants.

### D 5 · P 2 · Project-level summary hides accepted residential plan

**Classification:** Reproduced usability improvement.

**Reproduce:** Save G 43, close residential planning and open Projects or outer Plan.

**Expected:** A clear summary of the existing residential study, yield/preferred status and a direct continuation action.

**Actual:** Named project listed “Boundary only”; outer canvas says no layout generated and shows an unrelated empty legacy plan. Continue residential planning does restore the real study. Persistence is sound, but the summary can suggest that the 43-lot plan disappeared.

**Prompt to implementer:** Surface the residential study in the outer project summary and distinguish it explicitly from any other plan representation. Preserve the independent geometry/storage model. Acceptance check: saving/reopening G shows its existence and 43-lot status before entering the modal.

**Evidence:** Project library text in [command transcript](commands.jsonl); [fresh import text](71-fresh-context-import.txt) includes both the real study and outer boundary-only statements. Backup reproduces correctly.

**Not verified:** Reconciliation of edits between the two plan representations; not attempted to avoid unrelated legacy generation.

### D 6 · P 2 · Lot inspection relies on opaque product/group/street IDs

**Classification:** Reproduced usability improvement.

**Reproduce:** Select a Family lot at the eastern head in G.

**Expected:** Identify Family, a named section and Street 3 directly, while keeping stable reference IDs available.

**Actual:** Details show `product product_2`, timestamp-based group ID and street ID. Measurements are useful but identifying the serving street requires cross-reference elsewhere. User sees Hold this lot geometry for lock state.

**Prompt to implementer:** Render friendly product/street/section names alongside stable references and make the selected lot's lock status explicit. Preserve IDs for history/export. Acceptance check: the selected 122.2 m² Family lot is understandable without copying a long ID into another panel.

**Evidence:** [selected head lot](74-curved-head-family-lot.png), [text](74-curved-head-family-lot.txt).

**Not verified:** Keyboard/screen-reader identification in this latest run.

### D 7 · P 3 · Empty denominators display “Undefined”

**Classification:** Reproduced presentation defect.

**Reproduce:** Inspect site-only 0-lot quantities, or change the whole east group to Compact so Family has 0 valid lots.

**Expected:** “Not applicable—no valid lots” for road-per-lot, and a dash/no lots for product area range. No spurious numeric value.

**Actual:** Literal “Undefined m/valid lot” and “Undefined/Undefined/Undefined” area ranges. Counts and mix gating remain correct.

**Prompt to implementer:** Format absent measurements with meaningful no-data text while retaining zero valid counts and unpriced scope indicators. Acceptance check: zero-denominator screens contain neither “Undefined” nor an invented numerical ratio.

**Evidence:** [zero Family schedule](29-group-change-preview.txt), [neck 0-valid result](additional-neck-corridor-final.txt).

**Not verified:** All other absent-value reports.

Rate-entry usability note: a source note longer than 200 characters caused a generic common-rate validation message despite unit/date/scope being entered. A shorter explicit source note worked. This was recorded in `39-costs-draft`/`42-costs-accepted-review`; a visible length hint would reduce hesitation. It did not corrupt cost totals.

## Workarounds used

1. Zoomed the plan out once to access south-edge drawing at 1440×1000; later used 1440×1100. No world geometry changed.
2. Continued committed space/products in a review draft because its required future road access prevented early acceptance. Drew real connected streets manually after Prepare failed. Never unchecked required access, changed target mix, narrowed corridor, reduced nominal products, stretched boundary or moved protection.
3. Used visible coordinate fields to establish exact source outlines after pointer placement, which was snapped/approximate. Source scale stayed unverified rather than being falsely certified.
4. Restored the earlier central-entrance scheme through a transparently authored UI-import file with the already declared cost rates. The existing entry lock initially blocked relocation. Explicitly accepted an unlock first, imported/restored the tested network and re-locked the entry. Existing alternatives preserved.
5. Cancelled mixed-radius loop after the numerical failure. Deliberately changed adjustable road curves to 8 m radii, expanded flexible recreation within its permitted region and reassigned whole product sections. These changed assumptions are recorded in the selection reasons; the original source protection/products/boundary remain unchanged.
6. Supplemented first-journey screenshots with stable separate-profile edit replays after noticing that some captures occurred during asynchronous calculation. Reports use measured settled values; calculation-pending values are not counted as fresh proposed results.

## Technical verification and limits

- `npm run test:residential`: **95 SOP+56 V 2 checks passed**. Existing tests reused as regression evidence, not proof of every requested workflow step. [Log](residential-regression.log).
- `node .../edit-evidence.cjs`: four visible-UI edit replays completed; entry/road/group polygon paths changed; space-only lot paths appropriately unchanged; mandatory group mix blocked; accepted/cancelled exports retained. [Log](edit-replay.log).
- `node .../audit.mjs` and `node .../verify-artifacts.mjs`: assertions passed for34 accepted scenario snapshots,12 complete-workspace equality pairs,4 visible-UI edit cases, unchanged fixed products/mix/corridor and source protection across11 retained alternatives. Independent aggregation/containment/cost/history checks on exported accepted scenarios. [Log](audit.log). No silent acceptance of failed curves or invalid corridor.
- `node --experimental-strip-types --no-warnings .../reproduce-curve-failure.mjs`: **FAIL, exit 1**, intentionally retained as an outstanding application regression. No assertion weakened to obtain a pass.
- No product source or pre-existing test changes. Only new run artifacts/scripts. [Preservation comparison](preservation-after.json): 7323 original files checked, 0 changed, 0 missing.

All inputs are fictitious. No survey accuracy, market saleability, statutory compliance, detailed house fitting, utility/drainage design, vehicle swept-path approval or cost estimate is certified. Real-model AI, mobile/touch, real screen reader, actual 200% browser zoom, quotas/corrupt-storage recovery and the unrelated legacy house-finance workflows were not rerun as part of this latest residential subdivision sequence. Earlier combined-review evidence is not represented as fresh acceptance here.

**Planning-workflow judgment:** UNBUILT supports understandable concept geometry, meaningful edits, constraint refusal, grouped products, reconciled measured quantities and reliable tested save/restore. It currently needs manual intervention for this constrained Prepare Layout assignment and numerical robustness/feedback improvements. I would use G as a conditional discussion study with explicit missing inputs, not rely on its 43 count as verified saleable yield or claim the objective of greatest practical subdivision yield has been established.
