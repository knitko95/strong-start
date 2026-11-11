import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync, writeFileSync, mkdirSync, cpSync } from 'node:fs';

// Exercise the real inline application against synthetic data and a controllable
// backend. No requests, accounts, credentials or real workouts are used.
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const source=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('function defaults()')).split('/* ---------------- Boot ---------------- */')[0];
function harness(){
  const storage=new Map(), elements=new Map(), timers=new Map(), handlers=new Map(); let nextTimer=0;
  const element=()=>({style:{},dataset:{},classList:{add(){},remove(){},toggle(){}},setAttribute(){},innerHTML:'',focus(){}});
  const context=vm.createContext({console,URL,URLSearchParams,Date,Math,Promise,Map,Set,JSON,
    location:new URL('http://localhost:8731/'),history:{replaceState(){}},
    navigator:{onLine:true,userAgent:'Test'},matchMedia:()=>({matches:false,addEventListener(){}}),
    document:{body:{...element(),insertBefore(){}},documentElement:element(),visibilityState:'visible',addEventListener(type,fn){ if(!handlers.has(type)) handlers.set(type,[]); handlers.get(type).push(fn); },createElement:element,
      querySelector(k){if(!elements.has(k))elements.set(k,element());return elements.get(k);},getElementById(k){return this.querySelector('#'+k);}},
    localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},
    window:{addEventListener(){},scrollTo(){},scrollBy(){}},
    setTimeout(fn){const id=++nextTimer;timers.set(id,fn);return id;},clearTimeout:id=>timers.delete(id),
    setInterval:()=>++nextTimer,clearInterval(){},fetch(){throw Error('Unexpected network');}
  });
  const run=s=>vm.runInContext(s,context);
  run(source);
  run(`render=()=>{}; modal=html=>{globalThis.lastModal=html;}; toast=text=>{globalThis.lastToast=text;};
    function seed(){state=defaults(); state.setup=null; state.onboarded=true; state.settings.goals=['muscle']; state.settings.days=[1,4]; state.settings.split='ul2'; state.settings.comfort='machines'; state.settings.tstyle='machines'; state.settings.cardio={style:'walk',jog:'none',after:0}; state.places=[{k:'gym',n:'Gym',eq:PLACE_TYPES.gym.eq.split(' ')}]; state.curPlace='gym'; logs=[];newBlock();}
    seed();`);
  const dispatch=(type,target)=>{ for(const fn of handlers.get(type)||[]) fn({target}); };
  const click=(action,data={})=>{ const b={dataset:{action,...data}}; b.closest=()=>b; dispatch('click',b); };
  return {run,context,storage,elements,timers,click,dispatch};
}
let passed=0;
async function test(name,fn){await fn();passed++;console.log('PASS '+name);}
const near=(a,b,tol=0.000001)=>assert.ok(Math.abs(a-b)<tol,`${a} != ${b}`);

await test('unit conversion preserves physical weights across all persisted fields',()=>{
  const {run}=harness();
  run(`state.settings.bw=180;state.ex.test={w:100,last:[{w:95,r:8},{w:null,r:10}]};state.weigh.list=[{d:'2026-11-01',w:180}];
    state.draft={sets:{a:[{w:'100',r:'8',done:true},{w:'',r:'',done:false}]},planned:{a:100},progressBefore:{test:{w:95,last:[{w:90,r:8}]}}};
    state.prevBlock={draft:JSON.parse(JSON.stringify(state.draft))};
    logs=[{id:'test',entries:[{planned:100,sets:[{w:100,r:8},{w:0,r:10},{w:null,r:20}]}]}];changeUnits('kg');`);
  near(run('state.settings.bw'),81.6466266);near(run('state.ex.test.w'),45.359237);
  near(run('state.ex.test.last[0].w'),43.09127515);near(run('state.weigh.list[0].w'),81.6466266);
  near(+run('state.draft.sets.a[0].w'),45.359237);near(run('state.draft.planned.a'),45.359237);
  near(run('state.prevBlock.draft.progressBefore.test.w'),43.09127515);
  assert.equal(run('state.draft.sets.a[1].w'),'');assert.equal(run('state.ex.test.last[1].w'),null);
  assert.equal(run('logs[0].entries[0].sets[1].w'),0);assert.equal(run('logs[0].entries[0].sets[2].w'),null);
  assert.equal(run('logs[0].units'),'kg');near(run('logs[0].entries[0].planned'),45.359237);
  run(`for(let i=0;i<100;i++){changeUnits('lb');changeUnits('kg');}changeUnits('lb');`);
  near(run('state.ex.test.w'),100);near(run('state.settings.bw'),180);
});
await test('mixed-unit cloud logs normalize once and retain legacy completion',()=>{
  const {run}=harness();
  run(`logs=normalizeLogs([{id:'a',units:'kg',entries:[{sets:[{w:45.359237,r:6}]}]},{id:'b',entries:[{sets:[{w:100,r:6}]}]}],'lb');normalizeLogs(logs,'lb');`);
  near(run('logs[0].entries[0].sets[0].w'),100);assert.equal(run('logs[1].status'),'complete');
});
await test('v5 upgrade preserves draft, history assumptions and program',()=>{
  const {run}=harness();run(`state.v=5;delete state.weightUnits;startWorkout(weekKeys()[0]);const key=state.draft.key;state=migrate(JSON.parse(JSON.stringify(state)));`);
  assert.equal(run('state.v'),6);assert.equal(run('state.weightUnits'),'lb');assert.equal(run('state.draft.key'),run('key'));
  assert.ok(run('Object.keys(state.draft.planCounts).length')>0);
});
await test('setup edits convert old progression while retaining entered body weight',()=>{
  const {run}=harness();run(`state.ex.test={w:100};state.settings.bw=180;const a=prefillSetup();a.units='kg';a.bw='82';applySetup(a);`);
  near(run('state.ex.test.w'),45.359237);assert.equal(run('state.settings.bw'),82);assert.equal(run('state.weightUnits'),'kg');
});
await test('partial session saves effort without completing the weekly workout',()=>{
  const {run}=harness();
  run(`startWorkout(weekKeys()[0]);const first=dSlots()[0];state.draft.sets[first.pk][0]={w:'20',r:'8',done:true};finishWorkout();`);
  assert.equal(run('logs.length'),1);assert.equal(run('logs[0].status'),'partial');assert.equal(run('logs[0].completed'),1);
  assert.ok(run('logs[0].planned')>1);assert.equal(run('weekLogs(weekNum()).length'),0);assert.equal(run('state.draft.partialSaved'),true);
  assert.match(run('renderToday()'),/Resume remaining sets/);assert.match(run('renderHistory()'),/Partial/);
  assert.match(run('lastModal'),/does not count as a completed workout/);
  const easy=run('state.ex[first.id].easy||0');run('finishWorkout()');assert.equal(run('logs.length'),1);assert.equal(run('state.ex[first.id].easy||0'),easy);
});
await test('resume survives reload, restores skipped sets and finishes the same log once',()=>{
  const {run}=harness();
  run(`startWorkout(weekKeys()[0]);const ss=dSlots();const pk=ss[0].pk;
    state.draft.sets[pk][0]={w:'20',r:'8',done:true};state.draft.sets[ss[1].pk]=[];state.draft.skipped={[ss[1].pk]:true};finishWorkout();
    const logId=logs[0].id;const snapshot=JSON.parse(localStorage.getItem(LS));state=migrate(snapshot.state);logs=normalizeLogs(snapshot.logs,state.settings.units);resumePartial();`);
  assert.ok(run('state.draft.sets[ss[1].pk].length')>0);assert.equal(run('state.draft.sets[pk][0].done'),true);
  run(`for(const rows of Object.values(state.draft.sets))for(const r of rows){r.w='20';r.r='8';r.done=true;}finishWorkout();`);
  assert.equal(run('logs.length'),1);assert.equal(run('logs[0].id'),run('logId'));assert.equal(run('logs[0].status'),'complete');assert.equal(run('state.draft'),null);
  assert.equal(run('weekLogs(weekNum()).length'),1);
});
await test('repeated complete sessions do not inflate weekly completion',()=>{
  const {run}=harness();run(`logs=[{key:weekKeys()[0],block:state.block.n,week:weekNum()},{key:weekKeys()[0],block:state.block.n,week:weekNum()}];`);
  assert.equal(run('weekLogs(weekNum()).length'),1);
});
await test('empty session is not logged',()=>{
  const {run}=harness();run('startWorkout(weekKeys()[0]);finishWorkout();');assert.equal(run('logs.length'),0);assert.ok(run('state.draft'));assert.match(run('lastToast'),/at least one set/);
});

function backend(h){
  const writes=[], holds=[];let fail=false, hold=false, signedOut=false;
  h.context.fakeBackend={from(table){return {
    upsert(row){writes.push({table,row:structuredClone(row)});return hold?new Promise(resolve=>holds.push(resolve)):Promise.resolve({error:fail?Error('Simulated upload failure'):null});},
    update(){return {eq:async()=>({error:fail?Error('Simulated profile failure'):null})};},
    delete(){return {eq(){return {in:async()=>({error:fail?Error('Simulated delete failure'):null})};}};}
  };},auth:{async signOut(){signedOut=true;return {error:null};}}};
  h.run(`sb=fakeBackend;AUTH.user={id:'synthetic'};CLOUD.ok=true;CLOUD.stateJson=null;CLOUD.written={};`);
  return {writes,holds,set fail(v){fail=v;},set hold(v){hold=v;},get signedOut(){return signedOut;}};
}
await test('queued changes immediately show pending and flush on sign-out',async()=>{
  const h=harness(),b=backend(h);h.run(`state.settings.name='Synthetic';save();`);
  assert.equal(h.run('saveStatus()[1]'),'Sync pending');assert.equal(b.writes.length,0);
  await h.run('signOut()');assert.equal(b.signedOut,true);assert.equal(b.writes[0].row.state.settings.name,'Synthetic');assert.equal(h.storage.has('dev_strongstart_state_v3'),false);
});
await test('edits during an upload are drained before synced or sign-out',async()=>{
  const h=harness(),b=backend(h);b.hold=true;
  h.run(`state.settings.name='First';save();`);const saving=h.run('pushCloud()');
  await new Promise(setImmediate);
  assert.equal(h.run('saveStatus()[1]'),'Syncing…');h.run(`state.settings.name='Second';save();`);
  const exiting=h.run('signOut()');assert.equal(b.signedOut,false);assert.equal(b.writes[0].row.state.settings.name,'First');
  b.hold=false;b.holds.shift()({error:null});await saving;await exiting;
  assert.equal(b.writes.at(-1).row.state.settings.name,'Second');assert.equal(b.signedOut,true);
});
await test('failed upload retains local data, blocks sign-out and retries',async()=>{
  const h=harness(),b=backend(h);b.fail=true;h.run('save()');await h.run('signOut()');
  assert.equal(b.signedOut,false);assert.equal(h.run('saveStatus()[1]'),'Sync failed');assert.ok(h.storage.has('dev_strongstart_state_v3'));
  b.fail=false;assert.equal(await h.run('flushCloud()'),true);assert.equal(h.run('saveStatus()[1]'),'Synced');
});
await test('device storage failure and offline state remain visible',()=>{
  const h=harness();assert.equal(h.run('saveStatus()[1]'),'Saved on device');
  h.run(`localStorage.setItem=()=>{throw Error('Quota');};save();`);assert.equal(h.run('saveStatus()[1]'),'Device save failed');
  h.run(`storageOk=true;AUTH.user={id:'synthetic'};navigator.onLine=false;sb={};`);assert.equal(h.run('saveStatus()[1]'),'Sync pending');
});
await test('coach preview cannot save or upload',async()=>{
  const h=harness(),b=backend(h);h.run(`coachMode={name:'Synthetic'};save();persistLocal();`);assert.equal(await h.run('pushCloud()'),false);assert.equal(b.writes.length,0);assert.equal(h.storage.size,0);assert.equal(h.run('saveStatus()[1]'),'Coach preview');
});
await test('no-op sync does not leave a stale in-flight promise',async()=>{
  const h=harness(),b=backend(h);await h.run('pushCloud()');await h.run('pushCloud()');
  assert.equal(h.run('CLOUD.flight'),null);
  h.run(`state.settings.name='After no-op';save();`);await h.run('flushCloud()');
  assert.equal(b.writes.at(-1).row.state.settings.name,'After no-op');
});
await test('converted workout and history render without exposing long decimals',()=>{
  const h=harness();h.run(`const ex=sessionSlots(weekKeys()[0])[0].id;state.ex[ex]={w:100,last:[{w:100,r:6}]};changeUnits('kg');startWorkout(weekKeys()[0]);state.draft.rampDone=99;state.draft.step={ph:'ex',pk:dSlots()[0].pk};`);
  assert.match(h.run('renderFocus()'),/45.36/);assert.doesNotMatch(h.run('renderFocus()'),/45.359237/);
});
await test('reducing sets with Adjust completes the visible workout after reload',()=>{
  const h=harness();h.run(`startWorkout(weekKeys()[0]);const pk=dSlots()[0].pk;const id=dSlots()[0].id;`);
  h.run(`document.getElementById('adj-sets').value='1';`);h.click('adjsave',{pk:h.run('pk'),id:h.run('id')});
  assert.equal(h.run('state.draft.planCounts[pk]'),1);
  h.run(`const cached=JSON.parse(localStorage.getItem(LS));state=migrate(cached.state);
    for(const rows of Object.values(state.draft.sets))for(const r of rows){r.w='20';r.r='8';r.done=true;}finishWorkout();`);
  assert.equal(h.run('logs[0].status'),'complete');assert.equal(h.run('state.draft'),null);assert.equal(h.run('weekLogs(weekNum()).length'),1);
});
await test('set removal, addition and reset keep completion requirements aligned',()=>{
  const h=harness();h.run(`startWorkout(weekKeys()[0]);const pk=dSlots()[0].pk;const id=dSlots()[0].id;const initial=state.draft.sets[pk].length;`);
  const data={pk:h.run('pk'),id:h.run('id')};h.click('rmset',data);
  assert.equal(h.run('state.draft.planCounts[pk]'),h.run('initial-1'));
  h.click('addset',data);assert.equal(h.run('state.draft.planCounts[pk]'),h.run('initial'));
  h.run(`document.getElementById('adj-sets').value='1';`);h.click('adjsave',data);h.click('adjreset',data);
  assert.equal(h.run('state.draft.planCounts[pk]'),h.run('initial'));
  assert.equal(h.run('state.draft.sets[pk].length'),h.run('initial'));
});
await test('reducing sets preserves completed rows and skipping still leaves partial work',()=>{
  const h=harness();h.run(`startWorkout(weekKeys()[0]);const pk=dSlots()[0].pk;const id=dSlots()[0].id;const initial=state.draft.sets[pk].length;
    state.draft.sets[pk].forEach(r=>Object.assign(r,{w:'20',r:'8',done:true}));document.getElementById('adj-sets').value='1';`);
  const data={pk:h.run('pk'),id:h.run('id')};h.click('adjsave',data);h.click('rmset',data);
  assert.equal(h.run('state.draft.sets[pk].length'),h.run('initial'));
  assert.equal(h.run('state.draft.planCounts[pk]'),h.run('initial'));
  h.run(`const skip=dSlots()[1].pk;`);h.click('fskipyes',{pk:h.run('skip')});
  assert.ok(h.run('state.draft.planCounts[skip]')>0);h.run('finishWorkout()');assert.equal(h.run('logs[0].status'),'partial');
  h.run('resumePartial()');assert.equal(h.run('state.draft.sets[skip].length'),h.run('state.draft.planCounts[skip]'));
});
await test('week order and exercise order resets are independent',()=>{
  const h=harness();h.run(`const original=weekKeys().join();const key=weekKeys()[0];const originalExercises=sessionSlots(key).map(s=>s.pk).join();`);
  h.click('ordmove',{i:'0',d:'1'});const changed=h.run('weekKeys().join()');assert.notEqual(changed,h.run('original'));
  h.click('ordmv',{key:h.run('key'),pk:h.run('sessionSlots(key)[0].pk'),dir:'1'});
  assert.notEqual(h.run('sessionSlots(key).map(s=>s.pk).join()'),h.run('originalExercises'));
  h.click('weekordreset');assert.equal(h.run('weekKeys().join()'),h.run('original'));assert.ok(h.run('state.order[key]'));
  h.click('ordreset',{key:h.run('key')});assert.equal(h.run('sessionSlots(key).map(s=>s.pk).join()'),h.run('originalExercises'));
});
await test('body weight has the same unit-aware limits and optional blank behavior',()=>{
  const h=harness();
  for(const unit of ['lb','kg'])for(const pounds of [40,99,180,900]){
    const value=h.run(`weightNumber(convertWeight(${pounds},'lb','${unit}'))`);
    assert.equal(h.run(`readBodyWeight('${value}','${unit}').ok`),true);
  }
  for(const value of ['', 'no', '-45', '45kg', '0', '9999', 'NaN'])assert.equal(h.run(`readBodyWeight(${JSON.stringify(value)},'kg').ok`),false);
  assert.equal(h.run("readBodyWeight('','kg',true).value"),null);
  h.run(`changeUnits('kg');state.settings.bw=60;document.getElementById('set-bw').value='45';`);
  h.dispatch('change',{id:'set-bw',value:'45',dataset:{}});assert.equal(h.run('state.settings.bw'),45);
  h.dispatch('change',{id:'set-bw',value:'900',dataset:{}});assert.equal(h.run('state.settings.bw'),45);assert.match(h.run('lastToast'),/Enter a body weight/);
  h.run(`document.getElementById('wi-w').value='45';`);h.click('weighsave');assert.equal(h.run('state.weigh.list[0].w'),45);
  h.run(`document.getElementById('wi-w').value='900';`);h.click('weighsave');assert.equal(h.run('state.weigh.list.length'),1);
});
await test('setup rejects invalid body weight without losing the existing profile',()=>{
  const h=harness();h.run(`state.settings.bw=180;startSetup(true);state.setup.a.units='kg';state.setup.a.bw='900';`);
  h.click('sunext');assert.equal(h.run('state.setup.step'),'about');assert.equal(h.run('state.settings.bw'),180);
  h.click('sulater');assert.notEqual(h.run('state.setup.paused'),true);
  h.run(`state.setup.a.bw='45';`);h.click('sunext');assert.notEqual(h.run('state.setup.step'),'about');
  h.run(`applySetup(state.setup.a);`);assert.equal(h.run('state.settings.bw'),45);
});
console.log(`\n${passed} persistence/workout regression scenarios passed.`);
if(process.argv.includes('--fixture')){
  const h=harness();
  h.run(`state.settings.name='UX test';state.settings.bw=180;state.ex[sessionSlots(weekKeys()[0])[0].id]={w:100,last:[{w:100,r:6}]};
    logs=[{id:'synthetic-history',date:new Date(Date.now()-7*864e5).toISOString(),block:0,week:1,key:weekKeys()[0],name:'Synthetic previous session',units:'lb',status:'complete',dur:20,entries:[{ex:sessionSlots(weekKeys()[0])[0].id,name:EX[sessionSlots(weekKeys()[0])[0].id].n,sets:[{w:100,r:6}]}]}];`);
  const fixture=h.run('JSON.stringify({state,logs})');
  const dir=new URL('../test-results/fixture/',import.meta.url);mkdirSync(dir,{recursive:true});
  cpSync(new URL('../dist/',import.meta.url),dir,{recursive:true});
  const seed=`<script>if(!localStorage.getItem('synthetic_fixture_seed')){localStorage.setItem('dev_strongstart_state_v3',${JSON.stringify(fixture)});localStorage.setItem('synthetic_fixture_seed','1');}</script>`;
  const page=readFileSync(new URL('../dist/index.html',import.meta.url),'utf8').replace(/<script src="https:\/\/cdn.jsdelivr.net\/npm\/@supabase[^>]*><\/script>/,'<!-- SDK disabled only in the isolated synthetic fixture. -->').replace(/<script>\r?\n\/\* Environment:/,seed+'<script>\n/* Environment:');
  writeFileSync(new URL('index.html',dir),page);
  console.log('Synthetic local-only browser fixture written to test-results/fixture.');
}
