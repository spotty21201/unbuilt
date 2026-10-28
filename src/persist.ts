// UNBUILT durable project persistence (Coder-owned). Pure serialize/parse
// for localStorage autosave and file import. Photos are NEVER persisted
// (blob URLs die with the session and bytes exceed quota): restores always
// report the photo as not included. Version-gated: unknown versions refuse.
import { siteFrameErrors, type SiteFrame } from "./boundary.ts";
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
}

export interface PersistedProject {
  format: "unbuilt-project";
  version: 1 | 2 | 3 | 4;
  savedAt: string;
  state: PersistedState;
  decisions: PersistedDecision[];
  photo: { included: false; note: string };
}

export function serializeProject(state: PersistedState, decisions: PersistedDecision[]): PersistedProject {
  return {
    format: "unbuilt-project",
    version: state.entrance.boundaryEdge !== undefined || state.baseSpec.planning?.minGreenArea !== undefined ? 4 : state.baseSpec.planning ? 3 : state.baseSpec.boundary ? 2 : 1,
    savedAt: new Date().toISOString(),
    state: JSON.parse(JSON.stringify(state)) as PersistedState,
    decisions: decisions.map((d) => ({ ...d })),
    photo: { included: false, note: "Reference photos are session-only and never stored." },
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
  if (raw.format === "UNBUILT decision record" || raw.exportVersion === 2 || raw.exportVersion === 3 || raw.exportVersion === 4 || raw.exportVersion === 5) {
    return fromDecisionRecord(raw);
  }
  if (raw.format !== "unbuilt-project") return fail(`unknown format ${JSON.stringify(raw.format)}`);
  if (raw.version !== 1 && raw.version !== 2 && raw.version !== 3 && raw.version !== 4) return fail(`unsupported project version ${JSON.stringify(raw.version)}: created by a newer app`);
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
  if (st.entrance.boundaryEdge !== undefined && (raw.version !== 4 || !(st.baseSpec as Record<string, unknown>)?.planning || !Number.isInteger(st.entrance.boundaryEdge) || (st.entrance.boundaryEdge as number) < 0 || (st.entrance.boundaryEdge as number) >= (Array.isArray((st.baseSpec as Record<string, unknown>)?.boundary) ? ((st.baseSpec as Record<string, unknown>).boundary as unknown[]).length : 4))) return fail("Entrance boundary edge must address a live-planning site edge.");
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
  if (st.baseSpec.planning !== undefined && raw.version !== 3 && raw.version !== 4) return fail("Planning parameters require project version 3.");
  if ((st.baseSpec.planning as Record<string, unknown> | undefined)?.minGreenArea !== undefined && raw.version !== 4) return fail("Minimum open space requires project version 4.");
  const shapeErrors = siteFrameErrors(st.baseSpec as unknown as SiteFrame);
  if (shapeErrors.length) return fail(shapeErrors[0]);
  if (!Array.isArray(raw.decisions) || !raw.decisions.every((d) => isRecord(d) && typeof d.t === "string" && typeof d.kind === "string" && typeof d.detail === "string")) {
    return fail("decisions must be [{t, kind, detail} strings]");
  }
  const project = raw as unknown as PersistedProject;
  return { ok: true, project };
}

function fromDecisionRecord(raw: Record<string, unknown>): { ok: true; project: PersistedProject } | Fail {
  const st = raw.state;
  if (!isRecord(st)) return fail("decision record has no state snapshot");
  const site = isRecord(st.site) ? st.site : {};
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
    baseSpec: { w, h, ...(site.planning !== undefined ? { planning: site.planning as SiteFrame["planning"] } : {}), ...(site.boundary !== undefined ? { boundary: site.boundary as SiteFrame["boundary"] } : {}) },
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
      version: state.entrance.boundaryEdge !== undefined || state.baseSpec.planning?.minGreenArea !== undefined ? 4 : site.planning !== undefined ? 3 : site.boundary !== undefined ? 2 : 1,
      savedAt: new Date().toISOString(),
      state,
      decisions: events.filter((d) => isRecord(d)).map((d) => ({ t: String((d as Record<string, unknown>).t ?? ""), kind: String((d as Record<string, unknown>).kind ?? ""), detail: String((d as Record<string, unknown>).detail ?? "") })),
      photo: { included: false, note: "Reference photos are session-only and never stored." },
  });
}
