# Bounded-search tester verification report

- Task ID: T10b
- Role: Tester (independent bounded-search slice verification)
- Date (UTC): 2026-10-26
- Project: UNBUILT, workspace `/home/spotty/projects/unbuilt`

## Files read

Required by task:

- `src/search.ts`
- `src/schema.ts`
- `tests/search.mjs`

Additional read-only context for verification:

- `src/geometry.ts` (frontage-parameterized generators, footprint validator)
- `src/economics.ts` (lock overrides plumbing)
- `package.json` (`npm test` now chains `run.mjs` + `geometry.mjs` + `search.mjs`)

## Verification commands and results

### 1. `npm test` (read-only)

```sh
npm test
```

Result: exit 0, all green — 19/19 finance (`ALL FIXTURES PASS`),
17/17 geometry (`ALL GEOMETRY FIXTURES PASS`), 22/22 search
(`ALL SEARCH FIXTURES PASS`), 58 checks total. Search highlights:
`tested-8`, `valid-6`, `spine10-n=20` + applicable, tight-ceiling
no-result with blockers, `compact-qualified-2` =
`spine-f10,spine-f11`, selection max-3/distinct/ordered/reasoned,
tiny-grid yields 1, budget-3 truncates honestly.

### 2. Independent hand recomputation (no `src/` import)

Claim: compact profile (140–220 m², frontage ≥ 7 m) admits only
spine-f10 and spine-f11, i.e. `compact-qualified-2`.

- Spine lots are frontage × 20 m: f9 = 180 (in range), f10 = 200
  (in range), f11 = 220 (boundary, code uses strict
  `< min` / `> max`, so admitted), f12 = 240 > 220 → every
  spine-f12 lot fails area → combo disqualified. All have
  min(w,h) = frontage ≥ 7, so frontage never vetoes.
- Loop side lots are fixed 20×14 = 280 m² > 220 → every loop
  combo carries failing lots regardless of row frontage →
  all four loop combos disqualified under compact.
- f9 combos are geometrically invalid anyway (footprint: lot
  fw = 9−2·2 = 5 < 6 with fd = 14, so the 10×6 m house fits
  in neither orientation; f10+ fit rotated: fw ≥ 6, fd = 14 ≥ 10).
- Net: only spine-f10, spine-f11 qualify → 2. Matches fixture.

Pure-arithmetic re-run confirmed:

```text
spine-f9: area=180 compact=true
spine-f10: area=200 compact=true
spine-f11: area=220 compact=true
spine-f12: area=240 compact=false
loop-side 20x14: area=280 compact=false
frontage 9: fw=5 fd=14 fits=false
frontage 10: fw=6 fd=14 fits=true
```

Base-profile cross-check from the determinism run: qualified = 6
(`spine-f10,f11,f12,loop-f10,f11,f12`) — every geometrically valid
combo, since base (180–300 m², frontage ≥ 9) admits 180–280 m² lots.

### 3. New tester counterfactuals (read-only run)

```sh
node --experimental-strip-types --no-warnings tests/search-tester.mjs
```

Result: exit 0, 10/10 PASS (`ALL SEARCH-TESTER COUNTERFACTUALS PASS`).

- Green lock moved +5 m east: 8 tested, 0 qualified, 0 candidates,
  blocker reports `Green lock broken: 8` — lock veto works even
  though geometry/price/profile are otherwise fine.
- Ceiling Rp100m far below Rp850m selected price: 0 qualified,
  blocker reports `Price above Rp100m ceiling: 8` — honest
  no-result, nothing hidden.
- Determinism: identical request twice → same snapshotHash
  (`8693702d`), same qualified count and candidate id order.

Note: `tests/search-tester.mjs` is intentionally not wired into
`package.json`'s `test` script (Tester-owned, run directly above);
wiring it in would mean editing `package.json`, which was out of scope.

## Reproducible failures

None. `npm test` exit 0; hand recomputation matches exactly;
new counterfactual file passes 10/10.

## Open issues

- `runSearch` veto counters (`geometryVetoes`, `greenVetoes`,
  `priceVetoes`, `profileVetoes`) count per tested combo, so one
  combo can increment several counters; the no-result blocker reads
  correctly as veto counts, not as distinct-combo counts — fine,
  but worth keeping in mind when blockers cite overlapping causes.
- Search grid is family × frontage only (roads/parcels otherwise
  fixed by the generator); blockers already state results cover
  "only the tested ranges, not all conceivable designs."
- Git tree still uncommitted (no commit per instructions).
- Files added this turn (only these two): `tests/search-tester.mjs`,
  `evidence/search-tester-report.md`. Nothing else edited.
