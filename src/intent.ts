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

// Documented amount grammar (shown in clarification text on failure):
// "Rp" prefix optional; digits with optionally grouped thousands separators;
// mandatory magnitude suffix: m/jt/juta/million = million Rp,
// bn/b/miliar/billion = billion Rp. A bare number is ambiguous (1 Rp? 1 m?)
// and never accepted. Separator rules: both kinds present -> last is the
// decimal mark; one kind present -> groups of exactly 3 mean thousands,
// a single mark with 1-2 trailing digits means decimal; anything else is
// ambiguous and refused rather than guessed.
export type AmountParse =
  | { ok: true; value: number }
  | { ok: false; reason: "missing" | "ambiguous" };

export function parseAmount(text: string): AmountParse {
  const m = text.match(/rp\.?\s?([\d][\d.,]*)\s?(m|bn|b|jt|juta|miliar|million|billion)?\b/i);
  if (!m) return { ok: false, reason: "missing" };
  const digits = m[1];
  const suffix = (m[2] ?? "").toLowerCase();
  if (suffix === "") return { ok: false, reason: "ambiguous" };
  const mult =
    suffix === "m" || suffix === "jt" || suffix === "juta" || suffix === "million"
      ? 1_000_000
      : 1_000_000_000;
  const dots = (digits.match(/\./g) ?? []).length;
  const commas = (digits.match(/,/g) ?? []).length;
  let canon: string;
  if (dots > 0 && commas > 0) {
    const lastDot = digits.lastIndexOf(".");
    const lastComma = digits.lastIndexOf(",");
    const dec = lastDot > lastComma ? "." : ",";
    const thou = dec === "." ? "," : ".";
    canon = digits
      .split("")
      .map((c) => (c === thou ? "" : c === dec ? "." : c))
      .join("");
  } else {
    const sep = dots > 0 ? "." : ",";
    const parts = digits.split(sep);
    if (parts.length === 1) {
      canon = digits;
    } else if (parts.slice(1).every((g) => g.length === 3)) {
      canon = parts.join("");
    } else if (parts.length === 2 && parts[1].length <= 2) {
      canon = `${parts[0]}.${parts[1]}`;
    } else {
      return { ok: false, reason: "ambiguous" };
    }
  }
  const n = Number(canon);
  if (!Number.isFinite(n) || n <= 0) return { ok: false, reason: "ambiguous" };
  return { ok: true, value: Math.round(n * mult) };
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

  const amount = parseAmount(raw);
  const capLanguage = /cap|ceiling|price|max/i.test(raw);
  if (amount.ok && capLanguage) {
    ops.priceCeiling = amount.value;
    notes.push(`cap the assumed selling price at Rp${amount.value / 1_000_000}m`);
  } else if (!amount.ok && amount.reason === "ambiguous" && capLanguage) {
    return {
      kind: "clarification",
      text: "I could not read that ceiling unambiguously — a comma can group thousands or mark decimals depending on convention. Restate it with a magnitude, e.g. Rp850m (million), Rp1,000m (one thousand million) or Rp1.5bn (billion).",
      operations: { ...none },
    };
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
