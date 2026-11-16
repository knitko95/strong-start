import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {validateRecord,fingerprint,sha} from './lib/pose-review-store.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),folder=path.join(root,'exercise-guides/pose-review');
const seed=JSON.parse(readFileSync(path.join(folder,'seed.v1.json'))),catalogue=JSON.parse(readFileSync(path.join(root,'exercise-guides/poses/catalogue.v1.json'))),briefs=JSON.parse(readFileSync(path.join(folder,'briefs.v1.json')));
assert.equal(seed.schemaVersion,1);assert.equal(briefs.schemaVersion,1);assert.deepEqual(seed.exercises.map(r=>r.id).sort(),Object.keys(catalogue.exercises).sort());
for(const r of seed.exercises){validateRecord(r);assert.equal(r.revision,0);assert.equal(r.name,catalogue.exercises[r.id].name);assert.equal(r.versions.length,1);const v=r.versions[0];assert.equal(v.audit.status,'not-recorded');assert.equal(r.review.status,'approved');assert.equal(r.approvedVersionId,v.id);assert.equal(r.developmentVersionId,v.id);assert.equal(r.productionVersionId,null);assert.deepEqual(v.constraints,briefs.exercises[r.id].constraints);assert.deepEqual(v.references,briefs.exercises[r.id].references);assert.equal(v.fingerprint,fingerprint(v.frames));for(let i=0;i<2;i++){const f=v.frames[i],original=catalogue.exercises[r.id].frames[i];assert.equal(f.sha256,original.sha256);assert.equal(f.url,'/exercise-guides/poses/'+original.asset);assert.equal(sha(readFileSync(path.join(root,f.url))),f.sha256);assert.equal(f.width,original.width);assert.equal(f.height,original.height);}assert(v.references.every(ref=>!ref.url||ref.url.startsWith('https://')),'Private local reference paths must not enter the public seed');}
new vm.Script(readFileSync(path.join(folder,'review.js'),'utf8'));
new vm.Script(readFileSync(path.join(folder,'hosted.js'),'utf8'));
for(const file of ['README.md','visual-spec.md','coordinator.md','generator.md','auditor.md','templates/batch-handoff.md','templates/audit.json','templates/audit.schema.json'])assert(existsSync(path.join(root,'docs/pose-authoring',file)));
console.log('PASS review seed matches every approved pose hash, preserves approvals/dev state, records unaudited status and contains no local references');
