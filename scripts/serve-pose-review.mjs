import http from 'node:http';
import {readFileSync,realpathSync,existsSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes} from 'node:crypto';
import {PoseReviewStore,ReviewError,parseJSON} from './lib/pose-review-store.mjs';

export const root=fileURLToPath(new URL('../',import.meta.url));
export function appCatalogue(){const html=readFileSync(path.join(root,'index.html'),'utf8'),raw=html.match(/const LIB_RAW\s*=\s*`([\s\S]*?)`/)[1];return Object.fromEntries(raw.trim().split('\n').map(line=>{const name=line.split('|')[0].trim();return [name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''),name];}));}
export function storeFor(workspace){const resolved=path.resolve(workspace);if(['exercise-guides','dist','hosting'].some(name=>resolved===path.join(root,name)||resolved.startsWith(path.join(root,name)+path.sep)))throw new ReviewError('Keep the private workspace outside public/runtime folders');const seed=JSON.parse(readFileSync(path.join(root,'exercise-guides/pose-review/seed.v1.json'),'utf8'));const store=new PoseReviewStore({workspace,seed,catalogue:appCatalogue()});store.initialize();return store;}
export async function startReviewServer({workspace=path.join(root,'output/pose-review-workspace'),port=8734}={}){
 const store=storeFor(workspace),token=randomBytes(32).toString('hex');let origin;
 const server=http.createServer(async(req,res)=>{
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cross-Origin-Resource-Policy','same-origin');res.setHeader('Referrer-Policy','no-referrer');
  const json=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data));};
  try{
   if(req.headers.host!==new URL(origin).host)throw new ReviewError('Invalid local host',403);
   if(req.headers.origin&&req.headers.origin!==origin)throw new ReviewError('Cross-origin requests are not accepted',403);
   const url=new URL(req.url,origin);
   if(url.pathname==='/api/pose-review/state'&&req.method==='GET'){json(200,{schemaVersion:1,mode:'workspace',token,exercises:store.list()});return;}
   if(url.pathname.startsWith('/api/pose-review/')){
    if(req.method!=='POST')throw new ReviewError('Method not allowed',405);
    if(req.headers.origin!==origin||req.headers['x-pose-review-token']!==token)throw new ReviewError('Open the local dashboard before saving',403);
    if(!req.headers['content-type']?.startsWith('application/json'))throw new ReviewError('JSON required',415);
    const maxBytes=url.pathname==='/api/pose-review/reference-images'?7_000_000:2_000_000;
    let body='',size=0;for await(const chunk of req){size+=chunk.length;if(size>maxBytes)throw new ReviewError('Request is too large',413);body+=chunk;}
    const input=parseJSON(body,maxBytes);
    if(url.pathname==='/api/pose-review/decision'){json(200,{record:store.decide(input)});return;}
    if(url.pathname==='/api/pose-review/import'){json(200,{exercises:store.importReviews(input.records,input.expectedRevisions)});return;}
    if(url.pathname==='/api/pose-review/reference-images'){json(200,{record:store.addReference(input)});return;}
    throw new ReviewError('Unknown authoring action',404);
   }
   if(req.method!=='GET'&&req.method!=='HEAD')throw new ReviewError('Method not allowed',405);
   if(url.pathname==='/'){res.writeHead(302,{Location:'/exercise-guides/pose-review/'});res.end();return;}
   let file;
   if(url.pathname.startsWith('/workspace/'))file=store.asset(url.pathname);
   else{
    const pathname=url.pathname==='/exercise-guides/pose-review/'?url.pathname+'index.html':url.pathname;
    if(!/^\/exercise-guides\/pose-review\/(index\.html|review\.js|review\.css|seed\.v1\.json|briefs\.v1\.json)$/.test(pathname)&&!/^\/exercise-guides\/poses\/assets\/[a-z0-9-]+\.[a-f0-9]{12}\.webp$/.test(pathname))throw new ReviewError('Not found',404);
    file=path.join(root,pathname);if(!existsSync(file))throw new ReviewError('Not found',404);file=realpathSync(file);if(!file.startsWith(realpathSync(root)+path.sep))throw new ReviewError('Invalid public asset',403);
   }
   const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg'};
   res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(req.method==='HEAD'?undefined:readFileSync(file));
  }catch(error){json(error.status||400,{error:error instanceof SyntaxError?'Invalid JSON':error.message});}
 });
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});origin='http://127.0.0.1:'+server.address().port;
 return {server,store,origin};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2),value=(flag,fallback)=>args.includes(flag)?args[args.indexOf(flag)+1]:fallback;
 const {server,store,origin}=await startReviewServer({workspace:value('--workspace',undefined),port:Number(value('--port','8734'))});
 console.log('Pose review dashboard: '+origin+'/exercise-guides/pose-review/');console.log('Review files: '+store.workspace);console.log('Local authoring only; approvals do not publish or change workout assets.');
 for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>process.exit(0)));
}
