# Feature 7 — Housing mix

Implemented 29 October 2026, following the
[Feature 6 review corrections](../lot-review-followup/README.md).
Requirements: [PRD v0.12](../../docs/PRD_v0.12.md). Earlier PRDs, workspace changes
and evidence are preserved. All work is uncommitted; Feature 8 has not started.

## Supported planner workflow

Select a home lot or group and choose **Edit housing mix**. The dedicated inspector
supports a reusable library of up to 20 named home templates. Each has a stable
T-code and rectangular width/depth between 4 and 16 m. The existing one-storey,
one-home-per-occupied-lot, rotatable placement model remains explicit.

Create/name/edit a template, preview it and choose a default. Assign templates to
individual lots, a multiple selection, a connected block or all lots. Canvas selection
and Shift-selection update the same target list; keyboard and native multiple/touch
selectors remain available. Template colors and T-codes on footprints match the
schedule; selected-lot text identifies the actual assigned name and area.

Opening the editor creates a draft and holds the current parcel partition. Review
accepted→proposed homes, total built area, construction and land allowance. Assignment
previews bring the comparison into view. Apply is blocked for bad/unpreviewed form
fields or invalid geometry. Oversized homes identify/highlight their affected lots;
the accepted plan and last-valid figures stay visible. Cancel preserves the complete
accepted library and geometry. Apply is one plan-history step, with Undo/Redo.

Templates in use as a default or explicit reservation cannot be deleted until they
are reassigned. Unused templates can be deleted within the reviewed draft. Vacant
lots reserve a template without adding a home, built area, construction or revenue.
The existing separate Restore removed homes action checks actual fit.

Exact rectangle identity binds assignments, including later polygon reshapes. Lot
split/subdivision inherits a common source template. Differing source templates use
the chosen default, disclosed with resulting names before applying a merge. Orphan
assignments cannot be silently ignored. Infrastructure edits hold the partition and
block conflicts. Clear/delete layout removes old parcel assignments, preserves the
library and remains undoable. Boundary-only setup can manage the reusable library
before regenerating a layout.

To return to generated lots, explicitly preview/apply all lots using the default
first; the library remains. Existing generated-lot review then applies. This avoids
silently redistributing lot-specific assignments during frontage search.

## Calculations and data

Built area sums each occupied template's width × depth. Home construction uses that
sum, not the default area multiplied by all homes. The existing shared selling price,
construction rate, works allowances, contingency and finance calculation remain.
Pricing stays labelled provisional: a different home size is not market evidence.

Independently checked sample examples:

| Proposed mix | Homes | Built area | Home construction at Rp5m/m² |
| --- | --- | --- | --- |
| Original 20 × 60 m² | 20 | 1,200 m² | Rp6.00bn |
| Nineteen originals + one 8×6 m Courtyard | 20 | 1,188 m² | Rp5.94bn |
| Eight originals + twelve 6×6 m Garden homes | 20 | 912 m² | Rp4.56bn |
| Nineteen originals + vacant Courtyard reservation | 19 | 1,140 m² | Rp5.70bn |

The single Courtyard substitution saves Rp60m construction plus Rp3m contingency,
so measured allowance rises Rp63m with revenue unchanged. The assumed selling price
is still shared and unverified. Streets, park and lot areas stay fixed.

Optional `planning.housing` stores `{templates, defaultId, assignments}`. Templates
carry `{id,name,width,depth}`; assignments use exact base-rectangle keys. Mixed plans
use project **v9**, decision record **v10**, snapshot **v8**, capability `housing-mix`.
Old supported plans remain compatible. Older envelopes reject hidden mix data;
validation rejects missing/duplicate IDs/names, invalid dimensions/keys/references,
excessive templates/assignments and orphan geometry. Canonical hashes cover all mix
inputs. Save/reload and backup/import as a separate project retain the full library,
assignments, vacancy and compatible polygon work.

The tool server uses the same placement and summed costs, returning the measured
schedule/built area with explanations. Existing stale-result and in-flight response
protections remain. No model connection was added or claimed; the local preview
continues to display “no model.”

## Verification and screenshots

Local production preview: `http://localhost:5173`, asset `/assets/index-sMEDWtD5.js`. Tool server: port 5174. Focused
browser and actual-zoom JSONs record the tested asset. Tests use isolated browser
profiles and fictional/sample studies, not the owner's saved browser projects.

- Root `npm test`: **588 checks passed**, including 17 housing engine/data checks
  and eight new server HTTP checks. [root.log](root.log), [engine.log](engine.log).
- Focused housing browser: **39 checks passed**; exact checks and asset in
  [browser-results.json](browser-results.json), [browser.log](browser.log).
- Actual browser zoom **200%**: browser API=2, same physical window, CSS width
  1,440→720 and DPR 1→2. Creation, assignment, drawing/review, Apply, Undo/Redo and
  reflow passed. [zoom-results.json](zoom-results.json), [zoom.log](zoom.log).
- Existing inspector/browser journey: **59 passed**, including request→proposal→
  search→preview/apply, comparison, server explanation, stale clearing and rejection
  of an in-flight response after an assumption changes. [inspector.log](inspector.log).
- Street review regression: **33 passed**. [streets.log](streets.log).
- Lot workflow regression: **43 passed**. [parcels.log](parcels.log).
- Feature 6 review follow-up: **12 passed**. [Review report](../lot-review-followup/README.md).
- Fresh live tool-server check against the exported mixed plan returned **1,188 m²**
  and **19 + 1** template counts after restarting on the current source:
  [live-server-measurement.json](live-server-measurement.json).
- Web production build and lint passed; `git diff --check` passed.
  [build.log](build.log), [lint.log](lint.log). A nonfatal main-chunk size warning
  remains; its threshold was not changed.

Focused housing coverage includes template creation, canvas/keyboard target selection,
individual and block assignments, default change, valid rotation, invalid fit/repair,
in-use deletion protection, unused deletion/Cancel, vacant reservations, applied
mixed-source merge/Undo, exact save/reload and versioned export/import, explicit
regeneration protection, clear-layout recovery/setup editing, responsive review and
emulated touch application. Server fixtures independently measure a mixed 19-home
manual partition and reject downgraded/invalid/missing-capability snapshots.

Captured screenshots are opened for visual inspection; passing CSS/tests alone is
not treated as visual acceptance:

- [Individual assignment review](one-template-review.png)
- [Block assignment](block-assignment.png)
- [Invalid template fit](invalid-template.png)
- [1440×900 editor](editor-1440.png) and [drawing](drawing-1440.png)
- [1024×768 editor](editor-1024.png) and [drawing](drawing-1024.png)
- [375×812 editor](editor-375.png) and [drawing](drawing-375.png)
- [Actual 200% review](zoom-200-housing-editor.png) and [drawing](zoom-200-housing-plan.png)
- [Emulated touch](touch-assignment.png)

Regression results identify their own builds. Focused housing/zoom evidence was
refreshed after the final housing selection/review changes.

## Limits and open gates

This is a bounded manual housing schedule, not automatic mix optimization. It does
not add template-specific prices, bedrooms, multiple storeys, multiple homes per lot,
free footprint positioning, arbitrary polygon building templates or regulatory
approval. All templates use the shared provisional selling-price assumption and
construction rate. A valid geometric template is not proof of demand or achievable
price. Assignments hold the manual partition; frontage search cannot silently move
them to different lots.

Existing reshaped lots retain the assigned placed footprint and 2 m ring; full 3 m
front/rear polygon setbacks remain unverified and visible. Arbitrary polygon block
splitting/merging and blocks in unused land remain future discovery. Project backups
retain accepted plans, not draft/session history, unsaved alternatives or original
survey media. T-codes identify templates; lot numbers are planning references.

Independent human planner acceptance, physical-device touch, suitable survey,
external access, market assumptions and legal/engineering review remain open.
A real-model round trip remains open. Automated browser emulation is not a physical
hardware or professional-validation sign-off.

[Human planner retest prompt — return all findings as implementation prompts](TESTER-PROMPT.md).
