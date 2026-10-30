import {siteOpenSpaces,spaceArea,spaceBounds,spaceSiteErrors,type OpenSpace} from './open-spaces.ts';
import {homeTemplate} from './housing.ts';
import { disconnectedStreets, nearestStreetPoint, onStreet, streetRect } from './streets.ts';
// UNBUILT geometry core. Local-metre site polygons with rectangular roads,
// parcels and park; exact union math and no rounded intermediates.
// Manually reshaped lots are simple polygons over generated rects (see
// polygon.ts); quantities, validation, and frontage use true polygon math.
import { hasLayout, hasHome } from './contents.ts';
import type { PlanContents } from './contents.ts';
import type { CostAssumptions } from './costs.ts';
import { accessConnector, gateSegment } from './access.ts';
import { siteArea, siteBoundary, siteFrameErrors } from "./boundary.ts";
import { homeArea, type PlanningParameters } from "./planning.ts";
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
  edge: EntranceEdge; // legacy cardinal edge, retained for saved rectangles
  boundaryEdge?: number; // polygon edge index; offset is measured from its first vertex
  offset: number; // gate center along the edge, meters from the south corner
  width: number; // gate width along the edge, meters
}

export interface Site {
  costAssumptions?: CostAssumptions;
  w: number;
  h: number;
  contents?: PlanContents;
  planning?: PlanningParameters;
  boundary?: Pt[]; // absent on legacy rectangular projects
  entrance: Entrance;
  green: Rect; // reserved green region (locked shape+location candidate)
}

export interface Layout {
  family: "spine" | "loop";
  roads: Rect[];
  parcels: Rect[];
  green: Rect;
  openSpaces?:OpenSpace[];
  unallocatedNote: string;
  empty?: boolean;
  supportError?: string;
  accessConnector?: Pt[]; // measured entrance apron, disjoint from orthogonal roads
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
  if (!hasLayout(site)) return [];
  const errors: string[] = [];
  const e = site.entrance;
  if (e.boundaryEdge !== undefined && (!site.planning || !Number.isInteger(e.boundaryEdge) || e.boundaryEdge < 0 || e.boundaryEdge >= siteBoundary(site).length)) return ["Choose a boundary edge on a live-planning site."];
  if (e.edge !== "west" && e.edge !== "east") {
    errors.push(`Entrance edge "${e.edge}" is not supported in this increment (west and east only).`);
    return errors;
  }
  if (!Number.isFinite(e.offset) || !Number.isFinite(e.width) || e.width <= 0) {
    errors.push("Entrance needs a positive gate width and a numeric position.");
    return errors;
  }
  const { lo, hi } = entranceSpan(site);
  if (lo < -TOL || hi > (gateSegment(site)?.length ?? 0) + TOL) {
    errors.push("Entrance gate must sit on its site edge, clear of the corners.");
  }
  if (site.boundary && e.boundaryEdge === undefined && errors.length === 0) {
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
export function placeFootprint(p: Rect, planning?: PlanningParameters, roads?: Rect[]): Rect | null {
  const template=homeTemplate(planning,p);
  const house = {w:template.width,h:template.depth};
  const vertical = !!planning && !!roads?.some((r) =>
    (Math.abs(p.x + p.w - r.x) <= TOL || Math.abs(r.x + r.w - p.x) <= TOL)
    && Math.min(p.y + p.h, r.y + r.h) - Math.max(p.y, r.y) > TOL);
  const horizontal = !!roads?.some((r) =>
    (Math.abs(p.y + p.h - r.y) <= TOL || Math.abs(r.y + r.h - p.y) <= TOL)
    && Math.min(p.x + p.w, r.x + r.w) - Math.max(p.x, r.x) > TOL);
  const fw = p.w - (vertical ? SETBACK.front + SETBACK.rear : 2 * SETBACK.side);
  const fd = p.h - (vertical && !horizontal ? 2 * SETBACK.side : SETBACK.front + SETBACK.rear);
  let hw = house.w;
  let hd = house.h;
  if (!(hw <= fw + TOL && hd <= fd + TOL)) {
    hw = house.h;
    hd = house.w;
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
  if (polyArea(pts) < (hasHome(site, layout.parcels[index]) ? homeArea(site.planning,layout.parcels[index]) : 1) - AREA_TOL) {
    return [hasHome(site, layout.parcels[index]) ? `lot is smaller than one home footprint (${homeArea(site.planning,layout.parcels[index])} m²)` : "vacant lot must enclose at least 1 m²"];
  }
  if (hasHome(site, layout.parcels[index])) {
    const orig = layout.parcels[index];
    const fp = placeFootprint(orig, site.planning, layout.roads);
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
  }
  if (lotRoadFrontage(layout.roads, pts) <= TOL) return ["reshaped lot loses road access"];
  if (layout.accessConnector && polysOverlap(pts, layout.accessConnector)) return ["reshaped lot overlaps the entrance apron"];
  for (const road of layout.roads) {
    if (polyOverlapsRect(pts, road)) return ["reshaped lot overlaps a road"];
  }
  if (layoutOpenSpaces(layout).some(p=>polysOverlap(pts,p.pts))) return ["reshaped lot overlaps the open space"];
  if (site.planning && openSpaceObstacles(site).some(o=>polyOverlapsRect(pts,o))) return ["reshaped lot enters the park clearance"];
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
    if (green.w>0&&green.h>0&&intersect(lot, green) !== null) continue;
    lots.push(lot);
  }
}

function emptyLayout(site: Site, family: Layout['family']): Layout {
  const error = siteFrameErrors(site)[0];
  return { family, roads: [], parcels: [], green: { x: 0, y: 0, w: 0, h: 0 }, empty: true,
    ...(error ? { supportError: error } : {}), unallocatedNote: 'No generated layout. Draw a boundary, then explicitly generate a layout.' };
}

function unavailableLayout(family: Layout["family"], reason: string): Layout {
  return { family, roads: [], parcels: [], green: { x: 0, y: 0, w: 0, h: 0 }, supportError: reason, unallocatedNote: "Layout unavailable; all site area remains unallocated." };
}

export function openSpaceObstacles(site:Site):Rect[]{return siteOpenSpaces(site).map(p=>spaceBounds(p.pts,site.planning?.greenBuffer??0));}
export function layoutOpenSpaces(layout:Layout):OpenSpace[]{return layout.empty||layout.supportError?[]:layout.openSpaces??(layout.green.w>0&&layout.green.h>0?[{id:'g1',name:'Open space A',kind:'park',pts:[{x:layout.green.x,y:layout.green.y},{x:layout.green.x+layout.green.w,y:layout.green.y},{x:layout.green.x+layout.green.w,y:layout.green.y+layout.green.h},{x:layout.green.x,y:layout.green.y+layout.green.h}],locked:false,minArea:0}]:[]);}
function greenGeometryErrors(site:Site):string[]{return spaceSiteErrors(siteOpenSpaces(site),siteBoundary(site));}
function greenTotal(site:Site):number{return spaceArea(siteOpenSpaces(site));}

// A bounded orthogonal visibility graph routes six-metre corridors around
// conservative open-space extents. Whole lots are retained; sloping streets are unmodeled.
function generateResponsiveSpine(site: Site, frontage: number): Layout {
  const error = siteFrameErrors(site)[0] ?? entranceErrors(site)[0];
  if (error) return unavailableLayout("spine", error);
  if(greenGeometryErrors(site).length)return unavailableLayout("spine",greenGeometryErrors(site)[0]);
  if (site.entrance.width < ROAD_W) return unavailableLayout("spine", "The entrance must be at least 6 m wide for the modeled street.");
  const p = site.planning!;
  const obstacles = openSpaceObstacles(site);
  const west = site.entrance.edge === "west";
  const access = site.entrance.boundaryEdge === undefined ? null : accessConnector(site, obstacles);
  if (site.entrance.boundaryEdge !== undefined && !access) return unavailableLayout("spine", "No contained entrance apron fits this edge and position. Move the gate farther from the corner, choose another edge, or move the park.");
  const entry = access?.entry ?? { x: west ? 0 : site.w, y: site.entrance.offset };
  const ys = [...new Set([entry.y, ...obstacles.flatMap(o=>[o.y-3,o.y+o.h+3]), 3, site.h - 3, ...p.streets])].filter((y) => y >= 3 && y <= site.h - 3);
  const xs = [entry.x, 0, site.w, ...obstacles.flatMap(o=>[o.x-3,o.x+o.w+3]), Math.min(site.w - 3, frontage + 3), Math.max(3, site.w - frontage - 3)];
  // Find corridor ends against the actual polygon, never its bounding box.
  for (const y of ys) {
    for (let d = 0; d <= site.w - 6; d++) {
      const x = west ? site.w - d : d;
      const cap = { x: west ? x - 6 : x, y: y - 3, w: 6, h: 6 };
      if (insideSite(cap, site) && !obstacles.some(o=>intersect(cap,o))) { xs.push(x); break; }
    }
  }
  const xx = [...new Set(xs)].filter((x) => x >= 0 && x <= site.w).sort((a, b) => a - b);
  const yy = ys.sort((a, b) => a - b);
  const nodes = xx.flatMap((x) => yy.map((y) => ({ x, y })));
  const start = nodes.findIndex((n) => n.x === entry.x && n.y === entry.y);
  if (start < 0) return unavailableLayout("spine", "The entrance needs room for a 6 m road corridor.");
  const corridor = (a: Pt, b: Pt): Rect => a.y === b.y
    ? { x: Math.min(a.x, b.x), y: a.y - 3, w: Math.abs(a.x - b.x), h: 6 }
    : { x: a.x - 3, y: Math.min(a.y, b.y), w: 6, h: Math.abs(a.y - b.y) };
  const neighbors = nodes.map((a, i) => nodes.flatMap((b, j) => {
    if (i === j || (a.x !== b.x && a.y !== b.y)) return [];
    const r = corridor(a, b);
    return insideSite(r, site) && !obstacles.some(o=>intersect(r,o)) && (!access || !polyOverlapsRect(access.polygon, r)) ? [{ j, length: r.w + r.h - 6 }] : [];
  }));
  const distances = nodes.map(() => Infinity);
  const previous = nodes.map(() => -1);
  distances[start] = 0;
  const pending = new Set(nodes.map((_, i) => i));
  while (pending.size) {
    let next = -1;
    for (const i of pending) if (next === -1 || distances[i] < distances[next]) next = i;
    if (!Number.isFinite(distances[next])) break;
    pending.delete(next);
    for (const { j, length } of neighbors[next]) if (distances[next] + length < distances[j]) {
      distances[j] = distances[next] + length; previous[j] = next;
    }
  }
  const roads: Rect[] = [];
  const addPath = (target: number) => {
    let i = target;
    while (previous[i] !== -1) {
      const r = corridor(nodes[i], nodes[previous[i]]);
      if (!roads.some((road) => lotKey(road) === lotKey(r))) roads.push(r);
      i = previous[i];
    }
  };
  const rank = (i: number) => access?.axis === "y" ? Math.abs(nodes[i].y - entry.y) : Math.abs(nodes[i].x - entry.x);
  const reachable = nodes.map((_, i) => i).filter((i) => Number.isFinite(distances[i]) && rank(i) >= 6);
  reachable.sort((a, b) => rank(b) - rank(a) || distances[a] - distances[b]);
  if (!reachable.length) return unavailableLayout("spine", "No connected 6 m street fits between the entrance, park buffer and boundary. Move the park or entrance.");
  addPath(reachable[0]);
  for (const y of p.streets) {
    const row = reachable.filter((i) => nodes[i].y === y).sort((a, b) => rank(b) - rank(a) || distances[a] - distances[b]);
    if (!row.length) return unavailableLayout("spine", `No connected cross street fits at ${y} m. Move or remove that street.`);
    addPath(row[0]);
  }
  const parcels = parcelsAlongRoads(site, roads, frontage, access?.polygon);
  return { family: "spine", roads, parcels, green: { ...site.green }, ...(access ? { accessConnector: access.polygon } : {}),
    unallocatedNote: "Park-aware orthogonal streets; only complete, accessible lots with fitting homes are modeled. Buffer strips and remaining land are unallocated. Turning geometry is unmodeled." };
}

function parcelsAlongRoads(site: Site, roads: Rect[], frontage: number, access?: Pt[], horizontal?: boolean[]): Rect[] {
  const p = site.planning!;
  const obstacles = openSpaceObstacles(site);
  const parcels: Rect[] = [];
  const addLot = (lot: Rect) => {
    if (insideSite(lot, site) && (p.housing || placeFootprint(lot, p, roads)) && !obstacles.some(o=>intersect(lot,o))
      && (!access || !polyOverlapsRect(access, lot))
      && !roads.some((r) => intersect(lot, r)) && !parcels.some((r) => intersect(lot, r))) parcels.push(lot);
  };
  for (const r of roads) {
    if (horizontal?.[roads.indexOf(r)] ?? r.h === 6) {
      for (let x = r.x; x + frontage <= r.x + r.w + TOL; x += frontage) {
        addLot({ x, y: r.y - p.lotDepth, w: frontage, h: p.lotDepth });
        addLot({ x, y: r.y + r.h, w: frontage, h: p.lotDepth });
      }
    } else {
      for (let y = r.y; y + frontage <= r.y + r.h + TOL; y += frontage) {
        addLot({ x: r.x - p.lotDepth, y, w: p.lotDepth, h: frontage });
        addLot({ x: r.x + r.w, y, w: p.lotDepth, h: frontage });
      }
    }
  }
  return parcels;
}

export function streetEntrance(site: Site): { point: Pt; apron?: Pt[] } | null {
  if (site.entrance.boundaryEdge !== undefined) {
    const access = accessConnector(site, openSpaceObstacles(site));
    return access ? { point: access.entry, apron: access.polygon } : null;
  }
  return { point: { x: site.entrance.edge === 'east' ? site.w : 0, y: site.entrance.offset } };
}

export interface StreetConflict {
  kind: 'entrance' | 'disconnected' | 'boundary' | 'park' | 'apron' | 'lot';
  segmentIds: string[];
  message: string;
  gap?: {from:Pt;to:Pt;distance:number};
  region?: Rect;
}
// The editor highlights the same first blocker that prevents generation.
export function streetConflict(site: Site): StreetConflict | null {
  const network=site.planning?.streetNetwork;
  if (!network || siteFrameErrors(site).length || entranceErrors(site).length) return null;
  const entry=streetEntrance(site),all=network.segments.map(s=>s.id);
  if (!entry) return {kind:'entrance',segmentIds:all,message:'No contained entrance apron fits. Review the entrance position and park.'};
  const nearest=nearestStreetPoint(network,entry.point);
  if (!network.segments.some(s=>onStreet(entry.point,s))) return {kind:'entrance',segmentIds:all,message:'No street reaches the entrance connection. Use Start at entrance or Connect entrance, then review the connector.',...(nearest?{gap:{from:entry.point,to:nearest.point,distance:nearest.distance}}:{})};
  if (site.entrance.width<6 || (!entry.apron && network.segments.some(s=>onStreet(entry.point,s)&&s.width>site.entrance.width))) return {kind:'entrance',segmentIds:network.segments.filter(s=>onStreet(entry.point,s)).map(s=>s.id),message:'The entrance gate is narrower than its connecting street. Widen the gate or narrow that street.'};
  const disconnected=disconnectedStreets(network,entry.point);
  if (disconnected.length) {
    const connected={segments:network.segments.filter((_,i)=>!disconnected.includes(i))};
    let gap:StreetConflict['gap'];
    for (const i of disconnected) for (const from of [network.segments[i].a,network.segments[i].b]) {
      const hit=nearestStreetPoint(connected,from);
      if (hit && (!gap || hit.distance<gap.distance)) gap={from,to:hit.point,distance:hit.distance};
    }
    return {kind:'disconnected',segmentIds:disconnected.map(i=>network.segments[i].id),gap,message:`Street ${disconnected[0]+1} is disconnected from the entrance. Join its centreline to the connected network or remove it.`};
  }
  for (const [i,s] of network.segments.entries()) {
    const rect=streetRect(s);
    if (!insideSite(rect,site)) return {kind:'boundary',segmentIds:[s.id],message:`Street ${i+1} leaves the site at its full width. Move its ends inward, narrow it or shorten it.`};
    const spaceHit=openSpaceObstacles(site).findIndex(o=>intersect(rect,o));
    if(spaceHit>=0)return {kind:'park',segmentIds:[s.id],region:openSpaceObstacles(site)[spaceHit],message:`Street ${i+1} enters ${siteOpenSpaces(site)[spaceHit].name} or its conservative clearance extent. Reroute the street; the open space is retained.`};
    if (entry.apron && polyOverlapsRect(entry.apron,rect)) return {kind:'apron',segmentIds:[s.id],message:`Street ${i+1} overlaps the entrance apron. Begin at the apron connection rather than the boundary gate.`};
    const lot=site.planning?.lotPlan?.findIndex(lot=>intersect(rect,lot));
    if(lot!==undefined&&lot>=0)return {kind:'lot',segmentIds:[s.id],region:site.planning!.lotPlan![lot],message:`Street ${i+1} enters held Lot ${lot+1}. Adjust the street or edit the manual lot plan; lots are not silently regenerated.`};
  }
  return null;
}

function generateManualStreets(site: Site, frontage: number): Layout {
  const error = siteFrameErrors(site)[0] ?? entranceErrors(site)[0];
  if (error) return unavailableLayout('spine', error);
  if(greenGeometryErrors(site).length)return unavailableLayout('spine',greenGeometryErrors(site)[0]);
  const conflict=streetConflict(site);
  if (conflict) return unavailableLayout('spine',conflict.message);
  const network=site.planning!.streetNetwork!,entry=streetEntrance(site)!;
  const roads=network.segments.map(streetRect);
  const parcels = parcelsAlongRoads(site, roads, frontage, entry.apron, network.segments.map(s=>Math.abs(s.a.y-s.b.y)<.001));
  return { family:'spine', roads, parcels, green:{...site.green}, ...(entry.apron ? {accessConnector:entry.apron} : {}), unallocatedNote:'Planner-drawn orthogonal streets. Junction surfaces are counted once; only contained whole lots with fitting homes are generated. Turning, traffic, pedestrian and external-access design are unverified.' };
}

// Spine: one east-west road at entrance height to the east boundary;
// 20 m lot rows front it north and south.
function generateSpineBase(site: Site, frontage = 10): Layout {
  if (!hasLayout(site)) return emptyLayout(site, "spine");
  if (!Number.isFinite(frontage) || frontage < 1 || frontage > 500) return unavailableLayout("spine", "Lot frontage must be between 1 and 500 m.");
  if (site.planning !== undefined) { const errors = siteFrameErrors(site); if (errors.length) return unavailableLayout("spine", errors[0]); }
  if (greenTotal(site) + AREA_TOL < (site.planning?.minGreenArea ?? 0)) return unavailableLayout("spine", `Open space must keep at least ${site.planning!.minGreenArea} m². Enlarge the park or explicitly change the minimum.`);
  if (site.entrance.boundaryEdge !== undefined && !site.planning) return unavailableLayout("spine", "Enable live planning to use a boundary-edge entrance.");
  if (site.planning?.streetNetwork) return generateManualStreets(site, frontage);
  if (site.planning !== undefined) return generateResponsiveSpine(site, frontage);
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
function generateLoopBase(site: Site, rowFrontage = 11): Layout {
  if (site.planning?.streetNetwork && hasLayout(site)) return unavailableLayout("loop", "Manual streets are held as the Spine network. Use generated routing before selecting a fixed Loop.");
  if (!hasLayout(site)) return emptyLayout(site, "loop");
  if (site.planning !== undefined) { const errors = siteFrameErrors(site); if (errors.length) return unavailableLayout("loop", errors[0]); }
  if (greenTotal(site) + AREA_TOL < (site.planning?.minGreenArea ?? 0)) return unavailableLayout("loop", `Open space must keep at least ${site.planning!.minGreenArea} m². Enlarge the park or explicitly change the minimum.`);
  if (site.entrance.boundaryEdge !== undefined) return unavailableLayout("loop", "Boundary-edge entrances use park-aware Spine routing. Choose Spine; the fixed Loop only connects legacy west/east gates.");
  if (site.planning?.streets.length) return unavailableLayout("loop", "Additional cross streets are supported by Spine. Remove them before using the fixed loop.");
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
  subdivide({ x: 16, y: site.h - 36, w: site.w - 32, h: 20 }, rowFrontage, site.planning?.openSpaces!==undefined?{x:0,y:0,w:0,h:0}:site.green, parcels); // top row
  subdivide({ x: 16, y: 16, w: site.w - 32, h: 20 }, rowFrontage, site.planning?.openSpaces!==undefined?{x:0,y:0,w:0,h:0}:site.green, parcels); // bottom row
  for (const colX of [16, site.w - 36]) {
    for (const rowY of [36, 50]) {
      const lot = { x: colX, y: rowY, w: 20, h: 14 };
      if (site.planning?.openSpaces===undefined&&intersect(lot, site.green) !== null) continue;
      parcels.push(lot);
    }
  }
  const reserved = openSpaceObstacles(site);
  const depth = site.planning?.lotDepth ?? 20;
  const adjusted = site.planning ? parcels.map((p) => p.h === 20 ? { ...p, h: depth, y: p.y > site.h / 2 ? p.y + 20 - depth : p.y } : p).filter((p) => !reserved.some(r=>intersect(p,r)) && (site.planning?.housing || placeFootprint(p, site.planning, roads))) : parcels;
  if (site.planning && roads.some((r) => reserved.some(o=>intersect(r,o)))) return unavailableLayout("loop", "The fixed loop crosses the park buffer. Use Spine for park-aware routing, or move the park.");
  return fitToBoundary(site, {
    family: "loop",
    roads,
    parcels: adjusted,
    green: { ...site.green },
    unallocatedNote: "Outer strips and the road-enclosed middle block without frontage stay explicit remainder.",
  });
}

export function generateSpine(site:Site,frontage=10):Layout{return withLotPlan(site,generateSpineBase(site,frontage));}
export function generateLoop(site:Site,frontage=11):Layout{return withLotPlan(site,generateLoopBase(site,frontage));}
function withLotPlan(site:Site,layout:Layout):Layout{
  if(site.planning?.openSpaces!==undefined&&!layout.empty&&!layout.supportError){
    const issue=greenGeometryErrors(site)[0];if(issue)return unavailableLayout(layout.family,issue);
    layout={...layout,openSpaces:structuredClone(site.planning.openSpaces),unallocatedNote:layout.unallocatedNote+' Open-space area uses true outlines; routing and whole-lot generation conservatively avoid each outline’s bounding extent plus clearance. Excess exclusion is unallocated, not park area.'};
  }
  if(site.planning?.lotPlan===undefined||layout.empty||layout.supportError)return layout;
  const manual={...layout,parcels:site.planning.lotPlan.map(r=>({...r})),unallocatedNote:'Manual lot plan held. One home per occupied lot; vacant lots contribute no home revenue or construction cost. Whole rectangular subdivisions retain the existing roads and park.'};
  const errors=validateLayout(site,manual);
  return errors.length?unavailableLayout(layout.family,`Manual lots held — ${errors[0].replace(/\.$/,'')}. Adjust blocks/lots or preview generated lots before changing the supporting layout.`):manual;
}

// shortcut: roads remain axis aligned; add polygon road routing before serving
// shapes where the complete generated network or reserved green cannot fit.
function fitToBoundary(site: Site, layout: Layout): Layout {
  if (!site.boundary && !site.planning) return layout;
  const error = siteFrameErrors(site)[0] ?? entranceErrors(site)[0]
    ?? ([...layout.roads,...(site.planning?.openSpaces===undefined?[layout.green]:[])].some((r) => !Number.isFinite(r.w + r.h + r.x + r.y) || r.w <= 0 || r.h <= 0) ? "This boundary is too small for the generated roads and open space." : undefined)
    ?? (layout.roads.some((r) => !insideSite(r, site)) ? "The generated road network leaves this boundary. Try another circulation family or reshape the boundary; sloping road routing is not available." : undefined)
    ?? greenGeometryErrors(site)[0];
  if (error) return unavailableLayout(layout.family, error);
  return { ...layout, parcels: layout.parcels.filter((p) => insideSite(p, site)) };
}

export function deriveQuantities(site: Site, layout: Layout, lotEdits: LotEdits = new Map()): Quantities {
  const roadArea = unionArea(layout.roads) + (layout.accessConnector ? polyArea(layout.accessConnector) : 0);
  const greenArea = spaceArea(layoutOpenSpaces(layout));
  // Reshaped lots contribute true polygon area; reconciliation still holds
  // because the remainder absorbs the difference explicitly.
  const parcelArea = layout.parcels.reduce(
    (s, p, i) => s + (lotEdits.has(i) ? polyArea(lotEdits.get(i) as Pt[]) : rectArea(p)),
    0,
  );
  return {
    n: layout.parcels.filter(p => hasHome(site, p)).length,
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
  const frameErrors=siteFrameErrors(site);if(frameErrors.length)return frameErrors;
  if (layout.empty) return [...frameErrors, ...(hasLayout(site) ? ["An active layout cannot be empty."] : []), ...(layout.roads.length || layout.parcels.length || layout.green.w || layout.green.h || layout.accessConnector ? ["An empty plan cannot carry generated geometry."] : [])];
  const errors: string[] = [...frameErrors, ...entranceErrors(site)];
  if (greenTotal(site) + AREA_TOL < (site.planning?.minGreenArea ?? 0)) errors.push(`Open space must keep at least ${site.planning!.minGreenArea} m². Enlarge the park or explicitly change the minimum.`);
  if (layout.supportError) return [...errors, layout.supportError];
  if(site.planning?.openSpaces!==undefined&&JSON.stringify(layout.openSpaces)!==JSON.stringify(site.planning.openSpaces))errors.push('Layout open-space outlines differ from the accepted site collection. Regenerate and review this layout.');
  const orphan=Object.keys(site.planning?.housing?.assignments??{}).filter(key=>!layout.parcels.some(r=>lotKey(r)===key));
  if(orphan.length)errors.push('Housing assignments refer to lots absent from this layout. Review or clear those assignments before regenerating lots.');
  for (const [i, pts] of lotEdits) {
    errors.push(...validateLotPolyJoint(site, layout, i, pts, lotEdits));
  }
  const all: Rect[] = [...layout.roads, ...layout.parcels,...(site.planning?.openSpaces===undefined?[layout.green]:[])];
  errors.push(...greenGeometryErrors(site));
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
    if (openSpaceObstacles(site).some(o=>intersect(layout.parcels[i],o))) errors.push(`Lot ${i+1} enters an open space or its conservative clearance extent.`);
  }
  if (site.planning && [...layout.roads, ...layout.parcels].some((r) => openSpaceObstacles(site).some(o=>intersect(r,o)))) errors.push("Geometry enters the reserved park buffer.");
  // Footprints fit with setbacks (house rotatable).
  for (let i = 0; i < layout.parcels.length; i++) {
    const p = layout.parcels[i];
    const fits = placeFootprint(p, site.planning, layout.roads) !== null;
    if (!fits && hasHome(site,p)) errors.push(site.planning?.lotPlan!==undefined?`Lot ${i+1} cannot fit the current home${site.planning?.housing?` (${homeTemplate(site.planning,p).name})`:""} with setbacks. Enlarge it, assign a fitting template, or explicitly create vacant lots.`:`footprint misses parcel ${i}`);
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
    if (!adj) errors.push(`Proposed Lot ${i+1} lacks frontage on a street. Move the cut so every lot touches a street, or keep this land within an accessible lot.`);
  }
  const span = entranceSpan(site);
  const connector = layout.accessConnector;
  if (site.entrance.boundaryEdge !== undefined && !connector) errors.push("boundary entrance needs a measured access connector");
  if (connector) {
    const expected = accessConnector(site, openSpaceObstacles(site));
    if (!expected || JSON.stringify(expected.polygon) !== JSON.stringify(connector)) errors.push("entrance apron does not match the gate");
    if (!isSimple(connector) || !polyInsidePoly(connector, siteBoundary(site))) errors.push("entrance apron leaves the site");
    if ([...layout.roads, ...layout.parcels, ...openSpaceObstacles(site)].some(r => polyOverlapsRect(connector, r))) errors.push("entrance apron overlaps another allocation");
  }
  const entryIdx = layout.roads.findIndex((r) => {
    if (connector) return sharedBoundaryLength(connector, r) >= ROAD_W - TOL;
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

export function homeRestorationConflicts(site:Site,layout:Layout,edits:LotEdits=new Map()):{index:number;message:string}[]{
  const restored={...site,contents:{boundary:true,layout:true,removedHomes:[]}};
  return layout.parcels.flatMap((lot,index)=>{
    if(hasHome(site,lot))return [];
    const t=homeTemplate(site.planning,lot);
    const reason=!placeFootprint(lot,site.planning,layout.roads)?'does not fit this lot with the current setbacks':edits.has(index)?validateLotPolyJoint(restored,layout,index,edits.get(index)!,edits).join('; '):'';
    return reason?[{index,message:`Lot ${index+1}: reserved ${t.name} (${t.width} × ${t.depth} m) ${reason}. The lot remains vacant.`}]:[];
  });
}
