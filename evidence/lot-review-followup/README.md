# Feature 6 planner review — response and verification

Implemented 29 October 2026 before proceeding with Feature 7. All work remains
uncommitted. The existing accepted-plan protections and historical evidence remain.

| Tester concern | Response | Evidence |
| --- | --- | --- |
| Inaccessible rear parcel called “parcel 0” | One-based Proposed Lot 1, missing-street-frontage explanation, exact offending proposed rectangle/label, blocked Apply | [depth-frontage.png](depth-frontage.png) |
| Vacancy merge obscures removal of another occupied home | Source occupancy, resulting vacancy and explicit affected occupied-home references before Apply; no removed home restored | [vacancy-merge.png](vacancy-merge.png) |
| Preview renumbers untouched parcels | Accepted→proposed numbers on the drawing, source/result references and expandable unchanged-geometry mapping | [lineage-pricing.png](lineage-pricing.png) |
| Provisional economics / unverified polygon setbacks hard to find | Provisional label beside allowance, warning retained; selected reshaped lot shows the deeper-setback limitation beside metrics | [lineage-pricing.png](lineage-pricing.png), [selected-setbacks.png](selected-setbacks.png) |
| Mobile warning separated from drawing | Invalid reason travels in the draft banner beside the drawing; review round trip retains draft/selection/viewport; Cancel keeps accepted work | [mobile-warning.png](mobile-warning.png) |
| Broader irregular block planning | Recorded as future discovery in decisions and PRD v0.12, with containment/frontage/home-fit/consequence gates; current limits unchanged | [PRD v0.12](../../docs/PRD_v0.12.md) |

Verification: **12 focused browser checks passed**, plus the existing **43 lot
browser checks**. Root tests include the updated frontage wording and retain the
inaccessible-lot blocker. [browser-results.json](browser-results.json) records the
production asset for this review. [browser.log](browser.log) and
[regression-parcels.log](regression-parcels.log) retain the output. Screenshots were
opened and inspected; review quantities were kept above the longer lineage details.

The broad irregular-block request was classified by the tester as future discovery;
no arbitrary polygon splitting or block drawing in unused land is claimed. Lot
numbers still reflect each accepted layout, not legal/cadastral IDs. Their transition
is traceable during review, and exact geometry remains in the JSON record. Physical
hardware, independent planner acceptance, real market/setback/access/legal/engineering
validation and a real-model connection remain open.

Feature 7 evidence and a combined human-planner retest prompt are in
[Housing mix](../housing-mix/README.md) and [TESTER-PROMPT.md](../housing-mix/TESTER-PROMPT.md).
