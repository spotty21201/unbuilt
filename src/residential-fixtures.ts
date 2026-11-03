import { buildResidentialScenario, type ResidentialInputs, type LotProduct } from './residential.ts';
import type { Pt } from './polygon.ts';
export function residentialProduct(id:string,name:string,frontage:number,depth:number,color:string):LotProduct {
  return {id,name,color,frontage,depth,frontageMin:frontage*.9,frontageMax:frontage*1.1,depthMin:depth*.9,depthMax:depth*1.1,areaMin:frontage*depth*.8,areaMax:frontage*depth*1.2,maxSaleableArea:frontage*depth*1.2,irregular:true,minRearRatio:.7,rate:null};
}
export const residentialBoundaries:Record<string,Pt[]>={
  rectangle:[{x:0,y:0},{x:120,y:0},{x:120,y:100},{x:0,y:100}],
  angled:[{x:0,y:0},{x:110,y:0},{x:125,y:50},{x:100,y:100},{x:0,y:100}],
  concave:[{x:0,y:0},{x:120,y:0},{x:120,y:65},{x:80,y:65},{x:80,y:100},{x:0,y:100}],
  neck:[{x:0,y:0},{x:50,y:0},{x:50,y:45},{x:70,y:45},{x:70,y:0},{x:120,y:0},{x:120,y:100},{x:70,y:100},{x:70,y:55},{x:50,y:55},{x:50,y:100},{x:0,y:100}],
};
export function residentialFixture(kind='rectangle'):ResidentialInputs {
  const boundary=structuredClone(residentialBoundaries[kind]??residentialBoundaries.rectangle),edge=boundary.length-1;
  return {version:1,objective:'yield',objectiveNote:'Maximum valid lot yield within declared products and constraints',source:'Fictitious metre-coordinate fixture, 1 November 2026',fixedRequirements:'Fixed boundary, retained feature and one permitted entrance',preferences:'Matching products on opposing sides; approximately 1:2 proportions where suitable',adjustable:'Unlocked roads, groups, product tolerances and flexible space',unknowns:'',boundary,boundaryLocked:true,calibration:'source-metres',independentCheck:'Fixture edge: west boundary 100 m',
    externalRoads:[{id:'external',name:'Existing West Road (fictitious)',a:{x:-6,y:0},b:{x:-6,y:100},rightOfWay:12,carriageway:6,eligible:[{edge,from:10,to:90}]}],
    entrance:{edge,offset:50,width:10,transition:12,roadId:'main',externalRoadId:'external',locked:false,role:'Primary',movements:'Two-way, provisional'},
    roadRules:{corridor:8,carriageway:6,cornerReturn:0,centrelineRadius:null,junctionAngle:90,turning:'',confirmed:false},
    roads:[{id:'main',name:'Main Street',path:[{x:0,y:50},{x:12,y:50},{x:40,y:50},{x:70,y:50},{x:112,y:50}],locked:false}],
    products:[residentialProduct('compact','Compact',6,12,'#d4a35c'),residentialProduct('family','Family',8,16,'#7ca8cc')],
    groups:[{id:'west',roadId:'main',from:0,to:.5,productId:'compact',locked:false},{id:'east',roadId:'main',from:.5,to:1,productId:'family',locked:false}],
    spaces:[{id:'feature',name:'Retained natural feature',kind:'protected',points:[{x:10,y:5},{x:22,y:5},{x:22,y:15},{x:10,y:15}],buffer:2,bufferSource:'Provisional fixture assumption',minArea:120,locked:true,function:'Retained feature',requiresAccess:false,prohibition:'all',crossing:'none'},
    {id:'park',name:'Neighbourhood open space',kind:'flexible',points:[{x:80,y:54},{x:100,y:54},{x:100,y:64},{x:80,y:64}],buffer:0,bufferSource:'No extra buffer assumed',minArea:150,locked:false,function:'Recreation',requiresAccess:true,prohibition:'all',crossing:'none'}],
    mix:{basis:'units',mode:'percent',tolerance:10,mandatory:false,rounding:'largest-remainder',targets:{compact:50,family:50}},commonRates:[],lockedLots:[],fill:false};
}
export const residentialExample=(kind='rectangle')=>buildResidentialScenario(residentialFixture(kind),'residential',`Residential ${kind}`,'Fictitious grouped residential fixture');

export function residentialEngineeredFixture():ResidentialInputs {
  const i:ResidentialInputs={...residentialFixture(),version:2,phase:'layout'};
  i.spaces=[];i.externalRoads[0].source='Fictitious survey main road';
  i.entrance.connectionDecision={status:'approved',reference:'Fixture connection decision',date:'2026-11-01',authority:'Fictitious owner'};
  i.roads[0].path=[{x:0,y:50},{x:12,y:50},{x:80,y:50},{x:80,y:90}];i.roads[0].curves=[{vertex:2,radius:15}];i.roads[0].turningHeads=[{end:'end',radius:6}];
  i.roadRules={...i.roadRules,cornerReturn:3,centrelineRadius:10,confirmed:true,turning:'Fictitious circular head requirement'};
  i.vehicle={width:2,length:4,minRadius:3,source:'Fictitious rigid screening body'};
  return i;
}
