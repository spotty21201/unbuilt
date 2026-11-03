import {isPolygonOverlayError} from './geometry-errors.ts';
import type {Pt} from './polygon.ts';
import {signedArea,pointInPoly} from './polygon.ts';
import type {ExternalRoad,LotProduct,ResidentialInputs,ResidentialRoad,ResidentialScenario} from './residential.ts';
import {buildResidentialScenario,residentialInputErrors,residentialTransitionErrors} from './residential.ts';
import {type RoadSurface} from './road-surfaces.ts';
import {adjacentFrontages,entranceSuggestions,entranceAllowed,entrancePoint,entranceDirection,distance,lerp,lineIntervals,lineBuffer,polygonSurface,subtractSurface,bufferedSpace,bufferSurface,centrelineForRoad} from './residential-site.ts';
export type EndTreatment='dead-end'|'cul-de-sac';
export interface PrepareResult {status:'ready'|'choose-end-treatment'|'failed';scenario?:ResidentialScenario;tested:number;conflicts:string[];message:string;bestLoopYield:number;bestOpenYield:number}
export function resizeLotProduct(p:LotProduct,frontage:number,depth:number):LotProduct {
  const f=frontage/p.frontage,d=depth/p.depth;
  return {...p,frontage,depth,frontageMin:p.frontageMin*f,frontageMax:p.frontageMax*f,depthMin:p.depthMin*d,depthMax:p.depthMax*d,areaMin:p.areaMin*f*d,areaMax:p.areaMax*f*d,maxSaleableArea:p.maxSaleableArea*f*d};
}
export function roadOutsideBoundary(boundary:Pt[],alignment:Pt[],width:number):Pt[] {
  if(boundary.length<3||alignment.length<2||!Number.isFinite(width)||width<=0||width>100)throw Error('Establish a boundary, draw at least two points along its edges, and supply a positive external-road width up to 100 m.');
  const orientation=Math.sign(signedArea(boundary));
  const segments=alignment.slice(1).map((b,k)=>{const a=alignment[k],length=distance(a,b);if(length<.01)throw Error('Use distinct road points.');const mid=lerp(a,b,.5);const edge=boundary.findIndex((p,j)=>{const q=boundary[(j+1)%boundary.length],dx=q.x-p.x,dy=q.y-p.y,l=distance(p,q),at=(r:Pt)=>((r.x-p.x)*dx+(r.y-p.y)*dy)/l;return [a,mid,b].every(r=>Math.abs((r.x-p.x)*dy-(r.y-p.y)*dx)/l<.01&&at(r)>=-.01&&at(r)<=l+.01);});if(edge<0)throw Error('Place road points along site edges, including each boundary corner the road follows.');const p=boundary[edge],q=boundary[(edge+1)%boundary.length],l=distance(p,q),normal={x:(q.y-p.y)/l*orientation,y:-(q.x-p.x)/l*orientation};return {a:{x:a.x+normal.x*width/2,y:a.y+normal.y*width/2},b:{x:b.x+normal.x*width/2,y:b.y+normal.y*width/2}};});
  const result=[segments[0].a];for(let k=1;k<segments.length;k++){const s=segments[k-1],t=segments[k],u={x:s.b.x-s.a.x,y:s.b.y-s.a.y},v={x:t.b.x-t.a.x,y:t.b.y-t.a.y},det=u.x*v.y-u.y*v.x;if(Math.abs(det)<1e-8){result.push(s.b);continue;}const fraction=((t.a.x-s.a.x)*v.y-(t.a.y-s.a.y)*v.x)/det,p={x:s.a.x+fraction*u.x,y:s.a.y+fraction*u.y};if(distance(p,alignment[k])>width*4)throw Error('This sharp boundary corner needs a separately supplied main-road alignment.');result.push(p);}result.push(segments.at(-1)!.b);return result;
}
export function adjoiningRoad(i:ResidentialInputs,alignment:Pt[],width:number,name:string,id:string,permitAccess:boolean):ExternalRoad {
  const path=roadOutsideBoundary(i.boundary,alignment,width),road:ExternalRoad={id,name:name.trim()||'Existing main road',a:path[0],b:path[1],path,rightOfWay:width,carriageway:null,eligible:[],boundaryAlignment:structuredClone(alignment),source:'Planner-drawn adjoining road; survey and access assurance remain project inputs',locked:false};if(permitAccess)road.eligible=adjacentFrontages(i,road);return road;
}
export function prepareInputErrors(i:ResidentialInputs):string[]{
  const errors=residentialInputErrors(i);if(errors.length)return errors;
  if(i.version!==2)return ['Review the site-first workflow upgrade before preparing a layout.'];
  if(i.boundary.length<3)return ['Establish a closed site boundary first.'];
  if(!i.boundaryLocked)return ['Lock the accepted site boundary before preparing roads and lots.'];
  if(!i.externalRoads.length)return ['Draw the adjoining external road and enter its width first.'];
  if(!i.products.length)return ['Enter at least one lot product, frontage, depth and target percentage.'];
  if(i.mix.mode!=='percent'||i.mix.basis!=='units')return ['Prepare Layout uses percentages of lot count. Switch the setup table to unit percentages, retaining the original scenario until you accept.'];
  if(!i.externalRoads.some(r=>r.rightOfWay!==null&&r.eligible.length&&entranceSuggestions(i,r.id,Math.max(i.entrance.width,i.roadRules.corridor)).length))return ['No permitted entrance fits the actual adjoining road frontage. Check road position, width and access permission.'];
  return [];
}
function roadCentreLand(i:ResidentialInputs):RoadSurface {
  const boundaryClearance=lineBuffer([...i.boundary,i.boundary[0]],i.roadRules.corridor/2+.015,true);
  return subtractSurface(polygonSurface(i.boundary),boundaryClearance,...i.spaces.filter(s=>s.prohibition!=='lots').map(s=>bufferSurface(bufferedSpace(s),i.roadRules.corridor/2+(s.kind==='flexible'&&s.requiresAccess?-.005:.05))));
}
const direct=(a:Pt,b:Pt,free:RoadSurface)=>distance(a,b)<.005||lineIntervals(a,b,free).reduce((s,[lo,hi])=>s+hi-lo,0)>.999999;
function router(free:RoadSurface){
  // Visibility vertices preserve narrow passages without a grid-resolution guess.
  const raw=free.flat().flat(),stride=Math.max(1,Math.ceil(raw.length/120)),vertices=raw.filter((_,k)=>k%stride===0),edges=vertices.map(()=>[] as Array<{index:number;length:number}>);
  for(let a=0;a<vertices.length;a++)for(let b=a+1;b<vertices.length;b++)if(direct(vertices[a],vertices[b],free)){const length=distance(vertices[a],vertices[b]);edges[a].push({index:b,length});edges[b].push({index:a,length});}
  return (a:Pt,b:Pt):Pt[]|null=>{if(direct(a,b,free))return [a,b];const points=[...vertices,a,b],start=points.length-2,end=points.length-1,graph=edges.map(e=>[...e]);graph.push([],[]);for(const index of [start,end])for(let k=0;k<points.length;k++)if(k!==index&&direct(points[index],points[k],free)){const length=distance(points[index],points[k]);graph[index].push({index:k,length});graph[k].push({index,length});}
    const costs=points.map(()=>Infinity),previous=points.map(()=>-1),visited=new Set<number>();costs[start]=0;
    while(visited.size<points.length){let at=-1;for(let k=0;k<points.length;k++)if(!visited.has(k)&&(at<0||costs[k]<costs[at]))at=k;if(at<0||!Number.isFinite(costs[at]))return null;if(at===end){const path:Pt[]=[];for(let k=end;k>=0;k=previous[k]){path.unshift(points[k]);if(k===start)break;}return path;}visited.add(at);for(const e of graph[at])if(costs[at]+e.length<costs[e.index]){costs[e.index]=costs[at]+e.length;previous[e.index]=at;}}
    return null;
  };
}
function allocation(i:ResidentialInputs,weights:Record<string,number>){
  const products=i.products.filter(p=>(i.mix.targets[p.id]??0)>0),total=products.reduce((s,p)=>s+weights[p.id],0);i.groups=[];
  for(const [k,r] of i.roads.entries()){
    if(i.roads.length*products.length>64){const p=products[k%products.length];i.groups.push({id:`prepared_group_${k}`,roadId:r.id,from:0,to:1,productId:p.id,locked:false});continue;}
    let from=0;for(const [j,p] of products.entries()){const to=j===products.length-1?1:from+weights[p.id]/total;i.groups.push({id:`prepared_group_${k}_${p.id}`,roadId:r.id,from,to,productId:p.id,locked:false});from=to;}
  }
}
const mixError=(s:ResidentialScenario)=>s.result.schedule.reduce((n,p)=>n+Math.max(0,Math.abs(p.deviation??100)-s.inputs.mix.tolerance),0);
const hardFailures=(s:ResidentialScenario)=>s.result.issues.filter(x=>x.state==='fail'&&x.object!=='mix');
export function prepareResidential(inputs:ResidentialInputs,endTreatment?:EndTreatment):PrepareResult {
  const errors=prepareInputErrors(inputs);if(errors.length)return {status:'failed',tested:0,conflicts:errors,message:errors[0],bestLoopYield:0,bestOpenYield:0};
  if(endTreatment!==undefined&&!['dead-end','cul-de-sac'].includes(endTreatment))throw Error('Choose dead end or cul-de-sac explicitly.');
  const conflicts:string[]=[],choices:ResidentialScenario[]=[],openChoices:ResidentialScenario[]=[];let tested=0;
  const free=roadCentreLand(inputs),route=router(free),active=inputs.products.filter(p=>inputs.mix.targets[p.id]>0),depths=[...new Set([Math.max(...active.map(p=>p.depth)),active.reduce((s,p)=>s+p.depth*inputs.mix.targets[p.id]/100,0),Math.min(...active.map(p=>p.depth))])];
  const fixed=inputs.phase!=='site'&&(!inputs.inputCommitments&&inputs.entrance.locked||inputs.roads.some(r=>r.locked)||inputs.groups.some(g=>g.locked)||inputs.lockedLots.length>0||(inputs.additionalEntrances?.length??0)>0);
  if(fixed){return {status:'failed',tested:0,conflicts:['The existing layout contains fixed entrances, streets, groups, held lots or additional entrances. Keep editing that layout, or deliberately release the affected locks before replacing its structure.'],message:'Prepare Layout preserves accepted locks; it will not silently replace this held network.',bestLoopYield:0,bestOpenYield:0};}
  const preferred=inputs.inputCommitments&&inputs.roads.some(r=>r.id===inputs.entrance.roadId)&&entranceAllowed(inputs,inputs.entrance);
  const candidates=preferred?[structuredClone(inputs.entrance)]:inputs.externalRoads.flatMap(r=>entranceSuggestions(inputs,r.id,Math.max(inputs.entrance.width,inputs.roadRules.corridor))).slice(0,3);
  candidateSearch: for(const e of candidates){
    if(!entranceAllowed(inputs,e))continue;
    const gate=entrancePoint(inputs,e),v=entranceDirection(inputs,e),u={x:v.y,y:-v.x},local=(p:Pt)=>({x:(p.x-gate.x)*u.x+(p.y-gate.y)*u.y,y:(p.x-gate.x)*v.x+(p.y-gate.y)*v.y}),world=(x:number,y:number)=>({x:gate.x+u.x*x+v.x*y,y:gate.y+u.y*x+v.y*y});
    const corners=inputs.boundary.map(local),minU=Math.min(...corners.map(p=>p.x)),maxU=Math.max(...corners.map(p=>p.x)),minV=Math.min(...corners.map(p=>p.y)),maxV=Math.max(...corners.map(p=>p.y));
    for(const [depthIndex,depth] of depths.entries())for(const phase of [...new Set([...(depthIndex===2?[0]:[0,.35]),...inputs.spaces.filter(s=>s.kind==='flexible'&&s.requiresAccess).flatMap(s=>s.points.flatMap((a,k)=>{const b=s.points[(k+1)%s.points.length],length=distance(a,b),orientation=Math.sign(signedArea(s.points)),normal={x:(b.y-a.y)/length*orientation,y:-(b.x-a.x)/length*orientation};if(Math.abs((b.x-a.x)*u.y-(b.y-a.y)*u.x)/length>.001)return [];const level=local({x:(a.x+b.x)/2+normal.x*inputs.roadRules.corridor/2,y:(a.y+b.y)/2+normal.y*inputs.roadRules.corridor/2}).y,pitch=2*depth+inputs.roadRules.corridor,first=Math.max(minV+depth+inputs.roadRules.corridor/2,e.transition+inputs.roadRules.corridor/2);return [((level-first)%pitch+pitch)%pitch/pitch];}))])]){
      const headRadius=Math.max(inputs.roadRules.corridor*.75,inputs.vehicle?Math.hypot(inputs.vehicle.minRadius+inputs.vehicle.width/2,inputs.vehicle.length/2):0),margin=Math.max(depth+inputs.roadRules.corridor/2,endTreatment==='cul-de-sac'?headRadius+.05:0),pitch=2*depth+inputs.roadRules.corridor,first=Math.max(minV+margin,e.transition+inputs.roadRules.corridor/2)+phase*pitch,rows:Array<{level:number;lo:number;hi:number}>=[];
      for(let level=first;level<=maxV-margin+.001&&rows.length<18;level+=pitch){const a=world(minU-1,level),b=world(maxU+1,level),length=maxU-minU+2;for(const [lo,hi] of lineIntervals(a,b,free)){const x=minU-1+lo*length,y=minU-1+hi*length;if(y-x>=Math.min(...active.map(p=>p.frontage))*2)rows.push({level,lo:x,hi:y});}}
      for(const style of ['loop','open'] as const){
        const i=structuredClone(inputs);i.phase='layout';delete i.inputCommitments;i.fill=true;i.preparation={endTreatment:endTreatment??'dead-end',strategy:style==='loop'?'Connected loops':'Connected streets',tested:0};i.roads=[];i.groups=[];i.lockedLots=[];i.additionalEntrances=[];i.entrance={...e,id:'primary',roadId:preferred?e.roadId:'prepared_entry',locked:preferred?e.locked:false};
        const stub=world(0,e.transition+inputs.roadRules.corridor/2),seed=stub;
        if(!free.some(p=>pointInPoly(seed,p[0])&&!p.slice(1).some(h=>pointInPoly(seed,h)))){conflicts.push('The entrance transition does not fit the full corridor within developable land.');continue;}
        i.roads.push({id:i.entrance.roadId,name:'Entrance street',path:[gate,seed],locked:false});const targets:Pt[]=[seed];let hasEnds=style==='open';
        const addRoute=(points:Pt[],name:string,curves?:ResidentialRoad['curves'])=>{const id=`prepared_street_${i.roads.length}`;i.roads.push({id,name,path:points,locked:false,...(curves?.length?{curves}:{})});return id;};
        const connect=(point:Pt[])=>{const p=point[0];let best:Pt[]|null=null;for(const q of targets){const path=route(q,p);if(path&&(!best||pathLength(path)<pathLength(best)))best=path;}if(!best)return false;if(pathLength(best)>.01)addRoute(best,'Connecting street');targets.push(...point);return true;};
        if(style==='open')for(const row of rows){const trim=endTreatment==='cul-de-sac'?headRadius-inputs.roadRules.corridor/2+.05:0,lo=row.lo+trim,hi=row.hi-trim;if(hi-lo<Math.min(...active.map(p=>p.frontage))*2)continue;const junctionMargin=Math.min(i.roadRules.corridor/2,(hi-lo)/2),middle=Math.max(lo+junctionMargin,Math.min(hi-junctionMargin,0)),center=world(middle,row.level);if(!connect([center]))continue;addRoute([world(lo,row.level),center,world(hi,row.level)],`Residential street ${i.roads.length}`);}
        else {
          const used=new Set<number>();
          for(let a=0;a<rows.length;a++){if(used.has(a))continue;let built=false;for(let b=rows.length-1;b>a;b--){if(used.has(b)||rows[b].level<=rows[a].level)continue;const lo=Math.max(rows[a].lo,rows[b].lo)+depth,hi=Math.min(rows[a].hi,rows[b].hi)-depth,bottom=rows[a].level,top=rows[b].level,radius=i.roadRules.centrelineRadius??i.roadRules.corridor;
              if(hi-lo<radius*2+1||top-bottom<radius*2+1)continue;const mid=(top+bottom)/2,path=[world(lo,mid),world(lo,bottom),world(hi,bottom),world(hi,top),world(lo,top),world(lo,mid)],curves=[1,2,3,4].map(vertex=>({vertex,radius})),r:ResidentialRoad={id:'test',name:'Loop',path,curves,locked:false};let resolved:Pt[];try{resolved=centrelineForRoad(r).points;}catch{continue;}if(resolved.slice(1).some((p,k)=>!direct(resolved[k],p,free)))continue;
              const attach=world(Math.max(lo+radius+.1,Math.min(hi-radius-.1,0)),bottom);if(!connect([attach]))continue;addRoute(path,`Residential loop ${i.roads.length}`,curves);targets.push(world(Math.max(lo+radius+.1,Math.min(hi-radius-.1,0)),top));for(let k=a;k<=b;k++)if(rows[k].level>=bottom&&rows[k].level<=top){used.add(k);if(rows[k].level>bottom+radius&&rows[k].level<top-radius&&rows[k].lo<=lo&&rows[k].hi>=hi)addRoute([world(lo,rows[k].level),world(hi,rows[k].level)],`Cross street ${i.roads.length}`);}built=true;break;
            }if(!built)continue;
          }
        }
        if(i.roads.length===1){const far=world(0,Math.max(first,maxV-depth-inputs.roadRules.corridor/2)),path=route(seed,far);if(path&&pathLength(path)>Math.min(...active.map(p=>p.frontage))){i.roads[0].path=[gate,...path];hasEnds=true;}else continue;}
        insertJunctionControls(i.roads);
        if(i.roads.length>32){conflicts.push('This structure exceeds the supported 32 streets; use a larger spacing or edit sections separately.');continue;}
        const endpoints=deadEnds(i);hasEnds=hasEnds||endpoints.length>0;
        if(hasEnds&&endTreatment==='cul-de-sac')for(const endpoint of endpoints){const road=i.roads.find(r=>r.id===endpoint.roadId)!;road.turningHeads=[...(road.turningHeads??[]),{end:endpoint.end,radius:Math.max(i.roadRules.corridor*.75,i.vehicle?Math.hypot(i.vehicle.minRadius+i.vehicle.width/2,i.vehicle.length/2):0)}];}
        const weights=Object.fromEntries(active.map(p=>[p.id,inputs.mix.targets[p.id]*p.frontage]));
        let best:ResidentialScenario|undefined;
        for(let pass=0;pass<3;pass++){
          allocation(i,weights);tested++;try{const s=buildResidentialScenario(i,`prepared_${tested}`,'Prepared residential layout',style==='loop'?'Connected loops and double-loaded street sections':'Connected double-loaded streets');if(hardFailures(s).length){conflicts.push(hardFailures(s)[0].message);break;}if(!best||mixError(s)<mixError(best)-.001||Math.abs(mixError(s)-mixError(best))<.001&&s.result.counts.valid>best.result.counts.valid)best=s;
            if(!i.mix.mandatory||mixError(s)<.0001)break;for(const p of active){const actual=s.result.schedule.find(row=>row.productId===p.id)!.actual??0;weights[p.id]*=Math.max(.5,Math.min(2,inputs.mix.targets[p.id]/Math.max(actual,1)));}
          }catch(error){const message=error instanceof Error?error.message:String(error);conflicts.push(isPolygonOverlayError(error)?'A numerical trial failed and was discarded; accepted geometry was preserved.':message);break;}
        }
        if(best){best.inputs.preparation!.strategy=style==='loop'&&!hasEnds?'Connected loops':endTreatment==='cul-de-sac'?'Loops / cul-de-sacs':'Loops / dead ends';best.inputs.preparation!.tested=tested;best.advantage=`${best.result.counts.valid} measured valid lots; ${best.result.roadLength.toFixed(1)} m internal road`;best.compromise=hasEnds?'Non-looped street ends require the selected termination and a vehicle review':'Curves and junction manoeuvres remain subject to recorded project checks';(hasEnds?openChoices:choices).push(best);}
      }
    }
    if(choices.length||openChoices.length)break candidateSearch;
  }
  const preferenceError=(s:ResidentialScenario)=>inputs.mix.mandatory?mixError(s):0;
  const compare=(a:ResidentialScenario,b:ResidentialScenario)=>preferenceError(a)-preferenceError(b)||b.result.counts.valid-a.result.counts.valid||a.result.roadLength-b.result.roadLength;
  choices.sort(compare);openChoices.sort(compare);const loop=choices[0],open=openChoices[0],best=[...choices,...(endTreatment?openChoices:[])].sort(compare)[0];
  if(!endTreatment&&open&&(!loop||preferenceError(open)<preferenceError(loop)-.001||preferenceError(open)<=preferenceError(loop)+.001&&open.result.counts.valid>loop.result.counts.valid))return {status:'choose-end-treatment',tested,conflicts:[...new Set(conflicts)].slice(0,8),message:`Tested layouts include non-looped street ends${loop?`; the best fully looped layout has ${loop.result.counts.valid} valid lots`:''}. Choose a dead end or cul-de-sac before those areas are developed.`,bestLoopYield:loop?.result.counts.valid??0,bestOpenYield:open.result.counts.valid};
  if(!best||best.result.counts.valid===0||inputs.mix.mandatory&&mixError(best)>.0001)return {status:'failed',tested,conflicts:[...new Set(conflicts)].slice(0,8),message:best?`No tested layout meets the required mix within ±${inputs.mix.tolerance} percentage points. Best tested yield: ${best.result.counts.valid}. Review section allocation and road structure, or deliberately revise editable inputs. This bounded search does not prove infeasibility.`:'No tested full-corridor layout fits these inputs. Review the reported conflicts; this bounded search is not a proof of impossibility.',bestLoopYield:loop?.result.counts.valid??0,bestOpenYield:open?.result.counts.valid??0};
  const transition=residentialTransitionErrors(inputs,best.inputs);if(transition.length)return {status:'failed',tested,conflicts:transition,message:transition[0],bestLoopYield:loop?.result.counts.valid??0,bestOpenYield:open?.result.counts.valid??0};
  best.inputs.preparation!.tested=tested;
  return {status:'ready',scenario:best,tested,conflicts:[...new Set(conflicts)].slice(0,8),message:`Best found among ${tested} tested geometry/allocation configurations: ${best.result.counts.valid} valid lots. Review the plan, mix and quantity differences before accepting.`,bestLoopYield:loop?.result.counts.valid??0,bestOpenYield:open?.result.counts.valid??0};
}
const pathLength=(p:Pt[])=>p.slice(1).reduce((s,b,k)=>s+distance(p[k],b),0);
export function deadEnds(i:ResidentialInputs):Array<{roadId:string;end:'start'|'end';point:Pt}>{
  return i.roads.flatMap(r=>(['start','end'] as const).flatMap(end=>{const p=end==='start'?r.path[0]:r.path.at(-1)!;if(distance(r.path[0],r.path.at(-1)!)<.001||r.id===i.entrance.roadId&&end==='start')return [];const connected=i.roads.some(other=>other.id!==r.id&&centrelineForRoad(other).points.slice(1).some((b,k)=>{const a=centrelineForRoad(other).points[k],l=distance(a,b),t=((p.x-a.x)*(b.x-a.x)+(p.y-a.y)*(b.y-a.y))/(l*l),q=lerp(a,b,Math.max(0,Math.min(1,t)));return distance(q,p)<.001;}));return connected?[]:[{roadId:r.id,end,point:p}];}));
}

function insertJunctionControls(roads:ResidentialRoad[]){
  const all=roads.flatMap(r=>r.path);
  for(const road of roads){const old=road.path,curves=road.curves??[],next:Pt[]=[old[0]];for(let k=1;k<old.length;k++){const a=old[k-1],b=old[k],length=distance(a,b),cuts=all.map(p=>({p,t:((p.x-a.x)*(b.x-a.x)+(p.y-a.y)*(b.y-a.y))/(length*length)})).filter(q=>q.t>.00001&&q.t<.99999&&distance(q.p,lerp(a,b,q.t))<.001&&!curves.some(c=>(c.vertex===k-1||c.vertex===k)&&distance(q.p,old[c.vertex])<=c.radius+.01)).sort((a,b)=>a.t-b.t);for(const c of cuts)if(distance(next.at(-1)!,c.p)>.001)next.push(c.p);if(distance(next.at(-1)!,b)>.001)next.push(b);}road.path=next;road.curves=curves.map(c=>({...c,vertex:next.findIndex(p=>distance(p,old[c.vertex])<.001)}));}
}

export function moveResidentialEntrance(i:ResidentialInputs,entranceId:string|undefined,edge:number,offset:number){
  const e=entranceId?i.additionalEntrances?.find(e=>e.id===entranceId)??i.entrance:i.entrance;
  if(e.locked)throw Error('Entrance is locked. Accept a deliberate unlock before moving it.');
  const road=i.roads.find(r=>r.id===e.roadId);if(!road)throw Error('The entrance has no serving internal street.');if(road.locked)throw Error('The entrance street is locked. Accept an unlock before moving its connection.');
  const oldGate=entrancePoint(i,e),oldStub=road.path[1],candidate={...e,edge,offset};
  if(!entranceAllowed(i,candidate))throw Error('The full entrance must remain on permitted frontage touching its external road.');
  const gate=entrancePoint(i,candidate),direction=entranceDirection(i,candidate),length=distance(oldGate,oldStub),stub={x:gate.x+direction.x*length,y:gate.y+direction.y*length};
  if(i.roads.some(r=>r.locked&&r.path.some(p=>distance(p,oldStub)<.001)))throw Error('A locked street holds the entrance transition. Unlock it deliberately or use a different entrance edit.');
  Object.assign(e,candidate);for(const r of i.roads)r.path=r.path.map(p=>distance(p,oldGate)<.001?gate:distance(p,oldStub)<.001?stub:p);
}
