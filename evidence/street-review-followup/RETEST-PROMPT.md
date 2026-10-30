Test Unbuilt as a residential master planner using the actual interface. Use a
fictional/sample project and preserve the owner's saved work. Focus on the six
street-editor findings below; Feature 6 has not started. Do not infer correctness
from implementation notes or automated results.

1. Draw the sample branch (40,50)→(40,90), move its shared junction east three
   times with Right Arrow, then grab slightly off the node centre and drag purely
   horizontally. Verify X changes while Y=50 and the entrance/main row stay put.
   Check live ΔX/ΔY, Undo, Redo and Cancel. Repeat after canvas zooming; if feasible
   try actual 200% browser zoom and a physical touch device. Deliberate vertical
   movement may still move the main row and must warn if the gate disconnects.
2. Draw from a near miss at about (40,51). Before clicking, inspect the green Join
   cue and coordinate. Verify the branch joins Y=50. Separately type a branch from
   (40,51) to (40,91): typing remains exact. Find the 1 m gap and explicitly join
   it in the draft; Undo/Cancel should remain safe.
3. With an accepted manual branch, ask to preserve the park and selling price.
   Before approval, verify that the proposal holds manual streets/widths and tests
   Spine at 9, 10, 11, 12 m frontage. Reject once, then resend/approve and verify
   the executed scope agrees. A model is not required for these deterministic tools.
4. Draw isolated, park-crossing and full-width boundary-crossing streets. Inspect
   the proposed corridor, offending street and gap/region/boundary. Accepted grey
   geometry must remain distinct. Repair a park crossing by moving its shared
   junction horizontally to a clear location; watch the conflict clear before Apply.
5. Move the main street from Y=50 to Y=40. Propose Connect entrance. Inspect the
   orange link/callout, affected accepted lot footprints, and comparison (sample:
   20→18 homes, 720→789 m² road area). Affected lots can have moved or repartitioned;
   do not interpret each outline as a lost home. Cancel and verify the original.
   The visible connection establishes no permission, compliant turning or traffic design.
6. At 375×812, select the branch, change its width, and use View drawing. Check the
   compact selected-street/outcome strip below the paper, readable scale and clear
   draft state. Review streets, then return: selection and camera should persist.
   Cancel and verify accepted geometry. Also inspect 1024×768 and actual 200% zoom.

Return a brief planner verdict and write every actionable comment as an improvement
prompt to the implementer: severity/title; exact observed steps and result; planning
impact; requested behavior; working behavior to preserve; observable verification;
screenshot/recording path, device/viewport and inputs; defect versus usability versus
future discovery; and what was not tested. Separate observation from inference.
Finish with Passed / Failed / Unclear / Not tested and remaining engineering, access,
survey, physical-device and model gates. Do not implement anything or start Feature 6.
