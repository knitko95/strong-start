/* Approved public pose pairs only. No account, plan or workout storage access. */
(()=>{
 'use strict';
 const base=new URL('poses/',document.currentScript.src),pairs=new Map();let cataloguePromise;
 async function catalogue(){
  if(!cataloguePromise)cataloguePromise=fetch(new URL('catalogue.v1.json',base),{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Pose catalogue unavailable');return r.json();}).then(data=>{
   if(data.schemaVersion!==1||!data.exercises)throw Error('Invalid pose catalogue');
   for(const entry of Object.values(data.exercises)){
    if(entry.review!=='owner-approved'||entry.frames?.length!==2||entry.timingMs!==900||!entry.frames.every(f=>/^assets\/[a-z0-9-]+\.[a-f0-9]{12}\.webp$/.test(f.asset)&&f.width>0&&f.height>0))throw Error('Invalid approved pose pair');
   }return data;
  }).catch(e=>{cataloguePromise=null;throw e;});
  return cataloguePromise;
 }
 async function find(id,environment){const entry=(await catalogue()).exercises[id];return entry?.enabledEnvironments.includes(environment)?entry:null;}
 function loadImage(frame){return new Promise((resolve,reject)=>{
  const image=new Image();image.decoding='async';let done=false;
  const timeout=setTimeout(()=>finish(Error('Pose image timeout')),15000);
  function finish(error){if(done)return;done=true;clearTimeout(timeout);image.onload=image.onerror=null;if(error)reject(error);else resolve(image);}
  image.onload=()=>{if(image.naturalWidth!==frame.width||image.naturalHeight!==frame.height){finish(Error('Pose dimensions mismatch'));return;}image.decode().then(()=>finish(),finish);};
  image.onerror=()=>finish(Error('Pose image unavailable'));image.src=new URL(frame.asset,base).href;
 });}
 function loadPair(entry){
  const key=entry.frames.map(f=>f.asset).join('|');
  if(!pairs.has(key)){
   const task=Promise.all(entry.frames.map(loadImage)).catch(e=>{pairs.delete(key);throw e;});pairs.set(key,task);
   while(pairs.size>4)pairs.delete(pairs.keys().next().value);
  }return pairs.get(key);
 }
 async function preload(id,environment){try{const entry=await find(id,environment);if(entry)await loadPair(entry);}catch{}}
 async function mount(view,entry,{suspended=false,isCurrent=()=>true}={}){
  // Both files are loaded and decoded before either pose enters the layout.
  const images=await loadPair(entry),abort=new AbortController(),motion=matchMedia('(prefers-reduced-motion: reduce)');
  if(!isCurrent())throw new DOMException('Cancelled pose mount','AbortError');
  const stage=document.createElement('div');stage.className='pose-stage';stage.setAttribute('role','img');stage.setAttribute('aria-label',entry.name+' demonstration, showing two exercise positions.');
  for(const source of images){const image=document.createElement('img');image.src=source.src;image.alt='';image.width=source.naturalWidth;image.height=source.naturalHeight;image.draggable=false;image.hidden=true;stage.append(image);}
  let phase=0,timer,disposed=false,visible=true,paused=suspended;const frames=[...stage.children];
  function display(){frames.forEach((image,i)=>image.hidden=i!==phase);stage.dataset.pose=String(phase);}
  function refresh(){clearTimeout(timer);if(disposed)return;if(motion.matches){phase=0;display();}const running=!motion.matches&&!document.hidden&&!paused&&visible;stage.dataset.playing=String(running);if(running)timer=setTimeout(()=>{phase=1-phase;display();refresh();},entry.timingMs);}
  display();view.replaceChildren(stage);
  const observer=typeof IntersectionObserver==='function'?new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;refresh();}):null;observer?.observe(stage);
  document.addEventListener('visibilitychange',refresh,{signal:abort.signal});motion.addEventListener('change',refresh,{signal:abort.signal});refresh();
  return {suspend(value){paused=!!value;refresh();},unmount(){disposed=true;clearTimeout(timer);observer?.disconnect();abort.abort();stage.remove();}};
 }
 window.StrongStartPoseDemos=Object.freeze({find,mount,preload});
})();
