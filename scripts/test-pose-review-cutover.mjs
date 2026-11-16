import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {startReviewServer,root} from './serve-pose-review.mjs';
import {sha} from './lib/pose-review-core.mjs';
const parent=path.resolve(root,'output/test-pose-review-scratch');fs.mkdirSync(parent,{recursive:true});const workspace=fs.mkdtempSync(path.join(parent,'cutover-'));
let server;
try{
 const started=await startReviewServer({workspace,port:0});server=started.server;const store=started.store,r=store.list()[0],file=store.file(r.id),before=sha(fs.readFileSync(file));
 const target='https://dev.strongstart.app/exercise-guides/pose-review/';fs.writeFileSync(path.join(workspace,'HOSTED-WORKSPACE.json'),JSON.stringify({url:target}));
 assert.throws(()=>store.claim(r.id,r.revision,'synthetic','cutover'),/local archive has moved/);assert.throws(()=>store.decide({id:r.id,expectedRevision:r.revision}),/local archive has moved/);assert.throws(()=>store.importReviews([r],{[r.id]:r.revision}),/local archive has moved/);
 const redirect=await fetch(started.origin+'/exercise-guides/pose-review/?review=pending',{redirect:'manual'});assert.equal(redirect.status,302);assert.equal(redirect.headers.get('Location'),target+'?review=pending');
 const response=await fetch(started.origin+'/api/pose-review/decision',{method:'POST',headers:{Origin:started.origin,'Content-Type':'application/json'},body:'{}'});assert.equal(response.status,409);assert.equal(sha(fs.readFileSync(file)),before);console.log('PASS archived local CLI/server deny writes, redirect reviewers, and preserve original record bytes');
}finally{if(server)await new Promise(r=>server.close(r));assert(workspace.startsWith(parent+path.sep));fs.rmSync(workspace,{recursive:true,force:true});}
