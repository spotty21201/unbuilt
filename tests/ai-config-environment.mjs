import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const folder = mkdtempSync(join(tmpdir(), 'unbuilt-env-check-'));
const config = join(folder, 'routing.json');
const key = 'fixture-secret-never-public';
function inspect(extra = {}) {
  const env = { ...process.env, UNBUILT_AI_CONFIG: config, UNBUILT_MODEL_KEY: '', ...extra };
  delete env.UNBUILT_MODEL_URL;
  delete env.UNBUILT_MODEL;
  Object.assign(env, extra);
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', "import {publicAIStatus,routingSettings} from './server/ai-config.mjs'; console.log(JSON.stringify({status:publicAIStatus(),settings:routingSettings()}));"], { env, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.ok(!result.stdout.includes(key), 'public diagnostics must not expose the key');
  return JSON.parse(result.stdout);
}
try {
  let result = inspect();
  assert.equal(result.status.configured, false);
  assert.deepEqual(result.status.missing, ['key']);
  result = inspect({ UNBUILT_MODEL_KEY: key });
  assert.equal(result.status.configured, true);
  assert.equal(result.status.status, 'untested');
  assert.deepEqual(result.status.missing, []);
  assert.equal(result.settings.routes.primary.model, 'muse-wonder-1.0');
  assert.equal(result.settings.routes.primary.endpoint, 'https://api.meta.ai/v1/chat/completions');
  result = inspect({ UNBUILT_MODEL_KEY: key, UNBUILT_MODEL_URL: 'https://fixture.example/v1/chat/completions', UNBUILT_MODEL: 'fixture-model' });
  assert.equal(result.settings.routes.primary.endpoint, 'https://fixture.example/v1/chat/completions');
  assert.equal(result.settings.routes.primary.model, 'fixture-model');
  const blank = { label: 'Primary', endpoint: '', model: '', key: '' };
  writeFileSync(config, JSON.stringify({ revision: 1, active: 'primary', routes: { primary: blank, alternate: { ...blank, label: 'Alternate' } } }));
  result = inspect({ UNBUILT_MODEL_KEY: key });
  assert.equal(result.status.configured, false, 'saved settings must override environment defaults');
  assert.deepEqual(result.status.missing, ['endpoint', 'model', 'key']);
  writeFileSync(config, '{invalid');
  result = inspect({ UNBUILT_MODEL_KEY: key });
  assert.equal(result.status.configured, false);
  assert.equal(result.status.status, 'settings-error');
  console.log('PASS environment configuration: Wonder defaults, overrides, missing fields, secret redaction, saved-settings precedence, corrupt settings');
} finally {
  rmSync(folder, { recursive: true, force: true });
}
