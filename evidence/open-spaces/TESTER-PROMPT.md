You are reviewing Unbuilt as a residential master planner preparing an early
neighborhood study. You know nothing about software development. Use the actual
application and the drawing, as you would in practice. Do not inspect source code
or use internal state to make the workflow appear successful.

Test Feature 8: multiple parks, pocket spaces and green corridors. Use disposable
fictional projects or copies of the sample. Keep existing projects safe. This is
an early planning study; a valid-looking plan does not establish legal access,
engineering standards, ecological connectivity or compliance.

Begin by stating what you expect to accomplish before opening the app. Then walk:

1. Find the open-space controls without guidance. Identify the original park,
   its area and what its lock protects. Open Edit open spaces and Cancel once;
   confirm the accepted plan survives.
2. Keep the original 480 m² park. Draw a pocket space with corners (10,80),
   (22,80), (22,90), (10,90) in metres. Close it using the first corner or Finish
   outline. Its independently calculated area is 120 m². Add a straight green
   corridor from (30,92) to (70,92), width 4 m: 160 m². The total should be
   760 m², without counting the gaps or bounding extents as designed green space.
   Try a concave outline too: (10,80), (22,80), (22,84), (14,84), (14,90),
   (10,90), replacing the pocket. It is 72 m², not 120 m².
3. Select each named space on the plan and in the inspector. Rename it, change
   its category, move corners with a slightly off-centre pointer grab, add and
   remove a corner and use repeated arrow keys. Confirm a horizontal move stays
   horizontal. Try coordinates, Tab/Enter and Shift+arrows. Use draft Undo/Redo,
   including while an outline is unfinished. Can you recover without losing
   the accepted scheme or getting trapped in an incomplete outline?
4. Cross two edges, place part of a space outside an irregular site, overlap
   another space and enter an incomplete number. Identify exactly what is wrong
   from the drawing and messages. Correct one directly on the drawing. Apply
   must remain unavailable until the draft is valid. Cancel must keep the plan.
5. Fix shape/location; try to drag or delete the protected space. Unlock it for
   a deliberate edit. Set a 121 m² minimum on the 120 m² pocket, then resolve
   the conflict. Try a combined 761 m² minimum on the 760 m² collection. Explain
   the difference between shape/location, individual minimum and combined minimum.
6. Place a new park over generated homes. Before Apply, identify changes in
   homes, street surface, green works and provisional land allowance. Check the
   displayed green-works rate against true polygon area. Apply deliberately,
   Undo and Redo. Verify Cancel restores the prior working scheme. On a separate
   study with manually edited lots or explicit housing assignments, try a
   conflicting park: the app must not silently delete or reassign those homes.
7. Inspect the selected dashed exclusion extent. Explain what land is counted
   as designed green, what is unallocated and why the current orthogonal router
   may reserve more land than the polygon. Try a space across the fixed Loop;
   expect either valid measured geometry or a specific unavailable explanation.
   Do not interpret the result as maximum capacity or an optimal park layout.
8. Save, reload and reopen. Download a backup/accepted record and import it as
   a separate study. Verify outlines, names, types, locks, minima and quantities.
   Clear the layout and Undo it. In a boundary-only project, design a space
   before generating a layout; confirm generation retains it.
9. Select a specific pocket space. Request to keep it and selling price. Review
   the proposed search scope before approval. It should hold every named outline.
   Search, preview an alternative, inspect the measured explanation and either
   Apply or Cancel. Compare two plans if available. Change an assumption after
   an answer and while an answer is arriving; stale results must not reappear.
   Distinguish deterministic tool measurements from a real model. Record exactly
   what the interface discloses; do not claim a real-model test without one.
10. Repeat representative selection, corner editing and review at 1440×900,
    1024×768 and 375×812, then actual 200% browser zoom. Use Fit selected space
    to recover a small park. Return from review to the same drawing position.
    Try touch on a physical device if available. State when only emulation was
    possible. Check names and area readouts without relying on color.

Return a candid planner verdict, then all improvement comments as prompts for the
implementer. For each concern use:

> **Priority — Planner-facing problem**
> **Comment:** What I tried, what happened, and why it matters in residential
> planning. Name the affected space and describe the interaction clearly.
> **Prompt to implementer:** The change needed, useful behavior to preserve and
> a concrete planner-level verification of success.
> **Evidence:** Project, viewport, exact steps and screenshot path.
> **Classification:** Reproduced defect / usability improvement / future discovery.
> **Not verified:** Remaining uncertainty; do not turn it into a confirmed defect.
> **AI opportunity, only if useful:** Where an explanation or reviewable
> investigation would help; required measurements, uncertainty and approval.

Finish with Passed / Failed / Unclear / Not tested, any lost work and open human,
physical-device, survey/access, engineering/legal and model-validation gates.
Prioritize problems that prevent trustworthy planning. Do not suggest decorative
telemetry or unsupported compliance/market claims. Do not start another feature.
