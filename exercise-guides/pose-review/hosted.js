/* Optional private hosted authoring adapter. Public preview/local mode stay separate. */
window.poseHosted=(()=>{
 const $=s=>document.querySelector(s);
 const el=(tag,text)=>{const e=document.createElement(tag);if(text)e.textContent=text;return e;};
 const message=s=>{$('#message').textContent=s;$('#message').hidden=false;};
 async function connect(){
  if(['localhost','127.0.0.1','[::1]','strongstart.app','knitko95.github.io'].includes(location.hostname))return null;
  const config=await fetch('/api/pose-review/config',{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null);if(!config?.hosted){if(location.hostname==='dev.strongstart.app')throw Error('The shared workspace is unavailable. Retry later; reviews have not been switched to browser-only storage.');return null;}
  const response=await fetch('/api/pose-review/state',{cache:'no-store'});if(response.ok)return response.json();
  if(response.status!==401)throw Error('The shared workspace is unavailable. Your saved records have not been replaced.');
  $('#storage-mode').textContent='Private hosted workspace';$('#storage-detail').textContent='Sign in with your authorized Google account to review the shared demonstrations.';$('#exercise-list').replaceChildren();
  const panel=el('div'),button=el('button','Sign in with Google');panel.className='panel';panel.append(el('h2','Sign in to exercise review'),el('p','Artwork, notes, reference images and decisions are shared privately across computers.'),button);$('#exercise-detail').replaceChildren(panel);
  if(!window.supabase)await new Promise((resolve,reject)=>{const s=el('script');s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.4/dist/umd/supabase.min.js';s.onload=resolve;s.onerror=()=>reject(Error('Sign-in library unavailable'));document.head.append(s);});
  const client=window.supabase.createClient(config.auth.url,config.auth.key,{auth:{storageKey:'strongstart_pose_auth_v1',persistSession:true,flowType:'pkce'}});
  const session=(await client.auth.getSession()).data.session;
  if(session){const r=await fetch('/api/pose-review/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({accessToken:session.access_token})});if(r.ok){history.replaceState(null,'',location.pathname);await client.auth.signOut({scope:'local'});location.reload();return false;}message((await r.json()).error||'This account cannot access exercise review.');await client.auth.signOut({scope:'local'});}
  button.addEventListener('click',async()=>{const {error}=await client.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin+location.pathname,queryParams:{prompt:'select_account'}}});if(error)message(error.message);});return false;
 }
 function controls(api){
  if($('#hosted-controls'))return;$('#import-trigger').hidden=true;const out=el('div'),agents=el('details'),summary=el('summary','Agent access'),name=el('input'),create=el('button','Create or replace 30-day credential'),list=el('div'),secret=el('textarea'),logout=el('button','Sign out');out.id='hosted-controls';out.className='file-actions';name.placeholder='Agent name, e.g. generator-1';name.setAttribute('aria-label','Agent name');secret.setAttribute('aria-label','New agent credential');secret.readOnly=true;secret.hidden=true;
  const refresh=async()=>{try{const data=await api('agents');list.replaceChildren(...data.agents.map(a=>{const p=el('p',a.worker+' · expires '+new Date(a.expires).toLocaleDateString()+' '),revoke=el('button','Revoke '+a.worker);revoke.addEventListener('click',async()=>{try{await api('agent-revoke',{worker:a.worker});await refresh();}catch(e){message(e.message);}});p.append(revoke);return p;}));}catch(e){message(e.message);}};
  create.addEventListener('click',async()=>{try{const data=await api('agent-create',{worker:name.value});secret.value=data.token;secret.hidden=false;message('Copy this credential into your agent’s private environment now. It can generate and audit, but cannot approve artwork. Replacing a credential revokes its predecessor.');await refresh();}catch(e){message(e.message);}});
  logout.addEventListener('click',async()=>{try{await api('logout',{});location.reload();}catch(e){message(e.message);}});agents.append(summary,el('p','Use a distinct credential for each generator and auditor. Credentials cannot make owner review decisions.'),name,create,secret,list);agents.addEventListener('toggle',()=>{if(agents.open)refresh();else{secret.value='';secret.hidden=true;}});out.append(agents,logout);$('.page-header').append(out);
 }
 return {connect,controls};
})();
