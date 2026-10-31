from pathlib import Path
import json,re
r=Path(__file__).resolve().parent
rows=[]
def add(id,kind,inputs,expected,observed,status,evidence):rows.append(dict(id=id,kind=kind,inputs=inputs,expected=expected,observed=observed,status=status,evidence=evidence))
# IDs follow every numbered case in the combined primary assignment. Software results
# do not close the explicitly separate human/physical/model/professional gates below.
data='''A1|Branch (40,50)→(40,90), three arrows, off-centre drag|X changes, Y=50; vertical moves warn; local history/cancel safe|Matched, including horizontal live delta, deliberately disconnected entrance and canvas zoom|Pass|street-review-browser/browser-results.json
A2|Pointer near (40,51); separately typed exact gap|Pointer snaps with Join cue; typed 1 m gap stays until explicit join|Matched pointer/typed distinction, repair Undo and Cancel|Pass|street-review-browser/browser-results.json
A3|Accepted manual branch; fixed-network proposal|Review and execute Spine 9/10/11/12 frontage, reject first without execution|Four-frontage scope matched; added rejection case ran no options until approval|Pass|gaps/results.json
A4|Isolated/park-crossing/boundary-crossing streets|Full corridor/conflict region visible; invalid Apply blocked, direct repair works|Named corridor/gap/park/boundary cues; repair cleared conflict|Pass|street-review-browser/browser-results.json
A5|Fresh sample trunk Y50→40, Connect entrance|20→18 homes and 720→789 m² road, Cancel retains original|Exact figures and retained 20-home accepted plan matched|Pass|street-review-browser/connector-review.png
A6|Accepted branch, 375×812 width 6→7; tablet and zoom|Identity, consequences, scale/camera/selection/draft persist through review|Street 942→979 m²; camera/selection retained; touch emulation separately recorded|Pass|street-review-browser/browser-results.json
B1|Fresh adjacent Lots 1/3 then split merged lot; across-road merge|200+200=400 m², 20→19→20 homes; Cancel/history safe; road-gap union refused|Matched; added merge-specific Cancel; nonrectangular refusal also in root suite|Pass|parcels-browser/browser-results.json
B2|South 120×20 m block, ten widthwise lots; depthwise vacant rear|240 m² each, 18 homes, 4000 m² lots/720 roads/480 green; rear no-frontage blocked|Exact totals; one-based rear reference/highlight and disabled Apply|Pass|lot-review-followup-browser/browser-results.json
B3|Split 200 m² lot into two vacant 100 m² children; merge vacancy|21 parcels/19 homes, no vacant revenue; merge vacant+occupied 19→18|Matched, reservation preservation and source occupancy explicitly reviewed|Pass|parcels-browser/browser-results.json
B4|Out-of-profile merge and occupied polygon selection|Trace changed/unchanged references, provisional allowance and setback limits|Lineage, occupancy and selected-setback disclosure observed|Pass|lot-review-followup-browser/lineage-pricing.png
B5|Reshape subdivided lot, pointer/keyboard/corners; save/import|Fresh preview, valid geometry/frontage/fit; Cancel/history/reload retain work|Pointer offset, local/plan history, held-lot conflict and portable edits passed|Pass|parcels-browser/browser-results.json
C1|Vacant Lot1, Courtyard16×16; outline open/Cancel; fitting repair/Restore|Persistent named conflict at 19 homes; repair stays vacant until explicit Restore|Matched; added assertion after outline Cancel, not just before opening it|Pass|gaps/results.json
C2|Explicit Courtyard8×6, return to generated lots|Separate defaults approval and generated-partition approval; each Cancel/Undo has declared consequence|Default-stage Cancel and post-default Cancel, both approval/history paths matched|Pass|housing-review-browser/browser-results.json
C3|One explicit Courtyard renamed/resized7×6 and made default, restore old default|840 m² then1182 m²; explicit/default same-name identities differ; release separate|Matched inherited/explicit targets, current-default explicit holding and source inheritance|Pass|housing-review-browser/browser-results.json
C4|375×812 one48 m² Courtyard; tablet and native zoom2|Code/name/area/provenance and both counts readable without color; camera continuity|Text key/readout and exact viewBox persistence passed; no physical-device claim|Pass|housing-review-browser/drawing-375.png
C5|19×60+48 m² at Rp5m/m² and5% contingency|1188 m²,5.94bn home cost,60m+3m saving,63m allowance gain, unchanged revenue|Exact finance and inspectable shared assumptions; invalid drafts withheld|Pass|housing-review-browser/browser-results.json
C6|Library/default backup; delete protected templates; nondefault polygons, common-source inheritance, delayed answer|References/provenance preserved, invalid fit rejected, obsolete answers absent|Provenance/deletion/fit/inheritance passed; HD01/02 also held a real fixture reply through a housing-library/assignment edit, discarded it and retained accepted costs|Pass|limit-and-housing-delay/results.json
D1|480 park plus120 pocket and160 corridor; replace pocket by concave72|760 m² combined; concave result is72 not bounding120|760 collection passes; added UI concave case applied six corners and552 m² with original park|Pass|gaps/concave-green.json
D2|Each named space, off-centre drag, coordinates/arrow/Shift, add/remove, unfinished history|No jump, repeated keyboard focus, unfinished recoverability, Cancel accepted-state protection|Pointer/draft history/keyboard/closure/editing assertions matched|Pass|open-spaces-browser/browser-results.json
D3|Crossings, overlap, outside site, pocket minimum121 and combined761|Invalid disabled Apply with named conflict; locks differ from minima|Matched all guards; independent true area and conservative bounds in root assertions|Pass|open-spaces-browser/browser-results.json
D4|New park over generated homes; separately held lots/housing|Measured consequences and true-area cost before approval; no silent manual loss|Generated changes reviewed; held Lot20 blocked in connected study, Cancel preserved it|Pass|J05a-held-green-conflict.png
D5|Fixed Loop, named spaces through search/explanation, save/import, clear/generate, narrow/zoom|Unsupported route explicit; no optimum claim; accepted polygons/bindings preserved|Loop refusal, live search/measurement, delayed invalidation, blank reservation, touch-emulated creation passed|Pass|open-spaces-browser/integration-results.json
E1|Supported design dimensions/circulation and eight cost assumptions separately/jointly|Held inputs retained; complete costs, required price and sequential attribution|Calculation/invalid/combined assertions pass. Small comparison scale has separate failing LABEL-01|Pass|feasibility-browser/browser-results.json
E2|Unchanged1200 m², construction5m→4m, contingency5%|Non-land costs10.3804→9.1204bn,1.26bn saving; unchanged geometry/revenue|Exact UI, server search/explanation and shared economics matched|Pass|feasibility-browser/server-explanation.json
E3|Manual partition/reshapes/assigned homes; invalid inputs|Regeneration held, costs usable; invalid inputs publish no partial trial or Apply|Matched, including connected manual street/lot/green/housing study|Pass|feasibility-browser/browser-results.json
E4|Reset/illustrative/Cancel/Escape/Apply/history/reload/import and keyboard/narrow/zoom|One accepted step, safe cancellation and accessible actions|Workflow assertions passed; inset label collision is separately failed under F4/LABEL-01|Pass|feasibility-zoom/zoom-results.json
F1|Baseline and cheaper scheme; notes/rename/reopen/cancel/history/reload|Independent copies and collection survive plan history; explicit reopen|Matched exact states, notes, cancel/confirmation and Undo/Redo|Pass|saved-alternatives-browser/browser-results.json
F2|Save unapplied preview; compare4m/5m costs and800m/850m price; names/limits/removal|Preview does not apply;1.26bn cost delta; only changed price side reprices; unique bounded collection|UI preview/removal/history and independent finances passed;LIMIT01–04 created20 schemes, blocked21st save and verified removal/Undo/export|Pass|saved-alternatives-browser/browser-results.json
F3|Manual streets/lots/reshape/housing/vacancies/green/cost/context/studies snapshots; blank reopen|Full inputs retained or orphaned work blocked, including blank→saved|Combined exported study retained all its captured inputs; root full-snapshot/orphan-shape tests and blank reopen passed|Pass|connected-study.json
F4|Export/import several schemes; notes independence; quota and real conflicting tabs|Original and last durable collection safe, current memory project downloadable|Original/import notes independent; both durable other-tab and memory-first-tab schemes exported intact|Pass|scheme-conflict/results.json
F5|Draft annotation, Escape/focus, narrow/touch emulation/native zoom|Unsaved metadata retained, footer reachable and focus returned|Passed; no cloud or physical touch claim|Pass|saved-alternatives-zoom/zoom-results.json
G1|Scripted fixture intention→proposal→Run→engine→review→Apply; cancellation/history/export|No automatic apply, bound proposal, deterministic quantities and full accepted inputs|Fresh simple sample passed full chain; same-session accepted boundary/connected study rejected valid response as stale. Continued later study via separately labeled manual cost review|Fail|ai-boundary-repro/results.json
G2|Ambiguous/unsupported/parallel/prose/failure/delayed/cancel/timeout/revisions and changed plan|Reject invented/obsolete work; local tools retained; no automatic alternate routing|Existing browser/service contract checks matched safety cases, including real20-second fixture timeout; F1 is false rejection, not stale acceptance|Pass|root-tests/run.log
G3|Isolated administration, primary/alternate, retain/replace/remove, restart/revisions/concurrency/privacy|Authorized bounded configuration,0600 private file, write-only keys, no forbidden payload/export fields|Service and browser checks matched; no real secret installed|Pass|ai-browser/browser-results.json
G4|Local tools vs AI interpretation vs engine facts; keyboard/narrow/actual zoom|Separate labels and explicit approval; readable review|Labels, error recovery, narrow/modal/zoom assertions passed; canvas semantics remain separately flagged|Pass|ai-zoom/browser-results.json
G5|Real routing/credential/model and repeated supported/ambiguous intentions|Authorized real-model tool roundtrip and evaluated language quality|No owner-supplied connection/credential/authorization; only scripted fixture used|Blocked|REPORT.md
H1|Empty opening; malformed/duplicate/missing/nonuniform/fine400 grid; concave/reversed/positive-negative platforms|No invented data or extrapolation; analytic plane slope2.23607%, cut8033.333/fill833.333|Independent analytic cases passed; exact decimal0.01 m spacing failed documented validation minimum|Fail|fine-grid/results.json
H2|Disjoint1200/720/480/9600 surfaces; C.9/.85/.2/.35;100 mm/h30min tc15; applicability/outfalls|WeightedC.429, peak.143, gross rain600; short/inapplicable unavailable; optional capacity separate|Matched independent numeric cases and applicability UI; external(500,500) reference displayed without claiming a network|Pass|independent-calculations.json
H3|Two equal10-home phases, months1–3/4–6 and sales4/7, owner month1|17bn receipts,10.3804bn nonland, closing−3.8904bn, deficit15.1902bn; exact ledger|All seven independently constructed rows reconcile, contingency once, calendar labels and single owner payment|Pass|independent-calculations.json
H4|Vacancies/mixed templates/infrastructure-only/delayed sales/zero costs/late owner/invalid shares/orphans|Actual sizes and explicit shares; invalid refs unavailable, never remap automatically|Inherited root cases plus independently tested infrastructure-only and late owner schedule passed|Pass|independent-calculations.json
H5|Partial applicability, invalid draft, history/file/record/reload/schemes; clear/delete/resize/starter|Retain observations without relocating grids or silently reassigning; explicit remapping|Existing study UI/export/import/history plus added clear→generate→resize retained exact inputs and withheld coverage/orphan results|Pass|gaps/results.json
H6|Map/table/keyboard/focus/contrast/SVG/reflow/narrow/actual zoom; feasibility/AI/server|No invalid SVG; named noncolor assignment alternative; stale-phase warning; privacy/local agreement|Map/table/focus/reflow/privacy/server passed; automated contrast has incomplete decisions; main canvas semantics separately failed|Unclear|accessibility-final/accessibility-results.json'''
for line in data.splitlines():
 id,inputs,expected,observed,status,evidence=line.split('|')
 add(id,'Technical UI / fixture checks',inputs,expected,observed,status,evidence)
add('I-CONNECTED','Visible controls; technical fixture','Named sample with boundary/context/branch/vacant split/Courtyard/protected pocket/three fictional studies/two schemes','Complete AI experiment and explicit Apply, independent schemes and backup recovery','11 checkpoints passed; AI failed after accepted boundary; manual cost trial completed remaining comparison/recovery. No full AI acceptance.','Fail','connected-results.json')
add('I-KEYBOARD','Keyboard only','Fresh samples; Tab/Enter/Space/arrows/typing; no direct focus/mouse completion','Complete editing/cancel/history and focus return','7 complete journeys passed; first harness selector corrected without weakening expectation','Pass','keyboard-rerun/keyboard-results.json')
add('I-AX','Automated accessibility','Axe4.11.3, WCAG2A/AA/2.1AA; 12 editor/comparison/admin/narrow surfaces','No detected violations','8 surfaces have nested-interactive canvas violation;4 clear; incomplete contrast nodes retained','Fail','accessibility-final/accessibility-results.json')
add('I-LABEL','Measured visual check','Unchanged sample,1024×768 Feasibility comparison','Scale and dimension label boxes do not intersect','120.0 m dimension overlaps50 m scale in both drawings','Fail','comparison-labels/results.json')
for id,inputs,expected,observed,status in [
 ('GATE-HUMAN','Independent residential planner','Unrehearsed human comprehension and acceptance','Only automated agent was available','Not tested'),
 ('GATE-PHYSICAL','Actual phone/tablet/OS/browser and gestures','Real tap/drag/pinch/scroll/screen keyboard','No physical device supplied; emulation labeled separately','Not tested'),
 ('GATE-SCREENREADER','Named real screen reader and browser','End-to-end announcements/navigation/error recovery','No real screen reader available; Chromium AX tree is not a reader walkthrough','Not tested'),
 ('GATE-PROFESSIONAL','Aligned survey/datum,storm/catchment/outfall,schedule,cost evidence and reviewers','Site-specific planner/civil/financial assessment','No actual project evidence or qualified reviewer supplied','Blocked'),
 ('GATE-MODEL','Owner-supplied endpoint/model/key and authorization','Real model identity/access and repeated language-quality evaluation','No credentials/authorization supplied; no substitute model contacted','Blocked'),
 ('GATE-CONTRAST','All text/graphic states including SVG overlays','Human-reviewed contrast and noncolor comprehension','Some screen text visually inspected; axe cannot complete several SVG/obscured decisions','Unclear'),
 ('GATE-OTHER-BROWSERS','Other engines/AT combinations','Cross-engine/device evidence','Only Chromium tested','Not tested'),
 ('VARIANT-HOUSING-DELAY','A held delayed response plus exact housing-library mutation','Specific mutation cannot revive old answer','HD01/02 held an assistant reply while applying a housing-library/assignment edit; obsolete proposal absent,5.94bn accepted home cost retained','Pass'),
 ('VARIANT-20-SCHEMES-UI','Twenty UI-created schemes plus21st attempt','UI limit and recovery observable at full collection','LIMIT01–04 created20 through UI, blocked21st, removed/restored one and exported20 snapshots','Pass')]:add(id,'Additional variant' if status=='Pass' else 'External gate / explicit variant',inputs,expected,observed,status,'limit-and-housing-delay/results.json' if status=='Pass' else 'REPORT.md')
# Include new atomic scripts, without counting diagnostic/harness attempts as acceptance.
new=[('independent-calculations.json','Numeric'),('keyboard-rerun/keyboard-results.json','Keyboard'),('scheme-conflict/results.json','Storage'),('limit-and-housing-delay/results.json','Limit / stale housing reply'),('gaps/results.json','Procedural gap'),('connected-results.json','Connected'),('ai-boundary-repro/results.json','Reduced UI regression'),('fine-grid/results.json','Input boundary'),('comparison-labels/results.json','Visual'),('accessibility-final/accessibility-results.json','Automated accessibility')]
for file,kind in new:
 j=json.loads((r/file).read_text());items=j.get('results',j.get('checks',[])) if isinstance(j,dict) else j
 if isinstance(j,dict) and 'id' in j:items=[j]
 for item in items:
  if not isinstance(item,dict):continue
  id=item.get('id','');status=item.get('status','Unclear')
  obs=item.get('observed',item.get('error',item.get('violations','Completed declared assertions')))
  add('NEW-'+id,kind,str(item.get('startingInputs','Declared fixture in linked script/results; fresh disposable context')),str(item.get('expected','Assertion/case contract; see named script and result')),str(obs),status,file)
add('NEW-HASH-TRANSPORT','Technical regression','Supported snapshot with explicit undefined optional cost/development fields; JSON wire roundtrip','Exact snapshot hash invariant across JSON transport','client1b6218f28cc95b versus wire9d25fc007cdf2; equality assertion failed','Fail','hash-transport-regression.log')
# Reused checks remain separately labeled. Their linked source owns exact fixtures/assertions;
# they are not represented as newly independent arithmetic or human observations.
suites=json.loads((r/'existing-results.json').read_text())
source_files=list(Path('tests').glob('*'))
source_text={str(p):p.read_text(errors='replace') for p in source_files if p.is_file()}
def source(name,fallback):
 base=name.split(': actual=')[0]
 ordered=([(fallback,source_text[fallback])] if fallback in source_text else [])+list(source_text.items())
 for p,t in ordered:
  if base in t:
   line=t[:t.index(base)].count('\n')+1
   return f'{p}:{line}'
 return fallback
counts={};catalog=[]
for suite in suites:
 name=suite['name'];log=(r/suite['log']).read_text()
 if name in ['web-build','web-lint']:continue
 names=re.findall(r'^PASS (.*)$',log,re.M)
 if name!='root-tests':
  folder=r/('open-spaces-browser' if name=='open-spaces-integration' else name)
  js=folder/('integration-results.json' if name=='open-spaces-integration' else 'browser-results.json')
  if not js.exists():js=folder/'zoom-results.json'
  if not js.exists():
   js=next(iter(folder.glob('*results.json')),None)
  if js and js.exists():
   j=json.loads(js.read_text());checks=j.get('checks') if isinstance(j,dict) else None
   if isinstance(checks,list) and len(checks)>len(names):names=[str(s) for s in checks]
 counts[name]=len(names)
 fallback='package.json npm test' if name=='root-tests' else 'tests/'+('development-browser.cjs' if name=='development-zoom' else 'ai-browser.mjs' if name=='ai-zoom' else name+('.mjs' if name=='ai-browser' else '.cjs'))
 for i,n in enumerate(names,1):
  expected=n.split(': actual=')[0]
  if ' expected=' in n:expected=n.split(' expected=',1)[1]
  loc=source(n,fallback)
  catalog.append(dict(id=f'BASE-{name}-{i:03}',kind='Reused technical check',inputs=f'Fixture and exact assertion: {loc}',expected=expected,observed=n,status='Pass' if suite['exit']==0 else 'Unclear',evidence=suite['log']))
# Narrow matrix rows are deliberately limited to the evidence actually observed.
def cell(v):return str(v).replace('|','\\|').replace('\n','<br>')
def table(items):
 lines=['| ID / pass | Starting inputs | Expected result (independent where noted) | Observed result | Status | Evidence |','|---|---|---|---|---|---|']
 for x in items:
  lines.append('| '+ ' | '.join(cell(v) for v in [x['id']+' · '+x['kind'],x['inputs'],x['expected'],x['observed'],x['status'],f"[{x['evidence']}]({x['evidence']})"])+' |')
 return '\n'.join(lines)
text='''# Test matrix — combined independent review

Commit `38ce2f6870d9b83ab85e6ba2ed11dd46f6021048`; served `index-BR3nNjEc.js` / `index-6D583crq.css`; Playwright Chromium149.0.7827.55 on Linux. Main UI1440×900; tablet1024×768; narrow375×812; actual native zoom2 starts at720 CSSpx/DPR2 with unchanged1440 outer width. Per-suite results/scripts identify context/viewport transitions. Physical devices and screen readers are separate gates. See [environment.json](environment.json) and [REPORT.md](REPORT.md).

Pass means the stated **software check**, not human planner or professional acceptance. Unclear separates covered subcases from unperformed/unresolved parts. Subordinate failures/external gates remain visible even where the associated calculation/control check passes. No original prompt is superseded by a green baseline count.

## Combined assignment, new cases and external gates

'''+table(rows)
text+='''

## Original-prompt reconciliation

The nine original files were read and preserved. Their software procedures map as follows; physical/human/professional/model clauses always map to the explicit gates above. The atomic catalog below records every freshly rerun inherited assertion, so a group-level Pass does not invent an unperformed user interaction.

| Original procedure | Cases / evidence | Remaining qualification |
|---|---|---|
| street-review-followup/RETEST-PROMPT.md,1–6 | A1–A6;street-review,streets,streets-zoom;GAP-A3 | Actual hardware and access/engineering untested |
| blocks-and-lots/TESTER-PROMPT.md,1–10 | B1–B5;parcels/lot-followup;irregular-site,reshape/import/cancel checks | Legal parcels, arbitrary polygon block splitting and full statutory setbacks not established; hardware/human gate open |
| housing-mix/TESTER-PROMPT.md, six lot concerns and housing bullets | B2/B3/B4/B5,C1–C6;housing,parcels and root contracts | Held response plus actual housing edit covered by HD01/02; hardware/market gates open |
| housing-review-followup/TESTER-PROMPT.md,1–5 and additional paragraph | C1–C6;34 review checks,7 zoom checks,root;GAP-C1 | Specific delayed-library variant HD01/02 passed; generic stale input/selection also tested |
| open-spaces/TESTER-PROMPT.md,1–10 | D1–D5;31 UI,17 integration,7 actual-zoom checks;GAP-D1 | No physical gestures,ecology/path/compliance or human acceptance |
| feasibility-experiments/TESTER-PROMPT.md, workflow/calculation/accessibility paragraphs | E1–E4;33 UI,5 actual-zoom checks,root;NEW-LABEL-01 | Small-comparison overlap failed; full contrast/AT conformance unresolved |
| saved-alternatives/TESTER-PROMPT.md, all workflow/preservation/recovery paragraphs | F1–F5;36 UI,7 actual-zoom checks;SC01/02;connected export/import | 20-row UI/21st-save block and recovery tested by LIMIT01–04;source bytes remain session-only |
| ai-assistant/TESTER-PROMPT.md, all workflow/admin/privacy paragraphs | G1–G5;28 UI,29 actual-zoom,12 contract/19 service checks;AI-B01–04;HASH | Integrated AI false-stale rejection fails;real provider quality blocked |
| terrain-drainage-phasing/TESTER-PROMPT.md, terrain/drainage/phasing and lifecycle/accessibility paragraphs | H1–H6;39 UI/40 zoom,22 root checks;9 new analytic,GAP-H5,GRID-01 | Decimal minimum fails;actual survey/storm/schedule/professional evidence absent |

## Reused technical assertion catalog

These are **fresh executions of existing assertions**. The exact starting fixture and expected value/guard are in the named source, and the observed log is linked. Names stating a numeric result expose that expected result; `actual/expected` lines preserve both. Expectations here are inherited tests, not a claim of newly independent arithmetic. The independent numeric oracle is separately labeled above and stored in `independent-calculations.mjs/json`. Browser checks were isolated; some legacy setup uses internal storage and is therefore technical evidence, not the first visible-control journey.

'''+table(catalog)
text+='\n\n## Count reconciliation\n\n'+str(counts['root-tests'])+' root checks; '+str(sum(v for k,v in counts.items() if k!='root-tests'))+' browser checks in '+str(len(counts)-1)+' browser runs. Build and lint are separate checks. New cases are listed individually above; repeated manifestations of a defect are not counted as distinct product bugs. Initial harness failures remain diagnostic evidence and are described in COMMANDS.md.\n'
(r/'TEST-MATRIX.md').write_text(text)
(r/'matrix-cases.json').write_text(json.dumps({'cases':rows,'reused':catalog,'suiteCounts':counts},indent=2))
print(json.dumps({'primaryAndNew':len(rows),'inherited':len(catalog),'root':counts['root-tests'],'browser':sum(v for k,v in counts.items() if k!='root-tests'),'browserRuns':len(counts)-1,'matrixBytes':len(text)},indent=2))
