import {photoArmorRecipe,armorMarketRow,armorParts} from './armor-rewards.mjs';
export function roundUnitPrice(value){return Number.isFinite(value)&&value>=0?Math.round(value):value;}
export function valuationMethod(item){return item.valuation|| (item.catalogId?'catalog':'manual')}
export function evaluateRewards(recipe,catalog=[]){
 if(!recipe||!['random','choice'].includes(recipe.mode)||!Array.isArray(recipe.rewards)||!recipe.rewards.length||recipe.rewards.length>100)throw Error('보상과 평가 방식을 등록하세요.');
 const map=new Map(catalog.map(p=>[p.item_id,p]));
 const rows=recipe.rewards.map(r=>{
  if(typeof r.name!=='string'||!r.name.trim()||r.name.length>200||!Number.isFinite(r.qty)||r.qty<=0||!Number.isFinite(r.chance)||r.chance<0||r.chance>100)throw Error('보상 이름·수량·확률을 확인하세요.');
  if(r.marketName){const actual=catalog.find(p=>p.item_name===r.marketName||p.item_name==='격전지 '+r.marketName)||(/레시피/.test(r.marketName)?catalog.find(p=>p.item_name==='레시피 공통 평가'):null);r={...r,catalogId:actual?.item_id||'',price:actual?Number(actual.unit_price):0,unpriced:!actual,priceEstimate:undefined};}
  const summonPart=r.ticketPart||/^(신발|모자|목도리|장갑|목걸이|반지|팔찌)\s*(?:소환|교환)(?:권|티켓)?$/.exec(r.name.trim())?.[1];
  const armorSummon=/^(?:거래 불가\s*)?방어구\s*(?:소환|교환)(?:권|티켓)?$/.test(r.name.trim());
  const armorName=/^(?:격전지 )?(초보자|여행자|하늘빛|달빛|붉은바다) (신발|모자|목도리|장갑|목걸이|반지|팔찌)$/.exec(r.name);
  const recipePrice=/レシピ|레시피/.test(r.name)?catalog.find(p=>p.item_name===r.name.trim()):null;
  const linked=summonPart||armorSummon?null:armorName?armorMarketRow(catalog,armorName[1]+' '+armorName[2]):r.catalogId?map.get(r.catalogId):recipePrice;
  if(r.equipmentPart&&!['신발','모자','목도리','장갑','목걸이','반지','팔찌'].includes(r.equipmentPart)||r.equipmentCategory&&r.equipmentCategory!=='격전지')throw Error('보상 장비는 격전지 신발·모자·목도리·장갑만 사용합니다.');
  if(r.catalogId&&!linked&&!armorName&&!summonPart&&!armorSummon)throw Error(r.name+': 연결한 보상 시세를 찾을 수 없습니다.');
  let price=linked?Number(linked.unit_price):r.price;
  if(linked&&(armorName||recipePrice)){r={...r,catalogId:linked.item_id};delete r.priceEstimate;delete r.estimateNote;if(r.ignored){r.ignored=false;r.estimateNote='등록된 실제 시세 반영';}}
  if(armorName&&!linked){price=0;r={...r,priceEstimate:undefined,unpriced:true};}
  if(summonPart||armorSummon){if(summonPart&&!['신발','모자','목도리','장갑','목걸이','반지','팔찌'].includes(summonPart))throw Error('지원하지 않는 방어구 부위입니다.');const nested=photoArmorRecipe(catalog,summonPart?[summonPart]:armorParts);if(summonPart)nested.rewards=nested.rewards.filter(x=>x.equipmentPart===summonPart).map(x=>({...x,chance:x.chance*4}));price=evaluateRewards(nested,catalog).price;r={...r,catalogId:'',priceEstimate:undefined,...(summonPart?{ticketPart:summonPart}:{armorSummon:true})};}
  if(!linked&&r.priceEstimate){
   const e=r.priceEstimate,actual=armorMarketRow(catalog,e.targetName);
   if(actual)price=Number(actual.unit_price);
   else {const a=Number(map.get(e.basicId)?.unit_price),b=Number(map.get(e.advancedId)?.unit_price);if(!(a>0&&b>0)||!Number.isInteger(e.steps)||e.steps<1||e.steps>3)throw Error(r.name+': 추정 기준 시세를 확인하세요.');price=b*Math.pow(b/a,e.steps);}
  }
  if(!Number.isFinite(price)||price<0)throw Error(r.name+': 단가를 입력하거나 시세 DB를 연결하세요.');
  const chance=r.guaranteed?100:r.chance;
  return {...r,group:String(r.group||'1').trim(),name:r.name.trim(),price,priceObservedAt:linked?.observed_at||null,value:r.qty*price,expected:r.qty*price*chance/100};
 });
 const random=rows.filter(r=>!r.guaranteed),sum=random.reduce((a,r)=>a+r.chance,0),groups=new Map();for(const r of random){const group=groups.get(r.group)||[];group.push(r);groups.set(r.group,group)}
 if(recipe.mode==='random')for(const [name,group] of groups){const total=group.reduce((a,r)=>a+r.chance,0);if(Math.abs(total-100)>1e-6)throw Error('추첨 묶음 '+name+': 확률 합계가 '+total+'%입니다. 100%로 맞추세요. 보상 없음은 0 블다로 등록하세요.');}
 const guaranteed=rows.filter(r=>r.guaranteed).reduce((a,r)=>a+r.value,0);
 const optional=recipe.mode==='choice'?[...groups.values()].reduce((a,group)=>a+Math.max(0,...group.map(r=>r.value)),0):random.reduce((a,r)=>a+r.expected,0);
 const price=guaranteed+optional;
 if(!Number.isFinite(price)||price>Number.MAX_SAFE_INTEGER)throw Error('기대값이 너무 큽니다. 수량·단가를 확인하세요.');
 return {price,valuationNote:recipe.valuationNote||'',unpriced:rows.filter(r=>r.unpriced).map(r=>r.name),assumptionHigh:rows.reduce((a,r)=>a+(r.assumptionRange?(r.assumptionRange[1]-r.price)*r.qty*r.chance/100:0),price),mode:recipe.mode,rewards:rows,guaranteed,optional,probabilityTotal:sum};
}
export function resolveItemValue(item,catalog){
 const method=valuationMethod(item);
 if(!['manual','catalog','expected'].includes(method))throw Error('가치 평가 방식을 확인하세요.');
 if(item.rewardRecipe&&(method==='expected'||/상자|방어구.*(?:소환|교환)/.test(item.name))){
  const evaluation=evaluateRewards(item.rewardRecipe,catalog);
  return {...item,valuation:'expected',rewardRecipe:{...item.rewardRecipe,rewards:evaluation.rewards.map(({value,expected,priceObservedAt,...r})=>r)},price:roundUnitPrice(evaluation.price),valueEvaluation:evaluation};
 }
 if(method==='catalog'){
  const r=catalog.find(r=>r.item_id===item.catalogId);
  if(!r)throw Error(item.name+': 연결된 시세를 찾지 못했습니다. 시세 DB를 확인하세요.');
  // A price link changes value, not the warehouse item's identity or classification.
  return {...item,price:roundUnitPrice(Number(r.unit_price)),priceObservedAt:r.observed_at,catalogName:r.item_name};
 }
 return {...item,price:roundUnitPrice(item.price)};
}
