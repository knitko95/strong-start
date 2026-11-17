import {createHash} from 'node:crypto';
export const sha=value=>createHash('sha256').update(value).digest('hex');
export const fingerprint=frames=>sha(frames.map(f=>f.sha256+(f.durationMs===undefined?'':'@'+f.durationMs)).join('|'));
export const validId=id=>typeof id==='string'&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)&&id.length<=120;
export class ReviewError extends Error{constructor(message,status=400){super(message);this.status=status;}}
export const assert=(value,message,status=400)=>{if(!value)throw new ReviewError(message,status);};
export const text=(value,max=12000)=>typeof value==='string'&&value.length<=max;
const hash=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
export function parseJSON(value,maxBytes=2_000_000){assert(Buffer.byteLength(value)<=maxBytes,'Review file is too large');return JSON.parse(value,(key,value)=>{assert(!['__proto__','prototype','constructor'].includes(key),'Unsafe property');return value;});}
function safeFrame(url,id){return typeof url==='string'&&(new RegExp('^/workspace/'+id+'/versions/v-[a-f0-9]{16}/frame-[0-3]\\.(png|webp)$').test(url)||/^\/exercise-guides\/poses\/assets\/[a-z0-9-]+\.[a-f0-9]{12}\.webp$/.test(url));}
export function validateAudit(a){
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
  assert(Array.isArray(v.frames)&&v.frames.length>=2&&v.frames.length<=4&&v.frames.every(f=>safeFrame(f.url,r.id)&&hash(f.sha256)&&Number.isInteger(f.width)&&f.width>0&&f.width<=8192&&Number.isInteger(f.height)&&f.height>0&&f.height<=8192&&(f.durationMs===undefined||Number.isInteger(f.durationMs)&&f.durationMs>=200&&f.durationMs<=3000)),'Invalid frame');
  assert(v.frames.every(f=>f.width===v.frames[0].width&&f.height===v.frames[0].height)&&fingerprint(v.frames)===v.fingerprint,'Frame dimensions or fingerprint mismatch');
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
