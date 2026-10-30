# UNBUILT UI/UX browser critique — 26 October 2026

Reviewed docs/PRD_v0.2.md and docs/UX-REVIEW-M2.md; exercised the live app at http://100.117.187.86:5173 using headless Chromium at 1440×900, 1024×768 and 375×812. This is agent browser testing, not observed human validation. No application code changed.

Verdict: M2 is not ready for sign-off. The interaction has working parts, but the spatial centerpiece is blank and edited assumptions can invalidate the numbers shown during preview without warning. The genuine-model gate also remains explicitly unmet.

## Blocking findings

1. **The plan is blank.** Initial and preview screenshots show only the site boundary and caption. Houses, roads, entrance and Grove A are outside the visible SVG. At 1024px, the grove bounding box starts at x=1957, y=-1019 while the SVG starts at x=20, y=460 and is only 664px wide. Users cannot select the grove spatially or understand a design intervention. Source diagnosis: PlanCanvas.tsx multiplies coordinates by scale in rect(), then scales the enclosing group again; boundary uses only the group scale. Use one coordinate transform and verify actual visible geometry and pointer selection. Evidence: 01-initial.png, 02-preview.png.

2. **Preview promises numbers that Apply does not preserve.** Run the signature request, then change owner expectation from 10 to 20 billion. Working gap updates to Rp16.44bn, but old cards remain actionable with Rp6.44bn. Preview restores the old gap; Apply returns to Rp16.44bn. Invalidate results on every relevant edit, block stale Apply, and regenerate from a consistent snapshot. This is a trust/correctness blocker, not merely a missing stale label.

3. **Invalid editing produces authoritative-looking metrics.** While Grove A is labeled Locked, set its X coordinate to 200 (site width is 120). The UI accepts it, increases homes from 20 to 24, and improves land allowance from Rp3.56bn to Rp5.09bn without an inline error. Search subsequently rejects all eight layouts, but the working view already presents invalid geometry as a proposition. Validate positive dimensions and containment before updating the accepted geometry; explain lock scope and require explicit editing/unlocking. Clearing selling price also silently produces zero-price economics rather than an incomplete-input state.

## Major interaction findings

4. **The main task is buried in a long form.** At 1440×900 the initial instruction is at document y=1334; the metrics also sit below the fold. After searching, three vertically stacked cards push the instruction farther down. On mobile, site prose, all assumptions, the plan and a long inspector precede the request. Keep the plan, selected object, request/proposal and current result together. Move detailed coordinates into an object inspector and assumptions into a collapsible panel; use compact cards alongside/below the visible plan.

5. **Alternatives do not explain a useful choice.** Default results include spine-f10, which is already the working layout, under the false title “Same counts, different circulation.” The other two cards both say “-3 homes” and have the same displayed road, green and economic quantities. Mark the current layout as the baseline; explain the actual frontage/lot trade-off between f11 and f12, or group equivalent outcomes. Show explicit cost and allowance deltas and surface materially different circulation where the search supports it. Do not force three cards merely because three parameter combinations exist.

6. **Search success is easy to mistake for commercial success.** The status reports six “qualifying alternatives,” although all three displayed cards miss the owner's expectation. Retaining physically valid but commercially unsuccessful options is correct under the PRD; the wording needs to distinguish them. Prefer “6 valid layouts tested; these options still miss the owner target.” Lead the result with the unresolved shortfall and an actionable next step.

7. **Copy and controls expose implementation details.** “Interpret,” “spine-f11,” “unioned road area,” “seed recorded” and “original sample geometry is preserved in code” ask users to understand the implementation. Use “Review request,” descriptive option names, “road area,” and a concise account of what will change and what stays fixed. Keep identifiers and seeds in technical details. Use a multiline request field so the entire intention is readable, especially at 375px.

8. **Lock and proposal language overpromise.** “Free” suggests green can change in search, but acceptProposal supplies the same fixed green rectangle for either lock state. Proposal text says “prices within ceiling” may change, while search receives one selected price. Align the proposal with the actual tested variables; explain that only circulation and frontage change in this run. Accepted proposals also retain Accept/Reject buttons and append run statistics, leaving unclear whether Reject can undo an already accepted operation. Transition to a completed state with explicit rerun/revise actions.

## What worked in the browser

- Without selection, the signature request asks which green space to preserve.
- Selecting Grove A through the object list enables the explicit proposal and real search.
- Previewing spine-f11 changes 20 homes to 17 and allowance from Rp3.56bn to Rp2.41bn; Apply agrees; Undo returns to 20 homes and Rp3.56bn.
- A request to retain the existing supermarket produces an explicit unsupported-operation explanation.
- Selected price 900 against ceiling 850 produces an inline error.
- An out-of-site grove produces an honest search no-result state with eight tested, zero valid and zero qualified; it does not claim universal impossibility.
- Fictional assumptions and deterministic mode are visibly disclosed.
- The initial mobile page has no horizontal document overflow (375px viewport and scroll width).
- No page JavaScript exceptions were captured in the main browser run.

## Visual direction

The current presentation reads like an engineering inspection form: uniform headings, dense explanatory text, prominent raw coordinates and thinly differentiated controls. Preserve the restrained palette, but give visual priority to the plan, the owner's shortfall, and one clear next action. Use green for the retained feature, a distinct preview treatment, and a compact trade-off summary. Replace numbered document sections with task context; make the selected feature and preview state unmistakable. The largest improvement is information hierarchy and proximity, not extra decoration.

## Gate and limits

Fix findings 1–3 before another M2 walkthrough, then address alternative quality and task layout. Existing engine checks do not establish browser rendering correctness. This review does not pass the genuine Meta API gate, human unrehearsed-change gate, full accessibility audit, persistence, upload or comparison views. Upload/compare/persistence omissions are acknowledged later-milestone scope, not newly discovered M2 regressions. The calculation drawer was source-inspected but not independently reconciled in this browser pass.
