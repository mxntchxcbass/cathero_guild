import {test} from 'node:test';
import assert from 'node:assert/strict';
import {evaluateRewards} from '../public/expected-value.mjs';
import {applyMarketPrices} from '../public/market-core.mjs';
import {matchesItem} from '../public/item-attributes.mjs';
import {allocate} from '../public/guild-core.mjs';
const catalog=[{item_id:'ticket',item_name:'소환권',unit_price:'50',observed_at:'2026-10-09T00:00:00Z',attributes:{type:'잡화'}}];
const reward=(extra={})=>({name:'소환권',qty:2,chance:25,price:50,catalogId:'ticket',group:'1',guaranteed:false,...extra});
const recipe={mode:'random',rewards:[reward(),reward({name:'없음',chance:75,price:0,catalogId:''}),reward({name:'확정 재화',qty:5,price:10,catalogId:'',guaranteed:true,chance:0})]};
test('probability × quantity × current price plus guaranteed rewards',()=>{
 const e=evaluateRewards(recipe,catalog);assert.equal(e.price,75);assert.equal(e.guaranteed,50);assert.equal(e.optional,25);
 assert.equal(evaluateRewards(recipe,[{...catalog[0],unit_price:'100'}]).price,100);
});
test('independent draws and selectable rewards use their own groups',()=>{
 const multiple={...recipe,rewards:[...recipe.rewards,reward({group:'2',chance:100,qty:1})]};assert.equal(evaluateRewards(multiple,catalog).price,125);
 assert.equal(evaluateRewards({mode:'choice',rewards:[reward({price:100,catalogId:'',qty:1}),reward({price:20,catalogId:'',qty:2}),reward({group:'2',price:10,catalogId:'',qty:3})]}).price,130);
});
test('invalid or missing evidence never silently becomes zero',()=>{
 assert.throws(()=>evaluateRewards({mode:'random',rewards:[reward()]},catalog),/100%/);
 assert.throws(()=>evaluateRewards({mode:'random',rewards:[reward({chance:100,catalogId:'',price:null})]}),/단가/);
 assert.throws(()=>evaluateRewards(recipe,[]),/찾을 수/);
 assert.throws(()=>evaluateRewards({mode:'random',rewards:[reward({chance:100,qty:0})]},catalog));
});
test('price link survives kind change, reload and refresh without hiding the item',()=>{
 const item={id:'box',name:'행사 상자',kind:'market',qty:3,price:0,catalogId:'ticket',attributes:{type:'장비',grade:'희귀'}};
 let resolved=applyMarketPrices([item],catalog)[0];assert.equal(resolved.name,item.name);assert.deepEqual(resolved.attributes,item.attributes);assert.equal(matchesItem(resolved,{q:'행사',type:'장비'}),true);assert.equal(resolved.price,50);
 resolved=applyMarketPrices(JSON.parse(JSON.stringify([{...resolved,kind:'pool'}])),catalog)[0];assert.equal(resolved.catalogId,'ticket');assert.equal(resolved.qty,3);assert.equal(resolved.price,50);
 resolved=applyMarketPrices([{...resolved,kind:'market'}],[{...catalog[0],unit_price:'70'}])[0];assert.equal(resolved.price,70);assert.equal(resolved.name,item.name);
});
test('expected recipe and links survive JSON persistence; allocation and historical snapshots stay correct',()=>{
 const item={id:'box',name:'상자',basis:'equal',kind:'market',qty:4,price:0,valuation:'expected',rewardRecipe:recipe,catalogId:'inactive-link'};
 const items=applyMarketPrices(JSON.parse(JSON.stringify([item])),catalog);assert.equal(items[0].price,75);assert.equal(items[0].rewardRecipe.rewards[0].catalogId,'ticket');
 const state={members:[{id:'m',name:'길드원',active:true,t:100,carry:0,pools:{}}],items,minimum:1,equal:0,period:'2026-10-09'};
 const plan=allocate(state);assert.equal(plan.value,300);assert.equal(plan.rows[0].paid,300);assert.equal(plan.rows[0].qty.box,4);
 const snapshot=structuredClone(items);assert.equal(applyMarketPrices(items,[{...catalog[0],unit_price:'100'}])[0].price,100);assert.equal(snapshot[0].price,75);assert.equal(snapshot[0].valueEvaluation.rewards[0].price,50);
});
test('photographed armor odds sum to 100 and estimated prices follow live anchors',async()=>{
 const {photoArmorRecipe}=await import('../public/armor-rewards.mjs');
 const c=['장갑','모자','목도리','신발'].flatMap(part=>[{item_id:'a'+part,item_name:'초보자 '+part,unit_price:100},{item_id:'b'+part,item_name:'여행자 '+part,unit_price:500}]);
 const r=photoArmorRecipe(c);assert.equal(r.rewards.length,20);assert.ok(Math.abs(r.rewards.reduce((a,x)=>a+x.chance,0)-100)<1e-8);
 const e=evaluateRewards(r,c);assert.equal(e.rewards.find(x=>x.name==='붉은바다 장갑').price,62500);
 const real=evaluateRewards(r,[...c,{item_id:'real',item_name:'하늘빛 장갑',unit_price:1000}]);assert.equal(real.rewards.find(x=>x.name==='하늘빛 장갑').price,1000);
});
test('common box recipe odds, currency conversion and faction-specific summon values',async()=>{
 const {photoBoxRecipe}=await import('../public/box-rewards.mjs');
 const values={장갑:[111,698],모자:[129,704],목도리:[110,700],신발:[125,715]};
 const c=Object.entries(values).flatMap(([part,[a,b]])=>[{item_id:'a'+part,item_name:'초보자 '+part,unit_price:a},{item_id:'b'+part,item_name:'여행자 '+part,unit_price:b}]);c.push({item_id:'ticket',item_name:'격전지 하층 1구역 티켓',unit_price:300});
 for(const faction of ['늑대','고양이','해적','음식']){const recipe=photoBoxRecipe(faction,c);assert.ok(Math.abs(recipe.rewards.reduce((a,r)=>a+r.chance,0)-100)<1e-8);const e=evaluateRewards(recipe,c);assert.ok(e.price>490&&e.price<505);assert.ok(Math.abs(e.assumptionHigh-e.price-280.68)<1e-8);assert.equal(e.rewards.filter(r=>r.name==='다이아').reduce((a,r)=>a+r.expected,0),9);assert.equal(e.unpriced.length,0);console.log(faction,e.price,e.assumptionHigh)}
});
