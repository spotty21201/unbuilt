// UNBUILT polygon geometry (Coder-owned). Pure predicates for simple
// (hole-free) lot polygons, meters, local Cartesian y-up. No imports from
// geometry.ts: that module consumes these predicates, never the reverse.
import type { Rect } from "./schema.ts";

export interface Pt {
  x: number;
  y: number;
}

const TOL = 0.001; // 1 mm coordinate tolerance, matches geometry core

export const MAX_LOT_VERTICES = 12; // staged bound, communicated in the UI

export function polyArea(pts: Pt[]): number {
  return Math.abs(signedArea(pts));
}

export function signedArea(pts: Pt[]): number {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    s += a.x * b.y - b.x * a.y;
  }
  return s / 2;
}

export function allFinite(pts: Pt[]): boolean {
  return pts.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
}

// A point just inside the polygon off the middle of edge i (2 mm inward).
// Catches coincident duplicates: every tested vertex can sit exactly on the
// other boundary while positive area still overlaps.
function inwardPoint(pts: Pt[], i: number): Pt {
  const a = pts[i];
  const b = pts[(i + 1) % pts.length];
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const ccw = signedArea(pts) > 0;
  const nx = ccw ? -dy / len : dy / len;
  const ny = ccw ? dx / len : -dx / len;
  return { x: (a.x + b.x) / 2 + nx * 2 * TOL, y: (a.y + b.y) / 2 + ny * 2 * TOL };
}

export function edgeLengths(pts: Pt[]): number[] {
  return pts.map((a, i) => {
    const b = pts[(i + 1) % pts.length];
    return Math.hypot(b.x - a.x, b.y - a.y);
  });
}

export function polyPerimeter(pts: Pt[]): number {
  return edgeLengths(pts).reduce((s, l) => s + l, 0);
}

export function centroid(pts: Pt[]): Pt {
  let cx = 0;
  let cy = 0;
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const c = a.x * b.y - b.x * a.y;
    s += c;
    cx += (a.x + b.x) * c;
    cy += (a.y + b.y) * c;
  }
  if (Math.abs(s) < TOL) return { x: pts[0].x, y: pts[0].y };
  return { x: cx / (3 * s), y: cy / (3 * s) };
}

function orient(a: Pt, b: Pt, c: Pt): number {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function onSegment(a: Pt, b: Pt, c: Pt): boolean {
  return (
    Math.min(a.x, c.x) - TOL <= b.x &&
    b.x <= Math.max(a.x, c.x) + TOL &&
    Math.min(a.y, c.y) - TOL <= b.y &&
    b.y <= Math.max(a.y, c.y) + TOL
  );
}

// Strict straddle: each segment passes to opposite sides of the other.
// Boundary touching (shared endpoints, T-junctions, collinear contact) is
// NOT a proper crossing; overlap tests use this so adjacent lots sharing a
// boundary never read as overlapping.
function properCross(p1: Pt, p2: Pt, p3: Pt, p4: Pt): boolean {
  const d1 = orient(p3, p4, p1);
  const d2 = orient(p3, p4, p2);
  const d3 = orient(p1, p2, p3);
  const d4 = orient(p1, p2, p4);
  return (
    ((d1 > TOL && d2 < -TOL) || (d1 < -TOL && d2 > TOL)) &&
    ((d3 > TOL && d4 < -TOL) || (d3 < -TOL && d4 > TOL))
  );
}

// Proper crossing of segments p1-p2 and p3-p4 (touching at shared polygon
// vertices is adjacency, not a crossing; the caller skips adjacent edges).
export function segmentsCross(p1: Pt, p2: Pt, p3: Pt, p4: Pt): boolean {
  if (properCross(p1, p2, p3, p4)) return true;
  const d1 = orient(p3, p4, p1);
  const d2 = orient(p3, p4, p2);
  const d3 = orient(p1, p2, p3);
  const d4 = orient(p1, p2, p4);
  // Collinear overlap beyond a shared endpoint counts as self-intersection.
  if (Math.abs(d1) <= TOL && onSegment(p3, p1, p4)) return true;
  if (Math.abs(d2) <= TOL && onSegment(p3, p2, p4)) return true;
  if (Math.abs(d3) <= TOL && onSegment(p1, p3, p2)) return true;
  if (Math.abs(d4) <= TOL && onSegment(p1, p4, p2)) return true;
  return false;
}

// Simple polygon: at least a triangle, no zero-length edges, no repeated
// vertices, no non-adjacent edge contact. Adjacent edges share exactly one
// endpoint by construction.
export function isSimple(pts: Pt[]): boolean {
  const n = pts.length;
  if (n < 3 || !allFinite(pts)) return false;
  for (let i = 0; i < n; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % n];
    if (Math.hypot(b.x - a.x, b.y - a.y) <= TOL) return false;
    const c = pts[(i + 2) % n];
    if (Math.abs(orient(a, b, c)) <= TOL && (b.x - a.x) * (c.x - b.x) + (b.y - a.y) * (c.y - b.y) < -TOL) return false;
    for (let j = 0; j < n; j++) {
      if (j !== i && j !== (i + 1) % n && Math.hypot(pts[j].x - a.x, pts[j].y - a.y) <= TOL) return false;
    }
  }
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      // Adjacent edges (and first/last) meet at one vertex by construction.
      if (j === i + 1) continue;
      if (i === 0 && j === n - 1) continue;
      if (segmentsCross(pts[i], pts[(i + 1) % n], pts[j], pts[(j + 1) % n])) return false;
    }
  }
  return true;
}

function pointOnEdge(p: Pt, a: Pt, b: Pt): boolean {
  return Math.abs(orient(a, b, p)) <= TOL && onSegment(a, p, b);
}

// Boundary counts as inside: a lot edge exactly on the site edge is legal.
export function pointInPoly(p: Pt, pts: Pt[]): boolean {
  for (let i = 0; i < pts.length; i++) {
    if (pointOnEdge(p, pts[i], pts[(i + 1) % pts.length])) return true;
  }
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const a = pts[i];
    const b = pts[j];
    if (p.y > Math.min(a.y, b.y) && p.y <= Math.max(a.y, b.y) && p.x <= Math.max(a.x, b.x)) {
      const xint = (p.y - a.y) * (b.x - a.x) / (b.y - a.y) + a.x;
      if (Math.abs(b.y - a.y) > TOL && p.x <= xint) inside = !inside;
    }
  }
  return inside;
}

export function polyInsideSite(pts: Pt[], w: number, h: number): boolean {
  return pts.every((p) => p.x >= -TOL && p.y >= -TOL && p.x <= w + TOL && p.y <= h + TOL);
}

export function rectCorners(r: Rect): Pt[] {
  return [
    { x: r.x, y: r.y },
    { x: r.x + r.w, y: r.y },
    { x: r.x + r.w, y: r.y + r.h },
    { x: r.x, y: r.y + r.h },
  ];
}

function rectEdges(r: Rect): Array<[Pt, Pt]> {
  const c = rectCorners(r);
  return [
    [c[0], c[1]],
    [c[1], c[2]],
    [c[2], c[3]],
    [c[3], c[0]],
  ];
}

function strictlyInsideRect(p: Pt, r: Rect): boolean {
  return p.x > r.x + TOL && p.x < r.x + r.w - TOL && p.y > r.y + TOL && p.y < r.y + r.h - TOL;
}

// True area overlap (positive area in common). Mere edge touching — adjacent
// lots sharing a boundary — is not overlap.
export function polyOverlapsRect(pts: Pt[], r: Rect): boolean {
  if (pts.some((p) => strictlyInsideRect(p, r))) return true;
  if (rectCorners(r).some((c) => pointInPoly(c, pts) && !onPolyBoundary(c, pts))) return true;
  for (let i = 0; i < pts.length; i++) {
    if (strictlyInsideRect(edgeMid(pts[i], pts[(i + 1) % pts.length]), r)) return true;
  }
  for (const [c, d] of rectEdges(r)) {
    const m = edgeMid(c, d);
    if (pointInPoly(m, pts) && !onPolyBoundary(m, pts)) return true;
  }
  // Coincident shapes: nudge inward off each boundary (2 mm) and retest.
  const corners = rectCorners(r);
  for (let i = 0; i < pts.length; i++) {
    if (strictlyInsideRect(inwardPoint(pts, i), r)) return true;
  }
  for (let i = 0; i < corners.length; i++) {
    const q = inwardPoint(corners, i);
    if (pointInPoly(q, pts) && !onPolyBoundary(q, pts)) return true;
  }
  for (let i = 0; i < pts.length; i++) {
    for (const [c, d] of rectEdges(r)) {
      if (properCross(pts[i], pts[(i + 1) % pts.length], c, d)) return true;
    }
  }
  return false;
}

function onPolyBoundary(p: Pt, pts: Pt[]): boolean {
  return pts.some((_, i) => pointOnEdge(p, pts[i], pts[(i + 1) % pts.length]));
}

function edgeMid(a: Pt, b: Pt): Pt {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

export function polysOverlap(a: Pt[], b: Pt[]): boolean {
  if (a.some((p) => pointInPoly(p, b) && !onPolyBoundary(p, b))) return true;
  if (b.some((p) => pointInPoly(p, a) && !onPolyBoundary(p, a))) return true;
  // Strip overlaps whose boundaries meet only at endpoints: an edge midpoint
  // strictly inside the other polygon still proves positive-area overlap.
  for (let i = 0; i < a.length; i++) {
    const m = edgeMid(a[i], a[(i + 1) % a.length]);
    if (pointInPoly(m, b) && !onPolyBoundary(m, b)) return true;
  }
  for (let i = 0; i < b.length; i++) {
    const m = edgeMid(b[i], b[(i + 1) % b.length]);
    if (pointInPoly(m, a) && !onPolyBoundary(m, a)) return true;
  }
  // Coincident duplicates: vertices and midpoints all lie on the boundary.
  for (let i = 0; i < a.length; i++) {
    const q = inwardPoint(a, i);
    if (pointInPoly(q, b) && !onPolyBoundary(q, b)) return true;
  }
  for (let i = 0; i < b.length; i++) {
    const q = inwardPoint(b, i);
    if (pointInPoly(q, a) && !onPolyBoundary(q, a)) return true;
  }
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      if (properCross(a[i], a[(i + 1) % a.length], b[j], b[(j + 1) % b.length])) return true;
    }
  }
  return false;
}

// A rect sits inside a polygon when every corner is in-or-on and no rect
// edge properly crosses a polygon edge.
export function rectInsidePoly(r: Rect, pts: Pt[]): boolean {
  return polyInsidePoly(rectCorners(r), pts);
}

// Length of lot boundary shared with a rect edge (driveway frontage basis).
// Collinear within tolerance; summed over all edge pairs.
export function sharedBoundaryLength(pts: Pt[], r: Rect): number {
  let total = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    for (const [c, d] of rectEdges(r)) {
      if (Math.abs(orient(c, d, a)) > TOL || Math.abs(orient(c, d, b)) > TOL) continue;
      const horiz = Math.abs(d.y - c.y) <= TOL;
      const lo1 = horiz ? Math.min(a.x, b.x) : Math.min(a.y, b.y);
      const hi1 = horiz ? Math.max(a.x, b.x) : Math.max(a.y, b.y);
      const lo2 = horiz ? Math.min(c.x, d.x) : Math.min(c.y, d.y);
      const hi2 = horiz ? Math.max(c.x, d.x) : Math.max(c.y, d.y);
      total += Math.max(0, Math.min(hi1, hi2) - Math.max(lo1, lo2));
    }
  }
  return total;
}

// Include boundary contact, but reject edges bridging a concavity even when
// every corner is inside. Split collinear contacts before testing midpoints.
export function polyInsidePoly(inner: Pt[], outer: Pt[]): boolean {
  if (!inner.every((p) => pointInPoly(p, outer))) return false;
  return inner.every((a, i) => {
    const b = inner[(i + 1) % inner.length];
    const dx = b.x - a.x, dy = b.y - a.y;
    const len2 = dx * dx + dy * dy;
    const cuts = [0, 1];
    for (let j = 0; j < outer.length; j++) {
      if (properCross(a, b, outer[j], outer[(j + 1) % outer.length])) return false;
      if (len2 > 0 && pointOnEdge(outer[j], a, b)) {
        cuts.push(((outer[j].x - a.x) * dx + (outer[j].y - a.y) * dy) / len2);
      }
    }
    cuts.sort((x, y) => x - y);
    return cuts.slice(1).every((t, k) => {
      const m = (t + cuts[k]) / 2;
      return pointInPoly({ x: a.x + dx * m, y: a.y + dy * m }, outer);
    });
  });
}
