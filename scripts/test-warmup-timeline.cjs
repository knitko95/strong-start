// Real app, synthetic workouts and browser-only storage; no account writes.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),expected=fs.readFileSync(path.join(root,'dist/index.html'),'utf8');
const server=http.createServer((req,res)=>{const file=path.resolve(root,'dist','.'+(req.url==='/'?'/index.html':req.url.split('?')[0]));if(!file.startsWith(path.join(root,'dist')+path.sep)){res.writeHead(403);res.end();return;}try{res.setHeader('Content-Type',file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.js')?'application/javascript':'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end();}});
function fixture(){
 window.originalWarmExtras=window.originalWarmExtras||sessionExtras;
 sessionExtras=(d,slots)=>{const x=window.originalWarmExtras(d,slots);return {...x,warm:[cWarmItem(d.key,placeEq(d.place),4),{k:'m0',t:'Arm circles',d:'30 s'},{k:'m1',t:'Cat-cow',d:'8 reps'},{k:'m2',t:'Bodyweight squats',d:'10 reps'},...x.warm.filter(it=>it.ramp)]};};
}
async function seed(page,theme,style='walk'){
 await page.evaluate(({theme,style})=>{
  closeModal();sb=null;AUTH.ready=true;AUTH.user=null;ui.qsLater=true;ui.timer=null;clearInterval(timerInt);clearInterval(gInt);gInt=null;
  state=defaults();logs=[];state.setup=null;state.onboarded=true;Object.assign(state.settings,{goals:['muscle'],level:'regular',days:[1,3,5],split:'fb3',mins:45,theme,sound:false,cardio:{style,jog:'5',after:10}});state.places=[{k:'gym',n:'Gym',eq:PLACE_TYPES.gym.eq.split(' ')}];state.curPlace='gym';newBlock();startWorkout(weekKeys()[0]);ui.tab='workout';state.draft.step={ph:'warm'};needCardioFeel=()=>false;
 },{theme,style});
 await page.evaluate(fixture);await page.evaluate(()=>{state.draft._x=sessionExtras(state.draft,dSlots());gStart('warm');render();});await page.evaluate(()=>document.fonts.ready);
}
const step=(page,i,s=0)=>page.locator(`[data-action="gstep"][data-i="${i}"][data-s="${s}"]`);
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=process.argv[2]||`http://127.0.0.1:${server.address().port}/`,origin=new URL(url).origin;
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),errors=[],results=[];
 const out=path.join(root,'test-results/warmup-timeline');fs.mkdirSync(out,{recursive:true});
 try{
 for(const width of [1280,390,320])for(const theme of ['light','dark']){
  const page=await browser.newPage({viewport:{width,height:844},reducedMotion:'reduce',serviceWorkers:'block'});
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.route('**/*',r=>{const u=new URL(r.request().url());return u.origin===origin||['fonts.googleapis.com','fonts.gstatic.com'].includes(u.hostname)?r.continue():r.fulfill({status:200,body:''});});
  const response=await page.goto(url);assert.equal((await response.text()).replace(/\r\n/g,'\n'),expected.replace(/\r\n/g,'\n'),'exact tested app');assert.equal(await page.evaluate(()=>APP_ENV),'development');
  await seed(page,theme);assert.equal(await page.evaluate(()=>state.draft.guide.mode),'ready');assert.equal(await page.evaluate(()=>state.draft.guide.end),null);
  assert.deepEqual(await page.locator('.guide-group-label').allTextContents(),['Cardio','Warm-up moves']);assert.equal(await page.locator('[data-action="gstep"]').count(),6);assert.equal(await page.locator('.fsegs i').count(),6);assert.equal(await page.locator('.guide-parts').count(),0);
  let working=await page.evaluate(()=>JSON.stringify(state.draft.sets));
  await page.locator('[data-action="gnow"]').click();assert.equal(await page.evaluate(()=>state.draft.guide.mode),'run');
  // Plus/minus adjust the countdown, including the beginning of the first part.
  const timerEnd=await page.evaluate(()=>state.draft.guide.end);
  await page.getByRole('button',{name:'15 seconds more',exact:true}).click();assert.equal(await page.evaluate(()=>state.draft.guide.end),timerEnd+15000);assert.equal(await page.evaluate(()=>state.draft.guide.s),0);
  await page.getByRole('button',{name:'15 seconds less',exact:true}).click();assert.equal(await page.evaluate(()=>state.draft.guide.end),timerEnd);assert.equal(await page.evaluate(()=>state.draft.guide.s),0);
  await page.evaluate(()=>{state.draft.guide.end=Date.now()-10000;gTick();});assert.equal(await page.evaluate(()=>state.draft.guide.s),1);assert.equal(await page.evaluate(()=>state.draft.guide.mode),'run');assert.match(await page.locator('.ahead h1').innerText(),/Brisk/);assert.match(await page.locator('.guide-next').innerText(),/Cool off/);
  await step(page,0,2).click();assert.equal(await page.evaluate(()=>state.draft.guide.mode),'run');
  await page.locator('[data-action="gpause"]').click();
  const pausedLeft=await page.evaluate(()=>state.draft.guide.left);
  await page.getByRole('button',{name:'15 seconds more',exact:true}).click();assert.equal(await page.evaluate(()=>state.draft.guide.left),pausedLeft+15000);assert.equal(await page.evaluate(()=>state.draft.guide.mode),'paused');
  await page.getByRole('button',{name:'15 seconds less',exact:true}).click();assert.equal(await page.evaluate(()=>state.draft.guide.left),pausedLeft);assert.equal(await page.evaluate(()=>state.draft.guide.mode),'paused');await step(page,0,1).click();assert.equal(await page.evaluate(()=>state.draft.guide.mode),'paused');await page.locator('.fbig[data-action="gresume"]').click();
  await page.locator('[data-action="ghowto"]').click();assert.equal(await page.evaluate(()=>state.draft.guide.mode),'paused');await page.keyboard.press('Escape');await page.locator('.fbig[data-action="gresume"]').click();
  await step(page,1).click();assert.equal(await page.evaluate(()=>state.draft.guide.mode),'ready');await step(page,0,1).click();assert.equal(await page.evaluate(()=>state.draft.guide.mode),'paused');
  const left=await page.evaluate(()=>state.draft.guide.left);await page.reload();await page.evaluate(fixture);await page.evaluate(()=>{sb=null;AUTH.ready=true;AUTH.user=null;ui.qsLater=true;ui.tab='workout';render();});assert.equal(await page.evaluate(()=>state.draft.guide.left),left);assert.equal(await page.evaluate(()=>state.draft.guide.mode),'paused');
  await page.evaluate(()=>{gAction('glist',{dataset:{}});});assert.equal(await page.evaluate(()=>state.draft.guide.mode),'paused');await page.evaluate(()=>{gAction('gguide',{dataset:{}});});assert.equal(await page.evaluate(()=>state.draft.guide.mode),'paused');
  for(const [name,i,s,modes] of [['cardio',0,1,['ready','run','paused']],['timed',1,0,['ready','run','paused']],['reps',2,0,['reps']]]){
   await step(page,i,s).click();
   for(const mode of modes){
    await page.evaluate(mode=>{const G=state.draft.guide,it=gItems('warm')[G.i],part=segsFor(it).segs?.[G.s];G.mode=mode;G.pmode='run';G.tot=part?.sec||0;G.left=(part?.sec||0)*1000;G.end=part?Date.now()+G.left:null;render();},mode);
    await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    const geometry=await page.evaluate(()=>{const clock=document.querySelector('.gclock'),rail=document.querySelector('.path-scroll'),active=rail.querySelector('[aria-current="step"]'),a=active.getBoundingClientRect(),r=rail.getBoundingClientRect();return {width:innerWidth,pageWidth:document.documentElement.scrollWidth,buttonBottom:document.querySelector('.fbig').getBoundingClientRect().bottom,clockFits:!clock||clock.scrollWidth<=clock.clientWidth+1,activeVisible:a.left>=r.left-1&&a.right<=r.right+1,realFont:document.fonts.check('600 20px "Playfair Display"')};});
    assert.equal(geometry.pageWidth,width);assert(geometry.buttonBottom<844);assert(geometry.clockFits);assert(geometry.activeVisible);assert(geometry.realFont);
    assert.equal(await page.locator('.ach>b').innerText(),mode==='ready'?'Ready':mode==='run'?'Time left':mode==='paused'?'Paused':'At your pace');
    if(mode==='reps'){assert.equal(await page.locator('.acard input').count(),0);assert.equal(await page.locator('.fbig').innerText(),'Done');}
    if(width!==1280)await page.screenshot({path:path.join(out,`${name}-${mode}-${theme}-${width}.png`),fullPage:true});results.push({name,mode,theme,...geometry});
   }
  }
  // One start finishes all expired cardio parts, then waits for a timed move.
  await seed(page,theme);working=await page.evaluate(()=>JSON.stringify(state.draft.sets));await page.locator('[data-action="gnow"]').click();await page.evaluate(()=>{state.draft.guide.end=Date.now()-190000;gTick();});
  assert.equal(await page.evaluate(()=>state.draft.guide.i),1);assert.equal(await page.evaluate(()=>state.draft.guide.mode),'ready');assert.equal(await page.evaluate(()=>state.draft.warm.c),true);assert.equal(await page.evaluate(()=>state.draft.cardioDone),undefined);
  await page.locator('[data-action="gnow"]').click();await page.locator('[data-action="gdone"]').click();assert.equal(await page.evaluate(()=>state.draft.guide.mode),'reps');await page.locator('[data-action="gdone"]').click();await page.locator('[data-action="gdone"]').click();assert.equal(await page.evaluate(()=>state.draft.step.ph),'ex');assert.equal(await page.evaluate(()=>state.draft.guide),null);assert.equal(await page.evaluate(()=>JSON.stringify(state.draft.sets)),working);
  await page.evaluate(()=>{const pk=sessionExtras(state.draft,dSlots()).rampPk;if(pk)state.draft.step={ph:'ex',pk};render();});assert.equal(await page.locator('[data-action="framp"]').count(),1,'lighter lifting preparation remains available');
  for(const style of ['jog','bike']){
   await seed(page,theme,style);await page.locator('[data-action="gnow"]').click();const count=await page.evaluate(()=>segsFor(gItems('warm')[0]).segs.length);assert.equal(await page.locator('.guide-group').first().locator('.path-set').count(),count);await step(page,0,count-1).click();assert.equal(await page.evaluate(()=>state.draft.guide.mode),'run');
   await page.evaluate(()=>{needCardioFeel=()=>true;});await page.locator('[data-action="gdone"]').click();assert.equal(await page.evaluate(()=>state.draft.guide.mode),'cfeel');await page.locator('[data-action="gcfeelpick"][data-v="good"]').click();await page.locator('[data-action="gcfeelconfirm"]').click();assert.equal(await page.evaluate(()=>state.draft.guide.mode),'ready');assert.equal(await page.evaluate(()=>state.draft.cardioDone),undefined);
  }
  await seed(page,theme);await page.evaluate(()=>{state.draft.wskip={warmc:true};gStart('warm');render();});assert.equal(await page.locator('.guide-group-label').filter({hasText:'Cardio'}).count(),0);assert.equal(await page.evaluate(()=>state.draft.guide.mode),'ready');
  const before=await page.evaluate(()=>JSON.stringify(state.draft));await page.evaluate(()=>{coachMode={uid:'synthetic-preview'};});await step(page,1).click();assert.equal(await page.evaluate(()=>JSON.stringify(state.draft)),before);await page.evaluate(()=>{coachMode=null;});await page.close();
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({url,layouts:results.length,results,errors},null,2));console.log(JSON.stringify({url,layouts:results.length,journeys:6,errors}));
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
