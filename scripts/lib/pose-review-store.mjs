import {readFileSync,writeFileSync,mkdirSync,readdirSync,existsSync,openSync,closeSync,renameSync,unlinkSync,realpathSync,rmSync} from 'node:fs';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';

export const sha=value=>createHash('sha256').update(value).digest('hex');
export const fingerprint=frames=>sha(frames.map(f=>f.sha256).join('|'));
export const validId=id=>typeof id==='string'&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)&&id.length<=120;
export class ReviewError extends Error{constructor(message,status=400){super(message);this.status=status;}}
const assert=(value,message,status=400)=>{if(!value)throw new ReviewError(message,status);};
const text=(value,max=12000)=>typeof value==='string'&&value.length<=max;
const hash=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
export function parseJSON(value,maxBytes=2_000_000){assert(Buffer.byteLength(value)<=maxBytes,'Review file is too large');return JSON.parse(value,(key,value)=>{assert(!['__proto__','prototype','constructor'].includes(key),'Unsafe property');return value;});}
function safeFrame(url,id){return typeof url==='string'&&(new RegExp('^/workspace/'+id+'/versions/v-[a-f0-9]{16}/frame-[01]\\.(png|webp)$').test(url)||/^\/exercise-guides\/poses\/assets\/[a-z0-9-]+\.[a-f0-9]{12}\.webp$/.test(url));}
function validateAudit(a){
 assert(a&&['not-recorded','passed','needs-changes'].includes(a.status),'Invalid audit status');
 assert(Array.isArray(a.findings)&&a.findings.length<=100&&a.findings.every(f=>['info','warning','error'].includes(f.severity)&&text(f.text)),'Invalid audit findings');
 assert(Array.isArray(a.checks)&&a.checks.length<=50&&a.checks.every(c=>validId(c.id)&&text(c.label,300)&&['pass','fail','not-checked'].includes(c.result)&&(!c.note||text(c.note))),'Invalid audit checklist');
 if(a.reviewer!==undefined)assert(text(a.reviewer,150),'Invalid auditor');
}
export function validateRecord(r){
 assert(r&&validId(r.id)&&text(r.name,200)&&Number.isSafeInteger(r.revision)&&r.revision>=0,'Invalid exercise record');
 assert(Array.isArray(r.versions)&&r.versions.length<=100,'Invalid versions');
 const ids=new Set();for(const v of r.versions){
  assert(validId(v.id)&&!ids.has(v.id)&&hash(v.fingerprint),'Invalid or duplicate version');ids.add(v.id);
  assert(v.frames?.length===2&&v.frames.every(f=>safeFrame(f.url,r.id)&&hash(f.sha256)&&Number.isInteger(f.width)&&f.width>0&&f.width<=8192&&Number.isInteger(f.height)&&f.height>0&&f.height<=8192),'Invalid frame');
  assert(v.frames[0].width===v.frames[1].width&&v.frames[0].height===v.frames[1].height&&fingerprint(v.frames)===v.fingerprint,'Frame dimensions or fingerprint mismatch');
  assert(Array.isArray(v.constraints)&&v.constraints.length<=50&&v.constraints.every(c=>text(c,3000)),'Invalid constraints');
  assert(Array.isArray(v.references)&&v.references.length<=30&&v.references.every(ref=>text(ref.label,300)&&(!ref.note||text(ref.note))&&(!ref.url||(/^https:\/\/[^\s]+$/.test(ref.url)||new RegExp('^/workspace/'+r.id+'/references/[a-f0-9]{64}\\.(png|webp)$').test(ref.url)))),'Invalid reference');
  validateAudit(v.audit);
 }
 for(const key of ['approvedVersionId','developmentVersionId','productionVersionId'])assert(r[key]===null||ids.has(r[key]),'Unknown '+key);
 assert(r.reviewReferences===undefined||Array.isArray(r.reviewReferences)&&r.reviewReferences.length<=20&&r.reviewReferences.every(ref=>hash(ref.sha256)&&ref.id==='ref-'+ref.sha256.slice(0,16)&&ref.url==='/workspace/'+r.id+'/references/'+ref.sha256+'.'+ref.ext&&['png','webp','jpg'].includes(ref.ext)&&text(ref.label,200)&&ref.label.trim()&&text(ref.note,3000)&&Number.isInteger(ref.width)&&ref.width>0&&ref.width<=8192&&Number.isInteger(ref.height)&&ref.height>0&&ref.height<=8192&&text(ref.createdAt,100)&&(ref.sourceVersionId===null||ids.has(ref.sourceVersionId))),'Invalid additional reference image');
 assert(r.review&&['approved','needs-changes','unreviewed'].includes(r.review.status)&&text(r.review.note)&&((r.review.versionId===null&&r.versions.length===0)||ids.has(r.review.versionId)),'Invalid review');
 assert(r.review.status!=='approved'||r.approvedVersionId===r.review.versionId,'Approved decision must match approved version');
 assert(r.assignment===null||(text(r.assignment?.worker,150)&&text(r.assignment?.batch,150)),'Invalid assignment');
 assert(Array.isArray(r.history)&&r.history.length<=5000,'Invalid history');
 return r;
}
export function imageInfo(bytes,{allowJpeg=false}={}){
 assert(bytes.length>=30&&bytes.length<=25_000_000,'Image size unsupported');
 if(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return {ext:'png',width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20)};
 if(allowJpeg&&bytes[0]===255&&bytes[1]===216){
  assert(bytes.at(-2)===255&&bytes.at(-1)===217,'Incomplete JPEG image');
  let offset=2;while(offset+3<bytes.length){assert(bytes[offset++]===255,'Invalid JPEG marker');while(bytes[offset]===255)offset++;const marker=bytes[offset++];if(marker===217||marker===218)break;if(marker===1||marker>=208&&marker<=215)continue;const length=bytes.readUInt16BE(offset);assert(length>=2&&offset+length<=bytes.length,'Invalid JPEG segment');if([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker)){assert(length>=8,'Invalid JPEG frame');return {ext:'jpg',height:bytes.readUInt16BE(offset+3),width:bytes.readUInt16BE(offset+5)};}offset+=length;}
  throw new ReviewError('Unsupported JPEG image');
 }
 assert(bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP','Use PNG or WebP images');
 const type=bytes.toString('ascii',12,16);let width,height;
 if(type==='VP8L'){const bits=bytes.readUInt32LE(21);width=(bits&0x3fff)+1;height=((bits>>>14)&0x3fff)+1;}
 else if(type==='VP8X'){width=bytes.readUIntLE(24,3)+1;height=bytes.readUIntLE(27,3)+1;}
 else if(type==='VP8 '){width=bytes.readUInt16LE(26)&0x3fff;height=bytes.readUInt16LE(28)&0x3fff;}
 assert(width&&height,'Unsupported WebP header');return {ext:'webp',width,height};
}
const event=(type,versionId,note,status)=>({id:randomUUID(),at:new Date().toISOString(),type,versionId,note,...(status?{status}:{})});
function save(file,data){const temp=file+'.'+randomUUID()+'.tmp';try{writeFileSync(temp,JSON.stringify(data,null,2)+'\n',{flag:'wx'});renameSync(temp,file);}finally{if(existsSync(temp))unlinkSync(temp);}}
export class PoseReviewStore{
 constructor({workspace,seed,catalogue={}}){this.workspace=path.resolve(workspace);this.seed=seed;this.catalogue=catalogue;mkdirSync(this.workspace,{recursive:true});this.workspace=realpathSync(this.workspace);const exercises=path.join(this.workspace,'exercises');mkdirSync(exercises,{recursive:true});this.checked(exercises);}
 folder(id){assert(validId(id),'Invalid exercise ID');return path.join(this.workspace,'exercises',id);}
 checked(file){const real=realpathSync(file);assert(real.startsWith(this.workspace+path.sep),'Path outside review workspace',403);return real;}
 file(id){return path.join(this.folder(id),'record.json');}
 initialize(){for(const record of this.seed.exercises){validateRecord(record);mkdirSync(this.folder(record.id),{recursive:true});this.checked(this.folder(record.id));try{writeFileSync(this.file(record.id),JSON.stringify(record,null,2)+'\n',{flag:'wx'});}catch(e){if(e.code!=='EEXIST')throw e;}}return this.list();}
 get(id){const file=this.file(id);assert(existsSync(file),'Unknown exercise',404);return validateRecord(parseJSON(readFileSync(this.checked(file),'utf8')));}
 list(){return readdirSync(path.join(this.workspace,'exercises'),{withFileTypes:true}).filter(d=>d.isDirectory()&&validId(d.name)&&existsSync(this.file(d.name))).map(d=>this.get(d.name)).sort((a,b)=>a.name.localeCompare(b.name));}
 create(id){if(existsSync(this.file(id)))return this.get(id);assert(Object.hasOwn(this.catalogue,id)&&text(this.catalogue[id],200),'Exercise is not in the app catalogue');const r={id,name:this.catalogue[id],revision:0,versions:[],approvedVersionId:null,developmentVersionId:null,productionVersionId:null,review:{versionId:null,status:'unreviewed',note:'',updatedAt:new Date().toISOString()},assignment:null,history:[]};validateRecord(r);mkdirSync(this.folder(id),{recursive:true});this.checked(this.folder(id));try{writeFileSync(this.file(id),JSON.stringify(r,null,2)+'\n',{flag:'wx'});}catch(e){if(e.code!=='EEXIST')throw e;}return this.get(id);}
 lock(id){const folder=this.folder(id);this.checked(folder);const file=path.join(folder,'.lock');try{const fd=openSync(file,'wx');writeFileSync(fd,JSON.stringify({pid:process.pid,at:new Date().toISOString()}));return()=>{closeSync(fd);unlinkSync(file);};}catch(e){if(e.code==='EEXIST')throw new ReviewError('Exercise is being saved by another worker. Refresh before retrying.',409);throw e;}}
 mutate(id,expectedRevision,change){const unlock=this.lock(id);try{const r=this.get(id);assert(Number.isSafeInteger(expectedRevision)&&r.revision===expectedRevision,'Review changed in another window or agent. Refresh before saving.',409);change(r);r.revision++;validateRecord(r);save(this.file(id),r);return r;}finally{unlock();}}
 decide(input){return this.mutate(input.id,input.expectedRevision,r=>this.applyDecision(r,input));}
 applyDecision(r,{versionId,fingerprint:fp,status,note}){const v=r.versions.find(v=>v.id===versionId);assert(v&&v.fingerprint===fp,'Decision does not match the registered version',409);assert(['approved','needs-changes'].includes(status)&&text(note),'Invalid decision');assert(status!=='needs-changes'||note.trim(),'Describe the requested change');r.review={versionId,status,note:note.trim(),updatedAt:new Date().toISOString()};if(status==='approved')r.approvedVersionId=versionId;r.history.push(event('owner-decision',versionId,note.trim(),status));}
 claim(id,expectedRevision,worker,batch){this.create(id);return this.mutate(id,expectedRevision,r=>{assert(text(worker,150)&&worker.trim()&&text(batch,150)&&batch.trim(),'Worker and batch required');assert(!r.assignment||r.assignment.worker===worker,'Another worker owns this exercise',409);r.assignment={worker,batch};r.history.push(event('claimed',r.review.versionId,worker+' / '+batch));});}
 release(id,expectedRevision,worker){return this.mutate(id,expectedRevision,r=>{assert(r.assignment?.worker===worker,'Only the assigned worker can release this exercise',409);r.assignment=null;r.history.push(event('released',r.review.versionId,worker));});}
 addReference(input){
  assert(typeof input.image==='string'&&input.image.length<=6_666_668&&/^[A-Za-z0-9+/]+={0,2}$/.test(input.image),'Invalid reference image data');
  const bytes=Buffer.from(input.image,'base64');assert(bytes.toString('base64')===input.image,'Invalid reference image encoding');assert(bytes.length<=5_000_000,'Reference image must be at most 5 MB');const info=imageInfo(bytes,{allowJpeg:true});assert(info.width>0&&info.height>0&&info.width<=8192&&info.height<=8192&&info.width*info.height<=32_000_000,'Reference dimensions unsupported');
  assert(text(input.label,200)&&input.label.trim()&&text(input.note,3000),'Add an image label; keep guidance under 3000 characters');const digest=sha(bytes);let createdFile;
  try{return this.mutate(input.id,input.expectedRevision,r=>{
   const version=input.versionId===null?null:r.versions.find(v=>v.id===input.versionId);assert(input.versionId===null?r.versions.length===0:version&&version.fingerprint===input.fingerprint,'Reference does not match the viewed version',409);
   const refs=r.reviewReferences||[];assert(refs.length<20,'This exercise already has 20 additional reference images');assert(!refs.some(ref=>ref.sha256===digest),'This reference image is already attached',409);
   const folder=path.join(this.folder(r.id),'references');mkdirSync(folder,{recursive:true});this.checked(folder);const dest=path.join(folder,digest+'.'+info.ext);if(!existsSync(dest)){writeFileSync(dest,bytes,{flag:'wx'});createdFile=dest;}else assert(sha(readFileSync(this.checked(dest)))===digest,'Stored reference content changed',409);
   r.reviewReferences=[...refs,{id:'ref-'+digest.slice(0,16),sha256:digest,url:'/workspace/'+r.id+'/references/'+digest+'.'+info.ext,...info,label:input.label.trim(),note:input.note.trim(),sourceVersionId:input.versionId,createdAt:new Date().toISOString()}];
   r.history.push(event('reference-added',input.versionId,input.label.trim()+(input.note.trim()?' — '+input.note.trim():'')));
  });}catch(error){if(createdFile)unlinkSync(this.checked(createdFile));throw error;}
 }
 candidate(id,expectedRevision,files,reference,brief){this.create(id);assert(files?.length===2,'Two pose files required');const frames=files.map(file=>{const bytes=readFileSync(file),info=imageInfo(bytes);assert(info.width>0&&info.height>0&&info.width<=8192&&info.height<=8192,'Image dimensions unsupported');return {bytes,...info,sha256:sha(bytes)};});assert(frames[0].width===frames[1].width&&frames[0].height===frames[1].height,'Both pose canvases must match');const fp=fingerprint(frames),versionId='v-'+fp.slice(0,16);let createdFolder;
 try{return this.mutate(id,expectedRevision,r=>{
  assert(r.assignment?.worker,'Claim this exercise before registering a candidate',409);assert(!r.versions.some(v=>v.fingerprint===fp),'This exact pair is already registered',409);const parent=path.join(this.folder(id),'versions');mkdirSync(parent,{recursive:true});this.checked(parent);const folder=path.join(parent,versionId);assert(!existsSync(folder),'Version assets are immutable',409);mkdirSync(folder);createdFolder=folder;this.checked(folder);
  for(let i=0;i<2;i++){const dest=path.join(folder,'frame-'+i+'.'+frames[i].ext);writeFileSync(dest,frames[i].bytes,{flag:'wx'});}
  const previous=r.versions.find(v=>v.id===r.approvedVersionId)||r.versions.at(-1);assert(previous||brief,'A new exercise needs --brief with constraints and references');const refs=structuredClone(brief?.references||previous?.references||[]);
  if(reference){const bytes=readFileSync(reference),info=imageInfo(bytes),digest=sha(bytes),folder=path.join(this.folder(id),'references');mkdirSync(folder,{recursive:true});this.checked(folder);const dest=path.join(folder,digest+'.'+info.ext);if(!existsSync(dest))writeFileSync(dest,bytes,{flag:'wx'});refs.push({label:'Supplied form reference',url:'/workspace/'+id+'/references/'+digest+'.'+info.ext,note:'Reference only; match the exact variation in the brief.'});}
  if(brief?.generation){assert(JSON.stringify(brief.generation).length<100000,'Generation record is too large');writeFileSync(path.join(folder,'generation.json'),JSON.stringify(brief.generation,null,2)+'\n',{flag:'wx'});}
  r.versions.push({id:versionId,fingerprint:fp,generator:r.assignment.worker,createdAt:new Date().toISOString(),frames:frames.map((f,i)=>({url:'/workspace/'+id+'/versions/'+versionId+'/frame-'+i+'.'+f.ext,sha256:f.sha256,width:f.width,height:f.height})),references:refs,constraints:structuredClone(brief?.constraints||previous?.constraints||[]),audit:{status:'not-recorded',findings:[],checks:[]}});
  r.review={versionId,status:'unreviewed',note:'',updatedAt:new Date().toISOString()};r.history.push(event('candidate-added',versionId,'New candidate; existing approved version retained.'));
 });}catch(e){if(createdFolder&&realpathSync(createdFolder).startsWith(this.workspace+path.sep))rmSync(createdFolder,{recursive:true});throw e;}}
 audit(id,expectedRevision,versionId,audit){return this.mutate(id,expectedRevision,r=>{const v=r.versions.find(v=>v.id===versionId);assert(v&&audit.versionId===versionId&&audit.fingerprint===v.fingerprint,'Audit fingerprint/version mismatch',409);validateAudit(audit);assert(text(audit.reviewer,150)&&audit.reviewer.trim(),'Independent reviewer required');assert(audit.reviewer!==v.generator&&audit.reviewer!==r.assignment?.worker,'Generator cannot perform the independent audit');if(audit.status==='passed')assert(['form','anatomy','grip','perspective','fixed-elements','transparency','readability','variation'].every(id=>audit.checks.some(c=>c.id===id&&c.result==='pass'))&&!audit.checks.some(c=>c.result!=='pass')&&!audit.findings.some(f=>f.severity==='error'),'Passed audits require every checklist item to pass');v.audit=structuredClone(audit);r.history.push({...event('audit-recorded',versionId,audit.reviewer+': '+audit.status),audit:structuredClone(audit)});});}
 export(){const exercises=this.list();return {schemaVersion:1,exportedAt:new Date().toISOString(),baseRevisions:Object.fromEntries(exercises.map(r=>[r.id,r.revision])),exercises};}
 importReviews(records,expectedRevisions){assert(Array.isArray(records)&&records.length>0&&records.length<=400,'Invalid review bundle');const ids=records.map(r=>r.id);assert(new Set(ids).size===ids.length&&ids.every(validId),'Duplicate or invalid exercise ID');const unlocks=[];try{
  for(const id of [...ids].sort())unlocks.push(this.lock(id));
  const changes=records.map(incoming=>{validateRecord(incoming);const r=this.get(incoming.id);assert(r.revision===expectedRevisions?.[r.id],'Import conflicts with newer workspace changes: '+r.name,409);assert(JSON.stringify(incoming.versions)===JSON.stringify(r.versions),'Imported version content differs. Register candidates through the authoring CLI.',409);assert(JSON.stringify(incoming.reviewReferences||[])===JSON.stringify(r.reviewReferences||[]),'Imported reference images differ. Attach images in the local dashboard.',409);const v=r.versions.find(v=>v.id===incoming.review.versionId);assert(v,'Unknown imported review version');assert(['approved','needs-changes'].includes(incoming.review.status),'Only explicit review decisions can be imported');this.applyDecision(r,{...incoming.review,fingerprint:v.fingerprint});r.revision++;validateRecord(r);return {before:this.get(r.id),after:r};});
  const written=[];try{for(const change of changes){save(this.file(change.after.id),change.after);written.push(change);}}catch(e){for(const c of written)save(this.file(c.before.id),c.before);throw e;}return changes.map(c=>c.after);
 }finally{for(const unlock of unlocks.reverse())unlock();}}
 asset(url){assert(/^\/workspace\/[a-z0-9-]+\/(versions\/v-[a-f0-9]{16}\/frame-[01]\.(png|webp)|references\/[a-f0-9]{64}\.(png|webp|jpg))$/.test(url),'Invalid asset path',404);const pieces=url.split('/').slice(2),file=path.join(this.workspace,'exercises',...pieces);assert(existsSync(file),'Asset not found',404);const real=this.checked(file),record=this.get(pieces[0]);const expected=url.includes('/references/')?record.reviewReferences?.find(ref=>ref.url===url)?.sha256||record.versions.flatMap(v=>v.references).find(ref=>ref.url===url)&&path.basename(file).split('.')[0]:record.versions.flatMap(v=>v.frames).find(f=>f.url===url)?.sha256;assert(expected&&sha(readFileSync(real))===expected,'Registered asset content changed',409);return real;}
}
