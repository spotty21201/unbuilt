import assert from 'node:assert/strict';
import fs from 'node:fs';
import {starterProject} from '../../../src/projects.ts';
import {assessTerrain} from '../../../src/terrain.ts';
import {developmentErrors} from '../../../src/development-inputs.ts';
import {assessDrainage,assessPhasing} from '../../../src/development.ts';
import {generateSpine,lotKey,editsForLayout} from '../../../src/geometry.ts';
import {evaluateLayout} from '../../../src/economics.ts';
const results=[];
function test(id,expected,fn){try{const observed=fn();results.push({id,expected,observed,status:'Pass'});console.log('PASS '+id);}catch(e){results.push({id,expected,status:'Fail',error:e.stack});console.error('FAIL '+id+' '+e.message);}}
const near=(a,b,tol=1e-5)=>assert.ok(Math.abs(a-b)<tol,`${a} != ${b}`);
const rect=[{x:0,y:0},{x:120,y:0},{x:120,y:100},{x:0,y:100}];
const make=(xs,ys,f,platform=101)=>({source:'Independent analytic fixture only',datum:'Fictional datum',basis:'assumed',date:'2026-10-30',slopeLimit:2,platform,points:ys.flatMap(y=>xs.map(x=>({x,y,z:f(x,y)})))});
// Integral: fill wedge x=0..100, y=0..(1-.01x)/.02 is 2500/3.
// Net cut-fill = 12000*(101.6-101)=7200. No app-generated oracle.
for(const [id,xs,ys] of [['corners',[0,120],[0,100]],['nonuniform',[0,.01,.04,2,20,119.9,120],[0,.02,.05,7,90,100]],['maximum-grid',Array.from({length:20},(_,i)=>120*(i/19)**2),Array.from({length:20},(_,i)=>100*(i/19)**2)]])test('NUM-T-'+id,{area:12000,slope:Math.sqrt(5),cut:24100/3,fill:2500/3},()=>{const t=make(xs,ys,(x,y)=>100+.01*x+.02*y);assert.deepEqual(developmentErrors({terrain:t}),[]);const r=assessTerrain(t,rect);near(r.area,12000);near(r.meanSlope,Math.sqrt(5));near(r.cut,24100/3);near(r.fill,2500/3);return {area:r.area,slope:r.meanSlope,cut:r.cut,fill:r.fill};});
test('NUM-T-negative',{cut:2500/3,fill:24100/3,slope:Math.sqrt(5)},()=>{const r=assessTerrain(make([0,120],[0,100],(x,y)=>-100-.01*x-.02*y,-101),rect);near(r.cut,2500/3);near(r.fill,24100/3);return {cut:r.cut,fill:r.fill};});
test('NUM-T-concave-reversed',{area:11000,cutMinusFill:17300},()=>{const outline=[{x:0,y:0},{x:120,y:0},{x:120,y:100},{x:50,y:100},{x:0,y:60}]; // missing 1000 m² triangle centroid (16 2/3,86 2/3), mean z=101.9
const t=make([0,.01,50,120],[0,.02,60,100],(x,y)=>100+.01*x+.02*y,100);const out=[];for(const b of [outline,[...outline].reverse()]){const r=assessTerrain(t,b);near(r.area,11000);near(r.cut-r.fill,17300);out.push({area:r.area,cut:r.cut,fill:r.fill});}return out;});
const st=starterProject(true,'Independent numeric').state,s={...st.baseSpec,entrance:st.entrance,green:st.green},l=generateSpine(s),ed=editsForLayout(l.parcels,{}),e=evaluateLayout(s,l,850e6,{ownerExpectation:10e9,targetFraction:.15},ed);
const d={source:'Fictional independent storm',returnYears:10,intensity:100,durationMinutes:30,tcMinutes:15,coefficients:{roof:.9,roads:.85,green:.2,other:.35},siteCatchment:true,noStorage:true,outfall:null};
test('NUM-D-baseline',{weightedC:.429,peak:.143,rainfall:600},()=>{const r=assessDrainage(s,l,e,d);assert.deepEqual(r.areas,{roof:1200,roads:720,green:480,other:9600});near(r.weightedC,.429);near(r.peak,.143);near(r.rainfallVolume,600);return r;});
test('NUM-D-zero-C',{peak:0,rainfall:600},()=>{const r=assessDrainage(s,l,e,{...d,coefficients:{roof:0,roads:0,green:0,other:0}});near(r.peak,0);near(r.rainfallVolume,600);return r;});
const p={source:'Independent fictional ledger',startDate:'2026-11',landMonth:1,phases:[{id:'p1',name:'First',startMonth:1,buildMonths:3,saleMonth:4,sharedFraction:.5},{id:'p2',name:'Second',startMonth:4,buildMonths:3,saleMonth:7,sharedFraction:.5}],assignments:Object.fromEntries(l.parcels.map((r,i)=>[lotKey(r),i<10?'p1':'p2']))};
test('NUM-P-full-ledger',{closing:-3890400000,deficit:15190200000},()=>{const r=assessPhasing(s,l,e,p,850e6,10e9); // Physical 8.648bn*1.05+1.3bn=10.3804bn; each phase 5.1902bn.
const spend=5190200000/3,rows=Array.from({length:7},(_,i)=>({revenue:[3,6].includes(i)?8500000000:0,selling:[3,6].includes(i)?255000000:0,nonLand:i<6?spend:0,land:i===0?10000000000:0}));let cash=0,min=0;for(let i=0;i<7;i++){const row=rows[i];cash+=row.revenue-row.selling-row.nonLand-row.land;min=Math.min(min,cash);for(const k of Object.keys(row))near(r.months[i][k],row[k]);near(r.months[i].cumulative,cash);row.cumulative=cash;}near(r.closing,-3890400000);near(r.monthEndDeficit,15190200000);return rows;});
test('NUM-P-infrastructure-late-owner',{closing:-3890400000,ownerPayments:1},()=>{const phases=[...p.phases.map(a=>({...a,sharedFraction:.25})),{id:'p3',name:'Infrastructure only',startMonth:1,buildMonths:2,saleMonth:2,sharedFraction:.5}],r=assessPhasing(s,l,e,{...p,landMonth:12,phases},850e6,10e9);near(r.closing,-3890400000);near(r.rows[2].homes,0);near(r.rows[2].construction,0);near(r.rows[2].cost,2040200000);near(r.months.filter(m=>m.land!==0).length,1);assert.equal(r.months[11].label,'2027-10');return {closing:r.closing,rows:r.rows,months:r.months};});
fs.writeFileSync(new URL('./independent-calculations.json',import.meta.url),JSON.stringify(results,null,2));if(results.some(r=>r.status==='Fail'))process.exitCode=1;
