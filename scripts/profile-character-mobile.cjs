// Desktop Chrome proxy at a phone viewport, including a 4x CPU slowdown.
// This is not a physical-phone GPU, thermal or battery benchmark.
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(root,'output/character-verification');fs.mkdirSync(out,{recursive:true});
const url=process.argv[2]||'http://127.0.0.1:8742/exercise-guides/character-lab.html';
(async()=>{const b=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
 const c=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true,serviceWorkers:'block'}),p=await c.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(url);await p.waitForFunction(()=>window.sharedExerciseDebug?.state().loaded);const dev=await c.newCDPSession(p),cases=[];
 for(const rate of [1,4]){
  await dev.send('Emulation.setCPUThrottlingRate',{rate});
  for(const id of ['goblet-squat','dumbbell-bench-press','standing-dumbbell-shoulder-press']){
   await p.selectOption('#exercise',id);await p.waitForFunction(id=>sharedExerciseDebug.state().loaded&&sharedExerciseDebug.state().id===id,id);await p.waitForTimeout(400);
   const sample=await p.evaluate(async()=>{const samples=[];let last;await new Promise(resolve=>{function tick(now){if(last!==undefined)samples.push(now-last);last=now;if(samples.length<120)requestAnimationFrame(tick);else resolve();}requestAnimationFrame(tick);});samples.sort((a,b)=>a-b);const canvas=document.querySelector('#person canvas'),gl=canvas.getContext('webgl2'),ext=gl.getExtension('WEBGL_debug_renderer_info');return {median:samples[60],p95:samples[114],maximum:samples.at(-1),renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):'undisclosed',drawingBuffer:[gl.drawingBufferWidth,gl.drawingBufferHeight],state:sharedExerciseDebug.state(),network:sharedExerciseDebug.stats};});
   cases.push({cpuSlowdown:rate,id,...sample});
  }
 }
 assert.deepEqual(errors,[]);assert(cases.every(c=>c.state.vertices<35000));
 const report={kind:'desktop-mobile-proxy',viewport:[390,844],deviceScaleFactor:3,physicalPhoneVerified:false,cases,errors};
 fs.writeFileSync(path.join(out,'mobile-profile.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({cases:cases.map(c=>({cpu:c.cpuSlowdown,id:c.id,medianMs:c.median,p95Ms:c.p95,maxMs:c.maximum,draws:c.state.drawCalls})),errors,physicalPhoneVerified:false}));
 }finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1);});
