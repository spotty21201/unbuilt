# Unbuilt v0.7 — Planner feedback: access and decision review

This iteration follows the residential planner's first-visit feedback. Earlier
PRDs remain historical. The current scope is a measured planning workbench,
not a surveyed access design or proof of maximum development capacity.

## Boundary and access

- Draw/edit a simple polygon of 3–64 vertices, with local metre coordinates,
  true polygon area, snapping, keyboard alternatives and draft history.
- Before Apply, show accepted → proposed site area, homes, street area including
  access, open space, land allowance and owner outcome. Invalid or unsupported
  outcomes say unavailable; they are never silently priced as a valid scheme.
- Highlight individual crossing/repeated/backtracking edges and identify their
  numbered endpoints. Accepted geometry remains recoverable via Cancel/Undo.
- Select any sufficiently long boundary edge for an assumed entrance; measure
  its centre from the first numbered corner. Dragging projects onto that edge.
- Live Spine routing may connect the gate to an orthogonal road through a
  tapered polygon apron. The full apron must fit inside the site, clear of the
  park/clearance, roads and lots. The road graph must reach its inner face.
- Count the apron's actual polygon area as street area and include it in road
  costs, reconciliation, previews, search, comparisons and records.
- Offer explicit, deterministic midpoint checks on all eligible edges. Report
  geometric outcomes and public-access uncertainty; never silently select one.
- The fixed Loop supports legacy west/east gates only. Explain the need to use
  Spine for boundary-edge access. Unsupported geometry yields no generated
  layout and a specific correction, while the valid outline can still be saved.

## Commitments and alternatives

Distinguish fixing the park's exact shape/location from maintaining a minimum
area. The minimum travels with planning parameters and rejects smaller parks,
while an unlocked park can move or resize above it. Both search families hold
the current park, boundary, lot depth, home template, entrance and selling price;
search varies only family and frontage. Show that scope on successful results
as well as no-results. Label allowance improvements/deteriorations against the
working plan. A tested result does not establish the site's maximum capacity.

## Assistant and explanations

Local question routing recognizes capacity questions and prioritizes requests
for an investigation over incidental change words. Without a sensitivity study,
it states that the binding constraint has not been identified and prepares a
reviewable, supported search. Actual comparison measurements support an editable
client explanation, with fixed-price revenue effects separated from unproven
spatial causes. Changing scenario inputs or replacing an in-flight question
invalidates the old answer. No model connection is claimed without configuration.

Potential model assistance belongs beside access setup, boundary consequence
review, the selected object's properties and alternative comparison. Any future
model must use these same measured geometry/results and commitments, cite the
relevant plan, label hypotheses, and prepare proposals for approval. Deterministic
edge checks and direct controls remain available independently of a model.

## Recovery and small screens

A disclosure beside the saved state names exactly what is saved and offers an
accepted-plan download. Preserve a reviewed alternative by explicitly applying
and downloading it; previews, searches, comparisons, drafts, undo history and
photos remain session-only. Import restores the accepted plan. Mobile selection
shows the object and true area with an action that opens/focuses its inspector.

## Compatibility and limits

Projects and scenarios needing boundary-edge entrances or minimum-area settings
use version 4, and decision records use export version 5. Versions 1–3 continue
to load without reinterpretation. Refuse newer fields in older envelopes.

Routing remains a bounded graph of six-metre orthogonal streets around one
rectangular park, plus a checked entrance apron. It may fail where a different
route would work. No curved streets, turning radii, traffic capacity, external
road verification, access permission, surveyed position, solar or zoning
compliance is modeled. Human acceptance, physical touch hardware and a real
configured model round trip remain independent gates.
