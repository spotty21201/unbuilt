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

export interface ProductProfile {
  id: string;
  name: string;
  lotAreaMin: number;
  lotAreaMax: number;
  frontageMin: number;
  priceLow: CurrencyRp;
  priceBase: CurrencyRp;
  priceHigh: CurrencyRp;
  source: string; // fictional evidence description, labeled
}

export interface Locks {
  green: Rect; // locked region: shape AND location
  priceCeiling: CurrencyRp; // buyer-price ceiling; selected price must be at or below
  ownerExpectation: CurrencyRp; // fixed L
  targetFraction: number; // fixed t
}

export interface SearchRanges {
  families: Array<"spine" | "loop">;
  frontages: number[];
}

export interface Candidate {
  id: string;
  family: "spine" | "loop";
  frontage: number;
  quantities: { n: number; roadArea: number; greenArea: number; parcelArea: number; unallocatedArea: number };
  validationErrors: string[];
  greenHeld: boolean;
  priceOk: boolean;
  applicable: boolean;
  failingLots: number[];
  roadCost: number;
  costNonLand: CurrencyRp;
  finance: FinanceResult;
  reason?: string;
}

export interface SearchRun {
  snapshotHash: string;
  seed: number;
  tested: number;
  valid: number;
  qualified: number;
  truncated: boolean;
  elapsedMs: number;
  blockers: string[];
  candidates: Candidate[];
}

export interface FinanceResult {
  revenue: CurrencyRp;
  surplus: CurrencyRp;
  margin: number | null; // S/R, null when R == 0
  landAllowance: CurrencyRp; // L*
  ownerGap: CurrencyRp; // G = L - L*
  requiredPrice: CurrencyRp | null; // P*, null when undefined
}
