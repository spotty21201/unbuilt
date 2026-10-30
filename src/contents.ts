import type { Rect } from './schema.ts';

export interface PlanContents {
  boundary: boolean;
  layout: boolean;
  removedHomes: Rect[];
}
export interface HasContents { contents?: PlanContents }
export const hasBoundary = (site: HasContents): boolean => site.contents?.boundary ?? true;
export const hasLayout = (site: HasContents): boolean => hasBoundary(site) && (site.contents?.layout ?? true);
export function hasHome(site: HasContents, lot: Rect): boolean {
  return hasLayout(site) && !(site.contents?.removedHomes ?? []).some(r =>
    Math.min(r.x + r.w, lot.x + lot.w) - Math.max(r.x, lot.x) > 0.001 &&
    Math.min(r.y + r.h, lot.y + lot.h) - Math.max(r.y, lot.y) > 0.001);
}
export function contentsErrors(raw: unknown): string[] {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return ['Plan contents must be an object.'];
  const p = raw as Record<string, unknown>;
  if (typeof p.boundary !== 'boolean' || typeof p.layout !== 'boolean' || (!p.boundary && p.layout)) return ['Plan contents need a boundary before a layout.'];
  if (!Array.isArray(p.removedHomes) || p.removedHomes.length > 5000 || p.removedHomes.some(value => {
    if (typeof value !== 'object' || value === null) return true;
    const r = value as Rect;
    return ![r.x, r.y, r.w, r.h].every(Number.isFinite) || r.x < 0 || r.y < 0 || r.w <= 0 || r.h <= 0 || r.x + r.w > 500.001 || r.y + r.h > 500.001;
  })) return ['Removed-home reservations must be finite, positive rectangles inside the 500 m workspace.'];
  return [];
}
