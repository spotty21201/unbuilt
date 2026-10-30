import {useMemo,useState,type ReactNode} from 'react';
import type {Rect} from '../../../src/schema';
import type {Pt} from '../../../src/polygon';
import {lotBlocks,rectangularGroup,replaceParcels,splitParcel,subdivideBlock} from '../../../src/parcels';
export type LotOperation='split'|'merge'|'block';
interface Props {
  mode:LotOperation;parcels:Rect[];edits:Record<string,Pt[]>;selected:number[];
  ready:boolean;error:string|null;review:ReactNode;
  onPreview:(lots:Rect[],newLots:Rect[],vacant:boolean,label:string,sources:number[])=>void;
  onInvalidate:()=>void;onHighlight:(rect:Rect|null)=>void;
  onApply:()=>void;onCancel:()=>void;onCanvas:()=>void;
}
export default function LotPlanEditor(p:Props){
  const blocks=useMemo(()=>lotBlocks(p.parcels),[p.parcels]);
  const [mode,setMode]=useState(p.mode),[selected,setSelected]=useState(p.selected);
  const [axis,setAxis]=useState<'x'|'y'>('x'),[ratio,setRatio]=useState('50'),[count,setCount]=useState(p.mode==='block'?String(Math.max(2,p.selected.length)):'2');
  const [vacant,setVacant]=useState(false),[error,setError]=useState<string|null>(null);
  const change=()=>{p.onInvalidate();setError(null);};
  const highlight=(indices:number[])=>{try{p.onHighlight(rectangularGroup(p.parcels,indices,p.edits));}catch{p.onHighlight(null);}};
  const choose=(indices:number[])=>{setSelected(indices);change();highlight(indices);};
  const setOperation=(value:LotOperation)=>{setMode(value);change();const indices=value==='block'?(blocks.find(b=>b.indices.includes(selected[0]))?.indices??selected):value==='split'?[selected[0]??0]:selected;setSelected(indices);highlight(indices);};
  const preview=()=>{
    try{
      const use=mode==='split'?[selected[0]]:selected;
      if(mode==='merge'&&use.length<2)throw Error('Choose at least two adjacent lots to merge.');
      const box=rectangularGroup(p.parcels,use,p.edits);
      const newLots=mode==='merge'?[box]:mode==='split'?splitParcel(box,axis,ratio.trim()?Number(ratio)/100:NaN):subdivideBlock(box,axis,count.trim()?Number(count):NaN);
      p.onPreview(replaceParcels(p.parcels,use,newLots),newLots,vacant,mode==='merge'?'Merge lots':mode==='split'?'Split lot':'Subdivide block',use);
      p.onHighlight(box);setError(null);
    }catch(e){setError(e instanceof Error?e.message:'Unable to prepare this lot plan.');p.onInvalidate();}
  };
  return <section className="lot-plan-editor" aria-label="Blocks and lots editor"><header><h2 tabIndex={-1}>Blocks &amp; lots</h2><span className="modebadge">Unapplied draft</span></header>
    <p>Split rectangular lots, merge a rectangular group, or repartition a connected rectangular block. Blue outlines mark the source; preview colours show changed lots. Streets and open space stay fixed.</p>
    <div className="lot-plan-actions"><button type="button" onClick={p.onApply} disabled={!p.ready||!!p.error||!!error}>Apply lot plan</button><button type="button" onClick={p.onCancel}>Cancel lot plan</button></div>
    {(error||p.error)&&<p className="error" role="alert">{error??p.error} The accepted plan is unchanged. Each lot needs road frontage; occupied lots must fit the current home and setbacks. For small lots, explicitly choose vacant lots, or enlarge the subdivision.</p>}
    {p.review}
    <label>Operation<select aria-label="Lot operation" value={mode} onChange={e=>setOperation(e.target.value as LotOperation)}><option value="split">Split one lot</option><option value="merge">Merge adjacent lots</option><option value="block">Subdivide block</option></select></label>
    {mode==='block'&&<label>Connected block<select aria-label="Connected block" value={blocks.findIndex(b=>b.indices.join(',')===selected.join(','))} onChange={e=>{const block=blocks[Number(e.target.value)];if(block){choose(block.indices);setCount(String(Math.max(2,block.indices.length)));}}}><option value={-1} disabled>Choose a block</option>{blocks.map((b,i)=><option value={i} key={i}>Block {i+1} · {b.indices.length} lots · {b.rectangular?`${b.bounds.w.toFixed(1)} × ${b.bounds.h.toFixed(1)} m`:'nonrectangular: choose a rectangular subset'}</option>)}</select></label>}
    <label>{mode==='split'?'Lot to split':'Lots in this operation'}<select aria-label="Operation lots" multiple={mode!=='split'} size={mode==='split'?1:5} value={mode==='split'?String(selected[0]??''):selected.map(String)} onChange={e=>choose(Array.from(e.target.selectedOptions,option=>Number(option.value)))}>{p.parcels.map((r,i)=><option key={i} value={i}>Lot {i+1} · {(r.w*r.h).toFixed(1)} m² · {r.w.toFixed(1)} × {r.h.toFixed(1)} m</option>)}</select></label>
    {mode!=='split'&&<p className="note">Select several lots using Ctrl/Command, Shift or the native touch selector. You can also Shift-select lots on the plan before opening this editor.</p>}
    {mode!=='merge'&&<><label>Cut direction<select aria-label="Lot cut direction" value={axis} onChange={e=>{setAxis(e.target.value as 'x'|'y');change();}}><option value="x">Vertical cuts · divide east–west width</option><option value="y">Horizontal cuts · divide north–south depth</option></select></label>{mode==='split'?<label>First lot share (%)<input aria-label="First lot share" type="number" min={1} max={99} step="any" value={ratio} onChange={e=>{setRatio(e.target.value);change();}}/></label>:<label>Number of equal lots<input aria-label="Subdivision lot count" type="number" min={2} max={100} step={1} value={count} onChange={e=>{setCount(e.target.value);change();}}/></label>}</>}
    <label className="lot-vacancy"><input type="checkbox" checked={vacant} onChange={e=>{setVacant(e.target.checked);change();}}/>Create resulting lots as vacant · no homes or home revenue</label>
    <p className="note">Existing removed-home reservations remain protected, even when lots are merged or split. This checkbox never silently restores removed homes. One home is modeled per occupied resulting lot; a merge can reduce the home count.</p>
    <div className="draftrow"><button type="button" onClick={preview}>Preview lot plan</button><button type="button" onClick={p.onCanvas}>View drawing</button></div>
    {!p.ready&&<p role="status">Preview the current inputs before Apply. No accepted lot has been replaced.</p>}
    <p className="note">Minimum rectangular dimension 1 m; at most 500 manual lots. Nonrectangular merges, polygon splitting, holes and curved lot edges are not supported. For polygon outline edits, Cancel and use Reshape lot. These are planning parcels, not a cadastral or subdivision approval.</p>
  </section>;
}
