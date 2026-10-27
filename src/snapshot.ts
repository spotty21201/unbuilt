// UNBUILT canonical scenario snapshot (Coder-owned). The single versioned,
// hashed unit of "this plan, these assumptions" shared by client, server,
// and the assistant. Snapshots are untrusted input: validate before use.
// The hash covers every material field; captures, previews, and proposals
// bind to it, never to a short UI label.
import { siteFrameErrors, type SiteFrame } from "./boundary.ts";
import { MAX_LOT_VERTICES } from "./polygon.ts";
import type { Rect } from "./schema.ts";
import type { Entrance } from "./geometry.ts";
import type { StableEdits } from "./geometry.ts";

export const SNAPSHOT_VERSION = 2;

// Staged capability envelope ids (v0.4 §8). Tools refuse what is absent.
export const CAPABILITIES = [
  "rect-site",
  "simple-site-64",
  "contained-axis-layouts",
  "rect-lots",
  "poly-reshape-12",
  "entrance-west-east",
  "open-space-lock",
  "bounded-search",
  "explain-deltas",
] as const;

export interface ScenarioSnapshot {
  version: 1 | 2;
  site: SiteFrame;
  entrance: Entrance;
  green: Rect;
  greenLocked: boolean;
  lots: StableEdits;
  spec: { family: "spine" | "loop"; frontage: number };
  profileId: string;
  assumptions: { price: number; ceiling: number; owner: number; target: number };
  provenance: { sample: "cedar" | "custom"; photo: false };
  capabilities: string[];
  selected: { kind: "green" | "lot" | "entrance" | "site" | "circulation" | "homes"; id: string } | null;
}

// Canonical JSON: sorted keys, fixed number formatting. Key order in,
// key order out — the same plan always hashes the same.
export function canonicalize(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canonicalize).join(",")}]`;
  if (typeof v === "object" && v !== null) {
    const rec = v as Record<string, unknown>;
    return `{${Object.keys(rec)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonicalize(rec[k])}`)
      .join(",")}}`;
  }
  if (typeof v === "number") {
    if (!Number.isFinite(v)) throw new Error("non-finite value in snapshot");
    return JSON.stringify(Math.round(v * 1000) / 1000);
  }
  return JSON.stringify(v);
}

// cyrb53: short deterministic digest, no dependencies.
export function snapshotHash(s: ScenarioSnapshot): string {
  const str = canonicalize({ ...s, selected: s.selected });
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function num(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function rect(v: unknown): v is Rect {
  return isRecord(v) && num(v.x) && num(v.y) && num(v.w) && num(v.h);
}

// Full validation of untrusted snapshots. Refuses with reasons; nothing
// partially accepted. Unknown capability ids refuse (tools must not run
// against an envelope they do not implement).
export function validateSnapshot(raw: unknown): { ok: true; snapshot: ScenarioSnapshot } | { ok: false; error: string } {
  if (!isRecord(raw)) return { ok: false, error: "snapshot must be an object" };
  if (raw.version !== 1 && raw.version !== SNAPSHOT_VERSION) {
    return { ok: false, error: `unsupported snapshot version ${JSON.stringify(raw.version)}` };
  }
  if (!isRecord(raw.site) || !num(raw.site.w) || !num(raw.site.h) || raw.site.w <= 0 || raw.site.h <= 0) {
    return { ok: false, error: "site must be {positive w, h}" };
  }
  if (raw.site.boundary !== undefined && (!Array.isArray(raw.site.boundary) || !raw.site.boundary.every((p) => isRecord(p) && num(p.x) && num(p.y)))) return { ok: false, error: "boundary must contain finite coordinate pairs" };
  if (raw.site.boundary !== undefined && raw.version !== 2) return { ok: false, error: "Polygon snapshots require version 2" };
  const shapeErrors = siteFrameErrors(raw.site as unknown as SiteFrame);
  if (shapeErrors.length) return { ok: false, error: shapeErrors[0] };
  const e = raw.entrance;
  if (!isRecord(e) || (e.edge !== "west" && e.edge !== "east") || !num(e.offset) || !num(e.width) || e.width <= 0) {
    return { ok: false, error: "entrance must be {edge west|east, finite offset, positive width}" };
  }
  if (!rect(raw.green)) return { ok: false, error: "green must be a finite rect" };
  if (typeof raw.greenLocked !== "boolean") return { ok: false, error: "greenLocked must be a boolean" };
  if (!isRecord(raw.lots)) return { ok: false, error: "lots must be an object" };
  for (const [k, v] of Object.entries(raw.lots)) {
    if (
      !Array.isArray(v) ||
      v.length < 3 ||
      v.length > MAX_LOT_VERTICES ||
      !v.every((p) => isRecord(p) && num(p.x) && num(p.y))
    ) {
      return { ok: false, error: `lots[${k}] must be 3-${MAX_LOT_VERTICES} finite corners` };
    }
  }
  if (!isRecord(raw.spec) || (raw.spec.family !== "spine" && raw.spec.family !== "loop") || !num(raw.spec.frontage) || raw.spec.frontage < 1 || raw.spec.frontage > 500) {
    return { ok: false, error: "spec must be {family spine|loop, frontage 1–500 m}" };
  }
  if (typeof raw.profileId !== "string" || (raw.profileId !== "starter-150" && raw.profileId !== "family-200")) {
    return { ok: false, error: "profileId must be a known product id" };
  }
  if (
    !isRecord(raw.assumptions) ||
    !num(raw.assumptions.price) ||
    !num(raw.assumptions.ceiling) ||
    !num(raw.assumptions.owner) ||
    !num(raw.assumptions.target)
  ) {
    return { ok: false, error: "assumptions must carry finite price/ceiling/owner/target" };
  }
  if (!isRecord(raw.provenance) || (raw.provenance.sample !== "cedar" && raw.provenance.sample !== "custom") || raw.provenance.photo !== false) {
    return { ok: false, error: "provenance must be {sample cedar|custom, photo false}" };
  }
  if (!Array.isArray(raw.capabilities) || !raw.capabilities.every((c) => typeof c === "string" && (CAPABILITIES as readonly string[]).includes(c))) {
    return { ok: false, error: "capabilities must be known envelope ids" };
  }
  const sel = raw.selected;
  if (
    sel !== null &&
    (!isRecord(sel) || typeof sel.id !== "string" || !["green", "lot", "entrance", "site", "circulation", "homes"].includes(sel.kind as string))
  ) {
    return { ok: false, error: "selected must be null or {kind, id}" };
  }
  return { ok: true, snapshot: raw as unknown as ScenarioSnapshot };
}
