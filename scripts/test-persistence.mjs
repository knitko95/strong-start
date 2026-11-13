import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync, writeFileSync, mkdirSync, cpSync } from 'node:fs';

// Exercise the real inline application against synthetic data and a controllable
// backend. No requests, accounts, credentials or real workouts are used.
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const source=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('function defaults()')).split('/* ---------------- Boot ---------------- */')[0];
function harness(){
  const storage=new Map(), elements=new Map(), timers=new Map(), handlers=new Map(); let nextTimer=0;
  const element=()=>({style:{},dataset:{},classList:{add(){},remove(){},toggle(){}},setAttribute(){},innerHTML:'',querySelector(){return null;},focus(){}});
  const context=vm.createContext({console,URL,URLSearchParams,Date,Math,Promise,Map,Set,JSON,crypto,AbortSignal,
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

await test('feedback captures the running version without a database inbox',async()=>{
  const h=harness();
  h.run(`AUTH.user={id:'synthetic-owner'};AUTH.access='ok';AUTH.coach=false;FB.owner=true;refreshUnread=()=>{};closeModal=()=>{};
    var sentFeedback=null;
    sb={auth:{getSession:async()=>({data:{session:{access_token:'synthetic-session'}}})},from:()=>{throw Error('App feedback must not access the database');}};
    fetch=async(url,options)=>{sentFeedback=JSON.parse(options.body);return {ok:true,json:async()=>({id:sentFeedback.id,status:'delivered'})};};
    FBS={side:'app',tag:'bug',text:'Synthetic bug',screen:'Settings',device:'Synthetic phone'};`);
  h.elements.set('#fbtext',{value:'Synthetic bug'});
  assert.equal(h.run('appVersionLabel()'),'v'+h.run('APP_VERSION')+'-dev');
  assert.equal(h.run('appVersionLabel(APP_VERSION,"main")'),'v'+h.run('APP_VERSION'));
  assert.equal(h.run('appVersionLabel(APP_VERSION,"dev-noir")'),'v'+h.run('APP_VERSION')+'-dev-noir');
  h.run('fbRender()');assert(h.run('lastModal').includes('v'+h.run('APP_VERSION')+'-dev'));
  assert.doesNotMatch(h.run('lastModal'),/Sent with:|Settings|Synthetic phone|source ·/);
  const settings=h.run('renderSettings()');assert.doesNotMatch(settings,/<b>App version<\/b>/);
  assert.match(settings,/<button class="app-version" data-action="releasenotes"[^>]*>v[0-9.]+-dev<\/button>\s*$/);


  await h.run('fbSend()');
  assert.equal(h.run('sentFeedback.version'),h.run('APP_VERSION'));
  assert.equal(h.run('sentFeedback.build'),h.run('APP_BUILD.id'));
  assert.equal(h.run('sentFeedback.app_environment'),undefined,'Origin must be determined by the server');
  assert.equal(h.run('sentFeedback.workout'),undefined,'No workout payload is sent to GitHub');
  assert.equal(h.run('inboxCards()'),'');
  await h.run('refreshUnread()');
  h.run('releaseNotes("9.9.9")');assert.match(h.run('lastModal'),/Release notes are unavailable/);
  h.click('releasenotes');assert.match(h.run('lastModal'),/<details class="card" open>/);

});

await test('failed feedback keeps its ID and original context across reopening and retry',async()=>{
  const h=harness();h.elements.set('#fbtext',{value:'Synthetic retry'});
  h.run(`AUTH.user={id:'synthetic-member'};AUTH.access='ok';closeModal=()=>{};
    FBS={owner:AUTH.user.id,side:'app',tag:'bug',text:'Synthetic retry',screen:'Original screen',device:'Original device'};
    sb={auth:{getSession:async()=>({data:{session:{access_token:'synthetic-session'}}})}};
    var sent=[],failFeedback=true;fetch=async(u,o)=>{const p=JSON.parse(o.body);sent.push(p);return {ok:!failFeedback,json:async()=>failFeedback?{error:'temporarily-unavailable'}:{id:p.id,status:'queued'}};};
    fbDevice=()=> 'New device';fbScreen=()=> 'New screen';`);
  await h.run('fbSend()');assert.equal(h.run('FBS.text'),'Synthetic retry');
  h.run('fbOpen("app");failFeedback=false;');await h.run('fbSend()');
  assert.equal(h.run('JSON.stringify(sent[0])'),h.run('JSON.stringify(sent[1])'));
  assert.equal(h.run('sent[1].screen'),'Original screen');assert.equal(h.run('FBS.text'),'');
  assert.match(h.run('lastToast'),/saved for delivery/);
});
await test('late feedback responses cannot clear another account or newly edited text',async()=>{
  for(const accountSwitch of [false,true]){
    const h=harness();h.elements.set('#fbtext',{value:'Original synthetic report'});
    h.run(`AUTH.user={id:'synthetic-member'};AUTH.access='ok';closeModal=()=>{};
      FBS={owner:AUTH.user.id,side:'app',tag:'bug',text:'Original synthetic report',screen:'Settings',device:'Synthetic'};
      sb={auth:{getSession:async()=>({data:{session:{access_token:'synthetic-session'}}})}};
      var completeFeedback;fetch=async(u,o)=>{const p=JSON.parse(o.body);return new Promise(done=>{completeFeedback=()=>done({ok:true,json:async()=>({id:p.id,status:'delivered'})});});};`);
    const pending=h.run('fbSend()');await Promise.resolve();await Promise.resolve();
    if(accountSwitch)h.run(`AUTH.user={id:'other-member'};FBS={owner:AUTH.user.id,side:'app',tag:'',text:'Other account draft'};`);
    else h.run(`FBS.text='Newly edited draft';`);
    h.run('completeFeedback()');await pending;
    assert.equal(h.run('FBS.text'),accountSwitch?'Other account draft':'Newly edited draft');
    assert.equal(h.run('FBS.busy')||false,false);
  }
});

await test('demo-first exercise view keeps the live path and moves secondary actions to settings',()=>{
  const h=harness();h.run(`startWorkout(weekKeys()[0]);var demoPk=dSlots()[0].pk;state.draft.rampDone=99;state.draft.step={ph:'ex',pk:demoPk};`);
  const out=h.run('renderFocus()');assert.match(out,/focus demo-first/);assert(out.indexOf('workout-demo')<out.indexOf('class="asteps"'));
  assert.match(out,/aria-label="Workout menu"/);assert.doesNotMatch(out,/data-action="flist"/);assert.match(out,/How to/);assert.match(out,/Log set/);assert.doesNotMatch(out,/Suggested start\. Change it if it feels off\./);assert.doesNotMatch(out,/<p class="atip"><b>Tip:/);
  h.run('fMoreSheet(demoPk)');for(const action of ['swap','adjust','fskipex','fpause','fexit','flist','gmute'])assert(h.run('lastModal').includes(`data-do="${action}"`));
  h.run('var savedTarget=target;target=s=>({...savedTarget(s),w:null,sug:null,last:null});');assert.match(h.run('renderFocus()'),/First time: start light\./);
});
await test('compact progress counts exercise groups and regular Up next appears only on the last set',()=>{
  const h=harness();h.run(`startWorkout(weekKeys()[0]);state.draft.rampDone=99;var single=dSlots().find(s=>!fPair(state.draft,dSlots(),s.pk)&&nextGroupStart(state.draft,dSlots(),dSlots().indexOf(s))>=0);if(!single)throw Error('No ordinary exercise');state.draft.sets[single.pk]=Array.from({length:3},()=>({w:'25',r:'10',done:false}));state.draft.step={ph:'ex',pk:single.pk,i:0};`);
  for(const i of [0,1,2]){h.run(`state.draft.step.i=${i}`);const out=h.run('renderFocus()');assert.equal(out.includes('Up next:'),i===2);assert.doesNotMatch(out,/workout-brand|Strong Start/);assert.match(out,/Exercise \d+ of \d+/);}
  const header=h.run('fTop(state.draft,dSlots())'),segments=header.match(/class="fsegs"[^>]*>(.*?)<\/div>/)[1];assert.equal((segments.match(/<i /g)||[]).length,h.run('fGroups(dSlots()).length'));
  h.run(`state.draft.sets[single.pk]=[{w:'25',r:'10',done:false}];state.draft.step.i=0;`);assert.match(h.run('renderFocus()'),/Up next:/);
  h.run(`state.draft.step={ph:'rest',pk:single.pk,restPreview:true,restSec:60};`);assert.doesNotMatch(h.run('renderFocus()'),/Up next:|View \/ edit sets|data-action="fviewsets"|<span class="goal">of /);
});
await test('paired sets use Log set and Save changes without repeated next-move text',()=>{
  const h=pairedWorkout();h.run(`startWorkout(K);state.draft.rampDone=99;state.draft.pairSeen={[fPair(state.draft,dSlots(),A).key]:true};for(const pk of [A,B])state.draft.sets[pk]=Array.from({length:3},()=>({w:'20',r:'10',done:false}));`);
  for(const round of [0,1,2])for(const move of ['A','B']){
    h.run(`for(const pk of [A,B])state.draft.sets[pk].forEach((x,i)=>x.done=i<${round}||(pk===A&&${move}===B&&i===${round}));state.draft.step={ph:'ex',pk:${move},i:${round}};`);
    const out=h.run('renderFocus()');assert.match(out,/>Log set<\/button>/);assert.doesNotMatch(out,/<div class="anext">/);assert.match(out,/Exercise \d+ of \d+/);
  }
  h.run(`state.draft.step={ph:'ex',pk:A,i:0};`);assert.match(h.run('renderFocus()'),/>Save changes<\/button>/);
  h.run(`state.draft.step={ph:'rest',pk:B,afterRound:0,restPreview:true,restSec:60};`);const rest=h.run('renderFocus()');assert.doesNotMatch(rest,/<div class="anext">/);assert.doesNotMatch(rest,/Paired exercises|pair-link|apair-pattern|View \/ edit sets|data-action="fviewsets"|<span class="goal">of |>Superset /);
});
function guidedWorkout(ph='warm'){
  const h=harness();h.run(`startWorkout(weekKeys()[0]);state.draft.step={ph:'${ph}'};state.draft._x=sessionExtras(state.draft,dSlots());state.settings.sound=false;
    var guideMoves=[{g:'${ph}',k:'nav1',t:'Arm circles',d:'30 s'},{g:'${ph}',k:'nav2',t:'Cat-cow',d:'8 reps'},{g:'${ph}',k:'nav3',t:'Standing quad stretch',d:'20 s each'}];gItems=()=>guideMoves;gStart('${ph}');ui.tab='workout';`);return h;
}
await test('timed guide moves wait for Ready while rep moves enter directly at their target',()=>{
  const h=guidedWorkout();assert.equal(h.run('state.draft.guide.end'),null);h.run('gTick()');assert.equal(h.run('state.draft.guide.mode'),'ready');assert.match(h.run('renderFocus()'),/>Ready<\/button>/);
  h.click('gnow');const deadline=h.run('state.draft.guide.end');h.click('gnow');assert.equal(h.run('state.draft.guide.end'),deadline);h.run('state.draft.guide.end=Date.now()-1;gTick()');assert.equal(h.run('state.draft.guide.i'),1);assert.equal(h.run('state.draft.guide.mode'),'reps');assert.equal(h.run('state.draft.guide.end'),null);assert.equal(h.run('state.draft.warm.nav1'),true);
  h.run('gTick()');assert.equal(h.run('state.draft.guide.mode'),'reps');assert.match(h.run('renderFocus()'),/>Done<\/button>/);h.click('gdone');assert.equal(h.run('state.draft.guide.i'),2);assert.equal(h.run('state.draft.guide.mode'),'ready');h.click('gdone');assert.equal(h.run('state.draft.guide.i'),2);
});
await test('guided timeline pauses a move and restores its timer through navigation, list and reload',()=>{
  const h=guidedWorkout();h.click('gnow');h.run('state.draft.guide.end=Date.now()+17000;');h.click('gmove',{i:'1'});assert.equal(h.run('state.draft.guide.mode'),'reps');assert.equal(h.run('state.draft.warm.nav1'),undefined);
  h.click('gmove',{i:'0'});assert.equal(h.run('state.draft.guide.mode'),'paused');const left=h.run('state.draft.guide.left');assert(left>16000&&left<=17000);
  h.click('gresume');assert.equal(h.run('state.draft.guide.mode'),'run');h.click('glist');assert.equal(h.run('state.draft.guide.mode'),'paused');h.click('gguide');assert.equal(h.run('state.draft.guide.mode'),'paused');
  h.run('state=migrate(JSON.parse(localStorage.getItem(LS)).state);');assert.equal(h.run('state.draft.guide.mode'),'paused');assert.equal(h.run('state.draft.guide.positions["warm:nav1:Arm circles"].mode'),'paused');
  const before=h.run('JSON.stringify(state.draft)');h.click('gmove',{i:'-1'});h.click('gmove',{i:'99'});assert.equal(h.run('JSON.stringify(state.draft)'),before);
});
await test('cool-down side timers keep their durations and gap, then wait before the next move',()=>{
  const h=guidedWorkout('cool');h.click('gmove',{i:'2'});h.click('gnow');assert.equal(h.run('state.draft.guide.tot'),20);h.run('gAdvance()');assert.equal(h.run('state.draft.guide.mode'),'gap');assert.equal(h.run('state.draft.guide.tot'),5);h.run('gAdvance()');assert.equal(h.run('state.draft.guide.mode'),'run');assert.equal(h.run('state.draft.guide.s'),1);h.run('gAdvance()');assert.equal(h.run('state.draft.guide.mode'),'end');assert.equal(h.run('state.draft.cool.nav3'),true);
});
await test('Done finishes the current side or cardio part before completing the move',()=>{
  const h=guidedWorkout('cool');h.click('gmove',{i:'2'});h.click('gnow');h.click('gdone');assert.equal(h.run('state.draft.guide.mode'),'gap');assert.equal(h.run('state.draft.cool.nav3'),undefined);h.click('gnow');h.click('gdone');assert.equal(h.run('state.draft.cool.nav3'),true);
  const c=guidedWorkout();c.run("guideMoves[0]={g:'warm',k:'nav1',t:'Brisk walk',d:'3 min',phases:[{sec:60,label:'Easy walk'},{sec:120,label:'Brisk walk'}]};");c.click('gnow');c.click('gdone');assert.equal(c.run('state.draft.guide.mode'),'run');assert.equal(c.run('state.draft.guide.s'),1);assert.equal(c.run('state.draft.warm.nav1'),undefined);c.click('gdone');assert.equal(c.run('state.draft.guide.mode'),'reps');assert.equal(c.run('state.draft.guide.i'),1);
});
await test('guided navigation keeps How to and completed step selection explicit',()=>{
  const h=guidedWorkout();h.click('ghowto');assert.equal(h.run('state.draft.guide.mode'),'ready');h.click('gresume');assert.equal(h.run('state.draft.guide.mode'),'ready');
  h.click('gnow');h.click('ghowto');assert.equal(h.run('state.draft.guide.mode'),'paused');h.click('gresume');assert.equal(h.run('state.draft.guide.mode'),'run');h.click('gdone');h.click('gmove',{i:'0'});assert.equal(h.run('state.draft.guide.mode'),'ready');assert.equal(h.run('state.draft.warm.nav1'),true);assert.match(h.run('renderFocus()'),/guide-path/);
});
await test('legacy guide preparation upgrades without resetting active or paused work',()=>{
  const h=guidedWorkout();h.run("state.draft.guide={ph:'warm',i:1,s:0,mode:'ready',end:Date.now()+1000,fin:'no'};state=migrate(state);");assert.equal(h.run('state.draft.guide.end'),null);assert.equal(h.run('state.draft.guide.i'),1);
  h.run("state.draft.guide={ph:'warm',i:0,s:0,mode:'run',end:123456,tot:30,fin:'no'};state=migrate(state);");assert.equal(h.run('state.draft.guide.end'),123456);
  h.run("state.draft.guide={ph:'warm',i:0,s:0,mode:'paused',pmode:'run',left:17000,tot:30,fin:'no'};state=migrate(state);");assert.equal(h.run('state.draft.guide.left'),17000);assert.equal(h.run('state.draft.guide.mode'),'paused');
  h.run("state.draft.guide={ph:'warm',i:0,s:0,mode:'paused',pmode:'ready',left:5000,fin:'no'};state=migrate(state);");assert.equal(h.run('state.draft.guide.mode'),'ready');assert.equal(h.run('state.draft.guide.end'),null);
});
await test('unstarted cardio part selection waits for Ready and paused time adjustment stays paused',()=>{
  const h=guidedWorkout();h.run("guideMoves[0]={g:'warm',k:'nav1',t:'Brisk walk',d:'3 min',phases:[{sec:60,label:'Easy walk'},{sec:120,label:'Brisk walk'}]};");h.click('gseg',{n:'1'});assert.equal(h.run('state.draft.guide.mode'),'ready');h.click('gnow');assert.equal(h.run('state.draft.guide.s'),1);assert.equal(h.run('state.draft.guide.tot'),120);
  h.click('gpause');const left=h.run('state.draft.guide.left');h.click('gprev');assert.equal(h.run('state.draft.guide.mode'),'paused');assert.equal(h.run('state.draft.guide.s'),1);assert.equal(h.run('state.draft.guide.left'),left-15000);h.click('gskip');assert.equal(h.run('state.draft.guide.mode'),'paused');assert.equal(h.run('state.draft.guide.s'),1);assert.equal(h.run('state.draft.guide.left'),left);
});
await test('cardio plus and minus change remaining time in the displayed direction in both phases',()=>{
  for(const ph of ['warm','cool']){
    const h=guidedWorkout(ph);h.run(`guideMoves[0]={g:'${ph}',k:'timer',t:'Cardio',d:'2 min',phases:[{sec:60,label:'Easy'},{sec:60,label:'Steady'}]};`);h.click('gnow');const end=h.run('state.draft.guide.end');
    h.click('gskip');assert.equal(h.run('state.draft.guide.end'),end+15000);assert.equal(h.run('state.draft.guide.s'),0);assert.equal(h.run('state.draft.guide.tot'),75);
    h.click('gprev');assert.equal(h.run('state.draft.guide.end'),end);assert.equal(h.run('state.draft.guide.s'),0);
    h.click('gstep',{i:'0',s:'1'});h.click('gpause');const left=h.run('state.draft.guide.left');h.click('gskip');assert.equal(h.run('state.draft.guide.left'),left+15000);assert.equal(h.run('state.draft.guide.s'),1);assert.equal(h.run('state.draft.guide.mode'),'paused');h.click('gprev');assert.equal(h.run('state.draft.guide.left'),left);
    h.run('state=migrate(JSON.parse(localStorage.getItem(LS)).state);');assert.equal(h.run('state.draft.guide.left'),left);assert.equal(h.run('state.draft.guide.mode'),'paused');
  }
});
await test('removing the last seconds advances one cardio part and preserves a paused timer',()=>{
  for(const ph of ['warm','cool']){
    const h=guidedWorkout(ph);h.run(`guideMoves[0]={g:'${ph}',k:'timer',t:'Cardio',d:'2 min',phases:[{sec:60,label:'Easy'},{sec:60,label:'Steady'}]};`);h.click('gnow');h.run('state.draft.guide.end=Date.now()+5000;');h.click('gprev');assert.equal(h.run('state.draft.guide.s'),1);assert.equal(h.run('state.draft.guide.mode'),'run');assert.equal(h.run('state.draft.guide.tot'),60);
    const p=guidedWorkout(ph);p.run(`guideMoves[0]={g:'${ph}',k:'timer',t:'Cardio',d:'2 min',phases:[{sec:60,label:'Easy'},{sec:60,label:'Steady'}]};`);p.click('gnow');p.click('gpause');p.run('state.draft.guide.left=5000;');p.click('gprev');assert.equal(p.run('state.draft.guide.s'),1);assert.equal(p.run('state.draft.guide.mode'),'paused');assert(p.run('state.draft.guide.left')>59000);
  }
});
await test('minus at the end of cardio retains effort feedback and the next move boundary',()=>{
  for(const ph of ['warm','cool']){
    const h=guidedWorkout(ph);h.run(`guideMoves[0]={g:'${ph}',k:'timer',t:'Cardio',d:'1 min',cardio:'${ph==='warm'?'warm':'after'}',ctype:'steady',min:1,phases:[{sec:60,label:'Easy'}]};needCardioFeel=()=>true;`);h.click('gnow');h.run('state.draft.guide.end=Date.now()+5000;');h.click('gprev');assert.equal(h.run('state.draft.guide.mode'),'cfeel');assert.equal(h.run(`state.draft.${ph}.timer`),true);
    h.click('gcfeelpick',{v:'good'});h.click('gcfeelconfirm');assert.equal(h.run('state.draft.guide.i'),1);assert.equal(h.run('state.draft.guide.mode'),'reps');
  }
});
await test('warm-up cardio shares the grouped path and keeps running between selected parts',()=>{
  const h=guidedWorkout();h.run("guideMoves[0]={g:'warm',k:'c',t:'Walk warm-up',d:'4 min',cardio:'warm',mode:'walk',phases:[{sec:60,label:'Easy walk'},{sec:120,label:'Brisk walk'},{sec:60,label:'Cool off: easy walk'}]};needCardioFeel=()=>false;");
  let out=h.run('renderFocus()');assert.match(out,/guide-group-label">Cardio/);assert.match(out,/guide-group-label">Warm-up moves/);assert.doesNotMatch(out,/guide-parts/);assert.match(out,/Warm-up · Part 1 of 3/);
  h.click('gnow');h.click('gstep',{i:'0',s:'1'});assert.equal(h.run('state.draft.guide.mode'),'run');assert.equal(h.run('state.draft.guide.s'),1);out=h.run('renderFocus()');assert.match(out,/<h1>Brisk walk<\/h1>/);assert.match(out,/>Time left<\/b>/);assert.match(out,/Next: <span>Cool off/);
  h.click('gpause');h.click('gstep',{i:'0',s:'0'});assert.equal(h.run('state.draft.guide.mode'),'paused');assert.equal(h.run('state.draft.guide.left'),60000);h.click('gresume');h.click('gstep',{i:'1',s:'0'});assert.equal(h.run('state.draft.guide.mode'),'reps');h.click('gstep',{i:'0',s:'0'});assert.equal(h.run('state.draft.guide.mode'),'paused');
  h.run('state=migrate(JSON.parse(localStorage.getItem(LS)).state);');assert.equal(h.run('state.draft.guide.mode'),'paused');
});
await test('one warm-up cardio start catches up across parts and waits before the next timed move',()=>{
  const h=guidedWorkout();h.run("guideMoves[0]={g:'warm',k:'c',t:'Walk warm-up',d:'3 min',cardio:'warm',phases:[{sec:60,label:'Easy walk'},{sec:60,label:'Brisk walk'},{sec:60,label:'Cool off'}]};guideMoves[1]={g:'warm',k:'m0',t:'Arm circles',d:'30 s'};needCardioFeel=()=>false;");
  h.click('gnow');h.run('state.draft.guide.end=Date.now()-10000;gTick()');assert.equal(h.run('state.draft.guide.s'),1);assert.equal(h.run('state.draft.guide.mode'),'run');assert(h.run('state.draft.guide.end-Date.now()')>49000);assert(h.run('state.draft.guide.end-Date.now()')<=50000);
  h.run('state.draft.guide.end=Date.now()-65000;gTick()');assert.equal(h.run('state.draft.guide.mode'),'ready');assert.equal(h.run('state.draft.guide.i'),1);assert.equal(h.run('state.draft.warm.c'),true);assert.equal(h.run('state.draft.cardioDone'),undefined);
});
await test('post-lift cardio starts once and runs continuously through its parts',()=>{
  const h=guidedWorkout('cool');h.run("guideMoves[0]={g:'cool',k:'f',t:'Steady walk',d:'10 min',fin:true,cardio:'after',ctype:'steady',min:10,mode:'walk',phases:[{sec:60,label:'Easy walk'},{sec:480,label:'Brisk walk'},{sec:60,label:'Cool off: easy walk'}]};state.draft.guide.mode='finq';needCardioFeel=()=>false;");
  h.click('gfin',{v:'yes'});assert.equal(h.run('state.draft.guide.mode'),'run');const end=h.run('state.draft.guide.end');h.click('gfin',{v:'yes'});assert.equal(h.run('state.draft.guide.end'),end);
  h.run('state.draft.guide.end=Date.now()-10000;gTick()');assert.equal(h.run('state.draft.guide.s'),1);assert.equal(h.run('state.draft.guide.mode'),'run');assert(h.run('state.draft.guide.end-Date.now()')<=470000);assert(h.run('state.draft.guide.end-Date.now()')>469000);
  h.click('gstep',{i:'0',s:'2'});assert.equal(h.run('state.draft.guide.mode'),'run');h.click('gdone');assert.equal(h.run('state.draft.cardioDone.min'),10);assert.equal(h.run('state.draft.cool.f'),true);assert.equal(h.run('state.draft.guide.i'),1);
});
await test('continuous cool-down path keeps cardio checkpoints while navigating across groups',()=>{
  const h=guidedWorkout('cool');h.run("guideMoves[0]={g:'cool',k:'f',t:'Steady walk',d:'3 min',phases:[{sec:60,label:'Easy walk'},{sec:120,label:'Brisk walk'}]};guideMoves[1]={g:'cool',k:'w',t:'Easy walk',d:'2 min'};guideMoves[2].stretch=true;");
  h.click('gnow');h.click('gstep',{i:'0',s:'1'});assert.equal(h.run('state.draft.guide.mode'),'run');assert.equal(h.run('state.draft.guide.s'),1);
  const before=h.run('JSON.stringify(state.draft)');h.click('gstep',{i:'0',s:'99'});assert.equal(h.run('JSON.stringify(state.draft)'),before);
  h.click('gpause');h.click('gstep',{i:'0',s:'0'});assert.equal(h.run('state.draft.guide.mode'),'paused');assert.equal(h.run('state.draft.guide.left'),60000);
  h.click('gresume');h.click('gstep',{i:'1',s:'0'});assert.equal(h.run('state.draft.guide.mode'),'ready');h.click('gstep',{i:'0',s:'0'});assert.equal(h.run('state.draft.guide.mode'),'paused');assert(h.run('state.draft.guide.left')>59000);
  h.run('state=migrate(JSON.parse(localStorage.getItem(LS)).state);');assert.equal(h.run('state.draft.guide.mode'),'paused');
  const out=h.run('renderFocus()');for(const group of ['Cardio','Walk','Stretches'])assert(out.includes('guide-group-label">'+group));assert.doesNotMatch(out,/guide-parts|Move 1/);assert.match(out,/data-action="gstep"/);
  h.run("coachMode={uid:'preview'}");const saved=h.run('JSON.stringify(state.draft)');h.click('gstep',{i:'2',s:'0'});assert.equal(h.run('JSON.stringify(state.draft)'),saved);
});
await test('cardio catches up through every expired part and still waits before the walk',()=>{
  const h=guidedWorkout('cool');h.run("guideMoves[0]={g:'cool',k:'f',t:'Steady walk',d:'3 min',cardio:'after',ctype:'steady',min:3,phases:[{sec:60,label:'Easy'},{sec:60,label:'Steady'},{sec:60,label:'Cool off'}]};guideMoves[1]={g:'cool',k:'w',t:'Easy walk',d:'2 min'};needCardioFeel=()=>false;");h.click('gnow');h.run('state.draft.guide.end=Date.now()-125000;gTick()');assert.equal(h.run('state.draft.guide.i'),1);assert.equal(h.run('state.draft.guide.mode'),'ready');assert.equal(h.run('state.draft.guide.end'),null);assert.equal(h.run('state.draft.cool.f'),true);
});
await test('Done preserves the cardio effort check-in before the next Ready screen',()=>{
  const h=guidedWorkout();h.run("guideMoves[0]={g:'warm',k:'nav1',t:'Brisk walk',d:'30 s',cardio:'after',ctype:'steady',min:10,mode:'walk'};needCardioFeel=()=>true;");h.click('gnow');h.click('gdone');assert.equal(h.run('state.draft.guide.mode'),'cfeel');assert.equal(h.run('state.draft.warm.nav1'),true);assert.equal(h.run('state.draft.cardioDone.min'),10);h.click('gmove',{i:'2'});assert.equal(h.run('state.draft.guide.mode'),'cfeel');
  h.click('gcfeelpick',{v:'good'});h.click('gcfeelconfirm');assert.equal(h.run('state.draft.guide.i'),1);assert.equal(h.run('state.draft.guide.mode'),'reps');
});
await test('workout pause and list navigation preserve the current guide timer',()=>{
  const h=guidedWorkout();h.click('gnow');h.run('state.draft.guide.end=Date.now()+17000;');h.click('fpause');assert.equal(h.run('ui.tab'),'today');assert.equal(h.run('state.draft.guide.mode'),'paused');const left=h.run('state.draft.guide.left');assert(left>16000&&left<=17000);
  h.run("ui.tab='workout'");h.click('gresume');h.click('fjump',{to:h.run('dSlots()[0].pk')});assert.equal(h.run('state.draft.guide.mode'),'paused');assert.equal(h.run('state.draft.step.ph'),'ex');h.click('fjump',{to:'warm'});assert.equal(h.run('state.draft.guide.mode'),'paused');
  h.click('glist');h.run('state.draft.warm.nav1=true;');h.click('gguide');assert.equal(h.run('state.draft.guide.i'),1);assert.equal(h.run('state.draft.guide.mode'),'reps');h.click('gmove',{i:'0'});assert.equal(h.run('state.draft.guide.mode'),'ready');
});
await test('returning from cool-down completion restores a skipped timer checkpoint',()=>{
  const h=guidedWorkout('cool');h.click('gmove',{i:'2'});h.click('gnow');h.run('state.draft.guide.end=Date.now()+12000;');h.click('gskipall');assert.equal(h.run('state.draft.guide.mode'),'end');h.click('gback');assert.equal(h.run('state.draft.guide.mode'),'paused');assert(h.run('state.draft.guide.left')>11000);assert.equal(h.run('state.draft.cool.nav3'),undefined);
});
await test('guided Next is always visible for preparation, timers, reps, pause and phase endings',()=>{
  const h=guidedWorkout();const next=()=>h.run('renderFocus()');assert.match(next(),/class="guide-next">Next: <span>Cat-cow/);h.click('gnow');assert.match(next(),/Next: <span>Cat-cow/);h.click('gpause');assert.match(next(),/Next: <span>Cat-cow/);h.click('gresume');h.click('gdone');assert.match(next(),/Next: <span>Standing quad stretch/);h.click('gnow');assert.equal(h.run('state.draft.guide.mode'),'reps');assert.match(next(),/Next: <span>Standing quad stretch/);h.click('gdone');
  const expected=h.run('esc(EX[dSlots()[nextGroupStart(state.draft,dSlots(),-1)].id].n)');assert(next().includes('Next: <span>'+expected));h.click('gnow');h.click('gdone');assert.equal(h.run('state.draft.guide.mode'),'gap');assert(next().includes('Next: <span>'+expected));
  const c=guidedWorkout('cool');c.click('gmove',{i:'2'});assert.match(c.run('renderFocus()'),/Next: <span>Finish workout/);
});
await test('rep targets stay read-only and skip Ready on first entry, timeline, old drafts and Back',()=>{
  for(const ph of ['warm','cool']){
    const h=guidedWorkout(ph);h.run(`guideMoves[0]={g:'${ph}',k:'nav1',t:'Cat-cow',d:'8 reps'};gStart('${ph}');`);assert.equal(h.run('state.draft.guide.mode'),'reps');let out=h.run('renderFocus()');assert.match(out,/>Done<\/button>/);assert.doesNotMatch(out,/>Ready<\/button>|<input|data-action="fbump"/);
    h.click('gmove',{i:'2'});assert.equal(h.run('state.draft.guide.mode'),'ready');h.click('gmove',{i:'0'});assert.equal(h.run('state.draft.guide.mode'),'reps');
    h.run(`state.draft.guide.mode='ready';state.draft.guide.end=Date.now()+1000;state=migrate(JSON.parse(JSON.stringify(state)));`);out=h.run('renderFocus()');assert.equal(h.run('state.draft.guide.mode'),'reps');assert.doesNotMatch(out,/>Ready<\/button>/);
    h.run(`guideMoves[2]={g:'${ph}',k:'nav3',t:'Shoulder rolls',d:'10 reps'};state.draft.guide.mode='end';state.draft.guide.i=3;`);h.click('gback');assert.equal(h.run('state.draft.guide.mode'),'reps');
  }
});
await test('guide completion reaches working sets and coach preview cannot mutate guide navigation',()=>{
  const h=guidedWorkout();h.click('gmove',{i:'2'});h.click('gnow');h.click('gdone');assert.equal(h.run('state.draft.guide.mode'),'gap');h.click('gnow');h.click('gdone');assert.equal(h.run('state.draft.guide'),null);assert.equal(h.run('state.draft.step.ph'),'ex');
  const c=guidedWorkout();const before=c.run('JSON.stringify(state.draft)');c.run("coachMode={uid:'preview'}");for(const action of ['gmove','gnow','gdone','glist'])c.click(action,{i:'1'});assert.equal(c.run('JSON.stringify(state.draft)'),before);
});
await test('swap recommendations fit equipment/preferences while search reaches the whole library',()=>{
  const h=harness();h.run(`var swapPk=weekKeys().flatMap(sessionSlots)[0].pk;swapSheet(swapPk);var G=swapGroups(ui.swap);`);
  assert(h.run('G.similar.every(e=>available(e)&&allowed(e))'));assert(h.run('G.same.every(e=>available(e)&&allowed(e))'));
  assert(h.run('G.same.every(e=>!G.similar.some(x=>x.id===e.id))'));
  assert.match(h.run('lastModal'),/Suggested swaps/);assert.match(h.run('lastModal'),/Same muscles/);assert.match(h.run('lastModal'),/Browse all exercises/);
  h.run(`state.places[0].eq=['bw'];Object.assign(ui.swap,{q:'',eq:'',body:''});`);assert.equal(h.run('swapLibraryResults(ui.swap).length'),h.run('LIB.length-1'));
  h.run(`ui.swap.q='dumbbell bench press';ui.swap.browse=true;renderSwapPicker();`);assert.match(h.run('lastModal'),/Dumbbell Bench Press/);assert.match(h.run('lastModal'),/Other equipment/);
  h.run(`ui.swap.eq='bw';renderSwapPicker();`);assert.match(h.run('lastModal'),/No exercises found/);
  h.run(`ui.swap.eq='';swapExerciseDetail('dumbbell-bench-press')`);assert.match(h.run('lastModal'),/Use this exercise/);assert.match(h.run('lastModal'),/Needs equipment/);
});
await test('mid-exercise swaps preserve completed sets with their original exercise through reload and finish',()=>{
  const h=harness();h.run(`startWorkout(weekKeys()[0]);ui.tab='workout';var swapPk=dSlots()[0].pk,oldId=dSlots()[0].id;state.draft.rampDone=99;
    state.draft.sets[swapPk]=[{w:'30',r:'10',done:true},{w:'30',r:'',done:false},{w:'30',r:'',done:false}];state.draft.planCounts[swapPk]=3;
    var beforeTotal=workoutCompletion(state.draft).planned;applyExerciseSwap(swapPk,'plank',false);var archivedPk=state.draft.completedSwaps[0].pk;`);
  assert.equal(h.run('dSlots().find(s=>s.pk===swapPk).id'),'plank');assert.equal(h.run('state.draft.sets[swapPk].length'),2);
  assert.equal(h.run('state.draft.completedSwaps[0].id'),h.run('oldId'));assert.equal(h.run('state.draft.sets[archivedPk][0].w'),'30');
  assert.equal(h.run('workoutCompletion(state.draft).planned'),h.run('beforeTotal'));assert.equal(h.run('workoutCompletion(state.draft).completed'),1);
  h.run(`state=migrate(JSON.parse(localStorage.getItem(LS)).state);convertDraft(state.draft,'lb','kg');`);near(+h.run('state.draft.sets[archivedPk][0].w'),30*.45359237);
  h.run(`state.draft.sets[swapPk][0]={w:'',r:'20',done:true};finishWorkout();`);
  assert(h.run('logs[0].entries.some(e=>e.ex===oldId&&e.pk===archivedPk)'));assert(h.run(`logs[0].entries.some(e=>e.ex==='plank')`));
  assert.equal(h.run('logs[0].completed'),2);
});
await test('persistent and repeated swaps retain frozen slot order and completed work',()=>{
  const h=harness();h.run(`startWorkout(weekKeys()[0]);ui.tab='workout';var swapPk=dSlots()[0].pk,originalPlan=planId(swapPk),slotOrder=JSON.stringify(dSlots().map(s=>s.pk));
    applyExerciseSwap(swapPk,'dumbbell-bench-press',true);`);
  assert.equal(h.run('planId(swapPk)'),'dumbbell-bench-press');assert.equal(h.run('dSlots().find(s=>s.pk===swapPk).id'),'dumbbell-bench-press');assert.equal(h.run('JSON.stringify(dSlots().map(s=>s.pk))'),h.run('slotOrder'));
  h.run(`state.draft.sets[swapPk][0]={w:'20',r:'10',done:true};applyExerciseSwap(swapPk,'hammer-curl',false);state.draft.sets[swapPk][0]={w:'15',r:'12',done:true};applyExerciseSwap(swapPk,'plank',false);`);
  assert.equal(h.run('state.draft.completedSwaps.length'),2);assert.equal(h.run('state.draft.completedSwaps[0].id'),'dumbbell-bench-press');assert.equal(h.run('state.draft.completedSwaps[1].id'),'hammer-curl');
  assert.equal(h.run('planId(swapPk)'),'dumbbell-bench-press');assert.equal(h.run('workoutCompletion(state.draft).completed'),2);
  assert.equal(h.run(`target(swapTargetSlot({id:'dumbbell-bench-press',cfg:{s:'carry',unit:'sec',lo:30,hi:45,sets:3,rest:60}})).unit`),'reps');
});
await test('inline demo is retained during rerenders and a different exercise attaches its own asset',()=>{
  const h=harness();h.run(`var replacedWith,attached,disposed;
    var keepDemo={dataset:{exerciseId:'goblet-squat'},querySelector(){return {}}};
    var nextDemo={dataset:{exerciseId:'goblet-squat'},parentElement:{classList:{add(){}}},replaceWith(x){replacedWith=x}};
    document.querySelector=()=>nextDemo;window.StrongStartExerciseGuides={attach(x){attached=x},dispose(s){disposed=s}};
    setupWorkoutDemo(keepDemo);`);
  assert.equal(h.run('replacedWith===keepDemo'),true);assert.equal(h.run('attached'),undefined);
  h.run(`nextDemo.dataset.exerciseId='hammer-curl';setupWorkoutDemo(keepDemo);`);assert.equal(h.run('attached.exerciseId'),'hammer-curl');assert.equal(h.run('attached.mode'),'workout');
  h.run(`document.querySelector=()=>null;setupWorkoutDemo();`);assert.equal(h.run('disposed'),'workout');
});

await test('six-set path alternates sets and rests, preserves current while browsing and returns on Save',()=>{
  const h=harness();h.run(`startWorkout(weekKeys()[0]);var pathPk=dSlots()[0].pk;state.draft.rampDone=99;
    state.draft.sets[pathPk]=Array.from({length:6},(_,i)=>({w:'40',r:'10',done:i<3}));state.draft.step={ph:'ex',pk:pathPk,i:3};`);
  const pk=h.run('pathPk'),out=h.run('renderFocus()');
  assert.equal((out.match(/class="path-set /g)||[]).length,6);assert.equal((out.match(/class="path-rest /g)||[]).length,5);
  assert.deepEqual([...out.matchAll(/data-path-id="([sr]\d+)"/g)].map(m=>m[1]),['s0','r0','s1','r1','s2','r2','s3','r3','s4','r4','s5']);
  assert.match(out,/Show earlier sets/);assert.match(out,/Show later sets/);assert.doesNotMatch(out,/arest-link|Back to current/);
  const path=h.run('workoutPath(state.draft,dSlots(),dSlots().find(s=>s.pk===pathPk))');assert.doesNotMatch(path,/<small|data-path-countdown|◷/);assert.equal((path.match(/class="path-clock"/g)||[]).length,5);assert.match(path,/, completed/);assert.match(path,/, current/);assert.match(path,/, remaining/);
  h.click('fset',{pk,i:'0'});assert.equal(h.run('state.draft.pathCurrent.i'),3);
  const edit=h.run('renderFocus()');assert.match(edit,/data-path-id="s3"[^>]*aria-current="step"/);assert.match(edit,/data-path-id="s0"[^>]*aria-pressed="true"/);
  h.click('fbump',{pk,i:'0',f:'r',dir:'1'});h.run(`state=JSON.parse(localStorage.getItem(LS)).state;`);h.click('fdone',{pk,i:'0'});
  assert.equal(h.run('state.draft.step.i'),3);assert.equal(h.run('state.draft.pathCurrent'),undefined);assert.equal(h.run('state.draft.sets[pathPk][0].r'),'11');
});
await test('path rest selection distinguishes a preview from another running rest',()=>{
  const h=harness();h.run(`startWorkout(weekKeys()[0]);var pathPk=dSlots()[0].pk;state.settings.sound=false;state.draft.rampDone=99;
    state.draft.sets[pathPk]=Array.from({length:6},(_,i)=>({w:'40',r:'10',done:i<3}));state.draft.step={ph:'rest',pk:pathPk,afterRound:2};fRest(90,{label:'Rest'});`);
  const pk=h.run('pathPk'),end=h.run('ui.timer.end');h.click('frest',{pk,round:'0',sec:'60'});
  assert.equal(h.run('state.draft.step.restPreview'),true);assert.match(h.run('renderFocus()'),/Start rest/);
  h.click('tadd',{sec:'15'});assert.equal(h.run('state.draft.step.restSec'),75);assert.equal(h.run('ui.timer.end'),end);
  h.click('frest',{pk,round:'2',sec:'90'});assert.equal(h.run('state.draft.step.restPreview'),undefined);assert.equal(h.run('ui.timer.end'),end);
  h.click('fset',{pk,i:'0'});h.click('fdone',{pk,i:'0'});assert.equal(h.run('state.draft.step.ph'),'rest');assert.equal(h.run('state.draft.step.afterRound'),2);
  h.click('fset',{pk,i:'0'});h.run(`ui.timer.end=Date.now()-1;state.draft.rest.end=ui.timer.end;tick();`);h.click('fdone',{pk,i:'0'});
  assert.equal(h.run('state.draft.step.ph'),'ex');assert.equal(h.run('fSetIndex(state.draft,state.draft.step)'),3);
});
await test('paired set paths retain every A/B stop and unequal set counts',()=>{
  const h=pairedWorkout();h.run(`startWorkout(K);state.draft.rampDone=99;state.draft.pairSeen={[fPair(state.draft,dSlots(),A).key]:true};
    state.draft.sets[A]=Array.from({length:4},(_,i)=>({w:'20',r:'10',done:i<2}));state.draft.sets[B]=Array.from({length:2},()=>({w:'20',r:'10',done:true}));state.draft.step={ph:'ex',pk:A,i:2};`);
  const out=h.run('renderFocus()');assert.equal((out.match(/class="path-set /g)||[]).length,6);assert.equal((out.match(/class="path-rest /g)||[]).length,3);
  const path=out.slice(out.indexOf('class="workout-path"'));assert.doesNotMatch(path,/✓/);assert.match(path,/Set 4A/);assert.doesNotMatch(path,/Set 3B|Set 4B|Round/);
  assert.match(out,/data-path-id="s2a"[^>]*aria-current="step"/);
  h.click('fset',{pk:h.run('B'),i:'0'});h.click('fdone',{pk:h.run('B'),i:'0'});
  assert.equal(h.run('state.draft.step.pk'),h.run('A'));assert.equal(h.run('state.draft.step.i'),2);
  assert.equal(h.run('doneN(state.draft,A)'),2);assert.equal(h.run('doneN(state.draft,B)'),2);
});
await test('paired A/B timeline tracks completion independently and preserves rest while editing either move',()=>{
  const h=pairedWorkout();h.run(`startWorkout(K);state.draft.rampDone=99;state.draft.pairSeen={[fPair(state.draft,dSlots(),A).key]:true};for(const pk of [A,B])state.draft.sets[pk]=Array.from({length:3},()=>({w:'20',r:'10',done:false}));state.draft.step={ph:'ex',pk:A,i:0};`);
  const out=h.run('renderFocus()');assert.deepEqual([...out.matchAll(/data-path-id="([sr]\d+[ab]?)"/g)].map(m=>m[1]),['s0a','s0b','r0','s1a','s1b','r1','s2a','s2b']);assert.match(out,/<b>Set 1A <span>of 3/);assert.doesNotMatch(out,/pair-link|Paired exercises|<span>Round/);
  h.click('fdone',{pk:h.run('A'),i:'0'});assert.equal(h.run('state.draft.step.pk'),h.run('B'));const b=h.run('renderFocus()');assert.match(b,/<b>Set 1B <span>of 3/);assert.match(b,/class="path-set done [^"]*"[^>]*data-path-id="s0a"/);assert.match(b,/data-path-id="s0b"[^>]*aria-current="step"/);assert.equal(h.run('state.draft.sets[B][0].done'),false);
  h.click('fdone',{pk:h.run('B'),i:'0'});assert.equal(h.run('state.draft.step.ph'),'rest');const end=h.run('ui.timer.end');
  for(const move of ['A','B']){h.click('fset',{pk:h.run(move),i:'0'});h.click('fbump',{pk:h.run(move),i:'0',f:'r',dir:'1'});h.click('fdone',{pk:h.run(move),i:'0'});assert.equal(h.run('state.draft.step.ph'),'rest');assert.equal(h.run('ui.timer.end'),end);}
  h.run(`state=JSON.parse(localStorage.getItem(LS)).state;ui.timer=null;fRestoreTimer();`);assert.equal(h.run('ui.timer.end'),end);assert.match(h.run('renderFocus()'),/data-path-id="r0"[^>]*aria-current="step"/);
  h.click('fset',{pk:h.run('B'),i:'0'});h.run(`ui.timer.end=Date.now()-1;state.draft.rest.end=ui.timer.end;tick();`);h.click('fdone',{pk:h.run('B'),i:'0'});const resumed=h.run('renderFocus()');assert.match(resumed,/data-path-id="s1a"[^>]*aria-current="step"/);assert.equal((resumed.match(/aria-current="step"/g)||[]).length,1);
});
await test('path scroll controls center selection and disable arrows at the boundaries',()=>{
  const h=harness();h.run(`var pathScrollHandler,scrollAmount=200;
    var pathArrows=[{disabled:false},{disabled:false}];
    var pathRail={scrollLeft:200,scrollWidth:800,clientWidth:250,addEventListener:(t,fn)=>{pathScrollHandler=fn;},getBoundingClientRect:()=>({left:0,width:250}),querySelector:()=>({getBoundingClientRect:()=>({left:90,width:70})})};
    var pathHost={querySelector:()=>pathRail,querySelectorAll:()=>pathArrows};
    document.querySelector=()=>pathHost;globalThis.requestAnimationFrame=fn=>fn();setupWorkoutPath();`);
  assert.equal(h.run('pathArrows[0].disabled'),false);assert.equal(h.run('pathArrows[1].disabled'),false);
  h.run('pathRail.scrollLeft=0;pathScrollHandler();');assert.equal(h.run('pathArrows[0].disabled'),true);
  h.run('pathRail.scrollLeft=550;pathScrollHandler();');assert.equal(h.run('pathArrows[1].disabled'),true);
});

await test('timeline arrival feedback follows actual movement and respects reduced motion',()=>{
  const h=harness();h.run(`var arrivalClasses=new Set(),arrivalButton={dataset:{pathId:'s0a'},classList:{add:c=>arrivalClasses.add(c),remove:c=>arrivalClasses.delete(c)},addEventListener(){}};var arrivalHost={dataset:{workout:'one',pks:'a|b'},querySelector:()=>arrivalButton};`);
  assert.equal(h.run('markWorkoutPathArrival(arrivalHost)'),false);assert.equal(h.run('markWorkoutPathArrival(arrivalHost)'),false);
  h.run("arrivalButton.dataset.pathId='s0b'");assert.equal(h.run('markWorkoutPathArrival(arrivalHost)'),true);assert.equal(h.run("arrivalClasses.has('path-arrive')"),true);
  h.run("matchMedia=()=>({matches:true});arrivalClasses.clear();arrivalButton.dataset.pathId='r0'");assert.equal(h.run('markWorkoutPathArrival(arrivalHost)'),false);assert.equal(h.run('arrivalClasses.size'),0);
  h.run("matchMedia=()=>({matches:false});arrivalHost.dataset.workout='another'");assert.equal(h.run('markWorkoutPathArrival(arrivalHost)'),false);
});
await test('set tiles navigate without reopening completed sets and preserve edits after reload',()=>{
  const h=harness();
  h.run(`startWorkout(weekKeys()[0]);var navPk=dSlots().find(s=>usesLoad(EX[s.id])).pk;
    state.draft.rampDone=99;state.draft.sets[navPk]=[{w:'20',r:'8',done:true},{w:'20',r:'',done:false},{w:'20',r:'',done:false}];state.draft.step={ph:'ex',pk:navPk};`);
  const pk=h.run('navPk');h.click('fset',{pk,i:'0'});
  assert.equal(h.run('state.draft.step.i'),0);assert.equal(h.run('doneN(state.draft,navPk)'),1);
  assert.match(h.run('renderFocus()'),/Save changes/);
  assert.equal((h.run('renderFocus()').match(/data-action="fset"/g)||[]).length,3);
  h.click('fbump',{pk,i:'0',f:'r',dir:'1'});h.click('fset',{pk,i:'1'});
  assert.match(h.run('renderFocus()'),/Log set/);
  assert.equal(h.run('state.draft.sets[navPk][0].r'),'9');assert.equal(h.run('doneN(state.draft,navPk)'),1);
  h.run(`state=JSON.parse(localStorage.getItem(LS)).state;`);
  assert.equal(h.run('state.draft.step.i'),1);assert.equal(h.run('state.draft.sets[navPk][0].r'),'9');
  h.click('fset',{pk,i:'2'});assert.match(h.run('renderFocus()'),/Log set/);
  h.click('fdone',{pk,i:'2'});assert.equal(h.run('state.draft.sets[navPk][1].done'),false);
  assert.equal(h.run('state.draft.sets[navPk][2].done'),true);
  h.click('fready');assert.match(h.run('renderFocus()'),/Log set/);
});
await test('saving an edited completed set returns to unfinished work without new rest or weight carry',()=>{
  const h=harness();h.run(`startWorkout(weekKeys()[0]);var navPk=dSlots().find(s=>usesLoad(EX[s.id])).pk;
    state.draft.rampDone=99;state.draft.sets[navPk]=[{w:'20',r:'8',done:true},{w:'30',r:'8',done:false}];state.draft.step={ph:'ex',pk:navPk};`);
  const pk=h.run('navPk');h.click('fset',{pk,i:'0'});h.click('fbump',{pk,i:'0',f:'r',dir:'1'});h.click('fdone',{pk,i:'0'});
  assert.equal(h.run('state.draft.step.ph'),'ex');assert.equal(h.run('ui.timer'),null);
  assert.equal(h.run('state.draft.sets[navPk][1].w'),'30');assert.equal(h.run('doneN(state.draft,navPk)'),1);
  assert.match(h.run('renderFocus()'),/Log set/);
  const before=h.run('JSON.stringify(state.draft)');h.click('fset',{pk,i:'99'});h.click('fset',{pk:'missing',i:'0'});
  assert.equal(h.run('JSON.stringify(state.draft)'),before);
});
await test('set navigation from rest and paired edit saving preserve completed rounds and the running rest',()=>{
  const h=pairedWorkout();h.run(`startWorkout(K);state.draft.rampDone=99;state.draft.pairSeen={[fPair(state.draft,dSlots(),A).key]:true};
    state.draft.sets[A][0]={w:'20',r:'8',done:true};state.draft.step={ph:'rest',pk:A};fRest(60,{label:'Rest'});`);
  const pk=h.run('A');assert.match(h.run('renderFocus()'),/data-action="fset"/);
  const end=h.run('ui.timer.end');h.click('fset',{pk,i:'0'});assert.equal(h.run('ui.timer.end'),end);h.click('fdone',{pk,i:'0'});
  assert.equal(h.run('state.draft.step.pk'),pk);assert.equal(h.run('state.draft.step.ph'),'rest');
  assert.equal(h.run('state.draft.sets[A][0].done'),true);assert.equal(h.run('state.draft.sets[B][0].done'),false);
});

await test('rest link previews the planned duration without logging or starting a timer',()=>{
  const h=harness();h.run(`startWorkout(weekKeys()[0]);var restPk=dSlots()[0].pk;state.draft.rampDone=99;state.draft.step={ph:'ex',pk:restPk};`);
  const pk=h.run('restPk');
  const out=h.run('renderFocus()'),sets=h.run('JSON.stringify(state.draft.sets)');assert.match(out,/class="workout-path"/);assert(out.indexOf('class="workout-path"')>out.indexOf('class="asteps"'));
  const planned=h.run('fRestSeconds(dSlots()[0],dSlots())');h.click('frest',{pk});
  assert.equal(h.run('ui.timer'),null);assert.equal(h.run('state.draft.step.restPreview'),true);
  assert.match(h.run('renderFocus()'),/Start rest/);assert.match(h.run('renderFocus()'),new RegExp(h.run('mmss('+planned+')')));
  h.click('tadd',{sec:'15'});assert.equal(h.run('state.draft.step.restSec'),planned+15);
  assert.equal(h.run('JSON.stringify(state.draft.sets)'),sets);h.click('fviewsets');assert.equal(h.run('state.draft.step.ph'),'ex');assert.equal(h.run('ui.timer'),null);
});
await test('manual rest continues through editing, return, adjustment and reload without resetting its deadline',()=>{
  const h=harness();h.run(`startWorkout(weekKeys()[0]);var restPk=dSlots()[0].pk;state.settings.sound=false;state.settings.autoRest=false;state.draft.rampDone=99;
    state.draft.sets[restPk][0]={w:'20',r:'8',done:true};state.draft.step={ph:'ex',pk:restPk};`);
  const pk=h.run('restPk');h.click('frest',{pk});h.click('freststart');const end=h.run('ui.timer.end');
  assert(end>0);assert.equal(h.run('state.draft.rest.pk'),pk);
  h.click('fviewsets');h.click('fset',{pk,i:'0'});h.click('fbump',{pk,i:'0',f:'r',dir:'1'});h.click('fdone',{pk,i:'0'});
  assert.equal(h.run('ui.timer.end'),end);assert.equal(h.run('state.draft.sets[restPk][0].done'),true);
  h.click('frest',{pk});assert.equal(h.run('state.draft.step.ph'),'rest');assert.equal(h.run('ui.timer.end'),end);
  h.click('tadd',{sec:'15'});assert.equal(h.run('state.draft.rest.end'),end+15000);
  h.click('fviewsets');h.run(`state=JSON.parse(localStorage.getItem(LS)).state;ui.timer=null;fRestoreTimer();`);
  assert.equal(h.run('ui.timer.end'),end+15000);assert.equal(h.run('ui.timer.label'),'Rest');
  h.click('frest',{pk});h.click('fready');assert.equal(h.run('ui.timer'),null);assert.equal(h.run('state.draft.rest'),undefined);
});
await test('rest expires while editing without changing the selected set and legacy timers restore',()=>{
  const h=harness();h.run(`startWorkout(weekKeys()[0]);var restPk=dSlots()[0].pk;state.settings.sound=false;state.draft.rampDone=99;state.draft.step={ph:'rest',pk:restPk};fRest(60,{label:'Rest'});`);
  const pk=h.run('restPk');h.click('fset',{pk,i:'0'});
  h.run(`ui.timer.end=Date.now()-1;state.draft.rest.end=ui.timer.end;tick();`);
  assert.equal(h.run('state.draft.step.ph'),'ex');assert.equal(h.run('state.draft.step.i'),0);assert.equal(h.run('state.draft.rest'),undefined);
  h.run(`state.draft.step={ph:'rest',pk:restPk,tEnd:Date.now()+60000,tTot:60};ui.timer=null;fRestoreTimer();`);
  assert.equal(h.run('ui.timer.label'),'Rest');assert.equal(h.run('state.draft.rest.pk'),pk);
  const before=h.run('JSON.stringify(state.draft)');h.run(`coachMode={uid:'read-only'};`);h.click('frest',{pk});h.click('freststart');h.click('fviewsets');
  assert.equal(h.run('JSON.stringify(state.draft)'),before);
});
await test('superset rest preview uses the after-pair duration while automatic A to B stays immediate',()=>{
  const h=pairedWorkout();h.run(`startWorkout(K);state.settings.sound=false;state.draft.rampDone=99;state.draft.pairSeen={[fPair(state.draft,dSlots(),A).key]:true};state.draft.step={ph:'ex',pk:A};`);
  const pk=h.run('A');h.click('frest',{pk});assert.equal(h.run('ui.timer'),null);
  assert.equal(h.run('fRestSeconds(dSlots().find(s=>s.pk===A),dSlots())'),h.run('dSlots().find(s=>s.pk===B).cfg.rest'));
  h.click('fviewsets');h.click('fdone',{pk,i:'0'});assert.equal(h.run('state.draft.step.pk'),h.run('B'));assert.equal(h.run('ui.timer'),null);
  h.click('fdone',{pk:h.run('B'),i:'0'});assert.equal(h.run('ui.timer.label'),'Rest');assert.equal(h.run('state.draft.rest.pk'),h.run('state.draft.step.pk'));
});

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
await test('workout sequence crosses program weeks without resetting and wraps after the last workout',()=>{
  const h=harness();h.run(`state.settings.split='fb3';state.settings.days=[1,3,5];logs=[];
    const seq=weekKeys(); const add=(key,days,status='complete')=>logs.unshift({id:'seq-'+logs.length,key,block:state.block.n,week:1,status,date:new Date(Date.now()+days*864e5).toISOString()});`);
  assert.equal(h.run('nextWorkoutKey()'),h.run('seq[0]'));
  h.run('add(seq[0],-15);state.block.start=new Date(Date.now()-21*864e5).toISOString();');
  assert.equal(h.run('nextWorkoutKey()'),h.run('seq[1]'));
  h.run('add(seq[1],-5);');assert.equal(h.run('nextWorkoutKey()'),h.run('seq[2]'));
  h.run('add(seq[2],-1);');assert.equal(h.run('nextWorkoutKey()'),h.run('seq[0]'));
  assert.equal(h.run('weekLogs(weekNum()).length'),0,'weekly counter remains separate');
});
await test('partials, repeat workouts, out-of-order sessions and other programs do not skip the next workout',()=>{
  const h=harness();h.run(`const seq=weekKeys();logs=[{key:seq[1],block:state.block.n,date:'2026-01-03',orderAdvanced:false},
    {key:seq[0],block:state.block.n,date:'2026-01-02',status:'partial'},
    {key:seq[0],block:state.block.n-1,date:'2026-01-01'}];`);
  assert.equal(h.run('nextWorkoutKey()'),h.run('seq[0]'));
  h.run(`logs.unshift({key:seq[0],block:state.block.n,date:'2026-01-04'});logs.unshift({key:seq[0],block:state.block.n,date:'2026-01-05',orderAdvanced:false});`);
  assert.equal(h.run('nextWorkoutKey()'),h.run('seq[1]'));
});
await test('completion order uses the finish timestamp, including a resumed partial, and survives storage',()=>{
  const h=harness();h.run(`const seq=weekKeys();logs=[{id:'b',key:seq[1],block:state.block.n,date:'2026-01-01',completedAt:'2026-01-04'},
    {id:'a',key:seq[0],block:state.block.n,date:'2026-01-02',completedAt:'2026-01-03'}];save();
    const saved=JSON.parse(localStorage.getItem(LS));state=migrate(saved.state);logs=normalizeLogs(saved.logs,state.settings.units);`);
  assert.equal(h.run('nextWorkoutKey()'),h.run('seq[0]'));
  h.run(`logs=logs.filter(l=>l.id!=='b');`);assert.equal(h.run('nextWorkoutKey()'),h.run('seq[1]'));
});
await test('restart resets the sequence without deleting history or weights; new programs start at workout one',()=>{
  const h=harness();h.run(`const seq=weekKeys();state.ex.keep={w:100};logs=[{key:seq[0],block:state.block.n,date:'2026-01-01',entries:[]}];`);
  assert.equal(h.run('nextWorkoutKey()'),h.run('seq[1]'));
  h.click('restartblock');h.run('confirmCb();');
  assert.equal(h.run('nextWorkoutKey()'),h.run('seq[0]'));assert.equal(h.run('logs.length'),1);assert.equal(h.run('state.ex.keep.w'),100);
  h.run('newBlock();');assert.equal(h.run('nextWorkoutKey()'),h.run('seq[0]'));
});
await test('all thirteen splits and flexible schedules retain their repeating order',()=>{
  const h=harness();
  for(const id of h.run('Object.keys(SPLITS)')){
    h.run(`state.settings.flex=true;state.settings.nDays=SPLITS[${JSON.stringify(id)}].days;state.settings.split=${JSON.stringify(id)};logs=[];`);
    const keys=h.run('weekKeys().slice()');
    for(let i=0;i<keys.length*2;i++){
      assert.equal(h.run('nextWorkoutKey()'),keys[i%keys.length]);
      h.run(`logs.unshift({key:nextWorkoutKey(),block:state.block.n,date:new Date(2026,0,1,0,0,${i}).toISOString()});`);
    }
    assert.equal(h.run('nextWorkoutKey()'),keys[0]);
  }
});

await test('changing the workout order follows the latest advancing completion in the new order',()=>{
  const h=harness();h.run(`state.settings.split='fb3';state.settings.days=[1,3,5];const seq=weekKeys();logs=[{key:seq[2],block:state.block.n,date:'2026-01-03'},{key:seq[1],block:state.block.n,date:'2026-01-02'},{key:seq[0],block:state.block.n,date:'2026-01-01'}];state.settings.order={fb3:[seq[1],seq[0],seq[2]]};`);
  assert.equal(h.run('nextWorkoutKey()'),h.run('seq[1]'));
});
await test('finishing an extra workout records effort without advancing past the expected workout',()=>{
  const h=harness();h.run(`const seq=weekKeys();startWorkout(seq[1]);for(const list of Object.values(state.draft.sets))for(const r of list){r.w='20';r.r='8';r.done=true;}finishWorkout();`);
  assert.equal(h.run('logs[0].orderAdvanced'),false);assert.equal(h.run('nextWorkoutKey()'),h.run('seq[0]'));
  h.run(`startWorkout(seq[0]);for(const list of Object.values(state.draft.sets))for(const r of list){r.w='20';r.r='8';r.done=true;}finishWorkout();`);
  assert.equal(h.run('logs[0].orderAdvanced'),true);assert.equal(h.run('nextWorkoutKey()'),h.run('seq[1]'));
});

await test('empty session is not logged',()=>{
  const {run}=harness();run('startWorkout(weekKeys()[0]);finishWorkout();');assert.equal(run('logs.length'),0);assert.ok(run('state.draft'));assert.match(run('lastToast'),/at least one set/);
});

function backend(h, shared){
  const server=shared||{snapshot:{revision:'0',state:null,logs:[],deleted:[]},updates:[]};
  const writes=[], holds=[];let fail=false,hold=false,signedOut=false,loseResponse=false;
  const clone=x=>JSON.parse(JSON.stringify(x));
  h.context.fakeBackend={async rpc(name,p){
    if(name==='read_account_snapshot')return {data:clone(server.snapshot),error:fail?Error('Simulated read failure'):null};
    if(name!=='commit_account_snapshot')return {data:false,error:null};
    if(hold)await new Promise(resolve=>holds.push(resolve));
    if(fail)return {error:Error('Simulated upload failure')};
    if(p.p_revision!==server.snapshot.revision)return {data:{ok:false,snapshot:clone(server.snapshot)}};
    const next=clone(p.p_state);let applied=0;
    if(p.p_apply_coach&&next.block&&!next.draft){
      for(const u of server.updates.filter(u=>!u.applied)){
        next.block.plan={...next.block.plan,...u.plan};next.coach={note:u.note||''};next.adj=u.adj||{};
        if(u.level)next.settings.level=u.level;u.applied=true;applied++;
      }
    }
    for(const l of server.snapshot.logs)if(!p.p_logs.some(x=>x.id===l.id))server.snapshot.deleted.push(l.id);
    if(p.p_logs.some(l=>server.snapshot.deleted.includes(l.id)))throw Error('Deleted ID reused');
    if(JSON.stringify(next)!==JSON.stringify(server.snapshot.state)||JSON.stringify(p.p_logs)!==JSON.stringify(server.snapshot.logs)||applied){
      writes.push({table:'app_state',row:{state:clone(next)}});
      server.snapshot={...server.snapshot,revision:String(+server.snapshot.revision+1),state:next,logs:clone(p.p_logs)};
    }
    if(loseResponse){loseResponse=false;return {error:Error('Response lost after commit')};}
    return {data:{ok:true,applied,snapshot:clone(server.snapshot)},error:null};
  },auth:{async signOut(){signedOut=true;return {error:null};}}};
  h.run(`sb=fakeBackend;AUTH.user={id:'synthetic'};CLOUD.ok=true;SYNC.owner='synthetic';`);
  return {writes,holds,server,set fail(v){fail=v;},set hold(v){hold=v;},set loseResponse(v){loseResponse=v;},get signedOut(){return signedOut;}};
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
  const exiting=h.run('signOut()');assert.equal(b.signedOut,false);assert.equal(b.writes.length,0);
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
// A workout whose last two moves are paired, where a bigger Adjust on the second move would re-fit the plan differently.
function pairedWorkout(){
  for(let n=0;n<200;n++){
    const h=harness();
    const found=h.run(`(()=>{state.settings.mins=[30,45][${n}%2];newBlock();
      for(const key of weekKeys()){const sl=sessionSlots(key),b=sl.filter(s=>s.cfg.ssLen).pop();if(!b)continue;
        const a=sl.find(s=>s.g===b.g&&s.pk!==b.pk);const keep=JSON.stringify(state.adj||{});
        state.adj={...(state.adj||{}),[b.pk]:{ex:b.id,sets:6,rest:150}};const refit=sessionSlots(key);state.adj=JSON.parse(keep);
        const still=refit.find(s=>s.pk===b.pk);if(still&&still.cfg.ssLen&&refit.some(s=>s.pk===a.pk))continue;
        globalThis.K=key;globalThis.A=a.pk;globalThis.B=b.pk;globalThis.BID=b.id;return true;}
      return false;})()`);
    if(found) return h;
  }
  throw Error('No paired workout found');
}
const shape=h=>h.run(`JSON.stringify(dSlots().map(s=>[s.pk,s.label]))`);
await test('Adjust during a paired workout keeps both exercises, their pairing and their logged sets',()=>{
  const h=pairedWorkout();h.run(`startWorkout(K);state.draft.step={ph:'ex',pk:A};`);
  const before=shape(h);h.click('fdone',{pk:h.run('A'),i:'0'});
  assert.equal(h.run('state.draft.step.pk'),h.run('B'));h.click('fdone',{pk:h.run('B'),i:'0'});
  h.run(`document.getElementById('adj-sets').value='6';document.getElementById('adj-rest').value='150';`);h.click('adjsave',{pk:h.run('B'),id:h.run('BID')});
  assert.equal(shape(h),before);assert.equal(h.run('state.draft.sets[B].length'),6);assert.equal(h.run('state.draft.sets[B][0].done'),true);
  h.run(`const cached=JSON.parse(localStorage.getItem(LS));state=migrate(cached.state);`);assert.equal(shape(h),before);
  h.run('finishWorkout()');assert.deepEqual(JSON.parse(h.run(`JSON.stringify(logs[0].entries.map(e=>e.pk).filter(pk=>pk===A||pk===B))`)),[h.run('A'),h.run('B')]);
});
await test('Adjust before the first set keeps the started workout intact, and Reorder still applies',()=>{
  const h=pairedWorkout();h.run(`startWorkout(K);`);const before=shape(h);
  h.run(`document.getElementById('adj-sets').value='6';document.getElementById('adj-rest').value='150';`);h.click('adjsave',{pk:h.run('B'),id:h.run('BID')});
  assert.equal(shape(h),before);assert.equal(h.run('state.draft.sets[B].length'),6);
  h.run(`delete state.adj[B];const first=dSlots()[0].pk,second=dSlots()[1].pk;`);h.click('ordmv',{key:h.run('K'),pk:h.run('first'),dir:'1'});
  assert.equal(h.run('dSlots()[0].pk'),h.run('second'));
  assert.equal(h.run(`dSlots().every(s=>state.draft.sets[s.pk])&&Object.keys(state.draft.sets).every(pk=>dSlots().some(s=>s.pk===pk))`),true);
});
await test('a workout started before this fix keeps every exercise that already has sets',()=>{
  const h=pairedWorkout();h.run(`startWorkout(K);delete state.draft.shape;state.draft.step={ph:'ex',pk:A};`);
  const before=shape(h);h.click('fdone',{pk:h.run('A'),i:'0'});
  h.run(`state.adj={...(state.adj||{}),[B]:{ex:BID,sets:6,rest:150}};`);assert.equal(shape(h),before);
});
await test('skipping or finishing one move of a pair continues with its partner and keeps its rest',()=>{
  let h=pairedWorkout();h.run(`startWorkout(K);state.settings.betweenTimer=false;const other=dSlots().find(s=>s.pk!==A&&s.pk!==B).pk;state.draft.step={ph:'ex',pk:A};`);
  h.click('fskipyes',{pk:h.run('A')});assert.equal(h.run('state.draft.step.pk'),h.run('B'));
  h.click('fdone',{pk:h.run('B'),i:'0'});assert.equal(h.run('state.draft.step.ph'),'rest');assert.equal(h.run('state.draft.step.pk'),h.run('B'));
  h=pairedWorkout();h.run(`startWorkout(K);state.draft.step={ph:'ex',pk:A};`);h.click('fskipyes',{pk:h.run('B')});
  assert.equal(h.run('state.draft.step.pk'),h.run('A'));h.click('fdone',{pk:h.run('A'),i:'0'});
  assert.equal(h.run('state.draft.step.ph'),'rest');assert.ok(h.run('ui.timer.total')>0);
});
await test('superset introduction preserves every set and stays acknowledged after reload',()=>{
  const h=pairedWorkout();h.run(`startWorkout(K);state.draft.step={ph:'ex',pk:A};state.draft.rampDone=99;`);
  const before=h.run('JSON.stringify(state.draft.sets)');
  assert.match(h.run('renderFocus()'),/Two moves, then rest/);
  h.click('fpairbegin',{pk:h.run('A')});
  assert.equal(h.run('JSON.stringify(state.draft.sets)'),before);
  h.run(`const cached=JSON.parse(localStorage.getItem(LS));state=migrate(cached.state);`);
  assert.doesNotMatch(h.run('renderFocus()'),/Two moves, then rest/);
  assert.match(h.run('renderFocus()'),/Paired set sequence/);
  assert.match(h.run('renderFocus()'),/>Log set<\/button>/);
  assert.equal(h.run('logs.length'),0);
});
await test('paired Log set follows A then B then rest, with unmatched sets and auto-rest off',()=>{
  for(const autoRest of [true,false]){
    const h=pairedWorkout();h.run(`startWorkout(K);state.settings.autoRest=${autoRest};state.settings.betweenTimer=false;state.draft.rampDone=99;state.draft.pairSeen={[fPair(state.draft,dSlots(),A).key]:true};state.draft.sets[A]=Array.from({length:3},()=>({w:'20',r:'10',done:false}));state.draft.sets[B]=Array.from({length:4},()=>({w:'20',r:'10',done:false}));state.draft.step={ph:'ex',pk:A};`);
    const trace=[];let iterations=0;
    while(h.run("state.draft.step.ph!=='exdone'")&&iterations++<30){
      if(h.run("state.draft.step.ph==='rest'")){trace.push('rest');assert.match(h.run('renderFocus()'),/>Ready<\/button>/);h.click('fready');}
      h.run(`var currentPk=state.draft.step.pk,k=state.draft.sets[currentPk].findIndex(x=>!x.done);`);
      trace.push((h.run('currentPk===A')?'A':'B')+(h.run('k')+1));assert.match(h.run('renderFocus()'),/>Log set<\/button>/);h.click('fdone',{pk:h.run('currentPk'),i:String(h.run('k'))});
    }
    const expected=['A1','B1',...(autoRest?['rest']:[]),'A2','B2',...(autoRest?['rest']:[]),'A3','B3',...(autoRest?['rest']:[]),'B4'];assert.deepEqual(trace,expected);
    assert(h.run('state.draft.sets[A].every(x=>x.done)&&state.draft.sets[B].every(x=>x.done)'));
  }
});
await test('existing paired drafts and a skipped partner do not repeat the introduction',()=>{
  const h=pairedWorkout();h.run(`startWorkout(K);state.draft.step={ph:'ex',pk:A};state.draft.sets[A][0]={w:'20',r:'8',done:true};`);
  assert.doesNotMatch(h.run('renderFocus()'),/Two moves, then rest/);
  h.click('fskipyes',{pk:h.run('B')});assert.doesNotMatch(h.run('renderFocus()'),/Two moves, then rest/);
  h.run(`var sl=dSlots(),move=sl.find(x=>x.pk===A),k=state.draft.sets[A].findIndex(x=>!x.done);`);
  h.run(`state.draft.sets[A]=[{w:'20',r:'10',done:false},{w:'20',r:'10',done:false}];state.draft.step={ph:'ex',pk:A};`);h.click('fdone',{pk:h.run('A'),i:'0'});assert.equal(h.run('state.draft.step.ph'),'rest');
});
await test('cardio check-in selection survives reload and applies feedback only on Continue',()=>{
  const h=harness();h.run(`startWorkout(weekKeys()[0]);state.draft.step={ph:'warm'};state.draft._x=sessionExtras(state.draft,dSlots());gStart('warm');state.draft.guide.mode='cfeel';`);
  const before=h.run('JSON.stringify(state.settings.cardio)');
  h.click('gcfeelpick',{v:'hard'});assert.equal(h.run('JSON.stringify(state.settings.cardio)'),before);
  h.run(`const cached=JSON.parse(localStorage.getItem(LS));state=migrate(cached.state);`);
  assert.equal(h.run('state.draft.guide.feelChoice'),'hard');
  h.click('gcfeelconfirm');assert.equal(h.run('(state.settings.cardio||{}).checks'),1);
  h.click('gcfeelconfirm');assert.equal(h.run('(state.settings.cardio||{}).checks'),1);
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

async function paired(){
  const a=harness(),ba=backend(a);await a.run('pushCloud()');
  const b=harness(),bb=backend(b,ba.server);
  b.context.initial=structuredClone(ba.server.snapshot);
  b.run('state=copySync(initial.state);logs=copySync(initial.logs);SYNC.base=copySync(initial);');
  await b.run('pushCloud()');return {a,b,ba,bb};
}
await test('two devices preserve conflicting plans and require an explicit choice',async()=>{
  const {a,b,ba}=await paired();
  a.run("state.settings.name='Device A';save();");b.run("state.settings.name='Device B';save();");
  await a.run('pushCloud()');assert.equal(await b.run('pushCloud()'),false);
  assert.equal(ba.server.snapshot.state.settings.name,'Device A');assert.equal(b.run('state.settings.name'),'Device B');
  assert.equal(b.run('saveStatus()[1]'),'Review sync conflict');assert.equal(await b.run('flushCloud()'),false);
  assert.ok(JSON.parse(b.storage.get('dev_strongstart_state_v3')).sync.conflict);
  await b.run("resolveSyncConflict('device')");assert.equal(ba.server.snapshot.state.settings.name,'Device B');
  assert.equal(b.run('SYNC.recovery.account.state.settings.name'),'Device A');
  assert.equal(b.run('SYNC.conflict'),null);
});
await test('independent new workouts merge while a stale device cannot revive a deletion',async()=>{
  const {a,b,ba}=await paired();
  a.run("logs.push({id:'A',date:'2026-11-11T10:00:00Z',units:'lb',status:'complete',entries:[]});save();");
  b.run("logs.push({id:'B',date:'2026-11-11T11:00:00Z',units:'lb',status:'complete',entries:[]});save();");
  await a.run('pushCloud()');await b.run('pushCloud()');assert.deepEqual(ba.server.snapshot.logs.map(l=>l.id).sort(),['A','B']);
  await a.run('pushCloud()');a.run("logs=logs.filter(l=>l.id!=='A');save();");await a.run('pushCloud()');
  b.run("state.settings.name='Offline edit';save();");await b.run('pushCloud()');
  assert.deepEqual(ba.server.snapshot.logs.map(l=>l.id),['B']);assert.ok(ba.server.snapshot.deleted.includes('A'));
});
await test('same-workout edits conflict without replacing either completed set list',async()=>{
  const {a,b,ba}=await paired();a.run("logs=[{id:'same',date:'2026-11-11T10:00:00Z',units:'lb',status:'partial',entries:[]}];save();");
  await a.run('pushCloud()');await b.run('pushCloud()');
  a.run("logs[0].entries=[{sets:[{w:20,r:8}]}];save();");b.run("logs[0].entries=[{sets:[{w:25,r:9}]}];save();");
  await a.run('pushCloud()');assert.equal(await b.run('pushCloud()'),false);
  assert.equal(b.run('logs[0].entries[0].sets[0].w'),25);assert.equal(ba.server.snapshot.logs[0].entries[0].sets[0].w,20);
  await b.run("resolveSyncConflict('account')");assert.equal(b.run('logs[0].entries[0].sets[0].w'),20);
});
await test('a revision race retries and detects conflict instead of overwriting',async()=>{
  const {a,b,ba,bb}=await paired();ba.hold=true;bb.hold=true;
  a.run("state.settings.name='Race A';save();");b.run("state.settings.name='Race B';save();");
  const pa=a.run('pushCloud()'),pb=b.run('pushCloud()');await new Promise(setImmediate);
  ba.hold=false;ba.holds.shift()();await pa;bb.hold=false;bb.holds.shift()();await pb;
  assert.equal(ba.server.snapshot.state.settings.name,'Race A');assert.ok(b.run('SYNC.conflict'));
});
await test('coach delivery waits for paused drafts and applies exactly once after they clear',async()=>{
  const h=harness(),be=backend(h);await h.run('pushCloud()');
  be.server.updates.push({plan:{upper:[]},note:'Synthetic coach',level:'up'});
  h.run('startWorkout(weekKeys()[0]);state.draft.paused=true;save();');await h.run('pushCloud()');
  assert.equal(be.server.updates[0].applied,undefined);
  h.run('state.draft=null;save();');await h.run('pushCloud()');
  assert.equal(be.server.updates[0].applied,true);assert.equal(h.run('state.coach.note'),'Synthetic coach');
  h.run("state.coach.note='Member note after update';save();");await h.run('pushCloud()');
  assert.equal(h.run('state.coach.note'),'Member note after update');
});
await test('lost response after coach commit recovers without consuming or replaying work',async()=>{
  const h=harness(),be=backend(h);await h.run('pushCloud()');
  be.server.updates.push({plan:{upper:[]},note:'Committed despite disconnect'});be.loseResponse=true;
  assert.equal(await h.run('pushCloud()'),false);assert.equal(be.server.updates[0].applied,true);
  assert.notEqual(h.run('state.coach.note'),'Committed despite disconnect');
  assert.equal(await h.run('pushCloud()'),true);assert.equal(h.run('state.coach.note'),'Committed despite disconnect');
  assert.equal(h.run('SYNC.conflict'),null);
});
await test('local save failure prevents sending or acknowledging a coach update',async()=>{
  const h=harness(),be=backend(h);await h.run('pushCloud()');be.server.updates.push({plan:{upper:[]},note:'Pending'});
  h.run("localStorage.setItem=()=>{throw Error('Quota');};");assert.equal(await h.run('pushCloud()'),false);
  assert.equal(be.server.updates[0].applied,undefined);assert.equal(h.run('saveStatus()[1]'),'Device save failed');
});
await test('edits during coach delivery are preserved as a recoverable conflict',async()=>{
  const h=harness(),be=backend(h);await h.run('pushCloud()');be.server.updates.push({plan:{upper:[]},note:'Coach edit'});be.hold=true;
  const pending=h.run('pushCloud()');await new Promise(setImmediate);h.run("state.settings.name='New edit during delivery';save();");
  be.hold=false;be.holds.shift()();assert.equal(await pending,false);
  assert.equal(h.run('state.settings.name'),'New edit during delivery');assert.equal(h.run('SYNC.conflict.state.coach.note'),'Coach edit');
});
await test('reload preserves the baseline and detects an offline plan conflict',async()=>{
  const {a,b,ba}=await paired();a.run("state.settings.name='Remote new';save();");await a.run('pushCloud()');
  b.run("state.settings.name='Offline local';save();");const cached=b.storage.get('dev_strongstart_state_v3');
  const c=harness();backend(c,ba.server);c.context.cached=JSON.parse(cached);c.run('state=migrate(cached.state);logs=cached.logs;SYNC=cached.sync;');
  assert.equal(await c.run('pushCloud()'),false);assert.equal(c.run('state.settings.name'),'Offline local');
});
await test('first upgrade preserves differing legacy local and cloud plans for review',async()=>{
  const {a,b,ba}=await paired();b.run("SYNC.base=null;state.settings.name='Legacy unsynced';save();");
  assert.equal(await b.run('pushCloud()'),false);assert.equal(b.run('state.settings.name'),'Legacy unsynced');
  assert.notEqual(ba.server.snapshot.state.settings.name,'Legacy unsynced');
});
await test('account switch while a request is pending never adopts the old response',async()=>{
  const h=harness(),be=backend(h);await h.run('pushCloud()');be.hold=true;
  h.run("state.settings.name='Old account edit';save();");const flight=h.run('pushCloud()');await new Promise(setImmediate);
  h.run("AUTH.user={id:'other'};state=defaults();state.settings.name='Other account';SYNC={owner:'other',base:null};");
  be.hold=false;be.holds.shift()();assert.equal(await flight,false);assert.equal(h.run('state.settings.name'),'Other account');
});
await test('remote-only changes load even when client clocks disagree',async()=>{
  const {a,b}=await paired();a.run("state.settings.name='Server revision wins';state.updatedAt=1;");await a.run('pushCloud()');
  b.run('state.updatedAt=9999999999999;');await b.run('pushCloud()');assert.equal(b.run('state.settings.name'),'Server revision wins');
});

await test('deleted partial history retains unfinished sets under a fresh session identity',async()=>{
  const h=harness(),be=backend(h);h.run('startWorkout(weekKeys()[0]);const pk=dSlots()[0].pk;state.draft.sets[pk][0]={w:20,r:8,done:true};finishWorkout();');
  await h.run('pushCloud()');const id=h.run('state.draft.logId');
  be.server.snapshot.logs=[];be.server.snapshot.deleted.push(id);be.server.snapshot.revision=String(+be.server.snapshot.revision+1);
  await h.run('pushCloud()');assert.equal(h.run('logs.length'),0);assert.equal(h.run('state.draft.logId'),undefined);
  assert.equal(h.run('state.draft.sets[pk][0].done'),true);
  h.run('resumePartial();finishWorkout();');await h.run('pushCloud()');
  assert.equal(be.server.snapshot.logs.length,1);assert.notEqual(be.server.snapshot.logs[0].id,id);
});
await test('explicit backup restore can intentionally restore a deleted session with new IDs',async()=>{
  const h=harness(),be=backend(h);h.run('startWorkout(weekKeys()[0]);const pk=dSlots()[0].pk;state.draft.sets[pk][0]={w:20,r:8,done:true};finishWorkout();');
  await h.run('pushCloud()');h.run('const backup=deviceSnapshot();const oldId=logs[0].id;logs=[];save();');await h.run('pushCloud()');
  h.run('restoreSnapshot(backup);save();');await h.run('pushCloud()');
  assert.equal(h.run('logs.length'),1);assert.notEqual(h.run('logs[0].id'),h.run('oldId'));
  assert.equal(h.run('state.draft.logId'),h.run('logs[0].id'));
});
await test('conflict resolution stops if the recovery copy cannot be saved',async()=>{
  const {a,b}=await paired();a.run("state.settings.name='Cloud';save();");await a.run('pushCloud()');
  b.run("state.settings.name='Device';save();");await b.run('pushCloud()');
  b.run("localStorage.setItem=()=>{throw Error('Quota');};");await b.run("resolveSyncConflict('account')");
  assert.equal(b.run('state.settings.name'),'Device');assert.ok(b.run('SYNC.conflict'));
});
await test('new onboarding has eight steps and existing saved setup keeps its full flow',()=>{
  const h=harness();h.run('state=defaults();');
  assert.equal(h.run('setupSteps(state.setup.a).length'),8);
  h.run("delete state.setup.a.quickSetup;state.setup.a.routine='yes';state.setup.a.last='still';");
  assert.ok(h.run('setupSteps(state.setup.a).length')>=12);
  h.run("startSetup(true);state.setup.edit='routine';");
  assert.ok(h.run("setupSteps(state.setup.a).includes('routine')"));
});
await test('quick setup requires equipment confirmation at every selected place',()=>{
  const h=harness();h.run("state=defaults();state.setup.step='equip';state.setup.a.places=[{k:'home',eq:['db']},{k:'any',eq:[]}];");
  h.click('sunext');assert.equal(h.run('state.setup.step'),'equip');
  h.click('sueqconfirm');h.click('sunext');assert.equal(h.run('state.setup.step'),'equip');
  h.click('sutab',{v:'any'});h.click('sueqconfirm');h.click('sunext');assert.equal(h.run('state.setup.step'),'experience');
  h.run("state.setup.step='equip';");h.click('sueq',{k:'bd'});assert.equal(h.run('state.setup.a.places[1].confirmed'),false);
});
await test('pausing early setup preserves answers without creating an unchecked plan',()=>{
  const h=harness();h.run("state=defaults();state.setup.a.name='Synthetic';");h.click('sulater');
  assert.equal(h.run('state.block'),null);assert.equal(h.run('state.setup.paused'),true);
  assert.match(h.run('renderToday()'),/Continue setup/);
  h.run('state=migrate(JSON.parse(JSON.stringify(state)));');
  assert.equal(h.run('state.setup.a.name'),'Synthetic');assert.equal(h.run('state.setup.a.quickSetup'),true);
  h.click('suresume');assert.equal(h.run('state.setup.paused'),false);
});
await test('quick setup retains experience and limitations and produces a valid first week',()=>{
  const h=harness();h.run("state=defaults();logs=[];state.setup.step='experience';state.setup.a.goals=['muscle'];state.setup.a.places=[{k:'home',eq:['db','bn'],confirmed:true}];");
  h.click('sunext');assert.equal(h.run('state.setup.step'),'experience');
  h.click('sulevel',{v:'back'});h.click('suquickcomfort',{v:'learning'});h.click('sunext');
  assert.equal(h.run('state.setup.step'),'pain');h.click('sunext');assert.equal(h.run('state.setup.step'),'pain');
  h.click('supain',{v:'none'});h.click('sunext');h.click('sunext');
  assert.equal(h.run('state.setup.step'),'week1');assert.equal(h.run('state.settings.level'),'back');assert.equal(h.run('state.settings.comfort'),'learning');
  assert.equal(h.run('state.settings.cardio.after'),0);
  assert.ok(h.run('weekKeys().every(k=>sessionSlots(k).length>0 && sessionSlots(k).every(sl=>available(EX[sl.id])&&allowed(EX[sl.id])))'));
  h.click('sufinish');assert.equal(h.run('state.setup'),null);assert.equal(h.run('pendingQs().length'),0);
  assert.match(h.run('renderToday()'),/Your first workout/);
});
await test('deletion discards late sync responses and waits before deleting the authenticated account',async()=>{
  const h=harness();
  h.run(`AUTH.user={id:'delete-test',email:'delete@example.invalid'}; AUTH.access='ok'; ui.selfDeleteUser=AUTH.user.id; CLOUD.ok=true;
    lsSet(ACCT_KEY,JSON.stringify(AUTH.user));persistLocal();
    globalThis.deleteCalls=0;globalThis.releaseRead=null;
    sb={rpc:async name=>{if(name==='read_account_snapshot')return await new Promise(resolve=>releaseRead=resolve);if(name==='delete_my_account'){deleteCalls++;return {error:{code:'network'}};}return {data:false};}};
    globalThis.syncFlight=pushCloud();`);
  await new Promise(setImmediate);
  h.elements.set('#self-delete-confirm',{value:'DELETE'});
  h.run(`globalThis.deletionFlight=selfDeleteAccount({disabled:false,textContent:''});`);
  assert.equal(h.run('AUTH.deleting'),true);assert.equal(h.run('deleteCalls'),0);
  h.run(`releaseRead({data:{state:{settings:{name:'Late response'}},logs:[],revision:'1',deleted:[]}});`);
  await h.run('deletionFlight');
  assert.equal(h.run('deleteCalls'),1);assert.notEqual(h.run('state.settings.name'),'Late response');
  assert.equal(h.run('AUTH.deleting'),false);assert.equal(h.run('AUTH.user.id'),'delete-test');
  assert.ok(h.storage.get(h.run('LS')));
});

await test('warm-up weights support typing and equipment increments without changing working sets',()=>{
  const h=harness();
  h.run(`state.settings.level='regular';startWorkout(weekKeys()[0]);const d=state.draft;d._x=sessionExtras(d,dSlots());
    const slot=dSlots().find(s=>s.pk===d._x.rampPk);const pk=slot.pk;d.step={ph:'ex',pk};
    const before=JSON.stringify({sets:d.sets,ex:state.ex,planned:d.planned});
    const card=renderRamp(d,slot,d._x);`);
  assert.match(h.run('card'),/aria-label="Weight"[^>]*data-ramp="true"/);
  assert.match(h.run('card'),/aria-label="More weight"/);
  const data={pk:h.run('pk'),i:'0',f:'w',ramp:'true'};
  h.dispatch('input',{id:'',dataset:data,value:'12.5'});
  assert.equal(h.run('rampSet(d,slot,0).w'),'12.5');
  const next=h.run('nextLoad(EX[slot.id],12.5)');
  h.click('fbump',{...data,dir:'1'});
  assert.equal(+h.run('rampSet(d,slot,0).w'),next);
  h.dispatch('input',{id:'',dataset:data,value:'0'});
  h.click('fbump',{...data,dir:'-1'});
  assert.equal(h.run('rampSet(d,slot,0).w'),'0');
  assert.equal(h.run('JSON.stringify({sets:d.sets,ex:state.ex,planned:d.planned})'),h.run('before'));
  assert.equal(h.run('logs.length'),0);
  h.click('framp');assert.equal(h.run('d.rampDone'),1);
  assert.equal(h.run('Object.values(d.sets).flat().filter(s=>s.done).length'),0);
});
await test('warm-up load edits survive reload, stay separate per set and convert units',()=>{
  const h=harness();
  h.run(`state.settings.level='regular';startWorkout(weekKeys()[0]);state.draft._x=sessionExtras(state.draft,dSlots());
    const slot=dSlots().find(s=>s.pk===state.draft._x.rampPk);const pk=slot.pk;
    rampSet(state.draft,slot,0).w='100';rampSet(state.draft,slot,1).w='120';save();
    const snapshot=JSON.parse(localStorage.getItem(LS));state=migrate(snapshot.state);logs=snapshot.logs;`);
  assert.equal(h.run('rampSet(state.draft,slot,0).w'),'100');
  assert.equal(h.run('rampSet(state.draft,slot,1).w'),'120');
  h.run("changeUnits('kg')");
  near(+h.run('rampSet(state.draft,slot,0).w'),45.359237);
  near(+h.run('rampSet(state.draft,slot,1).w'),54.4310844);
  h.run(`coachMode={};`);
  h.dispatch('input',{id:'',dataset:{pk:h.run('pk'),i:'0',f:'w',ramp:'true'},value:'999'});
  near(+h.run('rampSet(state.draft,slot,0).w'),45.359237);
});
await test('legacy warm-up drafts retain suggestions and accept an unknown starting weight',()=>{
  const h=harness();h.run(`startWorkout(weekKeys()[0]);const d=state.draft;d._x=sessionExtras(d,dSlots());
    const slot=dSlots().find(s=>s.pk===d._x.rampPk);d.step={ph:'ex',pk:slot.pk};d._x.warm.filter(x=>x.ramp)[0].d='15 kg × 6';`);
  assert.equal(h.run('rampSet(d,slot,0).w'),'15');
  h.run(`delete d.rampSets;d._x.warm.filter(x=>x.ramp)[0].d='60% of your working weight × 6';`);
  assert.equal(h.run('rampSet(d,slot,0).w'),'');
  assert.match(h.run('renderRamp(d,slot,d._x)'),/60% of your working weight/);
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
