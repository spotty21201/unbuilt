import type { Rect } from '../../../src/schema';
import type { Entrance, Layout, LotEdits, Site } from '../../../src/geometry';
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
  return `${p.x},${p.y},${p.w},${p.h}`;
}

export function siteWithGreen(site: Site, green: Rect): Site {
  return { ...site, green: { ...green } };
}

export function siteWithEntrance(site: Site, entrance: Entrance): Site {
  return { ...site, entrance: { ...entrance } };
}

export function lotEditsMap(rec: Record<number, Pt[]>): LotEdits {
  return new Map(Object.entries(rec).map(([k, v]) => [Number(k), v.map((p) => ({ ...p }))]));
}

export function lotEditsRecord(edits: LotEdits): Record<number, Pt[]> {
  const rec: Record<number, Pt[]> = {};
  for (const [k, v] of edits) rec[k] = v.map((p) => ({ ...p }));
  return rec;
}

// Deep copy for snapshots: Records (not Maps) so JSON comparison and export
// see plain coordinates.
export function copyLotEdits(rec: Record<number, Pt[]>): Record<number, Pt[]> {
  return lotEditsRecord(lotEditsMap(rec));
}

export function formatRp(v: number): string {
  const bn = v / 1_000_000_000;
  return `Rp${bn.toFixed(2)}bn`;
}

export function formatM2(v: number): string {
  return `${Math.round(v).toLocaleString('en-US')} m²`;
}

export function formatGap(v: number): string {
  if (v > 0) return `Shortfall ${formatRp(v)}`;
  if (v < 0) return `Headroom ${formatRp(-v)}`;
  return 'Meets expectation exactly';
}
