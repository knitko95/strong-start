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
  const response=await page.goto(url);await page.waitForFunction(()=>state&&document.querySelector('#app h1')&&!PAGE.flight&&!DEVICE.pending);
  assert.equal((await response.text()).replace(/\r\n/g,'\n'),fs.readFileSync(path.join(dist,'index.html'),'utf8').replace(/\r\n/g,'\n'),'exact candidate HTML');
  await page.evaluate(()=>{
   sb=null;AUTH.ready=true;AUTH.user=null;ui.qsLater=true;state=defaults();logs=[];state.setup=null;state.onboarded=true;
   state.settings.goals=['muscle'];state.settings.days=[1,3,5];state.settings.split='fb3';state.settings.sound=false;
   state.places=[{k:'gym',n:'Gym',eq:EQ_ALL}];state.curPlace='gym';newBlock();
   state.ex={synthetic:{w:25}};logs=[{id:'synthetic-history',entries:[],units:'lb',status:'complete'}];startWorkout(weekKeys()[0]);clearInterval(timerInt);clearInterval(gInt);
   ui.tab='today';ui.settingsGroup=null;render();
  });
  assert.equal(await page.evaluate(()=>APP_ENV),'development');
  assert.match(await page.locator('#environment-banner').innerText(),/TESTING/);
  const baseline=await page.evaluate(()=>JSON.stringify({state,logs}));
  const progress=await page.evaluate(()=>JSON.stringify({block:state.block,ex:state.ex,logs,draft:state.draft}));
  assert.deepEqual(await page.locator('#tabs button').evaluateAll(es=>es.map(e=>e.dataset.tab)),['today','plan','library','history']);
  assert(await page.locator('#settings-shortcut').isVisible());
  await page.locator('#settings-shortcut').focus();await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(()=>ui.tab),'settings');
  assert.equal(await page.locator('#settings-shortcut').getAttribute('aria-current'),'page');
  assert.equal(await page.locator('#tabs [aria-current]').count(),0);
  assert.equal(await page.evaluate(()=>JSON.stringify({state,logs})),baseline,'opening Settings preserves saved data');
  assert.equal(await page.locator('[data-action="settingsgroup"]').count(),4);
  assert.equal(await page.locator('#app h1').innerText(),'Profile & settings');
  assert.equal(await page.locator('.settings-row .settings-icon').count(),5);
  const go=async id=>{await page.locator(`[data-action="settingspage"][data-v="${id}"]`).click();};
  const back=async()=>{await page.locator('[data-action="settingsback"]').click();await page.waitForTimeout(90);};
  for(const [group,ids] of [['training',['goals','schedule','split','order','places','level','pain','exch','block']],['workout',['cardio','timers']],['preferences',['appearance','units']],['account',['backup','privacy']]]){
   await page.locator(`[data-action="settingsgroup"][data-v="${group}"]`).click();
   assert.equal(await page.evaluate(()=>document.activeElement.id),'settings-title');
   for(const id of ids){
    await go(id);
    assert.equal(await page.evaluate(()=>ui.settingsPage),id);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${id} overflows at ${width}`);
    assert.equal(await page.locator('#tabs [aria-current]').count(),0);
    if(id==='places'){
     await page.locator('[data-action="editeq"]').first().click();
     await page.locator('[data-action="eqdone"]').first().click();await page.waitForTimeout(90);
     assert.equal(await page.evaluate(()=>ui.settingsPage),'places');
    }
    if(id==='backup'){await go('restore');assert(await page.locator('#restore').isVisible());await back();assert.equal(await page.evaluate(()=>ui.settingsPage),'backup');}
    await back();assert.equal(await page.evaluate(()=>ui.settingsPage),null);
    assert.equal(await page.evaluate(()=>ui.settingsGroup),group);
    assert.equal(await page.evaluate(()=>document.activeElement.dataset.v),id,'Back restores the opening row');
   }
   await back();assert.equal(await page.locator('#app h1').innerText(),'Profile & settings');
  }
  assert.equal(await page.evaluate(()=>JSON.stringify({block:state.block,ex:state.ex,logs,draft:state.draft})),progress,'browsing preserves plan, weights, logs and paused workout');
  await go('profile');
  assert(await page.locator('#set-name').isVisible(),'profile fields open without another disclosure');
  await page.locator('#set-name').fill('Synthetic member');await page.locator('#set-name').dispatchEvent('change');
  await page.locator('#wi-on').check();
  await page.locator('[data-tab="weigh"]').click();await page.locator('[data-action="weighback"]').click();await page.waitForTimeout(90);
  assert.equal(await page.locator('#app h1').innerText(),'Your profile');
  await back();
  await page.locator('[data-action="settingsgroup"][data-v="preferences"]').click();await go('units');
  await page.locator('[data-action="setunits"][data-u="kg"]').click();assert.equal(await page.evaluate(()=>state.settings.units),'kg');
  await page.locator('[data-action="setunits"][data-u="lb"]').click();await back();await go('appearance');
  await page.locator('[data-action="settheme"][data-t="dark"]').click();assert.equal(await page.evaluate(()=>state.settings.theme),'dark');await back();await back();
  await page.locator('[data-action="settingsgroup"][data-v="workout"]').click();await go('timers');await page.locator('#set-sound').check();
  assert.equal(await page.evaluate(()=>state.settings.sound),true);
  assert.equal(await page.evaluate(()=>JSON.stringify({block:state.block,ex:state.ex,logs,draft:state.draft})),progress);
  await page.reload();await page.waitForFunction(()=>state&&document.querySelector('#app h1')&&!PAGE.flight&&!DEVICE.pending);await page.evaluate(()=>{sb=null;AUTH.ready=true;ui.qsLater=true;ui.tab='settings';render();});
  assert.equal(await page.evaluate(()=>state.settings.name),'Synthetic member');assert.equal(await page.evaluate(()=>state.settings.theme),'dark');assert.equal(await page.evaluate(()=>state.settings.sound),true);
  await page.evaluate(()=>{state.settings.theme='light';state.settings.bw=145;AUTH.user={id:'synthetic-member',email:'member@example.invalid'};AUTH.access='ok';CM.owner=AUTH.user.id;CM.summary={coach:{name:'Synthetic coach',unread:2}};ui.settingsGroup=null;ui.settingsPage=null;render();});
  assert(await page.locator('[data-action="cmopen"]').isVisible());
  assert(await page.evaluate(()=>document.querySelector('.settings-coaching').getBoundingClientRect().bottom<document.querySelector('.settings-profile-link').getBoundingClientRect().top),'coaching comes before profile and settings');
  if(width===390){fs.mkdirSync(path.join(root,'test-results'),{recursive:true});await page.screenshot({path:path.join(root,'test-results/profile-settings-member.png'),fullPage:true});}
  await page.evaluate(()=>{AUTH.coach=true;CM.summary={inbox:[{needs_reply:true,unread:2}]};render();});
  assert.equal(await page.locator('[data-action="cmopen"]').count(),0,'coach has people tools rather than assigned-coach messaging');
  assert(await page.locator('[data-action="settingsmessages"]').isVisible());assert(await page.locator('[data-action="settingsinvites"]').isVisible());
  if(width===390)await page.screenshot({path:path.join(root,'test-results/profile-settings-coach.png'),fullPage:true});
  await page.locator('[data-action="settingsmessages"]').click();assert.equal(await page.evaluate(()=>ui.tab),'inbox');await page.goBack();await page.waitForTimeout(90);assert.equal(await page.locator('#app h1').innerText(),'Profile & settings');
  await page.evaluate(()=>{window.originalLoadPeople=loadPeople;loadPeople=()=>{ui.people={list:[]};ui.invites={list:[]};render();};});await page.locator('[data-action="settingsinvites"]').click();assert(await page.locator('[data-action="invitenew"]').isVisible());await page.goBack();await page.waitForTimeout(90);await page.evaluate(()=>{loadPeople=window.originalLoadPeople;});
  await page.evaluate(()=>{AUTH.coach=false;FB.owner=true;render();});assert(await page.locator('[data-action="people"]').isVisible());assert.equal(await page.locator('[data-action="settingsmessages"]').count(),0,'owner role does not grant coach conversations');
  await page.locator('[data-action="settingsgroup"][data-v="account"]').click();assert.equal(await page.locator('[data-action="selfdelete"]').count(),0,'staff self deletion remains guarded');
  await page.evaluate(()=>{FB.owner=false;render();});assert(await page.locator('[data-action="selfdelete"]').isVisible());await page.locator('[data-action="selfdelete"]').click();assert(await page.locator('#self-delete-confirm').isVisible());assert(await page.locator('#self-delete-button').isDisabled());await page.locator('[data-action="closemodal"]').last().click();
  await page.evaluate(()=>{AUTH.user=null;AUTH.coach=false;CM.summary=null;ui.tab='plan';settingsResetNavigation();render();});
  await page.locator('[data-action="planeditschedule"]').click();assert.equal(await page.locator('#app h1').innerText(),'Schedule & workout length');assert.match(await page.locator('[data-action="settingsback"]').innerText(),/Plan/);await back();assert.equal(await page.evaluate(()=>ui.tab),'plan','shortcut returns to Plan');
  await page.locator('#settings-shortcut').click();await page.locator('[data-action="settingsgroup"][data-v="training"]').click();
  await page.evaluate(()=>window.scrollTo(0,220));const scroll=await page.evaluate(()=>scrollY);await go('exch');await page.goBack();await page.waitForTimeout(90);assert.equal(await page.evaluate(()=>ui.settingsPage),null);assert(Math.abs(await page.evaluate(()=>scrollY)-scroll)<3,'browser Back restores menu scroll');await page.goForward();await page.waitForTimeout(90);assert.equal(await page.evaluate(()=>ui.settingsPage),'exch');
  await page.evaluate(()=>{AUTH.user={id:'synthetic-other'};});await page.goBack();await page.waitForTimeout(90);assert.equal(await page.evaluate(()=>ui.settingsPage),'exch','stale navigation cannot cross accounts');
  await page.evaluate(()=>{AUTH.user=null;coachMode={name:'Synthetic member'};render();});assert.equal(await page.locator('[data-action="settingsgroup"],[data-action="copybackup"],#set-name').count(),0);assert(await page.locator('[data-action="pickLevel"]').isVisible());
  await page.evaluate(()=>{coachMode=null;ui.tab='today';CM.summary={coach:{unread:102}};render();});assert.equal(await page.locator('#settings-shortcut').getAttribute('aria-label'),'Profile & settings, 102 unread');assert.equal(await page.locator('#settings-shortcut .tbadge').innerText(),'99+');
  await page.evaluate(()=>{ui.tab='workout';render();});assert.equal(await page.locator('#settings-shortcut').isVisible(),false);
  await page.evaluate(()=>{ui.tab='today';AUTH.recovery=true;render();});assert.equal(await page.locator('#settings-shortcut').isVisible(),false);
  assert.deepEqual(errors,[]);await page.close();console.log(`PASS coaching-first hub, icon destinations, direct fields, browser Back/Forward, origin/scroll/focus return, persistence, account and preview boundaries at ${width}px`);
 }}finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
