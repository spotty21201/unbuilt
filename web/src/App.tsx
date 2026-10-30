import FeasibilityExperiments from './unbuilt/FeasibilityExperiments';
import {DEFAULT_COSTS} from '../../src/costs';
import OpenSpacesEditor from './unbuilt/OpenSpacesEditor';
import {siteOpenSpaces,spaceArea,spaceSiteErrors,type OpenSpace} from '../../src/open-spaces';
import HousingCostAssumptions from './unbuilt/HousingCostAssumptions';
import {assignmentSource,homeTemplate,initialHousing,housingSummary,repartitionHousing} from '../../src/housing';
import HousingMixEditor from './unbuilt/HousingMixEditor';
import type {LotOperation} from './unbuilt/LotPlanEditor';
import {lotBlocks,rectangleForLots} from '../../src/parcels';
import type {PlanContents} from '../../src/contents';
import StreetEditor from './unbuilt/StreetEditor';
import { appendStreetPath, moveStreetNode, networkFromRoads, onStreet, samePoint, splitJunctions, type StreetNetwork } from '../../src/streets';
import { streetEntrance, streetConflict } from '../../src/geometry';
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { deriveQuantities, editsForLayout, entranceErrors, generateLoop, generateSpine, lotKey, lotRoadFrontage, placeFootprint, homeRestorationConflicts, validateLayout } from '../../src/geometry';
import type { Entrance, LotEdits, Site } from '../../src/geometry';
import type { Pt } from '../../src/polygon';
import { hasBoundary, hasLayout, hasHome } from '../../src/contents';
import { MAX_LOT_VERTICES, polyArea, polysOverlap, rectCorners } from '../../src/polygon';
import { validateLotPoly } from '../../src/geometry';
import { makeSite, starterLayout, siteSizeErrors } from '../../src/site';
import { evaluateLayout } from '../../src/economics';
import { BASE_PROFILE, COMPACT_PROFILE, failingLots, runSearch, selectUpToThree } from '../../src/search';
import type { Ordering } from '../../src/search';
import { parseIntent } from '../../src/intent';
import type { IntentResult } from '../../src/intent';
import type { Candidate, Locks, ProductProfile, SearchRun } from '../../src/schema';
import type { Rect } from '../../src/schema';
import PlanCanvas from './unbuilt/PlanCanvas';
import DynamicInspector from './unbuilt/DynamicInspector';
import EntranceEditor from './unbuilt/EntranceEditor';
import ConfirmPlanChange from './unbuilt/ConfirmPlanChange';
import { entranceLabel, rebaseEntrance, gateSegment } from '../../src/access';
import { DEFAULT_PLANNING, homeArea } from '../../src/planning';
import type { PlanningParameters } from '../../src/planning';
import SiteContextEditor from './unbuilt/SiteContextEditor';
import type { SurveyRaster } from './unbuilt/survey-file';
import { contextErrors, type SiteContext, type ContextNote, type BoundarySource } from '../../src/site-context';
import BoundaryEditor from './unbuilt/BoundaryEditor';
import type { BoundaryDraft } from './unbuilt/BoundaryEditor';
import { boundaryErrors, frameForBoundary, siteArea, siteBoundary } from '../../src/boundary';
import type { SiteFrame } from '../../src/boundary';
import Assistant from './unbuilt/Assistant';
import { LayersIcon, DrawSiteIcon, DownloadIcon, UndoIcon, RedoIcon, AssistantIcon, CirculationIcon, HomesIcon, OpenSpaceIcon, PanIcon, SelectIcon, SiteIcon } from './unbuilt/icons';
import { copyLotEdits, formatGap, formatM2, formatRp, indexLotsRecord, parcelKey, serverBase, siteWithEntrance, siteWithGreen } from './unbuilt/ui';
import { CAPABILITIES } from '../../src/snapshot';
import type { ScenarioSnapshot } from '../../src/snapshot';
import type { PlanFacts, TryContext } from '../../src/assistant';
import { serializeProject } from '../../src/persist';
import type { PersistedProject, PersistedState } from '../../src/persist';
import { applyDraftEdit, commitDraft, pushUndo, redo, undo } from '../../src/draft';
import type { History } from '../../src/draft';
import type { WorkingSpec } from './unbuilt/ui';
import './App.css';
import './drafting.css';

const LotPlanEditor=lazy(()=>import('./unbuilt/LotPlanEditor'));
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

function econKey(c: Candidate): string {
  return `${c.quantities.n}|${Math.round(c.quantities.roadArea)}|${Math.round(c.finance.landAllowance)}`;
}

function cardTitle(c: Candidate, snap: { n: number; road: number }): string {
  if (c.quantities.n !== snap.n) {
    return `${c.quantities.n > snap.n ? '+' : ''}${c.quantities.n - snap.n} homes · ${Math.round(c.quantities.parcelArea).toLocaleString('en-US')} m² in lots`;
  }
  const dr = Math.round(c.quantities.roadArea - snap.road);
  if (dr !== 0) return `${dr < 0 ? '-' : '+'}${Math.abs(dr).toLocaleString('en-US')} m² road`;
  return `Same homes and road · ${Math.round(c.quantities.parcelArea).toLocaleString('en-US')} m² in lots`;
}

function VerdictLine({ cards, run, profileName, ownerBn, priceLocked }: { cards: Candidate[]; run: SearchRun; profileName: string; ownerBn: number; priceLocked: boolean }) {
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
      {run.breakdown.priceOk} {priceLocked ? 'within ceiling' : 'with ceiling disabled'}, {run.breakdown.targetOk} meet target surplus — {run.qualified} shown below.
      {commercial ? ` ${commercial}` : ''}
    </p>
  );
}

interface WorkbenchProps {
  initialStatus?: string;
  initialProject: PersistedProject;
  projectName: string;
  onSaveProject: (project: PersistedProject) => boolean;
  onOpenProjects: (sessionRisk: string) => void;
  onImportProject: (file: File, sessionRisk: string) => void;
  saveStatus: string;
}
export default function Workbench({ initialProject, projectName, onSaveProject, onOpenProjects, onImportProject, saveStatus, initialStatus }: WorkbenchProps) {
  const start = initialProject.state;
  const inspectorRef = useRef<HTMLElement>(null);
  const [siteContext, setSiteContext] = useState<SiteContext | undefined>(start.siteContext);
  const [contextOpen, setContextOpen] = useState(false);
  const [contextPending, setContextPending] = useState(false);
  const [noteDraft, setNoteDraft] = useState<ContextNote | null>(null);
  const [contextPicking, setContextPicking] = useState(false);
  const [showSurvey, setShowSurvey] = useState(true);
  const [surveyRaster, setSurveyRaster] = useState<SurveyRaster | null>(null);
  useEffect(() => () => { if (surveyRaster) URL.revokeObjectURL(surveyRaster.url); }, [surveyRaster]);
  const [baseSpec, setBaseSpec] = useState<SiteFrame>(start.baseSpec);
  const [experimentOpen, setExperimentOpen] = useState(false);
  const [parameterDraft, setParameterDraft] = useState<{ planning: PlanningParameters; frontage: number; family?: WorkingSpec['family']; contents?:PlanContents } | null>(null);
  const [spacesEditing,setSpacesEditing]=useState(false);
  const [selectedSpace,setSelectedSpace]=useState<string|null>(null);
  const [spaceDrawing,setSpaceDrawing]=useState(false);
  const [spaceHistory,setSpaceHistory]=useState<History<PlanningParameters>>({past:[],future:[]});
  const spaceGesture=useRef<PlanningParameters|null>(null);
  const [housingEditing,setHousingEditing]=useState(false);
  const [housingGeneratedReview,setHousingGeneratedReview]=useState(false);
  const [housingTargets,setHousingTargets]=useState<number[]>([]);
  const [parcelSources,setParcelSources]=useState<number[]>([]);
  const [parcelCreated,setParcelCreated]=useState<Rect[]>([]);
  const [parcelEditing,setParcelEditing]=useState<{mode:LotOperation;selected:number[]}|null>(null);
  const [parcelReady,setParcelReady]=useState(false);
  const [parcelBounds,setParcelBounds]=useState<Rect|null>(null);
  const [parcelAction,setParcelAction]=useState('Lot plan');
  const [streetEditing, setStreetEditing] = useState(false);
  const [streetConnectorIds,setStreetConnectorIds]=useState<string[]>([]);
  const [streetDrawing, setStreetDrawing] = useState<Pt[] | null>(null);
  const [streetSelected, setStreetSelected] = useState<string | null>(null);
  const [streetWidth, setStreetWidth] = useState(6);
  const [streetHistory, setStreetHistory] = useState<History<StreetNetwork>>({past:[],future:[]});
  const [optimizing, setOptimizing] = useState(false);
  const searchTicket = useRef(0);
  const [boundaryDraft, setBoundaryDraft] = useState<BoundaryDraft | null>(null);
  const [siteFit, setSiteFit] = useState(0);
  const boundaryGesture = useRef<BoundaryDraft | null>(null);
  const [boundaryHistory, setBoundaryHistory] = useState<History<BoundaryDraft>>({ past: [], future: [] });
  const base = useMemo(() => ({ ...makeSite(baseSpec.w, baseSpec.h), ...baseSpec }), [baseSpec]);
  const isCustomSite = !hasBoundary(baseSpec) || !!baseSpec.boundary || baseSpec.w !== 120 || baseSpec.h !== 100;
  const [refImage, setRefImage] = useState<string | null>(null);
  const [showBackdrop, setShowBackdrop] = useState(true);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [siteW, setSiteW] = useState(String(start.baseSpec.w));
  const [siteH, setSiteH] = useState(String(start.baseSpec.h));
  // Numeric inputs stay strings until parsed: an emptied field is incomplete,
  // never a silent zero. Committed geometry only updates on fully valid drafts.
  const num = (s: string) => (s.trim() === '' ? NaN : Number(s));
  const [green, setGreen] = useState<Rect>({ ...start.green });
  const [entrance, setEntrance] = useState<Entrance>({ ...start.entrance, edge: start.entrance.edge === 'east' ? 'east' : 'west' });
  const [entranceS, setEntranceS] = useState(String(start.entrance.offset));
  // Manual lot reshapes: parcel index -> polygon meters. While any exist,
  // regenerating actions (circulation, frontage, search, apply, open-space
  // edits, entrance moves) stay blocked: regeneration would silently erase
  // manual work, so only an explicit discard reopens them.
  // Stable manual reshapes keyed by unedited base rectangle: identical lots
  // across regenerations keep their shape; only removed lots can conflict.
  const [lotEdits, setLotEdits] = useState<Record<string, Pt[]>>(copyLotEdits(start.lots));
  const lotLockActive = Object.keys(lotEdits).length > 0;
  // Lot reshape UI state: which generated lot is selected, and the active
  // vertex draft (explicit Apply/Cancel; metrics stay on committed geometry).
  const [selectedLots, setSelectedLots] = useState<number[]>([]);
  const [selectedLot, setSelectedLot] = useState<number | null>(null);
  const [lotDraft, setLotDraft] = useState<{ index: number; pts: Pt[] } | null>(null);
  const [lotHistory,setLotHistory]=useState<History<{index:number;pts:Pt[]}>>({past:[],future:[]});
  // An open reshape draft addresses parcel indices: regeneration waits until
  // it is applied or cancelled. Committed reshapes are never blocked this
  // way — they carry by stable identity (see askRegen).
  const regenBlock = experimentOpen ? 'Apply or Cancel the feasibility experiment first.' : contextPending ? 'Apply or Cancel the site context edit first.' : parameterDraft ? 'Apply or Cancel the parameter edit first.' : boundaryDraft ? 'Apply or Cancel the boundary edit first.' : lotDraft
    ? 'A lot reshape is in progress — Apply or Cancel it before regenerating the layout.'
    : null;
  const [greenDraftF, setGreenDraftF] = useState<DraftFields>({
    x: String(start.green.x), y: String(start.green.y), w: String(start.green.w), h: String(start.green.h),
  });
  const [profileId, setProfileId] = useState(start.profileId);
  const [priceS, setPriceS] = useState(start.priceS);
  const [ceilingS, setCeilingS] = useState(start.ceilingS);
  const [ownerS, setOwnerS] = useState(start.ownerS);
  const [targetS, setTargetS] = useState(start.targetS);
  const [spec, setSpec] = useState<WorkingSpec>({ family: start.spec.family === 'loop' ? 'loop' : 'spine', frontage: start.spec.frontage });
  const [selected, setSelected] = useState<Sel>(hasLayout(start.baseSpec) ? 'grove' : 'site');
  const [greenLocked, setGreenLocked] = useState(start.greenLocked);
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
    profileId: string; green: Rect; entrance: Entrance; spec: WorkingSpec; n: number; road: number; allowance: number;
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
      projectName,
      exportVersion: baseSpec.costAssumptions!==undefined?12:baseSpec.planning?.openSpaces!==undefined?11:baseSpec.planning?.housing?10:baseSpec.planning?.lotPlan!==undefined?9:baseSpec.planning?.streetNetwork !== undefined ? 8 : siteContext !== undefined ? 7 : baseSpec.contents !== undefined ? 6 : entrance.boundaryEdge !== undefined || baseSpec.planning?.minGreenArea !== undefined ? 5 : baseSpec.planning ? 4 : baseSpec.boundary ? 3 : 2,
      exportedAt: new Date().toISOString(),
      units: 'Geometry in meters, local Cartesian, y-up from the south edge. Currency in Rp; calculations retain precision and displayed values may be rounded.',
      state: {
        ...(siteContext ? { siteContext } : {}),
        site: {
          ...(baseSpec.costAssumptions?{costAssumptions:baseSpec.costAssumptions}:{}),
          w: baseSpec.w,
          h: baseSpec.h,
          ...(baseSpec.contents ? { contents: baseSpec.contents } : {}),
          ...(baseSpec.planning ? { planning: baseSpec.planning } : {}),
          ...(baseSpec.boundary ? { boundary: baseSpec.boundary } : {}),
          areaM2: siteArea(baseSpec),
          provenance: cedar
            ? 'fictional Cedar Market sample'
            : 'custom confirmed boundary; generated entrance/open space are assumed — review',
        },
        entrance: { ...entrance },
        openSpace: {
          ...(baseSpec.planning?.openSpaces!==undefined?{compatibilityReferenceOnly:true,canonicalGeometry:'state.site.planning.openSpaces; legacy rectangle below is not an allocation'}:{}),
          geometry: { ...green },
          locked: greenLocked,
          surface: 'landscaped/shared green (assumed — other surface types unmodeled)',
          costBasisRpPerM2: (baseSpec.costAssumptions??DEFAULT_COSTS).greenWorksPerM2,
        },
        plan: {
          family: spec.family,
          frontage: spec.frontage,
          profile: profileId,
          roads: committedLayout.roads,
          ...(committedLayout.accessConnector ? { accessConnector: committedLayout.accessConnector } : {}),
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
    priceS: string; ceilingS: string; ownerS: string; targetS: string; baseSpec: SiteFrame; siteContext?: SiteContext; showBackdrop?: boolean;
  }
  interface Decision {
    t: string;
    kind: string;
    detail: string;
  }
  const [hist, setHist] = useState<History<Snapshot>>({ past: [], future: [] });
  const [appliedNote, setAppliedNote] = useState<string | null>(null);
  const [status, setStatus] = useState(initialStatus ?? `Opened ${projectName}. Accepted plan restored; drafts, undo history and photos are not restored. Plan Undo/Redo starts fresh.`);

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
  const draft = useMemo(() => applyDraftEdit(green, greenDraftF, base), [green, greenDraftF, base]);
  // Dirty compares parsed values: retyping "078" for 78 is not a change,
  // while an unparsable field always counts as dirty (with an error shown).
  const draftDirty = (['x', 'y', 'w', 'h'] as const).some(
    (k) => num(greenDraftF[k]) !== green[k],
  );
  const greenErrors: string[] = (parameterDraft?.planning??baseSpec.planning)?.openSpaces!==undefined || !hasLayout(baseSpec) || draft.draftable
    ? []
    : draft.errors.map((e) =>
        e.startsWith('Open space must sit')
          ? `${e} ${greenLocked ? 'Unlock it to edit.' : 'Move it back inside the site.'}`
          : e,
      );

  // Displayed geometry follows the draft; metrics only follow valid drafts.
  const planning = parameterDraft?.planning ?? baseSpec.planning ?? DEFAULT_PLANNING;
  const spaces=hasBoundary(baseSpec)?siteOpenSpaces({green,planning},greenLocked):[];
  const activeSpace=spaces.find(s=>s.id===selectedSpace);
  const collection=planning.openSpaces!==undefined;
  const greenLabel=collection?(activeSpace?.name??'All open spaces'):'Open space A';
  const spacesError=spacesEditing?(spaceSiteErrors(spaces,siteBoundary(baseSpec))[0]??(spaceArea(spaces)+.01<(planning.minGreenArea??0)?`Combined open space must retain at least ${planning.minGreenArea} m².`:null)):null;
  const streetNetwork = planning.streetNetwork ?? {segments:[]};
  const boundaryPreview = useMemo(() => boundaryDraft?.closed && boundaryErrors(boundaryDraft.pts).length === 0
    ? { ...frameForBoundary(boundaryDraft.pts), ...(baseSpec.contents ? { contents: { ...baseSpec.contents, boundary: true } } : {}), ...(baseSpec.planning ? { planning: baseSpec.planning } : {}) } : null, [boundaryDraft, baseSpec.planning, baseSpec.contents]);
  const boundaryDefaults = useMemo(() => boundaryDraft?.newSite && boundaryPreview ? makeSite(boundaryPreview.w, boundaryPreview.h) : null, [boundaryDraft?.newSite, boundaryPreview]);
  const boundaryGreen = boundaryDefaults?.green ?? draft.draft;
  const boundaryEntrance = boundaryDraft?.entrance ?? boundaryDefaults?.entrance ?? entrance;
  const site: Site = useMemo(() => ({
    ...base, ...(boundaryPreview ?? {}),
    ...(parameterDraft ? { planning: parameterDraft.planning, ...(parameterDraft.contents?{contents:parameterDraft.contents}:{}) } : {}),
    green: boundaryPreview ? boundaryGreen : draft.draft, entrance: boundaryPreview ? boundaryEntrance : entrance,
  }), [base, boundaryPreview, boundaryGreen, boundaryEntrance, parameterDraft, draft.draft, entrance]);
  const committedSite = useMemo(
    () => siteWithEntrance(siteWithGreen(base, green), entrance),
    [base, green, entrance],
  );
  const workingLayout = useMemo(() => buildWorking(site, parameterDraft ? { ...spec, family: parameterDraft.family ?? spec.family, frontage: parameterDraft.frontage } : spec), [site, spec, parameterDraft]);
  useEffect(() => { setSelectedLots([]); }, [workingLayout, selected]);
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
  const workingFailing = failingLots(workingLayout.parcels, profile, { lotEdits: editsMap, roads: workingLayout.roads }).filter(i => hasHome(site, workingLayout.parcels[i]));
  const planWarnings =
    workingFailing.length > 0
      ? [
          `${workingFailing.length} working lot(s) fall outside the ${profile.name} profile (area/frontage). ` +
            `Priced figures assume the profile applies — treat them as provisional.`,
        ]
      : planning.lotPlan?.length===0?['Manual lot plan contains no lots. Streets and open space remain measured; use generated lots to restore a subdivision.'] : !workingLayout.empty && workingLayout.parcels.length === 0 && !workingLayout.supportError ? ['No home fits these lot dimensions and the shared housing template. Increase lot frontage/depth or reduce the template.'] : [];
  const workingWarnings=[...planWarnings,...(planning.housing?['Housing mix pricing is provisional: every occupied home uses the shared selling-price assumption; no template-specific market evidence is supplied.']:[])];
  const committedLayout = useMemo(() => buildWorking(committedSite, spec), [committedSite, spec]);
  const financeArgs = {
    ownerExpectation: ownerL * BN,
    targetFraction: targetT / 100,
  };
  const committedEcon = inputsOk && !committedLayout.empty && !committedLayout.supportError ? evaluateLayout(committedSite, committedLayout, price * M, financeArgs, editsForLayout(committedLayout.parcels, lotEdits)) : null;
  const draftEcon =
    !workingLayout.empty && draft.draftable && layoutErrors.length === 0 && inputsOk
      ? evaluateLayout(site, workingLayout, price * M, financeArgs, editsMap)
      : null;
  // Metrics follow the draft while it is valid; otherwise the last valid plan.
  const workingEcon = draftEcon ?? committedEcon;
  const workingOk = inputsOk && !workingLayout.empty && workingErrors.length === 0;

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
      JSON.stringify(runSnap.baseSpec) !== JSON.stringify(baseSpec) || !!parameterDraft || !!boundaryDraft || draftDirty);

  useEffect(() => { if (stale) setPreviewId(null); }, [stale]);

  const effectiveCeiling =
    intent && intent.kind === 'proposal' && intent.operations.priceCeiling !== null
      ? intent.operations.priceCeiling / M
      : ceiling;
  const priceError =
    planning.priceLocked && Number.isFinite(price) && Number.isFinite(effectiveCeiling) && price > effectiveCeiling
      ? `Selected price Rp${price}m exceeds the ceiling Rp${effectiveCeiling}m. Lower the price or raise the ceiling. Search is blocked; plan exploration stays open.`
      : null;

  const touchDraft = (f: DraftFields) => {
    setGreenDraftF(f);
    setLastDelta(null);
  };

  const doRun = async (prof: ProductProfile, locks: Locks, enforcePrice?: boolean, acceptedBase:SiteFrame=baseSpec) => {
    const runBase=enforcePrice?{...acceptedBase,planning:{...(acceptedBase.planning??DEFAULT_PLANNING),priceLocked:true}}:acceptedBase;
    if(planning.lotPlan!==undefined){setStatus('Manual lots are held. Preview generated lots before searching frontage alternatives.');return;}
    await new Promise((resolve) => setTimeout(resolve, 0));
    const ticket = ++searchTicket.current;
    setOptimizing(true);
    setStatus('Optimizing layout within the tested family and frontage ranges…');
    await new Promise((resolve) => setTimeout(resolve, 120));
    if (ticket !== searchTicket.current) return;
    const r = runSearch({
      site: {...committedSite,...runBase},
      profile: prof,
      selectedPrice: price * M,
      locks,
      ranges: { families: planning.streetNetwork ? ['spine'] : [...GRID.families], frontages: [...GRID.frontages] },
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
    if (ticket !== searchTicket.current) return;
    setOptimizing(false);
    setRun(r);
    setCmpA('working');
    setCmpB('');
    setRunSnap({
      priceS, ceilingS: String(locks.priceCeiling / M), ownerS, targetS, profileId: prof.id,
      green: { ...green }, entrance: { ...entrance }, lots: indexLotsRecord(editsMap), spec: { ...spec },
      n: workingEcon?.quantities.n ?? 0, road: workingEcon?.quantities.roadArea ?? 0, allowance: workingEcon?.finance.landAllowance ?? 0,
      baseSpec: structuredClone(runBase),
    });
    setPreviewId(null);
    setAcceptedSummary(
      r.qualified > 0
        ? `Accepted. Ran ${r.tested} layouts: ${r.qualified} options meet the modeled constraints (valid geometry, profile fit and active locks; target surplus is reported separately). Owner expectation is a benchmark — see Options.`
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
    // A collection request must identify its selected space before creating a lock.
    const text = override ?? request;
    if (override !== undefined) setRequest(override);
    const resolvedGreen = collection?greenSelected&&!!activeSpace:greenSelected||greenLocked;
    const r = parseIntent(text, {
      selected: resolvedGreen ? { id: collection?activeSpace!.id:'grove-a', kind: 'green', name: greenLabel } : null,
      selectedPrice: Number.isFinite(price) ? price * M : 0,
      search: {manualStreets:!!planning.streetNetwork,manualLots:planning.lotPlan!==undefined,families:planning.streetNetwork?['spine']:[...GRID.families],frontages:[...GRID.frontages]},
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
    if (!intent || intent.kind !== 'proposal' || regenBlock || optimizing) return;
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
    if (ops.lockGreen&&!collection) setGreenLocked(true);
    const acceptedBase=(ops.lockGreen&&collection&&activeSpace)||ops.priceCeiling!==null?{...baseSpec,planning:{...planning,...(collection?{openSpaces:spaces.map(s=>ops.lockGreen&&s.id===activeSpace?.id?{...s,locked:true}:s)}:{}),...(ops.priceCeiling!==null?{priceLocked:true}:{})}}:baseSpec;
    if(acceptedBase!==baseSpec)setBaseSpec(acceptedBase);
    const prof = nextProfileId === 'starter-150' ? COMPACT_PROFILE : BASE_PROFILE;
    doRun(prof, {
      green: { ...green },
      priceCeiling: ops.priceCeiling ?? num(nextCeilingS) * M,
      ownerExpectation: ownerL * BN,
      targetFraction: targetT / 100,
    }, ops.priceCeiling !== null, acceptedBase);
    setPropSnap(null);
  };

  const rerun = () => {
    if (regenBlock || optimizing) { setStatus(regenBlock ?? 'Optimization is already running.'); return; }
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
    priceS, ceilingS, ownerS, targetS, baseSpec: { ...baseSpec }, siteContext, showBackdrop,
  });

  const restore = (s: Snapshot) => {
    setSpec(s.spec);
    setShowBackdrop(s.showBackdrop ?? true);
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
    setSiteContext(s.siteContext);
    setBoundaryDraft(null);
    setParameterDraft(null); setStreetEditing(false); setStreetDrawing(null); setParcelEditing(null);setHousingEditing(false);setSpacesEditing(false);setSpaceDrawing(false);setHousingGeneratedReview(false); setParcelReady(false); setParcelBounds(null);
    setSiteW(String(s.baseSpec.w));
    setSiteH(String(s.baseSpec.h));
    setPreviewId(null);
  };

  const [decisions, setDecisions] = useState<Decision[]>(initialProject.decisions);
  const logDecision = (kind: string, detail: string) =>
    setDecisions((d) => [...d, { t: new Date().toISOString(), kind, detail }]);

  // Durable project state: versioned autosave to localStorage plus file
  // import. Photos are never stored (session-only blobs); every restore says
  // so. Storage denial surfaces as status, never a silent loss.
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
    ...(siteContext ? { siteContext } : {}),
  });

  useEffect(() => {
    onSaveProject(serializeProject(projectState(), decisions, projectName));
    // Accepted state only; drafts remain in this workspace until Apply.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec, green, entrance, lotEdits, profileId, greenLocked, priceS, ceilingS, ownerS, targetS, baseSpec, siteContext, decisions, onSaveProject]);

  const onImportFile = (file: File) => {
    if (regenBlock || draftDirty) { setStatus('Apply or Cancel the current edit before importing another project.'); return; }
    onImportProject(file, sessionRisk);
  };
  const sessionRisk = [experimentOpen?'The unapplied experiment will be lost.':'',hist.past.length || hist.future.length ? 'Plan Undo/Redo will end.' : '', surveyRaster ? 'The attached survey file must be reattached after returning.' : '', refImage ? 'The reference photo will be lost; it is not saved or backed up.' : ''].filter(Boolean).join(' ');
  const [leaveBoundary, setLeaveBoundary] = useState(false);
  const leavingRisk = !!(regenBlock || draftDirty || sessionRisk || !saveStatus.startsWith('Project saved'));
  useEffect(() => {
    if (!leavingRisk) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [leavingRisk]);
  const openProjects = () => {
    if (boundaryDraft) { setLeaveBoundary(true); return; }
    if (regenBlock || draftDirty || pendingOp || optimizing) { setStatus('Apply or Cancel the current edit before opening Projects.'); return; }
    onSaveProject(serializeProject(projectState(), decisions, projectName));
    onOpenProjects(sessionRisk);
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
    if (planning.siteLocked) { setStatus('Unlock the site boundary before replacing it.'); return; }
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
    const {streetNetwork: omittedNetwork, lotPlan:omittedLots, openSpaces:omittedSpaces, ...dimensionPlanning} = baseSpec.planning ?? DEFAULT_PLANNING; void omittedNetwork;void omittedLots;void omittedSpaces;
    setBaseSpec({ w, h, ...(baseSpec.costAssumptions?{costAssumptions:baseSpec.costAssumptions}:{}), ...(baseSpec.contents ? { contents: { boundary: true, layout: baseSpec.contents.layout, removedHomes: [] } } : {}), ...(baseSpec.planning ? { planning: {...dimensionPlanning,streets:[],...(dimensionPlanning.housing?{housing:{...dimensionPlanning.housing,assignments:{}}}:{})} } : {}) });
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
    if (boundaryDraft?.entrance && next.entrance === boundaryDraft.entrance) next = { ...next, entrance: rebaseEntrance(boundaryDraft.pts, next.pts, next.entrance) };
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
    if (planning.siteLocked) { setStatus('Unlock the site boundary in Active invariant locks before editing.'); return; }
    if (contextPending || parameterDraft || draftDirty || lotDraft || pendingOp) { setStatus('Apply or Cancel the current edit first.'); return; }
    setPreviewId(null);
    setSelected('site');
    setTool('select');
    setControlsOpen(true);
    setDockOpen(false);
    setContextOpen(false);
    setBoundaryHistory({ past: [], future: [] });
    setBoundaryDraft({ pts: newSite ? [] : siteBoundary(baseSpec).map((p) => ({ ...p })), closed: !newSite, newSite, ...(!newSite ? { entrance: { ...entrance } } : {}) });
    setStatus(newSite ? 'Draw a boundary: place vertices, then close the outline. Escape cancels.' : 'Boundary draft: drag a vertex, add at a midpoint, or edit coordinates. Apply or Cancel to finish.');
  };
  const applyBoundary = () => {
    if (!boundaryDraft || !boundaryDraft.closed || boundaryErrors(boundaryDraft.pts).length) return;
    if (planning.siteLocked) return;
    const next = { costAssumptions:baseSpec.costAssumptions, ...frameForBoundary(boundaryDraft.pts), ...(baseSpec.contents ? { contents: { ...baseSpec.contents, boundary: true } } : {}), ...(baseSpec.planning ? { planning: baseSpec.planning } : {}) };
    const nextGreen = boundaryDraft.newSite ? makeSite(next.w, next.h).green : green;
    const nextEntrance = boundaryEntrance;
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
      if (boundaryDraft.source) setSiteContext({ ...(siteContext ?? { notes: [] }), boundarySource: boundaryDraft.source });
      setSiteW(String(next.w)); setSiteH(String(next.h));
      setGreen({ ...nextGreen }); setGreenDraftF(strFields(nextGreen));
      setEntrance({ ...nextEntrance }); setEntranceS(String(nextEntrance.offset));
      if (incompatible.length) setLotEdits(Object.fromEntries(Object.entries(lotEdits).filter(([key]) => nextLayout.parcels.some((p) => lotKey(p) === key))));
      setSelectedLot(null); setBoundaryDraft(null); setCancelTick((t) => t + 1);
      setSiteFit((t) => t + 1);
      setRun(null); setRunSnap(null); setPreviewId(null); setIntent(null); setPropSnap(null); setAcceptedSummary(null); setLastDelta(null);
      logDecision('boundary', `Applied ${next.boundary!.length}-vertex site, ${siteArea(next)} m². ${nextLayout.supportError ?? 'Contained layout regenerated; outside lots omitted.'}`);
      setStatus(nextLayout.empty ? `Boundary applied: ${formatM2(siteArea(next))}. Generate a layout when ready. Undo restores the previous boundary.` : nextLayout.supportError ? `Boundary saved (${formatM2(siteArea(next))}). Layout unavailable: ${nextLayout.supportError}` : `Boundary applied: ${formatM2(siteArea(next))}. Layout measured inside the boundary. Undo restores the previous plan.`);
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
    if (contextPending) { setStatus('Apply or Cancel the site context edit before Undo.'); return; }
    if (parameterDraft) { cancelParameters(); return; }
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
    if(parameterDraft){cancelParameters();return;}
    if (contextPending) { setStatus('Apply or Cancel the site context edit before Redo.'); return; }
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
    if (layoutErrors.length || parameterDraft || boundaryDraft || greenLocked) { setStatus(layoutErrors[0] ?? 'Finish the current edit or unlock the park first.'); return; }
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
    if (pro.supportError) { setStatus(pro.supportError); return; }
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
  const beginLotReshape = (index:number|null) => {
    if (preview) { setStatus('Apply or Cancel the alternative preview before reshaping a lot.'); return; }
    if (index == null || !workingLayout.parcels[index]) {
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
    setSelected('homes');setSelectedLot(index);setSelectedLots([index]);setControlsOpen(true);
    const rect = workingLayout.parcels[index];
    const base = lotEdits[lotKey(rect)] ?? rectCorners(rect);
    setLotHistory({past:[],future:[]});
    setLotDraft({ index: index, pts: base.map((p) => ({ ...p })) });
    requestAnimationFrame(()=>document.querySelector('.lot-reshape-actions')?.scrollIntoView({block:'start'}));
    clearVertexText();
    setStatus(`Reshaping lot ${index + 1}: drag corners on the plan or type coordinates, then Apply or Cancel.`);
  };

  const startLotReshape=()=>{if(selectedLots.length>1){setStatus('Choose one lot before reshaping it.');return;}beginLotReshape(selectedLot);};

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

  const lotVertexDrag = (vi: number, pt: Pt,record=true) => {
    if(lotDraft&&record&&!samePoint(lotDraft.pts[vi],pt))setLotHistory(h=>pushUndo(h,lotDraft));
    setLotDraft((d) => (d ? { ...d, pts: d.pts.map((p, k) => (k === vi ? pt : p)) } : d));
    clearVertexText(vi);
  };

  const lotVertexRevert = (orig: Pt[]) => {
    setLotDraft((d) => (d ? { ...d, pts: orig.map((p) => ({ ...p })) } : d));
  };

  const lotVertexAdd = (edgeIdx: number, pt: Pt) => {
    if(lotDraft&&lotDraft.pts.length<MAX_LOT_VERTICES)setLotHistory(h=>pushUndo(h,lotDraft));
    clearVertexText();
    setLotDraft((d) => {
      if (!d || d.pts.length >= MAX_LOT_VERTICES) return d;
      const pts = [...d.pts];
      pts.splice(edgeIdx + 1, 0, pt);
      return { ...d, pts };
    });
  };

  const lotAddCorner = () => {
    if(lotDraft&&lotDraft.pts.length<MAX_LOT_VERTICES)setLotHistory(h=>pushUndo(h,lotDraft));
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
    if(lotDraft&&lotDraft.pts.length>3)setLotHistory(h=>pushUndo(h,lotDraft));
    clearVertexText();
    setLotDraft((d) => (d && d.pts.length > 3 ? { ...d, pts: d.pts.filter((_, k) => k !== vi) } : d));
  };

  const undoLotDraft=(forward=false)=>{if(!lotDraft)return;const result=(forward?redo:undo)(lotHistory,lotDraft);if(result.snap){setLotDraft(result.snap);setLotHistory(result.hist);clearVertexText();setCancelTick(n=>n+1);}};

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


  const changeProfile = (id: string) => {
    setHist((h) => pushUndo(h, snap()));
    setProfileId(id);
    setLastDelta(null);
    setStatus(`Profile switched. Undo available.`);
  };

  const preview = !stale && previewId ? (run?.candidates.find((c) => c.id === previewId) ?? null) : null;
  const workingKeys = useMemo(() => new Set(workingLayout.parcels.map(parcelKey)), [workingLayout]);
  useEffect(() => { setSelectedLot(null); setSelectedLots([]); }, [previewId]);
  const cards = run ? selectUpToThree(run.candidates, ordering) : [];
  const previewEcon = preview
    ? { q: preview.quantities, road: preview.roadCost, cnl: preview.costNonLand, fin: preview.finance }
    : null;
  const econShown = previewEcon ?? (workingEcon
    ? { q: workingEcon.quantities, road: workingEcon.roadCost, cnl: workingEcon.costNonLand, fin: workingEcon.finance }
    : null);
  const metricsAreCommitted = !preview && (draftDirty || !!parameterDraft || !!boundaryDraft) && !draftEcon && econShown !== null;
  // Preview geometry rebuilds on the run's own snapshot green, never on a
  // later dirty draft: canvas and frozen preview economics cannot disagree.
  const previewSite = preview && runSnap
    ? siteWithEntrance(siteWithGreen(base, runSnap.green), runSnap.entrance)
    : site;
  const planShown = preview
    ? preview.family === 'spine'
      ? generateSpine(previewSite, preview.frontage)
      : generateLoop(previewSite, preview.frontage)
    : workingErrors.length && (parameterDraft || boundaryDraft || draftDirty) ? committedLayout : workingLayout;

  const R = baseSpec.costAssumptions ?? DEFAULT_COSTS;
  const shownHousing=housingSummary(preview?previewSite:metricsAreCommitted?committedSite:site,planShown.parcels);
  const homeCost = econShown ? shownHousing.builtArea * R.constructionPerM2 : 0;
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
    let label =
      selected === 'grove' ? greenLabel
        : selected === 'site' ? 'Site'
          : selected === 'circulation' ? 'Circulation'
            : selected === 'homes'
              ? (selectedLot != null ? `Lot ${selectedLot + 1}` : 'Homes')
              : 'Working plan';
    const measurements: string[] = [];
    if (selected === 'grove'&&collection) {
      measurements.push(...spaces.map(s=>`${s.name} (${s.kind}): ${polyArea(s.pts).toFixed(1)} m² true outline area; ${s.locked?'fixed shape/location':'editable'}, held during search.`));
    } else if (selected === 'grove') {
      measurements.push(
        `${green.w} × ${green.h} m at ${green.x} m from west, ${green.y} m from south — ${greenLocked ? 'Locked (shape and location held)' : 'Unlocked (editable directly; held in place during search)'}`,
      );
    } else if (selected === 'site') {
      measurements.push(`${formatM2(siteArea(baseSpec))} site; ${siteBoundary(baseSpec).length} boundary vertices; ${baseSpec.w} × ${baseSpec.h} m coordinate extents`);
      measurements.push(`Compound entrance: ${entranceLabel(entrance)}`);
    } else if (selected === 'circulation') {
      measurements.push(planning.streetNetwork ? `Manual streets, ${spec.frontage} m lot frontage; widths ${[...new Set(planning.streetNetwork.segments.map(s=>s.width))].join(', ')} m` : `${spec.family === 'spine' ? 'Spine' : 'Loop'}, ${spec.frontage} m lot frontage, 6 m road width`);
    } else if (selected === 'homes' && selectedLot != null && workingLayout.parcels[selectedLot]) {
      const rect = workingLayout.parcels[selectedLot];
      if (!hasHome(site, rect)) measurements.push('Vacant lot: home removed. No home revenue or construction cost is counted.');
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
    if(planning.housing){const mix=housingSummary(site,workingLayout.parcels);measurements.push(`Housing schedule: ${mix.rows.map(r=>`${r.name}: ${r.count} homes, ${r.builtArea} m² built`).join('; ')}. Total ${mix.builtArea} m² built. Shared price and construction rate are assumptions, not template-specific market evidence.`);}
    if (preview) measurements.push(`Previewing ${dispName(preview)} — changes not applied.`);
    if (selected === 'homes' && selectedLots.length > 1) {
      label = `${selectedLots.length} home lots`;
      const area = selectedLots.reduce((sum, i) => sum + (workingLayout.parcels[i] ? polyArea(editsMap.get(i) ?? rectCorners(workingLayout.parcels[i])) : 0), 0);
      measurements.push(`Selected lot IDs: ${selectedLots.map((i) => i + 1).join(', ')}; aggregate area ${formatM2(area)}. Quantities below describe the whole plan.`);
    }
    const commitments = [
      ...(planning.siteLocked ? ['Site boundary fixed'] : []),
      ...(planning.streetNetwork ? ['Manual street geometry and widths held during search'] : []),
      ...(planning.lotPlan!==undefined?['Manual lot plan held; frontage search disabled until generated lots are explicitly restored']:[]),
      ...((planning.minGreenArea ?? 0) > 0 ? [`Open space minimum ${planning.minGreenArea} m²`] : []),
      ...(collection?spaces.map(s=>`${s.name}: ${s.locked?'shape+location locked':'editable; held during search'}, minimum ${s.minArea} m²`):[greenLocked?'Open space A shape+location locked':'Open space A editable; held during search']),
      planning.priceLocked && Number.isFinite(ceiling) && ceiling > 0
        ? `Assumed price held at or below the Rp${ceiling}m/home ceiling`
        : 'Buyer-price ceiling disabled; selling price remains the declared assumption',
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
    manualLots:planning.lotPlan!==undefined,
    selectionLabel: assistantFacts.label,
    locksHeld: [...assistantFacts.commitments],
    gridScope: `${planning.streetNetwork ? 'Manual streets held; Spine only' : 'spine, loop'} × ${GRID.frontages.join(', ')} m frontages, seed 7, budget 250`,
    uncertainties: [
      'Whether any tested combo keeps the current home count at the capped price',
      'Whether wider lots pay for their extra road cost',
    ],
    requestText: request,
  };

  const assistantSnapshot = (): ScenarioSnapshot => ({
    version: baseSpec.costAssumptions!==undefined?10:baseSpec.planning?.openSpaces!==undefined?9:baseSpec.planning?.housing?8:baseSpec.planning?.lotPlan!==undefined?7:baseSpec.planning?.streetNetwork !== undefined ? 6 : baseSpec.contents !== undefined ? 5 : entrance.boundaryEdge !== undefined || baseSpec.planning?.minGreenArea !== undefined ? 4 : baseSpec.planning ? 3 : baseSpec.boundary ? 2 : 1,
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
    selected: selected === 'grove' ? { kind: 'green', id: collection?activeSpace?.id??'all-open-spaces':'grove-a' }
      : selected === 'site' ? { kind: 'site', id: 'site' }
        : selected === 'circulation' ? { kind: 'circulation', id: 'circulation' }
          : selected === 'homes' ? { kind: 'homes', id: selectedLots.length > 1 ? `lots-${selectedLots.join('-')}` : selectedLot != null ? `lot-${selectedLot}` : 'homes' }
            : null,
  });

  // Assistant version binding: every answer (facts, hypothesis, server
  // comparison) belongs to exactly this scenario + comparison version. Any
  // relevant edit changes the key and the panel clears itself; delayed
  // responses against an older key are discarded, never shown.
  const assistantKey = JSON.stringify({
    spec, green, greenDraftF, entrance, lots: lotEdits, boundaryDraft, parameterDraft,
    priceS, ceilingS, ownerS, targetS, profileId, baseSpec,
    selected, selectedSpace, selectedLot, selectedLots, preview: previewId,
    run: run ? { tested: run.tested, hash: run.snapshotHash } : null,
  });

  useEffect(() => {
    searchTicket.current++;
    setOptimizing(false);
  }, [baseSpec, spec, green, entrance, lotEdits, profileId, priceS, ceilingS, ownerS, targetS, greenLocked, parameterDraft, boundaryDraft]);

  const changeParameters = (next: PlanningParameters, frontage: number) => {
    if (boundaryDraft || lotDraft || draftDirty || optimizing || pendingOp) { setStatus('Apply or Cancel the current edit first.'); return; }
    setPreviewId(null);
    setParameterDraft({ planning: next, frontage, family: parameterDraft?.family });
    setLastDelta(null);
  };
  const applyParameters = () => {
    if (!parameterDraft || workingErrors.length || (streetEditing && streetDrawing !== null) || (parcelEditing&&!parcelReady) || (spacesEditing&&(spaceDrawing||spacesError))) return;
    const next = parameterDraft;
    askRegen(parcelEditing?parcelAction:'Applying planning parameters', workingLayout.parcels, () => {
      setHist((h) => pushUndo(h, snap()));
      setBaseSpec({ ...baseSpec, planning: next.planning, ...(next.contents?{contents:next.contents}:{}) });
      setSpec({ ...spec, family: next.family ?? spec.family, frontage: next.frontage });
      if(housingGeneratedReview){const {lotPlan:omitted,...generated}=next.planning;void omitted;setParameterDraft({planning:generated,frontage:next.frontage,family:next.family});}else setParameterDraft(null); setStreetEditing(false); setStreetDrawing(null); setParcelEditing(null);setHousingEditing(false);setSpacesEditing(false);setSpaceDrawing(false);setHousingGeneratedReview(false); setParcelReady(false); setParcelBounds(null); setSelectedLot(null); setPreviewId(null);
      logDecision(spacesEditing?'open-spaces':housingEditing?'housing-mix':parcelEditing?'lot-plan':streetEditing ? 'streets' : 'parameters', spacesEditing?`Applied ${spaces.length} open spaces; ${spaceArea(spaces).toFixed(1)} m² true polygon area; streets, lots and costs remeasured.`:housingEditing?`Applied housing mix: ${housingSummary(site,workingLayout.parcels).rows.map(r=>`${r.name} ${r.count} homes`).join('; ')}; ${housingSummary(site,workingLayout.parcels).builtArea} m² built.`:parcelEditing?`${parcelAction}: ${workingLayout.parcels.length} lots, ${draftEcon?.quantities.n??0} homes; roads and park retained.`:streetEditing ? `Applied ${next.planning.streetNetwork?.segments.length ?? 0} street segments; ${deriveQuantities(site,workingLayout).roadArea.toFixed(1)} m² street surface including access. Lots and costs regenerated; park retained.` : `Applied ${next.frontage} m frontage, ${next.planning.lotDepth} m depth, ${homeArea(next.planning)} m² home template, ${next.planning.greenBuffer} m park clearance.`);
      setStatus(spacesEditing?'Open spaces applied. True areas, streets, lots and economics remeasured. Undo restores the prior plan.':housingGeneratedReview?'Default assignments applied. Generated lots are now an unapplied preview: review and Apply parameters, or Cancel parameters to keep the default-assigned manual lots. Undo can restore the prior assignments.':housingEditing ? 'Housing mix applied. Template assignments, built area and construction costs remeasured. Undo restores the previous scheme.' : parcelEditing ? `${parcelAction} applied. Lots, homes and economics remeasured. Undo restores the accepted plan.` : streetEditing ? 'Street network applied. Roads, lots and costs remeasured; Undo restores the accepted plan.' : 'Planning parameters applied. Undo restores the previous geometry and costs.');
    });
  };
  const openHousingMix=(targets:number[],generatedReview=false)=>{
    if(regenBlock||draftDirty||pendingOp||optimizing||preview){setStatus('Apply or Cancel the current edit first.');return;}
    const p=baseSpec.planning??DEFAULT_PLANNING;
    setParameterDraft({planning:{...p,...(hasLayout(baseSpec)?{lotPlan:committedLayout.parcels.map(r=>({...r}))}:{}),housing:{...initialHousing(p),...(generatedReview?{assignments:{}}:{})}},frontage:spec.frontage});
    setHousingTargets(targets);setHousingGeneratedReview(generatedReview);
    setHousingEditing(true);setSelected('homes');setSelectedLot(targets[0]??null);setSelectedLots(targets);setControlsOpen(true);setAskOpen(false);setDockOpen(false);setTool('select');
    setStatus('Housing mix draft. Current lots stay fixed; review templates, assignments and measured costs before Apply. Cancel preserves the accepted library.');
  };
  const startSpaces=()=>{
    if(!hasBoundary(baseSpec)||regenBlock||draftDirty||pendingOp||optimizing||preview){setStatus('Apply or Cancel the current edit first; a site boundary is required.');return;}
    const openSpaces=hasLayout(baseSpec)?structuredClone(siteOpenSpaces(committedSite,greenLocked)):structuredClone(baseSpec.planning?.openSpaces??[]);
    setParameterDraft({planning:{...(baseSpec.planning??DEFAULT_PLANNING),openSpaces},frontage:spec.frontage});
    setSelectedSpace(openSpaces[0]?.id??null);setSpacesEditing(true);setSpaceDrawing(false);setSpaceHistory({past:[],future:[]});setSelected('grove');setSelectedLot(null);setControlsOpen(true);setContextOpen(false);setAskOpen(false);setDockOpen(false);setTool('select');setStatus('Open-space draft. Draw or select an outline; review measured consequences before Apply.');
  };
  const updateSpaces=(next:OpenSpace[],record=true)=>{
    if(record)setSpaceHistory(h=>pushUndo(h,structuredClone(planning)));
    setParameterDraft({planning:{...planning,openSpaces:next},frontage:spec.frontage});
  };
  const moveSpace=(i:number,point:Pt,record=true)=>{
    if(!activeSpace||activeSpace.locked)return;
    updateSpaces(spaces.map(s=>s.id===activeSpace.id?{...s,pts:s.pts.map((q,j)=>j===i?point:q)}:s),record);
  };
  const removeSpaceCorner=(i:number)=>{if(activeSpace&&!activeSpace.locked&&(spaceDrawing||activeSpace.pts.length>3))updateSpaces(spaces.map(s=>s.id===activeSpace.id?{...s,pts:s.pts.filter((_,j)=>j!==i)}:s));};
  const undoSpace=(forward=false)=>{const result=(forward?redo:undo)(spaceHistory,planning);if(result.snap){setSpaceHistory(result.hist);setParameterDraft({planning:result.snap,frontage:spec.frontage});const active=result.snap.openSpaces?.find(s=>s.id===selectedSpace);setSelectedSpace(active?.id??result.snap.openSpaces?.[0]?.id??null);setSpaceDrawing(!!active&&(spaceDrawing||active.pts.length<3));}};
  const viewSpaceDrawing=()=>{document.querySelector('main svg.canvas')?.scrollIntoView({block:'center'});};
  const startHousingMix=()=>openHousingMix(selectedLots.length?selectedLots:selectedLot===null?[]:[selectedLot]);
  const cancelParameters = () => { setParameterDraft(null); setStreetEditing(false); setStreetDrawing(null); setParcelEditing(null);setHousingEditing(false);setSpacesEditing(false);setSpaceDrawing(false);setHousingGeneratedReview(false); setParcelReady(false); setParcelBounds(null); setCancelTick((n) => n + 1); setStatus('Parameter edit cancelled. Accepted plan restored.'); };
  const updateStreets = (next: StreetNetwork, record = true) => {
    if (JSON.stringify(next) === JSON.stringify(streetNetwork)) return;
    if (record) setStreetHistory(h => pushUndo(h, streetNetwork));
    setStreetConnectorIds([]);
    setParameterDraft({ planning: { ...planning, streets: [], streetNetwork: next }, frontage: parameterDraft?.frontage ?? spec.frontage, family: 'spine' });
    setPreviewId(null); setLastDelta(null);
  };
  const startStreetEdit = () => {
    if (regenBlock || draftDirty || pendingOp || optimizing || preview) { setStatus('Apply or Cancel the current edit or alternative first.'); return; }
    const network = structuredClone(baseSpec.planning?.streetNetwork ?? networkFromRoads(committedLayout.roads));
    setParameterDraft({ planning: { ...(baseSpec.planning ?? DEFAULT_PLANNING), streets: [], streetNetwork: network }, frontage: spec.frontage, family: 'spine' });
    setStreetEditing(true); setStreetConnectorIds([]); setStreetDrawing(null); setStreetSelected(network.segments[0]?.id ?? null); setStreetHistory({past:[],future:[]});
    setContextOpen(false); setAskOpen(false); setControlsOpen(true); setDockOpen(false); setSelected('circulation'); setTool('select');
    setStatus('Street draft: select a segment, move junctions, or draw branches. Review quantities before Apply streets.');
  };
  const undoStreet = (forward = false) => {
    if (streetDrawing?.length && !forward) { setStreetDrawing(streetDrawing.slice(0,-1)); return; }
    const result = (forward ? redo : undo)(streetHistory, streetNetwork);
    if (result.snap) { updateStreets(result.snap,false); setStreetHistory(result.hist); setStreetDrawing(null); setCancelTick(n=>n+1); }
  };
  const addStreetPoint = (point: Pt) => {
    setStreetDrawing(points=>{
      if (points===null) return null;
      const last=points.at(-1);
      if (!last) return [point];
      if (samePoint(last,point)) return points;
      if (last.x!==point.x && last.y!==point.y) {
        const bend=Math.abs(last.x-point.x)>=Math.abs(last.y-point.y)?{x:point.x,y:last.y}:{x:last.x,y:point.y};
        return [...points,bend,point];
      }
      return [...points,point];
    });
  };
  const finishStreet = () => {
    if (!streetDrawing || streetDrawing.length<2) return;
    const next=appendStreetPath(streetNetwork,streetDrawing,streetWidth);
    updateStreets(next); setStreetDrawing(null);
    setStreetSelected(next.segments.find(s=>!streetNetwork.segments.some(old=>old.id===s.id)&&onStreet(streetDrawing.at(-1)!,s))?.id??next.segments.at(-1)?.id??null);
    setStatus('Street drawn. Crossings join at grade; review connectivity, park clearance and measured consequences before Apply.');
  };
  const startAtEntrance = () => {
    const entry=streetEntrance(site);
    if (!entry) { setStatus('No contained apron fits this entrance. Cancel the street draft and review the entrance or park.'); return; }
    setStreetDrawing([entry.point]); setTool('select');
    setStatus('Drawing from the entrance connection. Pick an existing junction or draw orthogonal legs into the site.');
  };
  const connectStreetEntrance = () => {
    const entry=streetEntrance(site);
    if (!entry || !streetNetwork.segments.length) { startAtEntrance(); return; }
    if (streetNetwork.segments.some(s=>onStreet(entry.point,s))) { setStatus('The network already reaches the entrance. Disconnected branches must also join it.'); return; }
    const gate=gateSegment(site);
    const dx=entry.point.x-(gate?.center.x??entry.point.x),dy=entry.point.y-(gate?.center.y??entry.point.y);
    const horizontal=!entry.apron || Math.abs(dx)>=Math.abs(dy);
    const direction=entry.apron?Math.sign(horizontal?dx:dy):(entrance.edge==='east'?-1:1);
    const approach={x:entry.point.x+(horizontal?6*direction:0),y:entry.point.y+(horizontal?0:6*direction)};
    const points=streetNetwork.segments.map(s=>s.a.y===s.b.y?{x:Math.max(Math.min(s.a.x,s.b.x),Math.min(Math.max(s.a.x,s.b.x),approach.x)),y:s.a.y}:{x:s.a.x,y:Math.max(Math.min(s.a.y,s.b.y),Math.min(Math.max(s.a.y,s.b.y),approach.y))});
    points.sort((a,b)=>Math.hypot(a.x-approach.x,a.y-approach.y)-Math.hypot(b.x-approach.x,b.y-approach.y));
    const end=points[0],bend=horizontal?{x:end.x,y:approach.y}:{x:approach.x,y:end.y};
    const next=appendStreetPath(streetNetwork,[entry.point,approach,bend,end],6);
    const connectorIds=next.segments.filter(s=>!streetNetwork.segments.some(old=>old.id===s.id)&&!streetNetwork.segments.some(old=>onStreet({x:(s.a.x+s.b.x)/2,y:(s.a.y+s.b.y)/2},old))).map(s=>s.id);
    updateStreets(next);setStreetConnectorIds(connectorIds);setStreetSelected(connectorIds[0]??streetSelected);
    setStatus('Proposed a 6 m connection to the nearest street. Review its geometry; park or boundary conflicts require rerouting. External access remains unverified.');
  };
  const previewGeneratedStreets = () => {
    const { streetNetwork: omitted, ...generated } = planning;
    void omitted;
    setStreetEditing(false); setStreetDrawing(null);
    setParameterDraft({planning:generated,frontage:parameterDraft?.frontage??spec.frontage,family:'spine'});
    setStatus('Generated routing preview. Apply parameters to replace manual streets, or Cancel to retain the accepted network.');
  };
  const startParcelEdit=(mode:LotOperation)=>{
    if(regenBlock||draftDirty||optimizing||preview||pendingOp){setStatus('Apply or Cancel the current edit or alternative first.');return;}
    if(!committedLayout.parcels.length||workingErrors.length){setStatus('A valid layout with lots is needed before editing blocks and lots.');return;}
    let indices=selectedLots.length?[...selectedLots]:[selectedLot??0];
    if(mode==='split')indices=[indices[0]];
    if(mode==='block')indices=lotBlocks(committedLayout.parcels).find(b=>b.indices.includes(indices[0]))?.indices??indices;
    setParcelEditing({mode,selected:indices});setParcelReady(false);setParcelAction('Lot plan');
    setParcelBounds(rectangleForLots(indices.map(i=>committedLayout.parcels[i])));
    setParameterDraft({planning:baseSpec.planning??DEFAULT_PLANNING,frontage:spec.frontage});
    setSelected('homes');setControlsOpen(true);setDockOpen(false);setAskOpen(false);setTool('select');
    setStatus('Choose a split, merge or block subdivision, then Preview. Roads and park stay fixed; Apply accepts one plan-history step.');
  };
  const invalidateParcelPreview=()=>{setParcelReady(false);setParameterDraft({planning:baseSpec.planning??DEFAULT_PLANNING,frontage:spec.frontage});};
  const previewParcels=(next:Rect[],created:Rect[],vacant:boolean,label:string,sources:number[])=>{
    setParcelSources(sources);setParcelCreated(created);
    const previous=baseSpec.contents?.removedHomes??[];
    const removedHomes=vacant?[...previous,...created.filter(r=>!previous.some(old=>lotKey(old)===lotKey(r)))]:previous;
    setParameterDraft({planning:{...(baseSpec.planning??DEFAULT_PLANNING),lotPlan:next,...(baseSpec.planning?.housing?{housing:repartitionHousing(baseSpec.planning.housing,committedLayout.parcels,next)}:{})},frontage:spec.frontage,contents:{boundary:true,layout:true,removedHomes}});
    setParcelReady(true);setParcelAction(label);setPreviewId(null);setLastDelta(null);
    requestAnimationFrame(()=>document.querySelector('.lot-plan-review')?.scrollIntoView({block:'start'}));
    setStatus(`${label} preview: review actual lots, home count, frontage and economics before Apply. Existing vacancy reservations remain held.`);
  };
  const previewGeneratedLots=()=>{
    if(regenBlock||draftDirty||preview||optimizing){setStatus('Apply or Cancel the current edit first.');return;}
    if(Object.keys(planning.housing?.assignments??{}).length){openHousingMix([],true);setStatus('Review which explicit assignments will follow the default before generating lots. Cancel keeps the current assignments and library.');return;}
    const {lotPlan:omitted,...generated}=baseSpec.planning??DEFAULT_PLANNING;void omitted;
    setParameterDraft({planning:generated,frontage:spec.frontage});
    setStatus('Generated-lot preview. Apply parameters to replace the manual lot plan, or Cancel to retain it. Existing vacancy reservations remain.');
  };
  const restoreSelectedRectangle=()=>{
    if(regenBlock||draftDirty||selectedLot===null)return;
    const key=lotKey(committedLayout.parcels[selectedLot]);if(!lotEdits[key])return;
    setHist(h=>pushUndo(h,snap()));const next={...lotEdits};delete next[key];setLotEdits(next);
    logDecision('lots',`Restored Lot ${selectedLot+1} to its rectangular base outline. Undo retains the polygon.`);
    setStatus('Selected lot restored to its rectangular outline. Undo restores the polygon.');
  };
  const togglePlanningLock = (key: 'siteLocked' | 'priceLocked') => {
    if (parameterDraft || boundaryDraft || lotDraft || draftDirty || optimizing) return;
    setHist((h) => pushUndo(h, snap()));
    setBaseSpec({ ...baseSpec, planning: { ...(baseSpec.planning ?? DEFAULT_PLANNING), [key]: !planning[key] } });
    setStatus(`${key === 'siteLocked' ? 'Site boundary' : 'Price ceiling'} ${planning[key] ? 'unlocked' : 'locked'}.`);
  };
  const toggleGreenLock = () => {
    if (parameterDraft || boundaryDraft || lotDraft || draftDirty || optimizing) return;
    setHist((h) => pushUndo(h, snap())); setGreenLocked((v) => !v); setLastDelta(null);
  };
  const parcelPreviewLots=parcelReady?parameterDraft?.planning.lotPlan??[]:[];
  const parcelNoFrontage=parcelPreviewLots.flatMap((r,i)=>lotRoadFrontage(committedLayout.roads,rectCorners(r))<=.001?[i]:[]);
  const parcelReference=(r:Rect,i:number)=>{const old=committedLayout.parcels.findIndex(p=>lotKey(p)===lotKey(r));return old<0?`New ${i+1}`:old===i?`${i+1}`:`${old+1}→${i+1}`;};
  const parcelRemovedOccupied=parcelSources.filter(i=>hasHome(committedSite,committedLayout.parcels[i])&&parcelCreated.some(r=>!hasHome(site,r)&&Math.min(r.x+r.w,committedLayout.parcels[i].x+committedLayout.parcels[i].w)>Math.max(r.x,committedLayout.parcels[i].x)&&Math.min(r.y+r.h,committedLayout.parcels[i].y+committedLayout.parcels[i].h)>Math.max(r.y,committedLayout.parcels[i].y)));
  const invalidHomeLots=housingEditing?(parameterDraft?.planning.lotPlan??[]).flatMap((r,i)=>hasHome(site,r)&&!placeFootprint(r,planning,committedLayout.roads)?[i]:[]):[];
  const selectedReshaped=selectedLot!==null&&!!lotEdits[lotKey(workingLayout.parcels[selectedLot]??{x:0,y:0,w:0,h:0})];
  const streetIssue=streetEditing?streetConflict(site):null;
  const affectedStreetLots=streetConnectorIds.length&&!workingErrors.length?committedLayout.parcels.filter(old=>!workingLayout.parcels.some(next=>lotKey(next)===lotKey(old))):[];
  const streetQuickReview=`Homes ${committedEcon?.quantities.n??'—'} → ${draftEcon?.quantities.n??'—'} · Street ${formatM2(deriveQuantities(committedSite,committedLayout).roadArea)} → ${draftEcon?formatM2(draftEcon.quantities.roadArea):'Unavailable'}`;
  const joinStreetGap=()=>{if(streetIssue?.kind==='disconnected'&&streetIssue.gap){updateStreets(splitJunctions(moveStreetNode(streetNetwork,streetIssue.gap.from,streetIssue.gap.to)));setStatus('Joined the highlighted endpoint to the connected centreline in this draft. Review full widths and quantities before Apply.');}};
  const inspectorQuantities = econShown?.q;
  const inspectorLots = preview ? preview.lots : lotsByIndex;
  const selectedParcel = selectedLot === null ? null : planShown.parcels[selectedLot];
  const inspectorArea = selected === 'grove' ? (collection?(activeSpace?polyArea(activeSpace.pts):spaceArea(spaces)):(workingErrors.length ? green.w * green.h : draft.draft.w * draft.draft.h))
    : selected === 'circulation' ? inspectorQuantities?.roadArea ?? null
      : selected === 'homes' && selectedLots.length > 1 ? selectedLots.reduce((area, i) => area + (planShown.parcels[i] ? polyArea(inspectorLots[i] ?? rectCorners(planShown.parcels[i])) : 0), 0)
      : selected === 'homes' ? selectedParcel ? polyArea(inspectorLots[selectedLot!] ?? rectCorners(selectedParcel)) : inspectorQuantities?.parcelArea ?? null
        : siteArea(boundaryPreview ?? baseSpec);

  const [deleteKind, setDeleteKind] = useState<'homes' | 'layout' | 'boundary' | null>(null);
  const resetResults = (keepSelection = false) => {
    searchTicket.current++; setOptimizing(false); setRun(null); setRunSnap(null); setPreviewId(null);
    setIntent(null); setPropSnap(null); setAcceptedSummary(null); setLastDelta(null); setCmpExpand(false);
    if (!keepSelection) { setSelectedLots([]); setSelectedLot(null); }
    setLotDraft(null); setPendingOp(null); setAskOpen(false);
    setCancelTick(n => n + 1);
  };
  const selectedHomeIndices = (selectedLots.length ? selectedLots : selectedLot === null ? workingLayout.parcels.map((_, i) => i) : [selectedLot])
    .filter(i => workingLayout.parcels[i] && hasHome(site, workingLayout.parcels[i]));
  const requestDelete = (kind: 'homes' | 'layout' | 'boundary') => {
    if (regenBlock || draftDirty || optimizing || preview) { setStatus('Apply or Cancel the current edit or preview before removing plan objects.'); return; }
    if (kind === 'boundary' && planning.siteLocked) { setStatus('Unlock the site boundary before deleting it or starting a blank plan.'); return; }
    setDeleteKind(kind);
  };
  const confirmDelete = () => {
    if (!deleteKind) return;
    setHist(h => pushUndo(h, snap()));
    if (deleteKind === 'homes') {
      const removedHomes = [...(baseSpec.contents?.removedHomes ?? [])];
      for (const i of selectedHomeIndices) if (!removedHomes.some(r => lotKey(r) === lotKey(workingLayout.parcels[i]))) removedHomes.push({ ...workingLayout.parcels[i] });
      setBaseSpec({ ...baseSpec, contents: { boundary: true, layout: true, removedHomes } });
      logDecision('delete', `Removed ${selectedHomeIndices.length} homes; retained their lots as no-home reservations.`);
      setStatus('Homes removed. Lots stay vacant, including overlapping lots after regeneration. Undo or Restore removed homes brings them back.');
    } else {
      const boundary = deleteKind === 'layout' && hasBoundary(baseSpec);
      const {streetNetwork: omittedStreets, lotPlan:omittedLots, openSpaces:omittedSpaces, ...retainedPlanning} = baseSpec.planning ?? DEFAULT_PLANNING; void omittedStreets;void omittedLots;void omittedSpaces;
      const { boundary: oldBoundary, ...rest } = baseSpec;
      setBaseSpec({ ...rest, ...(boundary && oldBoundary ? { boundary: oldBoundary } : {}), planning: { ...retainedPlanning, streets: [], ...(retainedPlanning.housing?{housing:{...retainedPlanning.housing,assignments:{}}}:{}), minGreenArea: 0, siteLocked: boundary && planning.siteLocked }, contents: { boundary, layout: false, removedHomes: [] } });
      setLotEdits({}); setGreenLocked(false); setGreenDraftF(strFields(green)); setSelected('site');
      if (!boundary) {
        setShowBackdrop(false);
        const placeholder = { edge: 'west' as const, offset: baseSpec.h / 2, width: 8 };
        setEntrance(placeholder); setEntranceS(String(placeholder.offset));
      }
      setSiteFit(n => n + 1);
      logDecision('delete', boundary ? 'Cleared layout; kept the boundary and project assumptions.' : 'Removed boundary and dependent layout. Reference photo hidden; project assumptions retained.');
      setStatus(boundary ? 'Layout cleared. Boundary retained. Generate a layout when ready; Undo restores the previous scheme.' : 'Blank plan. Draw a boundary to begin. Project name and assumptions are retained; Undo restores the plan.');
    }
    resetResults(deleteKind === 'homes'); setDeleteKind(null);
  };
  const restorationConflicts=useMemo(()=>homeRestorationConflicts(committedSite,committedLayout,editsForLayout(committedLayout.parcels,lotEdits)),[committedSite,committedLayout,lotEdits]);
  const restoreHomes = () => {
    if (regenBlock || draftDirty || preview) { setStatus('Apply or Cancel the current edit first.'); return; }
    const next = { ...committedSite, contents: { boundary: true, layout: true, removedHomes: [] } };
    const errors = validateLayout(next, buildWorking(next, spec), editsMap);
    if (errors.length) { requestAnimationFrame(()=>document.querySelector(".home-restoration-review")?.scrollIntoView({block:"center"}));setStatus(`Homes cannot be restored: ${errors[0]}. Adjust the vacant lot or undo its reshape first.`); return; }
    setHist(h => pushUndo(h, snap()));
    setBaseSpec({ ...baseSpec, contents: { boundary: true, layout: true, removedHomes: [] } });
    resetResults(); logDecision('restore', 'Restored removed homes in the current generated lots.'); setStatus('Removed homes restored. Undo available.');
  };
  const generateLayout = () => {
    if (!hasBoundary(baseSpec) || regenBlock || draftDirty) return;
    const result = starterLayout(committedSite, spec.frontage);
    if (result.error) { setStatus(`Layout not generated: ${result.error}`); return; }
    setHist(h => pushUndo(h, snap()));
    const next = result.site;
    setBaseSpec({ costAssumptions:baseSpec.costAssumptions, w: next.w, h: next.h, boundary: next.boundary, planning: next.planning, contents: next.contents });
    setGreen({ ...next.green }); setGreenDraftF(strFields(next.green));
    setEntrance({ ...next.entrance }); setEntranceS(String(next.entrance.offset));
    setSpec({ family: 'spine', frontage: spec.frontage }); setGreenLocked(false); resetResults();
    logDecision('generate', 'Generated a contained starter Spine layout; park and entrance are assumed, not surveyed.');
    setStatus('Starter layout generated. Review the assumed park and entrance; this is not a maximum-capacity result. Undo restores the boundary-only plan.');
  };
  const openContext = () => {
    if (regenBlock || draftDirty || pendingOp || optimizing) { setStatus('Apply or Cancel the current edit before opening Site context.'); return; }
    setSelected('site'); setContextOpen(true); setControlsOpen(true); setDockOpen(false); setPreviewId(null); setSiteFit(n => n + 1);
  };
  const commitContext = (next: SiteContext, message: string) => {
    const errors = contextErrors(next); if (errors.length) { setStatus(errors[0]); return; }
    setHist(h => pushUndo(h, snap())); setSiteContext(next); setContextPending(false);
    logDecision('context', message); setStatus(message); setSiteFit(n => n + 1);
  };
  const reviewImportedBoundary = (points: Pt[], source: BoundarySource) => {
    if (planning.siteLocked || parameterDraft || boundaryDraft || lotDraft || draftDirty || optimizing || pendingOp) { setStatus('Unlock the boundary and finish current plan edits before importing a boundary.'); return; }
    setContextOpen(false); setContextPending(false); setSelected('site'); setTool('select');
    setBoundaryHistory({ past: [], future: [] });
    setBoundaryDraft({ pts: points, closed: true, newSite: !hasBoundary(baseSpec), source, ...(hasBoundary(baseSpec) ? { entrance: rebaseEntrance(siteBoundary(baseSpec), points, entrance) } : {}) });
    setSiteFit(n => n + 1); setStatus('Imported outline is a draft. Review area and layout consequences, then Apply or Cancel.');
  };
  const referencePhotoControls = <>
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
                    URL.revokeObjectURL(refImage); setRefImage(null); setPhotoError(null);
                    setStatus('Reference photo removed. This session-only image cannot be recovered with Undo.');
                  }}
                >
                  Remove photo
                </button>
              </div>
              <p className="note">Reference only; never used for measurements. Photos are lost on project switching, reload or close and excluded from backups. Removal is immediate and cannot be undone.</p>
            </>
          )}
  </>;
  const restoreHomesBlocked = regenBlock ?? (draftDirty ? 'Apply park or Cancel park before restoring homes.' : preview ? 'Apply or Cancel the alternative preview before restoring homes.' : null);
  const planActions = <section className="plan-actions" aria-label="Remove and restart"><h3>Plan actions</h3>
    {selected === 'homes' && hasLayout(baseSpec) && <button type="button" disabled={!selectedHomeIndices.length || !!regenBlock || draftDirty || !!preview} onClick={() => requestDelete('homes')}>Remove {selectedHomeIndices.length} selected home{selectedHomeIndices.length === 1 ? '' : 's'}</button>}
    {!!baseSpec.contents?.removedHomes.length && <><p className="note">Removed homes keep their original lot regions vacant during layout changes.</p><button type="button" disabled={!!restoreHomesBlocked} aria-describedby={restoreHomesBlocked?'restore-homes-reason':restorationConflicts.length?'home-restoration-review':undefined} onClick={restoreHomes}>Restore removed homes</button>{restoreHomesBlocked && <p className="note" id="restore-homes-reason" role="status">{restoreHomesBlocked} This action is waiting for the current edit to finish; it does not mean a home cannot fit. Fit is checked when you restore.</p>}{!restoreHomesBlocked&&restorationConflicts.length>0&&<section className="home-restoration-review" id="home-restoration-review" aria-label="Home restoration conflicts" role="status"><h4>These homes cannot be restored yet</h4>{restorationConflicts.map(issue=><div key={issue.index}><p>{issue.message}</p><button type="button" onClick={()=>openHousingMix([issue.index])}>Reassign home for Lot {issue.index+1}</button><button type="button" onClick={()=>{const tools=document.querySelector<HTMLDetailsElement>('.object-tools');if(tools)tools.open=true;beginLotReshape(issue.index);}}>Edit Lot {issue.index+1} outline</button></div>)}<p>Choose a fitting design or adjust the lot, Apply that edit, then try Restore removed homes again. Accepted homes and vacant lots are unchanged.</p></section>}</>}
    <button type="button" disabled={!hasLayout(baseSpec) || !!regenBlock || !!preview || draftDirty} onClick={() => requestDelete('layout')}>Clear layout</button>
    <button type="button" disabled={!hasBoundary(baseSpec) || planning.siteLocked || !!regenBlock || !!preview || draftDirty} onClick={() => requestDelete('boundary')}>Delete boundary and layout</button>
    <p className="note">Clear layout keeps the boundary. Delete boundary and layout restarts with a blank drawing. Both keep the project name and economic assumptions.</p>
  </section>;

  const boundaryEditing = boundaryDraft !== null;
  useEffect(() => { inspectorRef.current?.scrollTo({ top: 0 }); }, [selected, selectedLot, boundaryEditing, streetEditing, parcelEditing,housingEditing]);

  const selectFromCanvas = (kind: Exclude<Sel, null>) => {
    if (contextPending) { setStatus('Apply or Cancel the site context edit before inspecting plan objects.'); return; }
    if (streetEditing || parcelEditing) { setStatus('Apply or Cancel the current plan edit first.'); return; }
    setContextOpen(false); setSelected(kind); setControlsOpen(true);
  };

  return (
    <div className={cmpExpand ? "bench compare-focused" : "bench"} onKeyDown={(e) => {
      const tag = (e.target as HTMLElement).tagName;
      if ((e.target as HTMLElement).closest('dialog')) return;
      if (e.key === 'Escape' && streetDrawing !== null) { e.stopPropagation(); setStreetDrawing(null); return; }
      if (e.key === 'Escape' && parameterDraft) { e.stopPropagation(); cancelParameters(); return; }
      if (e.key === 'Escape' && boundaryDraft) { e.stopPropagation(); cancelBoundary(); return; }
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) && !(e.ctrlKey || e.metaKey)) return;
      if (e.key === 'Delete' && !['BUTTON', 'SUMMARY'].includes(tag) && !boundaryDraft && !lotDraft && selected === 'homes' && selectedHomeIndices.length) { e.preventDefault(); requestDelete('homes'); return; }
      if ((e.ctrlKey || e.metaKey) && ['z', 'y'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        if (spacesEditing) { undoSpace(e.key.toLowerCase()==='y'||e.shiftKey);return; }
        if (streetEditing) { undoStreet(e.key.toLowerCase() === 'y' || e.shiftKey); return; }
        if(lotDraft){undoLotDraft(e.key.toLowerCase()==='y'||e.shiftKey);return;}
        if (boundaryDraft) { undoBoundary(e.key.toLowerCase() === 'y' || e.shiftKey); return; }
        if (e.key.toLowerCase() === 'y' || e.shiftKey) doRedo(); else doUndo();
      } else if (e.key.toLowerCase() === 'v') setTool('select');
      else if (e.key.toLowerCase() === 'h') setTool('pan');
    }}>
      {experimentOpen && <FeasibilityExperiments site={committedSite} spec={spec} lots={lotEdits} price={price*M} owner={ownerL*BN} target={targetT/100} ceiling={ceiling*M} profile={profile} greenLocked={greenLocked}
        onCancel={() => { setExperimentOpen(false); setStatus('Experiment cancelled. Accepted plan and costs retained.'); }}
        onApply={(next, nextSpec, detail) => {
          setHist(h => pushUndo(h, snap()));
          setBaseSpec({ ...baseSpec, costAssumptions: next.costAssumptions, ...(next.planning?{planning:next.planning}:{}) });
          setSpec(nextSpec); setExperimentOpen(false); setPreviewId(null); setSelectedLot(null); setSelectedLots([]); setLastDelta(null);
          logDecision('feasibility', detail); setStatus('Experiment applied. Geometry and costs remeasured; Undo restores the previous accepted plan.');
        }} />}
      {leaveBoundary && <ConfirmPlanChange title="Leave this boundary draft?" detail="This boundary draft has not been applied or saved. Keep editing to review and Apply it, or discard it to open Projects. The accepted plan stays unchanged." recovery="Discarding the draft cannot be undone. Opening Projects alone keeps accepted-plan history and photos; leaving this project ends them." action="Discard draft and open projects" cancelLabel="Keep editing" onCancel={() => setLeaveBoundary(false)} onConfirm={() => { cancelBoundary(); setLeaveBoundary(false); onOpenProjects(sessionRisk); }} />}
      {deleteKind && <ConfirmPlanChange title={deleteKind === 'homes' ? 'Remove selected homes?' : deleteKind === 'layout' ? 'Clear this layout?' : 'Delete boundary and layout?'} detail={deleteKind === 'homes' ? `Remove ${selectedHomeIndices.length} homes while keeping their lots vacant. New generated lots overlapping these reservations also stay vacant. Keep the boundary, streets, park, project name, assumptions and reference photo.` : deleteKind === 'layout' ? 'Remove homes, lots, streets and open space, including park protections and vacant-home reservations. Keep this boundary, project name, economic assumptions, site context and any reference photo in its current visibility.' : 'Remove the boundary, homes, lots, streets and open space. Keep the project name, economic assumptions and site context. Any reference photo is hidden and remains available in Site source only until you switch projects, reload or close.'} action={deleteKind === 'homes' ? 'Remove homes' : deleteKind === 'layout' ? 'Confirm clear layout' : 'Confirm delete boundary and layout'} onConfirm={confirmDelete} onCancel={() => setDeleteKind(null)} />}
      <a className="skiplink" href="#canvascol">
        Skip to plan
      </a>
      <header className="topbar">
        <div className="brand">
          <strong>UNBUILT</strong><button type="button" className="projects-button" onClick={openProjects}>Projects</button>
          <button type="button" className="project-name" onClick={openProjects} title={projectName}>{projectName}</button>
        </div>
        <div className="workstate" aria-live="polite">
          {cmpExpand ? 'Comparing plans' : preview ? `Previewing ${dispName(preview)}` : 'Working plan'}
        </div>
        <nav className="workspace-tabs" aria-label="Workspace"><button type="button" className={!dockOpen ? 'current' : ''} onClick={() => { setDockOpen(false); setCmpExpand(false); }}>Plan</button><button type="button" disabled={!hasLayout(baseSpec)} onClick={() => { setDockTab('options'); setDockOpen(true); }}>Alternatives</button><button type="button" disabled={!hasLayout(baseSpec)} onClick={() => { selectFromCanvas('homes'); if (!contextPending) setSelectedLot(null); }}>Parcels</button></nav>
        <div className="topactions" role="toolbar" aria-label="Edit history">
          <button type="button" className="save-project" title="Save accepted edits in this browser only. Apply pending edits first. Download a backup from Projects." onClick={() => { if (onSaveProject(serializeProject(projectState(), decisions, projectName))) setStatus('Project saved. Pending edits are kept only when you Apply them.'); }}>Save</button>
          <button type="button" onClick={() => boundaryDraft ? undoBoundary() : spacesEditing ? undoSpace() : streetEditing ? undoStreet() : lotDraft?undoLotDraft():doUndo()} disabled={boundaryDraft ? boundaryHistory.past.length === 0 : spacesEditing?spaceHistory.past.length===0:streetEditing ? streetHistory.past.length === 0 : lotDraft?lotHistory.past.length===0:hist.past.length===0} aria-label="Undo" title="Undo (Ctrl+Z)"><UndoIcon size={18} /><span className="sr-only">Undo</span></button>
          <button type="button" onClick={() => boundaryDraft ? undoBoundary(true) : spacesEditing ? undoSpace(true) : streetEditing ? undoStreet(true) : lotDraft?undoLotDraft(true):doRedo()} disabled={boundaryDraft ? boundaryHistory.future.length === 0 : spacesEditing?spaceHistory.future.length===0:streetEditing ? streetHistory.future.length === 0 : lotDraft?lotHistory.future.length===0:hist.future.length===0} aria-label="Redo" title="Redo (Ctrl+Shift+Z)"><RedoIcon size={18} /><span className="sr-only">Redo</span></button>
          <button type="button" className="export-action" title="Export the accepted plan and decision record as JSON" onClick={exportRecord}><DownloadIcon size={16} /><span>Export JSON</span></button>
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
        <span><b className="active-project-name">{projectName} · </b>{hasBoundary(baseSpec) ? <>{formatM2(siteArea(baseSpec))} · {siteBoundary(baseSpec).length} vertices{hasLayout(baseSpec) && <> · Entrance {entrance.boundaryEdge === undefined ? entrance.edge : `edge ${entrance.boundaryEdge + 1}`} · {spec.family} {spec.frontage} m</>}</> : 'Blank plan'}</span>
        <span>Selected: {assistantFacts.label}</span>
        <span title={workingErrors[0]} className={workingErrors.length > 0 ? 'bad' : 'ok'}>{!hasBoundary(baseSpec) ? 'No boundary yet' : workingLayout.empty ? 'Boundary only' : workingLayout.supportError ? 'Layout unavailable' : workingErrors.length > 0 ? 'Invalid plan · see issues' : workingWarnings.length ? 'Profile / template warning' : 'Plan valid'}</span>
        <details className="save-summary"><summary>{saveStatus.startsWith('Project saved') ? 'Saved in this browser' : saveStatus}</summary><div><strong>Accepted plan · browser-local storage</strong><p>{saveStatus}</p><p>Boundary, entrance, open space, housing templates and lot assignments, constraints, assumptions, lot edits and decisions are saved. Site context and survey calibration are saved. Drafts, undo history, searches, comparisons, photos and survey media are session-only; reattach original survey files after reopening.</p><button type="button" onClick={exportRecord}>Download accepted plan</button><p>Private browsing or clearing site data can remove local projects. Download a portable backup before leaving a private session.</p><p>To keep an alternative, apply it after review and download it. Import the file from Decision record to reopen it. A preview alone is not saved.</p></div></details>
      </div>
      <p role="status" aria-live="polite" className="note srstatus" title={status}>
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
              if (parameterDraft) cancelParameters();
              else if (boundaryDraft) cancelBoundary();
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
          <button type="button" className="tool" title="Draw a new site boundary" onClick={() => startBoundary(true)}><DrawSiteIcon /><span>Draw site</span></button>
          <button type="button" className={contextOpen ? "tool on" : "tool"} aria-pressed={contextOpen} aria-label="Open site context" title="Survey, boundary import and surroundings" onClick={openContext}><LayersIcon /><span>Context</span></button>
          <button type="button" className="tool" title="Select the site" onClick={() => selectFromCanvas('site')}><SiteIcon /><span>Site</span></button>
          <div className="rail-divider" />
          <button type="button" className={selected === 'circulation' ? 'tool selected-object' : 'tool'} aria-label="Inspect circulation" disabled={!hasLayout(baseSpec)} title="Circulation and cross streets" onClick={() => selectFromCanvas('circulation')}><CirculationIcon /><span>Streets</span></button>
          <button type="button" className={selected === 'homes' ? 'tool selected-object' : 'tool'} aria-label="Inspect homes" disabled={!hasLayout(baseSpec)} title="Lots and housing template" onClick={() => { selectFromCanvas('homes'); if (!contextPending) setSelectedLot(null); }}><HomesIcon /><span>Homes</span></button>
          <button type="button" className={selected === 'grove' ? 'tool selected-object' : 'tool'} aria-label="Inspect open space" disabled={!hasLayout(baseSpec)} title="Open space A" onClick={() => selectFromCanvas('grove')}><OpenSpaceIcon /><span>Green</span></button>
          <button type="button" className="tool rail-assistant" aria-label="Open planning assistant" disabled={!hasLayout(baseSpec)} title="Ask about this plan" onClick={() => { if (contextPending) { setStatus('Apply or Cancel the site context edit first.'); return; } setContextOpen(false); setAskOpen(true); setControlsOpen(true); }}><AssistantIcon /><span>Ask</span></button>

        </nav>

        <main className="canvascol" id="canvascol">
          <div className="controlstoggle">
            <button type="button" onClick={() => setControlsOpen((v) => !v)} aria-expanded={controlsOpen}>
              {controlsOpen ? 'Hide controls' : 'Show controls'}
            </button>
          </div>
          <div className="canvas-workspace" inert={optimizing || undefined}>
          <PlanCanvas
            spaceDrafts={spacesEditing||(!hasLayout(baseSpec)&&collection)?spaces:undefined} activeSpace={greenSelected?selectedSpace:null} spacesEditing={spacesEditing} spaceDrawing={spaceDrawing} spaceValid={!spacesError&&!workingErrors.length} spaceClearance={planning.greenBuffer}
            onSpaceSelect={id=>{setSelected('grove');setSelectedSpace(id);setSelectedLot(null);}}
            onSpacePoint={point=>{if(activeSpace&&!activeSpace.locked&&activeSpace.pts.length<24)updateSpaces(spaces.map(s=>s.id===activeSpace.id?{...s,pts:[...s.pts,point]}:s));}}
            onSpaceFinish={()=>setSpaceDrawing(false)} onSpaceMove={moveSpace} onSpaceRemove={removeSpaceCorner}
            onSpaceRevert={pts=>{if(activeSpace)updateSpaces(spaces.map(s=>s.id===activeSpace.id?{...s,pts}:s),false);spaceGesture.current=null;}}
            onSpaceGesture={before=>{if(before===null)spaceGesture.current=structuredClone(planning);else if(spaceGesture.current){const old=spaceGesture.current;setSpaceHistory(h=>pushUndo(h,old));spaceGesture.current=null;}}}
            siteContext={siteContext}
            surveyRaster={showSurvey ? surveyRaster : null}
            showContext={contextOpen}
            noteDraft={noteDraft}
            contextPicking={contextPicking}
            onContextPick={point => { if (noteDraft) setNoteDraft({ ...noteDraft, points: noteDraft.kind === 'street' ? [...noteDraft.points, point].slice(0, 20) : [point] }); }}
            contents={workingErrors.length?baseSpec.contents:site.contents}
            parcelReferences={parcelEditing&&parcelReady&&!workingErrors.length?workingLayout.parcels.map(parcelReference):undefined}
            blockOutline={parcelEditing?parcelBounds:null}
            invalidHomeLots={invalidHomeLots}
            blockReviewLabel={spacesEditing?"Review open spaces":undefined}
            blockTitle={spacesEditing?"Unapplied open spaces":housingEditing?"Unapplied housing mix":undefined}
            blockSummary={spacesEditing?`${spaces.length} spaces · ${spacesError??`${spaceArea(spaces).toFixed(1)} m² true area`} · Homes ${committedEcon?.quantities.n??0} → ${draftEcon?.quantities.n??'Unavailable'}`:housingEditing?(workingErrors.length?`Built area unavailable · ${workingErrors[0]}`:`${housingSummary(committedSite,committedLayout.parcels).builtArea} → ${housingSummary(site,parameterDraft?.planning.lotPlan??[]).builtArea} m² built`):parcelEditing&&parcelReady?`Lots ${committedLayout.parcels.length} → ${parameterDraft?.planning.lotPlan?.length??'—'} · Homes ${committedEcon?.quantities.n??'—'} → ${draftEcon?.quantities.n??'Unavailable'}${workingErrors.length?` · ${workingErrors[0]}`:''}`:undefined}
            parcelProposal={parcelEditing&&parcelReady&&parameterDraft?.planning.lotPlan?{lots:parameterDraft.planning.lotPlan,valid:!workingErrors.length,inaccessible:parcelNoFrontage}:null}
            onBlockReview={spacesEditing?()=>{setControlsOpen(true);requestAnimationFrame(()=>document.querySelector(".open-spaces-editor")?.scrollIntoView({block:"start"}));}:housingEditing?()=>{setControlsOpen(true);requestAnimationFrame(()=>document.querySelector(".housing-mix-editor")?.scrollIntoView({block:"start"}));}:parcelEditing?()=>{setControlsOpen(true);requestAnimationFrame(()=>document.querySelector('.lot-plan-editor')?.scrollIntoView({block:'start'}));}:undefined}
            planning={workingErrors.length ? baseSpec.planning : planning}
            streetOffsets={planning.streetNetwork ? [] : planning.streets}
            editableStreets={streetEditing ? streetNetwork : null}
            streetStroke={streetDrawing}
            streetSelected={streetNetwork.segments.find(s=>s.id===streetSelected)?.id??streetNetwork.segments[0]?.id??null}
            onStreetReview={() => { setControlsOpen(true); requestAnimationFrame(()=>{ document.querySelector('.street-editor')?.scrollIntoView({block:'start'}); document.querySelector<HTMLElement>('.street-editor h2')?.focus({preventScroll:true}); }); }}
            streetDraftValid={!workingErrors.length}
            streetConflict={streetIssue} streetConnectorIds={streetConnectorIds} streetAffectedLots={affectedStreetLots} streetSummary={streetQuickReview}
            onStreetSelect={setStreetSelected}
            onStreetPoint={addStreetPoint}
            onStreetFinish={finishStreet}
            onStreetStop={() => setStreetDrawing(null)}
            onStreetNodeMove={(original, from, to) => updateStreets(moveStreetNode(original,from,to), false)}
            onStreetNodeCommit={original => setStreetHistory(h => pushUndo(h,original))}
            onStreetNodeKeyMove={(from,to) => updateStreets(moveStreetNode(streetNetwork,from,to))}
            onStreetNodeCancel={original => updateStreets(original,false)}
            onStreetDrag={!streetEditing && !planning.streetNetwork && !contextOpen && !preview && !boundaryDraft && !lotDraft && !draftDirty && !optimizing ? (i, y) => changeParameters({ ...planning, streets: planning.streets.map((value, index) => i === index ? y : value) }, parameterDraft?.frontage ?? spec.frontage) : undefined}
            layout={planShown}
            boundary={siteBoundary(baseSpec)}
            boundaryDraft={boundaryDraft}
            boundaryLayoutPreview={!!boundaryPreview && !workingErrors.length}
            onBoundaryChange={changeBoundary}
            onBoundaryApply={applyBoundary}
            onBoundaryGestureStart={() => { boundaryGesture.current = boundaryDraft; }}
            onBoundaryGestureCommit={(pts) => { if (boundaryDraft) setBoundaryHistory((h) => pushUndo(h, boundaryGesture.current ?? { ...boundaryDraft, pts })); boundaryGesture.current = null; }}
            onBoundaryCancel={cancelBoundary}
            siteW={baseSpec.w}
            siteH={baseSpec.h}
            entrance={site.entrance}
            greenLocked={greenLocked}
            greenSelected={greenSelected}
            editing={!collection && !contextOpen && !planShown.empty && greenSelected && !greenLocked && lotDraft === null && !parameterDraft && !optimizing && !preview}
            entranceEditing={!contextOpen && !planShown.empty && selected === 'site' && !boundaryDraft && !parameterDraft && !optimizing && !preview}
            entranceValid={entranceErrors(site).length === 0}
            onSelectEntrance={() => selectFromCanvas('site')}
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
            workingKeys={parcelEditing?new Set(committedLayout.parcels.map(lotKey)):preview && showPrev ? workingKeys : null}
            vsNote={
              preview && runSnap
                ? `${preview.quantities.n - runSnap.n >= 0 ? '+' : ''}${preview.quantities.n - runSnap.n} homes, road ${preview.quantities.roadArea <= runSnap.road ? '-' : '+'}${Math.abs(Math.round(preview.quantities.roadArea - runSnap.road)).toLocaleString('en-US')} m²`
                : null
            }
            selectedKind={selected === 'circulation' ? 'circulation' : selected === 'homes' ? 'homes' : null}
            siteSelected={selected === 'site'}
            onSelectSite={() => selectFromCanvas('site')}
            onSelectGreen={() => selectFromCanvas('grove')}
            onSelectLot={(i, append) => {
              if(housingEditing){setHousingTargets(previous=>append?previous.includes(i)?previous.filter(j=>j!==i):[...previous,i]:[i]);setSelected('homes');setSelectedLot(i);setStatus('Housing targets updated from the drawing. Choose a template and preview the assignment before Apply.');return;}
              if (contextPending || parcelEditing) { setStatus('Apply or Cancel the current plan edit first.'); return; }
              setContextOpen(false);
              const previous = selectedLots.length ? selectedLots : selectedLot === null ? [] : [selectedLot];
              const next = append && selected === 'homes' ? previous.includes(i) ? previous.filter((j) => j !== i) : [...previous, i] : [i];
              setSelected(next.length ? 'homes' : null);
              setSelectedLots(next); setSelectedLot(next.at(-1) ?? null);
            }}
            selectedLots={housingEditing?housingTargets:selectedLots}
            lotEdits={preview ? preview.lots : lotsByIndex}
            selectedLot={housingEditing&&housingTargets.length===1?housingTargets[0]:selectedLot}
            lotDraft={lotDraft}
            lotDraftValid={lotDraftErrors.length === 0}
            onLotVertexDrag={(vi,point)=>lotVertexDrag(vi,point,false)}
            onLotNodeKeyMove={(vi,point)=>lotVertexDrag(vi,point)}
            onLotGestureCommit={pts=>{if(lotDraft)setLotHistory(h=>pushUndo(h,{...lotDraft,pts}));}}
            onLotVertexRevert={lotVertexRevert}
            onLotVertexAdd={lotVertexAdd}
            onLotVertexRemove={lotRemoveVertex}
            onFixedHint={() => setStatus(planning.housing?'Homes follow their assigned templates. Open Housing mix to edit templates or assignments, or reshape this lot.':'Homes use the shared housing template. Resize it in the inspector to update every placed home and its cost, or reshape this lot.')}
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
            onToolChange={setTool}
            wide={planWide}
            onToggleWide={() => setPlanWide((v) => !v)}
            fitTick={siteFit}
            cancelTick={cancelTick}
            onEscapeIdle={() => {
              setCancelTick((t) => t + 1);
              if (parameterDraft) cancelParameters();
              else if (boundaryDraft) cancelBoundary();
              else if (lotDraft) cancelLotEdit();
              else if (draftDirty) cancelDraft();
              else setSelected(null);
            }}
          />
          </div>
          {selected && !boundaryDraft && !contextOpen && <div className="mobile-selection"><span>{selected === 'homes' && selectedLot !== null ? `Lot ${selectedLot + 1}` : selected === 'grove' ? greenLabel : selected === 'circulation' ? 'Circulation' : 'Site boundary'} · {inspectorArea === null ? 'Area unavailable' : formatM2(inspectorArea)}</span><button type="button" onClick={() => { setControlsOpen(true); requestAnimationFrame(() => { document.querySelector<HTMLSelectElement>('.object-picker select')?.focus(); document.querySelector('.inspector-col')?.scrollIntoView({ behavior: 'auto', block: 'start' }); }); }}>Inspect selection</button></div>}
          {optimizing && <div role="status" className="optimization-status">Optimizing layout… <button type="button" onClick={() => { searchTicket.current++; setOptimizing(false); setStatus('Optimization cancelled. Working plan unchanged.'); }}>Cancel optimization</button></div>}
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
              <span title={workingWarnings.join(" ")}>Allowance{workingWarnings.length?" · provisional":""} <strong>{formatRp(econShown.fin.landAllowance)}</strong></span>
              <span><strong>{formatGap(econShown.fin.ownerGap)}</strong></span>
              {workingErrors.length > 0 && (
                <span role="alert" className="error">Invalid plan — resolve Issues.</span>
              )}
            </p>
          )}

        </main>

        <aside
          ref={inspectorRef}
          className="inspector-col"
          aria-label="Objects and inspector"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setCancelTick((t) => t + 1);
              if (parameterDraft) cancelParameters();
              else if (boundaryDraft) cancelBoundary();
              else if (lotDraft) cancelLotEdit();
              else if (draftDirty) cancelDraft();
              else setSelected(null);
            }
          }}
        >
          {spacesEditing ? <OpenSpacesEditor spaces={spaces} selected={selectedSpace} onSelect={setSelectedSpace} onChange={updateSpaces} drawing={spaceDrawing} onDrawing={setSpaceDrawing} error={spacesError??workingErrors[0]??null} minimum={planning.minGreenArea??0} clearance={planning.greenBuffer} onMinimum={n=>{setSpaceHistory(h=>pushUndo(h,planning));changeParameters({...planning,minGreenArea:n},spec.frontage);}} onClearance={n=>{setSpaceHistory(h=>pushUndo(h,planning));changeParameters({...planning,greenBuffer:n},spec.frontage);}} onApply={applyParameters} onCancel={cancelParameters} onCanvas={viewSpaceDrawing} review={<section className="space-review"><h3>Accepted plan → open-space draft</h3><dl className="kv"><dt>Designed green area</dt><dd>{hasLayout(baseSpec)?spaceArea(siteOpenSpaces(committedSite)).toFixed(1):spaceArea(baseSpec.planning?.openSpaces??[]).toFixed(1)} → {spacesError?'Unavailable':spaceArea(spaces).toFixed(1)} m²</dd><dt>Homes</dt><dd>{committedEcon?.quantities.n??0} → {draftEcon?.quantities.n??'Unavailable'}</dd><dt>Street surface</dt><dd>{committedEcon?formatM2(committedEcon.quantities.roadArea):'—'} → {draftEcon?formatM2(draftEcon.quantities.roadArea):'Unavailable'}</dd><dt>Green works · assumed rate</dt><dd>{committedEcon?formatRp(committedEcon.greenCost):'—'} → {draftEcon?formatRp(draftEcon.greenCost):'Unavailable'}</dd><dt>Land allowance · provisional</dt><dd>{committedEcon?formatRp(committedEcon.finance.landAllowance):'—'} → {draftEcon?formatRp(draftEcon.finance.landAllowance):'Unavailable'}</dd></dl><p>New or moved spaces can change generated streets and remove whole generated lots. Manual lot plans and assigned homes remain held; conflicts require a separate, approved edit. Green works: Rp{(baseSpec.costAssumptions??DEFAULT_COSTS).greenWorksPerM2.toLocaleString("en-US")} / m²; market and compliance assumptions remain unverified.</p></section>}/> : housingEditing ? <HousingMixEditor baseline={initialHousing(baseSpec.planning)} generatedReview={housingGeneratedReview} planning={planning} site={site} parcels={parameterDraft?.planning.lotPlan??committedLayout.parcels} selected={housingTargets} onTargets={setHousingTargets} error={workingErrors[0]??null} onChange={housing=>{changeParameters({...planning,housing},spec.frontage);requestAnimationFrame(()=>document.querySelector(".housing-review")?.scrollIntoView({block:"start"}));}} onApply={applyParameters} onCancel={cancelParameters} onCanvas={()=>{const canvas=document.querySelector<SVGSVGElement>('main svg.canvas');canvas?.scrollIntoView({block:'center'});canvas?.focus({preventScroll:true});}} review={<section className="housing-review"><h3>{housingGeneratedReview?'Review defaults before generated lots':'Accepted plan → housing preview'}</h3><dl className="kv"><dt>Homes</dt><dd>{committedEcon?.quantities.n??'—'} → {draftEcon?.quantities.n??'Unavailable'}</dd><dt>Total built area</dt><dd>{housingSummary(committedSite,committedLayout.parcels).builtArea} → {draftEcon?.builtArea??'Unavailable'} m²</dd><dt>Home construction</dt><dd>{committedEcon?formatRp(committedEcon.homeCost):'—'} → {draftEcon?formatRp(draftEcon.homeCost):'Unavailable'}</dd><dt>Land allowance · provisional assumptions</dt><dd>{committedEcon?formatRp(committedEcon.finance.landAllowance):'—'} → {draftEcon?formatRp(draftEcon.finance.landAllowance):'Unavailable'}</dd></dl><p className="note">Lots, streets, park and selling price held. The template library and assignments are saved only after Apply.</p><HousingCostAssumptions rates={R} price={price*M} before={committedEcon} after={draftEcon}/></section>}/> : parcelEditing ? <Suspense fallback={<p role="status">Loading lot tools…</p>}><LotPlanEditor mode={parcelEditing.mode} selected={parcelEditing.selected} parcels={committedLayout.parcels} edits={lotEdits} ready={parcelReady} error={parcelReady?workingErrors[0]??null:null}
            onPreview={previewParcels} onInvalidate={invalidateParcelPreview} onHighlight={setParcelBounds} onApply={applyParameters} onCancel={cancelParameters} onCanvas={()=>{const canvas=document.querySelector<SVGSVGElement>('main svg.canvas');canvas?.scrollIntoView({block:'center'});canvas?.focus({preventScroll:true});}}
            review={<section className="lot-plan-review"><h3>Accepted plan → lot preview</h3><dl className="kv"><dt>Lots</dt><dd>{committedLayout.parcels.length} → {parcelReady?`${parameterDraft?.planning.lotPlan?.length??0}${workingErrors.length?' proposed · invalid':''}`:'—'}</dd><dt>Homes</dt><dd>{committedEcon?.quantities.n??'—'} → {parcelReady?draftEcon?.quantities.n??'Unavailable':'—'}</dd><dt>Lot area</dt><dd>{formatM2(deriveQuantities(committedSite,committedLayout,editsForLayout(committedLayout.parcels,lotEdits)).parcelArea)} → {parcelReady&&draftEcon?formatM2(draftEcon.quantities.parcelArea):'—'}</dd><dt>Land allowance{workingWarnings.length?" · provisional":""}</dt><dd>{committedEcon?formatRp(committedEcon.finance.landAllowance):'—'} → {parcelReady&&draftEcon?formatRp(draftEcon.finance.landAllowance):'—'}</dd><dt>Streets / open space</dt><dd>Held at {formatM2(deriveQuantities(committedSite,committedLayout).roadArea)} / {formatM2(spaceArea(spaces))}</dd></dl>{parcelReady&&<section className="lot-lineage" aria-label="Lot references and occupancy"><p>Drawing references show accepted → proposed numbers where they change. “New” marks replacement lots. Numbers are planning references, not legal parcel identifiers.</p><p>Source: {parcelSources.map(i=>`Lot ${i+1} (${hasHome(committedSite,committedLayout.parcels[i])?'occupied':'vacant'})`).join(', ')}.</p><p>Result: {parcelCreated.map(r=>`proposed Lot ${parcelPreviewLots.findIndex(p=>lotKey(p)===lotKey(r))+1} (${hasHome(site,r)?'one home':'vacant'})`).join(', ')}.</p>{parcelRemovedOccupied.length>0&&<p className="error">{parcelRemovedOccupied.length===1?`Home on accepted Lot ${parcelRemovedOccupied[0]+1} will be removed`:`Homes on accepted Lots ${parcelRemovedOccupied.map(i=>i+1).join(', ')} will be removed`}: the resulting lots are vacant. No removed home will be restored.</p>}<details><summary>Trace unchanged lot references</summary><ul>{parcelPreviewLots.map((r,i)=>{const old=committedLayout.parcels.findIndex(p=>lotKey(p)===lotKey(r));return old>=0?<li key={i}>Accepted Lot {old+1} → proposed Lot {i+1} · geometry unchanged</li>:null;})}</ul></details></section>}{parcelReady&&planning.housing&&<p className="note">Resulting housing: {parcelCreated.map(r=>`Lot ${parcelPreviewLots.findIndex(p=>lotKey(p)===lotKey(r))+1}: ${homeTemplate(planning,r).name}`).join("; ")}. Matching source templates carry to new lots; mixed source templates use the default. Vacant results remain vacant.</p>}{parcelReady&&workingWarnings.length>0&&<p className="note">{workingWarnings[0]}</p>}</section>}/></Suspense>
            : contextOpen ? <SiteContextEditor context={siteContext ?? { notes: [] }} raster={surveyRaster} boundary={siteBoundary(baseSpec)} boundaryLocked={planning.siteLocked} showSurvey={showSurvey} onShowSurvey={setShowSurvey} disabled={!!boundaryDraft || !!parameterDraft || !!lotDraft || draftDirty || optimizing}
            onChange={commitContext} onRaster={setSurveyRaster} onBoundary={reviewImportedBoundary} onDirty={setContextPending} onClose={() => { setContextOpen(false); setSiteFit(n => n + 1); }} noteDraft={noteDraft} onNoteDraft={setNoteDraft} picking={contextPicking} onPicking={setContextPicking} /> : streetEditing ? <StreetEditor network={streetNetwork} selectedId={streetSelected} onSelect={setStreetSelected} onChange={updateStreets} onMove={(from,to)=>updateStreets(moveStreetNode(streetNetwork,from,to))}
            drawing={streetDrawing} onDraw={()=>setStreetDrawing([])} onPoint={addStreetPoint} onFinish={finishStreet} onBack={()=>setStreetDrawing(points=>points?.slice(0,-1)??null)} onStop={()=>setStreetDrawing(null)}
            onEntrance={startAtEntrance} onConnect={connectStreetEntrance} onGenerated={previewGeneratedStreets} onCanvas={() => { const canvas=document.querySelector<SVGSVGElement>('main svg.canvas'); canvas?.scrollIntoView({block:'center'}); canvas?.focus({preventScroll:true}); }} newWidth={streetWidth} onWidth={setStreetWidth}
            joinGap={streetIssue?.kind==='disconnected'&&streetIssue.gap?{distance:streetIssue.gap.distance,onJoin:joinStreetGap}:undefined}
            connectorNote={streetConnectorIds.length?`${streetConnectorIds.length} connector legs proposed; ${affectedStreetLots.length} accepted lots affected.`:undefined}
            error={workingErrors[0]??null} onApply={applyParameters} onCancel={cancelParameters} review={<section className="street-review"><h3>Accepted plan → street draft</h3><dl className="kv">
              <dt>Homes</dt><dd>{committedEcon?.quantities.n??'—'} → {draftEcon?.quantities.n??'Unavailable'}</dd>
              <dt>Street surface</dt><dd>{formatM2(deriveQuantities(committedSite,committedLayout).roadArea)} → {draftEcon?formatM2(draftEcon.quantities.roadArea):'Unavailable'}</dd>
              <dt>Street works</dt><dd>{committedEcon?formatRp(committedEcon.roadCost):'—'} → {draftEcon?formatRp(draftEcon.roadCost):'Unavailable'}</dd>
              <dt>Open space</dt><dd>{formatM2(spaceArea(spaces))} · retained</dd>
              <dt>Land allowance{workingWarnings.length?" · provisional":""}</dt><dd>{committedEcon?formatRp(committedEcon.finance.landAllowance):'—'} → {draftEcon?formatRp(draftEcon.finance.landAllowance):'Unavailable'}</dd></dl></section>} /> : boundaryDraft ? <BoundaryEditor draft={boundaryDraft} onChange={changeBoundary} onApply={applyBoundary} onCancel={cancelBoundary} review={boundaryPreview && <>
              <section className="boundary-review" aria-label="Boundary consequences"><h3>Before you apply</h3>
                <p className="note">Accepted plan → boundary draft. Nothing is replaced until Apply. Review areas are rounded to whole m²; the draft area above shows finer changes.</p>
                <dl className="kv"><dt>Site area</dt><dd>{formatM2(siteArea(baseSpec))} → {formatM2(siteArea(boundaryPreview))}</dd>
                  <dt>Homes</dt><dd>{deriveQuantities(committedSite, committedLayout).n} → {workingErrors.length ? 'Unavailable' : deriveQuantities(site, workingLayout).n}</dd>
                  <dt>Street area, including access</dt><dd>{formatM2(deriveQuantities(committedSite, committedLayout).roadArea)} → {workingErrors.length ? 'Unavailable' : formatM2(deriveQuantities(site, workingLayout).roadArea)}</dd>
                  <dt>Open space</dt><dd>{formatM2(spaceArea(siteOpenSpaces(committedSite)))} → {formatM2(spaceArea(spaces))}</dd>
                  <dt>Land allowance</dt><dd>{committedEcon ? formatRp(committedEcon.finance.landAllowance) : 'Unavailable'} → {draftEcon && !workingErrors.length ? formatRp(draftEcon.finance.landAllowance) : 'Unavailable'}</dd>
                  <dt>Owner outcome</dt><dd>{committedEcon ? formatGap(committedEcon.finance.ownerGap) : 'Unavailable'} → {draftEcon && !workingErrors.length ? formatGap(draftEcon.finance.ownerGap) : 'Unavailable'}</dd>
                </dl>
                {workingErrors.length ? <p className="error" role="status">Layout unavailable: {workingErrors[0]} You may save the valid outline, but it will have no assessed layout until this is corrected.</p> : <p className="note">{workingLayout.empty ? 'Boundary only. Generate a layout after applying this outline.' : planning.streetNetwork ? 'Manual streets are retained and whole lots regenerated inside the outline. Review full-width containment; this is a bounded layout, not the site’s maximum capacity.' : 'Whole lots and connected orthogonal streets are regenerated inside the outline. Roads and park clearance may leave land unallocated; this is a bounded layout, not the site’s maximum capacity.'}</p>}
              </section>
              {baseSpec.planning && hasLayout(site) && <EntranceEditor site={site} onChange={(next) => changeBoundary({ ...boundaryDraft, entrance: next })} error={entranceErrors(site)[0]} />}
            </>} /> : !hasLayout(baseSpec) ? <section className="plan-setup" aria-label="Plan setup"><button type="button" onClick={openContext}>Site context & survey</button><h2>{hasBoundary(baseSpec) ? 'Your site is ready' : 'Start your site'}</h2><p>{hasBoundary(baseSpec) ? `${formatM2(siteArea(baseSpec))} · ${siteBoundary(baseSpec).length} corners. No layout has been generated. Any designed open spaces remain reserved.` : 'Draw a closed boundary on the canvas. Place corners with your pointer or enter their coordinates.'}</p><button type="button" onClick={() => startBoundary(!hasBoundary(baseSpec))}>{hasBoundary(baseSpec) ? 'Edit boundary' : 'Draw boundary'}</button>{hasBoundary(baseSpec) && <button type="button" onClick={startSpaces}>Design open spaces</button>}{hasBoundary(baseSpec) && <button type="button" onClick={generateLayout}>Generate layout</button>}<p className="note">Starter layout generation uses assumed park and entrance positions. Review them before relying on the results. Sample financial assumptions remain illustrative.</p>{planActions}<details className="sitesrc"><summary>Site source · reference photo</summary>{referencePhotoControls}</details><button type="button" onClick={startHousingMix}>Manage housing templates</button><button type="button" onClick={openProjects}>Open projects</button></section> : <>
          <DynamicInspector openSpaceControls={<section className="space-summary" aria-label="Neighborhood open spaces"><h3>Neighborhood open spaces</h3><ul>{spaces.map(s=><li key={s.id}><button type="button" aria-pressed={greenSelected&&s.id===selectedSpace} onClick={()=>{setSelected('grove');setSelectedSpace(s.id);}}>{s.name} · {s.kind} · {polyArea(s.pts).toFixed(1)} m² · {s.locked?'fixed':'editable'}</button></li>)}</ul><p>{spaceArea(spaces).toFixed(1)} m² combined · {spaces.length} spaces</p><button type="button" disabled={!!regenBlock||draftDirty||!!preview||optimizing} onClick={startSpaces}>Edit open spaces</button></section>} builtArea={planning.housing&&selected==='homes'?housingSummary(site,(selectedLots.length?selectedLots:selectedLot===null?planShown.parcels.map((_,i)=>i):[selectedLot]).map(i=>planShown.parcels[i]).filter((r):r is Rect=>!!r)).builtArea:undefined} housingControls={selected==='homes'?<section className="housing-summary" aria-label="Housing mix"><h3>Housing mix</h3>{selectedLot!==null&&workingLayout.parcels[selectedLot]?<p>Lot {selectedLot+1}: {homeTemplate(planning,workingLayout.parcels[selectedLot]).name} · {homeArea(planning,workingLayout.parcels[selectedLot])} m²{hasHome(site,workingLayout.parcels[selectedLot])?' home':' reserved template · vacant lot'} · {assignmentSource(planning.housing,workingLayout.parcels[selectedLot])==='explicit'?'Explicit assignment':'Follows default'}</p>:<p>{shownHousing.rows.map(r=>`${r.name}: ${r.count} homes`).join(' · ')} · {shownHousing.builtArea} m² built</p>}<button type="button" disabled={!!regenBlock||draftDirty||!!preview||optimizing} onClick={startHousingMix}>Edit housing mix</button></section>:null} lotControls={selected==='homes'?<section className="lot-tools" aria-label="Blocks and lots"><h3>Blocks &amp; lots</h3><div className="draftrow"><button type="button" disabled={!!regenBlock||draftDirty||!!preview||optimizing||selectedLot===null} onClick={()=>startParcelEdit('split')}>Split lot</button><button type="button" disabled={!!regenBlock||draftDirty||!!preview||optimizing} onClick={()=>startParcelEdit('merge')}>Merge lots</button><button type="button" disabled={!!regenBlock||draftDirty||!!preview||optimizing} onClick={()=>startParcelEdit('block')}>Subdivide block</button><button type="button" disabled={!!regenBlock||draftDirty||!!preview||optimizing||selectedLot===null} onClick={()=>{const tools=document.querySelector<HTMLDetailsElement>('.object-tools');if(tools)tools.open=true;startLotReshape();}}>Edit lot outline</button></div>
              {selectedLot!==null&&lotEdits[lotKey(committedLayout.parcels[selectedLot]??{x:0,y:0,w:0,h:0})]&&<button type="button" disabled={!!regenBlock||draftDirty||!!preview} onClick={restoreSelectedRectangle}>Restore rectangular outline</button>}
              {planning.lotPlan!==undefined&&<><p className="note">Manual lot plan held. Frontage search cannot repartition these lots; use the direct tools or explicitly return to generated lots.</p><button type="button" disabled={!!regenBlock||draftDirty||!!preview||optimizing} onClick={previewGeneratedLots}>Preview generated lots</button></>}
              <p className="note">Select lots on the plan; Shift adds to a selection. Rectangular blocks are connected groups of existing lots, not surveyed legal parcels.</p></section>:null} siteControls={selected === 'site' && baseSpec.planning ? <EntranceEditor site={site} disabled={!!parameterDraft || !!preview || optimizing || !!lotDraft || draftDirty} onChange={(next) => commitEntrance(next, entrance, `moved to ${entranceLabel(next)}`)} error={entranceErrors(site)[0] ?? workingLayout.supportError} /> : null} selection={selected} onSelect={(value) => { if (!optimizing) { setSelected(value); setSelectedLot(null); setSelectedLots([]); } }}
            selectionNotice={selected==='homes'?(selectedReshaped?'Setbacks partly unverified: this outline keeps the placed home and a 2 m ring; deeper 3 m front/rear setbacks are not verified.':workingWarnings.length?workingWarnings.join(' '):undefined):undefined}
            label={selected === 'grove'  ? greenLabel : selected === 'circulation' ? 'Circulation' : selected === 'homes' ? selectedLots.length > 1 ? `${selectedLots.length} home lots` : selectedLot === null ? 'All home lots' : `Lot ${selectedLot + 1}` : 'Site boundary'}
            area={inspectorArea} siteArea={siteArea(boundaryPreview ?? baseSpec)} homes={selected === 'homes' && selectedLot !== null ? selectedHomeIndices.length : inspectorQuantities?.n ?? null}
            preview={!!preview} legacy={!baseSpec.planning && !parameterDraft} family={spec.family} planning={planning} onEditStreets={startStreetEdit} onGeneratedStreets={previewGeneratedStreets} frontage={preview?.frontage ?? parameterDraft?.frontage ?? spec.frontage} greenLocked={collection?(activeSpace?.locked??spaces.every(s=>s.locked)):greenLocked}
            green={draft.draft} greenDirty={draftDirty}
            onGreenChange={(g) => { if (!greenLocked && !parameterDraft && !lotDraft && !optimizing) touchDraft(strFields(g)); }}
            onGreenApply={applyDraft} onGreenCancel={cancelDraft} greenError={workingErrors[0] ?? null}
            greenDisabled={!!preview || greenLocked || !!parameterDraft || !!lotDraft || optimizing}
            onGreenLock={toggleGreenLock} onLock={togglePlanningLock} onChange={changeParameters}
            dirty={!!parameterDraft} error={parameterDraft ? workingErrors[0] ?? null : null}
            onApply={applyParameters} onCancel={cancelParameters}
            disabled={!!preview || !!lotDraft || draftDirty || optimizing || !!pendingOp} height={baseSpec.h} ceiling={ceilingS} />
          {planActions}
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
              snapshotOk={inputsOk && !workingLayout.empty && !parameterDraft && !boundaryDraft && !draftDirty}
              workingSpec={{ ...spec }}
              previewSpec={preview ? { family: preview.family, frontage: preview.frontage } : null}
              onSendRequest={(text) => submitRequest(text)}
            />
          )}

          <div className="instr">
            <label htmlFor="request">What should change?</label>
            <textarea id="request" rows={2} enterKeyHint="go" value={request} onChange={(e) => setRequest(e.target.value)} />
            <button type="button" disabled={optimizing || !!parameterDraft} onClick={() => submitRequest()}>Send</button>
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

          <section className="optimization-action"><span>{planning.lotPlan!==undefined?'Manual lot plan held':`Bounded local search · ${planning.streetNetwork?4:8} layouts`}</span><button type="button" disabled={planning.lotPlan!==undefined || optimizing || !workingOk || draftDirty || !!regenBlock || priceError !== null} onClick={rerun}> {optimizing ? 'Optimizing layout…' : 'Run optimization ▷'}</button><p className="note">{planning.lotPlan!==undefined?'Manual lots are held. Preview generated lots before searching frontage alternatives.':'Produces reviewable alternatives. Preview and Apply keep you in control.'}</p></section>
          <div className="site-actions"><button type="button" disabled={planning.siteLocked || !!parameterDraft || optimizing} onClick={() => startBoundary(true)}>Draw site</button><button type="button" disabled={planning.siteLocked || !!parameterDraft || optimizing} onClick={() => startBoundary(false)}>Edit boundary</button></div>
          <button type="button" onClick={openContext}>Site context & survey</button>
          <details className="object-tools"><summary>Object tools &amp; site source</summary>
          <details className="sitesrc">
            <summary>Site source: {!isCustomSite ? 'Cedar Market sample' : 'Custom site'} ({baseSpec.w} × {baseSpec.h} m)</summary>
          <p className="note">
            {!isCustomSite
              ? 'Cedar Market sample (120 × 100 m).'
              : `Custom site (${baseSpec.w} × ${baseSpec.h} m) from a confirmed boundary.`}
          </p>
          {referencePhotoControls}
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
                if (parameterDraft) cancelParameters();
              else if (boundaryDraft) cancelBoundary();
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
                <OpenSpaceIcon size={18} /><span>{collection?'Open spaces':'Open space A'}{greenSelected ? ' (selected)' : ''}</span>
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
                <p className="note">{baseSpec.w} × {baseSpec.h} m coordinate extents ({siteArea(baseSpec).toLocaleString('en-US')} m²), entrance {entranceLabel(entrance)}.</p>
              </>
            )}
            {selected === 'site' && (
              <>
                <h3>Site</h3>
                <ul>
                  <li>Coordinate extents {baseSpec.w} × {baseSpec.h} m, area {siteArea(baseSpec).toLocaleString('en-US')} m² (closed boundary, {siteBoundary(baseSpec).length} vertices)</li>
                  <li>{!isCustomSite ? 'Sample provenance: fictional Cedar Market case' : 'Custom site from a confirmed boundary (fictional economics)'}</li>
                </ul>
                {!baseSpec.planning && <>
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
                      onClick={() => commitEntrance({ edge, offset: entrance.offset, width: entrance.width }, entrance, `moved to ${entranceLabel({ edge, offset: entrance.offset, width: entrance.width })}`)}
                    >
                      {edge === 'west' ? 'West' : 'East'}
                    </button>
                  ))}
                </div>
                <label>
                  {entrance.boundaryEdge === undefined ? 'Distance from south (m)' : `Distance from corner ${entrance.boundaryEdge + 1} (m)`}
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
                </>}
              </>
            )}
            {selected === 'grove' && !collection && (
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
                          disabled={greenLocked || lotDraft !== null || !!parameterDraft || optimizing}
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
                  <li>{planning.streetNetwork ? `Manual street widths: ${[...new Set(planning.streetNetwork.segments.map(s=>s.width))].join(', ')} m. Edit streets to change them.` : 'Generated road width 6 m. Edit street network for custom widths.'}</li>
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
                  <li>Home footprints follow generated lots; manual lot outlines can be reshaped below</li>
                </ul>
                <h3>Individual lots</h3>
                <label>
                  Lot
                  <select
                    aria-label="Lot"
                    value={selectedLot ?? ''}
                    onChange={(e) => { setSelectedLots([]); setSelectedLot(e.target.value === '' ? null : Number(e.target.value)); }}
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
                  const occupied = hasHome(site, rect);
                  return (
                    <ul>
                      <li>
                        Lot {i + 1} of {workingLayout.parcels.length}: {edit ? `reshaped polygon, ${edit.length} corners` : `generated rectangle ${rect.w} × ${rect.h} m`}
                        {', '}{Math.round(area)} m², frontage {front < 10 ? front.toFixed(1) : Math.round(front)} m
                      </li>
                      <li>{occupied ? <>{inProfile ? 'Fits' : 'Falls outside'} the {profile.name} profile{inProfile ? '' : ' (priced figures provisional)'}</> : 'Vacant lot · no home revenue or construction cost. Restoring a home requires it to fit.'}</li>
                      {edit && occupied && <li>Setbacks verified 2 m all round the placed home; the deeper 3 m front/rear setbacks are not verified for reshaped lots.</li>}
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
                    Reshapes keep road access and clear neighbors. Occupied lots must also keep their placed home and its verified setbacks.
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
                      <div className="lot-reshape-actions"><button type="button" onClick={applyLotEdit} disabled={lotDraftErrors.length>0}>Apply reshape</button><button type="button" onClick={cancelLotEdit}>Cancel</button></div>
                      <p className="note">Draft area {polyArea(d.pts).toFixed(1)} m². Undo/Redo edits these corners; Apply creates one plan-history step. Arrow keys move a focused corner by 1 m, Shift by 10 m. Quantities remain accepted until Apply.</p>
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

          </details>
          <button type="button" className="experiment-entry" onClick={() => {
            if(regenBlock||draftDirty||pendingOp||optimizing||preview||!committedEcon||workingErrors.length){setStatus('Finish the current edit and resolve layout or assumption errors before starting an experiment.');return;}
            setExperimentOpen(true);
          }}>Feasibility experiments</button>
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
        <div className="docksummary" aria-live="polite"><span className="evaluator-label">Evaluator</span>
          <button type="button" className="strip_toggle" onClick={() => { setDockOpen((v) => !v); setCmpExpand(false); }} aria-expanded={dockOpen}>
            {dockOpen ? 'Hide details' : 'Details'}
          </button>
          {cmpExpand ? <span>Comparing Plan A and Plan B · measured quantities and costs below</span> : econShown && !boundaryDraft ? (
            <>
              <span><strong>{econShown.q.n}</strong> homes</span>
              <span>Green <strong>{formatM2(econShown.q.greenArea)}</strong></span>
              <span>Road <strong>{formatM2(econShown.q.roadArea)}</strong></span>
              <span title={workingWarnings.join(" ")}>Allowance{workingWarnings.length?" · provisional":""} <strong>{formatRp(econShown.fin.landAllowance)}</strong></span>
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
            <span>{boundaryDraft ? 'Boundary draft · accepted plan unchanged · Apply or Cancel to finish' : !hasBoundary(baseSpec) ? 'Draw a site boundary to begin.' : workingLayout.empty ? 'Boundary only · generate a layout to see homes, streets and economics.' : workingLayout.supportError ? `Layout unavailable · ${workingLayout.supportError}` : 'Incomplete — fix the flagged geometry or economics inputs to see metrics.'}</span>
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
              <dt>Total home built area</dt><dd>{planning.housing?`${shownHousing.builtArea} m²`:`${econShown.q.n} × ${homeArea(planning)} m²`} × Rp{R.constructionPerM2 / M}m = {formatRp(homeCost)}</dd>
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
              <li>Cost bases use the accepted project assumptions. Open Feasibility experiments to test construction, street and green rates, allowances, contingency and selling costs before Apply.</li>
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
                  <p className="search-scope">Tested scope: {planning.streetNetwork ? 'Manual street geometry held; Spine only' : GRID.families.join(' / ')} × {GRID.frontages.join(', ')} m frontages; current housing templates and assignments, lot depth, every named open-space outline, entrance and selling price held. No boundary, open-space placement or price optimization. These results do not establish maximum site capacity.</p>
                  <VerdictLine cards={cards} run={run} profileName={profile.name} ownerBn={ownerL} priceLocked={planning.priceLocked} />
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
                        {run.breakdown.applicable} fit profile, {run.breakdown.priceOk} {planning.priceLocked ? 'within ceiling' : 'with ceiling disabled'}, {run.breakdown.targetOk} meet target surplus.{' '}
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
                              {!isBaseline && ` · ${c.finance.landAllowance > runSnap.allowance ? 'Higher' : c.finance.landAllowance < runSnap.allowance ? 'Lower' : 'Same'} land allowance than working plan`}
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
                          contents={baseSpec.contents} planning={baseSpec.planning} layout={s.layout} boundary={siteBoundary(baseSpec)} siteW={site.w} siteH={site.h} entrance={site.entrance}
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
                Import project JSON (opens as a separate project; existing projects are kept)
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
