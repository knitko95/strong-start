/* Explicit PostHog capture only. No SDK, DOM capture, URL collection or replay. */
window.createUsageAnalytics = function(config, context) {
  const key='dev_strongstart_analytics_choice_v1';
  const actions=new Set(['open','resume','fbegin','fpause','fdone','finish','fend','exinfo','swap','swapapply','sunext','suback','sulater','sufinish','settingsgroup','settingshome','sectoggle','settheme','setcolor','setmins','setsplit','setday','setflex','setndays']);
  const events=new Set(['screen_viewed','action_pressed','action_rendered','setup_step_completed','setup_completed','setup_paused','workout_started','workout_resumed','workout_paused','set_logged','workout_saved','swap_applied','instructions_opened','settings_changed']);
  let choice=null, id=null, subject=null, view=null, generation=0, elapsed=0, since=performance.now(), visible=!document.hidden;
  try{choice=localStorage.getItem(key);}catch{}
  const configured=()=>config.enabled===true && /^phc_[A-Za-z0-9_-]+$/.test(config.token||'') && ['https://us.i.posthog.com','https://eu.i.posthog.com'].includes(config.host);
  const active=()=>context().eligible && choice==='yes' && configured();
  const clock=()=>elapsed+(visible?Math.max(0,performance.now()-since):0);
  function reset(){generation++;id=null;view=null;elapsed=0;since=performance.now();}
  function sync(){const c=context();if(subject!==c.subject){subject=c.subject;reset();}return c;}
  function capture(event,fields={}){
    try{
      const c=sync();if(!active()||!events.has(event))return;
      id=id||crypto.randomUUID();
      const properties={distinct_id:id,$process_person_profile:false,$geoip_disable:true,environment:'development',version:c.version,build:c.build,variant:c.variant,screen:c.screen};
      // Callers cannot attach arbitrary strings or personal content.
      if(actions.has(fields.action))properties.action=fields.action;
      if(/^(today|preview|workout(_(ex|rest|warm|cool))?|plan|library|history|settings_(home|training|workout|profile|account)|setup_[a-z]+|other)$/.test(fields.from_screen||''))properties.from_screen=fields.from_screen;
      for(const k of ['decision_ms','response_ms'])if(Number.isFinite(fields[k]))properties[k]=Math.round(Math.max(0,Math.min(fields[k],86400000)));
      if(['complete','partial'].includes(fields.status))properties.status=fields.status;
      void fetch(config.host+'/i/v0/e/',{method:'POST',credentials:'omit',referrerPolicy:'no-referrer',keepalive:true,headers:{'Content-Type':'text/plain'},body:JSON.stringify({api_key:config.token,event,properties,timestamp:new Date().toISOString(),uuid:crypto.randomUUID()})}).catch(()=>{});
    }catch{} // Analytics must never interrupt workouts or saving.
  }
  function screen(){
    const c=sync();if(!c.eligible){view=null;return;}
    if(view!==c.viewKey){view=c.viewKey;elapsed=0;since=performance.now();capture('screen_viewed');}
  }
  function press(action){
    sync();if(!actions.has(action)||!active())return;
    const start=performance.now(),origin=context().screen,epoch=generation;
    capture('action_pressed',{action,decision_ms:clock()});
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      // Rendering latency estimate after a paint opportunity; never proof of success.
      sync();if(epoch!==generation||document.hidden)return;
      capture('action_rendered',{action,from_screen:origin,response_ms:performance.now()-start});
    }));
  }
  document.addEventListener('visibilitychange',()=>{elapsed=clock();since=performance.now();visible=!document.hidden;});
  window.addEventListener?.('storage',e=>{if(e.key===key){choice=e.newValue;reset();}});
  return {capture,screen,press,configured,choice:()=>choice,
    choose(value){if(!['yes','no'].includes(value))return;choice=value;reset();try{localStorage.setItem(key,value);}catch{}screen();},
    reset,
    card({embedded=false}={}){if(!config.enabled)return '';return `<section class="${embedded?'stack':'card stack'}" aria-label="Usage analytics"><h2>Help improve Strong Start</h2><p class="small muted">Optional usage analytics measures selected button presses and active time between screens and actions. It sends a random session ID to PostHog, without your name, email, entered text, health details or messages. No screen recordings. Your choice applies to this test browser; you can change it here anytime.</p><p class="small" role="status">${!configured()?'Test connection is being configured. No analytics is being sent.':choice==='yes'?'Usage analytics is on.':choice==='no'?'Usage analytics is off.':'Usage analytics is off until you choose Allow.'}</p><div class="row"><button class="btn" data-action="analyticsyes" aria-pressed="${choice==='yes'}">Allow analytics</button><button class="btn ghost" data-action="analyticsno" aria-pressed="${choice==='no'}">${choice==='yes'?'Turn off analytics':'No thanks'}</button></div><a class="small" href="privacy.html">Privacy policy</a></section>`;}
  };
};
