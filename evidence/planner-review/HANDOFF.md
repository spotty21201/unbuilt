# Handoff — Planner usability review response (credibility first)

To: Tester (independent browser re-walk). No application code changed by this note.
From: Orchestrator/Coder. Tree dirty by instruction (no commit asked).
Build asset: `web/dist/assets/index-BERBzC0P.js` (serve `web/dist` on :5173).

## Triage note

The review tested the live build faithfully; its P0/P1 defects reproduce in
current code (the F03 contradiction and F04 wording were live, not stale).
F10's "Send produced nothing" could not be reproduced from code — search and
proposals stay open with reshapes present; needs a UI-level re-attempt.

## Fixed in code (review order)

- F01 (P0): entrance commit now proves road-network connectivity pre-commit
  (fixture: audit's 95 m gate fails "no road reaches entrance"); invalid
  positions revert with the reason. Validity is pinned above live metrics —
  figures on an invalid plan carry an "Invalid plan" alert naming the issue.
- F04 (P0): search reports geometry-valid / profile-fit / within-ceiling /
  target-ok counts (fixtures); verdict leads with the BEST owner outcome;
  Record, accepted summary, and no-result text call the owner expectation a
  benchmark, never a met constraint.
- F03 (P1): the two leftover "blocked until discarded" strings now describe
  carry semantics; Record agrees.
- F06 (P1): gestures starting on homes, roads, or idle green never pan; a
  real drag on a fixed home explains (fixed, pan background, reshape lot).
- F05 (P1): lot dims in the inspector, remainder labeled "not designed open
  space", scale bar, illustrative north, per-lot (not whole-set) highlight.
- F08 (P1): save-scope contract in Record; reload/import status states what
  does not transfer. F09 (P1): allowance waterfall + surplus-vs-allowance
  distinction in Economics.
- F07 (P1): deltas add green/parcels/remainder + priced-at assumptions.
  F10 (P2): capability disclosure on the badge; locked single green resolves
  without a canvas selection (stated in the proposal). F11 (P2): print meeting
  summary with print CSS.
- F02/F12 (P1): NOT attempted — full canvas-first rework stays spec'd in
  `docs/REDESIGN-SPEC.md`. Expand plan, persistent strip, and dock remain.

## Verified here

- `npm test` — exit 0, 279 PASS, 12/12 suites ALL PASS.
- `web` build clean. Contracts preserved (D30, AC-55–AC-63).

## Browser tests requested

Disconnected-gate rejection message + no committed economics; benchmark-first
verdict with all-miss grid; carry-choice wording consistency across status,
inspector, and Record; home-drag hint without pan; print output readability;
locked-green request with no selection producing a proposal. No gate claimed.
