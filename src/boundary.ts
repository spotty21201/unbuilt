// Site outlines use local Cartesian meters; legacy rectangles remain valid.
import { allFinite, isSimple, polyArea, rectCorners, segmentsCross, type Pt } from "./polygon.ts";

import { contentsErrors, hasBoundary, type PlanContents } from './contents.ts';
import { planningErrors, type PlanningParameters } from "./planning.ts";
import { costErrors, type CostAssumptions } from './costs.ts';

export interface SiteFrame { w: number; h: number; boundary?: Pt[]; planning?: PlanningParameters; contents?: PlanContents; costAssumptions?: CostAssumptions }
export const MAX_SITE_VERTICES = 64;
export function siteBoundary(site: SiteFrame): Pt[] {
  if (!hasBoundary(site)) return [];
  return site.boundary ?? rectCorners({ x: 0, y: 0, w: site.w, h: site.h });
}
export function siteArea(site: SiteFrame): number { return polyArea(siteBoundary(site)); }
export function boundaryErrors(pts: Pt[]): string[] {
  if (pts.length < 3 || pts.length > MAX_SITE_VERTICES) return [`Use 3–${MAX_SITE_VERTICES} boundary vertices.`];
  if (!allFinite(pts)) return ["Boundary coordinates must be finite numbers."];
  if (pts.some((p) => p.x < 0 || p.y < 0 || p.x > 500 || p.y > 500)) return ["Boundary coordinates must be between 0 and 500 m."];
  if (!isSimple(pts)) return ["Boundary edges cross, overlap or repeat. Move or remove a vertex."];
  if (siteArea({ w: 0, h: 0, boundary: pts }) < 1) return ["Boundary must enclose at least 1 m²."];
  return [];
}
export function siteFrameErrors(site: SiteFrame): string[] {
  if (site.costAssumptions !== undefined) { const errors = costErrors(site.costAssumptions); if (errors.length) return errors; }
  if (!Number.isFinite(site.w) || !Number.isFinite(site.h) || site.w <= 0 || site.h <= 0 || site.w > 500 || site.h > 500) return ["Site extents must be positive and at most 500 m."];
  if (site.contents !== undefined) { const errors = contentsErrors(site.contents); if (errors.length) return errors; }
  if (site.planning !== undefined) { const errors = planningErrors(site.planning); if (errors.length) return errors; }
  if (!hasBoundary(site)) return site.boundary === undefined ? [] : ["A blank plan cannot carry a boundary."];
  if (!site.boundary) return [];
  const errors = boundaryErrors(site.boundary);
  if (errors.length) return errors;
  if (Math.abs(Math.max(...site.boundary.map((p) => p.x)) - site.w) > 0.001 || Math.abs(Math.max(...site.boundary.map((p) => p.y)) - site.h) > 0.001) return ["Site extents do not match its boundary coordinates."];
  return [];
}
export function frameForBoundary(boundary: Pt[]): SiteFrame {
  return { w: Math.max(...boundary.map((p) => p.x)), h: Math.max(...boundary.map((p) => p.y)), boundary: boundary.map((p) => ({ ...p })) };
}

// Return edge indices for drawing and text feedback using the same predicate.
export function boundaryConflictEdges(pts: Pt[]): number[] {
  if (!allFinite(pts)) return [];
  const conflicts = new Set<number>();
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length], c = pts[(i + 2) % pts.length];
    if (Math.hypot(b.x - a.x, b.y - a.y) <= 0.001) conflicts.add(i);
    const cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
    const dot = (b.x - a.x) * (c.x - b.x) + (b.y - a.y) * (c.y - b.y);
    if (Math.abs(cross) <= 0.001 && dot < -0.001) { conflicts.add(i); conflicts.add((i + 1) % pts.length); }
    for (let j = i + 2; j < pts.length; j++) {
      if (i === 0 && j === pts.length - 1) continue;
      if (segmentsCross(a, b, pts[j], pts[(j + 1) % pts.length])) { conflicts.add(i); conflicts.add(j); }
    }
  }
  return [...conflicts].sort((a, b) => a - b);
}
