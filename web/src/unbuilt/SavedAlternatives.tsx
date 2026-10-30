import { useEffect, useMemo, useRef, useState } from 'react';
import { assessAlternative, stateKey } from '../../../src/alternatives';
import { alternativeNameError, MAX_ALTERNATIVES, type PersistedState, type SavedAlternative } from '../../../src/persist';
import { newProjectId } from '../../../src/projects';
import { DEFAULT_COSTS } from '../../../src/costs';
import { siteArea, siteBoundary } from '../../../src/boundary';
import PlanCanvas from './PlanCanvas';
import { indexLotsRecord } from './ui';

const noop = () => {};
interface Props {
  working: PersistedState;
  preview: { label: string; state: PersistedState } | null;
  items: SavedAlternative[];
  saveStatus: string;
  onChange: (items: SavedAlternative[], detail: string) => boolean;
  onReopen: (item: SavedAlternative) => void;
  onClose: () => void;
}
export default function SavedAlternatives(props: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const review = useRef<HTMLDivElement>(null);
  const [a, setA] = useState('working');
  const [b, setB] = useState(props.preview ? 'preview' : props.items[0]?.id ?? '');
  const [source, setSource] = useState(props.preview ? 'preview' : 'working');
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [editing, setEditing] = useState<{ id: string; name: string; note: string } | null>(null);
  const [reopening, setReopening] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [removed, setRemoved] = useState<SavedAlternative | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    const el = dialog.current!, opener = document.activeElement as HTMLElement | null;
    el.showModal();
    return () => { el.close(); if (opener?.isConnected) opener.focus(); };
  }, []);
  const close = () => {
    if (editing) { setError('Save or Cancel the scheme details before closing.'); return; }
    dialog.current?.close(); props.onClose();
  };
  const sources = [{ id: 'working', label: 'Working plan', state: props.working }, ...(props.preview ? [{ id: 'preview', label: props.preview.label, state: props.preview.state }] : []), ...props.items.map(s => ({ id: s.id, label: `Saved: ${s.name}`, state: s.state }))];
  const left = sources.find(s => s.id === a), right = sources.find(s => s.id === b);
  const leftResult = useMemo(() => {
    const state = a === 'working' ? props.working : a === 'preview' ? props.preview?.state : props.items.find(s => s.id === a)?.state;
    return state ? assessAlternative(state) : null;
  }, [a, props.working, props.preview, props.items]);
  const rightResult = useMemo(() => {
    const state = b === 'working' ? props.working : b === 'preview' ? props.preview?.state : props.items.find(s => s.id === b)?.state;
    return state ? assessAlternative(state) : null;
  }, [b, props.working, props.preview, props.items]);
  const selected = props.items.find(s => s.id === b) ?? props.items.find(s => s.id === a);
  const reopenItem = props.items.find(s => s.id === reopening);
  const reopenState=reopenItem?.state;
  const reopenResult = useMemo(() => reopenState ? assessAlternative(reopenState) : null, [reopenState]);
  const captured = source === 'preview' ? props.preview?.state : props.working;
  const captureResult = useMemo(() => captured ? assessAlternative(captured) : null, [captured]);
  const changed = (items: SavedAlternative[], detail: string) => {
    const saved = props.onChange(items, detail);
    setError(null); setNotice(saved ? detail : 'Scheme changes remain in memory. Browser saving failed; close this review and download a project backup before leaving.');
    return saved;
  };
  const saveNew = () => {
    const issue = alternativeNameError(name, props.items);
    if (issue) { setError(issue); return; }
    if (note.length > 4000) { setError('Keep notes within 4,000 characters.'); return; }
    if (!captured || captureResult?.errors.length || props.items.length >= MAX_ALTERNATIVES) { setError('Resolve the source scheme or remove a saved scheme before saving.'); return; }
    const now = new Date().toISOString();
    const item: SavedAlternative = { id: newProjectId(), name: name.trim(), note, createdAt: now, updatedAt: now, state: structuredClone(captured) };
    changed([...props.items, item], `Saved scheme “${item.name}” from ${source === 'preview' ? 'the unapplied preview' : 'the accepted working plan'}.`);
    setA('working'); setB(item.id); setName(''); setNote(''); setReopening(null);
  };
  const saveDetails = () => {
    if (!editing) return;
    const issue = alternativeNameError(editing.name, props.items, editing.id);
    if (issue) { setError(issue); return; }
    if (editing.note.length > 4000) { setError('Keep notes within 4,000 characters.'); return; }
    changed(props.items.map(s => s.id === editing.id ? { ...s, name: editing.name.trim(), note: editing.note, updatedAt: new Date().toISOString() } : s), `Updated name and notes for “${editing.name.trim()}”; its saved plan is unchanged.`);
    setEditing(null);
  };
  const money = (n: number) => `${n < 0 ? '−' : ''}Rp${Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  const rows = (result: ReturnType<typeof assessAlternative> | null) => {
    const q = result?.quantities, e = result?.economics;
    return [result ? siteArea(result.site) : null, q?.n, result?.builtArea, q?.roadArea, q?.greenArea, q?.parcelArea, q?.unallocatedArea, e?.costNonLand, e?.finance.revenue, e?.finance.surplus, e?.finance.landAllowance, e?.finance.ownerGap, e?.finance.requiredPrice];
  };
  const labels = ['Site area', 'Occupied homes', 'Built area', 'Street surface', 'Designed green', 'Lot area', 'Unallocated land', 'Non-land costs', 'Revenue', 'Surplus after owner payment', 'Land allowance', 'Owner shortfall (+) / headroom (−)', 'Required price per home'];
  const studyAssumptions=(state:PersistedState)=>{const d=state.baseSpec.development;return [
    d?.terrain?`${d.terrain.source} · ${d.terrain.basis} · ${d.terrain.date} · datum ${d.terrain.datum}`:'Not supplied',
    d?.terrain?`${d.terrain.points.length} grid levels; threshold ${d.terrain.slopeLimit}%; platform ${d.terrain.platform===null?'not entered':`${d.terrain.platform} m`}`:'Not supplied',
    d?.drainage?`${d.drainage.source}; ${d.drainage.returnYears}-year period; ${d.drainage.intensity} mm/h for ${d.drainage.durationMinutes} min; concentration ${d.drainage.tcMinutes} min`:'Not supplied',
    d?.drainage?`C roof ${d.drainage.coefficients.roof}, streets ${d.drainage.coefficients.roads}, green ${d.drainage.coefficients.green}, other ${d.drainage.coefficients.other}; site catchment ${d.drainage.siteCatchment?'declared':'unconfirmed'}; no storage ${d.drainage.noStorage?'declared':'unconfirmed'}`:'Not supplied',
    d?.drainage?.outfall?`${d.drainage.outfall.source}; (${d.drainage.outfall.x}, ${d.drainage.outfall.y}) m; capacity ${d.drainage.outfall.capacity} m³/s`:'Not supplied',
    d?.phasing?`${d.phasing.source}; starts ${d.phasing.startDate}; owner payment month ${d.phasing.landMonth}; ${Object.keys(d.phasing.assignments).length} lot references`:'Not supplied',
    d?.phasing?d.phasing.phases.map(p=>`${p.name}: build ${p.startMonth}–${p.startMonth+p.buildMonths-1}, sales ${p.saleMonth}, shared ${(p.sharedFraction*100).toLocaleString('en-US')}%`).join('; '):'Not supplied',
  ];};
  const lv = rows(leftResult), rv = rows(rightResult);
  const display = (v: number | null | undefined, i: number) => v == null ? '—' : i >= 7 ? money(v) : `${v.toLocaleString('en-US', { maximumFractionDigits: 1 })}${i !== 1 ? ' m²' : ''}`;
  const canvas = (id: string, label: string, state: PersistedState, result: ReturnType<typeof assessAlternative>) => <div key={id}>
    <h3>{label}</h3>
    {result.errors.length ? <p className="error">Drawing unavailable: {result.errors.join(' ')}</p> : <PlanCanvas
      contents={result.site.contents} planning={result.site.planning} layout={result.layout} boundary={siteBoundary(result.site)} siteW={result.site.w} siteH={result.site.h} entrance={result.site.entrance}
      siteContext={state.siteContext} showContext greenLocked={state.greenLocked} greenSelected={false} siteSelected={false} editing={false} entranceEditing={false} entranceValid
      draftActive={false} draftValid workingKeys={null} vsNote={null} backdrop={null} cancelTick={0} selectedKind={null}
      onSelectSite={noop} onSelectGreen={noop} onSelectEntrance={noop} onEntranceDrag={noop} onEntranceCommit={noop} onEntranceCancel={noop}
      onSelectLot={noop} lotEdits={indexLotsRecord(result.edits)} selectedLot={null} lotDraft={null} lotDraftValid onLotVertexDrag={noop} onLotVertexRevert={noop} onLotVertexAdd={noop} onLotVertexRemove={noop}
      onFixedHint={noop} onSelectKind={noop} onDeselect={noop} onDraftChange={noop} onDraftCommit={noop} onEscapeIdle={noop} wide={false} onToggleWide={noop} fitTick={0} fitMode="width" />}
    {result.warnings.map(w => <p className="note" key={w}>{w}</p>)}
  </div>;
  const currentKey=stateKey(props.working);
  const matches=props.items.filter(s=>stateKey(s.state)===currentKey).map(s=>s.name).join(', ');
  const costRows = [
    ['Construction · Rp/m² built', 'constructionPerM2'], ['Streets · Rp/m² surface', 'roadPerM2'], ['Green · Rp/m² outline', 'greenWorksPerM2'],
    ['Setup · Rp', 'setupAllowance'], ['Other physical works · Rp', 'otherWorksAllowance'], ['Professional · Rp', 'professionalAllowance'],
    ['Contingency · % physical costs', 'contingencyFraction'], ['Selling · % revenue', 'sellFraction'],
  ] as const;
  return <dialog ref={dialog} className="feasibility-dialog saved-alternatives-dialog" aria-labelledby="saved-alternatives-title" onCancel={e => { e.preventDefault(); close(); }}>
    <header><div><h2 id="saved-alternatives-title">Saved alternatives</h2><p>Name, compare and reopen schemes within this project.</p></div><button type="button" onClick={close}>Close saved alternatives</button></header>
    <div className="feasibility-body">
      <section className="experiment-inputs" aria-label="Scheme library">
        <h3>Keep a scheme · {props.items.length}/{MAX_ALTERNATIVES}</h3><p>Save an independent copy. Future working edits leave saved schemes unchanged.</p>
        <fieldset disabled={!!editing || !!reopening}><legend>Save as a new scheme</legend>
          <label>Scheme source<select aria-label="Scheme source" value={source} onChange={e => setSource(e.target.value)}><option value="working">Accepted working plan</option>{props.preview && <option value="preview">{props.preview.label} · unapplied</option>}</select></label>
          <label>New scheme name<input value={name} maxLength={100} onChange={e => { setName(e.target.value); setError(null); }}/></label>
          <label>Why keep this scheme?<textarea aria-label="Why keep this scheme?" value={note} maxLength={4000} rows={3} onChange={e => setNote(e.target.value)}/></label>
          <button type="button" onClick={saveNew} disabled={props.items.length >= MAX_ALTERNATIVES || !captureResult || captureResult.errors.length > 0}>Save new scheme</button>
        </fieldset>
        {props.items.length >= MAX_ALTERNATIVES && <p className="note">This project holds 20 schemes. Download a backup before removing one to make room.</p>}
        {!!captureResult?.errors.length && <p className="error">Source cannot be saved: {captureResult.errors.join(' ')}</p>}
        {!props.items.length && <p className="note">No saved schemes yet. Save the working plan or an unapplied search preview to start.</p>}
        {selected && <section className="saved-scheme-details"><h3>{selected.name}</h3><p className="note">Saved {new Date(selected.createdAt).toLocaleString()}. Details updated {new Date(selected.updatedAt).toLocaleString()}.</p>
          {editing ? <fieldset><legend>Edit scheme details</legend><label>Saved scheme name<input maxLength={100} value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })}/></label><label>Scheme notes<textarea aria-label="Scheme notes" maxLength={4000} rows={5} value={editing.note} onChange={e => setEditing({ ...editing, note: e.target.value })}/></label><button type="button" onClick={saveDetails}>Save scheme details</button><button type="button" onClick={() => { setEditing(null); setError(null); }}>Cancel scheme details</button></fieldset> : <>
            <p className="saved-scheme-note">{selected.note || 'No notes yet.'}</p>
            <div className="scheme-actions"><button type="button" disabled={!!reopening} onClick={() => { setEditing({ id: selected.id, name: selected.name, note: selected.note }); setRemoving(null); }}>Edit name and notes</button><button type="button" onClick={() => { setA('working'); setB(selected.id); setReopening(selected.id); setRemoving(null); requestAnimationFrame(() => review.current?.scrollIntoView({ block: 'start' })); }}>Review reopening</button><button type="button" disabled={!!reopening} onClick={() => setRemoving(selected.id)}>Remove saved scheme</button></div>
          </>}
          {removing === selected.id && <div className="scheme-remove"><p>Remove “{selected.name}” from the saved collection? The working plan stays unchanged. Download a project backup to keep this copy.</p><button type="button" onClick={() => { changed(props.items.filter(s => s.id !== selected.id), `Removed saved scheme “${selected.name}”.`); setRemoved(selected); if(a===selected.id)setA('working'); setB(''); setRemoving(null); }}>Confirm remove scheme</button><button type="button" onClick={() => setRemoving(null)}>Keep saved scheme</button></div>}
        </section>}
        {removed && <button type="button" onClick={() => { const issue = alternativeNameError(removed.name, props.items); if (issue || props.items.length >= MAX_ALTERNATIVES) { setError(issue ?? 'Remove another scheme before restoring this one.'); return; } changed([...props.items, removed], `Restored saved scheme “${removed.name}”.`); setB(removed.id); setRemoved(null); }}>Undo scheme removal</button>}
        {error && <p role="alert" className="error">{error}</p>}{notice && <p role="status">{notice}</p>}
        <p className="note">{props.saveStatus}</p><p className="note">Saved plans, costs, site context and notes are browser-local and included in project downloads. Original photos and survey media, active drafts and session history are not captured.</p>
      </section>
      <section className="experiment-results" aria-label="Saved scheme comparison">
        <fieldset className="scheme-compare-controls" disabled={!!editing || !!reopening}><legend>Compare schemes</legend><label>Scheme A<select aria-label="Scheme A" value={a} onChange={e => { setA(e.target.value); setRemoving(null); }}>{sources.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select></label><label>Scheme B<select aria-label="Scheme B" value={b} onChange={e => { setB(e.target.value); setRemoving(null); }}><option value="">Choose a scheme…</option>{sources.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select></label></fieldset>
        {reopenItem && <div className="scheme-reopen-review" ref={review}><h3>Reopen “{reopenItem.name}”?</h3><p>Replace the working plan with this saved scheme’s geometry, assumptions and site context. The previous working plan stays available through Undo. Saved schemes and their notes stay unchanged. Search previews end; original reference photos are hidden and survey media may need reattachment.</p><button type="button" onClick={() => setReopening(null)}>Cancel reopening</button>{!!reopenResult?.errors.length && <p className="error">Reopening blocked: {reopenResult.errors.join(' ')}</p>}</div>}
        {a === b && b ? <p className="note">Choose two different schemes for a comparison.</p> : <>
          <div className="compare-grid">{left && leftResult && canvas(a, left.label, left.state, leftResult)}{right && rightResult && canvas(b, right.label, right.state, rightResult)}</div>
          {left && right && <>
            <p className="note">Each side uses its own saved prices, owner benchmark, target and costs. Differences combine all changed inputs; they are not isolated design savings. Drawings fit independently: compare dimensions and measured areas when boundaries differ.</p>
            <div className="experiment-table"><table><caption>Scheme A → Scheme B · measured comparison</caption><thead><tr><th scope="col">Measure</th><th scope="col">{left.label}</th><th scope="col">{right.label}</th><th scope="col">B − A</th></tr></thead><tbody>{labels.map((label, i) => <tr key={label}><th scope="row">{label}</th><td>{display(lv[i], i)}</td><td>{display(rv[i], i)}</td><td>{lv[i] == null || rv[i] == null ? '—' : `${rv[i]! - lv[i]! > 0 ? '+' : ''}${display(rv[i]! - lv[i]!, i)}`}</td></tr>)}</tbody></table></div>
            {(left.state.baseSpec.development||right.state.baseSpec.development)&&<div className="experiment-table"><table><caption>Development screening · each scheme’s own inputs</caption><thead><tr><th>Measure</th><th>{left.label}</th><th>{right.label}</th></tr></thead><tbody>{[
              ['Terrain mean slope (%)',leftResult?.development.terrain.value?.meanSlope,rightResult?.development.terrain.value?.meanSlope],
              ['Gross cut (m³)',leftResult?.development.terrain.value?.cut,rightResult?.development.terrain.value?.cut],
              ['Gross fill (m³)',leftResult?.development.terrain.value?.fill,rightResult?.development.terrain.value?.fill],
              ['Rational peak (m³/s)',leftResult?.development.drainage.value?.peak,rightResult?.development.drainage.value?.peak],
              ['Maximum month-end deficit (Rp)',leftResult?.development.phasing.value?.monthEndDeficit,rightResult?.development.phasing.value?.monthEndDeficit],
              ['Closing phase cash (Rp)',leftResult?.development.phasing.value?.closing,rightResult?.development.phasing.value?.closing],
            ].map(([label,a,b])=><tr key={String(label)}><th scope="row">{label}</th><td>{a==null?'Unavailable':Number(a).toLocaleString('en-US',{maximumFractionDigits:3})}</td><td>{b==null?'Unavailable':Number(b).toLocaleString('en-US',{maximumFractionDigits:3})}</td></tr>)}</tbody></table><p className="note">{[leftResult,rightResult].map((r,i)=><span key={i}>{i?'B':'A'}: {Object.entries(r?.development??{}).filter(([,v])=>!v.value).map(([key,v])=>`${key}: ${v.error}`).join('; ')} </span>)}Geometry and base-cost differences also affect these results. Terrain/drainage budgets are not added automatically.</p></div>}
            {(left.state.baseSpec.development||right.state.baseSpec.development)&&<details className="scheme-assumptions"><summary>Compare development sources and assumptions</summary><table><thead><tr><th>Input</th><th>{left.label}</th><th>{right.label}</th></tr></thead><tbody>{['Terrain provenance','Terrain inputs','Storm sources and timing','Runoff inputs and applicability','Declared outfall','Phase source and land payment','Delivery schedule'].map((label,i)=><tr key={label}><th scope="row">{label}</th><td>{studyAssumptions(left.state)[i]}</td><td>{studyAssumptions(right.state)[i]}</td></tr>)}</tbody></table></details>}
            <details className="scheme-assumptions"><summary>Compare saved assumptions and costs</summary><table><thead><tr><th scope="col">Assumption</th><th scope="col">{left.label}</th><th scope="col">{right.label}</th></tr></thead><tbody>{(['priceS','ceilingS','ownerS','targetS'] as const).map((k,i) => <tr key={k}><th scope="row">{['Selling price · Rp m/home','Buyer ceiling · Rp m/home','Owner benchmark · Rp bn','Target surplus · % revenue'][i]}</th><td>{left.state[k] || 'Incomplete'}</td><td>{right.state[k] || 'Incomplete'}</td></tr>)}{costRows.map(([label,k]) => <tr key={k}><th scope="row">{label}</th>{[left,right].map(s => <td key={s.id}>{((s.state.baseSpec.costAssumptions ?? DEFAULT_COSTS)[k] * (k.endsWith('Fraction') ? 100 : 1)).toLocaleString('en-US', { maximumFractionDigits: 6 })}</td>)}</tr>)}</tbody></table></details>
          </>}
        </>}
      </section>
    </div>
    <footer><p>{matches ? `Working plan matches: ${matches}` : 'Working edits do not change saved schemes.'}</p><button type="button" onClick={close}>Back to working plan</button>{reopenItem && <button type="button" className="primary" disabled={!!editing || !reopenResult || reopenResult.errors.length > 0} onClick={() => { dialog.current?.close(); props.onReopen(reopenItem); }}>Reopen saved scheme</button>}</footer>
  </dialog>;
}
