// UI tests use synthetic sessions and RPCs. Database behavior is tested separately.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'dist/index.html'),'utf8');
const server=http.createServer((req,res)=>{try{const p=req.url.split('?')[0];const file=path.join(root,'dist',p==='/'?'index.html':p);res.setHeader('Content-Type',file.endsWith('.html')?'text/html':file.endsWith('.js')?'text/javascript':file.endsWith('.png')?'image/png':'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end();}});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const url=process.argv[2]||`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{for(const width of [1280,390,320]){
  const page=await browser.newPage({viewport:{width,height:844}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.route('**/*',r=>new URL(r.request().url()).origin===new URL(url).origin?r.continue():r.fulfill({status:200,body:''}));
  const response=await page.goto(url);assert.equal((await response.text()).replace(/\r\n/g,'\n'),html.replace(/\r\n/g,'\n'),'hosted source differs');
  await page.evaluate(()=>{
   state=defaults();state.setup=null;state.onboarded=true;state.settings.name='Deletion test';state.settings.goals=['muscle'];state.settings.days=[1,4];state.settings.split='ul2';state.settings.comfort='machines';state.settings.tstyle='machines';state.settings.cardio={style:'walk',jog:'none',after:0};state.places=[{k:'gym',n:'Gym',eq:PLACE_TYPES.gym.eq.split(' ')}];state.curPlace='gym';logs=[];newBlock();
   AUTH.user={id:'synthetic-delete',email:'delete@example.invalid'};AUTH.access='ok';AUTH.ready=true;
   SYNC={owner:AUTH.user.id,base:null,conflict:null,recovery:null};CLOUD.ok=true;clearTimeout(CLOUD.t);
   window.calls=[];window.deleteError=null;
   sb={rpc:async(name,p)=>{window.calls.push({name,p});if(name==='delete_my_account')return {error:window.deleteError};return {data:false};},auth:{signOut:async()=>{throw Error('Synthetic already-deleted Auth session');}}};
   lsSet(ACCT_KEY,JSON.stringify(AUTH.user));lsSet('strongstart_owner',AUTH.user.id);ui.tab='settings';ui.settingsGroup='account';ui.open={account:true};persistLocal();render();
  });
  assert.ok(await page.getByText('Testing',{exact:false}).count());
  await page.getByRole('button',{name:'Delete my account',exact:true}).click();
  const dialog=page.getByRole('dialog'),del=dialog.getByRole('button',{name:'Delete my account forever'});
  await dialog.getByRole('heading',{name:'Delete your account forever?'}).waitFor();
  assert.equal(await dialog.getByRole('button',{name:'Cancel'}).evaluate(el=>el===document.activeElement),true);
  assert.equal(await del.isDisabled(),true);assert.ok(await dialog.getByText(/message text and screen\/device context remain/).count());
  await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog').count(),0);assert.equal(await page.evaluate(()=>calls.length),0);
  await page.getByRole('button',{name:'Delete my account',exact:true}).click();
  await page.getByLabel('Type DELETE to confirm').fill('delete');assert.equal(await del.isDisabled(),true);
  await page.getByLabel('Type DELETE to confirm').fill('DELETE');assert.equal(await del.isDisabled(),false);
  await page.evaluate(()=>{navigator.clipboard.writeText=async()=>{throw Error('Synthetic clipboard denied');};});
  await dialog.getByRole('button',{name:'Copy backup first'}).click();assert.ok((await page.getByLabel('Backup to copy').inputValue()).includes('Deletion test'));
  await page.evaluate(()=>window.deleteError={code:'P0001'});await del.click();await page.getByRole('alert').filter({hasText:'For safety'}).waitFor();
  assert.equal(await page.evaluate(()=>AUTH.user.id),'synthetic-delete');assert.ok(await page.evaluate(()=>localStorage.getItem(LS)));
  await page.evaluate(()=>window.deleteError={code:'network'});await del.click();await page.getByRole('alert').filter({hasText:'Couldn’t confirm deletion'}).waitFor();
  assert.equal(await del.isDisabled(),false);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  fs.mkdirSync(path.join(root,'test-results'),{recursive:true});await page.screenshot({path:path.join(root,`test-results/account-delete-${width}.png`),fullPage:true});
  await page.evaluate(()=>window.deleteError=null);await del.click();await page.waitForFunction(()=>AUTH.user===null);
  assert.equal(await page.evaluate(()=>localStorage.getItem(LS)),null);assert.equal(await page.evaluate(()=>rememberedAcct()),null);
  assert.equal(await page.evaluate(()=>logs.length),0);assert.equal(await page.evaluate(()=>state.settings.name),'');
  assert.equal(await page.evaluate(()=>calls.every(c=>c.name==='delete_my_account'&&JSON.stringify(c.p)==='{"p_confirmation":"DELETE"}')),true);
  // Another connected device receives no snapshot after server-side deletion.
  await page.evaluate(()=>{AUTH.user={id:'synthetic-remote',email:'remote@example.invalid'};AUTH.access='ok';CLOUD.ok=true;state.settings.name='Old offline copy';persistLocal();sb.rpc=async n=>n==='read_account_snapshot'?{data:null}:{data:'none'};});
  await page.evaluate(()=>pushCloud());assert.equal(await page.evaluate(()=>AUTH.user),null);assert.equal(await page.evaluate(()=>localStorage.getItem(LS)),null);
  // Staff and coach previews cannot open self-deletion controls.
  await page.evaluate(()=>{AUTH.user={id:'synthetic-staff'};AUTH.coach=true;selfDeleteSheet();});assert.equal(await page.getByRole('dialog').count(),0);
  assert.deepEqual(errors,[]);console.log(JSON.stringify({width,cancel:true,confirmation:true,backupFallback:true,freshnessFailure:true,networkRetry:true,deletionCleanup:true,remoteCleanup:true,errors}));await page.close();
 }}finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
