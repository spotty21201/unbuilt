import {nearestStreetPoint} from './streets.ts';
import clipping from 'polygon-clipping';
import type {MultiPolygon,Pair} from 'polygon-clipping';
import {isSimple,pointInPoly,polyArea,signedArea,type Pt} from './polygon.ts';
import {surfaceArea,surfaceFrontage,streetPolygon,type RoadSurface} from './road-surfaces.ts';
import {surveyErrors} from './site-context.ts';
import type {ResidentialInputs,ResidentialResult,ResidentialEntrance,ResidentialRoad,ResidentialSpace,ExternalRoad} from './residential.ts';
const snap=(n:number)=>Math.round(n*1e6)/1e6;
export const coordinates=(s:RoadSurface):MultiPolygon=>s.map(p=>p.map(r=>r.map(p=>[snap(p.x),snap(p.y)] as Pair)));
const points=(s:MultiPolygon):RoadSurface=>s.map(p=>p.map(r=>r.slice(0,-1).map(([x,y])=>({x:snap(x),y:snap(y)}))));
export const polygonSurface=(p:Pt[]):RoadSurface=>p.length>=3?[[p]]:[];
export function unionSurface(...parts:RoadSurface[]):RoadSurface {const p=parts.filter(p=>p.length);return p.length?points(clipping.union(coordinates(p[0]),...p.slice(1).map(coordinates))):[];}
export function subtractSurface(a:RoadSurface,...parts:RoadSurface[]):RoadSurface {const p=parts.filter(p=>p.length);return a.length?(p.length?points(clipping.difference(coordinates(a),...p.map(coordinates))):a):[];}
export function intersectSurface(a:RoadSurface,b:RoadSurface):RoadSurface{return a.length&&b.length?points(clipping.intersection(coordinates(a),coordinates(b))):[];}
export const distance=(a:Pt,b:Pt)=>Math.hypot(a.x-b.x,a.y-b.y);
export const lerp=(a:Pt,b:Pt,t:number)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
export function lineBuffer(path:Pt[],radius:number,roundEnds=false):RoadSurface {
  if(!(radius>0)||path.length<2)return [];
  const count=Math.max(24,Math.ceil(Math.PI/Math.acos(Math.max(-1,1-.002/radius)))),r=radius/Math.cos(Math.PI/count);
  const disks=(roundEnds?path:path.slice(1,-1)).map(p=>polygonSurface(Array.from({length:count},(_,k)=>({x:p.x+r*Math.cos(k*2*Math.PI/count),y:p.y+r*Math.sin(k*2*Math.PI/count)}))));
  return unionSurface(...path.slice(1).map((b,k)=>polygonSurface(streetPolygon({id:String(k),a:path[k],b,width:radius*2}))),...disks);
}
export function bufferSurface(surface:RoadSurface,radius:number):RoadSurface {
  if(!radius)return surface;
  const count=Math.max(24,Math.ceil(Math.PI/Math.acos(Math.max(-1,1-.002/radius)))),r=radius/Math.cos(Math.PI/count);
  return unionSurface(surface,...surface.flat().flatMap(ring=>ring.flatMap((p,k)=>[
    polygonSurface(streetPolygon({id:String(k),a:p,b:ring[(k+1)%ring.length],width:radius*2})),
    polygonSurface(Array.from({length:count},(_,j)=>({x:p.x+r*Math.cos(j*2*Math.PI/count),y:p.y+r*Math.sin(j*2*Math.PI/count)}))),
  ])));
}
export const externalRoadPath=(r:ExternalRoad)=>r.path??[r.a,r.b];
export const externalSurface=(i:ResidentialInputs)=>unionSurface(...i.externalRoads.filter(r=>r.rightOfWay!==null).map(r=>lineBuffer(externalRoadPath(r),r.rightOfWay!/2)));
export const spaceSurface=(s:ResidentialSpace):RoadSurface=>s.shape==='line'?[]:[[s.points,...(s.holes??[])]];
export const bufferedSpace=(s:ResidentialSpace):RoadSurface=>s.shape==='line'?lineBuffer(s.points,s.buffer,true):bufferSurface(spaceSurface(s),s.buffer);
export const entranceList=(i:ResidentialInputs):ResidentialEntrance[]=>i.phase==='site'?[]:[i.entrance,...(i.additionalEntrances??[])];
export const entrancePoint=(i:ResidentialInputs,e:ResidentialEntrance)=>lerp(i.boundary[e.edge],i.boundary[(e.edge+1)%i.boundary.length],e.offset/distance(i.boundary[e.edge],i.boundary[(e.edge+1)%i.boundary.length]));
const insideSurface=(p:Pt,s:RoadSurface)=>s.some(poly=>pointInPoly(p,poly[0])&&!poly.slice(1).some(h=>pointInPoly(p,h)));
export function lineIntervals(a:Pt,b:Pt,surface:RoadSurface):Array<[number,number]> {
  const dx=b.x-a.x,dy=b.y-a.y,length2=dx*dx+dy*dy,cuts=[0,1];
  if(length2<1e-12)return [];
  for(const ring of surface.flat())for(let k=0;k<ring.length;k++){
    const c=ring[k],d=ring[(k+1)%ring.length],ex=d.x-c.x,ey=d.y-c.y,det=dx*ey-dy*ex;
    if(Math.abs(det)<1e-10){if(Math.abs(dx*(c.y-a.y)-dy*(c.x-a.x))/Math.sqrt(length2)<.001)for(const p of [c,d])cuts.push(Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/length2)));continue;}
    const t=((c.x-a.x)*ey-(c.y-a.y)*ex)/det,u=((c.x-a.x)*dy-(c.y-a.y)*dx)/det;
    if(t>=-1e-9&&t<=1+1e-9&&u>=-1e-9&&u<=1+1e-9)cuts.push(Math.max(0,Math.min(1,t)));
  }
  const sorted=[...new Set(cuts.map(n=>Math.round(n*1e10)/1e10))].sort((a,b)=>a-b),out:Array<[number,number]>=[];
  for(let k=1;k<sorted.length;k++){const from=sorted[k-1],to=sorted[k];if(to-from<1e-10||!insideSurface(lerp(a,b,(from+to)/2),surface))continue;const last=out.at(-1);if(last&&Math.abs(last[1]-from)<1e-9)last[1]=to;else out.push([from,to]);}
  return out;
}
export function adjacentFrontages(i:ResidentialInputs,r:ExternalRoad):ExternalRoad['eligible'] {
  if(r.rightOfWay===null)return [];
  const footprint=lineBuffer(externalRoadPath(r),r.rightOfWay/2+(r.connectionReach??0)+.002);
  return i.boundary.flatMap((a,edge)=>{const b=i.boundary[(edge+1)%i.boundary.length],length=distance(a,b);return lineIntervals(a,b,footprint).map(([from,to])=>({edge,from:from*length,to:to*length}));});
}
function covers(intervals:Array<{from:number;to:number}>,from:number,to:number):boolean {let end=from;for(const s of [...intervals].sort((a,b)=>a.from-b.from)){if(s.from>end+.001)break;if(s.to>=end)end=s.to;}return end>=to-.001;}
export function entranceAllowed(i:ResidentialInputs,e:ResidentialEntrance):boolean {
  const r=i.externalRoads.find(r=>r.id===e.externalRoadId);if(!r||!i.boundary[e.edge])return false;
  const from=e.offset-e.width/2,to=e.offset+e.width/2;
  return covers(r.eligible.filter(s=>s.edge===e.edge),from,to)&&covers(adjacentFrontages(i,r).filter(s=>s.edge===e.edge),from,to);
}
export function entranceSuggestions(i:ResidentialInputs,roadId:string,width=i.entrance.width):ResidentialEntrance[] {
  const r=i.externalRoads.find(r=>r.id===roadId);if(!r)return [];
  const actual=adjacentFrontages(i,r),out:ResidentialEntrance[]=[];
  for(const allowed of r.eligible)for(const contact of actual.filter(c=>c.edge===allowed.edge)){
    const length=distance(i.boundary[allowed.edge],i.boundary[(allowed.edge+1)%i.boundary.length]),from=Math.max(0,allowed.from,contact.from)+width/2,to=Math.min(length,allowed.to,contact.to)-width/2;
    if(to<from)continue;
    for(const share of [.5,.25,.75]){const candidate={...i.entrance,id:`candidate_${roadId}_${allowed.edge}_${share}`,edge:allowed.edge,offset:from+(to-from)*share,width,externalRoadId:roadId,locked:false};if(entranceAllowed(i,candidate)&&!out.some(e=>e.edge===candidate.edge&&distance(entrancePoint(i,e),entrancePoint(i,candidate))<width))out.push(candidate);}
  }
  return out;
}
export function entranceDirection(i:ResidentialInputs,e:ResidentialEntrance):Pt {
  const gate=entrancePoint(i,e),a=i.boundary[e.edge],b=i.boundary[(e.edge+1)%i.boundary.length],orientation=Math.sign(signedArea(i.boundary)),length=distance(a,b),inward={x:-(b.y-a.y)/length*orientation,y:(b.x-a.x)/length*orientation},external=i.externalRoads.find(r=>r.id===e.externalRoadId);
  if(!external)return inward;
  const path=externalRoadPath(external),network={segments:path.slice(1).map((b,k)=>({id:String(k),a:path[k],b,width:1}))},nearest=nearestStreetPoint(network,gate),s=network.segments.find(s=>s.id===nearest?.streetId);
  if(!s)return inward;const len=distance(s.a,s.b),normal={x:-(s.b.y-s.a.y)/len,y:(s.b.x-s.a.x)/len},sign=normal.x*inward.x+normal.y*inward.y>=0?1:-1;
  return {x:normal.x*sign,y:normal.y*sign};
}
export function chooseEntrance(i:ResidentialInputs,e:ResidentialEntrance,additional=false):void {
  if(!entranceAllowed(i,e))throw Error('Choose an entrance on the permitted frontage actually adjoining its external road.');
  const gate=entrancePoint(i,e),normal=entranceDirection(i,e);
  const rayEnd={x:gate.x+normal.x*200000,y:gate.y+normal.y*200000};
  const interval=lineIntervals(gate,rayEnd,polygonSurface(i.boundary)).find(([from])=>from<1e-7);
  const available=(interval?.[1]??0)*200000-i.roadRules.corridor/2;
  const transition=e.transition+i.roadRules.corridor,depth=Math.min(available,Math.max(transition+1,40));
  if(depth<transition+1)throw Error('The full entrance transition and corridor do not fit inward from this frontage. Try another permitted candidate or revise the explicit road inputs.');
  let entranceNumber=2;while(i.roads.some(r=>r.id===`entrance_${entranceNumber}`))entranceNumber++;
  const old=i.roads.find(r=>r.id===e.roadId),roadId=additional?`entrance_${entranceNumber}`:e.roadId||'main';
  const stub={x:gate.x+normal.x*transition,y:gate.y+normal.y*transition},tip={x:gate.x+normal.x*depth,y:gate.y+normal.y*depth};
  if(old?.locked)throw Error(`${old.name} is locked; unlock its entrance connection deliberately before replacing it.`);
  if(old&&!additional){old.path[0]=gate;if(old.path.length>2)old.path[1]=stub;else old.path=[gate,stub,...old.path.slice(1)];}
  else i.roads.push({id:roadId,name:additional?`Entrance ${(i.additionalEntrances?.length??0)+2} street`:'Entrance street',path:[gate,stub,tip],locked:false});
  const next={...e,id:additional?roadId:'primary',roadId};
  if(additional)i.additionalEntrances=[...(i.additionalEntrances??[]),next];else i.entrance=next;
  i.phase='layout';
}
export function centrelineForRoad(road:ResidentialRoad):{points:Pt[];length:number;segmentLengths:number[];arcs:Array<{vertex:number;radius:number;angle:number}>} {
  const path=road.path,corners=path.map((p,k)=>{
    const rule=road.curves?.find(c=>c.vertex===k);if(!rule||k===0||k===path.length-1)return null;
    const a=path[k-1],b=path[k+1],la=distance(a,p),lb=distance(p,b),u={x:(p.x-a.x)/la,y:(p.y-a.y)/la},v={x:(b.x-p.x)/lb,y:(b.y-p.y)/lb};
    const angle=Math.atan2(u.x*v.y-u.y*v.x,u.x*v.x+u.y*v.y);
    if(Math.abs(angle)<1e-6)return null;
    if(Math.abs(angle)>Math.PI-.01)throw Error(`${road.name}: a reversing centreline needs an explicit loop/turning head, not a fillet.`);
    const tangent=rule.radius*Math.tan(Math.abs(angle)/2),first={x:p.x-u.x*tangent,y:p.y-u.y*tangent},last={x:p.x+v.x*tangent,y:p.y+v.y*tangent},sign=Math.sign(angle),center={x:first.x-u.y*sign*rule.radius,y:first.y+u.x*sign*rule.radius};
    return {radius:rule.radius,angle,tangent,first,last,center,vertex:k};
  });
  for(let k=1;k<path.length;k++)if((corners[k-1]?.tangent??0)+(corners[k]?.tangent??0)>distance(path[k-1],path[k])-.001)throw Error(`${road.name}: requested curve radii do not fit between control points ${k} and ${k+1}. No radius has been reduced.`);
  const result:Pt[]=[path[0]],segmentLengths:number[]=[];let length=0,last=path[0];
  for(let k=1;k<path.length;k++){
    const corner=corners[k];if(!corner){length+=distance(last,path[k]);segmentLengths.push(distance(result.at(-1)!,path[k]));result.push(path[k]);last=path[k];continue;}
    length+=distance(last,corner.first)+corner.radius*Math.abs(corner.angle);
    if(distance(result.at(-1)!,corner.first)>.000001){segmentLengths.push(distance(result.at(-1)!,corner.first));result.push(corner.first);}
    const start=Math.atan2(corner.first.y-corner.center.y,corner.first.x-corner.center.x),step=2*Math.acos(Math.max(-1,1-.002/corner.radius)),count=Math.max(2,Math.ceil(Math.abs(corner.angle)/Math.max(step,.001)));
    if(count>1024)throw Error(`${road.name}: curve subdivision exceeds the supported 1,024 segments per arc.`);
    for(let n=1;n<=count;n++){segmentLengths.push(corner.radius*Math.abs(corner.angle)/count);result.push(n===count?corner.last:{x:corner.center.x+corner.radius*Math.cos(start+corner.angle*n/count),y:corner.center.y+corner.radius*Math.sin(start+corner.angle*n/count)});}
    last=corner.last;
  }
  return {points:result,length,segmentLengths,arcs:corners.filter(c=>c!==null)};
}
export function measureRoadLength(i:ResidentialInputs,external:RoadSurface):number {
  return i.roads.reduce((n,r)=>{const resolved=centrelineForRoad(r);return n+resolved.points.slice(1).reduce((sum,b,k)=>{const a=resolved.points[k],covered=lineIntervals(a,b,external).reduce((v,[lo,hi])=>v+hi-lo,0);return sum+resolved.segmentLengths[k]*(1-covered);},0);},0);
}
export function crossingPermission(i:ResidentialInputs,s:ResidentialSpace,road:RoadSurface):{permitted:RoadSurface;unknown:boolean} {
  if(s.prohibition==='lots')return {permitted:road,unknown:false};
  const d=s.crossingDecision;
  if(!d||d.status!=='approved'||!d.reference.trim()||!d.authority.trim()||!d.date)return {permitted:[],unknown:s.crossing!=='none'};
  const allowed=unionSurface(...i.roads.filter(r=>d.roadIds.includes(r.id)).map(r=>lineBuffer(centrelineForRoad(r).points,i.roadRules.corridor/2)));
  return {permitted:intersectSurface(intersectSurface(road,allowed),polygonSurface(d.points)),unknown:false};
}
const record=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const finite=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v);
const pt=(v:unknown):v is Pt=>record(v)&&finite(v.x)&&finite(v.y)&&Math.abs(v.x)<=1e6&&Math.abs(v.y)<=1e6;
const polygon=(v:unknown):v is Pt[]=>Array.isArray(v)&&v.length>=3&&v.length<=512&&v.every(pt)&&isSimple(v)&&polyArea(v)>.01;
export function validateV2Inputs(raw:Record<string,unknown>):string[] {
  if(raw.phase!==undefined&&!['site','layout'].includes(String(raw.phase)))return ['Choose site inputs or a generated layout.'];
  const i=raw as unknown as ResidentialInputs;
  if(i.inputCommitments!==undefined&&typeof i.inputCommitments!=='boolean')return ['Input-commitment stage must be true or false.'];
  if(i.inputCommitments&&(i.groups?.length||i.lockedLots?.length))return ['Input commitments cannot contain allocated lot groups or held lots. Start a measured layout before allocating lots.'];
  for(const key of ['boundary','externalRoads','roads','products','groups','spaces','lockedLots','commonRates'] as const)if(!Array.isArray(i[key])||(key!=='boundary'&&i[key].some(v=>!record(v))))return [`Missing or malformed ${key} records.`];
  if(i.preparation&&(!record(i.preparation)||!['dead-end','cul-de-sac'].includes(i.preparation.endTreatment)||typeof i.preparation.strategy!=='string'||!Number.isInteger(i.preparation.tested)||i.preparation.tested<0||i.preparation.tested>10000))return ['Invalid layout preparation record.'];
  if(i.roadRules?.anglePolicy!==undefined&&!['required','preference'].includes(i.roadRules.anglePolicy))return ['Choose a required junction angle or a junction preference.'];
  for(const r of i.externalRoads)if(r.boundaryAlignment&&(!Array.isArray(r.boundaryAlignment)||r.boundaryAlignment.length<2||r.boundaryAlignment.length>64||!r.boundaryAlignment.every(pt)))return ['External-road boundary alignment needs finite ordered points.'];
  if(i.survey){const e=surveyErrors(i.survey);if(e.length)return e;}
  if(i.scaleCheck&&(!record(i.scaleCheck)||![i.scaleCheck.a,i.scaleCheck.b].every(pt)||!finite(i.scaleCheck.known)||i.scaleCheck.known<=0||!finite(i.scaleCheck.tolerance)||i.scaleCheck.tolerance<0||typeof i.scaleCheck.source!=='string'))return ['Independent dimension check needs two known positions, a positive known distance, tolerance and source.'];
  if(i.vehicle&&(!record(i.vehicle)||![i.vehicle.width,i.vehicle.length,i.vehicle.minRadius].every(n=>finite(n)&&n>.1&&n<=100)||typeof i.vehicle.source!=='string'||!i.vehicle.source.trim()))return ['Vehicle screening needs declared width, length, minimum turn radius and a source.'];
  if(Array.isArray(i.externalRoads))for(const r of i.externalRoads){if(r.path&&(!Array.isArray(r.path)||r.path.length<2||r.path.length>64||!r.path.every(pt)||r.path.slice(1).some((b,k)=>distance(r.path![k],b)<.001)))return ['External road alignment needs 2–64 distinct metre-coordinate points.'];if(r.connectionReach!==undefined&&(!finite(r.connectionReach)||r.connectionReach<0||r.connectionReach>1000))return ['Off-site connection reach must be an explicit distance from 0 to 1,000 m.'];if(r.locked!==undefined&&typeof r.locked!=='boolean')return ['External-road locks must be true or false.'];}
  if(Array.isArray(i.roads))for(const r of i.roads){if(!Array.isArray(r.path))return ['Road alignment needs an ordered point list.'];if(r.curves&&(!Array.isArray(r.curves)||r.curves.length>30||r.curves.some(c=>!record(c)||!Number.isInteger(c.vertex)||c.vertex<1||c.vertex>=r.path.length-1||!finite(c.radius)||c.radius<=0||c.radius>10000)||new Set(r.curves.map(c=>c.vertex)).size!==r.curves.length))return [`${r.name}: curve radii must address distinct interior control points.`];if(r.turningHeads&&(!Array.isArray(r.turningHeads)||r.turningHeads.length>2||r.turningHeads.some(h=>!record(h)||!['start','end'].includes(h.end)||!finite(h.radius)||h.radius<=0||h.radius>100)))return [`${r.name}: turning heads need an endpoint and a positive full-footprint radius.`];}
  if(Array.isArray(i.spaces))for(const s of i.spaces){
    if(!Array.isArray(s.points)||!s.points.every(pt))return ['Feature geometry needs finite coordinates.'];if(s.holes&&(!Array.isArray(s.holes)||s.holes.length>16||s.holes.some(h=>!polygon(h)||surfaceArea(subtractSurface(polygonSurface(h),polygonSurface(s.points)))>.01)))return [`${s.name}: holes must be simple polygons inside the original feature.`];
    if(s.sourceRevision){const d=s.sourceRevision;if(!record(d)||![d.reference,d.authority,d.date,d.reason].every(v=>typeof v==='string')||!record(d.previous)||!Array.isArray(d.previous.points)||!d.previous.points.every(pt)||!finite(d.previous.buffer)||typeof d.previous.bufferSource!=='string')return [`${s.name}: source revision needs a complete previous geometry and decision record.`];}
    if(s.allowedRegion&&!polygon(s.allowedRegion))return [`${s.name}: the committed location region must be a simple polygon.`];
    if(s.crossingDecision){const d=s.crossingDecision;if(!record(d)||!['unresolved','approved'].includes(d.status)||![d.reference,d.date,d.authority].every(x=>typeof x==='string')||!polygon(d.points)||!Array.isArray(d.roadIds)||d.roadIds.some(id=>!Array.isArray(i.roads)||!i.roads.some(r=>r.id===id)))return [`${s.name}: crossing authorisation needs a defined envelope, road references and decision record.`];}
  }
  for(const g of i.groups)if(g.side!==undefined&&!['both','left','right'].includes(g.side)||g.facingException!==undefined&&typeof g.facingException!=='string')return ['Group sides must be both, left or right, with a text exception where required.'];
  for(const e of [i.entrance,...(Array.isArray(i.additionalEntrances)?i.additionalEntrances:[])])if(record(e)&&e.connectionDecision){const d=e.connectionDecision;if(!record(d)||!['unresolved','approved'].includes(d.status)||![d.reference,d.date,d.authority].every(v=>typeof v==='string')||d.status==='approved'&&(!d.reference.trim()||!d.authority.trim()||!/^\d{4}-\d{2}-\d{2}$/.test(d.date)))return ['Approved entrance connections need an authorising reference, authority and date.'];}
  if(i.roadRules?.junctionTolerance!==undefined&&(!finite(i.roadRules.junctionTolerance)||i.roadRules.junctionTolerance<0||i.roadRules.junctionTolerance>90))return ['Junction angle tolerance must be between 0 and 90 degrees.'];
  if(i.roadRules?.junctionExceptions&&(!Array.isArray(i.roadRules.junctionExceptions)||i.roadRules.junctionExceptions.some(e=>!record(e)||!Array.isArray(e.roadIds)||e.roadIds.length!==2||e.roadIds.some(id=>!i.roads.some(r=>r.id===id))||typeof e.reason!=='string'||!e.reason.trim())))return ['Junction exceptions need two existing road IDs and a reason.'];
  if(i.additionalEntrances&&(!Array.isArray(i.additionalEntrances)||i.additionalEntrances.length>7))return ['Use at most eight explicitly permitted entrances.'];
  if(i.additionalEntrances&&new Set(i.additionalEntrances.map(e=>e?.id)).size!==i.additionalEntrances.length)return ['Additional entrances need unique stable identities.'];
  for(const e of i.additionalEntrances??[]){if(!record(e)||!Number.isInteger(e.edge)||e.edge<0||!Array.isArray(i.boundary)||e.edge>=i.boundary.length||![e.offset,e.width,e.transition].every(n=>finite(n)&&n>=0)||e.width<(i.roadRules?.corridor??1)||e.width>50||e.transition<=0||e.transition>100||typeof e.role!=='string'||typeof e.movements!=='string'||typeof e.id!=='string'||!i.roads?.some(r=>r.id===e.roadId)||!i.externalRoads?.some(r=>r.id===e.externalRoadId)||typeof e.locked!=='boolean')return ['Every additional entrance needs boundary frontage, dimensions and serving road references.'];}
  return [];
}
export function calculateSiteInputs(i:ResidentialInputs,_id:string):ResidentialResult {
  const site=polygonSurface(i.boundary),external=intersectSurface(site,externalSurface(i)),exclusions=Object.fromEntries(i.spaces.map(s=>[s.id,bufferedSpace(s)]));
  const issues:ResidentialResult['issues']=[],issue=(state:'fail'|'unknown',object:string,message:string)=>issues.push({state,object,message});
  const fixed=intersectSurface(site,unionSurface(...i.spaces.filter(s=>s.kind==='protected'&&!s.overlay).map(s=>exclusions[s.id]))),flex=intersectSurface(site,unionSurface(...i.spaces.filter(s=>s.kind==='flexible'&&!s.overlay).map(s=>exclusions[s.id]))),other=unionSurface(external,intersectSurface(site,unionSurface(...i.spaces.filter(s=>s.kind==='reservation'&&!s.overlay).map(s=>exclusions[s.id]))));
  for(const s of i.spaces){
    if(i.boundary.length>=3&&s.kind!=='protected'&&surfaceArea(subtractSurface(exclusions[s.id],site))>.01)issue('fail',s.id,`${s.name}: proposed space leaves the fixed boundary.`);
    if(surfaceArea(s.shape==='line'?exclusions[s.id]:spaceSurface(s))+.01<s.minArea)issue('fail',s.id,`${s.name}: below its minimum area.`);
    if(s.allowedRegion&&surfaceArea(subtractSurface(exclusions[s.id],polygonSurface(s.allowedRegion)))>.01)issue('fail',s.id,`${s.name}: outside its committed location region.`);
    if(i.inputCommitments&&s.requiresAccess)issue('unknown',s.id,`${s.name}: future measured road-edge access is a saved input obligation; this reserved footprint is not yet a completed usable park.`);
  }
  const residual=subtractSurface(site,external,fixed,flex,other),overlap=Math.max(0,surfaceArea(fixed)+surfaceArea(flex)+surfaceArea(other)+surfaceArea(residual)-surfaceArea(site));
  if(overlap>.01)issue('fail','land','Site inputs contain overlapping physical allocations. Mark a functional overlay explicitly or resolve the footprints.');
  if(i.boundary.length<3)issue('unknown','boundary','Draw or import the fixed site boundary at a reliable scale.');
  if(!i.externalRoads.length)issue('unknown','external-roads','Place the existing main road before choosing any entrance.');
  if(!i.products.length)issue('unknown','products','Define residential products before generating lots.');
  issue('unknown','entrance',i.inputCommitments?'Input commitments only: preferred entrance recorded; the connected layout and park access have not been constructed.':'Site inputs only: an entrance has not been selected from adjoining-road frontage.');
  if(i.calibration==='unverified')issue('unknown','boundary','Site scale is unverified.');
  if(!i.boundaryLocked)issue('unknown','boundary','Accept and lock the fixed boundary.');
  const result:ResidentialResult={phase:'site',externalReservation:external,resolvedRoads:[],lots:[],road:[],connection:[],offsiteConnection:[],blocks:residual,residual,exclusions,issues,counts:{valid:0,unresolved:0,invalid:0},validLotArea:0,roadLength:0,roadPerLot:null,land:{gross:surfaceArea(site),residential:0,roads:0,protected:surfaceArea(fixed),flexible:surfaceArea(flex),reservations:surfaceArea(other),residual:surfaceArea(residual),overlap,gap:0,tolerance:.01},schedule:i.products.map(p=>({productId:p.id,valid:0,target:i.mix.targets[p.id],roundedTarget:null,actual:null,deviation:null,mix:'unknown',area:0,minArea:null,meanArea:null,maxArea:null,cost:p.rate?0:null})),groupSchedule:[],cost:0,missingCosts:i.inputCommitments?[...i.products.filter(p=>!p.rate).map(p=>`${p.name}: per-lot rate unpriced`),'Layout quantities and any unpriced common works remain to be assessed']:[],qualified:false,skipped:{}};
  if(i.scaleCheck){const measured=distance(i.scaleCheck.a,i.scaleCheck.b),difference=measured-i.scaleCheck.known,state=Math.abs(difference)<=i.scaleCheck.tolerance?'pass':'fail';result.sourceCheck={measured,difference,state};if(state==='fail')issue('fail','scale','Independent dimension check differs from its known distance beyond the entered tolerance.');}
  return result;
}
export function residualRegions(residual:RoadSurface,road:RoadSurface,minArea:number):NonNullable<ResidentialResult['residualRegions']>{return residual.map((p,k)=>{const a=surfaceArea([p]),access=p.some(r=>surfaceFrontage(road,r)>.001);return {id:`residual_${k+1}`,points:p[0],holes:p.slice(1),area:a,status:a<minArea?'too-small':access?'accessible':'inaccessible',reason:a<minArea?'Below the smallest permitted product area':access?'Road edge exists; only tested frontage/depth/shape fits may become lots':'No measured serving-road edge; not classified as a usable park'};});}
export function addV2Checks(i:ResidentialInputs,result:ResidentialResult):void {
  if(i.scaleCheck){const measured=distance(i.scaleCheck.a,i.scaleCheck.b),difference=measured-i.scaleCheck.known,state=Math.abs(difference)<=i.scaleCheck.tolerance?'pass':'fail';result.sourceCheck={measured,difference,state};if(state==='fail')result.issues.push({state:'fail',object:'scale',message:'Independent dimension check exceeds its recorded tolerance.'});}

}

// Rigid rectangular-body screening only; detailed steering/axle and articulated
// manoeuvre design remains a separate engineering check.
export function roadScreening(i:ResidentialInputs,available:RoadSurface):NonNullable<ResidentialResult['screening']> {
  const checks:NonNullable<ResidentialResult['screening']>=[],put=(object:string,state:'pass'|'fail'|'unknown',message:string)=>checks.push({object,state,message});
  const vehicle=i.vehicle;
  for(const r of i.roads){
    const resolved=centrelineForRoad(r);
    for(const arc of resolved.arcs){const required=Math.max(i.roadRules.centrelineRadius??0,vehicle?.minRadius??0);put(r.id,arc.radius+.001>=required?'pass':'fail',`Actual centreline radius ${arc.radius} m; declared minimum ${required||'unknown'} m.`);}
    const path=resolved.points,lengths=path.slice(1).map((b,k)=>distance(path[k],b)),total=lengths.reduce((n,l)=>n+l,0);
    for(let k=1;k<r.path.length-1;k++){
      const a=r.path[k-1],p=r.path[k],b=r.path[k+1],angle=Math.abs(Math.atan2((p.x-a.x)*(b.y-p.y)-(p.y-a.y)*(b.x-p.x),(p.x-a.x)*(b.x-p.x)+(p.y-a.y)*(b.y-p.y)));
      const junction=i.roads.some(other=>other.id!==r.id&&other.path.some(q=>distance(q,p)<.001));
      if(angle>.01&&!r.curves?.some(c=>c.vertex===k)&&!junction)put(r.id,'unknown',`Bend at vertex ${k+1} has no declared centreline curve. Enter its actual radius; a corner-return fill alone does not define the driving alignment.`);
    }
    if(!vehicle)continue;
    if(vehicle.width>i.roadRules.carriageway!+.001&&i.roadRules.carriageway!==null)put(r.id,'fail','Declared vehicle is wider than the carriageway.');
    const at=(station:number)=>{let walked=0;for(let k=0;k<lengths.length;k++){if(station<=walked+lengths[k]||k===lengths.length-1){const t=Math.max(0,Math.min(1,(station-walked)/lengths[k]));return {point:lerp(path[k],path[k+1],t),angle:Math.atan2(path[k+1].y-path[k].y,path[k+1].x-path[k].x)};}walked+=lengths[k];}throw Error('Empty alignment');};
    const start=vehicle.length/2,end=total-vehicle.length/2;
    if(end<start){put(r.id,'unknown','Street is shorter than the screening vehicle. Define the complete junction movement separately.');continue;}
    const step=.25,count=Math.ceil((end-start)/step),poses:RoadSurface[]=[];
    if(count>20000){put(r.id,'unknown','Vehicle screening exceeds 20,000 samples on this alignment; split the route.');continue;}
    // A circumscribed disk bounds orientation change between samples; positions
    // are covered by the convex hull of consecutive body poses plus a conservative rotation sagitta and 2 mm.
    let previous:Pt[]|undefined,previousAngle:number|undefined,rotationError=0;
    const hull=(p:Pt[])=>{const sorted=[...p].sort((a,b)=>a.x-b.x||a.y-b.y),cross=(a:Pt,b:Pt,c:Pt)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x),lo:Pt[]=[],hi:Pt[]=[];for(const q of sorted){while(lo.length>1&&cross(lo.at(-2)!,lo.at(-1)!,q)<=0)lo.pop();lo.push(q);}for(const q of sorted.reverse()){while(hi.length>1&&cross(hi.at(-2)!,hi.at(-1)!,q)<=0)hi.pop();hi.push(q);}return lo.slice(0,-1).concat(hi.slice(0,-1));};
    for(let k=0;k<=Math.max(1,count);k++){const pose=at(start+(end-start)*k/Math.max(1,count)),u={x:Math.cos(pose.angle),y:Math.sin(pose.angle)},n={x:-u.y,y:u.x},corners=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([a,b])=>({x:pose.point.x+a*u.x*vehicle.length/2+b*n.x*vehicle.width/2,y:pose.point.y+a*u.y*vehicle.length/2+b*n.y*vehicle.width/2}));if(previousAngle!==undefined){const da=Math.atan2(Math.sin(pose.angle-previousAngle),Math.cos(pose.angle-previousAngle));rotationError=Math.max(rotationError,Math.hypot(vehicle.width,vehicle.length)/2*(1-Math.cos(da/2)));}previousAngle=pose.angle;poses.push(polygonSurface(previous?hull([...previous,...corners]):corners));previous=corners;}
    let outside=0;
    const padding=rotationError+.004,radius=padding/Math.cos(Math.PI/8);
    for(const pose of poses){const expanded=hull(pose[0][0].flatMap(p=>Array.from({length:8},(_,k)=>({x:p.x+radius*Math.cos(k*Math.PI/4),y:p.y+radius*Math.sin(k*Math.PI/4)}))));outside=surfaceArea(subtractSurface(polygonSurface(expanded),available));if(outside>.01)break;}
    put(r.id,outside>.01?'fail':'pass',`Rigid-body centreline sweep: ${outside>.01?'at least ':'up to '}${outside.toFixed(3)} m² of a sampled envelope outside the full corridor; ${vehicle.width} × ${vehicle.length} m vehicle from ${vehicle.source}. End positions stop half a vehicle length before corridor ends.`);
    for(const end of ['start','end'] as const){const p=end==='start'?r.path[0]:r.path.at(-1)!,linked=i.roads.some(other=>other.id!==r.id&&other.path.some(q=>distance(q,p)<.001)),entry=entranceList(i).some(e=>e.roadId===r.id&&distance(entrancePoint(i,e),p)<.001);if(linked||entry)continue;const head=r.turningHeads?.find(h=>h.end===end),required=Math.hypot(vehicle.minRadius+vehicle.width/2,vehicle.length/2);put(r.id,!head?'unknown':head.radius+.001<required?'fail':'pass',head?`${end} turning head radius ${head.radius} m; conservative rigid-body circular envelope needs ${required.toFixed(3)} m. Steering feasibility remains separate.`:`${end} dead end: no turning provision is defined. ${i.roadRules.turning||'Record the project turning requirement.'}`);}
  }
  for(let a=0;a<i.roads.length;a++)for(let b=a+1;b<i.roads.length;b++){
    const r=i.roads[a],s=i.roads[b];for(let k=1;k<r.path.length;k++)for(let j=1;j<s.path.length;j++){
      const p=r.path[k-1],q=r.path[k],c=s.path[j-1],d=s.path[j],dx=q.x-p.x,dy=q.y-p.y,ex=d.x-c.x,ey=d.y-c.y,det=dx*ey-dy*ex;
      if(Math.abs(det)<1e-8)continue;const t=((c.x-p.x)*ey-(c.y-p.y)*ex)/det,u=((c.x-p.x)*dy-(c.y-p.y)*dx)/det;if(t<-.000001||t>1.000001||u<-.000001||u>1.000001)continue;
      const angle=Math.acos(Math.min(1,Math.abs(dx*ex+dy*ey)/(distance(p,q)*distance(c,d))))*180/Math.PI,target=Math.min(i.roadRules.junctionAngle,180-i.roadRules.junctionAngle),exception=i.roadRules.junctionExceptions?.find(e=>e.roadIds.includes(r.id)&&e.roadIds.includes(s.id)&&e.reason.trim());
      put(`${r.id}/${s.id}`,Math.abs(angle-target)<=(i.roadRules.junctionTolerance??10)+.001||exception?'pass':i.roadRules.anglePolicy==='preference'?'unknown':'fail',`Junction angle ${angle.toFixed(2)}°; preference ${i.roadRules.junctionAngle}° ± ${i.roadRules.junctionTolerance??10}°${exception?`; recorded exception: ${exception.reason}`:''}.`);
      put(`${r.id}/${s.id}`,'unknown','Junction turning movements require a separate vehicle manoeuvre check; centreline screening does not establish all permitted movements.');
    }
  }
  return checks;
}
