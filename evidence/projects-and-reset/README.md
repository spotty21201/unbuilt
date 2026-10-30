# Features 1–3 verification

Implemented for owner review on 2026-10-28. Work is uncommitted. Earlier PRD and
verification evidence remain historical. Scope: project management, removal and
blank starts, and boundary editing; roadmap features 4–15 were not implemented.

Production UI at `http://localhost:5173`, deterministic server at port 5174.
Final asset: `index-BOKfaoMI.js`; CSS: `index-DyPttwCe.css`. The preview serves the
production build, not a separate development UI. The final refinement darkens
the project creation button to a measured 6.10:1 white-text contrast; functional
regression captures from the preceding build retain their recorded asset IDs. `server-health.json` reports
`adapter: mock`, `modelConfigured: false`. No real-model round trip is claimed.

## Supported behavior

- A named, device/browser-local project library supports blank/sample creation,
  rename, autosave and Save, open, confirmed deletion and session Undo of the
  most recent project deletion. The old single-project storage entry is kept
  unchanged after migration. Imports create separate named projects.
- Each project stores its accepted site, parameters, manual lot edits, removed
  homes, constraints, financial inputs and decisions. Drafts, undo history,
  searches, comparisons and photos are session-only; opening another project
  starts a separate workspace session. Files provide portable accepted-plan
  backup, including a current in-memory backup after a failed save.
- Removing homes keeps vacant lots, removes their footprints and subtracts their
  construction cost/revenue. Original lot rectangles become no-home reservations;
  any regenerated lot intersecting one stays vacant. Restore is explicit and
  refuses when a vacant lot's edited shape can no longer fit its home.
- Clear layout removes dependent generated objects and park protections but
  keeps the boundary and assumptions. Delete boundary/Start blank remove the
  outline as well, keeping the project name/assumptions. Confirmations and plan
  Undo/Redo protect these operations; a locked site must first be unlocked.
- Blank plans have no implicit rectangular boundary. Draw/edit a simple polygon
  of 3–64 vertices in the local 0–500 m workspace, with true area, snapping,
  coordinate/keyboard alternatives, vertex dragging/insertion/removal, invalid
  edge feedback, Apply/Cancel and draft/accepted history. Added/removed corners
  rebase explicit entrance edges; corner movement keeps the along-edge fraction.
- Applying the first outline leaves a boundary-only plan. Explicit Generate
  layout checks a bounded starter Spine arrangement using assumed park/gate
  locations. Only a contained, validated layout with homes is accepted. Failure
  retains the outline and explains the limit; it does not prove infeasibility.
  Empty layouts carry no generated geometry and are not priced or recommended.
- Project/scenario version 5 and decision record version 6 carry plan contents.
  Older supported plans remain accepted; older envelopes cannot silently contain
  the new fields. Existing bounded routing and irregular-site limits remain.

## Checks and reproduction

| Check | Result | Source / evidence |
|---|---|---|
| Root suite | 465 passed, including 25 project/content checks and blank server behavior | `npm test`; `root-tests.log`; `tests/projects.mjs` |
| Production build | Passed | `npm --prefix web run build`; `build.log` |
| Lint | Passed | `npm --prefix web run lint`; `lint.log` |
| Project journey/storage | 55 passed | `tests/projects-browser.cjs`; `results.json`; `projects-browser.log` |
| Lifecycle/keyboard/touch | 20 passed within described emulation scope | `tests/project-lifecycle-browser.cjs`; `lifecycle-results.json`; `lifecycle-browser.log` |
| Existing dynamic inspector | 59 passed | `regression-inspector/browser-results.json`; `inspector-browser.log` |
| Existing planner flow | 41 passed | `regression-planner/browser-results.json`; `planner-browser.log` |
| Existing full viewport | 38 passed | `regression-viewport/viewport-results.json`; `viewport-browser.log` |
| Actual browser zoom | 7 assertions passed | `tests/browser-zoom.cjs`; `zoom-results.json`; `zoom-browser.log` |

Browser scripts use the installed Playwright through `PLAYWRIGHT_MODULE`.
`UNBUILT_EVIDENCE_DIR` redirects regression output here. The browser-zoom script
runs under `xvfb-run -a` with a browser extension calling the actual tab zoom API.
It verifies zoom = 2, the same window, halved CSS width and doubled pixel ratio;
this is not CSS zoom or an emulated narrow screen.

Walks include a hand-calculated five-sided 11,000 m² outline, moving its north
corner to produce 10,400 m², add/remove and whole-drag Undo, invalid crossing and
Cancel, save/reload, explicit validated generation, home removal and recovery,
clear/delete/restart, isolation between named projects, independent import,
active/last-project deletion, in-flight explanation isolation, corrupted storage,
quota failure and cross-tab write conflict. A vacant-lot reshape also verifies
that an unfitting home cannot be restored. Existing suites retain other object
editing, request → proposal → search → preview → apply, comparison, measured
explanations and stale/in-flight input handling.

## Visually inspected captures

- `blank-1440.png`: named empty project with drawing guidance and no false metrics.
- `project-library.png`, `library-1440.png`, `library-1024.png`, `library-375.png`:
  named projects, creation and device-save scope; modal scrolls within viewport.
- `viewport-1440.png`, `viewport-1024.png`, `viewport-375.png`: full drawing surface,
  irregular generated site and responsive inspector/quantity strip.
- `invalid-outline.png`: highlighted conflicts and disabled Apply.
- `removed-home.png`: vacant lot, selected-lot context, 19 remaining footprints.
- `touch-site.png`: emulated touch-created/dragged, applied boundary-only plan.
- `zoom-200-actual.png`, `zoom-200-projects.png`, `zoom-200-editor.png`: physical
  browser captures at actual 200% zoom, including named blank project creation.

## Limits and open gates

Storage is local to this browser/device. This is neither cloud saving nor shared
concurrent editing. Comparing stored content detects an already changed tab;
it is not an atomic simultaneous-writer transaction. Keep portable backups.
Project-deletion recovery and all plan histories expire on reload/leaving the
session. Named unapplied alternatives are not persisted.

Routing remains bounded orthogonal Spine / restricted fixed Loop, one rectangular
park and one shared housing template. No holes, disconnected boundaries, arbitrary
road networks, general maximum-yield solver or verified public/legal access was
added. Starter park/access choices are assumptions for review.

Touch drawing, vertex dragging and applying the result were exercised through
Chromium emulation. An isolated native-button probe reproduced suppression of the
first synthetic tap after a CDP touch drag; the lifecycle test recovers that
synthetic click before checking Apply. This is explicitly not proof of reliable
immediate post-drag taps on physical hardware. Physical-device touch and owner
workflow/aesthetic acceptance remain open. A real model is not connected; that
integration and its round-trip gate remain open as before.

`iteration-probes/` contains earlier diagnostic captures/logs, not final acceptance
screenshots. The JSON plan files here contain fictional test data only.
