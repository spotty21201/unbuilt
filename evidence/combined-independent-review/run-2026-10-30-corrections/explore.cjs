const fs=require('node:fs'); const readline=require('node:readline');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/home/spotty/projects/studioos/node_modules/playwright');
(async()=>{ const out=__dirname; const browser=await chromium.launch({headless:true}); const context=await browser.newContext({viewport:{width:1440,height:900},acceptDownloads:true}); const page=await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
await page.goto('http://localhost:5173'); console.log(await browser.version());console.log(await page.locator('body').innerText());
const snap=async name=>{await page.screenshot({path:out+'/'+name+'.png',fullPage:true});fs.writeFileSync(out+'/'+name+'.txt',await page.locator('body').innerText());};
const rl=readline.createInterface({input:process.stdin,terminal:false});for await(const line of rl){fs.appendFileSync(out+'/exploration-commands.jsonl',JSON.stringify(line)+'\n'); try {const result=await eval('(async()=>{'+line+'})()'); if(result!==undefined)console.log(JSON.stringify(result,null,2)); console.log('READY');}catch(e){console.log('ERROR '+e.stack);}}
fs.writeFileSync(out+'/exploration-errors.json',JSON.stringify(errors,null,2));await browser.close();})();
