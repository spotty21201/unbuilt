// UNBUILT rotated lot generation (Coder-owned). Subdivides whole lots along
// one straight street segment at any angle: lots are oriented rectangles
// perpendicular to the segment, placed from the kerb line (half the street
// width plus declared clearance). Every candidate is validated against the
// site boundary, the unioned pavement and open spaces; skipped candidates
// report their reason — nothing is silently dropped or clamped.
// Lots are polygons (Pt[4]); the axis-aligned parcel channel (Rect) is a
// separate representation. See DECISIONS for the integration contract.
import type { Pt } from "./polygon.ts";
import { pointInPoly, polyArea, polysOverlap } from "./polygon.ts";

export interface RotatedLot {
  pts: [Pt, Pt, Pt, Pt]; // kerb-left, kerb-right, outer-right, outer-left (segment frame)
  frontage: number; // shared length along the segment, metres
  depth: number; // perpendicular depth, metres
  area: number;
  angleDeg: number; // segment direction, degrees CCW from +x
}

export interface RotatedInput {
  a: Pt;
  b: Pt; // straight street segment centreline endpoints
  streetWidth: number; // full declared street width, metres
  side: "left" | "right" | "both"; // left = CCW normal of a->b
  frontage: number;
  depth: number;
  boundary: Pt[]; // closed site polygon
  pavement: Pt[][]; // unioned road/apron polygons to stay clear of
  spaces: Pt[][]; // open-space polygons to stay clear of
  clearance: number; // extra gap from the kerb line, metres
  maxLots?: number; // hard generation cap
}

export interface RotatedResult {
  lots: RotatedLot[];
  skipped: Array<{ side: "left" | "right"; index: number; reason: string }>;
  segmentLength: number;
}

const EPS = 1e-9;

function insideSite(pts: Pt[], boundary: Pt[]): boolean {
  if (!pts.every((p) => pointInPoly(p, boundary))) return false;
  // No lot edge may cross the boundary: sample edge midpoints as well.
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % pts.length];
    if (!pointInPoly({ x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 }, boundary)) return false;
  }
  return true;
}

export function generateRotatedLots(input: RotatedInput): RotatedResult {
  const { a, b } = input;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const segmentLength = Math.hypot(dx, dy);
  const result: RotatedResult = { lots: [], skipped: [], segmentLength };
  if (!(segmentLength > EPS)) return result;
  if (!(input.frontage > 0) || !(input.depth > 0) || !(input.streetWidth >= 0)) return result;
  const ux = dx / segmentLength;
  const uy = dy / segmentLength;
  const nx = -uy; // left normal (CCW)
  const ny = ux;
  const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
  const maxLots = input.maxLots ?? 500;
  const sides: Array<"left" | "right"> = input.side === "both" ? ["left", "right"] : [input.side];
  const perSide = Math.floor(segmentLength / input.frontage);

  for (const side of sides) {
    const s = side === "left" ? 1 : -1;
    for (let k = 0; k < perSide; k++) {
      if (result.lots.length >= maxLots) {
        result.skipped.push({ side, index: k, reason: "generation cap reached" });
        continue;
      }
      const off = input.streetWidth / 2 + input.clearance;
      const base = (t: number) => ({ x: a.x + ux * t + s * nx * off, y: a.y + uy * t + s * ny * off });
      const p0 = base(k * input.frontage);
      const p1 = base((k + 1) * input.frontage);
      const deep = (p: Pt) => ({ x: p.x + s * nx * input.depth, y: p.y + s * ny * input.depth });
      const pts: [Pt, Pt, Pt, Pt] = [p0, p1, deep(p1), deep(p0)];
      if (!insideSite(pts, input.boundary)) {
        result.skipped.push({ side, index: k, reason: "outside site boundary" });
        continue;
      }
      if (input.pavement.some((poly) => polysOverlap(pts, poly))) {
        result.skipped.push({ side, index: k, reason: "overlaps street pavement" });
        continue;
      }
      if (input.spaces.some((poly) => polysOverlap(pts, poly))) {
        result.skipped.push({ side, index: k, reason: "overlaps open space" });
        continue;
      }
      result.lots.push({ pts, frontage: input.frontage, depth: input.depth, area: polyArea(pts), angleDeg });
    }
  }
  return result;
}

// A home template fits a rotated lot when it fits along the lot axes in
// either orientation (templates already rotate to their lot).
export function fitsRotatedHome(lot: RotatedLot, homeWidth: number, homeDepth: number): boolean {
  return (
    (homeWidth <= lot.frontage + EPS && homeDepth <= lot.depth + EPS) ||
    (homeDepth <= lot.frontage + EPS && homeWidth <= lot.depth + EPS)
  );
}

// Measured parcel total for a generated set (counted once per lot).
export function rotatedParcelArea(lots: RotatedLot[]): number {
  return lots.reduce((sum, l) => sum + l.area, 0);
}
