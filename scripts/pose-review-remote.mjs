import fs from 'node:fs';
import path from 'node:path';
import {remoteClient} from './lib/pose-remote-client.mjs';
import {sha,fingerprint,imageInfo,parseJSON} from './lib/pose-review-core.mjs';
const args=process.argv.slice(2),cmd=args[0],value=(flag,fallback)=>args.includes(flag)?args[args.indexOf(flag)+1]:fallback;
if(!cmd||cmd==='--help'){console.log(`Shared private pose workspace CLI. Supply --url HTTPS_URL --credential-file PRIVATE_FILE.
 list | get --id ID | export --out PRIVATE_JSON
 claim --id ID --batch NAME --expected-revision N
 release --id ID --expected-revision N
 candidate --id ID --frames POSE0 POSE1 [POSE2 POSE3] --brief PRIVATE_JSON --expected-revision N
 audit --id ID --version VERSION --file PRIVATE_JSON --expected-revision N
 upload --file PRIVATE_FILE [--path /archive/HASH/FILENAME]
 fetch --path ORIGINAL_OR_REGISTERED_PATH --out PRIVATE_FILE
The credential fixes your worker identity. Separate generator/auditor credentials are required.
Owner decisions and credential management belong in the signed-in browser. No command publishes artwork.`);process.exit(0);}
try{
 const api=remoteClient(value('--url','https://dev.strongstart.app'),value('--credential-file')),id=value('--id'),expectedRevision=Number(value('--expected-revision','-1'));let result;
 if(cmd==='list'||cmd==='export'){result=await api('state');if(cmd==='export'){fs.writeFileSync(value('--out'),JSON.stringify(result,null,2)+'\n');result={exported:value('--out')};}else result=result.exercises.map(r=>({id:r.id,name:r.name,revision:r.revision,review:r.review,assignment:r.assignment,version:r.versions.at(-1)?.id}));}
 else if(cmd==='get'){const state=await api('state');result=state.exercises.find(r=>r.id===id);if(!result)throw Error('Unknown exercise');}
 else if(cmd==='claim'||cmd==='release')result=await api(cmd,{id,expectedRevision,...(cmd==='claim'?{batch:value('--batch')}:{})});
 else if(cmd==='candidate'){
  const n=args.indexOf('--frames');if(n<0)throw Error('Two to four frames required');const rest=args.slice(n+1),end=rest.findIndex(a=>a.startsWith('--')),files=end<0?rest:rest.slice(0,end);if(files.length<2||files.length>4)throw Error('Two to four frames required');const frames=files.map(f=>{const bytes=fs.readFileSync(f);return {bytes,...imageInfo(bytes),sha256:sha(bytes)};}),version='v-'+fingerprint(frames).slice(0,16);
  for(let i=0;i<frames.length;i++){const f=frames[i];f.url='/workspace/'+id+'/versions/'+version+'/frame-'+i+'.'+f.ext;await api('file',f.bytes,{method:'PUT',raw:true,path:f.url});}
  const brief=parseJSON(fs.readFileSync(value('--brief'),'utf8'));result=await api('candidate',{id,expectedRevision,frames:frames.map(({url,sha256,width,height})=>({url,sha256,width,height})),brief});
 }else if(cmd==='audit')result=await api('audit',{id,expectedRevision,versionId:value('--version'),audit:parseJSON(fs.readFileSync(value('--file'),'utf8'))});
 else if(cmd==='upload'){const file=value('--file'),bytes=fs.readFileSync(file),registered=value('--path','/archive/'+sha(bytes)+'/'+path.basename(file).replace(/[^a-zA-Z0-9_.-]/g,'_'));result=await api('file',bytes,{method:'PUT',raw:true,path:registered});}
 else if(cmd==='fetch'){const bytes=await api('file',undefined,{raw:true,path:value('--path')});fs.writeFileSync(value('--out'),bytes);result={saved:value('--out'),sha256:sha(bytes)};}
 else throw Error('Unknown command; use --help');
 console.log(JSON.stringify(result,null,2));
}catch(e){console.error(e.message);process.exitCode=1;}
