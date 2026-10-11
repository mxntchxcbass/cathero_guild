const writes=new Set(['POST','PUT','PATCH','DELETE']);
export function apiPolicy(request,authenticated,role){
 const url=new URL(request.url),path=url.pathname.replace(/\/+$/,'');
 if(!path.startsWith('/api/'))return null;
 const gateway=path==='/api/guilds'||path==='/api/local-auth';
 if(!authenticated&&!gateway)return {status:401,error:'로그인이 필요합니다.'};
 if(request.headers.get('sec-fetch-site')==='cross-site'||(request.headers.has('origin')&&request.headers.get('origin')!==url.origin))return {status:403,error:'잘못된 요청 출처'};
 if(writes.has(request.method)){
  if(request.headers.get('origin')!==url.origin)return {status:403,error:'잘못된 요청 출처'};
  if(request.body&&!/^application\/json(?:;|$)/i.test(request.headers.get('content-type')||''))return {status:415,error:'JSON 요청만 허용됩니다.'};
 }
 if(!['GET','POST','PUT','PATCH','DELETE'].includes(request.method))return {status:405,error:'지원하지 않는 요청 방식'};
 if(!gateway&&!['owner','editor','viewer'].includes(role))return {status:403,error:'길드 비밀번호로 입장하세요.'};
 if(!gateway&&writes.has(request.method)&&role==='viewer'&&!(['/api/questions','/api/price-requests','/api/suggestions'].includes(path)&&request.method==='POST'))return {status:403,error:'조회 권한입니다. 관리자에게 수정 요청하세요.'};
 return null;
}
export function bodyLimit(path){return path==='/api/state'?4_000_000:path==='/api/prices'?512_000:32_000;}
export async function bodyTooLarge(request){if(!request.body)return false;const limit=bodyLimit(new URL(request.url).pathname);if(Number(request.headers.get('content-length')||0)>limit)return true;const reader=request.clone().body.getReader();let size=0;try{while(true){const {value,done}=await reader.read();if(done)return false;size+=value.byteLength;if(size>limit)return true;}}finally{void reader.cancel();}}
export function securityHeaders(nonce){return {
 'X-Content-Type-Options':'nosniff',
 'Referrer-Policy':'same-origin',
 'Permissions-Policy':'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
 'Strict-Transport-Security':'max-age=31536000',
 'Content-Security-Policy':`default-src 'self'; script-src 'self'${nonce?" 'nonce-"+nonce+"'":''}; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self' https://chatgpt.com https://*.chatgpt.com`,
 };}
