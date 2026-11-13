/* One persistent public-media renderer. Never reads account, plan or workout data. */
(()=>{
 'use strict';
 const base=new URL('./',document.currentScript.src),active=new Map();let manifestPromise,playerPromise,owner,covered=false,serial=0;
 const available=e=>!!e?.mount&&active.get(e.surface)===e&&e.mount.isConnected&&!e.cancelled;
 const manifest=()=>manifestPromise??=(fetch(new URL('shared/manifest.json',base),{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Animation catalogue unavailable');return r.json();}).catch(e=>{manifestPromise=null;throw e;}));
 const player=()=>playerPromise??=import(new URL('shared/player.js',base).href).catch(e=>{playerPromise=null;throw e;});
 async function show(entry){
  if(!available(entry))return;const version=++serial;
  try{
   const runtime=await player();if(!available(entry)||version!==serial)return;
   if(owner&&owner!==entry)owner.playing=runtime.isPlaying();owner=entry;
   await runtime.mount(entry.view,entry.id,{inline:entry.surface==='workout',gallery:entry.gallery,playing:entry.playing});
   if(!available(entry)||version!==serial)return;
   entry.card.dataset.guideStatus='ready';entry.card.querySelector('.eg-status').hidden=true;runtime.suspend(document.hidden||(entry.surface==='workout'&&covered));
  }catch{if(available(entry)&&version===serial){entry.card.dataset.guideStatus='error';entry.view.innerHTML='<p class="eg-shared-error">Demonstration unavailable. You can still follow the written steps.</p>';entry.card.querySelector('.eg-status').hidden=true;}}
 }
 function dispose(surface){
  if(!surface){for(const key of [...active.keys()])dispose(key);return;}
  const entry=active.get(surface);if(!entry)return;active.delete(surface);entry.cancelled=true;entry.observer.disconnect();
  if(owner===entry){owner=null;serial++;playerPromise?.then(runtime=>runtime.unmount());}
  entry.mount.replaceChildren();entry.mount.parentElement?.classList.remove('has-demo');
  if(surface==='modal'&&available(active.get('workout')||{}))show(active.get('workout'));
 }
 async function attach({exerciseId,mount,environment,mode='guide',gallery=false}){
  const surface=mode==='workout'?'workout':'modal';dispose(surface);if(!mount)return;
  if(environment!=='development'){mount.hidden=true;return;}
  const entry={id:exerciseId,mount,surface,gallery,playing:!matchMedia('(prefers-reduced-motion: reduce)').matches};active.set(surface,entry);
  entry.observer=new MutationObserver(()=>{if(!mount.isConnected)dispose(surface);});entry.observer.observe(document.body,{childList:true,subtree:true});
  try{
   const data=await manifest();if(!available(entry))return;
   if(!gallery&&!data.exercises.some(e=>e.id===exerciseId&&e.enabledEnvironments.includes(environment))){mount.hidden=true;return;}
   const card=document.createElement('section');card.className='eg-demo'+(surface==='workout'?' eg-inline':'');card.dataset.exerciseGuide=exerciseId||'gallery';card.setAttribute('aria-label',gallery?'All exercise demonstrations':'3D exercise demonstration');
   card.innerHTML='<span class="eg-status" role="status">Loading demonstration…</span><div class="eg-view"></div>'+(surface==='workout'?'<button type="button" class="eg-expand" aria-expanded="false" aria-label="Expand demonstration">⤢</button>':'');
   card.addEventListener('click',e=>e.stopPropagation());card.addEventListener('input',e=>e.stopPropagation());card.addEventListener('change',e=>e.stopPropagation());
   card.querySelector('.eg-expand')?.addEventListener('click',e=>{const value=card.classList.toggle('expanded');e.currentTarget.setAttribute('aria-expanded',String(value));e.currentTarget.setAttribute('aria-label',value?'Collapse demonstration':'Expand demonstration');});
   mount.hidden=false;mount.replaceChildren(card);entry.card=card;entry.view=card.querySelector('.eg-view');if(surface==='workout')mount.parentElement?.classList.add('has-demo');
   // A background workout may rerender while its instructions remain open.
   if(surface==='workout'&&active.has('modal'))return;await show(entry);
  }catch{if(available(entry))mount.hidden=true;}
 }
 function suspendWorkout(value){covered=!!value;if(owner?.surface==='workout')playerPromise?.then(runtime=>runtime.suspend(covered||document.hidden));}
 window.StrongStartExerciseGuides=Object.freeze({attach,dispose,suspendWorkout});
 document.dispatchEvent(new Event('exercise-guides-ready'));
})();
