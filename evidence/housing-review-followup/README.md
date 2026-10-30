# Housing-mix planner review — implemented follow-up

All five feedback prompts are addressed. Work remains uncommitted. Existing work,
project formats and earlier evidence are preserved; no subsequent feature started.

## Changes and reproduced journeys

| Planner concern | Implemented behavior | Evidence |
| --- | --- | --- |
| Restoration failure is truncated in the status strip | Persistent panel beside Restore names the exact vacant lot, reserved template and dimensions. Direct actions open that lot's reassignment or outline editor. The accepted vacancy stays until a fitting repair and explicit restoration. | [Restoration conflict](restoration-blocked.png) |
| Generated-lot prerequisite requires reconstructing a sequence | Preview generated lots opens the default-assignment review directly, naming released assignments and showing effects. Cancel retains the original mix/library. First approval saves the reviewed default assignments and opens a separate generated-lot preview; the second approval replaces the partition. | [Direct review](generated-review.png) |
| Default and explicit assignments look identical | Target options and selected-lot readout say Explicit or Follows default. Changing the default first lists affected inherited lots and held explicit assignments, then requires Preview. Before/after provenance remains inspectable even with matching names. | [Provenance review](provenance-review.png) |
| Mobile identification relies on color | A compact selected-lot code/name/area/provenance readout and expandable text design key sit immediately after the drawing. The key identifies designs, counts and built area without color. Both canvas selection and a single lot-list target feed the readout. | [375 px drawing and key](drawing-375.png), [200% key](zoom/zoom-200-housing-key.png) |
| Financial effects lack nearby assumptions | Expandable assumptions inside housing review expose the actual shared price, construction rate and physical-works contingency. Exact construction, contingency, revenue and allowance changes are separated from unverified market assumptions. | [Financial review](cost-assumptions.png) |

Restoration checks both rectangular fit and the actual reshaped polygon's placed
home/ring. Fixing a template assignment does not silently restore a home. The tested
16×16 m Courtyard reservation kept 19 homes; direct reassignment to a fitting home
removed the blocker, and explicit Restore returned the plan to 20 homes.

Generated lots uses **two approvals**. The first applies the reviewed release of
explicit assignments; the second applies the generated partition. Cancel before the
first approval retains the entire old mix. Cancel during the second preview keeps
those already-approved default assignments. Undo recovers the earlier assignments;
two Undo steps recover the original mix after both approvals. The reusable library
stays intact throughout. These consequences appear in the review before approval.

Explicitly assigning the current default now stores that template ID too. A separate
release action makes selected lots follow future defaults; the all-lots release
remains available. Common explicit source assignments survive subdivision, including
an ID equal to the default. Existing absent assignment keys still mean inheritance.
No persistence version migration is required: project v9, record v10 and snapshot v8
already represent explicit references and include them in canonical hashes.

## Independent measured checks

- One 8×6 m Courtyard among nineteen 60 m² homes: **1,188 m²** built and 20 homes.
  Construction changes **Rp6.00bn → Rp5.94bn** at the shared Rp5m/m² rate.
- Exact construction saving **Rp60,000,000**, related 5% contingency saving
  **Rp3,000,000**, allowance increase **Rp63,000,000** and revenue change **Rp0**.
  Shared selling price is Rp850m/home in this sample; it remains an assumption,
  not evidence that the smaller home achieves that price.
- Renamed Courtyard 42 at 7×6 m, made default while Lot 1 stays explicitly assigned:
  **20×42 = 840 m²**. Returning the default to the original 60 m² home leaves the
  one explicit Courtyard and nineteen inherited originals: **1,182 m²**.
- The matching Courtyard names in both assignment categories retain different
  provenance. Before default approval, nineteen inherited lots and one held
  explicit lot are identified.

## Verification

Production preview: `http://localhost:5173`; deterministic tool server: port 5174.
The final asset is recorded in [browser-results.json](browser-results.json) and
[zoom/zoom-results.json](zoom/zoom-results.json). The server was restarted on the
current source. Tests use isolated browser profiles and fictional sample projects.

| Check | Result |
| --- | --- |
| Root `npm test` | **593 passed**, including five new housing/provenance/restoration cases — [root.log](root.log), [engine.log](engine.log) |
| Focused review browser | **34 passed** — [browser-results.json](browser-results.json), [browser.log](browser.log) |
| Existing housing journey | **39 passed** — [housing.log](housing.log) |
| Existing lot journey | **43 passed** — [parcels.log](parcels.log) |
| Existing inspector/assistant journey | **59 passed**, including server explanations, stale clearing and in-flight response rejection — [inspector.log](inspector.log) |
| Actual browser 200% zoom | Passed creation/assignment, text key, review, Apply, Undo/Redo and reflow — [zoom.log](zoom.log) |
| Production build / lint | Passed — [build.log](build.log), [lint.log](lint.log) |
| Whitespace check | `git diff --check` passed |

Actual zoom was verified through the browser API at 2, unchanged physical window,
1,440→720 CSS width and DPR 1→2. It was not approximated by resizing a viewport or
CSS transforms. Focused drawing/review tests compare the exact zoomed SVG viewBox,
retain the Courtyard draft and verify cancellation preserves accepted work at
1440×900, 1024×768 and 375×812.

The updated existing housing suite now exercises the intentional pre-preview default
approval and the direct generated-lot review. The previous test's assumption that
the action only prints a status message is obsolete. Fit, arithmetic, persistence,
backup/import, invalid recovery, clear-layout and emulated touch checks remain.

Screenshots were opened and visually inspected:

- [1440 drawing](drawing-1440.png), [1440 review](review-1440.png)
- [1024 drawing](drawing-1024.png), [1024 review](review-1024.png)
- [375 drawing/key](drawing-375.png), [375 review](review-375.png)
- [Actual 200% drawing](zoom/zoom-200-housing-plan.png),
  [key](zoom/zoom-200-housing-key.png), [review](zoom/zoom-200-housing-editor.png)

Regression result files retain their own tested asset IDs. Focused review and zoom
were refreshed after the final copy/readout refinements. The production build still
reports a nonfatal main-chunk size warning; the threshold was not changed.

## Limits and open gates

No new model adapter or model-written explanation was added. The cost explanation is
deterministic arithmetic over displayed assumptions and measured plans. The interface
continues to disclose no model; a real-model round trip remains open.

Housing remains one-storey rectangular templates, one home per occupied lot, shared
provisional pricing/rates, and manual assignment on held lots. The previous polygon
setback, irregular-block, survey, access, legal and engineering limits remain. This
increment does not establish market evidence or statutory compliance.

Physical-device touch and independent human planner acceptance remain open.
Automated emulated touch and actual browser zoom are not hardware sign-off. Current
backup/draft/session-history limits are unchanged.

[Human planner retest prompt — return comments as improvement prompts](TESTER-PROMPT.md).
