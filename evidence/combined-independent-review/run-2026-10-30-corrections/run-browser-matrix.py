import os,json,subprocess,time,concurrent.futures
from pathlib import Path
root=Path('/home/spotty/projects/unbuilt');out=Path(os.environ.get('UNBUILT_EVIDENCE_DIR',str(Path(__file__).resolve().parent/'regressions')));out.mkdir(exist_ok=True)
tests=sorted(p for p in (root/'tests').iterdir() if 'browser' in p.name or 'zoom' in p.name or p.name=='planner-feedback-fixes-storage.cjs')
def run(p,name=None,extra=None,force_headful=False,destination=None):
 name=name or p.stem;dest=destination or out/name;dest.mkdir(parents=True,exist_ok=True)
 env={**os.environ,'PLAYWRIGHT_MODULE':'/home/spotty/projects/studioos/node_modules/playwright','UNBUILT_EVIDENCE_DIR':str(dest),**(extra or {})}
 command=['node','--experimental-strip-types','--no-warnings',str(p)]
 if force_headful or (('headless:false' in p.read_text() or 'headless: false' in p.read_text()) and p.name not in ['ai-browser.mjs','development-browser.cjs']):command=['xvfb-run','-a',*command]
 start=time.monotonic()
 try:
  with (dest/(name+'.log')).open('w') as log:status=subprocess.run(command,cwd=root,env=env,stdout=log,stderr=subprocess.STDOUT,timeout=240).returncode
 except subprocess.TimeoutExpired:status=124
 result={'suite':name,'exit':status,'seconds':round(time.monotonic()-start,1),'log':str((dest/(name+'.log')).relative_to(root))};print(json.dumps(result),flush=True);return result
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:results=list(pool.map(run,tests))
results.append(run(root/'tests/open-spaces-integration.cjs',destination=out/'open-spaces-browser'))
results.append(run(root/'tests/ai-browser.mjs','ai-zoom',{'UNBUILT_AI_ZOOM':'2'},True))
results.append(run(root/'tests/development-browser.cjs','development-zoom',{'UNBUILT_DEVELOPMENT_ZOOM':'2'},True))
(out/'results.json').write_text(json.dumps(results,indent=2)+'\n');print('COMPLETE',sum(r['exit']==0 for r in results),'/',len(results),flush=True)
