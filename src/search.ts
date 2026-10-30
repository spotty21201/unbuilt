// UNBUILT bounded search (Coder-owned). Enumerates family x frontage combos,
// enforces locks + ceiling + per-lot profile applicability, selects up to three
// distinct candidates by transparent objectives. Budget-capped, deterministic.
import {
  checkGreenLock,
  deriveQuantities,
  editsForLayout,
  generateLoop,
  generateSpine,
  lotRoadFrontage,
  rectArea,
  validateLayout,
  type Layout,
  type LotEdits,
  type Site,
  type StableEdits,
} from "./geometry.ts";
import { hasHome, hasLayout } from './contents.ts';
import { polyArea } from "./polygon.ts";
import { evaluateLayout } from "./economics.ts";
import type { Candidate, Locks, ProductProfile, Rect, SearchRanges, SearchRun } from "./schema.ts";

const M = 1_000_000;

// Fictional labeled profiles for Cedar Market. Not market evidence.
export const BASE_PROFILE: ProductProfile = {
  id: "family-200",
  name: "Family 200 (fictional)",
  lotAreaMin: 180,
  lotAreaMax: 300,
  frontageMin: 9,
  priceLow: 780 * M,
  priceBase: 850 * M,
  priceHigh: 920 * M,
  source: "Fictional broker note BM-01: 180-300 m2 family lots at Rp780-920m (reported assumption, not verified sale).",
};

export const COMPACT_PROFILE: ProductProfile = {
  id: "starter-150",
  name: "Starter 150 (fictional)",
  lotAreaMin: 140,
  lotAreaMax: 220,
  frontageMin: 7,
  priceLow: 620 * M,
  priceBase: 680 * M,
  priceHigh: 740 * M,
  source: "Fictional broker note BM-02: 140-220 m2 starter lots at Rp620-740m (reported assumption, not verified sale).",
};

export interface SearchRequest {
  site: Site;
  profile: ProductProfile;
  selectedPrice: number; // assumed achievable price, must sit at or below ceiling
  locks: Locks;
  ranges: SearchRanges;
  seed: number;
  budget: number; // max candidates tested (PRD starting budget: 250)
  // Manual reshapes by stable base-rect key: each tested layout carries the
  // edits whose base rectangle it reproduces verbatim. Search never invents
  // or silently drops manual work; incompatible combos simply run clean.
  lotEdits?: StableEdits;
}

function hashSnapshot(obj: unknown): string {
  const s = JSON.stringify(obj);
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(16).padStart(8, "0");
}

function buildLayout(site: Site, family: "spine" | "loop", frontage: number): Layout {
  return family === "spine" ? generateSpine(site, frontage) : generateLoop(site, frontage);
}

// Per-lot profile applicability. Shared by search and the working-plan check.
// Reshaped lots use true polygon area and the true road-shared boundary as
// frontage, never rectangle averages; roads must accompany lotEdits.
export function failingLots(
  parcels: Rect[],
  profile: ProductProfile,
  opts: { lotEdits?: LotEdits; roads?: Rect[] } = {},
): number[] {
  const out: number[] = [];
  parcels.forEach((p, i) => {
    const edit = opts.lotEdits?.get(i);
    const area = edit ? polyArea(edit) : rectArea(p);
    const frontage = edit
      ? opts.roads
        ? lotRoadFrontage(opts.roads, edit)
        : 0
      : Math.min(p.w, p.h);
    // Non-finite measurements never pass: unknown is not compliant.
    if (!Number.isFinite(area) || !Number.isFinite(frontage)) {
      out.push(i);
      return;
    }
    if (area < profile.lotAreaMin || area > profile.lotAreaMax) out.push(i);
    else if (frontage < profile.frontageMin) out.push(i);
  });
  return out;
}

export function runSearch(req: SearchRequest): SearchRun {
  const t0 = Date.now();
  const snapshotHash = hashSnapshot({
    site: req.site,
    profile: req.profile.id,
    selectedPrice: req.selectedPrice,
    locks: req.locks,
    ranges: req.ranges,
    seed: req.seed,
    lotEdits: req.lotEdits ?? {},
  });
  if (!hasLayout(req.site) || req.site.planning?.lotPlan!==undefined) return {
    snapshotHash, seed: req.seed, tested: 0, valid: 0, qualified: 0,
    breakdown: { geometryValid: 0, applicable: 0, priceOk: 0, targetOk: 0 },
    truncated: false, elapsedMs: Date.now() - t0, candidates: [],
    blockers: [req.site.planning?.lotPlan!==undefined?'Manual lots are held. Use Blocks & lots for direct edits, or explicitly preview generated lots before searching frontage alternatives.':'Generate a layout inside the accepted boundary before searching alternatives.'],
  };
  const combos: Array<{ family: "spine" | "loop"; frontage: number }> = [];
  for (const family of req.ranges.families) {
    for (const frontage of req.ranges.frontages) combos.push({ family, frontage });
  }
  const truncated = combos.length > req.budget;
  const tested = combos.slice(0, req.budget);

  const candidates: Candidate[] = [];
  let priceVetoes = 0;
  let profileVetoes = 0;
  let geometryVetoes = 0;
  let greenVetoes = 0;
  let targetOkCount = 0;
  for (const { family, frontage } of tested) {
    const layout = buildLayout(req.site, family, frontage);
    if (layout.empty) { geometryVetoes++; continue; }
    const carried = editsForLayout(layout.parcels, req.lotEdits ?? {});
    const validationErrors = validateLayout(req.site, layout, carried);
    const greenHeld = req.site.planning?.openSpaces!==undefined?JSON.stringify(layout.openSpaces)===JSON.stringify(req.site.planning.openSpaces):checkGreenLock(req.locks.green, layout.green).length===0;
    const priceOk = req.site.planning?.priceLocked === false || req.selectedPrice <= req.locks.priceCeiling;
    const failing = failingLots(layout.parcels, req.profile, { lotEdits: carried, roads: layout.roads }).filter(i => hasHome(req.site, layout.parcels[i]));
    const quantities = deriveQuantities(req.site, layout, carried);
    const applicable = failing.length === 0 && quantities.n > 0;
    const econ = evaluateLayout(req.site, layout, req.selectedPrice, {
      ownerExpectation: req.locks.ownerExpectation,
      targetFraction: req.locks.targetFraction,
    }, carried);
    if (validationErrors.length > 0) geometryVetoes++;
    if (!greenHeld) greenVetoes++;
    if (!priceOk) priceVetoes++;
    if (!applicable) profileVetoes++;
    // Target-surplus compliance is counted but never a veto: a non-negative
    // land allowance means the target is achievable at the assumed price.
    if (econ.finance.landAllowance >= 0) targetOkCount++;
    const qualified =
      validationErrors.length === 0 && greenHeld && priceOk && applicable;
    if (qualified) {
      const lots: Record<number, { x: number; y: number }[]> = {};
      for (const [i, pts] of carried) lots[i] = pts.map((p) => ({ ...p }));
      candidates.push({
        id: `${family}-f${frontage}`,
        family,
        frontage,
        lots,
        quantities,
        validationErrors,
        greenHeld,
        priceOk,
        applicable,
        failingLots: failing,
        roadCost: econ.roadCost,
        costNonLand: econ.costNonLand,
        finance: econ.finance,
      });
    }
  }

  const blockers: string[] = [];
  if (candidates.length === 0) {
    blockers.push(
      `No qualifying candidate in ${tested.length} tested (seed ${req.seed}). ` +
        `Geometry invalid: ${geometryVetoes}. Green lock broken: ${greenVetoes}. ` +
        `Price above Rp${req.locks.priceCeiling / M}m ceiling: ${priceVetoes}. ` +
        `Out of ${req.profile.name} profile: ${profileVetoes}. ` +
        `This covers only the tested ranges, not all conceivable designs.`,
    );
  }
  if (truncated) {
    blockers.push(
      `Budget ${req.budget} truncated ${combos.length - req.budget} untested combos; widen budget to test them.`,
    );
  }
  return {
    snapshotHash,
    seed: req.seed,
    tested: tested.length,
    valid: tested.length - geometryVetoes,
    qualified: candidates.length,
    breakdown: {
      geometryValid: tested.length - geometryVetoes,
      applicable: tested.length - profileVetoes,
      priceOk: tested.length - priceVetoes,
      targetOk: targetOkCount,
    },
    truncated,
    elapsedMs: Date.now() - t0,
    blockers,
    candidates,
  };
}

export type Ordering = "lowest-road" | "highest-allowance" | "most-homes";

// Up to three geometrically distinct candidates, ordered by a stated objective.
// Distinct means measured geometry differs (same parameter combos can converge
// to identical layouts). Fewer when the search yields fewer; never padded.
export function selectUpToThree(candidates: Candidate[], ordering: Ordering): Candidate[] {
  const seen = new Set<string>();
  const distinct = candidates.filter((c) => {
    const key = `${c.family}|${c.quantities.n}|${c.quantities.roadArea}|${c.quantities.parcelArea}|${c.quantities.greenArea}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const value =
    ordering === "lowest-road"
      ? (c: Candidate) => c.quantities.roadArea
      : ordering === "highest-allowance"
        ? (c: Candidate) => -c.finance.landAllowance
        : (c: Candidate) => -c.quantities.n;
  const label =
    ordering === "lowest-road"
      ? "lowest road area"
      : ordering === "highest-allowance"
        ? "highest land allowance"
        : "most valid homes";
  return distinct
    .sort((a, b) => value(a) - value(b))
    .slice(0, 3)
    .map((c) => ({
      ...c,
      reason:
        ordering === "lowest-road"
          ? `${label}: ${c.quantities.roadArea} m2 road, ${c.quantities.n} homes`
          : ordering === "highest-allowance"
            ? `${label}: Rp${Math.round(c.finance.landAllowance / M)}m, ${c.quantities.n} homes`
            : `${label}: ${c.quantities.n} homes, ${c.quantities.roadArea} m2 road`,
    }));
}
