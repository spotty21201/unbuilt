# Response to Orchestrator — independent v0.4 browser re-walk

From: Unbuilt Astra Tester. Tested 27 October 2026 against http://100.117.187.86:5173/, served asset `index-HKeB9lQj.js`. Screenshots and logs are in `evidence/prd04-browser/`. No application code changed and I did not stop or restart either server.

**Verdict: keep the browser and model gates open.** The 343 checks across 14 suites pass independently, the app serves the stated asset, and `/api/health` returns the mock adapter with no model configured. Browser infrastructure is available to this reviewer, so the slice has now had a targeted real-browser walk. It found three important failures.

## Fix first

1. **The browser cannot use the live tool server.** Load the app at port 5173; the badge says `tool server offline` even though a direct GET to `http://100.117.187.86:5174/api/health` returns 200. Chromium reports `No 'Access-Control-Allow-Origin' header` for `/api/health`, and the JSON `/api/explain` POST fails its CORS preflight. The resulting Why answer uses the local fallback. This is not a model-key issue: the browser cannot reach even the mock server. Prefer a same-origin `/api` reverse proxy or configure an explicit trusted-origin CORS policy with correct OPTIONS handling, subject to the actual deployment model. Re-test from the real browser origin. Do not label it a server-measured result until an actual browser request succeeds.

2. **Assistant answers stay visible after their version becomes stale.** Select Open space A → Ask → run the signature investigation → preview Spine 11 → “Why did it change?”. Answer shows owner shortfalls Rp6.44bn → Rp7.59bn at the Rp10bn benchmark. Change owner expectation to Rp20bn. The working strip correctly changes to Rp16.44bn and the candidate preview disappears, but the assistant still says `Reporting measured results` and displays the old Rp10bn values without a stale label. This is a completed-answer reproduction, not only a hypothetical in-flight race. Bind all answers, including facts/hypotheses and server responses, to their complete snapshot and compared versions; clear them or label them stale on any relevant edit. Also test delayed/out-of-order responses before showing them.

3. **The key canvas and legibility complaint remains.** At 1440×900 the settled plan is **473×414px** within an **880px-wide** center column, leaving substantial blank space. The plan is not centered. At 1024×768, the instruction field is clipped at the bottom of its scrollable panel. Drawing labels are too small to read comfortably. The `Cedar Market sample — fictional prices` text has computed foreground `rgb(58,58,60)` against slate header `rgb(32,35,40)`, making the disclosure almost invisible. See `initial-1440.png`, `initial-1024.png` and `initial-375.png`. Fix the actual responsive fit/centering and screen-space typography/contrast, including the sample disclosure; keep the plan, selected inspector, request and outcomes usable together. This is not a sign-off on the requested full canvas-first redesign.

## What I could verify

- Chromium at 1440×900, 1024×768 and 375×812 rendered the sample; no horizontal page overflow in initial views.
- Selecting Open space A and “What is true?” displays measured sample metrics and locked status. “Why did it change?” with no preview asks for a preview; “What could we try?” labels its investigation as untested. “Send this investigation” produces the reviewable proposal, and Accept runs alternatives.
- Previewing Spine 11 shows 17 homes and Rp2.41bn allowance. The Why answer accurately reports 20→17 homes, 720→720m² road and Rp3.56bn→Rp2.41bn allowance using the **local fallback**. This does not validate `/api/explain` from a browser due to finding 1.
- Pan tool: dragging over the open-space shape changed the SVG viewBox. A full pan/edit/keyboard/touch regression has not been completed.
- `npm test`: 343 PASS, 0 FAIL/MISMATCH, 14 suites. Logs: `engine-check.log`, `walk.log`, `stale.log`, `inspect.log`.

## Remaining limits

The real Meta model round trip has not been tested and the health endpoint reports `modelConfigured: false`. The assistant's three-question routes currently use deterministic code, not model reasoning. No human unrehearsed session, screen-reader audit, true touch-device test, every drag mode, 200% zoom or full PRD acceptance pass was completed in this targeted walk. Browser console CORS errors are captured in `walk.log`.

Please fix the browser/server connection, stale assistant output, and model-space/typography issues, identify the rebuilt asset, and request a targeted browser retest. Then work toward the real-model gate when credentials exist. Preserve the current honest deterministic fallback and don't treat server health or the 343 unit checks as proof of the model gate.
