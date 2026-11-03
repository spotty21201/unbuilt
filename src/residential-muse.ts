import {buildResidentialScenario,residentialNetwork,residentialInputErrors,residentialTransitionErrors,searchResidential,rankResidential,type ResidentialInputs,type ResidentialScenario} from './residential.ts';
import {prepareResidential,moveResidentialEntrance,type EndTreatment} from './prepare-residential.ts';
import {entranceList,distance,polygonSurface,subtractSurface} from './residential-site.ts';
import {streetSurface,surfaceArea} from './road-surfaces.ts';
export interface MuseFact{id:string;text:string}
export type MuseAction={kind:'test_alternatives';goal:'more-lots'|'less-road'|'better-mix'}|{kind:'prepare_layout';end:EndTreatment|null}|{kind:'fill_residual'}|{kind:'move_entrance';offset:number}|{kind:'shift_road';roadId:string;dx:number;dy:number}|{kind:'assign_product';groupId:string;productId:string}|{kind:'reshape_space';spaceId:string;vertex:number;dx:number;dy:number};
export type MuseAnswer={kind:'explanation';facts:MuseFact[];insight:string}|{kind:'clarification';question:string}|{kind:'proposal';action:MuseAction;label:string};
export interface MuseTrial{scenario?:ResidentialScenario;candidates:ResidentialScenario[];tested:number;conflicts:string[];message:string;chooseEnd?:boolean}
const fmt=(n:number|null,d=1)=>n===null?'unavailable':n.toLocaleString('en-US',{maximumFractionDigits:d});
export function museBaseline(raw:unknown){const errors=residentialInputErrors(raw);if(errors.length)throw Error(errors[0]);return buildResidentialScenario(raw as ResidentialInputs,'muse_context','Current residential plan');}
export function museFacts(s:ResidentialScenario):MuseFact[]{const i=s.inputs,r=s.result;return[
 {id:'yield',text:`${r.counts.valid} screened valid lots; ${r.counts.unresolved} unresolved; ${r.counts.invalid} invalid.`},
 {id:'mix',text:`${i.mix.mode==='percent'?'Target percentages':'Target counts'} by ${i.mix.basis==='units'?'valid lot count':'valid residential lot area'}: ${r.schedule.map(p=>`${i.products.find(x=>x.id===p.productId)?.name}: target ${i.mix.targets[p.productId]}, actual ${p.valid} valid lots / ${fmt(p.actual,2)}%, ${p.mix}`).join('; ')}. ${i.mix.mandatory?'Mandatory':'Preferred'}; tolerance ${i.mix.tolerance}.`},
 {id:'roads',text:`${fmt(r.roadLength)}m internal centreline; ${fmt(r.land.roads)}m² unioned corridor; ${r.roadPerLot===null?'per-lot length unavailable — no valid lots':`${fmt(r.roadPerLot)}m per valid lot`}. Corridor ${i.roadRules.corridor}m; ${i.roadRules.confirmed?'recorded':'provisional'}.`},
 {id:'land',text:`${fmt(r.land.gross)}m² fixed gross; ${fmt(r.validLotArea)}m² valid lots; ${fmt(r.land.protected)}m² protection; ${fmt(r.land.flexible)}m² flexible space; ${fmt(r.land.residual)}m² residual. Gap ${fmt(r.land.gap,4)}m²; overlap ${fmt(r.land.overlap,4)}m².`},
 {id:'residual',text:`Residual trials ${i.fill?'already included':'not yet run'}. ${Object.entries(r.skipped).slice(0,8).map(([why,n])=>`${n} rejected positions: ${why}`).join('; ')||'No generated residual positions yet.'} ${(r.residualRegions??[]).slice(0,4).map(x=>x.reason).join('; ')} Bounded tests do not prove global impossibility.`},
 {id:'cost',text:`Rp${fmt(r.cost,0)} priced scopes only. ${r.missingCosts.join('; ')||'Recorded scopes priced'}. Not a full development estimate.`},
 {id:'constraints',text:r.issues.filter(x=>x.state==='fail').map(x=>x.message).slice(0,6).join('; ')||'No failed implemented checks in the current inputs.'},
 {id:'unknowns',text:r.issues.filter(x=>x.state==='unknown').map(x=>x.message).slice(0,6).join('; ')||'External survey, engineering, house feasibility and statutory checks remain separate.'},
 {id:'stage',text:i.phase==='site'||i.inputCommitments?'Input commitments only; roads, lots and required future park access are not completed.':'Measured layout. Proposed edits require review and acceptance.'},
 {id:'locks',text:`Boundary ${i.boundaryLocked?'locked':'unlocked'}; entrance ${i.entrance.locked?'locked':'adjustable'}. Fixed/protected features and manual street/group/lot locks must remain held.`},
];}
export function museContext(s:ResidentialScenario,selected:string){const i=s.inputs;return{selected,selection:s.result.lots.find(l=>selected===`lot:${l.id}`)??null,objective:i.objective,objectiveNote:i.objectiveNote,fixed:i.fixedRequirements,preferences:i.preferences,unknowns:i.unknowns,findings:museFacts(s),boundary:i.boundary,entrance:i.entrance,roadRules:i.roadRules,roads:i.roads,products:i.products.map(({rate,...p})=>p),groups:i.groups,spaces:i.spaces.map(({source,bufferSource,...s})=>{void source;void bufferSource;return s;}),mix:i.mix,heldLotCount:i.lockedLots.length};}
const record=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const num=(v:unknown,limit=20):v is number=>typeof v==='number'&&Number.isFinite(v)&&Math.abs(v)<=limit;
export function validateMuseChoice(name:string,raw:unknown,s:ResidentialScenario):MuseAnswer{
 if(!record(raw))throw Error('Muse returned an unsupported proposal.');const a=raw,i=s.inputs;
 const keys=(allowed:string[])=>{if(Object.keys(a).some(k=>!allowed.includes(k)))throw Error('Muse returned unsupported changes.');};
 if(name==='explain_plan'){keys(['factIds','insight']);if(a.insight!==undefined&&(typeof a.insight!=='string'||a.insight.length>320||/[\p{N}]/u.test(a.insight)))throw Error('Muse assessment must be brief and qualitative; quantities come from measured facts.');const facts=museFacts(s);if(!Array.isArray(a.factIds)||!a.factIds.length||a.factIds.length>3||a.factIds.some(id=>!facts.some(f=>f.id===id)))throw Error('Muse must use current measured facts.');return{kind:'explanation',insight:typeof a.insight==='string'?a.insight:'',facts:[...new Set(a.factIds)].map(id=>facts.find(f=>f.id===id)!)};}
 if(name==='clarify_request'){keys(['question']);if(typeof a.question!=='string'||!a.question.trim()||a.question.length>400)throw Error('Muse returned an invalid question.');return{kind:'clarification',question:a.question};}
 if(i.version===1)throw Error('Review the version 2 upgrade before asking Muse to edit this saved layout.');
 let action:MuseAction,label:string;
 if(name==='test_alternatives'){keys(['goal']);if(!['more-lots','less-road','better-mix'].includes(a.goal as string))throw Error('Choose a supported comparison objective.');action={kind:name,goal:a.goal as 'more-lots'|'less-road'|'better-mix'};label=a.goal==='less-road'?'Test shorter road layouts':a.goal==='better-mix'?'Test whole-section mix allocations':'Test higher-yield layouts';}
 else if(name==='prepare_layout'){keys(['end']);if(a.end!==null&&!['dead-end','cul-de-sac'].includes(a.end as string))throw Error('Choose street end treatment explicitly.');action={kind:name,end:a.end as EndTreatment|null};label='Prepare connected roads and lots';}
 else if(name==='fill_residual'){keys([]);action={kind:name};label='Test residual land with existing products';}
 else if(name==='move_entrance'){keys(['offset']);if(i.entrance.locked)throw Error('The entrance is locked. Unlock it deliberately in the entrance controls first.');if(!num(a.offset,200000)||a.offset<0)throw Error('Supply an entrance offset in metres.');action={kind:name,offset:a.offset};label=`Test entrance at ${fmt(a.offset)}m along its current boundary edge`;}
 else if(name==='shift_road'){keys(['roadId','dx','dy']);const r=i.roads.find(r=>r.id===a.roadId);if(!r||r.locked)throw Error('Choose an unlocked street.');if(!num(a.dx)||!num(a.dy)||(!a.dx&&!a.dy))throw Error('Supply a nonzero road shift up to 20m per axis.');action={kind:name,roadId:r.id,dx:a.dx,dy:a.dy};label=`Test ${r.name} shift (${fmt(a.dx)}, ${fmt(a.dy)})m`;}
 else if(name==='assign_product'){keys(['groupId','productId']);const g=i.groups.find(g=>g.id===a.groupId),p=i.products.find(p=>p.id===a.productId);if(!g||g.locked||!p)throw Error('Choose an unlocked section and an existing product.');action={kind:name,groupId:g.id,productId:p.id};label=`Test ${p.name} on the selected facing section`;}
 else if(name==='reshape_space'){keys(['spaceId','vertex','dx','dy']);const s=i.spaces.find(s=>s.id===a.spaceId);if(!s||s.kind!=='flexible'||s.locked)throw Error('Fixed protection and locked spaces cannot be moved.');if(!Number.isInteger(a.vertex)||Number(a.vertex)<0||Number(a.vertex)>=s.points.length||!num(a.dx)||!num(a.dy)||(!a.dx&&!a.dy))throw Error('Supply a valid vertex and nonzero displacement up to 20m per axis.');action={kind:name,spaceId:s.id,vertex:Number(a.vertex),dx:a.dx,dy:a.dy};label=`Test ${s.name} vertex adjustment`;}
 else throw Error('Muse requested an unsupported planning tool.');
 return{kind:'proposal',action,label};
}
export function shiftResidentialRoad(i:ResidentialInputs,id:string,dx:number,dy:number,index=-1){
 const r=i.roads.find(r=>r.id===id);if(!r||r.locked)throw Error('This street is locked.');const pinned=[...entranceList(i).flatMap(e=>i.roads.find(r=>r.id===e.roadId)?.path.slice(0,2)??[]),...i.roads.filter(r=>r.locked).flatMap(r=>r.path)],nodes=r.path.filter((p,k)=>(index<0||k===index)&&!pinned.some(q=>distance(p,q)<.001));if(!nodes.length)throw Error('The entrance connection is held at its gate and transition. Move the entrance itself, or a street beyond the transition.');for(const other of i.roads)other.path=other.path.map(p=>nodes.some(n=>distance(n,p)<.001)?{x:p.x+dx,y:p.y+dy}:p);
}
function testInfillRoads(base:ResidentialScenario){
 const i=base.inputs,candidates:ResidentialScenario[]=[],conflicts:string[]=[];
 const available=subtractSurface(polygonSurface(i.boundary),base.result.externalReservation??[],...i.spaces.filter(s=>s.prohibition!=='lots').map(s=>base.result.exclusions[s.id]));
 const products=i.products.filter(p=>(i.mix.targets[p.id]??0)>0),depths=[...new Set(products.flatMap(a=>products.map(b=>(a.depth+b.depth)/2)))],segments=i.roads.filter(r=>!r.locked).flatMap(r=>{const points=base.result.resolvedRoads?.find(x=>x.id===r.id)?.points??r.path;return points.slice(1).map((b,k)=>({a:points[k],b}));}),radius=i.roadRules.centrelineRadius??i.roadRules.corridor;
 let tested=0;
 // Test actual straight street sections; endpoints of a bent road do not describe its buildable frontage.
 trials:for(const depth of depths)for(const sign of [-1,1])for(const product of [...products,null])for(const {a,b} of segments){
  if(tested>=64)break trials;
  const length=distance(a,b);if(length*.7<=2*radius+.01)continue;
  const normal={x:-(b.y-a.y)/length,y:(b.x-a.x)/length},start={x:a.x+(b.x-a.x)*.15,y:a.y+(b.y-a.y)*.15},end={x:a.x+(b.x-a.x)*.85,y:a.y+(b.y-a.y)*.85},spacing=2*depth+i.roadRules.corridor,next=structuredClone(i),id=`muse_infill_${i.roads.length}_${tested}`;
  if(next.roads.some(r=>r.id===id))continue;
  next.roads.push({id,name:'Infill return loop',locked:false,path:[start,{x:start.x+normal.x*spacing*sign,y:start.y+normal.y*spacing*sign},{x:end.x+normal.x*spacing*sign,y:end.y+normal.y*spacing*sign},end],curves:[{vertex:1,radius},{vertex:2,radius}]});
  const assigned=product?[product]:products,weights=assigned.map(p=>(i.mix.targets[p.id]??0)*p.frontage),total=weights.reduce((n,w)=>n+w,0);let from=0;
  for(const [k,p] of assigned.entries()){const to=k===assigned.length-1?1:from+weights[k]/total;next.groups.push({id:`${id}_${p.id}`,roadId:id,from,to,productId:p.id,locked:false});from=to;}
  tested++;
  try{const errors=residentialTransitionErrors(i,next);if(errors.length){conflicts.push(errors[0]);continue;}
   const footprint=streetSurface({...residentialNetwork({...next,roads:[next.roads.at(-1)!]}),cornerRadius:0}).surface;
   if(surfaceArea(subtractSurface(footprint,available))>.01){conflicts.push('An added full-width road crosses the fixed boundary, held space or external-road reservation.');continue;}
   const s=buildResidentialScenario(next,id,'Additional connected road','Return loop with back-to-back lot-depth spacing');const failed=s.result.issues.filter(x=>x.state==='fail');if(failed.length){conflicts.push(failed[0].message);continue;}
   s.advantage=`${s.result.counts.valid-base.result.counts.valid} additional valid lots`;s.compromise=`${(s.result.roadLength-base.result.roadLength).toFixed(1)}m additional road; ${s.result.issues.filter(x=>x.state==='unknown').length} unresolved checks`;if(i.roadRules.centrelineRadius===null)s.assumptions=`Added return-loop centreline radius provisionally equals the ${radius}m corridor width; the project minimum radius remains unconfirmed.`;candidates.push(s);
  }catch(e){conflicts.push(e instanceof Error?e.message:String(e));}
 }
 return{candidates,tested,conflicts:[...new Set(conflicts)]};
}
export function executeMuseAction(base:ResidentialInputs,action:MuseAction):MuseTrial{
 const current=buildResidentialScenario(base,'muse_base','Current plan'),checked=validateMuseChoice(action.kind,(({kind,...args})=>args)(action),current);if(checked.kind!=='proposal')throw Error('Unsupported edit.');const i=structuredClone(base),result=(scenario:ResidentialScenario,tested=1):MuseTrial=>({scenario,candidates:[scenario],tested,conflicts:scenario.result.issues.filter(x=>x.state==='fail').map(x=>x.message),message:'Measured proposal — review before accepting.'});
 if(action.kind==='prepare_layout'){const found=prepareResidential(i,action.end??undefined);return{scenario:found.scenario,candidates:found.scenario?[found.scenario]:[],tested:found.tested,conflicts:found.conflicts,message:found.message,chooseEnd:found.status==='choose-end-treatment'};}
 if(action.kind==='test_alternatives'){
  const found=searchResidential(current,action.goal==='better-mix',true),infill=action.goal==='more-lots'?testInfillRoads(current):{candidates:[],tested:0,conflicts:[]},same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b),eligible=[...found.candidates,...infill.candidates].filter(s=>same(s.inputs.entrance,base.entrance)&&same(s.inputs.additionalEntrances,base.additionalEntrances)&&same(s.inputs.spaces,base.spaces));
  const deviation=(s:ResidentialScenario)=>s.result.schedule.reduce((n,p)=>n+Math.abs(s.inputs.mix.mode==='count'?p.valid-s.inputs.mix.targets[p.productId]:p.deviation??100),0);
  const ranked=action.goal==='less-road'?eligible.sort((a,b)=>a.result.roadLength-b.result.roadLength||b.result.counts.valid-a.result.counts.valid):action.goal==='better-mix'?eligible.sort((a,b)=>deviation(a)-deviation(b)||b.result.counts.valid-a.result.counts.valid):rankResidential(eligible.map(s=>({...s,inputs:{...s.inputs,objective:'yield' as const}}))).map(s=>({...s,inputs:{...s.inputs,objective:base.objective}}));
  const improving=ranked.filter(s=>action.goal==='less-road'?s.result.roadLength<current.result.roadLength-.001:action.goal==='better-mix'?deviation(s)<deviation(current)-.000001:s.result.counts.valid>current.result.counts.valid);
  return{scenario:improving[0],candidates:improving.slice(0,5),tested:found.tested+infill.tested,conflicts:[...new Set([...found.conflicts,...infill.conflicts])],message:improving.length?`Best improvement found among tested layouts; review the trade-offs.${action.goal==='more-lots'?' Tested added return loops and back-to-back lot-depth spacing; boundary lots still need their own road frontage.':''}`:'No improvement found among the supported trials with entrance and spaces held. Review rejected trials for the binding constraints. This does not prove no better layout exists.'};
 }
 if(action.kind==='move_entrance')moveResidentialEntrance(i,undefined,i.entrance.edge,action.offset);
 if(action.kind==='shift_road')shiftResidentialRoad(i,action.roadId,action.dx,action.dy);
 if(action.kind==='assign_product'){const g=i.groups.find(g=>g.id===action.groupId)!;for(const other of i.groups.filter(x=>x.roadId===g.roadId&&Math.min(x.to,g.to)-Math.max(x.from,g.from)>.000001)){if(other.locked&&other.productId!==action.productId)throw Error('The opposing section is locked.');other.productId=action.productId;}}
 if(action.kind==='reshape_space'){const s=i.spaces.find(s=>s.id===action.spaceId)!;s.points[action.vertex]={x:s.points[action.vertex].x+action.dx,y:s.points[action.vertex].y+action.dy};}
 if(action.kind==='fill_residual'){if(i.fill)return{candidates:[],tested:0,conflicts:[],message:'The current layout already includes supported residual-fill trials. Inspect its residual findings; no additional fit is demonstrated.'};i.fill=true;}
 const errors=residentialTransitionErrors(base,i);if(errors.length)throw Error(errors[0]);return result(buildResidentialScenario(i,'muse_proposal','Muse proposal'));
}
