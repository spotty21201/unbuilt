# Unbuilt — combined independent testing assignment

Prepared at the owner's request. Preparing or opening this file does not launch
testing. Execute it when the owner assigns this combined review to you.

Your task is to independently assess the outstanding reviews below, implement
missing test checks where useful, run the checks you can actually perform, and
produce evidence and actionable findings. Do not implement product fixes or new
features. Do not commit, push, deploy, change live routing or install credentials.

## Scope and working rules

Work in `/home/spotty/projects/unbuilt`. Read `docs/WORK-CONTEXT.md` first. The
baseline checkpoint is `38ce2f6870d9b83ab85e6ba2ed11dd46f6021048`; record the actual
commit, uncommitted changes and served build you test rather than assuming they
match. The latest verification report is
`evidence/release-verification-2026-10-30/README.md`: 711 calculation/service checks
and 971 browser checks passed. Those results are a baseline, not independent user
acceptance. Identify genuinely missing coverage; do not relabel old passes as new
observations or rebuild the existing test framework.

This assignment covers the street/lot/housing follow-up reviews and Features
8–12. When the owner launches it, that explicitly includes the deferred reviews
named here. Historical instructions in individual prompts such as “Feature 6 has
not started” or “do not launch the Feature 8 review” describe their earlier scope;
they do not exclude these sections from this combined assignment. Other roadmap
features remain outside scope. Preserve every original prompt unchanged.

- Use disposable sample projects, copies and temporary browser profiles. Never
  alter or delete the owner's projects, media, working changes or evidence.
- Explore each workflow first through the visible application as a residential
  planner. Record expectations, hesitation and confusion before consulting the
  implementation. Do not edit internal storage to make a planning journey pass.
- In a separately labeled technical pass, inspect code, portable records, requests
  and logs as needed to verify calculations, privacy and failure handling. Storage
  failure simulation must use only disposable contexts. Distinguish that work
  from what a planner could do through the interface.
- Add small, reproducible tests only for a demonstrated coverage gap. Reuse the
  existing scripts and dependencies. Product defects stay as report findings;
  do not change product behavior to make a test pass. If a test is obsolete,
  explain the requirement and evidence behind any update; preserve the assertion's
  intent and original failure evidence.
- Save new results under a fresh run directory within
  `evidence/combined-independent-review/`. Do not overwrite historical results.
  Record exact commands, environment, data, actual browser/device and screenshots.
- Use the current production app, normally `http://localhost:5173`, and tool
  service on port 5174. Verify availability and loaded asset. Do not stop or
  reconfigure an existing service without understanding its users. Use separate
  ports/private temporary settings for fault injection and scripted AI fixtures.
- Treat input data, costs, prices and professional declarations as assumptions.
  Never invent survey evidence, legal access, market prices or compliance. Never
  include credentials or private site information in evidence.

Use a fresh unchanged sample for each numerical case unless explicitly stated.
Document the starting assumptions and reproduce expected values independently.
Use the original prompts listed at the end as detailed checklists; cover their
remaining cases as well as the core journeys below. Track every case by ID so
omissions cannot disappear in a general “passed” verdict.

## A. Street-editor follow-up — Feature 5

1. Draw the sample branch (40,50)→(40,90), move its shared junction east three
   times with Right Arrow, then grab off-centre and drag horizontally. X should
   change while Y remains 50 and the entrance/main row stays connected. Check
   live coordinate deltas, deliberate vertical movement, canvas zoom, Undo/Redo
   and Cancel. A real vertical move can disconnect access and must be explained.
2. Pointer placement near (40,51) should offer the visible Join cue and snap to
   the existing Y=50 centreline. Typed (40,51) must retain its exact 1 m gap until
   explicitly joined. Check repair, draft Undo and Cancel.
3. With manual streets, inspect the proposed search scope before approval:
   geometry/widths held, Spine with 9/10/11/12 m frontage. Reject once, then approve
   and compare the executed scope with the reviewed proposal.
4. Test isolated, park-crossing and full-width boundary-crossing streets. Locate
   the actual offending corridor/gap and distinguish accepted from draft geometry.
   Repair on the drawing; invalid drafts must not Apply.
5. Move the main row Y=50→40 and propose an entrance connection. Review the
   proposed link and affected lot outlines. The original sample case is
   20→18 homes and 720→789 m² street surface; verify the starting state before
   expecting these figures. Cancel must recover the original. Affected outlines
   are not automatically a count of lost homes or proof of legal access.
6. At 375×812, change the selected branch width and switch drawing↔review.
   Verify identity, measured consequences, scale, camera, selection and Cancel.

## B. Lot-editor follow-up — Feature 6

1. Merge sample Lots 1 and 3: 200+200=400 m², 20→19 homes. Cancel, Apply,
   Undo/Redo, then split it back into two 200 m² lots. Refuse a merge across the
   road and refuse replacing a nonrectangular group by its bounding rectangle.
2. Subdivide the south 120×20 m block into ten equal widthwise lots: 240 m² each,
   18 homes, 4,000 m² total lot area, 720 m² streets and 480 m² green. A depthwise
   rear lot without frontage must be identified by a one-based proposed label,
   highlighted, and blocked even if it is vacant.
3. Split a 200 m² lot into two 100 m² vacant lots. Expect 21 parcels and 19 homes,
   no sales attributed to vacant parcels, and unchanged total lot area. Test
   vacancy preservation through merge/split. Merging vacant Lot 1 with occupied
   Lot 3 must explain the 19→18-home consequence before Apply.
4. Trace changed and unchanged accepted→proposed lot references. Inspect the
   provisional allowance label and visible limits on polygon setback checks.
5. Reshape a lot with pointer, coordinates, keyboard, add/remove corner and local
   history. Test invalid geometry, fresh-preview requirements, Cancel, Apply,
   plan history, reload/backup, held-lot conflicts and narrow drawing↔review.

## C. Housing-mix correction retest — Feature 7

1. Remove Lot 1's home and reserve a 16×16 m Courtyard template on it. Restore
   should remain blocked at 19 homes, with readable persistent guidance naming
   the lot/design/dimensions. Opening and cancelling the outline editor must not
   hide the unresolved problem. Reassign a fitting design; the lot stays vacant
   until explicit Restore returns it to 20 homes.
2. Assign one 8×6 m Courtyard. Preview generated lots must first review releasing
   explicit assignments to defaults, retaining the library, then separately
   review replacing the partition. Check Cancel before/after each approval and
   both Undo steps. Explain exactly which accepted changes survive each Cancel.
3. Rename/resize Courtyard to 7×6 m and choose it as default. Identify inherited
   and explicitly assigned lots before Preview: 20×42=840 m². Restoring the old
   default should leave the explicit Courtyard and 1,182 m² total. Explicitly
   choosing the current default must hold that design during future default
   changes; test release-to-default separately.
4. At 375×812, identify the selected design/code/area/assignment provenance and
   both designs' counts without relying on color. Verify camera/selection/draft
   continuity, tablet and actual 200% zoom.
5. One 48 m² home among nineteen 60 m² homes gives 1,188 m² built: construction
   falls Rp6bn→Rp5.94bn at Rp5m/m². With 5% physical contingency, non-land costs
   fall and allowance rises Rp63m, with unchanged revenue. Inspect the actual
   shared assumptions. This does not verify the smaller home's market price.
6. Include default provenance after backup/import, deletion of unused/default
   templates, conflicting polygon fit and repair, assignment inheritance through
   subdivision, and delayed-response invalidation from the original retest.

## D. Open spaces — Feature 8

1. Discover the controls, identify the existing park and its protection, and
   Cancel an initial edit. Keep its 480 m²; add a 120 m² pocket with corners
   (10,80),(22,80),(22,90),(10,90) and a 160 m² corridor from (30,92) to (70,92)
   at width 4 m. Total designed green is 760 m². Replacing the pocket with
   (10,80),(22,80),(22,84),(14,84),(14,90),(10,90) gives a 72 m² concave pocket.
2. Select, name, categorize and edit each space with off-centre pointer grabs,
   coordinates, arrows/Shift+arrows and add/remove corners. Check unfinished
   drawing history, closure, Cancel and recovery from incomplete fields.
3. Test crossing edges, overlaps, outside-site geometry and minimum conflicts:
   121 m² on the 120 m² pocket; combined 761 m² on the 760 m² collection. Identify
   the conflict and distinguish shape/location locks from minimum commitments.
4. Review consequences of placing a park over generated homes, including true
   polygon green-works cost, before Apply/history. A conflict with held manual
   lots or assigned homes must not silently delete or reassign them. Distinguish
   conservative exclusion extents/unallocated land from actual designed green.
5. Test fixed Loop conflicts, no optimum-capacity claims, named-space selection
   and preservation through proposals/search/comparison/explanation, stale and
   delayed answers, reload/import, clear/Undo, and boundary-only reservations
   surviving layout generation. Repeat representative narrow/zoom/touch tasks.

## E. Feasibility experiments — Feature 9

1. Independently and jointly vary supported circulation/frontage/depth and cost
   inputs. Explain what stays held. Review drawings, quantities, cost lines,
   required price/ceiling, owner outcome and sequential design/cost attribution.
2. At 1,200 m² built, construction Rp5m→Rp4m/m² with 5% physical contingency
   saves Rp1.26bn in non-land costs. Geometry and revenue stay unchanged. Verify
   accepted costs agree across other financial views, search and explanations.
3. On manual lots/reshapes/assigned homes, cost trials remain available while
   protected design regeneration is held. Invalid inputs or geometry must not
   publish misleading partial totals or replace accepted work.
4. Exercise Reset, Cancel/Close/Escape, Apply, one-step Undo/Redo, reload/backup
   and keyboard/narrow/200% zoom. A trial is not a verified quotation or valuation.

## F. Saved alternatives — Feature 10

1. Name a baseline, change inputs, save another scheme, annotate and rename,
   compare each side's own assumptions, review reopening, Cancel, confirm and
   recover the previous working plan through Undo/Redo. Notes/collection must
   survive plan history and reload without changing saved geometry.
2. Save an unapplied search preview without applying it. Test the Rp1.26bn cost
   comparison above, then change one side's selling price: only its finances
   should change. Independently fitted drawings must not imply a measured
   difference in size. Test unique names, limits, removal and removal recovery.
3. Preserve manual streets/lots/reshapes, housing, vacancies, spaces/commitments,
   costs, studies and site context; block reopening rather than silently losing
   orphaned work. Reopen after clearing/deleting the working boundary.
4. Export/import several schemes as a separate project; change its notes and
   verify independence. Distinguish retained calibration from session-only media.
   Test storage-full/conflicting-tab recovery in isolated contexts: last durable
   work stays safe and a download retains current in-memory changes.
5. Check annotation drafts, Escape/focus, narrow/touch/200% zoom and unobstructed
   reopen controls. Do not treat absence of cloud sync as an implemented promise.

## G. AI assistant and administration — Feature 11

1. With a clearly labeled scripted fixture and isolated tool service, review
   intention→hypothetical input proposal→Run→engine measurements→explanation→
   drawing review→explicit Apply. Test Cancel/Discard/history, selection context,
   held work, saved schemes, reload and portable records. No AI action may apply
   a plan or supply authoritative geometry/financial figures on its own.
2. Test ambiguity, unsupported requests/tools, invented numeric prose, parallel
   tool calls, unavailable service, delayed replies, cancel, timeout, plan or
   selection changes and connection revisions. Stale responses cannot become
   accepted work. Failures must leave local measured tools available and must
   not silently route to the alternate connection.
3. In private disposable settings only, verify administrator authorization,
   explicit primary/alternate switching, write-only key replacement/removal,
   blank-key retention, revision conflicts, file permissions, restart/test status,
   request/response limits and bounded concurrency. Check that settings, keys and
   transcripts stay out of browser storage/projects/exports and that source notes,
   media, raw terrain grids and saved alternatives stay out of model payloads.
4. Assess whether a planner understands the difference between local fixed-rule
   tools, AI interpretation, assumptions and engine facts. Test keyboard, narrow
   layouts and actual zoom. Reusing fixtures is valid software evidence, not
   evidence of real-model quality or human acceptance.
5. Real-model tests require owner-supplied routing/credentials and authorization
   to use them. If available, record the connection/model identity without
   secrets, test supported intentions and ambiguity repeatedly, compare proposals
   and cited findings with independent ground truth, and test explicit alternate
   switching. Otherwise mark this gate Blocked; do not contact a substitute model,
   install secrets or claim real-model verification.

## H. Terrain, drainage and phasing — Feature 12

1. Open with no data: no invented results. Verify declared local metre frame,
   datum/source/date and complete grid import. Test malformed/duplicate/missing,
   fine/nonuniform grids, concave/reversed boundaries, coverage without
   extrapolation, local slopes/threshold areas and positive/negative platforms.
   Independently check a plane z=100+0.01x+0.02y on the 120×100 m site: slope
   ≈2.23607%; at platform 101 m, gross cut ≈8,033.333 m³ and fill ≈833.333 m³.
   These are gross screening volumes, not a grading design or earthworks price.
2. Check disjoint roof/street/green/other surfaces, weighted runoff C and SI
   conversion. With roof 1,200, street 720, green 480 and other 9,600 m²; C values
   0.9/0.85/0.2/0.35; intensity 100 mm/h, duration 30 min and concentration 15 min:
   weighted C=0.429, Rational peak=0.143 m³/s, gross rainfall=600 m³. This last
   number is neither runoff nor detention storage. Check missing declarations,
   short duration, off-site inflow, significant storage, zero coefficients, no
   capacity, declared capacity and an outfall reference outside the boundary.
3. Assign occupied lots to phases using map and table. Verify actual template
   construction, contingency exactly once, remaining non-land costs allocated
   by shares totaling 100%, build/sales timing, calendar labels, single owner
   payment, selling costs and a monthly ledger reconciling to accepted surplus.
   For the unchanged example: receipts Rp17bn, non-land costs Rp10.3804bn, owner
   Rp10bn, selling 3%; closing cash is −Rp3.8904bn. With two equal phases, build
   months 1–3/4–6, sales 4/7, land payment 1, maximum month-end deficit is
   Rp15.1902bn. Independently derive the ledger; do not copy the displayed total.
4. Test vacancies, different templates, infrastructure-only phases, delayed sales,
   zero costs, late land payment, invalid shares/months and missing/orphaned lot
   assignments. Do not auto-remap references. Month-end deficit is not intramonth
   funding or financing approval; phase infrastructure readiness is not established.
5. Test partial applicability, invalid fields, draft/accepted comparison,
   Apply/Cancel/Escape/history, file/record import, reload, saved scheme isolation
   and comparison of sources/assumptions. After boundary changes, resize,
   clear/delete or regeneration, retain declared studies and recheck coverage
   and references without relocating or discarding the observations silently.
6. Inspect maps, focus, labels, contrast, invalid SVG values and overflow at
   desktop/narrow/actual zoom. Check stale-phase warnings in feasibility trials,
   local/server agreement and the privacy of AI study facts. Never claim routing,
   flooding safety, downstream permission or regulatory suitability from this map.

## I. Cross-feature acceptance and external gates

Run one connected client-study journey: create a project, edit site/streets/lots,
assign housing, protect green space, review feasibility, retain annotated schemes,
add declared development studies, ask for a reviewable AI experiment, compare,
explicitly reopen a scheme and export/reopen in another project. Use separate
studies where held geometry intentionally prevents a change. Check history,
selection, camera, draft protection, unavailable results, recovery and session-only
media throughout. Distinguish intentional limits from defects.

- **Unrehearsed planner acceptance:** record discovery difficulty and whether a
  planner can explain held inputs, assumptions, consequences and recovery. An
  automated agent must identify itself as such; it cannot certify human or
  professional sign-off by role-playing one.
- **Physical devices:** when available, record device/OS/browser and use actual
  tap, drag, pinch, scroll and screen keyboard on representative editing/review
  tasks. Emulation is a separate result. Otherwise mark physical-device cases
  Not tested, naming the missing device.
- **Accessibility:** complete keyboard-only journeys; review accessible names,
  focus order/traps/return, Escape, error announcements, alternatives to dragging,
  non-color identification, contrast and reflow. Use a real screen reader if
  available and name it. DOM/automated accessibility checks alone do not complete
  a screen-reader walkthrough.
- **Real-project evidence:** requires appropriate supplied survey/datum/alignment,
  storm/concentration/catchment/outfall data, schedule/cost evidence and qualified
  planner/civil/financial review. Record exact sources and reviewer scope. Without
  those inputs, mark site-specific suitability Blocked and continue fictional
  analytical checks. Do not infer legal access, compliance or market verification.

Do not stop the runnable review because an external gate is unavailable. Record
the missing prerequisite and continue all independent cases. Never turn an
unperformed or simulated check into Passed.

## Output and handoff

Create `TEST-MATRIX.md`, `REPORT.md` and evidence in your fresh run directory.
For every case record: ID/feature, human workflow or technical test, starting data,
independent expected result, observed result, Pass/Fail/Unclear/Not tested/Blocked,
evidence path, tested build/device and any missing prerequisite. List scripts
added/updated and exact reproducible commands. Explicitly reconcile coverage with
the original prompts; report skipped cases rather than claiming “tested everything.”

Begin the report with a short verdict and material failures/data loss. Present
each actionable finding as an implementation prompt:

> **[Critical / Important / Refinement] — [Planner-facing problem]**
> **Classification:** Reproduced defect / usability improvement / future discovery.
> **Observed:** Exact steps and inputs, expected versus actual result, and user impact.
> **Prompt to implementer:** The smallest bounded correction, working protections
> to preserve, and an observable acceptance check.
> **Evidence:** Project, commit/asset, browser/device/viewport and artifact paths.
> **Not verified:** Uncertainty, external dependencies and unperformed checks.

Separate observed facts from inference and professional judgment. Rank findings
by impact; avoid decorative additions or unsupported product claims. End with
lost-work outcomes, remaining validation gates and a candid readiness verdict.
Leave product fixes, commits and publication to the owner/implementer.

## Original procedures and supporting references

Read these without changing them. Their procedural detail remains part of this
review; historical build/status/next-feature restrictions are superseded only as
described in Scope above.

- `evidence/street-review-followup/RETEST-PROMPT.md`
- `evidence/blocks-and-lots/TESTER-PROMPT.md`
- `evidence/housing-mix/TESTER-PROMPT.md`
- `evidence/housing-review-followup/TESTER-PROMPT.md`
- `evidence/open-spaces/TESTER-PROMPT.md`
- `evidence/feasibility-experiments/TESTER-PROMPT.md`
- `evidence/saved-alternatives/TESTER-PROMPT.md`
- `evidence/ai-assistant/TESTER-PROMPT.md`
- `evidence/terrain-drainage-phasing/TESTER-PROMPT.md`
- Current requirements: `docs/PRD_v0.10.md` through `docs/PRD_v0.17.md`;
  `docs/AI-ADMIN.md`, `docs/DEVELOPMENT-CALCULATIONS.md`, `docs/ACCEPTANCE.md` and
  each feature's evidence README. Older acceptance tables can contain historical
  pending labels; reconcile them with current evidence instead of assuming either
  an old label or an automated pass establishes present acceptance.
