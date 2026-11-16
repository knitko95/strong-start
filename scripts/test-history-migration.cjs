// Real IndexedDB v1 and legacy JSON migration, including unsynced conflicts.
const {chromium}=require('playwright'),fs=require('fs'),http=require('http'),path=require('path'),assert=require('assert/strict');
const root=path.resolve(__dirname,'..'),server=http.createServer((q,r)=>{try{if(q.url==='/blank'){r.setHeader('Content-Type','text/html');r.end('<!doctype html><title>Fixture</title>');return;}const file=path.join(root,'dist',q.url==='/'?'index.html':q.url.split('?')[0]);r.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':'text/html');r.end(fs.readFileSync(file));}catch{r.writeHead(404);r.end();}});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}`,b=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
try{
 const setup=await b.newContext({serviceWorkers:'block'});await setup.route('**/*',r=>r.request().url().startsWith(url)?r.continue():r.fulfill({body:''}));const p=await setup.newPage();await p.goto(url);await p.waitForFunction(()=>PAGE.summary!==null&&DEVICE.pending===0);
 const fixture=await p.evaluate(()=>{
  state=defaults();state.setup=null;state.onboarded=true;Object.assign(state.settings,{name:'Baseline',goals:['muscle'],days:[1,4],split:'ul2',comfort:'machines',tstyle:'machines'});state.places=[{k:'gym',n:'Gym',eq:PLACE_TYPES.gym.eq.split(' ')}];state.curPlace='gym';newBlock();
  const baseState=copySync(state),ex=LIB.find(e=>e.mode==='L'),base=Array.from({length:60},(_,i)=>({id:'old-'+String(i).padStart(3,'0'),date:new Date(Date.UTC(2020,0,1)+i*86400000).toISOString(),name:'Old workout',block:1,week:1,key:weekKeys()[0],entries:[{ex:ex.id,name:ex.n,sets:[{w:20,r:10}],plan:'1×10 reps'}]}));
  startWorkout(weekKeys()[0]);const localState=copySync(state);localState.settings.name='Device edits';localState.draft.logId=base[2].id;localState.draft.partialSaved=true;localState.draft.paused=true;
  const remoteState=copySync(baseState);remoteState.settings.name='Account edits';const local=copySync(base).filter(l=>l.id!==base[1].id),remote=copySync(base).filter(l=>l.id!==base[2].id);local[0].entries[0].sets[0].w=25;remote[0].entries[0].sets[0].w=30;remote.push({...copySync(base[5]),id:'remote-new'});
  return {baseState,localState,remoteState,base,local,remote,deleted:[base[2].id]};
 });await setup.close();
 for(const kind of ['indexed-v1','legacy-json']){
  const c=await b.newContext({serviceWorkers:'block'});await c.route('**/*',r=>r.request().url().startsWith(url)?r.continue():r.fulfill({body:''}));const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(url+'/blank');
  await p.evaluate(async({f,kind})=>{
   const sync={owner:'fixture-member',base:{state:f.baseState,logs:[],deleted:[],revision:'1'},conflict:{state:f.remoteState,logs:[],deleted:f.deleted,revision:'2'},recovery:null};
   if(kind==='legacy-json'){sync.base.logs=f.base;sync.conflict.logs=f.remote;localStorage.setItem('dev_strongstart_state_v3',JSON.stringify({state:f.localState,logs:f.local,sync}));return;}
   const db=await new Promise((ok,no)=>{const r=indexedDB.open('dev_strongstart_state_v3_indexed',1);r.onupgradeneeded=()=>{r.result.createObjectStore('meta');r.result.createObjectStore('logs');};r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error);});
   await new Promise((ok,no)=>{const t=db.transaction(['meta','logs'],'readwrite');t.objectStore('meta').put({version:1,value:{state:f.localState,logs:[],sync}},'active');for(const [slot,rows] of [['local',f.local],['base',f.base],['conflict',f.remote]])for(const data of rows)t.objectStore('logs').put({key:slot+'/'+data.id,data},slot+'/'+data.id);t.oncomplete=ok;t.onerror=()=>no(t.error);});db.close();
  },{f:fixture,kind});
  await p.addInitScript(()=>{IDBObjectStore.prototype.getAll=()=>{throw Error('Unbounded legacy read');};});await p.goto(url);await p.waitForFunction(()=>PAGE.summary!==null&&DEVICE.pending===0);
  const result=await p.evaluate(async()=>({count:historyCount(),raw:logs.length,conflict:SYNC.conflict,pending:await PAGE.store.pending(),draft:state.draft,local:await PAGE.store.get('old-000','lb'),removed:await PAGE.store.get('old-002','lb'),added:await PAGE.store.get('remote-new','lb'),legacy:localStorage.getItem(LS)}));
  assert.equal(result.count,59);assert.ok(result.raw<=31);assert.equal(result.conflict.stateConflict,true);assert.equal(result.conflict.recordCount,1);assert.equal(result.local.entries[0].sets[0].w,25);assert.equal(result.removed,null);assert.ok(result.added);assert.equal(result.draft.logId,undefined);assert.equal(result.draft.partialSaved,false);assert.equal(result.legacy,null);
  assert.ok(result.pending.some(p=>p.id==='old-001'&&p.local===null));
  await p.evaluate(async()=>{AUTH.user={id:'fixture-member'};CLOUD.ok=false;await resolveSyncConflict('account');});
  const resolved=await p.evaluate(async()=>({name:state.settings.name,row:await PAGE.store.get('old-000','lb'),recovery:JSON.parse((await PAGE.store.exportParts(SYNC.recovery.device.state,'device')).join('')),pending:await PAGE.store.pending(),conflict:SYNC.conflict}));
  assert.equal(resolved.name,'Account edits');assert.equal(resolved.row.entries[0].sets[0].w,30);assert.equal(resolved.recovery.state.settings.name,'Device edits');assert.equal(resolved.recovery.logs.find(l=>l.id==='old-000').entries[0].sets[0].w,25);assert.equal(resolved.conflict,null);assert.ok(resolved.pending.some(p=>p.id==='old-001'&&p.local===null));assert.deepEqual(errors,[]);
  console.log('PASS '+kind+': bounded migration, offline deletion, both conflict versions, remote additions, deleted partial identity and complete recovery backup');await c.close();
 }
}finally{await b.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
