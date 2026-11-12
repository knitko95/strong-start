import assert from 'node:assert/strict';
import {readFileSync,readdirSync,statSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
const root=fileURLToPath(new URL('../',import.meta.url)),directory=path.join(root,'exercise-guides');
const data=JSON.parse(readFileSync(path.join(directory,'registry.v1.json'),'utf8'));
const html=readFileSync(path.join(root,'index.html'),'utf8');
const raw=html.match(/const LIB_RAW\s*=\s*`([\s\S]*?)`/)[1];
const slug=n=>n.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const catalogue=new Map(raw.trim().split('\n').map(line=>{const name=line.split('|')[0].trim();return [slug(name),name];}));
assert.equal(data.schemaVersion,1);assert.ok(data.revision);
const assets=new Set();
for(const [id,guide] of Object.entries(data.guides)){
  assert(catalogue.has(id),`Unknown exercise ${id}`);assert.equal(guide.exerciseId,id);assert.equal(guide.name,catalogue.get(id));
  assert.equal(guide.contentSource,'catalogue');assert.equal(guide.fallback.type,'existing-text-instructions');
  assert(Array.isArray(guide.enabledEnvironments)&&guide.enabledEnvironments.every(e=>['development','production'].includes(e)));
  const animation=data.animations[guide.animationId];assert(animation);assert(Number.isInteger(animation.version)&&animation.version>0);
  assert.equal(guide.animationId,id,'Initial guide mappings must name their matching movement');
  assert(data.characters[guide.defaultCharacter]);assert(animation.variants[guide.defaultCharacter]);
  const p=guide.presentation;assert(['floor','standing'].includes(p.layout));
  assert(/^[-\d.]+deg [\d.]+deg [\d.]+m$/.test(p.cameraOrbit));assert(/^[-\d.]+m [-\d.]+m [-\d.]+m$/.test(p.cameraTarget));
  assert(Number.isFinite(p.radiusMetres)&&p.radiusMetres>=1&&p.radiusMetres<=5);assert([.5,1].includes(p.defaultSpeed));
  for(const [character,variant] of Object.entries(animation.variants)){
    assert(data.characters[character]);assert.equal(variant.review.status,'visually-accepted');assert(/^\d{4}-\d{2}-\d{2}$/.test(variant.review.date));
    assert(/^models\/[a-z0-9-]+\.rose\.v\d+\.[a-f0-9]{12}\.glb$/.test(variant.asset));
    assert(variant.asset.startsWith(`models/${id}.rose.`),'Asset filename must match the linked exercise');
    const target=path.resolve(directory,variant.asset);assert(target.startsWith(directory+path.sep));const bytes=readFileSync(target);
    assert.equal(bytes.length,variant.bytes);assert(bytes.length<25*1024*1024);assert.equal(createHash('sha256').update(bytes).digest('hex'),variant.sha256);
    assert(variant.asset.includes(`.v${animation.version}.${variant.sha256.slice(0,12)}.`));
    assert.equal(bytes.readUInt32LE(0),0x46546c67);assert.equal(bytes.readUInt32LE(4),2);assert.equal(bytes.readUInt32LE(8),bytes.length);
    const gltf=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());
    assert(gltf.skins?.length);assert(gltf.animations?.some(a=>a.name===animation.clip));assert(gltf.images?.every(i=>!i.uri));assets.add(variant.asset);
  }
}
const reviewed=['dumbbell-romanian-deadlift','hammer-curl','standing-dumbbell-shoulder-press','dumbbell-bench-press','plank',
  'goblet-squat','incline-dumbbell-press','dumbbell-floor-press','seated-dumbbell-shoulder-press','dumbbell-lateral-raise','single-arm-dumbbell-bench-press'];
assert.deepEqual(Object.keys(data.guides).sort(),reviewed.sort(),'Only the eleven reviewed exercise mappings belong in this candidate');
assert(!Object.hasOwn(data.guides,'squat'));assert.deepEqual(Object.keys(data.characters),['instructor-rose-v1']);
assert(Object.values(data.guides).every(g=>JSON.stringify(g.enabledEnvironments)==='["development"]'),'This candidate is development-only');
assert.deepEqual(new Set(readdirSync(path.join(directory,'models')).filter(p=>p.endsWith('.glb')).map(p=>'models/'+p)),assets);
new vm.Script(readFileSync(path.join(directory,'guides.js'),'utf8'),{filename:'exercise-guides/guides.js'});
assert(statSync(path.join(directory,'vendor/model-viewer-4.4.0.min.js')).size>100000);
console.log('Exercise registry: eleven valid IDs, reviewed assets/versions/hashes, embedded GLBs, dev-only routing; bodyweight squat reference excluded.');
