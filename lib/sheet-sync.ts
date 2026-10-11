import {preserveLegacy} from './workspaces';
import {valuationMethod} from '../public/expected-value.mjs';
import {attributeHeaders,attributeCells} from '../public/item-attributes.mjs';
import {getCatalog,getAttributes} from './market';
import {applyMarketPrices,latestCatalog} from '../public/market-core.mjs';
import {selectedItems,activityPeriod,activityTotals,memberCarryValue,separateAllocation,minimumEach,contribution,allocate,guildProgress} from '../public/guild-core.mjs';
import {env} from 'cloudflare:workers';
import {guildContext} from './guild-context';
import {database,rawDatabase} from '../db/raw';

const names={capture:'점령',defense:'방어',race:'레이스 미션'};
const basis={unassigned:'출처 설정 필요',battleEqual:'격전지 참여자 균등',battleScore:'격전지 몬스터 점수·기여율',rift:'균열 격전지',galaxy:'은하 격전지',event:'이벤트 격전지',trophy:'길드 트로피',siege:'점령·방어',race:'레이스 미션',equal:'전체 균등'};
const b64=(v:Uint8Array)=>btoa(String.fromCharCode(...v)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
const cachedTokens=new Map<string,{token:string,until:number}>();
export async function token(scope='https://www.googleapis.com/auth/spreadsheets'){
 const cached=cachedTokens.get(scope);if(cached&&cached.until>Date.now())return cached.token;
 if(!env.GOOGLE_SERVICE_ACCOUNT_EMAIL||!env.GOOGLE_PRIVATE_KEY)throw Error('구글 연결 환경변수 3개를 확인하세요.');
 const now=Math.floor(Date.now()/1000),encode=(v:unknown)=>b64(new TextEncoder().encode(JSON.stringify(v)));
 const data=encode({alg:'RS256',typ:'JWT'})+'.'+encode({iss:env.GOOGLE_SERVICE_ACCOUNT_EMAIL,scope,aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600});
 let key:CryptoKey;
 try{let raw=env.GOOGLE_PRIVATE_KEY.trim();if(raw.startsWith('{')||raw.startsWith('"')){const parsed=JSON.parse(raw);raw=typeof parsed==='string'?parsed:parsed.private_key;}if(typeof raw!=='string')throw Error();const pem=raw.replace(/\\n/g,'\n').replace(/-----[^-]+-----/g,'').replace(/\s/g,'');key=await crypto.subtle.importKey('pkcs8',Uint8Array.from(atob(pem),c=>c.charCodeAt(0)),{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['sign']);}catch{throw Error('GOOGLE_PRIVATE_KEY 형식을 확인하세요. JSON 파일의 private_key 값 전체가 필요합니다.');}
 const sig=await crypto.subtle.sign('RSASSA-PKCS1-v1_5',key,new TextEncoder().encode(data));
 const r=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:data+'.'+b64(new Uint8Array(sig))}),signal:AbortSignal.timeout(15000)});
 if(!r.ok)throw Error('구글 인증 실패: 서비스 계정 이메일과 비공개 키가 같은 계정인지 확인하세요.');
 const d=await r.json() as {access_token:string,expires_in:number};cachedTokens.set(scope,{token:d.access_token,until:Date.now()+(d.expires_in-120)*1000});return d.access_token;
}
export async function sheetId(){const r=await database().prepare("SELECT sheet_id FROM sheet_sync WHERE id='guild'").first<{sheet_id:string}>();return r?.sheet_id||(guildContext()?.id==='legacy'?env.GOOGLE_SHEET_ID:null);}
export async function google(path:string,body?:unknown,target?:string){
 const id=target||await sheetId();if(!id)throw Error('이 길드의 구글시트를 먼저 연결하세요.');
 const r=await fetch('https://sheets.googleapis.com/v4/spreadsheets/'+encodeURIComponent(id)+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+await token(),'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(20000)});
 if(!r.ok){if(r.status===400){const detail=await r.json().catch(()=>null) as any;console.error('Google Sheets batch request rejected',String(detail?.error?.message||'Invalid request').slice(0,600));throw Error('구글시트 요청 형식 오류 (400). 관리자에게 문의하세요.');}if(r.status===403)throw Error('구글시트 접근 거부: 서비스 계정을 시트 편집자로 공유하고 Google Sheets API를 활성화하세요.');if(r.status===404)throw Error('GOOGLE_SHEET_ID 또는 서비스 계정의 시트 공유 권한을 확인하세요.');if(r.status===401)cachedTokens.clear();throw Error('구글시트 요청 실패 ('+r.status+'). 잠시 후 재시도하세요.');}
 return r.json() as Promise<any>;
}
const date=(s:string)=>new Date(s).toLocaleString('ko-KR',{timeZone:'Asia/Seoul'});
type Row=Array<string|number|boolean>;
export function sheetRows(state:any,activities:any[],prices:any[],stamp:string):Record<string,Row[]>{
 const totals:Record<string,any>=activityTotals(state,activities);
 const notice='DB 동기화: '+stamp+' (한국 시간) · DB → 시트 자동 반영 · 수정은 웹에서';
 const g=state.guild||{},growth=guildProgress(g);
 const members:Row[]=[[],['길드·길드원·활동'],[notice],[],['길드 이름',g.name||'미등록','길드원 수',g.memberCount??state.members.length,'명단 등록 인원',state.members.length],['길드 레벨',growth.level??'미등록','현재 레벨 EXP',growth.exp,'다음 레벨 필요 EXP',growth.next??'기준 미등록'],['길드마스터',g.master||'미등록','길드 부마스터',g.deputy||'미등록'],['다음 레벨 남은 EXP',growth.remaining??'기준 미등록','회차',state.period],[],['길드원 정보'],['닉네임','주간 트로피','분배 대상','이월 블다','점령 포인트','방어 포인트','레이스 포인트','총 기여도','이월 블다 합계 (현재 단가)','균열 트로피','은하 트로피','이벤트 트로피']];
 state.members.forEach((m:any)=>members.push([m.name,Number(m.t),m.active?'포함':'제외',Number(m.carry),totals[m.id]?.capture||0,totals[m.id]?.defense||0,totals[m.id]?.race||0,m.totalContribution??'',memberCarryValue(m,state.items),m.contentTrophies?.rift||0,m.contentTrophies?.galaxy||0,m.contentTrophies?.event||0]));
 members.push([],['전체 활동 기록 · 취소 이력'],['회차','닉네임','활동','횟수','회당 점수 / 미션 포인트','포인트','메모','상태','기록 시각']);
 activities.forEach(a=>members.push([a.period,a.member_name,names[a.activity as keyof typeof names]||a.activity,a.count,a.unit_points,a.points,a.note,a.voided?'취소':'유효',date(a.created_at)]));
 members.push([],['격전지 몬스터 점수·기여율'],['격전지','몬스터 · 회차','입력 방식','닉네임','참여','점수 / 기여율','회차 날짜','길드 순위']);
 for(const run of state.battleRuns||[])for(const m of state.members)members.push([run.zone,run.name,run.mode,m.name,m.battleParticipation?.[run.id]||m.battleScores?.[run.id]>0?'참여':'미참여',m.battleScores?.[run.id]||0,run.date||'',run.guildRank??'']);
 members.push([],['레벨별 필요 경험치 기준표'],['현재 레벨','다음 레벨','필요 EXP','확인 출처']);
 Object.entries(g.requirements||{}).sort((a,b)=>Number(a[0])-Number(b[0])).forEach(([l,r]:[string,any])=>members.push([Number(l),Number(l)+1,r.exp,r.source]));
 if(!Object.keys(g.requirements||{}).length)members.push(['경험치 기준표 미등록 · 게임 화면에서 확인한 값을 웹에서 등록하세요.']);
 const header:Row=['회차','닉네임','아이템','수량','블다/개','아이템 지급 가치','분배 기준','트로피 분배율 (%)','인별 권리 (반복)','다음 이월 블다 (반복)','재화 이월 개수','상태','길드 레이스 포인트'];
 const payouts:Row[]=[[],['지급표·정산'],[notice],[],['회차',state.period,'균등분배 (%)',state.equal,'최소 트로피',state.minimum],['이번 지급표 · 미확정',state.payoutSelection||'all','레이스 회차',activityPeriod(state,'race'),'점령전 회차',activityPeriod(state,'capture')],header];
 const append=(period:string,plan:any,items:any[],status:string,all=false)=>{for(const r of plan.rows||[])for(const item of items){const qty=Number(r.qty?.[item.id]||0);if(all||qty>0)payouts.push([period,r.member.name,item.name,qty,item.kind==='market'?Number(item.price):'',item.kind==='market'?qty*item.price:'',basis[(item.basis||'trophy') as keyof typeof basis],r.share*100,Number(r.target),Number(r.deficit),separateAllocation(item)?Number(r.pools?.[!item.basis||item.basis==='trophy'?item.id:item.id+':'+item.basis]||0):'',status,r.points?.race??'미기록']);}};
 try{append(state.period,allocate(state,activities),selectedItems(state),'미확정',true)}catch(e){payouts.push(['계산 대기: '+(e instanceof Error?e.message:'입력 확인 필요')]);}
 payouts.push([],['정산 기록 · 확정 이력'],header);
 for(const h of state.history)append(h.period,h.plan,h.items||[],'확정');
 payouts.push([],['확정 당시 상자·교환권 평가 근거'],['회차','창고 아이템','평가 방식','보상','추첨 묶음','확정 여부','획득 수량','확률 (%)','당시 블다/개','당시 아이템 블다/개']);
 for(const h of state.history)for(const i of h.items||[])if(valuationMethod(i)==='expected')for(const r of i.valueEvaluation?.rewards||[])payouts.push([h.period,i.name,(i.rewardRecipe?.valuationNote?i.rewardRecipe.valuationNote+' · 냥혼석 3,000 가정 시 '+i.valueEvaluation?.assumptionHigh+' 블다':'')|| (i.rewardRecipe?.mode==='choice'?'선택형 최고 가치':'확률 기대값'),r.name,r.group||'1',r.guaranteed?'확정':'선택/랜덤',r.qty,r.guaranteed?100:i.rewardRecipe?.mode==='choice'?'선택':r.chance,r.price,i.price]);
 if(!state.history.length)payouts.push(['확정한 정산 기록이 없습니다.']);
 payouts.push([],['인별 권리와 블다 이월은 아이템 행마다 반복 표시됩니다. 합산하지 마세요.']);
 const inventory:Row[]=[[],['창고 아이템'],[notice],[],['아이템','분배 방식','창고 수량','블다/개','창고 가치','분배 기준',...attributeHeaders,'추가옵션 등급 목록','가치 평가','시세 연결','보상 평가 방식','참여자 최소 지급']];
 state.items.forEach((i:any)=>inventory.push([i.name,i.kind==='market'?'블다 가치 분배':'종류별 분배',Number(i.qty),Number(i.price),i.qty*i.price,basis[(i.basis||'trophy') as keyof typeof basis],...attributeCells(i.attributes),(i.attributes?.options||[]).map((o:any)=>o.grade).join(' / '),valuationMethod(i)==='expected'?'보상 기대값':valuationMethod(i)==='catalog'?'시세 DB 연동':'수동 단가',i.catalogName||i.catalogId||'',valuationMethod(i)==='expected'?((i.rewardRecipe?.valuationNote?i.rewardRecipe.valuationNote+' · 냥혼석 3,000 가정 시 '+i.valueEvaluation?.assumptionHigh+' 블다':'')|| (i.rewardRecipe?.mode==='choice'?'선택형 최고 가치':'확률 기대값')):'',minimumEach(i)?'최소 1개 · 나머지 포인트 비례':'없음']));
 inventory.push([],['상자·교환권 보상 평가 근거'],['창고 아이템','평가 방식','보상','추첨 묶음','확정 여부','획득 수량','확률 (%)','블다/개','시세 연결','조사 시각','보상 가치','확률 가중 가치']);
 for(const i of state.items)if(valuationMethod(i)==='expected')for(const r of i.valueEvaluation?.rewards||[])inventory.push([i.name,i.rewardRecipe.mode==='choice'?'선택형 최고 가치':'확률 기대값',r.name,r.group||'1',r.guaranteed?'확정':'선택/랜덤',r.qty,r.guaranteed?100:i.rewardRecipe.mode==='choice'?'선택':r.chance,r.price,r.estimateNote||r.catalogId||'',r.priceObservedAt?date(r.priceObservedAt):'',r.value,i.rewardRecipe.mode==='choice'?'묶음별 최고 가치 적용':r.expected]);
 const market:Row[]=[[],['아이템 시세 DB'],[notice],[],['최신 시세 · 창고와 독립적으로 등록'],['아이템','블다/개','조사 시각','메모',...attributeHeaders,'추가옵션 등급 목록']];
 latestCatalog(prices).forEach((p:any)=>market.push([p.item_name,Number(p.unit_price),date(p.observed_at),p.note,...attributeCells(p.attributes),(p.attributes?.options||[]).map((o:any)=>o.grade).join(' / ')]));
 market.push([],['직접 조사한 가격입니다. 예시 가격은 실제 시세가 아닙니다.'],['시세 조사 이력'],['조사 시각','아이템','블다/개','메모']);prices.forEach(p=>market.push([date(p.observed_at),p.item_name,Number(p.unit_price),p.note]));if(!prices.length)market.push(['저장된 시세 이력이 없습니다.']);
 return {'길드·길드원·활동':members,'지급표·정산':payouts,'창고 아이템':inventory,'아이템 시세 DB':market};
}
async function writeSnapshot(){
 await preserveLegacy();await getCatalog();const db=database();const [sr,ar,pr]=await db.batch([db.prepare("SELECT * FROM guild_state WHERE id='guild'"),db.prepare('SELECT * FROM activity_points ORDER BY created_at DESC'),db.prepare('SELECT * FROM market_prices ORDER BY observed_at DESC,rowid DESC')]);
 const row=sr.results[0] as any;if(!row)throw Error('웹에서 길드원 정보를 먼저 DB에 저장하세요.');
 const state={...JSON.parse(row.settings_json),members:JSON.parse(row.members_json),history:JSON.parse(row.payouts_json),items:JSON.parse(row.inventory_json)};
 const attributes=await getAttributes();const prices=pr.results.map((p:any)=>({...p,attributes:attributes.get(String(p.item_id))||{}}));
 state.items=applyMarketPrices(state.items,latestCatalog(prices));
 const data=sheetRows(state,ar.results,prices,date(new Date().toISOString()));
 const metadata=await google('?fields=sheets(properties,basicFilter)');const requests:any[]=[];
 const aliases:Record<string,string>={'길드·길드원·활동':'활동 기록·길드원','지급표·정산':'정산 기록','아이템 시세 DB':'시세'};
 let index=0;
 for(const [title,rows] of Object.entries(data)){
  let sheet=metadata.sheets.find((s:any)=>s.properties.title===title)?.properties;
  if(!sheet){sheet=metadata.sheets.find((s:any)=>s.properties.title===aliases[title])?.properties;if(sheet)requests.push({updateSheetProperties:{properties:{sheetId:sheet.sheetId,title},fields:'title'}});}
  const count=Math.max(sheet?.gridProperties.rowCount||1000,rows.length+20),cols=Math.max(12,...rows.map(r=>r.length));
  if(!sheet){const used=metadata.sheets.map((s:any)=>s.properties.sheetId);let sheetId;do{sheetId=crypto.getRandomValues(new Uint32Array(1))[0]%2000000000}while(used.includes(sheetId));sheet={sheetId,gridProperties:{rowCount:count,columnCount:cols}};requests.push({addSheet:{properties:{sheetId,title,gridProperties:{rowCount:count,columnCount:cols,frozenRowCount:3,hideGridlines:true}}}});}
  requests.push({updateSheetProperties:{properties:{sheetId:sheet.sheetId,index:index++,gridProperties:{rowCount:count,columnCount:Math.max(cols,sheet.gridProperties.columnCount||cols),frozenRowCount:3,hideGridlines:true}},fields:'index,gridProperties'}});
  const range={sheetId:sheet.sheetId,startRowIndex:0,endRowIndex:count,startColumnIndex:0,endColumnIndex:cols};
  requests.push({unmergeCells:{range:{sheetId:sheet.sheetId}}});
  requests.push({updateCells:{range,rows:rows.map(r=>({values:r.map(v=>({userEnteredValue:typeof v==='number'?{numberValue:v}:typeof v==='boolean'?{boolValue:v}:{stringValue:String(v??'')}}))})),fields:'userEnteredValue'}});
  if(title==='창고 아이템'||title==='아이템 시세 DB'){
   const startRowIndex=title==='창고 아이템'?4:5;
   const endRowIndex=title==='창고 아이템'?5+state.items.length:6+latestCatalog(prices).length;
   const original=metadata.sheets.find((s:any)=>s.properties.sheetId===sheet.sheetId)?.basicFilter;
   requests.push({setBasicFilter:{filter:{...original,range:{sheetId:sheet.sheetId,startRowIndex,endRowIndex:Math.max(startRowIndex+1,endRowIndex),startColumnIndex:0,endColumnIndex:rows[startRowIndex].length}}}});
  }
  const authored={...range,endRowIndex:rows.length};
  requests.push({repeatCell:{range:authored,cell:{userEnteredFormat:{backgroundColor:{red:1,green:1,blue:1},textFormat:{fontFamily:'Arial',fontSize:11,foregroundColor:{red:.1,green:.16,blue:.24}},wrapStrategy:'WRAP',verticalAlignment:'TOP'}},fields:'userEnteredFormat'}});
  requests.push({updateDimensionProperties:{range:{sheetId:sheet.sheetId,dimension:'COLUMNS',startIndex:0,endIndex:cols},properties:{pixelSize:150},fields:'pixelSize'}});
  requests.push({mergeCells:{range:{sheetId:sheet.sheetId,startRowIndex:2,endRowIndex:3,startColumnIndex:0,endColumnIndex:cols},mergeType:'MERGE_ALL'}});
  requests.push({repeatCell:{range:{...authored,startRowIndex:1,endRowIndex:2},cell:{userEnteredFormat:{textFormat:{fontSize:16,bold:true,foregroundColor:{red:.12,green:.28,blue:.5}}}},fields:'userEnteredFormat.textFormat'}});
  for(let r=4;r<rows.length;r++){const row=rows[r];if(row[0]==='닉네임'||row[0]==='회차'&&row.length===12||row[0]==='회차'&&row[1]==='닉네임'||row[0]==='아이템'||row[0]==='조사 시각'||row[0]==='현재 레벨'||row.length===1&&row[0]&&!String(row[0]).includes('없습니다')&&!String(row[0]).includes('미등록'))requests.push({repeatCell:{range:{...authored,startRowIndex:r,endRowIndex:r+1},cell:{userEnteredFormat:{backgroundColor:{red:.92,green:.95,blue:.99},textFormat:{bold:true,foregroundColor:{red:.15,green:.25,blue:.4}}}},fields:'userEnteredFormat.backgroundColor,userEnteredFormat.textFormat.bold,userEnteredFormat.textFormat.foregroundColor'}});}
 }
 // One atomic request replaces owned values and clears obsolete rows, without deleting existing tabs.
 await google(':batchUpdate',{requests});
}
export async function markSheetDirty(){await database().prepare("INSERT INTO sheet_sync (id,requested,completed,lock_until) VALUES ('guild',1,0,0) ON CONFLICT(id) DO UPDATE SET requested=requested+1").run();}
export async function syncStatus(){const r=await database().prepare("SELECT requested,completed,lock_until,last_success,last_error FROM sheet_sync WHERE id='guild'").first<any>();const id=await sheetId();return {configured:!!(env.GOOGLE_SERVICE_ACCOUNT_EMAIL&&env.GOOGLE_PRIVATE_KEY&&id),sheetUrl:id?'https://docs.google.com/spreadsheets/d/'+id+'/edit':null,serviceAccount:env.GOOGLE_SERVICE_ACCOUNT_EMAIL||'',canConfigure:guildContext()?.role==='owner',pending:!!r&&r.requested>r.completed,running:!!r&&r.lock_until>Date.now(),lastSuccess:r?.last_success||null,error:r?.last_error||null};}
export async function runSheetSync(){
 if(!await sheetId())return;
 const db=database(),id=crypto.randomUUID();
 // Lease outlasts all bounded outbound requests. Other writers mark dirty and leave the current runner to catch up.
 const lock=await db.prepare("UPDATE sheet_sync SET lock_token=?,lock_until=? WHERE id='guild' AND lock_until<?").bind(id,Date.now()+180000,Date.now()).run();if(!lock.meta.changes)return;
 try{for(let i=0;i<3;i++){
  const s=await db.prepare("SELECT requested,completed FROM sheet_sync WHERE id='guild'").first<any>();if(s.requested<=s.completed)break;
  await writeSnapshot();await db.prepare("UPDATE sheet_sync SET completed=?,last_success=?,last_error=NULL WHERE id='guild' AND lock_token=?").bind(s.requested,new Date().toISOString(),id).run();
 }}catch(e){const message=e instanceof Error?e.message:'';console.error('Sheet sync failed',message.slice(0,600));const safe=/^(구글|GOOGLE_PRIVATE_KEY|GOOGLE_SHEET_ID|이 길드의 구글시트|웹에서 길드원)/.test(message)?message.slice(0,300):'시트 데이터 작성 중 오류가 발생했습니다. 관리자에게 문의하세요.';await db.prepare("UPDATE sheet_sync SET last_error=? WHERE id='guild' AND lock_token=?").bind(safe,id).run();}
 finally{await db.prepare("UPDATE sheet_sync SET lock_until=0,lock_token=NULL WHERE id='guild' AND lock_token=?").bind(id).run();}
}
