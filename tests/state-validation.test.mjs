import test from 'node:test';import assert from 'node:assert/strict';import {validState} from '../lib/state-validation.mjs';
const state=()=>({period:'2026-10-10',equal:0,minimum:1,members:[{id:'m',name:'민초캣',t:100,carry:-0.5,active:true,pools:{race:0.1}}],items:[{id:'i',name:'상자',kind:'market',qty:2,price:200}],history:[]});
test('valid fractional carry and integer inventory survive server validation',()=>assert.equal(validState(state()),true));
test('negative or oversized inventory and duplicate IDs are rejected',()=>{for(const qty of [-1,0.5,100001]){const s=state();s.items[0].qty=qty;assert.equal(validState(s),false)}const s=state();s.members.push({...s.members[0]});assert.equal(validState(s),false)});
test('non-finite balances and malformed identity cannot corrupt stored state',()=>{const s=state();s.members[0].carry=Infinity;assert.equal(validState(s),false);assert.equal(validState({...state(),equal:101}),false);assert.equal(validState({...state(),members:[null]}),false)});
