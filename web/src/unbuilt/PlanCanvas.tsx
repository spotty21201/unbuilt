import { useEffect, useRef, useState } from 'react';
import type { Rect } from '../../../src/schema';
import type { Entrance, Layout } from '../../../src/geometry';
import { placeFootprint } from '../../../src/geometry';
import type { Pt } from '../../../src/polygon';
import { centroid } from '../../../src/polygon';
import { parcelKey } from './ui';

interface Props {
  layout: Layout;
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
}

const M = 28; // margin px
const W = 640;
const H = 560;

type DragKind = 'none' | 'pan' | 'green-move' | 'green-resize' | 'entrance-move' | 'lot-vertex';

export default function PlanCanvas(props: Props) {
  const s = Math.min((W - 2 * M) / props.siteW, (H - 2 * M) / props.siteH);
  const [vb, setVb] = useState({ x: 0, y: 0, w: W, h: H });
  const [panning, setPanning] = useState(false);
  // Fit the drawing to the available column width AND workbench height so the
  // plan never pushes essential controls below the fold. Explicit pixel size
  // keeps pointer mapping exact (no letterboxing).
  const wrapRef = useRef<HTMLDivElement>(null);
  const [px, setPx] = useState({ w: W, h: H });
  // True when the last gesture panned, so the trailing click selects nothing.
  const pannedBetween = useRef(false);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const fit = () => {
      const cw = Math.max(200, el.clientWidth);
      const maxH = Math.max(300, window.innerHeight * (props.wide ? 0.62 : 0.46));
      const k = Math.min(cw / W, maxH / H);
      setPx({ w: Math.floor(W * k), h: Math.floor(H * k) });
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    window.addEventListener('resize', fit);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', fit);
    };
  }, [props.wide]);

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
    if (d.origLotPts) props.onLotVertexRevert(d.origLotPts);
    resetDrag();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
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
  const handles = props.editing && props.greenSelected ? ([
    { id: 'nw', x: gb.x - 5, y: gb.y - 5 },
    { id: 'ne', x: gb.x + gb.width - 5, y: gb.y - 5 },
    { id: 'sw', x: gb.x - 5, y: gb.y + gb.height - 5 },
    { id: 'se', x: gb.x + gb.width - 5, y: gb.y + gb.height - 5 },
  ] as const) : [];

  return (
    <div className="canvastools" ref={wrapRef}>
      <div className="toolbar" role="toolbar" aria-label="Plan view controls">
        <button type="button" onClick={() => setVb({ x: 0, y: 0, w: W, h: H })}>Fit site</button>
        <button type="button" onClick={() => zoomBy(1 / 1.25)} aria-label="Zoom in">+</button>
        <button type="button" onClick={() => zoomBy(1.25)} aria-label="Zoom out">−</button>
        <button type="button" onClick={props.onToggleWide} aria-pressed={props.wide}>
          {props.wide ? 'Dock plan' : 'Expand plan'}
        </button>
        <span className="note">Drag background to pan · scroll to zoom · zoom never changes quantities</span>
      </div>
      <svg
        ref={svgRef}
        width={px.w}
        height={px.h}
        viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
        role="img"
        aria-label={`Site plan: ${props.layout.parcels.length} homes, ${props.layout.family} circulation`}
        className={panning ? 'canvas panning' : 'canvas'}
        onPointerDown={onBackgroundDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onCancel}
        onKeyDown={onKeyDown}
      >
        <defs>
          <pattern id="green-hatch" width="8" height="8" patternUnits="userSpaceOnUse">
            <rect width="8" height="8" fill="#dff0dd" />
            <line x1="0" y1="0" x2="0" y2="8" stroke="#4a7c46" strokeWidth="2" />
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
        <rect
          x={M} y={M} width={props.siteW * s} height={props.siteH * s}
          className={props.siteSelected ? 'site selected' : 'site'}
          onClick={(e) => {
            e.stopPropagation();
            if (pannedBetween.current) {
              pannedBetween.current = false;
              return;
            }
            props.onSelectSite();
          }}
        />
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
                <text x={b.x + 3} y={b.y + 12} className="tag">removed</text>
              </g>
            );
          })}
        {/* roads */}
        {props.layout.roads.map((r, i) => (
          <rect
            key={`r${i}`}
            {...box(r)}
            className={props.selectedKind === 'circulation' ? 'road selected' : 'road'}
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
          const cls = isDraft
            ? (props.lotDraftValid ? 'parcel draft' : 'parcel invalid')
            : added
              ? 'parcel added'
              : (props.selectedKind === 'homes' || props.selectedLot === i ? 'parcel selected' : 'parcel');
          return (
            <g
              key={parcelKey(p)}
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
              <text x={poly ? X(label.x) : b.x + b.width / 2} y={(poly ? Ypt(label.y) : b.y) + 13} textAnchor="middle" className="lotno">{i + 1}</text>
              {added && (
                <text x={b.x + 3} y={b.y + 12} className="tag">new</text>
              )}
            </g>
          );
        })}
        {/* reshape corner handles: drag to move, double-click to remove */}
        {props.lotDraft && props.lotDraft.pts.map((v, vi) => (
          <rect
            key={`lv${vi}`}
            x={X(v.x) - 5}
            y={Ypt(v.y) - 5}
            width={10}
            height={10}
            className="handle"
            onPointerDown={(e) => onLotDown(e, vi)}
            onDoubleClick={(e) => {
              e.stopPropagation();
              props.onLotVertexRemove(vi);
            }}
          />
        ))}
        {/* green space: selectable, draggable/resizable when editing */}
        <g
          onPointerDown={(e) => onGreenDown(e, null)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') props.onSelectGreen();
          }}
          tabIndex={0}
          role="button"
          aria-label={`Open space A green space${props.greenLocked ? ', locked' : ''}${props.greenSelected ? ', selected' : ''}${props.editing ? ', drag to move, corners to resize' : ''}`}
          className={props.greenSelected ? 'green selected' : 'green'}
        >
          <rect {...gb} className={props.draftActive ? (props.draftValid ? 'greenfill draft' : 'greenfill invalid') : 'greenfill'} />
          <text x={gb.x + 4} y={gb.y + 14} className="tag greentag">
            Open space A{props.greenLocked ? ' · locked' : ''}
            {props.draftActive ? (props.draftValid ? ' · draft' : ' · invalid') : ''}
          </text>
        </g>
        {handles.map((hh) => (
          <rect
            key={hh.id}
            x={hh.x}
            y={hh.y}
            width={10}
            height={10}
            className="handle"
            onPointerDown={(e) => onGreenDown(e, hh.id)}
          />
        ))}
        {/* entrance gate marker on its own edge: wide hit area, narrow visible bar */}
        <g
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
          <text x={egate.x + 8} y={egate.y + 12} className="tag">
            Entrance · {props.entrance.edge}
          </text>
        </g>
        <text x={M} y={H - 8} className="caption">
          {props.layout.family} · {props.layout.parcels.length} homes · Open space A{props.greenLocked ? ' (locked, retained)' : ''} · Entrance {props.entrance.edge}
          {props.vsNote ? ` · vs working: ${props.vsNote}` : ''}
        </text>
      </svg>
    </div>
  );
}
