# Manual pointer boundary range correction

Implemented 28 October 2026. Work remains uncommitted; prior workspace changes
were preserved. All browser checks used disposable contexts/profiles.

## Reproduced cause

Six ordinary clicks across visible paper at 1440×900 created two vertices with
X = −13 m. Closing the polygon produced the owner's exact range error. The
viewport's fitted margins extended outside the local 0–500 m domain, while
pointer placement and drag handlers did not enforce that domain. See
`reproduction.json` and `before.png`.

## Fix

- New outline drawing brings the local origin inside the visible paper, preserves
  handle/tool clearance and bounds overly large initial view spans.
- Pointer placement and vertex dragging stop at 0 and 500 m. Arrow keys use the
  same bounds while retaining fractional coordinate precision; attempted movement
  beyond an edge does not add empty Undo steps.
- Shaded paper shows outside-range coordinates after fitting, zooming or panning.
  The precision guidance describes those stops. Snapping remains 1 m.
- Typed coordinates are not silently corrected. Negative, greater-than-500 and
  nonfinite entries still fail validation. Existing geometric validation remains.
- Drafts remain separate from the accepted plan until Apply; Cancel and both
  draft/plan Undo/Redo retain their behavior.

Existing invalid drafts already contain their original bad coordinates; refresh
and redraw, or repair those coordinates explicitly. Saved accepted plans are not
translated or otherwise changed by the fix.

## Verification actually run

| Check | Result | Evidence |
|---|---|---|
| Six-click workflow, area, Apply/Undo/Redo/Cancel, limits and pan/zoom | 31 checks pass | `results.json`, `pointer-browser.log` |
| Core geometry/persistence/server/search | 465 checks pass | `root-tests.log` |
| Dynamic inspector and pointer boundary regression | 59 checks pass | `inspector/browser-results.json`, `inspector-browser.log` |
| Full drawing viewport/pan/zoom/scale regression | 38 checks pass | `viewport/viewport-results.json`, `viewport-browser.log` |
| Project/storage workflow | 55 checks pass | `projects/results.json`, `projects-browser.log` |
| Lifecycle, keyboard and emulated touch drawing/drag/apply | 20 checks pass | `lifecycle/lifecycle-results.json`, `lifecycle-browser.log` |
| Actual 200% browser zoom, keyboard creation and six pointer clicks | 9 check groups pass | `zoom-results.json`, `zoom-browser.log`, `zoom-200-pointer-boundary.png` |
| Production build/lint | Pass, no lint warnings | `build.log`, `lint.log` |

Focused pointer tests use visible-paper fractions rather than only projecting an
already valid metre-coordinate polygon. They run at **1440×900, 1024×768 and
375×812**. The independent shoelace calculation matches displayed area; dragging
outside the viewport checks both 0 m and 500 m limits. Manual pan/zoom, typed
out-of-range refusal and one-step history are covered. Captures `drawn-1440.png`,
`drawn-1024.png` and `drawn-375.png` show the six-corner result; representative
screenshots were visually inspected.

Actual browser zoom is verified through the tabs API: a 1440×988 browser window
has 1440×901 content at 100% and 720×450 at 200%, with DPR = 2. The extended zoom
script now draws six vertices with actual pointer clicks, verifies Apply is
available and checks Cancel preserves the previously accepted keyboard outline.

Commands:

```bash
npm test
npm --prefix web run build
npm --prefix web run lint
export PLAYWRIGHT_MODULE=/home/spotty/projects/studioos/node_modules/playwright
node tests/boundary-pointer-range-browser.cjs
UNBUILT_EVIDENCE_DIR=evidence/boundary-pointer-range xvfb-run -a node tests/browser-zoom.cjs
```

Existing project/lifecycle/inspector/viewport scripts used `UNBUILT_EVIDENCE_DIR`
for their corresponding evidence folders above. Some regression captures precede
the final adjustment preserving lower toolbar clearance; the focused, inspector,
lifecycle and real-zoom tests were rerun after it. Final served production asset:
`index-CnkZXN4z.js`; CSS: `index-CTjffDiq.css`, on preview port 5173.

Diagnostic failure captures from intermediate camera-clearance and test-selector
checks are retained in `iteration-probes/`, separate from final passing results.

## Limits

The supported coordinates remain 0–500 m, with fixed 1 m pointer snap and decimal
coordinate input. Edge stops can produce repeated/degenerate points if several
corners are placed at the same limit; those outlines correctly remain invalid.
Self-intersections, duplicate vertices and other unsupported geometry still need
correction. This is not an expansion of site size, surveyed position or routing.
Touch checks use Chromium emulation and the previously documented synthetic
post-drag tap recovery; physical touch-device reliability remains unverified.
