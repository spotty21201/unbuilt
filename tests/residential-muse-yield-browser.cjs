const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/home/spotty/projects/studioos/node_modules/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const O=process.env.UNBUILT_EVIDENCE_DIR||'evidence/muse-yield-followup/run-2026-11-03/browser';
const url=process.env.UNBUILT_TEST_URL||'http://100.117.187.86:5173';
const request='Can you maximize the yield, insert more roads and units. On edges put back to back lots.';
const checks=[],errors=[],exchanges=[],btn=(p,n)=>p.getByRole('button',{name:n,exact:true});
const check=(name,value)=>{assert.ok(value,name);checks.push(name);console.log('PASS '+name);};
const work=p=>p.evaluate(()=>{const l=JSON.parse(localStorage.getItem('unbuilt.projects.v1'));return l.projects.find(x=>x.id===l.activeId).project.state.residential;});
async function submit(p,text){await p.getByLabel('Ask Muse about this plan',{exact:true}).fill(text);await p.locator('.res-muse').getByRole('button',{name:'Ask Muse',exact:true}).click();}
fs.mkdirSync(O,{recursive:true});
(async()=>{const browser=await chromium.launch(),p=await browser.newPage({viewport:{width:1440,height:1100}});p.setDefaultTimeout(100000);p.on('pageerror',e=>errors.push(e.message));try{
 await p.goto(url);await btn(p,'Residential planning').click();await p.getByLabel('Import residential collection',{exact:true}).setInputFiles('evidence/master-planner-workflow/run-independent-2026-11-02/baseline-31.json');await p.getByText(/Imported accepted geometry/).waitFor();await p.locator('.res-primary').click();await p.waitForFunction(()=>!document.querySelector('#muse-request').disabled);
 const before=(await work(p)).accepted,started=Date.now();
 check('regression runs on actual HTTP network origin without secure-context randomUUID',await p.evaluate(()=>!isSecureContext&&typeof crypto.randomUUID==='undefined'));
 const response=p.waitForResponse(r=>r.url().endsWith('/api/ai/residential'));await submit(p,request);
 await btn(p,'Select Street 2').press('Enter');
 check('selecting a street keeps request text and pending feedback',await p.getByLabel('Ask Muse about this plan',{exact:true}).inputValue()===request&&await btn(p,'Stop Muse').isVisible());
 const received=await response,data=await received.json();exchanges.push({request,status:received.status(),data,elapsedMs:Date.now()-started});
 check('exact user request reaches real Muse Wonder and returns a yield-search intent',received.status()===200&&data.answer.kind==='proposal'&&data.answer.action.kind==='test_alternatives'&&data.answer.action.goal==='more-lots');
 await btn(p,'Preview on plan').waitFor();
 check('search terminates with measured additional-lot proposal',/31 → 34 valid lots/.test(await p.locator('.res-muse').innerText())&&/back-to-back/.test(await p.locator('.res-muse').innerText()));
 check('AI and geometry trials leave accepted state intact',JSON.stringify((await work(p)).accepted)===JSON.stringify(before));
 await p.locator('.res-muse').scrollIntoViewIfNeeded();await p.screenshot({path:`${O}/live-yield-proposal.png`});
 await btn(p,'Select Street 3').press('Enter');check('completed proposal survives another plan selection',await btn(p,'Preview on plan').isVisible());
 await btn(p,'Preview on plan').click();await p.locator('.res-delta').waitFor();check('checked proposal enables normal review and acceptance',await p.locator('.res-primary').isEnabled());await p.screenshot({path:`${O}/new-road-and-lots-preview.png`});
 await btn(p,'Cancel preview').click();check('cancel restores accepted geometry and quantities',JSON.stringify((await work(p)).accepted)===JSON.stringify(before));
 // Controlled tool result avoids another paid request; the geometric trial still runs in the real worker.
 await p.route('**/api/ai/residential',async route=>{const body=route.request().postDataJSON();await route.fulfill({json:{requestId:body.requestId,source:'ai-tool-call',answer:{kind:'proposal',action:{kind:'test_alternatives',goal:'more-lots'},label:'Test higher-yield layouts'}}});});
 await submit(p,'Repeat the measured yield trial');await btn(p,'Preview on plan').waitFor();await btn(p,'Preview on plan').click();await p.locator('.res-delta').waitFor();await p.locator('.res-primary').click();const after=(await work(p)).accepted;
 check('accept commits additional road with valid current schedules',after.inputs.roads.length===before.inputs.roads.length+1&&after.result.counts.valid===34&&!after.result.issues.some(x=>x.state==='fail'));
 await btn(p,'Undo residential').click();check('undo restores complete original scenario',JSON.stringify((await work(p)).accepted)===JSON.stringify(before));await btn(p,'Redo residential').click();check('redo restores full infill scenario',JSON.stringify((await work(p)).accepted)===JSON.stringify(after));
 await btn(p,'Save accepted').click();await btn(p,'Back to project').click();await p.reload();await btn(p,'Residential planning').click();check('save and reopen reproduce geometry and quantities',JSON.stringify((await work(p)).accepted)===JSON.stringify(after));
 await p.unroute('**/api/ai/residential');
 // Explicit failure injection: these cases are browser resilience tests, not live Muse evidence.
 await p.route('**/api/ai/residential',route=>route.fulfill({status:400,json:{error:'The AI connection did not return a usable planning response. Retry or continue editing the plan.'}}));
 await submit(p,'Test connection failure');await p.locator('.res-muse [role=alert]').waitFor();check('connection failure gives visible terminal feedback and permits retry',await p.locator('.res-muse').getByRole('button',{name:'Ask Muse',exact:true}).isEnabled()&&!await btn(p,'Stop Muse').count());await p.unroute('**/api/ai/residential');
 await p.route('**/api/ai/residential',async route=>{const body=route.request().postDataJSON();await route.fulfill({json:{requestId:body.requestId,source:'ai-tool-call',answer:{kind:'proposal',action:{kind:'test_alternatives',goal:'more-lots'},label:'Test higher-yield layouts'}}});});
 await p.evaluate(()=>{window.realWorker=Worker;window.Worker=class{constructor(){throw Error('Controlled worker launch failure');}};});await submit(p,'Test worker startup failure');await p.getByText('Layout test could not start. Retry or keep editing. Your plan is unchanged.',{exact:true}).waitFor();check('worker launch failure cannot leave thinking state stuck',!await btn(p,'Stop Muse').count());
 await p.evaluate(()=>{window.Worker=class{postMessage(){}terminate(){}};});await p.clock.install();await submit(p,'Test geometry deadline');await p.getByText('Testing geometry…',{exact:true}).waitFor();await p.clock.fastForward(120001);await p.getByText('Layout testing took too long. Try a smaller edit. Your plan is unchanged.',{exact:true}).waitFor();check('nonresponsive worker reaches deadline and releases interface',!await btn(p,'Stop Muse').count());await p.clock.resume();await p.evaluate(()=>window.Worker=window.realWorker);
 check('failure paths preserve accepted plan',JSON.stringify((await work(p)).accepted)===JSON.stringify(after));check('no uncaught browser errors',errors.length===0);
 fs.writeFileSync(`${O}/results.json`,JSON.stringify({checks,errors,exchanges,before,after,url,browser:browser.version(),note:'Only the exact user request uses live Muse Wonder. Repeat/failed-connection/worker tests use explicitly controlled responses.'},null,2));console.log(`ALL ${checks.length} YIELD BROWSER CHECKS PASS`);
 }catch(e){await p.screenshot({path:`${O}/failure.png`});fs.writeFileSync(`${O}/failure.txt`,e.stack+'\n'+await p.locator('body').innerText());fs.writeFileSync(`${O}/exchanges.json`,JSON.stringify(exchanges,null,2));throw e;}finally{await browser.close();}})();
