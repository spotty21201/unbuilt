# Merged pavement and rounded turning corners — 1 November 2026

The road drawing now merges road allocations and entrance aprons into one
continuous outline. **Circulation → Round road corners** opens a 4 m fillet draft
with actual geometry, lots, road area and costs. Review and **Apply streets** to
keep it, or Cancel to retain accepted work. This action is beside the circulation
metrics rather than buried among geometric parameters. The street editor also
supports an entered 0–50 m radius and its existing 4 m preset.

The current preview remains on port 5173, tools on 5174. Final tested production
asset: `/assets/index-Dq5UMVlU.js`. Baseline HEAD remains `b6c660f`; the extensive
inherited dirty tree, tester prompts, prior evidence and original handoff are
preserved. No staging, commit, push, deployment or outbound message was performed.

## Causes and correction

1. Legacy/generated layouts supplied rectangular road allocations, and the
   shared canvas drew and stroked every rectangle separately. Their internal
   edges looked like kerbs at turns and intersections. `mergedRoadSurface` unions
   the existing allocations/advanced surface and disjoint apron, retaining holes.
   PlanCanvas draws one path and memoizes it independently of camera changes.
   This drawing correction does not alter legacy quantities or saved inputs.
2. Generated loops, including old saved manual conversions, can have short
   redundant centreline tails where rectangular strips overlap. The fillet engine
   interpreted them as real dead ends and protected their end caps, leaving outer
   corners square. `roundedStreetNetwork` normalizes orthogonal tails contained
   within perpendicular junction pavement during explicit radius edits. It
   preserves real entrance/dead-end mouths and shares the existing measured
   pavement calculation. Direct action, typed radius and preset all use it.
3. The existing rounding control was hard to discover from generated circulation.
   The new direct action opens the existing Apply/Cancel/history workflow. Its
   note states the 4 m assumption and that Apply keeps a manual street network
   during subsequent search. It does not automatically change old projects.
4. The initial merged-path label lacked valid accessibility semantics. A broad
   accessibility regression caught it; the final leaf path uses a named image
   role inside the existing interactive canvas group. Existing inspector controls
   provide keyboard selection. No interactive canvas descendants were hidden.

Fillets are actual pavement, not cosmetic SVG rounding. Validation, quantities,
costs, drainage and residual assessment continue using the same measured curved
surface after Apply. A fillet entering protected green or held lots refuses
rather than silently moving/removing protected work. Requested radii still have
the existing short-edge limits and at most 5 mm chord approximation; effective
radius reductions remain visible. No new dependencies, polygon-parcel contract,
financial formula, generated-layout default or saved envelope was introduced.

## Verification

- **846 root calculation/service checks PASS**, including **27 road-surface
  checks** (7 added). `root-tests-release.log`, `road-tests-final.log`.
- **Production build and lint PASS**. `build-complete.log`, `lint-complete.log`.
  The existing bundle-size advisory remains; no type/build/lint errors.
- **32 targeted browser checks PASS** against the final asset.
  `final-matrix/merged-road-corners-browser/merged-road-corners-browser.log`,
  `final-matrix/merged-road-corners-browser/results.json`.
- **Complete browser matrix: 41/41 suites PASS**, including native 200% zoom.
  `final-matrix/results.json`, `final-matrix.log`. The 32 targeted checks
  are included in this matrix, not independent additional coverage.
- **Targeted accessibility:** no detected violations in canvas and corner
  controls. `final-matrix/merged-road-corners-browser/axe.json`. Desktop, 1024 and 375 px layouts fit
  without horizontal page overflow; actual screenshots were inspected, including native 200% angled drawing.
- **Preservation: all 4,755 files outside the correction and all 999 files in
  the earlier review manifest remain unchanged.** See `verification.json`.
  `before/`, `status-before.txt` and `changes.patch` distinguish this correction
  from the inherited dirty work.

The targeted journey proves generated bend and loop treatment, old manual-loop
normalization through direct action and typed radius, exact Cancel and one-step
Undo/Redo, Save/reload, guarded project v14/record v15 export, true loop holes,
sloping entrance-apron joins, held financial assumptions and blocked park
conflicts. An unchanged legacy bend still measures **792 m²** after merging;
reviewed rounded pavement measures **810 m²**. Its 15 homes and locked 1,200 m²
green remain unchanged. The loop's square union is **2,076 m²**; after rounding it
is **2,082.9076120756345 m²**, agreeing with the independently derived fillet
area within the existing chord tolerance. All four outside loop corners become
curved, the inner hole stays open and the entrance mouth remains 6 m wide.

Existing browser assertions that counted separate rectangles/apron polygons now
assert the single merged pavement and retained scope/quantities. Their previous
sources are preserved in `before/`. Earlier diagnostic directories remain for
traceability; use `final-matrix/` for final browser evidence.
Two earlier broad runs ended with signal termination before their last
sequential suites; their partial logs are not counted as complete matrix passes.
The final runner is detached from the invoking command and writes its full
results on completion. Both subsequent complete 41-suite runs passed; the final
one also includes the additional guard for genuine short L-shaped dead ends.

## Reproduce

With dependencies installed and production preview/tools running:

```sh
npm test
npm run build --prefix web
npm run lint --prefix web
PLAYWRIGHT_MODULE=/home/spotty/projects/studioos/node_modules/playwright UNBUILT_EVIDENCE_DIR=/tmp/unbuilt-road-corners node --experimental-strip-types --no-warnings tests/merged-road-corners-browser.cjs
UNBUILT_EVIDENCE_DIR=/tmp/unbuilt-road-matrix python3 evidence/combined-independent-review/run-2026-10-30-corrections/run-browser-matrix.py
```

Use fresh evidence directories. The full matrix may need a detached invocation
where a command runner imposes a two-minute lifetime. Browser checks use disposable
profiles, the existing Playwright/axe-core installation and native-zoom scripts
through Xvfb; never the owner's browser data.

## Remaining limits

Saved plans acquire fillets only through the reviewed radius action; merging
alone preserves their accepted geometry and calculations. Applying uses the
existing manual-network contract. A protected-space conflict requires a reviewed
reroute or smaller radius rather than an invented successful layout.

Kerb curves do not establish vehicle swept-path clearance, turning compliance,
traffic or engineering suitability. Real-model routing remains unconfigured;
physical-device, real-screen-reader and human/professional acceptance remain
open. The separately gated rotated-parcel workbench migration remains untouched.
