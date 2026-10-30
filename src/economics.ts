// UNBUILT layout economics (Coder-owned). Fictional labeled rates for Cedar Market.
// Every cost-driving quantity comes from measured geometry or a declared allowance.
import {housingSummary} from "./housing.ts";
import { DEFAULT_COSTS, costErrors } from './costs.ts';
import { evaluateFinance } from "./finance.ts";
import type { FinanceResult } from "./schema.ts";
import { deriveQuantities, type Layout, type LotEdits, type Quantities, type Site } from "./geometry.ts";

export const RATES = {
  ...DEFAULT_COSTS,
  homeBuiltArea: 60, // m2/home
  targetFraction: 0.15,
  ownerExpectation: 10_000_000_000,
};

export interface LayoutEconomics {
  quantities: Quantities;
  roadCost: number;
  homeCost: number;
  builtArea: number;
  greenCost: number;
  costNonLand: number;
  finance: FinanceResult;
}

export function evaluateLayout(
  site: Site,
  layout: Layout,
  pricePerHome: number,
  overrides: { ownerExpectation?: number; targetFraction?: number } = {},
  lotEdits: LotEdits = new Map(),
): LayoutEconomics {
  if (layout.empty) throw new Error("Generate a layout before evaluating economics.");
  const rates = site.costAssumptions ?? DEFAULT_COSTS;
  const errors = costErrors(rates);
  if (errors.length) throw new Error(errors[0]);
  const quantities = deriveQuantities(site, layout, lotEdits);
  const builtArea=housingSummary(site,layout.parcels).builtArea;
  const homeCost = builtArea * rates.constructionPerM2;
  const roadCost = quantities.roadArea * rates.roadPerM2;
  const greenCost = quantities.greenArea * rates.greenWorksPerM2;
  const physical =
    homeCost + roadCost + greenCost + rates.setupAllowance + rates.otherWorksAllowance;
  const contingency = physical * rates.contingencyFraction;
  const costNonLand = physical + contingency + rates.professionalAllowance;
  const finance = evaluateFinance({
    n: quantities.n,
    pricePerHome,
    costNonLand,
    sellFraction: rates.sellFraction,
    ownerExpectation: overrides.ownerExpectation ?? RATES.ownerExpectation,
    targetFraction: overrides.targetFraction ?? RATES.targetFraction,
  });
  return { quantities, roadCost, homeCost, builtArea, greenCost, costNonLand, finance };
}
