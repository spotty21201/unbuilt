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
