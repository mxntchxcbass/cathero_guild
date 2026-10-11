export const battleZones={normal:'일반 격전지',upper1:'상층 1층',upper2:'상층 2층',upper3:'상층 3층',lower1:'하층 1층',lower2:'하층 2층'};
export function migrateBattlePolicy(s){
 if(s.distributionPolicy===2)return s;
 s.battleRuns??=[];
 for(const i of s.items){if(!i.basis||i.basis==='trophy'||i.basis==='event'){
 i.previousDistributionBasis??=i.basis||'trophy';
 i.basis=['rift','galaxy'].includes(i.previousBattlegroundBasis)?i.previousBattlegroundBasis:'unassigned';
 }}
 if(s.payoutSelection==='basis:trophy'||s.payoutSelection==='basis:event')s.payoutSelection='all';
 s.distributionPolicy=2;return s;
}
export function battleWeight(member,item,state){
 const runs=item.battleId==='all'?(state.battleRuns||[]):(state.battleRuns||[]).filter(r=>r.id===item.battleId);
 if(!runs.length)throw Error(item.name+': 격전지·몬스터 기록을 연결하세요.');
 if(item.basis==='battleScore'&&item.battleId==='all'){
  if(new Set(runs.map(r=>r.mode)).size>1)throw Error(item.name+': 전체 합산은 점수와 직접 입력 기여율을 섞을 수 없습니다. 입력 방식을 통일하거나 개별 기록을 선택하세요.');
  for(const run of runs)if(run.mode==='percent'){const sum=state.members.filter(m=>m.active).reduce((a,m)=>a+(m.battleScores?.[run.id]||0),0);if(Math.abs(sum-100)>.01)throw Error(run.name+': 딜 기여율 합계는 100%로 입력하세요. 현재 '+sum+'%');}
 }
 let score=0,participated=false;
 for(const run of runs){const value=member.battleScores?.[run.id]||0;if(!Number.isFinite(value)||value<0)throw Error(member.name+': 격전지 점수를 확인하세요.');score+=value;participated ||= !!member.battleParticipation?.[run.id]||value>0;}
 return item.basis==='battleEqual'?(participated?1:0):score;
}
