import {readFileSync,writeFileSync,existsSync,mkdirSync} from 'node:fs';
import path from 'node:path';
import {storeFor,root} from './serve-pose-review.mjs';
import {parseJSON,imageInfo,sha} from './lib/pose-review-store.mjs';
const args=process.argv.slice(2),command=args[0],value=(flag,fallback)=>args.includes(flag)?args[args.indexOf(flag)+1]:fallback;
if(!command||['--help','help'].includes(command)){
 console.log(`Pose authoring commands (add --workspace PATH to use a shared private directory):
  init | list
  claim --id ID --worker NAME --batch BATCH --expected-revision N
  release --id ID --worker NAME --expected-revision N
  candidate --id ID --frames POSE0 POSE1 --expected-revision N [--brief JSON] [--reference PNG]
  audit --id ID --version VERSION --file AUDIT_JSON --expected-revision N
  references --file PRIVATE_REFERENCE_MAP_JSON
  export --out JSON
  import --file JSON
New exercises require --brief. Read docs/pose-authoring/README.md.
Review decisions belong in the dashboard. No command publishes or changes runtime images.`);
 process.exit(0);
}
try{
 const workspace=value('--workspace',path.join(root,'output/pose-review-workspace')),store=storeFor(workspace),id=value('--id'),revision=Number(value('--expected-revision','-1'));let result;
 switch(command){
  case 'init': result={workspace:store.workspace,exercises:store.list().length};break;
  case 'list':result=store.list().map(r=>({id:r.id,name:r.name,revision:r.revision,status:r.review.status,version:r.review.versionId,assignment:r.assignment}));break;
  case 'claim':result=store.claim(id,revision,value('--worker'),value('--batch'));break;
  case 'release':result=store.release(id,revision,value('--worker'));break;
  case 'candidate':{const i=args.indexOf('--frames'),brief=value('--brief');result=store.candidate(id,revision,i<0?[]:args.slice(i+1,i+3),value('--reference'),brief?parseJSON(readFileSync(brief,'utf8')):undefined);break;}
  case 'audit':{const audit=parseJSON(readFileSync(value('--file'),'utf8'));result=store.audit(id,revision,value('--version'),audit);break;}
  case 'export':writeFileSync(value('--out'),JSON.stringify(store.export(),null,2)+'\n');result={exported:value('--out')};break;
  case 'import':{const bundle=parseJSON(readFileSync(value('--file'),'utf8'));if(bundle.schemaVersion!==1)throw Error('Unsupported review bundle');result={exercises:store.importReviews(bundle.exercises,bundle.baseRevisions)};break;}
  case 'references':{const map=parseJSON(readFileSync(value('--file'),'utf8'));let count=0;for(const [exerciseId,file] of Object.entries(map)){const record=store.get(exerciseId);if(record.versions[0].references.some(r=>r.url?.startsWith('/workspace/')))continue;const bytes=readFileSync(file),info=imageInfo(bytes),digest=sha(bytes),folder=path.join(store.folder(exerciseId),'references');mkdirSync(folder,{recursive:true});store.checked(folder);const dest=path.join(folder,digest+'.'+info.ext);if(!existsSync(dest))writeFileSync(dest,bytes,{flag:'wx'});store.mutate(exerciseId,record.revision,r=>{r.versions[0].references.push({label:'Owner-supplied form reference',url:'/workspace/'+exerciseId+'/references/'+digest+'.'+info.ext,note:'Form reference only; consult exercise-specific constraints for variation differences.'});});count++;}result={referencesAdded:count};break;}
  default:throw Error('Usage: node scripts/pose-review.mjs init|list|claim|release|candidate|audit|export|import|references [--workspace PATH]. Mutating commands require --expected-revision N.');
 }
 console.log(JSON.stringify(result,null,2));
}catch(e){console.error(e.message);process.exitCode=1;}
