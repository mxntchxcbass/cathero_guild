export const armorParts=['신발','모자','목도리','장갑'];
export function armorMarketRow(catalog,name){return catalog.find(p=>(p.item_name===name||p.item_name==='격전지 '+name)&&(!p.attributes?.category||p.attributes.category==='격전지'));}
export const armorTiers=[['초보자','일반',22.5],['여행자','고급',2.25],['하늘빛','희귀',.225],['달빛','영웅',.0225],['붉은바다','전설',.0025]];
export function photoArmorRecipe(catalog,parts=armorParts){
 if(!parts.length||parts.some(p=>!['신발','모자','목도리','장갑','목걸이','반지','팔찌'].includes(p)))throw Error('지원하지 않는 방어구 부위입니다.');
 const rewards=[];
 for(const part of parts){

  for(let tier=0;tier<armorTiers.length;tier++){
   const [label,grade,chance]=armorTiers[tier],name=label+' '+part,actual=armorMarketRow(catalog,name);
   rewards.push({name,equipmentCategory:'격전지',equipmentPart:part,equipmentGrade:grade,group:'1',qty:1,chance,guaranteed:false,catalogId:actual?.item_id||'',price:0,marketName:name,unpriced:!actual});
  }
 }
 return {mode:'random',source:'사용자 게임 확률 사진 2026-10-09 · 각 보상 1개',rewards};
}
export function withPhotoArmorRecipe(item,catalog){
 const part=/^(신발|모자|목도리|장갑)\s*(?:소환|교환)(?:권|티켓)?$/.exec(item.name.trim())?.[1];
 if(part&&!item.rewardRecipe){const recipe=photoArmorRecipe(catalog,[part]);recipe.rewards=recipe.rewards.filter(r=>r.equipmentPart===part).map(r=>({...r,chance:r.chance*4}));return {...item,valuation:'expected',rewardRecipe:recipe};}
 if(/^(?:거래 불가\s*)?방어구\s*(?:소환|교환)(?:권|티켓)?$/.test(item.name.trim())&&!item.rewardRecipe)return {...item,valuation:'expected',rewardRecipe:photoArmorRecipe(catalog)};
 return item;
}
