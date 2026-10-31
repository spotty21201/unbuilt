# Unbuilt — Product requirements v0.19

Issued 31 October 2026 at the owner's request. This is the current consolidated product specification for the implemented residential master-planning workbench, including angled streets, corner fillets and the corrections from the combined tester review. It supersedes older roadmap status summaries. Earlier PRDs and tester assignments remain preserved; their detailed requirements continue to apply unless this revision explicitly updates them.

This revision documents the accepted implementation scope. It does not authorize additional roadmap features or establish human/professional acceptance. The implementation checkpoint is `31a21f5`; the document revision does not change application behavior.

## 1. Product purpose and users

Unbuilt helps residential masterplanners shape a site, test neighborhood layouts, compare schemes and explain their measured land, housing and cost consequences. Planners work directly on a large drawing with a contextual inspector. Owners and collaborators can review alternatives, notes, declared assumptions and portable decision records.

The product must distinguish measured geometry, entered assumptions, documented source references and unverified information. Every material replacement of accepted work requires a reviewable draft and explicit Apply. Deterministic calculations remain available when AI is unconfigured.

## 2. Core planning journey

1. Create or reopen a named project; start blank or deliberately load a labeled sample.
2. Draw or edit the site boundary, declare an entrance and attach site-context references.
3. Shape streets, lots, home templates and open spaces. Inspect full-width conflicts and measured consequences before applying changes.
4. Enter cost and development-study assumptions with their sources and units. Keep missing or inapplicable results unavailable.
5. Explore a feasibility experiment, deterministic search option or AI-proposed experiment. Review accepted-versus-trial drawings, quantities and explanations.
6. Name and annotate useful schemes, compare them and explicitly reopen the selected alternative.
7. Save locally or export a portable project/decision record. Use Undo/Redo to recover accepted states.

## 3. Implemented feature scope

The owner's feature numbering controls this specification. Historical roadmap numbering is not a delivery commitment.

| Feature | Required behavior | Detailed contract |
| --- | --- | --- |
| 1. Projects | Named browser-local projects; create blank/sample, save, reopen, rename, delete/recover and carry portable copies. Storage failure must retain recoverable work. | [Roadmap and project scope](PRD_v0.8.md) |
| 2. Plan deletion and restart | Remove/restore homes, clear a layout or delete boundary/layout through explicit review and recovery/history. Preserve retained assumptions and study inputs as documented. | [Roadmap and project scope](PRD_v0.8.md), [development integration](PRD_v0.17.md) |
| 3. Boundary editing | Draw closed irregular sites; edit vertices with pointer, keyboard or coordinates; measure true area; validate containment; review consequences before replacing accepted geometry. | [Roadmap and boundary scope](PRD_v0.8.md) |
| 4. Site context | Attach supported DXF/PDF/image references, align supported source data and annotate context with provenance. Reference annotations do not establish access rights or reserve land. | [Site context](PRD_v0.9.md) |
| 5. Editable streets | Connected editable street networks, widths, shared junctions, explicit entrance-link proposals and measured conflict review. The angled/rounded extension below updates the original orthogonal scope. | [Street editing](PRD_v0.10.md), [angled streets and fillets](PRD_v0.18.md) |
| 6. Lots and blocks | Rectangular split/merge and connected rectangular block subdivision; individual polygon reshapes; real frontage, home-fit and vacancy checks. Preserve held lots and edits. | [Lots and blocks](PRD_v0.11.md) |
| 7. Housing mix | Named rectangular home templates, default/explicit assignments to lots or blocks, true built-area and construction quantities, reviewable assignment changes and vacancies. | [Housing mix](PRD_v0.12.md) |
| 8. Open spaces | Up to 12 named polygon parks, pockets or straight green corridors; locks, minimum areas, clearance, true green quantity and cost, drawing/history and retained reservations. | [Open spaces](PRD_v0.13.md) |
| 9. Feasibility experiments | Review generated design changes and eight editable project cost assumptions; compare accepted/trial/change results with sequential design/cost attribution. Held manual work limits regeneration. | [Feasibility experiments](PRD_v0.14.md) |
| 10. Saved alternatives | Name, annotate, reopen and compare independent scheme snapshots with each scheme's own geometry, assumptions and study inputs. Reopening requires review; working state and collection recovery remain distinct. | [Saved alternatives](PRD_v0.15.md) |
| 11. AI assistant | Translate intentions into supported reviewable experiments, clarification, selected measured explanations or explicit limits. Configure primary/alternate completion connections and private keys through administrator settings. | [AI assistant](PRD_v0.16.md), [administration](AI-ADMIN.md) |
| 12. Terrain, drainage and phasing | Enter supporting data for terrain screening, whole-site Rational runoff screening and monthly phase accounting. Retain sources and flag applicability/reference problems rather than inventing results. | [Development studies](PRD_v0.17.md), [calculation methods](DEVELOPMENT-CALCULATIONS.md) |

## 4. Angled streets and corner fillets

### Drawing and editing

- Open **Circulation → Edit street network**. **Any angle** connects consecutive picked or typed points directly. **Right angles** retains the automatic orthogonal bend.
- Preserve decimal coordinates. Pointer projection onto an angled centreline must retain a true joining point rather than rounding it off the segment. Centreline crossings join at grade and split into shared nodes.
- Allow 6–12 m entered street widths. Shared junction edits move connected legs; existing horizontal/vertical components retain aligned row/column editing.
- **Corner fillet radius (m)** accepts 0–50 m. **Round corners · 4 m** offers a starting value. Zero retains square corners. Do not silently round an existing accepted legacy network.
- Show the full draft pavement, changed quantities and named blockers. Invalid or incomplete inputs block Apply and retain the accepted plan. Apply is one plan-history step; draft history and Cancel remain available.

### Geometry and measurement

Offset every straight centreline by half its declared width. Close outside bend wedges at the offset-kerb intersection before combining pavement. Limit the miter to four times the larger half-width; use a bevel for extreme hairpins. Union crossings once and retain polygon holes. Entrance and terminal cross-sections keep their full declared width.

Replace kerb corners with circular fillets. For included angle α and radius R, the tangent distance is `R / tan(α/2)`. Cap this distance to 45% of each adjacent kerb edge to prevent neighboring fillets crossing. Report the number of reduced corners and the smallest effective radius. The entered kerb radius does not establish a minimum centreline radius or vehicle swept path.

Approximate curves with at most 0.005 m chord deviation. The same unioned polygon outline must drive the plan drawing, road area, road cost, drainage surface area, containment, conflicts and frontage. Quantities measure that bounded approximation; do not describe them as exact circular-arc areas. Keep measured entrance-apron area separate and refuse pavement/apron overlap.

### Parcel consequences

Automatic whole rectangular lots remain aligned with horizontal/vertical street legs. Check them against the actual curved/angled pavement and measure their actual shared frontage. Land along angled legs remains explicitly unallocated. This revision does not add rotated parcels, curved-frontage subdivisions or nonrectangular block merges.

Held manual lots, lot reshapes and assigned housing must retain their existing protections. A street or fillet cannot silently remove, reshape or reassign held work. Preserve angles/radii through width/removal edits, history, saving, export/import, comparison/reopen, search, feasibility and supported measured AI proposals.

## 5. Calculations, assumptions and source data

Geometry and finance must be deterministic. Reconcile the site land budget across parcels, designed green, unioned road/apron area and unallocated remainder. Vacant lots contribute no home revenue or home construction. Home-template dimensions determine built area. Distinguish assumed rates, selling prices, owner benchmark and target from measured quantities and market evidence.

Feasibility experiments may change supported generated design parameters and the eight explicit cost assumptions. Manual streets hold routing; manual lots, reshapes and assigned homes constrain regeneration. Show the actual final inputs and accepted/trial/change results before Apply. Cost-only trials remain available when geometry is held.

Terrain requires supported complete local-metre elevation grids, source, datum, observation date and declared basis. Accept valid 0.01 m grid spacing while allowing only numerical subtraction roundoff; refuse genuinely shorter intervals. Coverage or applicability problems keep affected results unavailable. Terrain cut/fill remains screening to the entered whole-site platform, without an automatic grading budget.

Drainage uses the declared whole-site catchment, entered uniform storm and runoff coefficients, plus the actual measured roof/road/green/remainder areas. Explain assumptions and any entered outfall capacity. Rainfall volume is separate from runoff/storage. This does not design a pipe network, detention system or downstream discharge arrangement.

Phasing assigns every occupied current lot explicitly, retains obsolete references for review, and schedules accepted costs/revenue using declared timing and shared allocations. Closing cash must reconcile to modeled surplus. Report the maximum month-end deficit with its stated limits; do not present it as a verified financing requirement. Detailed methods and units remain in [Development calculations](DEVELOPMENT-CALCULATIONS.md).

## 6. AI and administration boundaries

The model can propose supported experiment inputs, request clarification, select engine-composed measured findings or explain a known limit. It cannot author authoritative quantities or apply changes. Review proposed inputs, run deterministic measurement, inspect the resulting plans and explicitly Apply. No autonomous application or hidden fallback/retry is permitted.

Bind requests and proposals to the exact accepted state, numerical input precision, selection and routing revision. JSON transport must preserve that binding when optional object fields are absent. Changed plans, cancelled requests, changed selection/configuration and obsolete replies must remain invalid.

Administrator settings support explicit primary/alternate endpoint and model changes and private key replacement/removal. Keys stay server-side outside project data, exports and the repository. Connection status must distinguish configuration from a verified tool response. Real routing points, secrets and real-model quality verification remain outstanding; scripted protocol fixtures prove integration only.

## 7. Interaction, accessibility and preservation

- Keep the drawing central, with contextual controls and compact measured outcomes. Drawing, selection, pan/zoom and keyboard editing must remain usable together.
- Distinguish accepted work, unapplied drafts and invalid drafts. Failures and stale results must retain accepted work; replacements require explicit Apply or confirmed reopening.
- Use named group semantics for interactive plan canvases, with named focusable descendants and functioning keyboard controls. Do not hide interactive objects to suppress accessibility errors.
- Put comparison scale/camera readouts in a separate strip below the clipped drawing so they do not overlap dimensions. Preserve readable labels and truthful scale calculations at desktop, tablet, narrow and native 200% browser zoom.
- Preserve tester prompts, original reports, failing regressions and subsequent correction evidence. Automated scan/test results do not constitute screen-reader, physical-device or human acceptance.

## 8. Persistence and compatibility

| Payload containing angled streets or explicit corner radius | Required envelope |
| --- | --- |
| Saved project | Version 14 |
| Portable decision record | Version 15 |
| Canonical scenario snapshot | Version 12 plus `angled-rounded-streets` capability |

Advanced road data existing only in a saved alternative must also upgrade the outer project/record envelope. Refuse disguised downgrades. Continue reading supported older projects; retain their original square geometry and numerical behavior until explicitly edited. Exact inputs and material changes participate in stale-response binding.

Save original editable networks/radii and derive pavement through the shared engine. Preserve study sources, annotations and scheme independence. Original reference media follow their documented reattachment limits; exported records must not imply that absent source media or private AI credentials are included.

## 9. Verification and acceptance status

Implementation verification for checkpoint `31a21f5` is recorded in [Angled/rounded street evidence](../evidence/angled-rounded-streets/README.md). It includes:

- 736 passing calculation/validation/service checks, including 20 advanced-road geometry/integration checks.
- Passing production build and lint; the existing bundle-size advisory remains.
- All 35 established browser regression runs passing. The captured matrix has 36 entries including the initial new-road run; its final targeted workflow has 27 checks, with a separate five-check native 200% zoom run.
- No detected accessibility violations on the advanced road editor/canvas scan, with keyboard editing exercised and screenshots inspected.
- All 999 baseline tester-prompt/evidence files unchanged.

The [combined independent tester report](../evidence/combined-independent-review/run-2026-10-30-independent/REPORT.md) required four corrections: valid AI replies after boundary edits, decimal 0.01 m grids, comparison-label overlap and canvas semantics. These are implemented and verified in the [separate correction evidence](../evidence/combined-independent-review/run-2026-10-30-corrections/README.md). Keep the original report and failing cases intact. Implementation retesting does not replace a new independent human acceptance decision.

The [acceptance matrix](ACCEPTANCE.md) and [work context](WORK-CONTEXT.md) track evidence and outstanding checks. Preserve the [combined tester prompt](../evidence/combined-independent-review/TESTER-PROMPT.md) and the individual [Feature 11](../evidence/ai-assistant/TESTER-PROMPT.md) and [Feature 12](../evidence/terrain-drainage-phasing/TESTER-PROMPT.md) prompts.

## 10. Remaining scope and release limits

Real-model access/quality, actual site survey/storm/cost/phase suitability, physical-device gestures, real screen-reader use and human planner/professional acceptance remain open. They require the corresponding credentials, data, devices or reviewers; do not relabel software checks as those approvals.

Road widths and kerb radii are planning assumptions. Vehicle swept paths, engineering turning compliance, vertical road design, downstream hydraulics, utilities, legal access and statutory approval are not established. Open-space routing remains conservative around bounding extents plus clearance; excess excluded land remains unallocated.

Planning brief/rules, a dedicated land-budget workflow and walkability remain future roadmap topics. Rotated-lot generation and engineering analysis are also outside this revision. Their inclusion here as limits does not authorize implementation. New scope requires the owner's next instruction.

## Revision record

| Version | Change |
| --- | --- |
| v0.17 | Terrain, drainage and phasing with entered supporting data. |
| v0.18 | Angled editable streets and measured corner fillets. |
| v0.19 | Consolidated current product requirements; incorporated road behavior, tester corrections, compatibility, verified status and remaining acceptance limits. Documentation only. |
