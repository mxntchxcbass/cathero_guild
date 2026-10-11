export const suggestionTypes=['기능 요청','사용성 개선','오류 제보','기타'];
export const suggestionStatuses={new:'접수',reviewing:'검토 중',planned:'반영 예정',done:'반영 완료',deferred:'보류'};
export function suggestionVisibility(guildId,userId,admin){return admin?{sql:'1=1',values:[]}:{sql:'guild_id=? AND (private=0 OR author_id=?)',values:[guildId,userId]};}
export function validSuggestion(d){return !!d&&suggestionTypes.includes(d.type)&&[['nickname',50],['title',150],['body',4000]].every(([k,n])=>typeof d[k]==='string'&&d[k].trim().length>0&&d[k].length<=n)&&(d.private===undefined||typeof d.private==='boolean');}
