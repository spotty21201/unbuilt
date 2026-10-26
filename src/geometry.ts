// UNBUILT geometry core (M1, Coder-owned). Flat rectangular site, axis-aligned
// roads/parcels/green, meters. Exact rect-union math; no rounded intermediates.
import type { Rect } from "./schema.ts";

export interface Site {
  w: number;
  h: number;
  entrance: Rect; // gate segment on west boundary (x = 0)
  green: Rect; // reserved green region (locked shape+location candidate)
}

export interface Layout {
  family: "spine" | "loop";
  roads: Rect[];
  parcels: Rect[];
  green: Rect;
  unallocatedNote: string;
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
    entrance: { x: 0, y: 46, w: 0, h: 8 },
    green: { x: 78, y: 62, w: 24, h: 20 },
  };
}

export const ROAD_W = 6;
const SETBACK = { front: 3, side: 2, rear: 3 };
export const HOUSE = { w: 10, h: 6 }; // 60 m2, rotatable

export function rectArea(r: Rect): number {
  return r.w * r.h;
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
  return r.x >= -TOL && r.y >= -TOL && r.x + r.w <= site.w + TOL && r.y + r.h <= site.h + TOL;
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

// Spine: one east-west road entrance to east boundary; lots front it north/south.
export function generateSpine(site: Site): Layout {
  const road: Rect = { x: 0, y: 47, w: site.w, h: ROAD_W };
  const parcels: Rect[] = [];
  subdivide({ x: 0, y: 27, w: site.w, h: 20 }, 10, site.green, parcels);
  subdivide({ x: 0, y: 53, w: site.w, h: 20 }, 10, site.green, parcels);
  return {
    family: "spine",
    roads: [road],
    parcels,
    green: { ...site.green },
    unallocatedNote: "Land outside the two 20 m frontage rows is explicit future-phase remainder, not modeled parcels.",
  };
}

// Loop: ring road + entrance connector; interior lots front the ring.
export function generateLoop(site: Site): Layout {
  const roads: Rect[] = [
    { x: 10, y: 10, w: 100, h: ROAD_W }, // north arm
    { x: 10, y: 84, w: 100, h: ROAD_W }, // south arm
    { x: 10, y: 10, w: ROAD_W, h: 80 }, // west arm
    { x: 104, y: 10, w: ROAD_W, h: 80 }, // east arm
    { x: 0, y: 47, w: 16, h: ROAD_W }, // entrance connector
  ];
  const parcels: Rect[] = [];
  subdivide({ x: 16, y: 64, w: 88, h: 20 }, 11, site.green, parcels); // top row
  subdivide({ x: 16, y: 16, w: 88, h: 20 }, 11, site.green, parcels); // bottom row
  for (const colX of [16, 84]) {
    for (const rowY of [36, 50]) {
      const lot = { x: colX, y: rowY, w: 20, h: 14 };
      if (intersect(lot, site.green) !== null) continue;
      parcels.push(lot);
    }
  }
  return {
    family: "loop",
    roads,
    parcels,
    green: { ...site.green },
    unallocatedNote: "Outer strips and the road-enclosed middle block without frontage stay explicit remainder.",
  };
}

export function deriveQuantities(site: Site, layout: Layout): Quantities {
  const roadArea = unionArea(layout.roads);
  const greenArea = rectArea(layout.green);
  const parcelArea = layout.parcels.reduce((s, p) => s + rectArea(p), 0);
  return {
    n: layout.parcels.length,
    roadArea,
    greenArea,
    parcelArea,
    unallocatedArea: site.w * site.h - parcelArea - roadArea - greenArea,
  };
}

// Validators return error strings; empty means valid.
export function validateLayout(site: Site, layout: Layout): string[] {
  const errors: string[] = [];
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
  const entryIdx = layout.roads.findIndex(
    (r) => r.x <= TOL && r.x + r.w > TOL && r.y < site.entrance.y + site.entrance.h && r.y + r.h > site.entrance.y,
  );
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
  const q = deriveQuantities(site, layout);
  const recon = q.parcelArea + q.roadArea + q.greenArea + q.unallocatedArea;
  if (Math.abs(recon - site.w * site.h) > AREA_TOL) errors.push(`area mismatch ${recon}`);
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
