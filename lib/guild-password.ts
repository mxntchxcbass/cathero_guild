import {rawDatabase} from '../db/raw';
import {env} from 'cloudflare:workers';
import {passwordHash,sessionCookie as signCookie,passwordSession as verifyCookie} from './password-crypto.mjs';
export {validPassword,passwordHash,safeEqual} from './password-crypto.mjs';
export async function passwordRecord(id:string){return rawDatabase().prepare('SELECT salt,password_hash FROM guild_passwords WHERE guild_id=?').bind(id).first<{salt:string,password_hash:string}>();}
export async function preparePassword(id:string,password:string){const salt=Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b=>b.toString(16).padStart(2,'0')).join(''),hash=await passwordHash(password,salt);const statement=rawDatabase().prepare('INSERT INTO guild_passwords(guild_id,salt,password_hash,updated_at) VALUES(?,?,?,?) ON CONFLICT(guild_id) DO UPDATE SET salt=excluded.salt,password_hash=excluded.password_hash,updated_at=excluded.updated_at').bind(id,salt,hash,new Date().toISOString());return {hash,statement};}
export async function storePassword(id:string,password:string){const {hash,statement}=await preparePassword(id,password);await statement.run();return hash;}

export const sessionCookie=(id:string,userId:string,hash:string)=>signCookie(id,userId,hash,env.GUILD_SESSION_SECRET);
export const passwordSession=(id:string,userId:string,cookie:string,hash:string)=>verifyCookie(id,userId,cookie,hash,env.GUILD_SESSION_SECRET);
