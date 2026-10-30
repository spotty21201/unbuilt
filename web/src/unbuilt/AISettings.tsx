import { useEffect, useRef, useState } from 'react';
import { serverBase } from './ui';
type Route = {label:string;endpoint:string;model:string;hasKey:boolean;key:string;clearKey:boolean};
type Settings = {revision:number;active:'primary'|'alternate';routes:Record<'primary'|'alternate',Route>};
export default function AISettings({onClose}:{onClose:()=>void}) {
  const dialog=useRef<HTMLDialogElement>(null);
  const [token,setToken]=useState(''),[settings,setSettings]=useState<Settings|null>(null),[note,setNote]=useState(''),[busy,setBusy]=useState(false),[dirty,setDirty]=useState(false);
  const controller=useRef<AbortController|null>(null);
  useEffect(()=>{const el=dialog.current!,opener=document.activeElement as HTMLElement|null;el.showModal();return()=>{controller.current?.abort();el.close();if(opener?.isConnected)opener.focus();};},[]);
  const close=()=>{if(dirty&&!window.confirm('Discard unsaved AI settings?'))return;setToken('');setSettings(null);onClose();};
  const request=async(path:string,body?:unknown)=>{
    controller.current?.abort();const ctrl=new AbortController();controller.current=ctrl;
    const timer=setTimeout(()=>ctrl.abort(),25_000);
    try {
      const res=await fetch(`${serverBase()}/api/ai/${path}`,{method:body===undefined?'GET':'POST',headers:{authorization:`Bearer ${token}`,...(body===undefined?{}:{'content-type':'application/json'})},body:body===undefined?undefined:JSON.stringify(body),signal:ctrl.signal});
      const data=await res.json();if(!res.ok)throw Error(data.error??'Request failed.');return data;
    }finally{clearTimeout(timer);}
  };
  const load=async()=>{setBusy(true);setNote('');try{const data=await request('settings');setSettings({...data,routes:Object.fromEntries(Object.entries(data.routes as Record<string,Route>).map(([id,r])=>[id,{...r,key:'',clearKey:false}]))});setDirty(false);setNote('Settings loaded. Stored keys are never sent back to this browser.');}catch(e){setNote(e instanceof Error?e.message:'Unable to load settings.');}finally{setBusy(false);}};
  const save=async()=>{if(!settings)return;setBusy(true);setNote('');try{
    const body={...settings,routes:Object.fromEntries(Object.entries(settings.routes).map(([id,{hasKey,...r}])=>{void hasKey;return[id,r];}))};
    const data=await request('settings',body);setSettings({...data,routes:Object.fromEntries(Object.entries(data.routes as Record<string,Route>).map(([id,r])=>[id,{...r,key:'',clearKey:false}]))});setDirty(false);setNote('Routing saved on the server. Test the active connection before using it.');window.dispatchEvent(new Event('unbuilt-ai-settings'));
  }catch(e){setNote(e instanceof Error?e.message:'Settings were not saved.');}finally{setBusy(false);}};
  const test=async()=>{setBusy(true);setNote('Testing a small tool call…');try{await request('test',{});setNote('Active connection returned a valid tool response. This does not verify planning suitability.');window.dispatchEvent(new Event('unbuilt-ai-settings'));}catch(e){setNote(e instanceof Error?e.message:'Connection test failed.');window.dispatchEvent(new Event('unbuilt-ai-settings'));}finally{setBusy(false);}};
  const edit=(id:'primary'|'alternate',patch:Partial<Route>)=>{setSettings(s=>s?{...s,routes:{...s.routes,[id]:{...s.routes[id],...patch}}}:s);setDirty(true);};
  return <dialog ref={dialog} className="ai-settings-dialog" aria-labelledby="ai-settings-title" onCancel={e=>{e.preventDefault();close();}}>
    <header><h2 id="ai-settings-title">AI settings</h2><button type="button" onClick={close}>Close AI settings</button></header>
    <p>Administrator access controls the server’s primary and alternate connections. Requests use the active connection; switching is explicit. Keys stay on this server and are excluded from projects and exports.</p>
    <form onSubmit={e=>{e.preventDefault();void load();}}><label>Administrator token<input type="password" autoComplete="off" value={token} onChange={e=>setToken(e.target.value)} maxLength={8192}/></label><button type="submit" disabled={busy||token.length<24}>Unlock settings</button></form>
    <p className="note">The server administrator must configure an access token before settings can be changed. This browser keeps it only while this window is open.</p>
    {settings&&<><label htmlFor="ai-active-connection">Active connection</label><select id="ai-active-connection" value={settings.active} disabled={busy} onChange={e=>{setSettings({...settings,active:e.target.value as Settings['active']});setDirty(true);}}><option value="primary">Primary</option><option value="alternate">Alternate</option></select>
      {(['primary','alternate'] as const).map(id=><fieldset key={id} disabled={busy}><legend>{id==='primary'?'Primary connection':'Alternate connection'}</legend>
        <label>Connection name<input value={settings.routes[id].label} maxLength={60} onChange={e=>edit(id,{label:e.target.value})}/></label>
        <label>Chat completion endpoint<input type="url" placeholder="https://…/v1/chat/completions" value={settings.routes[id].endpoint} maxLength={2000} onChange={e=>edit(id,{endpoint:e.target.value})}/></label>
        <label>Model identifier<input value={settings.routes[id].model} maxLength={200} onChange={e=>edit(id,{model:e.target.value})}/></label>
        <label>New API key · blank keeps stored key<input type="password" autoComplete="new-password" value={settings.routes[id].key} maxLength={8192} onChange={e=>edit(id,{key:e.target.value,clearKey:false})}/></label>
        <p>{settings.routes[id].hasKey?'A key is stored on the server.':'No stored key.'}</p>
        <label className="check"><input type="checkbox" checked={settings.routes[id].clearKey} onChange={e=>edit(id,{clearKey:e.target.checked,key:''})}/>Remove stored key on Save</label>
      </fieldset>)}<footer><button type="button" className="primary" onClick={()=>void save()} disabled={busy||!dirty}>Save routing settings</button><button type="button" onClick={()=>void test()} disabled={busy||dirty}>Test active connection</button></footer></>}
    <p role="status">{note}</p>
  </dialog>;
}
