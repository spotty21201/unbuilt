// Coder developer test for canonical scenario snapshots (v0.4).
// Hash stability and validation rules are hand-derived from the contract:
// same plan in any key order hashes the same; any material change hashes
// different; untrusted input is refused with reasons, never half-accepted.
import { CAPABILITIES, SNAPSHOT_VERSION, canonicalize, snapshotHash, validateSnapshot } from "../src/snapshot.ts";
import { cedarMarket } from "../src/geometry.ts";

let failures = 0;
function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${ok ? "PASS" : "FAIL"} ${name}: actual=${JSON.stringify(actual)}`);
  if (!ok) { console.log(`  expected=${JSON.stringify(expected)}`); failures++; }
}

const cedar = cedarMarket();
function cedarSnapshot() {
  return {
    version: 1,
    site: { w: 120, h: 100 },
    entrance: cedar.entrance,
    green: cedar.green,
    greenLocked: true,
    lots: {},
    spec: { family: "spine", frontage: 10 },
    profileId: "starter-150",
    assumptions: { price: 850_000_000, ceiling: 900_000_000, owner: 10_000_000_000, target: 0.15 },
    provenance: { sample: "cedar", photo: false },
    capabilities: [...CAPABILITIES],
    selected: { kind: "green", id: "grove-a" },
  };
}

const good = cedarSnapshot();
check("version-is-4", SNAPSHOT_VERSION, 4);
check("accepts-cedar", validateSnapshot(good).ok, true);

// Key order in must not affect the hash: reversed top-level object hashes same.
const reversed = Object.fromEntries(Object.entries(good).reverse());
check("hash-stable-key-order", snapshotHash(validateSnapshot(reversed).snapshot), snapshotHash(good));

// Any material change hashes different: +1 home price, unlocked green, loop.
const touched = { ...good, assumptions: { ...good.assumptions, price: 850_000_001 } };
check("hash-moves-on-price", snapshotHash(touched) === snapshotHash(good), false);
check("hash-moves-on-lock", snapshotHash({ ...good, greenLocked: false }) === snapshotHash(good), false);
check("hash-moves-on-spec", snapshotHash({ ...good, spec: { family: "loop", frontage: 10 } }) === snapshotHash(good), false);
// Selection is context, not plan: it travels with the snapshot but must not
// change the plan identity used by captures/proposals. (Hash includes it so a
// proposal bound to a selection cannot be replayed as another.)
check("hash-moves-on-selection", snapshotHash({ ...good, selected: null }) === snapshotHash(good), false);

// Refusals: wrong version, non-object, bad site, bad edge, bad green,
// bad lock flag, bad lots (>12 corners), bad spec, unknown profile,
// non-finite assumption, bad provenance, unknown capability, bad selection.
const bad = (mut) => validateSnapshot(mut(cedarSnapshot())).ok;
check("rejects-version", bad((s) => ({ ...s, version: 99 })), false);
check("rejects-nonobject", validateSnapshot(null).ok, false);
check("rejects-site", bad((s) => ({ ...s, site: { w: -1, h: 100 } })), false);
check("rejects-edge", bad((s) => ({ ...s, entrance: { edge: "north", offset: 1, width: 8 } })), false);
check("rejects-green", bad((s) => ({ ...s, green: { x: 1, y: 2, w: 3 } })), false);
check("rejects-lock", bad((s) => ({ ...s, greenLocked: "yes" })), false);
const poly13 = Array.from({ length: 13 }, (_, i) => ({ x: i, y: 0 }));
check("rejects-13-corners", bad((s) => ({ ...s, lots: { r1: poly13 } })), false);
check("rejects-spec", bad((s) => ({ ...s, spec: { family: "ring", frontage: 10 } })), false);
check("rejects-profile", bad((s) => ({ ...s, profileId: "tower-99" })), false);
check("rejects-nan", bad((s) => ({ ...s, assumptions: { ...s.assumptions, price: NaN } })), false);
check("rejects-provenance", bad((s) => ({ ...s, provenance: { sample: "cedar", photo: true } })), false);
check("rejects-capability", bad((s) => ({ ...s, capabilities: ["rect-site", "teleport"] })), false);
check("rejects-selection", bad((s) => ({ ...s, selected: { kind: "tree", id: "x" } })), false);
// Errors carry reasons.
const err = validateSnapshot({ ...good, profileId: "tower-99" });
check("reason-present", err.ok === false && typeof err.error === "string" && err.error.length > 0, true);

// Canonicalize: nested key order and 0.1+0.2 rounding are stable.
check("canon-order", canonicalize({ b: 1, a: { d: 2, c: 1 } }), '{"a":{"c":1,"d":2},"b":1}');
check("canon-round", canonicalize({ v: 0.1 + 0.2 }), '{"v":0.3}');

if (failures > 0) { console.error(`${failures} FAILURES`); process.exit(1); }
console.log("ALL FIXTURES PASS");
