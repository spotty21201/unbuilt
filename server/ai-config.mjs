import { readFileSync, mkdirSync, writeFileSync, renameSync, chmodSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import { timingSafeEqual } from 'node:crypto';

const configPath = process.env.UNBUILT_AI_CONFIG ?? join(homedir(), '.config/unbuilt/ai.json');
const emptyRoute = label => ({ label, endpoint: '', model: '', key: '' });
let config;
let configError = false;
try {
  config = JSON.parse(readFileSync(configPath, 'utf8'));
  validate(config);
} catch (e) {
  if (e.code !== 'ENOENT') configError = true;
  config = { revision: 0, active: 'primary', routes: { primary: emptyRoute('Primary'), alternate: emptyRoute('Alternate') } };
  // Existing server environment remains a supported deployment configuration.
  if (!configError && process.env.UNBUILT_MODEL_KEY) config.routes.primary = {
    label: 'Primary', endpoint: process.env.UNBUILT_MODEL_URL ?? '', model: process.env.UNBUILT_MODEL ?? '', key: process.env.UNBUILT_MODEL_KEY,
  };
}
let verification = { revision: -1, status: 'untested' };
function validate(c) {
  if (!c || !Number.isInteger(c.revision) || c.revision < 0 || !['primary','alternate'].includes(c.active) || !c.routes || Object.keys(c.routes).sort().join(',') !== 'alternate,primary') throw Error('Invalid routing settings.');
  for (const r of Object.values(c.routes)) {
    if (!r || Object.keys(r).sort().join(',') !== 'endpoint,key,label,model' || ['label','endpoint','model','key'].some(k => typeof r[k] !== 'string') || !r.label.trim() || r.label.length > 60 || r.model.length > 200 || r.endpoint.length > 2000 || r.key.length > 8192 || /[\r\n]/.test(r.key)) throw Error('Invalid connection fields.');
    if (r.endpoint) {
      let u; try { u = new URL(r.endpoint); } catch { throw Error('Enter a complete endpoint URL.'); }
      const local = process.env.UNBUILT_AI_ALLOW_LOCAL === 'true' && ['localhost','127.0.0.1','[::1]'].includes(u.hostname);
      if ((u.protocol !== 'https:' && !(local && u.protocol === 'http:')) || u.username || u.password || u.search || u.hash) throw Error('Use an HTTPS endpoint without embedded credentials, query or fragment.');
    }
  }
}
export function adminAuthorized(header) {
  const token = process.env.UNBUILT_ADMIN_TOKEN ?? '';
  const supplied = typeof header === 'string' && header.startsWith('Bearer ') ? header.slice(7) : '';
  return token.length >= 24 && Buffer.byteLength(token) === Buffer.byteLength(supplied) && timingSafeEqual(Buffer.from(token), Buffer.from(supplied));
}
export function publicAIStatus() {
  const r = config.routes[config.active];
  const configured = !!(r.endpoint && r.model && r.key) && !configError;
  return { configured, connection: r.label, revision: config.revision, status: configError ? 'settings-error' : !configured ? 'unconfigured' : verification.revision === config.revision ? verification.status : 'untested', adminEnabled: (process.env.UNBUILT_ADMIN_TOKEN ?? '').length >= 24 };
}
export function routingSettings() {
  return { revision: config.revision, active: config.active, routes: Object.fromEntries(Object.entries(config.routes).map(([id,r]) => [id, { label:r.label, endpoint:r.endpoint, model:r.model, hasKey:!!r.key }])) };
}
export function saveRoutingSettings(raw) {
  if (!raw || raw.revision !== config.revision) throw Error('Settings changed. Reload before saving.');
  if (Object.keys(raw).sort().join(',') !== 'active,revision,routes' || !raw.routes || Object.keys(raw.routes).sort().join(',') !== 'alternate,primary') throw Error('Invalid routing settings.');
  const next = { revision: config.revision + 1, active: raw.active, routes: {} };
  for (const id of ['primary','alternate']) {
    const r = raw.routes[id];
    if (!r || Object.keys(r).some(k => !['label','endpoint','model','key','clearKey'].includes(k)) || typeof r.clearKey !== 'boolean' || typeof r.key !== 'string') throw Error('Invalid connection fields.');
    next.routes[id] = { label:r.label, endpoint:r.endpoint, model:r.model, key:r.clearKey ? '' : r.key || config.routes[id].key };
  }
  validate(next);
  mkdirSync(dirname(configPath), { recursive:true, mode:0o700 });
  const temp = `${configPath}.${process.pid}.tmp`;
  writeFileSync(temp, JSON.stringify(next), { mode:0o600 });
  chmodSync(temp, 0o600);
  renameSync(temp, configPath);
  config = next; configError = false;
  return routingSettings();
}
export function activeConnection() {
  if (!publicAIStatus().configured) throw Error('AI is not configured. An administrator can add a connection in AI settings.');
  return { ...config.routes[config.active], revision:config.revision };
}
export function markConnection(revision, status) {
  if (revision === config.revision) verification = { revision, status };
}
export function assertConnectionRevision(revision) {
  if (revision !== config.revision) throw Error('AI settings changed during this request. Ask again with the current connection.');
}
