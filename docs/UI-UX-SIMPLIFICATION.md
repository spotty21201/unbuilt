# UI/UX simplification

The planner exposed drawing tools, setup, assistant controls, advanced parameters and transaction actions together. This pass retains the existing composition and colour scheme while showing fewer choices by default.

- Drawing, snapping, Muse, full settings, reports and files use named native disclosures. Selecting an object exposes its information; the main project screen starts with no arbitrary object selected.
- Site setup focuses on the current missing inputs. Products remain freely accessible; mix and corridor rules are disclosed with their current values and provisional status. Input stages show site commitments rather than a zero-yield layout.
- Lot coordinates, record IDs and detailed relationships are disclosed. Existing geometry locks, callbacks, validation and calculations are preserved.
- Failed/unresolved checks remain discoverable from a visible count. Before/after proposal quantities and blocking reasons remain beside acceptance. Idle Accept/Cancel buttons are removed; they return for a transaction.
- Project tools, advanced assumptions and reset operations are grouped. Muse remains mounted across disclosure and selection changes, preserving a pending request.

No domain calculation, AI request, geometry gesture, persistence format, product colour or framework dependency changed.

## Before and after

Desktop residential comparisons use the same fictitious 31-lot fixture, world camera and 1440×1000 viewport. The canvas presentation height changes; geometry does not.

| State | Previous UI | Simplified UI |
|---|---|---|
| Project | [Before](../evidence/ui-ux-simplification/run-2026-11-03/project-before.png) | [After](../evidence/ui-ux-simplification/run-2026-11-03/project-after.png) |
| Site inputs | [Before](../evidence/ui-ux-finishing/run-2026-11-03/after/site.png) | [After](../evidence/ui-ux-simplification/run-2026-11-03/site-after.png) |
| Accepted layout | [Before](../evidence/ui-ux-finishing/run-2026-11-03/after/layout.png) | [After](../evidence/ui-ux-simplification/run-2026-11-03/layout-after.png) |
| Selected lot | [Before](../evidence/ui-ux-finishing/run-2026-11-03/after/selected.png) | [After](../evidence/ui-ux-simplification/run-2026-11-03/selection-after.png) |

Additional views: [1024px](../evidence/ui-ux-simplification/run-2026-11-03/layout-1024.png), [375px](../evidence/ui-ux-simplification/run-2026-11-03/layout-375.png), [200% setup](../evidence/ui-ux-simplification/run-2026-11-03/zoom/setup.png), [200% schedule](../evidence/ui-ux-simplification/run-2026-11-03/zoom/schedule.png).

## Verification

- Production build and lint passed. The existing large-bundle warning remains. [Build log](../evidence/ui-ux-simplification/run-2026-11-03/build-final.log), [lint log](../evidence/ui-ux-simplification/run-2026-11-03/lint-final.log).
- 38 final production-browser checks passed: fresh project/boundary/road/entrance/products/mix, preparation and explicit end treatment, review/accept/cancel, lot hold, undo/redo, disclosure and keyboard access, blocked edits, schedules, alternatives, same-camera comparison, save/reopen and 1440/1024/375px overflow. [Results](../evidence/ui-ux-simplification/run-2026-11-03/final-browser/results.json), [log](../evidence/ui-ux-simplification/run-2026-11-03/final-browser.log).
- 55 project-management checks passed, including backups/import, deletion recovery, multi-tab protection and storage failures. [Log](../evidence/ui-ux-simplification/run-2026-11-03/projects.log).
- 7 actual 200% browser-zoom checks passed with the same physical window and half the CSS width. [Results](../evidence/ui-ux-simplification/run-2026-11-03/zoom/results.json).
- 95 residential SOP and 56 V2 domain checks passed. [Log](../evidence/ui-ux-simplification/run-2026-11-03/domain.log).
- React identity, hooks, derived state, labels, focus and disabled-state review completed. `git diff --check` passed.

The Muse browser check uses a controlled explanation response and the actual application lifecycle. It is not a live model test and makes no billed model call.

Reproduce the new browser check against a running build:

```sh
UNBUILT_TEST_URL=http://localhost:5184 \
UNBUILT_EVIDENCE_DIR=evidence/ui-ux-simplification/new-run \
node --experimental-strip-types --no-warnings tests/ui-simplification-browser.cjs
```

Set `PLAYWRIGHT_MODULE` if Playwright is installed elsewhere. Use a fresh evidence directory; the check uses disposable browser storage and fictitious projects.

Not tested: new human usability sessions, screen readers, physical devices, other browser engines, live model generation, or the full root suite. The reduced default interface still needs tester feedback. Existing engineering, geometry and SOP limitations remain.
