import {env} from 'cloudflare:workers';
import {guildContext} from '../lib/guild-context';
import {guildSQL} from '../lib/guild-sql.mjs';
export function rawDatabase(){if(!env.DB)throw Error('Database unavailable');return env.DB}
export function database(){const db=rawDatabase(),guild=guildContext();if(!guild||!['owner','editor','viewer','service'].includes(guild.role)||guild.id==='none')throw Error('Authorized guild context required');
 return {prepare(sql:string){if(guild.role==='viewer'&&!/^\s*SELECT\b/i.test(sql))throw Error('Read-only guild access');const table=/\b(guild_state|sheet_sync)\b/.test(sql);const statement=db.prepare(guildSQL(sql,/\b(market_prices|item_attributes)\b/i.test(sql)?'legacy':guild.id));const bind=statement.bind.bind(statement);statement.bind=(...values:any[])=>bind(...values.map(v=>table&&v==='guild'&&guild.id!=='legacy'?guild.id:v));return statement;},batch:(queries:D1PreparedStatement[])=>db.batch(queries)} as D1Database;
}
