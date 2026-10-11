import {battleWeight} from './battle-policy.mjs';
export const contentBases=['rift','galaxy'];
export function contentTrophy(member,basis){const value=member.contentTrophies?.[basis]??0;if(!Number.isSafeInteger(value)||value<0)throw Error(member.name+': 콘텐츠 트로피는 0 이상의 정수로 입력하세요.');return value}
export function settledItem(state,item){return item.qty===0&&!!(item.settledAt||state.history.some(h=>h.items?.some(i=>i.id===item.id&&i.qty>0)))}
export function selectedItems(state){const selection=state.payoutSelection||'all';return state.items.filter(i=>i.qty>0&&(selection==='all'||selection==='basis:'+(i.basis||'trophy')||selection==='item:'+i.id))}
export function activityPeriod(state,activity){return state.activityPeriods?.[activity==='race'?'race':'siege']||state.period}
export function isCurrentActivity(state,r){return !r.voided&&r.period===activityPeriod(state,r.activity)}
const nextDate=(value,days)=>{const d=new Date(value+'T12:00:00Z');if(isNaN(d))throw Error('정산 회차를 확인하세요.');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10)};
export function settleSelected(state,plan,records){
 const chosen=selectedItems(state).filter(i=>i.qty>0);if(!chosen.length)throw Error('지급할 수량이 없습니다.');
 const result=structuredClone(state),bases=new Set(chosen.map(i=>i.basis||'trophy'));
 result.activityPeriods={race:activityPeriod(state,'race'),siege:activityPeriod(state,'capture')};
 const before={battleRuns:structuredClone(state.battleRuns||[]),distributionPolicy:state.distributionPolicy,contentPeriods:structuredClone(state.contentPeriods||{}),members:structuredClone(state.members),items:structuredClone(state.items),period:state.period,activityPeriods:state.activityPeriods?structuredClone(state.activityPeriods):null,payoutSelection:state.payoutSelection||'all'};
 result.history.push({period:state.period,settledAt:new Date().toISOString(),selection:state.payoutSelection||'all',contentPeriods:structuredClone(state.contentPeriods||{}),activityPeriods:structuredClone(result.activityPeriods),items:structuredClone(selectedItems(state)),plan:structuredClone(plan),activityRecords:structuredClone(records.filter(r=>isCurrentActivity(state,r)&&bases.has(r.activity==='race'?'race':'siege'))),before});
 const hasCash=chosen.some(i=>i.kind==='market'&&!separateAllocation(i));
 for(const r of plan.rows){const m=result.members.find(m=>m.id===r.member.id);if(hasCash)m.carry=r.cashCarry??r.deficit;for(const i of chosen)if(separateAllocation(i))m.pools[poolKey(i)]=r.pools[poolKey(i)]??m.pools[poolKey(i)]??0;}
 for(const i of result.items)if(chosen.some(c=>c.id===i.id)){i.qty=0;i.settledAt=new Date().toISOString();}
 const closed=[...bases].filter(b=>!result.items.some(i=>(i.basis||'trophy')===b&&i.qty>0));
 if(closed.includes('trophy')){result.members=advanceContributions(result.members);result.period=nextDate(state.period,7);}
 result.contentPeriods={...state.contentPeriods};for(const b of contentBases)if(closed.includes(b)){result.members=result.members.map(m=>({...m,contentTrophies:{...m.contentTrophies,[b]:0}}));result.contentPeriods[b]=nextDate(state.contentPeriods?.[b]||state.period,1);}
 for(const b of ['race','siege'])if(closed.includes(b))result.activityPeriods[b]=nextDate(result.activityPeriods[b],1);
 return result;
}
export function memberCarryValue(member,items){return member.carry+items.filter(i=>i.kind==='market'&&separateAllocation(i)).reduce((a,i)=>a+(member.pools[poolKey(i)]||0)*i.price,0)}
export function minimumEach(item){return (item.minimumPerParticipant??(item.name==='거래 불가 방어구 소환'&&item.basis==='race'?1:0))}
export function separateAllocation(item){return item.kind==='pool'||item.valuation==='expected'||(item.basis&&item.basis!=='trophy')||minimumEach(item)>0}
export const basisName={unassigned:'출처·기준 설정 필요',battleEqual:'격전지 참여자 균등',battleScore:'격전지 몬스터 점수·딜 기여율',trophy:'길드 트로피',rift:'균열 격전지',galaxy:'은하 격전지',event:'이벤트 격전지',siege:'점령·방어',race:'레이스 미션',equal:'전체 균등'};
export const activityName={capture:'점령',defense:'방어',race:'레이스 미션'};
export function poolKey(item){if(item.battleId&&['battleEqual','battleScore'].includes(item.basis))return item.id+':'+item.basis+':'+item.battleId;return !item.basis||item.basis==='trophy'?item.id:item.id+':'+item.basis}
export function activityTotals(state,records){const totals={};for(const r of records){if(!isCurrentActivity(state,r))continue;totals[r.member_id]??={capture:0,defense:0,race:0};totals[r.member_id][r.activity]+=Number(r.points)}return totals}
export function contribution(m){
 const valid=v=>Number.isSafeInteger(v)&&v>=0;
 const supplied=v=>v!==null&&v!==undefined&&v!=='';
 let error='';
 if([m.baselineContribution,m.totalContribution].some(v=>supplied(v)&&!valid(v)))error='총 기여도는 0 이상의 정수로 입력하세요.';
 const delta=valid(m.baselineContribution)&&valid(m.totalContribution)?m.totalContribution-m.baselineContribution:null;
 if(delta!==null&&delta<0)error='현재 총 기여도가 기준보다 작습니다. 기준 값을 확인하세요.';
 if(m.trophyMode==='difference'&&delta===null&&!error)error='기준과 현재 총 기여도를 모두 입력하세요.';
 return {delta,error,weekly:m.trophyMode==='difference'?(error?null:delta):m.t};
}
export function syncContributionRecord(member){
 const calculated=contribution({...member,trophyMode:'difference'});
 return calculated.error||calculated.delta===null?member:{...member,trophyMode:'difference',t:calculated.delta};
}
export function baselineFromWeekly(member){
 const current=member.totalContribution,weekly=member.t;
 if(!Number.isSafeInteger(current)||current<0||!Number.isSafeInteger(weekly)||weekly<0||weekly>current)return member;
 return {...member,baselineContribution:current-weekly,trophyMode:'difference'};
}
export function advanceContributions(members){return members.map(m=>{const c=contribution(m);return {...m,t:0,...(c.delta!==null&&!c.error?{baselineContribution:m.totalContribution,baselineAt:m.totalObservedAt||null}:{} )}})}
export function allocate(s,records=[]){
 if(selectedItems(s).some(i=>!i.basis||['trophy','event','unassigned'].includes(i.basis)))throw Error('길드 트로피는 기록용입니다. 창고에서 격전지 출처와 새 분배 기준을 설정하세요.');
 s={...s,items:selectedItems(s),members:s.members.map(m=>{const c=contribution(m);if(selectedItems(s).some(i=>i.qty>0&&(i.basis||'trophy')==='trophy')&&m.active&&m.trophyMode==='difference'&&c.error)throw Error(m.name+': '+c.error);return {...m,enteredT:m.t,t:c.weekly??m.t}})};
 if(!s.members.length)throw Error('길드원을 추가하세요.');
 if(!Number.isFinite(s.equal)||s.equal<0||s.equal>100||!Number.isFinite(s.minimum)||s.minimum<0)throw Error('균등 비율과 최소 트로피를 확인하세요.');
 if(s.members.some(m=>!m.name.trim()||!Number.isFinite(m.t)||m.t<0||!Number.isFinite(m.carry)||Object.values(m.pools).some(v=>!Number.isFinite(v))))throw Error('길드원 입력을 확인하세요.');
 if(new Set(s.members.map(m=>m.name.trim())).size!==s.members.length)throw Error('길드원 이름이 중복됩니다.');
 if(s.items.some(i=>![0,1].includes(minimumEach(i))||!i.name.trim()||!Number.isInteger(i.qty)||i.qty<0||i.qty>100000||!Number.isFinite(i.price)||i.price<0||!['market','pool'].includes(i.kind)||i.kind==='market'&&i.qty>0&&i.price<=0||i.basis&&!Object.hasOwn(basisName,i.basis)))throw Error('아이템 수량·단가·분배 기준을 확인하세요.');
 if(new Set(s.items.map(i=>i.name.trim()+':'+(i.basis||'trophy')+':'+(i.battleId||''))).size!==s.items.length)throw Error('아이템 이름은 종류별로 구분하세요.');
 const active=s.members.filter(m=>m.active),eligible=active.filter(m=>m.t>=s.minimum),total=eligible.reduce((a,m)=>a+m.t,0),value=s.items.filter(i=>i.kind==='market').reduce((a,i)=>a+i.qty*i.price,0),points=activityTotals(s,records);
 if(!active.length)throw Error('분배 대상이 없습니다.');
 const trophyValue=s.items.filter(i=>i.kind==='market'&&!separateAllocation(i)).reduce((a,i)=>a+i.qty*i.price,0);
 const trophyShares=new Map(eligible.map(m=>[m.id,total===0&&s.equal<100?0:s.equal/100/eligible.length+(1-s.equal/100)*(total?m.t/total:0)]));
 const rows=active.map(m=>({member:m,share:trophyShares.get(m.id)||0,target:trophyValue*(trophyShares.get(m.id)||0),deficit:m.carry+trophyValue*(trophyShares.get(m.id)||0),paid:0,qty:{},pools:{...m.pools},points:points[m.id]||{capture:0,defense:0,race:0}}));
 if(trophyValue>0&&(!eligible.length||total===0&&s.equal<100))throw Error('시장가 아이템을 나눌 트로피 대상이 없습니다.');
 for(const item of [...s.items].sort((a,b)=>(b.kind==='market'?b.price:0)-(a.kind==='market'?a.price:0))){
 if(item.kind==='market'&&!separateAllocation(item)){const targets=rows.filter(r=>trophyShares.has(r.member.id));for(let k=0;k<item.qty;k++){let r=targets.reduce((a,b)=>b.deficit>a.deficit+1e-9?b:a);r.qty[item.id]=(r.qty[item.id]||0)+1;r.paid+=item.price;r.deficit-=item.price;}}
 else{const basis=item.basis||'trophy';
 const weights=rows.map(r=>['battleEqual','battleScore'].includes(basis)?battleWeight(r.member,item,s):contentBases.includes(basis)?contentTrophy(r.member,basis):basis==='trophy'?r.share:basis==='equal'?1:basis==='siege'?r.points.capture+r.points.defense:r.points.race),sum=weights.reduce((a,b)=>a+b,0);if(basis==='battleScore'&&s.battleRuns?.find(r=>r.id===item.battleId)?.mode==='percent'&&Math.abs(sum-100)>0.01)throw Error(item.name+': 딜 기여율 합계는 100%로 입력하세요. 현재 '+sum+'%');if(item.qty>0&&sum<=0)throw Error(item.name+': '+basisName[basis]+' 분배 대상/포인트가 없습니다.');
 if(!item.qty)continue;const key=poolKey(item),candidates=rows.map((r,j)=>j).filter(j=>weights[j]>0),minimum=minimumEach(item),reserved=minimum*candidates.length;
 if(item.qty<reserved)throw Error(item.name+': 참여자 '+candidates.length+'명에게 최소 '+minimum+'개씩 지급하려면 '+reserved+'개가 필요합니다. 현재 '+item.qty+'개 · '+(reserved-item.qty)+'개 부족. 수량을 확보하거나 최소 지급 설정을 변경하세요.');
 const remaining=item.qty-reserved,d=rows.map((r,j)=>(r.pools[key]||0)+remaining*weights[j]/sum);
 if(minimum)for(const j of candidates)rows[j].qty[item.id]=minimum;
 for(let k=0;k<remaining;k++){let best=candidates[0];for(const j of candidates)if(d[j]>d[best]+1e-9)best=j;rows[best].qty[item.id]=(rows[best].qty[item.id]||0)+1;d[best]--;}
 rows.forEach((r,j)=>{if(weights[j]>0){r.pools[key]=d[j];if(item.kind==='market'){r.target+=(minimum+remaining*weights[j]/sum)*item.price;r.paid+=(r.qty[item.id]||0)*item.price}}});}}
 rows.forEach(r=>{r.cashCarry=r.deficit;r.deficit+=s.items.filter(i=>i.kind==='market'&&separateAllocation(i)).reduce((a,i)=>a+(r.pools[poolKey(i)]||0)*i.price,0)});
 return{rows,total,value,activityPeriod:s.period};
}

export function guildProgress(g={}){
 let level=g.level??null,exp=g.exp??0;
 if(level!==null&&(!Number.isSafeInteger(level)||level<1||level>10000))throw Error('길드 레벨은 1 이상의 정수로 입력하세요.');
 if(!Number.isSafeInteger(exp)||exp<0)throw Error('길드 경험치는 0 이상의 정수로 입력하세요.');
 const requirements=g.requirements||{};
 if(level!==null)while(level<10000){const needed=Number(requirements[level]?.exp);if(!Number.isSafeInteger(needed)||needed<=0||exp<needed)break;exp-=needed;level++;}
 const next=level===null?null:Number(requirements[level]?.exp)||null;
 return {level,exp,next,remaining:next?Math.max(0,next-exp):null,percent:next?Math.min(100,exp/next*100):null,unknown:!next};
}
export function validateGuild(g){
 if(!g||typeof g!=='object'||Array.isArray(g))throw Error('길드 정보를 확인하세요.');
 for(const f of ['name','master','deputy'])if(typeof g[f]!=='string'||g[f].length>100)throw Error('길드 이름과 운영진 이름은 100자 이내로 입력하세요.');
 if(g.memberCount!=null&&(!Number.isSafeInteger(g.memberCount)||g.memberCount<0))throw Error('길드원 수를 확인하세요.');
 if(!g.requirements||typeof g.requirements!=='object'||Array.isArray(g.requirements)||Object.keys(g.requirements).length>1000)throw Error('경험치 기준표를 확인하세요.');
 for(const [level,row] of Object.entries(g.requirements)){if(!Number.isSafeInteger(Number(level))||Number(level)<1||Number(level)>=10000||!Number.isSafeInteger(row.exp)||row.exp<=0||typeof row.source!=='string'||row.source.length>500)throw Error('레벨별 경험치 기준을 확인하세요.');}
 return {...g,...guildProgress(g)};
}
