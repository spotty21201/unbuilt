import assert from 'node:assert/strict';
import { boundaryErrors, frameForBoundary, siteArea, siteBoundary, siteFrameErrors } from '../src/boundary.ts';
import { polyInsidePoly, rectInsidePoly, rectCorners, polyArea, isSimple } from '../src/polygon.ts';
import { cedarMarket, generateSpine, generateLoop, validateLayout, deriveQuantities, entranceErrors, validateLotPoly } from '../src/geometry.ts';
import { BASE_PROFILE, runSearch } from '../src/search.ts';
import { parseProject, serializeProject } from '../src/persist.ts';
import { validateSnapshot, snapshotHash, CAPABILITIES } from '../src/snapshot.ts';
import { applyDraftEdit, pushUndo, undo, redo } from '../src/draft.ts';
let count = 0;
const check = (name, fn) => { fn(); count++; console.log(`PASS ${name}`); };
const pts = [{x:0,y:0},{x:120,y:0},{x:120,y:100},{x:50,y:100},{x:0,y:60}];
const site = {...cedarMarket(), ...frameForBoundary(pts)};
check('hand-calculated area: rectangle minus 50 × 40 / 2 triangle', () => assert.equal(siteArea(site), 11000));
check('legacy rectangle uses its original area and implicit corners', () => { assert.equal(siteArea(cedarMarket()), 12000); assert.equal(siteBoundary(cedarMarket()).length,4); });
check('clockwise and counterclockwise have same area', () => assert.equal(polyArea([...pts].reverse()),11000));
check('validation rejects crossings, repeated points, spikes, zero area, nonfinite, too many and negative coordinates', () => {
 for (const p of [ [{x:0,y:0},{x:100,y:100},{x:0,y:100},{x:100,y:0}], [...pts,pts[0]], [{x:0,y:0},{x:50,y:0},{x:25,y:0},{x:25,y:50},{x:0,y:50}], [{x:0,y:0},{x:1,y:0},{x:2,y:0}], [{x:NaN,y:0},...pts], Array(65).fill({x:0,y:0}), [{x:-1,y:0},...pts]]) assert.ok(boundaryErrors(p).length);
 assert.equal(isSimple(pts),true); assert.deepEqual(boundaryErrors(pts),[]);
});
const notch=[{x:0,y:0},{x:120,y:0},{x:120,y:100},{x:70,y:100},{x:70,y:40},{x:60,y:40},{x:60,y:100},{x:0,y:100}];
check('containment rejects concavity bridges with all corners inside and collinear contacts', () => {
 assert.equal(rectInsidePoly({x:50,y:30,w:30,h:60},notch),false);
 assert.equal(rectInsidePoly({x:50,y:40,w:30,h:60},notch),false);
 assert.equal(polyInsidePoly(rectCorners({x:0,y:0,w:60,h:40}),notch),true);
});
check('spine filters outside lots, keeps whole lots and reconciles true site area', () => {
 const layout=generateSpine(site,10); assert.deepEqual(validateLayout(site,layout),[]);
 assert.deepEqual(deriveQuantities(site,layout),{n:18,roadArea:720,greenArea:480,parcelArea:3600,unallocatedArea:6200});
 for(const r of [...layout.roads,...layout.parcels,layout.green]) assert.equal(rectInsidePoly(r,pts),true);
 assert.equal(validateLotPoly(site,layout,0,[{x:0,y:27},{x:10,y:27},{x:10,y:73},{x:0,y:73}])[0],'lot must sit inside the site');
});
check('unsupported road network is empty, invalid and leaves all site area unallocated', () => {
 for(const [s,gen] of [[{...site,...frameForBoundary(notch)},generateSpine],[site,generateLoop]]) {
  const layout=gen(s); assert.ok(layout.supportError); assert.deepEqual(layout.roads,[]); assert.deepEqual(layout.parcels,[]); assert.ok(validateLayout(s,layout).length); assert.equal(deriveQuantities(s,layout).unallocatedArea,siteArea(s));
 }
});
check('concave sites with roads and green wholly inside can generate', () => {
 const p=[{x:0,y:0},{x:120,y:0},{x:120,y:100},{x:60,y:100},{x:60,y:80},{x:40,y:80},{x:40,y:100},{x:0,y:100}];
 const s={...cedarMarket(),...frameForBoundary(p)}; const l=generateSpine(s); assert.deepEqual(validateLayout(s,l),[]); assert.equal(siteArea(s),11600);
});
check('full gate must lie on actual west/east boundary; collinear split gate remains valid', () => {
 assert.deepEqual(entranceErrors(site),[]);
 const s={...site,boundary:[{x:0,y:0},{x:120,y:0},{x:120,y:100},{x:50,y:100},{x:0,y:45}]}; assert.ok(entranceErrors(s).length);
 const split={...site,boundary:[{x:0,y:0},{x:120,y:0},{x:120,y:100},{x:50,y:100},{x:0,y:60},{x:0,y:50}]}; assert.deepEqual(entranceErrors(split),[]);
});
check('green drafts cannot enter clipped-away land', () => assert.equal(applyDraftEdit(site.green,{x:'0',y:'70',w:'20',h:'20'},site).draftable,false));
const req={site,profile:BASE_PROFILE,selectedPrice:850e6,locks:{green:site.green,priceCeiling:850e6,ownerExpectation:10e9,targetFraction:.15},ranges:{families:['spine','loop'],frontages:[9,10,11,12]},seed:7,budget:250};
check('search returns only valid contained candidates and hashes changed boundaries', () => {
 const run=runSearch(req); assert.ok(run.candidates.length); assert.ok(run.candidates.every(c=>c.family==='spine'));
 for(const c of run.candidates){const l=generateSpine(site,c.frontage); assert.deepEqual(validateLayout(site,l),[]); assert.equal(c.quantities.unallocatedArea,11000-c.quantities.parcelArea-720-480);}
 assert.notEqual(run.snapshotHash,runSearch({...req,site:cedarMarket()}).snapshotHash);
 const bad=runSearch({...req,site:{...site,...frameForBoundary(notch)}}); assert.equal(bad.qualified,0); assert.equal(bad.valid,0);
});
const state={spec:{family:'spine',frontage:10},green:site.green,entrance:site.entrance,lots:{},profileId:'family-200',greenLocked:true,priceS:'850',ceilingS:'850',ownerS:'10',targetS:'15',baseSpec:frameForBoundary(pts)};
check('polygon persistence roundtrip preserves all coordinates; bad polygon refuses without replacing state', () => {
 const saved=serializeProject(state,[]); assert.equal(saved.version,2); assert.equal(parseProject({...saved,version:1}).ok,false); const back=parseProject(JSON.parse(JSON.stringify(saved))); assert.equal(back.ok,true); assert.deepEqual(back.project.state,state); assert.equal(siteArea(back.project.state.baseSpec),11000);
 for(const boundary of [null,[],[{x:'0',y:0}],notch.map((p,i)=>i===0?{x:NaN,y:0}:p)]) assert.equal(parseProject({...saved,state:{...state,baseSpec:{w:120,h:100,boundary}}}).ok,false);
 assert.ok(siteFrameErrors({...state.baseSpec,w:121}).length);
});
check('boundary Apply is one history step; undo and redo preserve the complete accepted plan', () => {
 const before={...state,baseSpec:{w:120,h:100}}; const hist=pushUndo({past:[],future:[]},before); const u=undo(hist,state); assert.deepEqual(u.snap,before); const r=redo(u.hist,before); assert.deepEqual(r.snap,state);
});
const snap={version:2,site:state.baseSpec,entrance:site.entrance,green:site.green,greenLocked:true,lots:{},spec:state.spec,profileId:state.profileId,assumptions:{price:850e6,ceiling:850e6,owner:10e9,target:.15},provenance:{sample:'custom',photo:false},capabilities:[...CAPABILITIES],selected:{kind:'site',id:'site'}};
check('malformed frontage cannot hang generation or enter persisted snapshots', () => {
 for (const frontage of [0, -1, 1e-300, Infinity, 501]) {
  for (const generate of [generateSpine, generateLoop]) assert.ok(generate(site,frontage).supportError);
  assert.equal(parseProject({...serializeProject(state,[]),state:{...state,spec:{family:'spine',frontage}}}).ok,false);
  assert.equal(validateSnapshot({...snap,spec:{family:'spine',frontage}}).ok,false);
 }
});
check('server snapshot contract preserves polygon and binds hash to geometry', () => {
 assert.equal(validateSnapshot(snap).ok,true); assert.equal(validateSnapshot({...snap,version:1}).ok,false); assert.notEqual(snapshotHash(snap),snapshotHash({...snap,site:{w:120,h:100}}));
 assert.equal(validateSnapshot({...snap,site:{...snap.site,boundary:[pts[0],pts[2],pts[1],pts[3]]}}).ok,false);
 assert.equal(validateSnapshot({...snap,site:{...snap.site,boundary:{}}}).ok,false);
});
console.log(`ALL ${count} BOUNDARY CHECKS PASS`);
