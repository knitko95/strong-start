// Written exercise guides with synthetic local state; all account mutations blocked.
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve(__dirname,'..'),dist=path.join(root,'dist');
const audit=JSON.parse(fs.readFileSync(path.join(root,'docs/exercise-audit-2026-11-11.json'),'utf8'));
const server=http.createServer((req,res)=>{try{
 const file=path.resolve(dist,'.'+(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));
 assert(file.startsWith(dist+path.sep));
 res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.glb':'model/gltf-binary','.png':'image/png'})[path.extname(file)]||'application/octet-stream');
 res.end(fs.readFileSync(file));
}catch{res.writeHead(404);res.end();}});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const url=process.argv[2]||`http://127.0.0.1:${server.address().port}/`,origin=new URL(url).origin,hosted=!!process.argv[2];
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const results=[];
 try{for(const width of [1280,390,320]){
  const context=await browser.newContext({viewport:{width,height:940},serviceWorkers:'block',reducedMotion:'reduce'}),page=await context.newPage(),errors=[],mutations=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  page.on('request',r=>{if(new URL(r.url()).hostname.endsWith('.supabase.co')&&r.method()!=='GET')mutations.push(r.url());});
  await page.route('**/*',r=>{
   const u=new URL(r.request().url());
   if(u.hostname.endsWith('.supabase.co')&&r.request().method()!=='GET')return r.abort();
   if(!hosted&&u.origin!==origin)return r.fulfill({status:200,body:''});
   return r.continue();
  });
  const response=await page.goto(url);assert.equal(response.status(),200);
  assert.equal((await response.text()).replace(/\r\n/g,'\n'),fs.readFileSync(path.join(dist,'index.html'),'utf8').replace(/\r\n/g,'\n'),'Exact candidate HTML');
  await page.waitForFunction(()=>typeof defaults==='function'&&window.StrongStartExerciseGuides);
  await page.evaluate(()=>{
   closeModal();sb=null;AUTH.ready=true;AUTH.user=null;AUTH.coach=false;ui.qsLater=true;
   state=defaults();logs=[];state.setup=null;state.onboarded=true;state.settings.goals=['muscle'];state.settings.days=[1,3,5];state.settings.split='fb3';
   state.settings.sound=false;state.places=[{k:'gym',n:'Gym',eq:EQ_ALL}];state.curPlace='gym';newBlock();
   // Text-only comparisons do not require loading 3D; the existing guide suite checks real demos.
   window.StrongStartExerciseGuides.attach=()=>{};
   ui.libEasy=false;ui.libShowAll=true;ui.tab='library';render();
  });
  assert.equal(await page.evaluate(()=>APP_ENV),'development');
  assert.equal(await page.evaluate(()=>SB_URL),'https://gvyfgqhgqnfmtoytqpeo.supabase.co');
  assert.match(await page.locator('#environment-banner').innerText(),/TESTING/);
  const catalog=await page.evaluate(()=>LIB.map(e=>({id:e.id,name:e.n,steps:exHowTo(e),mode:e.mode})));
  assert.equal(catalog.length,320);assert.deepEqual(catalog.map(e=>e.id),audit.exercises.map(e=>e.id));
  assert.equal(await page.evaluate(()=>Object.keys(MOVE_HOW).length),audit.warmupAndStretchHowTos.length);
  for(const e of catalog){assert(e.steps.length>=2);assert(e.steps.every(t=>typeof t==='string'&&t.length));}
  const byName=Object.fromEntries(catalog.map(e=>[e.name,e]));
  for(const name of ['Battle Rope Alternating Waves','Stir the Pot','TRX Body Saw','Sled Push','Sandbag Bear-Hug Carry','Pogo Hops','BOSU Mountain Climber'])
   assert(!byName[name].steps.some(s=>/Hold the position/.test(s)),`${name} must remain moving`);
  for(const name of ['Side Plank','BOSU Side Plank','Copenhagen Plank']){
   assert(byName[name].steps.some(s=>/Hold the position/.test(s)));
   assert(byName[name].steps.some(s=>/timed interval/.test(s)));assert(!byName[name].steps.some(s=>/all the reps/.test(s)));
  }
  for(const name of ['Medicine Ball Chest Pass','Medicine Ball Slam','Rotational Medicine Ball Slam'])assert(!byName[name].steps.some(s=>/land softly/.test(s)));
  for(const name of ['Kettlebell Swing','Kettlebell Snatch','Push Press'])assert(byName[name].steps.some(s=>/quick, controlled/.test(s)));
  assert(byName['Dumbbell Jump Squat'].steps.some(s=>/land softly/.test(s)));
  for(const e of catalog)assert(!e.steps.some(s=>/2 seconds down/.test(s)));
  for(const name of ['Skater Bound','Lateral Bound'])assert(byName[name].steps.some(s=>/Alternate sides/.test(s)));
  const baseline=await page.evaluate(()=>JSON.stringify({state,logs,SYNC}));
  for(const name of ['Leg Press','Dumbbell Romanian Deadlift','Plank','Side Plank','Weighted Back Extension','Band Good Morning','Stability Ball Rollout','Stir the Pot','Medicine Ball Chest Pass']){
   const e=byName[name];await page.locator('#libq').fill(name);
   await page.locator(`[data-action="exinfo"][data-id="${e.id}"]`).click();
   assert.deepEqual(await page.locator('#modal .howto li').allTextContents(),e.steps);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>JSON.stringify({state,logs,SYNC})),baseline);
  }
  await page.evaluate(()=>{startWorkout(weekKeys()[0]);clearInterval(timerInt);clearInterval(gInt);state.draft.guide={ph:'warm',mode:'paused'};ui.tab='workout';render();});
  const draft=await page.evaluate(()=>JSON.stringify({state,logs,SYNC}));
  for(const name of ['Band dislocates','Glute bridges','Easy walk']){
   await page.evaluate(name=>modal(gHowTo({t:name})),name);
   const text=await page.locator('#modal .howto').innerText();
   if(name==='Band dislocates')assert.match(text,/Stop if your shoulders pinch/);
   if(name==='Glute bridges')assert.match(text,/knees, hips and shoulders/);
   if(name==='Easy walk'){assert.match(text,/talk comfortably/);assert(!/nose/.test(text));}
   await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>JSON.stringify({state,logs,SYNC})),draft);
  }
  await page.evaluate(()=>{exInfo('leg-press');});
  fs.mkdirSync(path.join(root,'test-results'),{recursive:true});
  if(width===390)await page.screenshot({path:path.join(root,`test-results/exercise-audit-${hosted?'hosted':'local'}-390.png`)});
  await page.keyboard.press('Escape');assert.deepEqual(errors,[]);assert.deepEqual(mutations,[]);
  results.push({width,catalog:catalog.length,howTos:audit.warmupAndStretchHowTos.length,libraryDialogs:9,warmupDialogs:3,stateAndDraftPreserved:true,consoleErrors:errors});
  await context.close();
 }
 fs.writeFileSync(path.join(root,`test-results/exercise-audit-${hosted?'hosted':'local'}.json`),JSON.stringify({url,results},null,2));console.log(JSON.stringify({url,results}));
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
