// Coder developer test for custom sites (M3). Factory output is exact and
// generated circulation stays valid on any accepted size.
import { cedarMarket, entranceErrors, generateLoop, generateSpine, validateLayout } from "../src/geometry.ts";
import { makeSite, siteSizeErrors } from "../src/site.ts";

let failures = 0;
function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${ok ? "PASS" : "FAIL"} ${name}: actual=${JSON.stringify(actual)}`);
  if (!ok) { console.log(`  expected=${JSON.stringify(expected)}`); failures++; }
}

// Cedar Market is exactly makeSite(120, 100): no special cases.
check("cedar-is-factory", makeSite(120, 100), cedarMarket());
// Entrance is a west-edge gate centered vertically; green stays proportional.
check("maker-140x110", makeSite(140, 110), {
  w: 140, h: 110,
  entrance: { edge: "west", offset: 55, width: 8 },
  green: { x: 91, y: 68, w: 28, h: 22 },
});
// East-edge entrance mirrors circulation and still validates in both families.
const east = { ...makeSite(140, 110), entrance: { edge: "east", offset: 55, width: 8 } };
check("east-spine-valid", validateLayout(east, generateSpine(east, 10)).length, 0);
check("east-loop-valid", validateLayout(east, generateLoop(east, 11)).length, 0);
// Entrance positions validate: north edge unsupported, off-edge and zero-width rejected.
check("north-edge-no", entranceErrors({ ...makeSite(140, 110), entrance: { edge: "north", offset: 55, width: 8 } }).length > 0, true);
check("off-edge-no", entranceErrors({ ...makeSite(140, 110), entrance: { edge: "west", offset: 200, width: 8 } }).length > 0, true);
check("zero-width-no", entranceErrors({ ...makeSite(140, 110), entrance: { edge: "west", offset: 55, width: 0 } }).length > 0, true);
check("west-ok", entranceErrors(makeSite(140, 110)).length, 0);
// Generated circulation validates on a larger accepted site.
// F01: a gate the road network cannot reach never validates — the layout
// generated for the centered gate fails against the 95 m gate position.
const movedGate = { ...cedarMarket(), entrance: { edge: "west", offset: 95, width: 8 } };
check(
  "disconnected-gate",
  validateLayout(movedGate, generateSpine(cedarMarket(), 10)).some((e) => e.includes("no road reaches entrance")),
  true,
);
const big = makeSite(150, 120);
check("big-spine-valid", validateLayout(big, generateSpine(big, 10)).length, 0);
check("big-loop-valid", validateLayout(big, generateLoop(big, 11)).length, 0);
// Size rules: positive, loop ring needs its minimum footprint, sane maximum.
check("zero-rejected", siteSizeErrors(0, 100).length > 0, true);
check("small-rejected", siteSizeErrors(100, 100).length > 0, true);
check("huge-rejected", siteSizeErrors(600, 600).length > 0, true);
check("min-accepted", siteSizeErrors(120, 100).length, 0);
check("mid-accepted", siteSizeErrors(150, 120).length, 0);

if (failures > 0) { console.error(`${failures} FAILURES`); process.exit(1); }
console.log("ALL SITE FIXTURES PASS");
