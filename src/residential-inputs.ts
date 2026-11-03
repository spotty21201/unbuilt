import type {ResidentialInputs,ResidentialSpace,ResidentialScenario,ResidentialWorkspace} from './residential.ts';
import {calculateResidential} from './residential.ts';
import type {Pt} from './polygon.ts';
import {isSimple,polyArea} from './polygon.ts';
import {UNIT_METRES,type ImportUnit} from './site-context.ts';

export function siteFirstInputs(boundary:Pt[]=[],source=''):ResidentialInputs {
  return {version:2,phase:'site',objective:'yield',objectiveNote:'Maximum valid lot yield within the declared product mix and constraints',source,fixedRequirements:'',preferences:'Coherent facing street groups',adjustable:'Internal roads, product-group allocation and proposed open space',unknowns:'',boundary:structuredClone(boundary),boundaryLocked:boundary.length>=3,calibration:'unverified',independentCheck:'',externalRoads:[],entrance:{id:'primary',edge:0,offset:0,width:8,transition:12,roadId:'main',externalRoadId:'',locked:false,role:'Primary',movements:''},roadRules:{corridor:8,carriageway:null,cornerReturn:0,centrelineRadius:null,junctionAngle:90,anglePolicy:'preference',turning:'',confirmed:false},roads:[],products:[],groups:[],spaces:[],mix:{basis:'units',mode:'percent',tolerance:5,mandatory:true,rounding:'largest-remainder',targets:{}},commonRates:[],lockedLots:[],fill:false};
}
export function upgradeResidentialInputs(i:ResidentialInputs):ResidentialInputs {return {...structuredClone(i),version:2,phase:i.roads.length?'layout':'site'};}
export function residentialWorkspaceVersion(w:Pick<ResidentialWorkspace,'accepted'|'alternatives'>):1|2 {return [w.accepted,...w.alternatives].some(s=>s.inputs.version===2)?2:1;}
export function suppliedSpace(points:Pt[],kind:ResidentialSpace['kind'],name:string,id:string,source='Planner-supplied metre geometry'):ResidentialSpace {
  return {id,name,kind,points:structuredClone(points),buffer:0,bufferSource:'No additional buffer declared',minArea:0,locked:kind==='protected',function:kind==='protected'?'Retained natural feature':kind==='flexible'?'Proposed recreation':'Reservation',requiresAccess:kind==='flexible',prohibition:'all',crossing:'none',source};
}
export function importPlanGeometry(raw:unknown,kind:'boundary'|'external'|'protected'|'flexible'|'reservation',unit:ImportUnit,source:string):{polygons:Array<{name:string;points:Pt[];holes:Pt[][]}>;lines:Array<{name:string;points:Pt[]}>} {
  const factor=UNIT_METRES[unit];if(!factor)throw Error('Choose the coordinate units explicitly.');
  const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
  const point=(v:unknown):Pt=>{if(!Array.isArray(v)||v.length<2||!v.slice(0,2).every(n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n*factor)<=1e6))throw Error('Geometry needs finite local x,y coordinates in the selected units. Geographic longitude/latitude are not reprojected.');return {x:(v[0] as number)*factor,y:(v[1] as number)*factor};};
  const ring=(v:unknown):Pt[]=>{if(!Array.isArray(v)||v.length>513)throw Error('Polygon needs 3–512 corners.');let p=v.map(point);if(p.length>1&&Math.hypot(p[0].x-p.at(-1)!.x,p[0].y-p.at(-1)!.y)<.000001)p=p.slice(0,-1);if(p.length<3||!isSimple(p)||polyArea(p)<.01)throw Error('Imported polygon is degenerate, repeats segments or crosses itself.');return p;};
  const result:{polygons:Array<{name:string;points:Pt[];holes:Pt[][]}>;lines:Array<{name:string;points:Pt[]}>}={polygons:[],lines:[]};
  const visit=(item:unknown,name=source)=>{
    if(!object(item))throw Error('Import a GeoJSON geometry, Feature or FeatureCollection.');
    if(item.type==='FeatureCollection'){if(!Array.isArray(item.features)||item.features.length>24)throw Error('Use at most 24 source features.');item.features.forEach(f=>visit(f));return;}
    if(item.type==='Feature'){const p=object(item.properties)?item.properties:{};visit(item.geometry,typeof p.name==='string'?p.name.slice(0,100):name);return;}
    if(item.type==='Polygon'){if(!Array.isArray(item.coordinates)||!item.coordinates.length||item.coordinates.length>17)throw Error('A polygon needs an outer ring and at most 16 holes.');const [outer,...holes]=item.coordinates.map(ring);result.polygons.push({name,points:outer,holes});return;}
    if(item.type==='MultiPolygon'){if(!Array.isArray(item.coordinates)||item.coordinates.length>24)throw Error('Use at most 24 polygon components.');item.coordinates.forEach((coordinates,k)=>visit({type:'Polygon',coordinates},`${name} ${k+1}`));return;}
    if(item.type==='LineString'){if(!Array.isArray(item.coordinates)||item.coordinates.length<2||item.coordinates.length>64)throw Error('Road alignment needs 2–64 ordered points.');result.lines.push({name,points:item.coordinates.map(point)});return;}
    if(item.type==='MultiLineString'){if(!Array.isArray(item.coordinates)||item.coordinates.length>16)throw Error('Use at most 16 road alignments.');item.coordinates.forEach((coordinates,k)=>visit({type:'LineString',coordinates},`${name} ${k+1}`));return;}
    throw Error('Supported GeoJSON geometry: Polygon/MultiPolygon and LineString/MultiLineString in explicitly selected local units.');
  };
  if(raw&&typeof raw==='object'&&'crs' in raw)throw Error('CRS reprojection is not implemented. Supply source coordinates in an explicitly converted local frame without a geographic CRS declaration.');
  visit(raw);
  if(kind==='boundary'&&(result.polygons.length!==1||result.polygons[0].holes.length||result.lines.length))throw Error('A fixed site boundary must be one closed outer polygon, without holes. Import exclusions as protected features.');
  if(kind==='external'&&(!result.lines.length||result.polygons.length))throw Error('An external road import needs centreline LineString geometry; supply ROW/carriageway widths separately.');
  if(!['boundary','external'].includes(kind)&&(!result.polygons.length||result.lines.length))throw Error('Supply the feature/open-space bank or outline as a polygon. River centreline buffers can be drawn explicitly with their declared width.');
  return result;
}
export function combineResidential(a:ResidentialScenario,b:ResidentialScenario,choices:{network:'a'|'b';groups:'a'|'b';spaces:'a'|'b'},id:string,name:string):ResidentialScenario {
  if(JSON.stringify(a.inputs.boundary)!==JSON.stringify(b.inputs.boundary))throw Error('Combining requires the same fixed boundary.');
  const fixed=(s:ResidentialScenario)=>s.inputs.spaces.filter(p=>p.kind==='protected').map(p=>[p.id,p.points,p.holes,p.buffer]).sort((a,b)=>String(a[0]).localeCompare(String(b[0])));
  if(JSON.stringify(fixed(a))!==JSON.stringify(fixed(b)))throw Error('The alternatives have different fixed protection. Resolve the source/decision before combining them.');
  const network=choices.network==='a'?a:b,groups=choices.groups==='a'?a:b,spaces=choices.spaces==='a'?a:b;
  const inputs:ResidentialInputs={...upgradeResidentialInputs(network.inputs),products:structuredClone(groups.inputs.products),groups:structuredClone(groups.inputs.groups),mix:structuredClone(groups.inputs.mix),spaces:structuredClone(spaces.inputs.spaces),lockedLots:[]};
  for(const group of inputs.groups)if(!inputs.roads.some(r=>r.id===group.roadId))throw Error(`Group ${group.id} has no matching street in the selected network. Remap it explicitly before combining.`);
  for(const lot of [...a.inputs.lockedLots,...b.inputs.lockedLots]){if(!inputs.lockedLots.some(l=>l.id===lot.id))inputs.lockedLots.push(structuredClone(lot));else if(JSON.stringify(inputs.lockedLots.find(l=>l.id===lot.id)!.points)!==JSON.stringify(lot.points))throw Error(`Held lot ${lot.id} conflicts between the alternatives.`);}
  return {id,name,parents:[a.id,b.id],assumptions:`Roads/entrances from ${network.name}; product groups from ${groups.name}; flexible spaces from ${spaces.name}`,idea:'Combined selected inputs, with complete geometry recalculation',advantage:'Retains selected organizing choices',compromise:'All combined constraints and quantities require a new review',inputs,result:calculateResidential(inputs,id)};
}

export function mergeResidentialWorkspaces(current:ResidentialWorkspace|undefined,incoming:ResidentialWorkspace):ResidentialWorkspace {
  const next=structuredClone(incoming),retained=structuredClone(current?.alternatives??[]),mapping=new Map<string,string>();
  for(const s of next.alternatives){const old=retained.find(a=>a.id===s.id);if(old&&JSON.stringify(old.inputs)!==JSON.stringify(s.inputs)){const before=s.id;let id=`imported_${retained.length+1}`;while(retained.some(a=>a.id===id)||next.alternatives.some(a=>a.id===id))id+='_i';s.id=id;s.result=calculateResidential(s.inputs,id);mapping.set(before,id);}}
  for(const s of next.alternatives){if(s.parents)s.parents=s.parents.map(id=>mapping.get(id)??id);if(!retained.some(a=>a.id===s.id))retained.push(s);}
  if(retained.length>20)throw Error('This import would exceed 20 saved alternatives. Export a full backup and import as a separate project, or remove selected alternatives deliberately before merging. Nothing was replaced.');
  return {...next,version:[next.accepted,...retained].some(s=>s.inputs.version===2)?2:1,alternatives:retained,selected:next.selected.map(id=>mapping.get(id)??id),decisions:[...(current?.decisions??[]),...next.decisions]};
}
