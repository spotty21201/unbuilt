# Deferred independent tester prompt — Feature 12

Review Unbuilt Feature 12, Terrain, drainage and phasing, in
`/home/spotty/projects/unbuilt`. Read `docs/WORK-CONTEXT.md`, `docs/PRD_v0.17.md`,
`docs/DEVELOPMENT-CALCULATIONS.md` and this evidence directory's README first.
Preserve all uncommitted work and every tester prompt. Do not commit/push,
change server credentials or start other deferred reviews. Launch this review
only when the owner requests it.

Use the actual served production build. Distinguish analytic/software checks,
fictional examples and real project verification. No actual survey/storm/schedule
was supplied for implementation. Feature 11 real-model credentials remain deferred.
Never invent data, design thresholds, standards, catchments or approvals.

Review as a planner with appropriate civil/financial calculation scrutiny:

- Terrain: local metre frame/datum/source/date; complete grid import; malformed,
  duplicate, missing, very fine and nonuniform grids; reversed/concave boundary
  clipping; full coverage and no extrapolation; local slope/threshold areas;
  analytic positive/negative platform, split cut/fill and boundary-change cases.
  Verify that surface assumptions, unresolved breaklines and gross material
  volumes are not represented as a grading design, buildability or a priced budget.
- Drainage: actual disjoint measured surface partition, home footprints versus
  whole lots, weighted C, correct SI conversion, entered storm/concentration
  sources and applicability declarations. Test short duration, off-site inflow,
  significant storage, zero coefficients, unavailable/declared outfall capacity
  and a reference outside the site. Gross rainfall volume must never become
  runoff or detention storage. No routing, flooding, pipe suitability or local
  regulatory compliance may be inferred from a colored map or a capacity margin.
- Phasing: stable occupied-lot assignments, vacancies, different home templates,
  construction contingency exactly once, all remaining accepted costs allocated
  by shares totaling 100%, optional infrastructure-only phases, sensible build/
  sales months, calendar labels, single owner payment, selling costs, and monthly
  cash reconciliation to accepted surplus. Test delayed sales, zero costs, late
  land payment, unassigned/orphaned lot references and explicit remapping. Maximum
  month-end deficit excludes intramonth funding and is not a financing approval.
  No readiness of roads/utilities/drainage per phase is established.

Check missing data, partial applicability, invalid numeric fields, accepted versus
unapplied inputs, map/table agreement, Apply/Cancel/Escape, one-step Undo/Redo,
file and portable project import/export, save/reload, saved scheme isolation and
comparison of separate study sources/assumptions. Structurally valid observations
may be retained while a calculation is unavailable; invalid values cannot publish
partial totals. Clear/delete/resize/starter regeneration must retain data and
recheck coverage/references rather than silently relocating or discarding them.

Inspect desktop/narrow and real 200% browser zoom, keyboard focus/targets,
contrast, SVG value validity and overflow. Verify feasibility previews warn about
stale phases, local/server findings match, and AI receives only computed study
facts/limits rather than raw source descriptions, grids or private notes.
Fictional tests are not planner acceptance; obtain appropriate real data before
claiming site-specific engineering or commercial suitability.

Return prioritized concrete implementation prompts: reproduction, observed and
expected behavior, numerical ground truth, user consequence, exact evidence and
uncertainty. Separate definite bugs from professional judgment or unsupported
scope. Do not rewrite older tester prompts or launch their reviews.
