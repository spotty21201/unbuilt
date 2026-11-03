# UNBUILT — Handoff prompt for the next advisor/agent

Copy everything below the line into the next advisor's session. It is
self-contained: mission, hard rules, what is already done and verified,
what is unfinished, and exactly how to verify your own work.

---

You are working on **UNBUILT** ("Find the future that works") in the repo at
`/home/spotty/projects/unbuilt`. It is a working canvas-first residential
master-planning prototype: bring a site → explore futures → understand what
each requires. The signature interaction is: select an open/green space →
"keep this, cap the price" → explicit proposal → bounded deterministic
investigation → changed plan, quantities, economics, remaining conflict.

## Ground rules (do not violate)

1. **Deterministic engine is the source of truth.** Geometry and finance come
   only from the TypeScript engine (`src/`). An LLM may propose/hypothesize
   through validated, version-bound tools, but never invent geometry,
   counts, savings, or results. A fabricated successful layout is forbidden;
   an honest no-result is a valid outcome.
2. **Preserve safeguards:** locked open space keeps shape AND location; no
   silent change to selling price, buyer ceiling, owner expectation, target
   return, or product profile; preserve negative land allowance and
   undefined ratios (never coerce to 0); show fewer than 3 alternatives when
   fewer qualify; fictional sample data stays visibly labeled.
3. **Preserve existing work.** The git tree is DIRTY with uncommitted work
   across several slices (see State). Never overwrite, revert, or "clean up"
   changes you did not make. Never delete untracked files you did not create.
4. **No commit, push, publish, deploy, or contacting anyone unless the user
   explicitly asks in that session.** Leave work uncommitted for review.
5. **Gates:** M2 is the main product gate. Never claim M2/M3, real-model, or
   human-validation gates without separate evidence for each. A mock server,
   passing unit suite, or Playwright run is NOT a real model round trip and
   NOT human Computer Use — label evidence honestly (PASS / PARTIAL / FAIL /
   NOT TESTED, bug vs capability gap).
6. **Ponytail mode:** smallest complete change; testable TypeScript
   geometry/finance modules; React+TS/SVG; runtime validation;
   IndexedDB/JSON persistence is enough; no Rust unless a measured
   bottleneck; credentials server-side only.
7. **UI readability overrides the Stitch prototype:** primary text 16px,
   secondary ≥14px, touch targets 44px, visible focus/scrollbars. Do not
   copy fake Stitch data/capabilities (no zoning, solar, FAR, EPSG, DXF/IFC,
   "142 homes" claims).
8. Verify before claiming: run `npm test` and `cd web && npm run build`
   after any engine/web change; fix type errors in files you touched to
   zero. Check `git status` after installs/generators for collateral edits.

## State at handoff (verify, don't trust blindly)

- HEAD: `b6c660f` ("Issue consolidated product requirements v0.19").
  Working tree uncommitted (planner-insights, rotated-lot engine,
  residual-land slices + earlier Cedar clarity work). Confirm with
  `git status --short` and `git log --oneline -3`.
- Live app (Nabire, Tailscale): `http://100.117.187.86:5173/` — tool server
  `:5174` (`GET /api/health` reports mock adapter, `modelConfigured:false`;
  AI is UNCONFIGURED — no real model round trip has ever been proven).
- Test suite: **808 PASS** (`npm test`); web production build clean.
- Latest PRD: [docs/PRD_v0.19.md](docs/PRD_v0.19.md). Also read
  [docs/PRD_v0.4.md](docs/PRD_v0.4.md), [docs/DESIGN.md](docs/DESIGN.md),
  [docs/DECISIONS.md](docs/DECISIONS.md), [docs/ACCEPTANCE.md](docs/ACCEPTANCE.md),
  [docs/WORK-CONTEXT.md](docs/WORK-CONTEXT.md) and
  [evidence/masterplan-loop/REPORT.md](/home/spotty/projects/unbuilt/evidence/masterplan-loop/REPORT.md).

## What is done and verified (latest slices)

**Interactive master-planning loop** (Playwright Chromium, 1440×900,
disposable restored Cedar state; Cedar baseline: 120×100 m, west entrance,
Spine, 20 homes, Green 480 m², Road 720 m², Allowance Rp3.56bn at Rp10bn
owner expectation):

- Entrance along edge (50→30 m): layout regenerated 24 homes, road constant
  720 m², allowance Rp5.09bn; **Undo restored initial state exactly**.
- Entrance → East edge: connected valid layout, 15 homes, Road 585 m²,
  Rp1.76bn, "Geometry valid"; Undo exact.
- Entrance 95 m near corner: valid 8 homes, negative allowance Rp−1.02bn
  preserved; UI states the limitation (mid-edge/apron for Spine; fixed Loop
  does not support these gates).
- Circulation Spine→Loop preset: 15 homes, Road 2,076 m², Rp0.51bn; Undo exact.
- Remove 1 home → confirm dialog explains vacancy → regenerate (frontage):
  17 parcels / 15 footprints — the vacant reservation and an overlapping
  generated lot stayed vacant.
- Rapid frontage edits (8,14,9,16,11): last input wins (11 m, 17 homes).
- Save/reload restores the accepted plan; unsupported configs are explained,
  invalid drafts never silently commit.

**Implemented code (engine, all deterministic):**

| Module | What it does |
|---|---|
| [src/residual.ts](/home/spotty/projects/unbuilt/src/residual.ts) | Classifies connected remainder (site − parcels − pavement − green, via `polygon-clipping`): `developable` (≥ profile min lot area AND adjoins pavement), `too-small`, `inaccessible`, `reserved-clearance`. Component-level only — never subdivides into hypothetical lots. Wired into Quantities as "Residual land"; totals reconcile to the Quantities remainder (verified in browser: 3,240 + 3,560 = 6,800 m²). Manual street networks show "Not yet
...[truncated 3885 chars]