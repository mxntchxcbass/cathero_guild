import {rawDatabase} from '../db/raw';
import {localSession,withLocalIdentity} from '../lib/local-auth';
import {apiPolicy,bodyTooLarge,securityHeaders} from '../lib/security-policy.mjs';
import {withGuild} from '../lib/guild-context';
import {accessGuild} from '../lib/workspaces';
import handler from "vinext/server/fetch-handler";
import { runWithConnectorBinding } from "../lib/connector-context";
import type { ConnectorBinding } from "../lib/connector-contract.mjs";

import {markSheetDirty,runSheetSync} from "../lib/sheet-sync";

const worker = {
  async dispatch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext<{ CONNECTORS?: ConnectorBinding }>) {
    let binding = ctx.props?.CONNECTORS;
    // Local preview emulates the same request-scoped capability. This branch and
    // the auxiliary service binding are absent from production builds.
    if (import.meta.env.DEV && !binding && env.CONNECTORS) {
      const preview = env.CONNECTORS;
      const expiresAt = Date.now() + 60_000;
      binding = {
        async getContext() {
          if (Date.now() >= expiresAt) return { status: "request_context_expired" };
          return preview.getContext?.() ?? { status: "binding_unavailable" };
        },
        async invoke(connectorId, actionName, args) {
          if (Date.now() >= expiresAt) {
            return { status: "request_context_expired", message: "This request has expired. Please try again." };
          }
          return preview.invoke(connectorId, actionName, args);
        },
      };
    }
    const uid=request.headers.get('oai-authenticated-user-id'),email=request.headers.get('oai-authenticated-user-email');
    const path=new URL(request.url).pathname.replace(/\/+$/,'');
    const local=await localSession(request.headers.get('cookie')||'');
    if(path.startsWith('/api/')&&await bodyTooLarge(request))return Response.json({error:'요청 크기가 너무 큽니다.'},{status:413});
    return withLocalIdentity(local,async()=>{
      const guild=local?{id:local.guildId,role:local.role==='admin'?'owner':local.role,email:''}:(uid&&email&&!await rawDatabase().prepare("SELECT id FROM local_credentials WHERE id='platform:admin'").first()?await accessGuild(uid,email,request.headers.get('cookie')||''):{id:'none',role:'none',email:''});
      const denied=apiPolicy(request,!!local||!!uid&&!!email,guild.role);if(denied)return Response.json({error:denied.error},{status:denied.status});
      return withGuild(guild,async()=>{
        const response=await runWithConnectorBinding(binding,()=>handler.fetch(request,env,ctx));
        if(!import.meta.env.DEV&&response.ok&&path==='/api/price-requests'&&request.method==='PATCH'){const data=await response.clone().json() as {guildId?:string};if(data.guildId)await withGuild({id:data.guildId,role:'service',email:''},async()=>{await markSheetDirty();ctx.waitUntil(runSheetSync())})}
        if(!import.meta.env.DEV&&response.ok&&['PUT','POST','PATCH'].includes(request.method)&&/^\/api\/(state|activities|prices)$/.test(path)){try{await markSheetDirty();ctx.waitUntil(runSheetSync())}catch{console.error('Could not queue Sheet sync')}}return response;
      });
    });
  },
};

export default {async fetch(request:Request,env:Cloudflare.Env,ctx:ExecutionContext<{CONNECTORS?:ConnectorBinding}>){
 let response:Response;try{response=await worker.dispatch(request,env,ctx)}catch{console.error('Request failed');response=Response.json({error:'요청 처리 실패'},{status:503})}
 const nonce=Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b=>b.toString(16).padStart(2,'0')).join('');
 const headers=new Headers(response.headers);for(const [name,value] of Object.entries(securityHeaders(nonce)))headers.set(name,value);
 if(new URL(request.url).pathname.startsWith('/api/')||headers.get('content-type')?.includes('text/html')){headers.set('Cache-Control','private, no-store');headers.append('Vary','Cookie');}
 response=new Response(response.body,{status:response.status,statusText:response.statusText,headers});
 if(headers.get('content-type')?.includes('text/html'))response=new HTMLRewriter().on('script',{element(el){el.setAttribute('nonce',nonce)}}).transform(response);
 return response;
}};
