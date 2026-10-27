// UNBUILT geometry core (M1, Coder-owned). Flat rectangular site, axis-aligned
// roads/parcels/green, meters. Exact rect-union math; no rounded intermediates.
// Manually reshaped lots are simple polygons over generated rects (see
// polygon.ts); quantities, validation, and frontage use true polygon math.
import { siteArea, siteBoundary, siteFrameErrors } from "./boundary.ts";
import type { Rect } from "./schema.ts";
import {
  MAX_LOT_VERTICES,
  allFinite,
  isSimple,
  polyArea,
  polyInsidePoly,
  polyOverlapsRect,
  polysOverlap,
  rectInsidePoly,
  sharedBoundaryLength,
  type Pt,
} from "./polygon.ts";

// Manual lot reshapes: parcel index -> simple polygon vertices in meters.
// Indices address one generated layout; across regenerations use StableEdits
// (below), keyed by the unedited base rectangle, so identical lots keep their
// manual shape and only truly removed lots conflict.
export type LotEdits = Map<number, Pt[]>;

// Stable manual reshapes: base-rectangle key -> polygon meters. The key is
// the generated lot's exact rect ("x,y,w,h"); any regenerated layout whose
// parcels include that rect can carry the edit without reinterpretation.
export type StableEdits = Record<string, Pt[]>;

export function lotKey(r: Rect): string {
  return `${r.x},${r.y},${r.w},${r.h}`;
}

// Index-addressed view of stable edits for one concrete layout: only edits
// whose base rectangle exists verbatim in this layout apply.
export function editsForLayout(parcels: Rect[], stable: StableEdits): LotEdits {
  const out: LotEdits = new Map();
  parcels.forEach((p, i) => {
    const e = stable[lotKey(p)];
    if (e) out.set(i, e.map((q) => ({ ...q })));
  });
  return out;
}

export type EntranceEdge = "west" | "east";

export interface Entrance {
  edge: EntranceEdge; // supported site edge carrying the gate
  offset: number; // gate center along the edge, meters from the south corner
  width: number; // gate width along the edge, meters
}

export interface Site {
  w: number;
  h: number;
  boundary?: Pt[]; // absent on legacy rectangular projects
  entrance: Entrance;
  green: Rect; // reserved green region (locked shape+location candidate)
}

export interface Layout {
  family: "spine" | "loop";
  roads: Rect[];
  parcels: Rect[];
  green: Rect;
  unallocatedNote: string;
  supportError?: string;
}

export interface Quantities {
  n: number;
  roadArea: number;
  greenArea: number;
  parcelArea: number;
  unallocatedArea: number;
}

export const TOL = 0.001; // 1 mm coordinate tolerance
export const AREA_TOL = 0.01;

// Cedar Market sample: 120 x 100 m, fictional. Entrance on west side.
export function cedarMarket(): Site {
  return {
    w: 120,
    h: 100,
    entrance: { edge: "west", offset: 50, width: 8 },
    green: { x: 78, y: 62, w: 24, h: 20 },
  };
}

// Gate span along its edge, meters from the south/west corner.
export function entranceSpan(site: Site): { lo: number; hi: number } {
  return { lo: site.entrance.offset - site.entrance.width / 2, hi: site.entrance.offset + site.entrance.width / 2 };
}

export function entranceErrors(site: Site): string[] {
  const errors: string[] = [];
  const e = site.entrance;
  if (e.edge !== "west" && e.edge !== "east") {
    errors.push(`Entrance edge "${e.edge}" is not supported in this increment (west and east only).`);
    return errors;
  }
  if (!Number.isFinite(e.offset) || !Number.isFinite(e.width) || e.width <= 0) {
    errors.push("Entrance needs a positive gate width and a numeric position.");
    return errors;
  }
  const { lo, hi } = entranceSpan(site);
  if (lo < -TOL || hi > site.h + TOL) {
    errors.push("Entrance gate must sit on its site edge, clear of the corners.");
  }
  if (site.boundary && errors.length === 0) {
    const x = e.edge === "east" ? site.w : 0;
    const spans = siteBoundary(site).flatMap((a, i, pts) => {
      const b = pts[(i + 1) % pts.length];
      return Math.abs(a.x - x) <= TOL && Math.abs(b.x - x) <= TOL
        ? [{ lo: Math.min(a.y, b.y), hi: Math.max(a.y, b.y) }] : [];
    }).sort((a, b) => a.lo - b.lo);
    let covered = lo;
    for (const span of spans) if (span.lo <= covered + TOL && span.hi >= covered) covered = span.hi;
    if (covered < hi - TOL) errors.push("Entrance needs a straight west/east boundary segment covering the full gate. Sloping edges are not supported by these road generators.");
  }
  return errors;
}

export const ROAD_W = 6;
const SETBACK = { front: 3, side: 2, rear: 3 };
export const HOUSE = { w: 10, h: 6 }; // 60 m2, rotatable

export function rectArea(r: Rect): number {
  return r.w * r.h;
}

// Placed home footprint for a generated rect lot: 10x6 centered when it fits
// side setbacks, else rotated, else none. The single placement rule shared by
// validation and the plan canvas; reshaped lots must keep this footprint.
export function placeFootprint(p: Rect): Rect | null {
  const fw = p.w - 2 * SETBACK.side;
  const fd = p.h - SETBACK.front - SETBACK.rear;
  let hw = HOUSE.w;
  let hd = HOUSE.h;
  if (!(hw <= fw + TOL && hd <= fd + TOL)) {
    hw = HOUSE.h;
    hd = HOUSE.w;
    if (!(hw <= fw + TOL && hd <= fd + TOL)) return null;
  }
  return { x: p.x + (p.w - hw) / 2, y: p.y + (p.h - hd) / 2, w: hw, h: hd };
}

// Driveway frontage basis for a reshaped lot: boundary length shared with roads.
export function lotRoadFrontage(roads: Rect[], pts: Pt[]): number {
  return roads.reduce((s, r) => s + sharedBoundaryLength(pts, r), 0);
}

// A manual lot reshape is valid when it stays a simple polygon inside the
// site, keeps its placed home footprint, keeps road access, and overlaps
// nothing. Staged rule: homes never auto-relocate, so an edit that would
// swallow the placed footprint is rejected with its reason, never adjusted.
export function validateLotPoly(
  site: Site,
  layout: Layout,
  index: number,
  pts: Pt[],
  skip?: Set<number>,
): string[] {
  const errors: string[] = [];
  if (!Number.isInteger(index) || index < 0 || index >= layout.parcels.length) {
    return [`lot edit ${index} addresses no parcel in this layout`];
  }
  if (pts.length < 3) return ["a lot needs at least 3 corners"];
  if (!allFinite(pts)) return ["lot corners must be finite numbers"];
  if (pts.length > MAX_LOT_VERTICES) {
    return [`a lot holds at most ${MAX_LOT_VERTICES} corners in this increment (has ${pts.length})`];
  }
  if (!isSimple(pts)) return ["lot edges cross or repeat — keep a simple outline"];
  if (!polyInsidePoly(pts, siteBoundary(site))) return ["lot must sit inside the site"];
  if (polyArea(pts) < HOUSE.w * HOUSE.h - AREA_TOL) {
    return ["lot is smaller than one home footprint (60 m²)"];
  }
  const orig = layout.parcels[index];
  const fp = placeFootprint(orig);
  if (!fp) return ["this lot has no placed home to keep — reshaping is unsupported here"];
  if (!rectInsidePoly(fp, pts)) return ["reshape would swallow the placed home — homes never move in this increment"];
  // Declared side setback (2 m) enforced on the actual edited shape: the
  // placed home plus a uniform 2 m ring must sit inside the polygon. The
  // deeper 3 m front/rear setbacks are NOT verified for reshaped lots (the UI
  // labels them unverified) — 2 m is the minimum of every stated setback.
  const ring: Rect = { x: fp.x - 2, y: fp.y - 2, w: fp.w + 4, h: fp.h + 4 };
  if (!rectInsidePoly(ring, pts)) {
    return ["reshape leaves less than the 2 m side setback around the placed home"];
  }
  if (lotRoadFrontage(layout.roads, pts) <= TOL) return ["reshaped lot loses road access"];
  for (const road of layout.roads) {
    if (polyOverlapsRect(pts, road)) return ["reshaped lot overlaps a road"];
  }
  if (polyOverlapsRect(pts, layout.green)) return ["reshaped lot overlaps the open space"];
  for (let j = 0; j < layout.parcels.length; j++) {
    if (j === index || skip?.has(j)) continue;
    const clash = layout.parcels[j];
    if (polyOverlapsRect(pts, clash)) return [`reshaped lot overlaps lot ${j + 1}`];
  }
  return errors;
}

// NOTE: when two reshaped lots sit side by side, each validates against the
// other's CURRENT shape only if both edits are present together. Validate all
// edits jointly (see validateLayout): pairwise poly-vs-poly.
function validateLotPolyJoint(
  site: Site,
  layout: Layout,
  index: number,
  pts: Pt[],
  lotEdits: LotEdits,
): string[] {
  const skip = new Set<number>();
  for (const j of lotEdits.keys()) {
    if (j !== index && j >= 0 && j < layout.parcels.length) skip.add(j);
  }
  const solo = validateLotPoly(site, layout, index, pts, skip);
  if (solo.length > 0) return solo;
  for (const j of skip) {
    const other = lotEdits.get(j) as Pt[];
    if (polysOverlap(pts, other)) return [`reshaped lot overlaps reshaped lot ${j + 1}`];
  }
  return [];
}

function intersect(a: Rect, b: Rect): Rect | null {
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.w, b.x + b.w);
  const y2 = Math.min(a.y + a.h, b.y + b.h);
  if (x2 - x <= TOL || y2 - y <= TOL) return null;
  return { x, y, w: x2 - x, h: y2 - y };
}

function touchesOrOverlaps(a: Rect, b: Rect): boolean {
  return (
    a.x <= b.x + b.w + TOL &&
    b.x <= a.x + a.w + TOL &&
    a.y <= b.y + b.h + TOL &&
    b.y <= a.y + a.h + TOL
  );
}

// Exact union area of axis-aligned rects via coordinate subdivision.
export function unionArea(rects: Rect[]): number {
  if (rects.length === 0) return 0;
  const xs = [...new Set(rects.flatMap((r) => [r.x, r.x + r.w]))].sort((a, b) => a - b);
  const ys = [...new Set(rects.flatMap((r) => [r.y, r.y + r.h]))].sort((a, b) => a - b);
  let area = 0;
  for (let i = 0; i < xs.length - 1; i++) {
    for (let j = 0; j < ys.length - 1; j++) {
      const cx = (xs[i] + xs[i + 1]) / 2;
      const cy = (ys[j] + ys[j + 1]) / 2;
      if (rects.some((r) => cx > r.x && cx < r.x + r.w && cy > r.y && cy < r.y + r.h)) {
        area += (xs[i + 1] - xs[i]) * (ys[j + 1] - ys[j]);
      }
    }
  }
  return area;
}

function insideSite(r: Rect, site: Site): boolean {
  return rectInsidePoly(r, siteBoundary(site));
}

// Subdivide band row into lots of fixed frontage; drop lots touching green.
function subdivide(band: Rect, frontage: number, green: Rect, lots: Rect[]): void {
  const n = Math.floor(band.w / frontage + TOL);
  for (let i = 0; i < n; i++) {
    const lot = { x: band.x + i * frontage, y: band.y, w: frontage, h: band.h };
    if (intersect(lot, green) !== null) continue;
    lots.push(lot);
  }
}

function unavailableLayout(family: Layout["family"], reason: string): Layout {
  return { family, roads: [], parcels: [], green: { x: 0, y: 0, w: 0, h: 0 }, supportError: reason, unallocatedNote: "Layout unavailable; all site area remains unallocated." };
}

// Spine: one east-west road at entrance height to the east boundary;
// 20 m lot rows front it north and south.
export function generateSpine(site: Site, frontage = 10): Layout {
  if (!Number.isFinite(frontage) || frontage < 1 || frontage > 500) return unavailableLayout("spine", "Lot frontage must be between 1 and 500 m.");
  const roadY = site.entrance.offset - ROAD_W / 2;
  const road: Rect = { x: 0, y: roadY, w: site.w, h: ROAD_W };
  const parcels: Rect[] = [];
  subdivide({ x: 0, y: roadY - 20, w: site.w, h: 20 }, frontage, site.green, parcels);
  subdivide({ x: 0, y: roadY + ROAD_W, w: site.w, h: 20 }, frontage, site.green, parcels);
  return fitToBoundary(site, {
    family: "spine",
    roads: [road],
    parcels,
    green: { ...site.green },
    unallocatedNote: "Land outside the two 20 m frontage rows is explicit future-phase remainder, not modeled parcels.",
  });
}

// Loop: ring road scaled to the site + entrance connector at entrance
// height; interior lots front the ring.
export function generateLoop(site: Site, rowFrontage = 11): Layout {
  if (!Number.isFinite(rowFrontage) || rowFrontage < 1 || rowFrontage > 500) return unavailableLayout("loop", "Lot frontage must be between 1 and 500 m.");
  const roadY = site.entrance.offset - ROAD_W / 2;
  const connX = site.entrance.edge === "east" ? site.w - 16 : 0;
  const roads: Rect[] = [
    { x: 10, y: 10, w: site.w - 20, h: ROAD_W }, // north arm
    { x: 10, y: site.h - 16, w: site.w - 20, h: ROAD_W }, // south arm
    { x: 10, y: 10, w: ROAD_W, h: site.h - 20 }, // west arm
    { x: site.w - 16, y: 10, w: ROAD_W, h: site.h - 20 }, // east arm
    { x: connX, y: roadY, w: 16, h: ROAD_W }, // entrance connector
  ];
  const parcels: Rect[] = [];
  subdivide({ x: 16, y: site.h - 36, w: site.w - 32, h: 20 }, rowFrontage, site.green, parcels); // top row
  subdivide({ x: 16, y: 16, w: site.w - 32, h: 20 }, rowFrontage, site.green, parcels); // bottom row
  for (const colX of [16, site.w - 36]) {
    for (const rowY of [36, 50]) {
      const lot = { x: colX, y: rowY, w: 20, h: 14 };
      if (intersect(lot, site.green) !== null) continue;
      parcels.push(lot);
    }
  }
  return fitToBoundary(site, {
    family: "loop",
    roads,
    parcels,
    green: { ...site.green },
    unallocatedNote: "Outer strips and the road-enclosed middle block without frontage stay explicit remainder.",
  });
}

// shortcut: roads remain axis aligned; add polygon road routing before serving
// shapes where the complete generated network or reserved green cannot fit.
function fitToBoundary(site: Site, layout: Layout): Layout {
  if (!site.boundary) return layout;
  const error = siteFrameErrors(site)[0] ?? entranceErrors(site)[0]
    ?? ([...layout.roads, layout.green].some((r) => !Number.isFinite(r.w + r.h + r.x + r.y) || r.w <= 0 || r.h <= 0) ? "This boundary is too small for the generated roads and open space." : undefined)
    ?? (layout.roads.some((r) => !insideSite(r, site)) ? "The generated road network leaves this boundary. Try another circulation family or reshape the boundary; sloping road routing is not available." : undefined)
    ?? (!insideSite(layout.green, site) ? "Open space A leaves this boundary. Move or resize the open space to enable layout generation." : undefined);
  if (error) return unavailableLayout(layout.family, error);
  return { ...layout, parcels: layout.parcels.filter((p) => insideSite(p, site)) };
}

export function deriveQuantities(site: Site, layout: Layout, lotEdits: LotEdits = new Map()): Quantities {
  const roadArea = unionArea(layout.roads);
  const greenArea = rectArea(layout.green);
  // Reshaped lots contribute true polygon area; reconciliation still holds
  // because the remainder absorbs the difference explicitly.
  const parcelArea = layout.parcels.reduce(
    (s, p, i) => s + (lotEdits.has(i) ? polyArea(lotEdits.get(i) as Pt[]) : rectArea(p)),
    0,
  );
  return {
    n: layout.parcels.length,
    roadArea,
    greenArea,
    parcelArea,
    unallocatedArea: siteArea(site) - parcelArea - roadArea - greenArea,
  };
}

// Validators return error strings; empty means valid. Generated rect checks
// always run on the original parcels (they were valid at generation and stay
// so); reshaped lots add joint polygon checks on top, never instead.
export function validateLayout(site: Site, layout: Layout, lotEdits: LotEdits = new Map()): string[] {
  const errors: string[] = [...siteFrameErrors(site), ...entranceErrors(site)];
  if (layout.supportError) return [...errors, layout.supportError];
  for (const [i, pts] of lotEdits) {
    errors.push(...validateLotPolyJoint(site, layout, i, pts, lotEdits));
  }
  const all: Rect[] = [...layout.roads, ...layout.parcels, layout.green];
  for (const r of all) {
    if (r.w <= 0 || r.h <= 0) errors.push(`non-positive rect ${JSON.stringify(r)}`);
    if (!insideSite(r, site)) errors.push(`outside site ${JSON.stringify(r)}`);
  }
  for (let i = 0; i < layout.parcels.length; i++) {
    for (let j = i + 1; j < layout.parcels.length; j++) {
      if (intersect(layout.parcels[i], layout.parcels[j])) errors.push(`parcels overlap ${i}/${j}`);
    }
    for (const road of layout.roads) {
      if (intersect(layout.parcels[i], road)) errors.push(`parcel ${i} overlaps road`);
    }
    if (intersect(layout.parcels[i], layout.green)) errors.push(`parcel ${i} overlaps green`);
  }
  // Footprints fit with setbacks (house rotatable).
  for (let i = 0; i < layout.parcels.length; i++) {
    const p = layout.parcels[i];
    const fw = p.w - 2 * SETBACK.side;
    const fd = p.h - SETBACK.front - SETBACK.rear;
    const fits =
      (HOUSE.w <= fw + TOL && HOUSE.h <= fd + TOL) ||
      (HOUSE.h <= fw + TOL && HOUSE.w <= fd + TOL);
    if (!fits) errors.push(`footprint misses parcel ${i}`);
  }
  // Access: each parcel edge-adjacent to a road; road graph connected to entrance.
  for (let i = 0; i < layout.parcels.length; i++) {
    const p = layout.parcels[i];
    const adj = layout.roads.some((r) => {
      const overX = Math.min(p.x + p.w, r.x + r.w) - Math.max(p.x, r.x);
      const overY = Math.min(p.y + p.h, r.y + r.h) - Math.max(p.y, r.y);
      const edgeX = Math.abs(p.x + p.w - r.x) <= TOL || Math.abs(r.x + r.w - p.x) <= TOL;
      const edgeY = Math.abs(p.y + p.h - r.y) <= TOL || Math.abs(r.y + r.h - p.y) <= TOL;
      return (edgeX && overY > TOL) || (edgeY && overX > TOL);
    });
    if (!adj) errors.push(`parcel ${i} has no road access`);
  }
  const span = entranceSpan(site);
  const entryIdx = layout.roads.findIndex((r) => {
    const onEdge =
      site.entrance.edge === "east" ? r.x + r.w >= site.w - TOL && r.x < site.w : r.x <= TOL && r.x + r.w > TOL;
    return onEdge && r.y < span.hi && r.y + r.h > span.lo;
  });
  if (entryIdx < 0) {
    errors.push("no road reaches entrance");
  } else {
    const seen = new Set<number>([entryIdx]);
    const queue = [entryIdx];
    while (queue.length > 0) {
      const cur = queue.pop() as number;
      layout.roads.forEach((r, i) => {
        if (!seen.has(i) && touchesOrOverlaps(layout.roads[cur], r)) {
          seen.add(i);
          queue.push(i);
        }
      });
    }
    if (seen.size !== layout.roads.length) errors.push("road network disconnected");
  }
  // Area reconciliation.
  const q = deriveQuantities(site, layout, lotEdits);
  const recon = q.parcelArea + q.roadArea + q.greenArea + q.unallocatedArea;
  if (Math.abs(recon - siteArea(site)) > AREA_TOL) errors.push(`area mismatch ${recon}`);
  if (q.unallocatedArea < -AREA_TOL) errors.push("negative remainder");
  return errors;
}

// Green lock: shape AND location preserved within tolerance.
export function checkGreenLock(locked: Rect, candidate: Rect): string[] {
  const d = [
    Math.abs(locked.x - candidate.x),
    Math.abs(locked.y - candidate.y),
    Math.abs(locked.w - candidate.w),
    Math.abs(locked.h - candidate.h),
  ];
  return d.every((v) => v <= TOL) ? [] : ["locked green moved or reshaped"];
}
