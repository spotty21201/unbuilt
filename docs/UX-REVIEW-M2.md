# UNBUILT — UX Review M2 (Designer, T11b)

Scope: `web/src/App.tsx`, `web/src/unbuilt/PlanCanvas.tsx`,
`web/src/unbuilt/ui.ts`, `web/src/App.css` against `docs/UX.md` (T11 spec).
Verdicts: PASS / PARTIAL / FAIL. Line refs are to the files as reviewed.

## 1. Stage coverage — PARTIAL

What exists: all five stages render as sections with correct fictional
labeling ("Sample — fictional prices", App.tsx:150) and the signature
request prefilled (App.tsx:44). Deterministic fallbacks work with the
model-off badge (App.tsx:151-154).

Gaps:
- Stage 1: no "Try Cedar Market" / "Upload a plan/image" actions and no
  requirement statement (spec §3). Sample is auto-open, which is fine for
  M2, but upload + requirement note are absent entirely.
- Stage 2: no boundary overlay editing, calibration choice, "Confirm site"
  control, or supplied/confirmed/unconfirmed tags (spec §4). Only green
  X/Y/W/D numerics exist (App.tsx:259-270).
- Stage 3: price, ceiling, L, t, profile present; missing price-scenario
  selector (Low/Base/High), expandable assumptions panel, Unknown≠0
  handling, and ceiling-vs-price inline validation (spec §5).
- Stage 4: missing Existing/Proposed/Compare control, search status line
  (Idle/Running/Done/Cancelled + Cancel button), stale marking + rerun
  (spec §6).
- Stage 5: missing Edit-proposal option, next actions, save
  comparison / decision record (spec §7).

Fixes:
1. Add `Existing / Proposed / Compare` segmented control next to canvas;
   Compare aligns same coordinates (spec §2).
2. Add search status line + Cancel in the instruction bar; mark results
   Stale with "Rerun against new snapshot" when inputs change after a run.
3. Add "Selected price exceeds ceiling" inline error (blocks search, not
   plan exploration).
4. Defer upload/calibration/decision-record to M3 explicitly; do not add
   dead buttons for them.

## 2. Commitments panel — PARTIAL

Exists (App.tsx:245-257): Grove A with area + position + Locked/Free +
toggle; ceiling and owner/target rows. Toggle is explicit user action.
PASS on no-silent-mutation at UI level.

Gaps:
- No provenance tags (Supplied / Confirmed / Assumed / Unconfirmed).
- Inconsistent lock language: "Locked" vs "Locked for search" vs "fixed
  for this run". Spec §2 wants "Locked"/"Free" text labels on every row.
- Not sentence-style ("Keep Grove A at 1,240 m² where it is", spec §13).

Fixes:
1. One row pattern: name, value + unit, Locked/Free label, provenance tag.
2. Rewrite rows as sentences; keep the toggle next to the green row.

## 3. Card rules — PARTIAL

PASS: titles generated from measured deltas (`cardTitle`, App.tsx:25-31),
each card shows homes + delta, green, road, allowance/gap (App.tsx:305-320),
and user-selected ordering exists (App.tsx:286-294).

FAIL items:
- No per-card critical blockers (geometry / completeness /
  price-applicability / commercial-target with icon + text, never
  color-only). Only a free-text `c.reason` note is shown (App.tsx:314).
- No "No third distinct option in tested scope" note when fewer than
  three distinct candidates (spec §6). `cards.length === 0` is handled
  but 1–2 results get no scope note.

Fixes:
1. Render blocker chips per card from candidate status axes; text, not
   color-only.
2. When 1–2 cards: append scope note with tested/valid/qualified counts.

## 4. Drawer content — PARTIAL

PASS: hidden by default, toggled with `aria-expanded` (App.tsx:217-219);
full cost chain + surplus/gap math + search scope with seed, snapshot
hash, ms (App.tsx:220-243).

Gaps:
- Hardcoded display strings drift from `RATES`: "60 m²", "Rp5m",
  "Rp0.8m", "Rp0.15m", "5%" (App.tsx:224-229). Rates render from `R`
  but labels do not — a taste/correctness bug.
- Missing: geometry basis per quantity, provenance per assumption, road
  savings line (area-delta × rate + declared scope changes, AC-08),
  ranges/locks detail in scope note.

Fixes:
1. Interpolate all drawer labels from `RATES` (built area, rates, %).
2. Add road-savings line and ranges/locks to the scope note.

## 5. No-result state — PARTIAL

Exists (App.tsx:295-304): heading + blocker list. Honest tone, no
impossibility claim. PASS on tone.

Gaps vs spec §7/§10: no tested scope (ranges, locks, profiles, seed,
counts) inside the no-result box — scope lives only in the drawer — and
no one-change counterfactual hints ("Relaxing X alone changes…").

Fixes:
1. Inline scope summary in `.noresult`: profiles, frontage range,
   families, locks, seed, tested/valid/qualified.
2. Add counterfactual hint line or an explicit "no single-relaxation
   tested yet" placeholder (never invent causality).

## 6. Preview / Apply / Undo — PARTIAL

PASS: preview swaps plan + metrics together; added parcels get blue
dashed stroke + "new" tag, removed get ghost hatch + "removed" tag
(PlanCanvas.tsx:71-93, App.css:134-135) — labels supplement color.
"Back to working plan" restores (App.tsx:315-317). Apply keeps previous
for undo with a note (App.tsx:108-113).

FAIL items:
- Undo restores only `spec + price` (App.tsx:115-122). Green rect,
  profile, ceiling, owner L, target t are lost — spec §2 requires
  geometry + metrics + commitments version together.
- Single-slot undo; no drag exists yet so "one drag = one undo" is
  untestable (spec §8).
- Preview highlights parcels only; changed circulation / retained
  regions have no explicit highlight (caption mentions lock state only,
  PlanCanvas.tsx:111-113).

Fixes:
1. Snapshot the full working version (spec, green, profile, price,
   ceiling, L, t) in `prev` and restore all of it.
2. Add retained-region + changed-road labels in preview (text tags like
   parcels already have).

## 7. A11y hooks — PARTIAL

PASS: section `aria-label`s, `aria-live="polite"` metrics
(App.tsx:210), `aria-expanded` drawer, keyboard-operable green rect
(`role="button"`, Enter/Space, focus style — PlanCanvas.tsx:95-104,
App.css:139), SVG `role="img"` with descriptive label, hatch + dash +
text redundancy for added/removed/green states.

FAIL items:
- Object "listbox" (App.tsx:272-280) contains two non-interactive
  reference rows with permanent `aria-selected={false}` — an invalid
  listbox pattern. Selectable objects must mirror canvas both ways.
- No skip link to the canvas alternative (spec §12).
- No live announcements for proposal arrival, search status, preview
  swaps, stale flags, errors — only metrics are live.
- Inputs have no error slots (`aria-describedby`); no inline errors yet.
- Touch targets ~30px (App.css:93-101 padding 6px) miss the 44px rule
  (spec §11); no `overflow-x` guard for 375px; media query only stacks
  at 800px (App.css:247-255).

Fixes:
1. Make boundary/entrance real listbox options (or move references out
   of the listbox); keep selection mirrored with canvas.
2. Add skip link + one `aria-live` status region covering proposal /
   search / preview / stale / error events.
3. 44px minimum targets for primary actions; add page-level
   `overflow-x: clip` safety with drawer tables scrolling internally.

## 8. Taste violations — FAIL (small, fixable)

1. Hardcoded drawer literals duplicated from `RATES` (App.tsx:224-229) —
   single-source them (see §4).
2. Mixed minus signs: `cardTitle` uses U+2212 `−` (App.tsx:29) while
   card deltas use ASCII `+`/`-` (App.tsx:310). Pick one.
3. `size={70}` on the instruction input (App.tsx:336) fights the flex
   layout; drop it and let `.instr input { flex: 1 }` rule.
4. Instruction input has no `type` (App.tsx:329-337); use `type="text"`
   + `enterKeyHint="go"`.
5. No zoom-to-site control though canvas transform is otherwise stable
   (fixed viewBox scaling in PlanCanvas.tsx:19-21 is correct — keep it).
6. No persistence indicator (Saved/Unsaved/Save-failed + export offer,
   spec §2) — acceptable to defer to M4 if recorded, but not silently.

## Summary

| Area | Verdict |
| --- | --- |
| Stage coverage | PARTIAL |
| Commitments panel | PARTIAL |
| Card rules | PARTIAL |
| Drawer content | PARTIAL |
| No-result state | PARTIAL |
| Preview/Apply/Undo | PARTIAL |
| A11y hooks | PARTIAL |
| Taste | FAIL (minor) |

M2 nails the core loop (type → proposal → search → preview → apply)
with honest labeling and genuinely redundant canvas encodings. The
blocking fixes before M3: full-version undo, per-card blockers,
inline scope in no-result, ceiling validation, and the listbox/live-region
repairs. View controls (Existing/Proposed/Compare), stale/rerun, and
upload/calibration are the known M3 adds — keep them absent rather than
dead.
