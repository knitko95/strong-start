// Read-only integrity checks for internal documentation, using no app accounts.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const dir=path.join(root,'docs','exercise-technique');
const json=name=>JSON.parse(fs.readFileSync(path.join(dir,name),'utf8'));
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const catalog=json('catalog.json').exercises, guides=json('guides.json').guides;
const cardio=json('cardio.json').types, sources=json('sources.json').sources, coverage=json('coverage.json');
const prior=JSON.parse(fs.readFileSync(path.join(root,'docs','exercise-audit-2026-11-11.json'),'utf8'));
const slug=n=>n.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const raw=html.match(/const LIB_RAW = `([\s\S]*?)`;/)[1].trim().split(/\r?\n/).map(s=>s.split('|')[0]);
assert.equal(new Set(catalog.map(e=>e.id)).size,catalog.length,'Unique catalog IDs');
assert.deepEqual(catalog.map(e=>({id:e.id,name:e.name})),raw.map(name=>({id:slug(name),name})),'Every current catalog exercise, with unchanged IDs/order');
const how=html.slice(html.indexOf('const MOVE_HOW = ')).match(/^const MOVE_HOW = ([\s\S]*?\r?\n});/)[1];
const context=vm.createContext(Object.create(null));
const moveHow=vm.runInContext('('+how+')',context,{timeout:1000});
assert.deepEqual(guides.map(e=>e.name).sort(),Object.keys(moveHow).sort(),'Every current named warm-up/stretch guide');
assert.equal(new Set(guides.map(e=>e.id)).size,guides.length,'Unique guide anchors');
const priorCatalog=new Map(prior.exercises.map(e=>[e.id,e]));
const priorGuides=new Map(prior.warmupAndStretchHowTos.map(e=>[e.name,e]));
const register=fs.readFileSync(path.join(root,'docs','EXERCISE-SOURCES.md'),'utf8');
for(const e of [...catalog,...guides,...cardio]){
  assert.equal(e.status,'internal-research-draft');
  assert.ok(['same-movement','related-only','unresolved'].includes(e.sourceRelationship));
  for(const key of ['setup','execution','alignmentAndRange','breathingAndTempo','regression'])assert.ok(e.notes[key]?.length>35,`${e.name}: substantive ${key}`);
  if(e.kind!=='cardio')for(const key of ['commonFaults','variantNotes','stopOrRegress'])assert.ok(e.notes[key]?.length>25,`${e.name}: ${key}`);
  assert.ok(e.sourceIds.length>0,`${e.name}: evidence association`);
  assert.equal(new Set(e.sourceIds).size,e.sourceIds.length);
  for(const k of e.sourceIds){assert.ok(sources[k],`${e.name}: unknown source ${k}`);assert.equal(new URL(sources[k].url).protocol,'https:');}
  assert.ok(e.evidenceBoundary.length>80);
  const doc=fs.readFileSync(path.join(dir,e.document),'utf8');
  assert.ok(doc.includes(`<a id="${e.id}"></a>`),`${e.name}: document anchor`);
  for(const [key,value] of Object.entries(e.notes))assert.ok(doc.includes(value),`${e.name}: JSON/Markdown ${key} match`);
  if(e.kind!=='cardio'){
    assert.ok(register.includes(`exercise-technique/${e.document}#${e.id}`),`${e.name}: ongoing source-register link`);
    const old=(e.kind==='catalog'?priorCatalog.get(e.id):priorGuides.get(e.name));
    assert.ok(old,`${e.name}: original NASM record`);
    assert.deepEqual(e.previousNasmAudit.sourceIds,old.sourceIds);
    assert.equal(e.previousNasmAudit.referenceLevel,old.referenceLevel);
  }
}
for(const [id,s] of Object.entries(sources)){
  for(const k of ['publisher','title','url','reviewDate','reviewScope','factsChecked','limitations'])assert.ok(s[k]?.length>0,`${id}: ${k}`);
  assert.ok(fs.readFileSync(path.join(dir,'sources.md'),'utf8').includes(`<a id="${id.toLowerCase()}"></a>`));
}
const labels=cardio.flatMap(e=>e.appLabels);
assert.equal(new Set(labels).size,labels.length,'Cardio labels have one primary movement-type mapping');
for(const name of ['WU_CARDIO','FINISH','COOL_WALK']){
  const block=html.match(new RegExp('const '+name+' = ([\\s\\S]*?);\\r?\\n'))[1];
  for(const [,label] of block.matchAll(/\bt:'((?:\\.|[^'])*)'/g))assert.ok(labels.includes(label),`Unmapped ${name} label: ${label}`);
}
for(const [key,n] of Object.entries({catalog:catalog.length,guides:guides.length,cardioTypes:cardio.length,cardioLabels:labels.length,sources:Object.keys(sources).length}))assert.equal(coverage.summary[key],n,key);
for(const file of fs.readdirSync(dir)){
  if(!file.endsWith('.md'))continue;
  const contents=fs.readFileSync(path.join(dir,file),'utf8');
  assert.ok(!contents.includes('\ufffd'),`${file}: valid text encoding`);
  for(const [,target] of contents.matchAll(/\]\(([^)]+)\)/g)){
    if(/^https?:/.test(target))continue;
    const [fileTarget,anchor]=target.split('#');
    const resolved=path.resolve(dir,fileTarget||file);
    assert.ok(fs.existsSync(resolved),`${file}: missing link ${target}`);
    if(anchor){const text=fs.readFileSync(resolved,'utf8');assert.ok(text.includes(`id="${anchor}"`)||text.split('\n').some(l=>/^#+ /.test(l)&&slug(l.replace(/^#+ /,''))===anchor),`${file}: missing anchor ${target}`);}
  }
}
for(const runtime of ['index.html','sw.js','offline.js'])assert.ok(!fs.readFileSync(path.join(root,runtime),'utf8').includes('exercise-technique/'),`${runtime}: internal notes must not be loaded`);
for(const packageDir of ['dist','dist-production'])if(fs.existsSync(path.join(root,packageDir)))assert.ok(!fs.existsSync(path.join(root,packageDir,'docs')),`${packageDir}: internal docs excluded`);
console.log(`Internal technique checks passed: ${catalog.length} exercises, ${guides.length} guides, ${cardio.length} cardio types / ${labels.length} labels, ${Object.keys(sources).length} sources. No runtime import.`);
