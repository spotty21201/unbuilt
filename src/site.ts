// UNBUILT site factory (Coder-owned). Custom rectangular sites for the M3
// journey. Generators scale to any valid geometry; the 120×100 m floor and
// 500 m ceiling are increment scope policy. Photos never feed these numbers:
// width/height are declared and confirmed by the user.
import type { Site } from "./geometry.ts";

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
