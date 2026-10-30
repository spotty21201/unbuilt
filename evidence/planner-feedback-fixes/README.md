# Features 1–3: owner-feedback fixes

Implemented 28 October 2026, within the existing milestone. Work remains
uncommitted. No roadmap features 4–15, cloud storage or model integration added.
All destructive checks used disposable browser contexts or temporary profiles,
never the owner's browser data or existing user projects.

## Reproduction before changes

- Confirmed Delete boundary opened “Start with a blank plan?” and shared the same
  state transition as Start blank plan. Consolidated the duplicate reset choices.
- Confirmed the library advised downloading a project but had no download action.
- Confirmed the boundary editor disclosed 1 m pointer snap only in a long note;
  fractional coordinates were supported but the displayed area rounded to whole m².
- Confirmed project switching discarded session history/photos without an advance
  warning. A pending boundary only set a status message blocking library access.
- Additional photo tests confirmed reset retained an image in memory while hiding
  its source controls, and Remove photo toggled the park lock instead of removing
  the image. `photo-reproduction.json` records the before/after result.
- Did **not** reproduce the reported right-edge inspector clipping. The exact
  original Chrome window size and zoom were not provided. Before-edit probes at
  1440×900, 1366×768, 1280×720, 1024×768, 960×640 and 375×812 found no overflowing
  editor controls. A real 1366-pixel browser window also fit at 100%, 125%, 150%
  and 200% zoom. See `reproduction.json`, `reproduction-zoom.json` and
  `before-1024.png`. The wrapping/action placement changes are preventive UX
  improvements, not a claim that the original condition was diagnosed.

## Resulting behavior

- Inspector content wraps within its available width. Apply/Cancel appears above
  the review and stays visible while scrolling the coordinate list. Narrow screens
  stack canvas and controls and use normal vertical page scrolling. The original
  consequence comparison remains intact. Keyboard focus has a light-blue outline.
- Pointer snap stays at **1 m** and is visible beside editor controls. Decimal
  coordinate entry remains supported in the 0–500 m local workspace. Draft area
  displays up to two decimals, explicitly rounded to 0.01 m²; review totals retain
  labeled whole-m² display rounding. No survey or map-reference accuracy is implied.
- Clear layout keeps the outline. **Delete boundary and layout** also serves the
  former Start blank plan function. Matching confirmations describe removed
  objects, retained name/economic assumptions, photo visibility and Undo lifetime.
- Every project entry has a working download; deletion offers Download before
  deletion. Files use the existing project format, including accepted geometry,
  planning settings, vacant-home reservations, manual lot edits, assumptions,
  commitments and decisions. Drafts/history/photos/results are excluded. Import
  creates a separate named project rather than overwriting another.
- A boundary draft offers Keep editing or Discard draft and open projects. Merely
  opening the library retains accepted-plan history/photos. Actual switch, create
  or import asks before ending Undo/Redo or losing a photo. A fresh project with
  no such state switches directly. Browser reload/close requests a native warning
  while draft/history/photo/failed-save recovery is at risk; project-deletion
  recovery also requests one. Native warning presentation remains browser-controlled.
- Site source/photo controls remain available on blank and boundary-only plans.
  Reset hides the photo without deleting it; Undo restores visibility. Remove
  photo now removes only the image and leaves park protections unchanged.
- Active, inactive and final project deletion keep other projects intact. The
  final deletion leaves an empty library; the most recent deletion can be restored
  within this app session. Deleting a project does not preserve its plan history
  or photo; that consequence is disclosed when relevant.

## Verification

| Check | Result | Evidence |
|---|---|---|
| Engine, geometry, persistence, server and search | 465 checks pass | `root-tests.log`; `npm test` |
| Focused owner-feedback browser journey | 54 checks pass | `feedback-results.json`; `feedback-browser.log` |
| Project/storage journey | 55 checks pass | `projects/results.json`; `projects-browser.log` |
| Lifecycle/keyboard/emulated touch | 20 checks pass | `lifecycle/lifecycle-results.json`; `lifecycle-browser.log` |
| Existing dynamic inspector | 59 checks pass | `regression-inspector/browser-results.json`; `inspector-browser.log` |
| Existing planner workflow | 41 checks pass | `regression-planner/browser-results.json`; `planner-browser.log` |
| Existing drawing viewport | 38 checks pass | `regression-viewport/viewport-results.json`; `viewport-browser.log` |
| Real browser zoom stress | 12 window/zoom combinations pass | `feedback-zoom-results.json`; `zoom-browser.log` |
| Actual 200% zoom plus keyboard creation/Apply | 7 assertions pass | `zoom-results.json`; `zoom-creation-browser.log` |
| Ordinary profile close/reopen and site-data removal | 2 checks pass | `storage-restart-results.json` |
| Editor text/control contrast | minimum 7.34:1 for enabled tested controls/text | `contrast.json` |
| Production build and lint | pass | `build.log`; `lint.log` |

The six ordinary browser suites total **267 checks**. They cover exact 6,006 m²
rectangle and 5,986.75 m² decimal edit, 11,000/10,400 m² irregular outlines,
validation/duplicate/nonfinite/crossing handling, pointer/keyboard edits and
history, storage errors/conflicts/corruption, actual backup/import, cancelled and
confirmed reset/deletion, photo visibility and removal, individual/multiple home
removal and safe restoration. Root fixtures also verify concave polygon area,
containment and overlapping vacant reservations after regeneration.

At 100%, tested content viewports are **1440×900, 1366×768, 1280×720, 1024×768,
960×640 and 375×812**. Long project names, large numbers and the full 64-vertex
limit were used. Scrolling/focusing the final coordinate leaves Apply/Cancel in
view and the focused coordinate unobscured. Representative captures were visually
inspected; this is not owner workflow/aesthetic sign-off.

Real zoom uses `chrome.tabs.setZoom/getZoom`, checks DPR and actual content width,
and captures the physical browser through CDP. It is not CSS zoom or a narrow
viewport substituted for browser zoom.

| Physical browser-window width | Actual zoom | Content viewport (CSS pixels) |
|---|---|---|
| 1440 | 100% | 1440 × 769 |
| 1440 | 125% | 1152 × 615 |
| 1440 | 150% | 960 × 513 |
| 1440 | 200% | 720 × 384 |
| 1366 | 100% | 1366 × 769 |
| 1366 | 125% | 1093 × 615 |
| 1366 | 150% | 911 × 513 |
| 1366 | 200% | 683 × 384 |
| 1024 | 100% | 1024 × 769 |
| 1024 | 125% | 819 × 615 |
| 1024 | 150% | 683 × 513 |
| 1024 | 200% | 512 × 384 |

The separate 200% keyboard-creation test uses a 1440×988 outer window, recording
1440×901 at 100% and 720×450 at 200% in this environment.

## Reproduce

```bash
npm test
npm --prefix web run build
npm --prefix web run lint
export PLAYWRIGHT_MODULE=/home/spotty/projects/studioos/node_modules/playwright
node tests/planner-feedback-fixes-browser.cjs
xvfb-run -a node tests/planner-feedback-fixes-zoom.cjs
node tests/planner-feedback-fixes-storage.cjs
UNBUILT_EVIDENCE_DIR=evidence/planner-feedback-fixes/projects node tests/projects-browser.cjs
UNBUILT_EVIDENCE_DIR=evidence/planner-feedback-fixes/lifecycle node tests/project-lifecycle-browser.cjs
UNBUILT_EVIDENCE_DIR=evidence/planner-feedback-fixes xvfb-run -a node tests/browser-zoom.cjs
```

The three existing regression scripts use `UNBUILT_EVIDENCE_DIR` to target their
named folders above. Their import walks now explicitly confirm leaving a session
when the new guard applies. Servers: production preview on 5173; deterministic
tool server on 5174. Final production files are `index-CYa6bWUe.js` and
`index-CTjffDiq.css`. Earlier functional captures may retain `index-CUw_exah.js`;
the final change only prevents the library Close label wrapping within its
header. The final viewport/project/focused suites and keyboard zoom check run
against the final files. Diagnostic failed test captures are preserved separately
in `iteration-probes/`; fixture assertion/selector repairs are not product defects.

## Limits and open gates

- Storage remains browser/device-local. Ordinary temporary Chromium-profile
  restart was verified, including accepted-state equality across both projects.
  Clearing that profile's site data removed its test project. This does not
  establish persistence in the owner's Incognito session or after its final
  private window closes. No private-mode detection or durable/cloud guarantee.
- Download backups before private-session exit or site-data cleanup. Existing
  non-atomic cross-tab conflict detection and failed-save in-memory recovery stay
  in place. No simultaneous collaboration is promised.
- Plan Undo/Redo ends on switching, reload or close. Only the most recent project
  deletion is recoverable until app reload/close. Photos are session-only and
  absent from backups. Native before-unload warnings cannot guarantee recovery
  after a crash, forced termination or mobile/browser policy suppression.
- Snapping is fixed at 1 m for pointer edits; no new configurable increment was
  added. Decimal coordinate entry retains its values. Area display rounding is
  separate from coordinate precision and never establishes survey accuracy.
- Bounded routing, single park/template and other existing geometry limits remain.
  Synthetic touch tests retain the documented post-drag click recovery; physical
  touch-device reliability and owner aesthetic/task acceptance remain open.
