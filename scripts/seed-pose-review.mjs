import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {fingerprint,validateRecord} from './lib/pose-review-store.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),folder=path.join(root,'exercise-guides/pose-review');
const catalogue=JSON.parse(readFileSync(path.join(root,'exercise-guides/poses/catalogue.v1.json'),'utf8'));
const briefs=JSON.parse(readFileSync(path.join(folder,'briefs.v1.json'),'utf8'));
const exercises=Object.entries(catalogue.exercises).map(([id,entry])=>{
 const frames=entry.frames.map(({asset,sha256,width,height})=>({url:'/exercise-guides/poses/'+asset,sha256,width,height})),fp=fingerprint(frames),versionId='v-'+fp.slice(0,16),brief=briefs.exercises[id];
 if(!brief)throw Error('Missing exercise brief: '+id);
 return validateRecord({id,name:entry.name,revision:0,versions:[{id:versionId,fingerprint:fp,createdAt:'2026-11-15T00:00:00.000Z',frames,references:brief.references,constraints:brief.constraints,audit:{status:'not-recorded',findings:[],checks:[]}}],approvedVersionId:versionId,developmentVersionId:versionId,productionVersionId:null,review:{versionId,status:'approved',note:'Owner-approved artwork imported from the original 18-exercise pilot. Approval is for this exact pose pair; no independent form audit is recorded.',updatedAt:'2026-11-15T00:00:00.000Z'},assignment:null,history:[{id:'seed-'+id,at:'2026-11-15T00:00:00.000Z',type:'approval-imported',versionId,status:'approved',note:'Existing owner approval preserved; exact frame fingerprints recorded. Development integration only; no production publication.'}]});
});
mkdirSync(folder,{recursive:true});writeFileSync(path.join(folder,'seed.v1.json'),JSON.stringify({schemaVersion:1,revision:catalogue.revision,exercises},null,2)+'\n');
console.log('Seeded '+exercises.length+' approved exercises without changing artwork or implying a form audit.');
