// Run against a built local preview, or pass its hosted URL. Synthetic data only.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),dist=path.join(root,'dist');
const server=http.createServer((req,res)=>{try{const file=path.resolve(dist,'.'+(req.url==='/'?'/index.html':req.url.split('?')[0]));if(!file.startsWith(dist+path.sep))throw Error();res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end();}});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const url=process.argv[2]||`http://127.0.0.1:${server.address().port}/`;
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
 try{for(const width of [320,390,1280]){
  const page=await browser.newPage({viewport:{width,height:844},serviceWorkers:'block',reducedMotion:'reduce'}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>/supabase\.co|\/api\//.test(r.request().url())?r.abort():r.continue());
  await page.goto(url);await page.addScriptTag({content:fs.readFileSync(path.join(__dirname,'experience-check.js'),'utf8')});
  await page.waitForSelector('#review-result',{state:'attached'});
  const result=JSON.parse(await page.locator('#review-result').textContent());assert.equal(result.ok,true,JSON.stringify(result));assert.deepEqual(errors,[]);
  console.log(JSON.stringify(result));await page.close();
 }}finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
