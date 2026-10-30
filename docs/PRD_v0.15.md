# Unbuilt — PRD v0.15: saved alternatives

The owner requested **Feature 10: Saved alternatives — name, reopen, compare and
annotate different schemes**, after saving the feasibility tester prompt and
committing/pushing completed work through Feature 9. This title defines the
increment; saved alternatives was item 13 in the historical PRD v0.8 roadmap.
Planning brief, land budget, walkability and later roadmap topics remain outside
scope. The prior feasibility, open-space and housing tester prompts stay unchanged;
Feature 8 independent testing remains deferred.

## Planner workflow

Open **Alternatives** in the workspace navigation or **Saved alternatives** in
the inspector. The manager is available on blank and boundary-only projects so a
saved layout can be reopened after clearing or deleting the working boundary.

A project may hold up to 20 independently named schemes. Save the accepted working
plan, or explicitly choose an unapplied current search preview as the source.
Supply a unique name (1–100 characters) and optional scheme-level rationale or
review notes (up to 4,000 characters). Saving a preview does not apply it or change
the accepted plan. Pending geometry, context and feasibility edits must be applied
or cancelled before opening the manager.

The collection stores independent copies of each scheme’s complete accepted
inputs: site/boundary, contents and vacancies, entrance, named open spaces and
commitments, streets, manual lots and polygon reshapes, housing templates and
assignments, price/profile/ceiling/owner/target assumptions, editable costs and
site context. Working edits never overwrite a saved copy. To retain an edited
version, save it under a new name. No automatic named-branch switching or in-place
geometry overwrite is introduced.

Choose any two schemes, the working plan, or the current search preview for
comparison. Each drawing uses that scheme’s actual geometry and its own local
coordinates. Fit/pan/zoom/layers remain available. Drawings fit independently;
when boundaries differ, compare dimensions and measured areas rather than their
apparent screen size. Comparison controls and camera positions are session-only.

## Measured comparison and annotations

- Before/after/change columns for site area, homes, built area, street surface,
  true designed green, lot area, unallocated land, non-land cost, revenue,
  surplus, land allowance, owner outcome and required selling price.
- Every side uses its own saved financial assumptions. An inspectable table
  identifies selling price, ceiling, owner benchmark, target, and all eight costs.
  Deltas combine all changed inputs, rather than claiming isolated design savings.
- Geometry errors withhold that scheme’s drawing and modeled quantities/finances.
  Incomplete financial strings withhold finances without inventing zero costs or
  revenue. Blank/boundary-only schemes have no layout economics. Profile and price
  warnings remain visible; assumptions are not quotations or market verification.
- Rename and edit multiline notes through explicit Save/Cancel details. Only
  metadata changes; the saved geometry and assumptions are not rewritten.
- While details are being edited, comparison navigation is disabled. Escape/Close
  retains the edit and asks the planner to Save or Cancel details first.
- Removing a scheme requires explicit confirmation and does not affect the
  working plan. One removed scheme can be restored while the manager stays open;
  a duplicate name or a full collection prevents that restore with a reason.

## Reopen and recovery

Review reopening first compares the current working plan with the selected saved
scheme and states the replacement scope. **Reopen saved scheme** explicitly
replaces working inputs with the snapshot. Cancel reopening or close the manager
leaves the working plan unchanged. Invalid geometry or orphaned lot reshapes block
reopening rather than silently dropping edits.

A confirmed reopening is one global plan-history step. Undo restores the complete
prior working plan; Redo restores the chosen scheme. The collection, names and
notes are independent of plan Undo/Redo, so recovery cannot erase newly saved work.
The event log remains append-only. Existing search previews and transient results
end on reopening; new calculations bind to the restored active plan.

Reference photos and original survey/PDF media are not captured. Reopening hides
the reference photo, retains available session attachments, and may require
reattachment of survey media if its saved fingerprint/page differs. Original media,
active drafts, global history and source comparison runs do not become durable by
saving a scheme. Site context annotations and calibration metadata are captured.

## Persistence contract

`PersistedProject.alternatives?: SavedAlternative[]`:

| Field | Contract |
|---|---|
| id | unique project-scoped identifier, 1–100 ASCII letters/digits/_/-; working/preview reserved |
| name | trimmed unique scheme name; comparison ignores surrounding space/case |
| note | plain text, up to 4,000 characters |
| createdAt / updatedAt | valid date strings; metadata edits retain creation date |
| state | full independent PersistedState; no nested scheme collections |

Projects with a collection, including `[]`, use project v12; decision records use
v13 and carry the collection alongside the accepted working state. Earlier formats
cannot disguise collections. Imports validate every snapshot and refuse the whole
project on an invalid scheme, repeated identity/name, invalid cost/geometry input,
nested collection or excess count. Existing legacy projects remain readable and
keep their existing envelopes while no collection exists.

Project Save, autosave, project-library downloads and decision-record export/import
all retain the collection. Import creates a separate project; changing its scheme
notes never changes the original. Collections survive Clear layout, Delete boundary
and working-plan edits. Browser storage conflicts/quota failures retain the disk
copy and the in-memory collection, visibly report the failure, and leave the
current project exportable for recovery. Storage remains local to this browser.

The active-plan server snapshot stays at its existing geometry/cost version.
Unselected saved schemes and annotations are not sent as calculation inputs. This
avoids repricing a saved plan from current working assumptions or mixing the
collection into search/proposal stale-state bindings.

## Acceptance and limits

Verify snapshot isolation, exact saved assumptions, scheme-specific financial
results, name/note validation, complete input preservation, format gates and
portable collection imports. Exercise actual served UI: create, annotate, cancel,
reopen review/Undo/Redo, save an unapplied search preview, reload, import as a
separate project, clear/delete and recover, storage failure and export backup,
keyboard focus, narrow touch and actual browser zoom 2.0. Inspect screenshots.

No cloud collaboration, automatic merge, spatial comment-thread system, preferred
scheme voting, scenario tree, per-scheme event-history replay, cross-project
comparison or market-data verification is implied. Notes describe a scheme;
existing site-context annotations remain the tool for location-based observations.

Results and verification limits: `evidence/saved-alternatives/README.md`.
