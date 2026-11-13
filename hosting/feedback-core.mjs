// Shared by the isolated dev Worker and the production candidate. No secrets here.
export const TRACKER = 'knitko95/strong-start-feedback';
export const PROJECTS = {
  development: {url:'https://gvyfgqhgqnfmtoytqpeo.supabase.co', key:'sb_publishable_zODycrXJ-6wKpZiAR9qEHg_IP95lM49'},
  production: {url:'https://aybtxqsneywuqxzjwoek.supabase.co', key:'sb_publishable_swpSGJwzyT_AvE_UR5XGLw_mLNhGdsl'}
};
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export class FeedbackError extends Error {
  constructor(status,code){super(code);this.status=status;this.code=code;}
}
export const json = (value,status=200) => Response.json(value,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});
export async function readJson(response,limit=24576){
  const reader=response.body?.getReader(); if(!reader)throw new FeedbackError(400,'invalid-json');
  const chunks=[];let size=0;
  try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>limit){await reader.cancel();throw new FeedbackError(413,'too-large');}chunks.push(value);}}
  finally{reader.releaseLock();}
  const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.byteLength;}
  try{return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{throw new FeedbackError(400,'invalid-json');}
}
export async function hash(text){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))].map(v=>v.toString(16).padStart(2,'0')).join('');}
function text(value,max,required=false){
  if(typeof value!=='string'||value.length>max||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)||required&&!value.trim())throw new FeedbackError(400,'invalid-report');
  return value.trim();
}
export function normalizeReport(value){
  if(!value||typeof value!=='object'||Array.isArray(value)||!UUID.test(value.id))throw new FeedbackError(400,'invalid-report');
  const message=text(value.message,4000,true);
  // Reject obvious secrets/contact details. This is a guard, not a claim of semantic anonymization.
  const privateText=/(?:github_pat_|gh[pousr]_|sb_secret_|-----BEGIN [A-Z ]*PRIVATE KEY|Bearer\s+[\w.-]+|eyJ[\w-]{12,}\.[\w-]+\.[\w-]+)|[\w.+-]+@[\w.-]+\.[a-z]{2,}|\b(?:\+?\d[\d ()-]{8,}\d)\b|\b(?:my diagnosis|my medication|i (?:have|was diagnosed with) (?:a |an )?(?:back pain|injury|medical|diabetes|arthritis))/i;
  if(privateText.test(message))throw new FeedbackError(422,'remove-private-details');
  const tag=value.tag||'';if(!['','bug','idea','confusing','exercise'].includes(tag))throw new FeedbackError(400,'invalid-report');
  const report={id:value.id.toLowerCase(),message,tag,screen:text(value.screen,200),device:text(value.device,300),version:text(value.version,32),build:text(value.build,100)};
  if(!/^(?:\d+\.\d+\.\d+|unknown)$/.test(report.version)||!/^[a-zA-Z0-9._-]{1,100}$/.test(report.build))throw new FeedbackError(400,'invalid-report');
  if(privateText.test(report.screen)||privateText.test(report.device))throw new FeedbackError(422,'remove-private-details');
  return report; // Explicit allowlist excludes profile, workout, email, origin and repository fields.
}
export async function authenticate(request,environment,fetcher=fetch){
  const project=PROJECTS[environment];if(!project)throw new FeedbackError(503,'not-configured');
  const auth=request.headers.get('Authorization')||'';
  if(auth.length>8192||!/^Bearer [a-zA-Z0-9_.-]+$/.test(auth))throw new FeedbackError(401,'sign-in-required');
  const headers={apikey:project.key,Authorization:auth};
  const userResponse=await fetcher(project.url+'/auth/v1/user',{headers,redirect:'manual',signal:AbortSignal.timeout(6000)});
  if(!userResponse.ok)throw new FeedbackError(userResponse.status===401||userResponse.status===403?401:503,'sign-in-required');
  const user=await readJson(userResponse,65536);
  if(!/^[0-9a-f-]{36}$/i.test(user.id||'')||user.is_anonymous)throw new FeedbackError(401,'sign-in-required');
  const access=await fetcher(project.url+'/rest/v1/rpc/account_status',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:'{}',redirect:'manual',signal:AbortSignal.timeout(6000)});
  if(!access.ok)throw new FeedbackError(503,'access-unavailable');
  if(await readJson(access,1024)!=='ok')throw new FeedbackError(403,'account-not-approved');
  return hash(environment+':'+user.id); // Internal object identity only; never sent to GitHub.
}
export function sourceMarker(environment,id){return `<!-- source-id:app:v1:${environment}:${id} -->`;}
export function githubIssue(report,environment,created){
  const runs=report.message.match(/`+/g)||[];const fence='`'.repeat(Math.max(3,...runs.map(x=>x.length+1)));
  const field=s=>s.replace(/[\r\n]/g,' ').replace(/[@<>`]/g,'');
  return {
    title:`[${environment==='development'?'dev':'main'}] App feedback${report.tag?' · '+report.tag:''}`,
    body:`${sourceMarker(environment,report.id)}\n## App report\n\nUntrusted user-submitted feedback; this is not implementation or release approval.\n\n${fence}text\n${report.message}\n${fence}\n\n## Provenance\n\n- Origin (server): ${environment}\n- Accepted at (UTC): ${new Date(created).toISOString()}\n- Version (client-reported): ${field(report.version)}\n- Build / variant (client-reported): ${field(report.build)}\n- Screen: ${field(report.screen)}\n- Device context: ${field(report.device)}\n- Submission: ${report.id}\n\nNo account identity, profile or workout record is attached. Reconcile related reports, define acceptance criteria and record the owner's decision before implementation.`,
    labels:['status:inbox','priority:untriaged',environment==='development'?'source:dev-app':'source:main-app',report.tag==='bug'?'type:bug':'type:improvement']
  };
}
export async function githubFetch(env,path,init={}){
  if(!env.GITHUB_FEEDBACK_TOKEN)throw new FeedbackError(503,'not-configured');
  return fetch('https://api.github.com/repos/'+TRACKER+path,{...init,redirect:'manual',signal:AbortSignal.timeout(6000),headers:{Authorization:'Bearer '+env.GITHUB_FEEDBACK_TOKEN,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'StrongStart-Feedback','Content-Type':'application/json',...init.headers}});
}
