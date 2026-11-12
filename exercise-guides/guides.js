/* Public exercise media only. Does not read or write account/workout storage. */
(() => {
  'use strict';
  const base=new URL('./',document.currentScript.src);
  let registryPromise,viewerPromise,active,sequence=0;
  const owned=entry=>active===entry&&entry.mount.isConnected&&!entry.abort.signal.aborted&&!entry.failed;
  function registry(){
    if(!registryPromise){
      const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),8000);
      registryPromise=fetch(new URL('registry.v1.json',base),{signal:controller.signal})
        .then(r=>{if(!r.ok)throw Error('Registry unavailable');return r.json();})
        .then(r=>{if(r.schemaVersion!==1||!r.guides||!r.animations||!r.characters)throw Error('Unsupported registry');return r;})
        .catch(error=>{registryPromise=null;throw error;}).finally(()=>clearTimeout(timeout));
    }
    return registryPromise;
  }
  function viewer(){
    if(!viewerPromise)viewerPromise=import(new URL('vendor/model-viewer-4.4.0.min.js',base).href)
      .then(()=>customElements.whenDefined('model-viewer')).catch(error=>{viewerPromise=null;throw error;});
    return viewerPromise;
  }
  function dispose(){
    const old=active;active=null;
    if(!old)return;
    old.abort.abort();clearTimeout(old.timeout);old.observer?.disconnect();
    try{old.model?.pause();}catch{}
    old.model?.remove();old.mount.replaceChildren();
  }
  async function attach({exerciseId,mount,environment}){
    dispose();if(!mount)return;
    const entry={mount,abort:new AbortController(),token:++sequence,wantsPlayback:!matchMedia('(prefers-reduced-motion: reduce)').matches};
    active=entry;
    entry.observer=new MutationObserver(()=>{if(active===entry&&!mount.isConnected)dispose();});
    entry.observer.observe(document.body,{childList:true,subtree:true});
    try{
      const data=await registry();if(!owned(entry))return;
      const guide=data.guides[exerciseId];
      if(!guide||guide.exerciseId!==exerciseId||!guide.enabledEnvironments.includes(environment))return;
      const animation=data.animations[guide.animationId],variant=animation?.variants?.[guide.defaultCharacter];
      if(!variant||variant.review?.status!=='visually-accepted'||!/^models\/[a-z0-9.-]+\.glb$/.test(variant.asset))return;
      const presentation=guide.presentation;
      const card=document.createElement('section');card.className='eg-demo';card.dataset.exerciseGuide=exerciseId;card.setAttribute('aria-label','3D exercise demonstration');
      card.innerHTML='<div class="eg-head"><h3>3D demonstration</h3><span class="eg-status" role="status">Loading…</span></div><div class="eg-view"></div><p class="eg-hint">Drag to rotate · Scroll or pinch to zoom</p><div class="eg-controls" hidden><button type="button" class="btn eg-play">Pause demonstration</button><label>Speed <select class="eg-speed"><option value="1">Normal</option><option value="0.5">Half speed</option></select></label></div><div class="eg-angles" role="group" aria-label="Demonstration view" hidden><button type="button" class="btn" data-eg-angle="0" aria-pressed="false">Front</button><button type="button" class="btn" data-eg-angle="-90" aria-pressed="false">Side</button><button type="button" class="btn" data-eg-angle="180" aria-pressed="false">Back</button><button type="button" class="btn eg-reset">Reset view</button></div>';
      // The surrounding scrim has a delegated close action; controls stay inside the guide.
      for(const event of ['click','input','change'])card.addEventListener(event,e=>e.stopPropagation(),{signal:entry.abort.signal});
      mount.replaceChildren(card);entry.card=card;
      const status=card.querySelector('.eg-status'),view=card.querySelector('.eg-view'),play=card.querySelector('.eg-play'),speed=card.querySelector('.eg-speed');
      speed.value=String(presentation.defaultSpeed);
      function fail(){
        if(!owned(entry))return;
        entry.failed=true;
        clearTimeout(entry.timeout);try{entry.model?.pause();}catch{}entry.model?.remove();
        view.replaceChildren();status.textContent='3D unavailable';card.dataset.guideStatus='error';
        card.querySelector('.eg-hint').textContent='You can still follow the steps below.';
        card.querySelector('.eg-controls').hidden=true;card.querySelector('.eg-angles').hidden=true;
      }
      entry.fail=fail;
      if(!navigator.onLine){fail();return;}
      entry.timeout=setTimeout(fail,45000);
      await viewer();if(!owned(entry))return;
      const model=document.createElement('model-viewer');entry.model=model;
      model.setAttribute('alt',`${guide.name} demonstration. Drag or use arrow keys to rotate; scroll or pinch to zoom.`);
      model.tabIndex=0;model.setAttribute('camera-controls','');model.setAttribute('touch-action','pan-y');model.setAttribute('disable-pan','');
      model.setAttribute('environment-image','neutral');model.setAttribute('shadow-intensity','0.9');model.setAttribute('shadow-softness','1');model.setAttribute('field-of-view','32deg');
      model.setAttribute('min-camera-orbit','auto 30deg 1.2m');model.setAttribute('max-camera-orbit','auto 90deg 5m');
      model.setAttribute('camera-target',presentation.cameraTarget);model.setAttribute('interaction-prompt','auto');
      function radius(){return `${Math.min(4.9,presentation.radiusMetres*(presentation.layout==='floor'?Math.max(1,420/(model.clientWidth||420)):1))}m`;}
      function defaultOrbit(){const parts=presentation.cameraOrbit.split(' ');parts[2]=radius();return parts.join(' ');}
      function camera(orbit){model.cameraOrbit=orbit;model.cameraTarget=presentation.cameraTarget;model.jumpCameraToGoal();}
      function playback(){
        if(!owned(entry)||!entry.ready)return;
        if(entry.wantsPlayback&&!document.hidden)model.play();else model.pause();
        play.textContent=entry.wantsPlayback?'Pause demonstration':'Play demonstration';
        status.textContent=entry.wantsPlayback&&!document.hidden?'Playing':'Paused';
      }
      model.addEventListener('load',async()=>{
        if(!owned(entry))return;
        model.animationName=animation.clip;await model.updateComplete;if(!owned(entry))return;
        clearTimeout(entry.timeout);entry.ready=true;model.timeScale=Number(speed.value);camera(defaultOrbit());
        card.dataset.guideStatus='ready';card.querySelector('.eg-controls').hidden=false;card.querySelector('.eg-angles').hidden=false;playback();
      },{signal:entry.abort.signal});
      model.addEventListener('error',fail,{signal:entry.abort.signal});
      model.addEventListener('progress',e=>{if(owned(entry)&&!entry.ready)status.textContent=`Loading ${Math.round(e.detail.totalProgress*100)}%`;},{signal:entry.abort.signal});
      const angles=[...card.querySelectorAll('[data-eg-angle]')];const clearAngles=()=>angles.forEach(b=>b.setAttribute('aria-pressed','false'));
      model.addEventListener('camera-change',e=>{if(e.detail.source==='user-interaction')clearAngles();},{signal:entry.abort.signal});
      play.addEventListener('click',()=>{entry.wantsPlayback=!entry.wantsPlayback;playback();},{signal:entry.abort.signal});
      speed.addEventListener('change',()=>{model.timeScale=Number(speed.value);},{signal:entry.abort.signal});
      for(const button of angles)button.addEventListener('click',()=>{clearAngles();button.setAttribute('aria-pressed','true');camera(`${button.dataset.egAngle}deg 78deg ${radius()}`);},{signal:entry.abort.signal});
      card.querySelector('.eg-reset').addEventListener('click',()=>{clearAngles();camera(defaultOrbit());},{signal:entry.abort.signal});
      document.addEventListener('visibilitychange',playback,{signal:entry.abort.signal});
      view.append(model);model.setAttribute('camera-orbit',defaultOrbit());model.src=new URL(variant.asset,base).href;
    }catch{
      if(owned(entry)&&entry.fail)entry.fail();
      // Registry/viewer failure never removes or blocks the existing written guide.
    }
  }
  window.StrongStartExerciseGuides=Object.freeze({attach,dispose});
})();
