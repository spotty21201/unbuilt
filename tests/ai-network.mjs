import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import assert from 'node:assert/strict';
const folder=fs.mkdtempSync(path.join(os.tmpdir(),'unbuilt-network-')),original=globalThis.fetch;
process.env.UNBUILT_AI_CONFIG=path.join(folder,'ai.json');
fs.writeFileSync(process.env.UNBUILT_AI_CONFIG,JSON.stringify({revision:1,active:'primary',routes:{primary:{label:'Test',endpoint:'https://model.invalid/completions',model:'fixture',key:'test-only-key'},alternate:{label:'Alternate',endpoint:'',model:'',key:''}}}));
try{
 const {modelChoice}=await import('../server/ai-model.mjs');let calls=0;
 const success=()=>new Response(JSON.stringify({choices:[{message:{tool_calls:[{type:'function',function:{name:'explain_plan',arguments:'{"factIds":["yield"]}'}}]}}]}));
 const ask=signal=>modelChoice([],signal??new AbortController().signal,[]);
 for(const code of ['ENETUNREACH','EAI_AGAIN']){calls=0;globalThis.fetch=async()=>{if(++calls===1)throw new TypeError('fetch failed',{cause:{code}});return success();};assert.equal((await ask()).name,'explain_plan');assert.equal(calls,2);console.log(`PASS ${code}: retry only the failed pre-connection attempt`);}
 calls=0;globalThis.fetch=async()=>{calls++;throw new TypeError('fetch failed',{cause:{code:'ENETUNREACH'}});};await assert.rejects(ask(),/cannot reach/);assert.equal(calls,2);console.log('PASS persistent unreachable connection ends after one retry');
 for(const failure of ['timeout','http','reset']){calls=0;globalThis.fetch=async()=>{calls++;if(failure==='http')return new Response('',{status:503});if(failure==='timeout')throw new DOMException('timeout','TimeoutError');throw new TypeError('fetch failed',{cause:{code:'ECONNRESET'}});};await assert.rejects(ask());assert.equal(calls,1);console.log(`PASS ${failure}: never repeat a potentially delivered model request`);}
 calls=0;const ctrl=new AbortController();globalThis.fetch=async()=>{calls++;throw new TypeError('fetch failed',{cause:{code:'ENETUNREACH'}});};const pending=ask(ctrl.signal);ctrl.abort();await assert.rejects(pending);assert.equal(calls,1);console.log('PASS cancellation stops before a second connection attempt');
 console.log('ALL 7 AI NETWORK CHECKS PASS (CONTROLLED TRANSPORT; NO PROVIDER CALLS)');
}finally{globalThis.fetch=original;fs.rmSync(folder,{recursive:true,force:true});}
