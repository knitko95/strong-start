// Real boot and interaction checks with fresh browser storage; no injected login/state.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const dist=path.resolve(__dirname,'../dist');
const expected=fs.readFileSync(path.join(dist,'index.html'),'utf8');
const server=http.createServer((req,res)=>{
  try{const file=path.resolve(dist,'.'+(req.url==='/'?'/index.html':req.url.split('?')[0]));if(!file.startsWith(dist+path.sep))throw Error();res.setHeader('Content-Type',file.endsWith('.html')?'text/html':file.endsWith('.js')?'application/javascript':'application/octet-stream');res.end(fs.readFileSync(file));}
  catch{res.writeHead(404);res.end();}
});
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const url=process.argv[2]||`http://127.0.0.1:${server.address().port}/`;
  const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  try{for(const width of [1280,390,320]){
    const context=await browser.newContext({viewport:{width,height:844},serviceWorkers:'block'}),page=await context.newPage(),errors=[],backend=[];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('request',r=>{if(new URL(r.url()).hostname.endsWith('.supabase.co'))backend.push(r.url());});
    // Preserve an old account cache: demo must never open, change, or remove it.
    await context.addInitScript(()=>{localStorage.setItem('dev_strongstart_state_v3','old-account-cache');localStorage.setItem('dev_strongstart_acct','{"id":"old-account"}');});
    const response=await page.goto(url);assert.equal(response.status(),200);
    assert.equal((await response.text()).replace(/\r\n/g,'\n'),expected.replace(/\r\n/g,'\n'));
    await page.waitForFunction(()=>typeof state!=='undefined'&&state.block);
    assert.equal(await page.evaluate(()=>DEMO_MODE&&sb===null&&AUTH.user===null&&!needsAuth()),true);
    assert.equal(await page.locator('[data-action="authgoogle"]').count(),0);
    assert.match(await page.locator('#environment-banner').innerText(),/DEV2 DEMO/);
    assert.equal(await page.evaluate(()=>state.settings.name),'Demo');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    for(const tab of ['plan','library','history','settings']){
      await page.locator(`[data-action="tab"][data-tab="${tab}"]`).click();
      assert.equal(await page.evaluate(()=>ui.tab),tab);
    }
    await page.locator('[data-action="settingsgroup"][data-v="account"]').click();
    await page.locator('[data-action="sectoggle"][data-v="account"]').click();
    assert.equal(await page.locator('[data-action="demoreset"]').isVisible(),true);
    await page.evaluate(()=>{ui.tab='today';render();});
    await page.locator('.today-workout [data-action="fbegin"]').click();
    assert.ok(await page.evaluate(()=>state.draft));
    await page.evaluate(()=>fAction('fpause',{}));
    const draft=await page.evaluate(()=>JSON.stringify(state.draft));
    await page.reload();
    assert.equal(await page.evaluate(()=>JSON.stringify(state.draft)),draft);
    // Complete one synthetic session and verify it survives reload.
    await page.evaluate(()=>{for(const rows of Object.values(state.draft.sets))for(const row of rows){row.done=true;row.r=10;row.w=20;}finishWorkout();closeModal();});
    assert.equal(await page.evaluate(()=>logs.length),1);
    await page.reload();assert.equal(await page.evaluate(()=>logs.length),1);
    await page.evaluate(()=>{ui.tab='settings';ui.settingsGroup='account';ui.open=ui.open||{};ui.open.account=true;render();});
    await page.locator('[data-action="demoreset"]').click();
    await page.locator('[data-action="confirmok"]').click();
    assert.equal(await page.evaluate(()=>logs.length),0);assert.equal(await page.evaluate(()=>state.draft),null);
    await page.reload();assert.equal(await page.evaluate(()=>state.settings.name),'Demo');
    assert.equal(await page.evaluate(()=>localStorage.getItem('dev_strongstart_state_v3')),'old-account-cache');
    assert.equal(await page.evaluate(()=>localStorage.getItem('dev_strongstart_acct')),'{"id":"old-account"}');
    assert.deepEqual(backend,[]);assert.deepEqual(errors,[]);
    if(width===390){fs.mkdirSync(path.resolve(__dirname,'../test-results'),{recursive:true});await page.screenshot({path:path.resolve(__dirname,'../test-results/dev2-demo-phone.png'),fullPage:true});}
    console.log(`PASS demo at ${width}px: automatic boot, tabs, workout, reload, finish, reset, account isolation, zero backend requests`);
    await context.close();
  }}finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
