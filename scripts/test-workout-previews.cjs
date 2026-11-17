// Other workouts UI with synthetic plans; no sign-in or backend writes.
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const dist=path.resolve(__dirname,'../dist');
const server=http.createServer((req,res)=>{try{const file=path.resolve(dist,'.'+(req.url==='/'?'/index.html':req.url.split('?')[0]));if(!file.startsWith(dist+path.sep))throw Error();res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end();}});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=process.argv[2]||`http://127.0.0.1:${server.address().port}/`,origin=new URL(url).origin;
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),results=[];
 try{for(const width of [1280,390,320])for(const theme of ['light','dark']){
  const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block',reducedMotion:'reduce'}),page=await context.newPage(),errors=[],mutations=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await context.route('**/*',r=>{const u=new URL(r.request().url());if(u.hostname.endsWith('.supabase.co')&&r.request().method()!=='GET')mutations.push(u.pathname);return u.origin===origin?r.continue():r.fulfill({status:200,body:''});});
  await page.goto(url);const key=await page.evaluate(theme=>{
   closeModal();sb=null;AUTH.ready=true;AUTH.user=null;AUTH.coach=false;ui.qsLater=true;state=defaults();state.setup=null;state.onboarded=true;logs=[];
   Object.assign(state.settings,{goals:['muscle'],days:[1,3,5],split:'fb3',mins:45,theme,sound:false});state.settings.cardio={style:'walk',jog:'none',after:10,adj:0,checks:0};state.places=[{k:'gym',n:'Gym',eq:EQ_ALL},{k:'home',n:'Home',eq:['bw','db','bn','mt']}];state.curPlace='gym';newBlock();
   const key=weekKeys().find(k=>k!==nextWorkoutKey()),ids=['goblet-squat','barbell-bench-press','dumbbell-overhead-triceps-extension','dead-bug','dumbbell-lateral-raise'];sessionSlots(key).forEach((s,i)=>state.block.plan[s.pk]=ids[i%ids.length]);ui.tab='today';render();return key;
  },theme);
  const before=await page.evaluate(()=>JSON.stringify({state,logs}));await page.locator('.today-other summary').click();await page.locator(`.today-other [data-action="open"][data-key="${key}"]`).click();
  assert.equal(await page.evaluate(()=>ui.tab),'preview');assert.equal(await page.evaluate(()=>state.draft),null);
  const plan=page.locator('#preview-exercises'),toggle=page.locator('.preview-plan-toggle');assert.equal(await toggle.getAttribute('aria-expanded'),'true');
  assert.deepEqual(await plan.locator('.today-plan-phase').evaluateAll(es=>es.map(e=>e.getAttribute('aria-label'))),['Warm-up','Exercises','Cardio','Cool-down']);
  await plan.locator('.today-exercise-preview[data-preview-status="ready"]').first().waitFor();assert.equal(await plan.locator('.today-exercise-preview').first().evaluate(e=>e.getBoundingClientRect().width),88);
  assert.equal(await plan.locator('details[open]').count(),0);await plan.locator('details[aria-label="Warm-up"] summary').click();assert(await plan.locator('details[aria-label="Warm-up"] li').count()>0);
  await toggle.click();assert.equal(await plan.isVisible(),false);await toggle.click();assert.equal(await plan.locator('details[open]').count(),1);
  await plan.locator('.today-exercise-preview').first().click();await page.locator('#modal .eg-demo[data-media-type="pose-pair"][data-guide-status="ready"]').waitFor();await page.evaluate(()=>closeModal());
  assert.equal(await page.evaluate(()=>JSON.stringify({state,logs})),before,'Browsing and viewing media does not start or change a workout');
  assert.equal(await plan.locator('[data-action="adjust"],[data-action="prepedit"],[data-action="addcardio"]').count(),0);
  if(width===390){fs.mkdirSync('test-results',{recursive:true});await page.screenshot({path:`test-results/other-workout-${theme}.png`,fullPage:true});}
  const first=await plan.locator('.today-strength-name').first().innerText();await plan.locator('[data-action="reorder"]').click();await page.locator('#modal [data-action="ordmv"][data-dir="1"]').first().click();await page.locator('#modal button[data-action="closemodal"]').click();assert.notEqual(await plan.locator('.today-strength-name').first().innerText(),first);
  await plan.locator('[data-action="swap"]').first().click();const replacement=await page.locator('[data-action="swapselect"]').first().getAttribute('data-id');await page.locator('[data-action="swapselect"]').first().click();await page.locator('[data-action="swapapply"]').click();assert.equal(await page.evaluate(({key,replacement})=>sessionSlots(key).some(s=>s.id===replacement),{key,replacement}),true);
  await page.locator('.today-location [data-v="home"]').click();assert.equal(await page.evaluate(()=>state.curPlace),'home');assert.equal(await toggle.getAttribute('aria-expanded'),'true');await page.locator('.today-location [data-v="gym"]').click();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.locator('.preview-start').click();assert.equal(await page.evaluate(()=>state.draft.key),key);assert.equal(await page.evaluate(()=>ui.tab),'workout');
  await page.evaluate(key=>{fAction('fpause',{});const s=dSlots()[0];state.draft.subs={...state.draft.subs,[s.pk]:'goblet-squat'};state.draft.sets[s.pk][0].done=true;ui.preview=key;ui.tab='preview';render();},key);
  assert.equal(await page.locator('.preview-start').innerText(),'Resume workout');assert.equal(await plan.locator('[data-action="reorder"]').count(),0);assert.equal(await plan.locator('.today-strength-name').first().innerText(),'Goblet Squat');
  await page.locator('.preview-start').click();assert.equal(await page.evaluate(()=>ui.tab),'workout');
  await page.evaluate(key=>{state.draft=null;coachMode=true;ui.preview=key;ui.tab='preview';render();},key);const coachBefore=await page.evaluate(()=>JSON.stringify({state,logs}));assert.equal(await page.locator('.preview-start,[data-action="reorder"]').count(),0);await toggle.click();await toggle.click();assert.equal(await page.evaluate(()=>JSON.stringify({state,logs})),coachBefore);
  assert.deepEqual(errors,[]);assert.deepEqual(mutations,[]);await context.close();results.push({width,theme,matchingPlan:true,stills:true,browseOnly:true,reorder:true,swap:true,location:true,startResume:true,coach:true});
 }console.log(JSON.stringify({url,results}));}finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
