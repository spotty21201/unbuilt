// UNBUILT planning brief (Coder-owned). Owner-declared rules evaluated
// against the measured land budget. These are the owner's own brief, never
// regulations, and never presented as compliance with any external standard.
// Unset or non-positive rules are simply not checked.
import type { LandBudget } from "./landbudget.ts";

export interface BriefRules {
  densityMinHa?: number; // homes per gross hectare, at least
  densityMaxHa?: number; // homes per gross hectare, at most
  greenMinPct?: number; // designed green share of site, at least (%)
  unallocatedMaxPct?: number; // unallocated remainder share, at most (%)
}

export interface BriefCheck {
  id: "density-min" | "density-max" | "green-min" | "unallocated-max";
  label: string;
  actual: number; // measured value in the check's unit
  rule: number; // declared threshold
  unit: string;
  pass: boolean;
  margin: number; // actual minus threshold for floors, threshold minus actual for caps (≥0 passes)
}

export interface BriefResult {
  checks: BriefCheck[];
  failed: BriefCheck[];
  unset: number;
}

function rule(v: number | undefined): v is number {
  return typeof v === "number" && Number.isFinite(v) && v > 0;
}

export function evaluateBrief(b: LandBudget, r: BriefRules): BriefResult {
  const checks: BriefCheck[] = [];
  let unset = 0;
  const floor = (id: BriefCheck["id"], label: string, actual: number, threshold: number, unit: string) =>
    checks.push({ id, label, actual, rule: threshold, unit, pass: actual >= threshold, margin: actual - threshold });
  const cap = (id: BriefCheck["id"], label: string, actual: number, threshold: number, unit: string) =>
    checks.push({ id, label, actual, rule: threshold, unit, pass: actual <= threshold, margin: threshold - actual });

  if (rule(r.densityMinHa)) floor("density-min", "Density (gross) at least", b.densityGross, r.densityMinHa, "homes/ha");
  else unset++;
  if (rule(r.densityMaxHa)) cap("density-max", "Density (gross) at most", b.densityGross, r.densityMaxHa, "homes/ha");
  else unset++;
  if (rule(r.greenMinPct)) floor("green-min", "Designed green share at least", b.pctGreen, r.greenMinPct, "% of site");
  else unset++;
  if (rule(r.unallocatedMaxPct)) cap("unallocated-max", "Unallocated remainder at most", b.pctUnallocated, r.unallocatedMaxPct, "% of site");
  else unset++;

  return { checks, failed: checks.filter((c) => !c.pass), unset };
}
