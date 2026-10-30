Review Unbuilt Feature 10: Saved alternatives, as a residential planner. Make no
implementation changes or commits and preserve existing evidence/tester prompts.
Do not launch the deferred Feature 8 or earlier independent reviews.

Read docs/WORK-CONTEXT.md, docs/PRD_v0.15.md and this directory's README.md. The
owner requested this title as Feature 10; historical roadmap item 13 is the same
topic. Work through feasibility, including its prompt, is on GitHub at e2dc09f.

Use the actually served app at http://localhost:5173 and identify its asset.
Assess whether you can name a baseline, make design/cost changes, retain another
scheme, compare them using their own assumptions, annotate/rename a scheme,
explicitly review reopening, Cancel safely, confirm reopening and recover the
previous working plan through Undo/Redo. Confirm the collection and notes survive
plan history and reload. Save an unapplied search preview without changing the
accepted plan. Export/import a project with several schemes and ensure its notes
can change independently of the original project.

Include a quantitative comparison: lowering construction from Rp5m to Rp4m per
built m² for 1,200 m², with 5% physical contingency, reduces non-land cost by
Rp1.26bn at unchanged geometry and revenue. Changing the saved selling price
should affect only that side's finances. Inspect the saved assumptions table.
Do not mistake the difference between independently fitted drawings for a measured
design change, or illustrative finance for market/engineering verification.

Check manual lots/reshapes, housing assignments, vacant homes, streets, green
polygons/commitments, costs and site context where available. Reopening must retain
all captured inputs or block clearly; it must not silently drop manual work. Test
reopening a saved layout after clearing/deleting the current boundary. Distinguish
saved metadata/calibration from original session-only source media.

Assess keyboard focus, Escape during an annotation draft, unique-name errors,
explicit removal/recovery, narrow touch and actual browser zoom 200%. Confirm the
reopening footer is unobstructed by floating drawing controls. Record physical
mobile testing separately from emulation. Check visible recovery when browser
storage is unavailable; a current project download must retain in-memory schemes.

Return findings as concrete implementation prompts for the builder. Each should
state severity, trigger, planner consequence, expected/actual behavior, reproducible
steps, evidence paths/screenshots, bounded fix scope and an observable acceptance
check. Put material failures first and state untested areas and uncertainty.
