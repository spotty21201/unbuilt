// Run against the production preview and tool server. PLAYWRIGHT_MODULE can
// point to an installed Playwright module without adding an app dependency.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const out = 'evidence/polygon-workbench';
const origin = process.env.UNBUILT_TEST_URL || 'http://localhost:5173';
const checks = [], errors = [];
const check = (name, test) => { assert.ok(test, name); checks.push(name); console.log(`PASS ${name}`); };
const state = p => p.evaluate(() => JSON.parse(localStorage.getItem('unbuilt.project.v1')).state);
async function point(p,x,y) { return p.locator('main svg.canvas').evaluate((el,pt)=>{const q = new DOMPoint(28+pt.x*4.8666666667,28+(100-pt.y)*4.8666666667).matrixTransform(el.getScreenCTM()); return {x:q.x,y:q.y};},{x,y}); }
async function draw(p) {
 await p.getByRole('button',{name:'Draw site',exact:true}).last().click();
 for(const [x,y] of [[0,0],[120,0],[120,100],[50,100],[0,60]]) {const q=await point(p,x,y);await p.mouse.click(q.x,q.y);}
 await p.getByRole('button',{name:/^Boundary vertex 1,/}).click();
}
async function drag(p,locator,x,y) {await p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));const b=await locator.locator('.boundary-point').boundingBox(); const q=await point(p,x,y); await p.mouse.move(b.x+b.width/2,b.y+b.height/2);await p.mouse.down();await p.mouse.move(q.x,q.y,{steps:8});await p.mouse.up();}
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch();
 const p=await browser.newPage({viewport:{width:1440,height:900}});p.setDefaultTimeout(7000);p.on('pageerror',e=>errors.push(e.message));
 try {
 await p.goto(origin);await p.getByText('Saved in this browser',{exact:true}).waitFor();
 const asset=await p.locator('script[src]').getAttribute('src');
 for(const [width,height] of [[1440,900],[1024,768],[375,812]]){await p.setViewportSize({width,height});if(width===375 && await p.getByRole('button',{name:'Hide controls',exact:true}).count())await p.getByRole('button',{name:'Hide controls',exact:true}).click();await p.screenshot({path:`${out}/default-${width}.png`});check(`default ${width}px has no horizontal overflow`,await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 await p.setViewportSize({width:1440,height:900});
 // Mouse drawing, closed by selecting the first vertex.
 await draw(p);check('closed polygon area matches hand-calculated 11,000 m²',/11,000 m²/.test(await p.locator('.boundary-area').innerText()));
 check('drawing leaves accepted rectangle untouched',(await state(p)).baseSpec.boundary===undefined);
 await p.screenshot({path:`${out}/boundary-draft.png`});
 await p.getByRole('button',{name:'Apply boundary',exact:true}).click();
 check('polygon applies as 5 vertices',(await state(p)).baseSpec.boundary.length===5);
 check('supported spine contains 18 homes and measures 720 m² road',/18 homes/.test(await p.locator('.docksummary').innerText()) && /Road 720 m²/.test(await p.locator('.docksummary').innerText()));
 const accepted=JSON.stringify((await state(p)).baseSpec);
 await p.getByRole('button',{name:'Undo',exact:true}).click();check('Undo restores rectangle',(await state(p)).baseSpec.boundary===undefined);
 await p.getByRole('button',{name:'Redo',exact:true}).click();check('Redo restores complete polygon',JSON.stringify((await state(p)).baseSpec)===accepted);
 // Vertex drag, midpoint insertion, keyboard movement and removal.
 await p.getByRole('button',{name:'Edit boundary',exact:true}).click();
 const sizeBefore=await p.getByRole('button',{name:/^Boundary vertex 4,/}).locator('.boundary-point').boundingBox();await p.getByRole('button',{name:'Zoom in',exact:true}).first().click();const sizeAfter=await p.getByRole('button',{name:/^Boundary vertex 4,/}).locator('.boundary-point').boundingBox();check('boundary handles retain screen size while zooming',Math.abs(sizeBefore.width-sizeAfter.width)<.5);await p.getByRole('button',{name:'Fit site',exact:true}).first().click();
 await drag(p,p.getByRole('button',{name:/^Boundary vertex 4,/}),60,100);
 check('drag updates actual coordinate',await p.getByRole('spinbutton',{name:'Boundary vertex 4 x',exact:true}).inputValue()==='60');
 check('drag updates valid polygon area',/10,800 m²/.test(await p.locator('.boundary-area').innerText()));
 await p.getByRole('button',{name:'Undo',exact:true}).click();check('draft Undo reverts a complete drag gesture',await p.getByRole('spinbutton',{name:'Boundary vertex 4 x',exact:true}).inputValue()==='50');await p.getByRole('button',{name:'Redo',exact:true}).click();check('draft Redo restores the drag gesture',await p.getByRole('spinbutton',{name:'Boundary vertex 4 x',exact:true}).inputValue()==='60');
 await p.getByRole('button',{name:'Add boundary vertex after 5',exact:true}).click();check('midpoint adds a sixth vertex',await p.locator('.boundary-coordinates fieldset').count()===6);
 const v6=p.getByRole('button',{name:/^Boundary vertex 6,/});await v6.focus();await p.keyboard.press('ArrowRight');check('keyboard moves focused vertex by 1 m',await p.getByRole('spinbutton',{name:'Boundary vertex 6 x',exact:true}).inputValue()==='1');await p.keyboard.press('Delete');check('Delete removes focused boundary vertex',await p.locator('.boundary-coordinates fieldset').count()===5);
 await p.getByRole('button',{name:'Apply boundary',exact:true}).click();
 await p.getByRole('button',{name:'Undo',exact:true}).click();check('Undo combines boundary edits into one step',JSON.stringify((await state(p)).baseSpec)===accepted);
 await p.getByRole('button',{name:'Redo',exact:true}).click();await p.getByRole('button',{name:'Undo',exact:true}).click();
 // Invalid crossing: preserve accepted plan, make correction possible, cancel.
 await p.getByRole('button',{name:'Edit boundary',exact:true}).click();await p.getByRole('spinbutton',{name:'Boundary vertex 2 x',exact:true}).fill('20');await p.getByRole('spinbutton',{name:'Boundary vertex 2 y',exact:true}).fill('100');
 check('crossed geometry explains invalidity',/cross|overlap|repeat/.test(await p.locator('.boundary-editor .error').innerText()));
 check('invalid boundary cannot apply',await p.getByRole('button',{name:'Apply boundary',exact:true}).isDisabled());check('invalid draft never overwrites accepted geometry',JSON.stringify((await state(p)).baseSpec)===accepted);
 await p.screenshot({path:`${out}/boundary-invalid.png`});
 await p.getByRole('spinbutton',{name:'Boundary vertex 2 x',exact:true}).fill('120');await p.getByRole('spinbutton',{name:'Boundary vertex 2 y',exact:true}).fill('0');check('corrected geometry enables Apply',await p.getByRole('button',{name:'Apply boundary',exact:true}).isEnabled());
 await p.keyboard.press('Escape');check('Escape cancels edit',await p.locator('.boundary-editor').count()===0);check('Cancel keeps accepted geometry',JSON.stringify((await state(p)).baseSpec)===accepted);
 await p.reload();await p.getByText('11,000 m² · 5 vertices',{exact:false}).first().waitFor();check('save/reload preserves polygon coordinates',JSON.stringify((await state(p)).baseSpec)===accepted);
 // Other objects: select a lot, apply a valid reshape, undo; edit open space.
 await p.getByRole('button',{name:'Homes',exact:true}).click();await p.getByLabel('Lot',{exact:true}).selectOption('0');await p.getByRole('button',{name:'Reshape lot',exact:true}).click();await p.getByRole('button',{name:'Add corner (longest edge)',exact:true}).click();await p.getByRole('button',{name:'Apply reshape',exact:true}).click();check('lot editing persists a polygon',Object.values((await state(p)).lots)[0].length===5);await p.getByRole('button',{name:'Undo',exact:true}).click();
 await p.getByRole('button',{name:'Open space A',exact:true}).click();await p.getByRole('button',{name:'Unlock to edit',exact:true}).click();await p.getByText('Width, depth, position (meters)',{exact:false}).click();await p.getByLabel('Distance from west',{exact:true}).fill('77');await p.getByRole('button',{name:'Apply draft',exact:true}).click();check('open space edit commits inside polygon',(await state(p)).green.x===77);await p.getByRole('button',{name:'Undo',exact:true}).click();
 // Request -> proposal -> deterministic search -> preview -> comparison.
 await p.getByRole('button',{name:'Send',exact:true}).click();await p.getByRole('button',{name:'Accept and run',exact:true}).click();check('search produces distinct supported alternatives',await p.locator('.optpick').count()>=2);
 await p.locator('.optpick').nth(1).click();check('preview labels unapplied changes',await p.locator('.previewbar').count()===1);
 await p.getByRole('button',{name:'Show options',exact:true}).click();const option='spine-f11';await p.getByLabel('Plan B',{exact:true}).selectOption(option);await p.getByRole('button',{name:'Expand comparison',exact:true}).click();check('comparison draws two different polygon plans',await p.locator('.compare-grid svg.canvas').count()===2 && /18 homes/.test(await p.locator('.compare-grid').innerText()) && /15 homes/.test(await p.locator('.compare-grid').innerText()));await p.screenshot({path:`${out}/comparison.png`,fullPage:true});await p.getByRole('button',{name:'Dock comparison',exact:true}).click();
 await p.getByRole('button',{name:/^Ask about Open space A/}).click();await p.getByRole('button',{name:'Why did it change?',exact:true}).click();await p.getByText(/Measured by the tool server/).waitFor();check('explanation measured by live deterministic tool server',/tool server/.test(await p.locator('.assistant').innerText()));await p.locator('.assistant .kv').scrollIntoViewIfNeeded();check('assistant measurements fit inspector width',await p.locator('.assistant .kv dd').evaluateAll(es=>es.every(e=>e.getBoundingClientRect().right<=document.querySelector('.inspector-col').getBoundingClientRect().right)));await p.screenshot({path:`${out}/measured-explanation.png`});
 await p.locator('.assump summary').click();await p.getByLabel('Owner expectation (Rp bn)',{exact:true}).fill('11');check('input change clears measured answer',!(/Measured by the tool server/.test(await p.locator('.assistant').innerText())));check('input change removes stale preview',await p.locator('.previewbar').count()===0);
 // Hold a real server response, edit input, release it and reject the stale result.
 await p.getByLabel('Owner expectation (Rp bn)',{exact:true}).fill('10');if(!await p.locator('.previewbar').count())await p.locator('.optpick').nth(1).click();
 let release;const gate=new Promise(r=>release=r);let entered;const started=new Promise(r=>entered=r);
 await p.route('**/api/explain',async route=>{const response=await route.fetch();entered();await gate;await route.fulfill({response}).catch(()=>{});});
 await p.getByRole('button',{name:'Why did it change?',exact:true}).click();await started;await p.getByLabel('Owner expectation (Rp bn)',{exact:true}).fill('12');release();await p.waitForTimeout(200);check('in-flight response cannot overwrite changed scenario',!(/Measured by the tool server/.test(await p.locator('.assistant').innerText())));await p.unroute('**/api/explain');
 // Restore assumption then apply an actual candidate.
 await p.getByLabel('Owner expectation (Rp bn)',{exact:true}).fill('10');if(!await p.locator('.previewbar').count())await p.locator('.optpick').nth(1).click();await p.locator('.previewbar').getByRole('button',{name:/^Apply/}).click();check('candidate Apply preserves authoritative polygon',JSON.stringify((await state(p)).baseSpec)===accepted);
 await p.getByRole('button',{name:'Undo',exact:true}).click();
 // View controls work over road/lot geometry; camera never changes quantities.
 await p.getByRole('button',{name:'Pan (H)',exact:true}).click();const svg=p.locator('main svg.canvas');const vb=await svg.getAttribute('viewBox');const parcel=p.locator('main .parcel').first();const rect=await parcel.boundingBox();await p.mouse.move(rect.x+10,rect.y+10);await p.mouse.down();await p.mouse.move(rect.x+55,rect.y+25,{steps:6});await p.mouse.up();check('Pan works when starting on a lot',vb!==await svg.getAttribute('viewBox'));await p.getByRole('button',{name:'Fit site',exact:true}).first().click();
 // Export/import accepted polygon and exact financial inputs.
 if(await p.getByRole('button',{name:'Details',exact:true}).count())await p.getByRole('button',{name:'Details',exact:true}).click();await p.getByRole('tab',{name:/Record/}).click();const downloadPromise=p.waitForEvent('download');await p.getByRole('button',{name:'Export record (JSON)',exact:true}).click();const dl=await downloadPromise;await dl.saveAs(`${out}/polygon-record.json`);const record=JSON.parse(fs.readFileSync(`${out}/polygon-record.json`));check('export contains polygon and correct currency units',record.state.site.boundary.length===5 && record.state.site.areaM2===11000 && record.state.assumptions.assumedPriceRp===850e6);
 await p.getByLabel(/Import project JSON/).setInputFiles(`${out}/polygon-record.json`);await p.getByText(/Imported project file.*polygon-record/).first().waitFor();check('record import retains geometry, owner units and target',(await state(p)).ownerS==='10' && (await state(p)).targetS==='15' && JSON.stringify((await state(p)).baseSpec)===accepted);
 // Entrance editing and zoom preserve the same polygon and measured plan.
 await p.locator('.objlist').getByRole('button',{name:'Site',exact:true}).click();const entrance=p.getByLabel('Distance from south (m)',{exact:true});await entrance.fill('51');await entrance.press('Tab');check('entrance coordinate edit stays connected on polygon',(await state(p)).entrance.offset===51);await p.getByRole('button',{name:'Undo',exact:true}).click();
 await p.getByRole('button',{name:'Select (V)',exact:true}).click();const entryMarker=p.locator('main .entrance').first();const gb=await entryMarker.boundingBox();const gp=await point(p,0,52);await p.mouse.move(gb.x+gb.width/2,gb.y+gb.height/2);await p.mouse.down();await p.mouse.move(gp.x,gp.y,{steps:6});await p.mouse.up();check('entrance drag validates on polygon boundary',(await state(p)).entrance.offset===52);await p.getByRole('button',{name:'Undo',exact:true}).click();
 const qBefore=await p.locator('.docksummary').innerText();await p.getByRole('button',{name:'Zoom in',exact:true}).first().click();check('view zoom never changes measured outcomes',await p.locator('.docksummary').innerText()===qBefore);await p.getByRole('button',{name:'Fit site',exact:true}).first().click();
 // Unsupported boundary remains saved and editable, with no outside roads/lots or precise finance.
 await p.getByRole('button',{name:'Edit boundary',exact:true}).click();await p.getByRole('spinbutton',{name:'Boundary vertex 5 y',exact:true}).fill('40');await p.getByRole('button',{name:'Apply boundary',exact:true}).click();check('unsupported shape blocks layout and precise economics',/Layout unavailable/.test(await p.locator('.docksummary').innerText()) && await p.locator('main .road').count()===0 && await p.locator('main .parcel').count()===0);if(!await p.locator('.assistant').count())await p.getByRole('button',{name:'Ask about Site',exact:true}).click();await p.getByRole('button',{name:'What is true?',exact:true}).click();check('unpriced assistant facts retain the real polygon remainder',/10,500 m² unallocated remainder/.test(await p.locator('.assistant').innerText()));await p.screenshot({path:`${out}/unsupported-boundary.png`});await p.getByRole('button',{name:'Undo',exact:true}).click();
 for(const [width,height] of [[1440,900],[1024,768],[375,812]]){await p.setViewportSize({width,height});if(width===375){await p.screenshot({path:`${out}/polygon-375-full.png`,fullPage:true});if(await p.getByRole('button',{name:'Hide controls',exact:true}).count())await p.getByRole('button',{name:'Hide controls',exact:true}).click();}await p.screenshot({path:`${out}/polygon-${width}.png`});check(`polygon ${width}px no horizontal overflow`,await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 // Representative touch uses a touch-enabled context and native touch events.
 const tc=await browser.newContext({viewport:{width:375,height:812},hasTouch:true,isMobile:true});const t=await tc.newPage();await t.goto(origin);await t.getByRole('button',{name:'Draw site',exact:true}).first().tap();await t.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));for(const [x,y] of [[0,0],[120,0],[120,100],[50,100],[0,60]]){const q=await point(t,x,y);await t.touchscreen.tap(q.x,q.y);}await t.getByRole('button',{name:/^Boundary vertex 1,/}).tap();check('touch can draw and close an irregular boundary',/11,000 m²/.test(await t.locator('.boundary-area').innerText()));
 const handle=t.getByRole('button',{name:/^Boundary vertex 4,/});await handle.scrollIntoViewIfNeeded();const hb=await handle.locator('.boundary-point').boundingBox();const target=await point(t,60,100);const cdp=await tc.newCDPSession(t);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:hb.x+hb.width/2,y:hb.y+hb.height/2}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:target.x,y:target.y}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});check('touch drag reshapes vertex',await t.getByRole('spinbutton',{name:'Boundary vertex 4 x',exact:true}).inputValue()==='60');await t.screenshot({path:`${out}/touch-boundary.png`,fullPage:true});await tc.close();
 check('no uncaught browser errors',errors.length===0);
 fs.writeFileSync(`${out}/browser-results.json`,JSON.stringify({asset,checks,errors,touch:'Chromium touch emulation; physical device not tested'},null,2));
 console.log(`ALL ${checks.length} BROWSER CHECKS PASS`);
 }catch(e){await p.screenshot({path:`${out}/failure.png`,fullPage:true});fs.writeFileSync(`${out}/browser-failure.txt`,e.stack+'\n'+await p.locator('body').innerText());throw e;}finally{await browser.close();}
})();
