// Synthetic browser-only validation. Inject into an isolated page; never ship in runtime assets.

window.reviewErrors=[];window.addEventListener('error',e=>reviewErrors.push(e.message));window.addEventListener('unhandledrejection',e=>reviewErrors.push(String(e.reason)));
const reviewStorage=new Map();Object.defineProperty(window,'localStorage',{value:{getItem:k=>reviewStorage.get(k)||null,setItem:(k,v)=>reviewStorage.set(k,String(v)),removeItem:k=>reviewStorage.delete(k)}});

(async()=>{
 const results=[],check=(ok,msg)=>{if(!ok)throw Error(msg);results.push(msg);};
 const frame=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
 const click=sel=>{const b=document.querySelector(sel);if(!b)throw Error('Missing '+sel);b.click();};
 const fit=label=>{check(document.documentElement.scrollWidth<=innerWidth,label+' fits');};
 try{
  sb=null;AUTH.ready=true;AUTH.user=null;ui.qsLater=true;state=defaults();logs=[];state.setup=null;state.onboarded=true;
  Object.assign(state.settings,{goals:['muscle'],level:'regular',days:[1,3,5],split:'fb3',mins:45,flex:true,theme:'light',color:'blush',sound:false});
  state.places=[{k:'gym',n:'Gym',eq:PLACE_TYPES.gym.eq.split(' ')}];state.curPlace='gym';newBlock();ui.tab='today';render();await frame();
  check(document.querySelectorAll('#tabs button').length===3,'three primary tabs');
  check(document.querySelector('.today-workout').compareDocumentPosition(document.querySelector('.today-progress'))&Node.DOCUMENT_POSITION_FOLLOWING,'workout precedes progress');
  check(document.querySelector('.today-start').compareDocumentPosition(document.querySelector('.today-exercises-toggle'))&Node.DOCUMENT_POSITION_FOLLOWING,'start precedes details');
  const before=JSON.stringify({state,logs});
  click('#settings-shortcut');check(ui.tab==='settings','profile opens Settings');
  for(const group of ['training','workout','profile','account']){click(`[data-action="settingsgroup"][data-v="${group}"]`);await frame();fit(group);click('[data-action="settingshome"]');}
  click('#tabs [data-tab="plan"]');click('[data-tab="library"]');check(ui.tab==='library','Plan opens Exercises');fit('Library');
  click('[data-tab="plan"]');check(ui.tab==='plan','Exercises returns to Plan');
  click('#tabs [data-tab="history"]');fit('Progress');
  click('#tabs [data-tab="today"]');check(JSON.stringify({state,logs})===before,'browsing preserves saved data');
  for(const theme of ['light','dark']){state.settings.theme=theme;render();await frame();fit('Today '+theme);click('.today-exercises-toggle');await frame();fit('Today toggle '+theme);}
  state.settings.theme='light';render();click('.today-start');check(ui.tab==='workout'&&state.draft.step.ph==='warm','Start opens warm-up');await frame();fit('Warm-up');
  const d=state.draft,slots=dSlots(),slot=slots.find(s=>usesLoad(EX[s.id])&&!fPair(d,slots,s.pk))||slots.find(s=>usesLoad(EX[s.id]));const pk=slot.pk;
  d.rampDone=99;if(fPair(d,slots,pk))d.pairSeen={[fPair(d,slots,pk).key]:true};
  d.sets[pk]=Array.from({length:6},(_,i)=>({w:'30',r:'10',done:i<3}));d.step={ph:'ex',pk,i:3};render();await frame();fit('Six sets');
  click(`[data-action="fset"][data-pk="${pk}"][data-i="0"]`);check(d.step.i===0,'completed set opens editor');
  click(`[data-action="fbump"][data-f="r"][data-dir="1"]`);click('[data-action="fdone"]');check(d.step.i===3&&d.sets[pk][0].r==='11','Save returns to current set');
  d.step={ph:'rest',pk,afterRound:2};fRest(90,{label:'Rest'});render();const deadline=ui.timer.end;await frame();fit('Rest');
  click(`[data-action="fset"][data-pk="${pk}"][data-i="0"]`);click('[data-action="fdone"]');check(d.step.ph==='rest'&&ui.timer.end===deadline,'editing preserves running rest');
  click('[data-action="fmore"]');click('[data-action="fmoredo"][data-do="fpause"]');check(ui.tab==='today','Pause returns to Today');
  const saved=JSON.parse(localStorage.getItem(LS));state=migrate(saved.state);logs=normalizeLogs(saved.logs||[],state.settings.units);ui.tab='today';render();
  check(!!state.draft&&state.draft.sets[pk][0].r==='11','draft survives save and reload');click('[data-action="resume"]');check(ui.tab==='workout','Resume returns to workout');
  ui.tab='today';state.draft=null;render();const original=JSON.stringify({state,logs});coachMode={name:'Synthetic member',own:{state:structuredClone(state),logs:structuredClone(logs)}};render();
  check(!document.querySelector('.today-start'),'coach cannot start or resume');check(JSON.stringify({state,logs})===original,'coach browsing preserves data');coachMode=null;
  state.settings.theme='light';ui.tab='today';render();window.scrollTo(0,0);await frame();
  check(reviewErrors.length===0,'no page errors');
  const out=document.createElement('pre');out.id='review-result';out.hidden=true;out.textContent=JSON.stringify({ok:true,width:innerWidth,results,errors:reviewErrors});document.body.append(out);
 }catch(e){const out=document.createElement('pre');out.id='review-result';out.textContent=JSON.stringify({ok:false,error:e.message,stack:e.stack,results,errors:reviewErrors});document.body.append(out);}
})();
