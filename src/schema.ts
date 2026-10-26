// UNBUILT domain schema stub (M0/M1). Coder-owned; shared changes need Orchestrator review.
// Currency: integer base units (Rp) internally. Geometry: meters, local Cartesian.

export type CurrencyRp = number; // integer Rp

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface FinanceInputs {
  n: number; // valid modeled homes
  pricePerHome: CurrencyRp; // selected assumed gross selling price P
  costNonLand: CurrencyRp; // C, modeled non-land costs excl. selling costs
  sellFraction: number; // s
  ownerExpectation: CurrencyRp; // L
  targetFraction: number; // t
}

export interface FinanceResult {
  revenue: CurrencyRp;
  surplus: CurrencyRp;
  margin: number | null; // S/R, null when R == 0
  landAllowance: CurrencyRp; // L*
  ownerGap: CurrencyRp; // G = L - L*
  requiredPrice: CurrencyRp | null; // P*, null when undefined
}
