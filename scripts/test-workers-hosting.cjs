// Read-only hosting checks. No credentials, real invites, emails or DB writes.
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
(async()=>{
 const url=process.argv[2]||'https://dev.strongstart.app/';
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const results=[];
 try {
  for(const width of [1280,390,320]) {
   const context=await browser.newContext({viewport:{width,height:844}}),page=await context.newPage(),errors=[],backends=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('request',r=>{if(new URL(r.url()).hostname.endsWith('.supabase.co'))backends.push(r.url())});
   await page.goto(url);await page.waitForFunction(()=>AUTH.ready&&AUTH.google);
   assert.equal(await page.evaluate(()=>APP_ENV),'development');
   assert.equal(await page.evaluate(()=>LS),'dev_strongstart_state_v3');
   assert.match(await page.locator('#environment-banner').innerText(),/TESTING/);
   assert.equal(await page.locator('link[rel="manifest"]').getAttribute('href'),'manifest.dev.webmanifest');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   const assets=['index.html','privacy.html','manifest.webmanifest','manifest.dev.webmanifest','sw.js','offline.js','icons/icon-192.png'];
   for(const file of ['',...assets]) {
    const response=await context.request.get(new URL(file,url).href,{maxRedirects:0});
    assert.equal(response.status(),200,file);
    assert.match(response.headers()['cache-control'],/no-cache/);
    assert.match(response.headers()['x-content-type-options'],/nosniff/);
    assert.match(response.headers()['x-robots-tag'],/noindex/);
    const local=fs.readFileSync(path.join(root,'dist',file||'index.html'));
    const actual=await response.body();
    if(file.endsWith('.png'))assert.deepEqual(actual,local);
    else assert.equal(actual.toString().replace(/\r\n/g,'\n'),local.toString().replace(/\r\n/g,'\n'),file);
   }
   assert.equal((await context.request.get(new URL('docs/ARCHITECTURE.md',url).href)).status(),404);
   await page.waitForFunction(()=>navigator.serviceWorker.controller,{},{timeout:30000});
   const cache=await page.evaluate(async()=>{
    const keys=await caches.keys(),shell=await caches.open(keys.find(k=>k.startsWith('strong-start-shell-')));
    const response=await shell.match(new URL('index.html',location.href));
    return {hasIndex:!!response,redirected:response?.redirected};
   });
   assert.deepEqual(cache,{hasIndex:true,redirected:false});
   await context.setOffline(true);await page.reload();await page.waitForFunction(()=>AUTH.ready);
   assert.equal(await page.locator('#offline-notice').isVisible(),true);
   assert.equal(await page.getByRole('heading',{name:'Sign in',exact:true}).isVisible(),true);
   await context.setOffline(false);await page.reload();await page.waitForFunction(()=>AUTH.ready&&AUTH.google);
   assert.equal(await page.locator('#offline-notice').isVisible(),false);
   assert.ok(backends.length>0);assert.ok(backends.every(u=>new URL(u).hostname==='gvyfgqhgqnfmtoytqpeo.supabase.co'));
   assert.deepEqual(errors,[]);
   fs.mkdirSync(path.join(root,'test-results'),{recursive:true});
   if(width===390)await page.screenshot({path:path.join(root,'test-results/workers-dev-phone.png'),fullPage:true});
   results.push({width,testDatabaseOnly:true,assets:true,offlineReopen:true,reconnect:true,pageErrors:errors});
   await context.close();
  }
  console.log(JSON.stringify({url,results}));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
