import {activeConnection,assertConnectionRevision,markConnection} from './ai-config.mjs';
import {setTimeout as delay} from 'node:timers/promises';
let busy=0;
export async function modelChoice(messages,signal,tools){
  const connection=activeConnection();
  if(busy>=2)throw Error('AI is busy. Try again shortly.');
  busy++;
  let stage='request',status;
  try{
    const meta=new URL(connection.endpoint).hostname==='api.meta.ai';
    const deadline=AbortSignal.any([signal,AbortSignal.timeout(meta?60_000:20_000)]),request={method:'POST',redirect:'error',headers:{'content-type':'application/json',authorization:`Bearer ${connection.key}`},body:JSON.stringify({model:connection.model,messages,tools,tool_choice:meta?'auto':'required',...(meta?{parallel_tool_calls:false}:{}),max_tokens:1600}),signal:deadline};let response;
    for(let attempt=0;;attempt++){
      try{response=await fetch(connection.endpoint,request);break;}
      catch(e){if(attempt||!['ENETUNREACH','EAI_AGAIN'].includes(e.cause?.code))throw e;await delay(500,undefined,{signal:deadline});}
    }
    status=response.status;stage='provider response';
    if(!response.ok){await response.body?.cancel();throw Error('upstream');}
    const reader=response.body.getReader(),chunks=[];let size=0;
    while(true){const{done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>256_000){await reader.cancel();throw Error('oversize');}chunks.push(value);}
    stage='tool response';const raw=JSON.parse(Buffer.concat(chunks).toString('utf8'));assertConnectionRevision(connection.revision);
    const calls=raw.choices?.[0]?.message?.tool_calls;
    if(!Array.isArray(calls)||calls.length!==1||calls[0].type!=='function'||typeof calls[0].function?.arguments!=='string')throw Error('invalid tool call');
    return{name:calls[0].function.name,args:JSON.parse(calls[0].function.arguments),revision:connection.revision};
  }catch(e){console.warn('AI planning request failed',{stage,status,type:e.name,code:e.cause?.code});markConnection(connection.revision,'error');throw Error(e.name==='TimeoutError'?'The AI connection took too long. Retry or continue editing the plan.':['ENETUNREACH','EAI_AGAIN'].includes(e.cause?.code)?'Muse cannot reach the model service. Retry when the connection is available. Your plan is unchanged.':'The AI connection did not return a usable planning response. Retry or continue editing the plan.');}finally{busy--;}
}
