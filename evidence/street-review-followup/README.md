# Street editor — response to the planner's six findings

Feature 5 follow-up only. **Feature 6 has not started.** Existing uncommitted work
was preserved; this revision is also uncommitted. These are implementation and
browser-verification results. The independent tester has not yet accepted the fixes.
Focused human handoff: [RETEST-PROMPT.md](RETEST-PROMPT.md).

## Findings and changes

| Planner concern | Implemented response | Verification / screenshots |
|---|---|---|
| Critical: sideways drag shifted the main street and detached access | Capture the inverse SVG transform and the pointer's offset at junction-down. Apply deltas to the original node, even after a warning resizes the paper. Display current X/Y and ΔX/ΔY with connected-row/column behavior. | Three arrows give (43,50); an off-centre horizontal grab then gives (49,50), with entrance and main row at Y=50. Draft Undo/Redo verified. Deliberate vertical movement still produces the access warning; continuing horizontally during that warning adds no Y drift. Also checked after canvas zoom at 1440/1024, actual 200% browser zoom and emulated touch. `horizontal-drag.png`, `editor-1024.png`, `zoom/zoom-results.json`. |
| Important: a near miss looked joined | Snap pointer picks to a nearby existing centreline or junction within 12 CSS pixels. Show a green Join ring, street number and exact coordinate before placement. Preserve exact typed inputs. Show the measured disconnected gap and an explicit Join highlighted gap action in the draft. | Pointer pick at approximately (40,51) joins (40,50) and yields 942 m². Typed (40,51) stays disconnected with a 1.0 m gap; explicit Join repairs it, Undo restores the gap. `join-hover.png`, `isolated-conflict.png`. |
| Important: proposal contradicted fixed manual streets | Supply current search scope to intent parsing. Proposal holds manual street geometry/widths and names Spine × 9,10,11,12 m frontage. The approved search actually runs those four choices. Align assistant wording, optimization count and post-run scope. Preserve Reject and stale-proposal checks. | Pre-approval text contains the exact held inputs/range; approved run reports four tests and fixed manual streets. Parser and HTTP validation checks cover scope payloads. `proposal-scope.png`, `browser-results.json`. |
| Important: invalid widths/conflicts were hard to locate | Share a structured first conflict between generator and editor. Draw full-width draft corridors; highlight the offending segment and connection gap, protected park/clearance or affected boundary. Fill the part outside the site through a site mask. Accepted fallback geometry stays grey. | Isolated, park and width-outside-site drafts block Apply. A horizontal pointer repair of the park-crossing branch clears the conflict while keeping gate Y=50. `park-conflict.png`, `park-repaired.png`, `boundary-conflict.png`. |
| Important: review the connector as a planning choice | Colour proposed entrance legs orange, label the proposed link and outline affected accepted lot footprints. Explain the legend, measured consequences and unverified external access beside the review. | Moving the sample main row to Y=40 and proposing a link gives 20→18 homes and 720→789 m² road surface. Cancel restores 20 homes and 720 m². `connector-review.png`. |
| Refinement: mobile review lost drawing context | Keep selected street, width/length and accepted→draft homes/road area in a compact strip below the drawing. Full review repeats street identity. Preserve camera and selection through View drawing / Review streets. Keep the strip outside geometry and scale. | At 375×812, select the 40 m branch, change 6→7 m width (942→979 m²), review, return with the same camera/selection, and cancel. Verify the heading is in the visible viewport. `drawing-375.png`, `review-375.png`. |

The reported drag was independently reproduced on the prior live asset
`index-BopW0fE6.js`: after the three arrow moves, a grab 4 px right/9 px below
centre and a 35 px horizontal drag produced (50,41) and a disconnected main row.
The tester's own gesture produced (49,44). Both demonstrate the grab-offset /
resized-projection defect. `before-fix-offset-drag.json` records the independent
reproduction; `tester-evidence/junction-drag.png` preserves the tester's screenshot.
The first corrected iteration is retained in `after-fix-offset-drag.json/png`;
final verification uses the build identified below.

Affected orange lot footprints mean accepted lots that no longer match the draft,
including lots moved or repartitioned by shifting the main row. They are not a
count of lost homes. The measured homes comparison remains the authoritative count.
The connector is a proposed geometric link, not evidence of road permission or
compliant turning, traffic or access engineering.

## Checks actually run

Root tests: **531 passed**, including four new nearest-point/conflict/gap checks,
two proposal-scope checks and three HTTP scope-validation checks. Shared diagnosis
preserves the generator's exact blockers and refusal of invalid layouts. No new
project geometry, persistence format or model connection was introduced.

| Verification | Result | Evidence |
|---|---|---|
| `npm test` | 531 checks passed | `root-tests.log` |
| `npm run build --prefix web` | Passed | `web-build.log` |
| `npm run lint --prefix web` | Passed, no warnings | `web-lint.log` |
| Focused review browser suite | 33 checks passed; no uncaught page errors | `browser-tests.log`, `browser-results.json`, `tests/street-review-browser.cjs` |
| Existing complete street journey | 57 checks passed, including save/reload/import, history, irregular/sloping access, alternatives/comparison, explanation and in-flight staleness | `regression-streets.log`, `regression-streets/browser-results.json` |
| Dynamic inspector / park / boundary / assistant regression | 59 passed | `inspector-regression.log`, `regression-inspector/browser-results.json` |
| Planner access / locks / explanations regression | 41 passed | `planner-regression.log`, `regression-planner/browser-results.json` |
| Actual browser zoom | 200% verified independently via browser API, DPR 2, CSS width 1440→720 in the same physical window; no horizontal overflow. Includes off-centre horizontal drag retaining Y=50. | `zoom-tests.log`, `zoom/zoom-results.json`, `tests/streets-zoom.cjs` |

Actual production preview: `http://localhost:5173`, deterministic server port 5174.
Final focused review and zoom runs loaded **`/assets/index-DRv-lBcE.js`**. Regression
suites ran during the revision; their JSON preserves each loaded asset. A passing
older build was not treated as proof of the final interface. Tests used isolated
browser contexts and fictional/sample work, not the owner's saved projects.

Screenshots at 1440×900, 1024×768 and 375×812 were opened and visually inspected,
as were actual-200% canvas/review captures. The 375 px camera-continuity test
retains the user's previous canvas zoom, so its drawing is deliberately enlarged;
returning from review does not unexpectedly refit it. At 200% browser zoom, ordinary
vertical scrolling may be needed to reach the strip below the paper. Controls
remain reachable and the scale is no longer covered by the mobile review overlay.
One screenshot harness capture preceded the scheduled scroll/paint; it was replaced
after explicitly waiting for animation frames and verifying the visible heading.

Reproduce with the preview/tool server running:

```sh
npm test
npm run build --prefix web
npm run lint --prefix web
PLAYWRIGHT_MODULE=/home/spotty/projects/studioos/node_modules/playwright node tests/street-review-browser.cjs
PLAYWRIGHT_MODULE=/home/spotty/projects/studioos/node_modules/playwright UNBUILT_EVIDENCE_DIR=evidence/street-review-followup/zoom xvfb-run -a node tests/streets-zoom.cjs
```

## Remaining limits and gates

All six requested corrections have implementation and browser evidence; independent
human retesting remains open. Physical-device touch and a full assistive-technology
review were not performed. Emulated touch covered near-centreline placement and an
off-centre horizontal junction gesture. Typed coordinates retain decimals; pointer
coordinates snap to metres except an exact existing axis/junction. Two-axis dragging
is still intentional: a real vertical movement can shift the main row and must be
reviewed for entrance/lot consequences. A gap repair can expose another conflict;
it is a draft action, not automatic acceptance of a valid layout.

Street support remains orthogonal and preliminary, with one existing entrance,
6–12 m widths and greedy whole-lot generation. No turning sweeps, traffic/pedestrian
assessment, compliant standards, legal access, terrain/drainage or maximum capacity
is established. Real survey/access, engineering and owner/planner acceptance remain
open. No real-model round trip was added or verified; explanations/search use the
existing deterministic tools. None of these external gates is represented as fixed
by a visual cue. No commit, push, deployment or Feature 6 implementation was done.
