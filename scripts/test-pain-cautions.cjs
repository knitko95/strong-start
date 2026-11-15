// Synthetic browser regression: no accounts or external requests.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const target=process.argv[2];
 const html=target?await (await fetch(target)).text():fs.readFileSync(path.join(__dirname,'../dist/index.html'),'utf8');
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{for(const width of [390,1280]){
  const ctx=await browser.newContext({viewport:{width,height:844},serviceWorkers:'block'}),page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>r.fulfill({status:200,contentType:r.request().isNavigationRequest()?'text/html':'text/javascript',body:r.request().isNavigationRequest()?html:''}));
  await page.goto(target||'http://127.0.0.1:8731/');
  const result=await page.evaluate(()=>{
   sb=null;AUTH.ready=true;AUTH.user=null;ui.qsLater=true;state=defaults();logs=[];state.setup=null;state.onboarded=true;
   state.places=[{k:'test',n:'Synthetic gym',eq:[...new Set(LIB.flatMap(e=>e.eq))]}];state.curPlace='test';Object.assign(state.settings,{level:'start',comfort:'machines',pain:['back']});newBlock();
   const ids=['cable-pull-through','band-pull-through'];
   const checks=ids.map(id=>{
    const e=EX[id],eligible=allowed(e)&&candidates('hinge').some(x=>x.id===id);
    const pk='legsA.1';state.block.plan[pk]=id;ensurePlan();const retained=state.block.plan[pk]===id;
    const suggestions=swapGroups({cur:'dumbbell-romanian-deadlift'}).similar.some(x=>x.id===id);
    ui.tab='library';render();exInfo(id);const detail=document.querySelector('#modal').innerText;closeModal();
    ui.swap={pk,cur:'dumbbell-romanian-deadlift',inW:false,q:'',eq:'',body:'',browse:false,limit:12};swapExerciseDetail(id);const swap=document.querySelector('#modal').innerText;closeModal();
    return {id,eligible,retained,suggestions,badge:!!painWarningBubble(e),detail:/May aggravate your lower back/.test(detail),swap:/May aggravate your lower back/.test(swap)};
   });
   const control={excluded:!allowed(EX['dumbbell-romanian-deadlift']),warned:!!painWarningCard(EX['dumbbell-romanian-deadlift'])};
   state.settings.pain=['knees'];const noUnrelatedWarning=ids.every(id=>!painWarningCard(EX[id]));state.settings.pain=[];const noWarning=ids.every(id=>!painWarningCard(EX[id]));
   return {checks,control,noUnrelatedWarning,noWarning,environment:APP_ENV};
  });
  assert.equal(result.environment,'development');for(const c of result.checks)for(const [key,value] of Object.entries(c))if(key!=='id')assert.equal(value,true,c.id+': '+key);
  assert.deepEqual(result.control,{excluded:true,warned:true});assert.ok(result.noWarning&&result.noUnrelatedWarning);assert.deepEqual(errors,[]);console.log(JSON.stringify({width,...result}));await ctx.close();
 }}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
