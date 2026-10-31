from pathlib import Path
import subprocess,os,json,time,concurrent.futures
root=Path(__file__).resolve().parent
base=dict(os.environ,PLAYWRIGHT_MODULE='/home/spotty/projects/studioos/node_modules/playwright')
results=[]
def run(name,args,extra={}):
 p=root/name;p.mkdir(exist_ok=True);env={**base,'UNBUILT_EVIDENCE_DIR':str(p),**extra};t=time.time()
 with (p/'run.log').open('w') as log:
  try:r=subprocess.run(args,env=env,stdout=log,stderr=subprocess.STDOUT,timeout=150);code=r.returncode
  except subprocess.TimeoutExpired:code=124
 row=dict(name=name,command=args,env=extra,exit=code,seconds=round(time.time()-t,2),log=str(p.relative_to(root)/'run.log'));print(json.dumps(row),flush=True);return row
jobs=[('root-tests',['npm','test'],{}),('web-build',['npm','run','build','--prefix','web'],{}),('web-lint',['npm','run','lint','--prefix','web'],{})]
normal=['boundary-browser','boundary-pointer-range-browser','development-browser','dynamic-inspector-browser','feasibility-browser','housing-browser','housing-review-browser','lot-review-followup-browser','open-spaces-browser','parcels-browser','planner-feedback-browser','planner-feedback-fixes-browser','planner-feedback-fixes-storage','planner-review-followup-browser','project-lifecycle-browser','projects-browser','saved-alternatives-browser','site-context-browser','site-context-recovery-browser','stitch-viewport-browser','street-review-browser','streets-browser']
zoom=['browser-zoom','feasibility-zoom','housing-zoom','open-spaces-zoom','parcels-zoom','planner-feedback-fixes-zoom','saved-alternatives-zoom','site-context-zoom','streets-zoom']
for x in normal:jobs.append((x,['node','tests/'+x+'.cjs'],{}))
for x in zoom:jobs.append((x,['xvfb-run','-a','node','tests/'+x+'.cjs'],{}))
jobs.append(('development-zoom',['xvfb-run','-a','node','tests/development-browser.cjs'],{'UNBUILT_DEVELOPMENT_ZOOM':'2'}))
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as ex:
 for row in ex.map(lambda job:run(*job),jobs):results.append(row);(root/'existing-results.json').write_text(json.dumps(results,indent=2))
# These share a fixture port, and integration consumes the green-study browser export.
for job in [('ai-browser',['node','--experimental-strip-types','--no-warnings','tests/ai-browser.mjs'],{}),('ai-zoom',['xvfb-run','-a','node','--experimental-strip-types','--no-warnings','tests/ai-browser.mjs'],{'UNBUILT_AI_ZOOM':'2'}),('open-spaces-browser',['node','tests/open-spaces-integration.cjs'],{})]:
 if job[0]=='open-spaces-browser':job=('open-spaces-integration',job[1],{'UNBUILT_EVIDENCE_DIR':str(root/'open-spaces-browser')})
 results.append(run(*job));(root/'existing-results.json').write_text(json.dumps(results,indent=2))
