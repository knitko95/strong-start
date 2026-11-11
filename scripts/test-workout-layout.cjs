// Real app rendering with synthetic workout state; no accounts or backend writes.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'dist/index.html'),'utf8');
const server=http.createServer((req,res)=>{
 const file=path.resolve(root,'dist','.'+(req.url==='/'?'/index.html':req.url.split('?')[0]));
 if(!file.startsWith(path.join(root,'dist')+path.sep)){res.writeHead(403);res.end();return;}
 try{res.setHeader('Content-Type',file.endsWith('.html')?'text/html':file.endsWith('.js')?'application/javascript':'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end();}
});
async function seed(page,screen,theme='light'){
 await page.evaluate(({screen,theme})=>{
  closeModal();sb=null;AUTH.ready=true;AUTH.user=null;ui.qsLater=true;ui.timer=null;clearInterval(timerInt);clearInterval(gInt);gInt=null;
  state=defaults();logs=[];state.setup=null;state.onboarded=true;
  state.settings.goals=['muscle'];state.settings.level='regular';state.settings.days=[1,3,5];state.settings.split='fb3';state.settings.mins=45;state.settings.theme=theme;state.settings.sound=false;
  state.places=[{k:'gym',n:'Gym',eq:PLACE_TYPES.gym.eq.split(' ')}];state.curPlace='gym';newBlock();
  let key=weekKeys()[0];
  if(screen.startsWith('pair-')){
   state.settings.mins=30;let found=false;
   for(let attempt=0;attempt<100&&!found;attempt++){newBlock();for(const k of weekKeys())if(fGroups(sessionSlots(k)).some(g=>g.length===2)){key=k;found=true;break;}}
   if(!found)throw Error('No paired synthetic workout found');
  }
  startWorkout(key);const d=state.draft,slots=dSlots(),s=slots.find(s=>usesLoad(EX[s.id]));
  d.rampDone=99;d.step={ph:'ex',pk:s.pk};ui.tab='workout';
  if(screen.startsWith('pair-')){
   const pair=fGroups(slots).find(g=>g.length===2).map(i=>slots[i]),[a,b]=pair;
   globalThis.layoutPair={a:a.pk,b:b.pk};d.step={ph:'ex',pk:a.pk};
   if(screen!=='pair-intro')d.pairSeen={[pair.map(x=>x.pk).join('|')]:true};
   if(screen==='pair-b'){d.sets[a.pk][0]={w:'20',r:'10',done:true};d.step.pk=b.pk;}
   if(screen==='pair-rest'){for(const move of pair)d.sets[move.pk][0]={w:'20',r:'10',done:true};d.step.ph='rest';ui.timer={end:Date.now()+75000,total:75,label:'Rest'};}
   if(screen==='pair-done'){for(const move of pair)d.sets[move.pk].forEach(x=>{x.w='20';x.r='10';x.done=true;});d.step={ph:'exdone',pk:b.pk};}
  }
  else if(screen==='preview'){ui.preview=key;ui.tab='preview';}
  else if(screen==='rest'){d.sets[s.pk][0]={w:'20',r:'10',done:true};d.step.ph='rest';ui.timer={end:Date.now()+75000,total:75,label:'Rest'};}
  else if(screen==='ramp'){d.rampDone=0;}
  else if(screen==='exdone'){d.sets[s.pk].forEach(x=>{x.w='20';x.r='10';x.done=true;});d.step.ph='exdone';}
  else if(['ready','warm','reps','cool','end','finq','cfeel','warm-list','cool-list'].includes(screen)){
   const cool=['cool','end','finq','cool-list'].includes(screen);d.step={ph:cool?'cool':'warm'};d._x=sessionExtras(d,slots);gStart(d.step.ph);
   if(screen.endsWith('-list'))d.listView=true;
   else{const G=d.guide;G.fin='no';
    if(screen==='end')G.mode='end';
    else if(screen==='cfeel')G.mode='cfeel';
    else if(screen==='finq'){
     // Exercise the existing optional cardio prompt using a synthetic finisher.
     const extras=sessionExtras;globalThis.restoreLayoutExtras=extras;
     sessionExtras=(draft,sl)=>({...extras(draft,sl),finisher:{t:'Easy bike',d:'10 min · steady',min:10,ctype:'steady',alts:[]}});G.mode='finq';
    }else if(screen==='reps'){G.i=gItems('warm').findIndex(it=>!segsFor(it).timer);if(G.i<0)G.i=1;G.mode='reps';}
    else if(screen!=='ready'){if(cool)G.i=gItems('cool').findIndex(it=>it.stretch);G.i=Math.max(0,G.i);const S=segsFor(gItems(G.ph)[G.i]);G.mode='run';G.s=0;G.tot=S.segs?.[0]?.sec||30;G.end=Date.now()+G.tot*1000;}
   }
  }
  render();clearInterval(gInt);gInt=null;clearInterval(timerInt);
  if(globalThis.restoreLayoutExtras){sessionExtras=globalThis.restoreLayoutExtras;delete globalThis.restoreLayoutExtras;}
  window.scrollTo(0,0);
 },{screen,theme});
}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const url=process.argv[2]||`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const results=[],errors=[];
 try{
  for(const [width,height] of [[390,844],[320,568],[844,390]]){
   const page=await browser.newPage({viewport:{width,height},serviceWorkers:'block',reducedMotion:'reduce'});
   page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
   await page.route('**/*',r=>new URL(r.request().url()).origin===new URL(url).origin?r.continue():r.fulfill({status:200,body:''}));
   const response=await page.goto(url);assert.equal((await response.text()).replace(/\r\n/g,'\n'),html.replace(/\r\n/g,'\n'),'exact development build');
   assert.equal(await page.evaluate(()=>SB_URL),'https://gvyfgqhgqnfmtoytqpeo.supabase.co');
   for(const theme of ['light','dark'])for(const safe of [0,34]){
    await page.evaluate(safe=>{document.documentElement.style.setProperty('--safe-bottom',safe+'px');document.body.style.paddingTop=safe?'47px':'0px';},safe);
    for(const screen of ['exercise','rest','ramp','ready','warm','reps','cool','end','exdone','finq','cfeel','warm-list','cool-list','preview','pair-intro','pair-a','pair-b','pair-rest','pair-done']){
     await seed(page,screen,theme);
     assert.equal(await page.locator('#app>.focus>section.card.acard').count(),1,'one main card on '+screen);
     const measure=await page.evaluate(()=>{
      const focus=document.querySelector('.focus'),footer=focus.querySelector('.ffoot'),main=document.getElementById('app'),wrap=main.parentElement;
      const r=focus.getBoundingClientRect(),foot=footer?.getBoundingClientRect();
      const content=[...focus.children].filter(el=>el!==footer).map(el=>el.getBoundingClientRect().height).reduce((a,b)=>a+b,0);
      const needed=content+(footer?.offsetHeight||0)+parseFloat(getComputedStyle(focus).rowGap)*(focus.children.length-1);
      const available=innerHeight-r.top-parseFloat(getComputedStyle(wrap).paddingBottom);
      return {width:innerWidth,height:innerHeight,bottom:r.bottom,footerBottom:foot?.bottom,footerTop:foot?.top,needed,available,pageWidth:document.documentElement.scrollWidth,scroll:document.documentElement.scrollHeight};
     });
     results.push({screen,safe,theme,...measure});
     assert(measure.pageWidth<=width,`horizontal fit: ${screen}/${width}/${safe}`);
     if(!process.env.WORKOUT_LAYOUT_AUDIT&&measure.needed<=measure.available+1&&measure.footerBottom){
      assert(measure.footerBottom<=height-safe-24+1,`footer within safe viewport: ${screen}/${width}/${safe}: ${JSON.stringify(measure)}`);
      assert(measure.scroll<=height+1,`fitting screen must not need scrolling: ${screen}/${width}/${safe}`);
     }
     if(measure.needed>measure.available){
      await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
      if(!process.env.WORKOUT_LAYOUT_AUDIT&&measure.footerBottom){const b=await page.locator('.ffoot').evaluate(el=>el.getBoundingClientRect().bottom);assert(b<=height-safe-24+1,'long-screen footer stays reachable above bottom inset');}
     }
     if(process.env.WORKOUT_LAYOUT_SCREENSHOTS&&width===390&&safe===34&&theme==='light'){fs.mkdirSync(process.env.WORKOUT_LAYOUT_SCREENSHOTS,{recursive:true});await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:path.join(process.env.WORKOUT_LAYOUT_SCREENSHOTS,screen+'.png'),fullPage:true});}
    }
   }
   // Banner can wrap, resize or disappear; the layout must use its real height.
   await seed(page,'rest');
   for(const banner of ['TESTING · Separate accounts and data · This banner wraps on a small phone','']){
    await page.evaluate(text=>{const b=document.getElementById('environment-banner');b.textContent=text;b.hidden=!text;},banner);
    if(!process.env.WORKOUT_LAYOUT_AUDIT){
     const geometry=await page.evaluate(()=>{
      const f=document.querySelector('.focus'),footer=f.querySelector('.ffoot'),gap=parseFloat(getComputedStyle(f).rowGap);
      const needed=[...f.children].reduce((n,el)=>n+el.offsetHeight,0)+gap*(f.children.length-1);
      const padding=parseFloat(getComputedStyle(document.getElementById('app').parentElement).paddingBottom);
      return {needed,available:innerHeight-f.getBoundingClientRect().top-padding,scroll:document.documentElement.scrollHeight};
     });
     if(geometry.needed<=geometry.available+1)assert(geometry.scroll<=height+1,'banner height accounted for: '+JSON.stringify(geometry));
     await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
     assert(await page.locator('.ffoot').evaluate(el=>el.getBoundingClientRect().bottom)<=height-58+1,'wrapped banner footer remains reachable');
     await page.evaluate(()=>window.scrollTo(0,0));
    }
   }
   // The layout must also work with the signed-in header's Feedback control,
   // and a More dialog must not strand the user or leave focus mode behind.
   await seed(page,'exercise');
   await page.evaluate(()=>{AUTH.user={id:'synthetic-layout-member',email:'layout@example.invalid'};AUTH.access='ok';render();});
   assert.equal(await page.locator('.ftop [data-action="msgopen"]').count(),1);
   await page.locator('.amore').click();assert.equal(await page.getByRole('dialog',{name:'More'}).count(),1);
   await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog').count(),0);
   // Follow real buttons through the new pair introduction and A -> B -> rest.
   await seed(page,'pair-intro');
   const beforeSets=await page.evaluate(()=>JSON.stringify(Object.values(state.draft.sets).flat().map(row=>row.done)));
   assert.equal(await page.locator('[data-action="fpairbegin"]').count(),1);
   await page.locator('[data-action="fpairbegin"]').click();
   assert.equal(await page.evaluate(()=>JSON.stringify(Object.values(state.draft.sets).flat().map(row=>row.done))),beforeSets,'introduction does not log a set');
   await page.reload();
   assert.equal(await page.locator('[data-action="fpairbegin"]').count(),0,'reload keeps introduction acknowledged');
   const pair=await page.evaluate(()=>{const p=fPair(state.draft,dSlots(),state.draft.step.pk);return {a:p.moves[0].pk,b:p.moves[1].pk};});
   await page.locator('[data-action="fdone"]').click();assert.equal(await page.evaluate(()=>state.draft.step.pk),pair.b);assert.equal(await page.evaluate(()=>state.draft.step.ph),'ex');
   await page.locator('[data-action="fdone"]').click();assert.equal(await page.evaluate(()=>state.draft.step.ph),'rest');
   assert.equal(await page.locator('.apair [aria-current="step"] .pair-label').innerText(),'A · NEXT');
   await page.locator('[data-action="fready"]').click();assert.equal(await page.evaluate(()=>state.draft.step.pk),pair.a);
   assert.match(await page.locator('.acard .ach>b').innerText(),/Round 2/);
   // Unequal targets after Adjust still retain both moves and logged sets.
   await page.locator('.amore').click();await page.locator('[data-action="fmoredo"][data-do="adjust"]').click();
   await page.locator('#adj-sets').fill('4');await page.locator('[data-action="adjsave"]').click();
   assert(await page.evaluate(({a,b})=>dSlots().some(s=>s.pk===a)&&dSlots().some(s=>s.pk===b)&&state.draft.sets[a][0].done&&state.draft.sets[b][0].done,pair));
   // Existing list navigation keeps the workout draft and returns to its screen.
   await page.locator('[data-action="flist"]').click();assert.equal(await page.locator('.workout-sheet .acard').count(),1);
   await page.locator('[data-action="fjump"][data-to="'+pair.b+'"]').click();assert.equal(await page.evaluate(()=>state.draft.step.pk),pair.b);
   // Check-in choices apply once, after the explicit bottom Continue action.
   await seed(page,'cfeel');const cardioBefore=await page.evaluate(()=>JSON.stringify(state.settings.cardio));
   assert(await page.locator('[data-action="gcfeelconfirm"]').isDisabled());
   await page.locator('[data-action="gcfeelpick"][data-v="good"]').click();
   assert.equal(await page.evaluate(()=>JSON.stringify(state.settings.cardio)),cardioBefore);
   await page.locator('[data-action="gcfeelconfirm"]').click();assert.equal(await page.evaluate(()=>state.settings.cardio.checks),1);
   // A checklist can still switch back to guided timers via More.
   await seed(page,'warm-list');await page.locator('.amore').click();await page.locator('[data-action="fmoredo"][data-do="gguide"]').click();assert.equal(await page.evaluate(()=>!!state.draft.listView),false);
   // Both saved summaries retain the underlying completion/resume behavior.
   for(const partial of [true,false]){
    await seed(page,'exercise');
    await page.evaluate(partial=>{const slots=dSlots();if(partial)state.draft.sets[slots[0].pk][0]={w:'20',r:'10',done:true};else for(const rows of Object.values(state.draft.sets))for(const row of rows){row.w='20';row.r='10';row.done=true;}finishWorkout();},partial);
    assert.equal(await page.locator('.workout-sheet .acard').count(),1);
    assert.equal(await page.evaluate(()=>logs[0].status),partial?'partial':'complete');
    assert.equal(await page.evaluate(()=>!!state.draft),partial);
    const modalBox=await page.locator('.workout-sheet').boundingBox();assert(modalBox.x>=0&&modalBox.x+modalBox.width<=width+1&&modalBox.y>=0,'summary fits viewport');
    await page.locator('.workout-sheet').evaluate(el=>el.scrollTop=el.scrollHeight);
    assert((await page.locator('.workout-sheet [data-action="closemodal"]').last().boundingBox()).y<height,'summary bottom action remains reachable');
    if(process.env.WORKOUT_LAYOUT_SCREENSHOTS&&width===390)await page.screenshot({path:path.join(process.env.WORKOUT_LAYOUT_SCREENSHOTS,partial?'summary-partial.png':'summary-complete.png')});
    await page.locator('.workout-sheet [data-action="closemodal"]').last().click();
    if(partial)assert.equal(await page.locator('[data-action="resume"]').count(),1);
   }
   await page.evaluate(()=>{AUTH.user=null;ui.tab='today';render();});
   assert.equal(await page.evaluate(()=>document.body.classList.contains('in-focus')),false);
   assert.equal(await page.locator('nav.tabs').evaluate(el=>getComputedStyle(el).display==='none'),false);
   await page.close();
  }
  assert.deepEqual(errors,[],'no unexpected browser errors');
  console.log(JSON.stringify({layouts:results.length,overflowingFittingScreens:results.filter(x=>x.needed<=x.available+1&&x.scroll>x.height+1),errors},null,2));
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
