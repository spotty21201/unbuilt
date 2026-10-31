import {assessDevelopment} from './development.ts';
import type { PersistedState } from './persist.ts';
import { hasHome, hasLayout } from './contents.ts';
import { deriveQuantities, editsForLayout, generateLoop, generateSpine, validateLayout, lotKey } from './geometry.ts';
import { evaluateLayout } from './economics.ts';
import { BASE_PROFILE, COMPACT_PROFILE, failingLots } from './search.ts';
import { makeSite } from './site.ts';
import { housingSummary } from './housing.ts';

export function stateKey(state: PersistedState): string {
  return JSON.stringify(state, (_key, v) => v && typeof v === 'object' && !Array.isArray(v)
    ? Object.fromEntries(Object.keys(v).sort().map(k => [k, v[k]])) : v);
}
export function assessAlternative(state: PersistedState) {
  const site = { ...makeSite(state.baseSpec.w, state.baseSpec.h), ...state.baseSpec, green: state.green, entrance: { ...state.entrance, edge: state.entrance.edge === 'east' ? 'east' as const : 'west' as const } };
  const layout = state.spec.family === 'loop' ? generateLoop(site, state.spec.frontage) : generateSpine(site, state.spec.frontage);
  const edits = editsForLayout(layout.parcels, state.lots);
  const errors = validateLayout(site, layout, edits);
  if (Object.keys(state.lots).some(k => !layout.parcels.some(r => lotKey(r) === k))) errors.push('A saved lot reshape no longer has its original lot. Reopening is blocked to preserve that work.');
  const number = (s: string) => s.trim() === '' ? NaN : Number(s);
  const price = number(state.priceS) * 1e6, ceiling = number(state.ceilingS) * 1e6, owner = number(state.ownerS) * 1e9, target = number(state.targetS) / 100;
  const financeValid = [price, ceiling, owner, target].every(Number.isFinite) && price > 0 && ceiling > 0 && owner >= 0 && target >= 0 && target < 1;
  const quantities = errors.length ? null : deriveQuantities(site, layout, edits);
  const builtArea = errors.length ? null : housingSummary(site, layout.parcels).builtArea;
  const economics = !errors.length && hasLayout(site) && !layout.empty && financeValid ? evaluateLayout(site, layout, price, { ownerExpectation: owner, targetFraction: target }, edits) : null;
  const warnings: string[] = [];
  if (!financeValid) warnings.push('Financial assumptions are incomplete; financial results are unavailable.');
  if (!hasLayout(site)) warnings.push('Boundary-only or blank scheme: no layout economics.');
  if (site.planning?.priceLocked && price > ceiling) warnings.push('Assumed selling price exceeds this scheme’s buyer ceiling.');
  const profile = state.profileId === 'starter-150' ? COMPACT_PROFILE : BASE_PROFILE;
  const outside = failingLots(layout.parcels, profile, { lotEdits: edits, roads: layout.roads, roadSurface: layout.roadSurface }).filter(i => hasHome(site, layout.parcels[i])).length;
  if (outside) warnings.push(`${outside} occupied lots fall outside ${profile.name}; pricing is provisional.`);
  return { site, layout, edits, errors, warnings, quantities, builtArea, economics, price, ceiling, owner, target, development:assessDevelopment(site,layout,edits,economics,price,owner) };
}
