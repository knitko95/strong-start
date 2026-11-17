// Real Chromium IndexedDB and app flows, with a synthetic RPC transport.
// Optional URL verifies the exact hosted build; never signs in or writes to Supabase.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'dist/index.html'),'utf8');
const server=http.createServer((req,res)=>{try{const p=req.url.split('?')[0],file=path.join(root,'dist',p==='/'?'index.html':p);res.setHeader('Content-Type',file.endsWith('.html')?'text/html':file.endsWith('.css')?'text/css':file.endsWith('.js')?'text/javascript':'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end();}});
const COUNT=+(process.env.SYNC_TEST_COUNT||2600);
async function parity(page){
 await page.addScriptTag({content:fs.readFileSync(path.join(root,'scripts/fixtures/full-history-reference.js'),'utf8')});
 const result=await page.evaluate(async()=>{
  await refreshHistory(false);
  const all=JSON.parse((await PAGE.store.exportParts(state)).join('')).logs.sort((a,b)=>Date.parse(b.date)-Date.parse(a.date)||a.id.localeCompare(b.id));
  const reference=fullHistoryReference({logs:normalizeLogs(copySync(all),state.settings.units),state,EX,historyArea}),actual=PAGE.summary,problems=[];let maximumError=0,samples=0;
  const near=(a,b,label)=>{const error=Math.abs(a-b);maximumError=Math.max(maximumError,error);if(!Number.isFinite(error)||error>1e-8)problems.push(label+': '+a+' / '+b);};
  for(const area of ['overall','upper','lower']){
    const expected=reference.groups.filter(g=>g.ready&&(area==='overall'||g.area===area)),g=actual.graphs[area];
    if(expected.map(g=>g.id).sort().join()!==g.eligible.map(g=>g.id).sort().join())problems.push('eligible cohort '+area);
    if(expected.length){near(g.score,expected.reduce((n,g)=>n+g.ratio*100,0)/expected.length,'score '+area);for(const p of g.points){near(p.v,reference.at(area,+p.d),'chart '+area);samples++;}}
    if(g.points.length>600)problems.push('unbounded chart '+area);
  }
  for(const g of reference.groups){const actualGroup=actual.groups.find(x=>x.id===g.id);if(!actualGroup||actualGroup.ready!==g.ready)problems.push('eligibility '+g.id);if(g.ready){near(actualGroup.baseline,g.baseline,'baseline '+g.id);near(actualGroup.ratio,g.ratio,'ratio '+g.id);}}
  for(const id of Object.keys(actual.experience)){
    const records=all.filter(l=>l.entries.some(e=>e.ex===id)),top=records.slice().reverse().map(l=>Math.max(0,...l.entries.find(e=>e.ex===id).sets.map(s=>+s.w||0)));
    if(exSessions(id)!==records.length)problems.push('exercise count '+id);
    if((programsWith(id)>=2)!==(new Set(records.map(l=>l.block)).size>=2))problems.push('program count '+id);
    const stalledExpected=top.length>=4&&Math.max(...top.slice(-3))<=Math.max(...top.slice(0,-3));
    // Compare in a common display unit, matching normal history normalization.
    const normalized=normalizeLogs(copySync(records),state.settings.units),weights=normalized.slice().reverse().map(l=>Math.max(0,...l.entries.find(e=>e.ex===id).sets.map(s=>+s.w||0)));
    const sameStall=weights.length>=4&&Math.max(...weights.slice(-3))<=Math.max(...weights.slice(0,-3));if(stalled(id)!==sameStall)problems.push('stall '+id);
  }
  const finished=all.filter(l=>l.block===state.block.n&&l.status!=='partial'&&l.orderAdvanced!==false&&weekKeys().includes(l.key)&&(!state.block.sequenceResetAt||Date.parse(l.completedAt||l.date)>Date.parse(state.block.sequenceResetAt))).sort((a,b)=>Date.parse(b.completedAt||b.date)-Date.parse(a.completedAt||a.date));
  const expectedNext=finished.length?weekKeys()[(weekKeys().indexOf(finished[0].key)+1)%weekKeys().length]:weekKeys()[0];if(nextWorkoutKey()!==expectedNext)problems.push('workout sequence');
  if(logs.length>31||PAGE.store.view.size>31||SYNC.base?.logs?.length>0)problems.push('unbounded raw cache/baseline');
  return {count:all.length,rawInMemory:logs.length,samples,maximumError,problems};
 });
 assert.deepEqual(result.problems,[]);console.log('Calculation parity',JSON.stringify(result));return result;
}
async function seed(page,count=COUNT){
 return page.evaluate(async count=>{
  state=defaults();state.setup=null;state.onboarded=true;Object.assign(state.settings,{name:'Synthetic history',goals:['muscle'],days:[1,3,5],split:'fb3',comfort:'machines',tstyle:'machines',cardio:{style:'walk',jog:'none',after:0}});
  state.places=[{k:'gym',n:'Synthetic gym',eq:PLACE_TYPES.gym.eq.split(' ')}];state.curPlace='gym';logs=[];newBlock();
  const slots=[LIB.find(e=>e.mode==='L'&&!e.req.some(g=>g.includes('assist'))),LIB.find(e=>e.mode==='B'),LIB.find(e=>e.mode==='T'),LIB.find(e=>e.req.some(g=>g.includes('assist'))),LIB.find(e=>e.mode==='P'),LIB.find(e=>e.mode==='R')].filter(Boolean).map(e=>({id:e.id}));
  logs=Array.from({length:count},(_,i)=>({
    id:'synthetic-'+String(i).padStart(5,'0'),date:new Date(Date.UTC(2016,10,15)+i*(3652/count)*86400000).toISOString(),name:'Synthetic workout',
    units:i%7===0?'kg':'lb',block:1+Math.floor(i/30),week:i%6+1,key:weekKeys()[i%weekKeys().length],status:i%17===0?'partial':'complete',
    entries:slots.map((sl,j)=>({ex:sl.id,name:EX[sl.id].n,sets:Array.from({length:4},(_,k)=>({
      w:EX[sl.id].mode==='L'?(100+i%25*2+j+k)*(i%7===0?0.45359237:1):EX[sl.id].mode==='B'&&i%19===0?10:0,r:8+i%5+k,done:true
    }))}))
  }));
  logs.forEach((l,i)=>{
    for(const e of l.entries)if(EX[e.ex]?.mode==='R')e.plan=i%9===0?'4×30 sec':'4×8–12 reps';
    if(i%23===0)l.entries.push({...structuredClone(l.entries[0]),sets:[{w:150*(l.units==='kg'?0.45359237:1),r:12}]});
    if(i%37===0)l.entries[0].sets.push({w:100,r:35});
    if(i%41===0)l.entries[0].sets=[{w:null,r:10},{w:-5,r:10},{w:'bad',r:10},{w:50,r:31}];
    if(i%27===0)l.entries.push({ex:'archived-exercise',name:'Archived <exercise>',sets:[{w:0,r:12}]});
  });
  SYNC={owner:null,base:null,conflict:null,recovery:null};AUTH.ready=true;ui.tab='history';
  const t=performance.now();await PAGE.store.replace({state,logs,sync:compactSync(SYNC)});await loadHistoryPage(null,null,false);await refreshHistory(false);persistLocal();await flushDevice();render();
  return {count:historyCount(),rawInMemory:logs.length,jsonBytes:JSON.stringify(logs).length,saveMs:performance.now()-t,storageOk};
 },count);
}
async function connect(page){
 await page.evaluate(async()=>{
  window.transport={snapshot:{revision:'0',state:null,logs:[],deleted:[]},events:new Map(),calls:[],fail:false,lose:false,hold:false,release:null};
  const t=transport,clone=x=>structuredClone(x);
  sb={rpc:async(name,p)=>{
   t.calls.push({name,bytes:JSON.stringify(p||{}).length,upserts:p?.p_upserts?.length||0,deletes:p?.p_deletes?.length||0});
   if(t.fail)return {error:{message:'Synthetic offline'}};
   if(name==='read_account_changes'){
    if(p.p_expected!==null&&p.p_expected!==t.snapshot.revision)return {data:{restart:true}};
    const changes=[...t.events.values()].filter(e=>(p.p_since===null||BigInt(e.revision)>BigInt(p.p_since))&&(p.p_after===null||e.id>p.p_after)).sort((a,b)=>a.id.localeCompare(b.id));
    t.calls.at(-1).rows=changes.slice(0,250).length;
    return {data:{revision:t.snapshot.revision,state:clone(t.snapshot.state),changes:clone(changes.slice(0,250)),next:changes.length>250?changes[249].id:null}};
   }
   if(name==='commit_account_changes'){
    if(t.hold)await new Promise(resolve=>t.release=resolve);
    if(t.fail)return {error:{message:'Synthetic offline'}};
    if(p.p_revision!==t.snapshot.revision)return {data:{ok:false}};
    const byId=new Map(t.snapshot.logs.map(l=>[l.id,l])),rev=String(BigInt(t.snapshot.revision)+1n);
    for(const l of p.p_upserts){byId.set(l.id,clone(l));t.events.set(l.id,{id:l.id,data:clone(l),deleted:false,revision:rev});}
    for(const id of p.p_deletes){byId.delete(id);t.events.set(id,{id,deleted:true,revision:rev});t.snapshot.deleted.push(id);}
    t.snapshot={...t.snapshot,state:clone(p.p_state),logs:[...byId.values()],revision:rev};
    if(t.lose){t.lose=false;return {error:{message:'Synthetic lost response'}};}
    return {data:{ok:true,revision:rev,state:clone(p.p_state),applied:0}};
   }
   return {data:false};
  },auth:{signOut:async()=>({error:null})}};
  AUTH.user={id:'synthetic-member',email:'synthetic@example.invalid'};AUTH.access='ok';SYNC.owner=AUTH.user.id;CLOUD.ok=true;
  lsSet(ACCT_KEY,JSON.stringify(AUTH.user));lsSet('strongstart_owner',AUTH.user.id);
 });
}
async function run(){
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const url=process.argv[2]||`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const report=[];
 try{
  for(const width of [1280,390]){
   const context=await browser.newContext({viewport:{width,height:844},serviceWorkers:'block'});
   await context.addInitScript(()=>{IDBObjectStore.prototype.getAll=function(){throw Error('Unbounded IndexedDB getAll is forbidden');};});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
   await page.route('**/*',r=>new URL(r.request().url()).origin===new URL(url).origin?r.continue():r.fulfill({status:200,body:''}));
   const response=await page.goto(url);assert.equal((await response.text()).replace(/\r\n/g,'\n'),html.replace(/\r\n/g,'\n'),'hosted source differs');
   await page.waitForFunction(()=>state!==null&&PAGE.summary!==null&&DEVICE.store&&DEVICE.pending===0);
   assert.equal(await page.evaluate(()=>IS_PRODUCTION),false);
   console.log('Seeding',width);const fixture=await seed(page);await parity(page);assert.equal(fixture.storageOk,true);assert.ok(fixture.rawInMemory<=31);
   await page.evaluate(()=>{window.render=render;window.puts=[];const put=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(value,...args){if(this.name==='logs')puts.push(args[0]);return put.call(this,value,...args);};});
   // Local state-only saves must not rewrite any workout record.
   assert.equal(await page.evaluate(async()=>{state.settings.name='Local edit';persistLocal();await flushDevice();return puts.length;}),0);
   assert.equal(await page.evaluate(()=>localStorage.getItem(LS)),null);
   await page.reload();await page.waitForFunction(()=>state!==null&&PAGE.summary!==null&&DEVICE.pending===0);
   assert.equal(await page.evaluate(()=>historyCount()),COUNT);assert.ok(await page.evaluate(()=>logs.length<=31));
   assert.equal(await page.evaluate(()=>state.settings.name),'Local edit');
   if(COUNT>30){await page.evaluate(()=>{AUTH.ready=true;sb=null;ui.tab='history';ui.histView='sessions';render();});await page.getByRole('button',{name:'Older sessions',exact:true}).click();await page.waitForFunction(()=>PAGE.view.before!==null);assert.ok(await page.evaluate(()=>logs.length<=31));await page.getByRole('button',{name:'Latest sessions',exact:true}).click();await page.waitForFunction(()=>PAGE.view.before===null);}
   await connect(page);
   // Import larger than one batch; no unsent records may disappear.
   const initial=await page.evaluate(async()=>{const t=performance.now();const ok=await flushCloud();return {ok,count:historyCount(),rawInMemory:logs.length,server:transport.snapshot.logs.length,ms:performance.now()-t,calls:transport.calls,storageError:String(DEVICE.error),sameState:sameSync(state,SYNC.base?.state),sameLogs:sameSync(logs,SYNC.base?.logs),pending:CLOUD.again};});
   console.log('Uploaded synthetic history',width,Math.round(initial.ms)+' ms');assert.equal(initial.ok,true);assert.equal(initial.count,COUNT);assert.equal(initial.server,COUNT);
   assert.ok(initial.calls.every(c=>c.upserts<=250));
   const bootstrap=await page.evaluate(async()=>{state=defaults();logs=[];SYNC.base=null;transport.calls=[];const ok=await flushCloud();return {ok,count:historyCount(),rawInMemory:logs.length,rows:transport.calls.reduce((n,c)=>n+(c.rows||0),0),max:Math.max(...transport.calls.map(c=>c.rows||0))};});
   assert.equal(bootstrap.ok,true);assert.equal(bootstrap.count,COUNT);assert.equal(bootstrap.rows,COUNT);assert.ok(bootstrap.max<=250);
   const routine=await page.evaluate(async()=>{transport.calls=[];state.settings.name='Cloud state edit';save();const t=performance.now(),ok=await flushCloud();return {ok,ms:performance.now()-t,calls:transport.calls};});
   assert.equal(routine.ok,true);assert.ok(routine.calls.every(c=>!c.upserts&&!c.deletes&&!(c.rows>0)));
   const one=await page.evaluate(async()=>{transport.calls=[];logs[0].name='One edited workout';save();await flushCloud();return transport.calls;});
   assert.equal(one.reduce((sum,c)=>sum+c.upserts,0),1);
   const incoming=await page.evaluate(async()=>{
    transport.calls=[];const rev=String(BigInt(transport.snapshot.revision)+1n),changed=structuredClone(transport.snapshot.logs[2]);changed.name='Remote edit';
    const removed=transport.snapshot.logs[1].id;
    transport.snapshot.logs=transport.snapshot.logs.filter(l=>l.id!==removed).map(l=>l.id===changed.id?changed:l);transport.snapshot.deleted.push(removed);transport.snapshot.revision=rev;
    transport.events.set(changed.id,{id:changed.id,data:changed,deleted:false,revision:rev});transport.events.set(removed,{id:removed,deleted:true,revision:rev});
    const ok=await flushCloud();return {ok,removed:!!await PAGE.store.get(removed,state.settings.units),edited:(await PAGE.store.get(changed.id,state.settings.units))?.name==='Remote edit',rows:transport.calls.reduce((n,c)=>n+(c.rows||0),0)};
   });
   assert.equal(incoming.ok,true);assert.equal(incoming.removed,false);assert.equal(incoming.edited,true);assert.equal(incoming.rows,2);await parity(page);
   await page.evaluate(async()=>{await pagedDelete('synthetic-00002');await flushCloud();});await parity(page);
   // A lost commit response must retain local data and reconcile without a resend.
   assert.equal(await page.evaluate(async()=>{transport.lose=true;logs[0].name='Lost-response edit';save();return await flushCloud();}),false);
   assert.equal(await page.evaluate(async()=>{transport.calls=[];return await flushCloud();}),true);
   assert.equal(await page.evaluate(()=>transport.calls.reduce((sum,c)=>sum+c.upserts,0)),0);
   // Offline edits survive a reload; transport is intentionally disconnected.
   await page.evaluate(async()=>{transport.fail=true;logs[0].name='Offline edit';save();await flushDevice();});
   await page.reload();await page.waitForFunction(()=>state!==null&&PAGE.summary!==null&&DEVICE.pending===0);
   assert.equal(await page.evaluate(()=>logs.find(l=>l.name==='Offline edit')?.name),'Offline edit');
   // Data stays local; avoid real auth/network and inspect the affected screens.
   await page.evaluate(()=>{AUTH.user={id:'synthetic-member'};AUTH.access='ok';AUTH.ready=true;sb=null;ui.tab='history';render();});
   assert.ok(await page.getByRole('heading',{name:'Progress',exact:true}).count());
   await page.evaluate(()=>{ui.tab='today';render();startWorkout(weekKeys()[0]);ui.tab='workout';render();});
   await page.evaluate(async()=>{const pk=dSlots()[0].pk;state.draft.sets[pk][0]={w:'105',r:'10',done:true};save();await flushDevice();});
   await page.reload();await page.waitForFunction(()=>state!==null&&PAGE.summary!==null&&DEVICE.pending===0);
   assert.equal(await page.evaluate(()=>Object.values(state.draft.sets).some(rows=>rows.some(r=>r.w==='105'&&r.done))),true);
   await page.evaluate(()=>{AUTH.user={id:'synthetic-member'};AUTH.access='ok';AUTH.ready=true;sb=null;ui.tab='workout';render();});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   fs.mkdirSync(path.join(root,'test-results'),{recursive:true});await page.screenshot({path:path.join(root,`test-results/incremental-${width}.png`),fullPage:true});
   // Transaction failure is visible and never removes the old committed copy.
   const failure=await page.evaluate(async()=>{const commit=DEVICE.store.tx;DEVICE.store.tx=async function(names,mode,fn){if(mode==='readwrite')throw Error('Synthetic quota failure');return commit.call(this,names,mode,fn);};state.settings.name='Unsaved edit';persistLocal();await flushDevice();const result={ok:storageOk,status:saveStatus()[1]};globalThis.restoreDeviceTx=()=>{DEVICE.store.tx=commit;};return result;});
   assert.equal(failure.ok,false);assert.equal(failure.status,'Device save failed');
   const [safeBackup]=await Promise.all([page.waitForEvent('download'),page.evaluate(()=>downloadHistoryBackup())]);const safeData=JSON.parse(fs.readFileSync(await safeBackup.path(),'utf8'));assert.equal(safeData.state.settings.name,'Unsaved edit');assert.equal(safeData.logs.length,COUNT-2);
   assert.equal(await page.evaluate(async()=>{AUTH.user={id:'synthetic-member'};CLOUD.ok=true;sb={rpc:async()=>{throw Error('Unexpected RPC after failed device save');}};return await pushCloud();}),false);
   await page.evaluate(()=>{CLOUD.ok=false;sb=null;restoreDeviceTx();});
   await page.evaluate(async()=>{persistLocal();await flushDevice();});
   // Another app tab cannot silently replace this tab's newer pending copy.
   const tab=await context.newPage();await tab.route('**/*',r=>new URL(r.request().url()).origin===new URL(url).origin?r.continue():r.fulfill({status:200,body:''}));
   await tab.goto(url);await tab.waitForFunction(()=>state!==null&&PAGE.summary!==null&&DEVICE.pending===0);
   assert.equal(await page.evaluate(async()=>{state.settings.name='Stale tab';persistLocal();await flushDevice();return storageOk;}),false);
   await tab.close();await page.reload();await page.waitForFunction(()=>state!==null&&PAGE.summary!==null&&DEVICE.pending===0);
   assert.notEqual(await page.evaluate(()=>state.settings.name),'Stale tab');
   // Clear on successful sign-out and prevent recreation by an old writer.
   await page.evaluate(async()=>{AUTH.user={id:'synthetic-member'};AUTH.access='ok';await clearDeletedAccount();});
   assert.equal(await page.evaluate(()=>logs.length),0);
   await page.reload();await page.waitForFunction(()=>state!==null&&PAGE.summary!==null&&DEVICE.pending===0);assert.equal(await page.evaluate(()=>logs.length),0);
   await page.evaluate(async()=>{AUTH.user={id:'synthetic-member'};sb={auth:{signOut:async()=>({error:null})}};flushCloud=async()=>true;state.settings.name='Sign-out fixture';persistLocal();await flushDevice();await signOut();});
   await page.reload();await page.waitForFunction(()=>state!==null&&PAGE.summary!==null&&DEVICE.pending===0);assert.equal(await page.evaluate(()=>state.settings.name),'');
   assert.deepEqual(errors,[]);assert.ok(await page.evaluate(()=>logs.length<=31));
   report.push({width,fixture,initialUploadMs:initial.ms,routine,oneEditedWorkoutRows:one.reduce((sum,c)=>sum+c.upserts,0)});
   await context.close();
  }
  // Migration and failed migration are exercised on fresh browser storage.
  const context=await browser.newContext({serviceWorkers:'block'}),page=await context.newPage();
  await page.route('**/*',r=>new URL(r.request().url()).origin===new URL(url).origin?r.continue():r.fulfill({status:200,body:''}));
  await page.goto(url);await page.waitForFunction(()=>state!==null&&PAGE.summary!==null&&DEVICE.pending===0);await seed(page,1560);
  const legacy=await page.evaluate(async()=>JSON.parse((await PAGE.store.exportParts(state)).join('')));legacy.sync={owner:null,base:null,conflict:null,recovery:null};
  await context.close();
  for(const fail of [true,false]){
   const context=await browser.newContext({serviceWorkers:'block'}),page=await context.newPage();
   await page.addInitScript(({legacy,fail})=>{localStorage.setItem('dev_strongstart_state_v3',JSON.stringify(legacy));if(fail){const transaction=IDBDatabase.prototype.transaction;IDBDatabase.prototype.transaction=function(names,mode,...rest){if(mode==='readwrite')throw Error('Synthetic migration disk failure');return transaction.call(this,names,mode,...rest);};}}, {legacy,fail});
   await page.route('**/*',r=>new URL(r.request().url()).origin===new URL(url).origin?r.continue():r.fulfill({status:200,body:''}));
   await page.goto(url);if(fail)await page.getByRole('heading',{name:'Device storage unavailable'}).waitFor();else{await page.waitForFunction(()=>state!==null&&PAGE.summary!==null&&DEVICE.pending===0);assert.equal(await page.evaluate(()=>historyCount()),1560);assert.ok(await page.evaluate(()=>logs.length<=31));}
   assert.equal(await page.evaluate(()=>!!localStorage.getItem(LS)),fail);
   assert.equal(await page.evaluate(()=>storageOk),!fail);
   await context.close();
  }
  fs.writeFileSync(path.join(root,'test-results/incremental-storage.json'),JSON.stringify({url,report,passed:'IndexedDB, ten-year history, batching, incremental payloads, lost response, offline reload, active draft, failure, concurrent tabs, deletion and legacy migration'},null,2));
  console.log(`PASS real IndexedDB and ${COUNT} synthetic workouts at desktop/phone widths`);console.log(JSON.stringify(report));
 }finally{await browser.close();server.close();}
}
module.exports={run,seed,parity,connect,server,root,html};
if(require.main===module)run().catch(e=>{console.error(e);server.close();process.exitCode=1;});
