// UNBUILT assistant core (Coder-owned). Pure deterministic answer composer:
// the assistant reasons around validated tools, never instead of them. Every
// figure in every answer is passed in from engine outputs; the composer adds
// structure and labels, never numbers. Keyword routing is disclosed, not
// dressed as understanding. Hypotheses stay labeled until the engine tests
// them. No I/O, no model calls — the panel and (later) the server composer
// share this module.
export type AssistantQuestion = "true" | "why" | "try" | "clarify";

export interface PlanFacts {
  label: string;
  kind: string;
  measurements: string[];
  quantities: { n: number; roadArea: number; greenArea: number; parcelArea: number; unallocatedArea: number };
  finance: {
    revenue: number;
    costNonLand: number;
    landAllowance: number;
    ownerGap: number;
    surplus: number;
    price: number;
    ceiling: number;
    owner: number;
    target: number;
  } | null;
  validity: { errors: string[]; warnings: string[] };
  commitments: string[];
  provenance: string;
}

export interface TryContext {
  selectionLabel: string;
  locksHeld: string[];
  gridScope: string;
  uncertainties: string[];
  requestText: string;
}

export interface AnswerSection {
  heading: string;
  lines: string[];
}

// Deterministic keyword routing. Returned label names the matched route so
// the panel can disclose it ("matched: why — changed/compare words").
export function routeQuestion(q: string): { route: AssistantQuestion; matched: string[] } {
  const t = q.toLowerCase();
  const has = (...words: string[]) => words.filter((w) => t.includes(w));
  const why = has("why", "chang", "differ", "delta", "compar", "versus", "vs ");
  if (why.length > 0) return { route: "why", matched: why };
  const tryQ = has("try", "suggest", "alternative", "option", "search", "run", "investigat", "what else", "what if", "could we");
  if (tryQ.length > 0) return { route: "try", matched: tryQ };
  const tru = has("what is", "true", "tell me", "how many", "cost", "worth", "allowance", "shortfall", "show", "summar");
  if (tru.length > 0) return { route: "true", matched: tru };
  if (t.trim().length === 0) return { route: "clarify", matched: [] };
  return { route: "clarify", matched: [] };
}

// "What is true": structure around passed-in facts only. No inference, no
// causes, no suggestions — those belong to the why/try answers.
export function answerTrue(f: PlanFacts): AnswerSection[] {
  const money = (v: number) => `Rp${(v / 1_000_000_000).toFixed(2)}bn`;
  const sections: AnswerSection[] = [
    { heading: `${f.label} — measured facts`, lines: [...f.measurements] },
    {
      heading: "Quantities (from geometry)",
      lines: [
        `${f.quantities.n} homes with valid footprints`,
        `${Math.round(f.quantities.roadArea).toLocaleString("en-US")} m² road (intersections counted once)`,
        `${Math.round(f.quantities.greenArea).toLocaleString("en-US")} m² shared green`,
        `${Math.round(f.quantities.parcelArea).toLocaleString("en-US")} m² parcels`,
        `${Math.round(f.quantities.unallocatedArea).toLocaleString("en-US")} m² unallocated remainder (not designed open space)`,
      ],
    },
  ];
  sections.push(
    f.finance
      ? {
          heading: `Economics (priced at Rp${f.finance.price}m/home)`,
          lines: [
            `Revenue ${money(f.finance.revenue)}; non-land costs ${money(f.finance.costNonLand)}`,
            `Land allowance ${money(f.finance.landAllowance)} — what the land is worth to this scheme before paying the owner`,
            f.finance.ownerGap > 0
              ? `Owner shortfall ${money(f.finance.ownerGap)} against Rp${f.finance.owner}bn expectation (a benchmark, not a constraint)`
              : f.finance.ownerGap < 0
                ? `Owner headroom ${money(-f.finance.ownerGap)} against Rp${f.finance.owner}bn expectation`
                : "Meets the owner expectation exactly",
            `Ceiling Rp${f.finance.ceiling}m/home; target surplus ${f.finance.target}% of revenue`,
          ],
        }
      : { heading: "Economics", lines: ["Unavailable — a valid layout and complete economics inputs are required; no priced figure applies to this plan."] },
  );
  sections.push({
    heading: "Validity and commitments",
    lines: [
      ...f.validity.errors.map((e) => `Invalid: ${e}`),
      ...f.validity.warnings.map((w) => `Warning: ${w}`),
      ...(f.validity.errors.length === 0 && f.validity.warnings.length === 0 ? ["Geometry valid; economics inputs complete."] : []),
      ...f.commitments.map((c) => `Held: ${c}`),
      f.provenance,
    ],
  });
  return sections;
}

// "What could we try": a bounded investigation hypothesis. Names the exact
// locks, the exact search scope, and the unknowns — never a predicted
// outcome. The outcome is computed only when the engine runs.
export function answerTry(c: TryContext): AnswerSection[] {
  return [
    {
      heading: `Hypothesis for ${c.selectionLabel} (untested until the engine runs)`,
      lines: [
        `Investigate: ${c.requestText}`,
        `Would hold: ${c.locksHeld.length > 0 ? c.locksHeld.join("; ") : "no locks — say what must not change"}`,
        `Would test: ${c.gridScope}`,
        ...c.uncertainties.map((u) => `Unknown: ${u}`),
        "No outcome is claimed here — Preview will show measured plans or an honest no-result.",
      ],
    },
  ];
}

export function clarifyText(): AnswerSection[] {
  return [
    {
      heading: "What I can answer from this plan",
      lines: [
        "What is true — measured facts about the selection, quantities, economics, validity, and commitments.",
        "Why it changed — measured deltas between two versions (preview an option first, then ask).",
        "What to try — a bounded investigation proposal naming locks, search scope, and unknowns.",
        "I match keywords to these three, openly. I never invent layouts, prices, or outcomes.",
      ],
    },
  ];
}
