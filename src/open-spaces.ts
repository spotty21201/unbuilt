import type {Rect} from './schema.ts';
import {allFinite,isSimple,polyArea,polyInsidePoly,polysOverlap,rectCorners,type Pt} from './polygon.ts';
export interface OpenSpace {id:string;name:string;kind:'park'|'pocket'|'corridor';pts:Pt[];locked:boolean;minArea:number}
export const MAX_OPEN_SPACES=12,MAX_SPACE_VERTICES=24;
export function openSpaceErrors(raw:unknown):string[]{
  if(!Array.isArray(raw)||raw.length>MAX_OPEN_SPACES)return [`Use at most ${MAX_OPEN_SPACES} open spaces.`];
  const ids=new Set<string>(),names=new Set<string>();
  for(const v of raw){
    if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).some(k=>!['id','name','kind','pts','locked','minArea'].includes(k)))return ['Open spaces need an identifier, name, type, outline, lock and minimum area.'];
    const p=v as OpenSpace;
    if(typeof p.id!=='string'||!/^g[1-9][0-9]{0,5}$/.test(p.id)||ids.has(p.id)||typeof p.name!=='string'||!p.name.trim()||p.name.length>60||names.has(p.name.trim().toLowerCase()))return ['Use unique open-space identifiers and names of 1–60 characters.'];
    ids.add(p.id);names.add(p.name.trim().toLowerCase());
    if(!['park','pocket','corridor'].includes(p.kind)||typeof p.locked!=='boolean'||!Number.isFinite(p.minArea)||p.minArea<0||p.minArea>250000)return [`${p.name}: choose a type, lock and nonnegative minimum area.`];
    if(!Array.isArray(p.pts)||p.pts.length<3||p.pts.length>MAX_SPACE_VERTICES||!p.pts.every(q=>q&&typeof q==='object'&&!Array.isArray(q)&&Object.keys(q).every(k=>k==='x'||k==='y'))||!allFinite(p.pts)||p.pts.some(q=>q.x<0||q.y<0||q.x>500||q.y>500)||!isSimple(p.pts)||polyArea(p.pts)<1)return [`${p.name}: use a closed, simple outline of 3–${MAX_SPACE_VERTICES} corners, at least 1 m², inside the 0–500 m workspace. Edges must not cross or repeat.`];
    if(polyArea(p.pts)+.01<p.minArea)return [`${p.name} must retain at least ${p.minArea} m².`];
  }
  for(let i=0;i<raw.length;i++)for(let j=i+1;j<raw.length;j++)if(polysOverlap(raw[i].pts,raw[j].pts))return [`${raw[i].name} overlaps ${raw[j].name}. Spaces may touch, but their areas must not overlap.`];
  return [];
}
export function siteOpenSpaces(site:{green:Rect;planning?:{openSpaces?:OpenSpace[]}},locked=false):OpenSpace[]{
  return site.planning?.openSpaces??[{id:'g1',name:'Open space A',kind:'park',pts:rectCorners(site.green),locked,minArea:0}];
}
export function spaceArea(spaces:OpenSpace[]):number{return spaces.reduce((sum,p)=>sum+polyArea(p.pts),0);}
export function spaceBounds(pts:Pt[],clearance=0):Rect{
  const x=Math.min(...pts.map(p=>p.x)),y=Math.min(...pts.map(p=>p.y));
  return {x:x-clearance,y:y-clearance,w:Math.max(...pts.map(p=>p.x))-x+2*clearance,h:Math.max(...pts.map(p=>p.y))-y+2*clearance};
}
export function spaceSiteErrors(spaces:OpenSpace[],boundary:Pt[]):string[]{
  const errors=openSpaceErrors(spaces);if(errors.length)return errors;
  return spaces.filter(p=>!polyInsidePoly(p.pts,boundary)).map(p=>`${p.name} leaves the actual site boundary. Move its highlighted corners inside.`);
}
export function corridorOutline(a:Pt,b:Pt,width:number):Pt[]{
  const length=Math.hypot(b.x-a.x,b.y-a.y);
  if(!allFinite([a,b])||!Number.isFinite(width)||width<1||width>50||length<1)throw Error('A straight green corridor needs distinct endpoints at least 1 m apart and a 1–50 m width.');
  const x=-(b.y-a.y)/length*width/2,y=(b.x-a.x)/length*width/2;
  return [{x:a.x+x,y:a.y+y},{x:b.x+x,y:b.y+y},{x:b.x-x,y:b.y-y},{x:a.x-x,y:a.y-y}];
}
