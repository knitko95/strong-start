import fs from 'node:fs';
import path from 'node:path';
import {remoteClient} from './lib/pose-remote-client.mjs';
import {sha} from './lib/pose-review-core.mjs';
const args=process.argv.slice(2),arg=k=>args[args.indexOf(k)+1];
const manifestFile=arg('--manifest'),manifest=JSON.parse(fs.readFileSync(manifestFile)),api=remoteClient(arg('--url'),arg('--credential-file'));
const report={startedAt:new Date().toISOString(),files:[],records:[],errors:[]};
try{
 const existing=new Map((await api('files')).files.map(f=>[f.path,f]));let next=0;const entries=manifest.files;
 await Promise.all(Array.from({length:4},async()=>{while(next<entries.length){const index=next++,f=entries[index];const bytes=fs.readFileSync(f.local);if(sha(bytes)!==f.digest)throw Error('Source changed after snapshot: '+f.local);let remote=existing.get(f.path);if(!remote)remote=await api('file',bytes,{method:'PUT',raw:true,path:f.path});if(remote.digest!==f.digest||remote.size!==f.size)throw Error('File migration mismatch: '+f.path);report.files.push({path:f.path,digest:f.digest});if(report.files.length%100===0)console.log(JSON.stringify({uploadedOrExisting:report.files.length,total:entries.length}));}}));
 // Records are uploaded only after the entire file manifest is present.
 for(const record of manifest.records){const live=JSON.parse(fs.readFileSync(path.join(manifest.workspace,'exercises',record.id,'record.json')));if(JSON.stringify(live)!==JSON.stringify(record))throw Error('Local reviews changed during file upload. Take a fresh snapshot before cutover; no local data was removed.');}
 for(const record of manifest.records){const result=await api('migrate',{record});if(JSON.stringify(result.record)!==JSON.stringify(record))throw Error('Record mismatch: '+record.id);report.records.push(record.id);}
 const remote=(await api('state')).exercises;if(remote.length!==manifest.records.length)throw Error('Record count differs');for(const record of manifest.records)if(JSON.stringify(remote.find(r=>r.id===record.id))!==JSON.stringify(record))throw Error('Shared record differs: '+record.id);
 // Read every distinct original object back, not just metadata, and hash its bytes.
 const unique=[...new Map(manifest.files.map(f=>[f.digest,f])).values()];let readIndex=0;await Promise.all(Array.from({length:4},async()=>{while(readIndex<unique.length){const f=unique[readIndex++],bytes=await api('file',undefined,{raw:true,path:f.path});if(sha(bytes)!==f.digest)throw Error('Downloaded object mismatch: '+f.path);}}));
 report.verifiedUniqueObjects=unique.length;report.completedAt=new Date().toISOString();console.log(JSON.stringify({records:report.records.length,paths:report.files.length,verifiedUniqueObjects:unique.length}));
}catch(e){report.errors.push(e.message);console.error(e.message);process.exitCode=1;}finally{fs.writeFileSync(path.join(path.dirname(manifestFile),'migration-report.json'),JSON.stringify(report,null,2)+'\n');}
