# AI administration

Open **AI settings** from the top bar or the planning assistant. Enter an administrator token, then Unlock settings. Configure primary and alternate connections, choose which one is active, Save routing settings, and Test active connection. Save does not send a model request; Test does. Switching requires Save and never happens automatically after a failure.

Use the full HTTPS chat-completion endpoint, the service's model identifier, and its API key. The protocol requires a non-streaming completion response with function tool calls, Bearer authorization, `tool_choice: required` and `max_tokens`. Other response formats need a server adapter. Endpoints cannot contain embedded credentials, query parameters or fragments. Both connections may be edited again later.

Stored API keys are write-only in the administration screen: a blank New API key field keeps the saved key. To rotate it, enter a replacement and Save. To revoke the stored copy, check Remove stored key and Save. An incomplete active connection disables AI. Project editing and local measured tools still work.

## Server setup

Before unlocking the administration screen, the server operator supplies a random administrator token of at least 24 characters using the server's environment or secret manager:

- `UNBUILT_ADMIN_TOKEN`: shared administration token. Enter this same token in the settings window. It is separate from model API keys. Rotating this value requires restarting the service.
- `UNBUILT_AI_CONFIG`: optional absolute path to the private routing file. Default: `~/.config/unbuilt/ai.json` for the server account. Keep it outside the repository, the public web directory and project exports.
- `UNBUILT_APP_ORIGIN`: existing comma-separated trusted browser origins. The service defaults include the local app and the current private network app origin.

Start the service with `node --experimental-strip-types --no-warnings server/intent.mjs --port 5174`. The static app continues on port 5173. Use the existing trusted private network or an HTTPS deployment for administrator access. Do not put administrator tokens or model keys in frontend build variables or browser storage.

For deployments using existing environment configuration, supply all of `UNBUILT_MODEL_URL`, `UNBUILT_MODEL`, and `UNBUILT_MODEL_KEY`. These initialize the primary connection only when there is no routing file. Saved routing takes precedence, including a deliberately removed key. These values are not re-imported after every request. The old fixed-rule endpoints remain available for compatibility; the new assistant uses `/api/ai/*`.

The private config contains keys as plain text protected by file permissions, not an encrypted vault. The server writes mode 0600 and atomically replaces the file. Its account must own a private writable directory; protect backups using the same access policy. This is a single-server administration mechanism, without user accounts or a shared multi-instance secrets store. Browser administrator credentials and unsaved key drafts last only while the settings window is open. Stored keys never return from the server; full endpoints/model identifiers are visible only after administrator authorization.

After any routing change or server restart, the connection is **untested**. A successful explicit test or validated AI request establishes that the configured connection returned a tool response. An error is shown explicitly. The UI makes no claim about model quality or planning suitability from this test. Failure never silently sends the intention to the alternate connection.

No real endpoint or secret has been installed for Feature 11. The owner will supply these later. Automated checks use isolated temporary routing files and non-secret scripted fixtures. `UNBUILT_AI_ALLOW_LOCAL=true` permits loopback HTTP endpoints only for these tests; leave it unset for normal use.

## Checks

`npm run test:ai` verifies argument bounds, bindings, held work, configuration persistence/permissions, administrator authorization, explicit switching, restart behavior, timeouts, concurrency and cancellation against a scripted protocol fixture. It does not verify access to a real model.

`PLAYWRIGHT_MODULE=/path/to/playwright node --experimental-strip-types --no-warnings tests/ai-browser.mjs` exercises the served production app against an isolated real tool service and scripted upstream. For actual 200% zoom, run the same command under `xvfb-run -a` with `UNBUILT_AI_ZOOM=2` and a separate `UNBUILT_EVIDENCE_DIR`.
