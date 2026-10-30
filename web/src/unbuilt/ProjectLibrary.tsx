import { useEffect, useRef, useState } from 'react';
import type { ProjectEntry, ProjectLibrary } from '../../../src/projects';
import { siteArea } from '../../../src/boundary';
import { hasBoundary, hasLayout } from '../../../src/contents';
interface Props {
  library: ProjectLibrary;
  onClose: () => void;
  onOpen: (id: string) => void;
  onCreate: (name: string, sample: boolean) => boolean;
  onRename: (id: string, name: string) => boolean;
  onDelete: (id: string) => boolean;
  onImport: (file: File) => void;
  error: string | null;
  deleted: ProjectEntry | null;
  onUndoDelete: () => void;
  onDownload: (id: string) => void;
  sessionRisk: string;
}
export default function ProjectLibraryDialog(p: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [sample, setSample] = useState(false);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [rename, setRename] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  useEffect(() => {
    const dialog = ref.current;
    const opener = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    return () => { dialog?.close(); if (opener?.isConnected) opener.focus(); };
  }, []);
  return <dialog ref={ref} className="project-library" aria-labelledby="projects-title" onCancel={p.onClose}>
    <header><div><h2 id="projects-title">Projects</h2><p>Saved only in this browser on this device. Keep a downloaded backup: private browsing or clearing site data can remove projects.</p><details className="project-save-scope"><summary>Saved contents and backup limits</summary><p>Only accepted edits are saved: Apply a draft first. Backups include the accepted plan, assumptions, decisions, site context and survey calibration. They exclude drafts, history, search results, comparisons, photos and original survey media; keep those files for reattachment.</p></details></div><div className="project-header-actions"><button type="button" onClick={() => { nameRef.current?.closest('section')?.scrollIntoView({ block: 'start' }); nameRef.current?.focus({ preventScroll: true }); }}>New project</button><button type="button" onClick={p.onClose} aria-label="Close projects">Close</button></div></header>
    {p.error && <p className="error" role="alert">{p.error}</p>}
    {p.deleted && <div className="project-recovery" role="status">Deleted “{p.deleted.name}”. <button type="button" onClick={p.onUndoDelete}>Undo project deletion</button><span>Only the most recent deletion. Available until this app is reloaded or closed.</span></div>}
    <div className="project-library-grid"><section aria-label="Saved projects"><h3>Your projects</h3>
      {!p.library.projects.length && <p>No saved projects. Create a blank project to begin.</p>}
      <ul>{p.library.projects.map(project => <li key={project.id} className={project.id === p.library.activeId ? 'active-project' : ''}>
        {renameId === project.id ? <form onSubmit={e => { e.preventDefault(); if (p.onRename(project.id, rename)) setRenameId(null); }}><label>Project name<input aria-label="Rename project" autoFocus maxLength={100} value={rename} onChange={e => setRename(e.target.value)} /></label><button type="submit">Save name</button><button type="button" onClick={() => setRenameId(null)}>Cancel rename</button></form> : <><h4>{project.name} {project.id === p.library.activeId && <small>Open</small>}</h4><p>{hasBoundary(project.project.state.baseSpec) ? `${siteArea(project.project.state.baseSpec).toLocaleString('en-US', { maximumFractionDigits: 1 })} m² · ${hasLayout(project.project.state.baseSpec) ? 'Layout' : 'Boundary only'}` : 'Blank plan'} · Saved {new Date(project.updatedAt).toLocaleString()}</p>
          <div className="project-row-actions"><button type="button" onClick={() => p.onOpen(project.id)}>Open {project.name}</button><button type="button" onClick={() => p.onDownload(project.id)}>Download {project.name}</button><button type="button" onClick={() => { setRenameId(project.id); setRename(project.name); setDeleteId(null); }}>Rename {project.name}</button><button type="button" onClick={() => { setDeleteId(project.id); setRenameId(null); }}>Delete {project.name}</button></div></>}
        {deleteId === project.id && <div className="project-delete" role="alert"><p>Delete “{project.name}” from this device? Its saved plan will be removed. Undo project deletion restores only the most recently deleted project until this session is reloaded or closed. Download a backup first if you need a permanent copy.</p>{project.id === p.library.activeId && p.sessionRisk && <p>{p.sessionRisk}</p>}<button type="button" onClick={() => p.onDownload(project.id)}>Download before deletion</button><button type="button" onClick={() => { if (p.onDelete(project.id)) setDeleteId(null); }}>Confirm delete project</button><button type="button" onClick={() => setDeleteId(null)}>Keep project</button></div>}
      </li>)}</ul>
    </section><section className="new-project" aria-label="Create project"><h3>New project</h3><form onSubmit={e => { e.preventDefault(); if (p.onCreate(name, sample)) setName(''); }}>
      <label>Project name<input ref={nameRef} autoComplete="off" maxLength={100} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Riverside neighborhood" required /></label>
      <fieldset><legend>Start with</legend><label><input type="radio" name="project-start" checked={!sample} onChange={() => setSample(false)} />Blank plan</label><label><input type="radio" name="project-start" checked={sample} onChange={() => setSample(true)} />Cedar Market sample</label></fieldset>
      <p>{sample ? 'A fictional sample with homes, streets and open space.' : 'An empty drawing. Create your boundary, then generate a layout when ready.'}</p><button type="submit">Create and open project</button>
    </form><label className="project-import">Import a project or decision record<input type="file" accept=".json,application/json" onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) p.onImport(f); }} /></label><p>Imports become separate named projects. Existing projects are kept.</p></section></div>
  </dialog>;
}
