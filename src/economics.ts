// UNBUILT layout economics (Coder-owned). Fictional labeled rates for Cedar Market.
// Every cost-driving quantity comes from measured geometry or a declared allowance.
import { evaluateFinance } from "./finance.ts";
import type { FinanceResult } from "./schema.ts";
import { deriveQuantities, type Layout, type LotEdits, type Quantities, type Site } from "./geometry.ts";

export const RATES = {
  homeBuiltArea: 60, // m2/home
  constructionPerM2: 5_000_000, // Rp/m2
  roadPerM2: 800_000, // Rp/m2 of unioned road area
  greenWorksPerM2: 150_000, // Rp/m2 of shared green
  setupAllowance: 800_000_000, // explicit demolition/setup scope
  otherWorksAllowance: 1_200_000_000, // utilities/drainage allowance
  contingencyFraction: 0.05, // of physical-cost lines
  professionalAllowance: 1_300_000_000,
  sellFraction: 0.03,
  targetFraction: 0.15,
  ownerExpectation: 10_000_000_000,
};

export interface LayoutEconomics {
  quantities: Quantities;
  roadCost: number;
  homeCost: number;
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
  const quantities = deriveQuantities(site, layout, lotEdits);
  const homeCost = quantities.n * RATES.homeBuiltArea * RATES.constructionPerM2;
  const roadCost = quantities.roadArea * RATES.roadPerM2;
  const greenCost = quantities.greenArea * RATES.greenWorksPerM2;
  const physical =
    homeCost + roadCost + greenCost + RATES.setupAllowance + RATES.otherWorksAllowance;
  const contingency = physical * RATES.contingencyFraction;
  const costNonLand = physical + contingency + RATES.professionalAllowance;
  const finance = evaluateFinance({
    n: quantities.n,
    pricePerHome,
    costNonLand,
    sellFraction: RATES.sellFraction,
    ownerExpectation: overrides.ownerExpectation ?? RATES.ownerExpectation,
    targetFraction: overrides.targetFraction ?? RATES.targetFraction,
  });
  return { quantities, roadCost, homeCost, greenCost, costNonLand, finance };
}
