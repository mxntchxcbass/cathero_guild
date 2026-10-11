export const factionParts={늑대:'신발',고양이:'장갑',해적:'모자',음식:'목도리'};
export function photoBoxRecipe(faction,catalog){
 const part=factionParts[faction];if(!part)throw Error('상자 종족을 선택하세요.');
 const row=(name,qty,chance,extra={})=>({name,qty:name==='다이아'?qty/10:qty,chance,price:0,marketName:name==='다이아'?'다이아 10개 환산':name,group:'1',guaranteed:false,...extra});
 return {mode:'random',faction,source:'종족 상자 III 사용자 검증 확률표',valuationNote:'시세 DB 연동 · 미등록 가치 0 · 확률 유지',rewards:[
 row(part+' 소환',1,24,{ticketPart:part}),row('격전지 하층 1구역 티켓',1,2),row('냥혼석',1,23.39),
 row('스타 펀치 '+part+' 레시피',1,.01),row('럭키 펀치 '+part+' 레시피',1,.1),row('루키 펀치 '+part+' 레시피',1,.8),row('미니 펀치 '+part+' 레시피',1,4),
 row('검은 보석',200,.5),row('다이아',10000,.5),row('검은 보석',20,4),row('다이아',1000,4),
 row('랜덤 특수룬 소환',1,2),row('신화 동료 픽업 소환서',10,4),row('스킬북',1,.7),row('픽업 동료 소환서',10,6),row('동료 소환서',10,4),row('룬 소환서',10,4),row('스킬 소환서',10,4.5),row('대포 소환서',10,4.5),row('재련석',10,5),row('랜덤 던전 열쇠',1,2)
 ]};
}
export const factionBoxId=faction=>'shared-faction-box-expected:'+faction;
export function boxFactionFromName(name){
 const match=/(늑대|고양이|해적|음식|요리사)\s*상자/.exec(name.trim());
 return match?(match[1]==='요리사'?'음식':match[1]):null;
}
export function withPhotoBoxRecipe(item,catalog){
 const faction=boxFactionFromName(item.name);if(!faction)return item;
 const shared=catalog.find(r=>r.item_id===factionBoxId(faction));
 if(shared)return {...item,valuation:'catalog',catalogId:shared.item_id,rewardRecipe:undefined,valueSource:'shared-box-expected'};
 return {...item,valuation:'expected',rewardRecipe:photoBoxRecipe(faction,catalog)};
 return item;
}
