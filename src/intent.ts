// UNBUILT intent parser (Coder-owned). Typed request -> explicit operations.
// Narrow and deterministic: only green-lock, price-ceiling, profile switch,
// and bounded-search ops exist. Everything else becomes clarification or a
// stated limitation. Never invents objects, prices, or tool calls.
export interface Selection {
  id: string;
  kind: "green" | "boundary" | "entrance";
  name: string;
}

export interface IntentContext {
  selected: Selection | null;
  selectedPrice: number;
}

export interface IntentOperations {
  lockGreen: boolean;
  greenId: string | null;
  priceCeiling: number | null;
  profileId: string | null;
  runSearch: boolean;
}

export interface IntentResult {
  kind: "proposal" | "clarification" | "limitation";
  text: string;
  operations: IntentOperations;
}

const none: IntentOperations = {
  lockGreen: false,
  greenId: null,
  priceCeiling: null,
  profileId: null,
  runSearch: false,
};

function parseMillions(text: string): number | null {
  const m = text.match(/rp\.?\s?([\d][\d.,]*)\s?m/i);
  if (!m) return null;
  const n = Number(m[1].replace(/[.,]/g, (c, i, s) => (i === s.lastIndexOf(c) ? "." : "")));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 1_000_000);
}

export function parseIntent(raw: string, ctx: IntentContext): IntentResult {
  // Unsupported operations first: stated limit, never silent substitution.
  if (/building|mall|shop|retain.*struct|3d|map|terrain|financ|loan|mortgage|irr|cash|phase/i.test(raw)) {
    return {
      kind: "limitation",
      text: "That is outside the first build: retained buildings, 3D, maps, terrain, and financing are not modeled. Supported: green-space locks, price ceilings, product-profile switches, and bounded layout search.",
      operations: { ...none },
    };
  }

  const ops: IntentOperations = { ...none };
  const notes: string[] = [];

  if (/green|grove|tree|park|garden|open[ -]?space/i.test(raw) && /keep|preserve|retain|protect|don't touch|do not touch/i.test(raw)) {
    if (ctx.selected && ctx.selected.kind === "green") {
      ops.lockGreen = true;
      ops.greenId = ctx.selected.id;
      notes.push(`lock ${ctx.selected.name} in place (shape and location)`);
    } else {
      return {
        kind: "clarification",
        text: "Which green space should I keep? Select it on the plan or in the object list first — I will not pick one for you.",
        operations: { ...none },
      };
    }
  }

  const explicit = parseMillions(raw);
  if (explicit !== null && /cap|ceiling|price|max/i.test(raw)) {
    ops.priceCeiling = explicit;
    notes.push(`cap the assumed selling price at Rp${explicit / 1_000_000}m`);
  } else if (/do not increase|don't increase|keep.*price|not.*raise|same price/i.test(raw)) {
    ops.priceCeiling = ctx.selectedPrice;
    notes.push(`hold the assumed selling price at Rp${ctx.selectedPrice / 1_000_000}m (no increase)`);
  }

  if (/starter|compact|small|affordable/i.test(raw)) {
    ops.profileId = "starter-150";
    notes.push("switch to the Starter 150 product profile");
  } else if (/family|base|large|standard/i.test(raw) && /profile|home|product/i.test(raw)) {
    ops.profileId = "family-200";
    notes.push("switch to the Family 200 product profile");
  }

  if (/what else|search|test|run|investig|alternative|future|change/i.test(raw)) {
    ops.runSearch = true;
  }

  if (!ops.lockGreen && ops.priceCeiling === null && ops.profileId === null && !ops.runSearch) {
    if (/explain|why|math|show.*calc/i.test(raw)) {
      return {
        kind: "clarification",
        text: "Open the calculation drawer on any alternative — it shows every quantity, cost line, and the allowance math with its geometry basis. What should change next?",
        operations: { ...none },
      };
    }
    return {
      kind: "clarification",
      text: "I can lock a selected green space, cap the selling price, switch product profile, or run a bounded search. What should I do?",
      operations: { ...none },
    };
  }

  const scope = [
    "change: circulation pattern and lot frontage only",
    `held fixed: ${["drawn green region", "price ceiling", "owner expectation", "target", ops.profileId ? "other profiles" : null].filter(Boolean).join(", ")}`,
    "test: bounded search over the stated ranges, nothing else moves",
  ].join("; ");
  return {
    kind: "proposal",
    text: `Proposal — ${notes.join("; ") || "bounded search"}. Scope: ${scope}. Accept to run; Reject leaves everything unchanged.`,
    operations: ops,
  };
}
