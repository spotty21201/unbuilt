import {executeMuseAction,type MuseAction} from '../../../src/residential-muse';
import {geometryRecoveryMessage} from '../../../src/geometry-errors';
import {buildResidentialScenario,searchResidential,type ResidentialInputs,type ResidentialScenario} from '../../../src/residential';
import {prepareResidential,type EndTreatment} from '../../../src/prepare-residential';
self.onmessage=(event:MessageEvent<{kind:'calculate';inputs:ResidentialInputs;id:string;name:string}|{kind:'search';base:ResidentialScenario;allocationsOnly:boolean}|{kind:'prepare';inputs:ResidentialInputs;endTreatment?:EndTreatment}|{kind:'muse';inputs:ResidentialInputs;action:MuseAction}>)=>{
  try{const m=event.data;self.postMessage({ok:true,value:m.kind==='muse'?executeMuseAction(m.inputs,m.action):m.kind==='prepare'?prepareResidential(m.inputs,m.endTreatment):m.kind==='calculate'?buildResidentialScenario(m.inputs,m.id,m.name):searchResidential(m.base,m.allocationsOnly)});}catch(error){self.postMessage({ok:false,error:geometryRecoveryMessage(error)});}
};
