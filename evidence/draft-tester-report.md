# Direct-manipulation tester verification report

- Task ID: T10c
- Role: Tester (independent direct-manipulation slice verification)
- Date (UTC): 2026-10-26
- Project: UNBUILT, workspace `/home/spotty/projects/unbuilt`

## Files read

Required by task:

- `src/draft.ts`
- `tests/draft.mjs`
- `web/src/unbuilt/PlanCanvas.tsx`
- `web/src/App.tsx` draft/undo/history logic (via regex search for
  `draftDirty|applyDraft|doUndo|doRedo|changeSpec`, then full read of
  lines 100–339: `applyDraftEdit`/`draftDirty` derivation, `snap`/
  `restore`, `applyCandidate`, `doUndo`/`doRedo`, `applyDraft`,
  `cancelDraft`, `changeSpec`, search gating on `draftDirty`)

## Verification commands and results

### 1. `npm test` (read-only)

```sh
npm test
```

Result: exit 0, all green — 19/19 finance, 17/17 geometry,
24/24 search (incl. 2 dedupe checks), 10/10 search-tester, 13/13
intent, 18/18 draft (`ALL DRAFT FIXTURES PASS`), 101 checks total.
Note: `package.json` now also chains `tests/search-tester.mjs` and
`tests/intent.mjs` (wired by another role since T10b; not edited
this turn). Draft highlights: empty/blank/non-numeric parse to
null while `"0"` stays 0, valid draft commits, outside-site draft
blocked with committed preserved, empty field keeps `draft.x = 78`,
undo pops `s1` with `future = ["current"]`, redo restores it, new
push clears redo.

### 2. Independent hand re-derivation (no `src/` import)

Rule: a draft outside the site cannot commit; the plan of record
is preserved.

Trace from `src/draft.ts` with `g0 = {x:78,y:62,w:24,h:20}`,
site 120×100, fields `{x:"200",y:"62",w:"24",h:"20"}`:

- All four fields parse (`200/62/24/20`), so no incomplete-input
  early return. `w,h > 0`, so no positive-size error.
- `x + w = 224 > 120 + 0.001` → "Grove must sit inside…" error →
  returns `{committed: g0, draft: {x:200,…}, draftable: false}`.
- `commitDraft` returns `{committed: null}` when `!draftable`,
  so the edit is held for display only and `committed` still
  equals `g0`. Matches `outside-*` fixtures.

Boundary corollaries re-derived the same way: `x + w = 120`
exactly is inside (`<= 120.001`, commits); `120.01` is outside
(blocks); `w = 0` and `x = -1` block via the size/origin guards.

Undo rule re-derived: `past = [s0,s1]` → `undo` pops `s1` (LIFO)
and pushes current onto `future`; `pushUndo` returns
`{past: [...past, snap], future: []}`, so any new push clears redo.

Pure-logic re-run (no `src/` import) confirmed every line:

```text
x=200 draft outside -> commit blocked: true
committed preserved: true
edge x+w=120 inside: true
edge x+w=120.01 outside: true
zero width blocked: true
undo pops s1: true redo holds current: true
push clears redo: true past: s0,s2
```

UI wiring spot-check (`App.tsx`): `applyDraft` no-ops with status
"Draft invalid" when `commitDraft` returns null, and the Apply
button is `disabled={!draft.draftable}`; search entry points
(`acceptProposal`, `rerun`), candidate preview/apply, and proposal
accept are all gated on `draftDirty`, so a dirty draft can neither
leak into search nor be silently overwritten. `PlanCanvas`
commit-on-pointer-up (`onUp` → `onDraftCommit`) routes through the
same `applyDraft` guard; Escape cancels. Displayed geometry follows
`draft.draft` but economics follow `draftEcon ?? committedEcon`,
so metrics never follow an invalid draft.

### 3. New tester counterfactuals (direct run, `package.json` untouched)

```sh
node --experimental-strip-types --no-warnings tests/draft-tester.mjs
```

Result: exit 0, 13/13 PASS
(`ALL DRAFT-TESTER COUNTERFACTUALS PASS`): edge-exact commits,
1 cm past the edge blocked with committed kept, zero-width and
negative-origin blocked with committed kept, empty-history
undo/redo return null with stacks untouched, 3-deep LIFO order
(`c` then `b`), new push clears deep redo and redo-then-null.

## Reproducible failures

None. `npm test` exit 0; hand re-derivation matches exactly;
new counterfactual file passes 13/13.

## Open issues

- `draftDirty` compares raw strings against `String(green.*)`, so a
  retyped-but-equal value (`"078"` vs `"78"`, `"78.0"` vs `"78"`)
  shows as dirty and blocks search until Apply/Cancel. Cosmetic and
  fail-safe (Apply commits the identical rect), but a normalizer
  would avoid confusing "dirty" badges.
- `History` is unbounded (no cap advertised despite the module
  comment saying "bounded undo/redo stack"); fine for session-scale
  use, worth a cap if snapshots grow.
- Canvas drag rounds to 0.1 m while typed fields accept full
  precision; both funnel through the same `applyDraftEdit`
  validation, so no correctness gap — noted for UX awareness only.
- Git tree still uncommitted (no commit per instructions).
- Files added this turn (only these two): `tests/draft-tester.mjs`,
  `evidence/draft-tester-report.md`. Nothing else edited.
