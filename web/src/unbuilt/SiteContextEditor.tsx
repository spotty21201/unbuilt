import { useEffect, useRef, useState } from 'react';
import { polyArea, type Pt } from '../../../src/polygon';
import { contextErrors, parseBoundaryCsv, parseBoundaryDxf, prepareBoundary, surveyErrors, type BoundaryCandidate, type BoundarySource, type ContextNote, type ImportUnit, type SiteContext, type SurveyReference } from '../../../src/site-context';
import { newProjectId } from '../../../src/projects';
import { readSurvey, type SurveyRaster } from './survey-file';
interface Props {
  context: SiteContext; raster: SurveyRaster | null; boundary: Pt[]; disabled: boolean; boundaryLocked: boolean; showSurvey: boolean; onShowSurvey: (show: boolean) => void;
  onChange: (context: SiteContext, message: string) => void;
  onRaster: (raster: SurveyRaster) => void;
  onBoundary: (points: Pt[], source: BoundarySource) => void;
  onDirty: (dirty: boolean) => void;
  onClose: () => void;
  noteDraft: ContextNote | null; onNoteDraft: (draft: ContextNote | null) => void;
  picking: boolean; onPicking: (value: boolean) => void;
}
export default function SiteContextEditor(p: Props) {
  const [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const [survey, setSurvey] = useState<SurveyReference | null>(null);
  const [calibrating, setCalibrating] = useState(false);
  const [pick, setPick] = useState<'a' | 'b' | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(p.raster?.file ?? null);
  const [page, setPage] = useState(String(p.raster?.page ?? 1));
  const [boundary, setBoundary] = useState<{ name: string; format: 'csv' | 'dxf'; candidates: BoundaryCandidate[]; warnings: string[] } | null>(null);
  const [candidate, setCandidate] = useState(''), [unit, setUnit] = useState<ImportUnit | ''>('m'), [rebase, setRebase] = useState(false);
  const ticket = useRef(0), draftUrl = useRef<string | null>(null);
  const [draftRaster, setDraftRaster] = useState<SurveyRaster | null>(null);
  const raster = draftRaster ?? p.raster;
  const { onDirty } = p;
  const pending = busy || calibrating || !!boundary || !!p.noteDraft;
  useEffect(() => { onDirty(pending); }, [pending, onDirty]);
  useEffect(() => () => { ticket.current++; if (draftUrl.current) URL.revokeObjectURL(draftUrl.current); }, []);
  const setIssue = (e: unknown) => setError(e instanceof Error ? e.message : 'That file could not be read. Accepted work is unchanged.');
  const loadSurvey = async (file: File, pageNumber?: number) => {
    const request = ++ticket.current; setBusy(true); setError('');
    try {
      let raster = await readSurvey(file, pageNumber ?? 1);
      if (pageNumber === undefined && p.context.survey?.fingerprint === raster.fingerprint && p.context.survey.page !== raster.page) { URL.revokeObjectURL(raster.url); raster = await readSurvey(file, p.context.survey.page); }
      if (request !== ticket.current) { URL.revokeObjectURL(raster.url); return; }
      setSourceFile(file); setPage(String(raster.page));
      if (draftUrl.current) URL.revokeObjectURL(draftUrl.current); draftUrl.current = null; setDraftRaster(null);
      if (p.context.survey?.fingerprint === raster.fingerprint && p.context.survey.page === raster.page && p.context.survey.width === raster.width && p.context.survey.height === raster.height) { p.onRaster(raster); setSurvey(null); setCalibrating(false); }
      else {
        draftUrl.current = raster.url; setDraftRaster(raster);
        setSurvey({ name: raster.name, fingerprint: raster.fingerprint, page: raster.page, width: raster.width, height: raster.height, a: { x: raster.width * .25, y: raster.height * .5 }, b: { x: raster.width * .75, y: raster.height * .5 }, distance: NaN, anchor: { x: 20, y: 20 }, direction: 0 });
        setCalibrating(true);
      }
    } catch (e) { if (request === ticket.current) setIssue(e); } finally { if (request === ticket.current) setBusy(false); }
  };
  const importBoundary = async (file: File) => {
    const request = ++ticket.current; setBusy(true); setError('');
    try {
      if (file.size > 2_000_000) throw Error('Boundary files must be smaller than 2 MB.');
      const content = await file.text(); if (request !== ticket.current) return;
      const dxf = /\.dxf$/i.test(file.name);
      const result = dxf ? parseBoundaryDxf(content) : { candidates: parseBoundaryCsv(content), unit: 'm' as const, warnings: [] };
      setBoundary({ name: file.name.slice(0, 200), format: dxf ? 'dxf' : 'csv', candidates: result.candidates, warnings: result.warnings });
      setCandidate(result.candidates.length === 1 ? '0' : ''); setUnit(result.unit ?? ''); setRebase(false);
    } catch (e) { if (request === ticket.current) setIssue(e); } finally { if (request === ticket.current) setBusy(false); }
  };
  let prepared: ReturnType<typeof prepareBoundary> | null = null, boundaryIssue = '';
  if (boundary && candidate !== '' && unit) { try { prepared = prepareBoundary(boundary.candidates[Number(candidate)].points, unit, rebase); } catch (e) { boundaryIssue = e instanceof Error ? e.message : 'Invalid boundary.'; } }
  const currentSurvey = survey ?? p.context.survey;
  const surveyIssue = survey ? surveyErrors(survey)[0] : '';
  const noteIssue = p.noteDraft ? contextErrors({ notes: [p.noteDraft] })[0] : '';
  const cancel = () => { ticket.current++; setBusy(false); if (draftUrl.current) URL.revokeObjectURL(draftUrl.current); draftUrl.current = null; setDraftRaster(null); setSourceFile(p.raster?.file ?? null); setPage(String(p.raster?.page ?? 1)); setCalibrating(false); setSurvey(null); setBoundary(null); p.onNoteDraft(null); p.onPicking(false); setError(''); };
  return <section className="site-context-editor" aria-label="Site context editor">
    <header><h2>Site context</h2><button type="button" disabled={pending} onClick={p.onClose}>Back to plan</button></header>
    <p className="note">Reference layers support planning review. They do not create development streets, reserve land, change costs or establish legal access.</p>
    {error && <p className="error" role="alert">{error} Accepted plan and context are unchanged.</p>}
    <fieldset disabled={p.disabled || busy}><legend>Survey reference</legend>
      <label>Import or reattach a survey (PDF, PNG, JPEG)<input type="file" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" disabled={calibrating || !!boundary || !!p.noteDraft} onChange={e => { const file = e.target.files?.[0]; e.target.value = ''; if (file) void loadSurvey(file); }} /></label>
      <p className="note">PDFs render one selected page. Set the scale from a known distance; a printed scale or photograph alone does not verify accuracy. Files up to 20 MB; images up to 20 megapixels.</p>
      {raster && sourceFile && raster.pages > 1 && <div className="context-grid"><label>PDF page<input type="number" min={1} max={raster.pages} value={page} onChange={e => setPage(e.target.value)} /></label><button type="button" onClick={() => void loadSurvey(sourceFile, Number(page))}>Load PDF page</button><span>{raster.pages} pages in file. Changing page resets pending calibration.</span></div>}
      {calibrating && survey && <p className="context-source">Draft reference: {survey.name} · page {survey.page} · {survey.width} × {survey.height} pixels. Calibration changes are not applied.</p>}
      {p.context.survey && <p className="context-source">Calibrated: {p.context.survey.name}, page {p.context.survey.page}. {p.raster?.fingerprint === p.context.survey.fingerprint && p.raster.page === p.context.survey.page ? 'Reference attached.' : 'Reattach the same file/page to display it; calibration is saved.'}</p>}
      {p.context.survey && <p className="context-source">Accepted declared scale: {p.context.survey.distance} m between A and B · {(p.context.survey.distance / Math.hypot(p.context.survey.b.x - p.context.survey.a.x, p.context.survey.b.y - p.context.survey.a.y)).toLocaleString('en-US', { maximumSignificantDigits: 6 })} m/pixel. A at ({p.context.survey.anchor.x}, {p.context.survey.anchor.y}) m; direction {p.context.survey.direction}°.</p>}
      {currentSurvey && raster && raster.fingerprint === currentSurvey.fingerprint && <>
        <svg className="survey-preview" viewBox={`0 0 ${raster.width} ${raster.height}`} role="img" aria-label="Survey calibration preview" onClick={e => {
          if (!pick || !survey) return;
          const svg = e.currentTarget, pos = new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.getScreenCTM()!.inverse());
          setSurvey({ ...survey, [pick]: { x: Math.max(0, Math.min(survey.width, pos.x)), y: Math.max(0, Math.min(survey.height, pos.y)) } }); setPick(pick === 'a' ? 'b' : null);
        }}>
          <image href={raster.url} width={raster.width} height={raster.height} />
          <line x1={currentSurvey.a.x} y1={currentSurvey.a.y} x2={currentSurvey.b.x} y2={currentSurvey.b.y} stroke="#075cff" strokeWidth={4} vectorEffect="non-scaling-stroke" />
          {(['a', 'b'] as const).map(key => <g key={key}><circle cx={currentSurvey[key].x} cy={currentSurvey[key].y} r={raster!.width / 70} fill="#fff" stroke="#075cff" strokeWidth={2} vectorEffect="non-scaling-stroke" /><text x={currentSurvey[key].x} y={currentSurvey[key].y - raster!.width / 40} fill="#075cff" fontSize={raster!.width / 25}>{key.toUpperCase()}</text></g>)}
        </svg>
        {!calibrating && <button type="button" disabled={!!boundary || !!p.noteDraft} onClick={() => { setSurvey(p.context.survey!); setCalibrating(true); }}>Edit survey calibration</button>}
      </>}
      {calibrating && survey && <>
        <p className="note">Choose two points with a known separation. Their pixel coordinates can also be entered with the keyboard. Calibration uses one uniform scale and rotation; it does not correct a distorted scan.</p>
        <button type="button" aria-pressed={!!pick} onClick={() => setPick('a')}>Pick calibration points</button>{pick && <p role="status">Click point {pick.toUpperCase()} on the survey preview.</p>}
        <div className="context-grid">{(['a', 'b'] as const).map(key => <fieldset key={key}><legend>Point {key.toUpperCase()} pixels</legend>{(['x', 'y'] as const).map(axis => <label key={axis}>{axis.toUpperCase()} (px)<input aria-label={`Calibration ${key.toUpperCase()} ${axis}`} type="number" step="any" value={Number.isFinite(survey[key][axis]) ? survey[key][axis] : ''} onChange={e => setSurvey({ ...survey, [key]: { ...survey[key], [axis]: e.target.value === '' ? NaN : Number(e.target.value) } })} /></label>)}</fieldset>)}</div>
        <label>Known A–B distance (m)<input type="number" step="any" min={.001} max={500} value={Number.isFinite(survey.distance) ? survey.distance : ''} onChange={e => setSurvey({ ...survey, distance: e.target.value === '' ? NaN : Number(e.target.value) })} /></label>
        <div className="context-grid">{(['x', 'y'] as const).map(axis => <label key={axis}>A local {axis.toUpperCase()} (m)<input type="number" step="any" value={Number.isFinite(survey.anchor[axis]) ? survey.anchor[axis] : ''} onChange={e => setSurvey({ ...survey, anchor: { ...survey.anchor, [axis]: e.target.value === '' ? NaN : Number(e.target.value) } })} /></label>)}</div>
        <label>A→B direction (degrees)<input type="number" step="any" min={-360} max={360} value={Number.isFinite(survey.direction) ? survey.direction : ''} onChange={e => setSurvey({ ...survey, direction: e.target.value === '' ? NaN : Number(e.target.value) })} /></label><p className="note">0° east, 90° north in the local plan. Position and direction are your declared assumptions; this does not establish a geographic reference.</p>
        {surveyIssue && <p className="error" role="alert">{surveyIssue}</p>}
        <button type="button" disabled={!!surveyIssue} onClick={() => { if (draftRaster) { p.onRaster(draftRaster); draftUrl.current = null; setDraftRaster(null); } p.onChange({ ...p.context, survey }, 'Survey calibration applied. Reference media remains session-only; retain the original file.'); setCalibrating(false); setSurvey(null); setPick(null); }}>Apply survey calibration</button><button type="button" onClick={cancel}>Cancel context edit</button>
      </>}
      {p.context.survey && <label><input type="checkbox" checked={p.showSurvey} onChange={e => p.onShowSurvey(e.target.checked)} />Show calibrated survey on plan</label>}
      {!pending && p.context.survey && <button type="button" onClick={() => { const { survey: omitted, ...rest } = p.context; void omitted; p.onChange(rest, 'Survey calibration removed. Undo is available while this project remains open.'); }}>Remove survey calibration</button>}
    </fieldset>
    {p.boundaryLocked && <p className="note">The site boundary is locked. Unlock it in the plan inspector before importing an outline.</p>}
    <fieldset disabled={p.disabled || p.boundaryLocked || busy || calibrating || !!p.noteDraft}><legend>Boundary file</legend>
      <label>Import boundary (CSV or ASCII DXF)<input type="file" accept=".csv,.dxf,text/csv" disabled={!!boundary} onChange={e => { const file = e.target.files?.[0]; e.target.value = ''; if (file) void importBoundary(file); }} /></label>
      <p className="note">CSV: ordered x,y or easting,northing pairs, optional header. DXF: closed straight model-space LWPOLYLINE or 2D POLYLINE. Choose one outline; holes, curves, blocks, DWG and 3D boundaries are unsupported.</p>
      {boundary && <>
        <label>Boundary outline<select aria-label="Boundary outline" value={candidate} onChange={e => setCandidate(e.target.value)}><option value="">Choose an outline</option>{boundary.candidates.map((c, i) => <option key={i} value={i}>{i + 1} · {c.layer} · {c.points.length} points</option>)}</select></label>
        <label>File coordinate units<select aria-label="File coordinate units" value={unit} onChange={e => setUnit(e.target.value as ImportUnit | '')}><option value="">Confirm file units</option><option value="m">Metres</option><option value="mm">Millimetres</option><option value="ft">Feet (international)</option></select></label>
        <label><input type="checkbox" checked={rebase} onChange={e => setRebase(e.target.checked)} />Move this outline to local origin (0,0)</label>
        <p className="note">Confirm units even if suggested by DXF metadata. Moving to the local origin translates the outline without changing its size or angles. Original origin is retained as source information. All other DXF entities are omitted.</p>
        {boundary.warnings.map((w, i) => <p className="note" key={i}>{w}</p>)}
        {boundaryIssue && <p className="error" role="alert">{boundaryIssue}</p>}
        {prepared && <p className="context-source">{prepared.points.length} corners · {polyArea(prepared.points).toLocaleString('en-US', { maximumFractionDigits: 2 })} m². Source origin: {prepared.origin.x}, {prepared.origin.y} m.</p>}
        <button type="button" disabled={!prepared} onClick={() => { if (!prepared || !unit) return; p.onDirty(false); p.onBoundary(prepared.points, { name: boundary.name, format: boundary.format, unit, layer: boundary.candidates[Number(candidate)].layer, rebased: rebase, origin: prepared.origin, originalBoundary: prepared.points }); setBoundary(null); }}>Review imported boundary</button><button type="button" onClick={cancel}>Cancel boundary import</button>
      </>}
      {p.context.boundarySource && <p className="context-source">Source: {p.context.boundarySource.name} · {p.context.boundarySource.unit} · {p.context.boundarySource.layer}. {JSON.stringify(p.boundary) === JSON.stringify(p.context.boundarySource.originalBoundary) ? 'Imported outline unchanged.' : 'Current boundary differs from the imported source.'}</p>}
    </fieldset>
    <fieldset disabled={p.disabled || busy || calibrating || !!boundary}><legend>Surroundings and access</legend>
      <p className="note">Mark surrounding streets as reference lines, existing features as points, and possible access as assumptions. Even a documented note does not verify permission or connect an entrance.</p>
      {!p.noteDraft && <button type="button" disabled={p.context.notes.length >= 100} onClick={() => p.onNoteDraft({ id: newProjectId(), kind: 'street', label: '', source: '', confidence: 'assumed', note: '', points: [] })}>Add context annotation</button>}
      {p.noteDraft && <>
        <label>Context type<select aria-label="Context type" value={p.noteDraft.kind} onChange={e => { p.onNoteDraft({ ...p.noteDraft!, kind: e.target.value as ContextNote['kind'], points: [] }); p.onPicking(false); }}><option value="street">Surrounding street</option><option value="feature">Existing feature</option><option value="access">Access assumption</option></select></label>
        <label>Annotation name<input maxLength={100} value={p.noteDraft.label} onChange={e => p.onNoteDraft({ ...p.noteDraft!, label: e.target.value })} /></label>
        <label>Source or basis<input maxLength={300} value={p.noteDraft.source} onChange={e => p.onNoteDraft({ ...p.noteDraft!, source: e.target.value })} placeholder="Survey sheet, site visit, or planner assumption" /></label>
        <label>Evidence status<select aria-label="Evidence status" value={p.noteDraft.confidence} onChange={e => p.onNoteDraft({ ...p.noteDraft!, confidence: e.target.value as ContextNote['confidence'] })}><option value="assumed">Assumed / unverified</option><option value="documented">Documented in the stated source</option></select></label>
        <label>Context notes<textarea maxLength={1000} value={p.noteDraft.note} onChange={e => p.onNoteDraft({ ...p.noteDraft!, note: e.target.value })} /></label>
        <button type="button" aria-pressed={p.picking} onClick={() => p.onPicking(!p.picking)}>{p.picking ? 'Stop placing points' : 'Place points on plan'}</button>
        {p.picking && <p role="status">Click the plan to place {p.noteDraft.kind === 'street' ? 'the street reference points' : 'one marker'}. Existing plan geometry stays unchanged.</p>}
        {p.noteDraft.points.map((point, i) => <div key={i} className="context-grid">{(['x', 'y'] as const).map(axis => <label key={axis}>Point {i + 1} {axis.toUpperCase()} (m)<input type="number" step="any" value={Number.isFinite(point[axis]) ? point[axis] : ''} onChange={e => p.onNoteDraft({ ...p.noteDraft!, points: p.noteDraft!.points.map((v, j) => i === j ? { ...v, [axis]: e.target.value === '' ? NaN : Number(e.target.value) } : v) })} /></label>)}</div>)}
        <button type="button" disabled={p.noteDraft.points.length >= (p.noteDraft.kind === 'street' ? 20 : 1)} onClick={() => p.onNoteDraft({ ...p.noteDraft!, points: [...p.noteDraft!.points, { x: 0, y: 0 }] })}>Add coordinate point</button>
        <button type="button" disabled={!p.noteDraft.points.length} onClick={() => p.onNoteDraft({ ...p.noteDraft!, points: p.noteDraft!.points.slice(0, -1) })}>Remove last context point</button>
        {noteIssue && <p className="note" role="status">{noteIssue}</p>}
        <button type="button" disabled={!!noteIssue} onClick={() => { p.onChange({ ...p.context, notes: [...p.context.notes.filter(n => n.id !== p.noteDraft!.id), p.noteDraft!] }, 'Site annotation saved. It is reference context, not a verified access or planning constraint.'); p.onNoteDraft(null); p.onPicking(false); }}>Save annotation</button><button type="button" onClick={cancel}>Cancel context edit</button>
      </>}
      <ul className="context-notes">{p.context.notes.map(n => <li key={n.id}><strong>{n.label}</strong><span>{n.kind === 'street' ? 'Surrounding street' : n.kind === 'access' ? 'Access assumption' : 'Existing feature'} · {n.confidence === 'assumed' ? 'Unverified' : 'Documented by user'}</span><p>Source: {n.source}</p>{n.note && <p>{n.note}</p>}<button type="button" disabled={pending} onClick={() => p.onNoteDraft(structuredClone(n))}>Edit {n.label}</button><button type="button" disabled={pending} onClick={() => p.onChange({ ...p.context, notes: p.context.notes.filter(q => q.id !== n.id) }, 'Context annotation removed. Undo is available.')}>Remove {n.label}</button></li>)}</ul>
    </fieldset>
    {busy && <p role="status">Reading survey or boundary file…</p>}
    {busy && <button type="button" onClick={cancel}>Cancel file loading</button>}
    <p className="note">Accepted calibration, source information and annotations are saved with this project and its backups. Survey/PDF/image bytes are not saved: keep the original file and reattach it after reopening. Annotations are independent of boundary resets; check their alignment after changing the site.</p>
  </section>;
}
