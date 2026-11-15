// Real Chromium IndexedDB and app flows, with a synthetic RPC transport.
// Optional URL verifies the exact hosted build; never signs in or writes to Supabase.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'dist/index.html'),'utf8');
const server=http.createServer((req,res)=>{try{const p=req.url.split('?')[0],file=path.join(root,'dist',p==='/'?'index.html':p);res.setHeader('Content-Type',file.endsWith('.html')?'text/html':file.endsWith('.js')?'text/javascript':'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end();}});
const COUNT=+(process.env.SYNC_TEST_COUNT||2600);
async function seed(page,count=COUNT){
 return page.evaluate(async count=>{
  state=defaults();state.setup=null;state.onboarded=true;Object.assign(state.settings,{name:'Synthetic history',goals:['muscle'],days:[1,3,5],split:'fb3',comfort:'machines',tstyle:'machines',cardio:{style:'walk',jog:'none',after:0}});
  state.places=[{k:'gym',n:'Synthetic gym',eq:PLACE_TYPES.gym.eq.split(' ')}];state.curPlace='gym';logs=[];newBlock();
  const slots=sessionSlots(weekKeys()[0]).slice(0,6);
  logs=Array.from({length:count},(_,i)=>({id:'synthetic-'+String(i).padStart(5,'0'),date:new Date(Date.UTC(2016,10,15)+i*1.4*86400000).toISOString(),name:'Synthetic workout',units:'lb',block:1+Math.floor(i/30),week:1,key:'full',status:'complete',entries:slots.map(sl=>({ex:sl.id,sets:Array.from({length:4},()=>({w:100,r:10,done:true}))}))}));
  SYNC={owner:null,base:null,conflict:null,recovery:null};AUTH.ready=true;ui.tab='history';
  const t=performance.now();persistLocal();await flushDevice();render();
  return {count:logs.length,jsonBytes:JSON.stringify(logs).length,saveMs:performance.now()-t,storageOk};
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
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const url=process.argv[2]||`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const report=[];
 try{
  for(const width of [1280,390]){
   const context=await browser.newContext({viewport:{width,height:844},serviceWorkers:'block'});
   const page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
   await page.route('**/*',r=>new URL(r.request().url()).origin===new URL(url).origin?r.continue():r.fulfill({status:200,body:''}));
   const response=await page.goto(url);assert.equal((await response.text()).replace(/\r\n/g,'\n'),html.replace(/\r\n/g,'\n'),'hosted source differs');
   await page.waitForFunction(()=>state!==null&&DEVICE.store&&DEVICE.pending===0);
   assert.equal(await page.evaluate(()=>IS_PRODUCTION),false);
   console.log('Seeding',width);const fixture=await seed(page);assert.equal(fixture.storageOk,true);
   await page.evaluate(()=>{window.render=render;window.puts=[];const put=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(value,...args){if(this.name==='logs')puts.push(args[0]);return put.call(this,value,...args);};});
   // Local state-only saves must not rewrite any workout record.
   assert.equal(await page.evaluate(async()=>{state.settings.name='Local edit';persistLocal();await flushDevice();return puts.length;}),0);
   assert.equal(await page.evaluate(()=>localStorage.getItem(LS)),null);
   await page.reload();await page.waitForFunction(()=>state!==null&&DEVICE.pending===0);
   assert.equal(await page.evaluate(()=>logs.length),COUNT);
   assert.equal(await page.evaluate(()=>state.settings.name),'Local edit');
   await connect(page);
   // Import larger than one batch; no unsent records may disappear.
   const initial=await page.evaluate(async()=>{const t=performance.now();const ok=await flushCloud();return {ok,count:logs.length,server:transport.snapshot.logs.length,ms:performance.now()-t,calls:transport.calls,storageError:String(DEVICE.error),sameState:sameSync(state,SYNC.base?.state),sameLogs:sameSync(logs,SYNC.base?.logs),pending:CLOUD.again};});
   console.log('Uploaded synthetic history',width,Math.round(initial.ms)+' ms');assert.equal(initial.ok,true);assert.equal(initial.count,COUNT);assert.equal(initial.server,COUNT);
   assert.ok(initial.calls.every(c=>c.upserts<=250));
   const bootstrap=await page.evaluate(async()=>{state=defaults();logs=[];SYNC.base=null;transport.calls=[];const ok=await flushCloud();return {ok,count:logs.length,rows:transport.calls.reduce((n,c)=>n+(c.rows||0),0),max:Math.max(...transport.calls.map(c=>c.rows||0))};});
   assert.equal(bootstrap.ok,true);assert.equal(bootstrap.count,COUNT);assert.equal(bootstrap.rows,COUNT);assert.ok(bootstrap.max<=250);
   const routine=await page.evaluate(async()=>{transport.calls=[];state.settings.name='Cloud state edit';save();const t=performance.now(),ok=await flushCloud();return {ok,ms:performance.now()-t,calls:transport.calls};});
   assert.equal(routine.ok,true);assert.ok(routine.calls.every(c=>!c.upserts&&!c.deletes&&!(c.rows>0)));
   const one=await page.evaluate(async()=>{transport.calls=[];logs[0].name='One edited workout';save();await flushCloud();return transport.calls;});
   assert.equal(one.reduce((sum,c)=>sum+c.upserts,0),1);
   const incoming=await page.evaluate(async()=>{
    transport.calls=[];const rev=String(BigInt(transport.snapshot.revision)+1n),changed=structuredClone(transport.snapshot.logs[1]);changed.name='Remote edit';
    const removed=transport.snapshot.logs.at(-1).id;
    transport.snapshot.logs=transport.snapshot.logs.filter(l=>l.id!==removed).map(l=>l.id===changed.id?changed:l);transport.snapshot.deleted.push(removed);transport.snapshot.revision=rev;
    transport.events.set(changed.id,{id:changed.id,data:changed,deleted:false,revision:rev});transport.events.set(removed,{id:removed,deleted:true,revision:rev});
    const ok=await flushCloud();return {ok,removed:logs.some(l=>l.id===removed),edited:logs.some(l=>l.name==='Remote edit'),rows:transport.calls.reduce((n,c)=>n+(c.rows||0),0)};
   });
   assert.equal(incoming.ok,true);assert.equal(incoming.removed,false);assert.equal(incoming.edited,true);assert.equal(incoming.rows,2);
   // A lost commit response must retain local data and reconcile without a resend.
   assert.equal(await page.evaluate(async()=>{transport.lose=true;logs[0].name='Lost-response edit';save();return await flushCloud();}),false);
   assert.equal(await page.evaluate(async()=>{transport.calls=[];return await flushCloud();}),true);
   assert.equal(await page.evaluate(()=>transport.calls.reduce((sum,c)=>sum+c.upserts,0)),0);
   // Offline edits survive a reload; transport is intentionally disconnected.
   await page.evaluate(async()=>{transport.fail=true;logs[0].name='Offline edit';save();await flushDevice();});
   await page.reload();await page.waitForFunction(()=>state!==null&&DEVICE.pending===0);
   assert.equal(await page.evaluate(()=>logs.find(l=>l.name==='Offline edit')?.name),'Offline edit');
   // Data stays local; avoid real auth/network and inspect the affected screens.
   await page.evaluate(()=>{AUTH.user={id:'synthetic-member'};AUTH.access='ok';AUTH.ready=true;sb=null;ui.tab='history';render();});
   assert.ok(await page.getByRole('heading',{name:'Progress',exact:true}).count());
   await page.evaluate(()=>{ui.tab='today';render();startWorkout(weekKeys()[0]);ui.tab='workout';render();});
   await page.evaluate(async()=>{const pk=dSlots()[0].pk;state.draft.sets[pk][0]={w:'105',r:'10',done:true};save();await flushDevice();});
   await page.reload();await page.waitForFunction(()=>state!==null&&DEVICE.pending===0);
   assert.equal(await page.evaluate(()=>Object.values(state.draft.sets).some(rows=>rows.some(r=>r.w==='105'&&r.done))),true);
   await page.evaluate(()=>{AUTH.user={id:'synthetic-member'};AUTH.access='ok';AUTH.ready=true;sb=null;ui.tab='workout';render();});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   fs.mkdirSync(path.join(root,'test-results'),{recursive:true});await page.screenshot({path:path.join(root,`test-results/incremental-${width}.png`),fullPage:true});
   // Transaction failure is visible and never removes the old committed copy.
   const failure=await page.evaluate(async()=>{const commit=DEVICE.store.commit;DEVICE.store.commit=async()=>{throw Error('Synthetic quota failure');};state.settings.name='Unsaved edit';persistLocal();await flushDevice();const result={ok:storageOk,status:saveStatus()[1]};DEVICE.store.commit=commit;return result;});
   assert.equal(failure.ok,false);assert.equal(failure.status,'Device save failed');
   assert.equal(await page.evaluate(async()=>{AUTH.user={id:'synthetic-member'};CLOUD.ok=true;sb={rpc:async()=>{throw Error('Unexpected RPC after failed device save');}};return await pushCloud();}),false);
   await page.evaluate(()=>{CLOUD.ok=false;sb=null;});
   await page.evaluate(async()=>{persistLocal();await flushDevice();});
   // Another app tab cannot silently replace this tab's newer pending copy.
   const tab=await context.newPage();await tab.route('**/*',r=>new URL(r.request().url()).origin===new URL(url).origin?r.continue():r.fulfill({status:200,body:''}));
   await tab.goto(url);await tab.waitForFunction(()=>state!==null&&DEVICE.pending===0);
   assert.equal(await page.evaluate(async()=>{state.settings.name='Stale tab';persistLocal();await flushDevice();return storageOk;}),false);
   await tab.close();await page.reload();await page.waitForFunction(()=>state!==null&&DEVICE.pending===0);
   assert.notEqual(await page.evaluate(()=>state.settings.name),'Stale tab');
   // Clear on successful sign-out and prevent recreation by an old writer.
   await page.evaluate(async()=>{AUTH.user={id:'synthetic-member'};AUTH.access='ok';await clearDeletedAccount();});
   assert.equal(await page.evaluate(()=>logs.length),0);
   await page.reload();await page.waitForFunction(()=>state!==null&&DEVICE.pending===0);assert.equal(await page.evaluate(()=>logs.length),0);
   await page.evaluate(async()=>{AUTH.user={id:'synthetic-member'};sb={auth:{signOut:async()=>({error:null})}};flushCloud=async()=>true;state.settings.name='Sign-out fixture';persistLocal();await flushDevice();await signOut();});
   await page.reload();await page.waitForFunction(()=>state!==null&&DEVICE.pending===0);assert.equal(await page.evaluate(()=>state.settings.name),'');
   assert.deepEqual(errors,[]);
   report.push({width,fixture,initialUploadMs:initial.ms,routine,oneEditedWorkoutRows:one.reduce((sum,c)=>sum+c.upserts,0)});
   await context.close();
  }
  // Migration and failed migration are exercised on fresh browser storage.
  const context=await browser.newContext({serviceWorkers:'block'}),page=await context.newPage();
  await page.route('**/*',r=>new URL(r.request().url()).origin===new URL(url).origin?r.continue():r.fulfill({status:200,body:''}));
  await page.goto(url);await page.waitForFunction(()=>state!==null&&DEVICE.pending===0);await seed(page,1560);
  const legacy=await page.evaluate(()=>({state,logs,sync:SYNC}));
  await context.close();
  for(const fail of [true,false]){
   const context=await browser.newContext({serviceWorkers:'block'}),page=await context.newPage();
   await page.addInitScript(({legacy,fail})=>{localStorage.setItem('dev_strongstart_state_v3',JSON.stringify(legacy));if(fail){const transaction=IDBDatabase.prototype.transaction;IDBDatabase.prototype.transaction=function(names,mode,...rest){if(mode==='readwrite')throw Error('Synthetic migration disk failure');return transaction.call(this,names,mode,...rest);};}}, {legacy,fail});
   await page.route('**/*',r=>new URL(r.request().url()).origin===new URL(url).origin?r.continue():r.fulfill({status:200,body:''}));
   await page.goto(url);await page.waitForFunction(()=>state!==null&&DEVICE.pending===0);
   assert.equal(await page.evaluate(()=>logs.length),1560);
   assert.equal(await page.evaluate(()=>!!localStorage.getItem(LS)),fail);
   assert.equal(await page.evaluate(()=>storageOk),!fail);
   await context.close();
  }
  fs.writeFileSync(path.join(root,'test-results/incremental-storage.json'),JSON.stringify({url,report,passed:'IndexedDB, ten-year history, batching, incremental payloads, lost response, offline reload, active draft, failure, concurrent tabs, deletion and legacy migration'},null,2));
  console.log(`PASS real IndexedDB and ${COUNT} synthetic workouts at desktop/phone widths`);console.log(JSON.stringify(report));
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
