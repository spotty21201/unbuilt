import { useMemo, useState } from 'react';
import { entranceErrors, generateLoop, generateSpine, lotRoadFrontage, validateLayout } from '../../src/geometry';
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
import { copyLotEdits, formatGap, formatM2, formatRp, lotEditsMap, parcelKey, siteWithEntrance, siteWithGreen } from './unbuilt/ui';
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

function VerdictLine({ cards, run, profileName }: { cards: Candidate[]; run: SearchRun; profileName: string }) {
  const miss = cards.filter((c) => c.finance.ownerGap > 0);
  const commercial =
    cards.length === 0
      ? null
      : miss.length === cards.length
        ? `All shown miss the owner expectation — largest shortfall ${formatRp(Math.max(...miss.map((c) => c.finance.ownerGap)))}. Shortfall observed within the tested ranges only.`
        : miss.length > 0
          ? `${cards.length - miss.length} of ${cards.length} shown meet the owner expectation; the rest miss by up to ${formatRp(Math.max(...miss.map((c) => c.finance.ownerGap)))}.`
          : 'All shown meet the owner expectation.';
  return (
    <p className="note">
      {run.qualified} valid of {run.tested} tested layouts.
      {cards.length > 0 ? ` Every option below is geometrically valid and fits the ${profileName} profile.` : ''}
      {commercial ? ` ${commercial}` : ''}
    </p>
  );
}

export default function App() {
  const [baseSpec, setBaseSpec] = useState({ w: 120, h: 100 });
  const base = useMemo(() => makeSite(baseSpec.w, baseSpec.h), [baseSpec]);
  const isCustomSite = baseSpec.w !== 120 || baseSpec.h !== 100;
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
  const [lotEdits, setLotEdits] = useState<Record<number, Pt[]>>({});
  const lotLockActive = Object.keys(lotEdits).length > 0;
  const lotLockNote = 'Manual lot reshapes exist — regenerating the layout would erase them. Discard the reshapes (Homes inspector) to reopen search, circulation, and geometry edits.';
  // Lot reshape UI state: which generated lot is selected, and the active
  // vertex draft (explicit Apply/Cancel; metrics stay on committed geometry).
  const [selectedLot, setSelectedLot] = useState<number | null>(null);
  const [lotDraft, setLotDraft] = useState<{ index: number; pts: Pt[] } | null>(null);
  // Any layout regeneration is blocked while manual reshapes exist OR a
  // reshape draft is open: indices would shift under the polygons.
  const regenBlock = lotLockActive
    ? lotLockNote
    : lotDraft
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
  const [acceptedSummary, setAcceptedSummary] = useState<string | null>(null);
  const [run, setRun] = useState<SearchRun | null>(null);
  const [runSnap, setRunSnap] = useState<{
    priceS: string; ceilingS: string; ownerS: string; targetS: string;
    profileId: string; green: Rect; entrance: Entrance; spec: WorkingSpec; n: number; road: number;
    lots: Record<number, Pt[]>; baseSpec: { w: number; h: number };
  } | null>(null);
  const [ordering, setOrdering] = useState<Ordering>('lowest-road');
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [showPrev, setShowPrev] = useState(true);
  const [dockTab, setDockTab] = useState<DockTab>('options');
  const [lastDelta, setLastDelta] = useState<string | null>(null);
  // Compare view: any two distinct snapshots side by side — the working
  // plan or any option card from the same run. Same site coordinates in both
  // (guaranteed by the !stale gate); Fit both reframes them together.
  const [cmpA, setCmpA] = useState<string>('working');
  const [cmpB, setCmpB] = useState<string>('');
  const [cmpFit, setCmpFit] = useState(0);
  const [cmpExpand, setCmpExpand] = useState(false);
  const [planWide, setPlanWide] = useState(false);

  const exportRecord = () => {
    // Export v2: a versioned snapshot of the CURRENT ACCEPTED plan (committed
    // geometry, never a pending draft) plus the append-only event log, kept
    // clearly separate. No tokens, credentials, file paths, image bytes, or
    // environment values ever enter this object. A reader can reproduce the
    // plan from state.plan inputs with the deterministic generators, or read
    // the full modeled geometry directly.
    const cedar = baseSpec.w === 120 && baseSpec.h === 100;
    const payload = {
      app: 'UNBUILT decision record',
      exportVersion: 2,
      exportedAt: new Date().toISOString(),
      units: 'Geometry in meters, local Cartesian, y-up from the south edge. Currency in integer Rp.',
      state: {
        site: {
          w: baseSpec.w,
          h: baseSpec.h,
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
          assumedPriceRp: price,
          ceilingRp: ceiling,
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
    logDecision('record', 'Decision record exported (v2 snapshot of the accepted plan + event log).');
    setStatus('Decision record exported as JSON (no credentials included).');
  };
  // Bumped to force-clear any in-progress canvas gesture ref (Escape path).
  const [cancelTick, setCancelTick] = useState(0);
  interface Snapshot {
    spec: WorkingSpec; green: Rect; greenDraftF: DraftFields; entrance: Entrance; profileId: string; greenLocked: boolean;
    lots: Record<number, Pt[]>;
    priceS: string; ceilingS: string; ownerS: string; targetS: string; baseSpec: { w: number; h: number };
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
  const draft = applyDraftEdit(green, greenDraftF, { w: base.w, h: base.h });
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
  const editsMap: LotEdits = useMemo(() => lotEditsMap(lotEdits), [lotEdits]);
  const workingLayout = useMemo(() => buildWorking(site, spec), [site, spec]);
  const layoutErrors = validateLayout(site, workingLayout, editsMap);
  const workingErrors = [...greenErrors, ...entranceErrors(site), ...layoutErrors];
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
  const committedEcon = inputsOk ? evaluateLayout(committedSite, committedLayout, price * M, financeArgs, editsMap) : null;
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
      JSON.stringify(runSnap.lots) !== JSON.stringify(lotEdits) ||
      JSON.stringify(runSnap.spec) !== JSON.stringify(spec) ||
      runSnap.baseSpec.w !== baseSpec.w ||
      runSnap.baseSpec.h !== baseSpec.h);

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
    });
    logDecision(
      'search',
      `Ran bounded search (${prof.id}, price Rp${price}M, ceiling Rp${locks.priceCeiling / M}M): ${r.tested} tested, ${r.valid} valid, ${r.qualified} meeting all constraints.`,
    );
    setRun(r);
    setCmpA('working');
    setCmpB('');
    setRunSnap({
      priceS, ceilingS: String(locks.priceCeiling / M), ownerS, targetS, profileId: prof.id,
      green: { ...green }, entrance: { ...entrance }, lots: copyLotEdits(lotEdits), spec: { ...spec },
      n: workingEcon?.quantities.n ?? 0, road: workingEcon?.quantities.roadArea ?? 0,
      baseSpec: { ...baseSpec },
    });
    setPreviewId(null);
    setAcceptedSummary(
      r.qualified > 0
        ? `Accepted. Ran ${r.tested} layouts, ${r.valid} geometrically valid, ${r.qualified} valid options.`
        : `Accepted. Ran ${r.tested} layouts — no valid option in the tested scope (see blockers below).`,
    );
    setStatus(
      r.qualified > 0
        ? `Search done: ${r.qualified} valid options. Preview one to inspect it.`
        : 'Search done: no valid option in the tested scope. See blockers.',
    );
    setDockTab('options');
  };

  const submitRequest = () => {
    const r = parseIntent(request, {
      selected: greenSelected ? { id: 'grove-a', kind: 'green', name: 'Open space A' } : null,
      selectedPrice: Number.isFinite(price) ? price * M : 0,
    });
    setIntent(r);
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
    if (regenBlock) {
      setStatus(regenBlock);
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
  };

  const rerun = () => {
    if (regenBlock) {
      setStatus(regenBlock);
      return;
    }
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
    setSiteW(String(s.baseSpec.w));
    setSiteH(String(s.baseSpec.h));
    setPreviewId(null);
  };

  const [decisions, setDecisions] = useState<Decision[]>([]);
  const logDecision = (kind: string, detail: string) =>
    setDecisions((d) => [...d, { t: new Date().toISOString(), kind, detail }]);

  // Uploaded bytes are never trusted on name or MIME alone: the file must
  // decode as a real image before it replaces anything. Failures keep the
  // last valid photo and revoke the temporary URL; only an accepted photo
  // retires its predecessor.
  const MAX_PHOTO_BYTES = 10_000_000;
  const onPhotoFile = (f: File) => {
    if (f.type !== '' && f.type !== 'image/png' && f.type !== 'image/jpeg') {
      setPhotoError(`“${f.name}” arrived as ${f.type}, not a PNG/JPEG photo. The current reference photo is unchanged.`);
      return;
    }
    if (f.size > MAX_PHOTO_BYTES) {
      setPhotoError(`“${f.name}” is ${(f.size / 1_000_000).toFixed(1)} MB — photos over 10 MB are refused. The current reference photo is unchanged.`);
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
  };

  const useSite = () => {
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

  const applyCandidate = (c: Candidate) => {
    if (regenBlock) {
      setStatus(regenBlock);
      return;
    }
    setHist((h) => pushUndo(h, snap()));
    logDecision('apply', `Applied ${dispName(c)} (${c.quantities.n} homes, allowance ${formatRp(c.finance.landAllowance)}).`);
    setSpec({ family: c.family, frontage: c.frontage });
    setPreviewId(null);
    setAppliedNote(`Applied ${dispName(c)}: previous working version kept for Undo.`);
    setStatus(`Applied ${dispName(c)}. Previous working version kept for Undo.`);
    setLastDelta(null);
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
    // Snapshot the pre-edit accepted state: Undo must restore the visible
    // plan, not the edited fields. Baseline deltas against committed values,
    // which the draft was previewing against — never against draft numbers.
    const before = committedEcon;
    setHist((h) => pushUndo(h, { ...snap(), greenDraftF: strFields(green) }));
    logDecision('edit', `Moved/resized Open space A to ${done.committed.w} × ${done.committed.h} m at (${done.committed.x}, ${done.committed.y}).`);
    setGreen(done.committed);
    setGreenDraftF(strFields(done.committed));
    if (before) {
      const afterSite = siteWithEntrance(siteWithGreen(base, done.committed), entrance);
      const afterLayout = buildWorking(afterSite, spec);
      const after = evaluateLayout(afterSite, afterLayout, price * M, financeArgs, editsMap);
      setLastDelta(
        `Last change vs previous: ${deltaLine(before.quantities.n, before.quantities.roadArea, before.finance.landAllowance, after.quantities.n, after.quantities.roadArea, after.finance.landAllowance)}.`,
      );
    }
    setStatus('Committed one change — Undo available.');
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
    setHist((h) => pushUndo(h, snap()));
    setSpec(next);
    setLastDelta(null);
    setStatus(`Layout regenerated: ${next.family}, ${next.frontage} m frontage. Undo available.`);
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
    const base = lotEdits[selectedLot] ?? rectCorners(workingLayout.parcels[selectedLot]);
    setLotDraft({ index: selectedLot, pts: base.map((p) => ({ ...p })) });
    setStatus(`Reshaping lot ${selectedLot + 1}: drag corners on the plan or type coordinates, then Apply or Cancel.`);
  };

  const lotDraftErrors: string[] = lotDraft
    ? (() => {
        const skip = new Set(
          Object.keys(lotEdits).map(Number).filter((j) => j !== lotDraft.index),
        );
        const errs = validateLotPoly(committedSite, committedLayout, lotDraft.index, lotDraft.pts, skip);
        if (errs.length > 0) return errs;
        for (const j of skip) {
          if (polysOverlap(lotDraft.pts, lotEdits[j])) return [`reshaped lot overlaps reshaped lot ${j + 1}`];
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
    setHist((h) => pushUndo(h, snap()));
    setLotEdits((e) => ({ ...e, [idx]: pts }));
    setLotDraft(null);
    setLastDelta(null);
    logDecision('lots', `Reshaped lot ${idx + 1} to ${pts.length} corners, ${Math.round(polyArea(pts))} m² (manual lock — regeneration blocked until discarded).`);
    setStatus(`Reshaped lot ${idx + 1} committed — Undo available. Search and regeneration stay blocked until reshapes are discarded.`);
  };

  const cancelLotEdit = () => {
    setLotDraft(null);
    setStatus('Reshape discarded — back on the last valid plan.');
  };

  const lotVertexDrag = (vi: number, pt: Pt) => {
    setLotDraft((d) => (d ? { ...d, pts: d.pts.map((p, k) => (k === vi ? pt : p)) } : d));
  };

  const lotVertexRevert = (orig: Pt[]) => {
    setLotDraft((d) => (d ? { ...d, pts: orig.map((p) => ({ ...p })) } : d));
  };

  const lotVertexAdd = (edgeIdx: number, pt: Pt) => {
    setLotDraft((d) => {
      if (!d || d.pts.length >= MAX_LOT_VERTICES) return d;
      const pts = [...d.pts];
      pts.splice(edgeIdx + 1, 0, pt);
      return { ...d, pts };
    });
  };

  const lotAddCorner = () => {
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
    setLotDraft((d) => (d && d.pts.length > 3 ? { ...d, pts: d.pts.filter((_, k) => k !== vi) } : d));
  };

  const lotSetVertex = (vi: number, x: number, y: number) => {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    lotVertexDrag(vi, { x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 });
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
    if (regenBlock) {
      setEntrance({ ...prev });
      setEntranceS(String(prev.offset));
      setStatus(regenBlock);
      return;
    }
    const errs = entranceErrors(siteWithEntrance(base, next));
    if (errs.length > 0) {
      setEntrance({ ...prev });
      setEntranceS(String(prev.offset));
      setStatus(`Entrance change rejected — ${errs[0]} Kept the last valid plan.`);
      return;
    }
    setHist((h) => pushUndo(h, { ...snap(), entrance: { ...prev } }));
    setEntrance({ ...next });
    setEntranceS(String(next.offset));
    setLastDelta(null);
    logDecision('edit', `Moved compound entrance: ${label}.`);
    setStatus(`Entrance ${label}. Undo available.`);
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

  const selectFromCanvas = (kind: Exclude<Sel, null>) => setSelected(kind);

  return (
    <div className="bench">
      <a className="skiplink" href="#canvascol">
        Skip to plan
      </a>
      <header className="topbar">
        <div className="brand">
          <strong>UNBUILT</strong>
          <span className="note">Cedar Market sample — fictional prices</span>
        </div>
        <div className="workstate" aria-live="polite">
          {preview ? `Previewing ${dispName(preview)}` : 'Working plan'}
        </div>
        <div className="topactions" role="toolbar" aria-label="Edit history">
          <button type="button" onClick={doUndo} disabled={hist.past.length === 0}>Undo</button>
          <button type="button" onClick={doRedo} disabled={hist.future.length === 0}>Redo</button>
          <span className="badge modeloff" title="No application API credentials configured">
            Deterministic mode
          </span>
        </div>
      </header>
      <p role="status" aria-live="polite" className="note srstatus">
        {status}
      </p>

      <div className={planWide ? 'mid wide' : 'mid'}>
        <aside
          className="rail"
          aria-label="Objects and inspector"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setCancelTick((t) => t + 1);
              if (lotDraft) cancelLotEdit();
              else if (draftDirty) cancelDraft();
              else setSelected(null);
            }
          }}
        >
          <h2>Site source</h2>
          <p className="note">
            {baseSpec.w === 120 && baseSpec.h === 100
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
                if (lotDraft) cancelLotEdit();
                else if (draftDirty) cancelDraft();
                else setSelected(null);
              }
            }}
          >
            <li role="option" aria-selected={selected === 'site'}>
              <button type="button" onClick={() => setSelected(selected === 'site' ? null : 'site')}>Site</button>
            </li>
            <li role="option" aria-selected={greenSelected}>
              <button type="button" onClick={() => setSelected(greenSelected ? null : 'grove')}>
                Open space A{greenSelected ? ' (selected)' : ''}
              </button>
            </li>
            <li role="option" aria-selected={selected === 'circulation'}>
              <button type="button" onClick={() => setSelected(selected === 'circulation' ? null : 'circulation')}>Circulation</button>
            </li>
            <li role="option" aria-selected={selected === 'homes'}>
              <button type="button" onClick={() => setSelected(selected === 'homes' ? null : 'homes')}>Homes</button>
            </li>
          </ul>

          <div className="inspector" aria-live="polite">
            {selected === null && (
              <>
                <h3>Site summary</h3>
                <p className="note">{baseSpec.w} × {baseSpec.h} m flat site ({(baseSpec.w * baseSpec.h).toLocaleString('en-US')} m²). Entrance on the {entrance.edge} edge. Set a new site under Site source.</p>
              </>
            )}
            {selected === 'site' && (
              <>
                <h3>Site</h3>
                <ul>
                  <li>Dimensions {baseSpec.w} × {baseSpec.h} m, area {(baseSpec.w * baseSpec.h).toLocaleString('en-US')} m² (confirmed boundary)</li>
                  <li>{baseSpec.w === 120 && baseSpec.h === 100 ? 'Sample provenance: fictional Cedar Market case' : 'Custom site from a confirmed boundary (fictional economics)'}</li>
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
                          disabled={greenLocked || lotLockActive || lotDraft !== null}
                          title={lotLockActive || lotDraft ? (regenBlock ?? undefined) : undefined}
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
                    disabled={draftDirty || lotLockActive}
                    title={draftDirty ? 'Apply or Cancel the green edit first' : lotLockActive ? lotLockNote : undefined}
                    onClick={() => changeSpec({ ...spec, family: 'spine' })}
                  >
                    Spine
                  </button>
                  <button
                    type="button"
                    aria-pressed={spec.family === 'loop'}
                    className={spec.family === 'loop' ? 'seg on' : 'seg'}
                    disabled={draftDirty || lotLockActive}
                    title={draftDirty ? 'Apply or Cancel the green edit first' : lotLockActive ? lotLockNote : undefined}
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
                  <select value={spec.frontage} disabled={draftDirty || lotLockActive} title={lotLockActive ? lotLockNote : undefined} onChange={(e) => changeSpec({ ...spec, frontage: Number(e.target.value) })}>
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
                    value={selectedLot ?? ''}
                    onChange={(e) => setSelectedLot(e.target.value === '' ? null : Number(e.target.value))}
                  >
                    <option value="">Choose…</option>
                    {workingLayout.parcels.map((_, i) => (
                      <option key={i} value={i}>
                        Lot {i + 1}{lotEdits[i] ? ' (reshaped)' : ''}
                      </option>
                    ))}
                  </select>
                </label>
                {selectedLot != null && workingLayout.parcels[selectedLot] && (() => {
                  const i = selectedLot;
                  const rect = workingLayout.parcels[i];
                  const edit = lotEdits[i];
                  const area = edit ? polyArea(edit) : rect.w * rect.h;
                  const front = edit ? lotRoadFrontage(workingLayout.roads, edit) : Math.min(rect.w, rect.h);
                  const inProfile = area >= profile.lotAreaMin && area <= profile.lotAreaMax && front >= profile.frontageMin;
                  return (
                    <ul>
                      <li>
                        Lot {i + 1} of {workingLayout.parcels.length}: {edit ? `reshaped polygon, ${edit.length} corners` : 'generated rectangle'}
                        {', '}{Math.round(area)} m², frontage {front < 10 ? front.toFixed(1) : Math.round(front)} m
                      </li>
                      <li>{inProfile ? 'Fits' : 'Falls outside'} the {profile.name} profile{inProfile ? '' : ' (priced figures provisional)'}</li>
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
                    While reshapes exist, search, circulation, and geometry edits stay blocked until you discard them.
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
                                value={String(Math.round(p.x * 100) / 100)}
                                onChange={(e) => { const v = Number(e.target.value); if (Number.isFinite(v)) lotSetVertex(vi, v, d.pts[vi].y); }}
                              />
                            </label>
                            <label>
                              Y (m from south)
                              <input
                                type="number"
                                value={String(Math.round(p.y * 100) / 100)}
                                onChange={(e) => { const v = Number(e.target.value); if (Number.isFinite(v)) lotSetVertex(vi, d.pts[vi].x, v); }}
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
        </aside>

        <main className="canvascol" id="canvascol">
          <PlanCanvas
            layout={planShown}
            siteW={site.w}
            siteH={site.h}
            entrance={site.entrance}
            greenLocked={greenLocked}
            greenSelected={greenSelected}
            editing={greenSelected && !greenLocked && !lotLockActive && lotDraft === null}
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
            lotEdits={lotEdits}
            selectedLot={selectedLot}
            lotDraft={lotDraft}
            lotDraftValid={lotDraftErrors.length === 0}
            onLotVertexDrag={lotVertexDrag}
            onLotVertexRevert={lotVertexRevert}
            onLotVertexAdd={lotVertexAdd}
            onLotVertexRemove={lotRemoveVertex}
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
            wide={planWide}
            onToggleWide={() => setPlanWide((v) => !v)}
            fitTick={0}
            cancelTick={cancelTick}
            onEscapeIdle={() => {
              setCancelTick((t) => t + 1);
              if (lotDraft) cancelLotEdit();
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
              <button type="button" onClick={() => { setPreviewId(null); setStatus('Back on the working plan.'); }}>
                Cancel
              </button>
            </div>
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
          <div className="instr">
            <label htmlFor="request">What should change?</label>
            <textarea id="request" rows={2} enterKeyHint="go" value={request} onChange={(e) => setRequest(e.target.value)} />
            <button type="button" onClick={submitRequest}>Send</button>
          </div>
          {intent && !acceptedSummary && (
            <div className={`verdict ${intent.kind}`}>
              <p>{intent.text}</p>
              {intent.kind === 'proposal' && (
                <div>
                  <button type="button" onClick={acceptProposal} disabled={priceError !== null || !workingOk || draftDirty}>
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
        </main>
      </div>

      <footer className={cmpExpand ? 'dock expanded' : 'dock'}>
        <div className="docksummary" aria-live="polite">
          {econShown ? (
            <>
              <span><strong>{econShown.q.n}</strong> homes</span>
              <span>Green <strong>{formatM2(econShown.q.greenArea)}</strong></span>
              <span>Road <strong>{formatM2(econShown.q.roadArea)}</strong></span>
              <span>Allowance <strong>{formatRp(econShown.fin.landAllowance)}</strong></span>
              <span><strong>{formatGap(econShown.fin.ownerGap)}</strong></span>
              {metricsAreCommitted && <span className="note">Last valid values — resolve the draft to update.</span>}
              {lastDelta && <span className="note">{lastDelta}</span>}
            </>
          ) : (
            <span><strong>Incomplete</strong> — fix the flagged geometry or economics inputs to see metrics.</span>
          )}
        </div>
        <div className="docktabs" role="tablist" aria-label="Result details">
          {(['quantities', 'economics', 'options', 'issues', 'record'] as const).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={dockTab === t}
              className={dockTab === t ? 'tab on' : 'tab'}
              onClick={() => setDockTab(t)}
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
        <div className="dockpanel">
          {dockTab === 'quantities' && econShown && (
            <dl className="kv">
              <dt>Homes (valid footprints)</dt><dd>{econShown.q.n}</dd>
              <dt>Shared green</dt><dd>{formatM2(econShown.q.greenArea)} (drawn region)</dd>
              <dt>Road, intersections counted once</dt><dd>{formatM2(econShown.q.roadArea)}</dd>
              <dt>Parcels</dt><dd>{formatM2(econShown.q.parcelArea)}</dd>
              <dt>Unallocated remainder</dt><dd>{formatM2(econShown.q.unallocatedArea)}</dd>
            </dl>
          )}
          {dockTab === 'economics' && econShown && (
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
          )}
          {(dockTab === 'quantities' || dockTab === 'economics') && !econShown && (
            <p className="note">Nothing to show until geometry and economics inputs are valid.</p>
          )}
          {dockTab === 'options' && (
            <div>
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
                  <VerdictLine cards={cards} run={run} profileName={profile.name} />
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
                        profile {profile.name}, ceiling Rp{runSnap.ceilingS}m, seed {run.seed}: {run.valid} geometrically valid, {run.qualified} meeting all constraints.
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
                      <select value={cmpA} onChange={(e) => setCmpA(e.target.value)}>
                        <option value="working">Working plan</option>
                        {cards.map((c) => (
                          <option key={c.id} value={c.id}>{dispName(c)}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Plan B
                      <select value={cmpB} onChange={(e) => setCmpB(e.target.value)}>
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
                    <button type="button" onClick={() => setCmpExpand((v) => !v)} aria-pressed={cmpExpand}>
                      {cmpExpand ? 'Dock comparison' : 'Expand comparison'}
                    </button>
                  </div>
                  {(() => {
                    const source = (id: string) => {
                      if (id === 'working') {
                        return workingEcon
                          ? { label: 'Working plan', layout: workingLayout, q: workingEcon.quantities, fin: workingEcon.finance }
                          : null;
                      }
                      const c = cards.find((o) => o.id === id);
                      return c
                        ? {
                            label: dispName(c),
                            layout: c.family === 'spine' ? generateSpine(site, c.frontage) : generateLoop(site, c.frontage),
                            q: c.quantities,
                            fin: c.finance,
                          }
                        : null;
                    };
                    const a = source(cmpA);
                    const b = cmpB === '' ? null : source(cmpB);
                    if (!a || (cmpB !== '' && !b)) return null;
                    if (cmpB !== '' && cmpA === cmpB) {
                      return <p className="note">Pick two different plans — A and B are the same snapshot.</p>;
                    }
                    const cmpCanvas = (
                      key: string,
                      s: NonNullable<ReturnType<typeof source>>,
                      lots: Record<number, Pt[]>,
                    ) => (
                      <div key={key}>
                        <p className="note"><strong>{s.label}</strong> — {s.q.n} homes · {formatM2(s.q.roadArea)} road · {formatGap(s.fin.ownerGap)}</p>
                        <PlanCanvas
                          layout={s.layout} siteW={site.w} siteH={site.h} entrance={site.entrance}
                          greenLocked={greenLocked} greenSelected={false} siteSelected={false} editing={false}
                          entranceEditing={false} entranceValid
                          draftActive={false} draftValid
                          workingKeys={null} vsNote={null} backdrop={null} cancelTick={0}
                          selectedKind={null} onSelectSite={() => {}} onSelectGreen={() => {}} onSelectEntrance={() => {}}
                          onEntranceDrag={() => {}} onEntranceCommit={() => {}} onEntranceCancel={() => {}}
                          onSelectLot={() => {}} lotEdits={lots} selectedLot={null} lotDraft={null} lotDraftValid
                          onLotVertexDrag={() => {}} onLotVertexRevert={() => {}} onLotVertexAdd={() => {}} onLotVertexRemove={() => {}}
                          onSelectKind={() => {}} onDeselect={() => {}}
                          onDraftChange={() => {}} onDraftCommit={() => {}} onEscapeIdle={() => {}}
                          wide={false} onToggleWide={() => {}} fitTick={cmpFit}
                        />
                      </div>
                    );
                    return (
                      <>
                        <div className="compare-grid">
                          {cmpCanvas('a', a, cmpA === 'working' ? lotEdits : {})}
                          {b && cmpCanvas('b', b, cmpB === 'working' ? lotEdits : {})}
                        </div>
                        {!b && <p className="note">Choose a second plan to see deltas.</p>}
                        {b && (
                          <dl className="kv">
                            <dt>Homes ({a.label} → {b.label})</dt>
                            <dd>{a.q.n} → {b.q.n}</dd>
                            <dt>Road area</dt>
                            <dd>{formatM2(a.q.roadArea)} → {formatM2(b.q.roadArea)}</dd>
                            <dt>Land allowance</dt>
                            <dd>{formatRp(a.fin.landAllowance)} → {formatRp(b.fin.landAllowance)}</dd>
                            <dt>Owner outcome</dt>
                            <dd>{formatGap(a.fin.ownerGap)} → {formatGap(b.fin.ownerGap)}</dd>
                          </dl>
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
              </button>
              <p className="note">Export carries geometry, economics, and decisions only — never credentials. Entries are append-only: Undo never rewrites them.</p>
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
