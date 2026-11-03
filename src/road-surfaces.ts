import {isPolygonOverlayError} from './geometry-errors.ts';
import clipping from 'polygon-clipping';
import type { MultiPolygon, Pair } from 'polygon-clipping';
import { polyArea, polyInsidePoly, polyOverlapsRect, polysOverlap, rectCorners, type Pt } from './polygon.ts';
import type { Rect } from './schema.ts';
import { onStreet, samePoint, streetLength, streetNodes, type StreetNetwork, type StreetSegment } from './streets.ts';

// Each polygon has an outer ring followed by any holes, all in local metres.
export type RoadSurface = Pt[][][];
const coordinates=(surface:RoadSurface):MultiPolygon=>surface.map(p=>p.map(r=>r.map(q=>[q.x,q.y] as Pair)));
const points=(surface:MultiPolygon):RoadSurface=>surface.map(p=>p.map(r=>r.slice(0,-1).map(([x,y])=>({x,y}))));
export const surfaceArea=(surface:RoadSurface)=>surface.reduce((n,p)=>n+p.reduce((a,r,i)=>a+(i?-1:1)*polyArea(r),0),0);
// Legacy rectangles and the disjoint entrance apron share one visible kerb.
// Union changes the outline only; rounding remains an explicitly measured edit.
export function mergedRoadSurface(roads:Rect[],pavement?:RoadSurface,apron?:Pt[]):RoadSurface {
  const parts=[...(pavement??roads.map(r=>[rectCorners(r)])),...(apron?[ [apron] ]:[])];
  return parts.length?points(clipping.union(coordinates([parts[0]]),...parts.slice(1).map(p=>coordinates([p])))):[];
}
export function usesShapedStreets(raw:unknown):boolean {
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return false;
  const n=raw as StreetNetwork;
  return n.cornerRadius!==undefined||Array.isArray(n.segments)&&n.segments.some(s=>s?.a&&s?.b&&Math.abs(s.a.x-s.b.x)>.001&&Math.abs(s.a.y-s.b.y)>.001);
}
export function streetPolygon(s:StreetSegment):Pt[]{
  const length=streetLength(s);if(!Number.isFinite(length)||!Number.isFinite(s.width)||length<1e-9)return [];
  const x=-(s.b.y-s.a.y)/length*s.width/2,y=(s.b.x-s.a.x)/length*s.width/2;
  return [{x:s.a.x+x,y:s.a.y+y},{x:s.a.x-x,y:s.a.y-y},{x:s.b.x-x,y:s.b.y-y},{x:s.b.x+x,y:s.b.y+y}];
}

// Circular kerb fillets, polygonised to at most 5 mm chord deviation.
// Adjacent tangent runs share each edge; curves can meet without leftover steps.
export function streetSurface(network:StreetNetwork,options?:{junctionOnly:boolean}){
  const strips=network.segments.map(streetPolygon).filter(p=>p.length);
  if(!strips.length)return {surface:[] as RoadSurface,limited:0,minimumRadius:0};
  // Butt-ended strips leave a notch outside a bend. Close that wedge with
  // the intersection of their offset kerbs; bevel extreme hairpins instead.
  for(const node of streetNodes(network)){
    const legs=network.segments.filter(s=>onStreet(node,s)).flatMap(s=>[s.a,s.b].filter(p=>!samePoint(p,node)).map(p=>{
      const length=Math.hypot(p.x-node.x,p.y-node.y),u={x:(p.x-node.x)/length,y:(p.y-node.y)/length};
      return {u,angle:Math.atan2(u.y,u.x),half:s.width/2};
    })).sort((a,b)=>a.angle-b.angle);
    if(legs.length<2)continue;
    for(let i=0;i<legs.length;i++){
      const a=legs[i],b=legs[(i+1)%legs.length],gap=(b.angle-a.angle+2*Math.PI)%(2*Math.PI);
      if(gap<=Math.PI+1e-6)continue;
      const first={x:node.x-a.u.y*a.half,y:node.y+a.u.x*a.half},last={x:node.x+b.u.y*b.half,y:node.y-b.u.x*b.half};
      const det=a.u.x*b.u.y-a.u.y*b.u.x,t=((last.x-first.x)*b.u.y-(last.y-first.y)*b.u.x)/det;
      const miter={x:first.x+t*a.u.x,y:first.y+t*a.u.y};
      const bounded=Number.isFinite(t)&&Math.hypot(miter.x-node.x,miter.y-node.y)<=4*Math.max(a.half,b.half);
      strips.push(bounded?[node,first,miter,last]:[node,first,last]);
    }
  }
  const merge=(polygons:Pt[][])=>points(clipping.union(coordinates([[polygons[0]]]),...polygons.slice(1).map(p=>coordinates([[p]]))));
  let original:RoadSurface;
  try{original=merge(strips);}catch(error){
    if(!isPolygonOverlayError(error))throw error;
    // Retry failing near-coincident arc kerbs on a micrometre grid; successful legacy results stay exact.
    const grid=strips.map(r=>r.map(p=>({x:Math.round(p.x*1e6)/1e6,y:Math.round(p.y*1e6)/1e6})));
    try{original=merge(grid);}catch(retryError){
      if(!isPolygonOverlayError(retryError))throw retryError;
      // A radius equal to half-width collapses inner kerbs. Pairwise unions avoid
      // simultaneous near-coincident events without coarsening or dropping strips.
      let parts=grid.map(p=>coordinates([[p]]));
      while(parts.length>1){const next:MultiPolygon[]=[];for(let k=0;k<parts.length;k+=2)next.push(k+1<parts.length?clipping.union(parts[k],parts[k+1]):parts[k]);parts=next;}
      original=points(parts[0]);
    }
  }
  const junctions=options?.junctionOnly?streetNodes(network).filter(p=>network.segments.filter(s=>onStreet(p,s)).reduce((n,s)=>n+Number(!samePoint(s.a,p))+Number(!samePoint(s.b,p)),0)>=3):[];
  const radius=network.cornerRadius??0;
  if(!radius)return {surface:original,limited:0,minimumRadius:0};
  // End caps and entrance mouths retain their full declared width.
  const caps=network.segments.flatMap(s=>[s.a,s.b].filter(p=>network.segments.filter(t=>onStreet(p,t)).length===1).flatMap(p=>{
    const length=streetLength(s),x=-(s.b.y-s.a.y)/length*s.width/2,y=(s.b.x-s.a.x)/length*s.width/2;
    return [{x:p.x+x,y:p.y+y},{x:p.x-x,y:p.y-y}];
  }));
  let limited=0,minimumRadius=radius;
  const rounded=original.map(p=>p.map(r=>{
    const corners=r.map((b,i)=>{
    if(caps.some(c=>samePoint(c,b))||options?.junctionOnly&&!junctions.some(p=>Math.hypot(p.x-b.x,p.y-b.y)<=Math.max(...network.segments.filter(s=>onStreet(p,s)).map(s=>s.width))+ .002))return null;
    const a=r[(i+r.length-1)%r.length],c=r[(i+1)%r.length],la=Math.hypot(a.x-b.x,a.y-b.y),lc=Math.hypot(c.x-b.x,c.y-b.y);
    const u={x:(a.x-b.x)/la,y:(a.y-b.y)/la},v={x:(c.x-b.x)/lc,y:(c.y-b.y)/lc};
    const angle=Math.acos(Math.max(-1,Math.min(1,u.x*v.x+u.y*v.y))),tan=Math.tan(angle/2);
    if(!Number.isFinite(tan)||tan<1e-6||Math.PI-angle<1e-6)return null;
    return {u,v,angle,tan,la,lc,desired:radius/tan};
    });
    return r.flatMap((b,i)=>{
    const corner=corners[i];if(!corner)return [b];
    const {u,v,angle,tan,la,lc,desired}=corner;
    const distance=desired*Math.min(1,la/(desired+(corners[(i+r.length-1)%r.length]?.desired??0)),lc/(desired+(corners[(i+1)%r.length]?.desired??0))),effective=distance*tan;
    if(effective<radius-1e-6){limited++;minimumRadius=Math.min(minimumRadius,effective);}
    const bisector=Math.hypot(u.x+v.x,u.y+v.y),offset=effective/Math.sin(angle/2);
    const center={x:b.x+(u.x+v.x)/bisector*offset,y:b.y+(u.y+v.y)/bisector*offset};
    const first={x:b.x+u.x*distance,y:b.y+u.y*distance},last={x:b.x+v.x*distance,y:b.y+v.y*distance};
    const start=Math.atan2(first.y-center.y,first.x-center.x),end=Math.atan2(last.y-center.y,last.x-center.x);
    const a=r[(i+r.length-1)%r.length],c=r[(i+1)%r.length];
    const turn=(b.x-a.x)*(c.y-b.y)-(b.y-a.y)*(c.x-b.x);let sweep=end-start;
    if(turn>0&&sweep<0)sweep+=2*Math.PI;if(turn<0&&sweep>0)sweep-=2*Math.PI;
    const step=2*Math.acos(Math.max(-1,1-.005/effective)),count=Math.max(2,Math.ceil(Math.abs(sweep)/Math.max(.01,step)));
    return Array.from({length:count+1},(_,j)=>j===0?first:j===count?last:{x:center.x+effective*Math.cos(start+sweep*j/count),y:center.y+effective*Math.sin(start+sweep*j/count)});
    });
  }));
  return {surface:points(clipping.union(coordinates(rounded))),limited,minimumRadius};
}
export function surfaceInside(surface:RoadSurface,outline:Pt[]):boolean{return surface.every(p=>polyInsidePoly(p[0],outline));}
export function surfaceOverlapsRect(surface:RoadSurface,rect:Rect):boolean{return surface.some(p=>polyOverlapsRect(p[0],rect)&&!p.slice(1).some(h=>polyInsidePoly(rectCorners(rect),h)));}
export function surfaceOverlapsPoly(surface:RoadSurface,poly:Pt[]):boolean{return surface.some(p=>polysOverlap(p[0],poly)&&!p.slice(1).some(h=>polyInsidePoly(poly,h)));}
export function surfaceFrontage(surface:RoadSurface,poly:Pt[]):number{
  let total=0;
  for(let i=0;i<poly.length;i++){
    const a=poly[i],b=poly[(i+1)%poly.length],dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);if(length<1e-9)continue;
    const intervals:number[][]=[];
    for(const ring of surface.flat())for(let j=0;j<ring.length;j++){
      const c=ring[j],d=ring[(j+1)%ring.length];
      if(Math.abs(dx*(c.y-a.y)-dy*(c.x-a.x))/length>.001||Math.abs(dx*(d.y-a.y)-dy*(d.x-a.x))/length>.001)continue;
      const at=(p:Pt)=>((p.x-a.x)*dx+(p.y-a.y)*dy)/length,lo=Math.max(0,Math.min(at(c),at(d))),hi=Math.min(length,Math.max(at(c),at(d)));
      if(hi>lo)intervals.push([lo,hi]);
    }
    intervals.sort((a,b)=>a[0]-b[0]);let end=0;for(const [lo,hi]of intervals){total+=Math.max(0,hi-Math.max(end,lo));end=Math.max(end,hi);}
  }
  return total;
}
export const surfacePath=(surface:RoadSurface,X:(x:number)=>number,Y:(y:number)=>number)=>surface.flat().map(r=>r.map((p,i)=>`${i?'L':'M'}${X(p.x)} ${Y(p.y)}`).join(' ')+'Z').join(' ');
