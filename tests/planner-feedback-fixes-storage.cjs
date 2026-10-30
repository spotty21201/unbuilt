// Verify ordinary profile restart in a temporary profile, never user data.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path'), assert = require('node:assert/strict');
const out = process.env.UNBUILT_EVIDENCE_DIR || 'evidence/planner-feedback-fixes';
(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'unbuilt-storage-')), checks = [];
  let c;
  try {
    c = await chromium.launchPersistentContext(dir, { headless: true });
    let p = await c.newPage(); await p.goto('http://localhost:5173'); await p.getByText('Saved in this browser', { exact: true }).waitFor();
    await p.getByRole('button', { name: 'Projects', exact: true }).click();
    await p.getByRole('textbox', { name: 'Project name', exact: true }).fill('Disposable restart test');
    await p.getByRole('button', { name: 'Create and open project', exact: true }).click();
    await p.getByRole('button', { name: 'Save', exact: true }).click();
    const before = await p.evaluate(() => JSON.parse(localStorage.getItem('unbuilt.projects.v1')));
    await c.close();
    c = await chromium.launchPersistentContext(dir, { headless: true });
    p = await c.newPage(); await p.goto('http://localhost:5173'); await p.getByText('Saved in this browser', { exact: true }).waitFor();
    const after = await p.evaluate(() => JSON.parse(localStorage.getItem('unbuilt.projects.v1')));
    assert.equal(after.activeId, before.activeId);
    assert.deepEqual(after.projects.map(x => ({ id: x.id, name: x.name, state: x.project.state })), before.projects.map(x => ({ id: x.id, name: x.name, state: x.project.state })));
    checks.push('Closing and reopening an ordinary temporary Chromium profile preserves named accepted projects and active identity');
    // Explicitly removing only this disposable profile's app data demonstrates the limit.
    await p.evaluate(() => localStorage.clear()); await p.reload(); await p.getByText('Saved in this browser', { exact: true }).waitFor();
    const cleared = await p.evaluate(() => JSON.parse(localStorage.getItem('unbuilt.projects.v1')));
    assert.ok(!cleared.projects.some(x => x.name === 'Disposable restart test'));
    checks.push('Clearing this disposable profile’s site data removes the test project; a fresh sample is initialized');
    fs.mkdirSync(out, { recursive: true }); fs.writeFileSync(`${out}/storage-restart-results.json`, JSON.stringify({ checks, limitations: 'Ordinary Chromium profile only. No guarantee for private browsing, browser cleanup policies, disk loss or another device.' }, null, 2));
    for (const check of checks) console.log('PASS ' + check);
  } finally { await c?.close(); fs.rmSync(dir, { recursive: true, force: true }); }
})();
