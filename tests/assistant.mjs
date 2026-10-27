// Assistant eval fixtures (Coder-owned): the deterministic answer composer
// must route the three assistant questions, echo only supplied figures, and
// keep hypotheses labeled. Hand-derived: every expected figure below is
// copied from the fixture input on the line above it, never from a run.
import { answerTrue, answerTry, clarifyText, routeQuestion } from "../src/assistant.ts";

let failures = 0;
function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${ok ? "PASS" : "FAIL"} ${name}: actual=${JSON.stringify(actual)}`);
  if (!ok) failures++;
}

// Routing: the three questions plus genuine ambiguity.
check("route-why", routeQuestion("Why did the allowance change vs the loop?").route, "why");
check("route-compare", routeQuestion("compare working vs preview").route, "why");
check("route-try", routeQuestion("What else could we try here?").route, "try");
check("route-search", routeQuestion("run a search holding the green").route, "try");
check("route-true", routeQuestion("What is true about this plan?").route, "true");
check("route-worth", routeQuestion("What is the land worth here?").route, "true");
check("route-empty", routeQuestion("   ").route, "clarify");
check("route-vague", routeQuestion("make it nicer").route, "clarify");
check("route-discloses", routeQuestion("why did it change").matched.length > 0, true);

// True answer echoes fixture figures and labels the benchmark honestly.
const facts = {
  label: "Open space A",
  kind: "green",
  measurements: ["24 × 20 m at 78 m from west, 62 m from south — Locked"],
  quantities: { n: 20, roadArea: 720, greenArea: 480, parcelArea: 4000, unallocatedArea: 6800 },
  finance: {
    revenue: 17_000_000_000, costNonLand: 12_000_000_000, landAllowance: 3_559_600_000,
    ownerGap: 6_440_400_000, surplus: -1_000_000_000, price: 850, ceiling: 850, owner: 10, target: 15,
  },
  validity: { errors: [], warnings: [] },
  commitments: ["Open space A shape+location locked", "Price capped at Rp850m/home"],
  provenance: "Cedar Market sample — fictional prices",
};
const secs = answerTrue(facts);
const text = secs.map((s) => `${s.heading}\n${s.lines.join("\n")}`).join("\n");
check("true-sections", secs.length, 4);
check("true-echo-n", text.includes("20 homes with valid footprints"), true);
check("true-echo-allow", text.includes("Rp3.56bn"), true);
check("true-echo-gap", text.includes("Rp6.44bn"), true);
check("true-benchmark", text.includes("a benchmark, not a constraint"), true);
check("true-held", text.includes("Held: Open space A shape+location locked"), true);
// No invented figures: every Rp/decimal/m² number in the answer must appear
// in the fixture inputs above (measurements, quantities, finance).
const figures = [...text.matchAll(/Rp-?[\d.]+bn|Rp\d+m|[\d,]+ m²|\d+ homes/g)].map((m) => m[0]);
const allowed = new Set([
  "Rp17.00bn", "Rp12.00bn", "Rp3.56bn", "Rp6.44bn", "Rp1.00bn",
  "Rp850m", "Rp10bn", "20 homes",
  "720 m²", "480 m²", "4,000 m²", "6,800 m²",
]);
check("true-no-invention", figures.every((f) => allowed.has(f)), true);

// Incomplete economics: no priced figure, stated once.
const noEcon = answerTrue({ ...facts, finance: null });
check("true-noecon", noEcon.some((s) => s.lines.some((l) => l.includes("no priced figure"))), true);
// Invalid plan: errors labeled Invalid, never silently priced.
const bad = answerTrue({ ...facts, validity: { errors: ["road network disconnected"], warnings: [] } });
check("true-invalid", bad.some((s) => s.lines.some((l) => l === "Invalid: road network disconnected")), true);

// Try answer: locks, scope, unknowns, and the untested label — no outcome.
const trySecs = answerTry({
  selectionLabel: "Open space A",
  locksHeld: ["Open space A shape+location", "Price at or below Rp850m/home"],
  gridScope: "spine, loop × 9–12 m frontages, seed 7, budget 250",
  uncertainties: ["Whether any tested combo keeps all 20 homes"],
  requestText: "Keep this green space. Do not increase the home selling price. What else can change?",
});
const tryText = trySecs.map((s) => `${s.heading}\n${s.lines.join("\n")}`).join("\n");
check("try-locks", tryText.includes("Would hold: Open space A shape+location; Price at or below Rp850m/home"), true);
check("try-scope", tryText.includes("Would test: spine, loop × 9–12 m frontages, seed 7, budget 250"), true);
check("try-unknown", tryText.includes("Unknown: Whether any tested combo keeps all 20 homes"), true);
check("try-untested", tryText.includes("untested until the engine runs") && tryText.includes("No outcome is claimed here"), true);

// Clarify: states the three capabilities and the no-invention rule.
const cl = clarifyText().map((s) => s.lines.join(" ")).join(" ");
check("clarify-three", cl.includes("What is true") && cl.includes("Why it changed") && cl.includes("What to try"), true);
check("clarify-honest", cl.includes("never invent"), true);

if (failures > 0) { console.error(`${failures} FAILURES`); process.exit(1); }
console.log("ALL ASSISTANT FIXTURES PASS");
