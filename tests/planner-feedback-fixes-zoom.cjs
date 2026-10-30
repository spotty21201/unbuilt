// Real browser zoom, using the tabs API; each profile is disposable.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path'), assert = require('node:assert/strict');
const out = process.env.UNBUILT_EVIDENCE_DIR || 'evidence/planner-feedback-fixes';
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'unbuilt-feedback-zoom-')), ext = path.join(dir, 'extension'); fs.mkdirSync(ext);
  fs.writeFileSync(path.join(ext, 'manifest.json'), JSON.stringify({ manifest_version: 3, name: 'Local browser zoom check', version: '1.0', permissions: ['tabs'], background: { service_worker: 'worker.js' } }));
  fs.writeFileSync(path.join(ext, 'worker.js'), 'chrome.runtime.onInstalled.addListener(()=>{});');
  const rows = [];
  try {
    for (const width of [1440, 1366, 1024]) {
      const ctx = await chromium.launchPersistentContext(path.join(dir, `profile-${width}`), { headless: false, viewport: null, ignoreDefaultArgs: ['--disable-extensions'], args: [`--window-size=${width},856`, `--disable-extensions-except=${ext}`, `--load-extension=${ext}`] });
      try {
        const p = await ctx.newPage(); await p.goto('http://localhost:5173'); await p.getByText('Saved in this browser', { exact: true }).waitFor();
        // Maximum supported vertex count, long name and large local coordinates.
        await p.evaluate(() => {
          const l = JSON.parse(localStorage.getItem('unbuilt.projects.v1')), e = l.projects.find(x => x.id === l.activeId);
          e.name = e.project.name = 'A'.repeat(100); e.project.version = 5;
          e.project.state.baseSpec = { ...e.project.state.baseSpec, w: 490, h: 490, boundary: Array.from({ length: 64 }, (_, i) => ({ x: 250 + 240 * Math.cos(i * Math.PI / 32), y: 250 + 240 * Math.sin(i * Math.PI / 32) })), contents: { boundary: true, layout: false, removedHomes: [] } };
          localStorage.setItem('unbuilt.projects.v1', JSON.stringify(l));
        });
        await p.reload(); await p.getByRole('button', { name: 'Edit boundary', exact: true }).click();
        const worker = ctx.serviceWorkers()[0] || await ctx.waitForEvent('serviceworker');
        for (const zoom of [1, 1.25, 1.5, 2]) {
          const actual = await worker.evaluate(async z => { const t = (await chrome.tabs.query({})).find(t => t.url?.startsWith('http://localhost:5173')); await chrome.tabs.setZoom(t.id, z); return chrome.tabs.getZoom(t.id); }, zoom);
          assert.equal(actual, zoom); await p.waitForFunction(z => Math.abs(devicePixelRatio - z) < .01, zoom);
          const last = p.getByRole('spinbutton', { name: 'Boundary vertex 64 y', exact: true }); await last.focus(); await last.scrollIntoViewIfNeeded();
          await p.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
          const row = await p.evaluate(() => {
            const a = document.querySelector('.inspector-col'), r = a.getBoundingClientRect();
            const clipped = [...document.querySelectorAll('.boundary-editor p,.boundary-editor input,.boundary-editor button,.boundary-editor dd,.boundary-editor dt')].filter(e => { const b = e.getBoundingClientRect(); return b.right > r.right + 1 || b.left < r.left - 1; }).map(e => e.textContent || e.ariaLabel);
            const action = document.querySelector('.boundary-actions').getBoundingClientRect(), focus = document.activeElement.getBoundingClientRect();
            return { viewport: [innerWidth, innerHeight], outerWidth, dpr: devicePixelRatio, pageWidth: document.documentElement.scrollWidth, panel: [a.scrollWidth, a.clientWidth], clipped, actionsVisible: action.top >= 0 && action.bottom <= innerHeight, focusVisible: focus.top >= action.bottom && focus.bottom <= innerHeight, canvasWidth: document.querySelector('main svg.canvas').getBoundingClientRect().width };
          });
          assert.ok(row.pageWidth <= row.viewport[0] && row.panel[0] <= row.panel[1] + 1 && !row.clipped.length, JSON.stringify(row));
          assert.ok(row.actionsVisible && row.focusVisible, JSON.stringify(row)); assert.ok(row.canvasWidth >= 250);
          const cdp = await ctx.newCDPSession(p);
          const capture = await cdp.send('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false });
          fs.writeFileSync(`${out}/zoom-${width}-${zoom * 100}.png`, Buffer.from(capture.data, 'base64'));
          await cdp.detach();
          rows.push({ physicalWindowWidth: width, actualBrowserZoom: actual, ...row }); console.log(`PASS ${width}px window at ${zoom * 100}% browser zoom`, row.viewport);
        }
        await p.getByRole('button', { name: 'Cancel boundary', exact: true }).click();
      } finally { await ctx.close(); }
    }
    fs.writeFileSync(`${out}/feedback-zoom-results.json`, JSON.stringify(rows, null, 2));
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
})();
