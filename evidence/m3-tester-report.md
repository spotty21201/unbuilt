# M3 slice tester verification report

- Task ID: T10e
- Role: Tester (independent M3 site/backdrop/compare/record verification)
- Date (UTC): 2026-10-26
- Project: UNBUILT, workspace `/home/spotty/projects/unbuilt`

## Files read

- `src/site.ts`, `tests/site.mjs` (full)
- `web/src/App.tsx`: `exportRecord` literal (111–138), `useSite` flow
  (362–383), `snap`/`restore` (337–356), site inspector + photo input
  (574–617), main canvas backdrop prop (850), stale def (213–222),
  `cards` def (500), compare block (1069–1127), record tab
  (1130–1149), decision logging (248–251, 359–360, 381, 409, 465)
- `src/geometry.ts` generators (101–144, re-read: now site-scaled) and
  `PlanCanvas.tsx` backdrop element (303–316) to complete traces

## Verification commands and results

### 1. `npm test` (read-only) — exit 0, 135 PASS, 0 failures

8 suites all green: run, geometry, search, search-tester, intent,
draft (incl. new history-cap checks), draft-tester, site (9/9:
`cedar-is-factory`, `maker-140x110`, big-spine/loop valid, five
size-rule checks).

### 2. New tester counterfactuals (direct run, `package.json` untouched)

```sh
node --experimental-strip-types --no-warnings tests/site-tester.mjs
```

Result: exit 0, 12/12 PASS: validator edges (119.9/99.9 reject,
120×100 and 500×500 accept, 500.1 rejects, NaN/negative/Infinity
reject), factory invariants (green positive + inside, entrance
west-edge centered ≤0.5 m) across a 120–500 sweep, and the pinned
scope rule below.

### Check-by-check findings

(1) Factory/validator expectations honestly derived — YES.
Hand re-derivation (pure arithmetic, no `src/` import) reproduces
both fixtures exactly: `makeSite(120,100)` → entrance y=round(46)=46,
green (78,62,24,20) = Cedar identity; `makeSite(140,110)` →
entrance y=round(51)=51, green (91,68,28,22). Sweep confirms green
always inside at accepted sizes. BUT the minimum's stated rationale
is stale: generators are now site-scaled (`generateLoop` ring and
bands derive from `site.w/h`, spine road from entrance height), and
probing shows 100×100 validates with 0 errors for frontages 10–12
in both families — so "cannot fit the loop circulation ring"
(`src/site.ts` 17–21) is no longer literally true; the 120×100 floor
is scope policy. See O1.

(2) `useSite` blocks invalid sizes, resets run state, undo available — YES.
`siteSizeErrors` guard returns before any mutation with a status
reason (362–369); `pushUndo` precedes all writes (370); run, runSnap,
preview, accepted summary, and last delta are cleared (376–380);
spec/green reset to factory fresh (372–375). Snapshot covers
`baseSpec` + `greenLocked` and restore replays everything including
the size inputs (337–356). Notes: decisions log is append-only
across site switches (log semantics, fine); the reference photo
persists behind a new site (O4); a dirty grove draft is replaced
without warning but remains recoverable via Undo.

(3) Backdrop image can never feed numbers — YES, traced exhaustively.
`refImage`/`showBackdrop` occur only at state (76–77), file-input
set/revoke (587–588), checkbox (594–597), and the canvas prop (850);
`PlanCanvas` renders it as a pointer-transparent illustration
(305–316), and both compare canvases receive `backdrop={null}`.
Every quantity descends from `baseSpec → makeSite → site →
buildWorking → deriveQuantities → evaluateLayout → runSearch`;
`baseSpec` is written only by validated `useSite` and undo-restore.
The file input mints an object URL only — no dimension, scale, or
EXIF extraction exists — and the file has no fetch/XHR/storage/env
reads. UI copy states reference-only twice (590, 612–615).

(4) Compare deltas come from run data — NUMBERS YES, WITH DEFECTS.
`b` comes from `cards ← selectUpToThree(run.candidates)` (500,
1082); shown values are stored `b.quantities`/`b.finance` beside
live `workingEcon`, labeled "working → option" (1113–1122) — no
recomputed guesses. DEFECTS: (a) the compare block (1069) sits
OUTSIDE the stale ternary (1002–1066), so stale-run options stay
comparable with no stale label, contradicting the "can no longer be
previewed" verdict; (b) the option mini-canvas regenerates
`bLayout` on the current draft-following `site` (1084), so after a
green change (stale) or with a dirty draft the drawing mismatches
the stored numbers. See O2.

(5) `exportRecord` contains no credentials/paths/env — PASS (literal audit).
The payload (114–130) holds only: app tag, ISO timestamp, `baseSpec`
copy, economics strings + profile id, working derived numbers (or
null), and `decisions` (`{t, kind, detail}` strings from four
call sites, all formatted numbers/ids — no free-text request, no
image, no blob URL, no file name). Single `Blob` in the file (131),
anchor download + revoke, button disabled with zero decisions
(1144). No other exfil path exists in the component.

## Reproducible failures

None. `npm test` exit 0; hand re-derivation matches exactly; new
counterfactual file passes 12/12.

## Open issues

- O1 (copy accuracy, validator + UI): minimum-size message claims the
  loop ring needs 120×100 (`src/site.ts` 17–21, `App.tsx` 612–615),
  but site-scaled generators validate below it. Reword as scope
  policy (pinned by `small-validates-geometrically` +
  `small-rejected-by-scope` in `tests/site-tester.mjs`).
- O2 (compare integrity, P1): gate the compare block on `!stale`
  (or label stale comparisons) and render `bLayout` from run-time
  geometry instead of regenerating on the current/draft site.
- O3 (staleness hole, P2): `runSnap`/`stale` (99–102, 213–222) never
  compare site dimensions. Reachable, though contrived, via
  undo-across-`useSite` with a surviving run and re-aligned
  green/spec/assumptions. Add `baseSpec` to both.
- O4 (stale illustration, P3): `useSite` keeps the old reference
  photo behind the new plan. Clear it or ask on site change.
- O5 (stale copy, P2): site inspector still hardcodes "120 × 100 m …
  Boundary editing is outside this increment" (`App.tsx` 658–673)
  despite M3 custom sites. Render from `baseSpec`; drop the
  boundary-editing line.
- O6 (record semantics, note): decisions survive undo and site
  switches by design (append-only log). Fine if intended; the
  record tab could say entries are never rewritten by Undo.

## Fixes observed since T10d (in sections read this turn)

Locks + `baseSpec` now in undo snapshots (142–144, 337–356);
assumption edits push undo on blur/Enter (`assumeField`, 386–405);
`lastDelta` cleared on undo/redo (422, 432); preview-bar Apply now
carries the `draftDirty` guard (865); `VerdictLine` suppresses the
empty-list clause (67); working-profile warnings display exists
(884–892, 1163–1172); Escape/gesture-cancel path added
(`cancelTick`, `onEscapeIdle`, 139–140, 852–856).

- Files added this turn (only these two): `tests/site-tester.mjs`,
  `evidence/m3-tester-report.md`. Nothing else edited. No commit.
