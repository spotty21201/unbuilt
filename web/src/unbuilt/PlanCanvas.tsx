import { useEffect, useId, useRef, useState } from 'react';
import type { Rect } from '../../../src/schema';
import type { Entrance, Layout } from '../../../src/geometry';
import { placeFootprint } from '../../../src/geometry';
import type { Pt } from '../../../src/polygon';
import { centroid, polyArea } from '../../../src/polygon';
import { parcelKey, formatM2 } from './ui';
import type { BoundaryDraft } from './BoundaryEditor';
import { boundaryErrors, MAX_SITE_VERTICES } from '../../../src/boundary';

interface Props {
  layout: Layout;
  boundary?: Pt[];
  boundaryDraft?: BoundaryDraft | null;
  onBoundaryChange?: (draft: BoundaryDraft, record?: boolean) => void;
  onBoundaryApply?: () => void;
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
  onSelectLot: (index: number) => void;
  // A drag that starts on a fixed home explains itself instead of panning.
  onFixedHint: () => void;
  // Committed manual reshapes (parcel index -> polygon meters) and the open
  // reshape draft. Metrics never follow the draft; Apply commits it upstairs.
  lotEdits: Record<number, Pt[]>;
  selectedLot: number | null;
  lotDraft: { index: number; pts: Pt[] } | null;
  lotDraftValid: boolean;
  onLotVertexDrag: (vi: number, pt: Pt) => void;
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
  // Fill mode (workbench): the canvas takes the stage's leftover box after
  // the toolbar — the composer below is never squeezed. Width mode
  // (comparison dock): size from width only; the dock scrolls.
  fitMode?: 'fill' | 'width';
}

const M = 28; // margin px
const W = 640;
const H = 560;

type DragKind = 'none' | 'pan' | 'green-move' | 'green-resize' | 'entrance-move' | 'lot-vertex' | 'site-vertex';

export default function PlanCanvas(props: Props) {
  const hatchId = `green-hatch-${useId()}`;
  const s = Math.min((W - 2 * M) / props.siteW, (H - 2 * M) / props.siteH);
  const [vb, setVb] = useState({ x: 0, y: 0, w: W, h: H });
  const [panning, setPanning] = useState(false);
  // Fill mode: the canvas takes exactly the stage's leftover box, so the
  // composer and outcomes below are never squeezed out. The stage is a flex
  // leftover, so any sibling change (preview bar, verdicts, resize) refits
  // through the observer. Explicit pixel size keeps pointer mapping exact
  // (no letterboxing). Stacked layouts (narrow page) size from width.
  const wrapRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [px, setPx] = useState({ w: W, h: H });
  // True when the last gesture panned, so the trailing click selects nothing.
  const pannedBetween = useRef(false);
  useEffect(() => {
    const el = wrapRef.current;
    const st = stageRef.current;
    if (!el || !st) return;
    const col = el.parentElement;
    const fit = () => {
      const style = getComputedStyle(st);
      const cw = Math.max(200, st.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight));
      if (props.fitMode === 'width') {
        const capH = Math.max(280, window.innerHeight * 0.45);
        const k = Math.min(cw / W, capH / H);
        setPx({ w: Math.floor(W * k), h: Math.floor(H * k) });
        return;
      }
      const stacked = col ? getComputedStyle(col).overflowY === 'visible' : false;
      const maxH = stacked
        ? Math.max(280, window.innerHeight * 0.62)
        : Math.max(160, st.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom));
      const k = Math.min(cw / W, maxH / H);
      setPx({ w: Math.floor(W * k), h: Math.floor(H * k) });
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(st);
    window.addEventListener('resize', fit);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', fit);
    };
  }, [props.wide, props.fitMode]);

  // Parent-driven Fit Both: reset the viewBox to the whole drawing.
  useEffect(() => {
    setVb({ x: 0, y: 0, w: W, h: H });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.fitTick]);

  const resetDrag = () => {
    drag.current = { kind: 'none', startCX: 0, startCY: 0, origVb: { ...vb }, origGreen: null, origEntrance: null, origLotPts: null, lotVi: null, handle: null, moved: false };
    setPanning(false);
  };

  // Parent-driven cancel (Escape): a stuck gesture ref can never survive it.
  useEffect(() => {
    resetDrag();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.cancelTick]);
  const svgRef = useRef<SVGSVGElement>(null);
  // Start point of a gesture on a fixed home, for the F06 explain-instead-of-pan hint.
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

  // Wheel zoom (non-passive so the page does not scroll while zooming the plan).
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const f = e.deltaY > 0 ? 1.15 : 1 / 1.15;
      setVb((v) => {
        const w = Math.min(2000, Math.max(W / 8, v.w * f));
        const h = (v.h / v.w) * w;
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
  const footprint = (p: Rect): Rect | null => placeFootprint(p);

  const onBackgroundDown = (e: React.PointerEvent) => {
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
    const d = drag.current;
    if (d.kind === 'none') return;
    const r = svgRef.current?.getBoundingClientRect();
    if (!r) return;
    if (Math.abs(e.clientX - d.startCX) + Math.abs(e.clientY - d.startCY) > 3) d.moved = true;
    if (d.kind === 'pan') {
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
      props.onEntranceDrag(snap1(m1.yUp));
      return;
    }
    if (d.kind === 'site-vertex') {
      const m1 = toMetersRef(e.clientX, e.clientY, r);
      if (!m1 || d.lotVi == null || !props.boundaryDraft) return;
      props.onBoundaryChange?.({ ...props.boundaryDraft, pts: props.boundaryDraft.pts.map((p, i) => i === d.lotVi ? { x: snap1(m1.x), y: snap1(m1.yUp) } : p) }, false);
      return;
    }
    if (d.kind === 'lot-vertex') {
      const m1 = toMetersRef(e.clientX, e.clientY, r);
      if (!m1 || d.lotVi == null) return;
      props.onLotVertexDrag(d.lotVi, { x: snap1(m1.x), y: snap1(m1.yUp) });
      return;
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
    } else if (d.kind === 'lot-vertex') {
      // Ephemeral draft: release keeps the live corners; Apply commits.
      // A click without movement changes nothing.
    } else if (d.moved) {
      props.onDraftCommit();
    }
  };

  // A browser-cancelled gesture can never commit: revert to the gesture start.
  const onCancel = () => {
    const d = drag.current;
    if (d.kind === 'none') return;
    if (d.origGreen) props.onDraftChange({ ...d.origGreen });
    if (d.origEntrance) props.onEntranceCancel(d.origEntrance);
    if (d.origLotPts) {
      if (d.kind === 'site-vertex' && props.boundaryDraft) props.onBoundaryChange?.({ ...props.boundaryDraft, pts: d.origLotPts }, false);
      else props.onLotVertexRevert(d.origLotPts);
    }
    resetDrag();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
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

  const g = props.layout.green;
  const gb = box(g);
  // Entrance gate bar on its own edge, positioned by center offset from south.
  // Invalid mid-drag offsets still render (styled invalid) so nothing vanishes.
  const egate = (() => {
    const lo = props.entrance.offset - props.entrance.width / 2;
    const x = props.entrance.edge === 'east' ? X(props.siteW) - 3 : X(0) - 3;
    return { x, y: Ytop(lo, props.entrance.width), h: Math.max(props.entrance.width * s, 2) };
  })();
  // Visible handles are 12 units; each carries a 28-unit transparent hit
  // area so pointer targets stay usable when the plan is fitted small.
  const handles = props.editing && props.greenSelected ? ([
    { id: 'nw', x: gb.x - 6, y: gb.y - 6 },
    { id: 'ne', x: gb.x + gb.width - 6, y: gb.y - 6 },
    { id: 'sw', x: gb.x - 6, y: gb.y + gb.height - 6 },
    { id: 'se', x: gb.x + gb.width - 6, y: gb.y + gb.height - 6 },
  ] as const) : [];

  // ViewBox units per screen pixel: labels divide by this to hold a
  // constant screen size at any zoom or fit scale. Geometry never does.
  const tscale = px.w > 0 ? vb.w / px.w : 1;
  const fs = (screenPx: number) => screenPx * tscale;
  // Light halo keeps labels legible over fills at any scale.
  const halo = { paintOrder: 'stroke' as const, stroke: '#f4f2ec', strokeWidth: 3 * tscale, strokeLinejoin: 'round' as const };

  const bd = props.boundaryDraft;
  const bdValid = bd && bd.closed && boundaryErrors(bd.pts).length === 0;
  const finitePoints = bd?.pts.filter((p) => Number.isFinite(p.x + p.y)) ?? [];
  const changeVertex = (vi: number, p: Pt) => {
    if (bd) props.onBoundaryChange?.({ ...bd, pts: bd.pts.map((q, i) => i === vi ? p : q) });
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

  return (
    <div className="canvastools" ref={wrapRef}>
      <div className="toolbar" role="toolbar" aria-label="Plan view controls">
        <button type="button" onClick={() => setVb({ x: 0, y: 0, w: W, h: H })}>Fit site</button>
        <button type="button" onClick={() => zoomBy(1 / 1.25)} aria-label="Zoom in">+</button>
        <button type="button" onClick={() => zoomBy(1.25)} aria-label="Zoom out">−</button>
        <button type="button" onClick={props.onToggleWide} aria-pressed={props.wide}>
          {props.wide ? 'Dock plan' : 'Expand plan'}
        </button>
        <span className="note">{bd ? bd.closed ? 'Edit boundary · Apply or Cancel in inspector' : 'Place corners · click first to close' : 'Drag to pan · scroll to zoom'}</span>
      </div>
      {bd && <div className="boundary-banner" role="status">{bdValid ? `${formatM2(polyArea(bd.pts))} · boundary draft` : bd.closed ? 'Invalid boundary · correct the highlighted outline' : `${bd.pts.length} corners · open outline`}<div className="boundary-banner-actions">{bd.closed && <button type="button" disabled={!bdValid} onClick={() => props.onBoundaryApply?.()}>Apply</button>}{!bd.closed && bd.pts.length >= 3 && <button type="button" onClick={() => props.onBoundaryChange?.({ ...bd, closed: true })}>Close outline</button>}<button type="button" onClick={() => props.onBoundaryCancel?.()}>Cancel</button></div></div>}
      <div className="stage" ref={stageRef}>
      <svg
        ref={svgRef}
        width={px.w}
        height={px.h}
        viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
        tabIndex={0}
        role="img"
        aria-label={`Site plan: ${props.layout.parcels.length} homes, ${props.layout.family} circulation`}
        className={panning ? 'canvas panning' : props.panTool ? 'canvas pantool' : 'canvas'}
        onPointerDown={onBackgroundDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onCancel}
        onKeyDown={onKeyDown}
      >
        <defs>
          <pattern id={hatchId} width="8" height="8" patternUnits="userSpaceOnUse">
            <rect width="8" height="8" fill="#ede8f5" />
            <line x1="0" y1="0" x2="0" y2="8" stroke="#b5a4d2" strokeWidth="2" />
          </pattern>
        </defs>
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
        {/* site boundary */}
        <polygon
          points={polyPoints(props.boundary ?? [{ x: 0, y: 0 }, { x: props.siteW, y: 0 }, { x: props.siteW, y: props.siteH }, { x: 0, y: props.siteH }])}
          className={props.siteSelected ? 'site selected' : 'site'}
          opacity={bd ? 0.2 : 1}
          onClick={(e) => {
            e.stopPropagation();
            if (pannedBetween.current) {
              pannedBetween.current = false;
              return;
            }
            props.onSelectSite();
          }}
        />
        <g className="plan-geometry" opacity={bd ? 0.18 : 1} pointerEvents={bd ? 'none' : undefined}>
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
        {/* roads: gestures starting here never pan — click selects */}
        {props.layout.roads.map((r, i) => (
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
          const cls = isDraft
            ? (props.lotDraftValid ? 'parcel draft' : 'parcel invalid')
            : added
              ? 'parcel added'
              : (props.selectedLot === i || (props.selectedLot == null && props.selectedKind === 'homes') ? 'parcel selected' : 'parcel');
          return (
            <g
              key={parcelKey(p)}
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
                props.onSelectLot(i);
              }}
            >
              {poly ? (
                <polygon
                  points={polyPoints(poly)}
                  className={cls}
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
                <rect {...b} className={cls} />
              )}
              {f && <rect {...box(f)} className="footprint" />}
              <title>{`Lot ${i + 1}: ${Math.round(poly ? polyArea(poly) : p.w * p.h)} m²${poly ? ', reshaped polygon' : ''}${added ? ', new in preview' : ''}`}</title>
              <text x={poly ? X(label.x) : b.x + b.width / 2} y={(poly ? Ypt(label.y) : b.y) + 13 * tscale} textAnchor="middle" className="lotno" fontSize={fs(14)} style={halo}>{i + 1}</text>

            </g>
          );
        })}
        {/* reshape corner handles: drag to move, double-click to remove */}
        {props.lotDraft && props.lotDraft.pts.map((v, vi) => (
          <g key={`lv${vi}`}>
            <rect
              x={X(v.x) - fs(14)}
              y={Ypt(v.y) - fs(14)}
              width={fs(28)}
              height={fs(28)}
              className="hithandle"
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
              className="handle"
            />
          </g>
        ))}
        {/* green space: selectable, draggable/resizable when editing */}
        <g display={props.layout.supportError ? 'none' : undefined}
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
          <text textAnchor="middle" x={gb.x + gb.width / 2} y={gb.y - 7 * tscale} className="tag greentag" fontSize={fs(13)} style={halo}>
            Open space A
            {props.draftActive ? (props.draftValid ? ' · draft' : ' · invalid') : ''}
          </text>
        </g>
        {handles.map((hh) => (
          <g key={hh.id}>
            <rect
              x={hh.x - 8}
              y={hh.y - 8}
              width={fs(28)}
              height={fs(28)}
              className="hithandle"
              onPointerDown={(e) => onGreenDown(e, hh.id)}
            />
            <rect
              x={hh.x}
              y={hh.y}
              width={fs(12)}
              height={fs(12)}
              className="handle"
            />
          </g>
        ))}
        {/* entrance gate marker on its own edge: wide hit area, narrow visible bar */}
        <g display={!props.entranceValid ? 'none' : undefined}
          onPointerDown={onEntranceDown}
          tabIndex={0}
          role="button"
          aria-label={`Compound entrance, ${props.entrance.edge} edge${props.entranceEditing ? ', drag along the edge to move' : ''}`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') props.onSelectEntrance();
          }}
        >
          <rect
            x={egate.x - 4}
            y={egate.y}
            width={14}
            height={egate.h}
            fill="transparent"
            style={{ cursor: props.entranceEditing ? 'ns-resize' : 'pointer' }}
          />
          <rect
            x={egate.x}
            y={egate.y}
            width={6}
            height={egate.h}
            className={props.entranceValid ? 'entrance' : 'entrance invalid'}
          />
          <text x={egate.x + 8 * tscale} y={egate.y + 12 * tscale} className="tag" fontSize={fs(12)} style={halo}>
            Entrance · {props.entrance.edge}
          </text>
        </g>
        </g>
        {bd && <g className="boundary-overlay">
          <rect x={vb.x} y={vb.y} width={vb.w} height={vb.h} fill="transparent" onPointerDown={(e) => {
            if (props.panTool || bd.closed) { onBackgroundDown(e); return; }
            e.stopPropagation();
            const r = svgRef.current!.getBoundingClientRect();
            const m = toMetersNow(e.clientX, e.clientY, r);
            if (bd.pts.length < MAX_SITE_VERTICES) props.onBoundaryChange?.({ ...bd, pts: [...bd.pts, { x: snap1(m.x), y: snap1(m.yUp) }] });
          }} />
          {bd.closed ? <polygon points={polyPoints(finitePoints)} className={bdValid ? 'boundary-draft' : 'boundary-draft invalid'} pointerEvents="none" /> : <polyline points={polyPoints(finitePoints)} className="boundary-draft" pointerEvents="none" />}
          {bd.closed && finitePoints.length === bd.pts.length && bd.pts.map((a, i) => {
            const b = bd.pts[(i + 1) % bd.pts.length];
            return <g key={`mid-${i}`} transform={`translate(${X((a.x + b.x) / 2)},${Ypt((a.y + b.y) / 2)}) scale(${tscale})`} role="button" tabIndex={0} aria-label={`Add boundary vertex after ${i + 1}`} onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); addAfter(i); }} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); addAfter(i); } }}>
              <circle r={14} className="boundary-mid" /><text textAnchor="middle" y={5} fontSize={18} fill="#0b5fff" pointerEvents="none">+</text>
            </g>;
          })}
          {bd.pts.map((v, vi) => Number.isFinite(v.x + v.y) && <g key={`site-v-${vi}`} transform={`translate(${X(v.x)},${Ypt(v.y)}) scale(${tscale})`} className="boundary-vertex" role="button" tabIndex={0} aria-label={`Boundary vertex ${vi + 1}, ${v.x}, ${v.y} meters`} onPointerDown={(e) => {
            if (props.panTool) { onBackgroundDown(e); return; }
            e.stopPropagation();
            if (!bd.closed && vi === 0 && bd.pts.length >= 3) { props.onBoundaryChange?.({ ...bd, closed: true }); return; }
            (e.currentTarget as Element).setPointerCapture(e.pointerId);
            drag.current = { kind: 'site-vertex', startCX: e.clientX, startCY: e.clientY, origVb: { ...vb }, origGreen: null, origEntrance: null, origLotPts: bd.pts.map((p) => ({ ...p })), lotVi: vi, handle: null, moved: false };
          }} onKeyDown={(e) => {
            if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); e.stopPropagation(); removeVertex(vi); }
            const delta: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };
            if (delta[e.key]) { e.preventDefault(); e.stopPropagation(); const [dx, dy] = delta[e.key]; changeVertex(vi, { x: v.x + dx * (e.shiftKey ? 10 : 1), y: v.y + dy * (e.shiftKey ? 10 : 1) }); }
          }}>
            <circle r={16} fill="transparent" /><circle r={6} className="boundary-point" /><text x={10} y={-9} fontSize={13} fill="#174184" style={halo} pointerEvents="none">{vi + 1}</text>
          </g>)}
        </g>}
        {/* scale bar + orientation: screen-space, never geometry (F05) */}
        <g aria-hidden="true" pointerEvents="none">
          <line
            x1={M} y1={H - 30} x2={M + (props.siteW >= 200 ? 50 : props.siteW >= 100 ? 20 : 10) * s} y2={H - 30}
            className="scalebar"
          />
          <text x={M} y={H - 34} className="tag" fontSize={fs(11)} style={halo}>
            {props.siteW >= 200 ? 50 : props.siteW >= 100 ? 20 : 10} m
          </text>
          <text x={W - M} y={H - 30} textAnchor="end" className="tag" fontSize={fs(11)} style={halo}>N ↑ (illustrative)</text>
        </g>
        <text pointerEvents="none" x={M} y={H - 8} className="caption" fontSize={fs(13)} style={halo}>
          {props.layout.supportError ? 'Layout unavailable' : `${bd ? 'Accepted plan · ' : ''}${props.layout.family} · ${props.layout.parcels.length} homes`}{px.w >= 580 && !props.layout.supportError ? ` · Entrance ${props.entrance.edge} · local meters` : ''}
          {props.vsNote ? ` · vs working: ${props.vsNote}` : ''}
        </text>
      </svg>
      </div>
    </div>
  );
}
