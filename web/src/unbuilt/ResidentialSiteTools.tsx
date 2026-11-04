import {useEffect,useRef,useState} from 'react';
import type {ResidentialInputs} from '../../../src/residential';
import type {Pt} from '../../../src/polygon';
import {importPlanGeometry} from '../../../src/residential-inputs';
import {parseBoundaryDxf,UNIT_METRES,type ImportUnit,type SurveyReference} from '../../../src/site-context';
import {readSurvey,type SurveyRaster} from './survey-file';
import type {DrawingKind} from './ResidentialCanvas';
export type SourceKind='boundary'|'external'|'protected'|'flexible'|'reservation';
export interface ImportedGeometry {kind:SourceKind;name:string;source:string;polygons:Array<{name:string;points:Pt[];holes:Pt[][]}>;lines:Array<{name:string;points:Pt[]}>}
export interface KnownMeasure {known:number;tolerance:number;bearing:number|null}
export default function ResidentialSiteTools({inputs,onDraw,onImport,onReference,onStatus,raster,onClearReference}:{onClearReference:()=>void;inputs:ResidentialInputs;onDraw:(kind:DrawingKind,target?:string,measure?:KnownMeasure)=>void;onImport:(g:ImportedGeometry)=>void;onReference:(r:SurveyRaster,s:SurveyReference)=>void;onStatus:(s:string)=>void;raster:SurveyRaster|null}){
  const [kind,setKind]=useState<SourceKind>('boundary'),[unit,setUnit]=useState<ImportUnit>('m'),[known,setKnown]=useState(''),[tolerance,setTolerance]=useState('0.1'),[bearing,setBearing]=useState(''),[busy,setBusy]=useState(false),seq=useRef(0);
  useEffect(()=>()=>{seq.current++;},[]);
  const measure=(type:'calibrate'|'dimension')=>{const n=Number(known),tol=Number(tolerance),direction=bearing.trim()?Number(bearing):null;if(!Number.isFinite(n)||n<=0||!Number.isFinite(tol)||tol<0||direction!==null&&!Number.isFinite(direction)){onStatus('Enter a positive known distance and a non-negative tolerance before choosing two points.');return;}onDraw(type,undefined,{known:n,tolerance:tol,bearing:direction});};
  const load=async(file:File)=>{
    if(file.size>20e6){onStatus('Choose a geometry file up to 20 MB.');return;}
    const request=++seq.current;setBusy(true);
    try{
      const text=await file.text();if(request!==seq.current)return;
      let geometry:ReturnType<typeof importPlanGeometry>;
      if(/\.dxf$/i.test(file.name)){
        if(kind!=='boundary')throw Error('DXF import here supports closed straight site outlines. Use local-coordinate GeoJSON/CSV for main roads and supplied features.');
        const parsed=parseBoundaryDxf(text);if(parsed.candidates.length!==1)throw Error(`Found ${parsed.candidates.length} closed DXF outlines. Export the intended site outline alone so no source polygon is chosen automatically.`);
        const p=parsed.candidates[0].points.map(p=>({x:p.x*UNIT_METRES[unit],y:p.y*UNIT_METRES[unit]}));if(p.length>1&&p[0].x===p.at(-1)!.x&&p[0].y===p.at(-1)!.y)p.pop();
        geometry={polygons:[{name:parsed.candidates[0].layer,points:p,holes:[]}],lines:[]};
      }else if(/\.(geojson|json)$/i.test(file.name))geometry=importPlanGeometry(JSON.parse(text),kind,unit,file.name);
      else{
        const rows=text.replace(/^\uFEFF/,'').split(/\r?\n/).filter(x=>x.trim());if(/^(x|easting)[,;\t]/i.test(rows[0]??''))rows.shift();
        const p=rows.map((row,k)=>{const c=row.trim().split(/[,;\t\s]+/);if(c.length!==2||c.some(x=>!x.trim()||!Number.isFinite(Number(x))))throw Error(`Coordinate row ${k+1} needs two finite numbers: x,y.`);return [Number(c[0]),Number(c[1])];});
        geometry=importPlanGeometry({type:kind==='external'?'LineString':'Polygon',coordinates:kind==='external'?p:[p]},kind,unit,file.name);
      }
      onImport({kind,name:file.name,source:`Supplied ${file.name}; coordinates ${unit}, converted to metres; source positions retained`,...geometry});
    }catch(e){onStatus(e instanceof Error?e.message:String(e));}finally{if(request===seq.current)setBusy(false);}
  };
  const attach=async(file:File)=>{const request=++seq.current;setBusy(true);try{const r=await readSurvey(file,inputs.survey?.page??1);if(request!==seq.current){URL.revokeObjectURL(r.url);return;}const saved=inputs.survey;if(saved&&saved.fingerprint!==r.fingerprint){URL.revokeObjectURL(r.url);throw Error('This reference differs from the saved calibrated file. Remove/change the saved reference explicitly before replacing its source.');}
    const s=saved??{name:r.name,fingerprint:r.fingerprint,page:r.page,width:r.width,height:r.height,a:{x:0,y:r.height},b:{x:r.width,y:r.height},distance:100,anchor:{x:0,y:0},direction:0};onReference(r,s);onStatus(saved?'Reattached the saved calibrated reference.':'Reference attached at a provisional 100 m display width. Calibrate a known distance before tracing.');
  }catch(e){onStatus(e instanceof Error?e.message:String(e));}finally{if(request===seq.current)setBusy(false);}};
  return <details className="res-source-tools"><summary>Source geometry & reliable scale</summary>
    <p>Import source geometry in a common local coordinate frame.</p>
    <label>Geometry to import<select aria-label="Geometry to import" value={kind} onChange={e=>setKind(e.target.value as SourceKind)}><option value="boundary">Fixed site boundary</option><option value="external">Existing external/main road centreline</option><option value="protected">Supplied natural-feature polygon</option><option value="flexible">Proposed open-space polygon</option><option value="reservation">Other reservation polygon</option></select></label>
    <label>Source coordinate units<select aria-label="Source coordinate units" value={unit} onChange={e=>setUnit(e.target.value as ImportUnit)}><option value="m">Metres</option><option value="mm">Millimetres</option><option value="ft">Feet</option></select></label>
    <label>Import geometry (GeoJSON / CSV; boundary also ASCII DXF)<input type="file" accept=".geojson,.json,.csv,.dxf,.txt" disabled={busy} onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(file)void load(file);}}/></label>
    <p>Convert GIS coordinates to a local metre frame first; longitude/latitude and reprojection are unsupported. Corners and holes are retained.</p>
    <label>Attach a PDF, PNG or JPEG reference<input type="file" accept=".pdf,.png,.jpg,.jpeg" disabled={busy} onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(file)void attach(file);}}/></label>
    {(raster||inputs.survey)&&<button onClick={onClearReference}>Remove reference calibration</button>}{raster&&<p>{raster.name} · {raster.width} × {raster.height} px · page {raster.page}/{raster.pages}. Media are session-only; calibration is saved with accepted inputs.</p>}
    <label>Known distance (m)<input type="number" step="any" value={known} onChange={e=>setKnown(e.target.value)}/></label>
    <label>Independent dimension tolerance (m)<input type="number" min="0" step="any" value={tolerance} onChange={e=>setTolerance(e.target.value)}/></label>
    <label>Known line bearing (degrees; blank keeps orientation)<input type="number" step="any" value={bearing} onChange={e=>setBearing(e.target.value)}/></label>
    <button disabled={!raster||busy} onClick={()=>measure('calibrate')}>Calibrate reference from two points</button><button disabled={busy} onClick={()=>measure('dimension')}>Check an independent known dimension</button>
    <p>Calibration sets the reference scale. Accepted vector coordinates stay fixed; any required retracing is an explicit boundary edit.</p>
  </details>;
}
