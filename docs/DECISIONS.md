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
