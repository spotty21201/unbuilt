// UNBUILT open-space access (Coder-owned). Deterministic lot-to-green
// measures from actual geometry: the shortest lot-edge to open-space-edge
// distance per lot, walk-distance buckets, and direct-adjacency counts.
// Distances are straight-line edge approximations on the plan, labelled as
// such — they are not walking-route lengths and say nothing about amenity
// quality.
import type { Rect } from "./schema.ts";
import type { Pt } from "./polygon.ts";
import { pointInPoly, rectCorners } from "./polygon.ts";

export const WALK_THRESHOLDS = [150, 300, 400];
export const ADJACENT_M = 2;

function segSegDist(a: Pt, b: Pt, c: Pt, d: Pt): number {
  const ptSeg = (p: Pt, s: Pt, e: Pt): number => {
    const dx = e.x - s.x;
    const dy = e.y - s.y;
    const len2 = dx * dx + dy * dy;
    const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - s.x) * dx + (p.y - s.y) * dy) / len2));
    return Math.hypot(p.x - (s.x + t * dx), p.y - (s.y + t * dy));
  };
  const orient = (p: Pt, q: Pt, r: Pt): number => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
  const d1 = orient(c, d, a);
  const d2 = orient(c, d, b);
  const d3 = orient(a, b, c);
  const d4 = orient(a, b, d);
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) return 0;
  return Math.min(ptSeg(a, c, d), ptSeg(b, c, d), ptSeg(c, a, b), ptSeg(d, a, b));
}

function rectPolyDist(r: Rect, poly: Pt[]): number {
  const corners = rectCorners(r);
  if (corners.some((p) => pointInPoly(p, poly))) return 0;
  if (poly.some((p) => p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h)) return 0;
  let best = Infinity;
  for (let i = 0; i < corners.length; i++) {
    const a = corners[i];
    const b = corners[(i + 1) % corners.length];
    for (let j = 0; j < poly.length; j++) {
      best = Math.min(best, segSegDist(a, b, poly[j], poly[(j + 1) % poly.length]));
      if (best === 0) return 0;
    }
  }
  return best;
}

export interface AccessLot {
  index: number;
  edgeDistance: number;
  adjacent: boolean; // lot edge directly adjoins open space (<= ADJACENT_M)
}

export interface AccessResult {
  perLot: AccessLot[];
  buckets: Array<{ distance: number; count: number; share: number }>;
  adjacentCount: number;
}

export function lotAccess(lots: Rect[], spaces: Pt[][]): AccessResult | null {
  if (spaces.length === 0 || lots.length === 0) return null;
  const perLot = lots.map((r, index) => {
    let d = Infinity;
    for (const poly of spaces) d = Math.min(d, rectPolyDist(r, poly));
    return { index, edgeDistance: d, adjacent: d <= ADJACENT_M };
  });
  const buckets = WALK_THRESHOLDS.map((distance) => {
    const count = perLot.filter((l) => l.edgeDistance <= distance).length;
    return { distance, count, share: (count / perLot.length) * 100 };
  });
  return { perLot, buckets, adjacentCount: perLot.filter((l) => l.adjacent).length };
}
