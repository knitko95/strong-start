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
  const context=await browser.newContext({viewport:{width,height:844},serviceWorkers:'block',reducedMotion:'reduce'}),page=await context.newPage(),errors=[],mutations=[];
  page.on('pageerror',e=>errors.push(e.message));
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
  assert.deepEqual(errors,[]);assert.deepEqual(mutations,[]);results.push({width,theme,expand:true,directStart:true,resumeReload:true,coachReadOnly:true});await context.close();
 }console.log(JSON.stringify({url,results}));}
 finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
