# Residential planner review follow-up

The supplied review reports successful accepted-plan creation, boundary area,
home removal and recovery, with **no confirmed correctness defect**. Its central
concern is professional reliance and continuity of a study. Do not convert the
review's untested tasks into failures or treat its references as verified surveys.

The tree now includes the approved Feature 4 increment in PRD v0.9. PRD v0.8 is
historical for features 1–3; its earlier unapproved Feature 4 wording is superseded
by v0.9. Reference annotations are deliberately independent of generated roads,
protected land and feasibility inputs. The new requests below extend that scope.

## Disposition

| Planner request | Current response | Remaining work |
|---|---|---|
| Continue unfinished boundaries after consulting another project | Current accepted-plan protection and explicit discard/keep warning retained | Draft retention across project switches needs a separate recovery contract, including invalid/incomplete corners, draft history and reload/backup scope. Not implemented here. |
| Recover client-meeting materials | Local-save scope and complete backup exclusions remain accessible; imports remain separate projects | Persistent alternatives, comparisons and source media need storage/backup design. Existing accepted-plan backups do not provide them. |
| Relate candidate entrances to surrounding streets | Existing street/access annotations retain source and assumed/documented status | A linked street-to-gate relationship, evidence and independent permission/verification state are proposed extensions. No verified external connection was added. |
| Understand source scale/orientation/alignment together | Existing calibrated PDF/image reference is retained; current automated fixture workflow rechecked | Real survey alignment and planner verification remain open. Existing-source documentation must not imply certified accuracy. |
| Protect actual areas/corridors | Point annotations remain informational | Polygon/corridor geometry, explicit enforcement choice, overlap checks and engine/search/persistence consequences need scoping. No obstacle or protected-area solver was added. |
| Explain unavailable home restoration | **Implemented:** adjacent, programmatically associated reason states the edit that must finish and distinguishes that from a fit failure | Human review of the revised wording; automatic checks cover Cancel and Apply paths, plus existing undersized-lot refusal. |
| Understand and repair invalid boundaries | **Rechecked:** conflicting edges, disabled invalid Apply, actual pointer repair, valid Apply and Cancel preserving accepted geometry | Physical-device and independent planner walkthrough remain open; no new validation capability is claimed. |
| Reach project actions and selected properties on mobile | **Implemented:** New project action at library top scrolls to/focuses the creation form; long backup explanation becomes an expandable disclosure; local-storage warning stays visible | Further mobile drawing-label preferences and physical gestures remain owner-review items. Selected-object readout/focus retained. |

## Proposed larger follow-up order

The owner was asked which larger area to prioritize: draft continuity, client
materials or context linked to planning. No selection has been received during
this follow-up. Draft continuity is the suggested first increment because it
addresses a direct interruption in an already supported drawing workflow.

For draft continuity, define whether recovery is session-only or durable, how a
recoverable draft is labelled separately from the accepted plan, how it is
validated on return and what a backup contains. Preserve Apply/Cancel and the
accepted plan; never save an invalid draft as accepted geometry.

For client materials, define named scheme/comparison records and actual media
storage, quotas, backup format, missing-file handling and recovery after storage
failure. Saving calibration metadata is not the same as saving the source file.

For context enforcement, first distinguish a documented reference, a proposed
connection and a planner-enforced land restriction. Any new geometry input must
reach generation, validation, quantities, search, snapshots, persistence and
comparison. Keep geometric checking separate from legal/public access evidence.

AI opportunities remain proposals. No real-model integration, access permission,
survey certification or new measurement source is introduced by these fixes.

Evidence and retained owner captures: `evidence/planner-review-followup/README.md`.
All work is uncommitted; no later-roadmap implementation was started here.
