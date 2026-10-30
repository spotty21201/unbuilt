# Independent browser re-walk — workbench increment

Tester: Unbuilt Astra Tester. Date: 26 October 2026.
Verdict: **NOT ready for M2 sign-off.** Browser infrastructure is available to this reviewer; the browser gate is now exercised and has failures, rather than being blocked by missing infrastructure.

## Verified build and scope

- Live URL http://100.117.187.86:5173/ returns HTTP 200 and serves production asset `/assets/index-mMDGGwt9.js`.
- JS SHA-256: `6af720c7186a892801bcbbf02e33e6f802041395d67d604d77fa0fa9915df791`.
- CSS asset `index-3HvzrFIw.css`, SHA-256: `cd09153cd0d49a37948238e784c487252755495897c3f22ccb6da2f8c67858b7`.
- Independently ran `npm test`: seven suites, 118 PASS checks, exit 0.
- Existing Playwright at `/home/spotty/projects/studioos/node_modules/playwright` and installed Chromium worked without installing a browser.
- Tested 1440×900, 1024×768 and 375×812 in headless Chromium. Narrow viewport used mouse/keyboard emulation, not a real touch device.
- Git working tree contains modified tracked files and untracked workbench files. I made no app changes, commits or deployments. This verifies current local dirtiness, not the historical assertion that nothing was ever published.
- Designer spec §§15–16 and three recorded divergences exist in docs/UX.md and docs/DECISIONS.md. Static pre-pass reports exist; their presence is not evidence all integrated defects are fixed.

## Reproduced defects, ordered for fixing

### 1. Undo does not visibly undo a grove move (high)

At all three viewport widths: select Grove A → Unlock → drag from X=78 to X=74. Homes change 20→21; allowance Rp3.56bn→Rp3.94bn. Press Undo once. Inspector X remains 74; plan and dock still show 21 homes/Rp3.94bn, and an unapplied draft appears. The inspector's committed-position text can say 78 while the input/drawn draft says 74. The user must Cancel that resurrected draft to see the old plan.

Source cause: applyDraft pushes snap() with already-edited greenDraftF, while green still contains the old committed rectangle. Undo restores that inconsistent combination. Snapshot the pre-edit accepted fields/geometry together (or explicitly separate transient draft history); Undo must restore the visible plan and economics in one action.

Evidence: T05-1440.png / T05-1024.png / T05-375.png and browser-results.json T05. Assumption blur→Undo does restore owner 20→10; the failure is specifically geometry history, not every history path.

### 2. Last-change summary reports zero for a real change (high)

Same X=78→74 gesture increases homes by 1 and allowance by roughly Rp0.38bn, yet dock says `+0 homes · road +0 m² · allowance +Rp0m`.

Source cause: applyDraft takes its before value from workingEcon, which already follows the valid draft, then compares it with the same draft after committing. Compare committedEcon/pre-gesture snapshot with the accepted result. Also ensure negative allowance deltas retain a minus sign (deltaLine currently takes Math.abs without adding a negative sign).

Evidence: T02/T03/T05 logs at all widths. Negative-delta sign is a source finding; the reproduced browser case is the false zero delta.

### 3. Desktop workbench clips the site and hides essential controls (high UX)

At 1440×900, the SVG is 975px tall inside a canvas column with only 638px visible. Request field begins at y≈1130. At 1024×768, canvas column shows 506px but contains a 611px SVG; request begins at y≈766. Full-page screenshots do not reveal hidden inner overflow. Fit site resets the SVG viewBox but does not fit the SVG element to available height.

Users must scroll inside the canvas column between the plan and request/preview controls. Search expands the dock and reduces visible plan further. Constrain the canvas to the available workbench height while preserving aspect ratio; keep the request/preview toolbar outside its scrolling content.

Evidence: initial-1440.png, T11-1440.png, T11-1024.png, T08-preview-1440.png and recorded bounding boxes.

### 4. Mobile page overflows horizontally (high UX)

At viewport width 375, document scrollWidth is 493. The header action row protrudes; dock tabs also extend outside their container. The inspector is a long stacked section rather than a collapsible sheet, and the dock is not persistent on mobile.

Wrap/compact topbar actions and make dock tabs fit or scroll internally. Do not hide overflow to conceal unreachable controls.

Evidence: initial-375.png and T11-375.png.

### 5. Issues tab falsely says inputs are complete (medium/high)

Clear owner expectation. Summary correctly says Incomplete. Select Issues: it says `No open issues. Geometry valid, inputs complete, no blockers.` Input validity and price-ceiling errors are omitted from issueCount/the issue list.

Derive Issues and the summary from the same current validation state, including financial inputs, ceiling and profile/target status as appropriate. On invalid green drafts, retained committed metrics should be explicitly labeled as last-valid values rather than relying only on an error elsewhere.

Evidence: browser-results.json T06 at all widths. Empty coordinate no longer silently becomes zero; Apply is correctly disabled.

### 6. Selection and keyboard contract remain incomplete (medium)

Canvas clicks on road, home and grove correctly update the object list. Clicking the site background/boundary does not select Site; previous Grove selection remains. Selecting Site in the list does not add a matching site highlight. ArrowDown from the Site list item does not move focus/selection; Escape with focus in that list does not deselect. Tab/Enter navigation does work for selection and unlocking.

Implement the promised listbox keyboard behavior or use a simpler accessible button-list pattern with documented behavior. Make Site selection mirror both ways, and ensure Escape works from relevant inspector/list focus contexts, not just the SVG.

Evidence: T01 results and followup-results.json (`arrow: Site`, `escape: Site`).

## Acceptance matrix

All rows exercised at all three widths unless the limit is stated.

| Test | Result | Evidence / qualification |
|---|---|---|
| 1 Initial render + all four selections | PARTIAL | Geometry renders; grove/road/homes mirror selection; Site does not. Desktop full-site visibility fails. |
| 2 Lock + pointer/numeric equivalence | PASS for geometry/metrics | Locked X stays 78; disabled inputs. Drag and typed X=74 yield matching 21 homes/Rp3.94bn. Delta annotation fails separately. |
| 3 Zoom/pan + browser resize | PASS for tested movement | After zoom/pan, 2m west move gives X=76; viewport resize preserves quantities/economics. |
| 4 Resize/cancel safety | PASS for exercised paths | NW resize produces X=80/W=22/H=22. Out-of-site move reverts. Escape with SVG focus and synthetic pointercancel restore gesture start. Native touch cancellation and every resize edge are not exhaustively tested. |
| 5 Full Undo/Redo | FAIL | Grove Undo resurrects edited draft instead of visible prior state. Assumption blur undo passes. |
| 6 Empty values | PARTIAL | Empty owner => Incomplete, empty X stays missing and cannot apply. Issues contradicts input completeness. |
| 7 Family/frontage/profile | PASS | Loop gives 17 homes/2076m² road; frontage 11 gives 16 homes; Starter profile shows 3-lot applicability warning. |
| 8 Preview/apply/cancel/stale | PASS for tested result paths | 17-home preview/apply economics match; cancel restores 20. Owner 10→20 removes old options; rerun preview/apply both show Rp17.59bn shortfall. Ghosts now transparent and beneath new homes. |
| 9 Mixed and zero outcomes | PASS with copy note | Owner 3 correctly says 1 of 3 shown meet; zero case no longer claims success. “0 valid” vs “6 valid, 0 valid options” still conflates geometry with all constraints. |
| 10 Rapid edits | PASS for synchronous sample | Five rapid frontage selections end at 10 with 20 parcels and matching economics. Automation sequence took 35–57ms; this is not an end-user paint-latency benchmark. |
| 11 Keyboard/responsive layout | FAIL | Tab/Enter selection/unlock works; list arrow/Escape behavior missing; desktop clipping and mobile overflow reproduced. |

## Evidence and test limitations

- browser-rewalk.cjs, browser-results.json and browser-console.log capture the main run; screenshots T01–T11 are stored per width.
- T07/T10 in the first script used an overly strict accessible-name locator and timed out. These were test-selector issues, not app failures. browser-followup.cjs corrected the locator and completed those cases at every width; see followup-results.json and T07-followup/T10-followup screenshots.
- No pageerror entries were captured in the main browser log.
- This is independent agent browser testing, not observed human validation. Genuine model integration is still not demonstrated; the live app says Deterministic mode. I did not inspect credentials or assert whether they exist elsewhere.
- AC-30 requires the intended human's unrehearsed interaction and explanation, not merely this agent changing another value. A human walkthrough alone also does not replace the other browser/model gates.

## Orchestrator handoff

The deployment, 118 passing checks, new workbench structure, direct editing, snapshot preview and improved commercial verdicts are confirmed. “Full Undo/Redo” and browser readiness are not confirmed. Fix defects 1–6, rebuild, identify the new asset hash, and request a targeted browser retest. Keep M2 unclaimed. No new features or commits are needed for this review response.
