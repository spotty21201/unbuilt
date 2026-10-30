import { useEffect, useId, useRef, useState } from 'react';
import type { AIAnswer, AIProposal, AIFinding } from '../../../src/ai-assistant';
import { snapshotHash, type ScenarioSnapshot } from '../../../src/snapshot';
import { serverBase } from './ui';
import AISettings from './AISettings';
interface Props {getSnapshot:()=>ScenarioSnapshot;snapshotOk:boolean;onReviewExperiment:(proposal:AIProposal)=>void}
export default function AIInvestigation({getSnapshot,snapshotOk,onReviewExperiment}:Props) {
  const [text,setText]=useState(''),[answer,setAnswer]=useState<AIAnswer|null>(null),[findings,setFindings]=useState<AIFinding[]|null>(null),[explanation,setExplanation]=useState<AIFinding[]|null>(null),[note,setNote]=useState(''),[busy,setBusy]=useState(false),[settingsOpen,setSettingsOpen]=useState(false),[connection,setConnection]=useState('Checking AI connection…');
  const intentionId=useId();
  const inflight=useRef<AbortController|null>(null),ticket=useRef(0);
  useEffect(()=>{
    let health:AbortController|null=null,alive=true;
    const refresh=()=>{
      ticket.current++;inflight.current?.abort();setBusy(false);setAnswer(null);setFindings(null);setExplanation(null);
      health?.abort();const ctrl=new AbortController();health=ctrl;const timeout=setTimeout(()=>ctrl.abort(),2500);
      fetch(`${serverBase()}/api/health`,{signal:ctrl.signal}).then(r=>r.ok?r.json():Promise.reject()).then(h=>{if(alive&&!ctrl.signal.aborted)setConnection(!h.ai?.configured?'AI not configured':h.ai.status==='verified'?'AI connection verified':h.ai.status==='error'?'AI connection needs attention':'AI configured · connection untested');}).catch(()=>{if(alive&&health===ctrl)setConnection('AI server unavailable');}).finally(()=>clearTimeout(timeout));
    };refresh();window.addEventListener('unbuilt-ai-settings',refresh);
    const pending=inflight;
    const abortPending=()=>pending.current?.abort();
    // This ref is a request counter, not a DOM node; incrementing it rejects late replies.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
    return()=>{alive=false;health?.abort();ticket.current++;abortPending();window.removeEventListener('unbuilt-ai-settings',refresh);};
  },[]);
  const cancel=()=>{ticket.current++;inflight.current?.abort();setBusy(false);setNote('Request cancelled. Accepted plan retained.');};
  const execute=async(action:'ask'|'measure'|'explain-trial')=>{
    inflight.current?.abort();const id=++ticket.current,ctrl=new AbortController();inflight.current=ctrl;
    const snapshot=getSnapshot(),hash=snapshotHash(snapshot,true),requestId=String(id);
    const proposal=answer?.kind==='proposal'?answer.proposal:null;
    if(action==='ask'){setAnswer(null);setFindings(null);setExplanation(null);}setNote('');setBusy(true);
    const timer=setTimeout(()=>ctrl.abort(),25_000);
    try {
      const response=await fetch(`${serverBase()}/api/ai/${action}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(action==='measure'?{snapshot,proposal}:{text,snapshot,requestId,...(action==='explain-trial'?{proposal}:{})}),signal:ctrl.signal});
      const data=await response.json();if(ticket.current!==id)return;
      if(!response.ok)throw Error(data.error??'AI request failed.');
      if(data.planHash!==hash || snapshotHash(getSnapshot(),true)!==hash || (action!=='measure'&&data.requestId!==requestId)) throw Error('Plan changed while the request was running. Ask again.');
      if(action==='ask'){setAnswer(data.answer);setConnection('AI connection verified');window.dispatchEvent(new Event('unbuilt-ai-status'));setNote('AI interpretation · checked against supported tools. No accepted inputs changed.');}
      else if(action==='explain-trial'){if(data.answer?.kind!=='explanation')throw Error('No checked explanation returned.');setExplanation(data.answer.findings);setNote('AI selected findings from the measured experiment; figures come from the planning engine.');}
      else {setFindings(data.findings);setNote('Measured by the planning engine. The trial remains unapplied.');}
    }catch(e){if(ticket.current===id){if(action!=='measure'&&!ctrl.signal.aborted){setConnection('AI request failed · local tools available');window.dispatchEvent(new Event('unbuilt-ai-status'));}setNote(ctrl.signal.aborted?'Request stopped or timed out. Retry when ready. Accepted plan retained.':e instanceof Error?e.message:'Request failed. Local measured tools remain available.');}}
    finally{clearTimeout(timer);if(ticket.current===id)setBusy(false);}
  };
  return <section className="ai-investigation" aria-label="AI investigation">
    <div className="cardrow"><h3>AI investigation</h3><button type="button" onClick={()=>{cancel();setSettingsOpen(true);}}>AI settings</button></div><p className="note">{connection}</p><p>Context: {getSnapshot().selected ? `${getSnapshot().selected!.kind} · ${getSnapshot().selected!.id}` : 'whole accepted plan'}. Only supported inputs and measured facts are sent to the active connection, together with your intention. Source notes, media and saved alternatives stay out.</p>
    <label htmlFor={intentionId}>Intention for AI</label><textarea id={intentionId} rows={3} maxLength={4000} value={text} onChange={e=>{cancel();setText(e.target.value);setAnswer(null);setFindings(null);setExplanation(null);setNote('');}} placeholder="e.g. Test frontage at 11 m while holding costs, or explain the owner shortfall."/>
    <button type="button" className="primary" disabled={busy||!text.trim()||!snapshotOk} onClick={()=>void execute('ask')}>Ask AI</button>{busy&&<button type="button" onClick={cancel}>Cancel AI request</button>}
    {!snapshotOk&&<p>Apply or Cancel pending edits and complete assumptions before asking AI.</p>}
    <p role="status">{busy?'Waiting for a checked response…':note}</p>
    {answer?.kind==='clarification'&&<div><h4>AI question · clarify before testing</h4><p>{answer.question}</p><p>Revise the intention above and Ask AI again.</p></div>}
    {answer?.kind==='limitation'&&<p>{answer.text}</p>}
    {answer?.kind==='explanation'&&<><h4>AI-selected measured findings</h4><ul>{answer.findings.map(f=><li key={f.id}>{f.text}</li>)}</ul></>}
    {answer?.kind==='proposal'&&<div><h4>Proposed experiment · review inputs</h4><p>Untested hypothesis: {answer.proposal.purpose==='design_yield'?'test how generated layout inputs affect home yield.':answer.proposal.purpose==='owner_gap'?'test a change against the modeled owner outcome.':'measure sensitivity to a declared cost assumption.'}</p><ul>{answer.proposal.changes.map(c=><li key={c}>{c}</li>)}</ul><p>This hypothetical trial affects the whole plan. Boundary, entrance, open spaces, manual work and shared selling assumptions are held. Cost changes are assumptions, not quotations.</p>
      <button type="button" disabled={busy||!!findings} onClick={()=>void execute('measure')}>Run reviewed experiment</button><button type="button" onClick={()=>{cancel();setAnswer(null);setFindings(null);setExplanation(null);setNote('AI proposal discarded. Accepted plan retained.');}}>Discard AI proposal</button>{findings&&<><h4>Measured experiment · unapplied</h4><ul>{findings.map(f=><li key={f.id}>{f.text}</li>)}</ul><button type="button" disabled={busy} onClick={()=>void execute('explain-trial')}>Explain measured result</button>{explanation&&<><h4>AI-selected experiment findings</h4><ul>{explanation.map(f=><li key={f.id}>{f.text}</li>)}</ul></>}<button type="button" className="primary" disabled={busy||!snapshotOk} onClick={()=>onReviewExperiment(answer.proposal)}>Review on plan</button></>}
    </div>}
    {settingsOpen&&<AISettings onClose={()=>setSettingsOpen(false)}/>}
  </section>;
}
