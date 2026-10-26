// UNBUILT draft machine (Coder-owned). Pure logic for direct manipulation:
// string-held numeric drafts where empty means incomplete (never zero),
// validity against the site, commit blocked while invalid, and a bounded
// undo/redo stack over opaque snapshots. Rendering stays in the UI.
import type { Rect } from "./schema.ts";

// Empty/blank/non-numeric text is incomplete (null). Deliberate zero stays 0.
export function parseMeter(s: string): number | null {
  if (s.trim() === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export interface Draft {
  // Last valid committed geometry (the plan of record).
  committed: Rect;
  // Draft for display: committed values with parsable fields applied.
  draft: Rect;
  // True only when every field parses AND the rect is positive + inside site.
  draftable: boolean;
  // Raw fields as typed (for controlled inputs).
  fields: Record<"x" | "y" | "w" | "h", string>;
  errors: string[];
}

export function applyDraftEdit(
  committed: Rect,
  fields: Record<"x" | "y" | "w" | "h", string>,
  site: { w: number; h: number },
): Draft {
  const vals = [parseMeter(fields.x), parseMeter(fields.y), parseMeter(fields.w), parseMeter(fields.h)];
  const errors: string[] = [];
  if (vals.some((v) => v === null)) {
    errors.push("Coordinates must be numbers — the plan keeps the last valid position.");
    return { committed, draft: { ...committed }, draftable: false, fields, errors };
  }
  const [x, y, w, h] = vals as number[];
  if (w <= 0 || h <= 0) errors.push("Open space must have a positive width and depth.");
  if (x < 0 || y < 0 || x + w > site.w + 0.001 || y + h > site.h + 0.001) {
    errors.push(`Open space must sit inside the ${site.w} × ${site.h} m site.`);
  }
  if (errors.length > 0) {
    return { committed, draft: { x, y, w, h }, draftable: false, fields, errors };
  }
  return { committed, draft: { x, y, w, h }, draftable: true, fields, errors };
}

// Commit applies the draft as the new plan of record. Null while invalid:
// invalid edits cannot be applied, by construction.
export function commitDraft(d: Draft): { committed: Rect | null } {
  return { committed: d.draftable ? { ...d.draft } : null };
}

export interface History<T> {
  past: T[];
  future: T[];
}

const HISTORY_CAP = 50;

export function pushUndo<T>(h: History<T>, snap: T): History<T> {
  const past = [...h.past, snap];
  return { past: past.length > HISTORY_CAP ? past.slice(past.length - HISTORY_CAP) : past, future: [] };
}

export function undo<T>(h: History<T>, current: T): { hist: History<T>; snap: T | null } {
  if (h.past.length === 0) return { hist: h, snap: null };
  const past = [...h.past];
  const snap = past.pop() as T;
  return { hist: { past, future: [...h.future, current] }, snap };
}

export function redo<T>(h: History<T>, current: T): { hist: History<T>; snap: T | null } {
  if (h.future.length === 0) return { hist: h, snap: null };
  const future = [...h.future];
  const snap = future.pop() as T;
  return { hist: { past: [...h.past, current], future }, snap };
}
