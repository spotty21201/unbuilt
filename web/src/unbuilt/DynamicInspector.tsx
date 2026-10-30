import {polyArea} from '../../../src/polygon';
import { useRef } from 'react';
import type { ReactNode } from 'react';
import { InspectIcon, LockIcon } from './icons';
import type { PlanningParameters } from '../../../src/planning';
import type { Rect } from '../../../src/schema';
import { homeArea } from '../../../src/planning';

type Selection = 'site' | 'grove' | 'circulation' | 'homes' | null;
interface Props {
  selectionNotice?:string;
  builtArea?:number;
  housingControls?:ReactNode;
  onEditStreets: () => void;
  onGeneratedStreets: () => void;
  siteControls?: ReactNode;
  openSpaceControls?:ReactNode;
  lotControls?: ReactNode;
  selection: Selection;
  onSelect: (selection: Selection) => void;
  label: string;
  area: number | null;
  siteArea: number;
  homes: number | null;
  planning: PlanningParameters;
  frontage: number;
  greenLocked: boolean;
  green: Rect;
  greenDirty: boolean;
  greenDisabled: boolean;
  greenError: string | null;
  onGreenChange: (green: Rect) => void;
  onGreenApply: () => void;
  onGreenCancel: () => void;
  onGreenLock: () => void;
  onLock: (key: 'siteLocked' | 'priceLocked') => void;
  onChange: (planning: PlanningParameters, frontage: number) => void;
  dirty: boolean;
  error: string | null;
  onApply: () => void;
  onCancel: () => void;
  disabled: boolean;
  preview: boolean;
  legacy: boolean;
  height: number;
  family: 'spine' | 'loop';
  ceiling: string;
}
export default function DynamicInspector(p: Props) {
  const templateRef = useRef<SVGSVGElement>(null);
  const moving = useRef(false);
  const change = (key: 'lotDepth' | 'greenBuffer' | 'homeWidth' | 'homeDepth', value: number) => p.onChange({ ...p.planning, [key]: value }, p.frontage);
  const slider = (label: string, value: number, min: number, max: number, step: number, onChange: (value: number) => void) => <label className="parameter">
    <span>{label}<output>{value.toFixed(step < 1 ? 1 : 0)} m</output></span>
    <input type="range" aria-label={label} min={min} max={max} step={step} value={value} disabled={p.disabled||((label==='Lot frontage'||label==='Lot depth')&&p.planning.lotPlan!==undefined)} onChange={(e) => onChange(Number(e.target.value))} />
    <span className="range-limits"><small>{min} m</small><small>{max} m</small></span>
  </label>;
  return <section className="dynamic-inspector" aria-label="Spatial inspector">
    <header><h2><InspectIcon size={16} />Spatial inspector</h2><span className="modebadge">{p.preview ? 'Option preview' : p.dirty || p.greenDirty ? 'Live draft' : p.legacy ? 'Legacy plan' : 'Working plan'}</span></header>
    <div className="selection-heading"><label className="object-picker"><span className="object-swatch" /><select aria-label="Inspect object" value={p.selection ?? 'site'} onChange={(e) => p.onSelect(e.target.value as Selection)}>
      <option value="site">Site boundary</option><option value="grove">{p.planning.openSpaces!==undefined?p.label==='Site boundary'?'Open spaces':p.selection==='grove'?p.label:'Open spaces':'Open space A'}</option><option value="circulation">Circulation</option><option value="homes">{p.selection === 'homes' ? p.label : 'All home lots'}</option>
    </select></label><span className="modebadge">{p.selection === 'grove' ? p.greenLocked ? 'Locked' : 'Editable' : p.selection === 'site' && p.planning.siteLocked ? 'Locked' : 'Measured'}</span></div>
    {p.preview && <p className="note">Reviewing an alternative. Apply or Cancel on the plan before editing.</p>}
    <dl className="metric-grid" aria-live="polite">
      <div><dt>Selected area</dt><dd data-testid="inspector-area">{p.area === null ? 'Unavailable' : `${p.area.toLocaleString('en-US', { maximumFractionDigits: 1 })} m²`}</dd></div>
      <div><dt>Site share</dt><dd>{p.area === null ? '—' : p.siteArea > 0 ? `${(p.area / p.siteArea * 100).toFixed(2)}%` : '—'}</dd></div>
      <div><dt>Modeled homes</dt><dd>{p.homes ?? '—'}</dd></div>
      <div><dt>{p.builtArea!==undefined?"Home built area":"Built area / home"}</dt><dd>{(p.builtArea??homeArea(p.planning)).toFixed(1)} m²</dd></div>
    </dl>
    {p.selectionNotice&&<p className="selection-assumption" role="status">{p.selectionNotice}</p>}
    {p.siteControls}{p.openSpaceControls}
    {p.lotControls}
    {p.housingControls}
    {p.legacy && <div className="parameter-draft"><p>This saved plan keeps its original generator. Enable live planning to preview park-aware Spine routing and shared templates before applying.</p><button type="button" disabled={p.disabled} onClick={() => p.onChange(p.planning, p.frontage)}>Enable live planning</button></div>}
    <section className="parameter-section"><h3>Geometric parameters <span>Live preview</span></h3>
      {p.selection === 'grove' && p.planning.openSpaces===undefined && <div className="park-parameters">
      {(['w', 'h'] as const).map((key) => <label className="parameter" key={key}><span>{key === 'w' ? 'Park width' : 'Park depth'}<output>{p.green[key]} m</output></span><input type="range" aria-label={key === 'w' ? 'Park width' : 'Park depth'} min={4} max={120} value={p.green[key]} disabled={p.greenDisabled} onChange={(e) => p.onGreenChange({ ...p.green, [key]: Number(e.target.value) })} /></label>)}
      {p.greenDirty && <div className="parameter-draft"><p role="status">{p.greenError ?? 'Park preview updates streets, lots and costs.'}</p><div className="draftrow"><button type="button" disabled={!!p.greenError} onClick={p.onGreenApply}>Apply park</button><button type="button" onClick={p.onGreenCancel}>Cancel park</button></div></div>}
      </div>}
      {p.selection !== 'grove' && <>
      {slider('Lot frontage', p.frontage, 8, 16, 1, (v) => p.onChange(p.planning, v))}
      {slider('Lot depth', p.planning.lotDepth, 12, 40, 1, (v) => change('lotDepth', v))}
      </>}
      {slider(p.planning.openSpaces!==undefined?'Open-space clearance':'Park clearance', p.planning.greenBuffer, 0, 4.5, 0.5, (v) => change('greenBuffer', v))}
      {p.selection === 'grove' && <details className="subdivision-parameters"><summary>Subdivision parameters</summary>
      {slider('Lot frontage', p.frontage, 8, 16, 1, (v) => p.onChange(p.planning, v))}
      {slider('Lot depth', p.planning.lotDepth, 12, 40, 1, (v) => change('lotDepth', v))}
      </details>}
      {!p.planning.housing&&<details className="template-editor"><summary>Housing template · {homeArea(p.planning).toFixed(0)} m² / home</summary>
        <p className="note">One floor, one home per occupied lot. Drag the corner or use the controls. Homes rotate to fit. Every placed home and construction cost follows this template. Removed homes leave vacant lots.</p>
        <svg ref={templateRef} viewBox="0 0 220 210" aria-label="Housing footprint template" onPointerMove={(e) => {
          if (!moving.current || !templateRef.current) return;
          const point = new DOMPoint(e.clientX, e.clientY).matrixTransform(templateRef.current.getScreenCTM()!.inverse());
          p.onChange({ ...p.planning, homeWidth: Math.min(16, Math.max(4, Math.round((point.x - 20) / 10 * 2) / 2)), homeDepth: Math.min(16, Math.max(4, Math.round((190 - point.y) / 10 * 2) / 2)) }, p.frontage);
        }} onPointerUp={() => { moving.current = false; }} onPointerCancel={() => { moving.current = false; }}>
          <rect x="10" y="10" width="200" height="190" className="template-ground" />
          <rect x="20" y={190 - p.planning.homeDepth * 10} width={p.planning.homeWidth * 10} height={p.planning.homeDepth * 10} className="template-house" />
          <text x="28" y={190 - p.planning.homeDepth * 5}>Housing · {homeArea(p.planning).toFixed(0)} m²</text>
          <circle cx={20 + p.planning.homeWidth * 10} cy={190 - p.planning.homeDepth * 10} r="10" className="template-handle" aria-label="Resize housing template" role="slider" tabIndex={p.disabled ? -1 : 0} aria-valuemin={4} aria-valuemax={16} aria-valuenow={p.planning.homeWidth} aria-valuetext={`${p.planning.homeWidth} by ${p.planning.homeDepth} metres`} onPointerDown={(e) => { if (p.disabled) return; e.preventDefault(); moving.current = true; e.currentTarget.setPointerCapture(e.pointerId); }} onKeyDown={(e) => {
            if (p.disabled || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
            e.preventDefault();
            const horizontal = e.key === 'ArrowLeft' || e.key === 'ArrowRight';
            const key = horizontal ? 'homeWidth' : 'homeDepth';
            change(key, Math.max(4, Math.min(16, p.planning[key] + (e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? -0.5 : 0.5))));
          }} />
        </svg>
        {slider('Home width', p.planning.homeWidth, 4, 16, 0.5, (v) => change('homeWidth', v))}
        {slider('Home depth', p.planning.homeDepth, 4, 16, 0.5, (v) => change('homeDepth', v))}
      </details>}
      {p.selection === 'circulation' && <div className="street-controls"><h3>Street network</h3><p className="note">{p.planning.streetNetwork ? 'Manual street geometry is held during layout search.' : 'Generated routing. Edit streets to draw branches, move junctions and change widths.'}</p><button type="button" disabled={p.disabled||p.dirty} onClick={p.onEditStreets}>Edit street network</button>{p.planning.streetNetwork && <button type="button" disabled={p.disabled||p.dirty} onClick={p.onGeneratedStreets}>Preview generated routing instead</button>}{!p.planning.streetNetwork && <><h3>Cross streets</h3>
        {p.planning.streets.map((y, i) => <div key={i}>{slider(`Street ${i + 1} position`, y, 3, Math.max(3, p.height - 3), 1, (v) => p.onChange({ ...p.planning, streets: p.planning.streets.map((s, j) => i === j ? v : s) }, p.frontage))}<button type="button" disabled={p.disabled} onClick={() => p.onChange({ ...p.planning, streets: p.planning.streets.filter((_, j) => i !== j) }, p.frontage)}>Remove street {i + 1}</button></div>)}
        <button type="button" disabled={p.disabled || p.family !== 'spine' || p.planning.streets.length >= 2} onClick={() => p.onChange({ ...p.planning, streets: [...p.planning.streets, Math.max(3, Math.min(p.height - 3, p.planning.streets.length ? p.height * 0.75 : p.height * 0.25))] }, p.frontage)}>Add cross street</button>
        <p className="note">Spine routes connected orthogonal streets around the park. Loop uses its fixed ring. Road turning and traffic capacity are unmodeled.</p></>}
      </div>}
      {p.dirty && <div className="parameter-draft"><p role="status">{p.error ?? 'Preview updates geometry and costs. Apply keeps this change as one undo step.'}</p><div className="draftrow"><button type="button" disabled={!!p.error || p.disabled} onClick={p.onApply}>Apply parameters</button><button type="button" onClick={p.onCancel}>Cancel parameters</button></div></div>}
    </section>
    <section className="invariant-section"><h3>Planning commitments</h3>
      <label><input type="checkbox" aria-label="Site boundary" checked={p.planning.siteLocked} disabled={p.disabled || p.dirty} onChange={() => p.onLock('siteLocked')} />Fix site boundary <LockIcon size={14} /><span>{p.planning.siteLocked ? 'Locked' : 'Editable'}</span></label>
      {p.planning.openSpaces===undefined&&<label><input type="checkbox" aria-label="Open space A" checked={p.greenLocked} disabled={p.disabled || p.dirty} onChange={p.onGreenLock} />Fix Open space A shape + location <LockIcon size={14} /><span>{p.greenLocked ? 'Locked' : 'Editable'}</span></label>}
      <label><input type="checkbox" aria-label="Maintain minimum open space" checked={(p.planning.minGreenArea ?? 0) > 0} disabled={p.disabled || p.dirty || p.planning.openSpaces?.length===0} onChange={() => p.onChange({ ...p.planning, minGreenArea: p.planning.minGreenArea ? 0 : (p.planning.openSpaces?.reduce((sum,s)=>sum+polyArea(s.pts),0)??p.green.w*p.green.h) }, p.frontage)} />Maintain minimum open space</label>
      {(p.planning.minGreenArea ?? 0) > 0 && <label className="minimum-green">Minimum area (m²)<input type="number" aria-label="Minimum open space area" min={1} max={250000} value={p.planning.minGreenArea} disabled={p.disabled} onChange={event => { const value = Number(event.target.value); if (Number.isFinite(value) && value > 0) p.onChange({ ...p.planning, minGreenArea: value }, p.frontage); }} /></label>}
      <label><input type="checkbox" checked={p.planning.priceLocked} disabled={p.disabled || p.dirty} onChange={() => p.onLock('priceLocked')} />Price ceiling ≤ Rp{p.ceiling}m <LockIcon size={14} /><span>{p.planning.priceLocked ? 'Held' : 'Off'}</span></label>
      <details className="constraint-help"><summary>How locks work</summary><p className="note">Fixing a space preserves its exact shape and location; a minimum area alone permits direct moves or reshapes above that area. Search holds every open-space outline and the boundary in every option, even when direct edits are unlocked. Use Edit open spaces for individual commitments. The price ceiling is a hard maximum when held, not a target selling price. The actual selling-price assumption stays unchanged during search. Routing clearance reserves unallocated land around the conservative open-space extents; whole lots and home setbacks must fit.</p></details>
    </section>
  </section>;
}
