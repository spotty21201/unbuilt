# Handoff — PRD v0.4 slice + retest responses (27 Oct 2026, WIB)

## Redesign update (latest; asset `index-6-6nXSzb.js` live on :5173)

- Canvas-led shell rebuilt from a side-by-side screenshot comparison
  (plan: `evidence/ui-reference/LAYOUT-PLAN.md`): dark top bar + real-data
  context strip, 64px icon rail, dominant paper field with floating
  toolbar, dark 320px inspector (objects, contextual properties, assistant,
  composer), persistent outcomes strip with collapsible details.
- Verified by looking at `new-ui-1440/1024/375.png` against
  `target-stitch.png`: same structure and visual language, readable type,
  real data only, no prototype claims.
- 25/25 Playwright checks + 351 engine checks + true-geometry 200% zoom +
  zero console errors. Two real defects caught and fixed during
  verification: mobile toolbar covering tap targets, composer textarea
  flex-basis blowout.
- Request: independent visual review of the new screenshots vs the target,
  plus the standing retest scope. Human validation, model round trip, and
  milestone sign-off remain open. No commit made.

---

## Retest-response update (latest; asset `index-VGmP2eqq.js` live on :5173)

- Composer-first column: request textarea + Send fully in view at
  1440×900 (bottoms 730/727) and 1024×768 (546/598), no inner scroll.
- Screen-space labels: lot numbers render 22px at 1440, ≥13px at 1024 and
  375; contrasts 14.08 / 11.29 / 4.58; lots carry number+area titles.
- Mobile: mini-outcomes directly under the plan, collapsible controls,
  touch-tap selection verified, no overflow at 375.
- Verified by Playwright (24/24): keyboard Enter/V/H/Escape, two-plan
  comparison with real deltas (20→17 homes, Rp3.56bn→Rp2.41bn),
  delayed in-flight response discarded on input change, emulated 200%
  zoom without page overflow, zero console errors. Suite 351 green.
- New evidence in `evidence/prd04-independent-retest/`: `r2-initial-1440.png`,
  `r2-initial-1024.png`, `r2-initial-375.png`, `r2-compare.png`,
  `r2-zoom200.png` (emulated zoom), plus machine-inspected `r3-initial-*.png`,
  `r3-compare.png`, `r3-composer-375.png`, `r3-zoom200-real.png`, and
  `r3-pixel.json` with measured crops. True 200% zoom verified with exact
  zoom geometry (720×450 CSS px at dpr 2). Human aesthetic review of the
  composer and controls at all sizes still requested.
- Outstanding gates (unchanged): real model round trip, true 200% browser
  zoom (headless can only emulate), full touch-device test, human
  validation, milestone sign-off. No commit made.

---

## Response update (supersedes the v0.4 handoff below for the three failures)

- App: http://100.117.187.86:5173/ serving bundle `index-CCBUdKC_.js`
  (verified in the served HTML). HTTP 200.
- Tool server :5174 restarted with the restricted CORS policy (allowlisted
  origins, explicit preflight, unlisted 403). Log: `/tmp/unbuilt-server.log`.
- Engine: 351 checks green across 14 suites (`npm test`, exit 0).
- Playwright from the real browser origin: 14/14 green — server health +
  explain (spine-10 n=20, loop-10 n=17), server-measured Why in the panel,
  owner-20 edit clears the assistant to Ready with the preview gone, canvas
  617×540 centered, sample disclosure paper-on-slate, no horizontal overflow
  at 1440/1024/375, request field visible at 1024×768, zero console errors.
- New evidence in `evidence/prd04-browser/`: `fix-why-server.png`,
  `fix-stale-cleared.png`, `fix-initial-1024.png`, `fix-initial-375.png`.
  (Screenshots captured, not pixel-inspected here — please confirm visually.)
- Request: independent browser retest of the real server connection, stale
  answers, plan size, readability, contrast, 200% zoom, keyboard
  interaction, comparison, and mobile layout.
- Still open, not claimed: real model round trip, 200% zoom, full
  keyboard/touch regression, human validation, M2/M3 gates. No commit made.

---

To: independent tester. No application code changed by this note. Working
tree left uncommitted per instruction; pre-existing dirty files untouched.

## What was built

PRD v0.4 (self-contained successor, `docs/PRD_v0.4.md`) + adopted design
spec (`docs/DESIGN.md`), canvas-first workspace, and an assistant that
answers through validated deterministic tools. Safeguards preserved: engine
owns all numbers, locks hold, stale blocks, honest no-results, fictional
labeling, no silent assumption changes.

## Asset IDs and live state

- App: http://100.117.187.86:5173/ serving bundle `index-HKeB9lQj.js`
  (verified byte-identical to `web/dist`). HTTP 200.
- Tool server: http://100.117.187.86:5174/ (`/api/health` → mock adapter,
  model unconfigured). Started detached; survives session end. Log:
  `/tmp/unbuilt-server.log`.
- Engine: 343 checks green across 14 suites (`npm test`, exit 0), incl.
  23 snapshot + 24 assistant + 17 new server fixtures. Web build clean.

## Suggested browser walks (all unverified — no chromium here)

1. Layout: tool rail left (Select V / Pan H), canvas center, inspector
   right, slate top bar badge reads "tool server live".
2. Pan tool: every drag moves the view, clicks still select, geometry
   cannot change under it.
3. Inspector → "Ask about Open space A": What is true? (facts), Why did it
   change? with no preview (asks for one), preview a loop option then Why
   (server-measured deltas or labeled local fallback), What could we try?
   (hypothesis + Send this investigation).
4. Kill `:5174` and repeat Why: must label the local-engine fallback.

## Explicitly not claimed

Browser behavior at any viewport, the real model round trip (no key —
mock only), human unrehearsed validation, M2/M3/model gates. Screenshots:
none taken (no local browser runner). Decisions D31, acceptance AC-64–AC-70
record the split between Passed (engine/protocol) and Not run (browser).
