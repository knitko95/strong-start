// Actual WebGL model comparison. No sign-in, account data or backend requests.
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(root,'output/character-verification'),url=process.argv[2]||'http://127.0.0.1:8742/exercise-guides/character-lab.html';fs.mkdirSync(out,{recursive:true});
const exercises=['goblet-squat','bodyweight-squat','dumbbell-romanian-deadlift','hammer-curl','standing-dumbbell-shoulder-press','dumbbell-bench-press','plank','incline-dumbbell-press','dumbbell-floor-press','seated-dumbbell-shoulder-press','single-arm-dumbbell-bench-press','chest-supported-dumbbell-row'];
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});const cases=[],errors=[],requests=[];let maxMatrixError=0;try{
for(const width of [1000,390,320]){
 const context=await browser.newContext({viewport:{width,height:1100},reducedMotion:'reduce',serviceWorkers:'block'}),p=await context.newPage();
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('request',r=>requests.push(r.url()));
 await p.goto(url);await p.waitForFunction(()=>window.sharedExerciseDebug?.state().loaded);
 assert.equal(await p.evaluate(()=>sharedExerciseDebug.stats.characterLoads),1,'Candidate must not eagerly load anatomical geometry');
 assert.equal(await p.locator('#play').textContent(),'Play','Reduced-motion preference');
 for(const id of exercises){
  await p.selectOption('#exercise',id);await p.waitForFunction(id=>sharedExerciseDebug.state().loaded&&sharedExerciseDebug.state().id===id,id);
  await p.locator('#position').fill('1.7');
  const before=await p.evaluate(()=>({state:sharedExerciseDebug.state(),pose:sharedExerciseDebug.pose([0,1000,5000,10000,20000])}));
  assert.equal(before.state.character,'rose-athlete-v1');assert(before.state.vertices<35000);assert(before.pose.vertices.flat().every(Number.isFinite));
  await p.selectOption('#character','anatomical');await p.waitForFunction(()=>sharedExerciseDebug.state().loaded&&sharedExerciseDebug.state().character==='anatomical');
  const original=await p.evaluate(()=>({state:sharedExerciseDebug.state(),pose:sharedExerciseDebug.pose()}));
  assert.equal(original.state.time,1.7);assert.equal(original.state.bodyUUID,before.state.bodyUUID);assert.equal(original.state.skeletonUUID,before.state.skeletonUUID);
  for(const [name,matrix]of Object.entries(before.pose.nodes))for(let i=0;i<16;i++)maxMatrixError=Math.max(maxMatrixError,Math.abs(matrix[i]-original.pose.nodes[name][i]));
  await p.selectOption('#character','rose-athlete-v1');await p.waitForFunction(()=>sharedExerciseDebug.state().loaded&&sharedExerciseDebug.state().character==='rose-athlete-v1');
  assert(await p.locator('#highlights').isHidden());assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Phone overflow');
  if(['goblet-squat','dumbbell-bench-press','chest-supported-dumbbell-row'].includes(id))await p.locator('#person').screenshot({path:path.join(out,`${id}-${width}.png`)});
  cases.push({width,id,vertices:before.state.vertices,triangles:before.state.triangles});
 }
 // Play, pause, half speed and offline reuse retain the selected character.
 await p.locator('#play').click();const t=await p.evaluate(()=>sharedExerciseDebug.state().time);await p.waitForTimeout(250);assert(await p.evaluate(t=>sharedExerciseDebug.state().time>t,t));await p.locator('#play').click();
 await p.selectOption('#speed','0.5');await p.locator('#position').fill('1');await p.locator('#play').click();await p.waitForTimeout(400);await p.locator('#play').click();const half=await p.evaluate(()=>sharedExerciseDebug.state().time);assert(half>1.05&&half<1.5);
 await p.evaluate(()=>sharedExerciseDebug.cacheSettled());await context.setOffline(true);await p.selectOption('#character','anatomical');await p.waitForFunction(()=>sharedExerciseDebug.state().loaded&&sharedExerciseDebug.state().character==='anatomical');await p.selectOption('#character','rose-athlete-v1');await p.waitForFunction(()=>sharedExerciseDebug.state().loaded&&sharedExerciseDebug.state().character==='rose-athlete-v1');await context.setOffline(false);
 await p.selectOption('#exercise','goblet-squat');await p.waitForFunction(()=>sharedExerciseDebug.state().loaded&&sharedExerciseDebug.state().id==='goblet-squat');await p.locator('#position').fill('2.5');
 for(const view of ['Front','Side','Back']){await p.getByRole('button',{name:view,exact:true}).click();await p.waitForTimeout(100);if(width===1000)await p.locator('#person').screenshot({path:path.join(out,`goblet-${view.toLowerCase()}.png`)});}
 if(width===390){await p.getByRole('button',{name:'Front',exact:true}).click();await p.waitForTimeout(100);await p.screenshot({path:path.join(out,'phone-review.png'),fullPage:true});}
 await context.close();
}
assert.equal(maxMatrixError,0,'Model switching must preserve every bone/equipment matrix');assert.deepEqual(errors,[]);assert(requests.every(u=>new URL(u).origin===new URL(url).origin),'No external requests');
const report={cases:cases.length,maxMatrixError,errors,checks:['same body/skeleton identities','pose-preserving switch','finite skin coordinates','lazy original model','phone overflow','reduced motion','play/pause','half speed','offline cached switching'],results:cases};fs.writeFileSync(path.join(out,'browser-verification.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({...report,results:undefined}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
