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
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
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
   function expire(name){notes.length=0;for(const left of [4,3,2,1,0]){audioCtx.currentTime=14-left;ui.timer.end=Date.now()+left*1000;tick();tick();}cases.push({name,notes:notes.map(n=>({...n})),cleared:ui.timer===null});}
   fRest(60,{label:'Rest'});expire('working-set rest');
   state.draft.step={ph:'exdone',pk};fRest(60,{label:'Recover',next:'Next exercise'});expire('between-exercise recovery');
   state.draft.step={ph:'rest',pk,restPreview:true,restSec:60};fAction('freststart',{dataset:{}});expire('manual rest');
   state.draft.step={ph:'rest',pk};fRest(60,{label:'Rest'});ui.timer=null;clearInterval(timerInt);fRestoreTimer();expire('rest restored from draft');
   state.settings.sound=false;startRest(60);expire('muted rest');state.settings.sound=true;
   notes.length=0;audioCtx.state='suspended';beepShort();await Promise.resolve();beep();cases.push({name:'resumed audio',notes:notes.map(n=>({...n}))});
   notes.length=0;beep();cases.push({name:'guided cue',notes:notes.map(n=>({...n}))});
   notes.length=0;state.draft.step={ph:'rest',pk};fRest(60,{label:'Rest'});render();document.querySelector('[data-action="fready"]').click();tick();cases.push({name:'skipped rest',notes:notes.map(n=>({...n}))});
   notes.length=0;startRest(60);ui.timer.end=Date.now()-10000;tick();cases.push({name:'expired while away',notes:notes.map(n=>({...n}))});
   const originalExtras=sessionExtras,fixtures={finisher:null};sessionExtras=(...args)=>({...originalExtras(...args),...fixtures});
   for(const ph of ['warm','cool']){
    fixtures[ph]=[{k:'m0',t:'Standing calf stretch',d:'20 s per side'}];
    const d=state.draft;d._x=sessionExtras(d,dSlots());d.step={ph};gStart(ph);render();gAdvance();render();
    for(const mode of ['first side','switch sides','second side']){
     notes.length=0;
     for(const left of [4,3,2,1,0]){audioCtx.currentTime=14-left;d.guide.end=Date.now()+left*1000;gTick();gTick();}
     cases.push({name:ph+' '+mode,notes:notes.map(n=>({...n}))});
    }
   }
   const d=state.draft;fixtures.warm=[{k:'c',t:'Cardio',d:'40 s',phases:[{sec:20,label:'Easy'},{sec:20,label:'Brisk'}]}];d._x=sessionExtras(d,dSlots());d.step={ph:'warm'};gStart('warm');render();gAdvance();render();
   notes.length=0;gPauseMove();gTick();cases.push({name:'paused guide',notes:notes.map(n=>({...n}))});
   d.guide.mode='run';d.guide.end=Date.now()+20000;
   for(const part of [0,1]){notes.length=0;for(const left of [4,3,2,1,0]){audioCtx.currentTime=14-left;d.guide.end=Date.now()+left*1000;gTick();gTick();}cases.push({name:'cardio part '+part,notes:notes.map(n=>({...n}))});}
   clearInterval(timerInt);clearInterval(gInt);
   return {env:APP_ENV,cases};
  });
  assert.equal(result.env,'development');
  for(const c of result.cases){const count=['muted rest','skipped rest','paused guide'].includes(c.name)?0:['guided cue','expired while away'].includes(c.name)?1:c.name==='resumed audio'?2:4;assert.equal(c.notes.length,count,c.name);if(count===4){assert.deepEqual(c.notes.map(n=>n.freq),[660,660,660,880],c.name);assert.deepEqual(c.notes.map(n=>n.start),[11,12,13,14],c.name);assert(c.notes[3].stop-c.notes[3].start>c.notes[0].stop-c.notes[0].start,'distinct longer completion');}if('cleared' in c)assert(c.cleared,c.name);}
  assert.deepEqual(errors,[]);console.log(`PASS ${width}px: countdown at 3/2/1 then completion; rest/recovery/manual/restored, both guided sides/gap, cardio parts, mute, audio resume, pause, skip, overdue; no page errors`);
  await page.close();
 }}finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
