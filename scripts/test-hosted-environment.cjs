// Read-only real hosted entry-page checks. No credentials or invite are used.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
(async()=>{
 const url=process.argv[2]||'https://strong-start-dev.pages.dev/';
 const expected=fs.readFileSync(path.join(__dirname,'../dist/index.html'),'utf8').replace(/\r\n/g,'\n');
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const results=[];
 try{for(const width of [1280,390,320]){
  const context=await browser.newContext({viewport:{width,height:844}}),page=await context.newPage(),errors=[],backends=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  page.on('request',r=>{if(new URL(r.url()).hostname.endsWith('.supabase.co'))backends.push(r.url())});
  const response=await page.goto(url);assert.equal(response.status(),200);
  assert.equal((await response.text()).replace(/\r\n/g,'\n'),expected,'hosted HTML matches exact local dev build');
  await page.waitForFunction(()=>AUTH.ready&&AUTH.google);
  assert.equal(await page.evaluate(()=>APP_ENV),'development');
  assert.match(await page.locator('#environment-banner').innerText(),/TESTING/);
  assert.equal(await page.locator('[data-action="authgoogle"]').count(),1);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.ok(backends.length>0);assert.ok(backends.every(u=>u.includes('gvyfgqhgqnfmtoytqpeo')));
  assert.match(response.headers()['x-robots-tag'],/noindex/);
  assert.deepEqual(errors,[]);
  fs.mkdirSync(path.join(__dirname,'../test-results'),{recursive:true});
  if(width===390)await page.screenshot({path:path.join(__dirname,'../test-results/domain-dev-phone.png'),fullPage:true});
  results.push({width,errors,backend:'development',exactBuild:true});await context.close();
 }console.log(JSON.stringify({url,results}));
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
