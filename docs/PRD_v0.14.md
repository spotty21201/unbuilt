# Unbuilt — PRD v0.14: feasibility experiments

29 October 2026. The owner explicitly requested **Feature #9: Feasibility
experiments — test design changes and editable cost assumptions**. This increment
uses that title and numbering. In PRD v0.8 the same topic was roadmap item 12;
item 9 there was Planning brief and rules. That historical roadmap is preserved.
This approval covers feasibility experiments only. Planning brief, land budget,
walkability, saved alternatives, terrain/drainage/phasing and real-model
integration are outside this increment. Feature 8 independent testing remains
deferred, and both prior tester prompts remain unchanged.

## Planner task and interaction

Open **Feasibility experiments** beside Assumptions in the inspector of a valid,
generated accepted plan. A focused review presents the frozen accepted plan and
one unapplied trial, in the same local coordinates. Both drawings retain Fit,
pan, zoom and layers. The trial can change supported design inputs and costs
individually or together. No AI or external service is needed to calculate it.

Design inputs: Spine/Loop circulation, generated lot frontage (6–30 m), and lot
depth (12–40 m). The boundary, entrance, named open-space geometry/minima,
clearances, vacancies and housing templates stay held. Manual street geometry
and widths stay held; circulation switching is disabled for manual streets.
Manual lot partitions, polygon lot reshapes and explicit housing assignments
hold the design controls. Their projects can still run cost-only experiments.
Use the existing street, lot, housing and open-space editors for separate edits.
No trial silently discards manual work or reassigns a home.

The other accepted financial assumptions remain visible and held: selling price,
buyer ceiling, owner benchmark and surplus/revenue target. Close the trial to
change these through their existing Assumptions fields. The default rates remain
illustrative, with no contractor quotation or market verification implied.

## Editable cost contract

`SiteFrame.costAssumptions` / `Site.costAssumptions` is an optional complete object:

| Key | Unit / basis | Legacy default |
|---|---|---|
| constructionPerM2 | Rp / measured home built m² | 5,000,000 |
| roadPerM2 | Rp / measured unioned street m², including access | 800,000 |
| greenWorksPerM2 | Rp / true designed green m² | 150,000 |
| setupAllowance | fixed project Rp | 800,000,000 |
| otherWorksAllowance | fixed physical works Rp | 1,200,000,000 |
| contingencyFraction | fraction of all physical-cost lines above | 0.05 |
| professionalAllowance | fixed project Rp, outside contingency | 1,300,000,000 |
| sellFraction | fraction of revenue, outside contingency | 0.03 |

Absence retains the original defaults exactly. Explicit zeros remain zero. All
fields must be finite numeric values; costs/allowances are 0–Rp1 trillion,
contingency is 0–1, selling fraction is 0–less than 1. A partial object, unknown
key, numeric string, negative or non-finite value is rejected at import and server
snapshot boundaries. Empty UI inputs remain incomplete, never zero. Selling
costs plus the accepted target must be below 100% for an applicable trial.

Physical cost = construction + street works + green works + setup + other works.
Non-land cost = physical cost + physical cost × contingency + professional.
The existing finance formula remains: land allowance = revenue ×
(1 − selling fraction − target fraction) − non-land cost. Surplus additionally
subtracts the owner expectation. No rounding is used in calculations.

## Review and recovery

- Two actual drawings, before/trial/change columns for homes, built area,
  streets, designed green, lots, unallocated land, every cost line, revenue,
  selling costs, surplus, land allowance and owner shortfall/headroom.
- Required price at the owner benchmark and target; identify when it exceeds
  the declared buyer ceiling. Zero-home required price is unavailable.
- Sequential land-allowance attribution: design at accepted costs, then changed
  costs on that trial design. This states the interaction order; it is not an
  independent-causation claim. Shared prices remain assumed when homes change.
- Profile warnings remain visible. These trials are measured planning
  comparisons, not market valuations, construction estimates or optimum searches.
- Invalid input or geometry disables Apply, removes partial trial finances and
  trial drawing, and retains the accepted baseline and editable fields.
- Reset trial returns to accepted inputs. Use illustrative costs explicitly
  restores the original default costs in the trial only.
- Cancel, Close and Escape discard the trial. Apply commits its geometry inputs
  and costs together, logs the changes and measured consequences, and pushes one
  plan-history step. Undo/Redo restores exact accepted inputs.
- The native modal contains focus and prevents edits behind the review. The
  existing unload warning covers unapplied experiments. Closing/reloading loses
  a trial; only applied inputs enter the existing accepted-state save contract.

## Persistence and integration

Projects with explicit costs use project v11, decision record v12, snapshot v10
and `editable-cost-assumptions`. Earlier envelopes carrying costs refuse rather
than silently losing assumptions. Legacy project versions remain readable and
are still emitted for projects without explicit costs.

Accepted costs flow through the shared evaluator, quantities/economics details,
housing cost explanation, green-work summaries, bounded search and comparisons,
server search/explanations, save/reload and portable record import/export. Cost
changes enter search and assistant scenario binding, clearing stale results and
in-flight answers through the existing lifecycle. Snapshot hashes preserve exact
cost input precision, including small fractional edits that affect large sums.

Costs survive Clear layout, Delete boundary, boundary replacement, resizing and
starter regeneration under the existing promise to retain economic assumptions.
Trials and experiment comparisons are session-only. This does not implement
persistent named alternatives, a multi-run experiment ledger or market data feeds.

## Acceptance and evidence

Verify hand-calculated independent cost lines and contingency, zero and invalid
inputs, combined attribution, determinism, manual work protection, legacy defaults,
new-envelope round trips and downgrade refusals. Exercise the served production
build for Cancel/Apply, history, reload, import/export, shared server results,
held housing, narrow touch and actual browser zoom 2.0 with unchanged outer window.
Inspect screenshots; automated checks alone do not establish visual quality.

Implementation results and limitations: `evidence/feasibility-experiments/README.md`.
Independent planner acceptance and physical-device interaction remain open.
