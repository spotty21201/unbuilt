Retest Unbuilt at http://localhost:5173 as a residential master planner who knows
nothing about software development. Use disposable sample studies, visible controls
and independent arithmetic. Preserve existing projects. Do not implement changes
or start another feature. First explore independently and record any hesitation.

Focus on the five housing-mix review corrections:

1. On the sample, remove Lot 1's home. Reserve a named Courtyard template measuring
   16×16 m on the vacant lot and Apply. Try Restore removed homes. Expect 19 homes
   and a persistent, readable explanation beside that action, naming Lot 1,
   Courtyard and its dimensions. Open Edit Lot 1 outline, then Cancel. Use Reassign
   home for Lot 1 to select a fitting design, Preview and Apply. The lot should stay
   vacant until you explicitly restore it. Restore and independently confirm 20
   homes. Check that the warning clears only when its cause is repaired.
2. In a fresh sample, assign Courtyard 8×6 m to Lot 1. Preview generated lots should
   open a review of releasing that explicit assignment to follow the default,
   identifying the design change and retaining the reusable library. Cancel and
   confirm Courtyard is retained. Repeat and approve the defaults: inspect the
   separate generated-lot preview before applying it. Check what Cancel keeps at
   each stage, then exercise Undo. Can you explain the two approval steps without
   reconstructing them from a status message?
3. With one explicit Courtyard and nineteen default-following homes, rename and
   resize Courtyard to 7×6 m (42 m²). Choose it as the default. Before Preview,
   identify the nineteen inherited lots that will change and the explicitly assigned
   lot that will stay on its chosen design. Preview should measure 20×42 = 840 m².
   Check target-list and selected-lot markers distinguish explicit/default even
   when both display the same template name. Change the default back: the explicit
   Courtyard remains 42 m² and the nineteen originals total 1,182 m² with it.
   Explicitly assign the current default to another lot; it should stay on that
   design during a later default change. Try the separate release-to-default action.
4. At 375×812, assign one 48 m² Courtyard among nineteen 60 m² originals. From the
   drawing, identify the selected lot's name/code/area/provenance without color.
   Expand the nearby home-design key and identify both designs and counts. Zoom
   the plan, review the mix, return and check the same viewport, selection and draft.
   Cancel without losing accepted work. Repeat at 1024×768 and actual 200% browser
   zoom. Distinguish touch emulation from a physical device.
5. In the single-Courtyard preview, inspect shared selling price, construction rate
   and contingency from the housing review. Independently check 1,200→1,188 m²,
   Rp6.00bn→Rp5.94bn construction, Rp60m construction saving plus Rp3m contingency
   saving, and Rp63m allowance increase with revenue unchanged. Explain why this
   modeled saving is not evidence that a smaller home will sell at the same price.
   Try an invalid draft: proposed assessed effects should remain unavailable.

Also check Save/reload, default provenance in an imported backup, unused/default
template deletion, a conflicting non-default polygon reshape and repair, common
explicit-template inheritance through split/subdivision, and an input change while
an assistant response is arriving, where practical. Report untested steps honestly.

Return a short planner verdict. Write every actionable finding as a prompt:

> **[Critical / Important / Refinement] — [Planning problem]**
> **Comment:** When I [steps/inputs], I observed [result]. As a residential master
> planner, I need [purpose]; this caused [impact].
> **Prompt to implementer:** Improve [interaction] so [desired behavior]. Preserve
> [working protection]. Verify success by [observable test].
> **Evidence:** Screenshot path, project, browser/device/viewport, before/after values.
> **Classification:** Reproduced defect / usability improvement / future discovery.
> **Not verified:** What remains uncertain or untested.
> **AI opportunity, only if useful:** Identify measured inputs that could support an
> explanation or reviewable investigation. A model must not invent measurements,
> market evidence, compliance or silent plan edits.

Finish with Passed / Failed / Unclear / Not tested, lost work and open validation
gates. Physical devices, independent planner/survey/access/legal/engineering review
and a real-model round trip remain separate gates. Output the report and improvement
prompts only; do not claim untested steps passed.
