// Disposable authoring server and synthetic images only; never writes the owner's workspace.
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,rmSync,existsSync,writeFileSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {startReviewServer,root} from './serve-pose-review.mjs';
import {sha} from './lib/pose-review-store.mjs';
const {chromium}=createRequire(import.meta.url)('playwright');
const temp=mkdtempSync(path.join(os.tmpdir(),'strong-start-reference-test-'));
const live=await startReviewServer({workspace:temp,port:0});let browser;const results=[];
try{
 browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 for(const [index,width] of [1280,390,320].entries()){
  const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));const id=live.store.list()[index].id;
  await page.goto(live.origin+'/exercise-guides/pose-review/?exercise='+id);
  await page.locator('#reference-file').waitFor();
  const mime=['image/png','image/jpeg','image/webp'][index];
  const image=Buffer.from(await page.evaluate(type=>{const canvas=document.createElement('canvas');canvas.width=64;canvas.height=48;const c=canvas.getContext('2d');c.fillStyle='#39776e';c.fillRect(0,0,64,48);c.fillStyle='#ffffff';c.fillRect(12,12,40,24);return canvas.toDataURL(type).split(',')[1];},mime),'base64');
  const before=live.store.get(id),label='Synthetic hand reference '+width,note='Keep wrist aligned; <script> is literal guidance.';
  await page.locator('#review-note').fill('Unsaved owner review note must survive upload.');
  await page.locator('#reference-file').setInputFiles({name:'reference.'+['png','jpg','webp'][index],mimeType:mime,buffer:image});
  await page.locator('#reference-label').fill(label);await page.locator('#reference-guidance').fill(note);
  await page.locator('#add-reference').click();await page.getByText('Reference image saved privately for '+before.name+'. Your review note and approval are unchanged.',{exact:true}).waitFor();
  const after=live.store.get(id),ref=after.reviewReferences[0];assert.equal(ref.sha256,sha(image));assert.equal(ref.sourceVersionId,before.versions.at(-1).id);assert.equal(after.revision,before.revision+1);
  for(const key of ['versions','review','approvedVersionId','developmentVersionId','productionVersionId'])assert.deepEqual(after[key],before[key],key+' unchanged');
  assert.equal(await page.locator('#review-note').inputValue(),'Unsaved owner review note must survive upload.');
  assert.equal(await page.locator('.reference-card strong').innerText(),label);assert((await page.locator('.reference-card').innerText()).includes(note));
  await page.reload();await page.locator('.reference-card img').waitFor();await page.waitForFunction(()=>[...document.querySelectorAll('.reference-card img')].every(i=>i.complete&&i.naturalWidth>0));
  assert.equal(await page.locator('.reference-card strong').innerText(),label);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  const served=await fetch(live.origin+ref.url);assert.equal(served.headers.get('content-type'),mime);assert.equal(sha(Buffer.from(await served.arrayBuffer())),ref.sha256);
  // A newer worker mutation must reject the selected upload and preserve the form.
  await page.locator('#reference-file').setInputFiles({name:'duplicate.png',mimeType:mime,buffer:image});await page.locator('#reference-label').fill('Retain this label');await page.locator('#reference-guidance').fill('Retain this guidance');
  live.store.mutate(id,after.revision,r=>r.history.push({type:'synthetic-worker-update'}));
  await page.locator('#add-reference').click();await page.getByText(/Your selected image and guidance are retained/).waitFor();assert.equal(await page.locator('#reference-guidance').inputValue(),'Retain this guidance');assert.equal(live.store.get(id).reviewReferences.length,1);assert.deepEqual(errors,[]);
  results.push({width,mime,durableUpload:true,notesAndArtworkPreserved:true,staleUploadRetained:true,errors});await context.close();
 }
 const state=await (await fetch(live.origin+'/api/pose-review/state')).json(),r=state.exercises[0],v=r.versions.at(-1),ref=r.reviewReferences[0],bytes=readFileSync(live.store.asset(ref.url));
 const payload={id:r.id,expectedRevision:r.revision,versionId:v.id,fingerprint:v.fingerprint,label:'API fixture',note:'',image:bytes.toString('base64')};
 const headers={'Content-Type':'application/json',Origin:live.origin,'X-Pose-Review-Token':state.token};
 const post=(value,custom=headers)=>fetch(live.origin+'/api/pose-review/reference-images',{method:'POST',headers:custom,body:JSON.stringify(value)});
 assert.equal((await post(payload,{...headers,Origin:'https://example.invalid'})).status,403);
 assert.equal((await post({...payload,fingerprint:'a'.repeat(64)})).status,409);
 assert.equal((await post({...payload,image:Buffer.from('<svg onload="evil()"/>').toString('base64')})).status,400);
 assert.equal((await post({...payload,image:'!invalid!'})).status,400);
 assert.equal((await post({...payload,image:'A'.repeat(6_666_672)})).status,400);
 assert.equal((await post(payload)).status,409,'Duplicate images do not create extra records');
 const beforeCandidate=live.store.get(r.id),refs=structuredClone(beforeCandidate.reviewReferences),oldVersions=structuredClone(beforeCandidate.versions);
 const claimed=live.store.claim(r.id,beforeCandidate.revision,'synthetic-reference-generator','references-test');
 const next=live.store.candidate(r.id,claimed.revision,oldVersions[0].frames.map(frame=>path.join(root,frame.url)).reverse());
 assert.deepEqual(next.reviewReferences,refs,'Review attachments stay available to later candidate revisions');assert.deepEqual(next.versions.slice(0,-1),oldVersions,'Earlier artwork and audit metadata remain immutable');
 const incoming=structuredClone(live.store.get(r.id));incoming.reviewReferences=[];assert.throws(()=>live.store.importReviews([incoming],{[r.id]:incoming.revision}),e=>e.status===409);
 const asset=live.store.asset(ref.url);writeFileSync(asset,Buffer.from('changed'));assert.throws(()=>live.store.asset(ref.url),e=>e.status===409);
 const exportBundle=live.store.export();assert(exportBundle.exercises[0].reviewReferences.length);assert(!JSON.stringify(exportBundle).includes('data:image'),'Review exports contain metadata, never embedded private pixels');
 console.log(JSON.stringify({results,api:'PASS origin, version binding, invalid/oversized data, deduplication, cross-revision references, import preservation and asset hash checks'}));
}finally{
 if(browser)await browser.close();await new Promise(resolve=>live.server.close(resolve));
 const resolved=path.resolve(temp);assert(resolved.startsWith(path.resolve(os.tmpdir())+path.sep)&&path.basename(resolved).startsWith('strong-start-reference-test-'));rmSync(resolved,{recursive:true,force:true});
}
