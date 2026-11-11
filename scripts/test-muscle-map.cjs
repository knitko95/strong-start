// Real-browser muscle selection with synthetic local data; no account or backend writes.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'dist/index.html'),'utf8');
const server=http.createServer((req,res)=>{
 try{const file=path.join(root,'dist',req.url==='/'?'index.html':req.url.split('?')[0]);
  res.setHeader('Content-Type',file.endsWith('.html')?'text/html':file.endsWith('.js')?'application/javascript':'application/octet-stream');res.end(fs.readFileSync(file));
 }catch{res.writeHead(404);res.end();}
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const url=process.argv[2]||`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{for(const width of [1280,390,320]){
  const page=await browser.newPage({viewport:{width,height:844},serviceWorkers:'block',reducedMotion:'reduce'}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.route('**/*',r=>new URL(r.request().url()).origin===new URL(url).origin?r.continue():r.fulfill({status:200,body:''}));
  const response=await page.goto(url);
  assert.equal((await response.text()).replace(/\r\n/g,'\n'),html.replace(/\r\n/g,'\n'),'tested page must match the exact development build');
  await page.evaluate(()=>{
   sb=null;AUTH.ready=true;ui.qsLater=true;state=defaults();logs=[];
   state.setup=null;state.onboarded=true;state.settings.goals=['muscle'];state.settings.days=[1,4];state.settings.split='ul2';state.settings.theme='light';
   state.places=[{k:'gym',n:'Gym',eq:PLACE_TYPES.gym.eq.split(' ')}];state.curPlace='gym';newBlock();ui.tab='plan';render();
  });
  assert.match(await page.locator('#environment-banner').innerText(),/TESTING/);
  assert.equal(await page.evaluate(()=>SB_URL),'https://gvyfgqhgqnfmtoytqpeo.supabase.co');
  const before=await page.evaluate(()=>JSON.stringify({state,logs,SYNC}));
  const chooser=()=>page.locator('[data-action="choosemuscle"]');
  await chooser().click();
  if(process.env.MUSCLE_MAP_SCREENSHOTS){
   fs.mkdirSync(process.env.MUSCLE_MAP_SCREENSHOTS,{recursive:true});
   await page.screenshot({path:path.join(process.env.MUSCLE_MAP_SCREENSHOTS,`muscle-picker-${width}.png`)});
  }
  assert.equal(await page.getByRole('dialog',{name:'Choose a muscle'}).count(),1);
  assert.equal(await page.locator('[data-action="pickmuscle"]').count(),21);
  const ids=await page.locator('[data-action="pickmuscle"]').evaluateAll(nodes=>nodes.map(n=>n.dataset.m));
  const bounds=await page.locator('[data-action="pickmuscle"]').evaluateAll(nodes=>nodes.map(n=>({w:n.getBoundingClientRect().width,h:n.getBoundingClientRect().height})));
  assert(bounds.every(b=>b.w>=44&&b.h>=44),'all picker targets are at least 44px');
  assert(await page.locator('#app').evaluate(el=>el.closest('[inert]')!==null),'background is inert');
  // Tab wraps in both directions; Escape returns focus to the chooser.
  const first=page.locator('#modal button[data-action="closemodal"]'),last=page.locator('[data-action="pickmuscle"]').last();
  await last.focus();await page.keyboard.press('Tab');assert(await first.evaluate(el=>el===document.activeElement));
  await first.focus();await page.keyboard.press('Shift+Tab');assert(await last.evaluate(el=>el===document.activeElement));
  await page.keyboard.press('Escape');await page.waitForTimeout(50);
  assert(await chooser().evaluate(el=>el===document.activeElement));
  // Exercise every choice, including the bottom of a scrollable phone sheet.
  for(const id of ids){
   await chooser().click();
   await page.locator(`[data-action="pickmuscle"][data-m="${id}"]`).click();
   await page.waitForTimeout(60);
   assert.equal(await page.locator('#modal .sheet').count(),0);
   assert.equal(await page.evaluate(()=>ui.musSel),id);
   assert(await page.locator(`#musclemap [data-m="${id}"].selected-region`).count()>0);
   assert.equal(await page.locator('#musclemap .map-detail h3').innerText(),await page.evaluate(id=>MUSCLES[id],id));
   assert.equal(await page.evaluate(()=>JSON.stringify({state,logs,SYNC})),before,'browsing must not change saved workout or account data');
  }
  // Re-selecting from the list retains selection; tapping the picture toggles it.
  await chooser().click();await page.locator('[data-action="pickmuscle"][data-m="shins"]').click();
  assert.equal(await page.evaluate(()=>ui.musSel),'shins');
  await page.locator('#musclemap [data-action="muscle"][data-m="shins"]').first().click();assert.equal(await page.evaluate(()=>ui.musSel),null);
  await page.locator('#musclemap [data-action="muscle"][data-m="chest"]').first().click();assert.equal(await page.evaluate(()=>ui.musSel),'chest');
  // The chooser is also available in read-only coach preview and cannot save changes.
  await page.evaluate(()=>{coachMode={own:{state,logs},name:'Synthetic preview'};render();});
  await chooser().click();assert.equal(await page.locator('[data-action="pickmuscle"]').count(),21);
  await page.locator('[data-action="pickmuscle"][data-m="quads"]').click();assert.equal(await page.evaluate(()=>ui.musSel),'quads');
  assert.equal(await page.evaluate(()=>JSON.stringify({state,logs,SYNC})),before);
  await page.evaluate(()=>{coachMode=null;render();});
  // Shared geometry still renders thumbnails and the existing exercise how-to.
  const exercise=await page.evaluate(()=>sessionSlots(weekKeys()[0])[0].id);
  await page.evaluate(id=>exInfo(id),exercise);
  assert.equal(await page.locator('#modal .bodybig').count(),2);
  await page.keyboard.press('Escape');
  for(const theme of ['light','dark']){
   await page.evaluate(theme=>{state.settings.theme=theme;render();},theme);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   await chooser().click();
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   await page.keyboard.press('Escape');
  }
  assert.deepEqual(errors,[]);await page.close();
  console.log(`PASS ${width}px: all 21 selections, diagram taps, 44px targets, dialog keyboard/focus, data preservation, coach preview, how-to diagrams, light/dark layout`);
 }}finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
