// Residential SOP scenarios use polygon parcels; legacy rectangular plans stay intact.
import clipping from 'polygon-clipping';
import type { MultiPolygon, Pair } from 'polygon-clipping';
import { allFinite, isSimple, polyArea, signedArea, type Pt } from './polygon.ts';
import { surfaceArea, surfaceFrontage, streetPolygon, streetSurface, type RoadSurface } from './road-surfaces.ts';
import { disconnectedStreets, nearestStreetPoint, onStreet, streetLength, type StreetNetwork } from './streets.ts';

export type CheckState = 'pass' | 'fail' | 'unknown';
export interface LotProduct {
  id: string; name: string; color: string; frontage: number; depth: number;
  frontageMin: number; frontageMax: number; depthMin: number; depthMax: number;
  areaMin: number; areaMax: number; maxSaleableArea: number;
  irregular: boolean; minRearRatio: number;
  rate: null | { amount: number; source: string; date: string; scope: Array<'lots'|'roads'|'spaces'> };
}
export interface ResidentialRoad { id: string; name: string; path: Pt[]; locked: boolean }
export interface ProductGroup { id: string; roadId: string; from: number; to: number; productId: string; locked: boolean }
export interface ResidentialSpace {
  id: string; name: string; kind: 'protected'|'flexible'|'reservation'; points: Pt[];
  buffer: number; bufferSource: string; minArea: number; locked: boolean;
  function: string; requiresAccess: boolean; prohibition: 'all'|'lots'|'roads'; crossing: 'none'|'unresolved'|'approved';
}
export interface ResidentialInputs {
  version: 1; objective: 'yield'|'least-road'|'declared'; objectiveNote: string;
  source: string; fixedRequirements: string; preferences: string; adjustable: string; unknowns: string;
  boundary: Pt[]; boundaryLocked: boolean; calibration: 'unverified'|'source-metres'|'calibrated'; independentCheck: string;
  externalRoads: Array<{ id: string; name: string; a: Pt; b: Pt; rightOfWay: number|null; carriageway: number|null; eligible: Array<{edge: number; from: number; to: number}> }>;
  entrance: { edge: number; offset: number; width: number; transition: number; roadId: string; externalRoadId: string; locked: boolean; role: string; movements: string };
  roadRules: { corridor: number; carriageway: number|null; cornerReturn: number; centrelineRadius: number|null; junctionAngle: number; turning: string; confirmed: boolean };
  roads: ResidentialRoad[]; products: LotProduct[]; groups: ProductGroup[]; spaces: ResidentialSpace[];
  mix: { basis: 'units'|'area'; mode: 'percent'|'count'; tolerance: number; mandatory: boolean; rounding: 'largest-remainder'; targets: Record<string,number> };
  commonRates: Array<{id: string; scope: 'roads'|'spaces'; unit: 'm'|'m2'; amount: number; source: string; date: string}>;
  lockedLots: ResidentialLot[]; fill: boolean;
}
export interface ResidentialLot {
  id: string; scenarioId: string; productId: string; groupId: string; roadId: string; points: Pt[];
  area: number; frontage: number; depth: number; depthMax: number; rearRatio: number;
  status: 'valid'|'unresolved'|'invalid'; exceptions: string[]; locked: boolean;
}
export interface ResidentialResult {
  lots: ResidentialLot[]; road: RoadSurface; connection: RoadSurface; offsiteConnection: RoadSurface; blocks: RoadSurface; residual: RoadSurface;
  exclusions: Record<string,RoadSurface>; issues: Array<{state: CheckState; object: string; message: string}>;
  counts: {valid: number; unresolved: number; invalid: number}; validLotArea: number; roadLength: number; roadPerLot: number|null;
  land: {gross: number; residential: number; roads: number; protected: number; flexible: number; reservations: number; residual: number; overlap: number; gap: number; tolerance: number};
  schedule: Array<{productId: string; valid: number; target: number|null; roundedTarget: number|null; actual: number|null; deviation: number|null; mix: CheckState; area: number; minArea: number|null; meanArea: number|null; maxArea: number|null; cost: number|null}>;
  groupSchedule: Array<{groupId: string; valid: number; productId: string; matching: boolean}>;
  cost: number; missingCosts: string[]; qualified: boolean; skipped: Record<string,number>;
}
export interface ResidentialScenario { id: string; name: string; idea: string; advantage: string; compromise: string; inputs: ResidentialInputs; result: ResidentialResult }
export interface ResidentialWorkspace { version: 1; accepted: ResidentialScenario; alternatives: ResidentialScenario[]; selected: string[]; selectionReason: string; decisions: Array<{at: string; action: string}> }
export const RESIDENTIAL_TOL = .001;
export const RESIDENTIAL_AREA_TOL = .01;
// Micrometre snapping prevents floating slivers in repeated boolean operations.
const snap=(n:number)=>Math.round(n*1e6)/1e6;
const coord=(s:RoadSurface):MultiPolygon=>s.map(p=>p.map(r=>r.map(p=>[snap(p.x),snap(p.y)] as Pair)));
const surf=(s:MultiPolygon):RoadSurface=>s.map(p=>p.map(r=>r.slice(0,-1).map(([x,y])=>({x:snap(x),y:snap(y)}))));
const shape=(p:Pt[]):RoadSurface=>p.length>=3?[[p]]:[];
function union(...parts:RoadSurface[]):RoadSurface { const p=parts.filter(p=>p.length);return p.length?surf(clipping.union(coord(p[0]),...p.slice(1).map(coord))):[]; }
function diff(a:RoadSurface,...parts:RoadSurface[]):RoadSurface {const p=parts.filter(p=>p.length);return a.length?(p.length?surf(clipping.difference(coord(a),...p.map(coord))):a):[];}
function intersect(a:RoadSurface,b:RoadSurface):RoadSurface{return a.length&&b.length?surf(clipping.intersection(coord(a),coord(b))):[];}
const area=(p:RoadSurface)=>surfaceArea(p);
const distance=(a:Pt,b:Pt)=>Math.hypot(a.x-b.x,a.y-b.y);
const along=(a:Pt,b:Pt,t:number)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
export function residentialBuffer(points:Pt[],width:number):RoadSurface {
  if(!width)return shape(points);
  const n=Math.max(16,Math.ceil(Math.PI/Math.acos(Math.max(-1,1-.005/width))));
  const disks=points.map(p=>shape(Array.from({length:n},(_,i)=>({x:p.x+width*Math.cos(i*2*Math.PI/n),y:p.y+width*Math.sin(i*2*Math.PI/n)}))));
  const strips=points.map((a,i)=>shape(streetPolygon({id:String(i),a,b:points[(i+1)%points.length],width:2*width})));
  return union(shape(points),...strips,...disks);
}
export function residentialGate(i:ResidentialInputs):Pt {const e=i.entrance,a=i.boundary[e.edge],b=i.boundary[(e.edge+1)%i.boundary.length];return along(a,b,e.offset/distance(a,b));}
export function residentialNetwork(i:ResidentialInputs):StreetNetwork {
  return {cornerRadius:i.roadRules.cornerReturn,segments:i.roads.flatMap(r=>r.path.slice(1).map((b,k)=>({id:`${r.id}_${k}`,a:r.path[k],b,width:i.roadRules.corridor})))};
}
function entranceConnection(i:ResidentialInputs):RoadSurface {
  const gate=residentialGate(i),r=i.roads.find(r=>r.id===i.entrance.roadId)!;
  const b=r.path[1],len=distance(gate,b),t=Math.min(i.entrance.transition,len),q=along(gate,b,t/len);
  const u={x:(b.x-gate.x)/len,y:(b.y-gate.y)/len},n={x:-u.y,y:u.x},p=(at:Pt,w:number,s:number)=>({x:at.x+n.x*w*s/2,y:at.y+n.y*w*s/2});
  return shape([p(gate,i.entrance.width,1),p(gate,i.entrance.width,-1),p(q,i.roadRules.corridor,-1),p(q,i.roadRules.corridor,1)]);
}
const rec=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const num=(v:unknown,min=0,max=1e9):v is number=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
const txt=(v:unknown,max=4000):v is string=>typeof v==='string'&&v.length<=max;
const point=(v:unknown):v is Pt=>rec(v)&&num(v.x,-1e6,1e6)&&num(v.y,-1e6,1e6);
const polygon=(v:unknown):v is Pt[]=>Array.isArray(v)&&v.length>=3&&v.length<=512&&v.every(point)&&allFinite(v)&&isSimple(v)&&polyArea(v)>.01;
const id=(v:unknown):v is string=>typeof v==='string'&&!['__proto__','prototype','constructor'].includes(v)&&/^[a-zA-Z0-9_-]{1,100}$/.test(v);
function unique(v:unknown,max:number):v is Array<Record<string,unknown>> {return Array.isArray(v)&&v.length<=max&&v.every(x=>rec(x)&&id(x.id))&&new Set(v.map(x=>x.id)).size===v.length;}
export function residentialInputErrors(raw:unknown):string[] {
  if(!rec(raw)||raw.version!==1)return ['Unsupported residential input format.'];
  const i=raw as unknown as ResidentialInputs;
  if(!['yield','least-road','declared'].includes(i.objective)||![i.objectiveNote,i.source,i.fixedRequirements,i.preferences,i.adjustable,i.unknowns,i.independentCheck].every(x=>txt(x)))return ['Complete the brief using text fields.'];
  if(!polygon(i.boundary)||i.boundary.length>64||i.boundary.some(p=>!num(p.x,0,500)||!num(p.y,0,500))||typeof i.boundaryLocked!=='boolean'||!['unverified','source-metres','calibrated'].includes(i.calibration))return ['Boundary needs 3–64 unique, non-crossing metre coordinates within 0–500 m. Closure is implicit between last and first corner.'];
  if(!unique(i.products,12)||!i.products.length)return ['Define 1–12 uniquely identified products.'];
  for(const p of i.products){
    if(!txt(p.name,100)||!p.name.trim()||!/^#[0-9a-fA-F]{6}$/.test(p.color)||![p.frontage,p.depth,p.frontageMin,p.frontageMax,p.depthMin,p.depthMax,p.areaMin,p.areaMax,p.maxSaleableArea].every(v=>num(v,.1,250000))||p.frontageMin>p.frontage||p.frontage>p.frontageMax||p.depthMin>p.depth||p.depth>p.depthMax||p.areaMin>p.areaMax||p.maxSaleableArea<p.areaMin||typeof p.irregular!=='boolean'||!num(p.minRearRatio,.05,1))return [`${p.name}: check nominal dimensions, variation, area, saleable maximum and rear/front ratio.`];
    if(p.rate!==null&&(!rec(p.rate)||!num(p.rate.amount)||!txt(p.rate.source,200)||!p.rate.source.trim()||!/^\d{4}-\d{2}-\d{2}$/.test(p.rate.date)||!Array.isArray(p.rate.scope)||!p.rate.scope.length||p.rate.scope.some(s=>!['lots','roads','spaces'].includes(s))))return [`${p.name}: supply rate amount, source, date and included works, or leave unpriced.`];
  }
  const r=i.roadRules;
  if(!rec(r)||!num(r.corridor,1,50)||!(r.carriageway===null||num(r.carriageway,.5,r.corridor))||!num(r.cornerReturn,0,50)||!(r.centrelineRadius===null||num(r.centrelineRadius,1,1000))||!num(r.junctionAngle,10,170)||!txt(r.turning,500)||typeof r.confirmed!=='boolean')return ['Check corridor, carriageway and road-rule inputs.'];
  if(!unique(i.roads,32)||!i.roads.length||i.roads.some(r=>!txt(r.name,100)||typeof r.locked!=='boolean'||!Array.isArray(r.path)||r.path.length<2||r.path.length>32||!r.path.every(point)||r.path.slice(1).some((p,k)=>distance(p,r.path[k])<.1)))return ['Define 1–32 roads with distinct points and deliberate locks.'];
  const e=i.entrance;
  if(!rec(e)||!Number.isInteger(e.edge)||e.edge<0||e.edge>=i.boundary.length||!num(e.offset)||!num(e.width,r.corridor,50)||!num(e.transition,.1,100)||!i.roads.some(r=>r.id===e.roadId)||!id(e.externalRoadId)||typeof e.locked!=='boolean'||!txt(e.role,100)||!txt(e.movements,200))return ['Entrance requires a site edge, offset, bounded width/transition and serving internal/external roads.'];
  if(!unique(i.externalRoads,16)||i.externalRoads.some(r=>!txt(r.name,100)||![r.a,r.b].every(point)||distance(r.a,r.b)<.1||!(r.rightOfWay===null||num(r.rightOfWay,.1,100))||!(r.carriageway===null||num(r.carriageway,.1,r.rightOfWay??100))||!Array.isArray(r.eligible)||r.eligible.length>64||r.eligible.some(s=>!rec(s)||!Number.isInteger(s.edge)||s.edge<0||s.edge>=i.boundary.length||!num(s.from)||!num(s.to)||s.to<=s.from)))return ['External roads need alignment and explicit eligible boundary intervals.'];
  if(!unique(i.groups,64)||i.groups.some(g=>!i.roads.some(r=>r.id===g.roadId)||!i.products.some(p=>p.id===g.productId)||!num(g.from,0,1)||!num(g.to,0,1)||g.from>=g.to||typeof g.locked!=='boolean'))return ['Product groups need an existing road/product and a start/end fraction from 0 to 1.'];
  for(const a of i.groups)if(i.groups.some(b=>a.id!==b.id&&a.roadId===b.roadId&&Math.min(a.to,b.to)-Math.max(a.from,b.from)>.000001))return ['Product groups on the same street must not overlap. Both sides share each group.'];
  if(!unique(i.spaces,24)||i.spaces.some(s=>!txt(s.name,100)||!['protected','flexible','reservation'].includes(s.kind)||!polygon(s.points)||!num(s.buffer,0,50)||!txt(s.bufferSource,200)||!num(s.minArea,0,250000)||typeof s.locked!=='boolean'||!txt(s.function,200)||typeof s.requiresAccess!=='boolean'||!['all','lots','roads'].includes(s.prohibition)||!['none','unresolved','approved'].includes(s.crossing)))return ['Spaces need simple polygons, declared buffers, commitments, uses and locks.'];
  const m=i.mix;
  if(!rec(m)||!['units','area'].includes(m.basis)||!['percent','count'].includes(m.mode)||m.mode==='count'&&m.basis!=='units'||!num(m.tolerance,0,100)||typeof m.mandatory!=='boolean'||m.rounding!=='largest-remainder'||!rec(m.targets)||Object.keys(m.targets).some(k=>!i.products.some(p=>p.id===k))||i.products.some(p=>!num(m.targets[p.id],0,m.mode==='percent'?100:5000)||m.mode==='count'&&!Number.isInteger(m.targets[p.id])))return ['Set product targets, denominator, tolerance and largest-remainder rounding. Count targets use units.'];
  if(m.mode==='percent'&&Math.abs(Object.values(m.targets).reduce((a,b)=>a+b,0)-100)>.001)return ['Percentage targets must total 100%.'];
  if(!unique(i.commonRates,8)||i.commonRates.some(c=>!['roads','spaces'].includes(c.scope)||!['m','m2'].includes(c.unit)||c.scope==='spaces'&&c.unit!=='m2'||!num(c.amount)||!txt(c.source,200)||!c.source.trim()||!/^\d{4}-\d{2}-\d{2}$/.test(c.date)))return ['Common rates need measured units, source, date and scope. Space rates use m².'];
  if(new Set(i.commonRates.map(c=>c.scope)).size!==i.commonRates.length)return ['Use one common rate per works scope to avoid double pricing.'];
  if(!Array.isArray(i.lockedLots)||i.lockedLots.length>5000||i.lockedLots.some(l=>!rec(l)||!(typeof l.id==='string'&&/^[a-zA-Z0-9_-]{1,300}$/.test(l.id))||!polygon(l.points)||!i.products.some(p=>p.id===l.productId)||!i.groups.some(g=>g.id===l.groupId)||!i.roads.some(r=>r.id===l.roadId))||typeof i.fill!=='boolean')return ['Invalid held-lot records or fill option.'];
  return [];
}

export function residentialTransitionErrors(before:ResidentialInputs,after:ResidentialInputs):string[] {
  const errors:string[]=[];
  const equal=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
  // An unlock is a separately accepted operation: a simultaneous move is refused.
  if(before.boundaryLocked&&!equal(before.boundary,after.boundary))errors.push('Boundary is locked. Accept an explicit unlock before editing its coordinates.');
  if(before.entrance.locked&&!equal({...before.entrance,locked:false},{...after.entrance,locked:false}))errors.push('Entrance is locked. Accept an explicit unlock before moving it.');
  for(const r of before.roads.filter(r=>r.locked)){const n=after.roads.find(n=>n.id===r.id);if(!n||!equal(r.path,n.path)||before.roadRules.corridor!==after.roadRules.corridor||before.roadRules.cornerReturn!==after.roadRules.cornerReturn)errors.push(`${r.name} is locked. Accept an unlock before changing its geometry.`);}
  for(const s of before.spaces.filter(s=>s.kind==='protected'||s.locked)){const n=after.spaces.find(n=>n.id===s.id);if(!n||!equal(s.points,n.points)||s.buffer!==n.buffer||s.kind!==n.kind||n.minArea<s.minArea)errors.push(`${s.name} is fixed protection or locked. Its envelope cannot move in a layout edit.`);}
  for(const g of before.groups.filter(g=>g.locked)){const n=after.groups.find(n=>n.id===g.id);if(!n||!equal({...g,locked:false},{...n,locked:false})||!equal(before.products.find(p=>p.id===g.productId),after.products.find(p=>p.id===g.productId)))errors.push(`${g.id} is locked; accept an unlock before reallocating or resizing its product.`);}
  for(const l of before.lockedLots)if(!after.lockedLots.some(n=>n.id===l.id&&equal(n.points,l.points))&&!equal({...before,lockedLots:[]},{...after,lockedLots:[]}))errors.push(`Lot ${l.id} is held. Release it in a separate accepted operation.`);
  return errors;
}

// Offset a measured kerb-chain into the block. Depth is checked on rays at
// 10/50/90% of the frontage chord; taper is rear span / primary frontage.
function rayDepth(points:Pt[],origin:Pt[],u:Pt,n:Pt):{min:number;max:number;ratio:number} {
  const base=origin[0],length=distance(base,origin.at(-1)!);
  const x=(p:Pt)=>(p.x-base.x)*u.x+(p.y-base.y)*u.y;
  const y=(p:Pt)=>(p.x-base.x)*n.x+(p.y-base.y)*n.y;
  const depths=[.1,.5,.9].map(f=>{const at=length*f,ys:number[]=[];for(let k=0;k<points.length;k++){const a=points[k],b=points[(k+1)%points.length],ax=x(a),bx=x(b);if(Math.abs(ax-bx)<1e-9)continue;if(at>=Math.min(ax,bx)-1e-6&&at<=Math.max(ax,bx)+1e-6)ys.push(y(a)+(y(b)-y(a))*(at-ax)/(bx-ax));}return ys.length?Math.max(0,Math.max(...ys)-Math.max(0,Math.min(...ys))):0;});
  const back=points.filter(p=>y(p)>Math.max(...depths)*.8),span=back.length?Math.max(...back.map(x))-Math.min(...back.map(x)):0;
  return {min:Math.min(...depths),max:Math.max(...points.map(y)),ratio:length?span/length:0};
}
function roundedTargets(i:ResidentialInputs,count:number):Record<string,number> {
  if(i.mix.mode==='count')return {...i.mix.targets};
  const exact=i.products.map(p=>({id:p.id,n:count*i.mix.targets[p.id]/100})),out=Object.fromEntries(exact.map(p=>[p.id,Math.floor(p.n)]));
  const remaining=count-Object.values(out).reduce((a,b)=>a+b,0);
  exact.sort((a,b)=>(b.n-Math.floor(b.n))-(a.n-Math.floor(a.n))||a.id.localeCompare(b.id));for(let k=0;k<remaining;k++)out[exact[k].id]++;
  return out;
}
export function calculateResidential(i:ResidentialInputs,scenarioId='working'):ResidentialResult {
  const errors=residentialInputErrors(i);if(errors.length)throw Error(errors[0]);
  const issues:ResidentialResult['issues']=[];
  const issue=(state:CheckState,object:string,message:string)=>issues.push({state,object,message});
  const site=shape(i.boundary),net=residentialNetwork(i),gate=residentialGate(i),entryRoad=i.roads.find(r=>r.id===i.entrance.roadId)!;
  const edgeLength=distance(i.boundary[i.entrance.edge],i.boundary[(i.entrance.edge+1)%i.boundary.length]);
  if(i.entrance.offset-i.entrance.width/2<-.001||i.entrance.offset+i.entrance.width/2>edgeLength+.001)issue('fail','entrance','Full entrance width must fit the selected boundary edge.');
  const external=i.externalRoads.find(r=>r.id===i.entrance.externalRoadId);
  const externalProjection=external?nearestStreetPoint({segments:[{id:external.id,a:external.a,b:external.b,width:1}]},gate):null;
  const offsiteConnection=externalProjection&&externalProjection.distance>.001?shape(streetPolygon({id:'offsite',a:externalProjection.point,b:gate,width:i.entrance.width})):[];
  if(external?.rightOfWay&&area(intersect(site,shape(streetPolygon({id:external.id,a:external.a,b:external.b,width:external.rightOfWay}))))>.01)issue('fail','roads','Existing external road right of way extends inside the fixed site. Resolve that existing-road reservation or correct its alignment; this stage cannot allocate that land to residential lots.');
  const allowed=external?.eligible.some(s=>s.edge===i.entrance.edge&&s.from<=i.entrance.offset-i.entrance.width/2+.001&&s.to>=i.entrance.offset+i.entrance.width/2-.001);
  if(!allowed)issue('fail','entrance','Entrance is outside explicitly eligible external-road frontage.');
  if(distance(entryRoad.path[0],gate)>.001)issue('fail','entrance','The entrance road must start at the gate; reconnect it before accepting.');
  if(disconnectedStreets(net,gate).length)issue('fail','roads','Internal centreline network is disconnected from the entrance.');
  for(let a=0;a<net.segments.length;a++)for(let b=a+1;b<net.segments.length;b++){
    const s=net.segments[a],t=net.segments[b],length=streetLength(s),u={x:(s.b.x-s.a.x)/length,y:(s.b.y-s.a.y)/length};
    const side=(p:Pt)=>Math.abs((p.x-s.a.x)*u.y-(p.y-s.a.y)*u.x),station=(p:Pt)=>(p.x-s.a.x)*u.x+(p.y-s.a.y)*u.y;
    if(side(t.a)<.001&&side(t.b)<.001&&Math.min(length,Math.max(station(t.a),station(t.b)))-Math.max(0,Math.min(station(t.a),station(t.b)))>.001)issue('fail','roads','Repeated or overlapping centrelines would duplicate road length; remove the repeated alignment.');
  }

  const ea=i.boundary[i.entrance.edge],eb=i.boundary[(i.entrance.edge+1)%i.boundary.length],first=entryRoad.path[1];
  const cosine=Math.abs(((eb.x-ea.x)*(first.x-gate.x)+(eb.y-ea.y)*(first.y-gate.y))/(distance(ea,eb)*distance(gate,first)));
  if(cosine>.01)issue('fail','entrance','Entrance connection must be perpendicular to its boundary edge in this stage; move its transition node with the gate.');
  const roadShape=streetSurface(net),connection=entranceConnection(i);
  // Corridor width is a fixed minimum. Corner returns may add land; they cannot trim the declared polyline corridor.
  const road=union(streetSurface({...net,cornerRadius:0}).surface,roadShape.surface,connection);
  if(area(diff(road,site))>.01)issue('fail','roads','The full road corridor or entrance transition leaves the fixed boundary.');
  if(roadShape.limited)issue('fail','roads',`${roadShape.limited} corner returns cannot fit the requested radius; revise geometry or explicitly choose a smaller radius.`);
  // Centreline crossings and T nodes are recognized by the shared network engine.
  const exclusions:Record<string,RoadSurface>={};
  for(const s of i.spaces){
    exclusions[s.id]=residentialBuffer(s.points,s.buffer);
    if(s.prohibition!=='all')issue('unknown',s.id,`${s.name}: selective prohibition recorded; this stage conservatively reserves the full envelope until crossing/overlay design is resolved.`);
    if(area(diff(exclusions[s.id],site))>.01)issue('fail',s.id,`${s.name}: protection envelope leaves the boundary.`);
    if(polyArea(s.points)+.01<s.minArea)issue('fail',s.id,`${s.name}: below its ${s.minArea} m² minimum.`);
    if(s.kind==='protected'&&s.buffer>0&&!s.bufferSource.trim())issue('unknown',s.id,`${s.name}: buffer distance is provisional; supply its source.`);
    if(s.prohibition!=='lots'&&area(intersect(road,exclusions[s.id]))>.01)issue('fail',s.id,`${s.name}: road encroaches on the protected/reserved envelope. Crossing ${s.crossing}; conditional crossing design is unresolved.`);
    if(s.requiresAccess&&surfaceFrontage(road,s.points)<.5)issue('fail',s.id,`${s.name}: no measured road-edge access; retain as residual or provide a connection.`);
  }
  const protectedLand=union(...i.spaces.filter(s=>s.kind==='protected').map(s=>exclusions[s.id]));
  const flexible=union(...i.spaces.filter(s=>s.kind==='flexible').map(s=>exclusions[s.id]));
  const reservations=union(...i.spaces.filter(s=>s.kind==='reservation').map(s=>exclusions[s.id]));
  const reserved=union(protectedLand,flexible,reservations);
  const blocks=diff(site,road,reserved),skipped:Record<string,number>={};
  const skip=(s:string)=>{skipped[s]=(skipped[s]??0)+1;};
  const lots:ResidentialLot[]=[];
  let allocated:RoadSurface=[];
  const roadFor=(p:Pt)=>{
    const nearest=nearestStreetPoint(net,p)!;const segment=net.segments.find(s=>s.id===nearest.streetId)!;
    const roadId=i.roads.find(r=>segment.id.startsWith(r.id+'_')&&r.path.some((a,k)=>k<r.path.length-1&&distance(a,segment.a)<.001&&distance(r.path[k+1],segment.b)<.001))?.id;
    const r=i.roads.find(r=>r.id===roadId)!;
    if(!r)return null;
    const lengths=r.path.slice(1).map((b,k)=>distance(r.path[k],b)),total=lengths.reduce((a,b)=>a+b,0);
    let station=0;for(let k=0;k<lengths.length;k++){if(onStreet(nearest.point,{id:'x',a:r.path[k],b:r.path[k+1],width:1})){station+=distance(r.path[k],nearest.point);break;}station+=lengths[k];}
    return {roadId:r.id,station:station/total,nearest:nearest.point};
  };
  const add=(points:Pt[],front:Pt[],group:ProductGroup,identity:string,locked=false):boolean=>{
    const p=i.products.find(p=>p.id===group.productId)!,a=front[0],b=front.at(-1)!,l=distance(a,b);
    if(l<.01)return false;
    const u={x:(b.x-a.x)/l,y:(b.y-a.y)/l},n={x:u.y,y:-u.x};
    const measured=rayDepth(points,front,u,n),frontage=Math.min(surfaceFrontage(road,points),surfaceFrontage([[front]],points)),actualArea=polyArea(points);
    const reasons:string[]=[];
    if(area(diff(shape(points),site))>.01)reasons.push('outside boundary');
    if(area(intersect(shape(points),union(road,reserved,allocated)))>.01)reasons.push('overlap with road, reservation or another lot');
    if(frontage<p.frontageMin-.001||frontage>p.frontageMax+.001)reasons.push('frontage outside product variation');
    if(measured.min<p.depthMin-.01||measured.max>p.depthMax+.01)reasons.push('usable depth outside product variation');
    if(actualArea<p.areaMin-.01||actualArea>Math.min(p.areaMax,p.maxSaleableArea)+.01)reasons.push('area outside saleable limits');
    const boxArea=l*measured.max,irregular=points.length!==4||Math.abs(actualArea-boxArea)>.02;
    if(irregular&&!p.irregular)reasons.push('irregular shape is not permitted');
    if(measured.ratio<p.minRearRatio-.005)reasons.push('rear taper below product limit');
    if(reasons.length&&!locked){skip(reasons[0]);return false;}
    const status=reasons.length?'invalid':(!allowed||issues.some(x=>x.state==='fail'&&['roads','entrance'].includes(x.object)))?'unresolved':'valid';
    lots.push({id:identity,scenarioId,productId:p.id,groupId:group.id,roadId:group.roadId,points,area:actualArea,frontage,depth:measured.min,depthMax:measured.max,rearRatio:measured.ratio,status,exceptions:reasons,locked});
    allocated=union(allocated,shape(points));
    if(locked&&reasons.length)issue('fail',identity,'Held lot conflicts: '+reasons.join('; '));
    return true;
  };
  // Held polygons are retained verbatim. Validation and schedules are rebuilt.
  for(const l of i.lockedLots){
    const g=i.groups.find(g=>g.id===l.groupId)!;
    const edges=l.points.map((a,k)=>({a,b:l.points[(k+1)%l.points.length],shared:surfaceFrontage(road,[a,l.points[(k+1)%l.points.length],along(a,l.points[(k+1)%l.points.length],.5)])})).sort((a,b)=>b.shared-a.shared);
    const e=edges[0],front=signedArea(l.points)>0?[e.b,e.a]:[e.a,e.b];
    add(l.points,front,g,l.id,true);
  }
  // Frontage follows the actual unioned kerb, including polygonised returns.
  for(const ring of road.flat()){
    const chains:Array<{points:Pt[];group:ProductGroup}>=[];
    for(let k=0;k<ring.length;k++){
      const start=ring[k],end=ring[(k+1)%ring.length],ra=roadFor(start),rb=roadFor(end);
      const cuts=[0,1];
      if(ra&&rb&&ra.roadId===rb.roadId&&Math.abs(rb.station-ra.station)>1e-8){
        for(const g of i.groups.filter(g=>g.roadId===ra.roadId))for(const t of [g.from,g.to]){const f=(t-ra.station)/(rb.station-ra.station);if(f>1e-7&&f<1-1e-7)cuts.push(f);}
      }
      cuts.sort((a,b)=>a-b);
      for(let part=1;part<cuts.length;part++){
        const a=along(start,end,cuts[part-1]),b=along(start,end,cuts[part]),middle=along(a,b,.5),r=roadFor(middle);
        if(!r||distance(a,b)<.001)continue;
        const g=i.groups.find(g=>g.roadId===r.roadId&&r.station>=g.from-1e-8&&r.station<=g.to+1e-8);
        if(!g)continue;
        const nearest=nearestStreetPoint(net,middle)!,segment=net.segments.find(s=>s.id===nearest.streetId)!;
        const tangent={x:b.x-a.x,y:b.y-a.y},axis={x:segment.b.x-segment.a.x,y:segment.b.y-segment.a.y};
        if(Math.abs(tangent.x*axis.x+tangent.y*axis.y)<distance(a,b)*streetLength(segment)*.1)continue;
        const last=chains.at(-1);
        if(last&&last.group.id===g.id&&distance(last.points.at(-1)!,a)<.001)last.points.push(b);else chains.push({points:[a,b],group:g});
      }
    }
    for(const chain of chains){
      const p=i.products.find(p=>p.id===chain.group.productId)!,lengths=chain.points.slice(1).map((b,k)=>distance(chain.points[k],b)),total=lengths.reduce((a,b)=>a+b,0);
      const at=(s:number)=>{let walked=0;for(let k=0;k<lengths.length;k++){if(s<=walked+lengths[k]+1e-7)return along(chain.points[k],chain.points[k+1],Math.min(1,(s-walked)/lengths[k]));walked+=lengths[k];}return chain.points.at(-1)!;};
      const frontBetween=(start:number,end:number)=>{const f=[at(start)];let s=0;for(let k=0;k<lengths.length;k++){s+=lengths[k];if(s>start+.0001&&s<end-.0001)f.push(chain.points[k+1]);}f.push(at(end));return f;};
      const passes=[{width:p.frontage,phase:0,residual:false},...(i.fill?[{width:p.frontage,phase:p.frontage/2,residual:true},{width:p.frontageMin,phase:0,residual:true}]:[])];
      for(const pass of passes)for(let s=pass.phase,k=0;s+(pass.residual?p.frontageMin:pass.width)<=total+.001&&k<1000;s+=pass.width,k++){
        const width=Math.min(pass.width,total-s);
        if(lots.length>=5000){skip('5,000 lot search limit');break;}
        const front=frontBetween(s,s+width),a=front[0],b=front.at(-1)!,l=distance(a,b);if(l<.01)continue;
        const normal={x:(b.y-a.y)/l,y:-(b.x-a.x)/l};
        for(const depth of [...new Set(i.fill?[p.depth,p.depthMin]:[p.depth])]){
          const raw=[...front,{x:b.x+normal.x*depth,y:b.y+normal.y*depth},{x:a.x+normal.x*depth,y:a.y+normal.y*depth}];
          if(!isSimple(raw)){skip('frontage curve cannot form a simple lot');continue;}
          const clipped=intersect(shape(raw),pass.residual?diff(blocks,allocated):blocks);
          if(clipped.length!==1||clipped[0].length!==1){skip('fragmented or reserved land');continue;}
          // Stable identity comes from serving section and actual primary frontage.
          const identity=`lot_${chain.group.id}_${Math.round(a.x*1000)}_${Math.round(a.y*1000)}_${Math.round(b.x*1000)}_${Math.round(b.y*1000)}`;
          if(add(clipped[0][0],front,chain.group,identity))break;
        }
      }
    }
  }
  const valid=lots.filter(l=>l.status==='valid'),counts={valid:valid.length,unresolved:lots.filter(l=>l.status==='unresolved').length,invalid:lots.filter(l=>l.status==='invalid').length};
  const residential=union(...lots.map(l=>shape(l.points))),residual=diff(site,road,reserved,residential);
  const sum=area(residential)+area(road)+area(protectedLand)+area(flexible)+area(reservations)+area(residual),covered=union(road,reserved,residential,residual);
  const land={gross:area(site),residential:area(residential),roads:area(road),protected:area(protectedLand),flexible:area(flexible),reservations:area(reservations),residual:area(residual),overlap:Math.max(0,sum-area(covered)),gap:area(diff(site,covered)),tolerance:RESIDENTIAL_AREA_TOL};
  if(land.overlap>.01||land.gap>.01||Math.abs(sum-land.gross)>.01)issue('fail','land','Land allocation has overlap, gaps or outside allocations beyond 0.01 m²; resolve before accepting.');
  const validArea=valid.reduce((n,l)=>n+l.area,0),targets=roundedTargets(i,counts.valid);
  const schedule=i.products.map(p=>{
    const ls=valid.filter(l=>l.productId===p.id),lotArea=ls.reduce((a,l)=>a+l.area,0),den=i.mix.basis==='units'?counts.valid:validArea;
    const actual=den?(i.mix.basis==='units'?ls.length:lotArea)/den*100:null;
    const targetTotal=Object.values(i.mix.targets).reduce((a,b)=>a+b,0);
    const target=i.mix.mode==='percent'?i.mix.targets[p.id]:targetTotal?i.mix.targets[p.id]/targetTotal*100:null;
    const deviation=actual!==null&&target!==null?actual-target:null;
    const mix:CheckState=i.mix.mode==='count'?(Math.abs(ls.length-i.mix.targets[p.id])<=i.mix.tolerance?'pass':'fail'):deviation===null?'unknown':Math.abs(deviation)<=i.mix.tolerance+.000001?'pass':'fail';
    return {productId:p.id,valid:ls.length,target,roundedTarget:i.mix.basis==='units'?targets[p.id]:null,actual,deviation,mix,area:lotArea,minArea:ls.length?Math.min(...ls.map(l=>l.area)):null,meanArea:ls.length?lotArea/ls.length:null,maxArea:ls.length?Math.max(...ls.map(l=>l.area)):null,cost:p.rate?ls.length*p.rate.amount:null};
  });
  const missingCosts=i.products.filter(p=>!p.rate&&valid.some(l=>l.productId===p.id)).map(p=>`${p.name}: per-lot development rate missing`);
  let cost=schedule.reduce((n,p)=>n+(p.cost??0),0);
  for(const scope of ['roads','spaces'] as const){
    const activeProducts=i.products.filter(p=>valid.some(l=>l.productId===p.id));
    const included=activeProducts.some(p=>p.rate?.scope.includes(scope));
    const fullyIncluded=activeProducts.length>0&&activeProducts.every(p=>p.rate?.scope.includes(scope));
    const common=i.commonRates.find(c=>c.scope===scope);
    if(included&&common)issue('fail','cost',`${scope}: common works duplicate an included per-lot scope; remove the common rate or revise scopes.`);
    else if(common)cost+=common.amount*(scope==='roads'?(common.unit==='m'?net.segments.reduce((a,s)=>a+streetLength(s),0):land.roads):land.flexible+land.protected);
    else if(!fullyIncluded)missingCosts.push(`${scope}: ${included?'partly included in product rates; remaining scope unpriced':'common works unpriced'}`);
  }
  if(i.calibration==='unverified')issue('unknown','boundary','Boundary scale/source is unverified.');
  if(!i.boundaryLocked)issue('unknown','boundary','Accept and lock the fixed boundary before comparing qualifying options.');
  if(!i.roadRules.confirmed)issue('unknown','roads','Road dimensions are provisional project inputs.');
  if(i.roadRules.carriageway===null)issue('unknown','roads','Carriageway width is missing.');
  issue('unknown','roads',i.roadRules.turning.trim()?'Vehicle turning requirements are recorded; swept-path verification is not implemented.':'Vehicle turning requirements/check are unresolved.');
  if(i.roadRules.centrelineRadius!==null)issue('unknown','roads','A centreline-radius requirement is recorded; this polyline/kerb-return engine does not verify swept centreline curves.');
  if(external&&(external.rightOfWay===null||external.carriageway===null))issue('unknown',external.id,'External right of way or carriageway dimensions are missing.');
  if(external){const projection=nearestStreetPoint({segments:[{id:external.id,a:external.a,b:external.b,width:1}]},gate)!;if(projection.distance>.001)issue('unknown','entrance','Off-site connection footprint/permission requires separate design; the gate does not lie on the external alignment.');}
  if(i.unknowns.trim())issue('unknown','brief',i.unknowns);
  if(i.objective==='declared')issue('unknown','objective','Custom objective is recorded for manual comparison; no automatic ranking formula is assumed.');
  if(i.mix.mandatory&&schedule.some(p=>p.mix!=='pass'))issue(schedule.some(p=>p.mix==='fail')?'fail':'unknown','mix','Mandatory product composition is outside tolerance or undefined.');
  const roadLength=net.segments.reduce((a,s)=>a+streetLength(s),0);
  return {lots,road,connection,offsiteConnection,blocks,residual,exclusions,issues,counts,validLotArea:validArea,roadLength,roadPerLot:counts.valid?roadLength/counts.valid:null,land,schedule,groupSchedule:i.groups.map(g=>({groupId:g.id,productId:g.productId,valid:valid.filter(l=>l.groupId===g.id).length,matching:true})),cost,missingCosts,qualified:!issues.some(i=>i.state!=='pass')&&counts.valid>0,skipped};
}

export function buildResidentialScenario(inputs:ResidentialInputs,id:string,name:string,idea='Working residential layout'):ResidentialScenario {
  return {id,name,idea,advantage:'Measured valid yield and scoped quantities',compromise:'Residual and unresolved checks remain visible',inputs:structuredClone(inputs),result:calculateResidential(inputs,id)};
}
export function rankResidential(candidates:ResidentialScenario[]):ResidentialScenario[] {
  return [...candidates].sort((a,b)=>Number(b.result.qualified)-Number(a.result.qualified)||a.result.issues.filter(x=>x.state==='fail').length-b.result.issues.filter(x=>x.state==='fail').length||a.result.issues.filter(x=>x.state==='unknown').length-b.result.issues.filter(x=>x.state==='unknown').length||(a.inputs.objective==='declared'?0:a.inputs.objective==='least-road'?a.result.roadLength-b.result.roadLength:b.result.counts.valid-a.result.counts.valid)||a.result.roadLength-b.result.roadLength||a.id.localeCompare(b.id));
}
export function searchResidential(base:ResidentialScenario,allocationsOnly=false):{tested:number;candidates:ResidentialScenario[];conflicts:string[]} {
  const trials:ResidentialInputs[]=[];
  for(const delta of allocationsOnly?[]:[-10,10,-20,20]){const i=structuredClone(base.inputs),r=i.roads.find(r=>!r.locked&&r.id===i.entrance.roadId);if(!r)continue;const k=r.path.length>3?2:r.path.length-1;r.path[k].y+=delta;trials.push(i);}
  for(const g of base.inputs.groups.filter(g=>!g.locked))for(const p of base.inputs.products.filter(p=>p.id!==g.productId)){const i=structuredClone(base.inputs);i.groups.find(n=>n.id===g.id)!.productId=p.id;trials.push(i);}
  for(const road of base.inputs.roads){
    const groups=base.inputs.groups.filter(g=>g.roadId===road.id).sort((a,b)=>a.from-b.from);
    for(let k=1;k<groups.length;k++){
      const a=groups[k-1],b=groups[k];if(a.locked||b.locked||Math.abs(a.to-b.from)>.000001)continue;
      for(const share of [.1,.2,.25,.3,1/3,.4,.5,.6,2/3,.7,.75,.8,.9]){const at=a.from+(b.to-a.from)*share;if(Math.abs(at-a.to)<.00001)continue;const i=structuredClone(base.inputs);i.groups.find(g=>g.id===a.id)!.to=at;i.groups.find(g=>g.id===b.id)!.from=at;trials.push(i);}
    }
  }
  const candidates:ResidentialScenario[]=[],conflicts:string[]=[];let tested=0;
  for(const [index,i] of trials.slice(0,64).entries()){
    tested++;try{const errors=residentialTransitionErrors(base.inputs,i);if(errors.length){conflicts.push(errors[0]);continue;}const s=buildResidentialScenario(i,`trial_${index}`,`Option ${index+1}`,JSON.stringify(i.roads)!==JSON.stringify(base.inputs.roads)?'Shift unlocked road alignment':'Reallocate a complete facing street section');
      const failed=s.result.issues.filter(x=>x.state==='fail');if(failed.length){conflicts.push(failed[0].message);continue;}
      if(candidates.some(c=>JSON.stringify(c.result.lots.map(l=>[l.productId,l.points]))===JSON.stringify(s.result.lots.map(l=>[l.productId,l.points]))))continue;
      s.advantage=`${s.result.counts.valid-base.result.counts.valid>=0?'+':''}${s.result.counts.valid-base.result.counts.valid} valid lots versus accepted`;
      s.compromise=`${s.result.land.residual.toFixed(1)} m² residual; ${s.result.issues.filter(x=>x.state==='unknown').length} unresolved checks`;
      candidates.push(s);
    }catch(e){conflicts.push(e instanceof Error?e.message:String(e));}
  }
  if(trials.length>64)conflicts.push('Search stopped at the declared 64-configuration limit; further allocations remain untested.');
  return {tested,candidates:rankResidential(candidates).slice(0,5),conflicts:[...new Set(conflicts)]};
}
// Reproduction permits declared numerical error; discrete counts and identities stay exact.
function sameResidentialResult(actual:unknown,expected:unknown,path:string[]=[]):boolean {
  if(typeof expected==='number'){
    if(typeof actual!=='number'||!Number.isFinite(actual))return false;
    const key=path.at(-1)??'';
    if(path.includes('skipped')||['valid','unresolved','invalid','roundedTarget'].includes(key))return actual===expected;
    const tolerance=key==='cost'?1:['actual','deviation','target','rearRatio'].includes(key)?1e-6:['area','minArea','maxArea','meanArea','validLotArea','gross','residential','roads','protected','flexible','reservations','residual','overlap','gap'].includes(key)?.01:.001;
    return Math.abs(actual-expected)<=tolerance;
  }
  if(Array.isArray(expected))return Array.isArray(actual)&&actual.length===expected.length&&expected.every((v,k)=>sameResidentialResult(actual[k],v,[...path,String(k)]));
  if(rec(expected))return rec(actual)&&Object.keys(actual).length===Object.keys(expected).length&&Object.keys(expected).every(k=>Object.hasOwn(actual,k)&&sameResidentialResult(actual[k],expected[k],[...path,k]));
  return actual===expected;
}
export function residentialWorkspaceErrors(raw:unknown):string[] {
  if(!rec(raw)||raw.version!==1||!rec(raw.accepted)||!Array.isArray(raw.alternatives)||raw.alternatives.length>20||!Array.isArray(raw.selected)||raw.selected.length>2||!raw.selected.every(id)||!txt(raw.selectionReason)||!Array.isArray(raw.decisions)||raw.decisions.length>10000||raw.decisions.some(d=>!rec(d)||!txt(d.at,100)||!txt(d.action)))return ['Unsupported residential workspace or decision record.'];
  const all=[raw.accepted,...raw.alternatives];
  if(new Set(raw.alternatives.map(a=>a?.id)).size!==raw.alternatives.length)return ['Residential alternatives have repeated identities.'];
  for(const s of all){if(!rec(s)||!id(s.id)||![s.name,s.idea,s.advantage,s.compromise].every(v=>txt(v))||!rec(s.result))return ['Residential scenario is incomplete.'];const errors=residentialInputErrors(s.inputs);if(errors.length)return errors;
    try{const result=calculateResidential(s.inputs as ResidentialInputs,s.id);if(!sameResidentialResult(s.result,result))return ['Residential saved geometry/schedules disagree with their inputs; preserve the file and inspect it before restoring.'];}catch(e){return [e instanceof Error?e.message:String(e)];}
  }
  if(raw.selected.some(s=>!all.some(a=>a.id===s)))return ['A shortlisted residential scenario is missing.'];
  return [];
}
