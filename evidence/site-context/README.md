# Feature 4 — Site context verification

Implemented for owner review on 28 October 2026. Features 5–15 were not implemented.
Work is uncommitted. Existing workspace material was preserved. Browser tests used
isolated contexts/temporary profiles and fictional files, never owner projects.
Approved requirements: `docs/PRD_v0.9.md`.

## Where to start

Choose **Context** in the left tool rail, or **Site context & survey** in the
inspector. The same workflow works on blank, boundary-only and developed plans.

- **PDF/PNG/JPEG surveys:** import a file, choose a PDF page, select A/B or enter
  pixel coordinates, enter their known separation in metres, and declare the
  local position and direction. Apply displays the calibrated reference through
  the plan's metre projection. Each new source/page requires an entered distance;
  no guessed distance is accepted. Visibility is a presentation toggle.
- **CSV/DXF boundaries:** import, select an outline if several exist, review units
  and optional local-origin translation, then Review imported boundary. The
  established boundary editor shows true area and layout consequences before
  Apply. Cancel retains accepted work; one Undo restores geometry and source.
- **Surrounding context:** add a reference-street polyline, existing-feature point
  or possible-access marker. Place on the plan or use coordinates. Label, source,
  uncertainty and notes accompany each saved annotation. These references are
  independent of generated roads, obstacles, reservations and costs.

## Supported formats and explicit limits

PDF uses a locally bundled renderer, worker, standard fonts/CMaps and decoder
resources; code/resources load only when needed. Pages are rendered separately,
with a 2,200-pixel longest-side target (up to 3× page scale). PNG/JPEG may contain
up to 20 megapixels. Source files are limited to 20 MB. Password-protected PDFs
must be unlocked first. Replacing/cancelling a draft never removes the currently
accepted attachment or changes its saved calibration.

Calibration is a uniform scale and rotation, not CRS/georeferencing, perspective
correction, surveyed accuracy or automatic image measurement. The displayed
scale is declared by the user. A/B must be at least 2 image pixels apart; the
known separation must be positive and at most 500 m. A is anchored within the
local 0–500 m planning workspace. The reference may extend outside the outline.

CSV uses two ordered columns, optional `x,y` or `easting,northing` header, comma/
semicolon/tab separators and an optional repeated closing point. For example:

```csv
x,y
0,0
77,0
77,78
0,78
```

ASCII DXF supports straight, closed **model-space LWPOLYLINE and 2D POLYLINE**.
Layer/candidate selection is explicit; unsupported polylines report omissions.
Curved/bulged edges, 3D/fitted/mesh entities, rotated extrusion planes, paper-space,
blocks, holes and DWG are unsupported. No implicit merging/flattening or automatic
adoption of other drawing entities occurs. Declared vertex counts must match.
The supported subset follows the [official polyline group-code reference](https://help.autodesk.com/cloudhelp/2017/ENU/AutoCAD-DXF/files/GUID-748FC305-F3F2-4F74-825A-61F04D757A50.htm).

CSV/DXF units are metres, millimetres or international feet. DXF unit metadata is
only a suggestion to review, using the [documented INSUNITS values](https://help.autodesk.com/cloudhelp/2021/ENU/AutoCAD-DXF/files/GUID-A85E8E67-27CD-4C59-BE61-4DC9FADBE74A.htm).
Optional rebasing translates the minimum easting/northing to local zero without
resizing or rotating; original origin in metres is retained. File limit is 2 MB,
with at most 200 DXF candidates shown. The accepted outline must satisfy existing
3–64 vertex, simple polygon, 0–500 m and minimum 1 m² rules. There is no CRS
conversion or GeoJSON import in this increment.

Context supports up to 100 annotations; street references use 2–20 distinct points,
feature/access markers one point. Local context points may range from −500 to
1,000 m to describe surroundings. Assumed/unverified versus documented-by-user is
visible; neither verifies legal/public access or connects an actual entrance.
Reference graphics do not reserve development land or affect calculations.

## Persistence and recovery

- Project **v6** / decision-record **v7** carry optional `siteContext`. Earlier
  formats still load; older envelopes cannot carry context silently. Strict
  context validation rejects unknown media/resource fields and invalid geometry.
  Source citation text is allowed; it is never fetched automatically.
- Accepted calibration, source identity, boundary provenance and annotations
  persist through local autosave, backups/import and plan Undo/Redo. Record and
  project backups include the metadata, not original PDF/image bytes.
- Original source files stay external/session-only. Keep them. Reopening or
  switching projects requires reattachment; a matching file fingerprint, page and
  dimensions restores calibration. Different media requires a new calibration.
  Fingerprinting guards accidental reattachment, not source authentication.
- Project departure warns about attached media, and pending context edits must
  be applied/cancelled before switching. References remain project-isolated.
- Source boundaries use the normal Apply/Cancel/Undo and incompatible-lot review.
  Boundary locks prohibit import; they still allow reference work. Geometry
  gestures and mode changes cannot discard pending context work.
- Site context survives clearing/deleting the plan boundary. Its alignment must
  be reviewed after moving/changing the site. Original-photo session behavior,
  local-storage failure backups and non-atomic cross-tab safeguards remain.

## Checks actually run

| Suite | Result | Evidence |
|---|---|---|
| Core geometry, persistence, server, search and source/calibration models | 490 checks pass, including 25 new context checks | `root-tests.log`; `tests/site-context.mjs` |
| Main feature journey | 33 checks pass | `browser-results.json`; `browser.log` |
| Source replacement, errors, storage failure, switching, navigation and touch | 23 checks pass | `recovery-results.json`; `recovery-browser.log` |
| Existing project/storage journey | 55 checks pass | `projects/results.json`; `projects-browser.log` |
| Existing inspector/planning geometry | 59 checks pass | `inspector/browser-results.json`; `inspector-browser.log` |
| Existing planner workflow/assistant | 41 checks pass | `planner/browser-results.json`; `planner-browser.log` |
| Existing viewport | 38 checks pass | `viewport/viewport-results.json`; `viewport-browser.log` |
| Pointer boundary range | 31 checks pass | `pointer/results.json`; `pointer-browser.log` |
| Existing lifecycle/keyboard/emulated touch | 20 checks pass | `lifecycle/lifecycle-results.json`; `lifecycle-browser.log` |
| Prior owner-feedback fixes | 54 checks pass | `prior-feedback/feedback-results.json`; `prior-feedback.log` |
| Survey calibration at real browser zoom | 8 window/zoom combinations pass | `zoom-results.json`; `zoom-browser.log` |
| Existing actual 200% boundary creation/cancel | 9 check groups pass | `zoom-boundary/zoom-results.json`; `zoom-boundary.log` |
| Production build and lint | Pass, no lint warnings | `build.log`; `lint.log` |

The browser suites total **354 checks**, separate from the eight real-zoom
combinations and nine existing zoom check groups. Tests exercise a hand-calculated
77×78 m = **6,006 m²** CSV, a DXF expressed in millimetres with global origin
400,000/500,000 m explicitly translated to local origin, multi-page PDF selection
before calibration, bundled-font text rendering, and a **100 m calibration measured
against the actual 77 m boundary** in the browser.

Other walks cover PNG/JPEG, actual pixel picking and typed values, wrong/zero
scale, corrupt PDF, oversize files, replacement/cancel/Undo, mismatched media,
matching reattachment, three annotation kinds, marker placement, locks,
unchanged plan metrics, geometry/source Undo, independent record import,
reload/project isolation, context/save failure backup and recovery, and Chromium
emulated access-marker placement. Pure checks include irregular/invalid CSV,
closed legacy DXF, multiple candidates, omitted curved/open/3D/paper-space
polylines, decimal plane metadata, contradictory counts, rotations, strict
validation and format downgrades.

Ordinary feature viewports: **1440×900, 1024×768 and 375×812**. Existing feedback
regressions also cover **1366×768, 1280×720 and 960×640**, long names and 64-vertex
boundaries. Calibrated PDF and annotation captures were visually inspected.

Actual zoom uses the browser tabs API, verifies getZoom/DPR and records real CSS
viewport dimensions; screenshots use CDP physical captures rather than simulated
narrow-width/CSS zoom:

| Physical window width | Browser zoom | Content viewport (CSS pixels) |
|---|---|---|
| 1440 | 100% | 1440 × 901 |
| 1440 | 125% | 1152 × 721 |
| 1440 | 150% | 960 × 601 |
| 1440 | 200% | 720 × 450 |
| 1024 | 100% | 1024 × 901 |
| 1024 | 125% | 819 × 721 |
| 1024 | 150% | 683 × 601 |
| 1024 | 200% | 512 × 450 |

Representative captures: `calibrated-pdf.png`, `annotated-pdf.png`,
`context-1440.png`, `context-1024.png`, `context-375.png`, `zoom-1024-200.png`.
Files named fictional survey and exported recovery/record JSON contain test data
only. Earlier selector/pointer-tolerance diagnostics are in `iteration-probes/`.

## Reproduction

Start the existing production preview at port 5173 and deterministic server at
5174, then:

```bash
npm test
npm --prefix web run build
npm --prefix web run lint
export PLAYWRIGHT_MODULE=/home/spotty/projects/studioos/node_modules/playwright
node tests/site-context-browser.cjs
node tests/site-context-recovery-browser.cjs
xvfb-run -a node tests/site-context-zoom.cjs
```

Existing regression scripts use `UNBUILT_EVIDENCE_DIR` to direct their artifacts
to the named folders above. PDF.js is pinned to 6.4.299, loaded on demand and uses
its [documented browser rendering workflow](https://mozilla.github.io/pdf.js/examples/)
with packaged resource URLs. No CDN, model call or third-party upload is used.
Final production entry: `index-bPWIPVWg.js`; CSS: `index-CgibEkzx.css`.
Some earlier regression captures retain their earlier build identifiers; the
final main/recovery/zoom and project/planner/inspector/viewport checks use the final
entry. Later plan-selection guards were checked by the context-navigation test.

## Remaining limits

Owner workflow/aesthetic acceptance and physical touch-device validation remain
open. The touch tests are Chromium emulation and preserve the previously recorded
synthetic post-drag recovery limitation. Not every real-world PDF/CAD export has
been tested. Distorted scans, unsupported DXF geometry, automatic tracing/OCR,
cloud/media storage, legal access, surveyed accuracy and features 5–15 are outside
this increment. Site context references do not establish buildable land or verified
access and do not influence optimization. Keep original media and portable project
backups; local/private-session/site-data-clearing limits still apply.
