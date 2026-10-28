// Gate geometry is shared by placement, routing, validation and drawing.
import { siteBoundary } from './boundary.ts';
import { isSimple, polyInsidePoly, polyOverlapsRect, type Pt } from './polygon.ts';
import type { Entrance, Site } from './geometry.ts';
import type { Rect } from './schema.ts';

export function gateSegment(site: Pick<Site, 'w' | 'h' | 'boundary' | 'entrance'>) {
  const e = site.entrance;
  const pts = siteBoundary(site);
  const a = e.boundaryEdge === undefined ? { x: e.edge === 'east' ? site.w : 0, y: 0 } : pts[e.boundaryEdge];
  const b = e.boundaryEdge === undefined ? { x: a.x, y: site.h } : pts[(e.boundaryEdge + 1) % pts.length];
  if (!a || !b) return null;
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  if (!length) return null;
  const tangent = { x: (b.x - a.x) / length, y: (b.y - a.y) / length };
  const center = { x: a.x + tangent.x * e.offset, y: a.y + tangent.y * e.offset };
  const ends = [-1, 1].map(sign => ({ x: center.x + sign * tangent.x * e.width / 2, y: center.y + sign * tangent.y * e.width / 2 }));
  return { a, b, length, tangent, center, ends };
}

export function entranceLabel(e: Entrance): string {
  return e.boundaryEdge === undefined ? `${e.edge} edge, ${e.offset} m from south, ${e.width} m wide` : `edge ${e.boundaryEdge + 1}, ${Number(e.offset.toFixed(1))} m from corner ${e.boundaryEdge + 1}, ${e.width} m wide`;
}

export function accessConnector(site: Site, obstacle: Rect): { polygon: Pt[]; entry: Pt; axis: 'x' | 'y'; direction: number } | null {
  const gate = gateSegment(site);
  if (!gate) return null;
  const outline = siteBoundary(site);
  const winding = outline.reduce((sum, a, i) => { const b = outline[(i + 1) % outline.length]; return sum + a.x * b.y - b.x * a.y; }, 0);
  const normal = { x: -gate.tangent.y * Math.sign(winding), y: gate.tangent.x * Math.sign(winding) };
  const axis = Math.abs(normal.x) >= Math.abs(normal.y) ? 'x' : 'y';
  const direction = Math.sign(normal[axis]);
  const cross = axis === 'x' ? 'y' : 'x';
  // A short tapered apron connects a sloping gate to an orthogonal street.
  for (const depth of [3, 6, 9, 12, 18, 24]) {
    const face = direction > 0 ? Math.max(...gate.ends.map(p => p[axis])) + depth : Math.min(...gate.ends.map(p => p[axis])) - depth;
    const entry = { ...gate.center, [axis]: face };
    const end1 = { ...entry, [cross]: entry[cross] - 3 };
    const end2 = { ...entry, [cross]: entry[cross] + 3 };
    const sorted = [...gate.ends].sort((a, b) => a[cross] - b[cross]);
    const polygon = [sorted[0], sorted[1], end2, end1];
    if (isSimple(polygon) && polyInsidePoly(polygon, outline) && !polyOverlapsRect(polygon, obstacle)) return { polygon, entry, axis, direction };
  }
  return null;
}
