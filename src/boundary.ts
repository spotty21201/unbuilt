// Site outlines use local Cartesian meters; legacy rectangles remain valid.
import { allFinite, isSimple, polyArea, rectCorners, type Pt } from "./polygon.ts";

export interface SiteFrame { w: number; h: number; boundary?: Pt[] }
export const MAX_SITE_VERTICES = 64;
export function siteBoundary(site: SiteFrame): Pt[] {
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
  if (!Number.isFinite(site.w) || !Number.isFinite(site.h) || site.w <= 0 || site.h <= 0 || site.w > 500 || site.h > 500) return ["Site extents must be positive and at most 500 m."];
  if (!site.boundary) return [];
  const errors = boundaryErrors(site.boundary);
  if (errors.length) return errors;
  if (Math.abs(Math.max(...site.boundary.map((p) => p.x)) - site.w) > 0.001 || Math.abs(Math.max(...site.boundary.map((p) => p.y)) - site.h) > 0.001) return ["Site extents do not match its boundary coordinates."];
  return [];
}
export function frameForBoundary(boundary: Pt[]): SiteFrame {
  return { w: Math.max(...boundary.map((p) => p.x)), h: Math.max(...boundary.map((p) => p.y)), boundary: boundary.map((p) => ({ ...p })) };
}
