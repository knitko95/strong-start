// Creates a private, content-hashed manifest; never changes the source workspace.
import fs from 'node:fs';
import path from 'node:path';
import {sha,validateRecord} from './lib/pose-review-core.mjs';
const args=process.argv.slice(2),arg=(k,f)=>args.includes(k)?args[args.indexOf(k)+1]:f;
const workspace=path.resolve(arg('--workspace','output/pose-review-workspace')),source=path.resolve(arg('--source','.')),out=path.resolve(arg('--out','output/pose-hosted-migration'));
fs.mkdirSync(out,{recursive:true});
const files=new Map(),queue=[],missing=[],norm=p=>path.resolve(p).replaceAll('\\','/');
function add(file,registered=norm(file)){
 if(files.has(registered))return;if(!fs.existsSync(file)||!fs.statSync(file).isFile()){missing.push({file,registered});return;}
 if(/(?:^|[\\/])(?:\.env[^\\/]*|\.git|node_modules|\.wrangler|\.cloudflare|credentials?[^\\/]*|[^\\/]*token[^\\/]*)(?:[\\/]|$)/i.test(file))throw Error('Refusing potentially sensitive infrastructure file: '+file);
 const bytes=fs.readFileSync(file);if(bytes.length>25_000_000)throw Error('Migration requires larger-file support: '+file);
 if(path.basename(file)==='record.json'&&norm(file).startsWith(norm(workspace)+'/'))registered='/archive/'+sha(bytes)+'/record.json';files.set(registered,{path:registered,local:norm(file),digest:sha(bytes),size:bytes.length});if(file.endsWith('.json'))queue.push(file);
}
function walk(folder){for(const e of fs.readdirSync(folder,{withFileTypes:true})){if(e.isSymbolicLink())throw Error('Unexpected symlink: '+e.name);if(['.git','node_modules','dist','.wrangler','.cloudflare'].includes(e.name))continue;const f=path.join(folder,e.name);if(e.isDirectory())walk(f);else if(!/\.(log|pid|tmp)$/.test(e.name))add(f);}}
walk(workspace);
const records=fs.readdirSync(path.join(workspace,'exercises')).filter(id=>fs.existsSync(path.join(workspace,'exercises',id,'record.json'))).map(id=>validateRecord(JSON.parse(fs.readFileSync(path.join(workspace,'exercises',id,'record.json')))));
for(const r of records){for(const v of r.versions)for(const f of v.frames)add(f.url.startsWith('/workspace/')?path.join(workspace,'exercises',f.url.slice(11)):path.join(source,f.url),f.url);for(const ref of [...(r.reviewReferences||[]),...r.versions.flatMap(v=>v.references)])if(ref.url?.startsWith('/workspace/'))add(path.join(workspace,'exercises',ref.url.slice(11)),ref.url);}
// Preserve all authoring attempts/exports, including failed sources, without copying source checkouts or unrelated output.
const authoring=/^(approved-pose-masters-|bench-press-poses$|squat-poses$|exercise-pose-pilot-set|six-exercise-pose-pilot(?:-|$)|pose-batch-|pose-owner-fixes-|next-six-generation$)/;
for(const e of fs.readdirSync(path.dirname(workspace),{withFileTypes:true}))if(e.isDirectory()&&authoring.test(e.name))walk(path.join(path.dirname(workspace),e.name));
const scanned=new Set();
while(queue.length){const file=queue.shift();if(scanned.has(norm(file)))continue;scanned.add(norm(file));let data;try{data=JSON.parse(fs.readFileSync(file,'utf8'));}catch{continue;}
 const visit=value=>{if(typeof value==='string'&&/^[A-Za-z]:[\\/]/.test(value)&&!/[\r\n]/.test(value)){const f=value.replace(/#[^\\/]*$/,'');const n=norm(f);if((n.startsWith(norm(path.dirname(workspace))+'/')||n.includes('/.codex/generated_images/'))&&fs.existsSync(f)&&fs.statSync(f).isFile())add(f);}else if(value&&typeof value==='object')for(const child of Object.values(value))visit(child);};visit(data);
}
const unique=new Map([...files.values()].map(f=>[f.digest,f]));const manifest={schemaVersion:1,createdAt:new Date().toISOString(),workspace:norm(workspace),source:norm(source),records,files:[...files.values()],missing,summary:{records:records.length,paths:files.size,uniqueObjects:unique.size,uniqueBytes:[...unique.values()].reduce((n,f)=>n+f.size,0)}};
if(missing.length)throw Error('Missing migration files: '+JSON.stringify(missing));fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');console.log(JSON.stringify(manifest.summary));
