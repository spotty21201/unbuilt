import type { Rect } from '../../../src/schema';
import { lotKey } from '../../../src/geometry';
import type { Entrance, Layout, LotEdits, Site, StableEdits } from '../../../src/geometry';
import type { Pt } from '../../../src/polygon';

export interface WorkingSpec {
  family: 'spine' | 'loop';
  frontage: number;
}

export interface DisplayedPlan {
  layout: Layout;
  label: string;
}

export function parcelKey(p: Rect): string {
  return lotKey(p);
}

export function siteWithGreen(site: Site, green: Rect): Site {
  return { ...site, green: { ...green } };
}

export function siteWithEntrance(site: Site, entrance: Entrance): Site {
  return { ...site, entrance: { ...entrance } };
}

// Deep copy of stable (base-rect-keyed) edits for snapshots: plain Records
// so JSON comparison and export see coordinates, never Map internals.
export function copyLotEdits(rec: Record<string, Pt[]>): Record<string, Pt[]> {
  const out: Record<string, Pt[]> = {};
  for (const [k, v] of Object.entries(rec)) out[k] = v.map((p) => ({ ...p }));
  return out;
}

// Index-addressed copy of one layout's carried edits, for canvases and the
// run snapshot (indices are valid only for the layout they were mapped from).
export function indexLotsRecord(edits: LotEdits): Record<number, Pt[]> {
  const rec: Record<number, Pt[]> = {};
  for (const [k, v] of edits) rec[k] = v.map((p) => ({ ...p }));
  return rec;
}

export type { StableEdits };

export function formatRp(v: number): string {
  const bn = v / 1_000_000_000;
  return `Rp${bn.toFixed(2)}bn`;
}

export function formatM2(v: number): string {
  return `${Math.round(v).toLocaleString('en-US')} m²`;
}

// The deterministic tool server runs beside the static app (same host,
// port 5174 in this increment). Absolute base because no dev proxy exists;
// measured tools can compute locally; AI failures remain explicit.
export function serverBase(): string {
  return `${window.location.protocol}//${window.location.hostname}:5174`;
}

export function formatGap(v: number): string {
  if (v > 0) return `Shortfall ${formatRp(v)}`;
  if (v < 0) return `Headroom ${formatRp(-v)}`;
  return 'Meets expectation exactly';
}

export const housingColor=(id:string)=>['#dcd0ec','#bcdce3','#f0dab2','#c4dfc7','#e9c7cc'][Number(id.slice(1))%5];

export const PHASE_COLORS=['#467db0','#9b6aad','#cb8141','#3c9781','#b45973','#758b40','#8a7760','#597486'];
