# M1 Tester verification report

- Task ID: T10
- Role: Tester (independent M1 spine/loop core verification)
- Date (UTC): 2026-10-26
- Project: UNBUILT, workspace `/home/spotty/projects/unbuilt`

## Base state

- `git status --short --branch`: `## No commits yet on master`, untracked: `UNBUILT_PRD_v0.2.md`, `docs/`, `evidence/`, `package.json`, `src/`, `tests/`, `tsconfig.json`.
- `git log --oneline -5`: `fatal: your current branch 'master' does not have any commits yet`.
- Confirms required base state: git repo, no commits yet.
- No commits made by Tester. No panes touched. No files edited except creating this report.

## Files read

Required by task:

- `docs/BUILD_PLAN.md`
- `docs/ACCEPTANCE.md`
- `src/geometry.ts`
- `src/economics.ts`
- `tests/geometry.mjs`

Additional read-only context for verification:

- `package.json` (test scripts)
- `tests/run.mjs` (finance fixtures, part of `npm test`)
- `tsconfig.json`
- Directory listings of `docs/`, `evidence/`, `src/`, `tests/` (pre-existing `evidence/M0-m1-slice.log`, `evidence/M1-core.log` left untouched)

## Verification commands and results

### 1. `npm test` (read-only)

Command:

```sh
npm test
```

Resolves to (`package.json`):

```sh
node --experimental-strip-types --no-warnings tests/run.mjs && node --experimental-strip-types --no-warnings tests/geometry.mjs
```

Result: exit 0, all green.

- `tests/run.mjs`: 19/19 PASS (`rev/surplus/margin/allow/gap @850`, `@780`, `reqPrice`, L-change allowance stable / gap moves, t-change revenue/surplus stable, negative allowance kept, zero-home margin/price null, invalid-denominator price null), `ALL FIXTURES PASS`.
- `tests/geometry.mjs`: 17/17 PASS (`union-overlap=175`, `spine-road=720`, `spine-green=480`, `spine-n=20`, `spine-parcels=4000`, `loop-road=2076`, `loop-n=16`, `distinct-road`, `spine-valid=0 errors`, `loop-valid=0 errors`, `lock-kept`, `lock-moved`, `overlap-caught`, `spine-roadcost=576000000`, `loop-roadcost=1660800000`, `road-saving=1084800000`, `spine-homes-cost=6000000000`), `ALL GEOMETRY FIXTURES PASS`.
- Combined: 36/36 checks green. No failures.

### 2. Independent hand calculation (Tester-owned, no `src/` import)

Loop road union, from rects in `generateLoop`:

- North arm 100x6 = 600; south arm 100x6 = 600; west arm 6x80 = 480; east arm 6x6... east arm 6x80 = 480; entrance connector 16x6 = 96.
- Naive sum = 600 + 600 + 480 + 480 + 96 = 2256.
- Pairwise overlaps, each 6x6 = 36: N/W corner, N/E corner, S/W corner, S/E corner, connector/W arm. No triple overlaps (corners at y 10-16 / 84-90, connector at y 47-53, all disjoint).
- Union = 2256 - 5*36 = 2256 - 180 = 2076. Matches `loop-road` fixture.
- Delta vs spine (720) = 1356 m2; saving = 1356 x Rp800,000 = Rp1,084,800,000. Matches `road-saving` fixture and AC-08.

Lot counts, from `subdivide` + green `{x:78,y:62,w:24,h:20}`:

- Spine: 2 rows x floor(120/10) = 24 naive. North row y 27-47 misses green y 62-82 (0 cut). South row y 53-73 overlaps green y 62-73; lots i=7..10 (x 70-80, 80-90, 90-100, 100-110) intersect green x 78-102 (min 2 m overlap each) = 4 cut. Kept = 24 - 4 = 20. Matches `spine-n`.
- Loop rows: floor(88/11) = 8 per row, 16 naive. Bottom row y 16-36 misses green (8 kept). Top row y 64-84 overlaps green y 64-82; lots x 16+i*11: i=5 (71-82, 4 m), i=6 (82-93), i=7 (93-104, 9 m) intersect green x 78-102 = 3 cut, 5 kept. Columns 4 naive: only (84,50,20,14) intersects green (x overlap 84-102 = 18 m, y overlap 62-64 = 2 m) = 1 cut, 3 kept. Total = 5 + 8 + 3 = 16. Matches `loop-n`.

Independent arithmetic re-run (pure arithmetic, no `src/` import):

```sh
node -e 'const naive=600+600+480+480+96; const union=naive-5*36; ...'
```

Output:

```text
naive=2256 union=2076 delta=1356 saving=1084800000
spine naive=24 kept=20
loop rows naive=16 top-kept=5 bottom-kept=8 cols-kept=3 total=16
```

All hand values reconcile with fixtures and `src/geometry.ts` / `src/economics.ts`.

## Reproducible failures

None. `npm test` exit 0; independent loop-union and lot-count hand calculations match exactly.

## Outstanding issues

- M1 scope per `docs/BUILD_PLAN.md`: second product profile + parameter ranges + candidate search budget still remaining (toward M2).
- `docs/ACCEPTANCE.md`: AC-16 remains Blocked (no app API credentials; CLI auth is not app proof). AC-01/02/03/04/10/12/17-32 mostly Not run (sample view, upload, calibration, model paths, journey, reliability pending).
- Tester did not add counterfactual/no-result fixtures in this turn (T10 allows them, but task constrained output to exactly this report file, so none were added).
- Git tree still uncommitted (no commit per instructions).
