// Synthetic browser flows only: no sign-in or backend mutations.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const dist=path.resolve(__dirname,'../dist'),expected=fs.readFileSync(path.join(dist,'index.html'),'utf8');
const server=http.createServer((req,res)=>{
 try{const file=path.resolve(dist,'.'+(req.url==='/'?'/index.html':req.url.split('?')[0]));if(!file.startsWith(dist+path.sep))throw Error();
 res.setHeader('Content-Type',file.endsWith('.html')?'text/html':file.endsWith('.js')?'application/javascript':'application/octet-stream');res.end(fs.readFileSync(file));}
 catch{res.writeHead(404);res.end();}
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const url=process.argv[2]||`http://127.0.0.1:${server.address().port}/`,origin=new URL(url).origin;
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),results=[];
 try{for(const width of [1280,390,320])for(const theme of ['light','dark']){
  const context=await browser.newContext({viewport:{width,height:844},timezoneId:'America/New_York',serviceWorkers:'block',reducedMotion:'reduce'}),page=await context.newPage(),errors=[],mutations=[];
  await page.clock.setFixedTime(new Date('2026-11-11T12:00:00-05:00'));
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.route('**/*',r=>{const u=new URL(r.request().url());if(u.hostname.endsWith('.supabase.co')&&r.request().method()!=='GET')mutations.push(u.pathname);return u.origin===origin?r.continue():r.fulfill({status:200,body:''});});
  const response=await page.goto(url);assert.equal(response.status(),200);assert.equal((await response.text()).replace(/\r\n/g,'\n'),expected.replace(/\r\n/g,'\n'));
  await page.evaluate(theme=>{
   closeModal();sb=null;AUTH.ready=true;AUTH.user=null;AUTH.coach=false;ui.qsLater=true;
   state=defaults();state.setup=null;state.onboarded=true;logs=[];
   Object.assign(state.settings,{goals:['muscle'],days:[1,3,5],split:'fb3',mins:45,theme,color:'blue',sound:false});
   state.places=[{k:'gym',n:'Gym',eq:PLACE_TYPES.gym.eq.split(' ')}];state.curPlace='gym';newBlock();ui.tab='today';render();
  },theme);
  assert.equal(await page.evaluate(()=>APP_ENV),'development');assert.match(await page.locator('#environment-banner').innerText(),/TESTING/);
  const toggle=page.locator('.today-exercises-toggle'),exercises=page.locator('#today-exercises'),start=page.locator('.today-workout [data-action="fbegin"]');
  const before=await page.evaluate(()=>JSON.stringify({state,logs}));
  assert.equal(await toggle.getAttribute('aria-expanded'),'false');assert.equal(await exercises.isVisible(),false);assert.equal(await start.innerText(),'Start workout');
  await toggle.click();assert.equal(await toggle.getAttribute('aria-expanded'),'true');assert.equal(await exercises.isVisible(),true);
  assert.equal(await page.evaluate(()=>JSON.stringify({state,logs})),before,'expansion does not create a draft or save data');
  const rows=await exercises.locator('.slotrow').allTextContents();assert.ok(rows.length>0);
  const planRows=await page.evaluate(()=>{ui.open={['plan-'+nextWorkoutKey()]:true};const doc=new DOMParser().parseFromString(renderPlan(),'text/html');return [...doc.querySelectorAll('.sec-body .slotrow')].map(e=>e.textContent);});
  assert.deepEqual(rows,planRows,'same exercise targets as Plan');
  await exercises.locator('[data-action="adjust"]').first().click();assert.equal(await page.locator('[data-action="adjsave"]').count(),1);await page.evaluate(()=>closeModal());
  await exercises.locator('[data-action="swap"]').first().click();assert.equal(await page.locator('#modal .sheet').count(),1,JSON.stringify(await page.evaluate(()=>({swap:ui.swap,pk:document.querySelector('#today-exercises [data-action="swap"]').dataset.pk}))));await page.evaluate(()=>closeModal());
  await page.evaluate(()=>render());assert.equal(await toggle.getAttribute('aria-expanded'),'true');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  fs.mkdirSync(path.resolve(__dirname,'../test-results'),{recursive:true});
  if(width===390)await page.screenshot({path:path.resolve(__dirname,`../test-results/today-expanded-${theme}.png`),fullPage:true});
  await toggle.click();await start.click();assert.equal(await page.evaluate(()=>ui.tab),'workout');assert.equal(await page.evaluate(()=>state.draft.step.ph),'warm');
  await page.evaluate(()=>{fAction('fpause',{});});
  const draft=await page.evaluate(()=>JSON.stringify(state.draft));
  await toggle.click();assert.equal(await page.evaluate(()=>JSON.stringify(state.draft)),draft);await page.locator('.today-workout [data-action="resume"]').click();assert.equal(await page.evaluate(()=>ui.tab),'workout');
  await page.evaluate(()=>{state.draft.partialSaved=true;ui.tab='today';save();render();});assert.equal(await page.locator('.today-workout [data-action="resume"]').innerText(),'Resume remaining sets');
  await page.reload();await page.evaluate(()=>{sb=null;AUTH.ready=true;AUTH.user=null;ui.qsLater=true;ui.tab='today';render();});
  assert.equal(await page.locator('.today-workout [data-action="resume"]').innerText(),'Resume remaining sets');
  await page.evaluate(()=>{coachMode={name:'Synthetic member',own:{state:structuredClone(state),logs:structuredClone(logs)}};render();});
  const coachBefore=await page.evaluate(()=>JSON.stringify({state,logs}));await toggle.click();assert.equal(await exercises.isVisible(),true);
  assert.equal(await page.locator('.today-workout [data-action="fbegin"],.today-workout [data-action="resume"]').count(),0);
  await page.locator('.today-workout [data-action="open"]').click();assert.equal(await page.evaluate(()=>ui.tab),'preview');assert.equal(await page.locator('[data-action="fbegin"]').count(),0);assert.equal(await page.evaluate(()=>JSON.stringify({state,logs})),coachBefore);
  // The completed/rest-day presentations must follow actual saves and local dates.
  await page.evaluate(()=>{
   coachMode=null;state.draft=null;logs=[];ui.tab='today';ui.todayExercises=null;render();
  });
  const count=await page.evaluate(()=>sessionSlots(nextWorkoutKey()).length);
  assert.equal(await toggle.innerText(),`Show ${count} exercise${count===1?'':'s'}\n▾`);
  await page.locator('.today-start').click();
  await page.evaluate(()=>{fAction('fpause',{});});
  assert.match(await page.locator('.today-resume').innerText(),/0 of \d+ sets complete\s+Next: Warm-up/);
  await page.evaluate(()=>{
   const d=state.draft,slots=dSlots();d.step={ph:'ex',pk:slots[0].pk};
   d.sets[slots[0].pk][0].r='8';d.sets[slots[0].pk][0].done=true;
   save();render();
  });
  assert.match(await page.locator('.today-resume').innerText(),/1 of \d+ sets complete/);
  const paused=await page.evaluate(()=>JSON.stringify(state.draft));await page.evaluate(()=>render());assert.equal(await page.evaluate(()=>JSON.stringify(state.draft)),paused);
  if(width===390)await page.screenshot({path:path.resolve(__dirname,`../test-results/today-paused-${theme}.png`),fullPage:true});
  const planned=await page.evaluate(()=>workoutCompletion(state.draft).planned);
  await page.evaluate(()=>{const d=state.draft;d.step.ph='rest';save();render();});
  assert.match(await page.locator('.today-resume').innerText(),/Next: Rest · /);
  await page.evaluate(()=>{const d=state.draft;d.step={ph:'cool'};save();render();});
  assert.match(await page.locator('.today-resume').innerText(),/Next: Cool-down/);
  await page.evaluate(()=>{finishWorkout();closeModal();render();});
  assert.equal(await page.locator('.today-finished').count(),0);
  assert.equal(await page.locator('.today-start').innerText(),'Resume remaining sets');
  assert.match(await page.locator('.today-resume').innerText(),new RegExp(`1 of ${planned} sets complete`));
  const next=await page.evaluate(()=>todayResumeNext(state.draft,dSlots()));
  await page.locator('.today-start').click();
  assert.equal(await page.evaluate(()=>EX[dSlots().find(s=>s.pk===state.draft.step.pk).id].n),next);
  await page.evaluate(()=>{
   for(const rows of Object.values(state.draft.sets))for(const r of rows){r.r='8';r.done=true;}
   finishWorkout();closeModal();render();
  });
  assert.equal(await page.locator('.today-finished h2').innerText(),'Today’s workout complete');
  assert.equal(await page.locator('.today-start').innerText(),'View next workout');
  assert.equal(await page.locator('.today-start').getAttribute('data-action'),'open');
  assert.equal(await page.locator('.today-start').evaluate(e=>e.classList.contains('primary')),false);
  await page.locator('.today-start').click();assert.equal(await page.evaluate(()=>ui.tab),'preview');assert.equal(await page.evaluate(()=>state.draft),null);
  // Early extra training stays available from the preview without starting on view.
  await page.locator('[data-action="fbegin"]').click();assert.equal(await page.evaluate(()=>!!state.draft),true);
  await page.evaluate(()=>{fAction('fpause',{});});
  assert.equal(await page.locator('.today-finished').count(),0);assert.equal(await page.locator('.today-resume').count(),1);
  await page.evaluate(()=>{state.draft=null;save();ui.tab='today';render();});
  await page.reload();await page.evaluate(()=>{sb=null;AUTH.ready=true;AUTH.user=null;ui.qsLater=true;ui.tab='today';render();});
  assert.equal(await page.locator('.today-finished').count(),1);
  await page.clock.setFixedTime(new Date('2026-11-12T00:05:00-05:00'));await page.evaluate(()=>render());
  assert.equal(await page.locator('.today-finished').count(),0);assert.equal(await page.locator('.today-rest').count(),1);
  assert.match(await page.locator('.today-rest').innerText(),/No workout scheduled today[\s\S]*Fri, Nov 13/);
  assert.equal(await page.locator('.today-start').innerText(),'Train today');
  assert.equal(await page.locator('.today-start').getAttribute('data-action'),'fbegin');
  if(width===390)await page.screenshot({path:path.resolve(__dirname,`../test-results/today-rest-${theme}.png`),fullPage:true});
  await page.locator('.today-start').click();assert.equal(await page.evaluate(()=>state.draft.step.ph),'warm');
  await page.evaluate(()=>{state.draft=null;ui.tab='today';state.settings.flex=true;render();});
  assert.equal(await page.evaluate(()=>isFlex()),true);assert.equal(await page.locator('.today-rest').count(),0);
  // A resumed partial belongs to its completion day, even if its history date is older.
  const savedName=await page.evaluate(()=>logs[0].name);
  await page.evaluate(()=>{
   state.settings.flex=false;state.settings.days=[1,3,5];logs[0].date='2026-11-09T12:00:00-05:00';logs[0].completedAt=new Date().toISOString();
   logs[0].name='<script>unsafe</script>';render();
  });
  assert.equal(await page.locator('.today-finished script').count(),0);assert.match(await page.locator('.today-finished').innerText(),/<script>unsafe<\/script>/);
  await page.evaluate(()=>{
   AUTH.user={id:'today-synthetic'};AUTH.access='ok';CM.owner=AUTH.user.id;CM.summary={coach:{name:'Sample coach',unread:1}};render();
  });
  assert.equal(await page.locator('.cm-today + .today-other').count(),1);
  assert.equal(await page.locator('.cm-today [data-action="cmopen"]').count(),1);
  assert.equal(await page.locator('.cm-today [data-action="cmdismiss"]').count(),1);
  await page.evaluate(()=>{CM.summary.coach.unread=0;render();});assert.equal(await page.locator('.cm-today').count(),0);
  await page.evaluate(()=>{CM.summary.coach.unread=1;AUTH.coach=true;render();});assert.equal(await page.locator('.cm-today').count(),0);
  await page.evaluate(name=>{AUTH.user=null;AUTH.coach=false;logs[0].name=name;render();},savedName);
  await page.evaluate(()=>{delete logs[0].completedAt;logs[0].date=new Date().toISOString();render();});
  assert.equal(await page.locator('.today-finished').count(),1,'legacy completion uses its history date');
  await page.evaluate(()=>{logs[0].block=-1;render();});assert.equal(await page.locator('.today-finished').count(),0);
  await page.evaluate(()=>{logs[0].block=state.block.n;render();});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  if(width===390)await page.screenshot({path:path.resolve(__dirname,`../test-results/today-finished-${theme}.png`),fullPage:true});
  assert.deepEqual(errors,[]);assert.deepEqual(mutations,[]);results.push({width,theme,expand:true,directStart:true,resumeReload:true,coachReadOnly:true,completedDay:true,restDay:true,localMidnight:true,messagePlacement:true});await context.close();
 }console.log(JSON.stringify({url,results}));}
 finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
