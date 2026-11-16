// Synthetic real-browser recovery checks. Optional URL verifies the exact hosted build.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {seed,server,root,html}=require('./test-paged-history.cjs');
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const url=process.argv[2]||`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const open=async(width=390)=>{
  const context=await browser.newContext({serviceWorkers:'block',viewport:{width,height:844},acceptDownloads:true});
  await context.route('**/*',r=>r.request().url().startsWith(url)?r.continue():r.fulfill({body:''}));
  await context.addInitScript(()=>{IDBObjectStore.prototype.getAll=()=>{throw Error('Unbounded history read');};});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const response=await page.goto(url);assert.equal(await response.text(),html,'Must test the exact built HTML');
  await page.waitForFunction(()=>PAGE.summary!==null&&DEVICE.pending===0);
  await seed(page,95);
  const legacy=await page.evaluate(async()=>{
   SYNC.owner='fixture-member';state.settings.name='Current app edits';startWorkout(weekKeys()[0]);state.draft.paused=true;persistLocal();await flushDevice();
   const old=JSON.parse((await PAGE.store.exportParts(state)).join(''));old.state.settings.name='Older tab edits';old.sync={owner:'fixture-other',base:null,conflict:null,recovery:null};
   old.logs.push({...structuredClone(old.logs[0]),id:'older-only',name:'Older unsynced workout'});
   const raw=JSON.stringify(old);localStorage.setItem(LS,raw);return raw;
  });
  await page.reload();await page.getByRole('heading',{name:'Two device copies found'}).waitFor();
  assert.equal(await page.evaluate(()=>PAGE.active),false,'Do not start the app or sync before a choice');
  return {context,page,errors,legacy};
 };
 const choose=async page=>{await page.locator('#device-recovery-confirm').check();await page.getByRole('button',{name:'Continue with current app copy'}).click();};
 const file=async(page,button)=>{const download=page.waitForEvent('download');await button.click();return JSON.parse(fs.readFileSync(await (await download).path(),'utf8'));};
 try{
  fs.mkdirSync(path.join(root,'test-results/device-recovery'),{recursive:true});
  for(const width of [1280,390,320]){
   const {context,page,errors,legacy}=await open(width);
   assert.equal(await page.locator('#device-recovery-continue').isDisabled(),true);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   await page.screenshot({path:path.join(root,`test-results/device-recovery/recovery-${width}.png`),fullPage:true});
   const backup=await file(page,page.getByRole('button',{name:'Download both copies'}));
   assert.equal(backup.indexed.logs.length,95);assert.equal(backup.legacy.logs.length,96);assert.equal(JSON.stringify(backup.legacy),legacy);
   assert.equal(backup.storage.logs.filter(r=>r.key.startsWith('local/')).length,95);
   assert.equal(backup.storage.pending.length,95,'Preserve the complete offline outbox');
   await choose(page);await page.waitForFunction(()=>PAGE.summary!==null&&DEVICE.pending===0);
   const current=await page.evaluate(async()=>({count:historyCount(),raw:logs.length,name:state.settings.name,owner:SYNC.owner,draft:state.draft,legacy:localStorage.getItem(LS),pending:await PAGE.store.pendingCount()}));
   assert.equal(current.count,95);assert.ok(current.raw<=31);assert.equal(current.name,'Current app edits');assert.equal(current.owner,'fixture-member');assert.equal(current.draft.paused,true);assert.equal(current.legacy,null);assert.equal(current.pending,95);
   await page.reload();await page.waitForFunction(()=>PAGE.summary!==null&&DEVICE.pending===0);
   assert.equal(await page.getByRole('heading',{name:'Two device copies found'}).count(),0);
   await page.evaluate(()=>{ui.tab='settings';ui.settingsGroup='account';ui.settingsPage='backup';render();});
   const later=await file(page,page.getByRole('button',{name:'Download device recovery copies'}));
   assert.equal(later.indexed.logs.length,95);assert.equal(later.olderCopies.length,1);assert.equal(JSON.stringify(later.olderCopies[0]),legacy);
   assert.equal(await page.evaluate(()=>DEVICE.store.deviceRecoveryAvailable('fixture-other')),false,'Do not expose archives to another account');
   await page.evaluate(async()=>{await clearDevice();});
   assert.equal(await page.evaluate(()=>DEVICE.store.deviceRecoveryAvailable('fixture-member')),false,'Sign-out/deletion clears private archives');
   assert.deepEqual(errors,[]);await context.close();console.log(`PASS ${width}px: complete download, explicit continuation, unchanged draft/owner/outbox, reload, private archive and cleanup`);
  }
  for(const failure of ['archive-write','legacy-race','indexed-race']){
   const {context,page,errors,legacy}=await open();
   if(failure==='archive-write')await page.evaluate(()=>{const original=DEVICE.store.tx.bind(DEVICE.store);DEVICE.store.tx=(names,mode,fn)=>mode==='readwrite'?Promise.reject(Error('Synthetic archive write failed')):original(names,mode,fn);});
   if(failure==='legacy-race')await page.evaluate(()=>{const old=JSON.parse(localStorage.getItem(LS));old.state.settings.name='Even later old tab';localStorage.setItem(LS,JSON.stringify(old));});
   if(failure==='indexed-race')await page.evaluate(async()=>{const other=createHistoryStore(LS),saved=await other.open();saved.state.settings.name='Another current tab';await other.write(saved);other.db.close();});
   await choose(page);await page.waitForFunction(()=>document.getElementById('device-recovery-message').textContent.length>0);
   assert.equal(await page.evaluate(()=>PAGE.active),false);assert.equal(await page.evaluate(()=>!!localStorage.getItem(LS)),true);
   const backup=await page.evaluate(()=>DEVICE.store.tx(['meta'],'readonly',t=>new Promise(resolve=>{const q=t.objectStore('meta').get('active');q.onsuccess=()=>resolve(q.result);})));assert.ok(backup.value.state);
   if(failure!=='legacy-race')assert.equal(await page.evaluate(()=>localStorage.getItem(LS)),legacy);
   await page.reload();await page.getByRole('heading',{name:'Two device copies found'}).waitFor();await choose(page);await page.waitForFunction(()=>PAGE.summary!==null&&DEVICE.pending===0);
   assert.equal(await page.evaluate(()=>historyCount()),95);assert.deepEqual(errors,[]);await context.close();console.log('PASS '+failure+': preserves both originals and retries safely after reload');
  }
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
