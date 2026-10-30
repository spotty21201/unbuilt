// Use disposable contexts and visible paper clicks, not precomputed valid metre coordinates.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict'), fs = require('node:fs');
const out = process.env.UNBUILT_EVIDENCE_DIR || 'evidence/boundary-pointer-range', checks = [], errors = [];
const button = (p, name) => p.getByRole('button', { name, exact: true });
const check = (name, value) => { assert.ok(value, name); checks.push(name); console.log('PASS ' + name); };
const state = p => p.evaluate(() => { const l = JSON.parse(localStorage.getItem('unbuilt.projects.v1')); return l.projects.find(e => e.id === l.activeId).project.state; });
const points = p => p.locator('.boundary-coordinates fieldset').evaluateAll(es => es.map(e => { const a = e.querySelectorAll('input'); return { x: Number(a[0].value), y: Number(a[1].value) }; }));
const inRange = pts => pts.every(p => p.x >= 0 && p.x <= 500 && p.y >= 0 && p.y <= 500);
const area = pts => Math.abs(pts.reduce((a, p, i) => { const q = pts[(i + 1) % pts.length]; return a + p.x * q.y - q.x * p.y; }, 0)) / 2;
const sixClicks = [[.1, .2], [.65, .2], [.85, .4], [.8, .7], [.35, .8], [.1, .6]];
(async () => {
  fs.mkdirSync(out, { recursive: true }); const b = await chromium.launch(); let current;
  try {
    for (const [width, height] of [[1440, 900], [1024, 768], [375, 812]]) {
      const c = await b.newContext({ viewport: { width, height } }), p = await c.newPage(); current = p; p.setDefaultTimeout(10000); p.on('pageerror', e => errors.push(e.message));
      await p.goto('http://localhost:5173'); await p.getByText('Saved in this browser', { exact: true }).waitFor();
      await button(p, 'Projects').click(); await p.getByRole('textbox', { name: 'Project name', exact: true }).fill('Pointer check'); await button(p, 'Create and open project').click();
      await button(p, 'Draw site').first().click(); await p.locator('main svg.canvas').scrollIntoViewIfNeeded();
      const box = await p.locator('main svg.canvas').boundingBox();
      for (const [x, y] of sixClicks) await p.mouse.click(box.x + box.width * x, box.y + box.height * y);
      await button(p, 'Close boundary').click(); const drawn = await points(p);
      check(`${width}: six clicks across the paper create an in-range, applicable boundary`, drawn.length === 6 && inRange(drawn) && await button(p, 'Apply boundary').isEnabled());
      const displayed = Number((await p.locator('.boundary-area strong').innerText()).replace(/[^\d.]/g, ''));
      check(`${width}: displayed area equals independent shoelace calculation`, Math.abs(displayed - area(drawn)) < .0051);
      check(`${width}: pointer draft does not overwrite the accepted blank plan`, !(await state(p)).baseSpec.contents.boundary);
      await p.screenshot({ path: `${out}/drawn-${width}.png` });
      await button(p, 'Apply boundary').click();
      check(`${width}: Apply persists precisely the six drawn vertices`, JSON.stringify((await state(p)).baseSpec.boundary) === JSON.stringify(drawn));
      await button(p, 'Undo').click(); check(`${width}: one Undo restores blank`, !(await state(p)).baseSpec.contents.boundary); await button(p, 'Redo').click();
      await button(p, 'Edit boundary').click(); const original = await points(p);
      // Pointer capture allows dragging beyond the viewport. Both lower limits must hold.
      const vertex = p.getByRole('button', { name: /^Boundary vertex 1,/ }); await vertex.scrollIntoViewIfNeeded(); const v = await vertex.boundingBox(), svg = await p.locator('main svg.canvas').boundingBox();
      await p.mouse.move(v.x + v.width / 2, v.y + v.height / 2); await p.mouse.down(); await p.mouse.move(svg.x - 150, svg.y + svg.height + 150, { steps: 6 }); await p.mouse.up();
      check(`${width}: dragging past the local origin stops at 0 m`, (await points(p))[0].x === 0 && (await points(p))[0].y === 0);
      await button(p, 'Undo').click(); check(`${width}: one draft Undo restores the entire drag`, JSON.stringify(await points(p)) === JSON.stringify(original));
      await button(p, 'Cancel boundary').click(); check(`${width}: Cancel preserves accepted geometry after drag`, JSON.stringify((await state(p)).baseSpec.boundary) === JSON.stringify(drawn));
      if (width === 1440) {
        await button(p, 'Edit boundary').click();
        const x = p.getByRole('spinbutton', { name: 'Boundary vertex 1 x', exact: true }); await x.fill('-1');
        check('typed negative coordinate remains an explicit error and blocks Apply', await button(p, 'Apply boundary').isDisabled() && /between 0 and 500/.test(await p.locator('#boundary-error').innerText()));
        await x.fill('501'); check('typed coordinate beyond 500 remains an explicit error', await button(p, 'Apply boundary').isDisabled() && await x.inputValue() === '501'); await button(p, 'Cancel boundary').click();
        // Deliberately pan/zoom away from the valid workspace before adding points.
        await button(p, 'Draw site').first().click(); await button(p, 'Zoom out').click(); await p.locator('.toolbar').getByRole('button', { name: 'Pan', exact: true }).click();
        const paper = await p.locator('main svg.canvas').boundingBox();
        await p.mouse.move(paper.x + paper.width * .5, paper.y + paper.height * .5); await p.mouse.down(); await p.mouse.move(paper.x + paper.width * .9, paper.y + paper.height * .5, { steps: 5 }); await p.mouse.up();
        await p.getByRole('button', { name: 'Select', exact: true }).first().click(); await p.mouse.click(paper.x + paper.width * .1, paper.y + paper.height * .5);
        check('drawing on shaded out-of-range paper stops at the workspace edge', (await points(p)).length === 1 && inRange(await points(p)) && (await points(p))[0].x === 0);
        await button(p, 'Cancel boundary').click();
        // A high-coordinate accepted outline checks upper limits without changing the engine limit.
        await p.evaluate(() => { const l = JSON.parse(localStorage.getItem('unbuilt.projects.v1')), e = l.projects.find(x => x.id === l.activeId); e.project.state.baseSpec = { ...e.project.state.baseSpec, w: 490, h: 490, boundary: [{ x: 400, y: 400 }, { x: 490, y: 400 }, { x: 490, y: 490 }, { x: 400, y: 490 }] }; localStorage.setItem('unbuilt.projects.v1', JSON.stringify(l)); });
        await p.reload(); await p.getByText('Saved in this browser', { exact: true }).waitFor(); await button(p, 'Edit boundary').click();
        const high = p.getByRole('button', { name: /^Boundary vertex 3,/ }), r = await high.boundingBox(), canvas = await p.locator('main svg.canvas').boundingBox();
        await p.mouse.move(r.x + r.width / 2, r.y + r.height / 2); await p.mouse.down(); await p.mouse.move(canvas.x + canvas.width + 200, canvas.y - 200, { steps: 6 }); await p.mouse.up();
        check('dragging beyond upper workspace edges stops at 500 m', (await points(p))[2].x === 500 && (await points(p))[2].y === 500 && await button(p, 'Apply boundary').isEnabled());
        const atMax = p.getByRole('button', { name: 'Boundary vertex 3, 500, 500 meters', exact: true }); await atMax.focus(); await p.keyboard.press('ArrowUp'); await p.keyboard.press('Shift+ArrowRight');
        check('arrow and Shift+arrow edits cannot exceed 500 m', (await points(p))[2].x === 500 && (await points(p))[2].y === 500);
        await button(p, 'Undo').click();
        check('arrows stopped at an edge do not add empty Undo steps', (await points(p))[2].x === 490 && (await points(p))[2].y === 490);
        await button(p, 'Cancel boundary').click();
      }
      await c.close(); current = null;
    }
    check('no uncaught browser errors', errors.length === 0);
    fs.writeFileSync(`${out}/results.json`, JSON.stringify({ checks, errors }, null, 2)); console.log(`ALL ${checks.length} POINTER RANGE CHECKS PASS`);
  } catch (e) { if (current) { await current.screenshot({ path: `${out}/failure.png`, fullPage: true }); fs.writeFileSync(`${out}/failure.txt`, e.stack + '\n' + await current.locator('body').innerText()); } throw e; } finally { await b.close(); }
})();
