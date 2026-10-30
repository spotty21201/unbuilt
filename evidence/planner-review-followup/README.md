# Planner review follow-up

The supplied report describes successful supported operations and no confirmed
correctness defect. Two usability improvements were implemented; broader requests
and unverified professional-reliance questions remain explicitly open. All work
is uncommitted and earlier workspace changes were preserved.

## Changes

- Restore removed homes now explains its disabled state beside the control and
  associates that explanation through `aria-describedby`. It names the edit to
  finish and says that a blocked action does not establish a home-fit failure.
- Projects has an immediately visible New project action that scrolls to and
  keyboard-focuses creation. The long save/backup explanation is expandable;
  its exclusions remain intact and the local/private-storage warning is visible.
- Existing boundary repair behavior was independently exercised again; it was
  not described as a new capability or as a reproduced correctness defect.
- Larger requests are retained in `docs/PLANNER-REVIEW-FOLLOWUP.md`. Draft retention,
  saved alternatives/media, street-to-gate relationships and protected-area
  enforcement were not implemented by this follow-up. A priority question was
  presented; no choice arrived during these fixes.

## Evidence

Owner-linked captures were copied from the supplied temporary directory into
`owner-review/` so they remain available. These are the original review evidence,
not screenshots of the updated behavior. No owner project or browser profile was
used for destructive tests; new checks use isolated fictional browser projects.

Current captures:

- `restore-disabled.png`: pending frontage edit and explanatory restoration text.
- `projects-1440.png`, `projects-1024.png`, `projects-375.png`: reachable New project.
- `create-1440.png`, `create-1024.png`, `create-375.png`: focused creation form.
- `invalid-outline.png`: highlighted outline requiring repair; the test then drags
  the corner back, applies valid geometry and checks subsequent invalid Cancel.
- `mobile-selected.png`: selected lot and inspector after returning to the plan.
- `zoom-200-projects.png`, `zoom-200-editor.png`: actual browser 200% workflow.

The production preview serves port 5173; the deterministic tool server was
started on 5174 for these checks. Asset: `index-kcSQfdmY.js`; CSS:
`index-C47UW25w.css`.

## Verification

| Check | Result | Evidence |
|---|---|---|
| Root engine/server/persistence suites | 490 passed | `root-tests.log`; `npm test` |
| Focused reviewer follow-up | 26 passed | `results.json`; `browser.log`; `tests/planner-review-followup-browser.cjs` |
| Existing projects/storage | 55 passed | `projects/results.json`; `projects.log` |
| Existing lifecycle/safe restoration | 20 passed | `lifecycle/lifecycle-results.json`; `lifecycle.log` |
| Existing pointer-range/history | 31 passed | `boundary/results.json`; `boundary.log` |
| Existing survey/context workflow | 33 passed | `site-context/browser-results.json`; `site-context.log` |
| Actual 200% browser zoom | 9 assertions passed | `zoom-results.json`; `zoom.log` |
| Production build and lint | Passed | `build.log`; `lint.log` |

Browser total: **165**. Set `PLAYWRIGHT_MODULE` to the installed package at
`/home/spotty/projects/studioos/node_modules/playwright`; regression suites accept
`UNBUILT_EVIDENCE_DIR`. Actual zoom runs `tests/browser-zoom.cjs` under `xvfb-run -a`
and checks browser zoom, window/viewport and pixel ratio rather than CSS zoom.

The focused walk removes one home (20→19), checks unchanged street/park allocation,
previews 11 m frontage, verifies the blocked reason, cancels and restores, then
repeats through Apply and restores into the generated lots. Other checks verify
undersized-vacant-lot refusal, gate identity after corner insertion/removal,
pointer/draft history, and source metadata/reattachment with fictional PDFs.

## Remaining limits

The survey tests use explicitly fictional references, not the real suitable survey
missing from the owner's review. They do not verify the source's accuracy, legal
access, a professional planning decision or real-world import compatibility.

Physical touch remains open. Existing Chromium emulation tests retain their
recorded post-CDP-drag synthetic-click recovery; they do not establish immediate
tap reliability on a physical device. Human keyboard/usability and client-meeting
acceptance remain separate from these automated checks.

No durable drafts, histories, alternatives, comparisons or original media were
added. No model connection, street permission or enforceable protected area is
implied by source annotations. See the follow-up requirements for proposed work.
