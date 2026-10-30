export interface ElevationPoint {x:number;y:number;z:number}
export interface TerrainInput {source:string;datum:string;date:string;basis:'survey'|'assumed';points:ElevationPoint[];slopeLimit:number;platform:number|null}
export interface DrainageInput {source:string;returnYears:number;intensity:number;durationMinutes:number;tcMinutes:number;coefficients:{roof:number;roads:number;green:number;other:number};siteCatchment:boolean;noStorage:boolean;outfall:{x:number;y:number;capacity:number;source:string}|null}
export interface DevelopmentPhase {id:string;name:string;startMonth:number;buildMonths:number;saleMonth:number;sharedFraction:number}
export interface PhasingInput {source:string;startDate:string;landMonth:number;phases:DevelopmentPhase[];assignments:Record<string,string>}
export interface DevelopmentInputs {terrain?:TerrainInput;drainage?:DrainageInput;phasing?:PhasingInput}
const rec=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const fields=(v:unknown,keys:string[]):v is Record<string,unknown>=>rec(v)&&Object.keys(v).sort().join(',')===[...keys].sort().join(',');
const number=(v:unknown,min:number,max:number):v is number=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
const text=(v:unknown,max=300):v is string=>typeof v==='string'&&!!v.trim()&&v.length<=max;
const integer=(v:unknown,min:number,max:number)=>number(v,min,max)&&Number.isInteger(v);
export function developmentErrors(raw:unknown):string[] {
  if(!rec(raw)||Object.keys(raw).some(k=>!['terrain','drainage','phasing'].includes(k)))return ['Development inputs contain unknown fields.'];
  const t=raw.terrain;
  if(t!==undefined){
    if(!fields(t,['source','datum','date','basis','points','slopeLimit','platform'])||!text(t.source)||!text(t.datum,120)||!['survey','assumed'].includes(String(t.basis))||typeof t.basis!=='string'||typeof t.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(t.date)||!Number.isFinite(Date.parse(t.date))||new Date(t.date).toISOString().slice(0,10)!==t.date||!number(t.slopeLimit,.1,100)||!(t.platform===null||number(t.platform,-500,9000)))return ['Terrain needs source, datum, valid date, declared basis, slope threshold and optional platform level (m).'];
    if(!Array.isArray(t.points)||t.points.length<4||t.points.length>400||t.points.some(p=>!fields(p,['x','y','z'])||!number(p.x,0,500)||!number(p.y,0,500)||!number(p.z,-500,9000)))return ['Use 4–400 elevation points, local x/y 0–500 m and z −500–9,000 m.'];
    const pts=t.points as ElevationPoint[],xs=[...new Set(pts.map(p=>p.x))].sort((a,b)=>a-b),ys=[...new Set(pts.map(p=>p.y))].sort((a,b)=>a-b);
    if(xs.length<2||ys.length<2||xs.length>20||ys.length>20||xs.length*ys.length!==pts.length||new Set(pts.map(p=>`${p.x},${p.y}`)).size!==pts.length||[xs,ys].some(axis=>axis.slice(1).some((n,i)=>n-axis[i]<.01)))return ['Elevation data must be a complete rectangular grid: 2–20 distinct x and y coordinates, no missing/duplicate cells, spacing at least 0.01 m.'];
  }
  const d=raw.drainage;
  if(d!==undefined){
    if(!fields(d,['source','returnYears','intensity','durationMinutes','tcMinutes','coefficients','siteCatchment','noStorage','outfall'])||!text(d.source)||!number(d.returnYears,1,1000)||!number(d.intensity,.01,1000)||!number(d.durationMinutes,1,1440)||!number(d.tcMinutes,1,1440)||typeof d.siteCatchment!=='boolean'||typeof d.noStorage!=='boolean'||!fields(d.coefficients,['roof','roads','green','other'])||Object.values(d.coefficients).some(c=>!number(c,0,1)))return ['Drainage needs a source, return period, positive intensity and durations, four runoff coefficients (0–1), and catchment/storage declarations.'];
    if(d.outfall!==null&&(!fields(d.outfall,['x','y','capacity','source'])||!number(d.outfall.x,0,500)||!number(d.outfall.y,0,500)||!number(d.outfall.capacity,0,1000)||!text(d.outfall.source)))return ['Declared outfall needs local x/y, a capacity (0–1,000 m³/s) and its source.'];
  }
  const p=raw.phasing;
  if(p!==undefined){
    if(!fields(p,['source','startDate','landMonth','phases','assignments'])||!text(p.source)||typeof p.startDate!=='string'||! /^(19|20|21|22)\d{2}-(0[1-9]|1[0-2])$/.test(p.startDate)||!integer(p.landMonth,1,240)||!Array.isArray(p.phases)||p.phases.length<1||p.phases.length>8||!rec(p.assignments)||Object.keys(p.assignments).length>5000)return ['Phasing needs a source, start month (YYYY-MM), land payment month (1–240), 1–8 phases and lot assignments.'];
    const ids=new Set<string>(),names=new Set<string>();
    for(const phase of p.phases){
      if(!fields(phase,['id','name','startMonth','buildMonths','saleMonth','sharedFraction'])||typeof phase.id!=='string'||!/^p[1-8]$/.test(phase.id)||ids.has(phase.id)||!text(phase.name,60)||names.has(phase.name.trim().toLowerCase())||!integer(phase.startMonth,1,240)||!integer(phase.buildMonths,1,120)||!integer(phase.saleMonth,1,240)||!number(phase.sharedFraction,0,1))return ['Each phase needs a unique name/ID, valid months and shared cost fraction (0–1).'];
      if((phase.startMonth as number)+(phase.buildMonths as number)-1>240||(phase.saleMonth as number)<(phase.startMonth as number)+(phase.buildMonths as number)-1)return ['Phase sales must be at or after construction completion, within 240 months.'];
      ids.add(phase.id);names.add(phase.name.trim().toLowerCase());
    }
    for(const [key,id]of Object.entries(p.assignments)){
      const v=key.split(',').map(Number);
      if(v.length!==4||v.some(n=>!Number.isFinite(n))||v[0]<0||v[1]<0||v[2]<=0||v[3]<=0||v[0]+v[2]>500||v[1]+v[3]>500||v.join(',')!==key||typeof id!=='string'||!ids.has(id))return ['Phase assignments must address valid lot rectangles and existing phase IDs.'];
    }
  }
  return [];
}
export function parseElevationCSV(text:string):ElevationPoint[]{
  if(text.length>80_000)throw Error('Elevation CSV is too large (80 KB limit).');
  const lines=text.replace(/^\uFEFF/,'').trim().split(/\r?\n/);if(lines.shift()?.trim().toLowerCase()!=='x,y,z')throw Error('CSV header must be x,y,z, in local metres.');
  const points=lines.map((line,i)=>{const values=line.split(',');if(values.length!==3||values.some(v=>!v.trim()||!/^[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?$/i.test(v.trim())))throw Error(`CSV row ${i+2} needs three finite numbers.`);const [x,y,z]=values.map(Number);return{x,y,z};});
  if(points.some(p=>![p.x,p.y,p.z].every(Number.isFinite)))throw Error('CSV contains a non-finite level.');return points;
}
