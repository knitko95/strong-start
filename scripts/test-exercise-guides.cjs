// Real how-to dialogs and public 3D assets with isolated synthetic member state.
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve(__dirname,'..'),dist=path.join(root,'dist');
const registry=JSON.parse(fs.readFileSync(path.join(root,'exercise-guides/registry.v1.json'),'utf8'));
const server=http.createServer((req,res)=>{try{const file=path.resolve(dist,'.'+decodeURIComponent(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));assert(file.startsWith(dist+path.sep));const types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.glb':'model/gltf-binary','.png':'image/png'};res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end();}});
async function seed(p){await p.evaluate(()=>{closeModal();sb=null;AUTH.ready=true;AUTH.user=null;AUTH.coach=false;ui.qsLater=true;state=defaults();logs=[];state.setup=null;state.onboarded=true;state.settings.goals=['muscle'];state.settings.days=[1,3,5];state.settings.split='fb3';state.settings.theme='light';state.settings.sound=false;state.places=[{k:'gym',n:'Gym',eq:EQ_ALL}];state.curPlace='gym';newBlock();ui.libEasy=false;ui.libShowAll=true;ui.tab='library';render();});}
async function open(p,id){await p.locator('#libq').fill(registry.guides[id]?.name||'Machine Chest Press');await p.locator(`[data-action="exinfo"][data-id="${id}"]`).click();}
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=process.argv[2]||`http://127.0.0.1:${server.address().port}/`,origin=new URL(url).origin;const hosted=!!process.argv[2];const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});const results=[];try{
 for(const width of [1280,390,320]){
  const ctx=await b.newContext({viewport:{width,height:940},hasTouch:width<500,isMobile:width<500,serviceWorkers:'block',reducedMotion:'no-preference'}),p=await ctx.newPage(),errors=[],assetRequests=[],mutations=[];
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});p.on('request',r=>{if(/\.glb(?:\?|$)|model-viewer-4/.test(r.url()))assetRequests.push(r.url());if(new URL(r.url()).hostname.endsWith('.supabase.co')&&r.method()!=='GET')mutations.push(r.url());});
  await p.route('**/*',r=>{const u=new URL(r.request().url());if(u.hostname.endsWith('.supabase.co')&&r.request().method()!=='GET')return r.abort();if(!hosted&&u.origin!==origin)return r.fulfill({status:200,body:''});return r.continue();});
  const response=await p.goto(url);assert.equal(response.status(),200);await p.waitForFunction(()=>window.StrongStartExerciseGuides&&typeof defaults==='function');
  assert.equal(await p.evaluate(()=>APP_ENV),'development');assert.equal(await p.evaluate(()=>SB_URL),'https://gvyfgqhgqnfmtoytqpeo.supabase.co');assert.match(await p.locator('#environment-banner').innerText(),/TESTING/);
  assert.equal(assetRequests.length,0,'No heavy 3D files load at startup');await seed(p);
  const baseline=await p.evaluate(()=>JSON.stringify({state,logs,SYNC}));
  for(const id of Object.keys(registry.guides)){
   await open(p,id);await p.waitForSelector('.eg-demo[data-guide-status="ready"]',{timeout:60000});
   assert.equal(await p.locator('.eg-demo').getAttribute('data-exercise-guide'),id);
   assert(await p.locator('#modal .howto li').count()>=2);assert.equal(await p.locator('#modal .bodybig').count(),2);
   const model=p.locator('#modal model-viewer');assert(await model.evaluate(m=>m.loaded&&m.duration>=4.9));
   assert((await model.evaluate(m=>m.src)).includes(registry.animations[id].variants['instructor-rose-v1'].asset));
   await p.locator('.eg-play').click();await p.waitForTimeout(40);assert(await model.evaluate(m=>m.paused));
   const paused=await model.evaluate(m=>m.currentTime);await p.waitForTimeout(100);assert(Math.abs((await model.evaluate(m=>m.currentTime))-paused)<.02);
   await p.locator('.eg-speed').selectOption('0.5');assert.equal(await model.evaluate(m=>m.timeScale),.5);
   await p.locator('[data-eg-angle="-90"]').click();assert(Math.abs((await model.evaluate(m=>m.getCameraOrbit().theta))+Math.PI/2)<.01);
   assert.equal(await p.locator('#modal [role="dialog"]').count(),1,'Controls must not trigger the outer close action');
   await p.locator('.eg-play').click();await model.scrollIntoViewIfNeeded();const box=await model.boundingBox(),x=box.x+box.width*.55,y=box.y+box.height*.5;
   const before=await model.evaluate(m=>({time:m.currentTime,theta:m.getCameraOrbit().theta}));
   if(width>=500){await p.mouse.move(x,y);await p.mouse.down();await p.mouse.move(x+100,y,{steps:12});await p.mouse.up();}
   else{const c=await ctx.newCDPSession(p);await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:0}]});for(let i=1;i<=10;i++)await c.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-7*i,y,id:0}]});await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await c.detach();}
   await p.waitForTimeout(160);const after=await model.evaluate(m=>({time:m.currentTime,theta:m.getCameraOrbit().theta}));assert(Math.abs(after.theta-before.theta)>.05,'Rotate during movement');assert(after.time>before.time||after.time<.1,'Animation clock advances or loops');
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   if(['dumbbell-bench-press','goblet-squat','incline-dumbbell-press','dumbbell-floor-press','seated-dumbbell-shoulder-press','dumbbell-lateral-raise','single-arm-dumbbell-bench-press'].includes(id)){fs.mkdirSync(path.join(root,'test-results'),{recursive:true});await p.screenshot({path:path.join(root,`test-results/exercise-guide-${id}-${hosted?'hosted':'local'}-${width}.png`)});}
   const old=await model.elementHandle();await p.keyboard.press('Escape');assert.equal(await p.locator('#modal model-viewer').count(),0);assert(await old.evaluate(m=>m.paused));
   assert.equal(await p.evaluate(()=>JSON.stringify({state,logs,SYNC})),baseline,'Viewing a demo must not change member data');
  }
  const count=assetRequests.length;await open(p,'machine-chest-press');await p.waitForTimeout(100);assert.equal(await p.locator('.eg-demo').count(),0);assert.equal(assetRequests.length,count,'Unreviewed exercises do not load a 3D asset');await p.keyboard.press('Escape');
  // Production mappings use the same reviewed model without mutating member data.
  await p.evaluate(()=>{exInfo('hammer-curl');window.StrongStartExerciseGuides.attach({exerciseId:'hammer-curl',mount:document.querySelector('.exercise-guide-mount'),environment:'production'});});await p.waitForSelector('.eg-demo[data-guide-status="ready"]');assert.equal(await p.locator('.eg-demo').count(),1);await p.keyboard.press('Escape');
  // A real synthetic draft, coach preview and modal focus survive viewing the guide.
  await p.evaluate(()=>{startWorkout(weekKeys()[0]);clearInterval(timerInt);clearInterval(gInt);ui.tab='library';render();});const draft=await p.evaluate(()=>JSON.stringify({state,logs,SYNC}));
  await p.evaluate(()=>exInfo('single-arm-dumbbell-bench-press'));await p.waitForSelector('.eg-demo[data-guide-status="ready"]');await p.keyboard.press('Escape');assert.equal(await p.evaluate(()=>JSON.stringify({state,logs,SYNC})),draft);
  await p.evaluate(()=>{coachMode={own:{state,logs},name:'Synthetic preview'};exInfo('plank');});await p.waitForSelector('.eg-demo[data-guide-status="ready"]');await p.keyboard.press('Escape');assert.equal(await p.evaluate(()=>JSON.stringify({state,logs,SYNC})),draft);await p.evaluate(()=>{coachMode=null;});
  await ctx.setOffline(true);await p.evaluate(()=>exInfo('hammer-curl'));await p.waitForSelector('.eg-demo[data-guide-status="error"]');assert(await p.locator('#modal .howto').isVisible());await p.keyboard.press('Escape');await ctx.setOffline(false);
  assert.deepEqual(errors,[]);assert.deepEqual(mutations,[]);results.push({width,reviewedGuideCount:Object.keys(registry.guides).length,mouseOrTouchRotation:true,pauseSpeedViews:true,stateAndDraftPreserved:true,coachPreview:true,offlineTextFallback:true,unrelatedExcludedAndProductionEnabled:true,consoleErrors:errors});await ctx.close();
 }
 // Component load failure and late load after closing cannot remove the written guide.
 const reduced=await b.newPage({reducedMotion:'reduce',serviceWorkers:'block'});if(!hosted)await reduced.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.fulfill({status:200,body:''}));await reduced.goto(url);await seed(reduced);await open(reduced,'hammer-curl');await reduced.waitForSelector('.eg-demo[data-guide-status="ready"]');assert(await reduced.locator('model-viewer').evaluate(m=>m.paused));await reduced.close();
 const fail=await b.newPage({serviceWorkers:'block'});if(!hosted)await fail.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.fulfill({status:200,body:''}));await fail.route('**/*.glb',r=>r.fulfill({status:200,contentType:'model/gltf-binary',body:'invalid model fixture'}));await fail.goto(url);await seed(fail);await open(fail,'hammer-curl');await fail.waitForSelector('.eg-demo[data-guide-status="error"]');assert(await fail.locator('#modal .howto').isVisible());await fail.close();
 const late=await b.newPage({serviceWorkers:'block'});if(!hosted)await late.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.fulfill({status:200,body:''}));let release;const gate=new Promise(r=>release=r);await late.route('**/*.glb',async r=>{await gate;await r.continue().catch(()=>{});});await late.goto(url);await seed(late);const loading=late.waitForRequest(r=>r.url().endsWith('.glb'));await open(late,'hammer-curl');await loading;await late.keyboard.press('Escape');await late.evaluate(()=>exInfo('machine-chest-press'));release();await late.waitForTimeout(250);assert.equal(await late.locator('#modal model-viewer').count(),0);assert.equal(await late.locator('.eg-demo').count(),0);assert(await late.locator('#modal .howto').isVisible());await late.close();
 fs.mkdirSync(path.join(root,'test-results'),{recursive:true});fs.writeFileSync(path.join(root,`test-results/exercise-guides-${hosted?'hosted':'local'}.json`),JSON.stringify({url,results,reducedMotion:true,failedModelTextFallback:true,closeDuringLoad:true},null,2));console.log(JSON.stringify({url,results,reducedMotion:true,failedModelTextFallback:true,closeDuringLoad:true}));
}finally{await b.close();await new Promise(r=>server.close(r));}})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
