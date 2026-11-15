// Synthetic timer completion and Web Audio scheduling; no account or backend writes.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const dist=path.resolve(__dirname,'../dist');
const server=http.createServer((req,res)=>{try{const file=path.join(dist,req.url.split('?')[0]==='/'?'index.html':req.url.split('?')[0]);res.setHeader('Content-Type',file.endsWith('.html')?'text/html':'application/javascript');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end();}});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const url=process.argv[2]||`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{for(const width of [1280,390,320]){
  const page=await browser.newPage({viewport:{width,height:844}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>new URL(r.request().url()).origin===new URL(url).origin?r.continue():r.fulfill({status:200,body:''}));
  const response=await page.goto(url);
  assert.equal((await response.text()).replace(/\r\n/g,'\n'),fs.readFileSync(path.join(dist,'index.html'),'utf8').replace(/\r\n/g,'\n'),'exact tested candidate');
  assert.match(await page.locator('#environment-banner').innerText(),/TESTING/);
  const result=await page.evaluate(async()=>{
   sb=null;AUTH.ready=true;AUTH.user=null;ui.qsLater=true;state=defaults();logs=[];state.setup=null;state.onboarded=true;
   Object.assign(state.settings,{goals:['muscle'],days:[1,3,5],split:'fb3',sound:true});
   state.places=[{k:'gym',n:'Gym',eq:EQ_ALL}];state.curPlace='gym';newBlock();startWorkout(weekKeys()[0]);
   const pk=dSlots()[0].pk;state.draft.rampDone=99;state.draft.step={ph:'rest',pk};ui.tab='workout';render();
   const notes=[];
   audioCtx={state:'running',currentTime:10,destination:{},resume(){this.state='running';return Promise.resolve();},createOscillator(){const note={};notes.push(note);return {frequency:{set value(v){note.freq=v;}},connect(){},start(t){note.start=t;},stop(t){note.stop=t;}};},createGain(){return {connect(){},gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}}};}};
   const cases=[];
   function expire(name){notes.length=0;ui.timer.end=Date.now()-1;tick();tick();cases.push({name,notes:notes.map(n=>({...n})),cleared:ui.timer===null});}
   fRest(60,{label:'Rest'});expire('working-set rest');
   state.draft.step={ph:'exdone',pk};fRest(60,{label:'Recover',next:'Next exercise'});expire('between-exercise recovery');
   state.draft.step={ph:'rest',pk,restPreview:true,restSec:60};fAction('freststart',{dataset:{}});expire('manual rest');
   state.draft.step={ph:'rest',pk};fRest(60,{label:'Rest'});ui.timer=null;clearInterval(timerInt);fRestoreTimer();expire('rest restored from draft');
   state.settings.sound=false;startRest(60);expire('muted rest');state.settings.sound=true;
   notes.length=0;audioCtx.state='suspended';restChimes();await Promise.resolve();cases.push({name:'resumed audio',notes:notes.map(n=>({...n}))});
   notes.length=0;beep();cases.push({name:'guided cue',notes:notes.map(n=>({...n}))});
   notes.length=0;state.draft.step={ph:'rest',pk};fRest(60,{label:'Rest'});render();document.querySelector('[data-action="fready"]').click();tick();cases.push({name:'skipped rest',notes:notes.map(n=>({...n}))});
   clearInterval(timerInt);clearInterval(gInt);
   return {env:APP_ENV,cases};
  });
  assert.equal(result.env,'development');
  for(const c of result.cases){const count=['muted rest','skipped rest'].includes(c.name)?0:c.name==='guided cue'?1:3;assert.equal(c.notes.length,count,c.name);if(count===3){assert.deepEqual(c.notes.map(n=>n.freq),[880,880,880]);assert.deepEqual(c.notes.map(n=>n.start),[10,10.75,11.5]);}if('cleared' in c)assert(c.cleared,c.name);}
  assert.deepEqual(errors,[]);console.log(`PASS ${width}px: rest/recovery/manual/restored, mute, audio resume, guided cue, skip; no page errors`);
  await page.close();
 }}finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
