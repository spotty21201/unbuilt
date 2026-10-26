# UNBUILT — Acceptance matrix

Status values: Passed / Failed / Blocked / Not run. Evidence required for Passed.

| ID | Pri | Status | Evidence / blocker |
|----|-----|--------|--------------------|
| AC-01 | P0 | Not run | Sample view not built yet |
| AC-02 | P1 | Not run | Upload not built yet |
| AC-03 | P1 | Not run | Calibration not built yet |
| AC-04 | P1 | Not run | — |
| AC-05 | P0 | Passed | npm test geometry suite: containment/overlap/access/reconciliation validators green |
| AC-06 | P0 | Passed | spine N=20 / loop N=16 equal modeled valid footprints; footprint-fit validator green |
| AC-07 | P0 | Passed | road/home/green costs derived from measured geometry; allowances declared in src/economics.ts |
| AC-08 | P0 | Passed | road-saving fixture: 1356 m2 delta x Rp0.8m reconciles exactly; intersections unioned once |
| AC-09 | P0 | Passed | green-lock check: shape+location within 1 mm; moved copy fails |
| AC-10 | P0 | Not run | — |
| AC-11 | P0 | Passed | spine vs loop: distinct road areas (720 vs 2076) and counts; both validate |
| AC-12 | P0 | Not run | — |
| AC-13 | P0 | Passed | golden arithmetic + negative/zero-home/bad-denominator fixtures green |
| AC-14 | P0 | Passed | L-change leaves allowance unchanged (fixture green) |
| AC-15 | P0 | Passed | t-change leaves revenue/cost unchanged (fixture green) |
| AC-16 | P0 | Blocked | No app API credentials configured; CLI auth is not app proof |
| AC-17 | P0 | Not run | — |
| AC-18 | P0 | Not run | — |
| AC-19 | P0 | Not run | — |
| AC-20 | P0 | Not run | — |
| AC-21 | P0 | Not run | — |
| AC-22 | P0 | Not run | — |
| AC-23 | P0 | Not run | — |
| AC-24 | P1 | Not run | — |
| AC-25 | P1 | Not run | — |
| AC-26 | P1 | Not run | — |
| AC-27 | P1 | Not run | — |
| AC-28 | P0 | Not run | — |
| AC-29 | P0 | Not run | — |
| AC-30 | P0 | Not run | — |
| AC-31 | P1 | Not run | — |
| AC-32 | P0 | Not run | Model error path pending |

Tolerances: area reconcile <= 0.01 m2; arithmetic <= Rp1; coordinate tolerance 1 mm.
