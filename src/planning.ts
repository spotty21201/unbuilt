// Shared, measured inputs for interactive layout generation.
export interface PlanningParameters {
  lotDepth: number;
  greenBuffer: number;
  homeWidth: number;
  homeDepth: number;
  streets: number[];
  minGreenArea?: number;
  siteLocked: boolean;
  priceLocked: boolean;
}
export const DEFAULT_PLANNING: PlanningParameters = {
  lotDepth: 20, greenBuffer: 0, homeWidth: 10, homeDepth: 6,
  streets: [], siteLocked: false, priceLocked: true,
};
export function planningErrors(raw: unknown): string[] {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return ['Planning parameters must be an object.'];
  const p = raw as Record<string, unknown>;
  for (const [key, min, max] of [['lotDepth', 12, 40], ['greenBuffer', 0, 4.5], ['homeWidth', 4, 16], ['homeDepth', 4, 16]] as const) {
    if (typeof p[key] !== 'number' || !Number.isFinite(p[key]) || p[key] < min || p[key] > max) return [`${key} must be between ${min} and ${max} m.`];
  }
  if (p.minGreenArea !== undefined && (typeof p.minGreenArea !== 'number' || !Number.isFinite(p.minGreenArea) || p.minGreenArea < 0 || p.minGreenArea > 250000)) return ['Minimum open space must be between 0 and 250,000 m².'];
  if (!Array.isArray(p.streets) || p.streets.length > 2 || p.streets.some((y) => typeof y !== 'number' || !Number.isFinite(y) || y < 3 || y > 497)) return ['Use at most two additional streets, positioned between 3 and 497 m.'];
  if (typeof p.siteLocked !== 'boolean' || typeof p.priceLocked !== 'boolean') return ['Planning locks must be booleans.'];
  return [];
}
export function homeArea(planning?: PlanningParameters): number {
  return planning ? planning.homeWidth * planning.homeDepth : 60;
}
