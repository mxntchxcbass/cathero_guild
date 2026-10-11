const finite=(v,min=0,max=1e12)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
const text=(v,max)=>typeof v==='string'&&v.trim().length>0&&v.length<=max;
export function validState(s){
 if(!s||!Array.isArray(s.members)||s.members.length>200||!Array.isArray(s.items)||s.items.length>1000||!Array.isArray(s.history)||s.history.length>2000||!text(s.period,100)||!finite(s.equal,0,100)||!finite(s.minimum))return false;
 for(const list of [s.members,s.items])if(new Set(list.map(x=>x?.id)).size!==list.length||list.some(x=>!x||!text(x.id,100)||!text(x.name,200)))return false;
 if(s.members.some(m=>!finite(m.t)||!finite(m.carry,-1e12)||typeof m.active!=='boolean'||!m.pools||typeof m.pools!=='object'||Array.isArray(m.pools)||Object.values(m.pools).some(v=>!finite(v,-1e12))))return false;
 if(s.items.some(i=>!Number.isSafeInteger(i.qty)||i.qty<0||i.qty>100000||!finite(i.price)||!['market','pool'].includes(i.kind)))return false;
 if(s.rates&&['capture','defense','race'].some(k=>!Number.isSafeInteger(s.rates[k])||s.rates[k]<1||s.rates[k]>100000))return false;
 if(s.battleRuns!==undefined&&(!Array.isArray(s.battleRuns)||s.battleRuns.length>500||new Set(s.battleRuns.map(r=>r.id)).size!==s.battleRuns.length||s.battleRuns.some(r=>!text(r.id,100)||!text(r.name,200)||!['normal','upper1','upper2','upper3','lower1','lower2'].includes(r.zone)||!['score','percent'].includes(r.mode)||(r.date!==undefined&&r.date!==''&&(typeof r.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(r.date)||!Number.isFinite(Date.parse(r.date+'T00:00:00Z'))||new Date(r.date+'T00:00:00Z').toISOString().slice(0,10)!==r.date))||(r.guildRank!==undefined&&r.guildRank!==null&&(!Number.isSafeInteger(r.guildRank)||r.guildRank<1)))))return false;
 if(s.members.some(m=>m.battleScores&&(typeof m.battleScores!=='object'||Array.isArray(m.battleScores)||Object.values(m.battleScores).some(v=>!finite(v)))))return false;
 return true;
}
