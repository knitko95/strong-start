import {env,exports} from 'cloudflare:workers';
import {runInDurableObject,runDurableObjectAlarm,evictDurableObject,createExecutionContext} from 'cloudflare:test';
import {beforeAll,afterAll,beforeEach,afterEach,describe,it,expect} from 'vitest';
import {setupNetwork} from '@msw/cloudflare';
import {http,HttpResponse} from 'msw';
import worker from '../../feedback-worker.mjs';
import {hash,PROJECTS,normalizeReport,githubIssue,sourceMarker,authenticate} from '../../feedback-core.mjs';

const network=setupNetwork(), api='https://api.github.com/repos/knitko95/strong-start-feedback';
let user;
let account='ok',anonymous=false,posts=0,posted=[],mode='success',issueNumber=200,retryAfter='60';
const report=()=>({id:crypto.randomUUID(),message:'Synthetic delivery verification: the app button needs a clearer label.',tag:'bug',screen:'Settings',device:'Synthetic phone',version:'0.1.1',build:'synthetic-build'});
const request=(p,method='POST',token='test-user')=>new Request('https://feedback.test/api/feedback'+(method==='GET'?'/'+p.id:''),{method,headers:{Authorization:'Bearer '+token,...(method==='POST'?{'Content-Type':'application/json'}:{})},...(method==='POST'?{body:JSON.stringify(p)}:{})});
beforeAll(()=>network.enable());
afterAll(()=>network.disable());
beforeEach(()=>{
  user='00000000-0000-4000-8000-'+crypto.randomUUID().slice(-12);
  account='ok';anonymous=false;posts=0;posted=[];mode='success';retryAfter='60';
  network.use(
    http.get(PROJECTS.development.url+'/auth/v1/user',({request})=>HttpResponse.json({id:request.headers.get('Authorization').includes('other-user')?'11111111-1111-4111-8111-111111111111':user,is_anonymous:anonymous})),
    http.post(PROJECTS.development.url+'/rest/v1/rpc/account_status',()=>HttpResponse.json(account)),
    http.get(api,()=>HttpResponse.json({private:mode!=='public',full_name:'knitko95/strong-start-feedback'})),
    http.get(api+'/issues',()=>HttpResponse.json(posted.map((body,i)=>({body,number:issueNumber+i,created_at:new Date().toISOString()})))),
    http.post(api+'/issues',async({request})=>{
      posts++;const issue=await request.json();
      if(mode==='rate-limit')return HttpResponse.json({}, {status:429,headers:{'Retry-After':retryAfter}});
      posted.push(issue.body);
      if(mode==='lost-response')return HttpResponse.error();
      return HttpResponse.json({number:issueNumber++},{status:201});
    }),
    http.all('*',()=>HttpResponse.error()) // No test may contact a real upstream.
  );
});
afterEach(async()=>{
  // The runtime's alarms are real. Leave none running into the next test's
  // upstream handlers/counters; storage isolation is explicit in this plugin.
  const object=await stub();
  await runInDurableObject(object,async(_instance,state)=>{await state.storage.deleteAlarm();});
  await evictDurableObject(object);
  network.resetHandlers();
});
async function stub(){return env.TEST_OUTBOX.getByName(await hash('development:'+user));}
async function due(object){await runInDurableObject(object,async(_instance,state)=>{state.storage.sql.exec("UPDATE reports SET next_at=0 WHERE state <> 'delivered'");await state.storage.setAlarm(Date.now()+3600000);});}

describe('feedback authentication and input boundaries',()=>{
  it('validates the trusted Auth user and account status through mocked upstreams',async()=>{
    expect(await authenticate(request(report()),'development')).toBe(await hash('development:'+user));
  });
  it('selects the production Auth project only for the production Worker configuration',async()=>{
    const urls=[];
    const trusted=async(url)=>{urls.push(url);return HttpResponse.json(url.endsWith('/user')?{id:user,is_anonymous:false}:'ok');};
    expect(await authenticate(request(report()),'production',trusted)).toBe(await hash('production:'+user));
    expect(urls).toEqual([PROJECTS.production.url+'/auth/v1/user',PROJECTS.production.url+'/rest/v1/rpc/account_status']);
  });
  it('rejects unauthenticated, disabled and anonymous callers',async()=>{
    const p=report();const noAuth=request(p);noAuth.headers.delete('Authorization');
    expect((await exports.default.fetch(noAuth)).status).toBe(401);
    account='disabled';expect((await exports.default.fetch(request(p))).status).toBe(403);
    account='ok';anonymous=true;expect((await exports.default.fetch(request(p))).status).toBe(401);
    expect(posts).toBe(0);
  });
  it('rejects cross-origin, oversized and private-content reports before creating an issue',async()=>{
    const p=report(),cross=request(p);cross.headers.set('Origin','https://other.test');
    expect((await exports.default.fetch(cross)).status).toBe(403);
    expect((await exports.default.fetch(request({...p,message:'x'.repeat(30000)}))).status).toBe(413);
    expect((await exports.default.fetch(request({...p,message:'Please contact person@example.invalid'}))).status).toBe(422);
    expect((await exports.default.fetch(request({...p,message:'Token: github_pat_synthetic'}))).status).toBe(422);
    expect((await exports.default.fetch(request({...p,message:'Call +1 (212) 555-0199'}))).status).toBe(422);
    expect(normalizeReport({...p,message:'The calendar showed 2026-11-13.'}).message).toContain('2026-11-13');
    expect(posts).toBe(0);
  });
  it('fails closed without a credential and never sends text to a public repository',async()=>{
    const p=report();expect((await worker.fetch(request(p),{...env,GITHUB_FEEDBACK_TOKEN:''},createExecutionContext())).status).toBe(503);
    mode='public';const r=await exports.default.fetch(request(p));expect(r.status).toBe(202);expect(posts).toBe(0);
  });
  it('accepts only allowlisted diagnostics and neutralizes markdown in the issue body',()=>{
    const p=normalizeReport({...report(),email:'ignored',workout:{name:'private'},environment:'production',repository:'other/repo'});
    expect(p.email).toBeUndefined();expect(p.workout).toBeUndefined();
    const issue=githubIssue({...p,message:'```\n![image](https://example.invalid/)\n```'},'development',Date.now());
    expect(issue.body).toContain('````text');expect(issue.body).toContain('Origin (server): development');
    expect(issue.labels).toContain('source:dev-app');expect(githubIssue(p,'production',Date.now()).labels).toContain('source:main-app');
  });
});
describe('durable delivery and deduplication',()=>{
  it('delivers once across concurrent retries and preserves the original provenance',async()=>{
    const p=report(),responses=await Promise.all([exports.default.fetch(request(p)),exports.default.fetch(request(p))]);
    expect(responses.every(r=>[200,202].includes(r.status))).toBe(true);
    const receipt=await (await exports.default.fetch(request(p,'GET'))).json();expect(receipt.status).toBe('delivered');expect(posts).toBe(1);
    expect(posted[0]).toContain(sourceMarker('development',p.id));
    expect(posted[0]).not.toContain(user);
    const changed=await exports.default.fetch(request({...p,message:'Changed after the same submission ID'}));expect(changed.status).toBe(409);expect(posts).toBe(1);
  });
  it('keeps receipts separate for another account',async()=>{
    const p=report();await exports.default.fetch(request(p));
    expect((await exports.default.fetch(request(p,'GET','other-user'))).status).toBe(404);
  });
  it('limits new reports per account without blocking a retry of an existing receipt',async()=>{
    const first=report();expect((await exports.default.fetch(request(first))).status).toBe(200);
    const object=await stub();
    await runInDurableObject(object,async(_instance,state)=>{
      for(let i=0;i<9;i++)state.storage.sql.exec("INSERT INTO reports(id,digest,state,created_at,next_at) VALUES(?,?,'delivered',?,0)",crypto.randomUUID(),'synthetic',Date.now());
    });
    expect((await exports.default.fetch(request(report()))).status).toBe(429);
    expect((await exports.default.fetch(request(first))).status).toBe(200);expect(posts).toBe(1);
  });
  it('purges delivered text but preserves deduplication after object eviction',async()=>{
    const p=report();await exports.default.fetch(request(p));const object=await stub();
    await runInDurableObject(object,async(_instance,state)=>{expect(state.storage.sql.exec('SELECT payload FROM reports WHERE id=?',p.id).one().payload).toBeNull();});
    await evictDurableObject(object);
    expect((await exports.default.fetch(request(p))).status).toBe(200);expect(posts).toBe(1);
  });
  it('retries a definite rate-limit failure from a durable alarm after eviction',async()=>{
    const p=report();mode='rate-limit';expect((await exports.default.fetch(request(p))).status).toBe(202);
    const object=await stub();await evictDurableObject(object);mode='success';await due(object);expect(await runDurableObjectAlarm(object)).toBe(true);
    expect((await object.status(p.id)).status).toBe('delivered');expect(posts).toBe(2);
  });
  it('reconciles a lost create response without issuing a second POST',async()=>{
    const p=report();mode='lost-response';expect((await exports.default.fetch(request(p))).status).toBe(202);
    const object=await stub();await evictDurableObject(object);mode='success';await due(object);await runDurableObjectAlarm(object);
    expect((await object.status(p.id)).status).toBe('delivered');expect(posts).toBe(1);
  });
  it('keeps definite failures queued when Retry-After uses an HTTP date',async()=>{
    const p=report();mode='rate-limit';retryAfter=new Date(Date.now()+120000).toUTCString();
    const response=await exports.default.fetch(request(p));expect(response.status).toBe(202);expect((await response.json()).status).toBe('queued');
    await runInDurableObject(await stub(),async(_instance,state)=>{
      const row=state.storage.sql.exec('SELECT next_at,error FROM reports WHERE id=?',p.id).one();
      expect(row.next_at).toBeGreaterThan(Date.now()+60000);expect(row.error).toBe('github-429');
    });
  });
  it('retains ambiguous text and does not blindly resend when reconciliation finds nothing',async()=>{
    const p=report();mode='lost-response';await exports.default.fetch(request(p));posted=[];
    const object=await stub();await due(object);await runDurableObjectAlarm(object);
    expect((await object.status(p.id)).status).toBe('checking');expect(posts).toBe(1);
    await runInDurableObject(object,async(_instance,state)=>{expect(state.storage.sql.exec('SELECT payload FROM reports WHERE id=?',p.id).one().payload).toContain(p.message);});
  });
});
