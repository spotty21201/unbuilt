// UNBUILT land budget (Coder-owned). Pure derivation from measured
// quantities: how the site's land is allocated and what density it carries.
// Definitions are stated here and in the UI; nothing is a regulation.
// - Gross density: homes per hectare of total site area.
// - Net density: homes per hectare of developed residential land
//   (parcels + roads + designed green), excluding unallocated remainder.
// - Shares: each component as a percentage of total site area.
import type { Quantities } from "./geometry.ts";

export interface LandBudget {
  siteArea: number;
  parcels: number;
  green: number;
  road: number;
  unallocated: number;
  n: number;
  grossHa: number;
  densityGross: number; // homes per gross hectare
  netArea: number; // parcels + road + green
  densityNet: number | null; // homes per net hectare; null when no developed land
  pctParcels: number;
  pctGreen: number;
  pctRoad: number;
  pctUnallocated: number;
  roadPerHome: number | null; // metres of road area proxy per home; null when no homes
}

const pct = (part: number, whole: number): number =>
  whole > 0 ? (part / whole) * 100 : 0;

export function landBudget(siteArea: number, q: Quantities): LandBudget {
  const netArea = q.parcelArea + q.roadArea + q.greenArea;
  return {
    siteArea,
    parcels: q.parcelArea,
    green: q.greenArea,
    road: q.roadArea,
    unallocated: q.unallocatedArea,
    n: q.n,
    grossHa: siteArea / 10_000,
    densityGross: siteArea > 0 ? q.n / (siteArea / 10_000) : 0,
    netArea,
    densityNet: netArea > 0 ? q.n / (netArea / 10_000) : null,
    pctParcels: pct(q.parcelArea, siteArea),
    pctGreen: pct(q.greenArea, siteArea),
    pctRoad: pct(q.roadArea, siteArea),
    pctUnallocated: pct(q.unallocatedArea, siteArea),
    roadPerHome: q.n > 0 ? q.roadArea / q.n : null,
  };
}
