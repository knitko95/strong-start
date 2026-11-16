import {HostedPoseStore} from './pose-review-store.mjs';
import {sha,ReviewError,assert,parseJSON,validId} from '../scripts/lib/pose-review-core.mjs';
import {PROJECTS} from './feedback-core.mjs';
import catalogue from './pose-review-catalogue.json' with {type:'json'};

const BASE='/api/pose-review/',COOKIE='__Host-pose-review';
const random=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Cross-Origin-Resource-Policy':'same-origin','X-Robots-Tag':'noindex, nofollow'};
const json=(data,status=200,extra={})=>new Response(JSON.stringify(data),{status,headers:{...headers,'Content-Type':'application/json',...extra}});
const cookie=(value,age)=>`${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${age}`;
async function body(request,max=2_000_000){assert(/^application\/json(?:;|$)/i.test(request.headers.get('Content-Type')||''),'JSON required',415);const chunks=[];let n=0;for await(const c of request.body||[]){n+=c.length;assert(n<=max,'Request too large',413);chunks.push(c);}return parseJSON(Buffer.concat(chunks).toString(),max);}
export async function identity(request,env){
 const bearer=request.headers.get('Authorization')?.match(/^Bearer (pose_[a-f0-9]{64})$/)?.[1];
 if(bearer){const digest=sha(bearer);const bootstrap=await env.POSE_DB.prepare("SELECT value FROM pose_settings WHERE key='migration-token'").first();if(bootstrap?.value===digest)return {role:'migration',actor:'migration',csrf:null};
  const a=await env.POSE_DB.prepare('SELECT worker FROM pose_agents WHERE digest=? AND expires>?').bind(digest,Date.now()).first();assert(a,'Agent credential invalid or expired',401);return {role:'agent',worker:a.worker,actor:'agent:'+a.worker,csrf:null};}
 const raw=(request.headers.get('Cookie')||'').split(';').map(v=>v.trim()).find(v=>v.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);assert(raw&&/^[a-f0-9]{64}$/.test(raw),'Sign in to the private workspace',401);
 const session=await env.POSE_DB.prepare('SELECT actor,csrf FROM pose_sessions WHERE digest=? AND expires>?').bind(sha(raw),Date.now()).first();assert(session,'Sign-in expired',401);return {role:'owner',...session};
}
export async function poseFetch(request,env){
 const url=new URL(request.url),path=url.pathname,store=new HostedPoseStore(env);
 try{
  assert(env.FEEDBACK_ENVIRONMENT==='development'&&env.POSE_DB&&env.POSE_FILES,'Private authoring is unavailable',503);
  const origin=request.headers.get('Origin');assert(!origin||origin===url.origin,'Cross-origin authoring denied',403);assert(request.method!=='OPTIONS','Cross-origin authoring denied',403);
  const action=path.startsWith(BASE)?path.slice(BASE.length):null;
  if(action==='config'&&request.method==='GET')return json({hosted:true,auth:PROJECTS.development});
  if(action==='login'&&request.method==='POST'){
   assert(origin===url.origin,'Same-origin sign-in required',403);const input=await body(request,10000);assert(typeof input.accessToken==='string'&&input.accessToken.length<8000,'Sign-in required',401);
   const p=PROJECTS.development,response=await fetch(p.url+'/auth/v1/user',{headers:{apikey:p.key,Authorization:'Bearer '+input.accessToken},signal:AbortSignal.timeout(10000)});assert(response.ok,'Sign-in could not be verified',401);const user=await response.json();
   const allowlist=await env.POSE_DB.prepare("SELECT value FROM pose_settings WHERE key='owner-emails'").first();const allowed=(allowlist?.value||'').toLowerCase().split(',').map(s=>s.trim()).filter(Boolean);
   const google=user.identities?.find(i=>i.provider==='google'&&i.identity_data?.email_verified===true&&allowed.includes(String(i.identity_data.email).toLowerCase()));
   assert(!user.is_anonymous&&user.email_confirmed_at&&google&&google.user_id===user.id,'This Google account is not authorized for review',403);
   const token=random(),csrf=random();await env.POSE_DB.prepare('INSERT INTO pose_sessions(digest,actor,csrf,expires) VALUES(?,?,?,?)').bind(sha(token),'owner:'+user.id,csrf,Date.now()+86400000).run();return json({ok:true},200,{'Set-Cookie':cookie(token,86400)});
  }
  const who=await identity(request,env);
  if(request.method==='POST'||request.method==='PUT'){
   if(who.role==='owner')assert(origin===url.origin&&request.headers.get('X-Pose-Review-Token')===who.csrf,'Refresh workspace before saving',403);
   else assert(!origin,'Agent credentials cannot be used by browser origins',403);
  }
  if(path.startsWith('/workspace/')){assert(['GET','HEAD'].includes(request.method),'Read only',405);const {row,bytes}=await store.bytes(path);return new Response(request.method==='HEAD'?null:bytes,{headers:{...headers,'Content-Type':row.mime,ETag:'"'+row.digest+'"'}});}
  if(request.method==='GET'){
   if(action==='state')return json({schemaVersion:1,mode:'workspace',hosted:true,token:who.csrf,role:who.role,exercises:await store.list()});
   if(action==='record')return json({record:await store.get(url.searchParams.get('id'))});
   if(action==='files')return json({files:(await env.POSE_DB.prepare('SELECT path,digest,size,mime FROM pose_files ORDER BY path').all()).results});
   if(action==='file'){const {row,bytes}=await store.bytes(url.searchParams.get('path'));return new Response(bytes,{headers:{...headers,'Content-Type':row.mime,'Content-Disposition':'attachment',ETag:'"'+row.digest+'"'}});}
   if(action==='agents'){assert(who.role==='owner','Owner only',403);return json({agents:(await env.POSE_DB.prepare('SELECT worker,created,expires FROM pose_agents ORDER BY worker').all()).results});}
   throw new ReviewError('Unknown action',404);
  }
  if(request.method==='PUT'&&action==='file'){
   assert(['agent','migration'].includes(who.role),'Agent upload required',403);const p=url.searchParams.get('path');assert(p&&p.length<=1500,'Path required');
   if(who.role==='agent'){const id=p.match(/^\/workspace\/([a-z0-9-]+)\//)?.[1];if(id){assert((await store.get(id)).assignment?.worker===who.worker,'Claim exercise before uploading',403);}else assert(/^\/archive\/[a-f0-9]{64}\/[a-zA-Z0-9_.-]+$/.test(p),'Use a content-addressed archive path',403);}
   const chunks=[];let size=0;for await(const c of request.body||[]){size+=c.length;assert(size<=25_000_000,'File exceeds 25 MB',413);chunks.push(c);}return json(await store.upload(p,Buffer.concat(chunks),request.headers.get('Content-Type')||'application/octet-stream'));
  }
  assert(request.method==='POST','Method not allowed',405);const input=await body(request,action==='reference-images'?7_000_000:2_000_000);
  if(action==='migrate'){assert(who.role==='migration','Migration credential required',403);return json({record:await store.migrate(input.record)});}
  if(action==='migration-complete'){assert(who.role==='migration','Migration credential required',403);await env.POSE_DB.prepare("DELETE FROM pose_settings WHERE key='migration-token'").run();return json({ok:true});}
  if(action==='decision'){assert(who.role==='owner','Only the owner can review',403);return json({record:await store.mutate(input.id,input.expectedRevision,who.actor,r=>store.decision(r,input))});}
  if(action==='reference-images'){assert(who.role==='owner','Only the owner can attach review references',403);return json({record:await store.reference(input,who.actor)});}
  if(action==='logout'){assert(who.role==='owner','Owner session required',403);const raw=(request.headers.get('Cookie')||'').split(';').map(s=>s.trim()).find(s=>s.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);await env.POSE_DB.prepare('DELETE FROM pose_sessions WHERE digest=?').bind(sha(raw||'')).run();return json({ok:true},200,{'Set-Cookie':cookie('',0)});}
  if(action==='agent-create'||action==='agent-revoke'){
   assert(who.role==='owner','Only the owner manages agent access',403);assert(validId(input.worker),'Use a short agent name');
   if(action==='agent-revoke'){await env.POSE_DB.prepare('DELETE FROM pose_agents WHERE worker=?').bind(input.worker).run();return json({ok:true});}
   const token='pose_'+random(),created=Date.now(),expires=created+30*86400000;await env.POSE_DB.prepare('INSERT INTO pose_agents(digest,worker,created,expires) VALUES(?,?,?,?) ON CONFLICT(worker) DO UPDATE SET digest=excluded.digest,created=excluded.created,expires=excluded.expires').bind(sha(token),input.worker,created,expires).run();return json({worker:input.worker,token,expires});
  }
  assert(who.role==='agent','Agent credential required',403);
  if(action==='claim')return json({record:await store.claim(input,who.worker,catalogue)});
  if(action==='release')return json({record:await store.release(input,who.worker)});
  if(action==='candidate')return json({record:await store.candidate(input,who.worker)});
  if(action==='audit')return json({record:await store.audit(input,who.worker)});
  throw new ReviewError('Unknown action',404);
 }catch(e){if(!(e instanceof ReviewError))console.warn(JSON.stringify({event:'pose.request_failed',name:e.name}));return json({error:e instanceof ReviewError?e.message:'Workspace temporarily unavailable'},e.status||503);}
}
