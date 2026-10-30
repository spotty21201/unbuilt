import { parseProject, serializeProject, type PersistedProject, type PersistedState } from './persist.ts';
import { DEFAULT_PLANNING } from './planning.ts';
import { makeSite } from './site.ts';

export const PROJECT_LIBRARY_KEY = 'unbuilt.projects.v1';
export const LEGACY_PROJECT_KEY = 'unbuilt.project.v1';
export function newProjectId(): string {
  return Array.from(crypto.getRandomValues(new Uint32Array(4)), value => value.toString(16).padStart(8, '0')).join('-');
}
export interface ProjectEntry { id: string; name: string; createdAt: string; updatedAt: string; project: PersistedProject }
export interface ProjectLibrary { format: 'unbuilt-project-library'; version: 1; activeId: string | null; projects: ProjectEntry[] }
export function projectNameError(name: string, projects: ProjectEntry[], exceptId?: string): string | null {
  if (!name.trim() || name.trim().length > 100) return 'Use a project name of 1–100 characters.';
  if (projects.some(p => p.id !== exceptId && p.name.toLocaleLowerCase() === name.trim().toLocaleLowerCase())) return 'A project already has that name. Choose another name.';
  return null;
}
export function starterProject(sample: boolean, name: string): PersistedProject {
  const site = makeSite(120, 100);
  const state: PersistedState = {
    spec: { family: 'spine', frontage: 10 }, green: site.green, entrance: site.entrance,
    lots: {}, profileId: 'family-200', greenLocked: sample,
    priceS: '850', ceilingS: '850', ownerS: '10', targetS: '15',
    baseSpec: { w: 120, h: 100, planning: { ...DEFAULT_PLANNING },
      ...(!sample ? { contents: { boundary: false, layout: false, removedHomes: [] } } : {}) },
  };
  return serializeProject(state, [], name);
}
export function projectEntry(id: string, name: string, project: PersistedProject): ProjectEntry {
  const now = new Date().toISOString();
  return { id, name: name.trim(), createdAt: now, updatedAt: now, project: { ...project, name: name.trim() } };
}
export function parseLibrary(raw: unknown): { ok: true; library: ProjectLibrary } | { ok: false; error: string } {
  const fail = (error: string) => ({ ok: false as const, error });
  if (typeof raw !== 'object' || raw === null) return fail('Not a project library.');
  const r = raw as ProjectLibrary;
  if (r.format !== 'unbuilt-project-library' || r.version !== 1 || !Array.isArray(r.projects) || r.projects.length > 500) return fail('Unsupported or incomplete project library.');
  const ids = new Set<string>();
  const names = new Set<string>();
  for (const p of r.projects) {
    if (!p || typeof p.id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(p.id) || ids.has(p.id)) return fail('Invalid or repeated project identifier.');
    if (typeof p.name !== 'string' || !p.name.trim() || p.name.length > 100 || names.has(p.name.toLocaleLowerCase())) return fail('Invalid or repeated project name.');
    if (typeof p.createdAt !== 'string' || typeof p.updatedAt !== 'string' || !Number.isFinite(Date.parse(p.createdAt)) || !Number.isFinite(Date.parse(p.updatedAt))) return fail('Invalid project save date.');
    if (p.project?.format !== 'unbuilt-project') return fail('Library entries must contain accepted projects. Import decision records separately.');
    const parsed = parseProject(p.project);
    if (!parsed.ok) return fail(`${p.name}: ${parsed.error}`);
    ids.add(p.id); names.add(p.name.toLocaleLowerCase());
  }
  if (r.activeId !== null && (typeof r.activeId !== 'string' || !ids.has(r.activeId))) return fail('The active project is missing.');
  return { ok: true, library: r };
}
export function migrateProject(project: PersistedProject, id: string): ProjectLibrary {
  const name = project.name || 'Recovered project';
  return { format: 'unbuilt-project-library', version: 1, activeId: id, projects: [projectEntry(id, name, project)] };
}
