// Shared illustrative costs; absent project assumptions retain the original rates.
export const DEFAULT_COSTS = {
  constructionPerM2: 5_000_000,
  roadPerM2: 800_000,
  greenWorksPerM2: 150_000,
  setupAllowance: 800_000_000,
  otherWorksAllowance: 1_200_000_000,
  contingencyFraction: 0.05,
  professionalAllowance: 1_300_000_000,
  sellFraction: 0.03,
};
export type CostAssumptions = typeof DEFAULT_COSTS;
const labels: Record<keyof CostAssumptions, string> = {
  constructionPerM2: 'Home construction rate', roadPerM2: 'Street works rate', greenWorksPerM2: 'Green works rate',
  setupAllowance: 'Setup allowance', otherWorksAllowance: 'Other physical works', contingencyFraction: 'Contingency',
  professionalAllowance: 'Professional allowance', sellFraction: 'Selling costs',
};
export function costErrors(raw: unknown): string[] {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return ['Cost assumptions must be an object.'];
  const values = raw as Record<string, unknown>;
  if (Object.keys(values).some(k => !Object.hasOwn(DEFAULT_COSTS, k))) return ['Unknown cost assumption.'];
  for (const key of Object.keys(DEFAULT_COSTS) as (keyof CostAssumptions)[]) {
    const v = values[key], fraction = key.endsWith('Fraction');
    if (typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > (fraction ? 1 : 1e12) || (key === 'sellFraction' && v === 1)) {
      return [`${labels[key]} must be finite and ${fraction ? key === 'sellFraction' ? 'between 0 and less than 100%.' : 'between 0 and 100%.' : 'between Rp0 and Rp1 trillion.'}`];
    }
  }
  return [];
}
