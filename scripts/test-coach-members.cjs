// Real frontend, synthetic roster RPCs. test-coach-members.sql checks actual RLS.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'dist/index.html'),'utf8');
const server=http.createServer((req,res)=>{
  try{const p=new URL(req.url,'http://localhost').pathname,f=path.join(root,'dist',p==='/'?'index.html':p);
    res.setHeader('Content-Type',f.endsWith('.html')?'text/html':f.endsWith('.js')?'text/javascript':f.endsWith('.css')?'text/css':'text/plain');res.end(fs.readFileSync(f));
  }catch{res.writeHead(404);res.end();}
});
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const url=process.argv[2]||`http://127.0.0.1:${server.address().port}`;
  const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  try{for(const width of [1280,390,320]){
    const page=await browser.newPage({viewport:{width,height:844}}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    await page.route('**/*',r=>new URL(r.request().url()).origin===new URL(url).origin?r.continue():r.fulfill({status:200,body:''}));
    const response=await page.goto(url);
    assert.equal((await response.text()).replace(/\r\n/g,'\n'),html.replace(/\r\n/g,'\n'));
    await page.evaluate(async()=>{
      state=defaults();state.setup=null;state.onboarded=true;ui.qsLater=true;
      AUTH.user={id:'coach-a',email:'coach-a@example.invalid'};AUTH.coach=true;AUTH.access='ok';AUTH.ready=true;FB.owner=true;
      CLOUD.ok=false;clearTimeout(CLOUD.t);cmReset('coach-a');
      window.roster=[];
      sb={rpc:async name=>({data:name==='coaching_organization'?{organization:{id:'test-org',name:'Synthetic organization'},self:{id:AUTH.user.id,role:'coach',is_admin:false},coaches:[{id:AUTH.user.id,name:'Synthetic coach',role:'coach',is_admin:false}],members:roster.map(p=>({id:p.id,coach_id:AUTH.user.id})),audit:[]}:name==='coach_people'?roster:name==='coach_messaging'?{coach:null,inbox:[]}:null}),
        from:()=>({select:()=>({order:()=>({limit:async()=>({data:[]})})})})};
      ui.tab='people';await loadPeople();
    });
    await page.getByRole('heading',{name:'Your people',exact:true}).waitFor();
    assert.equal(await page.locator('[data-action="personopen"]').count(),0);
    await page.getByText(/No members yet/).waitFor();
    await page.getByRole('button',{name:'Invites',exact:true}).click();await page.getByRole('button',{name:'Invite someone',exact:true}).click();
    await page.getByRole('heading',{name:'Invite someone',exact:true}).waitFor();
    await page.getByRole('button',{name:'Cancel',exact:true}).click();
    await page.evaluate(async()=>{
      roster=[{id:'member-a',name:'Synthetic own member',email:'member-a@example.invalid',workouts_7d:1,workouts_28d:2,workouts_total:3,staff:false}];
      await loadPeople();
    });
    assert.equal(await page.locator('[data-action="personopen"]').count(),1);
    assert.equal(await page.locator('[data-action="personopen"]').getAttribute('data-id'),'member-a');
    assert.equal(await page.locator('[data-action="acctmanage"]').count(),0);
    await page.evaluate(async()=>{AUTH.user={id:'coach-b',email:'coach-b@example.invalid'};cmReset('coach-b');roster=[{id:'member-b',name:'Synthetic second member',email:'member-b@example.invalid',workouts_7d:0,workouts_28d:0,workouts_total:0,staff:false}];await loadPeople();});
    assert.equal(await page.getByText('Synthetic own member',{exact:true}).count(),0);
    assert.equal(await page.locator('[data-action="personopen"]').getAttribute('data-id'),'member-b');
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    assert.deepEqual(errors,[]);console.log(JSON.stringify({url,width,emptyRoster:true,ownRoster:true,accountSwitch:true,errors}));await page.close();
  }}finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
