import type { Pt } from './polygon.ts';
import type { Rect } from './schema.ts';
export interface StreetSegment { id: string; a: Pt; b: Pt; width: number }
export interface StreetNetwork { segments: StreetSegment[]; cornerRadius?: number }
export const MAX_STREETS = 64;
const near = (a: number, b: number) => Math.abs(a - b) < .001;
export const samePoint = (a: Pt, b: Pt) => near(a.x,b.x) && near(a.y,b.y);
export const streetLength = (s: StreetSegment) => Math.hypot(s.b.x-s.a.x,s.b.y-s.a.y);
export function nearestStreetPoint(n: StreetNetwork, point: Pt): {point:Pt;streetId:string;distance:number} | null {
  let best: ReturnType<typeof nearestStreetPoint> = null;
  for (const s of n.segments) {
    const dx=s.b.x-s.a.x,dy=s.b.y-s.a.y,length2=dx*dx+dy*dy;
    if (!length2) continue;
    const t=Math.max(0,Math.min(1,((point.x-s.a.x)*dx+(point.y-s.a.y)*dy)/length2));
    const at={x:s.a.x+t*dx,y:s.a.y+t*dy},distance=Math.hypot(at.x-point.x,at.y-point.y);
    if (!best || distance<best.distance) best={point:at,streetId:s.id,distance};
  }
  return best;
}
export function onStreet(p: Pt, s: StreetSegment): boolean {
  return Math.abs((s.b.x-s.a.x)*(p.y-s.a.y)-(s.b.y-s.a.y)*(p.x-s.a.x))/Math.max(streetLength(s),1e-9) < .001 && p.x >= Math.min(s.a.x,s.b.x)-.001 && p.x <= Math.max(s.a.x,s.b.x)+.001 && p.y >= Math.min(s.a.y,s.b.y)-.001 && p.y <= Math.max(s.a.y,s.b.y)+.001;
}
export function streetRect(s: StreetSegment): Rect {
  return near(s.a.y,s.b.y) ? {x:Math.min(s.a.x,s.b.x),y:s.a.y-s.width/2,w:Math.abs(s.a.x-s.b.x),h:s.width} : {x:s.a.x-s.width/2,y:Math.min(s.a.y,s.b.y),w:s.width,h:Math.abs(s.a.y-s.b.y)};
}
export function streetErrors(raw: unknown): string[] {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) || Object.keys(raw).some(k=>!['segments','cornerRadius'].includes(k))) return ['Street network must contain known segment data only.'];
  const n=raw as StreetNetwork;
  if (!Array.isArray(n.segments) || n.segments.length<1 || n.segments.length>MAX_STREETS) return [`Draw 1–${MAX_STREETS} street segments connected to the entrance.`];
  if(n.cornerRadius!==undefined&&(!Number.isFinite(n.cornerRadius)||n.cornerRadius<0||n.cornerRadius>50))return ['Corner radius must be between 0 and 50 m.'];
  const ids=new Set<string>();
  for (let i=0;i<n.segments.length;i++) {
    const s=n.segments[i];
    if (!s || typeof s!=='object' || Object.keys(s).some(k=>!['id','a','b','width'].includes(k)) || typeof s.id!=='string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(s.id) || ids.has(s.id)) return [`Street ${i+1} needs a unique valid identifier.`];
    ids.add(s.id);
    if (![s.a,s.b].every(p=>p && typeof p==='object' && !Array.isArray(p) && Object.keys(p).every(k=>k==='x'||k==='y') && Number.isFinite(p.x) && Number.isFinite(p.y) && p.x>=0 && p.y>=0 && p.x<=500 && p.y<=500)) return [`Street ${i+1}: coordinates must be finite and between 0 and 500 m.`];
    if (!Number.isFinite(s.width) || s.width<6 || s.width>12) return [`Street ${i+1}: choose a width from 6 to 12 m. These are planning inputs, not adopted standards.`];
    if (streetLength(s)<1-.001) return [`Street ${i+1} must be at least 1 m long.`];
  }
  for (let i=0;i<n.segments.length;i++) for(let j=i+1;j<n.segments.length;j++) {
    const a=n.segments[i],b=n.segments[j],dx=a.b.x-a.a.x,dy=a.b.y-a.a.y,length=streetLength(a);
    const distance=(p:Pt)=>Math.abs(dx*(p.y-a.a.y)-dy*(p.x-a.a.x))/length;
    if(distance(b.a)<.001&&distance(b.b)<.001){
      const project=(p:Pt)=>((p.x-a.a.x)*dx+(p.y-a.a.y)*dy)/length;
      if(Math.min(length,Math.max(project(b.a),project(b.b)))-Math.max(0,Math.min(project(b.a),project(b.b)))>.001)return [`Streets ${i+1} and ${j+1} repeat or overlap the same centreline. Remove the duplicate or move it.`];
    }
  }
  return [];
}
export function streetNodes(n: StreetNetwork): Pt[] {
  const points=n.segments.flatMap(s=>[s.a,s.b]).filter(p=>Number.isFinite(p.x+p.y));
  for(let i=0;i<n.segments.length;i++)for(let j=i+1;j<n.segments.length;j++){
    const a=n.segments[i],b=n.segments[j],dx=a.b.x-a.a.x,dy=a.b.y-a.a.y,ex=b.b.x-b.a.x,ey=b.b.y-b.a.y,det=dx*ey-dy*ex;
    if(Math.abs(det)<1e-9)continue;
    const t=((b.a.x-a.a.x)*ey-(b.a.y-a.a.y)*ex)/det,u=((b.a.x-a.a.x)*dy-(b.a.y-a.a.y)*dx)/det;
    if(t>=0&&t<=1&&u>=0&&u<=1)points.push({x:a.a.x+t*dx,y:a.a.y+t*dy});
  }
  return points.filter((p,i)=>points.findIndex(q=>samePoint(p,q))===i);
}
// Split crossings so every shared junction can be edited as one node.
export function splitJunctions(n: StreetNetwork): StreetNetwork {
  const nodes=streetNodes(n),ids=new Set(n.segments.map(s=>s.id));let serial=1;
  const id=()=>{while(ids.has(`street-${serial}`))serial++;const value=`street-${serial++}`;ids.add(value);return value;};
  return {...n,segments:n.segments.flatMap(s=>{
    const pts=nodes.filter(p=>onStreet(p,s)).sort((a,b)=>Math.hypot(a.x-s.a.x,a.y-s.a.y)-Math.hypot(b.x-s.a.x,b.y-s.a.y));
    return pts.slice(0,-1).map((a,i)=>({...s,id:i===0?s.id:id(),a:{...a},b:{...pts[i+1]}}));
  })};
}
export function moveStreetNode(n: StreetNetwork, from: Pt, to: Pt): StreetNetwork {
  const split=splitJunctions(n);
  const component=(axis:'x'|'y')=>{
    const found=[from];let changed=true;
    while(changed){changed=false;for(const s of split.segments)if(near(s.a[axis],s.b[axis])&&found.some(p=>samePoint(p,s.a)||samePoint(p,s.b)))for(const p of [s.a,s.b])if(!found.some(q=>samePoint(p,q))){found.push(p);changed=true;}}
    return found;
  };
  const col=component('x'),row=component('y');
  const move=(p:Pt)=>({x:col.some(q=>samePoint(p,q))?to.x:p.x,y:row.some(q=>samePoint(p,q))?to.y:p.y});
  return {...n,segments:split.segments.map(s=>({...s,a:move(s.a),b:move(s.b)}))};
}
export function appendStreetPath(n: StreetNetwork, points: Pt[], width: number): StreetNetwork {
  const ids=new Set(n.segments.map(s=>s.id));let serial=1;
  const segments=[...n.segments];
  points.slice(1).forEach((b,i)=>{const a=points[i];if(samePoint(a,b))return;while(ids.has(`street-${serial}`))serial++;const id=`street-${serial++}`;ids.add(id);segments.push({id,a:{...a},b:{...b},width});});
  return splitJunctions({...n,segments});
}
export function networkFromRoads(roads: Rect[]): StreetNetwork {
  return splitJunctions({segments:roads.map((r,i)=>{
    const horizontal=r.h===6 || (r.w!==6 && r.w>=r.h);
    return {id:`street-${i+1}`,width:horizontal?r.h:r.w,a:horizontal?{x:r.x,y:r.y+r.h/2}:{x:r.x+r.w/2,y:r.y},b:horizontal?{x:r.x+r.w,y:r.y+r.h/2}:{x:r.x+r.w/2,y:r.y+r.h}};
  })});
}
export function disconnectedStreets(n: StreetNetwork, entry: Pt): number[] {
  const reached=new Set<number>(n.segments.flatMap((s,i)=>onStreet(entry,s)?[i]:[]));let changed=true;
  const nodes=streetNodes(n);
  while(changed){changed=false;for(let i=0;i<n.segments.length;i++)if(!reached.has(i)&&[...reached].some(j=>nodes.some(p=>onStreet(p,n.segments[i])&&onStreet(p,n.segments[j])))){reached.add(i);changed=true;}}
  return n.segments.map((_,i)=>i).filter(i=>!reached.has(i));
}
