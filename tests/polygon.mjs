// Polygon lot fixtures (Coder-owned impl test). Pure-predicate expectations
// hand-derived; Cedar-based integration uses deterministic generation but
// asserts hand-computed area deltas, never snapshots of implementation output.
import {
  MAX_LOT_VERTICES,
  centroid,
  edgeLengths,
  isSimple,
  pointInPoly,
  polyArea,
  polyInsideSite,
  polyOverlapsRect,
  polysOverlap,
  rectInsidePoly,
  sharedBoundaryLength,
} from "../src/polygon.ts";
import {
  cedarMarket,
  deriveQuantities,
  generateSpine,
  lotRoadFrontage,
  placeFootprint,
  validateLayout,
  validateLotPoly,
} from "../src/geometry.ts";
import { BASE_PROFILE, failingLots } from "../src/search.ts";

let failures = 0;
function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${ok ? "PASS" : "FAIL"} ${name}: actual=${JSON.stringify(actual)}`);
  if (!ok) { console.log(`  expected=${JSON.stringify(expected)}`); failures++; }
}

const sq = [
  { x: 0, y: 0 },
  { x: 10, y: 0 },
  { x: 10, y: 10 },
  { x: 0, y: 10 },
];
// Concave L: 6x6 missing the top-right 3x3 -> 36 - 9 = 27.
const ell = [
  { x: 0, y: 0 },
  { x: 6, y: 0 },
  { x: 6, y: 3 },
  { x: 3, y: 3 },
  { x: 3, y: 6 },
  { x: 0, y: 6 },
];
// Bowtie: the two diagonals cross at (2,2).
const bow = [
  { x: 0, y: 0 },
  { x: 4, y: 4 },
  { x: 4, y: 0 },
  { x: 0, y: 4 },
];

check("sq-area", polyArea(sq), 100);
check("ell-area", polyArea(ell), 27);
check("sq-edges", edgeLengths(sq), [10, 10, 10, 10]);
check("sq-centroid", centroid(sq), { x: 5, y: 5 });
check("sq-simple", isSimple(sq), true);
check("ell-simple", isSimple(ell), true);
check("bow-simple", isSimple(bow), false);
check("two-simple", isSimple([{ x: 0, y: 0 }, { x: 1, y: 1 }]), false);
check("dup-simple", isSimple([{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 0 }, { x: 0, y: 4 }]), false);

check("in-square", pointInPoly({ x: 1, y: 1 }, sq), true);
check("out-square", pointInPoly({ x: 11, y: 5 }, sq), false);
check("on-edge-inside", pointInPoly({ x: 10, y: 5 }, sq), true);
check("in-notch", pointInPoly({ x: 4, y: 4 }, ell), false);
check("in-ell", pointInPoly({ x: 1, y: 5 }, ell), true);

check("site-in", polyInsideSite(sq, 120, 100), true);
check("site-out", polyInsideSite(sq, 9, 100), false);

// Shared boundary: road (0,10,10,6) shares the full 10 m north edge of sq.
check("shared-full", sharedBoundaryLength(sq, { x: 0, y: 10, w: 10, h: 6 }), 10);
check("shared-corner", sharedBoundaryLength(sq, { x: 10, y: 10, w: 6, h: 6 }), 0);
check("shared-none", sharedBoundaryLength(sq, { x: 20, y: 20, w: 6, h: 6 }), 0);

// Adjacent lots sharing a boundary do NOT overlap; a 1 m push does.
const east = sq.map((p) => ({ x: p.x + 10, y: p.y }));
check("adjacent-no-overlap", polysOverlap(sq, east), false);
check("shifted-overlap", polysOverlap(sq, east.map((p) => ({ x: p.x - 1, y: p.y }))), true);
check("rect-adjacent", polyOverlapsRect(sq, { x: 10, y: 0, w: 5, h: 10 }), false);
check("rect-pushed", polyOverlapsRect(sq, { x: 9, y: 0, w: 5, h: 10 }), true);
check("rect-inside", polyOverlapsRect([{ x: -5, y: -5 }, { x: 15, y: -5 }, { x: 15, y: 15 }, { x: -5, y: 15 }], { x: 0, y: 0, w: 10, h: 10 }), true);

check("fp-inside", rectInsidePoly({ x: 2, y: 2, w: 6, h: 6 }, sq), true);
check("fp-cross", rectInsidePoly({ x: 8, y: 8, w: 6, h: 6 }, sq), false);

check("place-normal", placeFootprint({ x: 0, y: 0, w: 10, h: 20 }), { x: 2, y: 5, w: 6, h: 10 });
check("place-none", placeFootprint({ x: 0, y: 0, w: 5, h: 5 }), null);

// Cedar integration: spine lot rectangles are 10 x 20 (area 200).
const site = cedarMarket();
const layout = generateSpine(site, 10);
check("cedar-clean", validateLayout(site, layout).length, 0);
const i0 = 0;
const r0 = layout.parcels[i0];
// Parcel 0 is a north-row lot fronting the spine road along its full north
// (top) edge: confirm that edge, then inset the other three sides only, so
// road access (and the 10 m shared boundary) survives by construction.
check("front-edge-on-road", lotRoadFrontage(layout.roads, [
  { x: r0.x, y: r0.y },
  { x: r0.x + r0.w, y: r0.y },
  { x: r0.x + r0.w, y: r0.y + r0.h },
  { x: r0.x, y: r0.y + r0.h },
]), r0.w);
const inset = [
  { x: r0.x + 1, y: r0.y + 1 },
  { x: r0.x + r0.w - 1, y: r0.y + 1 },
  { x: r0.x + r0.w - 1, y: r0.y + r0.h },
  { x: r0.x + 1, y: r0.y + r0.h },
];
// Area (10-2) x (20-1) = 152 by hand; the placed home and frontage survive.
check("inset-area", polyArea(inset), (r0.w - 2) * (r0.h - 1));
check("inset-valid", validateLotPoly(site, layout, i0, inset), []);
const edits = new Map([[i0, inset]]);
check("joint-valid", validateLayout(site, layout, edits).length, 0);
// Quantities use true area: parcelArea drops by exactly 200 - 152 = 48, and
// the remainder absorbs it (reconciliation, not silent loss).
const before = deriveQuantities(site, layout);
const after = deriveQuantities(site, layout, edits);
check("area-delta", Math.round(before.parcelArea - after.parcelArea), 48);
check("remainder-absorbs", Math.round(after.unallocatedArea - before.unallocatedArea), 48);
check("recon", Math.round(after.parcelArea + after.roadArea + after.greenArea + after.unallocatedArea), site.w * site.h);
// True-area applicability: 152 m² falls below the 180 m² Family profile floor.
check("inset-fails-profile", failingLots(layout.parcels, BASE_PROFILE, { lotEdits: edits, roads: layout.roads }).includes(i0), true);
// Insetting the sides shortened the shared edge 10 -> 8: true-edge math.
check("frontage-true", lotRoadFrontage(layout.roads, inset), r0.w - 2);

// Rejections carry reasons; the last valid plan is never adjusted.
check("bow-no", validateLotPoly(site, layout, i0, bow).length > 0, true);
check("outside-no", validateLotPoly(site, layout, i0, sq.map((p) => ({ x: p.x + 200, y: p.y }))).length > 0, true);
// A tab poking 2 m into the road band while the frontage edge stays put:
// access survives, so the road-overlap reason must fire.
const intoRoad = [
  { x: r0.x, y: r0.y },
  { x: r0.x + r0.w, y: r0.y },
  { x: r0.x + r0.w, y: r0.y + r0.h + 2 },
  { x: r0.x + 6, y: r0.y + r0.h + 2 },
  { x: r0.x + 6, y: r0.y + r0.h },
  { x: r0.x, y: r0.y + r0.h },
];
check("road-no", validateLotPoly(site, layout, i0, intoRoad), ["reshaped lot overlaps a road"]);
// A 2 m grab eastwards keeps access but takes lot 2's ground.
const grabEast = [
  { x: r0.x, y: r0.y },
  { x: r0.x + r0.w + 2, y: r0.y },
  { x: r0.x + r0.w + 2, y: r0.y + r0.h },
  { x: r0.x, y: r0.y + r0.h },
];
check("neighbor-no", validateLotPoly(site, layout, i0, grabEast), ["reshaped lot overlaps lot 2"]);
// Shrink across the placed home: rejected, never relocated.
const tiny = [
  { x: r0.x, y: r0.y },
  { x: r0.x + 4, y: r0.y },
  { x: r0.x + 4, y: r0.y + 4 },
  { x: r0.x, y: r0.y + 4 },
];
check("footprint-no", validateLotPoly(site, layout, i0, tiny).length > 0, true);
// Detached from every road: access lost.
const far = [
  { x: 50, y: 80 },
  { x: 60, y: 80 },
  { x: 60, y: 90 },
  { x: 50, y: 90 },
];
check("access-no", validateLotPoly(site, layout, 1, far).length > 0, true);
check("dangling-no", validateLotPoly(site, layout, 9999, inset).length > 0, true);
const many = Array.from({ length: MAX_LOT_VERTICES + 1 }, (_, k) => ({ x: 50 + k, y: 80 + (k % 2) }));
check("vertex-cap", validateLotPoly(site, layout, 1, many).length > 0, true);

// Two jointly edited neighbours overlapping each other are caught poly-vs-poly.
const r1 = layout.parcels[1];
const grab = [
  { x: r1.x - 2, y: r1.y },
  { x: r1.x + r1.w, y: r1.y },
  { x: r1.x + r1.w, y: r1.y + r1.h },
  { x: r1.x - 2, y: r1.y + r1.h },
];
const joint = new Map([[i0, inset], [1, grab]]);
check("joint-overlap", validateLayout(site, layout, joint).length > 0, true);

if (failures > 0) { console.error(`${failures} FAILURES`); process.exit(1); }
console.log("ALL POLYGON FIXTURES PASS");
