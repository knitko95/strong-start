// Synthetic Settings navigation and persisted preferences; no backend mutations.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),dist=path.join(root,'dist');
const server=http.createServer((req,res)=>{try{const file=path.join(dist,req.url.split('?')[0]==='/'?'index.html':req.url.split('?')[0]);res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end();}});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const url=process.argv[2]||`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{for(const width of [1280,390,320]){
  const page=await browser.newPage({viewport:{width,height:844}}),errors=[];
  page.on('pageerror',e=>{console.error(e.stack);errors.push(e.message);});page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.route('**/*',r=>new URL(r.request().url()).origin===new URL(url).origin?r.continue():r.fulfill({status:200,body:''}));
  const response=await page.goto(url);
  assert.equal((await response.text()).replace(/\r\n/g,'\n'),fs.readFileSync(path.join(dist,'index.html'),'utf8').replace(/\r\n/g,'\n'),'exact candidate HTML');
  await page.evaluate(()=>{
   sb=null;AUTH.ready=true;AUTH.user=null;ui.qsLater=true;state=defaults();logs=[];state.setup=null;state.onboarded=true;
   state.settings.goals=['muscle'];state.settings.days=[1,3,5];state.settings.split='fb3';state.settings.sound=false;
   state.places=[{k:'gym',n:'Gym',eq:EQ_ALL}];state.curPlace='gym';newBlock();
   state.ex={synthetic:{w:25}};logs=[{id:'synthetic-history',entries:[],units:'lb',status:'complete'}];startWorkout(weekKeys()[0]);clearInterval(timerInt);clearInterval(gInt);
   ui.tab='settings';ui.settingsGroup=null;render();
  });
  assert.equal(await page.evaluate(()=>APP_ENV),'development');
  assert.match(await page.locator('#environment-banner').innerText(),/TESTING/);
  const baseline=await page.evaluate(()=>JSON.stringify({state,logs}));
  const progress=await page.evaluate(()=>JSON.stringify({block:state.block,ex:state.ex,logs,draft:state.draft}));
  assert.equal(await page.locator('[data-action="settingsgroup"]').count(),4);
  if(width===390){fs.mkdirSync(path.join(root,'test-results'),{recursive:true});await page.screenshot({path:path.join(root,'test-results/settings-home.png'),fullPage:true});}
  for(const [group,ids] of [['training',['goals','schedule','places','level','block']],['workout',['exch','cardio','timers']],['profile',['appearance','weigh']],['account',['backup']]]){
   await page.locator(`[data-action="settingsgroup"][data-v="${group}"]`).click();
   assert.equal(await page.evaluate(()=>document.activeElement.id),'settings-title');
   assert.deepEqual(await page.locator('[data-action="sectoggle"]').evaluateAll(es=>es.map(e=>e.dataset.v)),ids);
   for(const id of ids){
    await page.locator(`[data-action="sectoggle"][data-v="${id}"]`).click();
    assert.equal(await page.locator(`[data-action="sectoggle"][data-v="${id}"]`).getAttribute('aria-expanded'),'true');
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${group}/${id} overflows at ${width}`);
   }
   await page.locator('[data-action="settingshome"]').click();
  }
  assert.equal(await page.evaluate(()=>JSON.stringify({state,logs})),baseline,'browsing preserves all saved data');
  await page.locator('[data-action="settingsgroup"][data-v="profile"]').click();
  await page.locator('[data-action="proftoggle"]').click();
  await page.locator('#set-name').fill('Synthetic member');await page.locator('#set-name').dispatchEvent('change');
  await page.locator('[data-action="setunits"][data-u="kg"]').click();
  assert.equal(await page.evaluate(()=>state.settings.units),'kg');
  await page.locator('[data-action="setunits"][data-u="lb"]').click();
  await page.locator('[data-action="settheme"][data-t="dark"]').click();
  assert.equal(await page.evaluate(()=>state.settings.theme),'dark');
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'expanded profile fits');
  await page.locator('[data-action="settingshome"]').click();
  await page.locator('[data-action="settingsgroup"][data-v="workout"]').click();
  await page.locator('#set-sound').check();
  assert.equal(await page.evaluate(()=>state.settings.sound),true);
  assert.equal(await page.evaluate(()=>JSON.stringify({block:state.block,ex:state.ex,logs,draft:state.draft})),progress);
  await page.reload();await page.evaluate(()=>{sb=null;AUTH.ready=true;ui.qsLater=true;ui.tab='settings';render();});
  assert.equal(await page.evaluate(()=>state.settings.name),'Synthetic member');
  assert.equal(await page.evaluate(()=>state.settings.theme),'dark');
  assert.equal(await page.evaluate(()=>state.settings.sound),true);
  // Render signed-in account controls and staff/member boundaries without a live session.
  const roles=await page.evaluate(()=>{
   sb={};AUTH.user={id:'synthetic',email:'settings@example.invalid'};AUTH.access='ok';ui.settingsGroup='account';ui.open={account:true,backup:true};
   const account=renderSettings();ui.settingsGroup=null;AUTH.coach=true;const staff=renderSettings();
   AUTH.coach=false;CM.owner=AUTH.user.id;CM.summary={coach:{name:'Synthetic coach',unread:2}};
   const member=renderSettings();$('#app').innerHTML=member;
   coachMode={name:'Synthetic member'};const preview=renderSettings();coachMode=null;AUTH.coach=false;sb=null;AUTH.user=null;
   return {account,staff,member,preview};
  });
  assert.match(roles.account,/Delete my account/);assert.match(roles.account,/privacy.html/);assert.match(roles.account,/terms.html/);
  assert.match(roles.staff,/Your people/);
  assert(roles.staff.indexOf('data-action="people"')<roles.staff.indexOf('settings-menu'),'staff card precedes settings categories');
  assert.match(roles.member,/Your coach/);
  assert(roles.member.indexOf('data-action="cmopen"')<roles.member.indexOf('settings-menu'),'coach messages precede settings categories');
  assert(await page.evaluate(()=>document.querySelector('.cm-card').getBoundingClientRect().bottom<document.querySelector('.settings-menu').getBoundingClientRect().top));
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert(!roles.preview.includes('settingsgroup'));assert(!roles.preview.includes('copybackup'));
  assert.deepEqual(errors,[]);await page.close();console.log(`PASS Settings categories, expanded controls, persistence, progress and role boundaries at ${width}px`);
 }}finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
