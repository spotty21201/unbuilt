# Unbuilt planning continuation — 1 November 2026

Completed the handoff's ready residual-land work and missing automated S5
locked-green-space review. Work remains local and uncommitted. No provider
branding or attribution was added. No saved-data envelopes, financial formulas,
layout-generation rules, prices or owner commitments were changed.

Baseline HEAD: `b6c660f`, with substantial pre-existing modified/untracked work.
Read WORK-CONTEXT first, then the saved handoff, decisions and previous planning
report. The handoff file itself is truncated mid-table; its missing portion was
not invented or rewritten. The owner's supplied summary, actual modules and
`../masterplan-loop/REPORT.md` established the next ready work and the rotated-lot
contract gate.

## What changed and why

- `src/residual.ts` now consumes actual pavement multipolygons, including holes,
  entrance aprons and edited parcel polygons. The old code used rectangular road
  references and the UI hid its manual-network results. The remaining regions
  retain their holes, including enclosed areas inside loop roads.
- Access requires a positive shared pavement edge, using the engine's existing
  frontage calculation. The former half-metre proximity/containment test could
  count land across a gap or around an isolated enclosed road as accessible.
  Point contact alone also does not qualify.
- Clearance intersection excludes holes. Previously a green-space hole inside a
  surrounding residual polygon could falsely mark the whole region reserved.
  Clearance still uses a conservative bounding rectangle and still flags whole
  connected regions. The UI explicitly says so; the flagged area is not the
  precise exclusion area. Size/access are screening tests, not generated lots,
  established capacity, legal access or approval.
- The empty-blocker case retains the complete boundary rather than dropping a
  vertex during closed-ring decoding. Small positive fragments remain accounted
  for. The layout adapter refuses reports that differ from measured remainder by
  more than 0.01 m².
- Land budget, open-space references and residual assessment follow the actual
  displayed plan: working inputs, valid drafts, preview options or last valid
  accepted figures. An unavailable assessment shows its reason instead of guessed
  totals. Manual, angled and rounded roads now have evaluated results.
- The existing session-only planning brief explicitly states that project Save
  and scheme export do not retain its rules. Its persistence contract was not
  silently changed.

Cedar's unchanged 6,800 m² remainder now classifies as **3,560 m² potentially
  developable + 3,240 m² inaccessible**. The former 3,560 m² clearance flag came
from the green-space hole, not an actual intersection with remaining land. Homes,
road quantities and financial results are unchanged by this classification fix.

## Verification

| Check | Result | Evidence |
| --- | --- | --- |
| Fresh baseline root suite | PASS, 808 checks | `baseline-tests.log` |
| Final root suite | PASS, 839 checks | `root-tests.log` |
| Residual checks included above | PASS, 47 (31 added) | `residual-tests.log`, `tests/residual.mjs` |
| Production build / lint | PASS | `build.log`, `lint.log` |
| Targeted residual/S5 browser | PASS, 46 checks | `browser-final/results.json`, `browser-final.log` |
| Full selected browser matrix | PASS, 39/39 suites | `regressions/results.json`, `regressions.log` |
| Separate native 200% zoom | PASS, 6 checks | `native-zoom/results.json`, `native-zoom.log` |
| Targeted accessibility scan | PASS, no detected violations | `browser-final/axe.json` |
| Uncaught errors in targeted browser run | None | `browser-final/results.json` |
| Continuation preservation manifest | PASS, all 19 unchanged | `preservation-before.json`, `verification.json` |
| Earlier review preservation manifest | PASS, all 999 unchanged | `verification.json`, `../geometry-finance-review/preservation-before.json` |

The targeted 46 checks also run within the 39-suite matrix; do not add them as
independent coverage. The new native-zoom script was created after that matrix
selected its inputs and ran separately. A future matrix discovery includes it,
for 40 suites. Existing build output includes a bundle-size advisory; there were
no build errors or lint warnings.

The final served production asset is `/assets/index-CDknUWnt.js`. Preview remains
on port 5173 and deterministic tools on 5174. `/api/health` reports the mock adapter
and `modelConfigured:false`; no actual-model acceptance is claimed.

### S5 and editor results

- Locked rectangular green remains exact through entrance relocation and Undo,
  Garden Loop layout, manual street-width change and Undo, and frontage change
  and Undo. Financial assumptions/profile remain held.
- A locked named polygon with a declared minimum retains its exact geometry and
  drawn position through deterministic search, option review, explicit Apply,
  Save and reload; price, ceiling, owner expectation, target and profile remain
  unchanged. The displayed assessment reconciles to the restored remainder.
- Angled/rounded manual roads work through draft, Apply, Undo/Redo, Save and reload.
  Invalid road edits cannot Apply and explicitly retain last-valid accepted
  assessment. Imported loop-road holes and sloping entrance aprons reconcile.
- Brief rules evaluate actual budget figures and reset after reload as the
  session-only note states. No save/export claim implies those rules persist.
- At 1024 and 375 CSS px there is no page-level horizontal overflow. At native
  200% zoom the same physical 1440 px window becomes 720 CSS px, with device pixel
  ratio changing from 1 to 2. Editing, Apply, assessment totals, keyboard scrolling
  and Save/reload all pass.

Inspected screenshots: `browser-final/angled-residual.png`,
`browser-final/loop-hole-residual.png`, `browser-final/residual-375.png` and
`native-zoom/manual-residual-200.png`. Long findings use the results panel's scroll
area; narrow/native-zoom screenshots show the scrolled content, not all findings
simultaneously. Earlier diagnostic runs remain alongside final evidence.

### Reproduce

Use disposable test browser profiles. With root/web dependencies installed and
production preview/tools already running at the above ports:

```sh
npm test
npm run build --prefix web
npm run lint --prefix web
PLAYWRIGHT_MODULE=/home/spotty/projects/studioos/node_modules/playwright UNBUILT_EVIDENCE_DIR=/tmp/unbuilt-residual-review node --experimental-strip-types --no-warnings tests/residual-browser.cjs
PLAYWRIGHT_MODULE=/home/spotty/projects/studioos/node_modules/playwright UNBUILT_EVIDENCE_DIR=/tmp/unbuilt-residual-zoom xvfb-run -a node tests/residual-zoom.cjs
UNBUILT_EVIDENCE_DIR=/tmp/unbuilt-browser-matrix python3 evidence/combined-independent-review/run-2026-10-30-corrections/run-browser-matrix.py
```

The browser test also uses the existing axe-core install beside Playwright.
Native zoom creates and removes its own temporary extension/profile. Run evidence
to fresh directories to preserve prior results. `continuation.patch` records only
this continuation's edits against the copies captured before work; original dirty
work remains outside that patch. `status-before.txt` records the inherited tree.

## Remaining gates and next work

- **Rotated-lot workbench: gated.** Preserve the standalone engine and its 26
  passing fixtures. Its integration requires separately authorizing a versioned
  polygon-parcel contract, then handling generation/validation, quantities,
  orientation-aware housing, vacancies/stable identities, drawing/editing,
  search/alternatives and persistence/downgrade guards consistently. Rectangular
  bounds must not stand in for polygon parcel geometry. This continuation has
  not implemented or represented that migration as complete.
- **Real-model round trip: NOT TESTED**, routing/credentials remain unconfigured.
- **Physical touch, real screen readers, human planner and professional
  validation: NOT TESTED.** Native desktop browser zoom and automated browser
  S5 are now tested; they do not establish human acceptance or M2/M3 gates.
- S3 direct road dragging remains an existing capability gap. No unrelated
  remaining-improvements list was silently implemented.

Tester prompts, original handoff, video draft, prior review evidence and existing
planning/rotated modules were preserved. No staging, commit, push, deployment or
outbound messages were performed.
