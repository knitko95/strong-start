// UI contract with synthetic sessions and HTTP receipts. Real hosted delivery is
// checked separately with a temporary approved dev member; never production.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{try{const file=path.join(root,'dist',req.url.split('?')[0]==='/'?'index.html':req.url.split('?')[0]);res.setHeader('Content-Type',file.endsWith('.html')?'text/html':file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end();}});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const url=process.argv[2]||`http://127.0.0.1:${server.address().port}`,origin=new URL(url).origin;
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{for(const width of [1280,390,320]){
  const page=await browser.newPage({viewport:{width,height:844}}),errors=[],reports=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!m.text().includes('status of 503'))errors.push(m.text());});
  await page.route('**/*',async r=>{
   const u=new URL(r.request().url());
   if(u.origin===origin&&u.pathname==='/api/feedback'){
    const p=r.request().postDataJSON();reports.push(p);
    return r.fulfill({status:reports.length===1?503:202,contentType:'application/json',body:JSON.stringify(reports.length===1?{error:'temporarily-unavailable'}:{id:p.id,status:'queued'})});
   }
   return u.origin===origin?r.continue():r.fulfill({status:200,body:''});
  });
  await page.goto(url);
  await page.evaluate(()=>{
   state=defaults();state.setup=null;state.onboarded=true;state.settings.goals=['muscle'];state.settings.days=[1,4];state.settings.split='ul2';state.places=[{k:'gym',n:'Gym',eq:PLACE_TYPES.gym.eq.split(' ')}];state.curPlace='gym';logs=[];newBlock();
   AUTH.user={id:'synthetic-feedback-owner'};AUTH.access='ok';AUTH.ready=true;AUTH.coach=false;FB.owner=true;
   cmRefresh=()=>{};refreshUnread=()=>{};
   sb={auth:{getSession:async()=>({data:{session:{access_token:'synthetic-session'}}})},from:()=>{throw Error('Unexpected database feedback inbox access');}};
   ui.tab='settings';render();
  });
  assert.equal(await page.getByText('App feedback',{exact:true}).count(),0,'Duplicate owner inbox is retired');
  await page.locator('#fbbtn').click();const dialog=page.getByRole('dialog');
  await dialog.getByRole('tab',{name:'About the app'}).waitFor();
  assert.match(await dialog.innerText(),/private feedback tracker/);
  assert.match(await dialog.innerText(),/account name and ID/);
  await dialog.getByRole('button',{name:'Bug',exact:true}).click();
  await dialog.getByRole('textbox').fill('Synthetic UI retry verification: clearer button label.');
  await dialog.getByRole('button',{name:'Send',exact:true}).click();
  await page.waitForFunction(()=>!FBS.busy&&FBS.submission);
  assert.match(await dialog.getByRole('textbox').inputValue(),/Synthetic UI retry/);
  await dialog.getByRole('button',{name:'Cancel',exact:true}).click();
  await page.locator('#fbbtn').click();
  assert.match(await dialog.getByRole('textbox').inputValue(),/Synthetic UI retry/);
  await dialog.getByRole('button',{name:'Send',exact:true}).click();
  await page.waitForFunction(()=>!FBS.busy&&FBS.text==='');
  assert.equal(await page.getByRole('dialog').count(),0);
  assert.equal(reports.length,2);assert.deepEqual(reports[0],reports[1]);
  assert.deepEqual(Object.keys(reports[0]).sort(),['attribution','build','device','id','message','screen','tag','version']);
  assert.equal(reports[0].attribution,'name-account-id');
  assert.equal(reports[0].tag,'bug');assert.equal(reports[0].screen,'Settings');
  await page.locator('#fbbtn').click();assert.equal(await dialog.getByRole('textbox').inputValue(),'');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  fs.mkdirSync(path.join(root,'test-results'),{recursive:true});await page.screenshot({path:path.join(root,`test-results/feedback-${width}.png`),fullPage:true});
  await dialog.getByRole('button',{name:'Cancel',exact:true}).click();
  await page.evaluate(()=>{window.coachOpened=false;cmOpen=()=>{window.coachOpened=true;};});
  await page.locator('#fbbtn').click();await dialog.getByRole('tab',{name:'To my coach'}).click();
  assert.equal(await page.evaluate(()=>window.coachOpened),true);assert.equal(reports.length,2);
  await page.evaluate(()=>{closeModal();AUTH.coach=true;CM.summary={inbox:[]};ui.tab='people';render();});
  await page.locator('[data-action="msginbox"][data-k="coach"]').click();
  await page.getByRole('heading',{name:'Messages',exact:true}).waitFor();
  assert.deepEqual(errors,[]);console.log(JSON.stringify({width,failedDraftKept:true,retryDeduplicated:true,queuedReceipt:true,coachRouting:true,errors}));await page.close();
 }}finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
