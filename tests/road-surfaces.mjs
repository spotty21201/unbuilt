import assert from 'node:assert/strict';
import {mergedRoadSurface,streetSurface,streetPolygon,surfaceArea,surfaceFrontage,surfaceInside,surfaceOverlapsRect,surfaceOverlapsPoly,usesShapedStreets} from '../src/road-surfaces.ts';
import {streetErrors,streetNodes,splitJunctions,appendStreetPath,moveStreetNode,nearestStreetPoint,disconnectedStreets,networkFromRoads,roundedStreetNetwork,halfRoadWidth} from '../src/streets.ts';
import {starterProject} from '../src/projects.ts';
import {generateSpine,generateLoop,unionArea,halfWidthStreetDraft,deriveQuantities,validateLayout,streetConflict,validateLotPoly} from '../src/geometry.ts';
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
check('legacy generated bends merge into one unchanged pavement polygon without internal seams',()=>{
  const s={...base,green:{x:40,y:32,w:40,h:30}},l=generateSpine(s),before=JSON.stringify(l);
  assert.ok(l.roads.length>1);const merged=mergedRoadSurface(l.roads);assert.equal(merged.length,1);near(surfaceArea(merged),unionArea(l.roads));assert.equal(JSON.stringify(l),before);
  assert.equal(l.roadSurface,undefined);assert.deepEqual(mergedRoadSurface([]),[]);
});
check('merged legacy loops retain inner holes and leave contained land outside pavement',()=>{
  const l=generateLoop(base),s=mergedRoadSurface(l.roads);assert.equal(s.length,1);assert.equal(s[0].length,2);near(surfaceArea(s),2076);assert.equal(surfaceOverlapsRect(s,{x:30,y:30,w:10,h:10}),false);
});
check('entrance aprons join the displayed outline without duplicate shared-edge strokes or area',()=>{
  const roads=[{x:10,y:47,w:50,h:6}],apron=[{x:0,y:46},{x:10,y:47},{x:10,y:53},{x:0,y:54}],s=mergedRoadSurface(roads,undefined,apron);
  assert.equal(s.length,1);near(surfaceArea(s),370);assert.ok(!s[0][0].some((p,i,r)=>p.x===10&&r[(i+1)%r.length].x===10));
  const shaped=streetSurface(rounded).surface,old=JSON.stringify(shaped);near(surfaceArea(mergedRoadSurface([],shaped)),surfaceArea(shaped));assert.equal(JSON.stringify(shaped),old);
});
check('explicitly rounding generated loops removes false dead-end caps and fillets all four outer corners',()=>{
  const l=generateLoop(base),before=JSON.stringify(l.roads),n=roundedStreetNetwork(networkFromRoads(l.roads),4),trial=site(n),r=generateSpine(trial);
  assert.deepEqual(streetErrors(n),[]);assert.deepEqual(validateLayout(trial,r),[]);assert.equal(n.segments.length,6);assert.equal(r.roadRounding.limited,0);
  for(const [x,y]of[[10,10],[109.9,10],[10,89.9],[109.9,89.9]])assert.equal(surfaceOverlapsRect(r.roadSurface,{x,y,w:.05,h:.05}),false);
  near(surfaceArea(r.roadSurface),2076+2*16*(1-Math.PI/4),.06);near(surfaceFrontage(r.roadSurface,[{x:0,y:47},{x:0,y:53},{x:-1,y:53},{x:-1,y:47}]),6);
  assert.equal(JSON.stringify(l.roads),before);assert.equal(networkFromRoads(l.roads).cornerRadius,undefined);
});
check('zero-radius normalized generated loops preserve the exact original road union',()=>{
  const l=generateLoop(base);near(surfaceArea(streetSurface(roundedStreetNetwork(networkFromRoads(l.roads),0)).surface),unionArea(l.roads));
});
check('generated-bend fillets are measured, preserve spaces and reconcile quantities and cost',()=>{
  const s={...base,green:{x:40,y:32,w:40,h:30}},old=generateSpine(s),n=roundedStreetNetwork(networkFromRoads(old.roads),4),trial={...s,planning:{...s.planning,streetNetwork:n}},r=generateSpine(trial),e=evaluateLayout(trial,r,850e6);
  assert.deepEqual(validateLayout(trial,r),[]);assert.deepEqual(r.green,s.green);assert.ok(r.roadSurface[0][0].length>20);near(e.quantities.roadArea,surfaceArea(r.roadSurface));near(e.roadCost,e.quantities.roadArea*800000);near(e.quantities.roadArea+e.quantities.greenArea+e.quantities.parcelArea+e.quantities.unallocatedArea,12000);
});
check('rounding saved manual loops normalizes redundant caps without mutating inputs or real dead ends',()=>{
  const old=networkFromRoads(generateLoop(base).roads),before=JSON.stringify(old),n=roundedStreetNetwork(old,4);
  assert.equal(n.segments.length,6);assert.equal(surfaceOverlapsRect(streetSurface(n).surface,{x:10,y:10,w:.05,h:.05}),false);assert.equal(JSON.stringify(old),before);
  const short={segments:[line('short-a',30,30,32,30),line('short-b',32,30,32,32)]};assert.deepEqual(roundedStreetNetwork(short,4).segments,short.segments);
  assert.deepEqual(roundedStreetNetwork(branch,4).segments,branch.segments);near(surfaceFrontage(streetSurface(roundedStreetNetwork(branch,4)).surface,[{x:37,y:90},{x:43,y:90},{x:43,y:91},{x:37,y:91}]),6);
});
check('half-width preset follows 6, 8, 10 and 12 metre street widths without changing inputs',()=>{
  for(const width of[6,8,10,12]){const n={segments:[line('a',0,50,50,50,width)]},before=JSON.stringify(n);near(halfRoadWidth(n),width/2);assert.equal(JSON.stringify(n),before);}near(halfRoadWidth({segments:[]}),0);
});
check('mixed-width preset explicitly starts with the narrower road',()=>{
  near(halfRoadWidth({segments:[line('a',0,50,50,50,12),line('b',50,50,50,80,8)]}),4);
});
const shortL={segments:[line('a',10,30,40,30),line('b',40,30,40,36)],cornerRadius:3};
check('a short kerb beside a real end cap can use the full half-width tangent',()=>{
  const r=streetSurface(shortL);near(r.minimumRadius,3);assert.equal(r.limited,0);near(surfaceArea(r.surface),216,.03);near(surfaceFrontage(r.surface,[{x:37,y:36},{x:43,y:36},{x:43,y:37},{x:37,y:37}]),6);
});
const shortStep={segments:[line('a',10,30,40,30),line('b',40,30,40,33),line('c',40,33,70,33)],cornerRadius:3};
check('neighbouring fillets meet at the middle of a tight step with no unused straight jog',()=>{
  const r=streetSurface(shortStep);assert.equal(r.limited,4);near(r.minimumRadius,1.5);near(surfaceArea(r.surface),378,.03);const pts=r.surface[0][0];
  for(const p of[{x:43,y:28.5},{x:37,y:34.5}]){
    assert.ok(pts.some((a,i)=>{const b=pts[(i+1)%pts.length];return Math.abs((b.x-a.x)*(p.y-a.y)-(b.y-a.y)*(p.x-a.x))<1e-8&&p.x>=Math.min(a.x,b.x)-1e-8&&p.x<=Math.max(a.x,b.x)+1e-8&&p.y>=Math.min(a.y,b.y)-1e-8&&p.y<=Math.max(a.y,b.y)+1e-8;}));
    assert.ok(!pts.some((a,i)=>Math.abs(a.x-p.x)<1e-8&&Math.abs(pts[(i+1)%pts.length].x-p.x)<1e-8));
  }
});
check('tight merged kerbs have no hard angular transitions outside full-width terminal caps',()=>{
  const r=streetSurface(shortStep),caps=[{x:10,y:27},{x:10,y:33},{x:70,y:30},{x:70,y:36}];
  for(const polygon of r.surface)for(const ring of polygon){assert.ok(isSimple(ring));for(let i=0;i<ring.length;i++){const b=ring[i];if(caps.some(c=>Math.hypot(c.x-b.x,c.y-b.y)<1e-8))continue;const a=ring[(i+ring.length-1)%ring.length],c=ring[(i+1)%ring.length],u={x:b.x-a.x,y:b.y-a.y},v={x:c.x-b.x,y:c.y-b.y};const angle=Math.acos(Math.max(-1,Math.min(1,(u.x*v.x+u.y*v.y)/(Math.hypot(u.x,u.y)*Math.hypot(v.x,v.y)))));assert.ok(angle<.2,`hard join at ${b.x},${b.y}: ${angle}`);}}
});
check('half-width stepped-road geometry is stable under reversed directions and segment order',()=>{
  const reversed={...shortStep,segments:shortStep.segments.map(s=>({...s,a:s.b,b:s.a})).reverse()};near(surfaceArea(streetSurface(shortStep).surface),surfaceArea(streetSurface(reversed).surface));assert.equal(streetSurface(reversed).limited,4);
});
check('scaled half-width turns share their actual pavement with quantities and costs',()=>{
  for(const width of[6,8,10,12]){const n={segments:[line('a',0,50,50,50,width),line('b',50,50,50,80,width)]},rounded=roundedStreetNetwork(n,halfRoadWidth(n)),s={...site(rounded),entrance:{...base.entrance,width:12}},l=generateSpine(s),e=evaluateLayout(s,l,850e6);assert.deepEqual(validateLayout(s,l),[]);near(l.roadRounding.minimumRadius,width/2);near(e.quantities.roadArea,80*width,.04);near(e.roadCost,e.quantities.roadArea*800000);near(e.quantities.roadArea+e.quantities.greenArea+e.quantities.parcelArea+e.quantities.unallocatedArea,12000);}
});
check('half-width generated draft leaves room around kept green without changing its geometry or clearance',()=>{
  const s={...base,green:{x:12,y:44,w:40,h:30}},before=JSON.stringify(s),old=generateSpine(s),raw=roundedStreetNetwork(networkFromRoads(old.roads),3);assert.equal(streetConflict({...s,planning:{...s.planning,streetNetwork:raw}}).kind,'park');
  const d=halfWidthStreetDraft(s,old,10),trial={...s,planning:{...s.planning,streetNetwork:d.network}},l=generateSpine(trial);assert.equal(d.rerouted,true);assert.deepEqual(validateLayout(trial,l),[]);assert.deepEqual(l.green,s.green);near(l.roadRounding.minimumRadius,3);assert.equal(l.roadRounding.limited,0);assert.equal(JSON.stringify(s),before);near(deriveQuantities(trial,l).roadArea,surfaceArea(l.roadSurface));
});
check('half-width draft never silently reroutes a held manual network around its protected-space conflict',()=>{
  const s={...site(branch),green:{x:43,y:53,w:20,h:20}},before=JSON.stringify(s),d=halfWidthStreetDraft(s,generateSpine(s),10);assert.equal(d.rerouted,false);assert.deepEqual(d.network.segments,branch.segments);assert.equal(streetConflict({...s,planning:{...s.planning,streetNetwork:d.network}}).kind,'park');assert.equal(JSON.stringify(s),before);
});
check('half-width drafts retain the actual entrance apron on sloping boundaries',()=>{
  const s={...base,boundary:[{x:10,y:0},{x:60,y:0},{x:120,y:10},{x:110,y:100},{x:0,y:90}],entrance:{edge:'west',boundaryEdge:4,offset:45,width:8}},old=generateSpine(s),d=halfWidthStreetDraft(s,old,10),trial={...s,planning:{...s.planning,streetNetwork:d.network}},l=generateSpine(trial);assert.deepEqual(validateLayout(trial,l),[]);assert.deepEqual(l.accessConnector,old.accessConnector);near(deriveQuantities(trial,l).roadArea,surfaceArea(l.roadSurface)+polyArea(l.accessConnector));
});
console.log(`ALL ${checks.length} ANGLED / ROUNDED STREET CHECKS PASS`);
