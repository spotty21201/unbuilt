Review Unbuilt's feasibility experiments as a residential planner. Do not
implement fixes, commit/stage work, overwrite evidence or launch the deferred
Feature 8/housing independent tests. Preserve all existing uncommitted files.

Read docs/WORK-CONTEXT.md, docs/PRD_v0.14.md and this directory's README.md. The
owner explicitly called this Feature #9; the historical roadmap called the same
topic item 12. Planning brief and rules is outside this review.

Use the actually served app at http://localhost:5173. Record the asset tested.
Open Feasibility experiments beside Assumptions. Assess whether you can understand
what stays held, change a supported design and cost independently and together,
review measured trade-offs, correct invalid inputs, Cancel safely and Apply only
after explicit review. Verify Undo/Redo, reload and portable import/export.

Independently check at least one cost calculation: 20 homes, 1,200 m² built;
reducing construction from Rp5m/m² to Rp4m/m² with 5% physical contingency should
save Rp1.26bn non-land costs, with unchanged revenue, street and green geometry.
Check that cost experiments remain available on held manual/assigned lots without
regeneration. Assess the required-price/ceiling warning, profile uncertainty and
sequential attribution. Do not treat an illustrative allowance as market value.

Inspect desktop, narrow/mobile and actual 200% browser zoom. Distinguish physical
device testing from emulation. Evaluate keyboard focus, labels, Fit/pan/zoom,
readability, table scrolling and reachable Apply/Cancel. Confirm invalid inputs
never replace accepted work and accepted costs appear consistently in other
financial views, search and measured tool explanations.

Return planner-facing comments as concrete implementation prompts. For each
finding: describe the trigger and planner consequence, expected behavior, actual
observed behavior, evidence (screenshot/path and exact steps), suggested scope
and an observable acceptance check. Rank material problems first. State uncertainty
and distinguish measured facts from planning assumptions. Do not claim verified
engineering, costs, market data or a real-model connection.
