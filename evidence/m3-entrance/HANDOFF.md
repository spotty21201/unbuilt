# Handoff — Movable compound entrance (west+east) + Open-space rename

To: Tester (independent browser re-walk). No application code changed by this note.
From: Orchestrator/Coder. Base revision `d5e5ecf`, tree dirty by instruction (no commit).

## What changed and why

The entrance was a hardcoded west-edge marker the UI could not move. It is now a
first-class gate `{ edge: west|east, offset, width }` end to end: schema, site
factory, spine/loop generators (circulation mirrors to the gate edge), entry
validation, UI drag + numeric + edge controls, staleness, history, export.
"Grove A" is renamed "Open space A" everywhere user-visible; the id `grove-a`
and lock semantics are unchanged, and landscaped-green cost assumptions are
untouched (see `src/economics.ts` RATES.greenWorksPerM2).

## Files changed

- `src/schema.ts` — `Entrance` type (`edge`, `offset`, `width`).
- `src/site.ts` — `makeSite` emits west-edge centered gate (width 8).
- `src/geometry.ts` — `entranceSpan`, `entranceErrors`, generators derive the
  road/connector from the gate; Cedar output byte-identical to before.
- `src/intent.ts` — "keep this open space" triggers the preservation proposal
  (was: no match → finding closed).
- `src/draft.ts` — error strings renamed (no logic change).
- `web/src/App.tsx` — entrance state, Site-inspector edge segmented control +
  distance-from-south field (NaN-safe, invalid reverts, never silent zero),
  snapshot/restore/run-snapshot/export carry gate + green geometry.
- `web/src/unbuilt/PlanCanvas.tsx` — gate marker on its own edge, draggable
  along the edge when Site is selected; invalid positions render red, never vanish.
- `web/src/unbuilt/ui.ts` — `siteWithEntrance` helper.
- `web/src/App.css` — invalid gate style.
- `tests/site.mjs`, `tests/intent.mjs` — east-edge, position-validation, and
  open-space trigger fixtures. `tests/site-tester.mjs` invariant updated for the
  deliberate shape change — please audit.

## Verified here (commands + results)

- `npm test` — 149 PASS, zero FAIL/MISMATCH lines.
- `cd web && npm run build` — clean (170 ms).
- Entrance drag ⇄ numeric equivalence is structural (single `entrance` state feeds
  one generator set), NOT browser-proven — please prove it.

## Browser acceptance tests requested

1. Gate drag on west edge → metrics change, one Undo restores gate + metrics.
2. Same offset via drag and via typed field → identical geometry and metrics.
3. Switch West→East → circulation mirrors, road connects at the gate, no error.
4. Offset beyond the edge (e.g. 200 on 100 m depth) → inline rejection, plan kept.
5. Emptied offset field → rejection with message, never a silent zero.
6. Any gate move with live results → options go stale, Preview/Apply blocked.
7. "Keep this open space" with Open space A selected → explicit proposal.
8. Export JSON contains `working.green` and `working.entrance` round-trippable.
9. Escape mid-drag and browser-cancel revert without history entries.
10. 375 px viewport: no horizontal overflow with the new inspector section.

## Outstanding (not in this slice)

- Polygon lots, photo-retain, image-decode validation, compare widening —
  per `docs/ORCHESTRATOR-M3-BROWSER-AND-PLANNING-PROMPT.md` findings 1–4, 6–7
  and capabilities A–C. No M2/M3 gate claimed.
