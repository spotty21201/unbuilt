# Handoff — Polygon lots (staged) + M3 browser findings in code

To: Tester (independent browser re-walk). No application code changed by this note.
From: Orchestrator/Coder. Base revision `d5e5ecf`, tree dirty by instruction (no commit).
Build asset: `web/dist/assets/index-C8qvZpCE.js` (serve `web/dist` on :5173).

## What changed and why

Capability A, staged: individual lots are reshapable as simple polygons with
true area/frontage math everywhere — quantities, validation, applicability,
preview/compare, export, history. Manual reshapes are locks: anything that
would regenerate the layout stays blocked with its reason until the user
explicitly discards them. Findings 1–6 from the M3 prompt are addressed in
code (list below). Entrance + open-space work underneath is unchanged.

## Files changed

- `src/polygon.ts` (new) — pure predicates: area, edges, simplicity,
  containment, boundary-touch vs true overlap, shared road boundary, 12-corner cap.
- `src/geometry.ts` — `LotEdits`, `placeFootprint` (single rule, canvas reuses it),
  `lotRoadFrontage`, `validateLotPoly` (+joint poly-vs-poly), quantities and
  `validateLayout` accept optional edits (no behavior change when absent).
- `src/search.ts` — `failingLots` uses true polygon area + road-shared frontage.
- `src/economics.ts` — `evaluateLayout` threads optional edits (defaults empty).
- `tests/polygon.mjs` (new, 47 checks) + wired into `package.json` test — please audit the wiring.
- `web/src/App.tsx` — lot select/inspect/reshape/apply-cancel/discard, regen guards,
  photo retain + decode/size gate + explicit remove, export v2, field-level site
  errors, assumed-review badges, expandable plan + comparison, any-two compare.
- `web/src/unbuilt/PlanCanvas.tsx` — true polygon rendering, corner drag,
  double-click add/remove, fitTick, wide mode.
- `web/src/unbuilt/ui.ts` — edits Map/Record helpers. `web/src/App.css` — draft/
  invalid parcel styles, fieldset bounds, wide rail, expanded dock.
- `docs/DECISIONS.md` (D26–D27), `docs/ACCEPTANCE.md` (AC-33–AC-41).

## Verified here

- `npm test` — 196 PASS (10 suites), zero failure lines.
- `cd web && npm run build` — clean.
- Drag ⇄ type equivalence is structural (single draft state, snapped meters vs
  rounded centimeters — NOT exact-matched by design; typed keeps 2-decimal
  precision, pointer snaps to 1 m). Tester: confirm both paths validate identically.

## Browser acceptance tests requested

1. Upload PNG → confirm 140×110 → photo stays; Undo keeps photo + old dims.
2. `fake.png` (text bytes), wrong MIME, >10 MB file → inline error, prior photo kept.
3. Reshape lot 1 (drag corner + type coords + add/remove corner) → live area/edges,
   invalid states explain (cross home / road / neighbor); Apply commits one Undo step.
4. With reshapes: search/circulation/frontage/apply/open-space/entrance all blocked
   with the discard reason; Discard reopens them.
5. Export v2 before/after Undo: `state.plan` (roads, parcels, lotReshapes, entrance,
   open space + lock) matches the displayed accepted plan; events separate.
6. Compare: working vs option, option vs option; Fit both reframes; Expand comparison.
7. Custom site: field-level scope error at 100×100; assumed badges on entrance/open
   space; pricing disclaimer.
8. Expand plan keeps inspector + summary visible; 375 px has no page overflow.
9. Escape at every level (vertex drag, open draft, rail, object list) never loses
   committed work.

## Staged limits (communicated in UI + D27)

Simple polygons only (no holes/multipolygons), ≤12 corners, homes never
auto-relocate (edits must keep the placed footprint), north/south entrance edges
unsupported, photo is reference-only (no calibration), no saved schemes.
No model/human/M3 gate claimed.
