import type { ReactNode } from 'react';
import type { Entrance } from '../../../src/geometry';
import type { Pt } from '../../../src/polygon';
import { polyArea } from '../../../src/polygon';
import { boundaryConflictEdges, boundaryErrors, MAX_SITE_VERTICES } from '../../../src/boundary';
import { formatM2 } from './ui';

export interface BoundaryDraft { pts: Pt[]; closed: boolean; newSite: boolean; entrance?: Entrance }
interface Props {
  draft: BoundaryDraft;
  onChange: (draft: BoundaryDraft) => void;
  onApply: () => void;
  onCancel: () => void;
  review?: ReactNode;
}
export default function BoundaryEditor({ draft, onChange, onApply, onCancel, review }: Props) {
  const conflicts = boundaryConflictEdges(draft.pts);
  const errors = boundaryErrors(draft.pts);
  const changePoint = (i: number, axis: 'x' | 'y', raw: string) => onChange({ ...draft, pts: draft.pts.map((p, j) => j === i ? { ...p, [axis]: raw.trim() === '' ? NaN : Number(raw) } : p) });
  return <section className="boundary-editor" aria-label="Site boundary editor">
    <h2>{draft.newSite ? 'Draw a site' : 'Edit boundary'}</h2>
    <p className="note">{draft.closed ? 'Drag corners or use coordinates below. Midpoint + handles add a corner. Delete a focused corner to remove it.' : 'Place corners on the plan. Click the first corner or Close boundary to finish. Enter also closes the outline.'}</p>
    <div className="boundary-area" aria-live="polite">{draft.closed && !errors.length ? <><strong>{formatM2(polyArea(draft.pts))}</strong><span>Boundary area · {draft.pts.length} vertices</span></> : <><strong>{draft.closed ? 'Invalid outline' : 'Open outline'}</strong><span>{draft.pts.length} vertices · area awaits a valid closed boundary</span></>}</div>
    {review}
    <div className="boundary-actions">
      {!draft.closed && <button type="button" disabled={draft.pts.length < 3} onClick={() => onChange({ ...draft, closed: true })}>Close boundary</button>}
      <button type="button" onClick={onApply} disabled={!draft.closed || errors.length > 0}>Apply boundary</button>
      <button type="button" onClick={onCancel}>Cancel boundary</button>
    </div>
    {draft.closed && errors.length > 0 && <p className="error" role="alert">{errors[0]} The accepted plan is unchanged. {conflicts.length > 0 && `Red edges ${conflicts.map(i => `${i + 1}–${(i + 1) % draft.pts.length + 1}`).join(", ")} need attention. Move a numbered corner or use its Remove button below.`}</p>}
    <p className="note">Local meters, x east / y north. Pointer edits snap to 1 m. Escape cancels. Undo/Redo steps through this draft; Apply creates one plan Undo step. Existing open space and manual lots are preserved when compatible; review the layout consequences above before Apply.</p>
    <div className="boundary-coordinates">
      {draft.pts.map((p, i) => <fieldset key={i} className={conflicts.includes(i) || conflicts.includes((i - 1 + draft.pts.length) % draft.pts.length) ? 'conflicting-corner' : undefined}>
        <legend>Vertex {i + 1}</legend>
        {(['x', 'y'] as const).map((axis) => <label key={axis}>{axis.toUpperCase()} (m)<input aria-label={`Boundary vertex ${i + 1} ${axis}`} type="number" min={0} max={500} step="any" value={Number.isFinite(p[axis]) ? p[axis] : ''} onChange={(e) => changePoint(i, axis, e.target.value)} /></label>)}
        <div className="draftrow">
          <button type="button" disabled={draft.pts.length >= MAX_SITE_VERTICES || !Number.isFinite(p.x + p.y)} onClick={() => { const b = draft.pts[(i + 1) % draft.pts.length]; const pts = [...draft.pts]; pts.splice(i + 1, 0, { x: (p.x + b.x) / 2, y: (p.y + b.y) / 2 }); onChange({ ...draft, pts }); }}>Add after {i + 1}</button>
          <button type="button" disabled={draft.closed && draft.pts.length <= 3} onClick={() => onChange({ ...draft, pts: draft.pts.filter((_, j) => i !== j) })}>Remove {i + 1}</button>
        </div>
      </fieldset>)}
      {!draft.closed && <button type="button" disabled={draft.pts.length >= MAX_SITE_VERTICES} onClick={() => onChange({ ...draft, pts: [...draft.pts, { x: 0, y: 0 }] })}>Add coordinate vertex</button>}
    </div>
  </section>;
}
