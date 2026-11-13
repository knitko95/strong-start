// Real local/hosted app with synthetic workouts. No account or backend writes.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),expected=fs.readFileSync(path.join(root,'dist/index.html'),'utf8');
const server=http.createServer((req,res)=>{const file=path.resolve(root,'dist','.'+(req.url==='/'?'/index.html':req.url.split('?')[0]));if(!file.startsWith(path.join(root,'dist')+path.sep)){res.writeHead(403);res.end();return;}try{res.setHeader('Content-Type',file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.js')?'application/javascript':'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end();}});
async function seed(page,theme='light',kind='steady'){
 await page.evaluate(({theme,kind})=>{
  closeModal();sb=null;AUTH.ready=true;AUTH.user=null;ui.qsLater=true;ui.timer=null;clearInterval(timerInt);clearInterval(gInt);gInt=null;
  state=defaults();logs=[];state.setup=null;state.onboarded=true;Object.assign(state.settings,{goals:['muscle'],level:'regular',days:[1,3,5],split:'fb3',mins:45,theme,sound:false,cardio:{style:'walk',jog:'none',after:10}});
  state.places=[{k:'gym',n:'Gym',eq:PLACE_TYPES.gym.eq.split(' ')}];state.curPlace='gym';newBlock();startWorkout(weekKeys()[0]);ui.tab='workout';
  window.originalExtras=window.originalExtras||sessionExtras;
  window.installCooldownFixture=()=>{sessionExtras=(d,slots)=>({...window.originalExtras(d,slots),finisher:{...cItem(kind==='intervals'?'bike':'walk',kind==='intervals'?cAfterPhases('bike','intervals',10):[P(1,'Easy walk'),P(8,'Brisk walk'),P(1,'Cool off: easy walk')],kind==='intervals'?'Bike intervals':'Steady walk'),k:'f',cardio:'after',ctype:kind,min:10},cool:[{k:'w',t:'Easy walk',d:'2 min'},{k:'foam',t:'Foam roll: quads and calves',d:'30 s each'},{k:'s0',t:'Standing quad stretch',d:'30 s per side',stretch:true},{k:'s1',t:'Doorway chest stretch',d:'30 s per side',stretch:true},{k:'s2',t:'Seated hamstring stretch',d:'30 s per side',stretch:true}]});};
  window.installCooldownFixture();state.draft.rampDone=99;state.draft.step={ph:'cool'};state.draft._x=sessionExtras(state.draft,dSlots());gStart('cool');render();
 },{theme,kind});
 await page.evaluate(()=>document.fonts.ready);
}
const step=(page,i,s=0)=>page.locator(`[data-action="gstep"][data-i="${i}"][data-s="${s}"]`);
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const url=process.argv[2]||`http://127.0.0.1:${server.address().port}/`,origin=new URL(url).origin;
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),errors=[],results=[];
 const out=path.join(root,'test-results/cooldown-timeline');fs.mkdirSync(out,{recursive:true});
 try{
 for(const width of [1280,390,320])for(const theme of ['light','dark']){
  const page=await browser.newPage({viewport:{width,height:844},reducedMotion:'reduce',serviceWorkers:'block'});
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.route('**/*',r=>{const u=new URL(r.request().url());return u.origin===origin||['fonts.googleapis.com','fonts.gstatic.com'].includes(u.hostname)?r.continue():r.fulfill({status:200,body:''});});
  const response=await page.goto(url);assert.equal((await response.text()).replace(/\r\n/g,'\n'),expected.replace(/\r\n/g,'\n'),'exact candidate HTML');
  assert.equal(await page.evaluate(()=>SB_URL),'https://gvyfgqhgqnfmtoytqpeo.supabase.co');
  await seed(page,theme);
  await page.locator('[data-action="gfin"][data-v="yes"]').click();
  assert.equal(await page.evaluate(()=>state.draft.guide.mode),'run','Start cardio starts the timer immediately');
  assert.deepEqual(await page.locator('.guide-group-label').allTextContents(),['Cardio','Walk','Recovery','Stretches']);
  assert.equal(await page.locator('[data-action="gstep"]').count(),8);
  assert.equal(await page.locator('.guide-parts').count(),0);
  assert.equal(await page.locator('.flabel').innerText(),'Cardio · Part 1 of 3');
  const counts=await page.evaluate(()=>({steps:document.querySelectorAll('[data-action="gstep"]').length,segments:document.querySelectorAll('.fsegs i').length}));assert.equal(counts.steps,counts.segments);
  // Plus/minus adjust the countdown, including the beginning of the first part.
  const timerEnd=await page.evaluate(()=>state.draft.guide.end);
  await page.getByRole('button',{name:'15 seconds more',exact:true}).click();assert.equal(await page.evaluate(()=>state.draft.guide.end),timerEnd+15000);assert.equal(await page.evaluate(()=>state.draft.guide.s),0);
  await page.getByRole('button',{name:'15 seconds less',exact:true}).click();assert.equal(await page.evaluate(()=>state.draft.guide.end),timerEnd);assert.equal(await page.evaluate(()=>state.draft.guide.s),0);
  await page.evaluate(()=>{state.draft.guide.end=Date.now()-10000;gTick();});
  assert.equal(await page.evaluate(()=>state.draft.guide.s),1);assert.equal(await page.evaluate(()=>state.draft.guide.mode),'run');
  assert.equal(await page.locator('.ahead h1').innerText(),'Brisk walk');assert.equal(await page.locator('.ach>b').innerText(),'Time left');
  assert.match(await page.locator('.guide-next').innerText(),/Cool off/);
  await step(page,0,2).click();assert.equal(await page.evaluate(()=>state.draft.guide.mode),'run');
  await page.locator('[data-action="gpause"]').click();
  const pausedLeft=await page.evaluate(()=>state.draft.guide.left);
  await page.getByRole('button',{name:'15 seconds more',exact:true}).click();assert.equal(await page.evaluate(()=>state.draft.guide.left),pausedLeft+15000);assert.equal(await page.evaluate(()=>state.draft.guide.mode),'paused');
  await page.getByRole('button',{name:'15 seconds less',exact:true}).click();assert.equal(await page.evaluate(()=>state.draft.guide.left),pausedLeft);assert.equal(await page.evaluate(()=>state.draft.guide.mode),'paused');await step(page,0,1).click();assert.equal(await page.evaluate(()=>state.draft.guide.mode),'paused');
  await page.locator('.fbig[data-action="gresume"]').click();await step(page,1).click();assert.equal(await page.evaluate(()=>state.draft.guide.mode),'ready');
  await step(page,0,1).click();assert.equal(await page.evaluate(()=>state.draft.guide.mode),'paused');
  const left=await page.evaluate(()=>state.draft.guide.left);await page.reload();
  // Actual persisted guide is restored by boot; reinstall only synthetic extras.
  await page.evaluate(()=>{sb=null;AUTH.ready=true;AUTH.user=null;ui.qsLater=true;window.originalExtras=sessionExtras;sessionExtras=(d,s)=>({...window.originalExtras(d,s),finisher:{...cItem('walk',[P(1,'Easy walk'),P(8,'Brisk walk'),P(1,'Cool off: easy walk')],'Steady walk'),k:'f',cardio:'after',ctype:'steady',min:10}});ui.tab='workout';render();});
  assert.equal(await page.evaluate(()=>state.draft.guide.mode),'paused');assert.equal(await page.evaluate(()=>state.draft.guide.s),1);assert.equal(await page.evaluate(()=>state.draft.guide.left),left);
  // All modes fit on phones, with visible names and one consistent timer heading.
  await seed(page,theme);await page.locator('[data-action="gfin"][data-v="yes"]').click();
  for(const [name,i,s] of [['cardio',0,1],['walk',1,0],['stretch',3,0]]){
   await step(page,i,s).click();
   for(const mode of ['ready','run','paused']){
    await page.evaluate(mode=>{const G=state.draft.guide,it=gItems('cool')[G.i],part=segsFor(it).segs[G.s];G.mode=mode;G.pmode='run';G.tot=part.sec;G.end=Date.now()+part.sec*1000;G.left=part.sec*1000;render();},mode);
    await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    const geometry=await page.evaluate(()=>{const c=document.querySelector('.gclock'),r=c.getBoundingClientRect(),rail=document.querySelector('.path-scroll'),active=rail.querySelector('[aria-current="step"]');return {width:innerWidth,scroll:document.documentElement.scrollWidth,clockLines:c.scrollHeight/c.clientHeight,clockWidth:r.width,clockInner:c.scrollWidth,buttonBottom:document.querySelector('.fbig').getBoundingClientRect().bottom,activeVisible:active.getBoundingClientRect().left>=rail.getBoundingClientRect().left-1&&active.getBoundingClientRect().right<=rail.getBoundingClientRect().right+1};});
    assert.equal(geometry.scroll,width,'no horizontal page overflow');assert(geometry.clockInner<=geometry.clockWidth+1,'clock text fits');assert(geometry.buttonBottom<844,'primary action visible');assert(geometry.activeVisible,'selected step centered');
    assert.equal(await page.locator('.ach>b').innerText(),mode==='ready'?'Ready':mode==='paused'?'Paused':'Time left');
    if(width!==1280)await page.screenshot({path:path.join(out,`${name}-${mode}-${theme}-${width}.png`),fullPage:true});
    results.push({theme,name,mode,...geometry});
   }
  }
  // Walk remains manual after all cardio parts, including a long background gap.
  await seed(page,theme);await page.locator('[data-action="gfin"][data-v="yes"]').click();
  await page.evaluate(()=>{needCardioFeel=()=>false;state.draft.guide.end=Date.now()-550000;gTick();});
  assert.equal(await page.evaluate(()=>state.draft.guide.i),1);assert.equal(await page.evaluate(()=>state.draft.guide.mode),'ready');assert.equal(await page.evaluate(()=>state.draft.cardioDone.min),10);
  await page.locator('[data-action="gnow"]').click();await page.locator('[data-action="gdone"]').click();assert.equal(await page.evaluate(()=>state.draft.guide.mode),'ready','recovery waits for Ready');
  await step(page,3).click();await page.locator('[data-action="gnow"]').click();await page.locator('[data-action="gdone"]').click();assert.equal(await page.evaluate(()=>state.draft.guide.mode),'gap');await page.locator('[data-action="gnow"]').click();await page.locator('[data-action="gdone"]').click();assert.equal(await page.evaluate(()=>state.draft.guide.mode),'ready','next stretch waits');
  await seed(page,theme,'intervals');await page.locator('[data-action="gfin"][data-v="yes"]').click();
  const parts=await page.evaluate(()=>segsFor(gItems('cool')[0]).segs.length);assert.equal(await page.locator('.guide-group').first().locator('.path-set').count(),parts);await step(page,0,parts-1).click();assert.equal(await page.evaluate(()=>state.draft.guide.mode),'run');
  await page.evaluate(()=>{needCardioFeel=()=>true;});await page.locator('[data-action="gdone"]').click();assert.equal(await page.evaluate(()=>state.draft.guide.mode),'cfeel');await page.locator('[data-action="gcfeelpick"][data-v="good"]').click();await page.locator('[data-action="gcfeelconfirm"]').click();assert.equal(await page.evaluate(()=>state.draft.guide.mode),'ready');
  await seed(page,theme);await page.locator('[data-action="gfin"][data-v="no"]').click();assert.equal(await page.locator('.guide-group-label').filter({hasText:'Cardio'}).count(),0);assert.equal(await page.evaluate(()=>state.draft.guide.mode),'ready');
  const before=await page.evaluate(()=>JSON.stringify(state.draft));await page.evaluate(()=>{coachMode={uid:'synthetic-preview'};});await step(page,2).click();assert.equal(await page.evaluate(()=>JSON.stringify(state.draft)),before,'coach preview cannot navigate');await page.evaluate(()=>{coachMode=null;});
  await page.close();
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({url,layouts:results.length,results,errors},null,2));console.log(JSON.stringify({url,layouts:results.length,errors,journeys:6}));
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
