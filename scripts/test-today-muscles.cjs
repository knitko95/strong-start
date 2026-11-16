// Synthetic browser checks; external requests are blocked and no accounts are used.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const dist=path.resolve(__dirname,'../dist'),expected=fs.readFileSync(path.join(dist,'index.html'),'utf8');
const server=http.createServer((req,res)=>{
 try{const file=path.resolve(dist,'.'+(req.url==='/'?'/index.html':req.url.split('?')[0]));if(!file.startsWith(dist+path.sep))throw Error();
  res.setHeader('Content-Type',file.endsWith('.html')?'text/html':file.endsWith('.js')?'application/javascript':'application/octet-stream');res.end(fs.readFileSync(file));
 }catch{res.writeHead(404);res.end();}
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const url=process.argv[2]||`http://127.0.0.1:${server.address().port}/`,origin=new URL(url).origin;
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),results=[];
 try{for(const width of [1280,390,320])for(const theme of ['light','dark']){
  const context=await browser.newContext({viewport:{width,height:844},timezoneId:'America/New_York',serviceWorkers:'block',reducedMotion:'reduce'}),page=await context.newPage(),errors=[],mutations=[];
  await page.clock.setFixedTime(new Date('2026-11-15T12:00:00-05:00'));
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.route('**/*',r=>{const u=new URL(r.request().url());if(u.hostname.endsWith('.supabase.co')&&r.request().method()!=='GET')mutations.push(u.pathname);return u.origin===origin?r.continue():r.fulfill({status:200,body:''});});
  const response=await page.goto(url);assert.equal(response.status(),200);assert.equal((await response.text()).replace(/\r\n/g,'\n'),expected.replace(/\r\n/g,'\n'));
  await page.evaluate(theme=>{
   closeModal();sb=null;AUTH.ready=true;AUTH.user=null;AUTH.coach=false;ui.qsLater=true;
   state=defaults();state.setup=null;state.onboarded=true;logs=[];
   Object.assign(state.settings,{goals:['muscle'],days:[0,2,4],split:'ulf3',mins:45,theme,color:'blush',sound:false});
   state.places=[{k:'gym',n:'Gym',eq:PLACE_TYPES.gym.eq.split(' ')},{k:'home',n:'Home',eq:PLACE_TYPES.home.eq.split(' ')}];state.curPlace='gym';newBlock();ui.tab='today';render();
  },theme);
  assert.equal(await page.evaluate(()=>APP_ENV),'development');assert.match(await page.locator('#environment-banner').innerText(),/TESTING/);
  const trigger=page.locator('.today-muscle-preview');
  assert.equal(await trigger.locator('svg').count(),2);assert.equal(await trigger.innerText(),'');
  assert.equal(await trigger.getAttribute('aria-haspopup'),'dialog');
  assert.equal(await page.locator('.today-schedule-note').innerText(),'Planned today');
  async function checkCoverage(){
   const before=await page.evaluate(()=>JSON.stringify({state,logs}));
   const mapping=await page.evaluate(()=>{
    const slots=state.draft?dSlots():sessionSlots(nextWorkoutKey());
    const p=[...new Set(slots.flatMap(s=>EXM[s.id]?.p||[]))];
    const s=[...new Set(slots.flatMap(s=>EXM[s.id]?.s||[]))].filter(m=>!p.includes(m));
    const items=Object.fromEntries([...p,...s].map(m=>[m,slots.filter(s=>[...EXM[s.id].p,...EXM[s.id].s].includes(m)).map(s=>({name:EX[s.id].n,role:EXM[s.id].p.includes(m)?'Main':'Supporting'}))]));
    return {p,s,items};
   });
   await trigger.click();
   assert.equal(await page.getByRole('dialog',{name:'Muscles worked'}).count(),1);
   assert.deepEqual(await page.locator('.workout-muscle-choice').evaluateAll(es=>es.map(e=>e.dataset.v)),[...mapping.p,...mapping.s]);
   assert.equal(await page.locator('.workout-muscle-sheet .bodypair svg').count(),2);
   assert.equal(await page.locator('#app').evaluate(e=>e.closest('[inert]')!==null),true);
   for(const id of [...mapping.p,...mapping.s]){
    await page.locator(`.workout-muscle-choice[data-v="${id}"]`).click();
    assert.equal(await page.locator('.workout-muscle-choice[aria-pressed="true"]').getAttribute('data-v'),id);
    assert.deepEqual(await page.locator('.workout-muscle-item').evaluateAll(es=>es.map(e=>({name:e.firstElementChild.textContent,role:e.lastElementChild.textContent}))),mapping.items[id]);
   }
   const first=page.locator('#modal button[data-action="closemodal"]'),last=page.locator('.workout-muscle-choice').last();
   await last.focus();await page.keyboard.press('Tab');assert.equal(await first.evaluate(e=>e===document.activeElement),true);
   await first.focus();await page.keyboard.press('Shift+Tab');assert.equal(await last.evaluate(e=>e===document.activeElement),true);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   await page.keyboard.press('Escape');await page.waitForFunction(()=>document.activeElement?.matches('.today-muscle-preview'));
   assert.equal(await page.locator('#modal .sheet').count(),0);
   assert.equal(await page.evaluate(()=>JSON.stringify({state,logs})),before,'browsing must not change plan, history or draft');
  }
  await checkCoverage();
  await page.locator('.today-location [data-v="home"]').click();await checkCoverage();
  await page.locator('.today-location [data-v="gym"]').click();
  await page.locator('.today-exercises-toggle').click();
  await page.locator('#today-exercises [data-action="swap"]').first().click();
  const replacement=await page.locator('[data-action="swapselect"]').first().getAttribute('data-id');
  await page.locator('[data-action="swapselect"]').first().click();await page.locator('[data-action="swapapply"]').click();
  assert.equal(await page.evaluate(id=>sessionSlots(nextWorkoutKey()).some(s=>s.id===id),replacement),true);
  await checkCoverage();
  await page.locator('.today-start').click();assert.equal(await page.evaluate(()=>state.draft.step.ph),'warm');
  await page.evaluate(()=>{fAction('fpause',{});});
  const draft=await page.evaluate(()=>JSON.stringify(state.draft));
  await page.locator('.today-location [data-v="home"]').click();await checkCoverage();
  assert.equal(await page.evaluate(()=>JSON.stringify(state.draft)),draft,'changing preview place preserves the paused session');
  await page.reload();await page.evaluate(()=>{sb=null;AUTH.ready=true;AUTH.user=null;ui.qsLater=true;ui.tab='today';render();});
  await checkCoverage();
  await page.evaluate(()=>{coachMode={name:'Synthetic member',own:{state:structuredClone(state),logs:structuredClone(logs)}};render();});
  await checkCoverage();assert.equal(await page.locator('.today-workout [data-action="fbegin"],.today-workout [data-action="resume"]').count(),0);
  await page.evaluate(()=>{coachMode=null;state.draft=null;state.settings.split='ppl3';state.settings.days=[0,2,4];newBlock();ui.tab='today';render();});
  for(const key of await page.evaluate(()=>weekKeys())){
   await page.evaluate(key=>{state.draft={key,place:state.curPlace,week:weekNum(),subs:{},sets:{},planCounts:{},step:{ph:'warm'}};render();},key);
   await checkCoverage();
  }
  await page.evaluate(()=>{state.draft=null;state.settings.split='ulf3';newBlock();ui.tab='today';render();});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  fs.mkdirSync(path.resolve(__dirname,'../test-results'),{recursive:true});
  if(width===390){await page.screenshot({path:path.resolve(__dirname,`../test-results/today-muscles-${theme}.png`),fullPage:true});await trigger.click();await page.screenshot({path:path.resolve(__dirname,`../test-results/today-muscles-popup-${theme}.png`),fullPage:true});}
  assert.deepEqual(errors,[]);assert.deepEqual(mutations,[]);results.push({width,theme,coverage:true,location:true,swap:true,pausedReload:true,coachReadOnly:true,focus:true});await context.close();
 }console.log(JSON.stringify({url,results}));}
 finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
