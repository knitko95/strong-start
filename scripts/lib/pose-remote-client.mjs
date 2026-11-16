import {readFileSync} from 'node:fs';
export function remoteClient(url,credentialFile){
 const base=new URL(url);if(base.protocol!=='https:'&&!['127.0.0.1','localhost'].includes(base.hostname))throw Error('Remote workspace requires HTTPS');
 const token=readFileSync(credentialFile,'utf8').trim();if(!/^pose_[a-f0-9]{64}$/.test(token))throw Error('Invalid private credential file');
 return async(action,input,{method,raw=false,path}={})=>{
  const target=new URL('/api/pose-review/'+action,base);if(path)target.searchParams.set('path',path);
  const response=await fetch(target,{method:method||(input===undefined?'GET':'POST'),headers:{Authorization:'Bearer '+token,...(input!==undefined?{'Content-Type':raw?'application/octet-stream':'application/json'}:{})},body:input===undefined?undefined:raw?input:JSON.stringify(input),redirect:'error',signal:AbortSignal.timeout(120000)});
  if(!response.ok){const text=await response.text();let reason;try{reason=JSON.parse(text).error;}catch{}throw Error('Workspace '+response.status+': '+(reason||'request failed'));}
  return raw&&input===undefined?Buffer.from(await response.arrayBuffer()):response.json();
 };
}
