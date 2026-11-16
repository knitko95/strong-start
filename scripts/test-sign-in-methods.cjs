// Synthetic Auth transport. No real accounts, credentials or provider mutations.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),dist=path.join(root,'dist');
const server=http.createServer((req,res)=>{try{const file=path.join(dist,req.url.split('?')[0]==='/'?'index.html':req.url.split('?')[0]);res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.json':'application/json','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end();}});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const url=process.argv[2]||`http://127.0.0.1:${server.address().port}/`;
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{for(const width of [1280,390,320]){
  const context=await browser.newContext({viewport:{width,height:844}}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.route('**/*',r=>new URL(r.request().url()).origin===new URL(url).origin?r.continue():r.fulfill({status:200,body:''}));
  const response=await page.goto(url);
  assert.equal((await response.text()).replace(/\r\n/g,'\n'),fs.readFileSync(path.join(dist,'index.html'),'utf8').replace(/\r\n/g,'\n'),'exact built candidate');
  await page.waitForFunction(()=>state!==null&&DEVICE.pending===0);
  await page.evaluate(()=>{
   state=defaults();state.setup=null;state.onboarded=true;state.settings.name='Synthetic member';
   logs=[{id:'synthetic-history',status:'complete',entries:[]}];state.draft={id:'synthetic-draft',marker:'keep'};
   window.authCalls=[];window.flushes=0;window.linkError=null;window.unlinkError=null;window.flushOK=true;
   window.authUser={id:'synthetic-member',email:'member@example.invalid',identities:[{id:'google-id',identity_id:'google-id',provider:'google',identity_data:{email:'member@example.invalid',email_verified:true}}]};
   sb={auth:{
    getUser:async()=>({data:{user:structuredClone(window.authUser)}}),
    linkIdentity:async p=>{window.authCalls.push({method:'link',p});if(window.captureLinkState)await window.captureLinkState({marker:readAccountLink(),call:authCalls.at(-1),flushes});return {error:window.linkError,data:{url:p.provider==='apple'?'https://appleid.apple.com/auth/authorize?synthetic=1':'https://accounts.google.com/o/oauth2/v2/auth?synthetic=1'}};},
    unlinkIdentity:async i=>{window.authCalls.push({method:'unlink',i});if(!window.unlinkError)window.authUser.identities=window.authUser.identities.filter(x=>x.identity_id!==i.identity_id);return {error:window.unlinkError};},
    signInWithOAuth:async p=>{window.authCalls.push({method:'signin',p});throw Error('Synthetic network failure');},
    signOut:async()=>{window.authCalls.push({method:'signout'});return {};},
    getSession:async()=>({data:{session:{user:structuredClone(window.authUser)}}}),onAuthStateChange:fn=>{window.authEvent=fn;}
   }};
   flushCloud=async()=>{window.flushes++;return window.flushOK;};
   AUTH.user=structuredClone(window.authUser);AUTH.ready=true;AUTH.access='ok';AUTH.google=true;AUTH.apple=false;AUTH.emailEnabled=true;AUTH.providersReady=true;
   SYNC.owner=AUTH.user.id;lsSet(ACCT_KEY,JSON.stringify(AUTH.user));lsSet('strongstart_owner',AUTH.user.id);
   ui.tab='settings';ui.settingsGroup='account';ui.open={account:true};persistLocal();render();
  });
  const baseline=await page.evaluate(()=>JSON.stringify({state,logs,owner:SYNC.owner}));
  await page.getByRole('button',{name:'Sign-in methods',exact:true}).click();
  await page.getByText('Google · Connected',{exact:true}).waitFor();
  assert(await page.getByRole('button',{name:'Disconnect Google',exact:true}).isDisabled());
  assert(await page.getByRole('button',{name:'Connect Apple',exact:true}).isDisabled());
  assert(await page.getByText('Apple is awaiting setup on the test app.',{exact:true}).isVisible());
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  // Fresh identity data is escaped and different provider emails are displayed.
  await page.evaluate(()=>{AUTH.apple=true;window.authUser.identities.push({id:'apple-id',identity_id:'apple-id',provider:'apple',identity_data:{email:'<img src=x onerror=alert(1)>@privaterelay.appleid.com'}});});
  await page.getByRole('button',{name:'Refresh methods',exact:true}).click();
  await page.getByText('Apple · Connected',{exact:true}).waitFor();
  assert.equal(await page.locator('[role="dialog"] img').count(),0);
  assert(await page.getByRole('button',{name:'Disconnect Google',exact:true}).isEnabled());
  await page.getByRole('button',{name:'Disconnect Apple',exact:true}).click();
  await page.getByRole('button',{name:'Cancel',exact:true}).click();
  assert.equal(await page.evaluate(()=>authCalls.filter(c=>c.method==='unlink').length),0);
  await page.evaluate(()=>signInMethods());
  await page.getByRole('button',{name:'Disconnect Apple',exact:true}).click();
  await page.getByRole('button',{name:'Disconnect',exact:true}).click();
  await page.getByText('Apple disconnected.',{exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>authCalls.filter(c=>c.method==='unlink').length),1);
  assert.equal(await page.evaluate(()=>JSON.stringify({state,logs,owner:SYNC.owner})),baseline);
  // Manual linking disabled / existing identity / rejected request / failed sync.
  for(const [error,text] of [[{code:'manual_linking_disabled'},'Connecting sign-ins is awaiting setup'],[{code:'identity_already_exists'},'already connected to an account'],[{message:'Synthetic network failure'},'Couldn’t update your sign-in']]){
   await page.evaluate(e=>{window.linkError=e;},error);
   await page.getByRole('button',{name:'Connect Apple',exact:true}).click();
   await page.getByRole('alert').filter({hasText:text}).waitFor();
   assert.equal(await page.evaluate(()=>readAccountLink()),null);
   assert(await page.getByRole('button',{name:'Connect Apple',exact:true}).isEnabled());
  }
  const linksBefore=await page.evaluate(()=>authCalls.filter(c=>c.method==='link').length);
  await page.evaluate(()=>window.flushOK=false);
  await page.getByRole('button',{name:'Connect Apple',exact:true}).click();
  await page.getByRole('alert').filter({hasText:'need to sync'}).waitFor();
  assert.equal(await page.evaluate(()=>authCalls.filter(c=>c.method==='link').length),linksBefore);
  await page.evaluate(()=>{window.flushOK=true;AUTH.coach=true;showSignInMethods();});
  assert(await page.getByRole('button',{name:'Disconnect Google',exact:true}).isDisabled());
  await page.evaluate(()=>{AUTH.coach=false;FB.owner=true;showSignInMethods();});
  assert(await page.getByRole('button',{name:'Disconnect Google',exact:true}).isDisabled());
  // Fresh lookup prevents unlinking the final method even if the sheet was stale.
  await page.evaluate(async()=>{FB.owner=false;SIGNINS.identities.push({identity_id:'stale-apple',provider:'apple'});await disconnectSignIn('google','google-id',AUTH.user.id);});
  await page.getByRole('alert').filter({hasText:'Keep at least one'}).waitFor();
  assert.equal(await page.evaluate(()=>authCalls.filter(c=>c.method==='unlink').length),1);
  // Preview guards reject direct function calls as well as delegated UI actions.
  assert.equal(await page.evaluate(async()=>{const n=authCalls.length;coachMode={uid:'other-member'};await connectSignIn('apple');await disconnectSignIn('google','google-id',AUTH.user.id);coachMode=null;return authCalls.length===n;}),true);
  assert.equal(await page.evaluate(()=>JSON.stringify({state,logs,owner:SYNC.owner})),baseline);
  // Valid OAuth return retains user ID and workout objects, reopening account settings.
  await page.evaluate(async()=>{
   window.onSignedInCalls=[];onSignedIn=async u=>{window.onSignedInCalls.push(u.id);AUTH.user=u;AUTH.access='ok';};
   window.authUser.identities.push({identity_id:'apple-id',provider:'apple',identity_data:{email:'relay@privaterelay.appleid.com'}});
   pendingAccountLink={uid:AUTH.user.id,provider:'apple',started:Date.now()};sessionStorage.setItem(LINK_KEY,JSON.stringify(pendingAccountLink));await finishAccountLink();
  });
  await page.getByText('Apple is connected to this account.',{exact:true}).waitFor();
  assert.equal(await page.evaluate(()=>readAccountLink()),null);
  assert.equal(await page.evaluate(()=>JSON.stringify({state,logs,owner:SYNC.owner})),baseline);
  // A cancelled return keeps the original account and presents a useful message.
  await page.evaluate(async()=>{window.authUser.identities=window.authUser.identities.filter(i=>i.provider!=='apple');pendingAccountLink={uid:AUTH.user.id,provider:'apple',started:Date.now()};await finishAccountLink();});
  await page.getByText('Connection cancelled. Your existing sign-in still works.',{exact:true}).waitFor();
  // Same-ID refresh updates identities without calling onSignedIn; changed IDs clear access/roles.
  await page.evaluate(async()=>{await initRemote();window.onSignedInCalls=[];window.authEvent('USER_UPDATED',{user:{...window.authUser,identities:[...window.authUser.identities,{provider:'apple'}]}});});
  assert.equal(await page.evaluate(()=>AUTH.user.identities.some(i=>i.provider==='apple')),true);
  assert.deepEqual(await page.evaluate(()=>window.onSignedInCalls),[]);
  // Returning as another account must not call onSignedIn or change saved workout data.
  await page.evaluate(async()=>{AUTH.coach=true;FB.owner=true;pendingAccountLink={uid:AUTH.user.id,provider:'apple',started:Date.now()};window.authUser={id:'unexpected-account',identities:[{provider:'apple'}]};window.onSignedInCalls=[];await finishAccountLink();});
  assert.equal(await page.evaluate(()=>AUTH.user),null);
  assert.deepEqual(await page.evaluate(()=>window.onSignedInCalls),[]);
  assert.equal(await page.evaluate(()=>JSON.stringify({state,logs,owner:SYNC.owner})),baseline);
  assert.equal(await page.evaluate(()=>AUTH.coach||FB.owner||CLOUD.ok),false);
  await page.getByRole('alert').filter({hasText:'Sign in with your original method'}).waitFor();
  // Apple sign-in uses the configured provider and current-origin redirect, with retry after rejection.
  await page.evaluate(()=>{AUTH.apple=true;AUTH.google=true;AUTH.busy=false;render();});
  await page.getByRole('button',{name:'Continue with Apple',exact:true}).click();
  await page.getByRole('alert').filter({hasText:'Check your connection'}).waitFor();
  assert.equal(await page.evaluate(()=>authCalls.at(-1).p.provider),'apple');
  assert.equal(await page.evaluate(()=>authCalls.at(-1).p.options.redirectTo),url);
  assert(await page.getByRole('button',{name:'Continue with Apple',exact:true}).isEnabled());
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  // Enabled/verified email is a fallback; an unverified email is not.
  assert.deepEqual(await page.evaluate(()=>{
   const g={identity_id:'g',provider:'google'},e={identity_id:'e',provider:'email',identity_data:{email_verified:false}};
   const unverified=canDisconnect(g,[g,e]);e.identity_data.email_verified=true;
   return {unverified,verified:canDisconnect(g,[g,e])};
  }),{unverified:false,verified:true});
  fs.mkdirSync(path.join(root,'test-results'),{recursive:true});
  await page.screenshot({path:path.join(root,`test-results/sign-in-${width}.png`),fullPage:true});
  assert.deepEqual(errors,[]);
  // Successful initiation stores the expected ID before following the Auth URL.
  let redirectState;
  await page.exposeFunction('captureLinkState',data=>{redirectState=data;});
  await page.route('https://appleid.apple.com/auth/authorize?*',async route=>{
   await route.fulfill({status:200,contentType:'text/html',body:'<p>Provider redirect reached</p>'});
  });
  await page.evaluate(async()=>{
   AUTH.user={id:'synthetic-member',identities:[{identity_id:'g',provider:'google'}]};window.authUser=structuredClone(AUTH.user);AUTH.access='ok';AUTH.apple=true;AUTH.google=true;
   Object.assign(SIGNINS,{uid:AUTH.user.id,busy:false,loading:false});window.linkError=null;window.flushOK=true;closeModal();await connectSignIn('apple');
  });
  await page.getByText('Provider redirect reached',{exact:true}).waitFor();
  assert.equal(redirectState.marker.uid,'synthetic-member');assert.equal(redirectState.marker.provider,'apple');
  assert.equal(redirectState.call.p.options.redirectTo,url);assert.equal(redirectState.call.p.options.skipBrowserRedirect,true);assert(redirectState.flushes>0);
  console.log(JSON.stringify({width,exactBuild:true,availability:true,escapedIdentities:true,disconnect:true,lastMethodGuard:true,staffGoogleGuard:true,previewGuard:true,linkErrors:true,syncGuard:true,callbackIdentityGuard:true,preservedWorkout:true,errors}));
  await context.close();
 }}finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
