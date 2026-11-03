import {useEffect,useState} from 'react';
import type {ResidentialInputs,ResidentialScenario} from '../../../src/residential';
export function residentialCalculationWorker(){return new Worker(new URL('./residential.worker.ts',import.meta.url),{type:'module'});}
export default function useResidentialPreview(inputs:ResidentialInputs,id:string,name:string,parents?:string[],assumptions?:string){
  const key=JSON.stringify([inputs,id,name,parents,assumptions]),[response,setResponse]=useState<{key:string;scenario:ResidentialScenario|null;error:string}>({key:'',scenario:null,error:''});
  useEffect(()=>{const worker=residentialCalculationWorker(),timer=setTimeout(()=>worker.postMessage({kind:'calculate',inputs,id,name}),60);worker.onmessage=e=>{const m=e.data;setResponse({key,scenario:m.ok?{...m.value,...(parents?{parents}:{}),...(assumptions?{assumptions}:{})}:null,error:m.ok?'':m.error});};worker.onerror=()=>setResponse({key,scenario:null,error:'Calculation could not finish. Accepted geometry is preserved; adjust the preview or cancel.'});return ()=>{clearTimeout(timer);worker.terminate();};},[key,inputs,id,name,parents,assumptions]);
  return response.key===key?{...response,pending:false}:{scenario:null,error:'',pending:true};
}
