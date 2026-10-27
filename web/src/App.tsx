import { useEffect, useMemo, useRef, useState } from 'react';
import { deriveQuantities, editsForLayout, entranceErrors, generateLoop, generateSpine, lotKey, lotRoadFrontage, validateLayout } from '../../src/geometry';
import type { Entrance, LotEdits, Site } from '../../src/geometry';
import type { Pt } from '../../src/polygon';
import { MAX_LOT_VERTICES, polyArea, polysOverlap, rectCorners } from '../../src/polygon';
import { validateLotPoly } from '../../src/geometry';
import { makeSite, siteSizeErrors } from '../../src/site';
import { RATES, evaluateLayout } from '../../src/economics';
import { BASE_PROFILE, COMPACT_PROFILE, failingLots, runSearch, selectUpToThree } from '../../src/search';
import type { Ordering } from '../../src/search';
import { parseIntent } from '../../src/intent';
import type { IntentResult } from '../../src/intent';
import type { Candidate, Locks, ProductProfile, SearchRun } from '../../src/schema';
import type { Rect } from '../../src/schema';
import PlanCanvas from './unbuilt/PlanCanvas';
import BoundaryEditor from './unbuilt/BoundaryEditor';
import type { BoundaryDraft } from './unbuilt/BoundaryEditor';
import { boundaryErrors, frameForBoundary, siteArea, siteBoundary } from '../../src/boundary';
import type { SiteFrame } from '../../src/boundary';
import Assistant from './unbuilt/Assistant';
import { CirculationIcon, HomesIcon, OpenSpaceIcon, PanIcon, SelectIcon, SiteIcon } from './unbuilt/icons';
import { copyLotEdits, formatGap, formatM2, formatRp, indexLotsRecord, parcelKey, serverBase, siteWithEntrance, siteWithGreen } from './unbuilt/ui';
import { CAPABILITIES } from '../../src/snapshot';
import type { ScenarioSnapshot } from '../../src/snapshot';
import type { PlanFacts, TryContext } from '../../src/assistant';
import { parseProject, serializeProject } from '../../src/persist';
import type { PersistedProject, PersistedState } from '../../src/persist';
import { applyDraftEdit, commitDraft, pushUndo, redo, undo } from '../../src/draft';
import type { History } from '../../src/draft';
import type { WorkingSpec } from './unbuilt/ui';
import './App.css';

const M = 1_000_000;
const BN = 1_000_000_000;
const GRID = { families: ['spine', 'loop'] as const, frontages: [9, 10, 11, 12] };

type Sel = 'site' | 'grove' | 'circulation' | 'homes' | null;
type DockTab = 'quantities' | 'economics' | 'options' | 'issues' | 'record';
type DraftFields = Record<'x' | 'y' | 'w' | 'h', string>;

function buildWorking(siteW: Site, spec: WorkingSpec) {
  return spec.family === 'spine'
    ? generateSpine(siteW, spec.frontage)
    : generateLoop(siteW, spec.frontage);
}

function dispName(c: Candidate): string {
  return `${c.family === 'spine' ? 'Spine' : 'Loop'} · ${c.frontage} m lots`;
}

function avgLot(c: Candidate): number {
  return c.quantities.n > 0 ? c.quantities.parcelArea / c.quantities.n : 0;
}

function econKey(c: Candidate): string {
  return `${c.quantities.n}|${Math.round(c.quantities.roadArea)}|${Math.round(c.finance.landAllowance)}`;
}

function cardTitle(c: Candidate, snap: { n: number; road: number }): string {
  if (c.quantities.n !== snap.n) {
    return `${c.quantities.n > snap.n ? '+' : ''}${c.quantities.n - snap.n} homes, lots avg ${Math.round(avgLot(c))} m²`;
  }
  const dr = Math.round(c.quantities.roadArea - snap.road);
  if (dr !== 0) return `${dr < 0 ? '-' : '+'}${Math.abs(dr).toLocaleString('en-US')} m² road`;
  return `Same homes and road — lots avg ${Math.round(avgLot(c))} m²`;
}

function VerdictLine({ cards, run, profileName, ownerBn }: { cards: Candidate[]; run: SearchRun; profileName: string; ownerBn: number }) {
  const gaps = cards.map((c) => c.finance.ownerGap);
  const met = gaps.filter((g) => g <= 0).length;
  const best = cards.length > 0 ? Math.min(...gaps) : 0;
  const worst = cards.length > 0 ? Math.max(...gaps) : 0;
  // Owner expectation is a benchmark, never a counted constraint: lead with
  // the best achievable outcome, not the worst.
  const commercial =
    cards.length === 0
      ? null
      : met === cards.length
        ? `All shown meet the Rp${ownerBn}bn owner benchmark.`
        : met > 0
          ? `${met} of ${cards.length} shown meet the Rp${ownerBn}bn owner benchmark; best outcome ${formatGap(best)}.`
          : `None shown meet the Rp${ownerBn}bn owner benchmark — best shortfall ${formatRp(best)}, worst ${formatRp(worst)}. Benchmark observed within the tested ranges only.`;
  return (
    <p className="note">
      {run.tested} tested: {run.breakdown.geometryValid} geometrically valid, {run.breakdown.applicable} fit the {profileName} profile,{' '}
      {run.breakdown.priceOk} within ceiling, {run.breakdown.targetOk} meet target surplus — {run.qualified} shown below.
      {commercial ? ` ${commercial}` : ''}
    </p>
  );
}

export default function App() {
  const [baseSpec, setBaseSpec] = useState<SiteFrame>({ w: 120, h: 100 });
  const [boundaryDraft, setBoundaryDraft] = useState<BoundaryDraft | null>(null);
  const [siteFit, setSiteFit] = useState(0);
  const [boundaryHistory, setBoundaryHistory] = useState<History<BoundaryDraft>>({ past: [], future: [] });
  const base = useMemo(() => ({ ...makeSite(baseSpec.w, baseSpec.h), ...baseSpec }), [baseSpec]);
  const isCustomSite = !!baseSpec.boundary || baseSpec.w !== 120 || baseSpec.h !== 100;
  const [refImage, setRefImage] = useState<string | null>(null);
  const [showBackdrop, setShowBackdrop] = useState(true);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [siteW, setSiteW] = useState('120');
  const [siteH, setSiteH] = useState('100');
  // Numeric inputs stay strings until parsed: an emptied field is incomplete,
  // never a silent zero. Committed geometry only updates on fully valid drafts.
  const num = (s: string) => (s.trim() === '' ? NaN : Number(s));
  const [green, setGreen] = useState<Rect>({ ...base.green });
  const [entrance, setEntrance] = useState<Entrance>({ ...base.entrance });
  const [entranceS, setEntranceS] = useState(String(base.entrance.offset));
  // Manual lot reshapes: parcel index -> polygon meters. While any exist,
  // regenerating actions (circulation, frontage, search, apply, open-space
  // edits, entrance moves) stay blocked: regeneration would silently erase
  // manual work, so only an explicit discard reopens them.
  // Stable manual reshapes keyed by unedited base rectangle: identical lots
  // across regenerations keep their shape; only removed lots can conflict.
  const [lotEdits, setLotEdits] = useState<Record<string, Pt[]>>({});
  const lotLockActive = Object.keys(lotEdits).length > 0;
  // Lot reshape UI state: which generated lot is selected, and the active
  // vertex draft (explicit Apply/Cancel; metrics stay on committed geometry).
  const [selectedLot, setSelectedLot] = useState<number | null>(null);
  const [lotDraft, setLotDraft] = useState<{ index: number; pts: Pt[] } | null>(null);
  // An open reshape draft addresses parcel indices: regeneration waits until
  // it is applied or cancelled. Committed reshapes are never blocked this
  // way — they carry by stable identity (see askRegen).
  const regenBlock = boundaryDraft ? 'Apply or Cancel the boundary edit first.' : lotDraft
    ? 'A lot reshape is in progress — Apply or Cancel it before regenerating the layout.'
    : null;
  const [greenDraftF, setGreenDraftF] = useState<DraftFields>({
    x: String(base.green.x), y: String(base.green.y), w: String(base.green.w), h: String(base.green.h),
  });
  const [profileId, setProfileId] = useState('family-200');
  const [priceS, setPriceS] = useState('850');
  const [ceilingS, setCeilingS] = useState('850');
  const [ownerS, setOwnerS] = useState('10');
  const [targetS, setTargetS] = useState('15');
  const [spec, setSpec] = useState<WorkingSpec>({ family: 'spine', frontage: 10 });
  const [selected, setSelected] = useState<Sel>(null);
  const [greenLocked, setGreenLocked] = useState(true);
  const [request, setRequest] = useState('Keep this green space. Do not increase the home selling price. What else can change?');
  const [intent, setIntent] = useState<IntentResult | null>(null);
  // The exact accepted scenario the proposal was reviewed against. Any later
  // edit (assumptions, geometry, locks, selection profile) stales it and
  // blocks Accept until the user reviews a fresh proposal. Compared after
  // snap() is defined (see below) — never during these declarations.
  const [propSnap, setPropSnap] = useState<Snapshot | null>(null);
  const [acceptedSummary, setAcceptedSummary] = useState<string | null>(null);
  const [run, setRun] = useState<SearchRun | null>(null);
  const [runSnap, setRunSnap] = useState<{
    priceS: string; ceilingS: string; ownerS: string; targetS: string;
    profileId: string; green: Rect; entrance: Entrance; spec: WorkingSpec; n: number; road: number;
    lots: Record<number, Pt[]>; baseSpec: SiteFrame;
  } | null>(null);
  const [ordering, setOrdering] = useState<Ordering>('lowest-road');
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [showPrev, setShowPrev] = useState(true);
  const [dockTab, setDockTab] = useState<DockTab>('options');
  // Outcomes strip stays persistent; details expand on demand and open
  // automatically when a search completes.
  const [dockOpen, setDockOpen] = useState(false);
  const [lastDelta, setLastDelta] = useState<string | null>(null);
  // Compare view: any two distinct snapshots side by side — the working
  // plan or any option card from the same run. Same site coordinates in both
  // (guaranteed by the !stale gate); Fit both reframes them together.
  const [cmpA, setCmpA] = useState<string>('working');
  const [cmpB, setCmpB] = useState<string>('');
  const [cmpFit, setCmpFit] = useState(0);
  const [cmpExpand, setCmpExpand] = useState(false);
  const dockPanelRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (cmpExpand) dockPanelRef.current?.scrollTo({ top: 0 }); }, [cmpExpand]);
  const [planWide, setPlanWide] = useState(false);
  // Assistant panel: selection-bound, expandable beside the inspector, never
  // covering the plan. Supported edits never need it.
  const [askOpen, setAskOpen] = useState(false);
  // Narrow pages stack plan over controls: the side columns collapse behind
  // a toggle so the drawing and its compact outcomes stay in focus. Desktop
  // always shows everything.
  const [controlsOpen, setControlsOpen] = useState(
    () => typeof window === 'undefined' || !window.matchMedia('(max-width: 900px)').matches,
  );
  const [tool, setTool] = useState<'select' | 'pan'>('select');
  // Truthful tool-server status for the top bar: probed once on boot, never
  // assumed. Local parsing and search always work without it.
  const [serverOk, setServerOk] = useState<boolean | null>(null);
  useEffect(() => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 2500);
    fetch(`${serverBase()}/api/health`, { signal: ctrl.signal })
      .then((r) => setServerOk(r.ok))
      .catch(() => setServerOk(false))
      .finally(() => clearTimeout(timer));
    return () => ctrl.abort();
  }, []);

  const exportRecord = () => {
    // Export v2: a versioned snapshot of the CURRENT ACCEPTED plan (committed
    // geometry, never a pending draft) plus the append-only event log, kept
    // clearly separate. No tokens, credentials, file paths, image bytes, or
    // environment values ever enter this object. A reader can reproduce the
    // plan from state.plan inputs with the deterministic generators, or read
    // the full modeled geometry directly.
    const cedar = !isCustomSite;
    const payload = {
      app: 'UNBUILT decision record',
      exportVersion: baseSpec.boundary ? 3 : 2,
      exportedAt: new Date().toISOString(),
      units: 'Geometry in meters, local Cartesian, y-up from the south edge. Currency in integer Rp.',
      state: {
        site: {
          w: baseSpec.w,
          h: baseSpec.h,
          ...(baseSpec.boundary ? { boundary: baseSpec.boundary } : {}),
          areaM2: siteArea(baseSpec),
          provenance: cedar
            ? 'fictional Cedar Market sample'
            : 'custom confirmed boundary; generated entrance/open space are assumed — review',
        },
        entrance: { ...entrance },
        openSpace: {
          geometry: { ...green },
          locked: greenLocked,
          surface: 'landscaped/shared green (assumed — other surface types unmodeled)',
          costBasisRpPerM2: RATES.greenWorksPerM2,
        },
        plan: {
          family: spec.family,
          frontage: spec.frontage,
          profile: profileId,
          roads: committedLayout.roads,
          parcels: committedLayout.parcels,
          lotReshapes: copyLotEdits(lotEdits),
          draftPending: draftDirty ? { openSpace: { ...greenDraftF } } : null,
        },
        quantities: committedEcon ? { ...committedEcon.quantities } : null,
        economics: committedEcon
          ? {
              roadCost: committedEcon.roadCost,
              homeCost: committedEcon.homeCost,
              greenCost: committedEcon.greenCost,
              costNonLand: committedEcon.costNonLand,
              finance: { ...committedEcon.finance },
            }
          : null,
        assumptions: {
          assumedPriceRp: price * M,
          ceilingRp: ceiling * M,
          ownerExpectationRp: ownerL * BN,
          targetFraction: targetT / 100,
          profileSource: profile.source,
        },
      },
      events: decisions,
      history: {
        undoDepth: hist.past.length,
        redoDepth: hist.future.length,
        note: 'Entries are append-only: Undo/Redo appear as events below, never as rewrites.',
      },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'unbuilt-decision-record.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    logDecision('record', 'Decision record exported (versioned accepted plan + event log).');
    setStatus('Decision record exported as JSON (no credentials included).');
  };
  // Bumped to force-clear any in-progress canvas gesture ref (Escape path).
  const [cancelTick, setCancelTick] = useState(0);
  interface Snapshot {
    spec: WorkingSpec; green: Rect; greenDraftF: DraftFields; entrance: Entrance; profileId: string; greenLocked: boolean;
    lots: Record<string, Pt[]>; // stable base-rect keys
    priceS: string; ceilingS: string; ownerS: string; targetS: string; baseSpec: SiteFrame;
  }
  interface Decision {
    t: string;
    kind: string;
    detail: string;
  }
  const [hist, setHist] = useState<History<Snapshot>>({ past: [], future: [] });
  const [appliedNote, setAppliedNote] = useState<string | null>(null);
  const [status, setStatus] = useState('Ready. Working plan shows the current proposition.');

  const greenSelected = selected === 'grove';
  const profile: ProductProfile = profileId === 'starter-150' ? COMPACT_PROFILE : BASE_PROFILE;

  const price = num(priceS);
  const ceiling = num(ceilingS);
  const ownerL = num(ownerS);
  const targetT = num(targetS);
  const inputsOk =
    Number.isFinite(price) && price > 0 &&
    Number.isFinite(ceiling) && ceiling > 0 &&
    Number.isFinite(ownerL) && ownerL >= 0 &&
    Number.isFinite(targetT) && targetT >= 0 && targetT < 100;

  // Draft machine: invalid edits stay visible but can never become the plan.
  const draft = applyDraftEdit(green, greenDraftF, base);
  // Dirty compares parsed values: retyping "078" for 78 is not a change,
  // while an unparsable field always counts as dirty (with an error shown).
  const draftDirty = (['x', 'y', 'w', 'h'] as const).some(
    (k) => num(greenDraftF[k]) !== green[k],
  );
  const greenErrors: string[] = draft.draftable
    ? []
    : draft.errors.map((e) =>
        e.startsWith('Open space must sit')
          ? `${e} ${greenLocked ? 'Unlock it to edit.' : 'Move it back inside the site.'}`
          : e,
      );

  // Displayed geometry follows the draft; metrics only follow valid drafts.
  const site = useMemo(
    () => siteWithEntrance(siteWithGreen(base, draft.draft), entrance),
    [base, draft.draft, entrance],
  );
  const committedSite = useMemo(
    () => siteWithEntrance(siteWithGreen(base, green), entrance),
    [base, green, entrance],
  );
  const workingLayout = useMemo(() => buildWorking(site, spec), [site, spec]);
  const editsMap: LotEdits = useMemo(
    () => editsForLayout(workingLayout.parcels, lotEdits),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [workingLayout, lotEdits],
  );
  // Index-addressed view of the carried edits for canvases + run snapshot.
  const lotsByIndex = useMemo(() => indexLotsRecord(editsMap), [editsMap]);
  const layoutErrors = validateLayout(site, workingLayout, editsMap);
  const workingErrors = [...new Set([...greenErrors, ...entranceErrors(site), ...layoutErrors])];
  // Profile applicability of the working plan is a warning, not a blocker:
  // candidates are judged independently, but pricing an out-of-profile plan
  // at profile prices would mislead. Reshaped lots use true polygon area and
  // road-shared frontage.
  const workingFailing = failingLots(workingLayout.parcels, profile, { lotEdits: editsMap, roads: workingLayout.roads });
  const workingWarnings =
    workingFailing.length > 0
      ? [
          `${workingFailing.length} working lot(s) fall outside the ${profile.name} profile (area/frontage). ` +
            `Priced figures assume the profile applies — treat them as provisional.`,
        ]
      : [];
  const committedLayout = useMemo(() => buildWorking(committedSite, spec), [committedSite, spec]);
  const financeArgs = {
    ownerExpectation: ownerL * BN,
    targetFraction: targetT / 100,
  };
  const committedEcon = inputsOk && !committedLayout.supportError ? evaluateLayout(committedSite, committedLayout, price * M, financeArgs, editsForLayout(committedLayout.parcels, lotEdits)) : null;
  const draftEcon =
    draft.draftable && layoutErrors.length === 0 && inputsOk
      ? evaluateLayout(site, workingLayout, price * M, financeArgs, editsMap)
      : null;
  // Metrics follow the draft while it is valid; otherwise the last valid plan.
  const workingEcon = draftEcon ?? committedEcon;
  const workingOk = inputsOk && workingErrors.length === 0;

  const stale =
    run !== null &&
    runSnap !== null &&
    (runSnap.priceS !== priceS ||
      runSnap.ceilingS !== ceilingS ||
      runSnap.ownerS !== ownerS ||
      runSnap.targetS !== targetS ||
      runSnap.profileId !== profileId ||
      JSON.stringify(runSnap.green) !== JSON.stringify(green) ||
      JSON.stringify(runSnap.entrance) !== JSON.stringify(entrance) ||
      JSON.stringify(runSnap.lots) !== JSON.stringify(lotsByIndex) ||
      JSON.stringify(runSnap.spec) !== JSON.stringify(spec) ||
      runSnap.baseSpec.w !== baseSpec.w ||
      runSnap.baseSpec.h !== baseSpec.h ||
      JSON.stringify(runSnap.baseSpec.boundary) !== JSON.stringify(baseSpec.boundary));

  const effectiveCeiling =
    intent && intent.kind === 'proposal' && intent.operations.priceCeiling !== null
      ? intent.operations.priceCeiling / M
      : ceiling;
  const priceError =
    Number.isFinite(price) && Number.isFinite(effectiveCeiling) && price > effectiveCeiling
      ? `Selected price Rp${price}m exceeds the ceiling Rp${effectiveCeiling}m. Lower the price or raise the ceiling. Search is blocked; plan exploration stays open.`
      : null;

  const touchDraft = (f: DraftFields) => {
    setGreenDraftF(f);
    setLastDelta(null);
  };

  const doRun = (prof: ProductProfile, locks: Locks) => {
    const r = runSearch({
      site: committedSite,
      profile: prof,
      selectedPrice: price * M,
      locks,
      ranges: { families: [...GRID.families], frontages: [...GRID.frontages] },
      seed: 7,
      budget: 250,
      lotEdits: copyLotEdits(lotEdits),
    });
    logDecision(
      'search',
      `Ran bounded search (${prof.id}, price Rp${price}M, ceiling Rp${locks.priceCeiling / M}M): ${r.tested} tested, ` +
        `${r.breakdown.geometryValid} geometrically valid, ${r.breakdown.applicable} fit profile, ` +
        `${r.breakdown.priceOk} within ceiling, ${r.breakdown.targetOk} meet target surplus, ${r.qualified} shown. ` +
        `Owner expectation Rp${ownerL}bn is a benchmark, not a constraint.`,
    );
    setRun(r);
    setCmpA('working');
    setCmpB('');
    setRunSnap({
      priceS, ceilingS: String(locks.priceCeiling / M), ownerS, targetS, profileId: prof.id,
      green: { ...green }, entrance: { ...entrance }, lots: indexLotsRecord(editsMap), spec: { ...spec },
      n: workingEcon?.quantities.n ?? 0, road: workingEcon?.quantities.roadArea ?? 0,
      baseSpec: { ...baseSpec },
    });
    setPreviewId(null);
    setAcceptedSummary(
      r.qualified > 0
        ? `Accepted. Ran ${r.tested} layouts: ${r.qualified} options meet the modeled constraints (valid geometry, profile fit, ceiling, target surplus). Owner expectation is a benchmark — see Options.`
        : `Accepted. Ran ${r.tested} layouts — no option meets the modeled constraints in the tested scope (see blockers below).`,
    );
    setStatus(
      r.qualified > 0
        ? `Search done: ${r.qualified} valid options. Preview one to inspect it.`
        : 'Search done: no valid option in the tested scope. See blockers.',
    );
    setDockTab('options');
    setDockOpen(true);
  };

  const submitRequest = (override?: string) => {
    // Exactly one open space exists: when it is locked, a green request
    // without a canvas selection unambiguously means it (stated in the
    // proposal text). Anything else still needs a selection.
    const text = override ?? request;
    if (override !== undefined) setRequest(override);
    const resolvedGreen = greenSelected || greenLocked;
    const r = parseIntent(text, {
      selected: resolvedGreen ? { id: 'grove-a', kind: 'green', name: 'Open space A' } : null,
      selectedPrice: Number.isFinite(price) ? price * M : 0,
    });
    setIntent(r);
    setPropSnap(r.kind === 'proposal' ? snap() : null);
    setAcceptedSummary(null);
    setAppliedNote(null);
    setStatus(
      r.kind === 'proposal'
        ? 'Proposal ready. Review it, then Accept and run or Reject.'
        : r.kind === 'limitation'
          ? 'Request limited. A supported alternative is described.'
          : 'Clarification needed. See the message below.',
    );
  };

  const acceptProposal = () => {
    if (!intent || intent.kind !== 'proposal') return;
    if (proposalStale) {
      setStatus('Proposal is stale — assumptions or geometry changed after review. Send the request again for a fresh proposal.');
      return;
    }
    if (priceError || !inputsOk || greenErrors.length > 0) {
      setStatus('Search blocked: fix the flagged economics or geometry first.');
      return;
    }
    if (draftDirty) {
      setStatus('Apply or Cancel the green edit first — search runs on the committed plan.');
      return;
    }
    const ops = intent.operations;
    const nextProfileId = ops.profileId ?? profileId;
    const nextCeilingS = ops.priceCeiling !== null ? String(ops.priceCeiling / M) : ceilingS;
    setHist((h) => pushUndo(h, snap()));
    setProfileId(nextProfileId);
    setCeilingS(nextCeilingS);
    if (ops.lockGreen) setGreenLocked(true);
    const prof = nextProfileId === 'starter-150' ? COMPACT_PROFILE : BASE_PROFILE;
    doRun(prof, {
      green: { ...green },
      priceCeiling: ops.priceCeiling ?? num(nextCeilingS) * M,
      ownerExpectation: ownerL * BN,
      targetFraction: targetT / 100,
    });
    setPropSnap(null);
  };

  const rerun = () => {
    if (!workingOk) {
      setStatus('Search blocked: fix the flagged economics or geometry first.');
      return;
    }
    if (draftDirty) {
      setStatus('Apply or Cancel the green edit first — search runs on the committed plan.');
      return;
    }
    doRun(profile, {
      green: { ...green },
      priceCeiling: ceiling * M,
      ownerExpectation: ownerL * BN,
      targetFraction: targetT / 100,
    });
  };

  const rejectProposal = () => {
    setIntent(null);
    setPropSnap(null);
    setAcceptedSummary(null);
  };

  const snap = (): Snapshot => ({
    spec: { ...spec }, green: { ...green }, greenDraftF: { ...greenDraftF }, entrance: { ...entrance },
    profileId, greenLocked, lots: copyLotEdits(lotEdits),
    priceS, ceilingS, ownerS, targetS, baseSpec: { ...baseSpec },
  });

  const restore = (s: Snapshot) => {
    setSpec(s.spec);
    setGreen(s.green);
    setEntrance({ ...s.entrance });
    setEntranceS(String(s.entrance.offset));
    setLotEdits(copyLotEdits(s.lots ?? {}));
    setGreenDraftF(s.greenDraftF);
    setProfileId(s.profileId);
    setGreenLocked(s.greenLocked);
    setPriceS(s.priceS);
    setCeilingS(s.ceilingS);
    setOwnerS(s.ownerS);
    setTargetS(s.targetS);
    setBaseSpec(s.baseSpec);
    setBoundaryDraft(null);
    setSiteW(String(s.baseSpec.w));
    setSiteH(String(s.baseSpec.h));
    setPreviewId(null);
  };

  const [decisions, setDecisions] = useState<Decision[]>([]);
  const logDecision = (kind: string, detail: string) =>
    setDecisions((d) => [...d, { t: new Date().toISOString(), kind, detail }]);

  // Durable project state: versioned autosave to localStorage plus file
  // import. Photos are never stored (session-only blobs); every restore says
  // so. Storage denial surfaces as status, never a silent loss.
  const PERSIST_KEY = 'unbuilt.project.v1';
  const [saveStatus, setSaveStatus] = useState('No saved project yet.');
  const [importError, setImportError] = useState<string | null>(null);
  const booted = useRef(false);

  const projectState = (): PersistedState => ({
    spec: { ...spec },
    green: { ...green },
    entrance: { ...entrance },
    lots: copyLotEdits(lotEdits),
    profileId,
    greenLocked,
    priceS,
    ceilingS,
    ownerS,
    targetS,
    baseSpec: { ...baseSpec },
  });

  const restoreProject = (p: PersistedProject, label: string) => {
    const st = p.state;
    const knownProfile = st.profileId === 'starter-150' || st.profileId === BASE_PROFILE.id ? st.profileId : 'starter-150';
    setBaseSpec({ ...st.baseSpec });
    setBoundaryDraft(null);
    setSpec({ family: st.spec.family === 'loop' ? 'loop' : 'spine', frontage: st.spec.frontage });
    setGreen({ ...st.green });
    setGreenDraftF(strFields(st.green));
    setEntrance({ edge: st.entrance.edge === 'east' ? 'east' : 'west', offset: st.entrance.offset, width: st.entrance.width });
    setEntranceS(String(st.entrance.offset));
    setLotEdits(copyLotEdits(st.lots));
    setProfileId(knownProfile);
    setGreenLocked(st.greenLocked);
    setPriceS(st.priceS);
    setCeilingS(st.ceilingS);
    setOwnerS(st.ownerS);
    setTargetS(st.targetS);
    setDecisions([...p.decisions, { t: new Date().toISOString(), kind: 'restore', detail: label }]);
    setHist({ past: [], future: [] });
    setRun(null);
    setRunSnap(null);
    setPreviewId(null);
    setIntent(null);
    setPropSnap(null);
    setAcceptedSummary(null);
    setAppliedNote(null);
    setLastDelta(null);
    setSelectedLot(null);
    setLotDraft(null);
    setPendingOp(null);
    setSelected(null);
    const photoNote = ' Reference photo not stored — re-upload if needed.';
    const scopeNote = ' Searches, comparisons, drafts, and undo history do not transfer — regenerate options after reload.';
    const profileNote = knownProfile === st.profileId ? '' : ' Unknown product profile fell back to Starter 150.';
    setStatus(`${label}.${photoNote}${scopeNote}${profileNote}`);
  };

  // Boot: restore one saved project, or report why not. Runs once.
  useEffect(() => {
    booted.current = true;
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(PERSIST_KEY);
    } catch {
      setSaveStatus('Saved projects unavailable: this browser refused storage access.');
      return;
    }
    if (!raw) {
      setSaveStatus('No saved project yet — changes save to this browser automatically.');
      return;
    }
    let parsed: unknown = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      setSaveStatus('Saved project unreadable (not JSON) — starting fresh; nothing was restored.');
      return;
    }
    const r = parseProject(parsed);
    if (!r.ok) {
      setSaveStatus(`Saved project refused (${r.error}) — starting fresh; nothing was restored.`);
      return;
    }
    restoreProject(r.project, `Restored saved project from ${r.project.savedAt}`);
    setSaveStatus(`Restored saved project from ${r.project.savedAt}.`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autosave: every accepted-state change persists; failures are status.
  useEffect(() => {
    if (!booted.current) return;
    try {
      window.localStorage.setItem(PERSIST_KEY, JSON.stringify(serializeProject(projectState(), decisions)));
      setSaveStatus(`Project saved in this browser at ${new Date().toLocaleTimeString()}.`);
    } catch {
      setSaveStatus('Save failed: this browser refused storage (quota or private mode). Export JSON to keep your work.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec, green, entrance, lotEdits, profileId, greenLocked, priceS, ceilingS, ownerS, targetS, baseSpec, decisions]);

  const onImportFile = (f: File) => {
    setImportError(null);
    f.text()
      .then((text) => {
        let parsed: unknown = null;
        try {
          parsed = JSON.parse(text);
        } catch {
          setImportError('That file is not JSON — nothing was imported.');
          return;
        }
        const r = parseProject(parsed);
        if (!r.ok) {
          setImportError(`Import refused: ${r.error} Nothing was changed.`);
          return;
        }
        restoreProject(r.project, `Imported project file “${f.name}”`);
        setSaveStatus('Imported project file — saved to this browser.');
      })
      .catch(() => setImportError('That file could not be read — nothing was imported.'));
  };

  // A proposal is reviewable only against its frozen scenario: any dependent
  // edit after Send stales it and blocks Accept until a fresh review.
  const proposalStale =
    intent !== null && intent.kind === 'proposal' && propSnap !== null &&
    JSON.stringify(snap()) !== JSON.stringify(propSnap);

  // Uploaded bytes are never trusted on name or MIME alone: magic bytes,
  // size, actual decoding, and pixel dimensions must all pass before a file
  // replaces anything. Failures keep the last valid photo and revoke the
  // temporary URL; only an accepted photo retires its predecessor.
  const MAX_PHOTO_BYTES = 10_000_000;
  const MAX_PHOTO_MEGAPIXELS = 20;
  const onPhotoFile = (f: File) => {
    if (f.type !== '' && f.type !== 'image/png' && f.type !== 'image/jpeg') {
      setPhotoError(`“${f.name}” arrived as ${f.type}, not a PNG/JPEG photo. The current reference photo is unchanged.`);
      return;
    }
    if (f.size > MAX_PHOTO_BYTES) {
      setPhotoError(`“${f.name}” is ${(f.size / 1_000_000).toFixed(1)} MB — photos over 10 MB are refused. The current reference photo is unchanged.`);
      return;
    }
    f.slice(0, 8)
      .arrayBuffer()
      .then((buf) => {
        const b = new Uint8Array(buf);
        const isPng =
          b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
          b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a;
        const isJpeg = b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
        if (!isPng && !isJpeg) {
          setPhotoError(`“${f.name}” is not PNG/JPEG data (signature check failed). The current reference photo is unchanged.`);
          return;
        }
        const url = URL.createObjectURL(f);
        const img = new Image();
        img.onload = () => {
          if (img.naturalWidth < 1 || img.naturalHeight < 1) {
            URL.revokeObjectURL(url);
            setPhotoError(`“${f.name}” decoded with no pixels. The current reference photo is unchanged.`);
            return;
          }
          if (img.naturalWidth * img.naturalHeight > MAX_PHOTO_MEGAPIXELS * 1_000_000) {
            URL.revokeObjectURL(url);
            setPhotoError(`“${f.name}” is ${(img.naturalWidth * img.naturalHeight / 1_000_000).toFixed(1)} MP — photos over ${MAX_PHOTO_MEGAPIXELS} MP are refused. The current reference photo is unchanged.`);
            return;
          }
          if (refImage) URL.revokeObjectURL(refImage);
          setRefImage(url);
          setShowBackdrop(true);
          setPhotoError(null);
          logDecision('photo', `Reference photo loaded (${img.naturalWidth} × ${img.naturalHeight} px, illustration only — never geometry).`);
          setStatus('Reference photo loaded. It illustrates only — dimensions come from the confirmed boundary below.');
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
          setPhotoError(`“${f.name}” did not decode as a PNG/JPEG image. The current reference photo is unchanged.`);
        };
        img.src = url;
      })
      .catch(() => {
        setPhotoError(`“${f.name}” could not be read. The current reference photo is unchanged.`);
      });
  };

  const useSite = () => {
    if (regenBlock || draftDirty) { setStatus(regenBlock ?? 'Apply or Cancel the open-space draft first.'); return; }
    const w = siteW.trim() === '' ? NaN : Number(siteW);
    const h = siteH.trim() === '' ? NaN : Number(siteH);
    const errs = siteSizeErrors(w, h);
    if (errs.length > 0) {
      setStatus(`New site blocked: ${errs[0]}`);
      return;
    }
    setHist((hh) => pushUndo(hh, snap()));
    // Confirming dimensions never drops the reference photo: it illustrates
    // the same source either way, and Undo restores the prior dimensions
    // with the photo still in place. Removal is an explicit separate action.
    setBaseSpec({ w, h });
    const s = makeSite(w, h);
    setGreen({ ...s.green });
    setEntrance({ ...s.entrance });
    setEntranceS(String(s.entrance.offset));
    setGreenDraftF(strFields(s.green));
    // A new site replaces all generated geometry: manual reshapes address
    // parcel indices that no longer exist, so they are cleared (logged, and
    // restorable via Undo since the snapshot carries them).
    if (lotLockActive) logDecision('lots', 'Manual lot reshapes cleared with the old site geometry (kept for Undo).');
    setLotEdits({});
    setSelectedLot(null);
    setLotDraft(null);
    setSpec({ family: 'spine', frontage: 10 });
    setRun(null);
    setRunSnap(null);
    setPreviewId(null);
    setAcceptedSummary(null);
    setLastDelta(null);
    logDecision('site', `New ${w} × ${h} m site from confirmed boundary. Reference photo kept.`);
    setStatus(`New ${w} × ${h} m site. Reference photo kept. Previous work kept for Undo.`);
  };

  // Assumption edits commit on blur/Enter as one undoable step, holding the pre-edit value.
  const assumeField = (
    field: 'priceS' | 'ceilingS' | 'ownerS' | 'targetS',
    oldVal: string,
    set: (v: string) => void,
  ) => ({
    onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
      (e.target as HTMLInputElement).dataset.before = e.target.value;
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
      const before = (e.target as HTMLInputElement).dataset.before ?? oldVal;
      if (e.target.value !== before) {
        setHist((h) => pushUndo(h, { ...snap(), [field]: before }));
        setLastDelta(null);
      }
    },
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
    },
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(e.target.value),
  });

  // Regenerating change: reshapes whose base lots survive carry over
  // silently; reshapes on removed lots ask first. Nothing is silently erased.
  interface PendingRegen {
    label: string;
    conflicts: string[];
    cancel: () => void;
    proceed: () => void;
  }
  const [pendingOp, setPendingOp] = useState<PendingRegen | null>(null);

  const conflictsFor = (parcels: Rect[]): string[] =>
    Object.keys(lotEdits).filter((id) => !parcels.some((p) => lotKey(p) === id));

  const conflictNames = (ids: string[]): string =>
    ids
      .map((id) => {
        const i = workingLayout.parcels.findIndex((p) => lotKey(p) === id);
        return i >= 0 ? `Lot ${i + 1}` : 'a reshaped lot';
      })
      .join(', ');

  const askRegen = (label: string, parcels: Rect[], proceed: () => void, cancel: () => void = () => {}) => {
    const conflicts = conflictsFor(parcels);
    if (conflicts.length === 0) {
      proceed();
      return;
    }
    setPendingOp({ label, conflicts, cancel, proceed });
    setStatus(`${label} would remove ${conflictNames(conflicts)} — reshapes carry only where their lots survive. Choose below.`);
  };

  const cancelPendingOp = () => {
    const p = pendingOp;
    setPendingOp(null);
    p?.cancel();
    setStatus('Change cancelled — reshapes and plan untouched.');
  };

  const continuePendingOp = () => {
    const p = pendingOp;
    if (!p) return;
    setLotEdits((e) => {
      const next = { ...e };
      p.conflicts.forEach((id) => {
        delete next[id];
      });
      return next;
    });
    logDecision('lots', `Discarded conflicting reshape(s) on ${conflictNames(p.conflicts)} by explicit choice to ${p.label.toLowerCase()}.`);
    setPendingOp(null);
    setLastDelta(null);
    p.proceed();
  };

  const changeBoundary = (next: BoundaryDraft, record = true) => {
    if (record && boundaryDraft) setBoundaryHistory((h) => pushUndo(h, boundaryDraft));
    setBoundaryDraft(next);
  };
  const undoBoundary = (forward = false) => {
    if (!boundaryDraft) return;
    const result = (forward ? redo : undo)(boundaryHistory, boundaryDraft);
    if (result.snap) { setBoundaryDraft(result.snap); setBoundaryHistory(result.hist); setCancelTick((t) => t + 1); }
  };
  const cancelBoundary = () => {
    setBoundaryDraft(null);
    setCancelTick((t) => t + 1);
    setStatus('Boundary edit cancelled. Accepted plan unchanged.');
  };
  const startBoundary = (newSite: boolean) => {
    if (draftDirty || lotDraft || pendingOp) { setStatus('Apply or Cancel the current edit first.'); return; }
    setPreviewId(null);
    setSelected('site');
    setTool('select');
    setControlsOpen(true);
    setDockOpen(false);
    setBoundaryHistory({ past: [], future: [] });
    setBoundaryDraft({ pts: newSite ? [] : siteBoundary(baseSpec).map((p) => ({ ...p })), closed: !newSite, newSite });
    setStatus(newSite ? 'Draw a boundary: place vertices, then close the outline. Escape cancels.' : 'Boundary draft: drag a vertex, add at a midpoint, or edit coordinates. Apply or Cancel to finish.');
  };
  const applyBoundary = () => {
    if (!boundaryDraft || !boundaryDraft.closed || boundaryErrors(boundaryDraft.pts).length) return;
    const next = frameForBoundary(boundaryDraft.pts);
    const nextGreen = boundaryDraft.newSite ? makeSite(next.w, next.h).green : green;
    const nextEntrance = boundaryDraft.newSite ? makeSite(next.w, next.h).entrance : entrance;
    const nextSite = { ...base, ...next, green: nextGreen, entrance: nextEntrance };
    const nextLayout = buildWorking(nextSite, spec);
    const carried = editsForLayout(nextLayout.parcels, lotEdits);
    const errors = validateLayout(nextSite, nextLayout, carried);
    // Existing manual geometry must be valid as well as retain its identity.
    const incompatible = Object.entries(lotEdits).filter(([key]) => !nextLayout.parcels.some((p) => lotKey(p) === key));
    if (!nextLayout.supportError && errors.length) { setStatus(`Boundary cannot apply: ${errors[0]}. Correct the draft or cancel.`); return; }
    askRegen('Applying site boundary', nextLayout.parcels, () => {
      setHist((h) => pushUndo(h, snap()));
      setBaseSpec(next);
      setSiteW(String(next.w)); setSiteH(String(next.h));
      setGreen({ ...nextGreen }); setGreenDraftF(strFields(nextGreen));
      setEntrance({ ...nextEntrance }); setEntranceS(String(nextEntrance.offset));
      if (incompatible.length) setLotEdits(Object.fromEntries(Object.entries(lotEdits).filter(([key]) => nextLayout.parcels.some((p) => lotKey(p) === key))));
      setSelectedLot(null); setBoundaryDraft(null); setCancelTick((t) => t + 1);
      setSiteFit((t) => t + 1);
      setRun(null); setRunSnap(null); setPreviewId(null); setIntent(null); setPropSnap(null); setAcceptedSummary(null); setLastDelta(null);
      logDecision('boundary', `Applied ${next.boundary!.length}-vertex site, ${siteArea(next)} m². ${nextLayout.supportError ?? 'Contained layout regenerated; outside lots omitted.'}`);
      setStatus(nextLayout.supportError ? `Boundary saved (${formatM2(siteArea(next))}). Layout unavailable: ${nextLayout.supportError}` : `Boundary applied: ${formatM2(siteArea(next))}. Layout measured inside the boundary. Undo restores the previous plan.`);
    });
  };

  const applyCandidate = (c: Candidate) => {
    if (regenBlock) {
      setStatus(regenBlock);
      return;
    }
    const pro = buildWorking(site, { family: c.family, frontage: c.frontage });
    askRegen(`Applying ${dispName(c)}`, pro.parcels, () => {
      setHist((h) => pushUndo(h, snap()));
      logDecision('apply', `Applied ${dispName(c)} (${c.quantities.n} homes, allowance ${formatRp(c.finance.landAllowance)}).`);
      setSpec({ family: c.family, frontage: c.frontage });
      setPreviewId(null);
      setAppliedNote(`Applied ${dispName(c)}: previous working version kept for Undo.`);
      setStatus(`Applied ${dispName(c)}. Previous working version kept for Undo.`);
      setLastDelta(null);
    });
  };

  const doUndo = () => {
    const r = undo(hist, snap());
    if (!r.snap) return;
    setHist(r.hist);
    restore(r.snap);
    // A lot draft addresses parcel indices: the restored layout may renumber
    // them, so an open draft never survives Undo/Redo (committed reshapes do).
    setLotDraft(null);
    setSelectedLot(null);
    setLastDelta(null);
    setAppliedNote('Undone: working version restored.');
    logDecision('undo', 'Undo applied — working version restored (event log itself is append-only).');
    setStatus('Undone. Working version restored.');
  };

  const doRedo = () => {
    const r = redo(hist, snap());
    if (!r.snap) return;
    setHist(r.hist);
    restore(r.snap);
    setLotDraft(null);
    setSelectedLot(null);
    setLastDelta(null);
    setAppliedNote('Redone.');
    logDecision('redo', 'Redo applied (event log itself is append-only).');
    setStatus('Redone.');
  };

  const strFields = (r: Rect): DraftFields => ({
    x: String(r.x), y: String(r.y), w: String(r.w), h: String(r.h),
  });

  const deltaLine = (beforeN: number, beforeRoad: number, beforeAllow: number, afterN: number, afterRoad: number, afterAllow: number) => {
    const dn = afterN - beforeN;
    const dr = Math.round(afterRoad - beforeRoad);
    const da = Math.round((afterAllow - beforeAllow) / M);
    const signedM2 = (v: number) => `${v >= 0 ? '+' : '-'}${Math.abs(v).toLocaleString('en-US')} m²`;
    const signedRp = (v: number) => `${v >= 0 ? '+' : '-'}Rp${Math.abs(v)}m`;
    return `${dn >= 0 ? '+' : ''}${dn} homes · road ${signedM2(dr)} · allowance ${signedRp(da)}`;
  };

  const applyDraft = () => {
    if (regenBlock) {
      setStatus(regenBlock);
      return;
    }
    if (!draftDirty) {
      setStatus('No draft changes to apply.');
      return;
    }
    const done = commitDraft(draft);
    if (!done.committed || !inputsOk) {
      setStatus('Draft invalid — kept the last valid plan.');
      return;
    }
    const committed = done.committed;
    // Snapshot the pre-edit accepted state: Undo must restore the visible
    // plan, not the edited fields. Baseline deltas against committed values,
    // which the draft was previewing against — never against draft numbers.
    const afterSite = siteWithEntrance(siteWithGreen(base, committed), entrance);
    const pro = buildWorking(afterSite, spec);
    askRegen('Applying the open-space edit', pro.parcels, () => {
      const before = committedEcon;
      setHist((h) => pushUndo(h, { ...snap(), greenDraftF: strFields(green) }));
      logDecision('edit', `Moved/resized Open space A to ${committed.w} × ${committed.h} m at (${committed.x}, ${committed.y}).`);
      setGreen(committed);
      setGreenDraftF(strFields(committed));
      if (before) {
        const after = evaluateLayout(afterSite, pro, price * M, financeArgs, editsForLayout(pro.parcels, lotEdits));
        setLastDelta(
          `Last change vs previous: ${deltaLine(before.quantities.n, before.quantities.roadArea, before.finance.landAllowance, after.quantities.n, after.quantities.roadArea, after.finance.landAllowance)}.`,
        );
      }
      setStatus('Committed one change — Undo available.');
    });
  };

  const cancelDraft = () => {
    setGreenDraftF(strFields(green));
    setStatus('Draft discarded — back on the last valid plan.');
  };

  const changeSpec = (next: WorkingSpec) => {
    if (regenBlock) {
      setStatus(regenBlock);
      return;
    }
    const pro = buildWorking(site, next);
    askRegen(`Switching to ${next.family}, ${next.frontage} m frontage`, pro.parcels, () => {
      setHist((h) => pushUndo(h, snap()));
      setSpec(next);
      setLastDelta(null);
      setStatus(`Layout regenerated: ${next.family}, ${next.frontage} m frontage. Undo available.`);
    });
  };

  // Lot reshape draft: explicit Apply/Cancel. The draft starts from the
  // committed shape (reshaped polygon, else generated rect corners) and is
  // validated live; metrics stay on committed geometry until Apply.
  const startLotReshape = () => {
    if (selectedLot == null || !workingLayout.parcels[selectedLot]) {
      setStatus('Select a lot first — click one on the plan or pick it in the list.');
      return;
    }
    if (draftDirty) {
      setStatus('Apply or Cancel the open-space edit first — reshaping runs on the committed plan.');
      return;
    }
    if (preview) {
      setStatus('Leave the preview (Cancel) before reshaping a working-plan lot.');
      return;
    }
    if (lotDraft) {
      setStatus('A lot reshape is already in progress — Apply or Cancel it first.');
      return;
    }
    const rect = workingLayout.parcels[selectedLot];
    const base = lotEdits[lotKey(rect)] ?? rectCorners(rect);
    setLotDraft({ index: selectedLot, pts: base.map((p) => ({ ...p })) });
    clearVertexText();
    setStatus(`Reshaping lot ${selectedLot + 1}: drag corners on the plan or type coordinates, then Apply or Cancel.`);
  };

  const lotDraftErrors: string[] = lotDraft
    ? (() => {
        const committedEdits = editsForLayout(committedLayout.parcels, lotEdits);
        const skip = new Set([...committedEdits.keys()].filter((j) => j !== lotDraft.index));
        const errs = validateLotPoly(committedSite, committedLayout, lotDraft.index, lotDraft.pts, skip);
        if (errs.length > 0) return errs;
        for (const j of skip) {
          const other = committedEdits.get(j);
          if (other && polysOverlap(lotDraft.pts, other)) return [`reshaped lot overlaps reshaped lot ${j + 1}`];
        }
        return [];
      })()
    : [];

  const applyLotEdit = () => {
    if (!lotDraft) {
      setStatus('No lot reshape to apply.');
      return;
    }
    if (lotDraftErrors.length > 0) {
      setStatus(`Reshape invalid — ${lotDraftErrors[0]} Kept the last valid plan.`);
      return;
    }
    const idx = lotDraft.index;
    const pts = lotDraft.pts.map((p) => ({ ...p }));
    const key = lotKey(committedLayout.parcels[idx]);
    setHist((h) => pushUndo(h, snap()));
    setLotEdits((e) => ({ ...e, [key]: pts }));
    setLotDraft(null);
    clearVertexText();
    setLastDelta(null);
    logDecision('lots', `Reshaped lot ${idx + 1} to ${pts.length} corners, ${Math.round(polyArea(pts))} m². The reshape travels with this lot across search and redesign; removing the lot asks first.`);
    setStatus(`Reshaped lot ${idx + 1} committed — Undo available. Reshapes travel with their lots; a change that removes one asks first.`);
  };

  const cancelLotEdit = () => {
    setLotDraft(null);
    clearVertexText();
    setStatus('Reshape discarded — back on the last valid plan.');
  };

  const clearVertexText = (vi?: number) => {
    setLotText((t) => {
      if (vi === undefined) return Object.keys(t).length > 0 ? {} : t;
      const a = `${vi}:x`;
      const b = `${vi}:y`;
      if (!(a in t) && !(b in t)) return t;
      const next = { ...t };
      delete next[a];
      delete next[b];
      return next;
    });
  };

  const lotVertexDrag = (vi: number, pt: Pt) => {
    setLotDraft((d) => (d ? { ...d, pts: d.pts.map((p, k) => (k === vi ? pt : p)) } : d));
    clearVertexText(vi);
  };

  const lotVertexRevert = (orig: Pt[]) => {
    setLotDraft((d) => (d ? { ...d, pts: orig.map((p) => ({ ...p })) } : d));
  };

  const lotVertexAdd = (edgeIdx: number, pt: Pt) => {
    clearVertexText();
    setLotDraft((d) => {
      if (!d || d.pts.length >= MAX_LOT_VERTICES) return d;
      const pts = [...d.pts];
      pts.splice(edgeIdx + 1, 0, pt);
      return { ...d, pts };
    });
  };

  const lotAddCorner = () => {
    clearVertexText();
    setLotDraft((d) => {
      if (!d || d.pts.length >= MAX_LOT_VERTICES) return d;
      let bi = 0;
      let bl = -1;
      d.pts.forEach((a, k) => {
        const b = d.pts[(k + 1) % d.pts.length];
        const l = Math.hypot(b.x - a.x, b.y - a.y);
        if (l > bl) { bl = l; bi = k; }
      });
      const a = d.pts[bi];
      const b = d.pts[(bi + 1) % d.pts.length];
      const pts = [...d.pts];
      pts.splice(bi + 1, 0, { x: Math.round(((a.x + b.x) / 2) * 100) / 100, y: Math.round(((a.y + b.y) / 2) * 100) / 100 });
      return { ...d, pts };
    });
  };

  const lotRemoveVertex = (vi: number) => {
    clearVertexText();
    setLotDraft((d) => (d && d.pts.length > 3 ? { ...d, pts: d.pts.filter((_, k) => k !== vi) } : d));
  };

  const lotSetVertex = (vi: number, x: number, y: number) => {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    lotVertexDrag(vi, { x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 });
  };

  // Vertex text fields hold strings while typing: clearing a field leaves the
  // corner untouched (incomplete, never zero). Commit on blur/Enter; anything
  // unparsable reverts to the draft value.
  const [lotText, setLotText] = useState<Record<string, string>>({});
  const lotTextKey = (vi: number, axis: 'x' | 'y') => `${vi}:${axis}`;
  const commitLotText = (vi: number, axis: 'x' | 'y', raw: string) => {
    setLotText((t) => {
      const next = { ...t };
      delete next[lotTextKey(vi, axis)];
      return next;
    });
    if (!lotDraft || !lotDraft.pts[vi]) return;
    const v = raw.trim() === '' ? NaN : Number(raw);
    if (!Number.isFinite(v)) {
      setStatus('Corner coordinate incomplete — kept the draft value, nothing moved.');
      return;
    }
    const p = lotDraft.pts[vi];
    lotSetVertex(vi, axis === 'x' ? v : p.x, axis === 'y' ? v : p.y);
  };

  const discardLotEdits = () => {
    if (!lotLockActive) {
      setStatus('No manual lot reshapes to discard.');
      return;
    }
    const n = Object.keys(lotEdits).length;
    setHist((h) => pushUndo(h, snap()));
    setLotEdits({});
    setSelectedLot(null);
    setLotDraft(null);
    setLastDelta(null);
    logDecision('lots', `Discarded ${n} manual lot reshape${n === 1 ? '' : 's'} by explicit user action; generated geometry restored.`);
    setStatus(`Discarded ${n} manual lot reshape${n === 1 ? '' : 's'}. Search, circulation, and geometry edits are open again. Undo available.`);
  };

  // Entrance edits commit directly (no draft machine): validation runs first,
  // and every accepted move is one undoable step. Callers pass the
  // pre-edit entrance so Undo restores the visible gate, not the new one.
  const commitEntrance = (next: Entrance, prev: Entrance, label: string) => {
    const revert = () => {
      setEntrance({ ...prev });
      setEntranceS(String(prev.offset));
    };
    if (regenBlock) {
      revert();
      setStatus(regenBlock);
      return;
    }
    const errs = entranceErrors(siteWithEntrance(base, next));
    if (errs.length > 0) {
      revert();
      setStatus(`Entrance change rejected — ${errs[0]} Kept the last valid plan.`);
      return;
    }
    const proSite = siteWithEntrance(siteWithGreen(base, green), next);
    const pro = buildWorking(proSite, spec);
    // F01: a gate the road network cannot reach is never committed, so no
    // precise economics can ever attach to a disconnected scheme.
    const proErrors = validateLayout(proSite, pro, editsForLayout(pro.parcels, lotEdits));
    if (proErrors.length > 0) {
      revert();
      setStatus(`Entrance change rejected — ${proErrors[0]} Kept the last connected plan. Move the gate back onto the road network.`);
      return;
    }
    askRegen(
      `Moving the entrance (${label})`,
      pro.parcels,
      () => {
        setHist((h) => pushUndo(h, { ...snap(), entrance: { ...prev } }));
        setEntrance({ ...next });
        setEntranceS(String(next.offset));
        setLastDelta(null);
        logDecision('edit', `Moved compound entrance: ${label}.`);
        setStatus(`Entrance ${label}. Undo available.`);
      },
      revert,
    );
  };

  const entranceLabel = (e: Entrance) => `${e.edge} edge, ${e.offset} m from south, ${e.width} m wide`;

  const changeProfile = (id: string) => {
    setHist((h) => pushUndo(h, snap()));
    setProfileId(id);
    setLastDelta(null);
    setStatus(`Profile switched. Undo available.`);
  };

  const preview = !stale && previewId ? (run?.candidates.find((c) => c.id === previewId) ?? null) : null;
  const workingKeys = useMemo(() => new Set(workingLayout.parcels.map(parcelKey)), [workingLayout]);
  const cards = run ? selectUpToThree(run.candidates, ordering) : [];
  const previewEcon = preview
    ? { q: preview.quantities, road: preview.roadCost, cnl: preview.costNonLand, fin: preview.finance }
    : null;
  const econShown = previewEcon ?? (workingEcon
    ? { q: workingEcon.quantities, road: workingEcon.roadCost, cnl: workingEcon.costNonLand, fin: workingEcon.finance }
    : null);
  const metricsAreCommitted = !preview && draftDirty && !draftEcon && econShown !== null;
  // Preview geometry rebuilds on the run's own snapshot green, never on a
  // later dirty draft: canvas and frozen preview economics cannot disagree.
  const previewSite = preview && runSnap
    ? siteWithEntrance(siteWithGreen(base, runSnap.green), runSnap.entrance)
    : site;
  const planShown = preview
    ? preview.family === 'spine'
      ? generateSpine(previewSite, preview.frontage)
      : generateLoop(previewSite, preview.frontage)
    : workingLayout;

  const R = RATES;
  const homeCost = econShown ? econShown.q.n * R.homeBuiltArea * R.constructionPerM2 : 0;
  const greenCost = econShown ? econShown.q.greenArea * R.greenWorksPerM2 : 0;
  const revenue = econShown?.fin.revenue ?? 0;
  const sellCost = revenue * R.sellFraction;
  // Issues and the summary derive from the same validation state: geometry,
  // economics inputs, ceiling, and search blockers together.
  const inputIssues: string[] = [];
  if (!Number.isFinite(price) || price <= 0) inputIssues.push('Assumed selling price is missing or not positive.');
  if (!Number.isFinite(ceiling) || ceiling <= 0) inputIssues.push('Buyer-price ceiling is missing or not positive.');
  if (!Number.isFinite(ownerL) || ownerL < 0) inputIssues.push('Owner expectation is missing or negative.');
  if (!Number.isFinite(targetT) || targetT < 0 || targetT >= 100) {
    inputIssues.push('Target surplus/revenue must be between 0 and 100.');
  }
  if (priceError) inputIssues.push(priceError);
  const issueCount = workingErrors.length + workingWarnings.length + inputIssues.length + (run?.blockers.length ?? 0);

  // Assistant context: selection-bound measured facts, a bounded try
  // scope, and the canonical snapshot the tool server validates. Figures
  // come from the displayed economics only; nothing is recomputed here.
  const assistantFacts: PlanFacts = (() => {
    const fin = econShown && inputsOk ? {
      revenue: econShown.fin.revenue,
      costNonLand: econShown.cnl,
      landAllowance: econShown.fin.landAllowance,
      ownerGap: econShown.fin.ownerGap,
      surplus: econShown.fin.surplus,
      price, ceiling, owner: ownerL, target: targetT,
    } : null;
    const q = econShown?.q ?? deriveQuantities(committedSite, committedLayout, editsForLayout(committedLayout.parcels, lotEdits));
    const label =
      selected === 'grove' ? 'Open space A'
        : selected === 'site' ? 'Site'
          : selected === 'circulation' ? 'Circulation'
            : selected === 'homes'
              ? (selectedLot != null ? `Lot ${selectedLot + 1}` : 'Homes')
              : 'Working plan';
    const measurements: string[] = [];
    if (selected === 'grove') {
      measurements.push(
        `${green.w} × ${green.h} m at ${green.x} m from west, ${green.y} m from south — ${greenLocked ? 'Locked (shape and location held)' : 'Unlocked (editable directly; held in place during search)'}`,
      );
    } else if (selected === 'site') {
      measurements.push(`${formatM2(siteArea(baseSpec))} site; ${siteBoundary(baseSpec).length} boundary vertices; ${baseSpec.w} × ${baseSpec.h} m coordinate extents`);
      measurements.push(`Compound entrance: ${entranceLabel(entrance)}`);
    } else if (selected === 'circulation') {
      measurements.push(`${spec.family === 'spine' ? 'Spine' : 'Loop'}, ${spec.frontage} m lot frontage, 6 m road width`);
    } else if (selected === 'homes' && selectedLot != null && workingLayout.parcels[selectedLot]) {
      const rect = workingLayout.parcels[selectedLot];
      const edit = lotEdits[lotKey(rect)];
      const area = edit ? polyArea(edit) : rect.w * rect.h;
      measurements.push(
        edit
          ? `Reshaped polygon, ${edit.length} corners, ${Math.round(area)} m²`
          : `Generated rectangle ${rect.w} × ${rect.h} m, ${Math.round(area)} m²`,
      );
      measurements.push(`Profile ${profile.name}: lots ${profile.lotAreaMin}–${profile.lotAreaMax} m², frontage ≥ ${profile.frontageMin} m`);
    } else {
      measurements.push(`${formatM2(siteArea(baseSpec))} site, ${spec.family}, ${spec.frontage} m frontage`);
    }
    if (preview) measurements.push(`Previewing ${dispName(preview)} — changes not applied.`);
    const commitments = [
      greenLocked ? 'Open space A shape+location locked' : 'Open space A unlocked — direct edits allowed, held in place during search',
      Number.isFinite(ceiling) && ceiling > 0
        ? `Assumed price held at or below the Rp${ceiling}m/home ceiling`
        : 'No buyer-price ceiling set',
    ];
    return {
      label,
      kind: selected ?? 'working',
      measurements,
      quantities: { ...q },
      finance: fin,
      validity: { errors: [...workingErrors], warnings: [...workingWarnings] },
      commitments,
      provenance: !isCustomSite
        ? 'Cedar Market sample — fictional prices'
        : 'Custom confirmed boundary; generated entrance and open space are assumed — review. Sample pricing is illustrative, not evidence.',
    };
  })();

  const assistantTry: TryContext = {
    selectionLabel: assistantFacts.label,
    locksHeld: [...assistantFacts.commitments],
    gridScope: `spine, loop × ${GRID.frontages.join(', ')} m frontages, seed 7, budget 250`,
    uncertainties: [
      'Whether any tested combo keeps the current home count at the capped price',
      'Whether wider lots pay for their extra road cost',
    ],
    requestText: request,
  };

  const assistantSnapshot = (): ScenarioSnapshot => ({
    version: baseSpec.boundary ? 2 : 1,
    site: { ...baseSpec },
    entrance: { ...entrance },
    green: { ...green },
    greenLocked,
    lots: copyLotEdits(lotEdits),
    spec: { ...spec },
    profileId: profileId === 'starter-150' ? 'starter-150' : 'family-200',
    assumptions: { price: price * M, ceiling: ceiling * M, owner: ownerL * BN, target: targetT / 100 },
    provenance: { sample: !isCustomSite ? 'cedar' : 'custom', photo: false },
    capabilities: [...CAPABILITIES],
    selected: selected === 'grove' ? { kind: 'green', id: 'grove-a' }
      : selected === 'site' ? { kind: 'site', id: 'site' }
        : selected === 'circulation' ? { kind: 'circulation', id: 'circulation' }
          : selected === 'homes' ? { kind: 'homes', id: selectedLot != null ? `lot-${selectedLot}` : 'homes' }
            : null,
  });

  // Assistant version binding: every answer (facts, hypothesis, server
  // comparison) belongs to exactly this scenario + comparison version. Any
  // relevant edit changes the key and the panel clears itself; delayed
  // responses against an older key are discarded, never shown.
  const assistantKey = JSON.stringify({
    spec, green, greenDraftF, entrance, lots: lotEdits, boundaryDraft,
    priceS, ceilingS, ownerS, targetS, profileId, baseSpec,
    selected, selectedLot, preview: previewId,
    run: run ? { tested: run.tested, hash: run.snapshotHash } : null,
  });

  const selectFromCanvas = (kind: Exclude<Sel, null>) => setSelected(kind);

  return (
    <div className={cmpExpand ? "bench compare-focused" : "bench"} onKeyDown={(e) => {
      const tag = (e.target as HTMLElement).tagName;
      if (e.key === 'Escape' && boundaryDraft) { e.stopPropagation(); cancelBoundary(); return; }
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
      if ((e.ctrlKey || e.metaKey) && ['z', 'y'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        if (boundaryDraft) { undoBoundary(e.key.toLowerCase() === 'y' || e.shiftKey); return; }
        if (e.key.toLowerCase() === 'y' || e.shiftKey) doRedo(); else doUndo();
      } else if (e.key.toLowerCase() === 'v') setTool('select');
      else if (e.key.toLowerCase() === 'h') setTool('pan');
    }}>
      <a className="skiplink" href="#canvascol">
        Skip to plan
      </a>
      <header className="topbar">
        <div className="brand">
          <strong>UNBUILT</strong>
          <span className="note">{isCustomSite ? 'Custom site · illustrative prices' : 'Cedar Market · fictional prices'}</span>
        </div>
        <div className="workstate" aria-live="polite">
          {preview ? `Previewing ${dispName(preview)}` : 'Working plan'}
        </div>
        <div className="topactions" role="toolbar" aria-label="Edit history">
          <button type="button" onClick={() => boundaryDraft ? undoBoundary() : doUndo()} disabled={boundaryDraft ? boundaryHistory.past.length === 0 : hist.past.length === 0}>Undo</button>
          <button type="button" onClick={() => boundaryDraft ? undoBoundary(true) : doRedo()} disabled={boundaryDraft ? boundaryHistory.future.length === 0 : hist.future.length === 0}>Redo</button>
          <span className="badge modeloff" title="Typed requests are parsed in the browser by fixed rules (no model, no network). Search tests the fixed family × frontage grid only. Supported: keep open space, cap price, switch profile, run search. The tool server adds validated server-side search and measured explanations when reachable.">
            {serverOk === null
              ? 'Local tools · checking server…'
              : serverOk
                ? 'Local tools · server online · no model'
                : 'Local tools · server offline · no model'}
          </span>
        </div>
      </header>
      <div className="contextstrip" aria-live="polite">
        <span>{formatM2(siteArea(baseSpec))} · {siteBoundary(baseSpec).length} vertices · Entrance {entrance.edge} · {spec.family} {spec.frontage} m</span>
        <span>Selected: {assistantFacts.label}</span>
        <span title={workingErrors[0]} className={workingErrors.length > 0 ? 'bad' : 'ok'}>{workingLayout.supportError ? 'Layout unavailable' : workingErrors.length > 0 ? 'Invalid plan · see issues' : 'Plan valid'}</span>
        <span className="savestatus" title={saveStatus}>{saveStatus.startsWith('Project saved') ? 'Saved in this browser' : saveStatus}</span>
      </div>
      <p role="status" aria-live="polite" className="note srstatus">
        {status}
      </p>
      {pendingOp && (
        <div className="verdict stale" role="alert">
          <p>
            <strong>{pendingOp.label}</strong> would remove {conflictNames(pendingOp.conflicts)}.
            Reshapes carry only where their lots survive — continuing discards the listed
            reshape(s), never silently. Undo restores everything.
          </p>
          <button type="button" onClick={continuePendingOp}>
            Continue without {pendingOp.conflicts.length === 1 ? 'it' : 'them'}
          </button>{' '}
          <button type="button" onClick={cancelPendingOp}>Cancel</button>
        </div>
      )}

      <div className={`${planWide ? 'mid wide' : 'mid'}${controlsOpen ? '' : ' controls-closed'}`}>

        <nav
          className="toolrail"
          aria-label="Plan tools"
          onKeyDown={(e) => {
            const tag = (e.target as HTMLElement | null)?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
            if (e.key === 'v' || e.key === 'V') setTool('select');
            else if (e.key === 'h' || e.key === 'H') setTool('pan');
            else if (e.key === 'Escape') {
              setCancelTick((t) => t + 1);
              if (boundaryDraft) cancelBoundary();
              else if (lotDraft) cancelLotEdit();
              else if (draftDirty) cancelDraft();
              else setSelected(null);
            }
          }}
        >
          <button
            type="button"
            aria-pressed={tool === 'select'}
            aria-label="Select (V)"
            title="Select and edit geometry (V)"
            className={tool === 'select' ? 'tool on' : 'tool'}
            onClick={() => setTool('select')}
          >
            <SelectIcon />
            <span>Select</span>
          </button>
          <button
            type="button"
            aria-pressed={tool === 'pan'}
            aria-label="Pan (H)"
            title="Pan: every drag moves the view; clicks still select (H)"
            className={tool === 'pan' ? 'tool on' : 'tool'}
            onClick={() => setTool('pan')}
          >
            <PanIcon />
            <span>Pan</span>
          </button>
          <button type="button" className="tool" title="Draw a new site boundary" onClick={() => startBoundary(true)}><SiteIcon /><span>Draw site</span></button>
          <button type="button" className="tool" title="Select the site" onClick={() => { setSelected('site'); setControlsOpen(true); }}><SiteIcon /><span>Site</span></button>
        </nav>

        <main className="canvascol" id="canvascol">
          <div className="controlstoggle">
            <button type="button" onClick={() => setControlsOpen((v) => !v)} aria-expanded={controlsOpen}>
              {controlsOpen ? 'Hide controls' : 'Show controls'}
            </button>
          </div>
          <PlanCanvas
            layout={planShown}
            boundary={siteBoundary(baseSpec)}
            boundaryDraft={boundaryDraft}
            onBoundaryChange={changeBoundary}
            onBoundaryApply={applyBoundary}
            onBoundaryGestureCommit={(pts) => { if (boundaryDraft) setBoundaryHistory((h) => pushUndo(h, { ...boundaryDraft, pts })); }}
            onBoundaryCancel={cancelBoundary}
            siteW={site.w}
            siteH={site.h}
            entrance={site.entrance}
            greenLocked={greenLocked}
            greenSelected={greenSelected}
            editing={greenSelected && !greenLocked && lotDraft === null}
            entranceEditing={selected === 'site'}
            entranceValid={entranceErrors(site).length === 0}
            onSelectEntrance={() => setSelected('site')}
            onEntranceDrag={(offset) => {
              setEntrance((e) => ({ ...e, offset }));
              setEntranceS(String(offset));
            }}
            onEntranceCommit={(orig) => commitEntrance({ ...entrance }, orig, `moved to ${entranceLabel(entrance)}`)}
            onEntranceCancel={(orig) => {
              setEntrance({ ...orig });
              setEntranceS(String(orig.offset));
              setStatus('Entrance move cancelled — back on the last valid plan.');
            }}
            draftActive={draftDirty}
            draftValid={draft.draftable && layoutErrors.length === 0}
            workingKeys={preview && showPrev ? workingKeys : null}
            vsNote={
              preview && runSnap
                ? `${preview.quantities.n - runSnap.n >= 0 ? '+' : ''}${preview.quantities.n - runSnap.n} homes, road ${preview.quantities.roadArea <= runSnap.road ? '-' : '+'}${Math.abs(Math.round(preview.quantities.roadArea - runSnap.road)).toLocaleString('en-US')} m²`
                : null
            }
            selectedKind={selected === 'circulation' ? 'circulation' : selected === 'homes' ? 'homes' : null}
            siteSelected={selected === 'site'}
            onSelectSite={() => setSelected('site')}
            onSelectGreen={() => setSelected('grove')}
            onSelectLot={(i) => { setSelected('homes'); setSelectedLot(i); }}
            lotEdits={preview ? preview.lots : lotsByIndex}
            selectedLot={selectedLot}
            lotDraft={lotDraft}
            lotDraftValid={lotDraftErrors.length === 0}
            onLotVertexDrag={lotVertexDrag}
            onLotVertexRevert={lotVertexRevert}
            onLotVertexAdd={lotVertexAdd}
            onLotVertexRemove={lotRemoveVertex}
            onFixedHint={() => setStatus('Homes are generated and fixed — they cannot be dragged. Drag the background to pan, reshape the lot to change its outline, or switch circulation for a new arrangement.')}
            onSelectKind={selectFromCanvas}
            onDeselect={() => {
              if (draftDirty) cancelDraft();
              else setSelected(null);
            }}
            onDraftChange={(r) => touchDraft(strFields(r))}
            onDraftCommit={() => {
              if (!draft.draftable || layoutErrors.length > 0) {
                setGreenDraftF(strFields(green));
                setStatus('Invalid position — kept the last valid plan.');
                return;
              }
              applyDraft();
            }}
            backdrop={refImage && showBackdrop ? refImage : null}
            panTool={tool === 'pan'}
            wide={planWide}
            onToggleWide={() => setPlanWide((v) => !v)}
            fitTick={siteFit}
            cancelTick={cancelTick}
            onEscapeIdle={() => {
              setCancelTick((t) => t + 1);
              if (boundaryDraft) cancelBoundary();
              else if (lotDraft) cancelLotEdit();
              else if (draftDirty) cancelDraft();
              else setSelected(null);
            }}
          />
          {preview && (
            <div className="previewbar">
              <span>Previewing {dispName(preview)} — changes not applied.</span>
              <label>
                <input type="checkbox" checked={showPrev} onChange={(e) => setShowPrev(e.target.checked)} />
                Show previous layout
              </label>
              <button type="button" disabled={draftDirty} title={draftDirty ? 'Apply or Cancel the green edit first' : undefined} onClick={() => applyCandidate(preview)}>Apply {dispName(preview)}</button>
              <button type="button" onClick={() => setDockOpen(true)}>Show options</button>
              <button type="button" onClick={() => { setPreviewId(null); setStatus('Back on the working plan.'); }}>
                Cancel
              </button>
            </div>
          )}
          {econShown && !boundaryDraft && (
<p className="minisummary" aria-live="polite">
              <button type="button" className="strip_toggle" onClick={() => setDockOpen((v) => !v)}>{dockOpen ? 'Hide details' : 'Details'}</button>
              <span><strong>{econShown.q.n}</strong> homes</span>
              <span>Green <strong>{formatM2(econShown.q.greenArea)}</strong></span>
              <span>Road <strong>{formatM2(econShown.q.roadArea)}</strong></span>
              <span>Allowance <strong>{formatRp(econShown.fin.landAllowance)}</strong></span>
              <span><strong>{formatGap(econShown.fin.ownerGap)}</strong></span>
              {workingErrors.length > 0 && (
                <span role="alert" className="error">Invalid plan — resolve Issues.</span>
              )}
            </p>
          )}
          {draftDirty && draft.draftable && layoutErrors.length === 0 && (
            <p className="note draftbadge">Preview — changes not applied. Apply or Cancel in the Open space inspector.</p>
          )}
          {workingErrors.length > 0 && (
            <div className="error" role="alert">
              <strong>Geometry needs attention before results can be trusted:</strong>
              <ul>
                {workingErrors.slice(0, 4).map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}
          {workingErrors.length === 0 && workingWarnings.length > 0 && (
            <div className="verdict stale" role="alert">
              <ul>
                {workingWarnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

        </main>

        <aside
          className="inspector-col"
          aria-label="Objects and inspector"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setCancelTick((t) => t + 1);
              if (boundaryDraft) cancelBoundary();
              else if (lotDraft) cancelLotEdit();
              else if (draftDirty) cancelDraft();
              else setSelected(null);
            }
          }}
        >
          {boundaryDraft ? <BoundaryEditor draft={boundaryDraft} onChange={changeBoundary} onApply={applyBoundary} onCancel={cancelBoundary} /> : <>
          <div className="site-actions"><button type="button" onClick={() => startBoundary(true)}>Draw site</button><button type="button" onClick={() => startBoundary(false)}>Edit boundary</button></div>
          <details className="sitesrc">
            <summary>Site source: {!isCustomSite ? 'Cedar Market sample' : 'Custom site'} ({baseSpec.w} × {baseSpec.h} m)</summary>
          <p className="note">
            {!isCustomSite
              ? 'Cedar Market sample (120 × 100 m).'
              : `Custom site (${baseSpec.w} × ${baseSpec.h} m) from a confirmed boundary.`}
          </p>
          <label>
            Reference photo (PNG/JPEG, illustration only)
            <input
              type="file"
              accept="image/png,image/jpeg"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                if (!f) return;
                onPhotoFile(f);
              }}
            />
          </label>
          {photoError && (
            <p role="alert" className="error">{photoError}</p>
          )}
          {refImage && (
            <>
              <label>
                <input type="checkbox" checked={showBackdrop} onChange={(e) => setShowBackdrop(e.target.checked)} />
                Show photo behind the plan (reference only)
              </label>
              <div className="draftrow">
                <button
                  type="button"
                  onClick={() => {
                    URL.revokeObjectURL(refImage);
                    setRefImage(null);
                    logDecision('photo', 'Reference photo removed by the user. Removal is immediate and cannot be undone.');
                    setStatus('Reference photo removed. Removal is immediate and cannot be undone.');
                  }}
                >
                  Remove photo
                </button>
              </div>
              <p className="note">Confirming dimensions keeps the photo: it illustrates only, never measures. Removal is immediate and cannot be undone.</p>
            </>
          )}
          <details>
            <summary><strong>Boundary + scale (meters, confirmed)</strong></summary>
            <div className="formgrid">
              <label>
                Width (m)
                <input type="number" value={siteW} min={1} onChange={(e) => setSiteW(e.target.value)} aria-describedby="site-field-errors" />
              </label>
              <label>
                Depth (m)
                <input type="number" value={siteH} min={1} onChange={(e) => setSiteH(e.target.value)} aria-describedby="site-field-errors" />
              </label>
            </div>
            {siteW.trim() !== '' && siteH.trim() !== '' && siteSizeErrors(Number(siteW), Number(siteH)).length > 0 && (
              <p id="site-field-errors" role="alert" className="error">
                {siteSizeErrors(Number(siteW), Number(siteH)).join(' ')} Adjust the numbers above, then confirm again.
              </p>
            )}
            <p className="note">
              A photo never sets dimensions. These numbers are the modeled boundary; this
              increment supports sites from 120 × 100 m.
            </p>
            <button type="button" onClick={useSite}>Use this site</button>
          </details>
          </details>

          <div className="inspector" aria-live="polite">
          <h2>Objects</h2>
          <ul
            role="listbox"
            aria-label="Selectable objects (arrow keys move, Escape clears)"
            className="objlist"
            onKeyDown={(e) => {
              const order: Sel[] = ['site', 'grove', 'circulation', 'homes'];
              const ix = selected === null ? -1 : order.indexOf(selected);
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelected(order[(ix + 1 + order.length) % order.length]);
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelected(order[(ix - 1 + order.length) % order.length]);
              } else if (e.key === 'Escape') {
                e.stopPropagation();
                setCancelTick((t) => t + 1);
                if (boundaryDraft) cancelBoundary();
              else if (lotDraft) cancelLotEdit();
                else if (draftDirty) cancelDraft();
                else setSelected(null);
              }
            }}
          >
            <li role="option" aria-selected={selected === 'site'}>
              <button type="button" onClick={() => setSelected(selected === 'site' ? null : 'site')}><SiteIcon size={18} /><span>Site</span></button>
            </li>
            <li role="option" aria-selected={greenSelected}>
              <button type="button" onClick={() => setSelected(greenSelected ? null : 'grove')}>
                <OpenSpaceIcon size={18} /><span>Open space A{greenSelected ? ' (selected)' : ''}</span>
              </button>
            </li>
            <li role="option" aria-selected={selected === 'circulation'}>
              <button type="button" onClick={() => setSelected(selected === 'circulation' ? null : 'circulation')}><CirculationIcon size={18} /><span>Circulation</span></button>
            </li>
            <li role="option" aria-selected={selected === 'homes'}>
              <button type="button" onClick={() => setSelected(selected === 'homes' ? null : 'homes')}><HomesIcon size={18} /><span>Homes</span></button>
            </li>
          </ul>

            {selected === null && (
              <>
                <h3>Site summary</h3>
                <p className="note">{baseSpec.w} × {baseSpec.h} m coordinate extents ({siteArea(baseSpec).toLocaleString('en-US')} m²), entrance {entrance.edge}.</p>
              </>
            )}
            {selected === 'site' && (
              <>
                <h3>Site</h3>
                <ul>
                  <li>Coordinate extents {baseSpec.w} × {baseSpec.h} m, area {siteArea(baseSpec).toLocaleString('en-US')} m² (closed boundary, {siteBoundary(baseSpec).length} vertices)</li>
                  <li>{!isCustomSite ? 'Sample provenance: fictional Cedar Market case' : 'Custom site from a confirmed boundary (fictional economics)'}</li>
                </ul>
                <h3>Compound entrance{isCustomSite ? ' (assumed — review)' : ''}</h3>
                {isCustomSite && (
                  <p className="note">Generated for this custom boundary — not a confirmed observation. Review the edge and position before relying on access.</p>
                )}
                <div className="designgroup" role="group" aria-label="Entrance edge">
                  {(['west', 'east'] as const).map((edge) => (
                    <button
                      key={edge}
                      type="button"
                      aria-pressed={entrance.edge === edge}
                      className={entrance.edge === edge ? 'seg on' : 'seg'}
                      onClick={() => commitEntrance({ ...entrance, edge }, entrance, `moved to ${entranceLabel({ ...entrance, edge })}`)}
                    >
                      {edge === 'west' ? 'West' : 'East'}
                    </button>
                  ))}
                </div>
                <label>
                  Distance from south (m)
                  <input
                    type="number"
                    value={entranceS}
                    min={0}
                    onChange={(e) => setEntranceS(e.target.value)}
                    onFocus={(e) => { (e.target as HTMLInputElement).dataset.before = e.target.value; }}
                    onBlur={(e) => {
                      const before = (e.target as HTMLInputElement).dataset.before ?? String(entrance.offset);
                      if (e.target.value === before) return;
                      const v = e.target.value.trim() === '' ? NaN : Number(e.target.value);
                      if (!Number.isFinite(v)) {
                        setEntranceS(String(entrance.offset));
                        setStatus('Entrance change rejected — enter a distance in meters. Kept the last valid plan.');
                        return;
                      }
                      commitEntrance({ ...entrance, offset: v }, entrance, `moved to ${entranceLabel({ ...entrance, offset: v })}`);
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                  />
                </label>
                <ul>
                  <li>Gate width 8 m, fixed in this increment</li>
                  <li>Drag the gate marker on the plan to move it along its edge</li>
                </ul>
              </>
            )}
            {selected === 'grove' && (
              <>
                <h3>Open space A{isCustomSite ? ' (assumed — review)' : ''}</h3>
                {isCustomSite && (
                  <p className="note">Generated placeholder for this custom boundary — not a surveyed space. Confirm its position and size on the ground.</p>
                )}
                <p className="note">
                  {formatM2(green.w * green.h)} at {green.x} m from west, {green.y} m from south —
                  {greenLocked ? ' Locked' : ' Editable manually — held in place during search'}
                  <button
                  type="button"
                  onClick={() => {
                    setHist((h) => pushUndo(h, snap()));
                    setGreenLocked((v) => !v);
                    setLastDelta(null);
                  }}
                >
                  {greenLocked ? 'Unlock to edit' : 'Lock'}
                </button>
                </p>
                <details>
                  <summary>Width, depth, position (meters){greenLocked ? ' — unlock to edit' : ''}</summary>
                  <div className="formgrid">
                    {(['x', 'y', 'w', 'h'] as const).map((k) => (
                      <label key={k}>
                        {k === 'x' ? 'Distance from west' : k === 'y' ? 'Distance from south' : k === 'w' ? 'Width' : 'Depth'}
                        <input
                          type="number"
                          value={greenDraftF[k]}
                          disabled={greenLocked || lotDraft !== null}
                          title={lotDraft ? (regenBlock ?? undefined) : undefined}
                          onChange={(e) => touchDraft({ ...greenDraftF, [k]: e.target.value })}
                        />
                      </label>
                    ))}
                  </div>
                  {draftDirty && (
                    <div className="draftrow">
                      <button type="button" onClick={applyDraft} disabled={!draft.draftable}>
                        Apply draft
                      </button>
                      <button type="button" onClick={cancelDraft}>
                        Cancel
                      </button>
                    </div>
                  )}
                </details>
              </>
            )}
            {selected === 'circulation' && (
              <>
                <h3>Circulation</h3>
                <div className="designgroup" role="group" aria-label="Circulation family">
                  <button
                    type="button"
                    aria-pressed={spec.family === 'spine'}
                    className={spec.family === 'spine' ? 'seg on' : 'seg'}
                    disabled={draftDirty}
                    title={draftDirty ? 'Apply or Cancel the green edit first' : undefined}
                    onClick={() => changeSpec({ ...spec, family: 'spine' })}
                  >
                    Spine
                  </button>
                  <button
                    type="button"
                    aria-pressed={spec.family === 'loop'}
                    className={spec.family === 'loop' ? 'seg on' : 'seg'}
                    disabled={draftDirty}
                    title={draftDirty ? 'Apply or Cancel the green edit first' : undefined}
                    onClick={() => changeSpec({ ...spec, family: 'loop' })}
                  >
                    Loop
                  </button>
                </div>
                <ul>
                  <li>Measured road area {econShown ? formatM2(econShown.q.roadArea) : '—'}</li>
                  <li>Road width 6 m, fixed in this increment</li>
                </ul>
              </>
            )}
            {selected === 'homes' && (
              <>
                <h3>Homes</h3>
                <label>
                  Product profile
                  <select value={profileId} disabled={draftDirty} onChange={(e) => changeProfile(e.target.value)}>
                    <option value="family-200">Family 200 (fictional)</option>
                    <option value="starter-150">Starter 150 (fictional)</option>
                  </select>
                </label>
                <label>
                  Lot frontage (m)
                  <select value={spec.frontage} disabled={draftDirty} onChange={(e) => changeSpec({ ...spec, frontage: Number(e.target.value) })}>
                    {[9, 10, 11, 12].map((f) => (
                      <option key={f} value={f}>{f} m</option>
                    ))}
                  </select>
                </label>
                <ul>
                  <li>{econShown ? econShown.q.n : '—'} valid homes in the working plan</li>
                  <li>Lots {profile.lotAreaMin}–{profile.lotAreaMax} m², frontage ≥ {profile.frontageMin} m</li>
                  <li>Individual homes never move; lot outlines can be reshaped below</li>
                </ul>
                <h3>Individual lots</h3>
                <label>
                  Lot
                  <select
                    aria-label="Lot"
                    value={selectedLot ?? ''}
                    onChange={(e) => setSelectedLot(e.target.value === '' ? null : Number(e.target.value))}
                  >
                    <option value="">Choose…</option>
                    {workingLayout.parcels.map((p, i) => (
                      <option key={i} value={i}>
                        Lot {i + 1}{lotEdits[lotKey(p)] ? ' (reshaped)' : ''}
                      </option>
                    ))}
                  </select>
                </label>
                {selectedLot != null && workingLayout.parcels[selectedLot] && (() => {
                  const i = selectedLot;
                  const rect = workingLayout.parcels[i];
                  const edit = lotEdits[lotKey(rect)];
                  const area = edit ? polyArea(edit) : rect.w * rect.h;
                  const front = edit ? lotRoadFrontage(workingLayout.roads, edit) : Math.min(rect.w, rect.h);
                  const inProfile = area >= profile.lotAreaMin && area <= profile.lotAreaMax && front >= profile.frontageMin;
                  return (
                    <ul>
                      <li>
                        Lot {i + 1} of {workingLayout.parcels.length}: {edit ? `reshaped polygon, ${edit.length} corners` : `generated rectangle ${rect.w} × ${rect.h} m`}
                        {', '}{Math.round(area)} m², frontage {front < 10 ? front.toFixed(1) : Math.round(front)} m
                      </li>
                      <li>{inProfile ? 'Fits' : 'Falls outside'} the {profile.name} profile{inProfile ? '' : ' (priced figures provisional)'}</li>
                      {edit && <li>Setbacks verified 2 m all round the placed home; the deeper 3 m front/rear setbacks are not verified for reshaped lots.</li>}
                    </ul>
                  );
                })()}
                {!lotDraft && (
                  <div className="draftrow">
                    <button type="button" onClick={startLotReshape} disabled={selectedLot == null}>
                      Reshape lot
                    </button>
                    {lotLockActive && (
                      <button type="button" onClick={discardLotEdits}>
                        Discard all reshapes
                      </button>
                    )}
                  </div>
                )}
                {!lotDraft && (
                  <p className="note">
                    Reshapes keep the placed home, road access, and clear neighbors — or explain why not.
                    Reshapes travel with their lots across search and redesign; a change that removes a reshaped lot asks before discarding it.
                  </p>
                )}
                {lotDraft && (() => {
                  const d = lotDraft;
                  const lens = d.pts.map((a, k) => {
                    const b = d.pts[(k + 1) % d.pts.length];
                    return Math.hypot(b.x - a.x, b.y - a.y);
                  });
                  return (
                    <>
                      <p className="note">
                        <strong>Reshaping lot {d.index + 1}</strong> — {d.pts.length} corners, {Math.round(polyArea(d.pts))} m².
                        Drag corners on the plan, double-click an edge to add one, double-click a corner to remove it, or type coordinates.
                      </p>
                      <div className="formgrid">
                        {d.pts.map((p, vi) => (
                          <fieldset key={vi}>
                            <legend>Corner {vi + 1} · edge {lens[vi] < 10 ? lens[vi].toFixed(1) : Math.round(lens[vi])} m</legend>
                            <label>
                              X (m from west)
                              <input
                                type="number"
                                value={lotText[lotTextKey(vi, 'x')] ?? String(Math.round(p.x * 100) / 100)}
                                onChange={(e) => setLotText((t) => ({ ...t, [lotTextKey(vi, 'x')]: e.target.value }))}
                                onBlur={(e) => commitLotText(vi, 'x', e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                              />
                            </label>
                            <label>
                              Y (m from south)
                              <input
                                type="number"
                                value={lotText[lotTextKey(vi, 'y')] ?? String(Math.round(p.y * 100) / 100)}
                                onChange={(e) => setLotText((t) => ({ ...t, [lotTextKey(vi, 'y')]: e.target.value }))}
                                onBlur={(e) => commitLotText(vi, 'y', e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                              />
                            </label>
                            <button type="button" disabled={d.pts.length <= 3} onClick={() => lotRemoveVertex(vi)}>
                              Remove corner
                            </button>
                          </fieldset>
                        ))}
                      </div>
                      <div className="draftrow">
                        <button type="button" disabled={d.pts.length >= MAX_LOT_VERTICES} onClick={lotAddCorner}>
                          Add corner (longest edge)
                        </button>
                        <button type="button" onClick={applyLotEdit} disabled={lotDraftErrors.length > 0}>
                          Apply reshape
                        </button>
                        <button type="button" onClick={cancelLotEdit}>
                          Cancel
                        </button>
                      </div>
                      {lotDraftErrors.length > 0 && (
                        <p role="alert" className="error">{lotDraftErrors[0]} Kept the last valid plan.</p>
                      )}
                    </>
                  );
                })()}
              </>
            )}
          </div>

          <div className="askrow">
            <button type="button" onClick={() => setAskOpen((v) => !v)} aria-expanded={askOpen}>
              {askOpen ? 'Close assistant' : `Ask about ${assistantFacts.label}`}
            </button>
          </div>
          {askOpen && (
            <Assistant
              key={assistantKey}
              facts={assistantFacts}
              tryCtx={assistantTry}
              getSnapshot={assistantSnapshot}
              snapshotOk={inputsOk}
              workingSpec={{ ...spec }}
              previewSpec={preview ? { family: preview.family, frontage: preview.frontage } : null}
              onSendRequest={(text) => submitRequest(text)}
            />
          )}

          <div className="instr">
            <label htmlFor="request">What should change?</label>
            <textarea id="request" rows={2} enterKeyHint="go" value={request} onChange={(e) => setRequest(e.target.value)} />
            <button type="button" onClick={() => submitRequest()}>Send</button>
          </div>
          {intent && !acceptedSummary && (
            <div className={`verdict ${intent.kind}`}>
              <p>{intent.text}</p>
              {intent.kind === 'proposal' && proposalStale && (
                <p role="alert" className="error">
                  This proposal was reviewed against earlier assumptions or geometry, which have since changed.
                  Accept is blocked — send the request again for a fresh review.
                </p>
              )}
              {intent.kind === 'proposal' && (
                <div>
                  <button type="button" onClick={acceptProposal} disabled={priceError !== null || !workingOk || draftDirty || proposalStale}>
                    Accept and run
                  </button>{' '}
                  <button type="button" onClick={rejectProposal}>Reject</button>
                </div>
              )}
            </div>
          )}
          {acceptedSummary && (
            <div className="verdict done">
              <p>{acceptedSummary}</p>
              <button
                type="button"
                onClick={() => {
                  setAcceptedSummary(null);
                  setIntent(null);
                }}
              >
                Revise request
              </button>
            </div>
          )}

          <details className="assump">
            <summary>
              <strong>Assumptions</strong>
              <span className="note"> · price Rp{priceS}m · ceiling Rp{ceilingS}m · owner Rp{ownerS}bn · target {targetS}%</span>
            </summary>
            <div className="formgrid">
              <label>
                Assumed selling price (Rp m/home)
                <input
                  type="number" value={priceS} min={1} aria-describedby="price-error"
                  {...assumeField('priceS', priceS, setPriceS)}
                />
              </label>
              <label>
                Buyer-price ceiling (Rp m/home)
                <input type="number" value={ceilingS} min={1} {...assumeField('ceilingS', ceilingS, setCeilingS)} />
              </label>
              <label>
                Owner expectation (Rp bn)
                <input type="number" value={ownerS} min={0} {...assumeField('ownerS', ownerS, setOwnerS)} />
              </label>
              <label>
                Target surplus/revenue (%)
                <input type="number" value={targetS} min={0} max={90} {...assumeField('targetS', targetS, setTargetS)} />
              </label>
            </div>
            <p className="note">
              {profile.source}
              {isCustomSite && ' Sample pricing does not evidence this custom site — treat all economics as illustrative.'}
            </p>
            {priceError && (
              <p id="price-error" role="alert" className="error">{priceError}</p>
            )}
            {!inputsOk && (
              <p role="alert" className="error">
                Economics inputs incomplete — enter a positive selling price and ceiling, and valid owner/target numbers.
              </p>
            )}
          </details>
          </>}
        </aside>
      </div>

      <footer className={cmpExpand ? 'dock expanded' : 'dock'}>
        <div className="docksummary" aria-live="polite">
          <button type="button" className="strip_toggle" onClick={() => { setDockOpen((v) => !v); setCmpExpand(false); }} aria-expanded={dockOpen}>
            {dockOpen ? 'Hide details' : 'Details'}
          </button>
          {econShown && !boundaryDraft ? (
            <>
              <span><strong>{econShown.q.n}</strong> homes</span>
              <span>Green <strong>{formatM2(econShown.q.greenArea)}</strong></span>
              <span>Road <strong>{formatM2(econShown.q.roadArea)}</strong></span>
              <span>Allowance <strong>{formatRp(econShown.fin.landAllowance)}</strong></span>
              <span><strong>{formatGap(econShown.fin.ownerGap)}</strong></span>
              {workingErrors.length > 0 && (
                <span role="alert" className="error">
                  Invalid plan — {workingErrors[0]} Figures describe a scheme that cannot stand; resolve Issues first.
                </span>
              )}
              {metricsAreCommitted && <span className="note">Last valid values — resolve the draft to update.</span>}
              {lastDelta && <span className="note">{lastDelta}</span>}
            </>
          ) : (
            <span>{boundaryDraft ? 'Boundary draft · accepted plan unchanged · Apply or Cancel to finish' : workingLayout.supportError ? `Layout unavailable · ${workingLayout.supportError}` : 'Incomplete — fix the flagged geometry or economics inputs to see metrics.'}</span>
          )}
        </div>
        <div className="docktabs" role="tablist" aria-label="Result details" hidden={!dockOpen}>
          {(['quantities', 'economics', 'options', 'issues', 'record'] as const).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={dockTab === t}
              className={dockTab === t ? 'tab on' : 'tab'}
              onClick={() => { setDockTab(t); setCmpExpand(false); }}
            >
              {t === 'quantities'
                ? 'Quantities'
                : t === 'economics'
                  ? 'Economics'
                  : t === 'options'
                    ? `Options${run && !stale ? ` (${cards.length})` : ''}`
                    : t === 'issues'
                      ? `Issues${issueCount > 0 ? ` (${issueCount})` : ''}`
                      : `Record${decisions.length > 0 ? ` (${decisions.length})` : ''}`}
            </button>
          ))}
        </div>
        <div className="dockpanel" ref={dockPanelRef} hidden={!dockOpen}>
          {dockTab === 'quantities' && econShown && (
            <dl className="kv">
              <dt>Homes (valid footprints)</dt><dd>{econShown.q.n}</dd>
              <dt>Shared green</dt><dd>{formatM2(econShown.q.greenArea)} (drawn region)</dd>
              <dt>Road, intersections counted once</dt><dd>{formatM2(econShown.q.roadArea)}</dd>
              <dt>Parcels</dt><dd>{formatM2(econShown.q.parcelArea)}</dd>
              <dt>Unallocated remainder (not designed open space)</dt><dd>{formatM2(econShown.q.unallocatedArea)}</dd>
            </dl>
          )}
          {dockTab === 'economics' && econShown && (
            <>
            <dl className="kv">
              <dt>Homes × built area</dt><dd>{econShown.q.n} × {R.homeBuiltArea} m² × Rp{R.constructionPerM2 / M}m = {formatRp(homeCost)}</dd>
              <dt>Road area</dt><dd>{formatRp(econShown.road)}</dd>
              <dt>Green works</dt><dd>{formatRp(greenCost)}</dd>
              <dt>Setup + other + contingency + professional</dt><dd>{formatRp(econShown.cnl - homeCost - econShown.road - greenCost)}</dd>
              <dt>Non-land costs</dt><dd>{formatRp(econShown.cnl)}</dd>
              <dt>Revenue (selling costs {formatRp(sellCost)})</dt><dd>{formatRp(revenue)}</dd>
              <dt>Surplus</dt><dd>{formatRp(econShown.fin.surplus)} ({econShown.fin.margin === null ? 'no revenue' : `${(econShown.fin.margin * 100).toFixed(2)}%`})</dd>
              <dt>Land allowance</dt><dd>{formatRp(econShown.fin.landAllowance)}</dd>
              <dt>Owner outcome</dt><dd>{formatGap(econShown.fin.ownerGap)}</dd>
            </dl>
            <ol className="note">
              <li>Revenue {formatRp(econShown.fin.revenue)} minus selling costs, minus non-land costs above, minus the {targetT}% target surplus leaves the <strong>land allowance</strong>: what the land is worth to this scheme before paying the owner.</li>
              <li><strong>Surplus</strong> additionally subtracts the owner's asking price — positive allowance with negative surplus means the scheme works, but not at this asking price.</li>
              <li>Cost bases are fixed defaults (setup/other/contingency/professional allowances in Economics inputs); only the four assumption fields are yours to change.</li>
            </ol>
            </>
          )}
          {(dockTab === 'quantities' || dockTab === 'economics') && !econShown && (
            <p className="note">Nothing to show until geometry and economics inputs are valid.</p>
          )}
          {dockTab === 'options' && (
            <div className="options-content">
              {!run || !runSnap ? (
                <p className="note">No search yet. Send a request above to investigate alternatives.</p>
              ) : stale ? (
                <div className="verdict stale" role="alert">
                  <p>These options were computed under different assumptions and can no longer be previewed or applied.</p>
                  <button type="button" onClick={rerun} disabled={!workingOk}>
                    Run again with current inputs
                  </button>
                </div>
              ) : (
                <>
                  <VerdictLine cards={cards} run={run} profileName={profile.name} ownerBn={ownerL} />
                  <div className="cardrow">
                    <label>
                      Order by
                      <select value={ordering} onChange={(e) => setOrdering(e.target.value as Ordering)}>
                        <option value="lowest-road">Lowest road area</option>
                        <option value="highest-allowance">Highest land allowance</option>
                        <option value="most-homes">Most homes</option>
                      </select>
                    </label>
                  </div>
                  {cards.length === 0 && (
                    <div className="noresult">
                      <h3>No valid option in the tested scope</h3>
                      <p className="note">
                        Tested: {run.tested} combos (spine, loop × frontages {GRID.frontages.join(', ')} m),
                        profile {profile.name}, ceiling Rp{runSnap.ceilingS}m, seed {run.seed}: {run.breakdown.geometryValid} geometrically valid,{' '}
                        {run.breakdown.applicable} fit profile, {run.breakdown.priceOk} within ceiling, {run.breakdown.targetOk} meet target surplus.{' '}
                        Owner expectation is a benchmark, not a constraint.
                        Single-condition counterfactuals not run yet — no claim about what one changed condition would do.
                      </p>
                      <ul>
                        {run.blockers.map((b, i) => (
                          <li key={i}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {cards.length > 0 && cards.length < 3 && (
                    <p className="note">
                      Only {cards.length} distinct option{cards.length === 1 ? '' : 's'} in the tested scope. No third option is fabricated.
                    </p>
                  )}
                  <ul className="optrows">
                    {cards.map((c) => {
                      const isBaseline = c.family === runSnap.spec.family && c.frontage === runSnap.spec.frontage;
                      const twin = cards.find((o) => o.id !== c.id && econKey(o) === econKey(c));
                      return (
                        <li key={c.id} className={previewId === c.id ? 'optrow current' : 'optrow'}>
                          <button
                            type="button"
                            className="optpick"
                            disabled={draftDirty}
                            onClick={() => {
                              const next = previewId === c.id ? null : c.id;
                              setPreviewId(next);
                              if (next) setDockOpen(false);
                              setStatus(next ? `Previewing ${dispName(c)}.` : 'Back on the working plan.');
                            }}
                          >
                            <strong>{isBaseline ? 'Working plan (baseline)' : cardTitle(c, runSnap)}</strong>
                            <span className="note">
                              {dispName(c)} · {c.quantities.n} homes · {formatGap(c.finance.ownerGap)}
                              {twin ? ` · same economics as ${dispName(twin)}` : ''}
                            </span>
                          </button>
                          {!isBaseline && (
                            <button type="button" disabled={draftDirty} onClick={() => applyCandidate(c)}>
                              Apply
                            </button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
              {appliedNote && <p>{appliedNote}</p>}
              {!stale && !draftDirty && cards.length > 0 && (
                <div className="compare">
                  <h3>Compare two plans</h3>
                  <div className="cardrow">
                    <label>
                      Plan A
                      <select aria-label="Plan A" value={cmpA} onChange={(e) => setCmpA(e.target.value)}>
                        <option value="working">Working plan</option>
                        {cards.map((c) => (
                          <option key={c.id} value={c.id}>{dispName(c)}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Plan B
                      <select aria-label="Plan B" value={cmpB} onChange={(e) => setCmpB(e.target.value)}>
                        <option value="">Choose…</option>
                        <option value="working">Working plan</option>
                        {cards.map((c) => (
                          <option key={c.id} value={c.id}>{dispName(c)}</option>
                        ))}
                      </select>
                    </label>
                    <button type="button" onClick={() => setCmpFit((t) => t + 1)}>
                      Fit both
                    </button>
                    <button type="button" onClick={() => { setCmpExpand((v) => !v); if (cmpExpand) setDockOpen(false); }} aria-pressed={cmpExpand}>
                      {cmpExpand ? 'Dock comparison' : 'Expand comparison'}
                    </button>
                  </div>
                  {(() => {
                    const source = (id: string) => {
                      if (id === 'working') {
                        return workingEcon
                          ? { label: 'Working plan', layout: workingLayout, q: workingEcon.quantities, fin: workingEcon.finance, lots: lotsByIndex }
                          : null;
                      }
                      const c = cards.find((o) => o.id === id);
                      return c
                        ? {
                            label: dispName(c),
                            layout: c.family === 'spine' ? generateSpine(site, c.frontage) : generateLoop(site, c.frontage),
                            q: c.quantities,
                            fin: c.finance,
                            lots: c.lots,
                          }
                        : null;
                    };
                    const a = source(cmpA);
                    const b = cmpB === '' ? null : source(cmpB);
                    if (!run || !runSnap) return null;
                    if (!a || (cmpB !== '' && !b)) return null;
                    if (cmpB !== '' && cmpA === cmpB) {
                      return <p className="note">Pick two different plans — A and B are the same snapshot.</p>;
                    }
                    const cmpCanvas = (
                      key: string,
                      s: NonNullable<ReturnType<typeof source>>,
                    ) => (
                      <div key={key}>
                        <p className="note"><strong>{s.label}</strong> — {s.q.n} homes · {formatM2(s.q.roadArea)} road · {formatGap(s.fin.ownerGap)}</p>
                        <PlanCanvas
                          layout={s.layout} boundary={siteBoundary(baseSpec)} siteW={site.w} siteH={site.h} entrance={site.entrance}
                          greenLocked={greenLocked} greenSelected={false} siteSelected={false} editing={false}
                          entranceEditing={false} entranceValid
                          draftActive={false} draftValid
                          workingKeys={null} vsNote={null} backdrop={null} cancelTick={0}
                          selectedKind={null} onSelectSite={() => {}} onSelectGreen={() => {}} onSelectEntrance={() => {}}
                          onEntranceDrag={() => {}} onEntranceCommit={() => {}} onEntranceCancel={() => {}}
                          onSelectLot={() => {}} lotEdits={s.lots} selectedLot={null} lotDraft={null} lotDraftValid
                          onLotVertexDrag={() => {}} onLotVertexRevert={() => {}} onLotVertexAdd={() => {}} onLotVertexRemove={() => {}}
                          onFixedHint={() => {}}
                          onSelectKind={() => {}} onDeselect={() => {}}
                          onDraftChange={() => {}} onDraftCommit={() => {}} onEscapeIdle={() => {}}
                          wide={false} onToggleWide={() => {}} fitTick={cmpFit} fitMode="width"
                        />
                      </div>
                    );
                    return (
                      <>
                        <div className="compare-grid">
                          {cmpCanvas('a', a)}
                          {b && cmpCanvas('b', b)}
                        </div>
                        {!b && <p className="note">Choose a second plan to see deltas.</p>}
                        {b && (
                          <dl className="kv">
                            <dt>Homes ({a.label} → {b.label})</dt>
                            <dd>{a.q.n} → {b.q.n}</dd>
                            <dt>Road area</dt>
                            <dd>{formatM2(a.q.roadArea)} → {formatM2(b.q.roadArea)}</dd>
                            <dt>Shared green (locked, both plans)</dt>
                            <dd>{formatM2(a.q.greenArea)} → {formatM2(b.q.greenArea)}</dd>
                            <dt>Parcel area</dt>
                            <dd>{formatM2(a.q.parcelArea)} → {formatM2(b.q.parcelArea)}</dd>
                            <dt>Unallocated remainder</dt>
                            <dd>{formatM2(a.q.unallocatedArea)} → {formatM2(b.q.unallocatedArea)}</dd>
                            <dt>Land allowance</dt>
                            <dd>{formatRp(a.fin.landAllowance)} → {formatRp(b.fin.landAllowance)}</dd>
                            <dt>Owner outcome</dt>
                            <dd>{formatGap(a.fin.ownerGap)} → {formatGap(b.fin.ownerGap)}</dd>
                          </dl>
                        )}
                        {b && (
                          <p className="note">
                            Both priced at Rp{runSnap.priceS}m/home (ceiling Rp{runSnap.ceilingS}m), {profile.name} profile, seed {run.seed}.{' '}
                            Owner expectation Rp{ownerL}bn is a benchmark, not a constraint.
                          </p>
                        )}
                        <p className="note">Both plans share the same site coordinates. Comparisons are snapshots of this run only — no saved schemes yet.</p>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
          {dockTab === 'record' && (
            <div>
              {decisions.length === 0 ? (
                <p className="note">No decisions recorded yet. Searches, applies, open-space edits, and new sites are recorded here.</p>
              ) : (
                <ul>
                  {decisions.map((d, i) => (
                    <li key={i}>
                      <span className="note">{d.t.slice(0, 19).replace('T', ' ')} · <strong>{d.kind}</strong> — </span>
                      {d.detail}
                    </li>
                  ))}
                </ul>
              )}
              <button type="button" onClick={exportRecord} disabled={decisions.length === 0}>
                Export record (JSON)
              </button>{' '}
              <button type="button" onClick={() => window.print()}>
                Print meeting summary
              </button>
              <p className="note">Print carries the plan, key figures, and the decision list on paper. It is a snapshot, not a live document.</p>
              <p className="note">Export carries geometry, economics, and decisions only — never credentials. Entries are append-only: Undo never rewrites them.</p>
              <p className="note">{saveStatus}</p>
              <p className="note">
                Save contract: the browser keeps the accepted plan, assumptions, reshapes, and the event log on this device only.
                Searches, comparisons, drafts, undo history, and photos never persist — after a reload, regenerate options to continue the decision.
              </p>
              <label>
                Import project JSON (a saved project or an exported decision record — restores the accepted plan; drafts, undo history, and photos do not transfer)
                <input
                  type="file"
                  accept="application/json,.json"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = '';
                    if (f) onImportFile(f);
                  }}
                />
              </label>
              {importError && (
                <p role="alert" className="error">{importError}</p>
              )}
            </div>
          )}
          {dockTab === 'issues' && (
            <div>
              {issueCount === 0 && <p className="note">No open issues. Geometry valid, inputs complete, no blockers.</p>}
              {workingErrors.length > 0 && (
                <>
                  <h3>Geometry / inputs</h3>
                  <ul>
                    {workingErrors.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </>
              )}
              {workingWarnings.length > 0 && (
                <>
                  <h3>Profile warnings</h3>
                  <ul>
                    {workingWarnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </>
              )}
              {inputIssues.length > 0 && (
                <>
                  <h3>Economics inputs</h3>
                  <ul>
                    {inputIssues.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </>
              )}
              {run && run.blockers.length > 0 && (
                <>
                  <h3>Search blockers</h3>
                  <ul>
                    {run.blockers.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
