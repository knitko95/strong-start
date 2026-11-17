/* Display preferences only. Never read account, profile, plan or workout data. */
(() => {
  'use strict';
  const BUILD_ENV = 'auto';
  const base=new URL('./',document.currentScript.src);
  const production=BUILD_ENV==='auto'&&((base.origin==='https://strongstart.app'&&base.pathname==='/')||(base.origin==='https://knitko95.github.io'&&base.pathname==='/strong-start/'));
  const key=(BUILD_ENV==='demo'?'dev2_demo_':production?'':'dev_')+'strongstart_appearance_v1';
  const root=document.documentElement;
  const policy=root.classList.contains('policy-page');
  const clean=value=>({theme:['light','dark'].includes(value?.theme)?value.theme:'auto',color:['green','blue','noir'].includes(value?.color)?value.color:'blush'});
  function apply(value){
    if(value.theme==='auto')delete root.dataset.theme;else root.dataset.theme=value.theme;
    if(value.color==='blush')delete root.dataset.color;else root.dataset.color=value.color;
  }
  function restore(){
    let value;
    try{value=JSON.parse(localStorage.getItem(key));}catch{}
    apply(clean(value));
  }
  function set(value,persist=true){
    const chosen=clean(value);apply(chosen);
    if(persist)try{const serialized=JSON.stringify(chosen);if(localStorage.getItem(key)!==serialized)localStorage.setItem(key,serialized);}catch{}
  }
  window.StrongStartAppearance={set};
  restore();
  if(policy){
    window.addEventListener('pageshow',restore);
    window.addEventListener('storage',event=>{if(event.key===key||event.key===null)restore();});
    document.addEventListener('click',event=>{
      const link=event.target.closest('[data-app-return]');
      if(!link||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
      try{
        const from=new URL(document.referrer);
        if(from.origin===base.origin&&[base.pathname,base.pathname+'index.html'].includes(from.pathname)&&history.length>1){event.preventDefault();history.back();}
      }catch{}
    });
  }
})();
