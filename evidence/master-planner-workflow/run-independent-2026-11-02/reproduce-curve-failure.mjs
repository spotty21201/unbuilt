// Focused failing regression. Expected: a geometrically fitting mixed-radius loop calculates.
import fs from 'node:fs';import assert from 'node:assert/strict';import{calculateResidential}from '../../../src/residential.ts';
const {i}=JSON.parse(fs.readFileSync(new URL('technical-r4.json',import.meta.url)));
assert.doesNotThrow(()=>calculateResidential(i,'curve-regression'),'Mixed8/4/4m radius loop must calculate or return a planning conflict, without a polygon-clipping exception');
