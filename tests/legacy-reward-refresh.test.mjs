import test from 'node:test';import assert from 'node:assert/strict';import {applyMarketPrices} from '../public/market-core.mjs';import {evaluateRewards} from '../public/expected-value.mjs';import {photoBoxRecipe} from '../public/box-rewards.mjs';
const c=['신발','모자','목도리','장갑'].flatMap(part=>[{item_id:'a'+part,item_name:'초보자 '+part,unit_price:100},{item_id:'b'+part,item_name:'여행자 '+part,unit_price:200}]).concat([{item_id:'ticket',item_name:'격전지 하층 1구역 티켓',unit_price:300},{item_id:'stale',item_name:'예전 소환권 단가',unit_price:99999}]);
test('old nonzero stored boxes and armor tickets become live expected values',()=>{const items=applyMarketPrices([{id:'box',name:'눈부신 늑대 상자 III',qty:1,kind:'market',price:1,valuation:'manual'},{id:'armor',name:'방어구 소환권',qty:1,kind:'market',price:1,valuation:'manual'}],c);assert.ok(items.every(i=>i.valuation==='expected'&&i.price>1));const snapshot=JSON.stringify(items);const next=applyMarketPrices(JSON.parse(snapshot),c.map(x=>x.item_id==='b신발'?{...x,unit_price:400}:x));assert.ok(next[0].price>items[0].price);assert.ok(next[1].price>items[1].price)});
test('nested summon cannot remain frozen by an old price link or missing ticket metadata',()=>{const recipe=photoBoxRecipe('늑대',c);recipe.rewards[0]={...recipe.rewards[0],catalogId:'stale',price:99999};delete recipe.rewards[0].ticketPart;const e=evaluateRewards(recipe,c);assert.ok(e.price<1000);assert.equal(e.rewards[0].catalogId,'');assert.equal(e.rewards[0].ticketPart,'신발');const item=applyMarketPrices([{name:'눈부신 늑대 상자 III',kind:'market',qty:1,price:99999,valuation:'manual',rewardRecipe:recipe}],c)[0];assert.equal(item.valuation,'expected');assert.equal(item.rewardRecipe.rewards[0].catalogId,'')});
test('short faction box names resolve to the same rewards as full III names',()=>{for(const faction of ['늑대','고양이','해적','음식','요리사']){const base={kind:'market',qty:1,price:999};const short=applyMarketPrices([{...base,name:faction+' 상자'}],c)[0],full=applyMarketPrices([{...base,name:'눈부신 '+faction+' 상자 III'}],c)[0];assert.equal(short.valuation,'expected');assert.equal(short.price,full.price);assert.deepEqual(short.rewardRecipe,full.rewardRecipe)}});

test('shining food aliases receive scarf rewards and copied wolf presets are repaired',()=>{
 const source=photoBoxRecipe('늑대',c);const item=applyMarketPrices([{name:'빛나는 음식 상자3',qty:1,price:999,kind:'market',rewardRecipe:source}],c)[0];
 assert.equal(item.valuation,'expected');assert.equal(item.rewardRecipe.faction,'음식');assert.equal(item.rewardRecipe.rewards[0].ticketPart,'목도리');assert.equal(item.rewardRecipe.rewards[0].chance,24);
 assert.ok(item.rewardRecipe.rewards.some(r=>r.name==='미니 펀치 목도리 레시피'));assert.ok(!item.rewardRecipe.rewards.some(r=>r.ticketPart==='신발'));
 const fresh=applyMarketPrices([{name:'빛나는 음식 상자3',qty:1,price:1,kind:'market'}],c)[0];assert.equal(item.price,fresh.price);
});

test('each faction keyword shares its own DB reference without averaging across factions',()=>{
 const factions=['음식','고양이','해적','늑대'];
 const catalog=[...c,...factions.map((f,i)=>({item_id:'shared-faction-box-expected:'+f,item_name:f+' 상자 공용 기댓값',unit_price:String(480+i)}))];
 for(const [idx,faction] of factions.entries())for(const name of [faction+' 상자','이벤트 빛나는 '+faction+' 상자 IV (보상)']){
 const [i]=applyMarketPrices([{name,qty:3,price:1,kind:'market',basis:'trophy',catalogId:'shared-faction-box-expected',rewardRecipe:photoBoxRecipe('늑대',c)}],catalog);
 assert.equal(i.price,480+idx);assert.equal(i.catalogId,'shared-faction-box-expected:'+faction);assert.equal(i.rewardRecipe,undefined);assert.equal(i.qty,3);assert.equal(i.basis,'trophy');
 }
});
