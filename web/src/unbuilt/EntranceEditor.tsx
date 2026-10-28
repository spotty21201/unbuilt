import { useState } from 'react';
import { generateSpine, validateLayout } from '../../../src/geometry';
import type { Site, Entrance } from '../../../src/geometry';
import { siteBoundary } from '../../../src/boundary';
import { gateSegment } from '../../../src/access';

interface Props { site: Site; onChange: (entrance: Entrance) => void; disabled?: boolean; error?: string; }
export default function EntranceEditor({ site, onChange, disabled, error }: Props) {
  const [candidates, setCandidates] = useState<Array<{ entrance: Entrance; homes: number }> | null>(null);
  const [checkedSite, setCheckedSite] = useState('');
  const identity = JSON.stringify(site);
  const pts = siteBoundary(site);
  const e = site.entrance;
  const gate = gateSegment(site);
  return <section className="entrance-editor" aria-label="Entrance placement">
    <h3>Site access</h3>
    <p className="note">Choose the boundary edge facing an assumed public access. Edge numbers follow the corners on the drawing. External roads and access permissions are unverified.</p>
    <label>Entrance edge<select aria-label="Entrance boundary edge" value={e.boundaryEdge ?? e.edge} disabled={disabled} onChange={event => {
      const value = event.target.value;
      if (value === 'west' || value === 'east') { onChange({ edge: value, offset: site.h / 2, width: e.width }); return; }
      const i = Number(value), a = pts[i], b = pts[(i + 1) % pts.length];
      onChange({ ...e, boundaryEdge: i, offset: Math.hypot(b.x - a.x, b.y - a.y) / 2 });
    }}>
      {e.boundaryEdge === undefined && <option value={e.edge}>Current {e.edge} gate</option>}
      {pts.map((a, i) => { const b = pts[(i + 1) % pts.length]; return <option key={i} value={i}>Edge {i + 1}: corner {i + 1} → {(i + 1) % pts.length + 1} · {Math.hypot(b.x - a.x, b.y - a.y).toFixed(1)} m</option>; })}
    </select></label>
    <label>{e.boundaryEdge === undefined ? 'Distance from south (m)' : `Distance from corner ${e.boundaryEdge + 1} (m)`}<input key={`${e.boundaryEdge ?? e.edge}:${e.offset}`} aria-label="Entrance distance" type="number" min={e.width / 2} max={(gate?.length ?? 0) - e.width / 2} step="any" defaultValue={Number(e.offset.toFixed(2))} disabled={disabled} onBlur={event => {
      const value = event.target.value.trim() ? Number(event.target.value) : NaN;
      if (Number.isFinite(value) && Math.abs(value - e.offset) > 0.01) onChange({ ...e, offset: value });
      else event.target.value = String(Number(e.offset.toFixed(2)));
    }} onKeyDown={event => { if (event.key === 'Enter') event.currentTarget.blur(); }} /></label>
    <button type="button" disabled={disabled} onClick={() => {
      const fits = pts.flatMap((a, i) => {
        const b = pts[(i + 1) % pts.length], length = Math.hypot(b.x - a.x, b.y - a.y);
        if (length < e.width) return [];
        const entrance = { ...e, boundaryEdge: i, offset: length / 2 };
        const candidate = { ...site, entrance };
        const layout = generateSpine(candidate);
        return validateLayout(candidate, layout).length ? [] : [{ entrance, homes: layout.parcels.length }];
      });
      setCandidates(fits); setCheckedSite(identity);
    }}>Check mid-edge entrances</button>
    {candidates && checkedSite === identity && <div className="entrance-candidates" role="status"><p className="note">Measured Spine checks at edge midpoints only. These are geometric options, not confirmed public access or traffic approvals.</p>{candidates.length ? candidates.map(candidate => <button type="button" key={candidate.entrance.boundaryEdge} disabled={disabled} onClick={() => onChange(candidate.entrance)}>Use edge {candidate.entrance.boundaryEdge! + 1} · {candidate.homes} homes</button>) : <p className="error">No tested midpoint produced a valid layout. Try moving a gate along an edge, or review the park location and boundary. Other positions have not been ruled out.</p>}</div>}
    <p className={error ? 'error' : 'note'} role={error ? 'status' : undefined}>{error ?? `${e.width} m gate. A measured apron connects boundary-edge entrances to 6 m orthogonal Spine streets; fixed Loop does not support these gates.`}</p>
  </section>;
}
