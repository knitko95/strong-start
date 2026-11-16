// Synthetic UI only; no account/database mutations or analytics ingestion.
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve(__dirname,'..'),dist=path.join(root,'dist');
const server=http.createServer((req,res)=>{try{const file=path.resolve(dist,'.'+(req.url.split('?')[0]==='/'?'/index.html':decodeURIComponent(req.url.split('?')[0])));assert(file.startsWith(dist+path.sep));res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end();}});
async function seed(page){await page.evaluate(()=>{
 closeModal();sb=null;AUTH.ready=true;AUTH.user=null;AUTH.coach=false;AUTH.recovery=false;coachMode=null;PAGE.active=false;clearTimeout(CLOUD.t);clearInterval(timerInt);clearInterval(gInt);
 state=defaults();logs=[];state.setup=null;state.onboarded=true;Object.assign(state.settings,{goals:['muscle'],level:'regular',days:[1,3,5],split:'fb3',sound:false});state.places=[{k:'gym',n:'Synthetic gym',eq:EQ_ALL}];state.curPlace='gym';newBlock();ui.qsLater=true;ui.tab='today';render();
});}
function contrast(a,b){const lum=c=>{const values=c.match(/[\d.]+/g).slice(0,3).map(Number).map(n=>n/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);return values.reduce((n,x,i)=>n+x*[.2126,.7152,.0722][i],0);};const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=process.argv[2]||`http://127.0.0.1:${server.address().port}/`,origin=new URL(url).origin;
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
try{for(const width of [1280,390,320]){const page=await browser.newPage({viewport:{width,height:844},serviceWorkers:'block'}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});await page.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.fulfill({status:200,body:''}));
const response=await page.goto(url);assert.equal((await response.text()).replace(/\r\n/g,'\n'),fs.readFileSync(path.join(dist,'index.html'),'utf8').replace(/\r\n/g,'\n'),'exact candidate');await page.waitForFunction(()=>state&&document.querySelector('#app h1')&&!PAGE.flight&&!DEVICE.pending);await seed(page);
for(const quickSetup of [true,false]){
 await page.evaluate(quickSetup=>{state.setup={a:{...prefillSetup(),quickSetup},step:'schedule'};render();},quickSetup);
 assert.equal(await page.locator('[data-action="suday"]').count(),7);
 const fit=await page.locator('.ob,[data-action="suday"],[data-action="sunext"]').evaluateAll(es=>es.every(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth;}));assert(fit,`${quickSetup?'Quick':'Full'} schedule fits at ${width}`);
}
await page.evaluate(()=>{const a={...prefillSetup(),quickSetup:true};a.places.push({k:'home',eq:['db'],confirmed:true});state.setup={a,step:'equip',tab:'gym'};render();});
for(const place of ['home','gym']){
 await page.locator(`[data-action="sutab"][data-v="${place}"]`).click();
 const active=await page.locator(`[data-action="sutab"][data-v="${place}"]`).evaluate(e=>({pressed:e.getAttribute('aria-pressed'),bg:getComputedStyle(e).backgroundColor,fg:getComputedStyle(e).color,other:getComputedStyle(e.parentElement.querySelector('[aria-pressed="false"]')).backgroundColor}));
 assert.equal(active.pressed,'true');assert.notEqual(active.bg,active.other,'active location is visually distinct');assert(contrast(active.fg,active.bg)>=4.5,'selected location text remains readable');
}
await page.evaluate(()=>{state.setup=null;ui.tab='settings';ui.settingsGroup='training';ui.open={schedule:true,places:true,level:true};render();});
const targets=await page.locator('[data-action="settingshome"],[data-action="pickLevel"],[data-action="editeq"]').evaluateAll(es=>es.map(e=>({text:e.textContent,height:e.getBoundingClientRect().height})));assert(targets.length>=2);assert(targets.every(t=>t.height>=44),'common secondary actions retain full touch height');
for(const color of ['blush','green','blue','noir'])for(const theme of ['light','dark']){
 const pairs=await page.evaluate(({color,theme})=>{Object.assign(state.settings,{color,theme});applyColor();const probe=document.createElement('span');probe.style.color='var(--muted)';document.body.append(probe);const fg=getComputedStyle(probe).color;const bgs=['bg','surface','sunk'].map(v=>{probe.style.backgroundColor=`var(--${v})`;return getComputedStyle(probe).backgroundColor;});probe.remove();return {fg,bgs};},{color,theme});
 assert(pairs.bgs.every(bg=>contrast(pairs.fg,bg)>=4.5),`${color}/${theme} helper text contrast`);
}
await page.evaluate(()=>{state.settings.color='blush';state.settings.theme='light';ui.tab='plan';render();});
const before=await page.evaluate(()=>JSON.stringify({state,logs}));
const disclosure=page.locator('.plan-help>summary');await disclosure.click();assert(await disclosure.evaluate(e=>e.parentElement.open));await disclosure.focus();await page.keyboard.press('Space');assert.equal(await disclosure.evaluate(e=>e.parentElement.open),false);
await page.locator('#settings-shortcut').focus();await page.evaluate(()=>{window.styleConfirmRan=false;confirmBox('Delete this session?','Synthetic review only.','Delete',()=>{window.styleConfirmRan=true;});});
assert.equal(await page.locator('.sheet-header .sheet-close').count(),1);assert.equal(await page.locator('.sheet-header h2').innerText(),'Delete this session?');assert.equal(await page.evaluate(()=>document.activeElement.textContent),'Cancel','destructive confirmation still focuses Cancel');
await page.locator('.sheet-close').click();assert.equal(await page.locator('#modal [role="dialog"]').count(),0);assert.equal(await page.evaluate(()=>window.styleConfirmRan),false,'header close never confirms');
await page.locator('#settings-shortcut').focus();await page.evaluate(()=>levelSheet());await page.keyboard.press('Escape');await page.waitForFunction(()=>document.activeElement.id==='settings-shortcut');assert.equal(await page.locator('#modal [role="dialog"]').count(),0);
await page.evaluate(()=>{AUTH.user={id:'synthetic-style-check'};AUTH.access='ok';fbOpen('app');});assert.equal(await page.getByRole('dialog',{name:'Feedback',exact:true}).count(),1,'feedback title labels the dialog');await page.locator('.sheet-close').click();
assert.equal(await page.evaluate(()=>JSON.stringify({state,logs})),before,'browsing and dismissing controls preserves saved data');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);
await page.close();console.log(`PASS style consistency: setup fit, location selection, contrast, targets, disclosures and modal dismissal at ${width}px`);
}}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
