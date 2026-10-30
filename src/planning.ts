import {openSpaceErrors,type OpenSpace} from './open-spaces.ts';
import {housingErrors,homeTemplate,type HousingMix} from './housing.ts';
import {parcelPlanErrors} from './parcels.ts';
import type {Rect} from './schema.ts';
import { streetErrors, type StreetNetwork } from './streets.ts';
// Shared, measured inputs for interactive layout generation.
export interface PlanningParameters {
  lotDepth: number;
  greenBuffer: number;
  homeWidth: number;
  homeDepth: number;
  streets: number[];
  streetNetwork?: StreetNetwork;
  lotPlan?: Rect[];
  housing?: HousingMix;
  openSpaces?:OpenSpace[];
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
  if(p.openSpaces!==undefined){const errors=openSpaceErrors(p.openSpaces);if(errors.length)return errors;}
  if(p.housing!==undefined){const errors=housingErrors(p.housing);if(errors.length)return errors;}
  if(p.lotPlan!==undefined){const errors=parcelPlanErrors(p.lotPlan);if(errors.length)return errors;}
  if (p.streetNetwork !== undefined) {
    const errors = streetErrors(p.streetNetwork); if (errors.length) return errors;
    if (Array.isArray(p.streets) && p.streets.length) return ['Use manual streets or generated cross streets, not both. Review generated routing to replace the manual network.'];
  }
  for (const [key, min, max] of [['lotDepth', 12, 40], ['greenBuffer', 0, 4.5], ['homeWidth', 4, 16], ['homeDepth', 4, 16]] as const) {
    if (typeof p[key] !== 'number' || !Number.isFinite(p[key]) || p[key] < min || p[key] > max) return [`${key} must be between ${min} and ${max} m.`];
  }
  if (p.minGreenArea !== undefined && (typeof p.minGreenArea !== 'number' || !Number.isFinite(p.minGreenArea) || p.minGreenArea < 0 || p.minGreenArea > 250000)) return ['Minimum open space must be between 0 and 250,000 m².'];
  if (!Array.isArray(p.streets) || p.streets.length > 2 || p.streets.some((y) => typeof y !== 'number' || !Number.isFinite(y) || y < 3 || y > 497)) return ['Use at most two additional streets, positioned between 3 and 497 m.'];
  if (typeof p.siteLocked !== 'boolean' || typeof p.priceLocked !== 'boolean') return ['Planning locks must be booleans.'];
  return [];
}
export function homeArea(planning?: PlanningParameters,lot?:Rect): number {
  const t=homeTemplate(planning,lot);return t.width*t.depth;
}
