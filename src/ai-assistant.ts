import {developmentFindings} from './development.ts';
import { lotKey } from './geometry.ts';
import { housingSummary } from './housing.ts';
import { polyArea, rectCorners } from './polygon.ts';
import { siteOpenSpaces, spaceArea } from './open-spaces.ts';
import { DEFAULT_COSTS, COST_LABELS, costErrors, type CostAssumptions } from './costs.ts';
import { designHeldReason, evaluateExperiment, type ExperimentDesign } from './experiments.ts';
import { DEFAULT_PLANNING } from './planning.ts';
import { snapshotHash, validateSnapshot, type ScenarioSnapshot } from './snapshot.ts';

export interface AIProposal { planHash:string; design:ExperimentDesign; costs:CostAssumptions; purpose:'design_yield'|'cost_sensitivity'|'owner_gap'; changes:string[] }
export interface AIFinding { id:string; text:string }
export type AIAnswer = { kind:'proposal'; proposal:AIProposal } | { kind:'explanation'; findings:AIFinding[] } | { kind:'clarification'; question:string } | { kind:'limitation'; text:string };
export const AI_LIMITS = {
  unsupported: 'This experiment tool can test generated circulation, frontage, lot depth and project costs. Use the existing editors for boundaries, streets, open spaces and individual homes.',
  evidence: 'The plan does not establish market prices, survey accuracy, legal compliance, drainage engineering or engineering suitability. These need external evidence.',
  ambiguous: 'Specify the design change or cost assumption to test. A goal alone does not establish which assumption should change.',
};
const record = (v:unknown): v is Record<string,unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const exactKeys = (v:unknown, allowed:string[]): v is Record<string,unknown> => record(v) && Object.keys(v).every(k=>allowed.includes(k));
export function acceptedDesign(s:ScenarioSnapshot):ExperimentDesign { return {...s.spec,lotDepth:s.site.planning?.lotDepth??DEFAULT_PLANNING.lotDepth}; }
export function assistantBaseline(raw:unknown) {
  const v=validateSnapshot(raw); if(!v.ok) throw Error(v.error);
  const s=v.snapshot, a=s.assumptions;
  if(a.price<=0 || a.price>1e12 || a.ceiling<=0 || a.ceiling>1e12 || a.owner<0 || a.owner>1e15 || a.target<0 || a.target>=1) throw Error('Complete valid selling price, ceiling, owner and target assumptions first.');
  const site={...s.site,entrance:s.entrance,green:s.green};
  const result=evaluateExperiment(site,s.spec,s.lots,acceptedDesign(s),site.costAssumptions??DEFAULT_COSTS,a.price,a.owner,a.target);
  if(Object.keys(s.lots).some(k=>!result.layout.parcels.some(p=>lotKey(p)===k))) throw Error('A manual lot reshape no longer belongs to this plan. Resolve it before asking AI.');
  if(result.errors.length || !result.economics) throw Error(result.errors[0]??'Generate a valid plan first.');
  const sel=s.selected;
  if(sel) {
    const ids=sel.id.startsWith('lots-')?sel.id.slice(5).split('-'):sel.id.startsWith('lot-')?[sel.id.slice(4)]:[];
    const lotsValid=ids.length>0 && new Set(ids).size===ids.length && ids.every(id=>/^(0|[1-9]\d*)$/.test(id) && Number(id)<result.layout.parcels.length);
    const valid=sel.kind==='site'?sel.id==='site':sel.kind==='entrance'?sel.id==='entrance':sel.kind==='circulation'?sel.id==='circulation':sel.kind==='homes'||sel.kind==='lot'?sel.id==='homes'||lotsValid:sel.kind==='green'?(s.site.planning?.openSpaces!==undefined?sel.id==='all-open-spaces'||s.site.planning.openSpaces.some(g=>g.id===sel.id):sel.id==='grove-a'):false;
    if(!valid) throw Error('Selection no longer exists. Select the intended object again.');
  }
  return {snapshot:s,site,result};
}
const display=(v:number,unit:string)=>`${unit==='Rp'?'Rp':''}${v.toLocaleString('en-US',{maximumFractionDigits:2})}${unit==='m²'?' m²':''}`;
export function measuredFindings(base:NonNullable<ReturnType<typeof evaluateExperiment>['economics']>,trial?:NonNullable<ReturnType<typeof evaluateExperiment>['economics']>,designOnly?:NonNullable<ReturnType<typeof evaluateExperiment>['economics']>):AIFinding[] {
  const rows:[string,string,number,number|undefined,string][]=[
    ['homes','Occupied homes',base.quantities.n,trial?.quantities.n,'count'],['built','Built area',base.builtArea,trial?.builtArea,'m²'],['streets','Street surface',base.quantities.roadArea,trial?.quantities.roadArea,'m²'],['green','Designed green',base.quantities.greenArea,trial?.quantities.greenArea,'m²'],['revenue','Revenue at the held selling price',base.finance.revenue,trial?.finance.revenue,'Rp'],['costs','Non-land costs',base.costNonLand,trial?.costNonLand,'Rp'],['allowance','Land allowance',base.finance.landAllowance,trial?.finance.landAllowance,'Rp'],['gap','Owner shortfall (+) / headroom (−)',base.finance.ownerGap,trial?.finance.ownerGap,'Rp'],['surplus','Surplus after owner payment',base.finance.surplus,trial?.finance.surplus,'Rp']];
  const findings=rows.map(([id,label,a,b,unit])=>({id,text:`${label}: ${display(a,unit)}${b===undefined?'':` → ${display(b,unit)} (change ${display(b-a,unit)})`}.`}));
  if(trial&&designOnly) findings.push({id:'attribution',text:`Land allowance effects, applied sequentially: design at accepted costs ${display(designOnly.finance.landAllowance-base.finance.landAllowance,'Rp')}; then cost assumptions on that design ${display(trial.finance.landAllowance-designOnly.finance.landAllowance,'Rp')}.`});
  findings.push({id:'limits',text:'Quantities are measured by the planning engine. Costs, selling price, owner benchmark and target are assumptions. No optimum, market value or verified feasibility is established.'});
  return findings;
}
export function modelPlanningContext(s:ScenarioSnapshot,baseline:ReturnType<typeof assistantBaseline>['result']) {
  const findings=[...measuredFindings(baseline.economics!),...developmentFindings({...s.site,entrance:s.entrance,green:s.green},baseline.layout,baseline.edits,baseline.economics,s.assumptions.price,s.assumptions.owner)];
  const selected=s.selected;
  if(selected?.kind==='homes'||selected?.kind==='lot') {
    const ids=selected.id==='homes'?baseline.layout.parcels.map((_,i)=>i):selected.id.startsWith('lots-')?selected.id.slice(5).split('-').map(Number):[Number(selected.id.slice(4))];
    const parcels=ids.map(i=>baseline.layout.parcels[i]),housing=housingSummary(s.site,parcels);
    const area=ids.reduce((sum,i)=>sum+polyArea(baseline.edits.get(i)??rectCorners(baseline.layout.parcels[i])),0);
    findings.push({id:'selection',text:`Selected lots: ${ids.length}; lot area ${display(area,'m²')}; occupied homes ${housing.homes}; built area ${display(housing.builtArea,'m²')}. Project finances are whole-plan figures; no sale value is attributed to an individual lot.`});
  } else if(selected?.kind==='green') {
    const spaces=siteOpenSpaces({...s.site,green:s.green}),chosen=selected.id==='all-open-spaces'||s.site.planning?.openSpaces===undefined?spaces:spaces.filter(g=>g.id===selected.id);
    findings.push({id:'selection',text:`Selected open space: ${display(spaceArea(chosen),'m²')}. Its outline and commitments stay held during experiments.`});
  } else if(selected?.kind==='entrance') findings.push({id:'selection',text:`Selected entrance width: ${s.entrance.width} m; offset: ${s.entrance.offset} m. Experiments hold its position and width; legal access is not verified.`});
  // Only computed facts and supported inputs leave the server, never source notes/media or saved schemes.
  return {design:acceptedDesign(s),costs:s.site.costAssumptions??DEFAULT_COSTS,assumptions:s.assumptions,profileId:s.profileId,selected,greenLocked:s.greenLocked,designHeldReason:designHeldReason({...s.site,entrance:s.entrance,green:s.green},s.lots),manualStreets:!!s.site.planning?.streetNetwork,findings,costUnits:'Base Rp and fractions, never millions or percentages',scope:'Whole accepted plan; selected object is context only'};
}
export function validateModelChoice(name:unknown,args:unknown,s:ScenarioSnapshot,catalog:AIFinding[]):AIAnswer {
  if(name==='clarify_request' && exactKeys(args,['question']) && typeof args.question==='string' && args.question.trim() && args.question.length<=500) return {kind:'clarification',question:args.question};
  if(name==='explain_limit' && exactKeys(args,['reason']) && typeof args.reason==='string' && Object.hasOwn(AI_LIMITS,args.reason)) return {kind:'limitation',text:AI_LIMITS[args.reason as keyof typeof AI_LIMITS]};
  if(name==='explain_measurements' && exactKeys(args,['factIds']) && Array.isArray(args.factIds) && args.factIds.length>0 && args.factIds.length<=12 && args.factIds.length<=catalog.length && new Set(args.factIds).size===args.factIds.length && args.factIds.every(id=>typeof id==='string'&&catalog.some(f=>f.id===id))) return {kind:'explanation',findings:args.factIds.map(id=>catalog.find(f=>f.id===id)!)};
  if(name!=='propose_experiment' || !exactKeys(args,['purpose','design','costs']) || typeof args.purpose!=='string' || !['design_yield','cost_sensitivity','owner_gap'].includes(args.purpose) || !exactKeys(args.design,['family','frontage','lotDepth']) || !exactKeys(args.costs,Object.keys(DEFAULT_COSTS))) throw Error('AI returned an unsupported tool or invalid arguments. No experiment was accepted.');
  const current=acceptedDesign(s),design={...current,...args.design} as ExperimentDesign,costs={...(s.site.costAssumptions??DEFAULT_COSTS),...args.costs} as CostAssumptions;
  if(!['spine','loop'].includes(design.family) || typeof design.frontage!=='number' || !Number.isFinite(design.frontage) || (design.frontage!==current.frontage&&(design.frontage<6||design.frontage>30)) || typeof design.lotDepth!=='number' || !Number.isFinite(design.lotDepth) || design.lotDepth<12 || design.lotDepth>40) throw Error('AI proposed unsupported design dimensions.');
  const errors=costErrors(costs); if(errors.length) throw Error(errors[0]);
  if(costs.sellFraction+s.assumptions.target>=1) throw Error('Selling costs plus target must be below 100%.');
  const changes:string[]=[];
  for(const k of ['family','frontage','lotDepth'] as const) if(current[k]!==design[k]) changes.push(`${{family:"Circulation",frontage:"Lot frontage",lotDepth:"Lot depth"}[k]}: ${current[k]} → ${design[k]}${k==='family'?'':' m'}`);
  if(changes.length && designHeldReason({...s.site,entrance:s.entrance,green:s.green},s.lots)) throw Error(designHeldReason({...s.site,entrance:s.entrance,green:s.green},s.lots)!);
  if(s.site.planning?.streetNetwork && design.family!==current.family) throw Error('Manual street routing is held. Edit streets separately.');
  for(const k of Object.keys(DEFAULT_COSTS) as (keyof CostAssumptions)[]) if(costs[k] !== (s.site.costAssumptions??DEFAULT_COSTS)[k]) changes.push(`${COST_LABELS[k]}: ${k.endsWith('Fraction')?`${((s.site.costAssumptions??DEFAULT_COSTS)[k]*100).toLocaleString('en-US',{maximumFractionDigits:8})}% → ${(costs[k]*100).toLocaleString('en-US',{maximumFractionDigits:8})}%`:`${display((s.site.costAssumptions??DEFAULT_COSTS)[k],'Rp')} → ${display(costs[k],'Rp')}${k.endsWith('PerM2')?'/m²':''}`}`);
  if(!changes.length) throw Error('AI proposed no change. Specify a different trial input.');
  return {kind:'proposal',proposal:{planHash:snapshotHash(s,true),design,costs,purpose:args.purpose as AIProposal['purpose'],changes}};
}
export function measureProposal(raw:unknown,proposal:unknown) {
  const {snapshot:s,site,result:baseline}=assistantBaseline(raw);
  if(!exactKeys(proposal,['planHash','design','costs','purpose','changes']) || proposal.planHash!==snapshotHash(s,true)) throw Error('This proposal belongs to an older plan. Ask again.');
  const checked=validateModelChoice('propose_experiment',{design:proposal.design,costs:proposal.costs,purpose:proposal.purpose},s,[]);
  if(checked.kind!=='proposal') throw Error('Invalid proposal.');
  const a=s.assumptions,trial=evaluateExperiment(site,s.spec,s.lots,checked.proposal.design,checked.proposal.costs,a.price,a.owner,a.target);
  if(trial.errors.length || !trial.economics) throw Error(trial.errors[0]??'Trial unavailable. Accepted plan retained.');
  return {proposal:checked.proposal,findings:[...measuredFindings(baseline.economics!,trial.economics,trial.designEconomics!),...developmentFindings(trial.site,trial.layout,trial.edits,trial.economics,a.price,a.owner).map(f=>({id:`trial-${f.id}`,text:`Trial · ${f.text}`}))],planHash:snapshotHash(s,true)};
}
