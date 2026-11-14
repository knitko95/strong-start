import assert from 'node:assert/strict';import {readFileSync as read,readdirSync,unlinkSync,lstatSync,writeFileSync as write}from'node:fs';import {createHash}from'node:crypto';import {gunzipSync}from'node:zlib';import {createRequire}from'node:module';import path from'node:path';import{fileURLToPath}from'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),directory=path.join(root,'exercise-guides/shared'),require=createRequire(import.meta.url),catalogue=require('./animation-inventory.cjs');
const readJSON=p=>JSON.parse(read(p,'utf8')),manifest=readJSON(path.join(directory,'manifest.json')),reached=new Set(),checked=new Map();
function asset(a){assert(/^assets\/[a-z0-9-]+[.-][a-f0-9]{16}\.(?:json|png|bin\.gz)$/.test(a.url),a.url);if(checked.has(a.url))return checked.get(a.url);const file=path.resolve(directory,a.url);assert(file.startsWith(directory+path.sep));const b=read(file);assert.equal(b.length,a.bytes,a.url+' length');assert.equal(createHash('sha256').update(b).digest('hex'),a.sha256,a.url+' hash');assert(a.url.includes(a.sha256.slice(0,16)));assert(b.length<25*1024*1024);reached.add(a.url);checked.set(a.url,b);return b;}
function deps(value){if(!value||typeof value!=='object')return;if(value.url&&value.sha256){asset(value);return;}for(const v of Object.values(value))deps(v);}
deps(manifest.library);const library=JSON.parse(asset(manifest.library));deps(library);
const characters=readJSON(path.join(directory,'characters.json'));assert.equal(characters.schemaVersion,1);deps(characters);
for(const c of characters.candidates){assert.deepEqual(c.jointNames,library.jointNames);assert.equal(c.sourceInverseBindMatrices.length,55);assert(c.vertices<35000&&c.triangles<60000);assert.equal(c.reviewStatus,'draft');}
const original=readJSON(path.join(root,'animation-authoring/accepted-manifest.json')),acceptedLibrary=readJSON(path.join(root,'animation-authoring/accepted-library.json'));
assert.deepEqual(library.character,acceptedLibrary.character,'Character geometry must remain unchanged');assert.deepEqual(library.jointNames,acceptedLibrary.jointNames);assert.equal(library.jointNames.length,55);
const byId=new Map(manifest.exercises.map(e=>[e.id,e]));assert.equal(byId.size,manifest.exercises.length);assert.equal(byId.size,446);assert(byId.has('air-bike'));
for(const e of catalogue.exercises)assert.equal(byId.get(e.id)?.name,e.n,'Missing/mislabelled strength animation '+e.id);
for(const e of catalogue.moves)assert(byId.has(e.id),'Missing named warm-up/stretch '+e.id);
let tracks=0,motionBytes=0,configBytes=0,newClips=0;const motionSizes=[];
for(const e of manifest.exercises){
 assert.deepEqual(e.enabledEnvironments,['development']);assert(['previously-reviewed','awaiting-owner-review'].includes(e.reviewStatus));const raw=asset(e.scene);configBytes+=raw.length;const c=JSON.parse(raw);assert.equal(c.id,e.id);deps(c);
 let nodes=c.nodes;if(c.schemaVersion===2){newClips++;assert.equal(c.authoring.characterSHA256,library.character.asset.sha256);const base=JSON.parse(asset(c.base));nodes=[...base.nodes,...c.props];deps(base);assert.deepEqual(base.jointNames,library.jointNames);assert.equal(c.durationSeconds>=3,true);}
 else assert.equal(c.schemaVersion,1);
 for(const n of nodes)for(const p of n.parts||[])if(!p.character)assert(library.geometries[p.geometry],'Unknown geometry '+p.geometry);
 const packed=c.animation,buf=gunzipSync(asset(packed.asset));assert.equal(buf.length,packed.decodedBytes);motionBytes+=packed.asset.bytes;motionSizes.push(packed.asset.bytes);const arrays={};
 for(const [key,d]of Object.entries(packed.arrays)){assert.equal(d.componentType,5126);assert.equal(d.length,d.count*d.size*4);assert(d.offset+d.length<=buf.length);const vals=Array.from({length:d.length/4},(_,i)=>buf.readFloatLE(d.offset+i*4));assert(vals.every(Number.isFinite),e.id+' non-finite samples');arrays[key]=vals;}
 assert(c.tracks.length);for(const t of c.tracks){assert(nodes[t.node]);assert(['translation','rotation','scale'].includes(t.path));const times=arrays[t.input],values=arrays[t.output],size=t.path==='rotation'?4:3;assert.equal(values.length,times.length*size);assert(times.every((n,i)=>n>=0&&(i===0||n>times[i-1])));if(t.path==='rotation')for(let i=0;i<values.length;i+=4)assert(Math.abs(Math.hypot(...values.slice(i,i+4))-1)<.00001,e.id+' quaternion norm');tracks++;}
}
// Retain source assets for deterministic repairs of the earlier reviewed clips.
// Their body animation is immutable here; open fingers and implements are not
// grandfathered in as correct technique merely because a scene was accepted.
for(const e of original.exercises){const old=JSON.parse(asset(e.scene));deps(old);const next=JSON.parse(asset(byId.get(e.id).scene));if(e.scene.sha256===byId.get(e.id).scene.sha256)continue;
 assert.equal(next.authoring.originalSceneSHA256,e.scene.sha256,e.id+' repair source');
 const digit=n=>/^(index|middle|ring|pinky|thumb)_/.test(n.name);
 for(let i=0;i<old.nodes.length;i++)if(old.nodes[i].bone&&!digit(old.nodes[i]))assert.deepEqual(next.nodes[i],old.nodes[i],e.id+' changed original body node');
 const oldBuf=gunzipSync(asset(old.animation.asset)),newBuf=gunzipSync(asset(next.animation.asset));
 for(const track of old.tracks)if(old.nodes[track.node].bone&&!digit(old.nodes[track.node])){
  assert(next.tracks.some(t=>JSON.stringify(t)===JSON.stringify(track)),e.id+' changed original body track');
  for(const key of [track.input,track.output]){const a=old.animation.arrays[key],b=next.animation.arrays[key];assert.deepEqual(newBuf.subarray(b.offset,b.offset+b.length),oldBuf.subarray(a.offset,a.offset+a.length),e.id+' changed original body samples');}
 }
}
const unused=readdirSync(path.join(directory,'assets')).filter(n=>!reached.has('assets/'+n));
if(process.argv.includes('--prune'))for(const n of unused){const file=path.resolve(directory,'assets',n),base=path.resolve(directory,'assets')+path.sep;assert(file.startsWith(base)&&lstatSync(file).isFile());unlinkSync(file);}
const report={exercises:byId.size,strength:catalogue.exercises.length,namedGuideEntries:catalogue.moves.length,previouslyAuthored:original.exercises.length,newClips,reachableAssets:reached.size,assetBytes:[...checked.values()].reduce((n,b)=>n+b.length,0),characterBytes:library.character.asset.bytes,motionBytes,configBytes,motionMinimum:Math.min(...motionSizes),motionMaximum:Math.max(...motionSizes),tracks,unusedRemoved:process.argv.includes('--prune')?unused.length:0};
write(path.join(root,'animation-authoring/package-report.json'),JSON.stringify(report,null,2)+'\n');console.log('PASS complete animation package',JSON.stringify(report));
