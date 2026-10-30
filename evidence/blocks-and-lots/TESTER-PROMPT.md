Test Unbuilt as a residential master planner preparing an early housing study.
You know nothing about software development. Use the actual visible application,
not code or internal storage, and do not treat automated passes as proof of quality.
Use a fictional/sample project and preserve the owner's work. Local preview:
http://localhost:5173. Focus on Feature 6; do not implement changes or start Feature 7.

First explore independently: select a lot and find Split lot, Merge lots, Subdivide
block and Edit lot outline. Record where you hesitate and what you expect to happen.
Then test these planning journeys, checking numbers independently:

1. On the unchanged 120×100 m sample, merge adjacent Lots 1 and 3 (both south of
   the main street). Their 200+200 m² should become one 400 m² lot, with 20→19
   homes. Preview before Apply. Review profile/pricing warnings; one merged lot
   does not keep two homes automatically. Cancel first, then repeat and Apply.
   Undo and Redo should restore the complete schemes. Try Lots 1 and 2 across the
   street: the app must refuse to merge the road gap into a lot.
2. Split the merged 400 m² lot in half with a vertical cut. Confirm two 200 m² lots
   can fit the existing template and return the total to 20 homes. Change the split
   percentage after preview; Apply must require a fresh preview. Try an empty or
   extreme percentage and recover without losing accepted work.
3. Select a south-row lot and Subdivide block. Confirm the source is the existing
   connected 120×20 m / 2,400 m² row. Divide its east–west width into ten equal lots.
   Expect 240 m² per new lot and 18 homes total, with total lot area 4,000 m²,
   streets 720 m² and open space 480 m². Review and Apply or Cancel deliberately.
   Try cutting depth so a rear row lacks frontage; an inaccessible lot must not be
   priced as a valid new home. Nonrectangular groups must not silently become their
   bounding rectangle.
4. Split an ordinary 200 m² lot into two 100 m² lots. Occupied small lots should be
   blocked if the current template/setbacks cannot fit. Explicitly choose Create
   resulting lots as vacant. Expect 21 parcels but 19 homes, unchanged lot area
   and no revenue from the two vacant parcels. Cancel and Apply on separate attempts.
   Remove a home first in a disposable study and then merge/split its lot: verify
   the app never silently restores that home through a geometry change.
5. Edit the outline of a resulting lot. Drag corners, add/remove a corner and try
   coordinate and arrow-key alternatives. Check draft area, home/neighbor/frontage
   protections, invalid feedback, local Undo/Redo and Cancel. An off-centre grab
   should not jump. Apply and then plan Undo/Redo. A vacant polygon may change
   without inventing a home. The app should disclose its setback limitations.
6. Save, reload and reopen the study. Check partition, widths/depths, true areas,
   vacancy and polygon outlines. Download and import a backup as a separate project;
   preserve the original. Identify exactly what session material is not recovered.
7. Move a street through the accepted manual lots or change supporting geometry.
   The manual partition must remain held and conflicts must be explained, rather
   than silently losing or regenerating your lots. Test Clear layout in a copy:
   the boundary stays; Undo restores its partition and outlines.
8. Ask for alternatives while manual lots are held. The app should explain why
   frontage search cannot repartition the held plan. Preview generated lots instead:
   cancel once, then apply after reviewing any conflicting outline work, and Undo.
   Once back on generated lots, the earlier proposal/search/preview workflows
   should remain available. Do not infer that a conversational answer proves a
   real model connection.
9. Repeat a representative merge or block subdivision inside an irregular site.
   Example boundary: (0,0), (120,0), (120,100), (50,100), (0,60), area 11,000 m².
   Check actual lot containment near the slope, frontage, open-space/road preservation
   and save/reload. A rectangular source block is not the site's bounding rectangle.
10. Inspect 1440×900, 1024×768 and 375×812, plus actual 200% browser zoom. Try the
    drawing/review round trip and keyboard navigation. Use physical touch if available;
    distinguish it from emulation. Keep the drawing readable and Apply/Cancel reachable.

Current scope: rectangular split/merge/block subdivision, and simple polygon
reshape of an existing lot. Connected blocks are derived from current lots. Polygon
boolean splitting/union, new block drawing in unallocated land, holes, curves,
multiple homes per lot and legal cadastral subdivision are not established. Existing
home reservations remain conservative; restoring homes requires a separate fit check.
Do not claim professional access/turning/traffic compliance or survey accuracy from
these operations. Still report any scope limitation that prevents a useful study.

Return a brief planner verdict, then ALL actionable comments as improvement prompts:

> **[Critical / Important / Refinement] — [Planning problem]**
> **Comment:** When I [exact steps and inputs], I observed [actual result]. As a
> residential master planner I need [purpose]; this caused [practical impact].
> **Prompt to implementer:** Improve [journey/control] so [desired behavior].
> Preserve [working protection]. Verify success by [observable steps/outcome].
> **Evidence:** [screenshot path], project, browser/device/viewport, before/after
> measurements. Separate direct observation from inference.
> **Classification:** Reproduced defect / usability improvement / future discovery.
> **Not verified:** [what you did not test or cannot establish].
> **AI opportunity, only if useful:** At [planning phase], use [measured inputs]
> to explain trade-offs or prepare an investigation for approval. Do not assign
> authoritative geometry, pricing evidence, legal access or silent edits to a model.

Finish with Passed / Failed / Unclear / Not tested, any lost work, and open human,
physical-device, engineering, survey/access and model gates. Output your report and
improvement prompts only; the implementation agent will reproduce them next.
