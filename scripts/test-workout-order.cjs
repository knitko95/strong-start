// Real browser flow with synthetic local state. No accounts or database mutations.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const dist=path.resolve(__dirname,'../dist'),expected=fs.readFileSync(path.join(dist,'index.html'),'utf8').replace(/\r\n/g,'\n');
const server=http.createServer((req,res)=>{try{const f=path.resolve(dist,'.'+(req.url==='/'?'/index.html':req.url.split('?')[0]));if(!f.startsWith(dist+path.sep))throw Error();res.setHeader('Content-Type',({'html':'text/html','js':'application/javascript','css':'text/css','json':'application/json','png':'image/png'})[f.split('.').pop()]||'application/octet-stream');res.end(fs.readFileSync(f));}catch{res.writeHead(404);res.end();}});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const url=process.argv[2]||`http://127.0.0.1:${server.address().port}/`,origin=new URL(url).origin;
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),results=[];
 try{for(const width of [1280,390,320]){
  const context=await browser.newContext({viewport:{width,height:844},timezoneId:'America/New_York',serviceWorkers:'block',reducedMotion:'reduce'}),page=await context.newPage(),errors=[],mutations=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.route('**/*',r=>{const u=new URL(r.request().url());if(u.hostname.endsWith('.supabase.co')&&r.request().method()!=='GET'){mutations.push(u.pathname);return r.abort();}return u.origin===origin?r.continue():r.fulfill({status:200,body:''});});
  const time=async d=>page.clock.setFixedTime(new Date(d+'T12:00:00-05:00'));
  await time('2026-11-11');
  const response=await page.goto(url);assert.equal(response.status(),200);assert.equal((await response.text()).replace(/\r\n/g,'\n'),expected);
  await page.evaluate(()=>{
   closeModal();sb=null;AUTH.ready=true;AUTH.user=null;AUTH.coach=false;ui.qsLater=true;
   state=defaults();state.setup=null;state.onboarded=true;logs=[];
   state.settings.goals=['muscle'];state.settings.days=[1,3,5];state.settings.split='fb3';state.settings.sound=false;
   state.places=[{k:'gym',n:'Gym',eq:PLACE_TYPES.gym.eq.split(' ')}];state.curPlace='gym';newBlock();ui.tab='today';render();
  });
  assert.equal(await page.evaluate(()=>APP_ENV),'development');assert.match(await page.locator('#environment-banner').innerText(),/TESTING/);
  const keys=await page.evaluate(()=>weekKeys());
  const check=async key=>{if(await page.locator('.today-workout [data-action="resume"]').count()){assert.equal(await page.evaluate(()=>state.draft.key),key);return;}assert.equal(await page.locator('.today-workout [data-action="fbegin"],.today-workout [data-action="open"]').getAttribute('data-key'),key);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);};
  const start=async key=>{await page.locator(`.today-workout [data-action="fbegin"][data-key="${key}"]`).click();assert.equal(await page.evaluate(()=>state.draft.key),key);};
  const finish=async(partial=false)=>page.evaluate(partial=>{
   const rows=Object.values(state.draft.sets);for(const list of rows)for(const r of list){r.w='20';r.r='8';r.done=!partial;}
   if(partial)rows[0][0].done=true;finishWorkout();closeModal();render();
  },partial);
  await check(keys[0]);assert.match(await page.locator('#app').innerText(),/Planned Today/);
  assert.equal(await page.locator('.today-other').first().evaluate(e=>e.open),false);
  assert.deepEqual(await page.locator('.day .idx').allTextContents(),['2','3']);
  await start(keys[0]);await finish();await check(keys[1]);assert.equal(await page.evaluate(()=>weekLogs(weekNum()).length),1);
  assert.match(await page.locator('#app').innerText(),/Planned Fri, Nov 13/);
  await time('2026-11-13');await page.evaluate(()=>render());await start(keys[1]);await finish(true);await check(keys[1]);
  const partialId=await page.evaluate(()=>state.draft.logId);
  await time('2026-11-18');await page.reload();
  await page.evaluate(()=>{sb=null;AUTH.ready=true;AUTH.user=null;AUTH.coach=false;ui.qsLater=true;ui.tab='today';render();});
  await check(keys[1]);assert.equal(await page.evaluate(()=>weekNum()),2);assert.equal(await page.evaluate(()=>weekLogs(weekNum()).length),0);
  await page.locator('[data-action="resume"]').click();await finish();await check(keys[2]);
  assert.equal(await page.evaluate(()=>logs[0].id),partialId);assert.equal(await page.evaluate(()=>logs[0].week),2);
  assert.equal(await page.evaluate(()=>logs[0].completedAt.slice(0,10)),'2026-11-18');assert.equal(await page.evaluate(()=>weekLogs(2).length),1);
  await time('2026-11-20');await page.evaluate(()=>render());await start(keys[2]);await finish();await check(keys[0]);
  await time('2026-11-23');await page.evaluate(()=>render());await check(keys[0]);await start(keys[0]);await finish();await check(keys[1]);
  // Progress does not block another cycle, and repeated sessions stay deduplicated weekly.
  await page.evaluate(()=>{ui.tab='plan';render();});assert.match(await page.locator('#app').innerText(),/Workout 1/);assert.deepEqual(await page.locator('.plan-day.planned > span').allTextContents(),['Mon','Wed','Fri']);
  await page.evaluate(()=>{ui.tab='settings';ui.settingsGroup='training';ui.open={schedule:true};render();});assert.match(await page.locator('#app').innerText(),/Workout order/);
  assert.deepEqual(await page.locator('.ordday').allTextContents(),['1','2','3']);
  // Selected days can change without moving the sequence; flexible uses the same cursor.
  await page.evaluate(()=>{state.settings.days=[2,4,6];state.settings.flex=true;state.settings.nDays=3;ui.tab='today';render();});await check(keys[1]);
  assert.match(await page.locator('#app').innerText(),/Any day/);
  const before=await page.evaluate(()=>JSON.stringify({state,logs}));
  await page.evaluate(()=>{coachMode={own:{state:structuredClone(state),logs:structuredClone(logs)}};render();});await check(keys[1]);
  assert.equal(await page.locator('[data-action="fbegin"]').count(),0);assert.equal(await page.evaluate(()=>JSON.stringify({state,logs})),before);
  await page.evaluate(()=>{coachMode=null;state.settings.flex=false;state.settings.days=[1,3,5];render();});
  fs.mkdirSync(path.resolve(__dirname,'../test-results'),{recursive:true});await page.screenshot({path:path.resolve(__dirname,`../test-results/workout-order-${width}.png`),fullPage:true});
  assert.deepEqual(errors,[]);assert.deepEqual(mutations,[]);results.push({width,midweek:true,missedDay:true,resumedAcrossWeeks:true,wrap:true,reload:true,coachReadOnly:true,errors});await context.close();
 }console.log(JSON.stringify({url,results},null,2));}
 finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
