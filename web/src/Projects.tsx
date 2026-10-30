import { useCallback, useEffect, useRef, useState } from 'react';
import Workbench from './App';
import './projects.css';
import ProjectLibraryDialog from './unbuilt/ProjectLibrary';
import ConfirmPlanChange from './unbuilt/ConfirmPlanChange';
import { LEGACY_PROJECT_KEY, PROJECT_LIBRARY_KEY, migrateProject, newProjectId, parseLibrary, projectEntry, projectNameError, starterProject, type ProjectEntry, type ProjectLibrary } from '../../src/projects';
import { parseProject, type PersistedProject } from '../../src/persist';

function loadProjects() {
  let stored: string | null = null;
  let error: string | null = null;
  let locked = false;
  let corrupt = false;
  let library: ProjectLibrary = { format: 'unbuilt-project-library', version: 1, activeId: null, projects: [] };
  try {
    stored = localStorage.getItem(PROJECT_LIBRARY_KEY);
    if (stored !== null) {
      const parsed = parseLibrary(JSON.parse(stored));
      if (!parsed.ok) throw Error(parsed.error);
      library = parsed.library;
    } else {
      const legacy = localStorage.getItem(LEGACY_PROJECT_KEY);
      if (legacy) {
        try {
          const parsed = parseProject(JSON.parse(legacy));
          if (!parsed.ok) throw Error(parsed.error);
          library = migrateProject(parsed.project, newProjectId());
        } catch { error = 'The previous single project could not be read. Its original data has been kept unchanged.'; }
      } else {
        library = migrateProject(starterProject(true, 'Cedar Market sample'), newProjectId());
      }
    }
  } catch {
    locked = true; corrupt = stored !== null;
    error = corrupt ? 'The saved project library could not be read. Original data is unchanged. Download it before choosing a new library.' : 'This browser refused storage access. Projects cannot be saved here; keep a downloaded backup.';
  }
  return { library, stored, error, locked, corrupt };
}
function downloadJson(content: string, filename: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export default function Projects() {
  const [initial] = useState(loadProjects);
  const [library, setLibrary] = useState(initial.library);
  const current = useRef(initial.library);
  const stored = useRef(initial.stored);
  const locked = useRef(initial.locked);
  const [error, setError] = useState<string | null>(initial.error);
  const [storageError, setStorageError] = useState<string | null>(initial.locked ? initial.error : null);
  const [corrupt, setCorrupt] = useState(initial.corrupt);
  const [replace, setReplace] = useState(false);
  const [open, setOpen] = useState(!initial.corrupt && initial.library.activeId === null);
  const [deleted, setDeleted] = useState<ProjectEntry | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [imported, setImported] = useState<{ id: string; text: string } | null>(null);
  const [sessionRisk, setSessionRisk] = useState('');
  const [leave, setLeave] = useState<{ run: () => void; notice: string } | null>(null);
  const active = library.projects.find(p => p.id === library.activeId);
  const guardLeaving = (run: () => void, notice = sessionRisk) => {
    if (notice && active) { setLeave({ run, notice }); return false; }
    run(); return true;
  };
  useEffect(() => {
    if (!deleted) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [deleted]);
  const downloadProject = (id: string) => {
    const entry = current.current.projects.find(p => p.id === id);
    if (entry) downloadJson(JSON.stringify(entry.project, null, 2), `${entry.name.replace(/[^a-z0-9_-]/gi, '-').slice(0, 80)}.json`);
  };
  const write = useCallback((next: ProjectLibrary, keepInMemory = false): boolean => {
    try {
      if (locked.current) throw Error('Saved data is protected. Download your work and reload before continuing.');
      const existing = localStorage.getItem(PROJECT_LIBRARY_KEY);
      if (existing !== stored.current) { locked.current = true; throw Error('Projects changed in another tab. Download this work before reloading; the other tab’s data has not been overwritten.'); }
      const text = JSON.stringify(next); localStorage.setItem(PROJECT_LIBRARY_KEY, text); stored.current = text;
      current.current = next; setLibrary(next); setSavedAt(new Date().toISOString()); setError(null); setStorageError(null); return true;
    } catch (e) {
      if (keepInMemory) { current.current = next; setLibrary(next); }
      const message = e instanceof Error && /tab|protected/.test(e.message) ? e.message : 'Save failed: browser storage is full or unavailable. Your current work remains open. Download it before leaving.';
      setError(message); setStorageError(message);
      return false;
    }
  }, []);
  const saveProject = useCallback((project: PersistedProject): boolean => {
    const id = active?.id;
    if (!id || id !== current.current.activeId) return false;
    const next = { ...current.current, projects: current.current.projects.map(p => p.id === id ? { ...p, updatedAt: project.savedAt, project: { ...project, name: p.name } } : p) };
    return write(next, true);
  }, [active?.id, write]);
  const create = (name: string, sample: boolean): boolean => {
    const issue = projectNameError(name, current.current.projects);
    if (issue) { setError(issue); return false; }
    if (current.current.projects.length >= 500) { setError('This device library supports up to 500 projects. Download and remove a project before adding another.'); return false; }
    const entry = projectEntry(newProjectId(), name, starterProject(sample, name.trim()));
    if (!write({ ...current.current, projects: [...current.current.projects, entry], activeId: entry.id })) return false;
    setOpen(false); return true;
  };
  const openProject = (id: string) => {
    if (!current.current.projects.some(p => p.id === id)) return;
    if (write({ ...current.current, activeId: id })) setOpen(false);
  };
  const rename = (id: string, name: string): boolean => {
    const issue = projectNameError(name, current.current.projects, id);
    if (issue) { setError(issue); return false; }
    return write({ ...current.current, projects: current.current.projects.map(p => p.id === id ? { ...p, name: name.trim(), project: { ...p.project, name: name.trim() } } : p) });
  };
  const remove = (id: string): boolean => {
    const entry = current.current.projects.find(p => p.id === id);
    if (!entry) return false;
    const wasActive = current.current.activeId === id;
    const projects = current.current.projects.filter(p => p.id !== id);
    if (!write({ ...current.current, projects, activeId: current.current.activeId === id ? projects[0]?.id ?? null : current.current.activeId })) return false;
    if (wasActive) setSessionRisk('');
    setDeleted(entry); return true;
  };
  const undoDelete = () => {
    if (!deleted) return;
    const issue = projectNameError(deleted.name, current.current.projects);
    if (issue) { setError('Rename the project with the same name before restoring the deleted project.'); return; }
    if (write({ ...current.current, projects: [...current.current.projects, deleted], activeId: current.current.activeId ?? deleted.id })) setDeleted(null);
  };
  const importProject = async (file: File) => {
    if (file.size > 10_000_000) { setError('Project files must be smaller than 10 MB. Nothing was imported.'); return; }
    try {
      const parsed = parseProject(JSON.parse(await file.text()));
      if (!parsed.ok) { setError(`Import refused: ${parsed.error} Nothing was changed.`); return; }
      if (current.current.projects.length >= 500) { setError('This device library supports up to 500 projects. Download and remove a project before importing another.'); return; }
      const base = (parsed.project.name || file.name.replace(/\.json$/i, '') || 'Imported project').slice(0, 90).trim();
      let name = base; let i = 2;
      while (projectNameError(name, current.current.projects)) name = `${base} (${i++})`;
      const entry = projectEntry(newProjectId(), name, parsed.project);
      if (write({ ...current.current, projects: [...current.current.projects, entry], activeId: entry.id })) { setImported({ id: entry.id, text: `Imported project file “${file.name}” as “${name}”. Existing projects were kept. Accepted plan restored; drafts, undo history and photos are not included.` }); setOpen(false); }
    } catch { setError('That project file could not be read. Nothing was imported.'); }
  };
  return <>
    {active ? <Workbench key={active.id} initialStatus={imported?.id === active.id ? imported.text : undefined} initialProject={active.project} projectName={active.name} onSaveProject={saveProject} onOpenProjects={risk => { setSessionRisk(risk); setOpen(true); }} onImportProject={(file, risk) => { guardLeaving(() => { void importProject(file); }, risk); }} saveStatus={storageError ? storageError : savedAt ? `Project saved in this browser at ${new Date(savedAt).toLocaleTimeString()}.` : 'Saving project…'} /> : <div className="project-welcome"><header><strong>UNBUILT</strong><button type="button" onClick={() => setOpen(true)}>Projects</button></header><main><h1>Your planning workspace</h1><p>Create a named project, draw its boundary and develop a plan.</p><button type="button" onClick={() => setOpen(true)}>New project</button></main></div>}
    {storageError && <div className="library-error" role="alert">{storageError} {active && <button type="button" onClick={() => downloadJson(JSON.stringify(active.project, null, 2), `${active.name}.json`)}>Download current project</button>}{corrupt && <><button type="button" onClick={() => downloadJson(stored.current ?? '', 'unbuilt-library-backup.json')}>Download original library</button><button type="button" onClick={() => setReplace(true)}>Use a new library</button>{replace && <span>Replace the unreadable library? Keep the downloaded original for recovery. <button type="button" onClick={() => { locked.current = false; if (write(current.current)) { setCorrupt(false); setReplace(false); } }}>Confirm new library</button><button type="button" onClick={() => setReplace(false)}>Cancel replacement</button></span>}</>}</div>}
    {open && <ProjectLibraryDialog library={library} sessionRisk={active ? sessionRisk : ''} onDownload={downloadProject} onClose={() => setOpen(false)} onOpen={id => { if (id === library.activeId) setOpen(false); else guardLeaving(() => openProject(id)); }} onCreate={(name, sample) => {
      const issue = projectNameError(name, current.current.projects);
      if (issue) { setError(issue); return false; }
      if (sessionRisk && active) { guardLeaving(() => { create(name, sample); }); return false; }
      return create(name, sample);
    }} onRename={rename} onDelete={remove} onImport={file => { guardLeaving(() => { void importProject(file); }); }} error={error} deleted={deleted} onUndoDelete={undoDelete} />}
    {leave && <ConfirmPlanChange title="Leave this project?" detail={`${leave.notice} Accepted edits are saved automatically when browser storage is available. Download a project backup before leaving if saving failed.`} recovery="Returning to this project starts a fresh session; history and photos cannot be recovered." action="Leave project" cancelLabel="Stay in project" onCancel={() => setLeave(null)} onConfirm={() => { const next = leave.run; setLeave(null); next(); }} />}
  </>;
}
