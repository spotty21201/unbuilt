Test Unbuilt at http://localhost:5173 as a residential master planner preparing an
early client study. You know nothing about software development. Use visible app
controls, a disposable project and independent arithmetic. Preserve the owner's
projects. Do not change source files, edit browser storage or start Feature 8.

First explore without guidance: find how to create two different home designs and
assign them across the neighborhood. Record what you expected, what you found and
where you hesitated. A passing automated check is not proof of a useful experience.

Retest these Feature 6 concerns before assessing housing mix:

1. Subdivide the sample south block through its depth into two vacant parcels.
   Apply must be blocked. Identify the rear proposed lot by its one-based label,
   matching highlight and missing-street-frontage explanation. Correct or Cancel.
2. Remove the home on sample Lot 1, then merge its vacant lot with occupied Lot 3.
   Before Apply, identify source occupancy, resulting vacancy and the home being
   removed. Expect 19→18 homes; do not mistake preserving a vacancy for keeping
   the other source home. Cancel first, then test application in a copy.
3. Merge the original occupied Lots 1 and 3. Trace the new lot and at least one
   unchanged neighbor through accepted→proposed references. Can you explain the
   renumbering to a client? These are not legal parcel identifiers.
4. Check the provisional label beside the allowance on an out-of-profile merge.
   Reshape an occupied lot and inspect it after Apply: the unverified deeper
   front/rear setbacks should be visible beside selection metrics, without hunting.
5. At 375×812 preview an invalid split. Read the warning beside the drawing, move
   to review, return to the same parcel and Cancel without losing accepted work.
6. Irregular-block definition is future discovery. Report any practical need, but
   do not mistake rectangular subdivision inside an irregular site for arbitrary
   polygon splitting. Current limitations should remain explicit.

Then test Feature 7, Housing mix:

- Select a lot and open Edit housing mix. Create a named “Courtyard” template,
  width 8 m and depth 6 m. Assign it to one occupied sample lot. With the other
  nineteen homes at 60 m², total built area should be 19×60+48 = 1,188 m², with
  20 homes. At the existing Rp5m/m² construction rate, home construction is
  Rp5.94bn instead of Rp6bn. Shared selling-price assumptions and infrastructure
  should stay unchanged. The allowance cost difference includes contingency;
  it does not prove that smaller homes can sell at the same price.
- Inspect matching template codes/colors on the drawing, the selected-lot readout
  and the housing schedule. Can you explain where each template is assigned and
  how many homes/built square metres it contributes without relying on color alone?
- Cancel, repeat and Apply. Exercise Undo/Redo, Save and reload. Check actual
  template names/dimensions, assignments and drawn footprints, not just counts.
- Create “Garden”, 6×6 m. Assign it to the twelve south-block lots. On an unchanged
  sample expect 12×36+8×60 = 912 m², with 20 homes. Test a native multiple selection,
  block selection and all-lot selection. Verify that only the intended lots change.
- Edit a used template and rename it. Review its effects wherever it is assigned.
  Change the default and distinguish unassigned lots from explicit assignments.
  Try blank/duplicate names and impossible dimensions; recover without losing work.
- Make Courtyard 16×16 m while assigned to a standard lot. Apply must be blocked,
  the relevant lot identified/highlighted and proposed assessed figures unavailable.
  Repair the dimensions or reassign a fitting template. Accepted geometry stays safe.
- Try deleting an in-use/default template. The app must explain why and require
  reassignment first. Delete an unused template within the draft, then Cancel and
  confirm the accepted library remains. Check unpreviewed fields cannot slip into Apply.
- Assign Courtyard to a vacant lot. It remains a reservation, with no built area,
  home revenue or construction cost. Separately try Restore removed homes; fitting
  must be checked, rather than assumed from the reservation.
- Reshape a lot with a non-default template. Check that the assigned home and its
  measured ring are preserved; try a conflicting edit and recover. Do not infer
  that the deeper polygon setbacks or statutory compliance are verified.
- Merge lots with different templates. The review should state the resulting default
  template choice before acceptance. Split/subdivide a fitting rectangular source
  with one common template and inspect inheritance. Undo must restore assignments.
- Try a conflicting street or boundary edit. Manual lots and their assignments must
  not silently disappear. Returning to generated lots requires explicitly reviewing
  all lots using the default first; the reusable library should survive.
- Download/import a backup as a separate project. Compare exact library, assignment,
  vacancy and polygon work. Clear layout and Undo. After clearing, open Manage
  housing templates before generation and verify the reusable library can be repaired.
- Ask for a measured explanation, then change an input. Check old answers clear;
  if possible change an input while a response is arriving. Distinguish local/server
  tools from a real model. No real-model connection is claimed by this feature.
- Repeat a representative assignment on an irregular site. Check real containment,
  frontage and fit; do not use the site bounding rectangle as area evidence.
- Inspect 1440×900, 1024×768 and 375×812, actual 200% browser zoom, keyboard navigation
  and physical touch if available. Drawing/review transitions should retain the
  viewport, selected lot and draft. Identify emulation versus physical testing.

Scope: up to 20 named, one-storey rectangular templates, 4–16 m dimensions, one home
per occupied lot. A mix holds the current parcel partition. Pricing and construction
rate remain shared, explicit and provisional. Automated mix optimization, bedrooms,
multi-storey/multiple-home lots, template-specific market prices, arbitrary polygon
splitting, cadastral approval and road engineering are not established.

Return a short planner verdict. Write EVERY actionable finding as a prompt for the
implementation agent, with this format:

> **[Critical / Important / Refinement] — [Planning problem]**
> **Comment:** When I [exact steps/inputs], I observed [actual outcome]. As a
> residential master planner, I need [purpose]; this caused [practical impact].
> **Prompt to implementer:** Improve [specific interaction] so [desired behavior].
> Preserve [working protection]. Verify success by [observable test/outcome].
> **Evidence:** Screenshot path, project, browser/device/viewport and before/after
> measurements. Separate observations from possible explanations.
> **Classification:** Reproduced defect / usability improvement / future discovery.
> **Not verified:** What remains untested or uncertain.
> **AI opportunity, only if useful:** At [planning phase], use [measured inputs] to
> explain a trade-off or prepare an investigation for approval. Do not give a model
> authority to invent geometry, prices, compliance or silent plan changes.

Finish with Passed / Failed / Unclear / Not tested, lost work and open human,
physical-device, survey/access/legal/engineering and real-model gates. Do not invent
findings or claim untested steps passed. Output the report and improvement prompts
only; the implementation agent will reproduce them next.
