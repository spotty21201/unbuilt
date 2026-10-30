import { isSimple, polyArea, signedArea, type Pt } from './polygon.ts';
import type { TerrainInput, ElevationPoint } from './development-inputs.ts';
const EPS=1e-9;
const cross=(a:Pt,b:Pt,c:Pt)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
// Ear clipping keeps concave boundary remainders out of every terrain total.
export function triangulateBoundary(outline:Pt[]):Pt[][] {
  if(outline.length<3||!isSimple(outline))throw Error('A simple accepted boundary is required.');
  const p=(signedArea(outline)>0?outline:[...outline].reverse()).map(p=>({...p})),result:Pt[][]=[];
  for(let pass=0;p.length>3&&pass<128;pass++){
    let found=false;
    for(let i=0;i<p.length;i++){
      const a=p[(i+p.length-1)%p.length],b=p[i],c=p[(i+1)%p.length];
      if(Math.abs(cross(a,b,c))<EPS){p.splice(i,1);found=true;break;}
      if(cross(a,b,c)<0||p.some((v,j)=>j!==i&&j!==(i+p.length-1)%p.length&&j!==(i+1)%p.length&&cross(a,b,v)>=-EPS&&cross(b,c,v)>=-EPS&&cross(c,a,v)>=-EPS))continue;
      result.push([a,b,c]);p.splice(i,1);found=true;break;
    }
    if(!found)throw Error('Boundary could not be triangulated reliably.');
  }
  if(p.length!==3)throw Error('Boundary triangulation did not finish.');result.push(p);return result;
}
function clipHalf(poly:Pt[],value:(p:Pt)=>number):Pt[]{
  const result:Pt[]=[];
  for(let i=0;i<poly.length;i++){
    const a=poly[i],b=poly[(i+1)%poly.length],fa=value(a),fb=value(b),insideA=fa>=-EPS,insideB=fb>=-EPS;
    if(insideA)result.push(a);
    if(insideA!==insideB){const t=fa/(fa-fb);result.push({x:a.x+t*(b.x-a.x),y:a.y+t*(b.y-a.y)});}
  }
  return result;
}
function clipTriangle(poly:Pt[],tri:Pt[]):Pt[]{let p=poly;for(let i=0;i<3;i++)p=clipHalf(p,q=>cross(tri[i],tri[(i+1)%3],q));return p;}
function plane([a,b,c]:ElevationPoint[]){const det=cross(a,b,c),gx=((b.z-a.z)*(c.y-a.y)-(c.z-a.z)*(b.y-a.y))/det,gy=((b.x-a.x)*(c.z-a.z)-(c.x-a.x)*(b.z-a.z))/det;return{gx,gy,z:(p:Pt)=>a.z+gx*(p.x-a.x)+gy*(p.y-a.y)};}
function integrate(poly:Pt[],height:(p:Pt)=>number){let sum=0;for(let i=1;i+1<poly.length;i++)sum+=polyArea([poly[0],poly[i],poly[i+1]])*(height(poly[0])+height(poly[i])+height(poly[i+1]))/3;return Math.max(0,sum);}
export function terrainTriangles(t:TerrainInput){
  const xs=[...new Set(t.points.map(p=>p.x))].sort((a,b)=>a-b),ys=[...new Set(t.points.map(p=>p.y))].sort((a,b)=>a-b),points=new Map(t.points.map(p=>[`${p.x},${p.y}`,p])),triangles:ElevationPoint[][]=[];
  for(let i=0;i<xs.length-1;i++)for(let j=0;j<ys.length-1;j++){const a=points.get(`${xs[i]},${ys[j]}`)!,b=points.get(`${xs[i+1]},${ys[j]}`)!,c=points.get(`${xs[i+1]},${ys[j+1]}`)!,d=points.get(`${xs[i]},${ys[j+1]}`)!;triangles.push([a,b,c],[a,c,d]);}
  return triangles;
}
export function terrainAt(t:TerrainInput,p:Pt):number|null{for(const tri of terrainTriangles(t))if(cross(tri[0],tri[1],p)>=-EPS&&cross(tri[1],tri[2],p)>=-EPS&&cross(tri[2],tri[0],p)>=-EPS)return plane(tri).z(p);return null;}
export function assessTerrain(t:TerrainInput,boundary:Pt[]){
  const siteTriangles=triangulateBoundary(boundary),facets:{pts:Pt[];slope:number;gx:number;gy:number;level:number}[]=[];
  let min=Infinity,max=-Infinity,area=0,weightedSlope=0,steepArea=0,cut=0,fill=0;
  for(const tri of terrainTriangles(t)){
    const f=plane(tri),slope=Math.hypot(f.gx,f.gy)*100;
    for(const siteTri of siteTriangles){const pts=clipTriangle(tri,siteTri),a=polyArea(pts);if(a<EPS)continue;
      facets.push({pts,slope,gx:f.gx,gy:f.gy,level:pts.reduce((s,p)=>s+f.z(p),0)/pts.length});area+=a;weightedSlope+=a*slope;if(slope>t.slopeLimit+EPS)steepArea+=a;
      for(const p of pts){const z=f.z(p);min=Math.min(min,z);max=Math.max(max,z);}
      if(t.platform!==null){const target=t.platform;cut+=integrate(clipHalf(pts,p=>f.z(p)-target),p=>f.z(p)-target);fill+=integrate(clipHalf(pts,p=>target-f.z(p)),p=>target-f.z(p));}
    }
  }
  if(Math.abs(area-polyArea(boundary))>Math.max(.001,polyArea(boundary)*1e-8))throw Error('Elevation grid does not cover this boundary. Reimport a complete grid; no extrapolation is used.');
  return {min,max,area,meanSlope:weightedSlope/area,maxSlope:Math.max(...facets.map(f=>f.slope)),steepArea,cut:t.platform===null?null:cut,fill:t.platform===null?null:fill,facets};
}
