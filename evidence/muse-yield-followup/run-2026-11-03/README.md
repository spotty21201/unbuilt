# Muse yield-request repair — 3 November 2026

Request: “Can you maximize the yield, insert more roads and units. On edges put back to back lots.”

## Reproduced faults

- HTTP network origins have no `crypto.randomUUID`. Request setup threw outside error handling and left “Muse is thinking…” indefinitely. `before-192.168.68.110.png` records that failure. The request now uses `getRandomValues`, inside error handling.
- Selecting a street remounted Muse, cancelling the request and clearing its answer. Selection now preserves the request; geometry edits still invalidate it.
- The original yield search found no improvement in the 31-lot fixture after 14 trials. It treated bent roads as endpoint chords and could discard held-input candidates before ranking for the requested objective.
- Calculation workers had no deadline or startup-error handling. Both now return visible errors without altering accepted geometry. Busy feedback includes elapsed seconds. Geometry has a two-minute deadline; model requests keep their existing independent deadline.

## Changes

The yield search adds up to 64 connected, curved return-loop trials along actual straight portions of resolved streets. Spacing tests use sums of existing product depths plus the full corridor, including back-to-back row opportunities. New groups use existing products on both facing sides; all quantities and mandatory checks come from the planning engine. No product, mix, entrance, fixed space or lock is silently changed. Boundary edges do not substitute for serving-road frontage. A provisional return-curve radius is retained as an assumption when the project minimum is missing.

Held-input searches omit entrance/space changes before testing and rank all passing trials for the requested objective. Corridor prechecks discard demonstrably conflicting road proposals before rebuilding lots. Final validation still checks complete junction footprints, curves, dimensions, protection, access, mix and land reconciliation.

## Evidence and verification

- `browser-connected/results.json`: exact request through live Muse Wonder on the actual HTTP Tailscale origin, with `randomUUID` absent. Real geometry improves the fictitious fixture from **31 to 34 valid lots**, adding one road. Road length increases **190 → 282.13 m**. This is a yield/infrastructure trade-off, not an optimum. The test covers proposal retention during selection, preview/cancel/accept, undo/redo, save/reopen, explicit connection failure, worker launch failure and deadline, with no uncaught browser errors. Controlled responses are labelled separately from the live request.
- `domain-verified/domain-results.json`, `domain-verified/yield-search.json`: deterministic Muse action/constraint checks, including fixed entrance, original roads, boundary, spaces, products and mix preservation; land reconciliation; locked-network no-improvement and shorter-road results.
- `review-browser/results.json`: live qualitative assessment and shorter-road request; no automatic acceptance, successful cancellation and no credential in export/storage.
- `curved-browser/check.cjs`, `curved-browser/results.json`: controlled intent with the real geometry worker on the original fictitious curved-road fixture. Records progress, terminal result and preserved accepted state. The search may correctly find no supported improvement.
- `verification/`: passing production build, lint, 151 residential checks, 31 legacy AI checks, 17 scripted-provider service checks, 7 controlled network checks and the Muse domain checks. The original evidence directories were not overwritten.
- `source-manifest.json`, `changes.patch`: source identity and local changes. No commit, push or deployment.

Early live attempts are retained under `browser`, `browser-rerun` and `browser-final`; they exposed a separate runtime `ENETUNREACH` connection failure. The service was restarted in an active terminal session. Later attempts included both successes and another unreachable-connection error; the latest full live browser run passed. One bounded retry is now limited to unreachable-network/temporary-DNS connection errors, using the original deadline. HTTP errors, timeouts and connection resets are not retried. Provider reachability remains external; failed calls leave visible feedback and allow manual retry. No credential or provider response body is logged by the added transport diagnostics.

## Review locally

Refresh the running application at `http://100.117.187.86:5173` or `http://localhost:5173`. Ask the exact request, review the measured result, then choose **Preview on plan** and **Accept residential change** or **Cancel preview**.

Rebuild with `npm run build --prefix web`. Start the API with `node --experimental-strip-types --no-warnings server/intent.mjs --port 5174` and the UI with `npm run preview --prefix web -- --host 0.0.0.0 --port 5173` if they are not already running. Keep the API terminal active.

Run `npm run test:muse` with a fresh `UNBUILT_EVIDENCE_DIR`; its server test uses a scripted provider. `npm run test:ai` includes the controlled transport retry checks. `node tests/residential-muse-yield-browser.cjs` includes a live, billed Muse request and requires the trusted HTTP network origin. Use a fresh evidence directory for reruns.

The search is bounded and additive; it does not guarantee the largest possible yield or require every boundary strip to form back-to-back rows. It does not replace an entire locked network, invent products, approve vehicle movements or establish statutory compliance. Complex geometry may still reach the explicit calculation deadline. Project inputs already recorded as provisional or unknown stay visible.
