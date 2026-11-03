# Interactive master-planning loop — baseline + improvements

Date: 2026-10-26 · App: http://100.117.187.86:5173/ (live) · Base commit b6c660f,
working tree uncommitted (no commit made in this task).
Method: Playwright Chromium (agent browser testing — NOT human Computer Use),
viewport 1440x900, Cedar Market restored sample as disposable state.
Suites: npm test 808 PASS; web production build clean.

## Baseline (Cedar: 120x100 m, west entrance, Spine, 20 homes, Green 480 m2)
Initial: Green 480 m2 · Road 720 m2 · Allowance Rp3.56bn · Shortfall Rp6.44bn (owner Rp10bn).

| # | Scenario | Result | Evidence |
|---|---|---|---|
| A1 | Entrance along west edge 50->30 m | PASS: layout regenerated 24 homes, road constant 720 m2 (Spine junction slides), allowance Rp5.09bn; Undo exact | walkthrough |
| A2/S2 | Entrance to East edge | PASS: connected layout 15 homes, Road 585 m2, Allowance Rp1.76bn, "Geometry valid"; Undo exact | acc-s2-east.png |
| A3 | Entrance 95 m (near NE area) | PASS w/ limitation shown: valid layout 8 homes, negative allowance Rp-1.02bn preserved; UI states "mid-edge/apron (Spine); fixed Loop does not support these gates" | walkthrough |
| B1 | Roads via Circulation: Spine->Loop preset | PASS: 15 homes, Road 2,076 m2, Allowance Rp0.51bn; Undo exact | walkthrough |
| B2 | Direct road drag on canvas | NOT SUPPORTED (capability gap, by design): roads are computed from entrance+topology+streets; StreetEditor handles manual networks separately | code + UI copy |
| C1 | Lots regenerate on entrance/road change | PASS (A1/B1/S2/S6) | walkthrough |
| S5 | Locked open space preserved across regen | PASS at engine level (snapshot/search suites); browser partial (green stayed fixed in B1) | suites |
| S6 | Remove 1 home -> regenerate | PASS: confirm dialog explains vacancy; 19 homes/Rp3.18bn; after frontage regen 17 parcels/15 footprints — vacancy + overlapping lot stayed vacant | accept5 run |
| S7 | Residual land classification | PASS: panel renders; Inaccessible 3,240 m2 + Reserved clearance 3,560 m2 = 6,800 m2 = Quantities remainder exactly | acc-s7-residual.png |
| D1/S8 | Rapid frontage changes 8,14,9,16,11 | PASS: last input wins (11 m, 17 homes); trailing scripted Undo not separately proven (timeout in harness) | walkthrough |
| S4 | Unsupported config explained | PASS: Loop+boundary gate limitation text; invalid keeps last valid plan | walkthrough |
| S9 | Save/reload restores accepted plan | PASS | walkthrough |

## Implemented in this task
- src/residual.ts: classifies the connected remainder (site minus parcels,
  pavement, designed green) as Potentially developable / Too small /
  Inaccessible / Reserved — open-space clearance, rules-based only.
  Wired into Quantities as "Residual land"; sums reconcile to the
  remainder by construction. Manual street networks report
  "Not yet evaluated".
- tests/residual.mjs: 16 checks (suites 792 -> 808).

## Limits (honest)
- Entrance: mid-edge/apron for Spine; Loop supports corner gates only (explained in UI).
- Roads: no direct canvas drag (generated topologies + street editor); width from profile/streets.
- Residual: component-level, not subdivided into hypothetical lots; manual networks unevaluated.
- Rotated polygon lots: engine tested (src/rotated.ts) but workbench parcel channel is Rect-typed; wiring needs an envelope-versioned contract (separate task).
- Real model round trip unverified (tool server mock, modelConfigured:false). M2/M3/human gates NOT claimed.
