// Scripted protocol fixture only. No real-model verification is implied.
import http from 'node:http';
export function createFixture(port) {
  const stats={calls:0,models:[],aborted:0};
  const server=http.createServer(async(req,res)=>{
    if(req.url==='/stats'){res.end(JSON.stringify(stats));return;}
    let text='';for await(const chunk of req)text+=chunk;
    const body=JSON.parse(text);stats.calls++;stats.models.push(body.model);
    const data=JSON.parse(body.messages.at(-1).content),request=(data.request??'').toLowerCase();
    const respond=(name,args)=>{if(!res.destroyed){res.setHeader('content-type','application/json');res.end(JSON.stringify({choices:[{message:{tool_calls:[{type:'function',function:{name,arguments:JSON.stringify(args)}}]}}]}));}};
    res.on('close',()=>{if(!res.writableEnded)stats.aborted++;});
    if(request.includes('timeout'))await new Promise(r=>setTimeout(r,21000));
    if(request.includes('slow'))await new Promise(r=>setTimeout(r,1500));
    if(request.includes('fail')){res.writeHead(429);res.end('fixture error, never expose this body');return;}
    if(request.includes('bad tool')){respond('apply_plan',{price:1});return;}
    if(request.includes('parallel')){res.end(JSON.stringify({choices:[{message:{tool_calls:[{},{}]}}]}));return;}
    if(request.includes('plain text')){res.end(JSON.stringify({choices:[{message:{content:'This plan has 999999 homes.'}}]}));return;}
    if(request.includes('connection'))respond('explain_measurements',{factIds:['connection']});
    else if(request.includes('explain'))respond('explain_measurements',{factIds:['homes','costs','gap','limits']});
    else if(request.includes('evidence'))respond('explain_limit',{reason:'evidence'});
    else if(request.includes('vague'))respond('clarify_request',{question:'Which design dimension or numeric cost assumption should we test?'});
    else respond('propose_experiment',{purpose:request.includes('frontage')?'design_yield':'cost_sensitivity',design:request.includes('frontage')?{frontage:11}:{},costs:request.includes('frontage')?{}:{constructionPerM2:4e6}});
  });
  return {server,stats,start:()=>new Promise(r=>server.listen(port,'127.0.0.1',r)),close:()=>new Promise(r=>server.close(r))};
}
