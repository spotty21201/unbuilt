# Vercel deployment

Deploy the repository root, including `src/`, `server/` and `web/`. The root
`vercel.json` installs both package lockfiles, builds `web/dist`, and serves
`api/[...path].mjs` as one Node function. Node 24 is required by the deployment.
The function explicitly includes shared TypeScript sources and geometry package
files, which the JavaScript entry point does not trace automatically.

The build sets `VITE_API_SAME_ORIGIN=true`, so browser requests use `/api/`
instead of local port 5174. Local development retains the separate tool server:

```sh
node --experimental-strip-types --no-warnings server/intent.mjs
npm --prefix web run dev
```

Configure AI credentials in Vercel's server environment variables:
`UNBUILT_MODEL_KEY`, `UNBUILT_MODEL_URL`, and `UNBUILT_MODEL`. Never prefix
credentials with `VITE_`. The API key is required; the endpoint and model default to the Meta Chat
Completions endpoint and `muse-wonder-1.0`. Explicit values override these
defaults. Without a key, the deterministic planner still works and the API
reports that AI is unconfigured. `/api/health` lists missing connection field
names without returning their values.

Leave `UNBUILT_ADMIN_TOKEN` unset on Vercel. The existing administrator settings
editor persists to a local file, which is unsuitable for durable serverless
configuration. Change AI routing through Vercel environment variables and
redeploy. Saved projects remain in each browser's local storage.

Validate the shared API locally:

```sh
node --experimental-strip-types --no-warnings tests/vercel-server.mjs
UNBUILT_AI_CONFIG=/tmp/unbuilt-unconfigured-ai.json node --experimental-strip-types --no-warnings tests/server.mjs
```

A release is complete only after Vercel reports READY, the intended domain
points to that deployment, `/api/health` returns JSON, and the planner passes
browser verification on the deployed URL.
