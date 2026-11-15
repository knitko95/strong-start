import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
const root=new URL('../',import.meta.url),base=new URL('exercise-guides/poses/',root),data=JSON.parse(readFileSync(new URL('catalogue.v1.json',base)));
const html=readFileSync(new URL('index.html',root),'utf8'),raw=html.match(/const LIB_RAW\s*=\s*`([\s\S]*?)`/)[1];
const slug=n=>n.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const names=new Map(raw.trim().split('\n').map(row=>[slug(row.split('|')[0]),row.split('|')[0]]));
assert.equal(data.schemaVersion,1);assert.equal(Object.keys(data.exercises).length,18);const files=new Set();
for(const [id,entry] of Object.entries(data.exercises)){
 assert.equal(entry.name,names.get(id));assert.deepEqual(entry.enabledEnvironments,['development']);assert.equal(entry.review,'owner-approved');assert.equal(entry.timingMs,900);assert.equal(entry.frames.length,2);
 assert.equal(entry.frames[0].width,entry.frames[1].width);assert.equal(entry.frames[0].height,entry.frames[1].height);
 assert(Number.isInteger(entry.preview?.frame)&&entry.preview.frame>=0&&entry.preview.frame<entry.frames.length,'Every approved exercise selects an explicit preview frame');
 const selected=entry.frames[entry.preview.frame],bounds=entry.preview.bounds;
 assert(Array.isArray(bounds)&&bounds.length===4&&bounds.every(Number.isFinite));
 assert(bounds[0]>=0&&bounds[1]>=0&&bounds[2]>bounds[0]&&bounds[3]>bounds[1]&&bounds[2]<=selected.width&&bounds[3]<=selected.height,'Preview bounds must fit the selected still');
 for(const frame of entry.frames){assert(/^assets\/[a-z0-9-]+\.[a-f0-9]{12}\.webp$/.test(frame.asset));const bytes=readFileSync(new URL(frame.asset,base));assert.equal(bytes.length,frame.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),frame.sha256);assert.equal(bytes.toString('ascii',0,4),'RIFF');assert.equal(bytes.toString('ascii',8,12),'WEBP');assert(frame.asset.includes(frame.sha256.slice(0,12)));assert(/^[a-f0-9]{64}$/.test(frame.sourceSha256));files.add(frame.asset.split('/')[1]);}
}
assert.deepEqual([...files].sort(),readdirSync(new URL('assets/',base)).sort());
new vm.Script(readFileSync(new URL('exercise-guides/pose-guides.js',root),'utf8'));
new vm.Script(readFileSync(new URL('exercise-guides/shared-guides.js',root),'utf8'));
console.log('PASS 18 approved pose pairs: IDs, environment gates, 36 content-addressed WebP assets, bytes/hashes and loader syntax');
