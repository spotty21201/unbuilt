import { developmentErrors, type DevelopmentInputs, type DrainageInput, type PhasingInput } from './development-inputs.ts';
import { assessTerrain } from './terrain.ts';
import { siteBoundary, siteArea } from './boundary.ts';
import { hasHome, hasLayout } from './contents.ts';
import { validateLayout, lotKey, type Site, type Layout, type LotEdits } from './geometry.ts';
import { homeTemplate } from './housing.ts';
import { DEFAULT_COSTS } from './costs.ts';
import type { LayoutEconomics } from './economics.ts';
export function assessDrainage(site:Site,layout:Layout,econ:LayoutEconomics,d:DrainageInput){
  if(!d.siteCatchment||!d.noStorage)throw Error('Confirm that the site boundary is the whole contributing catchment and there is no significant storage. Otherwise this method is unavailable.');
  if(d.durationMinutes<d.tcMinutes)throw Error('Intensity duration must be at least the declared time of concentration.');
  const area=siteArea(site);if(area>800_000)throw Error('Catchment exceeds the 80 ha screening limit.');
  const areas={roof:econ.builtArea,roads:econ.quantities.roadArea,green:econ.quantities.greenArea,other:area-econ.builtArea-econ.quantities.roadArea-econ.quantities.greenArea};
  if(areas.other<-.01||layout.empty)throw Error('Surface quantities do not form a usable site catchment.');areas.other=Math.max(0,areas.other);
  const effectiveArea=(Object.keys(areas)as(keyof typeof areas)[]).reduce((sum,k)=>sum+areas[k]*d.coefficients[k],0);
  const peak=effectiveArea*d.intensity/3_600_000;
  return {area,areas,weightedC:effectiveArea/area,peak,rainfallVolume:area*d.intensity*d.durationMinutes/60/1000,capacity:d.outfall?.capacity??null,excess:d.outfall?Math.max(0,peak-d.outfall.capacity):null};
}
export function assessPhasing(site:Site,layout:Layout,econ:LayoutEconomics,p:PhasingInput,price:number,owner:number){
  if(!Number.isFinite(price)||price<=0||!Number.isFinite(owner)||owner<0)throw Error('Complete the selling price and owner assumption before scheduling cash.');
  const occupied=layout.parcels.filter(lot=>hasHome(site,lot)),keys=new Set(occupied.map(lotKey));
  const orphaned=Object.keys(p.assignments).filter(k=>!keys.has(k)),missing=occupied.filter(lot=>!p.assignments[lotKey(lot)]);
  if(orphaned.length||missing.length)throw Error(`Phase assignments need review: ${missing.length} occupied lots unassigned; ${orphaned.length} assignments no longer match occupied lots. Nothing is reassigned automatically.`);
  const sum=p.phases.reduce((n,phase)=>n+phase.sharedFraction,0);if(Math.abs(sum-1)>1e-9)throw Error('Shared cost allocations must total 100%.');
  const costs=site.costAssumptions??DEFAULT_COSTS,shared=econ.costNonLand-econ.homeCost*(1+costs.contingencyFraction);
  const rows=p.phases.map(phase=>{
    const lots=occupied.filter(lot=>p.assignments[lotKey(lot)]===phase.id),builtArea=lots.reduce((n,lot)=>{const t=homeTemplate(site.planning,lot);return n+t.width*t.depth;},0);
    const construction=builtArea*costs.constructionPerM2*(1+costs.contingencyFraction),sharedCost=shared*phase.sharedFraction;
    return {...phase,homes:lots.length,builtArea,construction,sharedCost,cost:construction+sharedCost,revenue:lots.length*price};
  });
  const horizon=Math.max(p.landMonth,...rows.map(p=>p.saleMonth)),months=Array.from({length:horizon},(_,i)=>({month:i+1,label:'',revenue:0,selling:0,nonLand:0,land:0,net:0,cumulative:0}));
  for(const phase of rows){for(let m=phase.startMonth;m<phase.startMonth+phase.buildMonths;m++)months[m-1].nonLand+=phase.cost/phase.buildMonths;months[phase.saleMonth-1].revenue+=phase.revenue;months[phase.saleMonth-1].selling+=phase.revenue*costs.sellFraction;}
  months[p.landMonth-1].land=owner;
  const [year,startMonth]=p.startDate.split('-').map(Number);let cumulative=0,min=0;
  for(const m of months){m.label=new Date(Date.UTC(year,startMonth+m.month-2,1)).toISOString().slice(0,7);m.net=m.revenue-m.selling-m.nonLand-m.land;cumulative+=m.net;m.cumulative=cumulative;min=Math.min(min,cumulative);}
  if(Math.abs(cumulative-econ.finance.surplus)>Math.max(.01,Math.abs(econ.finance.surplus)*1e-10))throw Error('Phase cash totals do not reconcile with accepted economics.');
  return {rows,months,shared,monthEndDeficit:Math.max(0,-min),closing:cumulative,totalRevenue:rows.reduce((n,r)=>n+r.revenue,0),totalNonLand:rows.reduce((n,r)=>n+r.cost,0)};
}
function result<T>(input:unknown,validate:()=>string[],calculate:()=>T){if(input===undefined)return{value:null,error:'No inputs supplied.'};const errors=validate();if(errors.length)return{value:null,error:errors[0]};try{return{value:calculate(),error:null};}catch(e){return{value:null,error:e instanceof Error?e.message:'Calculation unavailable.'};}}
export function assessDevelopment(site:Site,layout:Layout,edits:LotEdits,econ:LayoutEconomics|null,price:number,owner:number,inputs:DevelopmentInputs=site.development??{}){
  const validLayout=()=>{const errors=validateLayout(site,layout,edits);if(errors.length)throw Error(errors[0]);if(!hasLayout(site)||layout.empty||!econ)throw Error('A valid generated layout and complete economics are required.');};
  return {
    terrain:result(inputs.terrain,()=>developmentErrors({terrain:inputs.terrain}),()=>assessTerrain(inputs.terrain!,siteBoundary(site))),
    drainage:result(inputs.drainage,()=>developmentErrors({drainage:inputs.drainage}),()=>{validLayout();return assessDrainage(site,layout,econ!,inputs.drainage!);}),
    phasing:result(inputs.phasing,()=>developmentErrors({phasing:inputs.phasing}),()=>{validLayout();return assessPhasing(site,layout,econ!,inputs.phasing!,price,owner);}),
  };
}

export function developmentFindings(site:Site,layout:Layout,edits:LotEdits,econ:LayoutEconomics|null,price:number,owner:number){
  if(!site.development)return [];
  const r=assessDevelopment(site,layout,edits,econ,price,owner),n=(v:number)=>v.toLocaleString('en-US',{maximumSignificantDigits:6}),facts:{id:string;text:string}[]=[];
  if(site.development.terrain){const t=r.terrain.value;facts.push({id:'terrain-screening',text:t?`Terrain screening from ${site.development.terrain.basis==='assumed'?'assumed':'user-declared survey'} data: elevation ${n(t.min)}–${n(t.max)} m; area-weighted slope ${n(t.meanSlope)}%; area above entered threshold ${n(t.steepArea)} m²; ${t.cut===null?'no platform quantity':`gross cut ${n(t.cut)} m³ and fill ${n(t.fill!)} m³ to the entered whole-site platform`}. No grading design or earthworks budget is established.`:`Terrain screening unavailable: ${r.terrain.error}`});}
  if(site.development.drainage){const d=r.drainage.value;facts.push({id:'drainage-screening',text:d?`Declared whole-site catchment ${n(d.area)} m², entered intensity ${site.development.drainage.intensity} mm/h, weighted C ${n(d.weightedC)}: Rational peak ${n(d.peak)} m³/s. ${d.capacity===null?'No outfall capacity supplied.':`Peak above declared capacity: ${n(d.excess!)} m³/s.`} No routing, detention volume or downstream permission is established.`:`Drainage screening unavailable: ${r.drainage.error}`});}
  if(site.development.phasing){const p=r.phasing.value;facts.push({id:'phase-cash',text:p?`Entered phase schedule: maximum month-end deficit Rp${n(p.monthEndDeficit)}; closing cash Rp${n(p.closing)}, reconciled to accepted modeled surplus. Intramonth funding, tax, interest/debt and missing budgets are excluded.`:`Phase cash unavailable: ${r.phasing.error}`});}
  return facts;
}
