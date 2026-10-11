const tables=['guild_state','market_prices','activity_points','item_attributes','sheet_sync'];
export function guildSQL(sql,guildId){
 if(!/^(legacy|[a-f0-9-]{36})$/.test(guildId))throw Error('잘못된 길드 식별자');
 const table=tables.find(t=>new RegExp('\\b'+t+'\\b','i').test(sql));if(!table)throw Error('Unscoped table requires explicit administrative access');
 const literal="'"+guildId+"'";
 if(table==='guild_state'||table==='sheet_sync')sql=sql.replace(/'guild'/g,guildId==='legacy'?"'guild'":literal);
 if(/^\s*SELECT/i.test(sql))for(const t of tables)sql=sql.replace(new RegExp('FROM\\s+'+t+'\\b','gi'),'FROM (SELECT rowid AS rowid,* FROM '+t+' WHERE guild_id='+literal+')');
 else if(/^\s*UPDATE/i.test(sql)){if(!/\bWHERE\b/i.test(sql))throw Error('Scoped update requires WHERE');sql=sql.replace(/\bWHERE\b/i,'WHERE guild_id='+literal+' AND ');}
 else if(/^\s*INSERT/i.test(sql)){
  sql=sql.replace(new RegExp('('+table+'\\s*\\()','i'),'$1guild_id,');sql=sql.replace(/VALUES\s*\(/i,'VALUES ('+literal+',');
  if(/ON CONFLICT/i.test(sql)){const conflict=sql.slice(sql.search(/ON CONFLICT/i));sql+=(/\bDO UPDATE\b[\s\S]*\bWHERE\b/i.test(conflict)?' AND ':' WHERE ')+table+'.guild_id='+literal;}
 }else throw Error('지원하지 않는 길드 쿼리');
 return sql;
}
