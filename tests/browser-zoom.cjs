// Actual desktop browser zoom via chrome.tabs.setZoom, independently checked
// through getZoom and viewport/DPR. Run with xvfb-run on a headless host.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'unbuilt-zoom-'));
const ext = path.join(dir,'extension'); fs.mkdirSync(ext);
fs.writeFileSync(path.join(ext,'manifest.json'),JSON.stringify({manifest_version:3,name:'Local browser zoom check',version:'1.0',permissions:['tabs'],background:{service_worker:'worker.js'}}));
fs.writeFileSync(path.join(ext,'worker.js'),"chrome.tabs.onUpdated.addListener((id, info, tab) => { if (info.status === 'complete' && tab.url?.startsWith('http://localhost:5173')) chrome.tabs.setZoom(id, 2); });");
(async()=>{const ctx=await chromium.launchPersistentContext(path.join(dir,'profile'),{headless:false,viewport:null,ignoreDefaultArgs:['--disable-extensions'],args:['--window-size=1440,988',`--disable-extensions-except=${ext}`,`--load-extension=${ext}`]});
 try {
 const p=await ctx.newPage();await p.goto('about:blank');await p.waitForFunction(()=>innerWidth>0);const before=await p.evaluate(()=>({width:innerWidth,height:innerHeight,dpr:devicePixelRatio,outerWidth}));await p.goto('http://localhost:5173');await p.waitForFunction(()=>devicePixelRatio===2);
 const worker=ctx.serviceWorkers()[0];const browserZoom=await worker.evaluate(async()=>{const tabs=await chrome.tabs.query({});const tab=tabs.find(t=>t.url?.startsWith('http://localhost:5173'));return chrome.tabs.getZoom(tab.id);});
 const after=await p.evaluate(()=>({width:innerWidth,height:innerHeight,dpr:devicePixelRatio,outerWidth,overflow:document.documentElement.scrollWidth}));assert.equal(browserZoom,2);assert.equal(after.width,before.width/2);assert.equal(after.outerWidth,before.outerWidth);assert.ok(after.overflow<=after.width);
 const cdp=await ctx.newCDPSession(p);const capture=async(name)=>{const shot=await cdp.send('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});fs.writeFileSync(`evidence/polygon-workbench/${name}`,Buffer.from(shot.data,'base64'));};await capture('zoom-200-actual.png');
 await p.getByRole('button',{name:'Draw site',exact:true}).first().click();
 for(const [i,[x,y]] of [[0,0],[120,0],[120,100],[50,100],[0,60]].entries()) {await p.getByRole('button',{name:'Add coordinate vertex',exact:true}).click();await p.getByRole('spinbutton',{name:`Boundary vertex ${i+1} x`,exact:true}).fill(String(x));await p.getByRole('spinbutton',{name:`Boundary vertex ${i+1} y`,exact:true}).fill(String(y));}
 await p.getByRole('button',{name:'Close boundary',exact:true}).click();assert.match(await p.locator('.boundary-area').innerText(),/11,000 m²/);assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.evaluate(()=>scrollTo(0,0));await capture('zoom-200-editor.png');await p.getByRole('button',{name:'Apply boundary',exact:true}).click();const st=await p.evaluate(()=>JSON.parse(localStorage.getItem('unbuilt.project.v1')).state);assert.equal(st.baseSpec.boundary.length,5);
 fs.writeFileSync('evidence/polygon-workbench/zoom-results.json',JSON.stringify({before,after,browserZoom,asset:await p.locator('script[src]').getAttribute('src'),checks:['actual browser zoom equals 2','same window, half CSS width, DPR 2','no horizontal overflow','keyboard coordinate creation, close and apply at 200%']},null,2));console.log('PASS actual browser 200% zoom, reflow and keyboard boundary creation',JSON.stringify({before,after,browserZoom}));
 }finally{await ctx.close();fs.rmSync(dir,{recursive:true,force:true});}
})();
