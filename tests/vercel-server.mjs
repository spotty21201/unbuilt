import assert from 'node:assert/strict';
import http from 'node:http';
import handler from '../api/[...path].mjs';

// Importing the deployment entry must not open the local server port.
process.env.VERCEL = '1';
const server = http.createServer((req, res) => {
  if (req.url === '/api/intent') {
    req.body = { text: 'hello', requestId: 'vercel-parsed', ctx: { selected: null, selectedPrice: 850000000 } }; // Vercel's parsed-body path.
  }
  return handler(req, res);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
try {
  const host = new URL(base).host;
  const health = await fetch(`${base}/api/health`, { headers: { origin: `https://${host}` } });
  assert.equal(health.status, 200);
  assert.equal((await health.json()).ok, true);
  const foreign = await fetch(`${base}/api/health`, { headers: { origin: 'https://foreign.example' } });
  assert.equal(foreign.status, 403);
  const parsed = await fetch(`${base}/api/intent`, { method: 'POST' });
  assert.equal(parsed.status, 200);
  assert.equal((await parsed.json()).requestId, 'vercel-parsed');
  const raw = await fetch(`${base}/api/search`, { method: 'POST', body: '{invalid', headers: { 'content-type': 'application/json' } });
  assert.equal(raw.status, 400);
  assert.match((await raw.json()).error, /malformed/);
  console.log('PASS Vercel entry: import, health, same-origin CORS, foreign refusal, parsed and raw bodies');
} finally {
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
}
