# UNBUILT — Decisions

Owner: Orchestrator. Append-only. Newest first.

## D01 — Repo starts uninitialized; scaffold in place, no git yet
Date: 2026-10-26. Workdir held only `UNBUILT_PRD_v0.2.md`, no git, no AGENTS.md, no storyboard file, no v0.1.
Decision: scaffold `docs/`, `src/`, `tests/`, `evidence/` in place; copy PRD to `docs/PRD_v0.2.md` (original untouched).
Rationale: PRD says preserve unrelated work and do not assume blank repo — verified blank-ish except PRD, so in-place scaffold is safe.

## D02 — Sequential roles for M0/M1 slice, parallel Herdr agents deferred
Date: 2026-10-26. Herdr coordination is available (server 0.9.1, client 0.9.5, `muse` kind supported, pane split + `agent start` verified present). Current workspace `w7` has one pane; no git/worktrees.
Decision: execute M0 and first M1 increment sequentially under named role hats. Spawn Designer/Coder/Tester Herdr agents after git init + ownership map lands.
Rationale: parallel writers in a non-git dir risk overwrites; PRD coordination rules require ownership before parallel work.

## D03 — No Rust; pure TypeScript domain engine first
Date: 2026-10-26. Per PRD, Rust/WASM only after measured bottleneck.
Decision: geometry + finance as pure TS modules with golden tests. No worker yet.
Rationale: 250-candidate budget is trivially fast in TS; measure before complicating.

## D04 — Model blocker recorded; deterministic work proceeds
Date: 2026-10-26. Env names list shows no Meta API credential vars. `~/.config/muse/auth.json` exists (CLI auth, not app API proof — contents never read).
Canonical runtime model IDs verified from official docs: `muse-spark-1.3` (latest/default), `muse-spark-1.2`, `muse-spark-1.1`, plus `-contributor` variants.
Decision: M0 model/tool smoke test is BLOCKED on app API credentials. Continue deterministic core; do not claim model gate passed.
Rationale: PRD failure table — CLI access is not application API access.

## D05 — Event baseline
Date: 2026-10-26. Official event page confirms hackathon begins Oct 26; submissions due Nov 4, 9:00 PM ET (matches PRD). Full rules/reuse terms still to verify against official rules before submission work.
Decision: treat Nov 4 9PM ET as deadline; reserve final fifth for integration/review/demo.
Rationale: dates corroborated by two routes (PRD + live event page).

## D07 — M1 core: spine/loop generator + economics, 36 fixtures green
Date: 2026-10-26. `src/geometry.ts` (site, spine/loop, exact rect-union, validators, green lock), `src/economics.ts` (fictional labeled rates, finance wiring). Spine: 20 homes, 720 m2 road. Loop: 16 homes, 2076 m2 road. Road saving reconciles to measured delta x rate. `npm test`: 19 finance + 17 geometry PASS.
Rationale: hand-computed expectations matched the generator; no storyboard numbers reused.

## D25 — Tester T10e accepted; O1–O6 fixed, gate at 9 suites
Date: 2026-10-26. Scope-policy wording, gated compare, baseSpec staleness, photo clearing, live inspector copy, append-only record note. Designer §17 in place.

## D26 — Movable compound entrance (west+east) + Open space rename
Date: 2026-10-26. Entrance is `{edge, offset, width}` end to end: schema, makeSite default, generators derive road/connector from the gate, entry validation follows the edge, Cedar byte-identical. UI: edge segmented control + distance field (NaN-safe, invalid reverts) + canvas gate drag, one undoable step each, staleness/history/export carry the gate. "Grove A" renamed "Open space A" in all user-visible copy; id `grove-a`, lock semantics, and green-works cost basis unchanged; "keep this open space" triggers the preservation proposal (intent fixture). No M2/M3 gate claimed; browser proof outstanding.

## D27 — Irregular polygon lots, staged + M3 browser findings closed in code
Date: 2026-10-26. New `src/polygon.ts`: simple-polygon predicates (area, edges, simplicity, containment, boundary-touching-vs-overlap, shared road boundary), 47 fixtures green, 10th suite wired into `npm test` (Tester to audit the wiring). Integration: quantities use true polygon area with remainder reconciliation; validation adds joint poly checks (footprint kept, access kept, no overlaps incl. poly-vs-poly); failingLots uses true area + road-shared frontage; footprint placement moved into the engine as the single rule shared with the canvas.
Staged product rule: reshaped lots are manual locks — search, circulation, frontage, apply, open-space, and entrance edits stay blocked with the reason until the user explicitly discards the reshapes; new sites clear them (logged, kept for Undo). Homes never auto-relocate; max 12 corners; holes/multipolygons out.
Findings in code: photo retained on dimension confirm + explicit remove (undo keeps it: never cleared implicitly); image bytes must decode as PNG/JPEG within 10 MB or the last valid photo stands with an inline error; export v2 (versioned accepted-plan snapshot + separate append-only events incl. undo/redo); field-level site errors; "assumed — review" badges + pricing disclaimer on custom sites; expandable plan; any-two compare with Fit both + expandable dock. All browser verification pending; no model/human/M3 gate claimed.

## D29 — Audit repair increment (v0.35 supplement stands, contracts preserved)
Date: 2026-10-26. Fixed before any expansion: coincident-overlap detection (inward-nudge), finite-only boundary, 2 m setback ring on edited shapes (3 m labeled unverified), string-held vertex fields, version-bound proposals, unambiguous unit grammar with clarification, stable lot IDs carried through search/regen with an explicit preserve-vs-discard choice, signature+MP image gates, versioned localStorage persistence + file import (v2 records importable), server seam (mock intent/search, Meta tool-call adapter returning honest 503/502 without a key). Protocol grounded in Meta chat-completions docs (api.meta.ai/v1, Bearer, muse-spark-1.3); no real model call attempted. Redesign spec written first per the audit's order; visual rework explicitly deferred. No gate claimed.

## D34 — Canvas-led shell redesign from screenshot comparison
Date: 2026-10-27. Compared `evidence/ui-reference/current-ui.png` against `target-stitch.png` side by side (plan in LAYOUT-PLAN.md) and rebuilt the workspace: dark shell grid (44px top bar, real-data context strip, 64px icon rail, dominant paper field, 320px dark inspector, persistent outcomes strip). Icon rail (Select/Pan + selection shortcuts, V/H/Escape, tooltips, 12px captions under full accessible names); floating dark canvas toolbar (Fit/zoom/expand, short hint; docks to the south edge ≤900px so it never covers worked geometry); object selector + contextual inspector + assistant + request composer all in the right column (site setup collapsed into a disclosure); dock details collapse upward and auto-open on search. Footprints restyled light dashed (visual only, geometry untouched). Verification looked at actual screenshots: 25/25 Playwright checks (composer in view 1440/1024, keyboard, touch incl. a caught toolbar-overlap veto fixed, meaningful compare, in-flight discard), true-geometry 200% zoom, 351 engine checks, zero console errors. Deliberate deviations from the target: readable type (no 9–12px labels), no zoning/solar/FAR/DXF/telemetry claims, no invented actions. Screenshots new-ui-*.png reviewed against the target by the implementer; independent visual and human gates still open. Bundle index-6-6nXSzb.js live; uncommitted.

## D33 — Retest response: composer-first column, screen labels, mobile focus
Date: 2026-10-27. Independent retest (4 issues) answered in code. (1) Column rebuilt composer-first: the canvas stage takes the flex leftover after toolbar/composer/verdicts (ResizeObserver refit), so the request textarea + Send fit at 1440×900 (bottoms 730/727) and 1024×768 (546/598) with no inner scroll; comparison canvases use width mode. (2) Labels hold screen size at any zoom (viewBox-units-per-pixel scaling + paper halo): lot numbers render 22px at 1440 and ≥13px at 1024/375; measured contrasts 14.08 (disclosure), 11.29 (lot numbers), 4.58 (tags); every lot carries a hover/screen-reader title with number + area. (3) Mobile: compact outcomes sit directly under the drawing (gap 0), side columns collapse behind Show/Hide controls (collapsed by default ≤900px), touch tap selects, no page overflow. (4) Stitch prominence without prototype claims: mono figures, slimmer chrome, 1760px cap, narrower rail, centered plan. Also fixed Escape in the tool rail (deselect path was unreachable from there). Playwright: 24/24 green incl. real keyboard (Enter/V/H/Escape), touch, meaningful compare (20→17 homes, Rp3.56bn→Rp2.41bn), delayed-response discard, emulated 200% zoom without page overflow. Suite 351; bundle index-VGmP2eqq.js live. Machine pixel inspection done (pngjs crops: inputs render white, Send 0.93 dark, canvases 37–52% drawn incl. both compare plans; evidence r3-pixel.json + r3-*.png). True 200% zoom verified with exact zoom geometry (720×450 CSS px at dpr 2: single-column reflow, no page overflow, Send works). Human aesthetic review still requested. Model/human/M2/M3 gates open; uncommitted.

## D32 — Browser-findings response: CORS, versioned answers, bigger plan
Date: 2026-10-27. Independent re-walk (3 failures) answered in code. (1) Tool server now carries a restricted CORS policy: allowlisted app origins echoed (+Vary), explicit OPTIONS 204, unlisted Origins 403, no-Origin direct calls untouched; origins configurable via UNBUILT_APP_ORIGIN. 8 protocol fixtures; live :5174 preflight verified. (2) Assistant answers bound to a scenario+comparison key (spec, geometry, lots, assumptions, selection, preview, run): any relevant edit clears the panel to Ready, in-flight fetches abort, and responses arriving after their version are discarded — completed answers and fallbacks alike. (3) Workspace: canvas fits measured column space (was height-capped 473×414, now ~617×540 at 1440×900), centered, request field visible at 1024×768, topbar disclosure contrast fixed (paper on slate), bolder 15px lot numbers, slimmer rail, 32vh dock. Playwright from the real browser origin: 14/14 green (server-measured Why, stale-clearing, sizes, overflow at 3 viewports, zero console errors). Suite 351 checks; bundle index-CCBUdKC_.js live. Model round trip, 200% zoom, keyboard/touch, and human validation still open; no gate claimed; uncommitted.

## D31 — PRD v0.4 slice: canvas-first workspace + assistant via validated tools
Date: 2026-10-27. Self-contained `docs/PRD_v0.4.md` (successor; v0.1–v0.35 retained) + `docs/DESIGN.md` adopting the Stitch light-field/slate direction with accessibility overrides (16px/14px/44px, visible scrollbars, 24px+ handle targets, focus rings) and explicit exclusion of mockup claims (solar, FAR, EPSG, DXF/IFC, 142 homes, R-3, telemetry badges). New `src/snapshot.ts`: versioned canonical hashed ScenarioSnapshot (cyrb53, key-order stable) with full untrusted-input validation; 23 fixtures. Server: snapshot-accepting `/api/search` (planHash echo) + read-only `/api/explain` (two-spec measured deltas, priced-at, per-side validity); 17 protocol fixtures, Cedar spine-10 vs loop-10 hand-verified (n 20→17, road 720→2076, allowance Rp3.56bn→Rp1.27bn, area reconciles 12000 both sides). UI: tool rail (Select V / Pan H) left, inspector right (300px), slate top bar with probed tool-server status, paper canvas, violet open-space accent, readable SVG labels. New `src/assistant.ts` + panel: three questions (true/why/try) with disclosed keyword routing, server-explain-first with local-engine fallback and hash-mismatch refusal, read-only questions need no proposal, hypotheses labeled until engine-tested; 24 eval fixtures incl. a no-invented-figures check. Suite: 343 checks green; web build current on :5173. Browser proof, model round trip, and human validation all outstanding; no gate claimed; tree uncommitted per instruction.

## D30 — Planner-review response: credibility before polish
Date: 2026-10-27. Independent planner review (F01–F12) answered in code, P0 first: disconnected gates can no longer commit (connectivity proven pre-commit); search counts split into geometry/profile/ceiling/target with the owner expectation demoted to a labeled benchmark everywhere (Options, Record, accepted summary); reshape-carry copy unified (the old blocked-language removed); drags starting on fixed objects explain instead of panning; validity pinned above metrics; allowance waterfall with the surplus/allowance distinction; fuller compare deltas with priced-at assumptions; save-scope contract; deterministic-scope disclosure with single-locked-green resolve; print meeting summary. Full canvas-first redesign stays spec'd (REDESIGN-SPEC), not attempted here. No gate claimed.

## D28 — Reconciled against PRD v0.3 (matrix IDs, photo cap, open priority)
Date: 2026-10-26. Adopted v0.3's AC-33–AC-40 IDs and priorities (AC-36 P0, AC-37/38/39 P1, rest unassigned); former local rows moved to AC-41–AC-43; AC-40 recorded as explicitly unsupported (rectangular sites only). Photo cap confirmed as a hard 10 MB maximum (already enforced pre-decode in `onPhotoFile`; megapixel limit not implemented — v0.3 lists 20 MP as recommended). Open for the owner: milestone placement of polygon lots + movable entrance (immediate MVP vs separate release) and the 20 MP question; no capability marked complete on that account.

## D24 — M3 slice 1: reference upload, confirmed boundary, compare, record
Date: 2026-10-26. Photo is backdrop-only (fitted, labeled, never a number source); boundary/scale declared meters via siteSizeErrors; makeSite() generalizes generators to entrance height (Cedar-exact); compare view rebuilds both plans + run-data deltas; decision record exports JSON with UI state only. Designer T11e + Tester T10e dispatched.

## D23 — Generators generalized to entrance height (custom-site prerequisite)
Date: 2026-10-26. Spine/loop roads derive from site.entrance; loop ring scales with site. Cedar outputs byte-identical (all prior fixtures still green). Minimum site 120×100 m documented via the ring footprint.

## D22 — Rewalk defects 1–6 fixed in code, M2 still unclaimed
Date: 2026-10-26. Pre-edit undo snapshots; committed-baseline signed deltas; JS-measured canvas fit; wrapping chrome + internal tab scroll; input-validity Issues section; two-way Site selection with pan-safe clicks and list keyboard. Browser confirm pending; no commit.

## D21 — Static pre-pass defects all fixed in code (T10d D1–D11)
Date: 2026-10-26. Escape/pointer-cancel gesture safety, locks in undo, blur-committed assumption history, delta hygiene, working-plan applicability warning, snapshot-faithful previews, guarded preview Apply, zero-card wording, exact untouched edges. Shared failingLots() helper + 2 checks. None of this replaces the browser re-walk.

## D20 — §16 vs implementation divergences (spec advisory, build governs)
Date: 2026-10-26. Designer §16 landed but differs on details: it assumes Existing/Proposed/Compare views (deferred to M3, absent not dead), Cards/Drawer/Issues tab names (built Quantities/Economics/Options/Issues), draft bar under canvas (built in Grove inspector + undo row). No implementation change: M3 adopts compare views; tab naming reconciled then.

## D19 — Workbench rebuild per interactive prompt (uncommitted by instruction)
Date: 2026-10-26. Viewport workbench replaces document page: top bar, left rail inspector, bottom dock tabs, canvas with Select/Pan/zoom/Fit, 1 m snap, Esc semantics, last-change delta, prev-layout toggle. Search still holds drawn green fixed. Prompt explicitly forbids committing: tree left dirty. Designer T11d (§16) dispatched.

## D18 — T10c/T11c accepted, gate at 7 suites
Date: 2026-10-26. Tester draft report accepted (boundary re-derivation matched; 3 cosmetic notes fixed: parsed dirty-compare, history cap 50, tester file wired). Designer §15 accepted. Full gate green, prod build deployed on :5173 for re-walk.

## D17 — Direct-manipulation increment (TestFit direction, bounded)
Date: 2026-10-26. Canvas-led workspace: pan/zoom/fit (view-only), grove drag + corner resize when unlocked+selected, draft-vs-committed model with Apply/Cancel, undo/redo stacks over full snapshots, Spine/Loop + frontage design controls, contextual side panel. Pure `src/draft.ts` machine (empty=incomplete, invalid uncommittable) with 13 fixtures. Out: road drawing, arbitrary boundaries, home editing, maps, 3D.

## D16 — M2 retest evidence kept separate from claims
Date: 2026-10-26. Independent browser findings land in evidence/ux-*/ only; acceptance flips only on re-walk evidence. No M2 sign-off from implementation tests.

## D15 — Retest pass: preview, verdicts, empty-input honesty
Date: 2026-10-26. Per independent retest: transparent ghost outlines drawn under parcels; explicit zero/some/all/none commercial verdicts with no causal overclaim; string-held numerics (empty = Incomplete, green drafts keep last-good); baseline without Apply; plain display names; Headroom/Shortfall language. Awaiting browser re-verification; M2 still not self-signed.

## D14 — M2 UI built: Vite React+TS in web/, engine shared by import
Date: 2026-10-26. `web/` scaffold (npm registry reachable), engine (`src/`) imported directly — no second implementation. Intent parsed by tested `src/intent.ts` (12 fixtures). Canvas/commitments/cards/drawer/apply-undo per UX spec. Model path honest: "Model unavailable — deterministic mode" badge, no fake call. Working-green numeric edit regenerates layout; pointer-drag editing deferred (recorded limit). Dev server verified HTTP 200 with correct title.

## D13 — Intent parser is engine-side pure logic
Date: 2026-10-26. `src/intent.ts` + `tests/intent.mjs` (12/12): signature, no-selection clarification, explicit ceiling, profile switch, retained-building limitation, vague/explain clarification. UI calls it directly; no hardcoded response routing.

## D12 — Tester T10b accepted: counterfactuals wired into gate
Date: 2026-10-26. Accepted `evidence/search-tester-report.md` + `tests/search-tester.mjs` (moved-lock veto, deep-ceiling no-result, determinism hash). Noted the veto counters can double-count combos across causes — reads correctly as veto counts. Wired into `npm test` (Orchestrator edit to owned `package.json`). Full gate: 4 suites green.

## D11 — Designer T11 accepted: full interaction spec
Date: 2026-10-26. `unbuilt-designer` expanded `docs/UX.md` stub to a 348-line spec (stages, equivalence matrix, canvas rules, error catalog, responsive, a11y, language, out-of-scope). Touched only that file. Reviewed in full: grounded in PRD sections + AC IDs, no invented capability. Accepted as UI build contract.

## D10 — Search slice: 2 profiles, budget-capped locked search, honest selection
Date: 2026-10-26. `src/search.ts` + shared schema entities. Grid family x frontage, budget cap with truncation flag, locks/ceiling/per-lot applicability enforced, up to 3 distinct by stated objective. Test-first: 2 initial failures were wrong expectations (9 m-frontage footprint impossibility; disqualified combos excluded from candidates), product correct in both. `npm test`: 57 checks green (19+17+21).

## D09 — Spawned agents inherit on-request approvals; Tester parked blocked
Date: 2026-10-26. Started `unbuilt-tester` (muse, w7:p2) with append-only T10 brief. It immediately hit per-command shell approvals (`blocked`). Approved ONE read-only inspection (`git status/ls/cat`) under the user's autonomy grant; next command prompted again.
Decision: park the Tester as-is (brief intact, nothing written yet); do not spawn Designer until the approval story is fixed. Fix options for user: launch flags for full-auto at `agent start`, or relax workspace `/permissions`. Manual per-prompt approval does not scale.
Rationale: babysitting every trivial command defeats independent operation; approval posture is the user's call.

## D08 — Git initialized, no commit yet
Date: 2026-10-26. `git init` done; working tree untracked. No commit without explicit user request (source-control safety).
Rationale: worktrees/branches for parallel roles come after first commit, which awaits user go-ahead.

## D06 — Fictional data labeled; storyboard numbers are not targets
Date: 2026-10-26. Cedar Market 120x100m, 36/40/44 homes, Rp0.62bn saving are illustrations.
Decision: solver must derive its own counts; fixtures use PRD arithmetic values only as math checks, never as generator targets.

## D35 — Authoritative irregular site boundary and contained generation

Date: 2026-10-27. Owner explicitly prioritized polygon creation/editing. Adopted
one simple 3–64 vertex local-metre boundary, shared polygon validation/containment
and true area across the engine, persistence, hashes, server and comparisons.
The existing rectangular sites remain compatible. Existing generators retain
only whole contained lots and must fit their entire road network and green;
otherwise the boundary saves with an unavailable layout, no qualifying search
candidate and no displayed economics. No arbitrary road routing is claimed.
Polygon project/snapshot versions are 2 and polygon record exports are 3, so
older readers refuse them instead of treating them as rectangles. JSON import
also fixes owner bn/million conversion and missing target; export fixes price
million/base-unit conversion.

Boundary drafts support drawing, closing, dragging, midpoint insertion, removal,
coordinate editing, gesture Undo/Redo, Apply and Cancel. Plan Apply is one Undo
step. Existing manual lot conflicts use the prior explicit discard review.
Canvas sizing now subtracts padding to keep pointer transforms exact. Scale
labels cannot intercept corner taps. Docked tools, screen-sized labels, restored
panel contrast, adjacent mobile outcomes and a dedicated expanded comparison
address findings from actual browser screenshots. Comparison hatches have unique
SVG ids; preview labels no longer collide with lot numbers.

Verification and remaining gates are recorded in `evidence/polygon-workbench/`.
No real model call or human acceptance is claimed. Earlier 200% screenshot claims
used viewport emulation; this revision separately exercises actual browser zoom
through the browser's zoom API and checks getZoom, CSS dimensions and DPR.

Follow-up verification repairs in this slice: imported frontage is bounded before
subdivision; assistant version changes clear answers during render via instance
identity and abort on unmount; unavailable economics still report engine-derived
quantities; invalid green drafts retain committed manual-lot quantities.

## D36 — Shared planning parameters and responsive inspector

Date: 2026-10-28. The owner requested the reference video's continuous geometric
feedback and the supplied right-panel interaction specification. Shared planning
parameters now travel on the site frame: lot depth, park clearance, one-floor
home template dimensions, up to two cross streets and site/price lock states.
Frontage remains in the plan spec and the existing park lock remains separate.
This carries the inputs through history, search, canonical snapshots, server
measurements, comparison and exports without a second source of truth.

New projects opt into bounded park-aware orthogonal Spine routing. Whole lots
are retained only if contained, accessible and able to fit the shared home.
Loop retains its fixed-ring meaning and refuses incompatible cross streets or
park crossings. This does not claim general road routing, turning geometry,
ADU/roof/driveway modeling, solar exposure or zoning compliance. The green buffer
control is explicitly named Park clearance: its reserved strip is unallocated,
not silently counted as landscaped park or a site perimeter landscape.

Parameter previews require explicit Apply/Cancel and commit as one history step.
Valid park pointer release retains the existing one-gesture commit convention.
Invalid previews keep accepted geometry/quantities. Site locking guards both
polygon and rectangle entry points. Disabling the price lock removes that search
veto without inventing a different selling price. An accepted explicit price cap
re-enables enforcement. Search rejects zero-home options; target surplus remains
a reported measure, not an undisclosed qualification requirement.

Projects and snapshots with parameters use version 3; records use export version
4. Earlier projects keep their original generators, are identified as legacy,
and convert through a reviewable parameter draft. Old versions with new fields
are refused. Changed inputs also permanently dismiss an old preview rather than
reviving it when a field is restored. Current verification and remaining gates
are recorded in `evidence/dynamic-inspector/README.md`.

## D37 — Continuous drawing viewport and adopted visual composition

The owner explicitly requested closer use of the supplied screen's composition,
icons and colors, and removal of the invisible inner frame. The SVG now matches
the entire measured drawing viewport. An aspect-correct camera fits the real site
outline, supports edge-to-edge pan/zoom and preserves a manually chosen scale
when the inspector width changes. The former projection coordinates remain only
as a compatibility basis for edits; they are not a screen clipping rectangle.
Metre grid, cursor positions, boundary lengths and scale bar share that transform.

The shell uses sharp slate panels, a pale grid field, floating select/pan/view
tools, local SVG icons, purple park cross-hatching and area callouts, a cyan gate
tag, and compact evaluator/status strips. A contextual object picker and grouped
parameters replace duplicate selection rows; proposal review and optimization
come before advanced tools. View-layer switches are presentation only. The top
export action calls the existing accepted-plan JSON export, without suggesting
unsupported CAD formats. The user-supplied prototype is a design reference;
its scripts, tiny controls and invented measurements are not application logic.

Browser testing caught a draft-action banner intercepting upper boundary corners
and a CSS-shrunk mobile scale bar. Draft actions now occupy the lower camera
clearance, and the scale bar is checked against actual rendered site metres at
all target widths. Current evidence is in `evidence/stitch-viewport/README.md`.

## D38 — Boundary-edge access, consequence review and planner feedback

The planner's feedback exposed a workflow failure: a valid irregular outline
could be accepted before revealing the legacy west/east gate restriction. Live
Spine now accepts an explicit boundary-edge index and distance from its first
vertex. A short tapered polygon apron joins the sloping gate to the existing
orthogonal visibility graph. The apron is contained, obstacle-free and disjoint
from allocations; its polygon area feeds street costs and all derived results.
This is bounded geometric access, not verified access to an external street.
Fixed Loop remains restricted and explicitly directs these gates to Spine.

Boundary drafts now use the same proposed site/access/park for preview and Apply,
including newly drawn sites. The inspector leads with accepted/proposed measures
and unavailable reasons; access checks and corner edits follow. Individual edge
conflicts use the shared intersection predicate and numbered repair feedback.
Mid-edge candidate checks run only on request and require the planner to choose.

An optional minimum park area is distinct from fixing park shape/location.
Search keeps the park and assumed price even when direct edits are unlocked.
Successful search results disclose their fixed scope and measured allowance
comparison. Local capacity answers admit the unmeasured binding constraint;
measured comparisons offer editable client text without unsupported causes.
Replacing an in-flight question aborts/invalidates its prior answer.

New semantic fields require project/scenario version 4 and record version 5;
older envelopes cannot carry fields they would silently ignore. Existing plans
remain compatible. Saved-state disclosure and accepted-plan downloads describe
the actual recovery contract; no saved-preview/history capability is implied.
See `docs/PRD_v0.7.md` and `evidence/planner-improvements/README.md`.

## Features 1–3: projects and editable plan contents

The owner approved the first three roadmap features together. Use local browser
storage for this increment; accounts, cloud sync and named saved alternatives
remain future discussion. `unbuilt.projects.v1` holds a validated named library,
active project ID and accepted projects. Migrate `unbuilt.project.v1` once without
writing/deleting that original entry. Imports always create a separate project.
Reject unreadable libraries atomically; compare the stored raw library before
writing to detect another tab's changes. Storage errors keep current edits in
memory and expose a downloadable accepted-project backup. This is conflict
detection, not concurrent collaboration or an atomic cross-tab transaction.

Optional `contents` distinguishes no boundary, boundary-only and generated
layouts, plus removed-home reservations. Missing flags preserve legacy behavior.
Project/scenario version 5 and record version 6 carry these semantics; older
envelopes may not silently carry them. Empty generators yield no geometry;
economics refuses intentional empty layouts; search returns no fake options.
Vacant lots retain parcel allocation, but home count, footprint, revenue and
construction cost exclude intersecting removed-home lot regions. Those regions
are a conservative reservation through regeneration, not stable parcel IDs.

New blank boundaries do not auto-generate a scheme. Explicit starter generation
checks bounded park/gate choices and accepts only a validated contained Spine
layout with homes. Failure preserves the accepted outline and reports its
bounded scope. No maximum yield, legal access or new routing capability is
implied. Corner insertion/removal projects an explicit entrance's former centre
to the nearest new edge; corner moves keep its along-edge proportion. Gates that
cannot fit after editing remain subject to the existing preview/validation.

Plan removals are confirmed and reversible within the open workspace. Clearing
also clears the protected park (disclosed); deleting a boundary respects its
lock. Project deletion is confirmed separately, with one session Undo action.
Switching projects remounts workspace state, aborting pending explanations and
isolating all histories/results. See PRD v0.8 and current milestone evidence.

## Features 1–3 owner review: reset clarity, backups and session recovery

Date: 2026-10-28. The owner requested implementation of six focused review
priorities, with reproduction before fixes. The original right-edge clipping was
not reproduced at the documented desktop sizes or actual 100–200% zoom; exact
original Chrome dimensions were unavailable. Improve intrinsic wrapping and keep
Apply/Cancel sticky without replacing the canvas-first layout.

Delete boundary and Start blank had identical engine effects. Consolidate them
as Delete boundary and layout, preserving confirmed reset, assumptions and plan
history. Downloads in the library use the existing versioned project envelope;
accepted geometry, assumptions and decisions transfer, session data does not.
Keep private-browsing guidance general rather than attempting unreliable detection.
Warn at actual project departure only when history/photo recovery is at risk;
block implicit application of a boundary draft and offer explicit discard.

Photo checks reproduced inaccessible controls after blank reset and a Remove photo
handler incorrectly wired to park locking. Share the photo controls across empty
and generated plans and remove the image through its actual handler. Full test
results and scope limits are in `evidence/planner-feedback-fixes/README.md`.

## Pointer-drawn boundaries respect the existing local-coordinate range

Date: 2026-10-28. Reproduced the owner's six-vertex failure with ordinary clicks
across visible paper: two X coordinates became −13 m. The fitted viewport includes
space outside the 0–500 m domain, and pointer handlers previously accepted it.

Keep the engine's range validation. New drawing views bring the origin onto the
paper with handle/tool clearance; excessive view spans shrink to the supported
extent. Pointer placement/dragging and arrow-key movement stop at workspace edges.
Outside-range paper is shaded and the editor explains the limit. Typed coordinates
remain unmodified and invalid values still block Apply. No-op arrow presses at an
edge do not create empty history steps. Accepted geometry changes only on Apply.

The browser regression uses six visible-paper clicks rather than converting a
known-valid polygon into screen positions. Checks include desktop/laptop/mobile,
real 200% zoom, range extremes, history and emulated touch. Exact results and
remaining limits are in `evidence/boundary-pointer-range/README.md`.

## Feature 4 — Local site context, calibrated references and reviewed imports

Date: 2026-10-28. The owner approved feature 4. Their latest format answer makes
DXF/PDF essential; PNG/JPEG and CSV remain supported. Implement a bounded source
workflow beside the existing canvas, preserving generation and accepted geometry.

PDF pages render locally through a lazily loaded, version-pinned renderer and
bundled local font/CMap/decoder resources. Images/PDFs require a user-supplied
known distance, two pixel points, local anchor and direction. One uniform scale
and rotation apply; this neither georeferences nor certifies the source. Replaced
media stays staged until Apply; Cancel preserves the accepted attached file.

CSV and supported closed straight 2D model-space DXF polylines convert through
explicit units and optional origin translation. Record original origin/layer;
review the normalized outline through the existing boundary consequence/history
flow. Do not flatten curves, merge candidates or infer holes. Boundary locks
prevent import while still allowing reference/annotation work.

Surrounding streets are reference polylines; features/access assumptions are
markers. Required source and uncertainty remain visible. These do not change the
solver, land budget, prices or legal-access status. Accepted references survive
boundary resets; their alignment must be reviewed when the site changes.

Store optional siteContext in project v6 / record v7 and full plan history;
reject it in older envelopes. Scenario snapshots remain v5 because these are
reference annotations, not generation inputs. Keep original survey bytes external:
save metadata, warn on leaving attached media, and restore calibration only when
the matching source/page is reattached. This keeps existing browser-storage limits
and failed-save backup behavior honest. See PRD v0.9 and site-context evidence.

## Feature 5 — Reviewed orthogonal development-street networks

Use an optional segment network in existing planning state and its parameter
transaction, rather than a second plan store. Split crossings into shared junctions;
move connected collinear components together. Retain Apply/Cancel, draft history
and one accepted-plan history step. Do not silently move an entrance or reroute a
planner's streets around conflicts.

Rectangular road corridors use exact union-area and polygon-containment checks.
Generate only complete fitting frontage lots; fixed park/clearance, compatible lot
edits and vacant reservations remain protected. This bounded greedy generation is
not a yield or traffic optimum. A nearest-street entrance link is a reviewable
proposal; park/boundary conflicts require planner correction.

Manual streets use project v7, record v8 and snapshot v6. Older formats remain
supported but cannot hide newer generation inputs. Search holds manual streets
fixed; fixed Loop cannot overwrite them. Replacing the network with generated
routing requires preview and acceptance. Clearing/deleting a layout removes its
network; site context retains its existing independent behavior. No new model or
other roadmap feature is introduced. See PRD v0.10 and street-editing evidence.

## Street-review corrections before Feature 6

Reproduced the off-centre horizontal junction grab jumping vertically, compounded
when an invalid-access warning resized the viewport. Junction gestures now apply
pointer deltas through a captured inverse SVG transform to the original junction.
They preserve grab offset and ignore later projection changes. Retain free two-axis
movement, live ΔX/ΔY, valid/invalid feedback and one-step gesture history.

Use centreline projection with a visible Join cue for nearby pointer placement;
node-only snapping was insufficient for branches along a street. Keep typed input
exact and offer a measured, explicit gap repair. The editor's full-width conflict
visuals consume the same structured first blocker as generation. Connector legs
and affected accepted lots use orange rather than implying confirmed access.

Intent proposals receive the current search scope; manual-street searches actually
run Spine × 9/10/11/12 m frontages. Align the pre-run proposal, local assistant,
optimization count and post-run scope. Store no new project format or geometry.
Mobile review summaries sit below the paper; selection and camera survive the
round trip to detailed controls. Feature 6 remains unstarted. Verification and
remaining gates: `evidence/street-review-followup/README.md`.

## Feature 6 — Durable manual lot partitions with reviewed operations

The owner authorized Feature 6 after the street-review follow-up. Store the manual
rectangular partition in planning.lotPlan and keep existing stable rectangle-keyed
polygon reshapes. Reuse the parameter Apply/Cancel/history transaction, extending
its preview to explicit vacancy reservations. Do not introduce a parallel project
store, legal block model or unsupported polygon boolean geometry.

Compute connected blocks from current lots. Split/merge/repartition only a selected
rectangular union; reject gaps, roads, holes and genuinely reshaped source polygons.
New occupied lots must fit the current home; an explicit vacant choice permits
small planning parcels with road frontage and no invented homes. Existing vacant
reservations remain conservative through regeneration and merge. Manual lot plans
stay held through road/park/boundary changes and frontage searches; an explicit
reviewed generated-lot preview is the compatibility path back to generated design.

Shared generators/validation/economics/server tools consume the same partition.
Use project v8 / record v9 / snapshot v7; older envelopes cannot conceal it. Keep
source media and session history exclusions unchanged. Reshape drafts gain local
history, keyboard corner controls and pointer-offset preservation without changing
the accepted polygon data model. No Feature 7 or real-model integration is included.
See PRD v0.11 and blocks-and-lots evidence for exact supported behavior and gates.

## Feature 6 planner review follow-up — 29 October 2026

- Frontage blockers use one-based proposed lot numbers and identify inaccessible
  proposed parcels directly on the drawing. Mobile draft banners carry the same
  reason beside the plan, retaining the draft and viewport during review.
- Lot-operation review shows source occupancy, resulting vacancy, explicit loss of
  occupied homes, and accepted-to-proposed references for unchanged parcels.
  Drawing labels show reference transitions during preview; these are not legal IDs.
- Provisional pricing travels beside allowance values; selected reshaped lots show
  the unverified deeper-setback limitation immediately below their metrics.
- Irregular block definition/subdivision is retained as future discovery, not silently
  included in Feature 6. Before implementation, assess a documented nonrectangular
  block against a real site, independently calculated area, frontage, home fit,
  infrastructure conflicts and approval review. Current rectangular protections stay.

## Housing mix — Feature 7 — 29 October 2026

- Reuse PlanningParameters and the draft/apply/history path; optional housing holds
  a named template library, default ID and exact base-rectangle assignments. Keep
  legacy homeWidth/homeDepth compatibility. No new dependency or provider integration.
- Applying a mix holds the current lot partition. This avoids assigning templates
  by unstable array indices or silently redistributing them during frontage search.
  A generated-lot preview requires explicit clearing of lot-specific assignments;
  the reusable library survives. Direct rectangular lot changes reconcile exact
  identities and common-source templates; mixed-source replacements use the default
  with an explicit result shown before Apply.
- One storey, one home per occupied lot. Built area and construction sum assigned
  templates. Selling price and construction rate stay shared and provisional.
  Template-specific pricing, housing optimization and multi-storey/multi-home lots
  require a later decision, rather than fabricated inputs.
- Validate current placed footprints and polygon rings with assigned dimensions.
  Oversized assignments never remove the lot or silently restore a vacant home.
  In-use/default templates cannot be deleted. Clear layout removes assignments,
  preserves the library and remains undoable; setup supports library repair.
- Mixed plans use project v9, record v10, snapshot v8 and housing-mix capability.
  Strict version/reference validation prevents old envelopes ignoring the mix.
  The server uses the same measured schedule/costs. Real-model and human/engineering
  validation gates remain open.

## Housing-mix planner feedback — 29 October 2026

All five review prompts are addressed without extending into another feature.

- Derive restoration diagnostics from accepted geometry and reserved template fit,
  including polygon containment/ring checks. Render them persistently beside Restore
  with direct recovery routes; keep the full validation before restoring any home.
- Replace the generated-lots status-only prerequisite with a direct, cancellable
  default-assignment review. Keep two history/approval steps: defaults first, then
  the generated partition. State the recovery consequences before approval.
- Assignment field presence is the source of provenance. Explicitly assigning a
  default template now stores that ID; release-to-default has its own action. No
  format change is needed: existing project v9 / record v10 / snapshot v8 already
  represent these references. Existing absent keys continue to mean inheritance.
- Preserve common explicit source assignments through subdivision even when the ID
  equals the default. Mixed-source template choices retain the existing reviewed
  fallback. No template is moved, deleted or restored implicitly.
- Add a mobile text key and selected-template readout; keep exact viewport/draft
  through drawing/review navigation. Add an inspectable deterministic explanation
  of shared price, construction and contingency, rather than claiming market evidence
  or implementing a new model adapter.

Evidence and human retest prompt: `evidence/housing-review-followup/`.

## Feature 8: named polygon open spaces

Use optional `planning.openSpaces` rather than replacing the legacy rectangle in
old project envelopes. Absence preserves old behavior; presence (including empty)
is the canonical collection. Project v10 / record v11 / snapshot v9 explicitly
advertise it, and downgrade checks reject hidden collections. No library or
provider dependency is needed for polygon area or straight corridor construction.

Orthogonal routing and whole-lot generation conservatively avoid each outline's
bounding extent plus clearance. True area alone enters green quantities and cost;
excess exclusion remains unallocated. This deliberately supports less capacity
than a polygon-aware routing/partition solver might find. Do not describe it as
optimal or as full arbitrary-polygon subdivision. Fixed Loop rejects a conflicting
ring. Manual lots and housing assignments stay held and conflicts block acceptance.

No overlaps or holes; up to twelve named spaces and twenty-four corners each.
Straight corridor creation makes a four-corner polygon; later edits are ordinary
outline edits without a guaranteed clear width or path connectivity. Individual
shape/location locks and minimum areas are separate from the combined green minimum.
All outlines are held during alternative search. No new real-model connection or
professional compliance claim is introduced.

## 29 October 2026 — feasibility experiments (owner Feature #9)

- The owner's requested title defines the authorized scope. Historical roadmap
  item 9 (Planning brief) remains unimplemented; feasibility was historical item 12.
- Store a complete optional costAssumptions object on the site frame, separate
  from geometry parameters. All existing evaluation paths read the same accepted
  inputs. Absence retains exact legacy defaults; explicit zero never falls back.
- A trial changes circulation/frontage/depth and/or costs against frozen accepted
  inputs. Native modal review prevents concurrent accepted-plan edits. One Apply
  records all reviewed changes and one Undo step; trial state itself is session-only.
- Hold manual partitions, polygon lot reshapes and explicitly assigned homes.
  Support their cost-only tests and route design work through existing editors.
- Show design effects at accepted costs followed by cost effects on the trial
  design. State that order and hold the shared selling-price assumption visibly.
- Projects v11, records v12 and snapshots v10 gate editable costs and reject
  disguised older formats. Include exact cost-input precision in scenario hashes;
  fractions below the geometry rounding precision can affect substantial money.
- Feature 8 independent testing remains deferred. Preserve its and the housing
  retest's tester prompts byte-for-byte. No later roadmap scope is implied.

## Saved alternatives — owner Feature 10

- Preserve the owner's requested title/numbering; this was historical roadmap
  item 13. Work through feasibility, including its tester prompt, was committed
  and pushed as e2dc09f before completing this increment.
- Store at most 20 independent PersistedState snapshots at project level, outside
  the active state and global plan history. Save working inputs or explicitly
  select a current unapplied search preview; never apply it as a side effect.
- Rename and annotate snapshot metadata explicitly. Working edits and note edits
  cannot overwrite the saved geometry. An edited version becomes a new scheme.
- Compare each side using its own saved assumptions, disclose combined effects
  and independently fitted drawings, and withhold unavailable finances.
- Reopening requires before/after review and explicit confirmation; preserve the
  previous working inputs through Undo/Redo and keep the collection unchanged.
- Project v12 and record v13 carry saved alternatives, including an empty array;
  older disguised envelopes refuse. Validate all snapshots before restoring any.
  The active-plan calculation snapshot does not contain the scheme collection.
- Browser save failures retain in-memory schemes and existing disk data with an
  export recovery route. Original media, active drafts and session history are
  outside saved snapshots. Feature 8 independent testing remains deferred.

## Feature 11 — 30 October 2026

The owner authorized a real assistant and then specified changeable primary/alternate routing with secrets to follow later. Use a narrow chat-completion tool adapter with server-owned, administrator-protected routing profiles. Keep keys outside projects and source control; rotation/removal and explicit connection tests require no rebuild. Do not silently switch to a second provider. Real access remains unverified until actual routing and secrets arrive.

Reuse feasibility experiments for AI proposals, measurement, drawing review and Apply/history. A model may propose supported inputs or select engine-composed facts, never supply financial truth or mutate work. Use exact snapshot bindings for the new receipts while preserving historical tool hashes. Send an allowlisted context of supported inputs and measured facts, excluding source notes/media/saved alternatives. Scripted fixtures are labeled as such and never count as real-model verification.

## Feature 12 — 30 October 2026

The owner authorized terrain, drainage and phasing with appropriate data/calculations, and asked to retain tester prompts for Features 11 and 12. Both prompts are saved; no independent reviewer was launched. No actual project elevation, storm or phase data was supplied. Use entered observations/assumptions and explicitly selected fictional examples rather than inventing site conditions.

A complete local-metre elevation grid supplies piecewise planar facets, clipped to the real boundary for slopes and exact split cut/fill to an optional whole-site platform. Drainage is a bounded Rational peak screening with declared catchment/storage applicability, separate gross rainfall volume and an optional entered outfall capacity. Phasing allocates accepted construction/contingency/shared budgets by stable occupied lots and shares, with month-end cash reconciled to accepted surplus. These studies do not automatically add budgets or establish design/financing suitability.

Valid observations persist even while coverage/applicability/assignments need review, but affected results remain unavailable. Changed sites/lots retain source data and obsolete references; remapping is explicit. Extend project/record/snapshot to 13/14/11 with downgrade guards, including studies inside saved schemes. Keep existing AI keys/routing deferred; only computed study facts and limits may enter its model context.

## Independent tester corrections — 30 October 2026

The owner authorized all four findings from the combined independent review. Keep its original report, failing checks and prompts unchanged; corrections have separate evidence in `evidence/combined-independent-review/run-2026-10-30-corrections/`.

- Bind snapshots to their supported JSON representation: omit undefined optional object fields and retain array positions as JSON nulls. Preserve exact numeric input precision, explicit nulls, selection binding and rejection of genuinely stale work. Fix the shared canonicalization rather than bypassing the AI response guard or requiring a reload.
- Accept decimal 0.01 m grid intervals with tolerance limited to coordinate subtraction roundoff. This is not a survey precision allowance; actual subminimum spacing, missing/duplicate cells and invalid numbers remain rejected.
- Interactive plan SVGs use named group semantics so their named focusable objects remain descendants. Preserve keyboard interaction and existing focus behavior. Automated accessibility results do not substitute for real-screen-reader or human acceptance.
- Comparison canvases reserve a separate strip for scale and camera readouts below the clipped drawing. Keep label sizes and geometry/camera calculations unchanged; no overlay can collide with the boundary dimensions. The working canvas retains its existing layout.

The connected fixture journey must complete AI proposal, deterministic measurement, drawing review and explicit Apply; a manual feasibility fallback cannot count as that pass. Real credentials, project data, physical devices and professional sign-off remain external gates. No new feature or publication was requested by this correction task.

## Angled streets and kerb fillets — 31 October 2026

The owner authorized non-orthogonal roads and rounded turning corners. Keep legacy rectangular networks numerically unchanged until explicitly edited. Advanced manual networks use one unioned pavement polygon (including holes) for drawing, quantities, road cost, drainage, containment, conflicts and frontage; axis-aligned road rectangles are only frontage-generation references. Close butt-strip bend notches with bounded miter joins before filleting, beveling extreme hairpins. Circular kerb fillets use the entered 0–50 m radius, tangent distances capped to 45% of adjacent edges, and at most 5 mm chord deviation. Report reduced effective radii. Preserve full-width entrance/dead-end caps.

Use pinned `polygon-clipping` at the root for robust union/holes rather than a new bespoke boolean engine. Project/record/snapshot envelopes become 14/15/12 for advanced road data, including alternative-only upgrade guards. Whole rectangular lots remain generated along axis-aligned legs; land beside angled legs stays unallocated. Review/Apply, held edits, history and all persistence paths remain. Kerb geometry does not establish turning/engineering compliance. No commit or push is authorized by this road request.

## Consolidated PRD v0.19 — 31 October 2026

At the owner's request, issue `docs/PRD_v0.19.md` as the current consolidated product specification. Retain earlier versions and their detailed feature contracts. Record the implemented Features 1–12, angled/rounded street extension, four resolved tester findings, current compatibility and verification, and outstanding real-model/data/device/human/professional gates. This documentation revision authorizes no additional application behavior. The application checkpoint `31a21f5` is pushed to GitHub main; include this new PRD and context update in a subsequent documentation commit.
