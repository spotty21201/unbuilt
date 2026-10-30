import { useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_COSTS, type CostAssumptions } from '../../../src/costs';
import { evaluateLayout } from '../../../src/economics';
import { designHeldReason, evaluateExperiment, type ExperimentDesign } from '../../../src/experiments';
import { editsForLayout, generateLoop, generateSpine, type Site, type StableEdits } from '../../../src/geometry';
import { DEFAULT_PLANNING } from '../../../src/planning';
import { siteBoundary } from '../../../src/boundary';
import { failingLots } from '../../../src/search';
import type { ProductProfile } from '../../../src/schema';
import PlanCanvas from './PlanCanvas';
import { formatRp, indexLotsRecord, type WorkingSpec } from './ui';

const fields: { key: keyof CostAssumptions; label: string; scale: number }[] = [
  { key: 'constructionPerM2', label: 'Home construction (Rp/m² built)', scale: 1 },
  { key: 'roadPerM2', label: 'Street works (Rp/m² surface)', scale: 1 },
  { key: 'greenWorksPerM2', label: 'Green works (Rp/m² outline)', scale: 1 },
  { key: 'setupAllowance', label: 'Setup allowance (Rp m)', scale: 1e6 },
  { key: 'otherWorksAllowance', label: 'Other physical works (Rp m)', scale: 1e6 },
  { key: 'professionalAllowance', label: 'Professional allowance (Rp m)', scale: 1e6 },
  { key: 'contingencyFraction', label: 'Contingency (% physical costs)', scale: .01 },
  { key: 'sellFraction', label: 'Selling costs (% revenue)', scale: .01 },
];
const costFields = (costs: CostAssumptions) => Object.fromEntries(fields.map(f => [f.key, String(costs[f.key] / f.scale)])) as Record<keyof CostAssumptions, string>;
const number = (s: string) => s.trim() === '' ? NaN : Number(s);
const noop = () => {};
interface Props {
  site: Site; spec: WorkingSpec; lots: StableEdits; price: number; owner: number; target: number;
  ceiling: number; profile: ProductProfile; greenLocked: boolean;
  onApply: (site: Site, spec: WorkingSpec, detail: string) => void; onCancel: () => void;
}
export default function FeasibilityExperiments(props: Props) {
  const { site, spec, lots, price, owner, target } = props;
  const dialog = useRef<HTMLDialogElement>(null);
  const acceptedCosts = site.costAssumptions ?? DEFAULT_COSTS;
  const initialDesign = { ...spec, lotDepth: site.planning?.lotDepth ?? DEFAULT_PLANNING.lotDepth };
  const [family, setFamily] = useState(spec.family);
  const [frontage, setFrontage] = useState(String(spec.frontage));
  const [depth, setDepth] = useState(String(initialDesign.lotDepth));
  const [values, setValues] = useState(() => costFields(acceptedCosts));
  const [fit, setFit] = useState(0);
  useEffect(() => { const el = dialog.current!; el.showModal(); return () => el.close(); }, []);
  const cancelTrial = () => { dialog.current?.close(); props.onCancel(); };
  const baseline = useMemo(() => {
    const layout = spec.family === 'loop' ? generateLoop(site, spec.frontage) : generateSpine(site, spec.frontage);
    const edits = editsForLayout(layout.parcels, lots);
    return { layout, edits, economics: evaluateLayout(site, layout, price, { ownerExpectation: owner, targetFraction: target }, edits) };
  }, [site, spec, lots, price, owner, target]);
  const acceptedValues = costFields(acceptedCosts);
  const costs = Object.fromEntries(fields.map(f => [f.key, values[f.key] === acceptedValues[f.key] ? acceptedCosts[f.key] : number(values[f.key]) * f.scale])) as CostAssumptions;
  const design: ExperimentDesign = { family, frontage: number(frontage), lotDepth: number(depth) };
  const trial = evaluateExperiment(site, spec, lots, design, costs, price, owner, target);
  const before = baseline.economics, after = trial.economics;
  const held = designHeldReason(site, lots);
  const dirty = trial.changed || fields.some(f => costs[f.key] !== acceptedCosts[f.key]);
  const reset = () => { setFamily(spec.family); setFrontage(String(spec.frontage)); setDepth(String(initialDesign.lotDepth)); setValues(costFields(acceptedCosts)); };
  const rows: [string, number, number | null, 'money' | 'area' | 'count'][] = [
    ['Occupied homes', before.quantities.n, after?.quantities.n ?? null, 'count'],
    ['Built area', before.builtArea, after?.builtArea ?? null, 'area'],
    ['Street surface', before.quantities.roadArea, after?.quantities.roadArea ?? null, 'area'],
    ['Designed green', before.quantities.greenArea, after?.quantities.greenArea ?? null, 'area'],
    ['Lot area', before.quantities.parcelArea, after?.quantities.parcelArea ?? null, 'area'],
    ['Unallocated land', before.quantities.unallocatedArea, after?.quantities.unallocatedArea ?? null, 'area'],
    ['Home construction', before.homeCost, after?.homeCost ?? null, 'money'],
    ['Street works', before.roadCost, after?.roadCost ?? null, 'money'],
    ['Green works', before.greenCost, after?.greenCost ?? null, 'money'],
    ['Setup allowance', acceptedCosts.setupAllowance, after ? costs.setupAllowance : null, 'money'],
    ['Other physical works', acceptedCosts.otherWorksAllowance, after ? costs.otherWorksAllowance : null, 'money'],
    ['Contingency', (before.homeCost+before.roadCost+before.greenCost+acceptedCosts.setupAllowance+acceptedCosts.otherWorksAllowance)*acceptedCosts.contingencyFraction, after ? (after.homeCost+after.roadCost+after.greenCost+costs.setupAllowance+costs.otherWorksAllowance)*costs.contingencyFraction : null, 'money'],
    ['Professional allowance', acceptedCosts.professionalAllowance, after ? costs.professionalAllowance : null, 'money'],
    ['Non-land costs', before.costNonLand, after?.costNonLand ?? null, 'money'],
    ['Revenue', before.finance.revenue, after?.finance.revenue ?? null, 'money'],
    ['Selling costs', before.finance.revenue * acceptedCosts.sellFraction, after ? after.finance.revenue * costs.sellFraction : null, 'money'],
    ['Surplus after owner payment', before.finance.surplus, after?.finance.surplus ?? null, 'money'],
    ['Land allowance', before.finance.landAllowance, after?.finance.landAllowance ?? null, 'money'],
    ['Owner shortfall (+) / headroom (−)', before.finance.ownerGap, after?.finance.ownerGap ?? null, 'money'],
  ];
  const display = (v: number, kind: string) => kind === 'money' ? `${v < 0 ? '−' : ''}Rp${Math.abs(v).toLocaleString('en-US', { maximumFractionDigits: 2 })}` : `${v.toLocaleString('en-US', { maximumFractionDigits: 1 })}${kind === 'area' ? ' m²' : ''}`;
  const outside = failingLots(trial.layout.parcels, props.profile, { lotEdits: trial.edits, roads: trial.layout.roads }).length;
  const preview = (label: string, activeSite: Site, layout: typeof trial.layout, edits: typeof trial.edits) => <div><h3>{label}</h3><PlanCanvas
    contents={activeSite.contents} planning={activeSite.planning} layout={layout} boundary={siteBoundary(activeSite)} siteW={site.w} siteH={site.h} entrance={site.entrance}
    greenLocked={props.greenLocked} greenSelected={false} siteSelected={false} editing={false} entranceEditing={false} entranceValid
    draftActive={false} draftValid workingKeys={null} vsNote={null} backdrop={null} cancelTick={0}
    selectedKind={null} onSelectSite={noop} onSelectGreen={noop} onSelectEntrance={noop} onEntranceDrag={noop} onEntranceCommit={noop} onEntranceCancel={noop}
    onSelectLot={noop} lotEdits={indexLotsRecord(edits)} selectedLot={null} lotDraft={null} lotDraftValid onLotVertexDrag={noop} onLotVertexRevert={noop} onLotVertexAdd={noop} onLotVertexRemove={noop}
    onFixedHint={noop} onSelectKind={noop} onDeselect={noop} onDraftChange={noop} onDraftCommit={noop} onEscapeIdle={noop}
    wide={false} onToggleWide={noop} fitTick={fit} fitMode="width" /></div>;
  const detail = `Feasibility experiment: ${spec.family}/${spec.frontage} m/${initialDesign.lotDepth} m → ${family}/${frontage} m/${depth} m; ${fields.filter(f => costs[f.key] !== acceptedCosts[f.key]).map(f => `${f.label}: ${acceptedCosts[f.key] / f.scale} → ${values[f.key]}`).join('; ') || 'costs held'}. Homes ${before.quantities.n} → ${after?.quantities.n}; non-land costs ${formatRp(before.costNonLand)} → ${after ? formatRp(after.costNonLand) : 'unavailable'}; land allowance ${formatRp(before.finance.landAllowance)} → ${after ? formatRp(after.finance.landAllowance) : 'unavailable'}. Shared selling price held; market assumptions provisional.`;
  return <dialog className="feasibility-dialog" ref={dialog} aria-labelledby="feasibility-title" onCancel={e => { e.preventDefault(); cancelTrial(); }}>
    <header><div><h2 id="feasibility-title">Feasibility experiments</h2><p>Test a change against the accepted plan. Only Apply saves the trial.</p></div><button type="button" onClick={cancelTrial}>Close experiment</button></header>
    <div className="feasibility-body">
      <section className="experiment-inputs" aria-label="Trial inputs">
        <h3>Design trial</h3><p>Boundary, entrance, green outlines, vacancies and home templates are held. Generated lots may change.</p>
        {held && <p className="note">{held}</p>}
        <fieldset disabled={!!held}><legend>Generated layout</legend><label>Trial circulation<select aria-label="Trial circulation" value={family} disabled={!!site.planning?.streetNetwork} onChange={e => setFamily(e.target.value as WorkingSpec['family'])}><option value="spine">Spine</option><option value="loop">Loop</option></select></label><label>Trial lot frontage (m)<input type="number" min="6" max="30" step="any" value={frontage} onChange={e => setFrontage(e.target.value)}/></label><label>Trial lot depth (m)<input type="number" min="12" max="40" step="any" value={depth} onChange={e => setDepth(e.target.value)}/></label></fieldset>
        {site.planning?.streetNetwork && <p className="note">Manual street routing and widths are held.</p>}
        <h3>Cost assumptions</h3><p>Illustrative inputs, not quotations. Rates apply to measured quantities; allowances are fixed project totals.</p>
        <div className="formgrid">{fields.map(f => <label key={f.key}>{f.label}<input type="number" step="any" min="0" value={values[f.key]} onChange={e => setValues(v => ({ ...v, [f.key]: e.target.value }))}/></label>)}</div>
        <p className="note">Contingency covers construction, streets, green works, setup and other physical works. Professional and selling costs are outside that base.</p>
        <p className="note">Held: Rp{(price / 1e6).toLocaleString('en-US')}m/home, owner {formatRp(owner)}, target {(target * 100).toFixed(1)}%, ceiling Rp{props.ceiling / 1e6}m/home. Change these in Assumptions after closing the trial.</p>
        <button type="button" onClick={reset}>Reset trial</button>{' '}<button type="button" onClick={() => setValues(costFields(DEFAULT_COSTS))}>Use illustrative costs</button>
      </section>
      <section className="experiment-results" aria-label="Experiment comparison">
        <div className="cardrow"><h3>Accepted → trial</h3><button type="button" onClick={() => setFit(v => v + 1)}>Fit both experiments</button></div>
        {trial.errors.length > 0 && <div role="alert" className="error"><p>Trial unavailable. Accepted plan retained.</p><ul>{trial.errors.map(e => <li key={e}>{e}</li>)}</ul></div>}
        <div className="compare-grid">{preview('Accepted plan', site, baseline.layout, baseline.edits)}{after ? preview('Trial · unapplied', trial.site, trial.layout, trial.edits) : <p>Correct the trial inputs to see its drawing and measured results.</p>}</div>
        <div className="experiment-table"><table><caption>Measured quantities and assumed finances</caption><thead><tr><th scope="col">Measure</th><th scope="col">Accepted</th><th scope="col">Trial</th><th scope="col">Change</th></tr></thead><tbody>{rows.map(([label, a, b, kind]) => <tr key={label}><th scope="row">{label}</th><td>{display(a, kind)}</td><td>{b === null ? '—' : display(b, kind)}</td><td>{b === null ? '—' : `${b - a > 0 ? '+' : ''}${display(b - a, kind)}`}</td></tr>)}</tbody></table></div>
        <p>Required price at the owner benchmark and target: {before.finance.requiredPrice === null ? 'Unavailable' : `${formatRp(before.finance.requiredPrice)}/home`} → {after?.finance.requiredPrice == null ? 'Unavailable' : `${formatRp(after.finance.requiredPrice)}/home`}. {after?.finance.requiredPrice != null && after.finance.requiredPrice > props.ceiling ? 'Trial required price exceeds the declared buyer ceiling.' : ''}</p>
        {after && trial.designEconomics && <p>Land allowance attribution: design change at accepted costs {display(trial.designEconomics.finance.landAllowance - before.finance.landAllowance, 'money')}; then cost changes on the trial design {display(after.finance.landAllowance - trial.designEconomics.finance.landAllowance, 'money')}.</p>}
        <p className="note">{outside > 0 ? `${outside} trial lots fall outside ${props.profile.name}. ` : ''}The shared selling price is held as an assumption even when design changes. Lower costs do not prove saleability or market value. No optimum or verified feasibility is claimed. Trials are session-only; Apply records the accepted inputs and an event, with plan Undo/Redo.</p>
      </section>
    </div>
    <footer><p aria-live="polite">{after ? `${before.quantities.n} → ${after.quantities.n} homes · land allowance ${formatRp(before.finance.landAllowance)} → ${formatRp(after.finance.landAllowance)}` : 'Trial invalid · accepted plan unchanged'}</p><button type="button" onClick={cancelTrial}>Cancel experiment</button><button type="button" className="primary" disabled={!after || !dirty} onClick={() => { if (after) { dialog.current?.close(); props.onApply(trial.site, { family, frontage: design.frontage }, detail); } }}>Apply experiment</button></footer>
  </dialog>;
}
