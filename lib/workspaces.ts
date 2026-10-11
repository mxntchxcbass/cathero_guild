import {localIdentity} from './local-auth';
import {env} from 'cloudflare:workers';
import {passwordRecord,passwordSession} from './guild-password';
import {rawDatabase} from '../db/raw';
import type {GuildContext} from './guild-context';
export async function preserveLegacy(){const db=rawDatabase();const existing=await db.prepare("SELECT id FROM workspace_backups WHERE id='before-multi-guild'").first();if(existing)return;
 const names=['guild_state','activity_points','market_prices','item_attributes','sheet_sync'];const data=await db.batch(names.map(t=>db.prepare('SELECT * FROM '+t+" WHERE guild_id='legacy'")));const snapshot=Object.fromEntries(names.map((n,i)=>[n,data[i].results]));await db.prepare('INSERT OR IGNORE INTO workspace_backups(id,data_json,created_at) VALUES(?,?,?)').bind('before-multi-guild',JSON.stringify(snapshot),new Date().toISOString()).run();
}
export async function accessGuild(userId:string,email:string,cookie:string):Promise<GuildContext>{const db=rawDatabase();email=email.toLowerCase();
 const existing=await db.prepare("SELECT id FROM guild_workspaces WHERE id='legacy'").first();if(!existing){if(!env.PLATFORM_ADMIN_USER_ID||userId!==env.PLATFORM_ADMIN_USER_ID)return {id:'none',role:'none',email};await preserveLegacy();const state=await db.prepare("SELECT settings_json FROM guild_state WHERE id='guild'").first<{settings_json:string}>();const name=state?JSON.parse(state.settings_json).guild?.name||'기존 길드':'기존 길드';await db.batch([db.prepare('INSERT OR IGNORE INTO guild_workspaces(id,name,created_at) VALUES(?,?,?)').bind('legacy',name,new Date().toISOString()),db.prepare('INSERT OR IGNORE INTO guild_access(id,guild_id,email,user_id,role) VALUES(?,?,?,?,?)').bind('legacy-owner','legacy','',userId,'owner')]);}
 const id=cookie.match(/(?:^|;\s*)guild_workspace=(legacy|[a-f0-9-]{36})(?:;|$)/)?.[1];
 await db.prepare("UPDATE guild_access SET email='' WHERE user_id=? AND email<>''").bind(userId).run();
 if(await isPlatformAdmin(userId,email)){const chosen=id||'legacy';if(!await db.prepare('SELECT id FROM guild_workspaces WHERE id=?').bind(chosen).first())throw Error('길드를 찾을 수 없습니다.');const protection=await passwordRecord(chosen);if(!protection||!await passwordSession(chosen,userId,cookie,protection.password_hash))return {id:'none',role:'none',email};return {id:chosen,role:'owner',email};}
 const rows=await db.prepare("SELECT guild_id,role,email,user_id FROM guild_access WHERE (user_id=? OR (user_id IS NULL AND email=?)) AND role IN ('owner','editor','viewer')").bind(userId,email).all<{guild_id:string,role:string,email:string,user_id:string|null}>();
 const member=id?rows.results.find(r=>r.guild_id===id):rows.results[0];
 if(id&&!member)return {id:'none',role:'none',email};
 if(!member)return {id:'none',role:'none',email};
 if(!member.user_id)await db.prepare("UPDATE guild_access SET user_id=?,email='' WHERE guild_id=? AND email=? AND user_id IS NULL").bind(userId,member.guild_id,email).run();
 const protection=await passwordRecord(member.guild_id);if(!protection||!await passwordSession(member.guild_id,userId,cookie,protection.password_hash))return {id:'none',role:'none',email};
 return {id:member.guild_id,role:member.role,email};
}
export async function isPlatformAdmin(userId:string,email:string){if(localIdentity()?.role==='admin')return true;if(await rawDatabase().prepare("SELECT id FROM local_credentials WHERE id='platform:admin'").first())return false;return !!await rawDatabase().prepare("SELECT id FROM guild_access WHERE id='legacy-owner' AND (user_id=? OR (user_id IS NULL AND email=?))").bind(userId,email.toLowerCase()).first();}
