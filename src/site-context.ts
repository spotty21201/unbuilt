// Site references are declared context, never obstacles, permissions or priced geometry.
import { boundaryErrors } from './boundary.ts';
import type { Pt } from './polygon.ts';
export type ImportUnit = 'm' | 'mm' | 'ft';
export const UNIT_METRES: Record<ImportUnit, number> = { m: 1, mm: .001, ft: .3048 };
export interface BoundarySource { name: string; format: 'csv' | 'dxf'; unit: ImportUnit; layer: string; origin: Pt; rebased: boolean; originalBoundary: Pt[] }
export interface SurveyReference {
  name: string; fingerprint: string; page: number; width: number; height: number;
  a: Pt; b: Pt; distance: number; anchor: Pt; direction: number;
}
export interface ContextNote {
  id: string; kind: 'street' | 'feature' | 'access'; label: string; source: string;
  confidence: 'assumed' | 'documented'; note: string; points: Pt[];
}
export interface SiteContext { survey?: SurveyReference; boundarySource?: BoundarySource; notes: ContextNote[] }
export interface BoundaryCandidate { layer: string; points: Pt[] }
const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const point = (v: unknown): v is Pt => record(v) && Object.keys(v).every(k => k === 'x' || k === 'y') && finite(v.x) && finite(v.y) && Math.abs(v.x) <= 1e9 && Math.abs(v.y) <= 1e9;
const text = (v: unknown, max: number): v is string => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
const keys = (v: Record<string, unknown>, allowed: string[]) => Object.keys(v).every(k => allowed.includes(k));
export function surveyErrors(s: SurveyReference): string[] {
  if (!record(s) || !keys(s, ['name', 'fingerprint', 'page', 'width', 'height', 'a', 'b', 'distance', 'anchor', 'direction']) || !text(s.name, 200) || !text(s.fingerprint, 100) || !Number.isInteger(s.page) || s.page < 1 || s.page > 10000 || !finite(s.width) || !finite(s.height) || s.width < 1 || s.height < 1 || s.width * s.height > 20e6) return ['Survey source or pixel dimensions are invalid.'];
  if (![s.a, s.b, s.anchor].every(point) || !finite(s.distance) || s.distance <= 0 || s.distance > 500 || !finite(s.direction) || Math.abs(s.direction) > 360) return ['Set two points, a known distance greater than 0 and at most 500 m, and a direction between −360° and 360°.'];
  if ([s.a, s.b].some(p => p.x < 0 || p.y < 0 || p.x > s.width || p.y > s.height) || Math.hypot(s.a.x - s.b.x, s.a.y - s.b.y) < 2) return ['Calibration points must be inside the image and at least 2 pixels apart.'];
  if (s.anchor.x < 0 || s.anchor.x > 500 || s.anchor.y < 0 || s.anchor.y > 500) return ['Point A must be anchored within the local 0–500 m workspace.'];
  return [];
}
export function surveyTransform(s: SurveyReference) {
  const angle = s.direction * Math.PI / 180 - Math.atan2(s.a.y - s.b.y, s.b.x - s.a.x);
  const k = s.distance / Math.hypot(s.b.x - s.a.x, s.b.y - s.a.y), c = Math.cos(angle) * k, t = Math.sin(angle) * k;
  return { a: c, b: t, c: t, d: -c, e: s.anchor.x - c * s.a.x - t * s.a.y, f: s.anchor.y - t * s.a.x + c * s.a.y };
}
export function surveyPoint(s: SurveyReference, p: Pt): Pt { const m = surveyTransform(s); return { x: m.a * p.x + m.c * p.y + m.e, y: m.b * p.x + m.d * p.y + m.f }; }
export function contextErrors(raw: unknown): string[] {
  if (!record(raw) || !keys(raw, ['survey', 'boundarySource', 'notes']) || !Array.isArray(raw.notes) || raw.notes.length > 100) return ['Site context supports at most 100 annotations and known reference fields only.'];
  if (raw.survey !== undefined) { const e = surveyErrors(raw.survey as SurveyReference); if (e.length) return e; }
  if (raw.boundarySource !== undefined) {
    const b = raw.boundarySource;
    if (!record(b) || !keys(b, ['name', 'format', 'unit', 'layer', 'origin', 'rebased', 'originalBoundary']) || !text(b.name, 200) || !['csv', 'dxf'].includes(b.format as string) || !['m', 'mm', 'ft'].includes(b.unit as string) || typeof b.layer !== 'string' || b.layer.length > 200 || !point(b.origin) || typeof b.rebased !== 'boolean' || !Array.isArray(b.originalBoundary) || !b.originalBoundary.every(point) || boundaryErrors(b.originalBoundary).length) return ['Boundary source information is invalid.'];
  }
  const ids = new Set<string>();
  for (const n of raw.notes) {
    if (!record(n) || !keys(n, ['id', 'kind', 'label', 'source', 'confidence', 'note', 'points']) || !text(n.id, 100) || ids.has(n.id) || !['street', 'feature', 'access'].includes(n.kind as string) || !text(n.label, 100) || !text(n.source, 300) || !['assumed', 'documented'].includes(n.confidence as string) || typeof n.note !== 'string' || n.note.length > 1000 || !Array.isArray(n.points) || n.points.length < (n.kind === 'street' ? 2 : 1) || n.points.length > 20 || !n.points.every(point) || n.points.some((p: Pt) => p.x < -500 || p.x > 1000 || p.y < -500 || p.y > 1000)) return ['Each annotation needs a unique ID, label, source and valid local points (−500 to 1,000 m); streets need at least two points.'];
    if (n.kind !== 'street' && n.points.length !== 1) return ['Feature and access markers each use one location.'];
    const pts = n.points as Pt[];
    if (pts.some((p, i) => i > 0 && Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y) < .01)) return ['Street points must be distinct.'];
    ids.add(n.id);
  }
  return [];
}
function numeric(value: string): number {
  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/.test(value.trim())) throw Error('Coordinates must be finite decimal numbers.');
  const v = Number(value); if (!Number.isFinite(v) || Math.abs(v) > 1e9) throw Error('Coordinate magnitude exceeds the supported import range.'); return v;
}
export function parseBoundaryCsv(value: string): BoundaryCandidate[] {
  const lines = value.replace(/^\uFEFF/, '').split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 3 || lines.length > 66) throw Error('CSV needs 3–64 ordered vertices, with an optional x,y header and repeated closing point.');
  const delimiter = lines[0].includes(';') ? ';' : lines[0].includes('\t') ? '\t' : ',';
  if (/^(x|easting)\s*[,;\t]\s*(y|northing)$/i.test(lines[0].trim())) lines.shift();
  const points = lines.map((l, i) => { const cols = l.split(delimiter); if (cols.length !== 2) throw Error(`CSV row ${i + 1} needs exactly two columns: x,y.`); return { x: numeric(cols[0]), y: numeric(cols[1]) }; });
  return [{ layer: 'CSV boundary', points }];
}
export function prepareBoundary(points: Pt[], unit: ImportUnit, rebase: boolean) {
  const factor = UNIT_METRES[unit]; if (!factor) throw Error('Choose metres, millimetres or feet.');
  let pts = points.map(p => ({ x: p.x * factor, y: p.y * factor }));
  if (pts.length > 1 && pts[0].x === pts.at(-1)!.x && pts[0].y === pts.at(-1)!.y) pts = pts.slice(0, -1);
  if (pts.length < 3 || pts.length > 64 || !pts.every(point)) throw Error('Boundary needs 3–64 finite vertices.');
  const origin = rebase ? { x: Math.min(...pts.map(p => p.x)), y: Math.min(...pts.map(p => p.y)) } : { x: 0, y: 0 };
  pts = pts.map(p => ({ x: p.x - origin.x, y: p.y - origin.y }));
  const errors = boundaryErrors(pts); if (errors.length) throw Error(`${errors[0]} Check units and the local-origin option. Sites must fit within 500 × 500 m.`);
  return { points: pts, origin };
}
export function parseBoundaryDxf(value: string): { candidates: BoundaryCandidate[]; unit: ImportUnit | null; warnings: string[] } {
  if (value.startsWith('AutoCAD Binary DXF')) throw Error('Binary DXF is unsupported. Export an ASCII DXF with a closed 2D polyline.');
  const lines = value.replace(/^\uFEFF/, '').trimEnd().split(/\r?\n/);
  if (lines.length % 2 || lines.length > 200000) throw Error('DXF must contain valid ASCII group-code/value pairs (up to 100,000 pairs).');
  const pairs = Array.from({ length: lines.length / 2 }, (_, i) => { if (!/^\d+$/.test(lines[i * 2].trim())) throw Error('Invalid DXF group code.'); return { code: Number(lines[i * 2]), value: lines[i * 2 + 1].trim() }; });
  let section = '', unit: ImportUnit | null = null;
  const entities: { type: string; data: typeof pairs }[] = [];
  for (let i = 0; i < pairs.length; i++) {
    const p = pairs[i];
    if (p.code === 0 && p.value === 'SECTION') { section = pairs[i + 1]?.value ?? ''; continue; }
    if (p.code === 0 && p.value === 'ENDSEC') { section = ''; continue; }
    if (section === 'HEADER' && p.code === 9 && p.value === '$INSUNITS') unit = ({ 2: 'ft', 4: 'mm', 6: 'm' } as Record<string, ImportUnit>)[pairs[i + 1]?.value] ?? null;
    if (section === 'ENTITIES' && p.code === 0) entities.push({ type: p.value, data: [] });
    else if (section === 'ENTITIES' && entities.length) entities.at(-1)!.data.push(p);
  }
  const candidates: BoundaryCandidate[] = [], warnings: string[] = [];
  for (let i = 0; i < entities.length; i++) {
    const e = entities[i]; if (!['LWPOLYLINE', 'POLYLINE'].includes(e.type)) continue;
    const get = (code: number, fallback = '0') => e.data.find(p => p.code === code)?.value ?? fallback;
    const layer = get(8, 'Unnamed layer');
    try {
      if (numeric(get(67)) !== 0 || get(410, 'Model').toLowerCase() !== 'model') throw Error('paper-space polyline');
      const flags = numeric(get(70)); if (!Number.isInteger(flags) || (flags & ~129)) throw Error('3D, fitted or mesh polyline');
      if (numeric(get(210)) !== 0 || numeric(get(220)) !== 0 || numeric(get(230, '1')) !== 1) throw Error('rotated extrusion plane');
      const points: Pt[] = [];
      if (e.type === 'LWPOLYLINE') {
        for (const p of e.data) {
          if (p.code === 42 && numeric(p.value) !== 0) throw Error('curved/bulged edge');
          if (p.code === 10) points.push({ x: numeric(p.value), y: NaN });
          if (p.code === 20) { if (!points.length || Number.isFinite(points.at(-1)!.y)) throw Error('invalid vertex sequence'); points.at(-1)!.y = numeric(p.value); }
        }
        if (e.data.some(p => p.code === 90) && numeric(get(90)) !== points.length) throw Error('vertex count does not match the DXF declaration');
      } else {
        while (entities[i + 1]?.type === 'VERTEX') {
          const d = entities[++i].data;
          if (d.some(p => (p.code === 42 || p.code === 30 || p.code === 70) && numeric(p.value) !== 0)) throw Error('curved or 3D vertex');
          points.push({ x: numeric(d.find(p => p.code === 10)?.value ?? ''), y: numeric(d.find(p => p.code === 20)?.value ?? '') });
        }
        if (entities[i + 1]?.type !== 'SEQEND') throw Error('missing polyline terminator');
      }
      if (!(flags & 1)) throw Error('open polyline');
      if (points.length < 3 || points.length > 65 || !points.every(point)) throw Error('not 3–64 finite vertices');
      if (candidates.length >= 200) throw Error('more than 200 boundary candidates');
      candidates.push({ layer: layer.slice(0, 200), points });
    } catch (error) { warnings.push(`${layer}: skipped ${error instanceof Error ? error.message : 'unsupported polyline'}.`); }
  }
  if (!candidates.length) throw Error(`No supported closed 2D boundary found. ${warnings.slice(0, 3).join(' ')} Export a straight closed LWPOLYLINE or 2D POLYLINE in model space.`);
  return { candidates, unit, warnings: warnings.slice(0, 20) };
}
