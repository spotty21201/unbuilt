// Disposable browser context: never touches the owner's browser profile or projects.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const out = process.env.UNBUILT_EVIDENCE_DIR || 'evidence/planner-feedback-fixes';
const checks = [], errors = [];
const check = (name, value) => { assert.ok(value, name); checks.push(name); console.log('PASS ' + name); };
const button = (p, name) => p.getByRole('button', { name, exact: true });
const library = p => p.evaluate(() => JSON.parse(localStorage.getItem('unbuilt.projects.v1')));
const state = async p => { const l = await library(p); return l.projects.find(x => x.id === l.activeId).project.state; };
const settle = p => p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
async function leave(p) { if (await button(p, 'Leave project').count()) await button(p, 'Leave project').click(); }
async function create(p, name, sample = false) {
  await button(p, 'Projects').click();
  await p.getByRole('textbox', { name: 'Project name', exact: true }).fill(name);
  if (sample) await p.getByRole('radio', { name: 'Cedar Market sample', exact: true }).check();
  await button(p, 'Create and open project').click(); await leave(p); await settle(p);
}
async function draw(p, points) {
  await button(p, 'Draw boundary').click();
  for (const [i, [x, y]] of points.entries()) {
    await button(p, 'Add coordinate vertex').click();
    await p.getByRole('spinbutton', { name: `Boundary vertex ${i + 1} x`, exact: true }).fill(String(x));
    await p.getByRole('spinbutton', { name: `Boundary vertex ${i + 1} y`, exact: true }).fill(String(y));
  }
  await button(p, 'Close boundary').click();
}
async function inspectFit(p, label) {
  const fit = await p.evaluate(() => {
    const a = document.querySelector('.inspector-col'), e = document.querySelector('.boundary-editor'), r = a.getBoundingClientRect();
    const clipped = [...e.querySelectorAll('input,button,p,dd,dt,strong')].filter(x => { const b = x.getBoundingClientRect(); return b.width && (b.right > r.right + 1 || b.left < r.left - 1); }).map(x => x.textContent || x.ariaLabel);
    return { viewport: [innerWidth, innerHeight], page: document.documentElement.scrollWidth, panel: [a.scrollWidth, a.clientWidth], clipped };
  });
  check(label + ': no page/panel horizontal overflow or clipped controls', fit.page <= fit.viewport[0] && fit.panel[0] <= fit.panel[1] + 1 && fit.clipped.length === 0);
  return fit;
}
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch(), c = await b.newContext({ viewport: { width: 1366, height: 768 } }), p = await c.newPage();
  p.setDefaultTimeout(10000); p.on('pageerror', e => errors.push(e.message));
  try {
    await p.goto('http://localhost:5173'); await p.getByText('Saved in this browser', { exact: true }).waitFor();
    const longName = 'Residential master plan '.repeat(5).slice(0, 100).trim();
    await create(p, longName);
    await draw(p, [[0, 0], [77, 0], [77, 78], [0, 78]]);
    check('77 × 78 rectangle displays 6,006 m²', /6,006 m²/.test(await p.locator('.boundary-area').innerText()));
    check('snap and decimal coordinate guidance visible beside editor controls', /Pointer snap: 1 m/.test(await p.locator('.boundary-precision').innerText()) && /decimal coordinates/.test(await p.locator('.boundary-precision').innerText()));
    check('boundary draft is absent from accepted autosave', !(await state(p)).baseSpec.contents.boundary);
    await button(p, 'Projects').click();
    check('pending boundary opens explicit keep/discard choice', await button(p, 'Keep editing').isVisible() && await button(p, 'Discard draft and open projects').isVisible());
    await button(p, 'Keep editing').click();
    check('keep editing preserves four-corner draft', await p.locator('.boundary-coordinates fieldset').count() === 4);
    await button(p, 'Add after 1').click();
    check('fractional midpoint retains 38.5 m coordinate and exact area', await p.getByRole('spinbutton', { name: 'Boundary vertex 2 x', exact: true }).inputValue() === '38.5' && /6,006 m²/.test(await p.locator('.boundary-area').innerText()));
    await p.getByRole('spinbutton', { name: 'Boundary vertex 2 y', exact: true }).fill('0.5');
    check('decimal coordinate produces hand-calculated 5,986.75 m²', /5,986.75 m²/.test(await p.locator('.boundary-area').innerText()));
    await button(p, 'Undo').click(); await button(p, 'Redo').click();
    check('draft history restores fractional coordinate', await p.getByRole('spinbutton', { name: 'Boundary vertex 2 y', exact: true }).inputValue() === '0.5');
    const field = p.getByRole('spinbutton', { name: 'Boundary vertex 2 x', exact: true });
    await field.fill('');
    check('non-finite/incomplete coordinate blocks Apply and announces correction', await button(p, 'Apply boundary').isDisabled() && await field.getAttribute('aria-invalid') === 'true' && /finite numbers/.test(await p.locator('#boundary-error').innerText()));
    await field.fill('0'); await p.getByRole('spinbutton', { name: 'Boundary vertex 2 y', exact: true }).fill('0');
    check('duplicate vertices block Apply with actionable error', await button(p, 'Apply boundary').isDisabled() && /Move or remove/.test(await p.locator('#boundary-error').innerText()));
    await field.fill('38.5'); await p.getByRole('spinbutton', { name: 'Boundary vertex 2 y', exact: true }).fill('0.5');
    await button(p, 'Apply boundary').click(); const accepted = await state(p);
    check('valid Apply creates one coherent plan undo step', accepted.baseSpec.boundary.length === 5 && await button(p, 'Undo').isEnabled());
    await button(p, 'Undo').click(); check('Undo applied outline returns blank', !(await state(p)).baseSpec.contents.boundary); await button(p, 'Redo').click();
    await button(p, 'Edit boundary').click(); await p.getByRole('spinbutton', { name: 'Boundary vertex 3 x', exact: true }).fill('1');
    await button(p, 'Projects').click(); await button(p, 'Discard draft and open projects').click();
    check('discard before project management preserves accepted outline', JSON.stringify((await state(p)).baseSpec) === JSON.stringify(accepted.baseSpec));
    const download = p.waitForEvent('download'); await button(p, `Download ${longName}`).click();
    const backup = path.resolve(out, 'accepted-project-backup.json'); await (await download).saveAs(backup);
    const saved = JSON.parse(fs.readFileSync(backup));
    check('library backup includes name, exact geometry, assumptions, commitments and decisions', saved.name === longName && JSON.stringify(saved.state) === JSON.stringify(await state(p)) && Array.isArray(saved.decisions) && saved.photo.included === false);
    await button(p, `Delete ${longName}`).click();
    const deletionDownload = p.waitForEvent('download'); await button(p, 'Download before deletion').click();
    const deletionBackup = path.resolve(out, 'before-deletion-backup.json'); await (await deletionDownload).saveAs(deletionBackup);
    check('project deletion offers a working backup and states recovery limits', JSON.parse(fs.readFileSync(deletionBackup)).name === longName && /most recently deleted project/.test(await p.locator('.project-delete').innerText()));
    await button(p, 'Keep project').click();
    await p.getByLabel('Import a project or decision record').setInputFiles(backup);
    check('import warns before ending existing undo', await button(p, 'Stay in project').isVisible());
    await button(p, 'Stay in project').click(); check('cancel import leaves project count unchanged', (await library(p)).projects.length === 2);
    await p.getByLabel('Import a project or decision record').setInputFiles(backup); await leave(p);
    await p.getByText(/Imported project file/).waitFor();
    check('backup import restores accepted geometry and assumptions in separate project', (await library(p)).projects.length === 3 && JSON.stringify(await state(p)) === JSON.stringify(saved.state));
    check('freshly opened project has no inherited Undo', await button(p, 'Undo').isDisabled());
    await button(p, 'Projects').click(); await button(p, 'Open Cedar Market sample').click();
    check('switch with no draft/history/photo needs no confirmation', await p.locator('.confirm-plan-change').count() === 0 && await p.locator('main .footprint').count() === 20);
    // Photo is deliberately session-only. A tiny fictional image is sufficient.
    await p.getByText('Object tools & site source', { exact: true }).click();
    await p.locator('.sitesrc > summary').click();
    const photoFile = { name: 'reference.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64') };
    await p.getByLabel('Reference photo (PNG/JPEG, illustration only)').setInputFiles(photoFile);
    await p.getByText('Show photo behind the plan (reference only)', { exact: true }).waitFor();
    const parkLock = (await state(p)).greenLocked;
    await button(p, 'Remove photo').click();
    check('Remove photo removes the image without changing park protection', await p.locator('main image').count() === 0 && (await state(p)).greenLocked === parkLock);
    await p.getByLabel('Reference photo (PNG/JPEG, illustration only)').setInputFiles(photoFile);
    await p.getByText('Show photo behind the plan (reference only)', { exact: true }).waitFor();
    await button(p, 'Clear layout').click();
    check('clear dialog names retained boundary/photo and limited Undo lifetime', /Keep this boundary/.test(await p.locator('.confirm-plan-change').innerText()) && /reference photo in its current visibility/.test(await p.locator('.confirm-plan-change').innerText()) && /Switching projects, reloading or closing/.test(await p.locator('.confirm-plan-change').innerText()));
    await button(p, 'Keep plan').click(); check('cancel clear retains generated homes', await p.locator('main .footprint').count() === 20);
    await button(p, 'Clear layout').click(); await button(p, 'Confirm clear layout').click();
    check('clear retains boundary and photo', await p.locator('main .site').count() === 1 && await p.locator('main image').count() === 1 && await p.locator('main .footprint').count() === 0);
    await button(p, 'Undo').click(); await button(p, 'Redo').click(); await button(p, 'Undo').click();
    await button(p, 'Delete boundary and layout').click();
    check('one restart action has matching dialog and explicit retained photo', await p.getByRole('heading', { name: 'Delete boundary and layout?', exact: true }).isVisible() && /reference photo is hidden/.test(await p.locator('.confirm-plan-change').innerText()) && await button(p, 'Start blank plan').count() === 0);
    await button(p, 'Confirm delete boundary and layout').click();
    check('restart removes geometry and hides rather than deletes session photo', await p.locator('main .site').count() === 0 && await p.locator('main image').count() === 0 && !!(await p.getByText('Show photo behind the plan (reference only)', { exact: true }).count()));
    await button(p, 'Undo').click(); check('Undo restart restores geometry and photo visibility', await p.locator('main .footprint').count() === 20 && await p.locator('main image').count() === 1);
    await button(p, 'Projects').click(); await button(p, `Open ${longName}`).click();
    check('switch warns about both undo and photo loss', /Plan Undo\/Redo will end/.test(await p.locator('.confirm-plan-change').innerText()) && /photo will be lost/.test(await p.locator('.confirm-plan-change').innerText()));
    await button(p, 'Stay in project').click(); await button(p, 'Close projects').click();
    check('cancel switch retains redo and session photo', await button(p, 'Redo').isEnabled() && await p.locator('main image').count() === 1);
    let warned = false;
    p.once('dialog', async d => { warned = d.type() === 'beforeunload'; await d.dismiss(); });
    await p.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
    check('reload with session recovery at risk triggers browser warning; cancelling keeps plan', warned && await p.locator('main .footprint').count() === 20);
    // Allow normal reload and verify accepted state only.
    p.once('dialog', d => d.accept()); await p.reload(); await p.getByText('Saved in this browser', { exact: true }).waitFor();
    check('normal reload restores accepted plan, with no history or photo claim', await p.locator('main .footprint').count() === 20 && await button(p, 'Undo').isDisabled() && await p.locator('main image').count() === 0 && /not restored/.test(await p.locator('.srstatus').innerText()));
    // Home selection and metrics; regeneration coverage is also in root/content tests.
    await p.getByRole('button', { name: /^Lot 1,/ }).first().click(); await button(p, 'Remove 1 selected home').click(); await button(p, 'Remove homes').click();
    check('individual removal preserves 20 lots, updates 19 homes and vacant reservation', await p.locator('main .parcel').count() === 20 && await p.locator('main .footprint').count() === 19 && /19 homes/.test(await p.locator('.docksummary').innerText()));
    await p.getByRole('button', { name: /^Lot 2,/ }).first().click(); await p.getByRole('button', { name: /^Lot 3,/ }).first().click({ modifiers: ['Shift'] });
    await button(p, 'Remove 2 selected homes').click(); await button(p, 'Remove homes').click();
    check('multiple removal updates 17 homes without deleting lots', await p.locator('main .footprint').count() === 17 && await p.locator('main .parcel.vacant').count() === 3);
    await button(p, 'Restore removed homes').click(); check('Restore returns all removed homes', await p.locator('main .footprint').count() === 20); await button(p, 'Undo').click(); check('Undo Restore reinstates reservations', await p.locator('main .footprint').count() === 17);
    // Stress wrapping with maximum vertices, large coordinates/metrics and 100-character name.
    await button(p, 'Projects').click(); await button(p, `Open ${longName}`).click(); await leave(p);
    const pts = Array.from({ length: 64 }, (_, i) => ({ x: 250 + 240 * Math.cos(i * Math.PI / 32), y: 250 + 240 * Math.sin(i * Math.PI / 32) }));
    await p.evaluate(pts => { const l = JSON.parse(localStorage.getItem('unbuilt.projects.v1')), e = l.projects.find(x => x.id === l.activeId); e.project.state.baseSpec = { ...e.project.state.baseSpec, w: 490, h: 490, boundary: pts, contents: { boundary: true, layout: false, removedHomes: [] } }; localStorage.setItem('unbuilt.projects.v1', JSON.stringify(l)); }, pts);
    await p.reload(); await p.getByText('Saved in this browser', { exact: true }).waitFor(); await button(p, 'Edit boundary').click();
    const sizes = [];
    for (const [width, height] of [[1440, 900], [1366, 768], [1280, 720], [1024, 768], [960, 640], [375, 812]]) {
      await p.setViewportSize({ width, height }); await settle(p); sizes.push(await inspectFit(p, `${width}×${height} at 100%`));
      const last = p.getByRole('spinbutton', { name: 'Boundary vertex 64 y', exact: true }); await last.focus(); await last.scrollIntoViewIfNeeded(); await settle(p);
      check(`${width}: Apply/Cancel remain visible at end of 64-vertex list`, await button(p, 'Apply boundary').evaluate(e => { const r = e.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; }) && await button(p, 'Cancel boundary').isVisible());
      check(`${width}: keyboard focus has visible outline`, await last.evaluate(e => { const s = getComputedStyle(e); return s.outlineStyle !== 'none'; }));
      await p.screenshot({ path: `${out}/editor-${width}.png` });
    }
    await p.setViewportSize({ width: 1366, height: 768 }); await button(p, 'Cancel boundary').click();
    check('no uncaught browser errors', errors.length === 0);
    fs.writeFileSync(`${out}/feedback-results.json`, JSON.stringify({ asset: await p.locator('script[src]').getAttribute('src'), checks, errors, sizes }, null, 2));
    console.log(`ALL ${checks.length} FEEDBACK CHECKS PASS`);
  } catch (e) {
    await p.screenshot({ path: `${out}/feedback-failure.png`, fullPage: true }); fs.writeFileSync(`${out}/feedback-failure.txt`, e.stack + '\n' + await p.locator('body').innerText()); throw e;
  } finally { await b.close(); }
})();
