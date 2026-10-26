// UNBUILT finance core — PRD section 9. Pure, deterministic, no rounding inside.
// S = R(1-s) - C - L; margin = S/R (null when R=0)
// L* = R(1-s-t) - C; G = L - L*; P* = (C+L)/(N(1-s-t)) (null when N=0 or 1-s-t<=0)
import type { FinanceInputs, FinanceResult } from "./schema.ts";

export function evaluateFinance(inp: FinanceInputs): FinanceResult {
  const { n, pricePerHome, costNonLand, sellFraction, ownerExpectation, targetFraction } = inp;
  const revenue = n * pricePerHome;
  const surplus = revenue * (1 - sellFraction) - costNonLand - ownerExpectation;
  const margin = revenue > 0 ? surplus / revenue : null;
  const landAllowance = revenue * (1 - sellFraction - targetFraction) - costNonLand;
  const ownerGap = ownerExpectation - landAllowance;
  const denom = n * (1 - sellFraction - targetFraction);
  const requiredPrice = n > 0 && 1 - sellFraction - targetFraction > 0
    ? (costNonLand + ownerExpectation) / denom
    : null;
  return { revenue, surplus, margin, landAllowance, ownerGap, requiredPrice };
}
