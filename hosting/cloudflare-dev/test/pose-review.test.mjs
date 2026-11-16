import {env} from 'cloudflare:workers';
import {beforeAll,beforeEach,afterAll,describe,it,expect} from 'vitest';
import {setupNetwork} from '@msw/cloudflare';
import {http,HttpResponse} from 'msw';
import schema from '../../pose-review-schema.sql?raw';
import {poseFetch} from '../../pose-review-worker.mjs';
import {HostedPoseStore} from '../../pose-review-store.mjs';
import {sha,fingerprint} from '../../../scripts/lib/pose-review-core.mjs';
import {PROJECTS} from '../../feedback-core.mjs';

const network=setupNetwork(),origin='https://pose.test',owner='00000000-0000-4000-8000-000000000001';
const base={...env,FEEDBACK_ENVIRONMENT:'development'};
const token='pose_'+'b'.repeat(64),session='c'.repeat(64),csrf='d'.repeat(64);
let user;
const call=(action,input,role='owner',extra={})=>poseFetch(new Request(origin+'/api/pose-review/'+action,{method:input===undefined?'GET':'POST',headers:{...(role==='owner'?{Cookie:'__Host-pose-review='+session,Origin:origin,'X-Pose-Review-Token':csrf}:{Authorization:'Bearer '+token}),...(input!==undefined?{'Content-Type':'application/json'}:{}),...extra},...(input!==undefined?{body:JSON.stringify(input)}:{})}),base);
const record=()=>({id:'barbell-back-squat',name:'Barbell Back Squat',revision:0,versions:[],approvedVersionId:null,developmentVersionId:null,productionVersionId:null,review:{versionId:null,status:'unreviewed',note:'',updatedAt:new Date().toISOString()},assignment:null,history:[]});
beforeAll(()=>network.enable());afterAll(()=>network.disable());
beforeEach(async()=>{
 await env.POSE_DB.exec(schema.replace(/\n/g,' '));
 await env.POSE_DB.batch(['pose_records','pose_revisions','pose_files','pose_sessions','pose_agents','pose_settings'].map(t=>env.POSE_DB.prepare('DELETE FROM '+t)));
 await env.POSE_DB.prepare('INSERT INTO pose_settings VALUES(?,?)').bind('owner-emails','owner@example.invalid').run();
 await env.POSE_DB.prepare('INSERT INTO pose_sessions VALUES(?,?,?,?)').bind(sha(session),'owner:'+owner,csrf,Date.now()+3600000).run();
 await env.POSE_DB.prepare('INSERT INTO pose_agents VALUES(?,?,?,?)').bind(sha(token),'generator-1',Date.now(),Date.now()+3600000).run();
 user={id:owner,email_confirmed_at:new Date().toISOString(),is_anonymous:false,identities:[{user_id:owner,provider:'google',identity_data:{email:'owner@example.invalid',email_verified:true}}]};
 network.use(http.get(PROJECTS.development.url+'/auth/v1/user',()=>HttpResponse.json(user)),http.all('*',()=>HttpResponse.error()));
});
describe('private hosted exercise workspace',()=>{
 it('requires auth for records, file listings and private images',async()=>{for(const p of ['/api/pose-review/state','/api/pose-review/files','/workspace/private/frame.png'])expect((await poseFetch(new Request(origin+p),base)).status).toBe(401);});
 it('verifies the authorized Google identity, ignores editable metadata and rejects anonymous/unverified users',async()=>{
  const login=()=>call('login',{accessToken:'synthetic-token'});
  expect((await login()).status).toBe(200);user.identities[0].identity_data.email='other@example.invalid';user.user_metadata={email:'owner@example.invalid',email_verified:true};expect((await login()).status).toBe(403);
  user.identities[0].identity_data.email='owner@example.invalid';user.identities[0].identity_data.email_verified=false;expect((await login()).status).toBe(403);user.identities[0].identity_data.email_verified=true;user.is_anonymous=true;expect((await login()).status).toBe(403);
 });
 it('uses secure HttpOnly cookies and rejects cross-origin or missing CSRF writes',async()=>{
  const response=await call('login',{accessToken:'synthetic-token'});expect(response.headers.get('Set-Cookie')).toContain('HttpOnly; Secure; SameSite=Strict');
  expect((await call('agent-create',{worker:'other'},'owner',{'X-Pose-Review-Token':'wrong'})).status).toBe(403);expect((await call('agent-create',{worker:'other'},'owner',{Origin:'https://evil.test'})).status).toBe(403);
 });
 it('agents can claim but cannot make decisions, manage credentials, import or impersonate workers',async()=>{
  expect((await call('claim',{id:'barbell-back-squat',expectedRevision:0,batch:'synthetic'},'agent')).status).toBe(200);
  const state=await (await call('state',undefined,'agent')).json();expect(state.exercises[0].assignment.worker).toBe('generator-1');
  for(const action of ['decision','agent-create','migrate','reference-images'])expect((await call(action,{},'agent')).status).toBe(403);
  expect((await call('release',{id:'barbell-back-squat',expectedRevision:1,worker:'someone-else'},'owner')).status).toBe(403);
  expect((await call('claim',{id:'barbell-back-squat',expectedRevision:1,batch:'x'},'agent',{Origin:origin})).status).toBe(403);
 });
 it('rejects simultaneous stale claims and preserves prior records in transactional history',async()=>{
  const store=new HostedPoseStore(base);await store.migrate(record());
  const results=await Promise.allSettled([store.claim({id:'barbell-back-squat',expectedRevision:0,batch:'a'},'one',{}),store.claim({id:'barbell-back-squat',expectedRevision:0,batch:'b'},'two',{})]);expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);expect((await store.get('barbell-back-squat')).revision).toBe(1);expect((await env.POSE_DB.prepare('SELECT * FROM pose_revisions').all()).results).toHaveLength(1);
 });
 it('stores immutable R2 bytes and verifies hashes on read and registration',async()=>{
  const store=new HostedPoseStore(base);const p='/archive/'+sha('original')+'/source.txt';await store.upload(p,Buffer.from('original'),'text/plain');expect((await store.bytes(p)).bytes.toString()).toBe('original');await expect(store.upload(p,Buffer.from('replacement'),'text/plain')).rejects.toThrow('immutable');
  const r=record();r.versions=[{id:'v-'+fingerprint([{sha256:sha('a')},{sha256:sha('b')}]).slice(0,16),fingerprint:fingerprint([{sha256:sha('a')},{sha256:sha('b')}]),frames:[0,1].map(i=>({url:'/exercise-guides/poses/assets/test.'+'a'.repeat(12)+'.webp',sha256:sha(i?'b':'a'),width:8,height:8})),constraints:[],references:[],audit:{status:'not-recorded',findings:[],checks:[]}}];r.review.versionId=r.versions[0].id;await expect(store.migrate(r)).rejects.toThrow('Upload all exact pose assets');
 });
 it('revokes and rotates scoped agent credentials immediately',async()=>{
  expect((await call('state',undefined,'agent')).status).toBe(200);expect((await call('agent-create',{worker:'generator-1'})).status).toBe(200);expect((await call('state',undefined,'agent')).status).toBe(401);
  expect((await call('agent-revoke',{worker:'generator-1'})).status).toBe(200);expect((await env.POSE_DB.prepare('SELECT * FROM pose_agents').all()).results).toHaveLength(0);
 });
 it('candidates preserve approval/history, bind independent audits and accept only exact owner decisions',async()=>{
  const store=new HostedPoseStore(base);await store.claim({id:'barbell-back-squat',expectedRevision:0,batch:'x'},'generator-1',{'barbell-back-squat':'Barbell Back Squat'});
  const make=n=>{const b=Buffer.alloc(32);Buffer.from([137,80,78,71,13,10,26,10]).copy(b);b.writeUInt32BE(8,16);b.writeUInt32BE(8,20);b[31]=n;return b;};const pair=[make(1),make(2)],fp=fingerprint(pair.map(b=>({sha256:sha(b)}))),version='v-'+fp.slice(0,16),frames=[];
  for(let i=0;i<2;i++){const url='/workspace/barbell-back-squat/versions/'+version+'/frame-'+i+'.png';await store.upload(url,pair[i],'text/html');frames.push({url,sha256:sha(pair[i]),width:8,height:8});}
  const candidate=await store.candidate({id:'barbell-back-squat',expectedRevision:1,frames,brief:{constraints:['Synthetic'],references:[],generation:{prompt:'Synthetic test',sourceReview:[{document:'synthetic fixture'}]}}},'generator-1');expect(candidate.review.status).toBe('unreviewed');expect(candidate.approvedVersionId).toBeNull();expect((await store.file(frames[0].url)).mime).toBe('image/png');
  const audit={versionId:version,fingerprint:fp,reviewer:'generator-1',status:'not-recorded',findings:[],checks:[]};await expect(store.audit({id:candidate.id,expectedRevision:2,versionId:version,audit},'generator-1')).rejects.toThrow('Generator cannot');audit.reviewer='auditor-1';const audited=await store.audit({id:candidate.id,expectedRevision:2,versionId:version,audit},'auditor-1');expect(audited.revision).toBe(3);
  const decision={id:candidate.id,expectedRevision:3,versionId:version,fingerprint:fp,status:'approved',note:'Synthetic owner review'};expect((await call('decision',{...decision,fingerprint:'0'.repeat(64)})).status).toBe(409);expect((await call('decision',decision)).status).toBe(200);expect((await call('decision',decision)).status).toBe(409);const approved=await store.get(candidate.id);expect(approved.approvedVersionId).toBe(version);expect(approved.history.at(-1).actor).toBe('owner:'+owner);
 });
 it('migration is idempotent, cannot overwrite existing records, and is disabled after cutover',async()=>{
  await env.POSE_DB.prepare('INSERT INTO pose_settings VALUES(?,?)').bind('migration-token',sha(token)).run();const r=record();expect((await call('migrate',{record:r},'agent')).status).toBe(200);expect((await call('migrate',{record:r},'agent')).status).toBe(200);r.name='changed';expect((await call('migrate',{record:r},'agent')).status).toBe(409);await call('migration-complete',{},'agent');expect((await call('migrate',{record:r},'agent')).status).toBe(403);
 });
 it('registers four version-bound timed frames while preserving an approved pair',async()=>{
  const store=new HostedPoseStore(base),id='barbell-back-squat';
  await store.claim({id,expectedRevision:0,batch:'sequence'},'generator-1',{[id]:'Barbell Back Squat'});
  const make=n=>{const b=Buffer.alloc(32);Buffer.from([137,80,78,71,13,10,26,10]).copy(b);b.writeUInt32BE(8,16);b.writeUInt32BE(8,20);b[31]=n;return b;};
  const brief={constraints:['Synthetic'],references:[],generation:{prompt:'Synthetic sequence',sourceReview:[{document:'synthetic'}]}};
  async function register(values,durations,revision){
   const items=values.map((n,i)=>({bytes:make(n),sha256:sha(make(n)),width:8,height:8,...(durations?{durationMs:durations[i]}:{})}));
   const version='v-'+fingerprint(items).slice(0,16),frames=[];
   for(let i=0;i<items.length;i++){const {bytes,...f}=items[i];f.url='/workspace/'+id+'/versions/'+version+'/frame-'+i+'.png';await store.upload(f.url,bytes,'image/png');frames.push(f);}
   return store.candidate({id,expectedRevision:revision,frames,brief},'generator-1');
  }
  let r=await register([1,2],null,1);const approved=r.versions[0];
  r=await store.mutate(id,r.revision,'owner:synthetic',r=>store.decision(r,{versionId:approved.id,fingerprint:approved.fingerprint,status:'approved',note:''}));
  r=await register([3,4,5,4],[900,650,900,650],r.revision);
  expect(r.versions).toHaveLength(2);expect(r.versions[0]).toEqual(approved);expect(r.approvedVersionId).toBe(approved.id);expect(r.review.status).toBe('unreviewed');
  const current=r.versions.at(-1);expect(current.frames.map(f=>f.durationMs)).toEqual([900,650,900,650]);expect(current.frames[1].sha256).toBe(current.frames[3].sha256);
  expect(fingerprint(current.frames)).not.toBe(fingerprint(current.frames.map(({durationMs,...f})=>f)));
  await expect(store.candidate({id,expectedRevision:r.revision,frames:current.frames.concat(current.frames[0]),brief},'generator-1')).rejects.toThrow('Two to four');
  const invalid=current.frames.map(f=>({...f,durationMs:1}));await expect(store.candidate({id,expectedRevision:r.revision,frames:invalid,brief},'generator-1')).rejects.toThrow();
  expect((await store.get(id)).revision).toBe(r.revision);
 });

});
