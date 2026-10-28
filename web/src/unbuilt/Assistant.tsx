// UNBUILT assistant panel (Designer-owned UI around Coder-owned tools).
// Answers the three assistant questions through validated deterministic
// paths only: local measured facts, server /api/explain with a local-engine
// fallback, and a labeled bounded hypothesis. The panel never invents
// layouts, prices, or outcomes; every number names its source.
import { useEffect, useRef, useState } from 'react';
import { answerTrue, answerTry, answerLimits, clarifyText, routeQuestion } from '../../../src/assistant';
import type { AnswerSection, PlanFacts, TryContext } from '../../../src/assistant';
import { snapshotHash } from '../../../src/snapshot';
import type { ScenarioSnapshot } from '../../../src/snapshot';
import { editsForLayout, generateLoop, generateSpine, validateLayout } from '../../../src/geometry';
import { evaluateLayout } from '../../../src/economics';
import { BASE_PROFILE, COMPACT_PROFILE, failingLots } from '../../../src/search';
import { formatGap, formatM2, formatRp, serverBase } from './ui';

type AssistantState = 'ready' | 'thinking' | 'clarifying' | 'hypothesizing' | 'reporting' | 'unavailable';

interface Props {
  facts: PlanFacts;
  tryCtx: TryContext;
  getSnapshot: () => ScenarioSnapshot;
  snapshotOk: boolean;
  workingSpec: { family: 'spine' | 'loop'; frontage: number };
  previewSpec: { family: 'spine' | 'loop'; frontage: number } | null;
  onSendRequest: (text: string) => void;
}

const STATE_LABEL: Record<AssistantState, string> = {
  ready: 'Ready',
  thinking: 'Thinking (running validated tools…)…',
  clarifying: 'Clarifying',
  hypothesizing: 'Hypothesizing (untested)',
  reporting: 'Reporting measured results',
  unavailable: 'Unavailable',
};

interface WhyResult {
  source: 'server' | 'local';
  baseLabel: string;
  otherLabel: string;
  baseN: number;
  otherN: number;
  baseRoad: number;
  otherRoad: number;
  baseAllow: number;
  otherAllow: number;
  baseGap: number;
  otherGap: number;
  dHomes: number | null;
  dRoad: number | null;
  dAllow: number | null;
  dGap: number | null;
  pricedAt: string;
  baseIssues: string[];
  otherIssues: string[];
}

// Local-engine fallback for "why": the same generators and economics the
// server runs, computed in the browser and labeled as such.
function explainLocal(snap: ScenarioSnapshot, base: Props['workingSpec'], other: Props['workingSpec']): WhyResult {
  const site = { ...snap.site, entrance: snap.entrance, green: snap.green };
  const profile = snap.profileId === 'starter-150' ? COMPACT_PROFILE : BASE_PROFILE;
  const side = (sp: Props['workingSpec']) => {
    const layout = sp.family === 'spine' ? generateSpine(site, sp.frontage) : generateLoop(site, sp.frontage);
    const carried = editsForLayout(layout.parcels, snap.lots);
    const econ = evaluateLayout(site, layout, snap.assumptions.price, {
      ownerExpectation: snap.assumptions.owner,
      targetFraction: snap.assumptions.target,
    }, carried);
    const failing = failingLots(layout.parcels, profile, { lotEdits: carried, roads: layout.roads });
    return {
      layout, econ,
      issues: [...validateLayout(site, layout, carried), ...(failing.length > 0 ? [`${failing.length} lot(s) outside the ${profile.name} profile`] : [])],
    };
  };
  const b = side(base);
  const o = side(other);
  const name = (sp: Props['workingSpec']) => `${sp.family === 'spine' ? 'Spine' : 'Loop'} · ${sp.frontage} m lots`;
  return {
    source: 'local',
    baseLabel: name(base),
    otherLabel: name(other),
    baseN: b.econ.quantities.n,
    otherN: o.econ.quantities.n,
    baseRoad: b.econ.quantities.roadArea,
    otherRoad: o.econ.quantities.roadArea,
    baseAllow: b.econ.finance.landAllowance,
    otherAllow: o.econ.finance.landAllowance,
    baseGap: b.econ.finance.ownerGap,
    otherGap: o.econ.finance.ownerGap,
    dHomes: o.econ.quantities.n - b.econ.quantities.n,
    dRoad: o.econ.quantities.roadArea - b.econ.quantities.roadArea,
    dAllow: o.econ.finance.landAllowance - b.econ.finance.landAllowance,
    dGap: o.econ.finance.ownerGap - b.econ.finance.ownerGap,
    pricedAt: `Both priced at Rp${snap.assumptions.price / 1_000_000}m/home against a Rp${snap.assumptions.owner / 1_000_000_000}bn owner benchmark.`,
    baseIssues: b.issues,
    otherIssues: o.issues,
  };
}

export default function Assistant(props: Props) {
  const [state, setState] = useState<AssistantState>('ready');
  const [question, setQuestion] = useState('');
  const [sections, setSections] = useState<AnswerSection[] | null>(null);
  const [why, setWhy] = useState<WhyResult | null>(null);
  const [whyNote, setWhyNote] = useState<string | null>(null);
  const [clientSummary, setClientSummary] = useState<string | null>(null);
  const [investigationText, setInvestigationText] = useState(props.tryCtx.requestText);
  const [unready, setUnready] = useState<string | null>(null);
  // The parent keys each instance by scenario/comparison version, so answers
  // disappear in the same render as an input change. Unmount cancels requests.
  const runId = useRef(0);
  const inflight = useRef<AbortController | null>(null);
  useEffect(() => () => {
    runId.current++;
    inflight.current?.abort();
  }, []);

  const cancelAnswer = () => { runId.current++; inflight.current?.abort(); };
  const showTrue = () => {
    cancelAnswer();
    setSections(answerTrue(props.facts));
    setWhy(null);
    setWhyNote(null);
    setUnready(null);
    setState('reporting');
  };

  const showTry = (text = props.tryCtx.requestText) => {
    cancelAnswer();
    setInvestigationText(text);
    setSections(answerTry({ ...props.tryCtx, requestText: text }));
    setWhy(null);
    setWhyNote(null);
    setUnready(null);
    setState('hypothesizing');
  };

  const showWhy = async () => {
    cancelAnswer(); setClientSummary(null);
    if (!props.previewSpec) {
      setSections(null);
      setWhy(null);
      setWhyNote(null);
      setUnready('No alternative is selected, so a measured comparison is not available. Choose “What could we try?” to prepare a search, then preview an option and ask why it changed.');
      setState('clarifying');
      return;
    }
    if (!props.snapshotOk) {
      setSections(null);
      setWhy(null);
      setWhyNote(null);
      setUnready('Economics inputs are incomplete — finish price, ceiling, owner, and target before measuring a change.');
      setState('unavailable');
      return;
    }
    setState('thinking');
    setUnready(null);
    const myRun = ++runId.current;
    const alive = () => runId.current === myRun;
    inflight.current?.abort();
    const snap = props.getSnapshot();
    const base = { ...props.workingSpec };
    const other = { ...props.previewSpec };
    try {
      const ctrl = new AbortController();
      inflight.current = ctrl;
      const timer = setTimeout(() => ctrl.abort(), 8000);
      let res: Response;
      try {
        res = await fetch(`${serverBase()}/api/explain`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ snapshot: snap, base, other }),
          signal: ctrl.signal,
        });
      } finally {
        clearTimeout(timer);
      }
      if (!alive()) return;
      if (res.status === 422) {
        setWhy(null); setSections(null); setWhyNote(null);
        setUnready('Layout unavailable for this boundary. Change circulation or correct the boundary before comparing economics.');
        setState('unavailable'); return;
      }
      if (!res.ok) throw new Error(`server ${res.status}`);
      const ex = await res.json();
      if (!alive()) return;
      if (ex.planHash !== snapshotHash(snap)) {
        setSections(null);
        setWhy(null);
        setWhyNote(null);
        setUnready('The server answered for a different plan (hash mismatch) — its numbers are not shown. Reach the plan again or use the local engine.');
        setState('unavailable');
        return;
      }
      const name = (sp: { family: string; frontage: number }) => `${sp.family === 'spine' ? 'Spine' : 'Loop'} · ${sp.frontage} m lots`;
      setWhy({
        source: 'server',
        baseLabel: name(ex.base.spec),
        otherLabel: name(ex.other.spec),
        baseN: ex.base.quantities.n,
        otherN: ex.other.quantities.n,
        baseRoad: ex.base.quantities.roadArea,
        otherRoad: ex.other.quantities.roadArea,
        baseAllow: ex.base.landAllowance,
        otherAllow: ex.other.landAllowance,
        baseGap: ex.base.ownerGap,
        otherGap: ex.other.ownerGap,
        dHomes: ex.deltas.homes,
        dRoad: ex.deltas.roadArea,
        dAllow: ex.deltas.landAllowance,
        dGap: ex.deltas.ownerGap,
        pricedAt: `Both priced at Rp${ex.pricedAt.price / 1_000_000}m/home against a Rp${ex.pricedAt.owner / 1_000_000_000}bn owner benchmark.`,
        baseIssues: [...ex.base.validationErrors, ...(ex.base.applicable ? [] : ['outside profile'])],
        otherIssues: [...ex.other.validationErrors, ...(ex.other.applicable ? [] : ['outside profile'])],
      });
      setWhyNote(`Measured by the tool server (plan hash ${String(ex.planHash).slice(0, 8)}…).`);
      setSections(null);
      setUnready(null);
      setState('reporting');
    } catch {
      // A response that arrives after its version died is discarded, never
      // published — not even as a local fallback.
      if (!alive()) return;
      const site = { ...snap.site, entrance: snap.entrance, green: snap.green };
      const support = [base, other].map((sp) => (sp.family === 'spine' ? generateSpine(site, sp.frontage) : generateLoop(site, sp.frontage)).supportError).find(Boolean);
      if (support) { setWhy(null); setSections(null); setWhyNote(null); setUnready(support); setState('unavailable'); return; }
      const local = explainLocal(snap, base, other);
      setWhy(local);
      setWhyNote('Tool server unreachable — computed locally with the same deterministic engine. Figures match the server for the same plan.');
      setSections(null);
      setUnready(null);
      setState('reporting');
    }
  };

  const showLimits = () => {
    cancelAnswer(); setInvestigationText(props.tryCtx.requestText);
    setSections(answerLimits(props.facts, props.tryCtx));
    setWhy(null); setWhyNote(null); setUnready(null); setState('hypothesizing');
  };
  const ask = () => {
    const r = routeQuestion(question);
    if (r.route === 'limits') showLimits();
    else if (r.route === 'true') showTrue();
    else if (r.route === 'try') showTry(question);
    else if (r.route === 'why') void showWhy();
    else {
      cancelAnswer();
      setSections(clarifyText());
      setWhy(null);
      setWhyNote(null);
      setUnready(null);
      setState('clarifying');
    }
  };

  return (
    <div className="assistant" aria-live="polite">
      <p className="astate">
        <span className={`adot ${state}`} aria-hidden="true" />
        Assistant: {STATE_LABEL[state]}
      </p>
      <div className="askrow">
        <button type="button" onClick={showTrue}>What is true?</button>
        <button type="button" onClick={() => void showWhy()}>Why did it change?</button>
        <button type="button" onClick={() => showTry()}>What could we try?</button>
      </div>
      <div className="instr">
        <label htmlFor="askq">Ask about {props.facts.label}</label>
        <textarea
          id="askq"
          rows={2}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. Why did the allowance fall? What could we try?"
        />
        <button type="button" onClick={ask}>Ask</button>
      </div>
      {unready && <p role={state === 'unavailable' ? 'alert' : 'status'} className={state === 'unavailable' ? 'error' : 'note'}>{unready}</p>}
      {sections && sections.map((s, i) => (
        <div key={i}>
          <h3>{s.heading}</h3>
          <ul>
            {s.lines.map((l, j) => (
              <li key={j}>{l}</li>
            ))}
          </ul>
        </div>
      ))}
      {state === 'hypothesizing' && (
        <div className="draftrow">
          <button type="button" onClick={() => props.onSendRequest(investigationText)}>
            Send this investigation
          </button>
        </div>
      )}
      {why && (
        <div>
          <h3>
            {why.baseLabel} → {why.otherLabel} ({why.source === 'server' ? 'tool server' : 'local engine'})
          </h3>
          <dl className="kv">
            <dt>Homes</dt><dd>{why.baseN} → {why.otherN}{why.dHomes !== null ? ` (${why.dHomes >= 0 ? '+' : ''}${why.dHomes})` : ''}</dd>
            <dt>Road area</dt><dd>{formatM2(why.baseRoad)} → {formatM2(why.otherRoad)}</dd>
            <dt>Land allowance</dt><dd>{formatRp(why.baseAllow)} → {formatRp(why.otherAllow)}</dd>
            <dt>Owner outcome</dt><dd>{formatGap(why.baseGap)} → {formatGap(why.otherGap)}</dd>
          </dl>
          <p className="note">{why.pricedAt}</p>
          <label>Client explanation · editable measured summary<textarea className="client-explanation" aria-label="Client explanation · editable measured summary" rows={5} value={clientSummary ?? `${why.otherLabel} places ${why.otherN} homes, compared with ${why.baseN} in ${why.baseLabel}. ${why.otherN < why.baseN ? 'Fewer homes reduce modeled sales revenue at the same assumed selling price.' : why.otherN > why.baseN ? 'More homes increase modeled sales revenue at the same assumed selling price.' : 'The modeled home count is unchanged.'} Road area changes from ${formatM2(why.baseRoad)} to ${formatM2(why.otherRoad)}; equal area does not prove identical street geometry. After modeled costs and target surplus, land allowance changes from ${formatRp(why.baseAllow)} to ${formatRp(why.otherAllow)}. ${why.pricedAt} These are measured differences between two tested layouts. The specific binding spatial constraint and maximum site capacity have not been established.`} onChange={e => setClientSummary(e.target.value)} /></label>
          {(why.baseIssues.length > 0 || why.otherIssues.length > 0) && (
            <ul>
              {why.baseIssues.map((e, i) => <li key={`b${i}`}>{why.baseLabel}: {e}</li>)}
              {why.otherIssues.map((e, i) => <li key={`o${i}`}>{why.otherLabel}: {e}</li>)}
            </ul>
          )}
          {whyNote && <p className="note">{whyNote}</p>}
        </div>
      )}
    </div>
  );
}
