import type {ResidentialInputs,ResidentialLot,ResidentialWorkspace} from './residential.ts';
export function residentialStudySummary(w:ResidentialWorkspace):string {
  const s=w.accepted,r=s.result,unknown=r.issues.filter(i=>i.state==='unknown').length,failed=r.issues.filter(i=>i.state==='fail').length;
  const stage=s.inputs.phase==='site'||s.inputs.inputCommitments?'Residential input commitments':'Residential study';
  return `${stage}: ${r.counts.valid} screened valid lots · ${w.selected.length} shortlisted option${w.selected.length===1?'':'s'} · ${r.qualified?'qualifies under recorded checks':`${failed?`${failed} failed checks · `:''}${unknown} unresolved checks; not qualified`}`;
}
export function residentialLotLabels(i:ResidentialInputs,lot:ResidentialLot){
  const street=i.roads.find(r=>r.id===lot.roadId),group=i.groups.find(g=>g.id===lot.groupId),section=i.groups.filter(g=>g.roadId===lot.roadId).findIndex(g=>g.id===lot.groupId)+1;
  return {product:i.products.find(p=>p.id===lot.productId)?.name??'Missing product reference',street:street?.name??'Missing serving street',section:group?`${street?.name??'Street'} · section ${section} (${Math.round(group.from*100)}–${Math.round(group.to*100)}%)`:'Missing street section',reference:lot.id};
}
