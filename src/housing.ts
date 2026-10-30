import type {PlanningParameters} from './planning.ts';
import type {Rect} from './schema.ts';
import {hasHome,type HasContents} from './contents.ts';
import {parcelKey,parcelPlanErrors} from './parcels.ts';

export interface HomeTemplate {id:string;name:string;width:number;depth:number}
export interface HousingMix {templates:HomeTemplate[];defaultId:string;assignments:Record<string,string>}
export function housingErrors(raw:unknown):string[]{
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return ['Housing mix must be an object.'];
  const h=raw as HousingMix;
  if(Object.keys(h).some(k=>!['templates','defaultId','assignments'].includes(k))||!Array.isArray(h.templates)||h.templates.length<1||h.templates.length>20)return ['Use 1–20 named housing templates.'];
  const ids=new Set<string>(),names=new Set<string>();
  for(const t of h.templates){
    if(!t||typeof t!=='object'||Object.keys(t).some(k=>!['id','name','width','depth'].includes(k))||typeof t.id!=='string'||!/^h[1-9][0-9]{0,5}$/.test(t.id)||ids.has(t.id)||typeof t.name!=='string'||!t.name.trim()||t.name.length>60||names.has(t.name.trim().toLowerCase()))return ['Templates need unique identifiers and distinct names of 1–60 characters.'];
    if(![t.width,t.depth].every(v=>Number.isFinite(v)&&v>=4&&v<=16))return ['Template width and depth must be between 4 and 16 m.'];
    ids.add(t.id);names.add(t.name.trim().toLowerCase());
  }
  if(!ids.has(h.defaultId)||!h.assignments||typeof h.assignments!=='object'||Array.isArray(h.assignments)||Object.keys(h.assignments).length>500)return ['Choose an existing default template and at most 500 lot assignments.'];
  for(const[key,id]of Object.entries(h.assignments)){
    const v=key.split(',').map(Number);
    if(v.length!==4||parcelPlanErrors([{x:v[0],y:v[1],w:v[2],h:v[3]}]).length||parcelKey({x:v[0],y:v[1],w:v[2],h:v[3]})!==key||typeof id!=='string'||!ids.has(id))return ['Each housing assignment must address a valid lot rectangle and existing template.'];
  }
  return [];
}
export function initialHousing(p?:PlanningParameters):HousingMix {
  return p?.housing?structuredClone(p.housing):{templates:[{id:'h1',name:'Original home',width:p?.homeWidth??10,depth:p?.homeDepth??6}],defaultId:'h1',assignments:{}};
}
export function homeTemplate(p?:PlanningParameters,lot?:Rect):HomeTemplate {
  const h=p?.housing,id=lot?h?.assignments[parcelKey(lot)]:undefined;
  return h?.templates.find(t=>t.id===(id??h.defaultId))??{id:'original',name:'Original home',width:p?.homeWidth??10,depth:p?.homeDepth??6};
}
export function housingSummary(site:HasContents&{planning?:PlanningParameters},lots:Rect[]){
  const templates=site.planning?.housing?.templates??[homeTemplate(site.planning)];
  const rows=templates.map(t=>({...t,count:0,builtArea:0}));let vacant=0;
  for(const lot of lots){if(!hasHome(site,lot)){vacant++;continue;}const t=homeTemplate(site.planning,lot),row=rows.find(r=>r.id===t.id)!;row.count++;row.builtArea+=t.width*t.depth;}
  return {rows,vacant,homes:rows.reduce((s,r)=>s+r.count,0),builtArea:rows.reduce((s,r)=>s+r.builtArea,0)};
}
// Changed parcel identities inherit a common source template; mixed sources use the
// chosen default. The lot review exposes this choice before application.
export function repartitionHousing(h:HousingMix,old:Rect[],next:Rect[]):HousingMix{
  const assignments:Record<string,string>={};
  for(const r of next){const key=parcelKey(r);if(h.assignments[key]){assignments[key]=h.assignments[key];continue;}
    const source=old.filter(q=>Math.min(q.x+q.w,r.x+r.w)-Math.max(q.x,r.x)>.001&&Math.min(q.y+q.h,r.y+r.h)-Math.max(q.y,r.y)>.001);
    const ids=new Set(source.map(q=>h.assignments[parcelKey(q)]??h.defaultId));
    const id=ids.size===1?[...ids][0]:h.defaultId;if(id!==h.defaultId||(ids.size===1&&source.every(q=>assignmentSource(h,q)==='explicit')))assignments[key]=id;
  }
  return {...h,assignments};
}

export function assignmentSource(housing:HousingMix|undefined,lot:Rect):'explicit'|'default'{
  return housing&&Object.hasOwn(housing.assignments,parcelKey(lot))?'explicit':'default';
}
export function defaultAssignmentImpact(housing:HousingMix,lots:Rect[]){
  return {inherited:lots.flatMap((r,i)=>assignmentSource(housing,r)==='default'?[i]:[]),explicit:lots.flatMap((r,i)=>assignmentSource(housing,r)==='explicit'?[i]:[])};
}
