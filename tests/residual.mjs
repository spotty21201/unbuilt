// Residual land classification fixtures (Coder-owned). Hand-derived site:
// 100x60 boundary; road band y28-32; two parcel rows (16 lots of 200 m2)
// x0-80; one 100 m2 open space at x85-95, y8-18. Remainder must reconcile:
// 6000 - 3200 - 400 - 100 = 2300 m2, split by the stated rules.
import { classifyResidual, residualForLayout } from "../src/residual.ts";
import {starterProject} from '../src/projects.ts';
import {generateSpine,deriveQuantities,validateLayout} from '../src/geometry.ts';
import {appendStreetPath,networkFromRoads} from '../src/streets.ts';
import { rectCorners } from "../src/polygon.ts";

let failures = 0;
function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${ok ? "PASS" : "FAIL"} ${name}: actual=${JSON.stringify(actual)}`);
  if (!ok) { console.log(`  expected=${JSON.stringify(expected)}`); failures++; }
}
const near = (name, actual, expected, tol = 0.5) =>
  check(name, typeof actual === "number" && Math.abs(actual - expected) <= tol, true);
const R = (x, y, w, h) => rectCorners({ x, y, w, h });

const parcels = [];
for (const y of [8, 32]) for (let x = 0; x < 80; x += 10) parcels.push(R(x, y, 10, 20));
const input = {
  boundary: R(0, 0, 100, 60),
  parcels,
  pavement: [R(0, 28, 100, 4)],
  spaces: [R(85, 8, 10, 10)],
  clearanceBuffers: [],
  minLotArea: 150,
};
// Remainder forms two connected components (north and south of the road),
// each touching pavement: both developable at component level.
const rep = classifyResidual(input);
near("resid-remainder", rep.remainderArea, 2300);
near("resid-developable-area", rep.totals.developable.area, 2300);
check("resid-developable-count", rep.totals.developable.count, 2);
check("resid-toosmall-count", rep.totals["too-small"].count, 0);
check("resid-inaccessible-count", rep.totals.inaccessible.count, 0);
check("resid-reserved-count", rep.totals["reserved-clearance"].count, 0);
// Class areas always reconcile to the measured remainder.
const sum = Object.values(rep.totals).reduce((s, t) => s + t.area, 0);
near("resid-reconciles", sum, rep.remainderArea, 0.01);

// Clearance ring over the south strip reclassifies its whole component.
const cleared = classifyResidual({ ...input, clearanceBuffers: [R(0, 0, 100, 10)] });
check("resid-clearance-count", cleared.totals["reserved-clearance"].count, 1);
near("resid-clearance-area", cleared.totals["reserved-clearance"].area, 1100);
check("resid-clearance-developable", cleared.totals.developable.count, 1);

// Isolated small remainder beside a road: too small despite access.
const small = classifyResidual({
  boundary: R(0, 0, 30, 30), parcels: [R(0, 0, 30, 25)], pavement: [R(0, 25, 30, 2)],
  spaces: [], clearanceBuffers: [], minLotArea: 150,
});
check("resid-small-count", small.totals["too-small"].count, 1);
near("resid-small-area", small.remainderArea, 90);

// Large remainder with no pavement at all: inaccessible.
const stranded = classifyResidual({
  boundary: R(0, 0, 30, 30), parcels: [R(0, 0, 30, 20)], pavement: [],
  spaces: [], clearanceBuffers: [], minLotArea: 150,
});
check("resid-stranded-count", stranded.totals.inaccessible.count, 1);
near("resid-stranded-area", stranded.remainderArea, 300);

// Degenerate boundary refuses quietly.
check("resid-empty", classifyResidual({ ...input, boundary: [] }).remainderArea, 0);
// A fully allocated site leaves no remainder.
const full = classifyResidual({ ...input, parcels: [...parcels, R(80, 32, 20, 20), R(0, 0, 100, 8), R(0, 52, 100, 8)] });
near("resid-full", full.remainderArea, 300);

const bare=classifyResidual({boundary:R(0,0,100,100),parcels:[],pavement:[],spaces:[],clearanceBuffers:[],minLotArea:150});
near('resid-unallocated-whole-site',bare.remainderArea,10000,.000001);
check('resid-whole-site-inaccessible',bare.totals.inaccessible.count,1);

// Whole pavement polygons keep their holes; inner and outer residual land
// both adjoin the ring kerb, and its hole is never counted as pavement.
const donut = classifyResidual({ boundary:R(0,0,100,100),parcels:[],pavement:[],pavementSurface:[[R(10,10,80,80),R(20,20,60,60)]],spaces:[],clearanceBuffers:[],minLotArea:150 });
near('resid-road-hole-area',donut.remainderArea,7200,.000001);
check('resid-road-hole-components',donut.totals.developable.count,2);
check('resid-preserves-fragment-holes',donut.fragments.some(f=>f.holes.length===1),true);

// Enclosing an allocation does not imply sharing its edge through a hole.
const nested = classifyResidual({boundary:R(0,0,100,100),parcels:[R(30,30,40,10),R(30,60,40,10),R(30,40,10,20),R(60,40,10,20)],pavement:[R(40,40,20,20)],spaces:[],clearanceBuffers:[],minLotArea:150});
near('resid-enclosed-road-not-access',nested.totals.inaccessible.area,8400,.000001);
const gap = classifyResidual({boundary:R(0,0,30,30),parcels:[R(0,0,30,10),R(0,16,30,.25)],pavement:[R(0,10,30,6)],spaces:[],clearanceBuffers:[],minLotArea:150});
near('resid-quarter-metre-gap-is-not-road-access',gap.totals.inaccessible.area,412.5,.000001);
const corner = classifyResidual({boundary:R(0,0,30,30),parcels:[R(10,0,20,10),R(0,10,10,20)],pavement:[R(0,0,10,10)],spaces:[],clearanceBuffers:[],minLotArea:150});
near('resid-point-touch-is-not-road-access',corner.totals.inaccessible.area,400,.000001);
const parkHole={boundary:R(0,0,100,100),parcels:[],pavement:[],spaces:[R(40,40,20,20)],clearanceBuffers:[R(40,40,20,20)],minLotArea:150};
near('resid-green-hole-is-not-reserved-land',classifyResidual(parkHole).totals['reserved-clearance'].area,0,.000001);
near('resid-real-clearance-flags-whole-region',classifyResidual({...parkHole,clearanceBuffers:[R(38,38,24,24)]}).totals['reserved-clearance'].area,9600,.000001);
const sliver=classifyResidual({boundary:R(0,0,1,1),parcels:[R(0,0,1,.9999)],pavement:[],spaces:[],clearanceBuffers:[],minLotArea:150});
near('resid-tiny-fragment-retained',sliver.remainderArea,.0001,1e-9);
check('resid-tiny-fragment-class',sliver.totals['too-small'].count,1);

const state=starterProject(true,'Residual checks').state,base={...state.baseSpec,green:state.green,entrance:state.entrance};
const network=networkFromRoads(generateSpine(base).roads);
const manual=appendStreetPath(network,[{x:40,y:50},{x:64,y:78},{x:64,y:92}],6);
const checkLayout=(name,site,edits=new Map())=>{const l=generateSpine(site);check(name+'-valid',validateLayout(site,l,edits),[]);const r=residualForLayout(site,l,edits,180);near(name+'-reconciles',r.remainderArea,deriveQuantities(site,l,edits).unallocatedArea,.000001);near(name+'-class-sum',Object.values(r.totals).reduce((n,t)=>n+t.area,0),r.remainderArea,.000001);return {layout:l,report:r};};
const orthogonal={...base,planning:{...base.planning,streetNetwork:network}};
checkLayout('resid-manual-square',orthogonal);
const angled={...base,planning:{...base.planning,streetNetwork:{...manual,cornerRadius:4}}};
const beforeAngled=JSON.stringify(angled);
checkLayout('resid-angled-rounded',angled);
const loop=appendStreetPath(networkFromRoads([{x:0,y:47,w:20,h:6}]),[{x:20,y:50},{x:20,y:20},{x:60,y:20},{x:60,y:60},{x:20,y:60},{x:20,y:50}],6);
const loopSite={...base,planning:{...base.planning,streetNetwork:{...loop,cornerRadius:4}}};
const ringRoad=checkLayout('resid-manual-loop',loopSite);
check('resid-manual-loop-has-pavement-hole',ringRoad.layout.roadSurface.some(p=>p.length>1),true);
const sloping={...base,boundary:[{x:10,y:0},{x:60,y:0},{x:120,y:10},{x:110,y:100},{x:0,y:90}],entrance:{edge:'west',boundaryEdge:4,offset:45,width:8}};
const auto=generateSpine(sloping),apronSite={...sloping,planning:{...sloping.planning,streetNetwork:{...networkFromRoads(auto.roads),cornerRadius:4}}};
const apron=checkLayout('resid-manual-apron',apronSite);
check('resid-apron-included',apron.layout.accessConnector.length>=3,true);
const held=generateSpine(orthogonal),lot=held.parcels[0],poly=rectCorners(lot);const c=poly[2];poly[2]={x:c.x,y:c.y-.1};poly.splice(3,0,{x:c.x-.1,y:c.y});
checkLayout('resid-reshaped-parcel',orthogonal,new Map([[0,poly]]));
check('resid-layout-inputs-not-mutated',JSON.stringify(angled)===beforeAngled,true);
let invalidRefused=false;try{residualForLayout(orthogonal,{...held,parcels:[...held.parcels,held.parcels[0]]},new Map(),180);}catch{invalidRefused=true;}check('resid-inconsistent-layout-refused',invalidRefused,true);

if (failures > 0) { console.error(`${failures} FAILURES`); process.exit(1); }
console.log("ALL FIXTURES PASS");
