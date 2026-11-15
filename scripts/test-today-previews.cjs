// Exercise media fixtures only; no sign-in or backend mutations.
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const dist=path.resolve(__dirname,'../dist');
const server=http.createServer((req,res)=>{try{const file=path.resolve(dist,'.'+(req.url==='/'?'/index.html':req.url.split('?')[0]));if(!file.startsWith(dist+path.sep))throw Error();res.setHeader('Content-Type',file.endsWith('.html')?'text/html':file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.webp')?'image/webp':'application/json');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end();}});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=process.argv[2]||`http://127.0.0.1:${server.address().port}/`,origin=new URL(url).origin;
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),results=[];
 async function open(width,theme='light',fail=false){
  const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block',reducedMotion:'reduce'}),page=await context.newPage(),errors=[],requests=[],mutations=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{requests.push(r.url());if(r.method()!=='GET')mutations.push(r.url());});
  await context.route('**/*',r=>{const u=new URL(r.request().url());if(fail&&u.pathname.includes('/poses/assets/goblet-squat-'))return r.abort();return u.origin===origin?r.continue():r.fulfill({status:200,body:''});});
  await page.goto(url);await page.evaluate(theme=>{
   closeModal();sb=null;AUTH.ready=true;AUTH.user=null;AUTH.coach=false;ui.qsLater=true;state=defaults();state.setup=null;state.onboarded=true;logs=[];
   Object.assign(state.settings,{goals:['muscle'],days:[1,3,5],split:'fb3',mins:45,theme,sound:false});state.places=[{k:'gym',n:'Gym',eq:EQ_ALL}];state.curPlace='gym';newBlock();
   startWorkout(nextWorkoutKey());const slots=dSlots(),ids=['goblet-squat','barbell-bench-press','dumbbell-overhead-triceps-extension','dead-bug','plank'];state.draft.subs=Object.fromEntries(slots.map((s,i)=>[s.pk,ids[i%ids.length]]));ui.tab='today';ui.todayExercises=null;render();
  },theme);return {context,page,errors,requests,mutations};
 }
 try{
  for(const width of [1280,390,320])for(const theme of ['light','dark']){
   const {context,page,errors,requests,mutations}=await open(width,theme),before=await page.evaluate(()=>JSON.stringify({state,logs}));
   assert.equal(requests.some(r=>r.includes('/poses/')),false,'Collapsed plan requests no previews');await page.locator('.today-exercises-toggle').click();
   await page.waitForFunction(()=>[...document.querySelectorAll('.today-exercise-preview')].every(b=>['ready','missing'].includes(b.dataset.previewStatus)));
   const buttons=page.locator('.today-exercise-preview');assert.equal(await buttons.locator('img').count(),4);assert.equal(await buttons.locator('svg').count(),1);
   const metrics=await buttons.evaluateAll(es=>es.map(e=>({width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height,frame:e.dataset.previewFrame,id:e.dataset.poseId,src:e.querySelector('img')?.src})));
   assert(metrics.every(m=>m.width===88&&m.height===88));assert.equal(metrics[0].frame,'1');assert.equal(metrics[1].frame,'0');assert(metrics[0].src.includes('goblet-squat-1.'));
   const positions=await buttons.first().locator('img').evaluate(e=>({width:e.getBoundingClientRect().width,left:e.getBoundingClientRect().left,top:e.getBoundingClientRect().top,box:e.parentElement.getBoundingClientRect().toJSON()}));assert(positions.width>88,'Preview tightens the original canvas');
   assert.equal(requests.some(r=>/shared\/player\.js|\.glb$/.test(r)),false,'List never loads 3D media');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   await buttons.first().click();await page.locator('#modal .eg-demo[data-media-type="pose-pair"][data-guide-status="ready"]').waitFor({timeout:30000});await page.evaluate(()=>closeModal());
   assert.equal(await page.evaluate(()=>JSON.stringify({state,logs})),before,'Viewing previews/details leaves workout state unchanged');
   await page.evaluate(()=>{const s=dSlots()[0];state.draft.subs[s.pk]='dumbbell-lateral-raise';render();});await page.locator('.today-exercise-preview[data-pose-id="dumbbell-lateral-raise"][data-preview-status="ready"]').waitFor();
   assert.equal(await page.locator('.today-exercise-preview').first().getAttribute('data-preview-frame'),'1');
   if(width===390){fs.mkdirSync('test-results',{recursive:true});await page.screenshot({path:`test-results/today-previews-${theme}.png`,fullPage:true});}
   if(width===1280&&theme==='light'){
    const catalogue=JSON.parse(fs.readFileSync(path.join(dist,'exercise-guides/poses/catalogue.v1.json')));
    await page.evaluate(entries=>{const sheet=document.createElement('section');sheet.id='preview-sheet';sheet.style='display:grid;grid-template-columns:repeat(6,1fr);gap:16px;padding:20px;background:var(--surface);color:var(--ink)';for(const [id,entry] of entries){const tile=document.createElement('div'),button=document.createElement('button');button.className='today-exercise-preview';button.dataset.poseId=id;tile.append(button,document.createTextNode(entry.name));sheet.append(tile);}document.body.append(sheet);StrongStartPoseDemos.hydratePreviews(sheet,APP_ENV);},Object.entries(catalogue.exercises));
    await page.waitForFunction(()=>document.querySelectorAll('#preview-sheet [data-preview-status="ready"]').length===18);
    await page.locator('nav.tabs').evaluate(e=>e.style.visibility='hidden');await page.locator('#preview-sheet').screenshot({path:'test-results/today-preview-selections.png'});await page.locator('nav.tabs').evaluate(e=>e.style.visibility='');await page.locator('#preview-sheet').evaluate(e=>e.remove());
   }
   assert.deepEqual(errors,[]);assert.deepEqual(mutations,[]);await context.close();results.push({width,theme,staticPreviews:true,tapDetails:true,swapRefresh:true,unchangedState:true});
  }
  const {context,page,errors,requests}=await open(320,'light',true);await page.locator('.today-exercises-toggle').click();await page.locator('.today-exercise-preview[data-pose-id="goblet-squat"][data-preview-status="error"]').waitFor();
  assert.equal(await page.locator('.today-exercise-preview').first().locator('svg').count(),1);assert.equal(await page.locator('.today-strength-name').first().innerText(),'Goblet Squat');assert.equal(requests.some(r=>r.includes('/shared/player.js')),false);assert.deepEqual(errors,[]);await context.close();
  console.log(JSON.stringify({url,results,failedStillFallback:true}));
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
