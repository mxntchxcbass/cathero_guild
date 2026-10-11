export const marketGroups=['장비','레시피','징표','냥혼석','기타'];
export const equipmentParts=['장갑','모자','목도리','신발','반지','목걸이','상의','하의','팔찌'];
export function inferredAttributes(name,a={}){const out={...a};if(!out.marketGroup){if(/냥혼석/.test(name))out.marketGroup='냥혼석';else if(/레시피/.test(name))out.marketGroup='레시피';else if(/징표/.test(name))out.marketGroup='징표';else if(a.type==='장비'||equipmentParts.some(p=>name.includes(p)))out.marketGroup='장비';}if(out.marketGroup==='장비'){out.type||='장비';out.part||=equipmentParts.find(p=>name.includes(p))||'';if(!out.grade){const pair=[['초보자','일반'],['여행자','고급'],['하늘빛','희귀'],['달빛','영웅'],['붉은바다','전설']].find(([n])=>name.includes(n));if(pair)out.grade=pair[1];}if(!out.category&&/격전지|연금술/.test(name))out.category=name.includes('격전지')?'격전지':'연금술';}else if(out.marketGroup)out.type||='잡화';if(out.marketGroup==='레시피'&&!out.recipeType&&name.includes('유물'))out.recipeType='유물';const trade=name.match(/거래\s*(\d+)\s*회/);if(out.tradeCount==null&&trade)out.tradeCount=Number(trade[1]);return out;}
export const itemTypes=['장비','잡화'];
export const equipmentGrades=['일반','고급','희귀','영웅','전설'];
export const miscGrades=['견습','숙련','일반','고급','희귀','영웅','전설','신화','초월'];
export const categories=['격전지','연금술'];
export const optionGrades=['일반','고급','희귀','전설','신화'];
export const potentialGrades=['고급','희귀','영웅','전설','신화'];
export function normalizeAttributes(a={}){
 const out={marketGroup:a.marketGroup||'',part:a.part||'',recipeType:a.recipeType||'',tradeCount:a.tradeCount??null,registerable:a.registerable??null,soulSkillGrade:a.soulSkillGrade||'',type:a.type||'',grade:a.grade||'',category:a.category||'',enhance:a.enhance??null,options:a.options||[],potential:{grade:a.potential?.grade||'',skill:a.potential?.skill||''}};
 if(out.marketGroup&&!marketGroups.includes(out.marketGroup)||out.part&&!equipmentParts.includes(out.part)||out.recipeType&&!['유물','기타'].includes(out.recipeType)||out.tradeCount!==null&&(!Number.isInteger(out.tradeCount)||out.tradeCount<0)||out.registerable!==null&&typeof out.registerable!=='boolean'||out.soulSkillGrade&&!['일반','고급','희귀','영웅','전설','신화'].includes(out.soulSkillGrade))throw Error('거래소 분류와 필터 정보를 확인하세요.');
 if(out.type&&!itemTypes.includes(out.type))throw Error('아이템 분류를 확인하세요.');
 const grades=out.type==='장비'?equipmentGrades:out.type==='잡화'?miscGrades:[];
 if(out.grade&&!grades.includes(out.grade))throw Error('분류에 맞는 아이템 등급을 선택하세요.');
 if(out.category&&!categories.includes(out.category))throw Error('장비 카테고리를 확인하세요.');
 if(out.enhance!==null&&(!Number.isInteger(out.enhance)||out.enhance<0||out.enhance>9))throw Error('강화 단계는 +0~+9입니다.');
 if(!Array.isArray(out.options)||out.options.length>3)throw Error('추가옵션은 최대 3개입니다.');
 out.options=out.options.map(o=>{if(!o||typeof o.text!=='string'||o.text.length>200||!optionGrades.includes(o.grade))throw Error('추가옵션 등급과 내용을 확인하세요.');return {grade:o.grade,text:o.text.trim()}});
 if(out.potential.grade&&!potentialGrades.includes(out.potential.grade)||typeof out.potential.skill!=='string'||out.potential.skill.length>200)throw Error('잠재능력 등급과 스킬을 확인하세요.');
 if(out.type!=='장비'&&(out.category||out.enhance!==null||out.options.length||out.potential.grade||out.potential.skill))throw Error('강화·옵션·잠재능력은 장비에만 등록하세요.');
 return out;
}
export function matchesItem(item,f={}){
 const a=inferredAttributes(item.item_name||item.name||'',item.attributes||{}),options=a.options||[],p=a.potential||{};
 const hay=[item.item_name||item.name||'',item.note||'',a.type,a.grade,a.category,...options.map(o=>o.text),p.skill].join(' ').toLocaleLowerCase();
 if(f.q&&!hay.includes(f.q.trim().toLocaleLowerCase()))return false;
 for(const k of ['marketGroup','part','recipeType','soulSkillGrade'])if(f[k]&&a[k]!==f[k])return false;
 if(f.tradeCount!==undefined&&f.tradeCount!==''&&(a.tradeCount==null||(f.tradeCount==='3+'?a.tradeCount<3:a.tradeCount!==Number(f.tradeCount))))return false;
 if(f.registerable==='yes'&&a.registerable!==true)return false;
 if(f.enhanceMin!==undefined&&f.enhanceMin!==''&&(a.enhance==null||a.enhance<Number(f.enhanceMin)))return false;
 if(f.enhanceMax!==undefined&&f.enhanceMax!==''&&(a.enhance==null||a.enhance>Number(f.enhanceMax)))return false;
 for(const k of ['type','grade','category'])if(f[k]&&(k==='type'&&f[k]==='미분류'?!!a.type:a[k]!==f[k]))return false;
 if(f.enhance!==undefined&&f.enhance!==''&&(a.enhance===null||a.enhance===undefined||a.enhance!==Number(f.enhance)))return false;
 if((f.optionGrade||f.optionText)&&!options.some(o=>(!f.optionGrade||o.grade===f.optionGrade)&&(!f.optionText||o.text.toLowerCase().includes(f.optionText.toLowerCase()))))return false;
 if(f.potentialGrade&&p.grade!==f.potentialGrade)return false;
 if(f.potentialSkill&&!(p.skill||'').toLowerCase().includes(f.potentialSkill.toLowerCase()))return false;
 return true;
}
export const attributeHeaders=['분류','등급','카테고리','강화','옵션1 등급','옵션1 내용','옵션2 등급','옵션2 내용','옵션3 등급','옵션3 내용','잠재능력 등급','잠재능력 스킬','거래소 탭','장비 부위','레시피 종류','거래 가능 횟수','등록 가능 레시피','냥혼석 스킬1 등급'];
export function attributeCells(a={}){const o=a.options||[],p=a.potential||{};return [a.type||'미분류',a.grade||'',a.category||'',a.enhance==null?'':'+'+a.enhance,...[0,1,2].flatMap(i=>[o[i]?.grade||'',o[i]?.text||'']),p.grade||'',p.skill||'',a.marketGroup||'',a.part||'',a.recipeType||'',a.tradeCount??'',a.registerable==null?'미확인':a.registerable?'가능':'불가',a.soulSkillGrade||''];}
