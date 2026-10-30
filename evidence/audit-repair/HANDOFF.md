# Handoff — Audit repair increment (v0.35), correctness before expansion

To: Tester (independent browser re-walk). No application code changed by this note.
From: Orchestrator/Coder. Tree dirty by instruction (no commit asked).
Build asset: `web/dist/assets/index-Dsah07oK.js` (serve `web/dist` on :5173).
Server seam: `node --experimental-strip-types --no-warnings server/intent.mjs --port 5174`.

## Finding-by-finding (audit prompt order)

1. Setback: REPRODUCED exactly (Lot 1, x=1 → valid). Now rejected — the placed
   home plus a uniform 2 m ring must sit inside the edited polygon; the deeper
   3 m front/rear setbacks are labeled unverified in the lot inspector.
2. Coincident lots: predicate hole CONFIRMED (`polysOverlap` false on
   duplicates). Fixed via inward-nudged midpoints; joint fixtures green. One
   honest nuance: the literal two-lot UI construction from the prompt does not
   reach the overlap check cleanly (the second lot's footprint check fires
   first) — the defect and fix are proven at predicate + joint level, worth a
   UI-level attempt in re-walk.
3. Vertex clear → zero: confirmed by reading (`Number('') === 0` passed the
   finite guard). Fields now hold strings; empty reverts, never writes.
4. Stale proposal Accept: proposals now freeze their scenario snapshot; any
   later edit stales them, blocks Accept with an alert, and requires re-send.
5. Refresh: versioned localStorage autosave with visible saved/failed status,
   boot restore (photo explicitly excluded), file import of saved projects AND
   v2 decision records (accepted plan only — drafts/undo/photos do not
   transfer, stated in UI). Storage denial is status, never silent.
6. Units: strict documented grammar (thousands vs decimals, m/jt/million vs
   bn/miliar/billion, bare numbers refused); ambiguous input clarifies with
   the grammar. Prior "Rp1,000m → Rp1m" misparse fixed.
7. Manual-edit lock: REPLACED by stable identity — edits keyed by base rect
   travel through search (each combo carries what it reproduces) and redesign
   (circulation/apply/entrance/green-apply); only truly removed lots trigger
   an explicit preserve-vs-discard choice with one-step Undo. Drafts still
   block regen (index-addressed).
8. NaN: rejected at validate/isSimple/failingLots; unknown never passes.
11. Images: magic-byte signature + 10 MB + decode + 20 MP gates; last valid
   photo stands with a reason on every refusal path.

## Seam + model

- `server/intent.mjs` (stdlib only): GET /api/health, POST /api/intent (mock
  parser; meta adapter), POST /api/search (bounded, locks enforced inside).
  19 protocol checks green, including the honest 503 without a key.
- Meta adapter follows the documented chat-completions protocol
  (api.meta.ai/v1, Bearer MODEL_API_KEY, muse-spark-1.3, propose_search tool,
  forced tool choice, re-validated output). NO real call attempted — account
  access unverified, stays Blocked.

## Redesign: spec only, by the prompt's own order

`docs/REDESIGN-SPEC.md` is written (layout, inspector, strip, labels,
comparison workspace, responsive rules, non-goals). Visual implementation
explicitly deferred — the 473 px plan and small labels are UNCHANGED.

## Verified here

- `npm test` — exit 0, 274 PASS, 12/12 suites ALL PASS (2 new: persist, server).
- `web` build clean. Contracts: v0.3 + v0.35 preserved (D29, AC-44–AC-54).

## Browser tests requested

Stale-Accept block, vertex clear, conflict choice (carry + discard + Undo),
refresh restore round-trip, import of a v2 export, image refusals, proposal
grammar clarification, plus a UI-level coincident-duplicate attempt (§Finding 2
nuance above). No gate claimed.
