// Optional browser suite: npm-provided Playwright, Chrome, synthetic accounts.
// RPCs are simulated; scripts/test-sync.sql separately exercises the dev database.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'dist/index.html'),'utf8');
const clone=x=>JSON.parse(JSON.stringify(x));
const server=http.createServer((req,res)=>{const file=path.join(root,'dist',req.url.split('?')[0]==='/'?'index.html':req.url.split('?')[0]);try{res.setHeader('Content-Type',file.endsWith('.html')?'text/html':file.endsWith('.js')?'application/javascript':file.endsWith('.png')?'image/png':'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end();}});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const url=process.argv[2]||`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const results=[];
 try{for(const width of [1280,390,320]){
  const backend={revision:'0',state:null,logs:[],deleted:[]},updates=[];let fail=false,lose=false;
  async function rpc(name,p){
   if(fail)return {error:{message:'Synthetic network failure'}};
   if(name==='read_account_snapshot')return {data:clone(backend)};
   if(name!=='commit_account_snapshot')return {data:false};
   if(p.p_revision!==backend.revision)return {data:{ok:false,snapshot:clone(backend)}};
   const st=clone(p.p_state);let applied=0;
   if(p.p_apply_coach&&st.block&&!st.draft)for(const u of updates.filter(u=>!u.applied)){st.block.plan={...st.block.plan,...u.plan};st.coach={note:u.note};u.applied=true;applied++;}
   for(const l of backend.logs)if(!p.p_logs.some(x=>x.id===l.id))backend.deleted.push(l.id);
   assert.ok(p.p_logs.every(l=>!backend.deleted.includes(l.id)));
   if(JSON.stringify(st)!==JSON.stringify(backend.state)||JSON.stringify(p.p_logs)!==JSON.stringify(backend.logs)||applied){backend.revision=String(+backend.revision+1);backend.state=st;backend.logs=clone(p.p_logs);}
   if(lose){lose=false;return {error:{message:'Synthetic response loss'}};}
   return {data:{ok:true,applied,snapshot:clone(backend)}};
  }
  const pages=[],errors=[];
  for(let i=0;i<2;i++){
   const page=await browser.newPage({viewport:{width,height:844}});pages.push(page);
   page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
   await page.route('**/*',r=>new URL(r.request().url()).origin===new URL(url).origin?r.continue():r.fulfill({status:200,body:''}));
   await page.exposeFunction('syntheticRpc',rpc);const response=await page.goto(url);
   assert.equal((await response.text()).replace(/\r\n/g,'\n'),html.replace(/\r\n/g,'\n'),'served source differs from tested build');
   await page.evaluate(initial=>{
    state=defaults();state.setup=null;state.onboarded=true;state.settings.name='Sync test';state.settings.goals=['muscle'];state.settings.days=[1,4];state.settings.split='ul2';state.settings.comfort='machines';state.settings.tstyle='machines';state.settings.cardio={style:'walk',jog:'none',after:0};state.places=[{k:'gym',n:'Gym',eq:PLACE_TYPES.gym.eq.split(' ')}];state.curPlace='gym';logs=[];newBlock();
    if(initial.state){state=copySync(initial.state);logs=copySync(initial.logs);}
    SYNC={owner:'synthetic',base:initial.state?copySync(initial):null,conflict:null,recovery:null};
    AUTH.user={id:'synthetic',email:'sync@example.invalid'};AUTH.access='ok';AUTH.ready=true;
    sb={rpc:(name,p)=>window.syntheticRpc(name,p),auth:{signOut:async()=>({error:null})}};
    CLOUD.ok=true;clearTimeout(CLOUD.t);ui.qsLater=true;ui.tab='settings';ui.open={profile:true};persistLocal();render();
   },clone(backend));
   await page.evaluate(()=>pushCloud());
  }
  const [a,b]=pages;
  await a.evaluate(()=>{state.settings.name='Phone version';save();});await a.evaluate(()=>pushCloud());
  await b.evaluate(()=>{state.settings.name='Tablet version';save();});assert.equal(await b.evaluate(()=>pushCloud()),false);
  await b.locator('#sync').click();await b.getByRole('heading',{name:'Review sync conflict'}).waitFor();
  assert.equal(await b.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  fs.mkdirSync(path.join(root,'test-results'),{recursive:true});
  await b.screenshot({path:path.join(root,`test-results/sync-conflict-${width}.png`),fullPage:true});
  await b.getByRole('button',{name:'Use account version',exact:true}).click();
  await b.waitForFunction(()=>!CLOUD.busy&&!SYNC.conflict&&state.settings.name==='Phone version');
  assert.equal(await b.evaluate(()=>SYNC.recovery.device.state.settings.name),'Tablet version');
  // A coach update stays pending during a paused workout.
  await b.evaluate(()=>{startWorkout(weekKeys()[0]);state.draft.paused=true;save();});await b.evaluate(()=>pushCloud());
  updates.push({plan:{},note:'Atomic coach note'});await b.evaluate(()=>pushCloud());assert.equal(updates[0].applied,undefined);
  await b.evaluate(()=>{state.draft=null;save();});await b.evaluate(()=>pushCloud());assert.equal(updates[0].applied,true);
  assert.equal(await b.evaluate(()=>state.coach.note),'Atomic coach note');
  // Losing a response after a commit is safely recovered by Retry sync.
  updates.push({plan:{},note:'Recovered coach note'});lose=true;assert.equal(await b.evaluate(()=>pushCloud()),false);
  await b.locator('#sync').click();await b.getByRole('button',{name:'Retry sync',exact:true}).click();
  await b.waitForFunction(()=>!CLOUD.busy&&!CLOUD.failed&&state.coach.note==='Recovered coach note');
  fail=true;await b.evaluate(()=>{state.settings.name='Offline retained';save();});assert.equal(await b.evaluate(()=>pushCloud()),false);
  assert.equal(await b.evaluate(()=>JSON.parse(localStorage.getItem(LS)).state.settings.name),'Offline retained');
  fail=false;assert.equal(await b.evaluate(()=>pushCloud()),true);
  assert.deepEqual(errors,[]);results.push({width,conflictChoice:true,recoveryCopy:true,draftDeferral:true,lostResponseRetry:true,offlineRecovery:true,errors});
  for(const page of pages)await page.close();
 }
 fs.writeFileSync(path.join(root,'test-results/sync-browser-results.json'),JSON.stringify({url,results},null,2));console.log(JSON.stringify({url,results}));
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
