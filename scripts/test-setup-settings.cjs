// Browser regression with synthetic local data; no accounts or backend mutations.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'dist/index.html'),'utf8');
const server=http.createServer((req,res)=>{try{const file=path.join(root,'dist',req.url==='/'?'index.html':req.url.split('?')[0]);res.setHeader('Content-Type',file.endsWith('.html')?'text/html':'application/javascript');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end();}});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const url=process.argv[2]||`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{for(const width of [1280,390,320]){
  const page=await browser.newPage({viewport:{width,height:844}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.route('**/*',r=>new URL(r.request().url()).origin===new URL(url).origin?r.continue():r.fulfill({status:200,body:''}));
  const response=await page.goto(url);assert.equal((await response.text()).replace(/\r\n/g,'\n'),html.replace(/\r\n/g,'\n'),'hosted source differs');
  await page.evaluate(()=>{
   sb=null;AUTH.ready=true;ui.qsLater=true;state=defaults();logs=[];
   state.setup.a={...state.setup.a,quickSetup:false,name:'Unfinished answer',bw:180};render();
  });
  await page.locator('[data-action="sulater"]').click();
  assert.equal(await page.getByText('Finish setting up',{exact:true}).count(),1);
  await page.locator('[data-action="tab"][data-tab="settings"]').click();
  await page.evaluate(()=>{ui.profOpen=true;ui.open={profile:true};render();});
  // Open the profile using its actual toggle if needed.
  if(!await page.locator('#set-name').count()) await page.locator('[data-action="proftoggle"]').click();
  await page.locator('#set-name').fill('Synthetic profile');await page.locator('#set-name').dispatchEvent('change');
  assert.equal(await page.evaluate(()=>state.setup.a.name),'Synthetic profile');
  assert.equal(await page.evaluate(()=>+state.setup.a.bw),180,'unfinished wizard-only answer retained');
  await page.reload();await page.evaluate(()=>{sb=null;ui.qsLater=true;render();});
  await page.locator('[data-action="suresume"]').click();
  assert.equal(await page.locator('#su-name').inputValue(),'Synthetic profile');
  assert.equal(await page.locator('#su-bw').inputValue(),'180');
  await page.locator('[data-action="sulater"]').click();
  const before=await page.evaluate(()=>JSON.stringify({block:state.block,ex:state.ex,logs,draft:state.draft}));
  await page.locator('[data-action="tab"][data-tab="settings"]').click();
  await page.evaluate(()=>{ui.open={goals:true};render();});
  await page.locator('[data-action="setgoal"][data-v="muscle"]').click();
  assert.equal(await page.evaluate(()=>state.setup),null);
  assert.equal(await page.evaluate(()=>state.onboarded),true);
  assert.equal(await page.evaluate(()=>JSON.stringify({block:state.block,ex:state.ex,logs,draft:state.draft})),before,'Settings completion preserves program and progress');
  await page.reload();await page.evaluate(()=>{sb=null;ui.qsLater=true;render();});
  assert.equal(await page.getByText('Finish setting up',{exact:true}).count(),0);
  assert.equal(await page.evaluate(()=>state.settings.name),'Synthetic profile');
  // Older checkpoints lack a Settings baseline: current saved values win on Continue.
  await page.evaluate(()=>{state.setup={paused:true,step:'about',a:{...prefillSetup(),name:'Stale wizard'}};state.settings.name='Latest saved name';persistLocal();render();});
  await page.locator('[data-action="suresume"]').click();
  assert.equal(await page.evaluate(()=>state.setup),null);
  assert.equal(await page.evaluate(()=>state.settings.name),'Latest saved name');
  // Early quick setup stays incomplete; ordinary saving cannot create a plan.
  await page.evaluate(()=>{state=defaults();state.setup.a.name='Quick checkpoint';ui.tab='today';render();});
  await page.locator('[data-action="sulater"]').click();
  await page.reload();await page.evaluate(()=>{sb=null;render();});
  await page.locator('[data-action="suresume"]').click();
  assert.equal(await page.locator('#su-name').inputValue(),'Quick checkpoint');
  assert.equal(await page.evaluate(()=>state.block),null);
  // A paused quick setup after plan preview also completes from Settings.
  await page.evaluate(()=>{
   state.settings.goals=['muscle'];state.places=[{k:'gym',n:'Gym',eq:PLACE_TYPES.gym.eq.split(' ')}];state.curPlace='gym';newBlock();
   state.setup={paused:true,step:'week1',a:{...prefillSetup(),quickSetup:true},savedSettings:prefillSetup()};
   state.draft={synthetic:'keep'};state.ex={synthetic:{w:25}};logs=[{id:'synthetic-history',entries:[]}];
   ui.tab='settings';ui.profOpen=true;ui.open={profile:true};render();
  });
  const progress=await page.evaluate(()=>JSON.stringify({block:state.block,draft:state.draft,ex:state.ex,logs}));
  await page.locator('#set-name').fill('Quick saved profile');await page.locator('#set-name').dispatchEvent('change');
  assert.equal(await page.evaluate(()=>state.setup),null);
  assert.equal(await page.evaluate(()=>JSON.stringify({block:state.block,draft:state.draft,ex:state.ex,logs})),progress);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.deepEqual(errors,[]);await page.close();console.log(`PASS setup/Settings, resume, reload and progress preservation at ${width}px`);
 }}finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
