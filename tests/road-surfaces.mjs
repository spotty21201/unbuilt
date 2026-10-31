import assert from 'node:assert/strict';
import {streetSurface,streetPolygon,surfaceArea,surfaceFrontage,surfaceInside,surfaceOverlapsRect,surfaceOverlapsPoly,usesShapedStreets} from '../src/road-surfaces.ts';
import {streetErrors,streetNodes,splitJunctions,appendStreetPath,moveStreetNode,nearestStreetPoint,disconnectedStreets,networkFromRoads} from '../src/streets.ts';
import {starterProject} from '../src/projects.ts';
import {generateSpine,deriveQuantities,validateLayout,streetConflict,validateLotPoly} from '../src/geometry.ts';
import {polyArea,rectCorners,isSimple} from '../src/polygon.ts';
import {evaluateLayout} from '../src/economics.ts';
import {assessDrainage} from '../src/development.ts';
import {parseProject,serializeProject} from '../src/persist.ts';
import {CAPABILITIES,snapshotHash,validateSnapshot} from '../src/snapshot.ts';
import {assistantBaseline,measureProposal,validateModelChoice} from '../src/ai-assistant.ts';
import {BASE_PROFILE,runSearch} from '../src/search.ts';
const checks=[],check=(name,fn)=>{fn();checks.push(name);console.log('PASS '+name);};
const near=(a,b,t=1e-7)=>assert.ok(Math.abs(a-b)<=t,`${a} != ${b} (±${t})`);
const line=(id,ax,ay,bx,by,width=6)=>({id,a:{x:ax,y:ay},b:{x:bx,y:by},width});
const state=starterProject(true,'Roads').state,base={...state.baseSpec,green:state.green,entrance:state.entrance};
const site=n=>({...base,planning:{...base.planning,streetNetwork:n}});
const trunk=line('entry',0,50,120,50),branch=appendStreetPath({segments:[trunk]},[{x:40,y:50},{x:40,y:90}],6);
const rounded={...branch,cornerRadius:4};
const valid=n=>{assert.deepEqual(streetErrors(n),[]);const s=site(n),l=generateSpine(s);assert.deepEqual(validateLayout(s,l),[]);return l;};
check('arbitrary bearings use normal-offset full-width pavement and true segment lengths',()=>{
  for(const [dx,dy]of[[40,30],[17,31],[-24,7],[0,30],[40,0]]){const s=line('angle',50,50,50+dx,50+dy,8),p=streetPolygon(s);near(polyArea(p),Math.hypot(dx,dy)*8);near(Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y),8);assert.deepEqual(streetErrors({segments:[s]}),[]);}
});
check('diagonal crossings join at grade, split into four legs and retain shared nodes',()=>{
  const n=splitJunctions({cornerRadius:3,segments:[line('a',10,10,90,90),line('b',10,90,90,10)]});assert.equal(n.segments.length,4);assert.equal(streetNodes(n).length,5);assert.equal(n.cornerRadius,3);assert.deepEqual(disconnectedStreets(n,{x:10,y:10}),[]);const moved=moveStreetNode(n,{x:50,y:50},{x:52,y:48});assert.equal(moved.segments.filter(s=>[s.a,s.b].some(p=>p.x===52&&p.y===48)).length,4);assert.equal(moved.cornerRadius,3);
});
check('angled collinear repeats are rejected while joined legs and corner metadata survive helpers',()=>{
  assert.ok(streetErrors({segments:[line('a',10,10,50,50),line('b',30,30,60,60)]}).length);assert.deepEqual(streetErrors({segments:[line('a',10,10,50,50),line('b',50,50,70,70)]}),[]);assert.equal(appendStreetPath(rounded,[{x:40,y:90},{x:50,y:85}],6).cornerRadius,4);
});
check('projection onto an angled street retains the exact fractional joining point',()=>{
  const hit=nearestStreetPoint({segments:[line('a',10,10,70,40)]},{x:30,y:25});near(hit.point.x,32);near(hit.point.y,21);const n=appendStreetPath({segments:[line('a',10,10,70,40)]},[hit.point,{x:32,y:40}],6);assert.equal(n.segments.length,3);assert.deepEqual(disconnectedStreets(n,{x:10,y:10}),[]);
});
check('two diagonal crossing areas subtract the square intersection once',()=>{
  const n={segments:[line('a',20,20,80,80,8),line('b',20,80,80,20,8)]};near(surfaceArea(streetSurface(n).surface),2*Math.hypot(60,60)*8-64);
});
check('legacy streets keep identical geometry and square area until explicitly rounded',()=>{
  const old=valid(branch),zero=valid({...branch,cornerRadius:0});assert.equal(old.roadSurface,undefined);assert.equal(deriveQuantities(site(branch),old).roadArea,942);assert.deepEqual(zero.parcels,old.parcels);assert.equal(surfaceArea(zero.roadSurface),942);assert.equal(usesShapedStreets(branch),false);
});
check('T-junction circular fillets match independently derived added area within chord tolerance',()=>{
  const l=valid(rounded),area=surfaceArea(l.roadSurface);near(area,942+2*16*(1-Math.PI/4),.05);assert.equal(l.roadRounding.limited,0);assert.equal(l.roadRounding.minimumRadius,4);assert.ok(l.roadSurface[0][0].length>20);
  // Terminal caps stay straight and full width; no shrinking of the entrance mouth.
  near(surfaceFrontage(l.roadSurface,[{x:0,y:47},{x:0,y:53},{x:-1,y:53},{x:-1,y:47}]),6);
});
check('L turns have tangent circular kerbs, deterministic winding and finite simple outlines',()=>{
  for(const angle of[30,45,60,90,120,150]){const a=angle*Math.PI/180,n={cornerRadius:4,segments:[line('a',20,50,60,50),line('b',60,50,60+30*Math.cos(a),50+30*Math.sin(a))]},r=streetSurface(n);assert.ok(r.surface.length);assert.ok(surfaceArea(r.surface)>0);for(const p of r.surface)for(const ring of p){assert.ok(ring.every(p=>Number.isFinite(p.x+p.y)));assert.ok(isSimple(ring));}near(surfaceArea(r.surface),surfaceArea(streetSurface({...n,segments:n.segments.map(s=>({...s,a:s.b,b:s.a})).reverse()}).surface),1e-6);}
});
check('bend joins close butt-cap notches at offset kerb intersections',()=>{
  const n={cornerRadius:0,segments:[line('a',20,50,60,50),line('b',60,50,60,90)]},s=streetSurface(n).surface;
  near(surfaceArea(s),480);assert.equal(surfaceOverlapsRect(s,{x:60.5,y:47.5,w:1,h:1}),true);assert.equal(s[0][0].length,6);
  const r=streetSurface({...n,cornerRadius:4});near(surfaceArea(r.surface),480,.06);assert.equal(r.limited,0);
});
check('short adjacent kerbs cap radii without self-crossing or hiding the reduction',()=>{
  const r=streetSurface({...rounded,cornerRadius:50});assert.ok(r.limited>0);assert.ok(r.minimumRadius>0&&r.minimumRadius<50);for(const polygon of r.surface)for(const ring of polygon)assert.ok(isSimple(ring));for(const radius of[-1,51,NaN,Infinity,'4'])assert.ok(streetErrors({...rounded,cornerRadius:radius}).length);
});
check('road loops preserve holes, excluding the inner land from area and conflicts',()=>{
  const n={segments:[line('a',20,20,80,20),line('b',80,20,80,80),line('c',80,80,20,80),line('d',20,80,20,20)]},s=streetSurface(n).surface;
  assert.equal(s[0].length,2);near(surfaceArea(s),66*66-54*54);assert.equal(surfaceOverlapsRect(s,{x:30,y:30,w:10,h:10}),false);assert.equal(surfaceOverlapsPoly(s,rectCorners({x:30,y:30,w:10,h:10})),false);assert.equal(surfaceOverlapsRect(s,{x:21,y:30,w:10,h:10}),true);near(surfaceFrontage(s,rectCorners({x:23,y:30,w:10,h:10})),10);
});
check('diagonal pavement avoids bounding-box false positives and catches true full-width conflicts',()=>{
  const n=appendStreetPath({segments:[trunk]},[{x:30,y:50},{x:65,y:85}],6),l=valid(n);assert.ok(l.roadSurface);assert.match(l.unallocatedNote,/angled legs remains unallocated/);const s=streetSurface({segments:[line('a',20,20,80,80)]}).surface;assert.equal(surfaceOverlapsRect(s,{x:20,y:65,w:10,h:10}),false);assert.equal(surfaceOverlapsRect(s,{x:49,y:49,w:3,h:3}),true);assert.equal(surfaceInside(s,rectCorners({x:20,y:20,w:60,h:60})),false);
  const bad=appendStreetPath({segments:[trunk]},[{x:110,y:50},{x:119,y:90}],6);assert.equal(streetConflict(site(bad)).kind,'boundary');
});
check('a fillet entering protected green or a held lot blocks acceptance',()=>{
  const s={...site(rounded),green:{x:43,y:53,w:20,h:20}};assert.equal(streetConflict(s).kind,'park');const safe={...site({...rounded,cornerRadius:0}),green:s.green};assert.equal(streetConflict(safe),null);
  const held={...site(rounded),planning:{...site(rounded).planning,lotPlan:[{x:43,y:53,w:20,h:20}]}};assert.equal(streetConflict(held).kind,'lot');assert.match(generateSpine(held).supportError,/held Lot/);
});
check('parcel generation removes fillet conflicts and reports only actual pavement frontage',()=>{
  const l=valid(rounded);for(const p of l.parcels){assert.equal(surfaceOverlapsRect(l.roadSurface,p),false);assert.ok(surfaceFrontage(l.roadSurface,rectCorners(p))>0);}const n={segments:[line('a',20,20,80,80)]},s=streetSurface(n).surface;near(surfaceFrontage(s,rectCorners({x:20,y:65,w:10,h:10})),0);
  const i=l.parcels.findIndex(p=>p.x===40&&p.y<47);if(i>=0){const p=l.parcels[i],pts=rectCorners(p).map(q=>({...q,y:q.y+20}));assert.ok(validateLotPoly(site(rounded),l,i,pts).length);}
});
check('costs and drainage use unioned curved pavement and the full land budget reconciles',()=>{
  const n={...appendStreetPath({segments:[trunk]},[{x:30,y:50},{x:65,y:85}],8),cornerRadius:4},s=site(n),l=valid(n),e=evaluateLayout(s,l,850e6),q=e.quantities;near(q.roadArea,surfaceArea(l.roadSurface));near(e.roadCost,q.roadArea*800000);near(q.roadArea+q.greenArea+q.parcelArea+q.unallocatedArea,12000);
  const r=assessDrainage(s,l,e,{siteCatchment:true,noStorage:true,durationMinutes:30,tcMinutes:15,intensity:100,coefficients:{roof:.9,roads:.85,green:.2,other:.35}});near(r.areas.roads,q.roadArea);near(Object.values(r.areas).reduce((a,b)=>a+b,0),12000);near(r.peak,(r.areas.roof*.9+r.areas.roads*.85+r.areas.green*.2+r.areas.other*.35)*100/3600000);
});
const st={...state,baseSpec:{...state.baseSpec,planning:site(rounded).planning}},now='2026-10-31T00:00:00.000Z',alt={id:'rounded',name:'Rounded streets',note:'Review turns',createdAt:now,updatedAt:now,state:st};
check('sloping boundary entrances keep disjoint measured aprons when corners are rounded',()=>{
  const s={...base,boundary:[{x:10,y:0},{x:60,y:0},{x:120,y:10},{x:110,y:100},{x:0,y:90}],entrance:{edge:'west',boundaryEdge:4,offset:45,width:8}},auto=generateSpine(s),n={...networkFromRoads(auto.roads),cornerRadius:4},manual={...s,planning:{...s.planning,streetNetwork:n}},l=generateSpine(manual);
  assert.deepEqual(validateLayout(manual,l),[]);assert.deepEqual(l.accessConnector,auto.accessConnector);near(deriveQuantities(manual,l).roadArea,surfaceArea(l.roadSurface)+polyArea(l.accessConnector));assert.equal(surfaceOverlapsPoly(l.roadSurface,l.accessConnector),false);
});
check('project v14 restores precise road geometry, radius and saved alternatives, rejecting downgrades',()=>{
  for(const [working,alternatives]of[[st,undefined],[state,[alt]],[st,[alt]]]){const p=serializeProject(working,[],'Roads',alternatives),v=parseProject(JSON.parse(JSON.stringify(p)));assert.equal(p.version,14);assert.equal(v.ok,true);assert.deepEqual(v.project.state,working);if(alternatives)assert.deepEqual(v.project.alternatives,alternatives);assert.equal(parseProject({...p,version:13}).ok,false);}
});
const snapshot={version:12,site:st.baseSpec,entrance:st.entrance,green:st.green,greenLocked:true,lots:{},spec:st.spec,profileId:st.profileId,assumptions:{price:850e6,ceiling:850e6,owner:10e9,target:.15},provenance:{sample:'custom',photo:false},capabilities:[...CAPABILITIES],selected:null};
check('snapshot v12 binds precise road radius and requires its capability across JSON transport',()=>{
  assert.equal(validateSnapshot(snapshot).ok,true);assert.equal(validateSnapshot({...snapshot,version:11}).ok,false);assert.equal(validateSnapshot({...snapshot,capabilities:CAPABILITIES.filter(c=>c!=='angled-rounded-streets')}).ok,false);near(assistantBaseline(snapshot).result.economics.quantities.roadArea,surfaceArea(valid(rounded).roadSurface));const other=structuredClone(snapshot);other.site.planning.streetNetwork.cornerRadius+=.000001;assert.notEqual(snapshotHash(snapshot,true),snapshotHash(other,true));assert.equal(snapshotHash(snapshot,true),snapshotHash(JSON.parse(JSON.stringify(snapshot)),true));
});
check('decision record v15 restores working roads and alternative-only roads, rejecting downgrades',()=>{
  for(const [working,alternatives]of[[st,undefined],[state,[alt]]]){const r={format:'UNBUILT decision record',exportVersion:15,state:{site:working.baseSpec,entrance:working.entrance,plan:{...working.spec,profile:working.profileId},openSpace:{geometry:working.green,locked:true},assumptions:{assumedPriceRp:850e6,ceilingRp:850e6,ownerExpectationRp:10e9,targetFraction:.15}},...(alternatives?{alternatives}:{}),events:[]};const p=parseProject(r);assert.equal(p.ok,true,p.error);assert.deepEqual(p.project.state.baseSpec,working.baseSpec);if(alternatives)assert.deepEqual(p.project.alternatives,alternatives);assert.equal(parseProject({...r,exportVersion:14}).ok,false);}
});
check('search and measured AI cost experiments retain the exact reviewed road outlines',()=>{
  const s=site(rounded),area=surfaceArea(valid(rounded).roadSurface),r=runSearch({site:s,profile:BASE_PROFILE,selectedPrice:850e6,locks:{green:s.green,priceCeiling:850e6,ownerExpectation:10e9,targetFraction:.15},ranges:{families:['spine','loop'],frontages:[10,11]},seed:7,budget:8});assert.ok(r.candidates.length);for(const c of r.candidates){near(c.quantities.roadArea,area);assert.equal(c.family,'spine');}
  const answer=validateModelChoice('propose_experiment',{purpose:'cost_sensitivity',design:{},costs:{roadPerM2:700000}},snapshot,[]);const m=measureProposal(snapshot,answer.proposal);assert.equal(m.planHash,snapshotHash(snapshot,true));assert.ok(m.findings.some(f=>f.id==='streets'&&f.text.includes('change 0')));assert.ok(m.findings.some(f=>f.id==='costs'&&f.text.includes('→')));const changed=structuredClone(snapshot);changed.site.planning.streetNetwork.cornerRadius=5;assert.throws(()=>measureProposal(changed,answer.proposal),/older plan/);
});
console.log(`ALL ${checks.length} ANGLED / ROUNDED STREET CHECKS PASS`);
