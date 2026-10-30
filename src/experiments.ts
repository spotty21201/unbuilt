import { costErrors, DEFAULT_COSTS, type CostAssumptions } from './costs.ts';
import { evaluateLayout } from './economics.ts';
import { editsForLayout, generateLoop, generateSpine, validateLayout, type Site, type StableEdits } from './geometry.ts';
import { DEFAULT_PLANNING } from './planning.ts';

export interface ExperimentDesign { family: 'spine' | 'loop'; frontage: number; lotDepth: number }
export function designHeldReason(site: Site, lots: StableEdits): string | null {
  return site.planning?.lotPlan !== undefined || Object.keys(lots).length || Object.keys(site.planning?.housing?.assignments ?? {}).length
    ? 'Manual lots, lot reshapes and assigned homes are held. Cost experiments remain available; review design edits in their existing editors.' : null;
}
export function evaluateExperiment(site: Site, spec: { family: 'spine' | 'loop'; frontage: number }, lots: StableEdits, design: ExperimentDesign, costs: CostAssumptions, price: number, owner: number, target: number) {
  const changed = design.family !== spec.family || design.frontage !== spec.frontage || design.lotDepth !== (site.planning?.lotDepth ?? DEFAULT_PLANNING.lotDepth);
  const errors = costErrors(costs);
  if (design.family !== 'spine' && design.family !== 'loop') errors.push('Choose Spine or Loop.');
  if (!Number.isFinite(design.frontage) || (design.frontage !== spec.frontage && (design.frontage < 6 || design.frontage > 30))) errors.push('Lot frontage must be between 6 and 30 m.');
  if (!Number.isFinite(design.lotDepth) || design.lotDepth < 12 || design.lotDepth > 40) errors.push('Lot depth must be between 12 and 40 m.');
  if (changed && designHeldReason(site, lots)) errors.push(designHeldReason(site, lots)!);
  if (site.planning?.streetNetwork && design.family !== spec.family) errors.push('Manual street routing is held. Edit streets separately.');
  if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(owner) || owner < 0 || !Number.isFinite(target) || target < 0 || target >= 1) errors.push('Complete the accepted selling price, owner expectation and target assumptions first.');
  if (costs.sellFraction + target >= 1) errors.push('Selling costs plus target surplus must be below 100% to calculate a required price.');
  const trialSite: Site = { ...site, costAssumptions: { ...costs }, ...(changed ? { planning: { ...(site.planning ?? DEFAULT_PLANNING), lotDepth: design.lotDepth } } : {}) };
  const renderSite = errors.length ? site : trialSite;
  const renderSpec = errors.length ? spec : design;
  const layout = renderSpec.family === 'loop' ? generateLoop(renderSite, renderSpec.frontage) : generateSpine(renderSite, renderSpec.frontage);
  const edits = editsForLayout(layout.parcels, lots);
  errors.push(...validateLayout(renderSite, layout, edits));
  if (layout.empty) errors.push('Generate an accepted layout before testing feasibility.');
  const args = { ownerExpectation: owner, targetFraction: target };
  const economics = errors.length ? null : evaluateLayout(trialSite, layout, price, args, edits);
  // Sequential attribution: design at accepted costs, then cost changes on that design.
  const designEconomics = economics ? evaluateLayout({ ...trialSite, costAssumptions: site.costAssumptions ?? DEFAULT_COSTS }, layout, price, args, edits) : null;
  return { site: trialSite, layout, edits, errors: [...new Set(errors)], economics, designEconomics, changed };
}
