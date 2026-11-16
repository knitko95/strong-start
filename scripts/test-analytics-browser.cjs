// Synthetic app state only; no Auth/database writes. PostHog requests intercepted locally.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve(__dirname,'..'),dist=path.join(root,'dist');
const server=http.createServer((req,res)=>{try{const f=path.join(dist,req.url==='/'?'index.html':req.url.split('?')[0]);res.setHeader('Content-Type',f.endsWith('.js')?'text/javascript':f.endsWith('.html')?'text/html':'application/octet-stream');res.end(fs.readFileSync(f));}catch{res.writeHead(404).end();}});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=process.argv[2]||`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{for(const width of (process.env.ANALYTICS_VERIFY_INGESTION?[390]:[1280,390,320])){
  const page=await browser.newPage({viewport:{width,height:844}}),events=[],errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>{const u=new URL(r.request().url());if(u.hostname.endsWith('.posthog.com')){events.push(JSON.parse(r.request().postData()));if(process.env.ANALYTICS_VERIFY_INGESTION)return r.continue();return r.fulfill({status:200,body:'1'});}return u.origin===new URL(url).origin?r.continue():r.fulfill({status:200,body:''});});
  await page.goto(url);await page.evaluate(()=>{
   if(location.hostname==='dev.strongstart.app')APP_BUILD.variant='analytics-verification';
   sb=null;AUTH.ready=true;AUTH.user={id:'synthetic-analytics-account'};AUTH.access='ok';ui.qsLater=true;
   state=defaults();logs=[];state.setup=null;state.onboarded=true;
   state.settings.goals=['muscle'];state.settings.days=[1,3,5];state.settings.split='fb3';
   state.places=[{k:'gym',n:'Synthetic gym',eq:EQ_ALL}];state.curPlace='gym';newBlock();ui.tab='today';render();
  });
  assert.equal(events.length,0);await page.locator('[data-action="analyticsyes"]').click();await page.waitForTimeout(100);
  assert(events.some(e=>e.event==='screen_viewed'));
  await page.evaluate(()=>{ui.tab='settings';render();});
  await page.locator('[data-action="settingsgroup"][data-v="profile"]').click();
  await page.locator('[data-action="sectoggle"][data-v="appearance"]').click();
  await page.locator('[data-action="settheme"][data-t="dark"]').click();
  await page.waitForTimeout(100);assert(events.some(e=>e.event==='settings_changed'));
  await page.evaluate(()=>{ui.tab='today';startWorkout(weekKeys()[0]);ui.tab='workout';render();});
  await page.waitForTimeout(100);assert(events.some(e=>e.event==='workout_started'));
  await page.evaluate(()=>{const s=dSlots()[0];state.draft.step={ph:'ex',pk:s.pk};state.draft.rampDone=99;state.draft.pairSeen=Object.fromEntries(dSlots().map(s=>{const pair=fPair(state.draft,dSlots(),s.pk);return [pair?.key||'none',true];}));render();});
  await page.locator('[data-action="fdone"]').first().click();await page.waitForTimeout(100);
  assert(events.some(e=>e.event==='set_logged'));
  await page.evaluate(()=>{fAction('fpause',{dataset:{}});});await page.waitForTimeout(100);
  assert(events.some(e=>e.event==='workout_paused'));
  await page.evaluate(()=>{ui.tab='settings';ui.settingsGroup='account';render();});
  const analyticsCard=page.locator('[data-action="sectoggle"][data-v="analytics"]');
  assert.equal(await analyticsCard.getAttribute('aria-expanded'),'false');
  assert.match(await analyticsCard.innerText(),/On/);
  assert.equal(await page.locator('[data-action="analyticsno"]').count(),0,'consent controls hidden until expanded');
  await analyticsCard.click();
  assert.equal(await analyticsCard.getAttribute('aria-expanded'),'true');
  assert(await page.locator('[aria-label="Usage analytics"]').isVisible());
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  fs.mkdirSync(path.join(root,'test-results'),{recursive:true});if(width===390)await page.screenshot({path:path.join(root,'test-results/analytics-phone.png'),fullPage:true});
  await page.locator('[data-action="analyticsno"]').click();await page.waitForTimeout(100);const stopped=events.length;
  await page.evaluate(()=>{USAGE.capture('set_logged');ui.tab='today';render();});await page.waitForTimeout(100);assert.equal(events.length,stopped);
  await page.evaluate(()=>{ui.tab='settings';ui.settingsGroup='account';render();});
  assert.match(await analyticsCard.innerText(),/Off/);
  assert.equal(await analyticsCard.getAttribute('aria-expanded'),'true','consent rerender preserves expanded card');
  await analyticsCard.click();assert.equal(await analyticsCard.getAttribute('aria-expanded'),'false');
  assert.equal(await page.evaluate(()=>USAGE.choice()),'no','collapsing does not change consent');
  await page.reload();await page.evaluate(()=>{sb=null;AUTH.ready=true;AUTH.user={id:'synthetic-analytics-account'};AUTH.access='ok';ui.qsLater=true;state.setup=null;ui.tab='settings';ui.settingsGroup='account';render();});
  assert.equal(await page.evaluate(()=>USAGE.choice()),'no','opt-out persists across reload');
  assert.equal(await analyticsCard.getAttribute('aria-expanded'),'false','card starts collapsed after reload');
  assert(!JSON.stringify(events).includes('synthetic-analytics-account'));assert(!JSON.stringify(events).includes('Synthetic gym'));
  assert.deepEqual(errors,[]);console.log(JSON.stringify({url,width,events:events.length,consent:true,settings:true,workout:true,privacy:true,errors}));await page.close();
 }}finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
