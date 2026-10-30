// UNBUILT site factory (Coder-owned). Custom rectangular sites for the M3
// journey. Generators scale to any valid geometry; the 120×100 m floor and
// 500 m ceiling are increment scope policy. Photos never feed these numbers:
// width/height are declared and confirmed by the user.
import { generateSpine, validateLayout, type Site } from "./geometry.ts";
import { siteBoundary } from "./boundary.ts";
import { rectInsidePoly } from "./polygon.ts";
import { DEFAULT_PLANNING } from "./planning.ts";

export const SITE_MIN_W = 120;
export const SITE_MIN_H = 100;
export const SITE_MAX = 500;

export function siteSizeErrors(w: number, h: number): string[] {
  const errors: string[] = [];
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
    errors.push("Site width and depth must be positive numbers.");
    return errors;
  }
  if (w < SITE_MIN_W || h < SITE_MIN_H) {
    errors.push(
      `This increment supports sites from ${SITE_MIN_W} × ${SITE_MIN_H} m (scope policy, not a geometric limit).`,
    );
  }
  if (w > SITE_MAX || h > SITE_MAX) {
    errors.push(`Sites over ${SITE_MAX} m per side are outside this increment.`);
  }
  return errors;
}

// Entrance centered on the west edge; shared green proportional to Cedar.
export function makeSite(w: number, h: number): Site {
  return {
    w,
    h,
    entrance: { edge: "west", offset: h / 2, width: 8 },
    green: {
      x: Math.round(w * 0.65),
      y: Math.round(h * 0.62),
      w: Math.round(w * 0.2),
      h: Math.round(h * 0.2),
    },
  };
}

// A starter arrangement is an explicit assumption, checked against the outline.
export function starterLayout(site: Site, frontage: number): { site: Site; error?: string } {
  const outline = siteBoundary(site);
  const planning = site.planning ?? { ...DEFAULT_PLANNING };
  const active: Site = { ...site, planning, contents: { boundary: true, layout: true, removedHomes: [] } };
  const parkOptions = [site.green];
  const min = Math.max(16, planning.minGreenArea ?? 0);
  for (const [w, h] of (planning.openSpaces!==undefined?[]:[[24, 20], [12, 10], [Math.sqrt(min), Math.sqrt(min)]])) {
    if (w * h < min) continue;
    for (let x = 0; x + w <= site.w; x += Math.max(2, Math.floor(site.w / 15))) {
      for (let y = 0; y + h <= site.h; y += Math.max(2, Math.floor(site.h / 15))) {
        const r = { x, y, w, h };
        if (rectInsidePoly(r, outline)) parkOptions.push(r);
      }
    }
    if (parkOptions.length > 1) break;
  }
  let last = 'No starter park and connected street fit this boundary. Review the boundary and access assumptions.';
  for (const green of parkOptions.slice(0, 80)) {
    if (planning.openSpaces===undefined&&!rectInsidePoly(green, outline)) continue;
    const gates = [site.entrance, ...outline.map((a, i) => {
      const b = outline[(i + 1) % outline.length];
      return { edge: 'west' as const, boundaryEdge: i, offset: Math.hypot(b.x - a.x, b.y - a.y) / 2, width: 8 };
    })];
    for (const entrance of gates) {
      const next = { ...active, green, entrance };
      const layout = generateSpine(next, frontage);
      const errors = validateLayout(next, layout);
      if (!errors.length && layout.parcels.length) return { site: next };
      last = errors[0] ?? 'No home fits the current lot and housing dimensions.';
    }
  }
  return { site, error: `${last} Other arrangements may be possible; this starter search is bounded.` };
}
