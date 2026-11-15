// Real WebGL playback with synthetic app state; blocks every backend mutation.
const {chromium}=require('playwright');const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),dist=path.join(root,'dist'),evidence=path.join(root,'output/animation-verification');fs.mkdirSync(evidence,{recursive:true});
const manifest=JSON.parse(fs.readFileSync(path.join(dist,'exercise-guides/shared/manifest.json'))),recipes=JSON.parse(fs.readFileSync(path.join(root,'animation-authoring/recipes.json')));
const server=http.createServer((req,res)=>{try{const file=path.resolve(dist,'.'+decodeURIComponent(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));assert(file.startsWith(dist+path.sep));res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.gz':'application/octet-stream'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end();}});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=process.argv.find(a=>/^https?:/.test(a))||`http://127.0.0.1:${server.address().port}/`,origin=new URL(url).origin;
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist']});
 const {Rig}=await import('../animation-authoring/rig.mjs'),{pose:authorPose}=await import('../animation-authoring/poses.mjs');
 const referenceSetup=JSON.parse(fs.readFileSync(path.join(root,'animation-authoring/accepted-setups.json'))).templates['dumbbell-romanian-deadlift'].clip;let maximumPlaybackPositionError=0;
 const context=await browser.newContext({viewport:{width:390,height:940},serviceWorkers:'block',reducedMotion:'reduce'}),page=await context.newPage(),errors=[],requests=[],results=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('request',r=>requests.push(r.url()));
 await page.route('**/*',r=>{const u=new URL(r.request().url());if(u.hostname.endsWith('.supabase.co')&&r.request().method()!=='GET')return r.abort();if(u.origin!==origin)return r.fulfill({status:200,body:''});return r.continue();});
 try{
  await page.goto(url);await page.waitForFunction(()=>typeof defaults==='function'&&window.StrongStartExerciseGuides);
  await page.evaluate(()=>{sb=null;AUTH.ready=true;AUTH.user=null;closeModal();state=defaults();logs=[];state.setup=null;state.onboarded=true;state.settings.sound=false;state.places=[{k:'gym',n:'Gym',eq:EQ_ALL}];state.curPlace='gym';newBlock();ui.tab='library';ui.libEasy=false;ui.libShowAll=true;render();});
  assert.equal(await page.evaluate(()=>APP_ENV),'development');assert.equal(await page.evaluate(()=>SB_URL),'https://gvyfgqhgqnfmtoytqpeo.supabase.co');
  assert.equal(await page.evaluate(()=>guideAnimationId({t:'Air bike'})),'air-bike');assert.equal(await page.evaluate(()=>guideAnimationId({t:'Stationary bike'})),'stationary-bike');
  const baseline=await page.evaluate(()=>JSON.stringify({state,logs,SYNC}));await page.locator('[data-action=animationgallery]').click();
  await page.waitForFunction(()=>window.sharedExerciseDebug?.state().loaded,{timeout:90000});
  assert.equal(await page.locator('#exercise option').count(),manifest.exercises.length);
  const firstState=await page.evaluate(()=>sharedExerciseDebug.state());const families=new Set();
  const selected=process.argv.includes('--smoke')?manifest.exercises.filter((e,i)=>i<3||['barbell-bench-press','lat-pulldown','turkish-get-up','bodyweight-squat','side-plank','box-jump','bird-dogs','stationary-bike','child-s-pose','nordic-curl'].includes(e.id)):manifest.exercises;
  for(const e of selected){
   await page.selectOption('#exercise',e.id);await page.waitForFunction(id=>sharedExerciseDebug.state().loaded&&sharedExerciseDebug.state().id===id,e.id,{timeout:60000});
   const family=recipes.find(r=>r.id===e.id)?.family||'accepted';
   const states=[];for(const fraction of [0,.46,.78]){
    await page.locator('#position').evaluate((el,f)=>{el.value=String(Math.round(Number(el.max)*f*20)/20);el.dispatchEvent(new Event('input'));},fraction);
    const measured=await page.evaluate(()=>{const state=sharedExerciseDebug.state(),pose=sharedExerciseDebug.pose([0,120,1200,2400,8000]);return {state,nodes:pose.nodes,finite:Object.values(pose.nodes).every(m=>m.every(Number.isFinite))&&pose.vertices.flat().every(Number.isFinite)};});states.push(measured);
    const recipe=recipes.find(r=>r.id===e.id);if(recipe&&recipe.family!=='accepted'){const rig=new Rig(referenceSetup);authorPose(rig,recipe,measured.state.time/measured.state.duration);for(const name of ['pelvis','head','hand_l','hand_r','calf_l','calf_r','foot_l','foot_r']){const expected=rig.world(rig.ids[name]).elements,actual=measured.nodes[name];const error=Math.hypot(...[12,13,14].map(i=>expected[i]-actual[i]));maximumPlaybackPositionError=Math.max(maximumPlaybackPositionError,error);assert(error<.003,e.id+' authored/playback mismatch '+name+' '+error);}}
   }
   for(const {state,finite}of states){assert(finite,e.id+' non-finite pose');assert.equal(state.bodyUUID,firstState.bodyUUID);assert.equal(state.skeletonUUID,firstState.skeletonUUID);}
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),e.id+' overflow');
   if(!families.has(family)){families.add(family);await page.locator('#position').evaluate(el=>{el.value=String(Number(el.max)*.46);el.dispatchEvent(new Event('input'));});await page.locator('.ss-stage').screenshot({path:path.join(evidence,family+'.png')});}
   results.push({id:e.id,family,poses:states.length,textures:states.at(-1).state.textures});
   console.log('PLAYBACK',results.length,selected.length,e.id);
  }
  assert.equal(await page.evaluate(()=>JSON.stringify({state,logs,SYNC})),baseline,'Public animation review changed account/workout state');
  assert.equal(await page.evaluate(()=>sharedExerciseDebug.stats.characterLoads),1);assert(!requests.some(u=>u.includes('.glb')),'Complete per-exercise character files must not load');
  for(const width of [320,1280]){await page.setViewportSize({width,height:940});for(const id of ['barbell-bench-press','leg-press','side-plank','lat-pulldown','turkish-get-up','box-jump','arm-circles']){await page.selectOption('#exercise',id);await page.waitForFunction(id=>sharedExerciseDebug.state().loaded&&sharedExerciseDebug.state().id===id,id);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.locator('.ss-stage').screenshot({path:path.join(evidence,`${id}-${width}.png`)});}}
  await page.locator('#highlights').click();assert.equal(await page.evaluate(()=>sharedExerciseDebug.state().highlighted),false);await page.locator('#highlights').click();
  await page.selectOption('#speed','0.5');assert.equal(await page.locator('#speed').inputValue(),'0.5');
  await page.locator('[data-angle="-90deg 78deg"]').click();
  await page.evaluate(()=>closeModal());await page.evaluate(()=>exInfo('barbell-bench-press'));await page.waitForFunction(()=>document.querySelector('.eg-demo')?.dataset.guideStatus==='ready');assert.equal(await page.evaluate(()=>sharedExerciseDebug.state().bodyUUID),firstState.bodyUUID);
  // The actual workout can lend its persistent renderer to a modal and regain it.
  await page.evaluate(()=>{closeModal();startWorkout(weekKeys()[0]);const d=state.draft,s=dSlots()[0];d.rampDone=99;d.step={ph:'ex',pk:s.pk};ui.tab='workout';render();clearInterval(gInt);clearInterval(timerInt);});
  await page.waitForFunction(()=>document.querySelector('#app .eg-demo')?.dataset.guideStatus==='ready');
  const workout=await page.evaluate(()=>({id:sharedExerciseDebug.state().id,data:JSON.stringify({state,logs,SYNC})}));
  await page.locator('#app #play').click();await page.locator('#app #play').click();
  await page.locator('#app .eg-expand').click();assert.equal(await page.locator('#app .eg-expand').getAttribute('aria-expanded'),'true');
  await page.locator('#app .hero-how').click();await page.waitForFunction(()=>document.querySelector('#modal .workout-info-sheet'));
  assert.equal(await page.evaluate(()=>sharedExerciseDebug.state().bodyUUID),firstState.bodyUUID);await page.evaluate(()=>closeModal());
  await page.waitForFunction(id=>document.querySelector('#app .ss-player')&&sharedExerciseDebug.state().id===id,workout.id);assert.equal(await page.locator('#app #play').innerText(),'Play');
  const swapId=workout.id==='lat-pulldown'?'cable-curl':'lat-pulldown';await page.evaluate(id=>{swapSheet(state.draft.step.pk);swapExerciseDetail(id);},swapId);await page.waitForFunction(id=>sharedExerciseDebug.state().id===id&&sharedExerciseDebug.state().loaded,swapId);await page.evaluate(()=>closeModal());await page.waitForFunction(id=>sharedExerciseDebug.state().id===id&&sharedExerciseDebug.state().loaded,workout.id);
  assert.equal(await page.evaluate(()=>JSON.stringify({state,logs,SYNC})),workout.data,'Guide controls changed a workout draft');
  const rapid=['cable-curl','side-plank','goblet-squat','hammer-curl'].filter(id=>id!==workout.id);await page.evaluate(ids=>{for(const id of ids)swapExerciseDetail(id);},rapid);await page.waitForFunction(id=>sharedExerciseDebug.state().loaded&&sharedExerciseDebug.state().id===id,rapid.at(-1));
  await page.evaluate(()=>sharedExerciseDebug.cacheSettled());await context.setOffline(true);await page.evaluate(()=>swapExerciseDetail('barbell-bench-press'));await page.waitForFunction(()=>sharedExerciseDebug.state().loaded&&sharedExerciseDebug.state().id==='barbell-bench-press');await context.setOffline(false);
  const beforeReload=requests.length;await page.reload();await page.waitForFunction(()=>window.StrongStartExerciseGuides&&typeof defaults==='function');await page.evaluate(()=>{sb=null;AUTH.ready=true;AUTH.user=null;closeModal();ui.tab='library';exInfo('barbell-bench-press');});await page.waitForFunction(()=>window.sharedExerciseDebug?.state().loaded);
  assert.equal(requests.slice(beforeReload).filter(u=>/\/shared\/assets\/.*character/.test(u)).length,0,'Warm reload should reuse the protected cached character');
  assert(!errors.length,JSON.stringify(errors));
  for(const scenario of ['storage-and-decompression-fallback','initial-download-retry']){
   const extra=await browser.newContext({viewport:{width:320,height:900},serviceWorkers:'block',reducedMotion:'reduce'}),p=await extra.newPage(),pageErrors=[];p.on('pageerror',e=>pageErrors.push(e.message));
   await p.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.fulfill({status:200,body:''}));
   if(scenario==='storage-and-decompression-fallback')await p.addInitScript(()=>{Object.defineProperty(window,'DecompressionStream',{value:undefined,configurable:true});Object.defineProperty(window,'caches',{value:{open:async()=>{throw Error('Synthetic storage denial');}},configurable:true});});
   else await p.route('**/shared/assets/library.*',r=>r.abort());
   await p.goto(url);await p.waitForFunction(()=>window.StrongStartExerciseGuides&&typeof defaults==='function');await p.evaluate(()=>{sb=null;AUTH.ready=true;AUTH.user=null;closeModal();state=defaults();state.setup=null;state.onboarded=true;ui.tab='library';exInfo('barbell-bench-press');});
   if(scenario==='initial-download-retry'){await p.waitForFunction(()=>document.querySelector('#modal .eg-demo')?.dataset.guideStatus==='error');assert(await p.locator('#modal .howto li').count());await p.unroute('**/shared/assets/library.*');await p.evaluate(()=>exInfo('barbell-bench-press'));}
   await p.waitForFunction(()=>window.sharedExerciseDebug?.state().loaded,{timeout:60000});assert.equal(await p.evaluate(()=>sharedExerciseDebug.state().id),'barbell-bench-press');assert(!pageErrors.length,JSON.stringify(pageErrors));await extra.close();console.log('PASS',scenario);
  }
  fs.writeFileSync(path.join(evidence,process.argv.includes('--smoke')?'browser-smoke-results.json':'browser-results.json'),JSON.stringify({url,exercises:results.length,total:manifest.exercises.length,results,errors,maximumPlaybackPositionError,characterRequests:requests.filter(u=>/character.*bin/.test(u)).length},null,2));
  console.log('PASS',results.length,'WebGL exercises, shared body/skeleton, 3 poses each, phone/desktop, controls and unchanged app state');
 }finally{await context.close();await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
