# Half-width fillets and smooth road meetings — 1 November 2026

The rounding action now starts at **half the road width**: 6 m → 3 m, 8 m → 4 m,
10 m → 5 m and 12 m → 6 m. Mixed-width networks use half the narrowest street
as their conservative starting radius; a custom numeric radius remains editable.
Use **Circulation → Round road corners**, review the drawing/lot/cost changes,
then **Apply streets**. Saved inputs are not silently committed by the preview.

The picture-like regression has a lower boundary entrance, two stepped turns and
locked green to their left. It now has full 3 m kerb fillets on both turns, with
no hard intermediate steps, while the green remains at its exact original shape
and position. The proposed route moves far enough away from the kept space to
fit the inside curves rather than cutting through it.

Actual UI captures:

- `illustration/smooth-turns-detail.png` — close-up captured directly from the
  served app, not an edited reference image.
- `illustration/green-corner-before.png`, `illustration/green-corner-smooth.png` —
  full before/after workbench views.
- `illustration/tight-step-smooth.png` — closely spaced turns share their edge
  tangentially and report their smaller physically achievable radius.

Production asset: `/assets/index-CWlgXymI.js`, preview on 5173. The local
calculation service on 5174 was refreshed with its original environment and
public configuration unchanged. Its live short-turn result agrees exactly with
the current engine's candidates, including the measured **396 m²** road area.
See `service-refresh.json` and `service-agreement.json`; no credentials were
printed or saved in this evidence.

## Causes and changes

- The previous preset always requested 4 m. The direct action and editor preset
  now calculate half the actual narrowest width, storing the existing numeric
  `cornerRadius` field. Preset use is explicit; changing widths does not silently
  overwrite a custom radius. There is no new persisted mode or data envelope.
- The old fitting rule limited every corner to 45% of each adjacent edge,
  including edges whose other end had no curve. It unnecessarily shortened
  usable fillets and left an unused straight run between tight neighbouring
  curves. Each corner now starts with its requested tangent length; neighbouring
  curves share each edge's full available length in proportion to their needs.
  They meet tangentially when space is tight. A protected terminal cap consumes
  no rounding budget, so an otherwise fitting 3 m fillet is not reduced to 1.35 m.
- Short reverse turns cannot always fit two full half-width fillets without
  changing the route. In-place fitting reduces their radius truthfully and
  reports it: the 3 m stepped connector fixture uses tangent 1.5 m curves, with
  no leftover vertical jog. Real terminal caps retain their full road width.
- A generated Spine route can hug green so tightly that an inside fillet would
  occupy protected land. Its explicit half-width preview now tries the existing
  bounded router with additional corner room around the reserved extents. The
  temporary routing margin does not change entered clearance, green geometry,
  minimums or financial commitments. The original measured entrance apron is
  retained. A detour is used only if the resulting pavement passes street
  conflict checks; complete layout/held-work validation still gates Apply.
- Held manual street geometry is not rerouted by this helper. An unresolved
  conflict retains accepted work and its specific blocking reason. Existing
  Loop geometry is not silently replaced by generated Spine routing.
- The canvas and street preview use round stroke joins over the measured curved
  pavement. Actual curve coordinates, union/holes, quantities, road works,
  frontage, drainage and residual assessment still share the geometry engine;
  visual strokes do not substitute for measured fillets. Curves retain the
  existing maximum 5 mm chord deviation.

The before/after fixture retains **1,710 m²** of locked green and its exact
location, clearance, price, ceiling, owner expectation, target and profile.
Road area changes from **627 m² to 663 m²**, and whole generated homes from
**12 to 11**; those actual consequences appear before Apply. Undo restores the
original generated inputs exactly; Redo and Save/reload retain the rounded route.
This is a reviewed geometry change, not a cosmetic promise of unchanged yield.

Existing unrounded layouts retain their inputs and quantities until reviewed
rounding is applied. Already rounded short-edge cases use the corrected fitting
rule when remeasured; their saved numeric radius and input commitments remain
unchanged. Prior long-edge fillet fixtures and legacy-envelope guards pass.

## Verification

- Full calculation/service suite: **856 checks PASS**, including **37 road
  geometry checks** (10 new). `root-tests.log`, `road-tests.log`.
- Production build and lint: **PASS**. `build-final.log`, `lint.log`.
  The existing bundle-size advisory remains; no type/build/lint errors.
- Targeted half-width browser journey: **27 checks PASS** against the above
  asset. `browser/results.json`, `browser.log`; independently repeated for the
  illustration captures in `illustration/`.
- Full browser matrix before service refresh: **42/42 suites PASS**. `matrix/`.
  Final matrix with the refreshed service: **42/42 suites PASS**, including
  native zoom. `final-matrix/results.json`, `final-matrix.log`. The targeted journey is part of the matrix, not additive
  independent coverage.
- No detected accessibility violations in the targeted canvas and controls;
  no uncaught errors. Desktop, 1024 and 375 px screenshots inspected.
- Live service/local candidate equality: **PASS**, using a short half-width
  corner that distinguishes the corrected fitting rule. `service-agreement.json`.
- Preservation: **all 6,207 files outside this correction are unchanged**.
  `verification.json` records source hashes and final verification. `changes.patch` isolates this correction against `before/` copies.
  The inherited dirty work, all tester prompts, original handoff and previous
  reports remain preserved. No staging, commit, push or deployment was performed.

The added geometry checks cover all four standard widths, explicit mixed-width
behavior, full-radius use beside terminal caps, tangent meeting points, absence
of hard transitions away from real end caps, reversed input order, independently
measured area/cost reconciliation, safe detours beside kept green, refusal to
reroute held manual work, and exact sloping-apron preservation. Browser checks
cover review, Apply, exact Undo/Redo, Save/reopen, radius presets after custom
entry, tight-edge warnings, responsive layout and accessibility.

## Reproduce

With root/web dependencies installed and app/tools running on 5173/5174:

```sh
npm test
npm run build --prefix web
npm run lint --prefix web
PLAYWRIGHT_MODULE=/home/spotty/projects/studioos/node_modules/playwright UNBUILT_EVIDENCE_DIR=/tmp/unbuilt-half-width node --experimental-strip-types --no-warnings tests/half-width-fillets-browser.cjs
UNBUILT_EVIDENCE_DIR=/tmp/unbuilt-half-width-matrix python3 evidence/combined-independent-review/run-2026-10-30-corrections/run-browser-matrix.py
```

Use fresh output directories; the full matrix may need a detached runner where
command lifetimes are bounded. Tests use disposable browser profiles. Refresh the
local tool service after geometry changes so live calculations match the canvas;
retain its environment/configuration and verify its public health is unchanged.

These are kerb geometry and planning calculations. Vehicle swept paths,
engineering suitability, physical devices, real screen readers and human planner
acceptance remain unverified. Live model routing remains unconfigured, and the
separate rotated-parcel contract is untouched.
