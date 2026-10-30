import type {Rect} from './schema.ts';
import {polyArea, polyInsidePoly, rectCorners, type Pt} from './polygon.ts';
export const MAX_MANUAL_LOTS=500;
const EPS=.001;
export function parcelPlanErrors(raw:unknown):string[]{
  if(!Array.isArray(raw)||raw.length>MAX_MANUAL_LOTS)return [`A manual lot plan holds at most ${MAX_MANUAL_LOTS} lots.`];
  for(const [i,value] of raw.entries()){
    if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!['x','y','w','h'].includes(k)))return [`Lot ${i+1} needs only rectangular x, y, width and depth.`];
    const r=value as Rect;
    if(![r.x,r.y,r.w,r.h].every(Number.isFinite)||r.x<0||r.y<0||r.w<1||r.h<1||r.x+r.w>500+EPS||r.y+r.h>500+EPS)return [`Lot ${i+1}: use finite coordinates inside 0–500 m and dimensions of at least 1 m.`];
  }
  return [];
}
export const parcelKey=(r:Rect)=>`${r.x},${r.y},${r.w},${r.h}`;
export function rectangleForLots(lots:Rect[]):Rect{
  if(!lots.length)throw Error('Select at least one lot.');
  const x=Math.min(...lots.map(r=>r.x)),y=Math.min(...lots.map(r=>r.y));
  return {x,y,w:Math.max(...lots.map(r=>r.x+r.w))-x,h:Math.max(...lots.map(r=>r.y+r.h))-y};
}
const overlaps=(a:Rect,b:Rect)=>Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x)>EPS&&Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y)>EPS;
export function rectangularGroup(lots:Rect[],indices:number[],edits:Record<string,Pt[]>={}):Rect{
  if(!indices.length||new Set(indices).size!==indices.length||indices.some(i=>!Number.isInteger(i)||!lots[i]))throw Error('Select distinct existing lots.');
  const selected=indices.map(i=>lots[i]);
  for(const r of selected){const poly=edits[parcelKey(r)];if(poly&&(!polyInsidePoly(poly,rectCorners(r))||Math.abs(polyArea(poly)-r.w*r.h)>.01))throw Error('This selection contains a reshaped polygon. Split, merge and block subdivision currently require rectangular lots; preserve this shape or explicitly restore its rectangular outline first.');}
  const box=rectangleForLots(selected);
  if(Math.abs(selected.reduce((s,r)=>s+r.w*r.h,0)-box.w*box.h)>.01||selected.some((r,i)=>selected.slice(i+1).some(q=>overlaps(r,q))))throw Error('Choose adjacent lots that fill one rectangle, with no gaps, streets or holes.');
  return box;
}
export function splitParcel(rect:Rect,axis:'x'|'y',fraction:number):Rect[]{
  if(!Number.isFinite(fraction)||fraction<=0||fraction>=1)throw Error('Place the split strictly inside the lot.');
  const size=axis==='x'?'w':'h',span=rect[size]*fraction;
  const result=[{...rect,[size]:span},{...rect,[axis]:rect[axis]+span,[size]:rect[size]-span}];
  const errors=parcelPlanErrors(result);if(errors.length)throw Error(errors[0]);return result;
}
export function subdivideBlock(rect:Rect,axis:'x'|'y',count:number):Rect[]{
  if(!Number.isInteger(count)||count<2||count>100)throw Error('Use 2–100 lots in a subdivision.');
  const size=axis==='x'?'w':'h',width=rect[size]/count;
  const result=Array.from({length:count},(_,i)=>({...rect,[axis]:rect[axis]+i*width,[size]:i===count-1?rect[size]-i*width:width}));
  const errors=parcelPlanErrors(result);if(errors.length)throw Error(errors[0]);return result;
}
export function replaceParcels(lots:Rect[],indices:number[],replacement:Rect[]):Rect[]{
  if(!indices.length||indices.some(i=>!lots[i]))throw Error('Choose lots to replace.');
  const first=Math.min(...indices),selected=new Set(indices);
  const result=lots.flatMap((r,i)=>i===first?replacement:selected.has(i)?[]:[{...r}]);
  const errors=parcelPlanErrors(result);if(errors.length)throw Error(errors[0]);return result;
}
export function lotBlocks(lots:Rect[]):{indices:number[];bounds:Rect;rectangular:boolean}[]{
  const remaining=new Set(lots.map((_,i)=>i)),result=[];
  const adjacent=(a:Rect,b:Rect)=>(Math.abs(a.x+a.w-b.x)<EPS||Math.abs(b.x+b.w-a.x)<EPS)&&Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y)>EPS||(Math.abs(a.y+a.h-b.y)<EPS||Math.abs(b.y+b.h-a.y)<EPS)&&Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x)>EPS;
  while(remaining.size){const indices=[remaining.values().next().value!];remaining.delete(indices[0]);for(let k=0;k<indices.length;k++)for(const i of remaining)if(adjacent(lots[indices[k]],lots[i])){indices.push(i);remaining.delete(i);}indices.sort((a,b)=>a-b);const bounds=rectangleForLots(indices.map(i=>lots[i]));result.push({indices,bounds,rectangular:Math.abs(indices.reduce((s,i)=>s+lots[i].w*lots[i].h,0)-bounds.w*bounds.h)<.01});}
  return result;
}
