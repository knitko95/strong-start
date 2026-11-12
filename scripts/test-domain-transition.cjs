// Real browser at simulated domain origins. All external calls are intercepted;
// no production account, Auth request, email or database mutation is made.
const {chromium}=require('playwright');
const fs=require('node:fs'), path=require('node:path'), assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const sdk=`window.supabase={createClient(url){window.testBackend=url;return {auth:{
 onAuthStateChange(){},getSession:async()=>({data:{session:null}}),
 signInWithOAuth:async p=>{window.testOAuth=p;return {error:null}},
 resetPasswordForEmail:async(e,p)=>{window.testReset=p;return {error:null}}
}}}};`;
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const results=[];
 try {
  for(const [origin,dir,production] of [
   ['https://strongstart.app','dist-production',true],
   ['https://knitko95.github.io/strong-start','dist-production',true],
   ['https://strongstart.app','dist',false],
   ['https://strong-start-dev.pages.dev','dist',false]
  ]) for(const width of [1280,390,320]) {
   const context=await browser.newContext({viewport:{width,height:844},serviceWorkers:'block'});
   const page=await context.newPage(),errors=[],unexpected=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
   await context.route('**/*',async route=>{
    const url=new URL(route.request().url());
    if(url.href.includes('supabase.min.js')) return route.fulfill({contentType:'application/javascript',body:sdk});
    if(url.hostname.endsWith('.supabase.co')) {
     if(url.pathname!=='/auth/v1/settings') unexpected.push(url.origin+url.pathname);
     return route.fulfill({contentType:'application/json',body:JSON.stringify({external:{google:true}})});
    }
    if(url.origin===new URL(origin).origin){
     let rel=url.pathname.slice(new URL(origin+'/').pathname.length)||'index.html';
     const file=path.resolve(root,dir,rel);
     if(!file.startsWith(path.resolve(root,dir)+path.sep)) return route.abort();
     return route.fulfill({path:file,contentType:rel.endsWith('.html')?'text/html':rel.endsWith('.js')?'application/javascript':rel.endsWith('.webmanifest')?'application/manifest+json':rel.endsWith('.png')?'image/png':'image/svg+xml'});
    }
    return route.fulfill({body:''});
   });
   await page.goto(origin+'/?invite=SYNTHETIC123');
   await page.waitForFunction(()=>AUTH.ready&&AUTH.google);
   assert.equal(await page.evaluate(()=>APP_ENV),production?'production':'development');
   assert.match(await page.evaluate(()=>testBackend),production?/aybtxqsneywuqxzjwoek/:/gvyfgqhgqnfmtoytqpeo/);
   assert.equal(await page.locator('#environment-banner').count(),production?0:1);
   assert.equal(await page.evaluate(()=>localStorage.getItem(storageKey(INVITE_KEY))),'SYNTHETIC123');
   assert.equal(new URL(page.url()).search,'');
   assert.equal(await page.evaluate(()=>inviteLink('SYNTHETIC456')),origin+'/?invite=SYNTHETIC456');
   assert.equal(await page.locator('link[rel="manifest"]').getAttribute('href'),production?'manifest.webmanifest':'manifest.dev.webmanifest');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   await page.locator('[data-action="authgoogle"]').click();
   assert.equal(await page.evaluate(()=>testOAuth.options.redirectTo),origin+'/');
   // Exercise the real reset handler with a synthetic email and transport stub.
   await page.evaluate(async()=>{AUTH.busy=false;AUTH.mode='forgot';AUTH.email='domain-test@example.invalid';render();await authSubmit('forgot')});
   assert.equal(await page.evaluate(()=>testReset.redirectTo),origin+'/');
   // Existing plans/drafts keep the current key and survive a reload at the new origin.
   await page.evaluate(()=>{sb=null;lsSet(LOCAL_ONLY_KEY,'1');state=defaults();state.setup=null;state.onboarded=true;state.settings.days=[1,4];state.settings.split='ul2';state.settings.goals=['muscle'];state.places=[{k:'gym',n:'Gym',eq:PLACE_TYPES.gym.eq.split(' ')}];state.curPlace='gym';newBlock();startWorkout(weekKeys()[0]);state.draft.paused=true;persistLocal()});
   const draft=await page.evaluate(()=>JSON.parse(localStorage.getItem(LS)).state.draft);
   await page.reload();await page.waitForFunction(()=>AUTH.ready);
   const restored=await page.evaluate(()=>state.draft);
   for(const key of ['key','block','week','startedAt','paused','sets','shape','planCounts'])
    assert.deepEqual(restored[key],draft[key],`saved workout ${key} survives reload`);
   assert.deepEqual(errors,[]);assert.deepEqual(unexpected,[]);
   results.push({origin,dir,width,production,redirects:true,invite:true,draftReload:true,errors});
   await context.close();
  }
  if(process.argv[2]) {
   const base=process.argv[2];
   for(const file of ['','index.html','privacy.html','manifest.webmanifest','sw.js','offline.js','icons/icon-192.png']) {
    const response=await fetch(base+'/'+file);assert.equal(response.status,200,file);
    assert.equal(response.redirected,false,`${file} must stay directly fetchable for offline precaching`);
    if(file==='')assert.equal((await response.text()).replace(/\r\n/g,'\n'),fs.readFileSync(path.join(root,'dist-production/index.html'),'utf8').replace(/\r\n/g,'\n'));
    assert.match(response.headers.get('cache-control'),/no-cache/);
   }
   assert.equal((await fetch(base+'/docs/ARCHITECTURE.md')).status,404);
   const manifest=await (await fetch(base+'/manifest.webmanifest')).json();
   assert.equal(new URL(manifest.start_url,base+'/manifest.webmanifest').pathname,'/');
   assert.equal(new URL(manifest.scope,base+'/manifest.webmanifest').pathname,'/');
  }
  fs.mkdirSync(path.join(root,'test-results'),{recursive:true});
  fs.writeFileSync(path.join(root,'test-results/domain-transition.json'),JSON.stringify(results,null,2));
  console.log(`Passed ${results.length} domain/browser scenarios; no production requests. Hosting checks: ${!!process.argv[2]}`);
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
