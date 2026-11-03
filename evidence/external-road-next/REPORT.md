# Boundary → named external road: workflow correction

2 November 2026 (America/Los_Angeles). Local app: http://localhost:5173.
All browser tests use isolated fictitious projects; existing user storage was
not cleared. Work remains local and uncommitted.

## Actual gap

The named, width-controlled external-road drawing tool existed inside Residential
planning, but the ordinary project workflow still directed the planner from an
accepted boundary to **Generate layout**, which uses assumed access. The roadmap
row therefore overstated how connected the first two steps were. The inspected
baseline is in `before.png` and `before.txt`.

| Requirement | Inspected behavior | Correction | Evidence |
|---|---|---|---|
| Draw a named external road with width immediately after boundary | Main boundary-only inspector and canvas recommended legacy generation; entering the road required finding a separate planner; finishing the road collapsed its input section | Main inspector has **Next: external road → Draw external road** before other layout actions. The action opens the real residential planner and focuses the name field, with width visible. Canvas/footer/status describe that next step. A persistent **External road setup** shortcut also works on existing plans | `next-step.png`, new browser flow |
| Keep entered road geometry and dimensions inspectable | First drawn road caused its section to collapse | Road section stays open; named road, full width and access permission remain visible/editable; draw guidance says how to finish | `named-road.png`, exact saved record in `results.json` |
| Preserve user projects and continue later | Main legacy boundary-only view could send a returning planner to the beginning | Once the residential road is saved, main action reads **Continue residential planning** and reopens the accepted study. Existing generation remains available | Main lifecycle, reload and project regression checks |

The draw button now refuses missing/out-of-range width (supported 0.1–100 m),
blank names and an unlocked/missing boundary before beginning the gesture.
Naming is limited to the domain's 100-character maximum. Existing geometry,
entrance eligibility, calculations, formats and explicit version upgrades are
reused. No alternate geometry model was introduced.

## Verification

- New browser test: **20 checks passed**. Real blank project → draw/apply boundary
  → next road action → focused name and width → draw a 10 m road along the south
  edge → save/cancel/reload. Verifies the actual centreline is y = −5 m, supplied
  edge stays y = 0, boundary remains exact, substantial eligible frontage is
  southern, and no internal roads/lots are invented at the input stage.
- Project lifecycle regression: **55 passed**, including creation, naming,
  boundary/legacy generation, undo/redo, clear/delete, reopening, import/export,
  storage failures and responsive layouts.
- Coupled residential regression: **26 passed**, including geometry edits,
  alternatives and schedules. Evidence: `residential-regression/`.
- Automatic preparation regression: **20 passed**, including the end-treatment
  prompt, real road/entrance dragging, regenerated lots, cancellation and saving.
- TypeScript/Vite build and oxlint passed. Vite retains its existing large-chunk
  advisory. `git diff --check` passed.

Screenshots cover the main next step, actual named road, and road inputs at
1024 px and 375 px. Exact fixture inputs and saved geometry: `results.json`.

## Review

Refresh http://localhost:5173. In a blank named project, draw and apply the
boundary. Click **Draw external road** in the **Next: external road** card.
Enter the name and full width, click **Draw adjacent external road**, place points
along the site edge (including each corner it follows), and finish with Enter or
**Finish drawing**. Review and accept site inputs. Continue to the product table
and Prepare Layout using the existing connected workflow.

For an existing plan use **External road setup** in the top context bar. Older v1
residential studies retain their explicit reviewed upgrade requirement.

```sh
npm run build --prefix web
npm run lint --prefix web
node --experimental-strip-types --no-warnings tests/external-road-next-browser.cjs
PLAYWRIGHT_MODULE=/home/spotty/projects/studioos/node_modules/playwright UNBUILT_EVIDENCE_DIR=evidence/external-road-next/project-regression node --experimental-strip-types --no-warnings tests/projects-browser.cjs
UNBUILT_EVIDENCE_DIR=evidence/external-road-next/residential-regression node --experimental-strip-types --no-warnings tests/residential-browser.cjs
node --experimental-strip-types --no-warnings tests/prepare-layout-browser.cjs
```

Changed files for this correction: `web/src/App.tsx`,
`web/src/unbuilt/ResidentialPlanner.tsx`, `ResidentialSetup.tsx`, `PlanCanvas.tsx`,
`web/src/projects.css`, the new `tests/external-road-next-browser.cjs` and the
existing preparation browser test's section-opening helper. Other existing
workspace changes were preserved.

Verification targets this workflow and project/planner regressions. The complete
root geometry suite was not repeated for this interface-only correction;
geometry-engine inputs/calculations were not changed. Existing bounded-search
and engineering-review limits remain as documented in `docs/PREPARE-LAYOUT.md`.
