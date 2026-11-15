// Synthetic disposable authoring workspace; no real notes/accounts/backend requests.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync,existsSync,readdirSync,mkdirSync,symlinkSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import http from 'node:http';
import {PoseReviewStore,parseJSON,imageInfo,fingerprint,sha} from './lib/pose-review-store.mjs';
import {startReviewServer,appCatalogue} from './serve-pose-review.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const seed=JSON.parse(readFileSync(path.join(root,'exercise-guides/pose-review/seed.v1.json'),'utf8'));
const temp=mkdtempSync(path.join(os.tmpdir(),'strong-start-pose-review-test-'));
const clone=value=>structuredClone(value),results=[];
let live;
function check(name,run){run();results.push(name);console.log('PASS '+name);}
function rejects(run,status){assert.throws(run,error=>status===undefined||error.status===status);}
const workspace=path.join(temp,'workspace');
const store=new PoseReviewStore({workspace,seed,catalogue:appCatalogue()});
try{
 check('18 exact approved seeds initialize without fabricated form audit',()=>{
  const all=store.initialize();assert.equal(all.length,18);assert.equal(store.initialize().length,18);
  for(const r of all){assert.equal(r.review.status,'approved');assert.equal(r.versions.length,1);assert.equal(r.versions[0].audit.status,'not-recorded');assert.equal(r.approvedVersionId,r.developmentVersionId);assert.equal(r.productionVersionId,null);for(const f of r.versions[0].frames){const bytes=readFileSync(path.join(root,f.url));assert.equal(sha(bytes),f.sha256);const info=imageInfo(bytes);assert.equal(info.width,f.width);assert.equal(info.height,f.height);}}
 });
 const id=seed.exercises[0].id,baseline=store.get(id),approved=clone(baseline.versions[0]);
 const files=approved.frames.map(f=>path.join(root,f.url)).reverse();
 check('unknown IDs, inherited catalogue keys and prototype JSON are rejected without corrupting the queue',()=>{
  for(const bad of ['../outside','__proto__','constructor','toString'])rejects(()=>store.create(bad));
  assert.equal(store.list().length,18);assert(!existsSync(path.join(workspace,'exercises','constructor','record.json')));
  rejects(()=>parseJSON('{"__proto__":{"polluted":true}}'));rejects(()=>parseJSON('{"nested":{"constructor":1}}'));
  assert.equal({}.polluted,undefined);
 });
 check('candidate creation requires a worker claim and preserves approved/deployed versions',()=>{
  rejects(()=>store.candidate(id,baseline.revision,files));
  const claimed=store.claim(id,baseline.revision,'synthetic-generator','test-batch');
  rejects(()=>store.claim(id,claimed.revision,'other-generator','other-batch'),409);
  const candidate=store.candidate(id,claimed.revision,files);
  assert.equal(candidate.versions.length,2);assert.equal(candidate.approvedVersionId,approved.id);assert.equal(candidate.developmentVersionId,approved.id);assert.equal(candidate.productionVersionId,null);assert.deepEqual(candidate.versions[0],approved);assert.equal(candidate.review.status,'unreviewed');assert.equal(candidate.versions.at(-1).generator,'synthetic-generator');
  const before=JSON.stringify(store.get(id));rejects(()=>store.candidate(id,candidate.revision,files),409);assert.equal(JSON.stringify(store.get(id)),before);
 });
 check('malformed, oversized and mismatched canvases fail before registering or leaving partial candidate folders',()=>{
  const before=JSON.stringify(store.get(id)),versionsBefore=readdirSync(path.join(store.folder(id),'versions')).sort();
  const shortWebP=Buffer.alloc(25);shortWebP.write('RIFF');shortWebP.write('WEBP',8);shortWebP.write('VP8X',12);rejects(()=>imageInfo(shortWebP));
  const png=(w,h)=>{const bytes=Buffer.alloc(40);Buffer.from([137,80,78,71,13,10,26,10]).copy(bytes);bytes.writeUInt32BE(w,16);bytes.writeUInt32BE(h,20);return bytes;};
  const one=path.join(temp,'one.png'),two=path.join(temp,'two.png');writeFileSync(one,png(100,100));writeFileSync(two,png(101,100));
  rejects(()=>store.candidate(id,store.get(id).revision,[one,two]));writeFileSync(two,png(8193,100));rejects(()=>store.candidate(id,store.get(id).revision,[two,two]));
  assert.equal(JSON.stringify(store.get(id)),before);assert.deepEqual(readdirSync(path.join(store.folder(id),'versions')).sort(),versionsBefore);
 });
 check('stale revisions, concurrent locks and wrong fingerprints cannot approve a different candidate',()=>{
  let r=store.get(id),v=r.versions.at(-1),before=JSON.stringify(r);
  rejects(()=>store.decide({id,expectedRevision:r.revision-1,versionId:v.id,fingerprint:v.fingerprint,status:'approved',note:''}),409);
  rejects(()=>store.decide({id,expectedRevision:r.revision,versionId:v.id,fingerprint:'f'.repeat(64),status:'approved',note:''}),409);
  const lock=path.join(store.folder(id),'.lock');writeFileSync(lock,'synthetic lock');try{rejects(()=>store.decide({id,expectedRevision:r.revision,versionId:v.id,fingerprint:v.fingerprint,status:'approved',note:''}),409);}finally{rmSync(lock);}
  assert.equal(JSON.stringify(store.get(id)),before);
  r=store.decide({id,expectedRevision:r.revision,versionId:v.id,fingerprint:v.fingerprint,status:'needs-changes',note:'Align the wrist only.'});assert.equal(r.approvedVersionId,approved.id);assert.equal(r.review.versionId,v.id);
 });
 check('audit identity remains independent after a generator releases the claim, and every passed check is version-bound',()=>{
  let r=store.get(id),v=r.versions.at(-1);r=store.release(id,r.revision,'synthetic-generator');
  const checks=['form','anatomy','grip','perspective','fixed-elements','transparency','readability','variation'].map(id=>({id,label:id,result:'pass'}));
  const audit={status:'passed',versionId:v.id,fingerprint:v.fingerprint,reviewer:'synthetic-generator',findings:[],checks};
  rejects(()=>store.audit(id,r.revision,v.id,audit));audit.reviewer='synthetic-independent-auditor';audit.fingerprint='e'.repeat(64);rejects(()=>store.audit(id,r.revision,v.id,audit),409);audit.fingerprint=v.fingerprint;
  const incomplete=clone(audit);incomplete.checks.pop();rejects(()=>store.audit(id,r.revision,v.id,incomplete));
  r=store.audit(id,r.revision,v.id,audit);assert.equal(r.versions.at(-1).audit.reviewer,audit.reviewer);assert.equal(r.approvedVersionId,approved.id,'Audit pass is not owner approval');
 });
 check('review import ignores forged publication pointers, assignment and history, while preserving immutable artwork',()=>{
  const r=store.get(id),incoming=clone(r),v=r.versions.at(-1);incoming.review={versionId:v.id,status:'needs-changes',note:'Synthetic imported targeted correction.',updatedAt:new Date().toISOString()};incoming.productionVersionId=v.id;incoming.developmentVersionId=v.id;incoming.history.push({id:'forged',type:'published',note:'Fake release'});incoming.assignment={worker:'forged-worker',batch:'forged-batch'};
  const [after]=store.importReviews([incoming],{[id]:r.revision});assert.equal(after.productionVersionId,null);assert.equal(after.developmentVersionId,approved.id);assert.equal(after.assignment,null);assert(!after.history.some(e=>e.id==='forged'));assert.equal(after.review.note,incoming.review.note);assert.deepEqual(after.versions,r.versions);
  const altered=clone(after);altered.versions.at(-1).frames[0].sha256='a'.repeat(64);altered.versions.at(-1).fingerprint=fingerprint(altered.versions.at(-1).frames);rejects(()=>store.importReviews([altered],{[id]:after.revision}),409);
 });
 check('multi-exercise import preflights all revisions so one conflict cannot partially save another review',()=>{
  const first=store.get(id),second=store.list().find(r=>r.id!==id),beforeFirst=JSON.stringify(first),beforeSecond=JSON.stringify(second);first.review.note='This must not be partially saved.';
  rejects(()=>store.importReviews([first,second],{[id]:first.revision,[second.id]:second.revision+1}),409);assert.equal(JSON.stringify(store.get(id)),beforeFirst);assert.equal(JSON.stringify(store.get(second.id)),beforeSecond);
 });
 check('exercise junction/symlink escapes are rejected before initialization writes outside the workspace',()=>{
  const escapeRoot=path.join(temp,'escape-workspace'),outside=path.join(temp,'outside');mkdirSync(path.join(escapeRoot,'exercises'),{recursive:true});mkdirSync(outside);
  symlinkSync(outside,path.join(escapeRoot,'exercises',id),process.platform==='win32'?'junction':'dir');
  const escaped=new PoseReviewStore({workspace:escapeRoot,seed:{schemaVersion:1,exercises:[clone(seed.exercises[0])]},catalogue:appCatalogue()});rejects(()=>escaped.initialize(),403);assert(!existsSync(path.join(outside,'record.json')));
 });
 live=await startReviewServer({workspace:path.join(temp,'server-workspace'),port:0});
 const request=async(pathname,options={})=>{const response=await fetch(live.origin+pathname,options);return {response,body:await response.json().catch(()=>null)};};
 const state=await request('/api/pose-review/state');assert.equal(state.response.status,200);assert.equal(state.body.exercises.length,18);assert(state.body.token);
 const current=state.body.exercises[0],v=current.versions[0],payload={id:current.id,expectedRevision:current.revision,versionId:v.id,fingerprint:v.fingerprint,status:'needs-changes',note:'Synthetic API note.'};
 const headers={'Content-Type':'application/json',Origin:live.origin,'X-Pose-Review-Token':state.body.token};
 for(const [name,options] of [
  ['missing origin',{headers:{'Content-Type':'application/json','X-Pose-Review-Token':state.body.token}}],
  ['missing token',{headers:{'Content-Type':'application/json',Origin:live.origin}}],
  ['foreign origin',{headers:{...headers,Origin:'https://example.invalid'}}],
 ]){const r=await request('/api/pose-review/decision',{method:'POST',body:JSON.stringify(payload),...options});assert.equal(r.response.status,403,name);}
 // Use native http: fetch normalizes Host rather than sending the spoofed value.
 const wrongHost=await new Promise((resolve,reject)=>{http.get(live.origin+'/api/pose-review/state',{headers:{Host:'example.invalid'}},response=>{response.resume();response.on('end',()=>resolve(response.statusCode));}).on('error',reject);});assert.equal(wrongHost,403);
 const foreignRead=await request('/api/pose-review/state',{headers:{Origin:'https://example.invalid'}});assert.equal(foreignRead.response.status,403);assert.equal(foreignRead.response.headers.get('access-control-allow-origin'),null);
 const prototype=await request('/api/pose-review/decision',{method:'POST',headers,body:'{"__proto__":{"polluted":1}}'});assert.equal(prototype.response.status,400);
 const tooLarge=await request('/api/pose-review/decision',{method:'POST',headers,body:' '.repeat(2_000_001)});assert.equal(tooLarge.response.status,413);
 const wrongType=await request('/api/pose-review/decision',{method:'POST',headers:{...headers,'Content-Type':'text/plain'},body:JSON.stringify(payload)});assert.equal(wrongType.response.status,415);
 const saved=await request('/api/pose-review/decision',{method:'POST',headers,body:JSON.stringify(payload)});assert.equal(saved.response.status,200);assert.equal(saved.body.record.review.note,payload.note);
 const stale=await request('/api/pose-review/decision',{method:'POST',headers,body:JSON.stringify(payload)});assert.equal(stale.response.status,409);
 for(const pathname of ['/workspace/'+id+'/record.json','/workspace/'+id+'/versions/../../record.json','/docs/APP_GUIDE.md','/.env']){const r=await request(pathname);assert.equal(r.response.status,404,pathname);}
 const page=await fetch(live.origin+'/exercise-guides/pose-review/');assert.equal(page.status,200);assert.match(page.headers.get('content-type'),/text\/html/);
 results.push('HTTP origin/host/token/body limits, stale saves and private-file routing');console.log('PASS '+results.at(-1));
 console.log(results.length+' pose-review store/server scenarios passed.');
}finally{
 if(live)await new Promise(resolve=>live.server.close(resolve));
 const resolved=path.resolve(temp),prefix=path.resolve(os.tmpdir())+path.sep;assert(resolved.startsWith(prefix)&&path.basename(resolved).startsWith('strong-start-pose-review-test-'));
 rmSync(resolved,{recursive:true,force:true});
}
