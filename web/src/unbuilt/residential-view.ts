import type {ResidentialInputs} from '../../../src/residential';
import {externalRoadPath} from '../../../src/residential-site';
export interface PlanFrame {minX:number;minY:number;maxX:number;maxY:number}
export function residentialFrame(inputs:ResidentialInputs[]):PlanFrame {
  const pts=inputs.flatMap(i=>[...i.boundary,...i.externalRoads.flatMap(r=>externalRoadPath(r).flatMap(p=>[{x:p.x-(r.rightOfWay??0)/2,y:p.y-(r.rightOfWay??0)/2},{x:p.x+(r.rightOfWay??0)/2,y:p.y+(r.rightOfWay??0)/2}])),...i.spaces.flatMap(s=>s.points)]).filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y));
  if(!pts.length)return {minX:-15,minY:-10,maxX:130,maxY:110};
  const minX=Math.min(...pts.map(p=>p.x)),minY=Math.min(...pts.map(p=>p.y)),maxX=Math.max(...pts.map(p=>p.x)),maxY=Math.max(...pts.map(p=>p.y)),margin=Math.max(5,Math.max(maxX-minX,maxY-minY)*.07);
  return {minX:minX-margin,minY:minY-margin,maxX:maxX+margin,maxY:maxY+margin};
}
