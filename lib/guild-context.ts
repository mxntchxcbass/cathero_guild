import {AsyncLocalStorage} from 'node:async_hooks';
export type GuildContext={id:string,role:string,email:string};
const context=new AsyncLocalStorage<GuildContext>();
export const guildContext=()=>context.getStore();
export function withGuild<T>(value:GuildContext,fn:()=>T):T{return context.run(value,fn)}
