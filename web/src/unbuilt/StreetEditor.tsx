import { useState, type ReactNode } from 'react';
import type { Pt } from '../../../src/polygon';
import { MAX_STREETS, streetLength, streetNodes, type StreetNetwork } from '../../../src/streets';
interface Props {
  network: StreetNetwork; selectedId: string | null; onSelect: (id: string) => void;
  onChange: (network: StreetNetwork) => void; onMove: (from: Pt, to: Pt) => void;
  drawing: Pt[] | null; onDraw: () => void; onPoint: (point: Pt) => void;
  onFinish: () => void; onBack: () => void; onStop: () => void;
  onEntrance: () => void; onConnect: () => void; onGenerated: () => void;
  onCanvas: () => void;
  joinGap?: {distance:number;onJoin:()=>void};
  connectorNote?: string;
  newWidth: number; onWidth: (width: number) => void;
  error: string | null; review: ReactNode; onApply: () => void; onCancel: () => void;
}
export default function StreetEditor(p: Props) {
  const [coordinateEntry,setCoordinateEntry]=useState<{network:StreetNetwork;values:Record<string,string>}>({network:p.network,values:{}});
  const coordinateText=coordinateEntry.network===p.network?coordinateEntry.values:{};
  const setCoordinateText=(values:Record<string,string>)=>setCoordinateEntry({network:p.network,values});
  const [x,setX]=useState(''),[y,setY]=useState('');
  const selected=p.network.segments.find(s=>s.id===p.selectedId)??p.network.segments[0];
  const pending=Object.keys(coordinateText).length>0;
  const coordinate=(point:Pt,axis:'x'|'y',key:string)=><label key={key}>{axis.toUpperCase()} (m)<input type="number" aria-label={`Street ${key.startsWith('a')?'start':'end'} ${axis.toUpperCase()}`} min={0} max={500} step="any" value={coordinateText[key]??String(point[axis])} aria-invalid={coordinateText[key]!==undefined} onChange={e=>{
    const value=e.target.value.trim()===''?NaN:Number(e.target.value);
    if(Number.isFinite(value)&&value>=0&&value<=500){p.onMove(point,{...point,[axis]:value});setCoordinateText({});}else setCoordinateText({...coordinateText,[key]:e.target.value});
  }} /></label>;
  return <section className="street-editor" aria-label="Street network editor"><header><h2 tabIndex={-1}>Edit streets</h2><span className="modebadge">Unapplied draft</span></header>
    <p>Draw horizontal and vertical legs. A green Join cue snaps pointer picks to nearby centrelines. Drag junctions to shift connected rows/columns; watch ΔX/ΔY on the drawing. The entrance may need reconnecting.</p>
    {selected&&<p className="street-selected-summary">Selected: Street {p.network.segments.indexOf(selected)+1} · {selected.width} m wide · {streetLength(selected).toFixed(1)} m long. ({selected.a.x}, {selected.a.y}) → ({selected.b.x}, {selected.b.y})</p>}
    <div className="street-editor-actions"><button type="button" disabled={!!p.error||pending||p.drawing!==null} onClick={p.onApply}>Apply streets</button><button type="button" onClick={p.onCancel}>Cancel streets</button></div>
    {p.error&&<p className="error" role="alert">{p.error} The accepted plan remains saved. Grey is accepted geometry; outlined corridors are the draft, with conflicts marked red at full width.</p>}
    {p.joinGap&&<button type="button" onClick={p.joinGap.onJoin}>Join highlighted gap ({p.joinGap.distance.toFixed(1)} m)</button>}
    {p.connectorNote&&<p className="street-connector-note">{p.connectorNote} Orange corridors are the proposed entrance link; dashed orange outlines identify affected accepted lots. External access is assumed and unverified. Apply or Cancel this proposal.</p>}
    {pending&&<p className="error" role="alert">Complete the coordinate between 0 and 500 m, or Cancel streets. An empty field is not zero.</p>}
    {p.review}
    <p className="note">Widths of 6–12 m are design assumptions, not approved standards. Road costs use unioned surface area. Turning, traffic, pedestrian design and external access remain unverified.</p>
    <div className="draftrow"><button type="button" disabled={p.drawing!==null||p.network.segments.length>=MAX_STREETS} onClick={p.onDraw}>Draw street</button><button type="button" disabled={p.drawing!==null} onClick={p.onEntrance}>Start at entrance</button><button type="button" disabled={p.drawing!==null} onClick={p.onConnect}>Connect entrance</button><button type="button" className="street-view-canvas" onClick={p.onCanvas}>View drawing</button></div>
    <label>New street width <output>{p.newWidth} m</output><input type="range" aria-label="New street width" min={6} max={12} step={1} value={p.newWidth} onChange={e=>p.onWidth(Number(e.target.value))}/></label>
    {p.drawing!==null&&<div className="street-drawing"><h3>Drawing street · {p.drawing.length} corners</h3><p>Click the canvas or add coordinates. A diagonal pick adds an orthogonal bend. Enter finishes; Escape cancels this stroke. Apply streets accepts the complete network.</p>
      <form onSubmit={e=>{e.preventDefault();if(x.trim()&&y.trim()&&[Number(x),Number(y)].every(v=>Number.isFinite(v)&&v>=0&&v<=500))p.onPoint({x:Number(x),y:Number(y)});}}><label>X (m)<input aria-label="Drawing street X" type="number" min={0} max={500} step="any" value={x} onChange={e=>setX(e.target.value)} required/></label><label>Y (m)<input aria-label="Drawing street Y" type="number" min={0} max={500} step="any" value={y} onChange={e=>setY(e.target.value)} required/></label><button type="submit">Add street point</button></form>
      <p>{p.drawing.map(point=>`(${point.x}, ${point.y})`).join(' → ')||'Choose the first point.'}</p><div className="draftrow"><button type="button" disabled={p.drawing.length<2} onClick={p.onFinish}>Finish street</button><button type="button" disabled={!p.drawing.length} onClick={p.onBack}>Remove drawing corner</button><button type="button" onClick={p.onStop}>Cancel drawing</button></div></div>}
    <label>Selected street<select aria-label="Selected street" value={selected?.id??''} onChange={e=>{setCoordinateText({});p.onSelect(e.target.value);}}><option value="" disabled>Choose a street</option>{p.network.segments.map((s,i)=><option key={s.id} value={s.id}>Street {i+1} · {streetLength(s).toFixed(1)} m long · {s.width} m wide</option>)}</select></label>
    {selected&&<><h3>Street {p.network.segments.indexOf(selected)+1}</h3><label>Width <output>{selected.width} m</output><input type="range" aria-label="Selected street width" min={6} max={12} step={1} value={selected.width} onChange={e=>p.onChange({segments:p.network.segments.map(s=>s.id===selected.id?{...s,width:Number(e.target.value)}:s)})}/></label>
      <div className="street-endpoints">{(['a','b']as const).map(end=><fieldset key={end}><legend>{end==='a'?'Start junction':'End junction'}</legend>{(['x','y']as const).map(axis=>coordinate(selected[end],axis,`${end}-${axis}`))}</fieldset>)}</div>
      <button type="button" disabled={p.drawing!==null} onClick={()=>p.onChange({segments:p.network.segments.filter(s=>s.id!==selected.id)})}>Remove selected street</button></>}
    <p className="note">{p.network.segments.length}/{MAX_STREETS} segments · {streetNodes(p.network).length} junction/end points. Pointer/arrow edits snap to 1 m; typed coordinates retain decimals. Undo/Redo edits this street draft; Apply creates one plan-history step.</p>
    <button type="button" disabled={p.drawing!==null} onClick={p.onGenerated}>Preview generated routing instead</button>
  </section>;
}
