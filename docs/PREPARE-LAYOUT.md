# External-road-first layout preparation — 2 November 2026

This increment addresses the owner's six concrete workflow concerns. It builds
on the 26-step implementation and its bounded capabilities recorded in
[SOP-CONTINUATION.md](SOP-CONTINUATION.md), preserving that workflow, existing
project formats and the legacy finance/house planner.

## Verified baseline and change matrix

The baseline was inspected in the running application, not inferred from a demo.
Initial screenshot/text: `evidence/prepare-layout/before.png` and `before.txt`.

| Concern | Baseline behavior and code evidence | Baseline status | Change | Verification |
|---|---|---|---|---|
| Draw named external road with width immediately after boundary | `ResidentialCanvas` and `ResidentialPlanner` supported supplied centrelines; width/name were separate advanced fields | Partial | Primary setup stage draws along actual site edges and offsets the real road corridor outward by half its supplied width; corner snapping; editable name/width; eligible physical frontage and explicit access checkbox | Outside-offset, winding, corner, restricted/remote-road tests; actual mouse drawing in browser |
| Home products in a width/depth/mix table | Dimensional product records and group mix existed in separate advanced sections | Partial | A single table stores stable products, nominal frontage/depth and percentages of valid unit count; editable mandatory status and integer tolerance; changing dimensions proportionally scales the existing product limits and regenerates polygons | Domain dimension scaling and mix tests; browser table input and product-dimension preview/cancel |
| Prepare Layout generates roads and lots, gate on adjoining side | `chooseEntrance` created an entrance stub; planners then added groups and streets manually; existing alternatives changed an already established network | Missing | Deterministic preparation builds connected entrance, street, loop and group configurations from fixed site/protection, external access and products; exact geometry validator rejects bad trials; selected result remains a preview | Four site fixtures, real browser prepare, polygon quantities, protection and full-corridor checks |
| Mouse entrance movement updates dependent plan | Existing gate movement could leave a generated shared transition disconnected | Partial | `moveResidentialEntrance` moves the gate, its normal connection and matching shared network nodes; access/locks checked before mutation; all lot geometry recalculates | Exact domain gate-move/lock/refusal checks; actual browser pointer drag and quantity comparison |
| Flowing/oblique/loop streets and explicit end choice | Curve/bent/loop geometry existed; junction-angle defaults could prohibit oblique connections; no preparation-time termination choice | Partial | New site angle rule is an editable preference; explicitly required saved angle rules remain required. Real curved-loop trials compete with open streets. Non-looped areas ask **dead end or cul-de-sac** before applying the layout; turning heads have measured footprints | Curve/junction regression fixtures; end-choice and physical-head tests; generated browser network, angle-policy check |
| Maximize valid yield and adjust roads with mouse | Existing curb-lot generator worked on manually supplied streets, but no connected automatic site-first path | Partial | Bounded tests vary product-depth spacing, phase, real loop/open structure and coherent allocations; mandatory mix qualifies before yield. Shared-node road movement preserves connection points and locks, and regenerates dependent geometry | Fixture yields and mix reconciliation; pointer street movement, undo/redo, save/reload |
| Given natural features and irregular flexible open space | Source polygons/holes, protection checks and free polygon drawing already implemented in preceding increment | Implemented within documented limits | Preserved and included in preparation exclusions; no rectangle-only restriction | Re-run site-first browser: source wetland/hole and five-corner park; re-run coupled browser: flexible-space reshape, group change, alternatives |

## Planner flow

1. Establish and accept the site boundary. The main inspector now shows
   **Next: external road → Draw external road**, which opens the residential
   planner directly at its name/width inputs. Existing plans can use the top
   **External road setup** shortcut. Verify the source/scale and lock the boundary.
   A saved residential road changes the main action to **Continue residential
   planning**, preserving the accepted study.
2. In **Prepare your layout**, supply the external road name and full width.
   Choose whether access is permitted. **Draw adjacent external road**, clicking
   points along actual boundary edges and every corner it follows, then finish.
   The entered line is the road's site-facing edge; its centreline is placed
   outside the site. For survey centrelines use **Draw supplied road centreline**
   or the existing import tools instead.
3. Add products in the table. Width is street frontage; depth goes into the
   block. Set unit percentages totaling 100 and the permitted mix tolerance.
   Table dimension changes scale that product's dimension and area bounds
   proportionally; inspect/edit exact limits in the advanced product controls.
4. Review internal corridor width (initially provisional), protection and
   entrance/road requirements. Press **Prepare Layout**. The background search
   can be cancelled. If non-looped ends are proposed, explicitly choose dead ends
   or cul-de-sacs. Review real geometry, measured schedule, differences and issues,
   then accept the complete operation.
5. Drag an adjustable entrance or street on the plan; select a street to expose
   individual bend handles. Draw additional connected streets, use curve radii,
   or refine product groups and irregular spaces with existing tools. Review
   recalculated quantities before accepting. Cancel and undo restore complete
   accepted operations; save/reopen keeps the accepted geometry and schedule.

## Boundaries of the implementation

Preparation is a deterministic bounded search, **best found among tested
configurations**, not a proof of maximum packing. It tests spacing based on
maximum/weighted/minimum declared product depth, two phase choices where useful,
loop/open structures and up to three section-allocation corrections. The first
entrance candidate with credible trials ends the fallback gate search; planners
can move it and use saved alternatives. Visibility routing samples at most 120
free-land vertices; automatic networks support at most 32 streets and 64 groups.
Failed near-coincident road-strip unions retry on a 1-micrometre grid; successful
existing calculations remain exact. Area reconciliation uses 0.01 m² tolerance.
Difficult sites can fail the tested configurations while a manual solution exists.

A required product mix must pass before a proposal can be accepted. Preferred
mix does not outrank valid yield. Explicit required junction-angle policies are
preserved. The internal corridor, curve radius, vehicle envelope, corner returns,
turning requirements, access authority, carriageway, protection buffers and costs
remain project inputs. Missing requirements stay unknown/unpriced. Where no
centreline radius is supplied, tested loop radius equals corridor width;
cul-de-sac heads use at least 0.75 times corridor width and any declared vehicle
envelope. These provisional choices are recorded with prepared assumptions.

Preparation refuses replacing a network with fixed entrances, held roads/groups/
lots or additional entrances. It preserves the accepted plan and explains that
locks must be deliberately released or the existing network edited. Existing
projects without new optional fields retain their old geometry calculations;
version 1 remains frozen and upgrading is explicitly reviewed.

Geometry validation does not establish house feasibility, swept-path approval
for every junction movement, statutory compliance, terrain feasibility or a
survey-authorized external-road alignment. Those remain separate checks.

Evidence, results and commands: `evidence/prepare-layout/REPORT.md`.

Boundary-to-road handoff correction and browser evidence:
`evidence/external-road-next/REPORT.md`.
