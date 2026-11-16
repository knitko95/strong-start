const {chromium}=require('playwright'),assert=require('assert/strict'),fs=require('fs'),path=require('path');
const {seed,parity,connect,server,root}=require('./test-paged-history.cjs');
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}`,browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const open=async()=>{const c=await browser.newContext({serviceWorkers:'block',viewport:{width:390,height:844}});await c.addInitScript(()=>{IDBObjectStore.prototype.getAll=()=>{throw Error('Unbounded history read');};});await c.route('**/*',r=>r.request().url().startsWith(url)?r.continue():r.fulfill({body:''}));const p=await c.newPage();await p.goto(url);await p.waitForFunction(()=>PAGE.summary!==null&&DEVICE.pending===0);return {c,p};};
try{
 const {c,p}=await open(),errors=[];p.on('pageerror',e=>errors.push(e.message));await seed(p,120);await connect(p);assert.equal(await p.evaluate(()=>flushCloud()),true);
 const conflict=await p.evaluate(async()=>{
  const l=logs[0];l.name='Device version';save();await flushDevice();const remote=structuredClone(transport.snapshot.logs.find(x=>x.id===l.id));remote.name='Account version';const rev=String(BigInt(transport.snapshot.revision)+1n);transport.snapshot.logs=transport.snapshot.logs.map(x=>x.id===remote.id?remote:x);transport.snapshot.revision=rev;transport.events.set(remote.id,{id:remote.id,data:remote,deleted:false,revision:rev});
  const ok=await flushCloud();return {ok,id:l.id,conflict:SYNC.conflict,row:await PAGE.store.get(l.id,state.settings.units)};
 });assert.equal(conflict.ok,false);assert.equal(conflict.conflict.recordCount,1);assert.equal(conflict.conflict.logs.length,0);assert.equal(conflict.row.name,'Device version');
 await p.evaluate(()=>resolveSyncConflict('account'));assert.equal(await p.evaluate(()=>SYNC.conflict),null);
 assert.equal(await p.evaluate(async id=>(await PAGE.store.get(id,state.settings.units)).name,conflict.id),'Account version');
 const recovery=await p.evaluate(async()=>JSON.parse((await PAGE.store.exportParts(SYNC.recovery.device.state,'device')).join('')));assert.equal(recovery.logs.length,120);assert.equal(recovery.logs.find(l=>l.id===conflict.id).name,'Device version');
 await p.evaluate(async()=>{state.settings.name='Local plan';save();await flushDevice();transport.snapshot.state.settings.name='Remote plan';transport.snapshot.revision=String(BigInt(transport.snapshot.revision)+1n);await flushCloud();});assert.equal(await p.evaluate(()=>SYNC.conflict.stateConflict),true);await p.evaluate(()=>resolveSyncConflict('account'));assert.equal(await p.evaluate(()=>state.settings.name),'Remote plan');
 await p.evaluate(()=>{transport.hold=true;state.settings.name='First upload';save();globalThis.pendingUpload=pushCloud();});await p.waitForFunction(()=>transport.release!==null);
 await p.evaluate(async()=>{state.settings.name='Edit during upload';logs[0].name='Latest workout edit';save();await flushDevice();transport.hold=false;transport.release();});assert.equal(await p.evaluate(()=>pendingUpload),true);assert.equal(await p.evaluate(()=>transport.snapshot.state.settings.name),'Edit during upload');assert.ok(await p.evaluate(()=>transport.snapshot.logs.some(l=>l.name==='Latest workout edit')));
 // Exercise the real coach preview cache, without any role/database mutation.
 const preview=await p.evaluate(async()=>{
  const own=JSON.stringify(await PAGE.store.exportParts(state)),ownStore=PAGE.store,memberState=structuredClone(state);memberState.settings.name='Preview member';memberState.draft=null;
  const member=Array.from({length:1200},(_,i)=>({...structuredClone(transport.snapshot.logs[i%transport.snapshot.logs.length]),id:'member-'+String(i).padStart(5,'0')})).sort((a,b)=>Date.parse(b.date)-Date.parse(a.date)||b.id.localeCompare(a.id));
  sb.from=table=>{const q={select(){return q;},eq(){return q;},order(){return q;},async maybeSingle(){return {data:{state:memberState,revision:'1'}};},async range(a,b){return {data:member.slice(a,b+1).map(data=>({data}))};}};return q;};
  await openPerson('fixture-member','Preview member');const result={count:historyCount(),raw:logs.length,temp:coachMode?.temporary?.name,ownUnchanged:JSON.stringify(await ownStore.exportParts(coachMode.own.state))===own};
  state.settings.name='Unsent preview edits';save();persistLocal();await flushDevice();result.stillUnchanged=JSON.stringify(await ownStore.exportParts(coachMode.own.state))===own;exitPagedPerson();result.after=state.settings.name;return result;
 });assert.equal(preview.count,1200);assert.ok(preview.raw<=31);assert.equal(preview.ownUnchanged,true);assert.equal(preview.stillUnchanged,true);assert.equal(preview.after,'Edit during upload');await p.waitForFunction(async name=>(await indexedDB.databases()).every(d=>d.name!==name),preview.temp+'_indexed');
 // Repeated offline recording cannot accumulate a growing in-memory log list.
 await p.evaluate(()=>{CLOUD.ok=false;sb=null;AUTH.user=null;});
 for(let i=0;i<5;i++){await p.evaluate(async()=>{startWorkout(nextWorkoutKey());const pk=dSlots()[0].pk;state.draft.sets[pk][0]={w:'25',r:'10',done:true};finishWorkout();await flushDevice();});await p.waitForFunction(()=>logs.length<=31&&!PAGE.reloadFlight&&PAGE.loadedHistory===PAGE.store.historyVersion);}
 await p.evaluate(()=>refreshHistory(false));assert.equal(await p.evaluate(()=>historyCount()),125);
 // Equal timestamps, mixed-case IDs and unrelated sessions preserve old rules.
 await p.evaluate(async()=>{
  state.draft=null;const ex=LIB.find(e=>e.n==='Dumbbell Bench Press'),low=LIB.find(e=>e.n==='Goblet Squat'),power=LIB.find(e=>e.mode==='P');
  logs=['z','A','a','Z','b','B'].map((id,i)=>({id,date:'2026-10-01T12:00:00Z',name:id,units:'lb',block:state.block.n,week:1,key:weekKeys()[0],entries:[{ex:ex.id,name:ex.n,sets:[{w:10+i*10,r:10}]}]}));
  logs.push(...[0,1,2,3].map(i=>({id:'lower-'+i,date:new Date(Date.UTC(2026,9,2+i)).toISOString(),units:'lb',block:state.block.n,week:1,key:weekKeys()[0],name:'Lower',entries:[{ex:low.id,name:low.n,sets:[{w:20+i*5,r:10}]}]})),{id:'unsupported-only',date:'2026-10-10',units:'lb',name:'Power',entries:[{ex:power.id,name:power.n,sets:[{w:0,r:10}]}]},{id:'invalid-date',date:'not a date',name:'Invalid date',entries:[]});
  await PAGE.store.replace({state,logs,sync:compactSync(SYNC)});await loadHistoryPage(null,null,false);await refreshHistory(false);
 });await parity(p);assert.deepEqual(errors,[]);await c.close();
 const memory=[];
 for(const count of [2600,26000]){
  const {c,p}=await open();await seed(p,count);await p.reload();await p.waitForFunction(n=>PAGE.summary?.count===n&&DEVICE.pending===0,count);
  const session=await c.newCDPSession(p);await session.send('HeapProfiler.collectGarbage');const heap=await session.send('Runtime.getHeapUsage');
  const retained=await p.evaluate(()=>({total:historyCount(),raw:logs.length,baseline:SYNC.base?.logs.length||0,view:PAGE.store.view.size,maximumChart:Math.max(...Object.values(PAGE.summary.graphs).map(g=>g.points.length))}));assert.ok(retained.raw<=31&&retained.view<=31&&retained.baseline===0&&retained.maximumChart<=600);memory.push({count,heapBytes:heap.usedSize,...retained});await c.close();
 }
 assert.ok(memory[1].heapBytes<memory[0].heapBytes+8*1024*1024,'retained heap grows with raw history');
 fs.writeFileSync(path.join(root,'test-results/history-memory.json'),JSON.stringify(memory,null,2));console.log('PASS disk-backed conflicts, edits during upload, coach isolation, repeated offline saves, tie ordering and history-independent heap');console.log(JSON.stringify(memory));
}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
