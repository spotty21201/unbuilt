# To Unbuilt Orchestrator — from Unbuilt Astra Tester

Independent live-browser re-walk, 26 October 2026. URL: http://100.117.187.86:5173/. Chromium at 1440×900, 1024×768, 375×812. No app changes or commits. Evidence in evidence/ux-retest/ (screenshots, results.json and console.txt).

Verdict: substantial improvement; NOT all eight findings closed, and NOT M2 sign-off.

## Original findings 1–3, tested first

1. PASS for initial rendering and pointer selection. Homes, footprints, road, grove and entrance render inside the SVG. Clicking the actual grove produces the intended proposal. However candidate preview has a separate blocking legibility defect below.
2. PASS. Price, ceiling, owner expectation, target, profile and green edits mark results stale and remove preview/apply actions. Applying a different plan also marks the prior run stale. Specifically owner 10→20 blocks old cards; rerun → preview → apply consistently shows Rp16.44bn gap. Changed candidate preview/apply gives 17 homes/Rp2.41bn allowance; Undo restores 20/Rp3.56bn.
3. PARTIAL. Locked coordinates are disabled. Unlock + X=200 shows a containment error and Incomplete metrics; cleared selling price shows Incomplete. But clearing owner expectation silently becomes 0 and immediately shows Rp-3.56bn owner gap. Clearing X silently moves Grove A from X=78 to X=0 and changes homes to 21. Empty is still converted to zero through Number(''); keep drafts/empty distinct from deliberate zero for all numeric inputs. The containment error also says “Unlock it” when already unlocked.

## Must fix before UX sign-off

A. **Preview overlays hide the proposed plan.** Run defaults, preview Spine · 11 m lots. Removed-parcel hatches are drawn after current parcels with opaque pattern backgrounds; they cover nearly all current house footprints and labels. The screenshot looks like nearly everything was removed even though metrics say 17 homes. Evidence: 02-preview.png. Draw removed geometry underneath, use transparent outlines, or offer a clear comparison toggle. Ensure new footprints and added/removed labels remain readable.

B. **Commercial verdict is false for mixed and empty results.** Set owner expectation to 3bn and run. Baseline meets the target with Rp0.56bn headroom; other displayed cards miss by Rp0.59bn. Header nevertheless says “all still miss.” Code uses cards.some() to make an all-options claim. On zero results (default run → ceiling 800 → rerun), header says options “meet the owner expectation” immediately above “No viable option.” Handle zero / all / some / none explicitly. Evidence: 04-mixed.png and results.json. Remove “The layout is not the blocker; the commercial expectation is.” Eight tested combinations without controlled counterfactuals cannot support that causal conclusion. State the observed shortfall within the tested scope only.

C. **Missing numeric values still become deliberate zeros.** See finding 3 above. This remains a PRD unknown-is-not-zero violation and can materially reverse the conclusion shown to the user.

## Original findings 4–8

4. PARTIAL / improved. Request now sits directly under the plan and is multiline. Mobile request begins around y=811, substantially better than before; no horizontal overflow. Desktop plan is still tall: request is around y=1077 on 1440×900 and cannot be seen alongside the full canvas without scrolling. After search, assumptions are below three tall cards. Prefer a viewport-aware canvas, compact alternatives and nearby assumptions access. Assumptions details is collapsible but starts open.
5. PARTIAL / improved. Baseline correctly identified; twin cards explain average lot sizes (220 vs 240m²). Still three long, vertically stacked cards, and baseline has an unnecessary Apply action. The two “-3 homes” titles could name the lot-size benefit. Browser confirms labels; geometric deduplication engine test was not independently rerun here.
6. FAIL on mixed/empty verdict and unsupported causal conclusion (B).
7. PARTIAL. Send, descriptive names and textarea are better. “lowest unioned road area” still appears on each card. “Viable” still sounds commercially positive despite large deficits; prefer “valid layouts” and a separately quantified commercial outcome. Negative owner gap should read “Headroom Rp0.56bn,” not “Gap Rp-0.56bn.”
8. PASS for tested proposal/completed-state behavior. Scope states circulation/frontage only; fixed values are listed. After acceptance, Accept/Reject disappear and Revise request is available. Green “Free” wording could still clarify that it is editable manually but held in place during this search.

## Suggested next order

Fix preview legibility, verdict logic/copy and empty numeric handling. Recheck those exact cases before expanding scope. Then tighten viewport layout, compact cards and financial terminology. The initial working plan is now a credible spatial foundation; comparison must remain readable enough to support decisions.

Limitations: no genuine model gate (badge still states deterministic mode), no human-user validation, no full accessibility audit, and no fresh engine-suite run. These browser checks do not replace those gates.

Delivery note: this testing process lacks HERDR_ENV=1. Herdr skill requires stopping pane inspection/control when that check fails, so this handoff was saved rather than sent to the pane. User explicitly requested delivery to Unbuilt Orchestrator; delivery remains pending from a Herdr-managed process.
