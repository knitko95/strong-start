// Read-only integrity checks for the internal visual-reference graph.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const dir=path.join(root,'docs','exercise-visuals');
const read=file=>fs.readFileSync(file,'utf8');
const json=file=>JSON.parse(read(path.join(dir,file)));
const entries=json('entries.json').entries,media=json('media.json').media;
const sources=json('sources.json').sources,publishers=json('publishers.json').publishers;
const excluded=json('excluded.json').associations,summary=json('coverage.json').summary;
const technique=file=>JSON.parse(read(path.join(root,'docs','exercise-technique',file)));
const expected=[...technique('catalog.json').exercises,...technique('guides.json').guides,...technique('cardio.json').types];
assert.deepEqual(entries.map(({id,name,kind})=>({id,name,kind})),expected.map(({id,name,kind})=>({id,name,kind})),'Every technique inventory entry in order, with unchanged names and IDs');
assert.equal(new Set(entries.map(e=>e.kind+':'+e.id)).size,entries.length,'Unique IDs within each exercise/guide/cardio namespace');
const count=values=>Object.fromEntries(values.reduce((m,k)=>m.set(k,(m.get(k)||0)+1),new Map()));
const relationships=['same-labelled-movement','related-only','not-found'];
const used=new Set();
for(const [i,e] of entries.entries()){
  assert.equal(e.checkedOn,'2026-11-13');
  assert.equal(e.reviewStatus,'reference-candidate; full-motion-not-reviewed');
  assert.ok(e.editorialNote.length>15,`${e.name}: explicit match boundary`);
  assert.ok(e.image||e.video,`${e.name}: at least one visual`);
  assert.deepEqual(e.appLabels,expected[i].appLabels,'Cardio alias mapping');
  const doc=read(path.join(dir,e.document));
  assert.ok(doc.includes(`id="${e.id}"`),`${e.name}: anchor`);
  assert.ok(doc.includes(e.editorialNote),`${e.name}: JSON/Markdown boundary parity`);
  for(const kind of ['image','video']){
    assert.ok(relationships.includes(e[kind+'Relationship']));
    assert.equal(e[kind+'Relationship']==='not-found',!e[kind],`${e.name}: format gap status`);
    if(!e[kind])continue;
    const m=media[e[kind]];assert.ok(m,`${e.name}: unknown ${kind}`);used.add(m.id);
    assert.ok(kind==='video'?m.type==='video':['image','video-poster','animated-image'].includes(m.type));
    assert.ok(doc.includes(m.url),`${e.name}: Markdown media link`);
  }
  for(const k of e.additionalMedia||[]){assert.ok(media[k]);used.add(k);assert.ok(doc.includes(media[k].url));}
  if(e.kind!=='cardio')assert.ok(read(path.join(root,'docs','EXERCISE-SOURCES.md')).includes(`exercise-visuals/${e.document}#${e.id}`));
}
for(const k of [...used])if(media[k].videoId)used.add(media[k].videoId);
assert.deepEqual([...used].sort(),Object.keys(media).sort(),'Only referenced media and poster parents');
assert.equal(new Set(Object.values(media).map(m=>m.url)).size,Object.keys(media).length,'Deduplicated media URLs');
const sourceMd=read(path.join(dir,'sources.md'));
const excludedUrls=new Set(excluded.map(x=>x.videoUrl));
for(const [k,m] of Object.entries(media)){
  assert.equal(k,m.id);assert.equal(k,'v'+createHash('sha256').update(m.url).digest('hex').slice(0,12));
  assert.equal(new URL(m.url).protocol,'https:');assert.ok(!excludedUrls.has(m.url),`${k}: quarantined media`);
  assert.ok(publishers[m.publisherId]);assert.ok(m.sourceIds.length);
  for(const sid of m.sourceIds)assert.ok(sources[sid]);
  assert.ok(['not-viewed','contact-sheet-identity-only','sample-frames-identity-only'].includes(m.visualReview));
  if(m.type==='video'){
    assert.equal(m.visualReview,'not-viewed','No unperformed motion inspection claims');
    if(m.providerMetadata){assert.equal(m.providerMetadata.status,200);assert.ok(m.providerMetadata.title);assert.ok(m.providerMetadata.author_name);}
    else {assert.equal(m.linkCheck?.status,200);assert.match(m.linkCheck.contentType,/^video\//);}
  }
  if(m.type==='image'){assert.equal(m.linkCheck?.status,200);assert.equal(m.visualReview,'contact-sheet-identity-only');}
  if(m.type==='video-poster'){assert.equal(media[m.videoId]?.type,'video');assert.ok(sourceMd.includes(`](#${m.videoId})`));}
  assert.ok(sourceMd.includes(`id="${k}"`));assert.ok(sourceMd.includes(m.url));
}
for(const [id,s] of Object.entries(sources)){
  assert.equal(id,'s'+createHash('sha256').update(s.url).digest('hex').slice(0,12));
  assert.equal(new URL(s.url).protocol,'https:');assert.ok(publishers[s.publisherId]);assert.ok(s.factsChecked.length>40&&s.accessScope.length>40);
}
for(const p of Object.values(publishers)){assert.ok(p.basis.length>50&&p.limitations.length>50);for(const u of p.evidenceUrls)assert.equal(new URL(u).protocol,'https:');}
assert.deepEqual(summary.videoRelationships,count(entries.map(e=>e.videoRelationship)));
assert.deepEqual(summary.stillFormatsByEntry,count(entries.map(e=>e.image?media[e.image].type:'not-found')));
assert.deepEqual(summary.uniqueMediaTypes,count(Object.values(media).map(m=>m.type)));
for(const [key,n] of Object.entries({entries:entries.length,entriesWithAnyVisual:entries.filter(e=>e.image||e.video).length,entriesWithVideo:entries.filter(e=>e.video).length,catalog:entries.filter(e=>e.kind==='catalog').length,guides:entries.filter(e=>e.kind==='guide').length,cardioTypes:entries.filter(e=>e.kind==='cardio').length,cardioLabels:entries.flatMap(e=>e.appLabels||[]).length,uniqueMedia:Object.keys(media).length,sourcePages:Object.keys(sources).length,publisherGroups:Object.keys(publishers).length,excludedAssociations:excluded.length,identityReviewedStills:Object.values(media).filter(m=>m.visualReview!=='not-viewed').length}))assert.equal(summary[key],n,key);
const slug=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
for(const file of fs.readdirSync(dir).filter(f=>f.endsWith('.md'))){
  const contents=read(path.join(dir,file));assert.ok(!contents.includes('\ufffd'));
  for(const [,target] of contents.matchAll(/\]\(([^)]+)\)/g)){
    if(/^https?:/.test(target)){assert.equal(new URL(target).protocol,'https:');continue;}
    const [fileTarget,anchor]=target.split('#'),resolved=path.resolve(dir,fileTarget||file);
    assert.ok(fs.existsSync(resolved),`${file}: missing ${target}`);
    if(anchor){const text=read(resolved);assert.ok(text.includes(`id="${anchor}"`)||text.split('\n').some(l=>/^#+ /.test(l)&&slug(l.replace(/^#+ /,''))===anchor),`${file}: missing anchor ${target}`);}
  }
}
for(const file of ['index.html','sw.js','offline.js'])assert.ok(!read(path.join(root,file)).includes('exercise-visuals/'),`${file}: no runtime import`);
for(const packageDir of ['dist','dist-production'])if(fs.existsSync(path.join(root,packageDir)))assert.ok(!fs.existsSync(path.join(root,packageDir,'docs')),'Docs excluded from runtime package');
console.log(`Visual-reference checks passed: ${entries.length} entries, ${summary.uniqueMedia} media URLs, ${summary.sourcePages} source pages; conflicts excluded; no runtime import. Full video motion remains unreviewed.`);
