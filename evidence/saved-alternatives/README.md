# Saved alternatives — owner Feature 10

Requirements: `docs/PRD_v0.15.md`. The owner's title and number define this
increment; the same topic was historical roadmap item 13. Planning brief, land
budget, walkability and later features remain outside this work.

The feasibility tester prompt and all work through Feature 9 were committed and
pushed to GitHub main as `e2dc09fdc7375d0fe7e0e91be61d843e263f6c71`. GitHub's main
ref was read back and matched this commit. The initial transfer timed out; a retry
with a buffered HTTP transfer succeeded. Feature 10 changes remain uncommitted.

## Supported behavior

Open Alternatives in workspace navigation, or Saved alternatives in the inspector
or blank-plan setup. Save up to 20 independently named copies of the accepted
working inputs or an explicitly selected current search preview. Saving a preview
never applies it. Names are unique, 1–100 characters; notes are multiline plain
text up to 4,000 characters. Rename and annotation updates change metadata only.

Each snapshot retains geometry, manual work, housing assignments, vacant-home
reservations, named open spaces/commitments, price/cost assumptions and site context.
Working changes leave saved inputs unchanged. Reopen a snapshot, edit the working
plan, then save a new named copy to retain another scheme.

Comparison uses two real plan canvases and each scheme's own saved prices/costs.
Before/after/change figures include measured land quantities, built area, costs,
revenue, surplus, land allowance, owner outcome and required price. An assumption
table exposes all prices and eight costs. Deltas combine changed inputs and do not
claim isolated design effects. Drawings fit independently, which is disclosed when
comparing differing boundaries. Incomplete finances and unsupported geometry are
unavailable rather than silently treated as zeros.

Review reopening explicitly shows working versus saved inputs. Reopen saved scheme
replaces the working state in one undoable step; Cancel retains it. Undo/Redo keeps
the saved collection and notes intact. Reopening works from a blank working plan,
clears transient search results, hides reference photos and preserves the existing
session-media contract. Invalid geometry/orphaned reshapes block reopening.

Removing a scheme needs confirmation, leaves working inputs intact and offers one
session-only Undo removal. Scheme detail drafts must be Saved or Cancelled before
closing. Native modal focus returns to the opener; narrow layouts stack drawings
and keep table overflow inside its own region. The footer stays above floating
canvas controls, including at 200% browser zoom.

Project v12 / decision record v13 carry collections, including `[]`; older disguised
envelopes refuse. Every saved state is validated before import. All project save,
autosave and download paths include the collection. Import creates a separate
project whose scheme notes are independent of the original. Storage failure keeps
the original disk library and an exportable in-memory copy with a visible warning.
The active-plan server snapshot stays at its existing format: saved collections
are not sent to calculation tools as if they were active-plan inputs.

## Verification

- `root-tests.log`: **658 passing checks**, including **18 saved-alternative
  checks**. Legacy formats, independent snapshots, name/notes/dates/id validation,
  collection limits, nested-record refusal, exact cost precision, hand-derived
  economics, blank/incomplete schemes, orphan protection, all earlier geometry
  contracts, record v13 round trips and project-library scoping.
- `build.log`, `lint.log`: production build and lint pass. Existing large-bundle
  advisory remains. No new dependency was added.
- `browser-results.json`, `browser.log`: **36 browser checks**. Save/rename/notes,
  exact working-state preservation, saved financial comparisons, annotation draft
  recovery, explicit reopening/Cancel, global Undo/Redo, reload, search-preview
  capture, removal/Undo, portable v13 export/import, project isolation, reopening
  from blank, quota failure/export recovery, touch and tablet layout. JSON records
  the production asset tested; no uncaught browser errors.
- `saved-schemes-record.json`: downloaded v13 record with three snapshots and
  annotations; imported through the actual UI as a separate project.
- `memory-only-backup.json`: actual export retaining a newly saved scheme after
  browser storage was deliberately made unavailable.
- `zoom-results.json`, `zoom.log`: actual browser zoom **2.0**, measured through
  the browser tabs API, unchanged 1,440 px outer window, CSS width 1,440 → 720,
  DPR 1 → 2. Save/annotate/compare/reopen, Undo/Redo, Escape, overflow and footer
  hit-target checks pass. Captures: `zoom-200-reopen.png`, `zoom-200-comparison.png`.
- Existing focused regressions in separate directories: projects **55**, project
  lifecycle **20**, feasibility **33** browser checks.
- Screenshots inspected at desktop 1440×900, tablet 1024×768, narrow touch 375×812
  and actual browser zoom 2.0. Desktop/tablet: `desktop-comparison.png`,
  `tablet-comparison.png`; narrow: `touch-375-reopen.png`. Inspection caught a canvas
  toolbar overlapping the narrow footer; the stacking order was fixed and a
  specific hit-target check was added before repeating affected suites.

Reproduction from the project root, with the production preview on 5173:

```sh
npm test
npm run build --prefix web
npm run lint --prefix web
PLAYWRIGHT_MODULE=/home/spotty/projects/studioos/node_modules/playwright node tests/saved-alternatives-browser.cjs
PLAYWRIGHT_MODULE=/home/spotty/projects/studioos/node_modules/playwright xvfb-run -a node tests/saved-alternatives-zoom.cjs
```

The final saved-alternative and zoom suites served `/assets/index-D1h10OYF.js`.
Regression evidence records the build it actually exercised.

Browser tests use isolated contexts rather than the owner's browser-local project
library. The deterministic tool service remains on 5174; no real model connection
or call is claimed.

## Limits and preserved tester prompts

Browser-local storage only. Original survey/PDF media and photos must be reattached
when unavailable; saved calibration/context is not original media. Drafts, history,
search runs and comparison selections remain session-only. No automatic scheme
merge, cloud collaboration, spatial comment threads, scenario tree or per-scheme
history replay is implemented. Costs and prices remain illustrative. Physical
mobile-device behavior and independent planner acceptance remain open.

Earlier prompts are unchanged, including the feasibility prompt now saved on GitHub:

- Feasibility: `7eb2aa6a2fefaf6d8cb762cf263a4c2540f007ca1f37445b1755a1046d81f834`.
- Open spaces: `74af0d6db6410119a2df43e8038ae33e212865811ecba030e39777bbe7067b05`.
- Housing retest: `3c719f0025d90912e84141dd85f030594d355e7456b25fbc8eb24dc453f7e9dc`.

Feature 8 independent planner testing was not launched. A new saved-alternatives
review prompt is available in `TESTER-PROMPT.md`; preparing it does not launch an
independent test or change any earlier deferral.
