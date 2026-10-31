import OpenSpaceLayer from './OpenSpaceLayer';
import {spaceBounds,type OpenSpace} from '../../../src/open-spaces';
import HousingDrawingKey from './HousingDrawingKey';
import {housingColor} from './ui';
import {homeTemplate} from '../../../src/housing';
import { streetPolygon, streetSurface, surfacePath, usesShapedStreets } from '../../../src/road-surfaces';
import { nearestStreetPoint, streetLength, streetNodes, streetRect, type StreetNetwork } from '../../../src/streets';
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { PlanningParameters } from '../../../src/planning';
import type { Rect } from '../../../src/schema';
import type { Entrance, Layout, StreetConflict } from '../../../src/geometry';
import { entranceLabel, gateSegment } from '../../../src/access';
import { hasHome } from '../../../src/contents';
import { placeFootprint } from '../../../src/geometry';
import type { Pt } from '../../../src/polygon';
import { centroid, polyArea, segmentsCross } from '../../../src/polygon';
import { parcelKey, formatM2 } from './ui';
import type { BoundaryDraft } from './BoundaryEditor';
import { FitIcon, LayersIcon, PanIcon, SelectIcon, ExpandIcon } from './icons';
import { boundaryConflictEdges, boundaryErrors, MAX_SITE_VERTICES } from '../../../src/boundary';
import { surveyPoint, surveyTransform, type SiteContext, type ContextNote } from '../../../src/site-context';
import type { SurveyRaster } from './survey-file';

interface Props {
  spaceDrafts?:OpenSpace[]; activeSpace?:string|null; spacesEditing?:boolean; spaceDrawing?:boolean; spaceValid?:boolean;spaceClearance?:number;
  onSpaceSelect?:(id:string)=>void;onSpacePoint?:(p:Pt)=>void;onSpaceFinish?:()=>void;onSpaceMove?:(index:number,p:Pt,record?:boolean)=>void;onSpaceRemove?:(i:number)=>void;onSpaceGesture?:(before:Pt[]|null)=>void;onSpaceRevert?:(pts:Pt[])=>void;
  blockReviewLabel?:string;
  blockOutline?:Rect|null;
  blockSummary?:string;
  blockTitle?:string;
  invalidHomeLots?:number[];
  parcelReferences?:string[];
  parcelProposal?:{lots:Rect[];valid:boolean;inaccessible?:number[]}|null;
  onBlockReview?:()=>void;
  editableStreets?: StreetNetwork | null;
  streetStroke?: Pt[] | null;
  streetSelected?: string | null;
  streetDraftValid?: boolean;
  streetConflict?: StreetConflict | null;
  streetConnectorIds?: string[];
  streetAffectedLots?: Rect[];
  streetSummary?: string;
  onStreetSelect?: (id: string) => void;
  onStreetPoint?: (point: Pt) => void;
  onStreetFinish?: () => void;
  onStreetStop?: () => void;
  onStreetReview?: () => void;
  onStreetNodeMove?: (original: StreetNetwork, from: Pt, to: Pt) => void;
  onStreetNodeCommit?: (original: StreetNetwork) => void;
  onStreetNodeKeyMove?: (from: Pt, to: Pt) => void;
  onStreetNodeCancel?: (original: StreetNetwork) => void;
  siteContext?: SiteContext;
  surveyRaster?: SurveyRaster | null;
  showContext?: boolean;
  noteDraft?: ContextNote | null;
  contextPicking?: boolean;
  onContextPick?: (point: Pt) => void;
  contents?: import('../../../src/contents').PlanContents;
  planning?: PlanningParameters;
  streetOffsets?: number[];
  onStreetDrag?: (index: number, y: number) => void;
  layout: Layout;
  boundary?: Pt[];
  boundaryDraft?: BoundaryDraft | null;
  boundaryLayoutPreview?: boolean;
  onBoundaryChange?: (draft: BoundaryDraft, record?: boolean) => void;
  onBoundaryApply?: () => void;
  onBoundaryGestureStart?: () => void;
  onBoundaryGestureCommit?: (pts: Pt[]) => void;
  onBoundaryCancel?: () => void;
  siteW: number;
  siteH: number;
  entrance: Entrance;
  greenLocked: boolean;
  greenSelected: boolean;
  // Direct manipulation: true when the drawn green may be dragged/resized.
  editing: boolean;
  // True when the entrance gate marker may be dragged along its edge.
  entranceEditing: boolean;
  // False while the live entrance position fails validation (styled invalid).
  entranceValid: boolean;
  onSelectEntrance: () => void;
  // Live offset during a gate drag (whole meters, y-up from the south edge).
  onEntranceDrag: (offset: number) => void;
  // One completed drag is one undoable action; orig is the pre-drag gate.
  onEntranceCommit: (orig: Entrance) => void;
  // A cancelled drag reverts to the pre-drag gate without recording history.
  onEntranceCancel: (orig: Entrance) => void;
  // True while a draft differs from committed geometry (shows preview styling).
  draftActive: boolean;
  draftValid: boolean;
  workingKeys: Set<string> | null; // when previewing: keys of working parcels
  vsNote: string | null; // measured deltas vs working plan, shown in preview
  onSelectGreen: () => void;
  onSelectLot: (index: number, append?: boolean) => void;
  // A drag that starts on a fixed home explains itself instead of panning.
  onFixedHint: () => void;
  // Committed manual reshapes (parcel index -> polygon meters) and the open
  // reshape draft. Metrics never follow the draft; Apply commits it upstairs.
  lotEdits: Record<number, Pt[]>;
  selectedLots?: number[];
  selectedLot: number | null;
  lotDraft: { index: number; pts: Pt[] } | null;
  lotDraftValid: boolean;
  onLotVertexDrag: (vi: number, pt: Pt) => void;
  onLotNodeKeyMove?: (vi:number,pt:Pt)=>void;
  onLotGestureCommit?: (pts:Pt[])=>void;
  onLotVertexRevert: (orig: Pt[]) => void;
  onLotVertexAdd: (edgeIdx: number, pt: Pt) => void;
  onLotVertexRemove: (vi: number) => void;
  siteSelected: boolean;
  onSelectSite: () => void;
  selectedKind: 'circulation' | 'homes' | null;
  onSelectKind: (kind: 'circulation' | 'homes') => void;
  onDeselect: () => void;
  onDraftChange: (rect: Rect) => void;
  onDraftCommit: () => void;
  // Reference photo backdrop (illustration only, never geometry).
  backdrop: string | null;
  // Wide mode: the parent narrows the rail so the plan takes more room.
  wide: boolean;
  onToggleWide: () => void;
  // Parent-driven Fit (compare panels fit both plans together).
  fitTick: number;
  // Incremented by the parent to force-clear any in-progress gesture ref.
  cancelTick: number;
  // Escape with no active gesture: parent clears the draft or deselects.
  onEscapeIdle: () => void;
  // Select/Pan tool mode from the parent rail. Pan makes every drag pan
  // (object drags stay off); clicks still select. Default is select.
  panTool?: boolean;
  onToolChange?: (tool: 'select' | 'pan') => void;
  // Fill mode (workbench): the canvas takes the stage's leftover box after
  // the toolbar — the composer below is never squeezed. Width mode
  // (comparison dock): size from width only; the dock scrolls.
  fitMode?: 'fill' | 'width';
}

const M = 28; // stable local projection offset, not a viewport boundary
const W = 640;
const H = 560;

type DragKind = 'none' | 'pan' | 'green-move' | 'green-resize' | 'entrance-move' | 'lot-vertex' | 'site-vertex' | 'street' | 'junction';

export default function PlanCanvas(props: Props) {
  const instanceId = useId();
  const hatchId = `green-hatch-${instanceId}`;
  const gridId = `metre-grid-${instanceId}`;
  const majorGridId = `major-grid-${instanceId}`;
  const s = Math.min((W - 2 * M) / props.siteW, (H - 2 * M) / props.siteH);
  const [vb, setVb] = useState({ x: 0, y: 0, w: W, h: H });
  const [panning, setPanning] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [px, setPx] = useState({ w: W, h: H });
  const [cursor, setCursor] = useState<Pt | null>(null);
  const [streetSnap,setStreetSnap]=useState<{point:Pt;streetId:string}|null>(null);
  const [junctionMotion,setJunctionMotion]=useState<{from:Pt;to:Pt}|null>(null);
  const [layers, setLayers] = useState({ grid: true, dimensions: true, footprints: true, labels: true });
  const measured = useRef(false);
  const cameraMoved = useRef(false);
  const drawingNewBoundary = props.boundaryDraft?.newSite === true;
  const viewportSize = useRef({ w: W, h: H });
  const pannedBetween = useRef(false);
  const outline = props.boundary ?? [{ x: 0, y: 0 }, { x: props.siteW, y: 0 }, { x: props.siteW, y: props.siteH }, { x: 0, y: props.siteH }];
  const reference = props.siteContext?.survey;
  const surveyAttached = reference && props.surveyRaster && reference.fingerprint === props.surveyRaster.fingerprint && reference.page === props.surveyRaster.page;
  const surveyCorners = reference && surveyAttached ? [{ x: 0, y: 0 }, { x: reference.width, y: 0 }, { x: reference.width, y: reference.height }, { x: 0, y: reference.height }].map(p => surveyPoint(reference, p)) : [];
  const draftOutline = props.boundaryDraft?.closed && !boundaryErrors(props.boundaryDraft.pts).length ? props.boundaryDraft.pts : outline;
  const cameraOutline = [...draftOutline, ...(props.showContext || !outline.length ? surveyCorners : []), ...(props.showContext ? props.siteContext?.notes.flatMap(n => n.points) ?? [] : [])];
  if (!cameraOutline.length) cameraOutline.push({ x: 0, y: 0 }, { x: props.siteW, y: props.siteH });
  const minX = Math.min(...cameraOutline.map((p) => M + p.x * s));
  const maxX = Math.max(...cameraOutline.map((p) => M + p.x * s));
  const minY = Math.min(...cameraOutline.map((p) => M + (props.siteH - p.y) * s));
  const maxY = Math.max(...cameraOutline.map((p) => M + (props.siteH - p.y) * s));
  const fitBounds = useRef({ minX, maxX, minY, maxY });
  useLayoutEffect(() => { fitBounds.current = { minX, maxX, minY, maxY }; }, [minX, maxX, minY, maxY]);
  const fittedView = (size: { w: number; h: number }) => {
    const bounds = fitBounds.current;
    const side = size.w < 500 ? 32 : 58;
    const top = size.w < 500 ? 78 : 96;
    const bottom = 72;
    const scale = Math.min(Math.max(80, size.w - side * 2) / Math.max(1, bounds.maxX - bounds.minX), Math.max(80, size.h - top - bottom) / Math.max(1, bounds.maxY - bounds.minY));
    let w = size.w / scale, h = size.h / scale;
    const x = (bounds.minX + bounds.maxX - w) / 2;
    const y = (bounds.minY + bounds.maxY - h) / 2 - (top - bottom) / (2 * scale);
    if (!drawingNewBoundary) return { x, y, w, h };
    // Keep the origin reachable inside the paper; pointer edits stop at its limits.
    const extent = 500 * s;
    const shrink = Math.min(1, extent / w, extent / h);
    w *= shrink; h *= shrink;
    const padX = 24 * w / size.w;
    // Preserve the fitted view's clearance for the tools below the outline.
    const padY = Math.max(bottom * w / size.w, y + h - (M + props.siteH * s));
    return { x: Math.max(M - padX, Math.min(M + extent + padX - w, x)), y: Math.max(M + (props.siteH - 500) * s - padY, Math.min(M + props.siteH * s + padY - h, y)), w, h };
  };
  const fitSite = () => { cameraMoved.current = false; setVb(fittedView(viewportSize.current)); };
  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const resize = () => {
      const size = { w: Math.max(200, stage.clientWidth), h: Math.max(160, stage.clientHeight) };
      const previous = viewportSize.current;
      if (measured.current && size.w === previous.w && size.h === previous.h) return;
      const first = !measured.current;
      setPx(size);
      setVb((view) => {
        if (first || !cameraMoved.current || props.fitMode === 'width') return fittedView(size);
        const unitsPerPixel = view.w / previous.w;
        const w = size.w * unitsPerPixel, h = size.h * unitsPerPixel;
        return { x: view.x + (view.w - w) / 2, y: view.y + (view.h - h) / 2, w, h };
      });
      viewportSize.current = size;
      measured.current = true;
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(stage);
    return () => observer.disconnect();
    // Bounds update independently; selection and edits never reset the camera.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.fitMode, drawingNewBoundary]);
  // Reframe only for an explicit Fit/reset or a change of drawing mode, not each edit.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => { fitSite(); }, [props.fitTick, drawingNewBoundary]);

  const resetDrag = () => {
    drag.current = { kind: 'none', startCX: 0, startCY: 0, origVb: { ...vb }, origGreen: null, origEntrance: null, origLotPts: null, lotVi: null, handle: null, moved: false };
    setPanning(false);
    setJunctionMotion(null);
  };

  // Parent-driven cancel (Escape): a stuck gesture ref can never survive it.
  useEffect(() => {
    resetDrag();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.cancelTick]);
  const svgRef = useRef<SVGSVGElement>(null);
  // Start point of a gesture on a fixed home, for the F06 explain-instead-of-pan hint.
  const junctionStart = useRef<{network:StreetNetwork;point:Pt;inverse:DOMMatrix;pointer:DOMPoint}|null>(null);
  const lotStart=useRef<{inverse:DOMMatrix;pointer:DOMPoint;point:Pt}|null>(null);
  const streetStart = useRef<{ index: number; y: number } | null>(null);
  const fixedStart = useRef<{ x: number; y: number; hinted: boolean; index: number } | null>(null);
  const drag = useRef<{
    kind: DragKind;
    startCX: number;
    startCY: number;
    origVb: { x: number; y: number; w: number; h: number };
    origGreen: Rect | null;
    origEntrance: Entrance | null;
    origLotPts: Pt[] | null;
    lotVi: number | null;
    handle: string | null;
    moved: boolean;
  }>({ kind: 'none', startCX: 0, startCY: 0, origVb: { x: 0, y: 0, w: W, h: H }, origGreen: null, origEntrance: null, origLotPts: null, lotVi: null, handle: null, moved: false });

  // Screen-space mapping (SVG y grows down, site y grows up). Single transform.
  const X = (x: number) => M + x * s;
  const Ytop = (y: number, h: number) => M + (props.siteH - y - h) * s;
  const Ypt = (y: number) => M + (props.siteH - y) * s;
  const polyPoints = (pts: Pt[]) => pts.map((p) => `${X(p.x)},${Ypt(p.y)}`).join(' ');

  // Pointer edits snap to whole meters; typed input keeps its own precision.
  const snap1 = (v: number) => Math.round(v);
  const boundBoundaryPoint = (p: Pt): Pt => ({ x: Math.max(0, Math.min(500, p.x)), y: Math.max(0, Math.min(500, p.y)) });

  // Wheel zoom (non-passive so the page does not scroll while zooming the plan).
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraMoved.current = true;
      const r = el.getBoundingClientRect();
      const f = e.deltaY > 0 ? 1.15 : 1 / 1.15;
      setVb((v) => {
        const w = Math.min(2000, Math.max(W / 8, v.w * f));
        const h = (r.height / r.width) * w;
        const px = v.x + ((e.clientX - r.left) / r.width) * v.w;
        const py = v.y + ((e.clientY - r.top) / r.height) * v.h;
        const nx = px - ((e.clientX - r.left) / r.width) * w;
        const ny = py - ((e.clientY - r.top) / r.height) * h;
        return { x: nx, y: ny, w, h };
      });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const zoomBy = (f: number) => {
    cameraMoved.current = true;
    setVb((v) => {
      const w = Math.min(2000, Math.max(W / 8, v.w * f));
      const h = (v.h / v.w) * w;
      const cx = v.x + v.w / 2;
      const cy = v.y + v.h / 2;
      return { x: cx - w / 2, y: cy - h / 2, w, h };
    });
  };

  const box = (r: Rect) => ({
    x: X(r.x),
    y: Ytop(r.y, r.h),
    width: Math.max(r.w * s, 1),
    height: Math.max(r.h * s, 1),
  });

  // Placed home footprint: the engine's single placement rule (a reshape
  // draft is valid only while this footprint of the original rect survives).
  const footprint = (p: Rect): Rect | null => hasHome({ contents: props.contents }, p) ? placeFootprint(p, props.planning, props.layout.roads) : null;

  const onBackgroundDown = (e: React.PointerEvent) => {
    const menu = wrapRef.current?.querySelector<HTMLDetailsElement>('details[open]');
    if (menu) menu.open = false;
    pannedBetween.current = false;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drag.current = {
      kind: 'pan', startCX: e.clientX, startCY: e.clientY,
      origVb: { ...vb }, origGreen: null, origEntrance: null, origLotPts: null, lotVi: null, handle: null, moved: false,
    };
  };

  const onGreenDown = (e: React.PointerEvent, handle: string | null) => {
    if (props.panTool) {
      onBackgroundDown(e);
      return;
    }
    e.stopPropagation();
    if (!props.editing) {
      props.onSelectGreen();
      return;
    }
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drag.current = {
      kind: handle ? 'green-resize' : 'green-move',
      startCX: e.clientX, startCY: e.clientY,
      origVb: { ...vb }, origGreen: { ...props.layout.green }, origEntrance: null, origLotPts: null, lotVi: null, handle, moved: false,
    };
  };

  // Lot corner drag: only rendered while a reshape draft is open, so the
  // draft always exists here. Release needs no commit: the draft is ephemeral
  // until upstairs Apply records one undoable step.
  const onLotDown = (e: React.PointerEvent, vi: number) => {
    if (props.panTool) {
      onBackgroundDown(e);
      return;
    }
    e.stopPropagation();
    if (!props.lotDraft) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const inverse=svgRef.current!.getScreenCTM()!.inverse();
    lotStart.current={inverse,pointer:new DOMPoint(e.clientX,e.clientY).matrixTransform(inverse),point:props.lotDraft.pts[vi]};
    drag.current = {
      kind: 'lot-vertex', startCX: e.clientX, startCY: e.clientY,
      origVb: { ...vb }, origGreen: null, origEntrance: null,
      origLotPts: props.lotDraft.pts.map((p) => ({ ...p })), lotVi: vi, handle: null, moved: false,
    };
  };

  const onEntranceDown = (e: React.PointerEvent) => {
    if (props.panTool) {
      onBackgroundDown(e);
      return;
    }
    e.stopPropagation();
    if (!props.entranceEditing) {
      props.onSelectEntrance();
      return;
    }
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drag.current = {
      kind: 'entrance-move', startCX: e.clientX, startCY: e.clientY,
      origVb: { ...vb }, origGreen: null, origEntrance: { ...props.entrance }, origLotPts: null, lotVi: null, handle: null, moved: false,
    };
  };

  const onMove = (e: React.PointerEvent) => {
    const r = svgRef.current?.getBoundingClientRect();
    if (r) { const m = toMetersNow(e.clientX, e.clientY, r); setCursor({ x: m.x, y: m.yUp }); }
    const d = drag.current;
    if (props.editableStreets && props.streetStroke!==null && d.kind==='none') {
      setStreetSnap(streetPick(e.clientX,e.clientY).snap);
    }
    if (d.kind === 'none') return;
    if (!r) return;
    if (Math.abs(e.clientX - d.startCX) + Math.abs(e.clientY - d.startCY) > 3) d.moved = true;
    if (d.kind === 'pan') {
      if (d.moved) cameraMoved.current = true;
      const dx = ((e.clientX - d.startCX) / r.width) * d.origVb.w;
      const dy = ((e.clientY - d.startCY) / r.height) * d.origVb.h;
      setVb({ ...d.origVb, x: d.origVb.x - dx, y: d.origVb.y - dy });
      setPanning(d.moved);
      if (d.moved) pannedBetween.current = true;
      return;
    }
    if (d.kind === 'entrance-move') {
      // The gate slides along its own edge only: pointer height becomes the
      // new center offset, snapped to whole meters like every pointer edit.
      const m1 = toMetersRef(e.clientX, e.clientY, r);
      if (!m1) return;
      const gate = gateSegment({ w: props.siteW, h: props.siteH, boundary: props.boundary, entrance: props.entrance });
      if (gate) props.onEntranceDrag(snap1((m1.x - gate.a.x) * gate.tangent.x + (m1.yUp - gate.a.y) * gate.tangent.y));
      return;
    }
    if (d.kind === 'junction' && junctionStart.current) {
      if (!d.moved) return;
      const start=junctionStart.current;
      // Preserve the grab offset and projection even if a warning resizes the paper.
      const now=new DOMPoint(e.clientX,e.clientY).matrixTransform(start.inverse);
      const to={x:Math.max(0,Math.min(500,snap1(start.point.x+(now.x-start.pointer.x)/s))),y:Math.max(0,Math.min(500,snap1(start.point.y-(now.y-start.pointer.y)/s)))};
      setJunctionMotion({from:start.point,to});
      props.onStreetNodeMove?.(start.network,start.point,to);
      return;
    }
    if (d.kind === 'street' && d.lotVi !== null) {
      const m = toMetersRef(e.clientX, e.clientY, r);
      if (!m) return;
      props.onStreetDrag?.(d.lotVi, Math.max(3, Math.min(props.siteH - 3, snap1(m.yUp))));
      d.moved = true;
      return;
    }
    if (d.kind === 'site-vertex') {
      const m1 = toMetersRef(e.clientX, e.clientY, r);
      if (!m1 || d.lotVi == null || !props.boundaryDraft) return;
      props.onBoundaryChange?.({ ...props.boundaryDraft, pts: props.boundaryDraft.pts.map((p, i) => i === d.lotVi ? boundBoundaryPoint({ x: snap1(m1.x), y: snap1(m1.yUp) }) : p) }, false);
      return;
    }
    if (d.kind === 'lot-vertex' && lotStart.current) {
      if(!d.moved||d.lotVi===null)return;
      const start=lotStart.current,at=new DOMPoint(e.clientX,e.clientY).matrixTransform(start.inverse);
      props.onLotVertexDrag(d.lotVi,boundBoundaryPoint({x:snap1(start.point.x+(at.x-start.pointer.x)/s),y:snap1(start.point.y-(at.y-start.pointer.y)/s)}));return;
    }
    if (!d.origGreen) return;
    const m0 = toMetersRef(d.startCX, d.startCY, r);
    const m1 = toMetersRef(e.clientX, e.clientY, r);
    if (!m0 || !m1) return;
    const g = d.origGreen;
    if (d.kind === 'green-move') {
      props.onDraftChange({
        x: snap1(g.x + (m1.x - m0.x)),
        y: snap1(g.y + (m1.yUp - m0.yUp)),
        w: g.w,
        h: g.h,
      });
    } else {
      // Corner resize in meter coordinates (y grows up). Minimum size 1 m.
      // Only moved edges change, snapped to whole meters; fixed edges stay exact.
      const hx = d.handle?.includes('e') ? 1 : -1;
      const hy = d.handle?.includes('n') ? 1 : -1;
      const dx = m1.x - m0.x;
      const dy = m1.yUp - m0.yUp;
      const right = g.x + g.w;
      const top = g.y + g.h;
      let x = g.x;
      let y = g.y;
      let w = g.w;
      let h = g.h;
      if (hx === 1) w = Math.max(1, snap1(g.w + dx));
      else {
        x = Math.min(snap1(g.x + dx), right - 1);
        w = right - x;
      }
      if (hy === 1) h = Math.max(1, snap1(top + dy) - y);
      else {
        y = Math.min(snap1(g.y + dy), top - 1);
        h = top - y;
      }
      props.onDraftChange({ x, y, w, h });
    }
  };

  const toMetersRef = (clientX: number, clientY: number, r: DOMRect) => {
    const d = drag.current;
    const vx = d.origVb.x + ((clientX - r.left) / r.width) * d.origVb.w;
    const vy = d.origVb.y + ((clientY - r.top) / r.height) * d.origVb.h;
    return { x: (vx - M) / s, yUp: props.siteH - (vy - M) / s };
  };

  // Current-view mapping (double-click handlers run outside any gesture).
  const toMetersNow = (clientX: number, clientY: number, r: DOMRect) => {
    const vx = vb.x + ((clientX - r.left) / r.width) * vb.w;
    const vy = vb.y + ((clientY - r.top) / r.height) * vb.h;
    return { x: (vx - M) / s, yUp: props.siteH - (vy - M) / s };
  };

  const streetPick=(clientX:number,clientY:number)=>{
    const matrix=svgRef.current!.getScreenCTM()!;
    const at=new DOMPoint(clientX,clientY).matrixTransform(matrix.inverse());
    const raw={x:Math.max(0,Math.min(500,(at.x-M)/s)),y:Math.max(0,Math.min(500,props.siteH-(at.y-M)/s))};
    const network=props.editableStreets!;
    const screenDistance=(point:Pt)=>{const q=new DOMPoint(X(point.x),Ypt(point.y)).matrixTransform(matrix);return Math.hypot(q.x-clientX,q.y-clientY);};
    const node=streetNodes(network).find(point=>screenDistance(point)<=12);
    const nearest=nearestStreetPoint(network,raw);
    const snap=node ? {point:node,streetId:nearest?.streetId??''} : nearest && screenDistance(nearest.point)<=12 ? {point:{x:Math.round(nearest.point.x*1000)/1000,y:Math.round(nearest.point.y*1000)/1000},streetId:nearest.streetId} : null;
    // Project a metre-snapped position onto the centreline, retaining its exact axis.
    if(snap&&!node){const edge=network.segments.find(s=>s.id===snap.streetId)!;snap.point=edge.a.y===edge.b.y?{x:Math.max(Math.min(edge.a.x,edge.b.x),Math.min(Math.max(edge.a.x,edge.b.x),Math.round(raw.x))),y:edge.a.y}:edge.a.x===edge.b.x?{x:edge.a.x,y:Math.max(Math.min(edge.a.y,edge.b.y),Math.min(Math.max(edge.a.y,edge.b.y),Math.round(raw.y)))}:nearest!.point;}
    return {point:snap?.point??{x:Math.round(raw.x),y:Math.round(raw.y)},snap};
  };

  const nearestEdge = (pt: Pt, pts: Pt[]): number => {
    let bi = 0;
    let bd = Infinity;
    pts.forEach((a, k) => {
      const b = pts[(k + 1) % pts.length];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len2 = dx * dx + dy * dy;
      const t = len2 < 1e-9 ? 0 : Math.max(0, Math.min(1, ((pt.x - a.x) * dx + (pt.y - a.y) * dy) / len2));
      const d = Math.hypot(pt.x - (a.x + t * dx), pt.y - (a.y + t * dy));
      if (d < bd) { bd = d; bi = k; }
    });
    return bi;
  };

  const onUp = (e: React.PointerEvent) => {
    const d = drag.current;
    if (d.kind === 'none') return;
    resetDrag();
    if (d.kind === 'pan') {
      if (!d.moved && (e.target as Element).getAttribute?.('data-bg') === '1') props.onDeselect();
    } else if (d.kind === 'entrance-move') {
      if (d.origEntrance) {
        if (d.moved) props.onEntranceCommit(d.origEntrance);
        else props.onSelectEntrance();
      }
    } else if (d.kind === 'site-vertex') {
      if (d.moved && d.origLotPts) props.onBoundaryGestureCommit?.(d.origLotPts);
    } else if (d.kind === 'junction') {
      if(d.moved && junctionStart.current) props.onStreetNodeCommit?.(junctionStart.current.network);
    } else if (d.kind === 'street') {
      // Street gestures remain a parameter draft until Apply or Cancel.
    } else if (d.kind === 'lot-vertex') {
      if(d.moved&&d.origLotPts)props.onLotGestureCommit?.(d.origLotPts);
    } else if (d.moved) {
      props.onDraftCommit();
    }
  };

  // A browser-cancelled gesture can never commit: revert to the gesture start.
  const onCancel = () => {
    const d = drag.current;
    if (d.kind === 'none') return;
    if (d.kind === 'junction' && junctionStart.current) props.onStreetNodeCancel?.(junctionStart.current.network);
    if (d.kind === 'street' && streetStart.current) props.onStreetDrag?.(streetStart.current.index, streetStart.current.y);
    if (d.origGreen) props.onDraftChange({ ...d.origGreen });
    if (d.origEntrance) props.onEntranceCancel(d.origEntrance);
    if (d.origLotPts) {
      if (d.kind === 'site-vertex' && props.boundaryDraft) props.onBoundaryChange?.({ ...props.boundaryDraft, pts: d.origLotPts }, false);
      else props.onLotVertexRevert(d.origLotPts);
    }
    resetDrag();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if(props.editableStreets) {
      if(e.key==='Escape' && drag.current.kind==='junction') {e.preventDefault();e.stopPropagation();onCancel();return;}
      if(e.key==='Escape' && props.streetStroke!==null) {e.preventDefault();e.stopPropagation();props.onStreetStop?.();return;}
      if(e.key==='Enter' && props.streetStroke!==null) {e.preventDefault();e.stopPropagation();props.onStreetFinish?.();return;}
      return;
    }
    if (props.boundaryDraft) {
      if (e.key === 'Enter' && props.boundaryDraft.pts.length >= 3) { e.preventDefault(); props.onBoundaryChange?.({ ...props.boundaryDraft, closed: true }); }
      if (e.key === 'Escape') { e.stopPropagation(); onCancel(); props.onBoundaryCancel?.(); }
      return;
    }
    if (e.key !== 'Escape') return;
    const d = drag.current;
    if (d.kind === 'green-move' || d.kind === 'green-resize') {
      if (d.origGreen) props.onDraftChange({ ...d.origGreen });
      resetDrag();
    } else if (d.kind === 'entrance-move') {
      if (d.origEntrance) props.onEntranceCancel(d.origEntrance);
      resetDrag();
    } else if (d.kind === 'lot-vertex') {
      if (d.origLotPts) props.onLotVertexRevert(d.origLotPts);
      resetDrag();
    } else {
      props.onEscapeIdle();
    }
  };

  const focusedSpace=(props.spaceDrafts??props.layout.openSpaces)?.find(s=>s.id===props.activeSpace);
  const focusSpace=()=>{if(!focusedSpace?.pts.length)return;const points=focusedSpace.pts.filter(p=>Number.isFinite(p.x+p.y));if(!points.length)return;const b=spaceBounds(points),ratio=px.w/px.h,units=Math.max(b.w*s/Math.max(100,px.w-80),b.h*s/Math.max(100,px.h-180),s*.05),w=px.w*units,h=w/ratio;cameraMoved.current=true;setVb({x:X(b.x+b.w/2)-w/2,y:Ypt(b.y+b.h/2)-h/2,w,h});};
  const g = props.layout.green;
  const gb = box(g);
  const gate = gateSegment({ w: props.siteW, h: props.siteH, boundary: props.boundaryDraft?.pts ?? props.boundary, entrance: props.entrance });
  const egate = gate && !props.layout.empty ? { x: X(gate.center.x), y: Ypt(gate.center.y), angle: -Math.atan2(gate.tangent.y, gate.tangent.x) * 180 / Math.PI, width: props.entrance.width * s } : null;
  // Visible handles are 12 units; each carries a 28-unit transparent hit
  // area so pointer targets stay usable when the plan is fitted small.
  const handles = props.editing && props.greenSelected ? ([
    { id: 'nw', x: gb.x, y: gb.y },
    { id: 'ne', x: gb.x + gb.width, y: gb.y },
    { id: 'sw', x: gb.x, y: gb.y + gb.height },
    { id: 'se', x: gb.x + gb.width, y: gb.y + gb.height },
  ] as const) : [];

  // ViewBox units per screen pixel: labels divide by this to hold a
  // constant screen size at any zoom or fit scale. Geometry never does.
  const tscale = px.w > 0 ? vb.w / px.w : 1;
  const fs = (screenPx: number) => screenPx * tscale;
  // Light halo keeps labels legible over fills at any scale.
  const halo = { paintOrder: 'stroke' as const, stroke: '#f4f2ec', strokeWidth: 3 * tscale, strokeLinejoin: 'round' as const };

  const bd = props.boundaryDraft;
  const bdValid = bd && bd.closed && boundaryErrors(bd.pts).length === 0;
  const conflictEdges = bd?.closed ? boundaryConflictEdges(bd.pts) : [];
  const finitePoints = bd?.pts.filter((p) => Number.isFinite(p.x + p.y)) ?? [];
  const changeVertex = (vi: number, p: Pt) => {
    if (bd && (p.x !== bd.pts[vi].x || p.y !== bd.pts[vi].y)) props.onBoundaryChange?.({ ...bd, pts: bd.pts.map((q, i) => i === vi ? p : q) });
  };
  const removeVertex = (vi: number) => {
    if (bd && bd.pts.length > (bd.closed ? 3 : 0)) props.onBoundaryChange?.({ ...bd, pts: bd.pts.filter((_, i) => i !== vi) });
  };
  const addAfter = (i: number) => {
    if (!bd || bd.pts.length >= MAX_SITE_VERTICES) return;
    const a = bd.pts[i], b = bd.pts[(i + 1) % bd.pts.length];
    const pts = [...bd.pts]; pts.splice(i + 1, 0, { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
    props.onBoundaryChange?.({ ...bd, pts });
  };

  const pixelsPerMetre = s * px.w / vb.w;
  const scaleMetres = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000].filter((m) => m * pixelsPerMetre <= 130).at(-1) ?? 1;
  const scalePixels = scaleMetres * pixelsPerMetre;

  const selectedStreet=props.editableStreets?.segments.find(edge=>edge.id===props.streetSelected);
  const connectorStreet=props.editableStreets?.segments.find(edge=>props.streetConnectorIds?.includes(edge.id));
  const connectorMid=connectorStreet?{x:(connectorStreet.a.x+connectorStreet.b.x)/2,y:(connectorStreet.a.y+connectorStreet.b.y)/2}:null;
  const shapedDraft = (() => {
    if (!props.editableStreets || !usesShapedStreets(props.editableStreets)) return null;
    try { return streetSurface(props.editableStreets).surface; } catch { return null; }
  })();
  const separateReadouts = props.fitMode === 'width';
  const scaleReadout = <div className="drawing-scale" aria-hidden="true">
    <span className="local-axis">Y ↑</span>
    <svg width="145" height="34" viewBox="0 0 145 34">
      <text x="0" y="11">0</text><text x={scalePixels / 2} y="11" textAnchor="middle">{scaleMetres / 2}</text><text x={scalePixels} y="11" textAnchor="end">{scaleMetres} m</text>
      <rect x="0.5" y="18" width={scalePixels / 2} height="5" fill="#222630" /><rect x={scalePixels / 2} y="18" width={scalePixels / 2} height="5" fill="#fff" stroke="#222630" />
    </svg><span>LOCAL METRES</span>
  </div>;
  const viewportReadout = !props.editableStreets && !props.onBlockReview ? <div className="viewport-readout" aria-hidden="true"><span>ZOOM <b>{Math.round(fittedView(px).w / vb.w * 100)}%</b></span><span>{cursor ? `X ${cursor.x.toFixed(1)} m · Y ${cursor.y.toFixed(1)} m` : 'LOCAL PLAN'}</span><span>SNAP 1 m</span></div> : null;

  return (
    <div className={bd ? 'canvastools boundary-editing' : 'canvastools'} ref={wrapRef}>
      <div className="toolbar" role="toolbar" aria-label="Plan view controls">
        {props.onToolChange && <>
          <button type="button" className={!props.panTool ? 'active' : ''} aria-pressed={!props.panTool} title="Select geometry" onClick={() => props.onToolChange?.('select')}><SelectIcon size={18} /><span className="tool-label">Select</span></button>
          <button type="button" className={props.panTool ? 'active' : ''} aria-pressed={!!props.panTool} title="Pan the drawing" onClick={() => props.onToolChange?.('pan')}><PanIcon size={18} /><span className="tool-label">Pan</span></button>
          <span className="toolbar-divider" />
        </>}
        <button type="button" onClick={fitSite} aria-label="Fit site" title="Fit the complete site"><FitIcon size={19} /><span className="tool-label">Fit site</span></button>
        <button type="button" onClick={() => zoomBy(1 / 1.25)} aria-label="Zoom in" title="Zoom in">+</button>
        <button type="button" onClick={() => zoomBy(1.25)} aria-label="Zoom out" title="Zoom out">−</button>
        <details className="canvas-layers" onKeyDown={(e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); e.currentTarget.open = false; e.currentTarget.querySelector('summary')?.focus(); } }}><summary aria-label="Drawing layers" title="Drawing layers"><LayersIcon size={19} /></summary><div>
          <strong>Drawing layers</strong>
          {(['grid', 'dimensions', 'footprints', 'labels'] as const).map((key) => <label key={key}><input type="checkbox" checked={layers[key]} onChange={(e) => setLayers((current) => ({ ...current, [key]: e.target.checked }))} />{key === 'grid' ? 'Metre grid' : key === 'dimensions' ? 'Boundary dimensions' : key === 'footprints' ? 'Home footprints' : 'Lot labels'}</label>)}
        </div></details>
        <button type="button" onClick={props.onToggleWide} aria-pressed={props.wide} aria-label={props.wide ? 'Dock plan' : 'Expand plan'} title={props.wide ? 'Dock plan' : 'Expand plan'}><ExpandIcon size={18} /></button>
      </div>
      {props.editableStreets && <div className="street-banner" role="status"><strong>{props.streetStroke!==null?'Drawing street · Enter to finish':'Unapplied street draft'}</strong>
        {selectedStreet && <span className="street-selection-readout">Street {props.editableStreets.segments.indexOf(selectedStreet)+1} · {selectedStreet.width} m wide · {streetLength(selectedStreet).toFixed(1)} m long</span>}
        {junctionMotion && <span className="street-motion">Junction ({junctionMotion.to.x}, {junctionMotion.to.y}) · ΔX {junctionMotion.to.x-junctionMotion.from.x} m · ΔY {junctionMotion.to.y-junctionMotion.from.y} m. Connected rows/columns follow.</span>}
        {props.streetSummary && <span className="street-quick-review">{props.streetSummary}</span>}
        <div>{props.streetStroke!==null?<><button type="button" disabled={(props.streetStroke?.length??0)<2} onClick={props.onStreetFinish}>Finish drawing</button><button type="button" onClick={props.onStreetStop}>Cancel stroke</button></>:<button type="button" onClick={props.onStreetReview}>Review streets</button>}</div>
      </div>}
      {props.onBlockReview&&<div className="lot-plan-banner" role="status"><strong>{props.blockTitle??"Unapplied lot plan"}</strong><span>{props.blockSummary??'Blue source extent · preview changes before Apply'}</span><button type="button" onClick={props.onBlockReview}>{props.blockReviewLabel??(props.blockTitle?"Review housing mix":"Review lot plan")}</button></div>}
      {bd && <div className="boundary-banner" role="status">{bdValid ? `${formatM2(polyArea(bd.pts))} · boundary draft` : bd.closed ? 'Invalid boundary · correct the highlighted outline' : `${bd.pts.length} corners · open outline`}<div className="boundary-banner-actions">{bd.closed && <button type="button" disabled={!bdValid} onClick={() => props.onBoundaryApply?.()}>Apply</button>}{!bd.closed && bd.pts.length >= 3 && <button type="button" onClick={() => props.onBoundaryChange?.({ ...bd, closed: true })}>Close outline</button>}<button type="button" onClick={() => props.onBoundaryCancel?.()}>Cancel</button></div></div>}
      <div className="stage" ref={stageRef}>
      <svg
        ref={svgRef}
        width={px.w}
        height={px.h}
        viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
        tabIndex={0}
        role="group"
        aria-label={`Site plan: ${props.layout.parcels.filter(p => hasHome({ contents: props.contents }, p)).length} homes, ${props.layout.family} circulation`}
        className={panning ? 'canvas panning' : props.panTool ? 'canvas pantool' : 'canvas'}
        onPointerDown={onBackgroundDown}
        onPointerMove={onMove}
        onPointerLeave={() => setStreetSnap(null)}
        onPointerUp={onUp}
        onPointerCancel={onCancel}
        onKeyDown={onKeyDown}
      >
        <defs>
          <pattern id={hatchId} width="8" height="8" patternUnits="userSpaceOnUse">
            <rect width="8" height="8" fill="#ede8f5" />
            <path d="M-2 2L2 -2M0 8L8 0M6 10L10 6M-2 6L2 10M0 0L8 8M6 -2L10 2" stroke="#a995cc" strokeWidth="0.65" />
          </pattern>
          <pattern id={gridId} x={M} y={M} width={s} height={s} patternUnits="userSpaceOnUse"><path d={`M ${s} 0 H 0 V ${s}`} fill="none" stroke="#a9afb9" strokeWidth={0.45} opacity={0.42} vectorEffect="non-scaling-stroke" /></pattern>
          <pattern id={majorGridId} x={M} y={M} width={s * 10} height={s * 10} patternUnits="userSpaceOnUse"><path d={`M ${s * 10} 0 H 0 V ${s * 10}`} fill="none" stroke="#939ba8" strokeWidth={0.7} opacity={0.5} vectorEffect="non-scaling-stroke" /></pattern>
        </defs>
        {layers.grid && <g pointerEvents="none"><rect x={vb.x} y={vb.y} width={vb.w} height={vb.h} fill={`url(#${gridId})`} /><rect x={vb.x} y={vb.y} width={vb.w} height={vb.h} fill={`url(#${majorGridId})`} /></g>}
        <rect x={vb.x} y={vb.y} width={vb.w} height={vb.h} fill="transparent" data-bg="1" />
        {/* reference photo: fitted illustration behind the plan, 45% opacity */}
        {props.backdrop && (
          <image
            href={props.backdrop}
            x={M}
            y={M}
            width={props.siteW * s}
            height={props.siteH * s}
            preserveAspectRatio="xMidYMid meet"
            opacity={0.45}
            pointerEvents="none"
          />
        )}
        {reference && surveyAttached && (() => { const m = surveyTransform(reference); return <g className="scaled-survey" pointerEvents="none" transform={`translate(${M} ${M + props.siteH * s}) scale(${s} ${-s})`}><image href={props.surveyRaster!.url} width={reference.width} height={reference.height} transform={`matrix(${m.a} ${m.b} ${m.c} ${m.d} ${m.e} ${m.f})`} opacity={0.7} /></g>; })()}
        {/* site boundary */}
        {!!outline.length && <polygon
          points={polyPoints(props.boundary ?? [{ x: 0, y: 0 }, { x: props.siteW, y: 0 }, { x: props.siteW, y: props.siteH }, { x: 0, y: props.siteH }])}
          className={props.siteSelected ? 'site selected' : 'site'}
          fillOpacity={surveyAttached ? 0.08 : undefined}
          opacity={bd ? 0.2 : 1}
          onClick={(e) => {
            e.stopPropagation();
            if (pannedBetween.current) {
              pannedBetween.current = false;
              return;
            }
            props.onSelectSite();
          }}
        />}
        <g className="plan-geometry" opacity={bd ? 0.65 : 1} pointerEvents={bd ? 'none' : undefined}>
        {/* removed parcels (ghost outlines, drawn first so nothing is covered) */}
        {props.workingKeys !== null &&
          [...props.workingKeys].map((k) => {
            const [x, y, w, h] = k.split(',').map(Number);
            const stillThere = props.layout.parcels.some((p) => parcelKey(p) === k);
            if (stillThere) return null;
            const b = box({ x, y, w, h });
            return (
              <g key={`g${k}`}>
                <rect {...b} className="parcel ghost" />
                <text x={b.x + 3 * tscale} y={b.y + 12 * tscale} className="tag" fontSize={fs(12)} style={halo}>removed</text>
              </g>
            );
          })}
        {props.layout.accessConnector && <polygon points={polyPoints(props.layout.accessConnector)} className={props.selectedKind === 'circulation' ? 'road selected' : 'road'} aria-label="Entrance apron" onPointerDown={e => { if (props.panTool) onBackgroundDown(e); else e.stopPropagation(); }} onClick={e => { e.stopPropagation(); props.onSelectKind('circulation'); }} />}
        {/* roads: gestures starting here never pan — click selects */}
        {props.layout.roadSurface ? <path d={surfacePath(props.layout.roadSurface, X, Ypt)} fillRule="evenodd" className={props.selectedKind === 'circulation' ? 'road selected' : 'road'} onPointerDown={e => { if (props.panTool) onBackgroundDown(e); else e.stopPropagation(); }} onClick={e => { e.stopPropagation(); if (pannedBetween.current) { pannedBetween.current = false; return; } props.onSelectKind('circulation'); }} /> : props.layout.roads.map((r, i) => (
          <rect
            key={`r${i}`}
            {...box(r)}
            className={props.selectedKind === 'circulation' ? 'road selected' : 'road'}
            onPointerDown={(e) => { if (props.panTool) onBackgroundDown(e); else e.stopPropagation(); }}
            onClick={(e) => {
              e.stopPropagation();
              if (pannedBetween.current) {
                pannedBetween.current = false;
                return;
              }
              props.onSelectKind('circulation');
            }}
          />
        ))}
        {layers.labels && (() => {
          const road = props.layout.roads.filter((r) => r.w >= r.h).reduce<Rect | null>((best, r) => !best || r.w > best.w ? r : best, null);
          return road && road.w * s / tscale > 230 ? <text pointerEvents="none" className="road-caption" x={X(road.x + road.w / 2)} y={Ypt(road.y + road.h / 2) + fs(4)} textAnchor="middle" fontSize={fs(13)}>{road.h.toFixed(1)} m STREET</text> : null;
        })()}
        {/* parcels + footprints: reshaped lots render true polygons */}
        {props.layout.parcels.map((p, i) => {
          const f = footprint(p);
          const added = props.workingKeys !== null && !props.workingKeys.has(parcelKey(p));
          const isDraft = props.lotDraft?.index === i;
          const poly = isDraft ? props.lotDraft!.pts : (props.lotEdits[i] ?? null);
          const b = box(p);
          const label = poly ? centroid(poly) : { x: p.x + p.w / 2, y: p.y + p.h / 2 };
          // One lot reads selected at a time; the whole-set highlight applies
          // only when Homes is selected with no specific lot (F05).
          const vacant = !hasHome({ contents: props.contents }, p);
          const cls = isDraft
            ? (props.lotDraftValid ? 'parcel draft' : 'parcel invalid')
            : added
              ? 'parcel added'
              : ((props.selectedLots?.length ? props.selectedLots.includes(i) : props.selectedLot === i || (props.selectedLot == null && props.selectedKind === 'homes')) ? 'parcel selected' : 'parcel');
          return (
            <g
              key={parcelKey(p)}
              role="button" tabIndex={0} aria-label={`Lot ${i + 1}, ${Math.round(poly ? polyArea(poly) : p.w * p.h)} square metres${vacant ? ', vacant' : ''}`}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); props.onSelectLot(i, e.shiftKey); } }}
              onPointerDown={(e) => {
                if (props.panTool) { onBackgroundDown(e); return; }
                // Gestures starting on a fixed home never pan (F06): track a
                // real drag to explain instead; a click still selects.
                e.stopPropagation();
                fixedStart.current = { x: e.clientX, y: e.clientY, hinted: false, index: i };
              }}
              onPointerMove={(e) => {
                const st = fixedStart.current;
                if (!st || st.index !== i || st.hinted || e.buttons === 0) return;
                if (Math.hypot(e.clientX - st.x, e.clientY - st.y) > 6) {
                  st.hinted = true;
                  props.onFixedHint();
                }
              }}
              onPointerUp={() => {
                fixedStart.current = null;
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (pannedBetween.current) {
                  pannedBetween.current = false;
                  return;
                }
                props.onSelectLot(i, e.shiftKey);
              }}
            >
              {poly ? (
                <polygon
                  points={polyPoints(poly)}
                  className={`${cls}${vacant ? ' vacant' : ''}`}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    if (!isDraft || !props.lotDraft) return;
                    const r = svgRef.current?.getBoundingClientRect();
                    if (!r) return;
                    const m = toMetersNow(e.clientX, e.clientY, r);
                    props.onLotVertexAdd(
                      nearestEdge({ x: m.x, y: m.yUp }, props.lotDraft.pts),
                      { x: snap1(m.x), y: snap1(m.yUp) },
                    );
                  }}
                />
              ) : (
                <rect {...b} className={`${cls}${vacant ? ' vacant' : ''}`} />
              )}
              {f && layers.footprints && <rect {...box(f)} className="footprint" data-template={homeTemplate(props.planning,p).id} style={props.planning?.housing?{fill:housingColor(homeTemplate(props.planning,p).id),stroke:'#394055'}:undefined}><title>{homeTemplate(props.planning,p).name} · {f.w*f.h} m² built</title></rect>}
              {f&&props.planning?.housing&&layers.footprints&&f.w*s/tscale>=24&&<text pointerEvents="none" x={X(f.x+f.w/2)} y={Ypt(f.y+f.h/2)+fs(3)} fontSize={fs(10)} textAnchor="middle" fill="#263044">T{homeTemplate(props.planning,p).id.slice(1)}</text>}
              <title>{`Lot ${i + 1}: ${Math.round(poly ? polyArea(poly) : p.w * p.h)} m²${poly ? ', reshaped polygon' : ''}${added ? ', new in preview' : ''}${vacant ? ', vacant lot: home removed' : ''}`}</title>
              {layers.labels && <text pointerEvents="none" x={poly ? X(label.x) : b.x + b.width / 2} y={(poly ? Ypt(label.y) : b.y) + 13 * tscale} textAnchor="middle" className="lotno" fontSize={fs(14)} style={halo}>{props.parcelReferences?.[i]??(b.width / tscale >= 54 ? `${vacant ? b.width / tscale >= 90 ? 'VACANT' : 'V' : 'LOT'} ${String(i + 1).padStart(2, '0')}` : i + 1)}</text>}
              {layers.labels && b.width / tscale >= 52 && b.height / tscale >= 90 && !poly && <text pointerEvents="none" x={b.x + b.width / 2} y={b.y + b.height - fs(10)} textAnchor="middle" className="parcel-area" fontSize={fs(12)}>{Math.round(p.w * p.h)} m²</text>}

            </g>
          );
        })}
        {/* reshape corner handles: drag to move, double-click to remove */}
        {props.blockOutline&&<g className="block-source-outline" pointerEvents="none"><rect {...box(props.blockOutline)} fill="none" stroke="#075cff" strokeWidth={fs(3)} strokeDasharray={`${fs(7)} ${fs(4)}`}><title>Selected source extent · preview the subdivision before Apply</title></rect></g>}
        {props.parcelProposal&&!props.parcelProposal.valid&&<g className="invalid-lot-proposal" pointerEvents="none">{props.parcelProposal.lots.map((lot,i)=>!props.workingKeys?.has(parcelKey(lot))?<g key={i} data-proposed-lot={i+1} className={props.parcelProposal?.inaccessible?.includes(i)?'inaccessible-lot':undefined}><rect {...box(lot)} fill="#dc283722" stroke="#b42933" strokeWidth={fs(3)} strokeDasharray={`${fs(6)} ${fs(3)}`}><title>Proposed Lot {i+1}{props.parcelProposal?.inaccessible?.includes(i)?' lacks street frontage':' · invalid draft'}</title></rect><text x={X(lot.x+lot.w/2)} y={Ypt(lot.y+lot.h/2)} textAnchor="middle" fontSize={fs(14)} fill="#9a1425" style={halo}>{lot.w*s/tscale<90?`P${i+1}${props.parcelProposal?.inaccessible?.includes(i)?' !':''}`:props.parcelProposal?.inaccessible?.includes(i)?`Lot ${i+1} · no frontage`:`Proposed ${i+1}`}</text></g>:null)}</g>}

        {props.invalidHomeLots?.map(i=>{const r=props.layout.parcels[i];return r?<g key={`fit-${i}`} className="housing-fit-conflict" pointerEvents="none"><rect {...box(r)} fill="#dc283733" stroke="#b42933" strokeWidth={fs(3)}/><text x={X(r.x+r.w/2)} y={Ypt(r.y+r.h/2)} textAnchor="middle" fontSize={fs(13)} style={halo}>{r.w*s/tscale<150?"!":`Lot ${i+1} · home does not fit`}</text></g>:null;})}
        {props.lotDraft && props.lotDraft.pts.map((v, vi) => (
          <g key={`lv${vi}`}>
            <rect
              x={X(v.x) - fs(14)}
              y={Ypt(v.y) - fs(14)}
              width={fs(28)}
              height={fs(28)}
              className="hithandle" role="button" tabIndex={0} aria-label={`Lot corner ${vi+1}, ${v.x}, ${v.y} meters`}
              onKeyDown={e=>{const delta:Record<string,[number,number]>={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,1],ArrowDown:[0,-1]};if(delta[e.key]){e.preventDefault();e.stopPropagation();const[x,y]=delta[e.key],step=e.shiftKey?10:1;props.onLotNodeKeyMove?.(vi,boundBoundaryPoint({x:v.x+x*step,y:v.y+y*step}));}if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();e.stopPropagation();props.onLotVertexRemove(vi);}}}
              onPointerDown={(e) => onLotDown(e, vi)}
              onDoubleClick={(e) => {
                e.stopPropagation();
                props.onLotVertexRemove(vi);
              }}
            />
            <rect
              x={X(v.x) - fs(6)}
              y={Ypt(v.y) - fs(6)}
              width={fs(12)}
              height={fs(12)}
              className="handle" pointerEvents="none"
            />
          </g>
        ))}
        {/* green space: selectable, draggable/resizable when editing */}
        <g display={props.spaceDrafts!==undefined||props.layout.openSpaces!==undefined||props.layout.empty || props.layout.supportError ? 'none' : undefined}
          onPointerDown={(e) => onGreenDown(e, null)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') props.onSelectGreen();
          }}
          tabIndex={0}
          role="button"
          aria-label={`Open space A green space${props.greenLocked ? ', locked' : ''}${props.greenSelected ? ', selected' : ''}${props.editing ? ', drag to move, corners to resize' : ''}`}
          className={props.greenSelected ? 'green selected' : 'green'}
        >
          <rect {...gb} style={{ fill: `url(#${hatchId})` }} className={props.draftActive ? (props.draftValid ? 'greenfill draft' : 'greenfill invalid') : 'greenfill'} />
          <text pointerEvents="none" textAnchor="middle" x={gb.x + gb.width / 2} y={gb.height / tscale > 95 && gb.width / tscale > 125 ? gb.y + fs(22) : gb.y - fs(9)} className="tag greentag" fontSize={fs(13)}>
            Open space A{props.draftActive ? (props.draftValid ? ' · draft' : ' · invalid') : ''}
          </text>
          {gb.height / tscale > 95 && gb.width / tscale > 125 && <g pointerEvents="none" className="park-callout" transform={`translate(${gb.x + gb.width / 2},${gb.y + gb.height / 2 + fs(6)}) scale(${tscale})`}>
            <rect x={-55} y={-25} width={110} height={50} />
            <text textAnchor="middle" y={-2} fontSize={17} fontWeight={700}>{formatM2(g.w * g.h)}</text>
            <text textAnchor="middle" y={16} fontSize={12}>{props.greenLocked ? 'LOCKED GREEN' : 'SHARED GREEN'}</text>
          </g>}

        </g>
        {handles.map((hh) => (
          <g key={hh.id} transform={`translate(${hh.x},${hh.y}) scale(${tscale})`}>
            <rect
              x={-16}
              y={-16}
              width={32}
              height={32}
              className="hithandle"
              onPointerDown={(e) => onGreenDown(e, hh.id)}
            />
            <rect
              x={-6}
              y={-6}
              width={12}
              height={12}
              className="handle" pointerEvents="none"
            />
          </g>
        ))}
        </g>
        {egate && <g display={!props.entranceValid ? 'none' : undefined} onPointerDown={onEntranceDown} tabIndex={bd ? -1 : 0} role="button" aria-label={`Compound entrance, ${entranceLabel(props.entrance)}${props.entranceEditing ? ', drag along the edge to move' : ''}`} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); props.onSelectEntrance(); } }}>
          <g transform={`translate(${egate.x},${egate.y}) rotate(${egate.angle})`}>
            <rect x={-Math.max(egate.width, fs(44)) / 2} y={-fs(22)} width={Math.max(egate.width, fs(44))} height={fs(44)} fill="transparent" style={{ cursor: props.entranceEditing ? 'move' : 'pointer' }} />
            <rect x={-egate.width / 2} y={-fs(3)} width={egate.width} height={fs(6)} className={props.entranceValid ? 'entrance' : 'entrance invalid'} />
          </g>
          <g transform={`translate(${egate.x + fs(5)},${egate.y - fs(25)})`}><rect width={fs(78)} height={fs(22)} fill="#0284c7" /><text x={fs(39)} y={fs(15)} textAnchor="middle" fill="#fff" fontFamily="ui-monospace, monospace" fontSize={fs(12)}>IN/OUT</text></g>
        </g>}
        {!bd && props.selectedKind === 'circulation' && props.onStreetDrag && props.streetOffsets?.map((y, i) => <g key={`street-${i}`}
          transform={`translate(${X(props.siteW / 2)},${Ypt(y)}) scale(${tscale})`} role="slider" tabIndex={0}
          style={{ cursor: 'ns-resize' }} aria-label={`Street ${i + 1} canvas handle`} aria-valuemin={3} aria-valuemax={props.siteH - 3} aria-valuenow={y}
          onPointerDown={(e) => {
            if (props.panTool) { onBackgroundDown(e); return; }
            e.stopPropagation(); e.currentTarget.setPointerCapture(e.pointerId);
            streetStart.current = { index: i, y };
            drag.current = { kind: 'street', startCX: e.clientX, startCY: e.clientY, origVb: { ...vb }, origGreen: null, origEntrance: null, origLotPts: null, lotVi: i, handle: null, moved: false };
          }} onKeyDown={(e) => {
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); e.stopPropagation(); props.onStreetDrag?.(i, Math.max(3, Math.min(props.siteH - 3, y + (e.key === 'ArrowUp' ? 1 : -1)))); }
          }}><circle r={16} fill="transparent" /><circle r={7} fill="#fff" stroke="#0b5fff" strokeWidth={2.5} /><text x={12} y={-10} fontSize={13} fill="#174184" style={halo} pointerEvents="none">Street {i + 1}</text></g>)}
        {bd && <g className="boundary-overlay">
          <path className="boundary-workspace-limit" d={`M${vb.x} ${vb.y}h${vb.w}v${vb.h}h${-vb.w}Z M${X(0)} ${Ypt(500)}h${500 * s}v${500 * s}h${-500 * s}Z`} fillRule="evenodd" fill="#394353" fillOpacity={0.2} pointerEvents="none" />
          <rect x={vb.x} y={vb.y} width={vb.w} height={vb.h} fill="transparent" onPointerDown={(e) => {
            if (props.panTool || bd.closed) { onBackgroundDown(e); return; }
            e.stopPropagation();
            const r = svgRef.current!.getBoundingClientRect();
            const m = toMetersNow(e.clientX, e.clientY, r);
            if (bd.pts.length < MAX_SITE_VERTICES) props.onBoundaryChange?.({ ...bd, pts: [...bd.pts, boundBoundaryPoint({ x: snap1(m.x), y: snap1(m.yUp) })] });
          }} />
          {bd.closed ? <polygon points={polyPoints(finitePoints)} className={bdValid ? 'boundary-draft' : 'boundary-draft invalid'} pointerEvents="none" /> : <polyline points={polyPoints(finitePoints)} className="boundary-draft" pointerEvents="none" />}
          {conflictEdges.map(i => { const a = bd.pts[i], b = bd.pts[(i + 1) % bd.pts.length]; return <line key={`conflict-${i}`} className="boundary-conflict" x1={X(a.x)} y1={Ypt(a.y)} x2={X(b.x)} y2={Ypt(b.y)} strokeWidth={fs(5)} pointerEvents="none" />; })}
          {bd.closed && finitePoints.length === bd.pts.length && bd.pts.map((a, i) => {
            const b = bd.pts[(i + 1) % bd.pts.length];
            return <g key={`mid-${i}`} transform={`translate(${X((a.x + b.x) / 2)},${Ypt((a.y + b.y) / 2)}) scale(${tscale})`} role="button" tabIndex={0} aria-label={`Add boundary vertex after ${i + 1}`} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); addAfter(i); }} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); addAfter(i); } }}>
              <circle r={14} className="boundary-mid" /><text textAnchor="middle" y={5} fontSize={18} fill="#0b5fff" pointerEvents="none">+</text>
            </g>;
          })}
          {bd.closed && finitePoints.length === bd.pts.length && bd.pts.map((a, i) => { const b = bd.pts[(i + 1) % bd.pts.length]; return <text key={`edge-${i}`} x={X((a.x + b.x) / 2) + fs(18)} y={Ypt((a.y + b.y) / 2) - fs(12)} fontSize={fs(12)} style={halo} pointerEvents="none">Edge {i + 1}</text>; })}
          {bd.pts.map((v, vi) => Number.isFinite(v.x + v.y) && <g key={`site-v-${vi}`} transform={`translate(${X(v.x)},${Ypt(v.y)}) scale(${tscale})`} className="boundary-vertex" role="button" tabIndex={0} aria-label={`Boundary vertex ${vi + 1}, ${v.x}, ${v.y} meters`} onPointerDown={(e) => {
            if (props.panTool) { onBackgroundDown(e); return; }
            e.stopPropagation();
            if (!bd.closed && vi === 0 && bd.pts.length >= 3) { props.onBoundaryChange?.({ ...bd, closed: true }); return; }
            (e.currentTarget as Element).setPointerCapture(e.pointerId);
            props.onBoundaryGestureStart?.();
            drag.current = { kind: 'site-vertex', startCX: e.clientX, startCY: e.clientY, origVb: { ...vb }, origGreen: null, origEntrance: null, origLotPts: bd.pts.map((p) => ({ ...p })), lotVi: vi, handle: null, moved: false };
          }} onKeyDown={(e) => {
            if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); e.stopPropagation(); removeVertex(vi); }
            const delta: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };
            if (delta[e.key]) { e.preventDefault(); e.stopPropagation(); const [dx, dy] = delta[e.key]; changeVertex(vi, boundBoundaryPoint({ x: v.x + dx * (e.shiftKey ? 10 : 1), y: v.y + dy * (e.shiftKey ? 10 : 1) })); }
          }}>
            <circle r={16} fill="transparent" /><circle r={6} className="boundary-point" /><text x={10} y={-9} fontSize={13} fill="#174184" style={halo} pointerEvents="none">{vi + 1}</text>
          </g>)}
        </g>}
        {props.editableStreets && <g className="street-network-overlay">
          <rect x={vb.x} y={vb.y} width={vb.w} height={vb.h} fill="transparent" onPointerDown={onBackgroundDown}/>
          <defs><mask id={`${instanceId}-street-outside`} maskUnits="userSpaceOnUse" x={vb.x} y={vb.y} width={vb.w} height={vb.h}><rect x={vb.x} y={vb.y} width={vb.w} height={vb.h} fill="white"/><polygon points={polyPoints(outline)} fill="black"/></mask></defs>
          <g pointerEvents="none" className="street-draft-corridors">
            {props.streetAffectedLots?.map((lot,i)=><rect key={i} {...box(lot)} fill="#f9b34120" stroke="#b57116" strokeWidth={fs(2)} strokeDasharray={`${fs(5)} ${fs(3)}`}><title>Accepted lot affected by proposed entrance connection</title></rect>)}
            {shapedDraft ? <path d={surfacePath(shapedDraft,X,Ypt)} fillRule="evenodd" className={`street-corridor${props.streetConflict?' conflict':''}`} fill={props.streetConflict?'#db35454d':'#075cff12'} stroke={props.streetConflict?'#b42933':'#436389'} strokeWidth={fs(props.streetConflict?2:1)}><title>Draft pavement with measured angled legs and corner fillets</title></path> : props.editableStreets.segments.map(edge=>{
              const conflict=props.streetConflict?.segmentIds.includes(edge.id),connector=props.streetConnectorIds?.includes(edge.id);
              return <rect key={edge.id} {...box(streetRect(edge))} className={`street-corridor${conflict?' conflict':''}${connector?' connector':''}`} fill={conflict?'#db35454d':connector?'#efae3659':'#075cff12'} stroke={conflict?'#b42933':connector?'#aa6410':'#436389'} strokeWidth={fs(conflict||connector?2:1)} strokeDasharray={conflict?`${fs(5)} ${fs(3)}`:undefined}><title>{conflict?'Conflicting':connector?'Proposed entrance connection:':'Draft'} street · {edge.width} m full width</title></rect>;
            })}
            {connectorStreet && connectorMid && <g className="street-connector-label"><path d={`M${X(connectorMid.x)} ${Ypt(connectorMid.y)}l${fs(20)} ${fs(-25)}`} fill="none" stroke="#9d590a" strokeWidth={fs(2)}/><text x={X(connectorMid.x)+fs(24)} y={Ypt(connectorMid.y)-fs(28)} fill="#864606" fontSize={fs(14)} style={halo}>Proposed {connectorStreet.width} m entrance link</text></g>}
            {(props.streetConflict?.kind==='park'||props.streetConflict?.kind==='lot') && props.streetConflict.region && <rect {...box(props.streetConflict.region)} className="street-conflict-region" fill="#b4293320" stroke="#b42933" strokeWidth={fs(3)} strokeDasharray={`${fs(5)} ${fs(3)}`}><title>{props.streetConflict.kind==='lot'?'Held manual lot':'Protected open space and clearance'}</title></rect>}
            {props.streetConflict?.kind==='boundary' && <g className="street-boundary-conflict">
              {shapedDraft ? <path d={surfacePath(shapedDraft,X,Ypt)} fillRule="evenodd" mask={`url(#${instanceId}-street-outside)`} fill="#dc2837b3"/> : props.editableStreets.segments.filter(edge=>props.streetConflict!.segmentIds.includes(edge.id)).map(edge=><rect key={edge.id} {...box(streetRect(edge))} mask={`url(#${instanceId}-street-outside)`} fill="#dc2837b3"/>)}
              {outline.map((a,i)=>{const b=outline[(i+1)%outline.length];const hit=props.editableStreets!.segments.filter(edge=>props.streetConflict!.segmentIds.includes(edge.id)).some(edge=>{const corners=streetPolygon(edge);return corners.some((p,j)=>segmentsCross(a,b,p,corners[(j+1)%4]));});return hit?<line key={i} x1={X(a.x)} y1={Ypt(a.y)} x2={X(b.x)} y2={Ypt(b.y)} stroke="#b42933" strokeWidth={fs(4)}/>:null;})}
            </g>}
          </g>
          {props.editableStreets.segments.filter(edge=>[edge.a.x,edge.a.y,edge.b.x,edge.b.y].every(Number.isFinite)).map((edge,i)=><g key={edge.id} role="button" tabIndex={props.streetStroke!==null?-1:0} aria-label={`Select street ${i+1}`} onPointerDown={e=>{if(props.panTool)onBackgroundDown(e);else e.stopPropagation();}} onClick={e=>{e.stopPropagation();if(pannedBetween.current){pannedBetween.current=false;return;}props.onStreetSelect?.(edge.id);}} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();props.onStreetSelect?.(edge.id);}}}>
            <line x1={X(edge.a.x)} y1={Ypt(edge.a.y)} x2={X(edge.b.x)} y2={Ypt(edge.b.y)} stroke="transparent" strokeWidth={fs(22)}/>
            <line x1={X(edge.a.x)} y1={Ypt(edge.a.y)} x2={X(edge.b.x)} y2={Ypt(edge.b.y)} stroke={props.streetConflict?.segmentIds.includes(edge.id)?'#b42933':props.streetConnectorIds?.includes(edge.id)?'#aa6410':edge.id===props.streetSelected?'#075cff':'#436389'} strokeWidth={fs(edge.id===props.streetSelected?4:2)} strokeDasharray={props.streetConflict?.segmentIds.includes(edge.id)?`${fs(6)} ${fs(4)}`:undefined} pointerEvents="none"/>
          </g>)}
          {streetNodes(props.editableStreets).map((point,i)=><g key={i} transform={`translate(${X(point.x)},${Ypt(point.y)}) scale(${tscale})`} className="street-node" role="button" tabIndex={props.streetStroke!==null?-1:0} aria-label={`Street junction ${i+1}, ${point.x}, ${point.y} meters`} onPointerDown={e=>{
            if(props.panTool){onBackgroundDown(e);return;}
            e.stopPropagation();e.currentTarget.setPointerCapture(e.pointerId);
            const inverse=svgRef.current!.getScreenCTM()!.inverse();
            junctionStart.current={network:props.editableStreets!,point,inverse,pointer:new DOMPoint(e.clientX,e.clientY).matrixTransform(inverse)};
            drag.current={kind:'junction',startCX:e.clientX,startCY:e.clientY,origVb:{...vb},origGreen:null,origEntrance:null,origLotPts:null,lotVi:null,handle:null,moved:false};
          }} onKeyDown={e=>{
            const delta:Record<string,[number,number]>={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,1],ArrowDown:[0,-1]};
            if(delta[e.key]){e.preventDefault();e.stopPropagation();const[dX,dY]=delta[e.key],step=e.shiftKey?10:1;props.onStreetNodeKeyMove?.(point,{x:Math.max(0,Math.min(500,point.x+dX*step)),y:Math.max(0,Math.min(500,point.y+dY*step))});}
          }}><circle r={16} fill="transparent"/><circle r={6} fill="#fff" stroke="#075cff" strokeWidth={2.5}/><text x={11} y={-9} fontSize={12} fill="#174184" style={halo} pointerEvents="none">{i+1}</text></g>)}
          {props.streetConflict?.gap && <g className="street-gap-cue" pointerEvents="none"><line x1={X(props.streetConflict.gap.from.x)} y1={Ypt(props.streetConflict.gap.from.y)} x2={X(props.streetConflict.gap.to.x)} y2={Ypt(props.streetConflict.gap.to.y)} stroke="#b42933" strokeWidth={fs(4)} strokeDasharray={`${fs(3)} ${fs(3)}`}/><circle cx={X(props.streetConflict.gap.to.x)} cy={Ypt(props.streetConflict.gap.to.y)} r={fs(10)} fill="none" stroke="#b42933" strokeWidth={fs(2)}/><text x={X(props.streetConflict.gap.from.x)+fs(15)} y={Ypt(props.streetConflict.gap.from.y)-fs(17)} fill="#9e1521" fontSize={fs(14)} style={halo}>{props.streetConflict.kind==='entrance'?'Entrance gap':'Unjoined gap'} {props.streetConflict.gap.distance.toFixed(1)} m</text></g>}
          {props.streetStroke!==null && streetSnap && <g className="street-snap-cue" pointerEvents="none"><circle cx={X(streetSnap.point.x)} cy={Ypt(streetSnap.point.y)} r={fs(10)} fill="#c9f5df" stroke="#087343" strokeWidth={fs(3)}/><text x={X(streetSnap.point.x)+fs(15)} y={Ypt(streetSnap.point.y)-fs(15)} fontSize={fs(14)} fill="#075e38" style={halo}>Join street {props.editableStreets.segments.findIndex(edge=>edge.id===streetSnap.streetId)+1} · ({streetSnap.point.x}, {streetSnap.point.y})</text></g>}
          {props.streetStroke && <polyline points={polyPoints(props.streetStroke)} fill="none" stroke="#075cff" strokeWidth={fs(3)} strokeDasharray={`${fs(6)} ${fs(4)}`} pointerEvents="none"/>}
          {props.streetStroke && props.streetStroke.map((point,i)=><circle key={i} cx={X(point.x)} cy={Ypt(point.y)} r={fs(5)} fill="#075cff" pointerEvents="none"/>)}
          {props.streetStroke!==null && <rect x={vb.x} y={vb.y} width={vb.w} height={vb.h} fill="transparent" style={{cursor:'crosshair'}} onPointerDown={e=>{
            if(props.panTool){onBackgroundDown(e);return;}e.stopPropagation();
            const pick=streetPick(e.clientX,e.clientY);setStreetSnap(pick.snap);
            props.onStreetPoint?.(pick.point);
          }}/>}
        </g>}
        {props.siteContext?.notes.map(n => <g className={`site-context-mark ${n.kind}`} key={n.id} role="img" aria-label={`${n.label}, ${n.confidence === 'assumed' ? 'assumed' : 'documented by user'} ${n.kind}`} pointerEvents="none">
          <title>{n.label} · {n.source} · {n.note || 'No additional notes'} · reference only</title>
          {n.kind === 'street' ? <polyline points={polyPoints(n.points)} fill="none" stroke="#a36119" strokeWidth={fs(4)} strokeDasharray={`${fs(8)} ${fs(5)}`} /> : <circle cx={X(n.points[0].x)} cy={Ypt(n.points[0].y)} r={fs(8)} fill={n.kind === 'access' ? '#ffd28a' : '#caf3e3'} stroke="#485e57" strokeWidth={fs(2)} />}
          <text x={X(n.points[0].x) + fs(12)} y={Ypt(n.points[0].y) - fs(12)} fontSize={fs(13)} fill="#4e3d26" style={halo}>{n.label} · {n.confidence === 'assumed' ? 'assumed' : 'source noted'}</text>
        </g>)}
        {props.noteDraft?.points.length ? <g pointerEvents="none"><polyline points={polyPoints(props.noteDraft.points.filter(p => Number.isFinite(p.x + p.y)))} fill="none" stroke="#075cff" strokeWidth={fs(3)} strokeDasharray={`${fs(6)} ${fs(4)}`} />{props.noteDraft.points.filter(p => Number.isFinite(p.x + p.y)).map((p, i) => <circle key={i} cx={X(p.x)} cy={Ypt(p.y)} r={fs(6)} fill="#fff" stroke="#075cff" strokeWidth={fs(2)} />)}</g> : null}
        {props.contextPicking && !bd && <rect className="context-pick-surface" x={vb.x} y={vb.y} width={vb.w} height={vb.h} fill="transparent" style={{ cursor: 'crosshair' }} onPointerDown={e => { if (props.panTool) { onBackgroundDown(e); return; } e.stopPropagation(); const r = svgRef.current!.getBoundingClientRect(), p = toMetersNow(e.clientX, e.clientY, r); props.onContextPick?.({ x: Math.round(Math.max(-500, Math.min(1000, p.x)) * 10) / 10, y: Math.round(Math.max(-500, Math.min(1000, p.yUp)) * 10) / 10 }); }} />}
        {layers.dimensions && <g className="site-dimensions" pointerEvents="none">
          {outline.map((a, i) => {
            const b = outline[(i + 1) % outline.length];
            const dx = X(b.x) - X(a.x), dy = Ypt(b.y) - Ypt(a.y), length = Math.hypot(dx, dy);
            if (length / tscale < 110) return null;
            const winding = outline.reduce((sum, p, j) => { const q = outline[(j + 1) % outline.length]; return sum + p.x * q.y - q.x * p.y; }, 0);
            const nx = -dy / length * (winding >= 0 ? 1 : -1), ny = dx / length * (winding >= 0 ? 1 : -1);
            const ox = nx * fs(22), oy = ny * fs(22);
            const x1 = X(a.x) + ox, y1 = Ypt(a.y) + oy, x2 = X(b.x) + ox, y2 = Ypt(b.y) + oy;
            let angle = Math.atan2(dy, dx) * 180 / Math.PI;
            if (angle > 90 || angle < -90) angle += 180;
            return <g key={i}><path d={`M${x1} ${y1}L${x2} ${y2}M${x1 - nx * fs(5)} ${y1 - ny * fs(5)}L${x1 + nx * fs(5)} ${y1 + ny * fs(5)}M${x2 - nx * fs(5)} ${y2 - ny * fs(5)}L${x2 + nx * fs(5)} ${y2 + ny * fs(5)}`} /><text transform={`translate(${(x1 + x2) / 2},${(y1 + y2) / 2}) rotate(${angle})`} textAnchor="middle" dy={fs(4)} fontSize={fs(13)}>{Math.hypot(b.x - a.x, b.y - a.y).toFixed(1)} m</text></g>;
          })}
        </g>}

        {props.spaceDrawing&&!props.panTool&&<rect x={vb.x} y={vb.y} width={vb.w} height={vb.h} fill="transparent" style={{cursor:'crosshair'}} onPointerDown={e=>{e.stopPropagation();const q=toMetersNow(e.clientX,e.clientY,svgRef.current!.getBoundingClientRect());props.onSpacePoint?.({x:Math.round(Math.max(0,Math.min(500,q.x))),y:Math.round(Math.max(0,Math.min(500,q.yUp)))});}}/>}
        {(props.spaceDrafts??props.layout.openSpaces)&&<OpenSpaceLayer spaces={props.spaceDrafts??props.layout.openSpaces!} active={props.activeSpace??null} editing={!!props.spacesEditing} drawing={!!props.spaceDrawing} valid={props.spaceValid!==false} clearance={props.spaceClearance??0} X={X} Y={Ypt} scale={fs} pan={props.panTool} onSelect={id=>props.onSpaceSelect?.(id)} onPoint={q=>props.onSpacePoint?.(q)} onFinish={()=>props.onSpaceFinish?.()} onMove={(i,q,record)=>props.onSpaceMove?.(i,q,record)} onRemove={i=>props.onSpaceRemove?.(i)} onGesture={pts=>props.onSpaceGesture?.(pts)} onRevert={pts=>props.onSpaceRevert?.(pts)} pointer={(x,y)=>{const q=toMetersNow(x,y,svgRef.current!.getBoundingClientRect());return {x:q.x,y:q.yUp};}}/>}
      </svg>
      {props.layout.empty && !bd && !props.showContext && !props.spacesEditing && !props.spaceDrafts?.length && !surveyAttached && <div className="plan-empty-message"><strong>{outline.length ? 'Boundary ready' : 'A new beginning'}</strong><p>{outline.length ? 'Generate a layout when you are ready to explore homes, streets and open space.' : 'Draw your site boundary to start planning.'}</p></div>}
      {!separateReadouts && <>{scaleReadout}{viewportReadout}</>}
      </div>
      {separateReadouts && <div className="comparison-readouts">{scaleReadout}{viewportReadout}</div>}
      {props.spaceDrawing&&<div className="space-drawing-actions"><strong>Place corners · click first corner to close</strong><button type="button" disabled={(props.spaceDrafts?.find(s=>s.id===props.activeSpace)?.pts.length??0)<3} onClick={props.onSpaceFinish}>Finish outline</button></div>}
      {props.spacesEditing&&<p className="space-drawing-readout">{props.spaceDrafts?.find(s=>s.id===props.activeSpace)?.name??'Select or add an open space'} · unapplied draft · {props.spaceValid?'Review before Apply':'Needs attention; accepted plan retained'} {focusedSpace&&<button type="button" onClick={focusSpace}>Fit selected space</button>}</p>}
      <HousingDrawingKey planning={props.planning} contents={props.contents} lots={props.layout.parcels} selectedLot={props.selectedLot}/>
    </div>
  );
}
