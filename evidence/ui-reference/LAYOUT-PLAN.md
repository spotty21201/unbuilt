# Layout plan — canvas-led redesign (from side-by-side image comparison)

Target structure (target-stitch.png): slim dark top bar → thin telemetry
strip → far-left narrow icon rail → dominant light drawing field with
floating toolbar → dark 300px right inspector (selection stats, sliders,
locks, integrated ask box) → dark bottom status strip with outcomes.
Current app (current-ui.png): the same parts exist but the plan sits small
inside a large light page, flanked by a wide button panel and long
paragraphs, with a large mostly-empty dock below.

New screen (desktop ≥901px), no invented data or actions:

- Shell grid rows: 44px top bar / 28px context strip / 1fr workspace /
  34px outcomes strip. Columns: 64px icon rail / 1fr canvas / 320px
  inspector. Page background dark; only the drawing field is light.
- Top bar: brand, scenario state, Undo/Redo, save state, truthful model
  badge. Context strip (all real): site dims, entrance, selection,
  validity, nothing else.
- Icon rail (dark): Select, Pan (active state, V/H, tooltips), then
  selection shortcuts Site / Open space / Circulation / Homes. Fit and
  zoom live in the floating canvas toolbar (they drive canvas internals).
- Canvas: paper field fills its cell; plan fitted to the stage; floating
  dark toolbar (Fit, zoom, expand, one-line hint) overlays the top edge;
  geometry, labels, selection, and pan behavior unchanged.
- Inspector (dark, scrolls): object selector, contextual properties and
  editing controls per selection, assistant entry + answers, then the
  request composer with proposal review, then collapsed Site source and
  Assumptions. Nothing that edits moves except the composer block.
- Outcomes: persistent dark strip (homes, green, road, allowance, owner
  outcome, invalid flag). Tabs/options/comparison collapse upward and
  auto-open when a search completes.
- Mobile ≤900px: plan first, mini outcomes attached, horizontal icon rail,
  collapsible inspector; composer reachable by short scroll; toggle kept.
- Type/targets: panel text 13–15px light-on-dark (≥4.5:1), mono figures,
  48px rail buttons, 44px primary controls, visible focus, tooltips plus
  visible labels (no icon-only guessing).
