// Synthetic history interactions; external requests blocked, no account or database writes.
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
  const context=await browser.newContext({viewport:{width,height:844},serviceWorkers:'block'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.fulfill({status:200,body:''}));
  const response=await page.goto(url);assert.equal(response.status(),200);assert.equal((await response.text()).replace(/\r\n/g,'\n'),expected.replace(/\r\n/g,'\n'));
  await page.evaluate(theme=>{
   closeModal();sb=null;AUTH.ready=true;AUTH.user=null;ui.qsLater=true;
   state=defaults();state.setup=null;state.onboarded=true;Object.assign(state.settings,{theme,units:'lb',sound:false});
   state.places=[{k:'gym',n:'Gym',eq:PLACE_TYPES.gym.eq.split(' ')}];state.curPlace='gym';newBlock();
   const weighted=LIB.find(e=>e.mode==='L'&&primeEq(e)==='db'&&e.uni),timed=LIB.find(e=>e.mode==='T'),body=LIB.find(e=>e.mode==='B');
   logs=[{id:'history-test',date:'2026-11-12T15:00:00Z',name:'Full body A',dur:42,block:2,week:3,entries:[
    {ex:weighted.id,name:weighted.n,sets:[{w:20,r:10},{w:22.5,r:8},{w:22.5,r:7},{w:null,r:6},{w:0,r:5}],plan:'5×8–12 reps',planned:20,msg:'Keep this weight next time.'},
    {ex:timed.id,name:timed.n,sets:[{w:null,r:30}],plan:'2×30 sec'},
    {ex:body.id,name:body.n,sets:[{w:0,r:8},{w:5,r:6},{w:null,r:4}]},
    {ex:'archived-exercise',name:'Archived <exercise>',sets:[{w:null,r:12}],msg:'<img src=x onerror=alert(1)>'}
   ]},{id:'partial-test',date:'2025-11-12T15:00:00Z',name:'A longer workout name that wraps on small phones',status:'partial',completed:2,planned:9,entries:[]}];
   ui.histOpen=null;ui.histExercise=null;ui.tab='history';render();
  },theme);
  assert.equal(await page.evaluate(()=>APP_ENV),'development');assert.match(await page.locator('#environment-banner').innerText(),/TESTING/);
  const before=await page.evaluate(()=>JSON.stringify({state,logs,storage:{...localStorage}}));
  const first=page.locator('[data-action="histopen"]').first();assert.equal(await first.getAttribute('aria-expanded'),'false');
  assert.match(await first.innerText(),/View/);assert.doesNotMatch(await first.innerText(),/Block|Week/);
  assert.match(await page.locator('[data-action="histopen"]').nth(1).innerText(),/2025/);
  assert.match(await page.locator('[data-action="histopen"]').nth(1).innerText(),/Partial · 2 of 9 sets/);
  await first.focus();await page.keyboard.press('Enter');assert.equal(await first.getAttribute('aria-expanded'),'true');assert.equal(await first.evaluate(e=>e===document.activeElement),true);
  assert.equal(await page.locator('#history-session-0 .history-exercise').count(),4);
  assert.deepEqual(await page.locator('.history-sets').nth(0).locator('li').allTextContents(),['Set 120 lb10 reps','Set 222.5 lb8 reps','Set 322.5 lb7 reps','Set 4—6 reps','Set 50 lb5 reps']);
  const boxes=await page.locator('.history-sets').first().locator('li').evaluateAll(els=>els.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right};}));
  assert.equal(boxes[0].y,boxes[2].y);assert.ok(boxes[3].y>boxes[0].y);assert.equal(boxes[3].y,boxes[4].y);
  assert.match(await page.locator('.history-exercise').first().innerText(),/Weight per hand · Reps per side/);
  assert.equal(await page.locator('.history-sets').nth(1).locator('li').innerText(),'Set 1\n30 sec');
  assert.deepEqual(await page.locator('.history-sets').nth(2).locator('li').allTextContents(),['Set 1Bodyweight8 reps','Set 2+5 lb6 reps','Set 3—4 reps']);
  assert.equal(await page.locator('.history-sets').nth(3).locator('li').innerText(),'Set 1\n12 reps');
  assert.equal(await page.locator('.history-context').evaluate(e=>e.open),false);
  await page.locator('.history-context summary').click();assert.match(await page.locator('.history-context').innerText(),/Program 2 · Week 3/);assert.equal(await page.locator('.history-context img').count(),0);
  await page.locator('.history-context summary').click();
  assert.equal(await page.evaluate(()=>JSON.stringify({state,logs,storage:{...localStorage}})),before);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.equal(await page.locator('.history-set').evaluateAll(els=>els.every(e=>e.scrollWidth<=e.clientWidth)),true);
  fs.mkdirSync(path.resolve(__dirname,'../test-results'),{recursive:true});
  if(width===390){await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:path.resolve(__dirname,`../test-results/history-open-${theme}.png`),fullPage:true});}
  await page.evaluate(()=>{changeUnits('kg');render();});assert.match(await page.locator('.history-set b').first().innerText(),/9\.07 kg/);
  await page.evaluate(()=>persistLocal());await page.reload();await page.evaluate(()=>{sb=null;AUTH.ready=true;AUTH.user=null;ui.qsLater=true;ui.tab='history';ui.histOpen=logs[0].id;render();});
  assert.equal(await page.locator('.history-sets').first().locator('li').count(),5);assert.match(await page.locator('.history-set b').first().innerText(),/9\.07 kg/);
  await page.keyboard.press('Tab');await first.focus();await page.keyboard.press('Space');assert.equal(await first.getAttribute('aria-expanded'),'false');
  await page.locator('[data-action="histopen"]').nth(1).click();assert.equal(await page.locator('#history-session-0').isVisible(),false);
  await first.click();await page.locator('[data-action="dellog"]').click();await page.getByRole('button',{name:'Cancel',exact:true}).click();assert.equal(await page.evaluate(()=>logs.length),2);
  await page.evaluate(()=>{coachMode={name:'Synthetic member',own:{state:structuredClone(state),logs:structuredClone(logs)}};render();});
  assert.equal(await page.locator('[data-action="dellog"]').count(),0);
  await page.evaluate(()=>{coachMode=null;logs=[logs[0]];ui.histOpen='history-test';render();});
  await page.locator('[data-action="dellog"]').click();await page.locator('[data-action="confirmok"]').click();
  assert.match(await page.locator('#app').innerText(),/No sessions yet/);assert.equal(await page.evaluate(()=>ui.histExercise),null);
  await page.evaluate(()=>{logs=[{id:'legacy',date:'2024-01-01',name:'Legacy session',entries:[]}];ui.histOpen='legacy';render();});
  assert.doesNotMatch(await page.locator('[data-action="histopen"]').innerText(),/undefined|\? min/);
  assert.deepEqual(errors,[]);results.push({width,theme,exactBuild:true,keyboard:true,readOnly:true,sets:true,partial:true,delete:true,coach:true});await context.close();
 }console.log(JSON.stringify({url,results}));}
 finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
