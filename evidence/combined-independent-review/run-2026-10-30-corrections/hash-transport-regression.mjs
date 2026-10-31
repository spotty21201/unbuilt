// Expected-failing regression. Run alone; no product behavior is changed.
import assert from 'node:assert/strict';
import {starterProject} from '../../../src/projects.ts';
import {CAPABILITIES,snapshotHash,validateSnapshot} from '../../../src/snapshot.ts';
const state=starterProject(true,'Fictional boundary edit').state;
const snapshot={version:11,site:{...state.baseSpec,development:undefined,costAssumptions:undefined},entrance:state.entrance,green:state.green,greenLocked:true,lots:{},spec:state.spec,profileId:state.profileId,assumptions:{price:850e6,ceiling:850e6,owner:10e9,target:.15},provenance:{sample:'cedar',photo:false},capabilities:[...CAPABILITIES],selected:{kind:'site',id:'site'}};
const wire=JSON.parse(JSON.stringify(snapshot));
assert.equal(validateSnapshot(snapshot).ok,true);assert.equal(validateSnapshot(wire).ok,true);
console.log(JSON.stringify({clientHash:snapshotHash(snapshot,true),serverHash:snapshotHash(wire,true),undefinedFields:['site.development','site.costAssumptions']}));
assert.equal(snapshotHash(snapshot,true),snapshotHash(wire,true),'unchanged accepted snapshot must retain its binding across JSON transport');
