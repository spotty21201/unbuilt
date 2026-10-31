import {usesShapedStreets} from './road-surfaces.ts';
// UNBUILT durable project persistence (Coder-owned). Pure serialize/parse
// for localStorage autosave and file import. Photos are NEVER persisted
// (blob URLs die with the session and bytes exceed quota): restores always
// report the photo as not included. Version-gated: unknown versions refuse.
import { siteFrameErrors, type SiteFrame } from "./boundary.ts";
import { contextErrors, type SiteContext } from './site-context.ts';
import { MAX_LOT_VERTICES } from "./polygon.ts";

export interface PersistedDecision {
  t: string;
  kind: string;
  detail: string;
}

export interface PersistedState {
  spec: { family: string; frontage: number };
  green: { x: number; y: number; w: number; h: number };
  entrance: { edge: string; offset: number; width: number; boundaryEdge?: number };
  lots: Record<string, { x: number; y: number }[]>;
  profileId: string;
  greenLocked: boolean;
  priceS: string;
  ceilingS: string;
  ownerS: string;
  targetS: string;
  baseSpec: SiteFrame;
  siteContext?: SiteContext;
}

export interface PersistedProject {
  format: "unbuilt-project";
  version: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;
  name?: string;
  savedAt: string;
  state: PersistedState;
  decisions: PersistedDecision[];
  photo: { included: false; note: string };
  alternatives?: SavedAlternative[];
}

export interface SavedAlternative {
  id: string;
  name: string;
  note: string;
  createdAt: string;
  updatedAt: string;
  state: PersistedState;
}
export const MAX_ALTERNATIVES = 20;
export function alternativeNameError(name: string, items: SavedAlternative[], exceptId?: string): string | null {
  if (!name.trim() || name.length > 100) return 'Use a scheme name of 1–100 characters.';
  if (items.some(s => s.id !== exceptId && s.name.trim().toLocaleLowerCase() === name.trim().toLocaleLowerCase())) return 'A saved scheme already has that name.';
  return null;
}

export function serializeProject(state: PersistedState, decisions: PersistedDecision[], name?: string, alternatives?: SavedAlternative[]): PersistedProject {
  return {
    format: "unbuilt-project",
    ...(name ? { name } : {}),
    version: usesShapedStreets(state.baseSpec.planning?.streetNetwork)||alternatives?.some(a=>usesShapedStreets(a.state.baseSpec.planning?.streetNetwork))?14:state.baseSpec.development!==undefined||alternatives?.some(a=>a.state.baseSpec.development!==undefined)?13:alternatives!==undefined?12:state.baseSpec.costAssumptions!==undefined?11:state.baseSpec.planning?.openSpaces!==undefined?10:state.baseSpec.planning?.housing ? 9 : state.baseSpec.planning?.lotPlan !== undefined ? 8 : state.baseSpec.planning?.streetNetwork !== undefined ? 7 : state.siteContext !== undefined ? 6 : state.baseSpec.contents !== undefined ? 5 : state.entrance.boundaryEdge !== undefined || state.baseSpec.planning?.minGreenArea !== undefined ? 4 : state.baseSpec.planning ? 3 : state.baseSpec.boundary ? 2 : 1,
    savedAt: new Date().toISOString(),
    state: JSON.parse(JSON.stringify(state)) as PersistedState,
    decisions: decisions.map((d) => ({ ...d })),
    photo: { included: false, note: "Reference photos are session-only and never stored." },
    ...(alternatives!==undefined?{alternatives:structuredClone(alternatives)}:{}),
  };
}

type Fail = { ok: false; error: string };

function fail(error: string): Fail {
  return { ok: false, error };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function num(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function rect(v: unknown): v is { x: number; y: number; w: number; h: number } {
  return isRecord(v) && num(v.x) && num(v.y) && num(v.w) && num(v.h);
}

function pts(v: unknown): v is { x: number; y: number }[] {
  return (
    Array.isArray(v) &&
    v.length >= 3 &&
    v.length <= MAX_LOT_VERTICES &&
    v.every((p) => isRecord(p) && num(p.x) && num(p.y))
  );
}

// A v2 decision-record export carries the accepted plan but no drafts or
// undo history: importing one restores the accepted plan only, stated here
// and in the UI. Anything else (unknown version, non-finite coordinates,
// wrong shapes) refuses with a reason instead of a partial restore.
export function parseProject(raw: unknown): { ok: true; project: PersistedProject } | Fail {
  if (!isRecord(raw)) return fail("not a project object");
  if (raw.format === "UNBUILT decision record" || raw.exportVersion === 2 || raw.exportVersion === 3 || raw.exportVersion === 4 || raw.exportVersion === 5 || raw.exportVersion === 6 || raw.exportVersion === 7 || raw.exportVersion === 8 || raw.exportVersion === 9 || raw.exportVersion === 10 || raw.exportVersion === 11 || raw.exportVersion === 12 || raw.exportVersion === 13 || raw.exportVersion === 14 || raw.exportVersion === 15) {
    return fromDecisionRecord(raw);
  }
  if (raw.format !== "unbuilt-project") return fail(`unknown format ${JSON.stringify(raw.format)}`);
  if (raw.version !== 1 && raw.version !== 2 && raw.version !== 3 && raw.version !== 4 && raw.version !== 5 && raw.version !== 6 && raw.version !== 7 && raw.version !== 8 && raw.version !== 9 && raw.version !== 10 && raw.version !== 11 && raw.version !== 12 && raw.version !== 13 && raw.version !== 14) return fail(`unsupported project version ${JSON.stringify(raw.version)}: created by a newer app`);
  if (!isRecord(raw.state)) return fail("missing state");
  const st = raw.state;
  if (!isRecord(st.spec) || (st.spec.family !== "spine" && st.spec.family !== "loop") || !num(st.spec.frontage) || st.spec.frontage < 1 || st.spec.frontage > 500) {
    return fail("state.spec must be {family spine|loop, frontage 1–500 m}");
  }
  if (!rect(st.green)) return fail("state.green must be a finite rect");
  if (
    !isRecord(st.entrance) ||
    (st.entrance.edge !== "west" && st.entrance.edge !== "east") ||
    !num(st.entrance.offset) ||
    !num(st.entrance.width)
  ) {
    return fail("state.entrance must be {edge west|east, numeric offset/width}");
  }
  if (st.entrance.boundaryEdge !== undefined && ((raw.version !== 4 && raw.version !== 5 && raw.version !== 6 && raw.version !== 7 && raw.version !== 8 && raw.version !== 9 && raw.version !== 10 && raw.version !== 11 && raw.version !== 12 && raw.version !== 13 && raw.version !== 14) || !(st.baseSpec as Record<string, unknown>)?.planning || !Number.isInteger(st.entrance.boundaryEdge) || (st.entrance.boundaryEdge as number) < 0 || (st.entrance.boundaryEdge as number) >= (Array.isArray((st.baseSpec as Record<string, unknown>)?.boundary) ? ((st.baseSpec as Record<string, unknown>).boundary as unknown[]).length : 4))) return fail("Entrance boundary edge must address a live-planning site edge.");
  if (!isRecord(st.lots)) return fail("state.lots must be an object");
  for (const [k, v] of Object.entries(st.lots)) {
    if (!pts(v)) return fail(`state.lots[${k}] must be 3-${MAX_LOT_VERTICES} finite corners`);
  }
  for (const k of ["profileId", "priceS", "ceilingS", "ownerS", "targetS"] as const) {
    if (typeof st[k] !== "string") return fail(`state.${k} must be a string`);
  }
  if (typeof st.greenLocked !== "boolean") return fail("state.greenLocked must be a boolean");
  if (!isRecord(st.baseSpec) || !num(st.baseSpec.w) || !num(st.baseSpec.h)) {
    return fail("state.baseSpec must be {numeric w, h}");
  }
  if (st.baseSpec.boundary !== undefined && (!Array.isArray(st.baseSpec.boundary) || !st.baseSpec.boundary.every((p) => isRecord(p) && num(p.x) && num(p.y)))) return fail("boundary must contain finite coordinate pairs");
  if (st.baseSpec.boundary !== undefined && raw.version === 1) return fail("Polygon projects require project version 2 or later.");
  if (st.baseSpec.planning !== undefined && raw.version !== 3 && raw.version !== 4 && raw.version !== 5 && raw.version !== 6 && raw.version !== 7 && raw.version !== 8 && raw.version !== 9 && raw.version !== 10 && raw.version !== 11 && raw.version !== 12 && raw.version !== 13 && raw.version !== 14) return fail("Planning parameters require project version 3.");
  if ((st.baseSpec.planning as Record<string, unknown> | undefined)?.minGreenArea !== undefined && raw.version !== 4 && raw.version !== 5 && raw.version !== 6 && raw.version !== 7 && raw.version !== 8 && raw.version !== 9 && raw.version !== 10 && raw.version !== 11 && raw.version !== 12 && raw.version !== 13 && raw.version !== 14) return fail("Minimum open space requires project version 4.");
  if (st.baseSpec.contents !== undefined && raw.version !== 5 && raw.version !== 6 && raw.version !== 7 && raw.version !== 8 && raw.version !== 9 && raw.version !== 10 && raw.version !== 11 && raw.version !== 12 && raw.version !== 13 && raw.version !== 14) return fail("Plan contents require project version 5.");
  if (raw.name !== undefined && (typeof raw.name !== "string" || !raw.name.trim() || raw.name.length > 100)) return fail("Project name must be 1–100 characters.");
  if (st.siteContext !== undefined) { if (raw.version !== 6 && raw.version !== 7 && raw.version !== 8 && raw.version !== 9 && raw.version !== 10 && raw.version !== 11 && raw.version !== 12 && raw.version !== 13 && raw.version !== 14) return fail('Site context requires project version 6 or later.'); const issues = contextErrors(st.siteContext); if (issues.length) return fail(issues[0]); }
  if ((st.baseSpec.planning as Record<string, unknown> | undefined)?.streetNetwork !== undefined && raw.version !== 7 && raw.version !== 8 && raw.version !== 9 && raw.version !== 10 && raw.version !== 11 && raw.version !== 12 && raw.version !== 13 && raw.version !== 14) return fail('Editable streets require project version 7.');
  if ((st.baseSpec.planning as Record<string,unknown>|undefined)?.lotPlan!==undefined && raw.version!==8 && raw.version!==9 && raw.version!==10 && raw.version!==11 && raw.version!==12&&raw.version!==13 && raw.version !== 14) return fail('Manual lot plans require project version 8.');
  if ((st.baseSpec.planning as Record<string,unknown>|undefined)?.housing!==undefined && raw.version!==9 && raw.version!==10 && raw.version!==11 && raw.version!==12&&raw.version!==13 && raw.version !== 14) return fail('Housing mix requires project version 9.');
  if((st.baseSpec.planning as Record<string,unknown>|undefined)?.openSpaces!==undefined&&raw.version!==10&&raw.version!==11&&raw.version!==12&&raw.version!==13 && raw.version !== 14)return fail('Multiple open spaces require project version 10.');
  if(st.baseSpec.costAssumptions!==undefined&&raw.version!==11&&raw.version!==12&&raw.version!==13 && raw.version !== 14)return fail('Editable costs require project version 11.');
  if(st.baseSpec.development!==undefined&&raw.version!==13 && raw.version !== 14)return fail('Terrain, drainage and phasing require project version 13.');
  if(usesShapedStreets((st.baseSpec.planning as Record<string,unknown>|undefined)?.streetNetwork)&&raw.version!==14)return fail('Angled roads and corner fillets require project version 14.');
  const shapeErrors = siteFrameErrors(st.baseSpec as unknown as SiteFrame);
  if (shapeErrors.length) return fail(shapeErrors[0]);
  if (!Array.isArray(raw.decisions) || !raw.decisions.every((d) => isRecord(d) && typeof d.t === "string" && typeof d.kind === "string" && typeof d.detail === "string")) {
    return fail("decisions must be [{t, kind, detail} strings]");
  }
  if (raw.alternatives !== undefined) {
    if (raw.version !== 12 && raw.version !== 13 && raw.version !== 14) return fail('Saved alternatives require project version 12.');
    if (!Array.isArray(raw.alternatives) || raw.alternatives.length > MAX_ALTERNATIVES) return fail(`Use at most ${MAX_ALTERNATIVES} saved schemes.`);
    const seen = new Set<string>();
    const items: SavedAlternative[] = [];
    for (const a of raw.alternatives) {
      if (!isRecord(a) || typeof a.id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(a.id) || ['working','preview'].includes(a.id) || seen.has(a.id)) return fail('Invalid or repeated saved scheme identifier.');
      if (typeof a.name !== 'string') return fail('Saved scheme name is missing.');
      const nameError = alternativeNameError(a.name, items); if (nameError) return fail(nameError);
      if (typeof a.note !== 'string' || a.note.length > 4000) return fail('Scheme notes must be text of at most 4,000 characters.');
      if (typeof a.createdAt !== 'string' || !Number.isFinite(Date.parse(a.createdAt)) || typeof a.updatedAt !== 'string' || !Number.isFinite(Date.parse(a.updatedAt))) return fail('Saved schemes need valid creation and update dates.');
      if(raw.version!==13 && raw.version !== 14&&isRecord(a.state)&&isRecord(a.state.baseSpec)&&a.state.baseSpec.development!==undefined)return fail('Saved development inputs require project version 13.');
      if (!isRecord(a.state) || a.state.alternatives !== undefined || a.state.savedAlternatives !== undefined) return fail('Saved schemes must contain a plan, without nested schemes.');
      if (Object.keys(a).some(k => !['id','name','note','createdAt','updatedAt','state'].includes(k))) return fail('Unknown saved scheme field.');
      const plan = parseProject({format:'unbuilt-project',version:raw.version,state:a.state,decisions:[]});
      if (!plan.ok) return fail(`${a.name}: ${plan.error}`);
      seen.add(a.id); items.push(a as unknown as SavedAlternative);
    }
  }
  const project = raw as unknown as PersistedProject;
  return { ok: true, project };
}

function fromDecisionRecord(raw: Record<string, unknown>): { ok: true; project: PersistedProject } | Fail {
  if (![2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].includes(raw.exportVersion as number)) return fail('Unsupported decision record version.');
  const st = raw.state;
  if (!isRecord(st)) return fail("decision record has no state snapshot");
  const site = isRecord(st.site) ? st.site : {};
  if (site.contents !== undefined && raw.exportVersion !== 6 && raw.exportVersion !== 7 && raw.exportVersion !== 8 && raw.exportVersion !== 9 && raw.exportVersion !== 10 && raw.exportVersion !== 11 && raw.exportVersion !== 12 && raw.exportVersion !== 13 && raw.exportVersion !== 14 && raw.exportVersion !== 15) return fail('Plan contents require decision record version 6.');
  if (st.siteContext !== undefined && raw.exportVersion !== 7 && raw.exportVersion !== 8 && raw.exportVersion !== 9 && raw.exportVersion !== 10 && raw.exportVersion !== 11 && raw.exportVersion !== 12 && raw.exportVersion !== 13 && raw.exportVersion !== 14 && raw.exportVersion !== 15) return fail('Site context requires decision record version 7.');
  if ((site.planning as Record<string, unknown> | undefined)?.streetNetwork !== undefined && raw.exportVersion !== 8 && raw.exportVersion !== 9 && raw.exportVersion !== 10 && raw.exportVersion !== 11 && raw.exportVersion !== 12 && raw.exportVersion !== 13 && raw.exportVersion !== 14 && raw.exportVersion !== 15) return fail('Editable streets require decision record version 8.');
  if ((site.planning as Record<string,unknown>|undefined)?.lotPlan!==undefined && raw.exportVersion!==9 && raw.exportVersion!==10 && raw.exportVersion!==11 && raw.exportVersion!==12 && raw.exportVersion!==13&&raw.exportVersion!==14 && raw.exportVersion !== 15) return fail('Manual lot plans require decision record version 9.');
  if ((site.planning as Record<string,unknown>|undefined)?.housing!==undefined && raw.exportVersion!==10 && raw.exportVersion!==11 && raw.exportVersion!==12 && raw.exportVersion!==13&&raw.exportVersion!==14 && raw.exportVersion !== 15) return fail('Housing mix requires decision record version 10.');
  if((site.planning as Record<string,unknown>|undefined)?.openSpaces!==undefined&&raw.exportVersion!==11&&raw.exportVersion!==12&&raw.exportVersion!==13&&raw.exportVersion!==14 && raw.exportVersion !== 15)return fail('Multiple open spaces require decision record version 11.');
  if(site.costAssumptions!==undefined&&raw.exportVersion!==12&&raw.exportVersion!==13&&raw.exportVersion!==14 && raw.exportVersion !== 15)return fail('Editable costs require decision record version 12.');
  if(raw.alternatives!==undefined&&raw.exportVersion!==13&&raw.exportVersion!==14 && raw.exportVersion !== 15)return fail('Saved alternatives require decision record version 13.');
  if(raw.exportVersion!==14 && raw.exportVersion !== 15&&Array.isArray(raw.alternatives)&&raw.alternatives.some(a=>isRecord(a)&&isRecord(a.state)&&isRecord(a.state.baseSpec)&&a.state.baseSpec.development!==undefined))return fail('Saved development inputs require decision record version 14.');
  if(site.development!==undefined&&raw.exportVersion!==14 && raw.exportVersion !== 15)return fail('Terrain, drainage and phasing require decision record version 14.');
  if((usesShapedStreets((site.planning as Record<string,unknown>|undefined)?.streetNetwork)||Array.isArray(raw.alternatives)&&raw.alternatives.some(a=>isRecord(a)&&isRecord(a.state)&&isRecord(a.state.baseSpec)&&isRecord(a.state.baseSpec.planning)&&usesShapedStreets(a.state.baseSpec.planning.streetNetwork)))&&raw.exportVersion!==15)return fail('Angled roads and corner fillets require decision record version 15.');
  const plan = isRecord(st.plan) ? st.plan : {};
  const openSpace = isRecord(st.openSpace) ? st.openSpace : {};
  const assumptions = isRecord(st.assumptions) ? st.assumptions : {};
  const w = site.w;
  const h = site.h;
  if (!num(w) || !num(h)) return fail("decision record site has no numeric boundary");
  const state: PersistedState = {
    spec: {
      family: (plan as Record<string, unknown>).family === "loop" ? "loop" : "spine",
      frontage: num((plan as Record<string, unknown>).frontage) ? ((plan as Record<string, unknown>).frontage as number) : 10,
    },
    green: rect(openSpace.geometry)
      ? (openSpace.geometry as PersistedState["green"])
      : { x: 0, y: 0, w: -1, h: -1 },
    entrance: { edge: "west", offset: h / 2, width: 8 },
    lots: {},
    profileId: typeof (plan as Record<string, unknown>).profile === "string" ? ((plan as Record<string, unknown>).profile as string) : "starter-150",
    greenLocked: false,
    priceS: "",
    ceilingS: "",
    ownerS: "",
    targetS: "",
    ...(st.siteContext !== undefined ? { siteContext: st.siteContext as SiteContext } : {}),
    baseSpec: { w, h, ...(site.development!==undefined?{development:site.development as SiteFrame["development"]}:{}), ...(site.costAssumptions!==undefined?{costAssumptions:site.costAssumptions as SiteFrame["costAssumptions"]}:{}), ...(site.contents !== undefined ? { contents: site.contents as SiteFrame["contents"] } : {}), ...(site.planning !== undefined ? { planning: site.planning as SiteFrame["planning"] } : {}), ...(site.boundary !== undefined ? { boundary: site.boundary as SiteFrame["boundary"] } : {}) },
  };
  if (!rect(state.green)) return fail("decision record has no usable open-space geometry");
  const ent = st.entrance;
  if (isRecord(ent) && (ent.edge === "west" || ent.edge === "east") && num(ent.offset) && num(ent.width)) {
    state.entrance = { edge: ent.edge, offset: ent.offset, width: ent.width, ...(ent.boundaryEdge !== undefined ? { boundaryEdge: ent.boundaryEdge as number } : {}) };
  }
  const rl = (plan as Record<string, unknown>).lotReshapes;
  if (isRecord(rl)) {
    for (const [k, v] of Object.entries(rl)) {
      if (pts(v)) state.lots[k] = v.map((p) => ({ ...p }));
    }
  }
  if (typeof openSpace.locked === "boolean") state.greenLocked = openSpace.locked;
  for (const [dst, src] of [["priceS", "assumedPriceRp"], ["ceilingS", "ceilingRp"], ["ownerS", "ownerExpectationRp"]] as const) {
    const v = (assumptions as Record<string, unknown>)[src];
    if (num(v)) (state as unknown as Record<string, string>)[dst] = String(v / (dst === "ownerS" ? 1_000_000_000 : 1_000_000));
  }
  if (num(assumptions.targetFraction)) state.targetS = String(assumptions.targetFraction * 100);
  const events = Array.isArray(raw.events) ? raw.events : [];
  return parseProject({
      format: "unbuilt-project",
      ...(typeof raw.projectName === "string" ? { name: raw.projectName } : {}),
      version: usesShapedStreets(state.baseSpec.planning?.streetNetwork)||Array.isArray(raw.alternatives)&&raw.alternatives.some(a=>isRecord(a)&&isRecord(a.state)&&isRecord(a.state.baseSpec)&&isRecord(a.state.baseSpec.planning)&&usesShapedStreets(a.state.baseSpec.planning.streetNetwork))?14:site.development!==undefined||Array.isArray(raw.alternatives)&&raw.alternatives.some(a=>isRecord(a)&&isRecord(a.state)&&isRecord(a.state.baseSpec)&&a.state.baseSpec.development!==undefined)?13:raw.alternatives!==undefined?12:state.baseSpec.costAssumptions!==undefined?11:state.baseSpec.planning?.openSpaces!==undefined?10:state.baseSpec.planning?.housing ? 9 : state.baseSpec.planning?.lotPlan !== undefined ? 8 : state.baseSpec.planning?.streetNetwork !== undefined ? 7 : state.siteContext !== undefined ? 6 : state.baseSpec.contents !== undefined ? 5 : state.entrance.boundaryEdge !== undefined || state.baseSpec.planning?.minGreenArea !== undefined ? 4 : site.planning !== undefined ? 3 : site.boundary !== undefined ? 2 : 1,
      savedAt: new Date().toISOString(),
      state,
      ...(raw.alternatives!==undefined?{alternatives:raw.alternatives}:{}),
      decisions: events.filter((d) => isRecord(d)).map((d) => ({ t: String((d as Record<string, unknown>).t ?? ""), kind: String((d as Record<string, unknown>).kind ?? ""), detail: String((d as Record<string, unknown>).detail ?? "") })),
      photo: { included: false, note: "Reference photos are session-only and never stored." },
  });
}
