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
   state.settings.cardio={style:'walk',jog:'none',after:10,adj:0,checks:0};
   state.places=[{k:'gym',n:'Gym',eq:PLACE_TYPES.gym.eq.split(' ')}];state.curPlace='gym';newBlock();ui.tab='today';render();
  },theme);
  assert.equal(await page.evaluate(()=>APP_ENV),'development');assert.match(await page.locator('#environment-banner').innerText(),/TESTING/);
  const toggle=page.locator('.today-exercises-toggle'),exercises=page.locator('#today-exercises'),start=page.locator('.today-workout [data-action="fbegin"]');
  const before=await page.evaluate(()=>JSON.stringify({state,logs}));
  assert.equal(await toggle.getAttribute('aria-expanded'),'false');assert.equal(await exercises.isVisible(),false);assert.equal(await start.innerText(),'Start workout');
  await toggle.click();assert.equal(await toggle.getAttribute('aria-expanded'),'true');assert.equal(await exercises.isVisible(),true);
  assert.match(await toggle.innerText(),/Hide workout plan/);
  assert.deepEqual(await exercises.locator('.today-plan-phase').evaluateAll(es=>es.map(e=>e.getAttribute('aria-label'))),['Warm-up','Exercises','Cardio','Cool-down']);
  const expectedExtras=await page.evaluate(()=>{const key=nextWorkoutKey(),x=sessionExtras({key,place:state.curPlace},sessionSlots(key));return {warm:x.warm.map(i=>i.t),cool:x.cool.map(i=>i.t),cardio:x.finisher.t,min:x.finisher.min,total:totalMinutes(key)+x.finisher.min};});
  assert.deepEqual(await exercises.locator('[aria-label="Warm-up"] li b').allTextContents(),['Warm-up cardio','Mobility','Lighter sets']);
  assert.ok((await exercises.locator('[aria-label="Cool-down"] li b').allTextContents()).includes('Stretches'));
  assert.doesNotMatch(await exercises.locator('.today-plan-cardio').textContent(),/total with cardio/);
  assert.equal(await page.locator('.today-workout > .row.small.muted').innerText(), 'Planned Today');
  assert.equal(await page.evaluate(()=>JSON.stringify({state,logs})),before,'expansion does not create a draft or save data');
  const rows=await exercises.locator('.slotrow').allTextContents();assert.ok(rows.length>0);
  assert.equal(await exercises.locator('.today-strength-muscle').count(),rows.length);
  assert.equal(await exercises.locator('[data-action="adjust"],[data-action="prepedit"],.today-muscle').count(),0,'Today shows Swap without editing controls or badges');
  fs.mkdirSync(path.resolve(__dirname,'../test-results'),{recursive:true});
  if(width===390)await page.screenshot({path:path.resolve(__dirname,`../test-results/today-quiet-${theme}.png`),fullPage:true});
  for(const phase of ['Warm-up','Cardio','Cool-down']){
    const fold=exercises.locator(`details[aria-label="${phase}"]`);assert.equal(await fold.getAttribute('open'),null);
    await fold.locator('summary').click();assert.equal(await fold.evaluate(e=>e.open),true);
    assert.equal(await fold.locator('button,input,select').count(),0,'preparation dropdown is read only');
  }
  assert.match(await exercises.locator('.today-plan-cardio').innerText(),new RegExp(expectedExtras.cardio));
  const foldsBefore=await page.evaluate(()=>JSON.stringify({state,logs}));
  await toggle.click();await toggle.click();
  assert.equal(await exercises.locator('details[open]').count(),3,'dropdown choices survive main plan collapse');
  assert.equal(await page.evaluate(()=>JSON.stringify({state,logs})),foldsBefore,'dropdowns do not save or change workout data');
  assert.equal(await exercises.locator('.today-plan-heading svg').count(),4);
  assert.equal(await exercises.locator('.chip.S,.chip.F,.chip.T').count(),0,'movement plane labels omitted from Today');
  const expectedTargets=await page.evaluate(()=>sessionSlots(nextWorkoutKey()).map(s=>{const t=target(s),e=EX[s.id];return `${t.sets} sets × ${t.unit==='sec'?t.r:t.lo+'–'+t.hi} ${t.unit}${e.uni?' per side':''} · ${mainMuscleLabel(e.id)}`;}));
  assert.deepEqual(await exercises.locator('.today-strength-meta').allTextContents(),expectedTargets,'muscle is quiet metadata beside targets');
  const planRows=await page.evaluate(()=>{ui.open={['plan-'+nextWorkoutKey()]:true};const doc=new DOMParser().parseFromString(renderPlan(),'text/html');return [...doc.querySelectorAll('.sec-body [data-action="swap"]')].map(e=>e.dataset.pk);});
  assert.deepEqual(await exercises.locator('[data-action="swap"]').evaluateAll(es=>es.map(e=>e.dataset.pk)),planRows,'same exercise slots as Plan');
  await page.evaluate(()=>{state.places.push({k:'home',n:'Home',eq:PLACE_TYPES.home.eq.split(' ')});render();});
  assert.equal(await page.locator('.today-workout .where').count(),0);
  assert.equal(await page.locator('.today-location + .today-workout').count(),1);
  await page.locator('.today-location [data-v="home"]').click();
  assert.equal(await page.evaluate(()=>state.curPlace),'home');
  assert.equal(await toggle.getAttribute('aria-expanded'),'true');
  await page.locator('.today-location [data-v="gym"]').click();
  await page.evaluate(()=>{state.settings.cardio.after=0;render();});
  assert.match(await exercises.locator('.today-plan-cardio').innerText(),/Off/);
  await page.evaluate(()=>{state.settings.cardio.after=10;render();});
  await page.evaluate(()=>{ui.tab='plan';render();});
  await page.locator('[data-action="adjust"]').first().click();assert.equal(await page.locator('[data-action="adjsave"]').count(),1);await page.evaluate(()=>{closeModal();ui.tab='today';render();});
  await exercises.locator('[data-action="swap"]').first().click();assert.equal(await page.locator('#modal .sheet').count(),1);
  const replacement=await page.locator('[data-action="swapselect"]').first().getAttribute('data-id');
  await page.locator('[data-action="swapselect"]').first().click();await page.locator('[data-action="swapapply"]').click();
  assert.equal(await page.evaluate(id=>sessionSlots(nextWorkoutKey()).some(s=>s.id===id),replacement),true,'Swap applies the chosen exercise');
  assert.equal(await exercises.locator('details[open]').count(),3,'preparation dropdowns stay open after Swap');
  assert.ok((await exercises.locator('.today-strength-muscle').allTextContents()).includes(await page.evaluate(id=>mainMuscleLabel(id),replacement)),'swapped muscle metadata updates');
  await page.evaluate(()=>render());assert.equal(await toggle.getAttribute('aria-expanded'),'true');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  fs.mkdirSync(path.resolve(__dirname,'../test-results'),{recursive:true});
  if(width===390)await page.screenshot({path:path.resolve(__dirname,`../test-results/today-expanded-${theme}.png`),fullPage:true});
  // Legacy preparation remains compatible; direct calls exercise saved-data support without restoring Today edit controls.
  const prepBefore=await page.evaluate(()=>JSON.stringify(state.prep));
  await page.evaluate(()=>prepEditSheet(state.draft?.key||nextWorkoutKey(),'mobility'));await page.locator('#prep-target-0').fill('14');await page.locator('#modal button[data-action="closemodal"]').click();
  assert.equal(await page.evaluate(()=>JSON.stringify(state.prep)),prepBefore);
  await page.evaluate(()=>prepEditSheet(state.draft?.key||nextWorkoutKey(),'mobility'));await page.locator('#prep-target-0').fill('0');await page.locator('[data-action="prepsave"]').click();
  assert.match(await page.locator('#prep-error').innerText(),/whole number/);assert.equal(await page.evaluate(()=>JSON.stringify(state.prep)),prepBefore);
  if(await page.locator('#prep-choice-0 option').count()>1)await page.locator('#prep-choice-0').selectOption({index:1});
  await page.locator('#prep-target-0').fill('14');await page.locator('#prep-include-1').uncheck();
  assert.equal(await page.locator('#modal .sheet').evaluate(e=>e.scrollWidth<=e.clientWidth+1),true,'editor fits phone width');
  if(width===390)await page.screenshot({path:path.resolve(__dirname,`../test-results/today-prep-editor-${theme}.png`),fullPage:true});
  await page.locator('[data-action="prepsave"]').click();
  assert.equal(await page.evaluate(()=>state.draft),null,'prep editing does not start a workout');
  await page.evaluate(()=>prepEditSheet(state.draft?.key||nextWorkoutKey(),'warm-cardio'));await page.locator('#prep-target-0').fill('180');await page.locator('[data-action="prepsave"]').click();
  await page.evaluate(()=>prepEditSheet(state.draft?.key||nextWorkoutKey(),'stretches'));await page.locator('#prep-target-0').fill('100');await page.locator('[data-action="prepsave"]').click();
  await page.evaluate(()=>prepEditSheet(state.draft?.key||nextWorkoutKey(),'ramps'));await page.locator('#prep-target-0').fill('9');await page.locator('[data-action="prepsave"]').click();
  await page.evaluate(()=>prepEditSheet(state.draft?.key||nextWorkoutKey(),'cardio'));await page.locator('#prep-cardio-min').selectOption('15');await page.locator('[data-action="prepsave"]').click();
  const prepSaved=await page.evaluate(()=>JSON.stringify(state.prep));
  await page.evaluate(()=>prepEditSheet(state.draft?.key||nextWorkoutKey(),'mobility'));await page.evaluate(()=>{AUTH.user={id:'different-synthetic-account'};savePrepEditor();AUTH.user=null;});
  assert.equal(await page.evaluate(()=>JSON.stringify(state.prep)),prepSaved,'stale account editor cannot write');
  await page.reload();await page.evaluate(()=>{sb=null;AUTH.ready=true;AUTH.user=null;ui.qsLater=true;ui.tab='today';render();});await toggle.click();
  assert.equal(await page.evaluate(()=>JSON.stringify(state.prep)),prepSaved);
  await page.evaluate(()=>{const key=nextWorkoutKey(),X=sessionExtras({key,place:state.curPlace},sessionSlots(key));globalThis.prepExpected={warm:X.warm.filter(x=>!x.ramp&&!x.prepSkipped).map(x=>x.t),cardio:X.finisher.min,stretches:segsFor(X.cool.find(x=>x.stretch)).segs.reduce((n,x)=>n+x.sec,0)};});
  await toggle.click();await start.click();assert.equal(await page.evaluate(()=>ui.tab),'workout');assert.equal(await page.evaluate(()=>state.draft.step.ph),'warm');
  assert.equal(await page.evaluate(()=>state.draft._x.warm.find(x=>x.k==='c').phases.reduce((n,x)=>n+x.sec,0)),180);
  assert.match(await page.evaluate(()=>state.draft._x.warm.find(x=>x.ramp).d),/× 9$/);
  assert.equal(await page.evaluate(()=>state.draft._x.finisher.min),15);
  assert.deepEqual(await page.evaluate(()=>gItems('warm').map(x=>x.t)),await page.evaluate(()=>prepExpected.warm));
  assert.equal(await page.evaluate(()=>segsFor(state.draft._x.cool.find(x=>x.stretch)).segs.reduce((n,x)=>n+x.sec,0)),100);
  await page.evaluate(()=>{gAction('gnow',{});fAction('fpause',{});});
  const runningGuide=await page.evaluate(()=>JSON.stringify(state.draft.guide));
  await toggle.click();await page.evaluate(()=>prepEditSheet(state.draft?.key||nextWorkoutKey(),'warm-cardio'));assert.equal(await page.locator('#prep-target-0').count(),0,'started timer is locked');await page.locator('#modal button[data-action="closemodal"]').click();
  await page.evaluate(()=>prepEditSheet(state.draft?.key||nextWorkoutKey(),'stretches'));await page.locator('#prep-target-0').fill('120');await page.locator('[data-action="prepsave"]').click();
  assert.equal(await page.evaluate(()=>JSON.stringify(state.draft.guide)),runningGuide,'future edits preserve paused timer/checkpoints');
  await toggle.click();await page.locator('.today-workout [data-action="resume"]').click();
  await page.evaluate(()=>{fAction('fpause',{});});
  const draft=await page.evaluate(()=>JSON.stringify(state.draft));
  await toggle.click();assert.equal(await page.evaluate(()=>JSON.stringify(state.draft)),draft);await page.locator('.today-workout [data-action="resume"]').click();assert.equal(await page.evaluate(()=>ui.tab),'workout');
  await page.evaluate(()=>{state.draft.partialSaved=true;ui.tab='today';save();render();});assert.equal(await page.locator('.today-workout [data-action="resume"]').innerText(),'Resume remaining sets');
  await page.reload();await page.evaluate(()=>{sb=null;AUTH.ready=true;AUTH.user=null;ui.qsLater=true;ui.tab='today';render();});
  assert.equal(await page.locator('.today-workout [data-action="resume"]').innerText(),'Resume remaining sets');
  await page.evaluate(()=>{coachMode={name:'Synthetic member',own:{state:structuredClone(state),logs:structuredClone(logs)}};render();});
  const coachBefore=await page.evaluate(()=>JSON.stringify({state,logs}));await toggle.click();assert.equal(await exercises.isVisible(),true);
  assert.equal(await exercises.locator('[data-action="prepedit"]').count(),0);
  assert.equal(await page.locator('.today-workout [data-action="fbegin"],.today-workout [data-action="resume"]').count(),0);
  await page.locator('.today-workout [data-action="open"]').click();assert.equal(await page.evaluate(()=>ui.tab),'preview');assert.equal(await page.locator('[data-action="fbegin"]').count(),0);assert.equal(await page.evaluate(()=>JSON.stringify({state,logs})),coachBefore);
  // The completed/rest-day presentations must follow actual saves and local dates.
  await page.evaluate(()=>{
   coachMode=null;state.draft=null;logs=[];ui.tab='today';ui.todayExercises=null;render();
  });
  const count=await page.evaluate(()=>sessionSlots(nextWorkoutKey()).length);
  assert.equal(await toggle.innerText(),'Show workout plan\n▾');
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
