import assert from 'node:assert/strict';
import { cedarMarket, generateSpine, generateLoop, validateLayout, deriveQuantities } from '../src/geometry.ts';
import { gateSegment, entranceLabel } from '../src/access.ts';
import { DEFAULT_PLANNING } from '../src/planning.ts';
import { boundaryConflictEdges, siteArea } from '../src/boundary.ts';
import { polyInsidePoly, polyArea } from '../src/polygon.ts';
import { serializeProject, parseProject } from '../src/persist.ts';
import { validateSnapshot, snapshotHash, CAPABILITIES } from '../src/snapshot.ts';
import { evaluateLayout } from '../src/economics.ts';
import { runSearch, BASE_PROFILE } from '../src/search.ts';
import { answerLimits, routeQuestion } from '../src/assistant.ts';
let count=0; const check=(name,fn)=>{fn();count++;console.log('PASS '+name);};
const boundary=[{x:10,y:0},{x:120,y:10},{x:110,y:100},{x:0,y:90}];
const sample={...cedarMarket(),planning:{...DEFAULT_PLANNING}};
const base={...sample,boundary,green:{x:45,y:65,w:15,h:10}};
const entranceFor=(pts,i)=>({edge:'west',boundaryEdge:i,offset:Math.hypot(pts[(i+1)%pts.length].x-pts[i].x,pts[(i+1)%pts.length].y-pts[i].y)/2,width:8});
const valid=site=>{const l=generateSpine(site);assert.deepEqual(validateLayout(site,l),[]);assert.ok(l.parcels.length);return l;};
check('all four sloping boundary approaches generate contained connected streets',()=>{
 for(const pts of [boundary,[...boundary].reverse()])for(let i=0;i<pts.length;i++){
  const site={...base,boundary:pts,entrance:entranceFor(pts,i)},layout=valid(site),q=deriveQuantities(site,layout);
  assert.ok(polyInsidePoly(layout.accessConnector,pts));assert.equal(q.roadArea+q.parcelArea+q.greenArea+q.unallocatedArea,siteArea(site));assert.ok(q.unallocatedArea>=0);
 }
});
check('rectangular gate apron has hand-calculated 21 m², road+apron 723 m²',()=>{const s={...sample,entrance:{...sample.entrance,boundaryEdge:3}};const l=valid(s);assert.equal(polyArea(l.accessConnector),21);assert.equal(deriveQuantities(s,l).roadArea,723);});
const site={...base,entrance:entranceFor(boundary,3)},layout=valid(site);
check('entrance labels and coordinates address the actual sloping edge',()=>{const g=gateSegment(site);assert.deepEqual(g.center,{x:5,y:45});assert.match(entranceLabel(site.entrance),/edge 4/);});
check('entrance apron contributes to real road costs',()=>{const q=deriveQuantities(site,layout);assert.equal(evaluateLayout(site,layout,850e6).roadCost,q.roadArea*800000);});
check('fixed loop explicitly refuses boundary edge entrances',()=>assert.match(generateLoop(site).supportError,/Spine/));
check('legacy rectangular generation and quantities remain unchanged',()=>assert.deepEqual(deriveQuantities(sample,valid(sample)),{n:20,roadArea:720,greenArea:480,parcelArea:4000,unallocatedArea:6800}));
check('invalid edge, corner-spanning gate and park-obstructed apron return no geometry',()=>{
 for(const s of [{...site,entrance:{...site.entrance,boundaryEdge:99}},{...site,entrance:{...site.entrance,offset:1}},{...site,green:{x:1,y:35,w:25,h:25}}]){const l=generateSpine(s);assert.ok(l.supportError);assert.equal(l.roads.length,0);assert.equal(l.parcels.length,0);}
});
check('connector geometry cannot be altered, overlapped or omitted and remain valid',()=>{
 for(const l of [{...layout,accessConnector:undefined},{...layout,accessConnector:layout.accessConnector.map((p,i)=>i===0?{x:-1,y:p.y}:p)},{...layout,roads:[...layout.roads,{x:4,y:40,w:8,h:8}]}])assert.ok(validateLayout(site,l).length);
});
const state={spec:{family:'spine',frontage:10},green:site.green,entrance:site.entrance,lots:{},profileId:'family-200',greenLocked:false,priceS:'850',ceilingS:'850',ownerS:'10',targetS:'15',baseSpec:{w:120,h:100,boundary,planning:{...DEFAULT_PLANNING,minGreenArea:150}}};
check('version 4 project preserves boundary entrance and minimum-area commitment',()=>{const saved=serializeProject(state,[]);assert.equal(saved.version,4);assert.deepEqual(parseProject(JSON.parse(JSON.stringify(saved))).project.state,state);assert.equal(parseProject({...saved,version:3}).ok,false);});
check('malformed boundary edge never enters persisted projects',()=>{for(const boundaryEdge of [-1,99,0.5,'1',null])assert.equal(parseProject({...serializeProject(state,[]),state:{...state,entrance:{...site.entrance,boundaryEdge}}}).ok,false);});
const snapshot={version:4,site:state.baseSpec,entrance:site.entrance,green:site.green,greenLocked:false,lots:{},spec:state.spec,profileId:state.profileId,assumptions:{price:850e6,ceiling:850e6,owner:10e9,target:.15},provenance:{sample:'custom',photo:false},capabilities:[...CAPABILITIES],selected:null};
check('scenario version 4 validates, rejects downgrade and hashes entrance changes',()=>{assert.ok(validateSnapshot(snapshot).ok);assert.equal(validateSnapshot({...snapshot,version:3}).ok,false);assert.notEqual(snapshotHash(snapshot),snapshotHash({...snapshot,entrance:{...snapshot.entrance,offset:40}}));});
check('exported record version 5 reopens boundary-edge access exactly',()=>{const r=parseProject({format:'UNBUILT decision record',exportVersion:5,state:{site:state.baseSpec,plan:state.spec,entrance:state.entrance,openSpace:{geometry:state.green,locked:false},assumptions:{assumedPriceRp:850e6,ceilingRp:850e6,ownerExpectationRp:10e9,targetFraction:.15}},events:[]});assert.ok(r.ok);assert.deepEqual(r.project.state.entrance,state.entrance);assert.deepEqual(r.project.state.baseSpec,state.baseSpec);});
check('minimum-area commitment allows moving/resizing above minimum and rejects smaller parks',()=>{valid({...sample,planning:{...DEFAULT_PLANNING,minGreenArea:480},green:{x:65,y:65,w:25,h:20}});const s={...sample,planning:{...DEFAULT_PLANNING,minGreenArea:480},green:{x:65,y:65,w:20,h:20}};assert.match(generateSpine(s).supportError,/480/);assert.ok(validateLayout(s,generateSpine(s)).length);});
check('malformed minimum-area settings are rejected before generation',()=>{for(const minGreenArea of [-1,NaN,'480',null,250001])assert.ok(generateSpine({...sample,planning:{...DEFAULT_PLANNING,minGreenArea}}).supportError);});
check('minimum-area-only settings cannot silently enter older data envelopes',()=>{const minState={...state,entrance:sample.entrance};const project=serializeProject(minState,[]);assert.equal(project.version,4);assert.equal(parseProject({...project,version:3}).ok,false);assert.equal(validateSnapshot({...snapshot,entrance:sample.entrance,version:3}).ok,false);});
check('search with sloping gate only returns revalidated measured Spine candidates',()=>{const r=runSearch({site,profile:BASE_PROFILE,selectedPrice:850e6,locks:{green:site.green,priceCeiling:850e6,ownerExpectation:10e9,targetFraction:.15},ranges:{families:['spine','loop'],frontages:[9,10,11,12]},seed:7,budget:8});assert.ok(r.candidates.length);for(const c of r.candidates){assert.equal(c.family,'spine');assert.equal(c.quantities.roadArea,deriveQuantities(site,generateSpine(site,c.frontage)).roadArea);}});
check('crossing, repeated and backtracking edges identify repair locations',()=>{assert.deepEqual(boundaryConflictEdges([{x:0,y:0},{x:100,y:100},{x:0,y:100},{x:100,y:0}]),[0,2]);assert.deepEqual(boundaryConflictEdges(boundary),[]);assert.ok(boundaryConflictEdges([{x:0,y:0},{x:50,y:0},{x:25,y:0},{x:25,y:50}]).includes(0));});
check('planning investigation wins over incidental change keywords',()=>{assert.equal(routeQuestion('Keep this green space. Do not increase home selling price. What else can change?').route,'try');assert.equal(routeQuestion('What is limiting the number of homes?').route,'limits');assert.equal(routeQuestion('Why did the allowance fall?').route,'why');});
check('capacity answer states uncertainty and prepares a supported investigation',()=>{const s=answerLimits({quantities:deriveQuantities(site,layout),validity:{errors:[],warnings:[]}}, {locksHeld:['Park shape and location'],gridScope:'Spine and Loop × 9–12 m'}).flatMap(s=>s.lines).join(' ');assert.match(s,/cannot identify/);assert.match(s,/not automatically accessible/);assert.match(s,/not prove/);assert.match(s,/Park shape and location/);});
console.log(`ALL ${count} PLANNER FEEDBACK CHECKS PASS`);
