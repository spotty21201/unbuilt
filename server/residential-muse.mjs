import {readFileSync} from 'node:fs';
import {modelChoice} from './ai-model.mjs';
import {markConnection} from './ai-config.mjs';
import {museBaseline,museContext,validateMuseChoice} from '../src/residential-muse.ts';
const instructions=readFileSync(new URL('../docs/MUSE-MASTER-PLANNER.md',import.meta.url),'utf8');
const tool=(name,description,properties,required=Object.keys(properties))=>({type:'function',function:{name,description,parameters:{type:'object',additionalProperties:false,properties,required}}});
const id={type:'string',maxLength:200},delta={type:'number',minimum:-20,maximum:20};
export const museTools=[
 tool('explain_plan','Give one concise qualitative planning assessment plus up to three measured fact IDs. Use no digits or quantities in insight; all numbers come from facts.',{insight:{type:'string',maxLength:320},factIds:{type:'array',items:{type:'string',enum:['yield','mix','roads','land','residual','cost','constraints','unknowns','stage','locks']},minItems:1,maxItems:3}}),
 tool('clarify_request','Ask one short question for missing intent, ambiguous object names, unsupported edits or professional evidence.',{question:{type:'string',maxLength:400}}),
 tool('test_alternatives','Run bounded geometry trials for an explicitly requested improvement; keep entrance, protection and all spaces fixed.',{goal:{type:'string',enum:['more-lots','less-road','better-mix']}}),
 tool('prepare_layout','Construct a new connected layout from site commitments. Null end asks the planner to choose if needed. Do not assume an end treatment.',{end:{type:['string','null'],enum:[null,'dead-end','cul-de-sac']}}),
 tool('fill_residual','Test existing permitted products in actual residual land; never invent a new product.',{}),
 tool('move_entrance','Move the unlocked primary gate to a user-specified offset in metres along its current boundary edge. Permission and corridor checks remain required.',{offset:{type:'number',minimum:0,maximum:200000}}),
 tool('shift_road','Propose an explicitly specified displacement of an unlocked street; coupled junctions/lots regenerate and gate/locked nodes stay pinned.',{roadId:id,dx:delta,dy:delta}),
 tool('assign_product','Assign an existing product to a whole street section and any overlapping opposing section. Locks and mandatory mix remain enforced.',{groupId:id,productId:id}),
 tool('reshape_space','Move a specified zero-based vertex of an unlocked flexible space. Minimum, access and location commitments remain required.',{spaceId:id,vertex:{type:'integer',minimum:0,maximum:500},dx:delta,dy:delta}),
];
export async function handleResidentialMuse(body,signal,send,res){
 if(typeof body?.text!=='string'||!body.text.trim()||body.text.length>4000||typeof body.requestId!=='string'||body.requestId.length>100||typeof body.selected!=='string'||body.selected.length>300)throw Error('Enter a planning request of 1–4000 characters.');
 if(body.conversation!==undefined&&(!Array.isArray(body.conversation)||body.conversation.length>4||body.conversation.some(m=>!m||typeof m.request!=='string'||m.request.length>500||typeof m.response!=='string'||m.response.length>500)))throw Error('Conversation is too long. Start a new request.');
 const base=museBaseline(body.inputs),context=museContext(base,body.selected),choice=await modelChoice([{role:'system',content:instructions},{role:'user',content:JSON.stringify({request:body.text,conversation:body.conversation??[],context})}],signal,museTools);
 let answer;try{answer=validateMuseChoice(choice.name,choice.args,base);}catch(e){markConnection(choice.revision,'error');throw e;}
 markConnection(choice.revision,'verified');send(res,200,{requestId:body.requestId,answer,source:'ai-tool-call'});
}
