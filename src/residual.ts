// Residual regions are measured land, not generated or approved parcels.
import clipping from 'polygon-clipping';
import type { MultiPolygon, Pair } from 'polygon-clipping';
import { rectCorners, type Pt } from './polygon.ts';
import { deriveQuantities, layoutOpenSpaces, type Site, type Layout, type LotEdits } from './geometry.ts';
import { spaceBounds } from './open-spaces.ts';
import { siteBoundary } from './boundary.ts';
import { surfaceArea, surfaceFrontage, type RoadSurface } from './road-surfaces.ts';

export type ResidualClass = 'developable' | 'too-small' | 'inaccessible' | 'reserved-clearance';
export interface ResidualFragment {
  pts: Pt[];
  holes: Pt[][];
  area: number;
  cls: ResidualClass;
}
export interface ResidualReport {
  fragments: ResidualFragment[];
  totals: Record<ResidualClass, { count: number; area: number }>;
  remainderArea: number;
}
export interface ResidualInput {
  boundary: Pt[];
  parcels: Pt[][];
  pavement: Pt[][];
  pavementSurface?: RoadSurface;
  spaces: Pt[][];
  clearanceBuffers: Pt[][];
  minLotArea: number;
}
const ring = (pts: Pt[]): Pair[] => pts.map(p => [p.x,p.y]);
const polygon = (pts: Pt[]): MultiPolygon => [[ring(pts)]];
const coordinates = (surface: RoadSurface): MultiPolygon => surface.map(p => p.map(ring));
const surface = (value: MultiPolygon): RoadSurface => value.map(p => p.map(r => r.slice(0,-1).map(([x,y]) => ({x,y}))));

export function classifyResidual(input: ResidualInput): ResidualReport {
  const report: ResidualReport = {
    fragments: [], remainderArea: 0,
    totals: { developable:{count:0,area:0}, 'too-small':{count:0,area:0}, inaccessible:{count:0,area:0}, 'reserved-clearance':{count:0,area:0} },
  };
  if (input.boundary.length < 3) return report;
  if (!Number.isFinite(input.minLotArea) || input.minLotArea <= 0) throw Error('Residual assessment needs a positive minimum lot area.');
  const pavementInputs = [coordinates(input.pavementSurface ?? []), ...input.pavement.filter(p => p.length >= 3).map(polygon)].filter(p => p.length);
  const pavement = pavementInputs.length ? clipping.union(pavementInputs[0], ...pavementInputs.slice(1)) : [];
  const road = surface(pavement);
  const blockers = [pavement, ...[...input.parcels,...input.spaces].filter(p => p.length >= 3).map(polygon)].filter(p => p.length);
  const site = polygon(input.boundary);
  const remainder = blockers.length ? clipping.difference(site, ...blockers) : clipping.union(site);
  for (const region of surface(remainder)) {
    const area = surfaceArea([region]);
    if (area <= 1e-9) continue;
    // Flag the whole connected region, but only if real land (excluding
    // holes) intersects the conservative open-space exclusion.
    const clearance = input.clearanceBuffers.some(buffer => buffer.length >= 3 && surfaceArea(surface(clipping.intersection(coordinates([region]),polygon(buffer)))) > 1e-9);
    const cls: ResidualClass = clearance ? 'reserved-clearance' : area < input.minLotArea ? 'too-small' : region.some(r => surfaceFrontage(road,r) > .001) ? 'developable' : 'inaccessible';
    report.fragments.push({pts:region[0],holes:region.slice(1),area,cls});
    report.totals[cls].count++;
    report.totals[cls].area += area;
    report.remainderArea += area;
  }
  return report;
}

// Use the same parcel edits, road holes and apron as the displayed quantities.
export function residualForLayout(site: Site, layout: Layout, edits: LotEdits, minLotArea: number): ResidualReport {
  if (layout.empty || layout.supportError) throw Error('Residual assessment needs an available layout.');
  const spaces = layoutOpenSpaces(layout);
  const report = classifyResidual({
    boundary: siteBoundary(site),
    parcels: layout.parcels.map((p,i) => edits.get(i) ?? rectCorners(p)),
    pavement: [...(layout.roadSurface ? [] : layout.roads.map(rectCorners)), ...(layout.accessConnector ? [layout.accessConnector] : [])],
    pavementSurface: layout.roadSurface,
    spaces: spaces.map(s => s.pts),
    clearanceBuffers: spaces.map(s => rectCorners(spaceBounds(s.pts,site.planning?.greenBuffer ?? 0))),
    minLotArea,
  });
  if (Math.abs(report.remainderArea - deriveQuantities(site,layout,edits).unallocatedArea) > .01) throw Error('Residual geometry does not reconcile with the displayed remainder. Review the plan geometry.');
  return report;
}
