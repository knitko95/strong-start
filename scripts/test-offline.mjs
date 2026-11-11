import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
new vm.Script(readFileSync(new URL('../offline.js',import.meta.url),'utf8'));
function worker(base='https://test.example/strong-start/') {
  const stores=new Map(), handlers={}, requests=[];let offline=false, failed='';
  const caches={async keys(){return [...stores.keys()];},async delete(k){return stores.delete(k);},async open(k){
    if(!stores.has(k))stores.set(k,new Map());const data=stores.get(k);
    return {async match(k){return data.get(k)?.clone();},async put(k,v){data.set(k,v.clone());}};
  }};
  const context=vm.createContext({URL,Request,Response,AbortController,Promise,Set,Map,setTimeout,clearTimeout,caches,
    self:{location:{href:base+'sw.js'},clients:{async claim(){}},addEventListener(k,fn){handlers[k]=fn;}},
    async fetch(request){const url=typeof request==='string'?request:request.url;requests.push(url);if(offline||url.includes(failed||'not-a-file'))throw Error('offline');return new Response(url,{status:200});}
  });
  vm.runInContext(source,context);
  const fire=async (type,extra={})=>{let work;handlers[type]({...extra,waitUntil(p){work=p;},respondWith(p){work=p;}});return await work;};
  return {stores,requests,fire,run:s=>vm.runInContext(s,context),offline(v){offline=v;},fail(s){failed=s;},base};
}
let passed=0;
async function test(name,fn){await fn();console.log('PASS '+name);passed++;}
await test('offline installation includes the app, SDK and icons',async()=>{
  const w=worker();await w.fire('install');assert.equal(await w.run('ready()'),true);
  assert.ok(w.requests.some(x=>x.includes('supabase.min.js')));
  assert.ok(w.requests.includes(w.base+'offline.js'));
});
await test('closed-page navigation and SDK reload fall back to cached files without network',async()=>{
  const w=worker();await w.fire('install');w.offline(true);
  const page=await w.fire('fetch',{request:{url:w.base,method:'GET',mode:'navigate'}});
  assert.equal(await page.text(),w.base+'index.html');
  const sdk=await w.fire('fetch',{request:new Request(w.run('SDK'))});assert.match(await sdk.text(),/supabase/);
});
await test('API, auth, other paths and mutation requests never enter the shell cache',async()=>{
  const w=worker();await w.fire('install');const before=w.requests.length;
  for(const request of [new Request('https://backend.supabase.co/auth/v1/token'),new Request(w.base+'api'),new Request(w.base+'index.html',{method:'POST'}),{url:'https://test.example/other/',method:'GET',mode:'navigate'}]) {
    assert.equal(await w.fire('fetch',{request}),undefined);
  }
  assert.equal(w.requests.length,before);
  const response=await w.fire('fetch',{request:{url:w.base+'?code=synthetic-auth-code',method:'GET',mode:'navigate'}});
  assert.ok(response);assert.equal(await (await w.run('caches.open(CACHE)')).match(w.base+'?code=synthetic-auth-code'),undefined);
  assert.equal(await (await w.run('caches.open(CACHE)')).match(w.base+'index.html').then(r=>r.text()),w.base+'index.html');
});
await test('a failed required download cannot report offline readiness and can be retried',async()=>{
  const w=worker();w.fail('supabase.min.js');await assert.rejects(w.fire('install'));
  assert.equal(await w.run('ready()'),false);w.fail('');
  let response;await w.fire('message',{data:{type:'PREPARE_OFFLINE'},ports:[{postMessage(v){response=v;}}]});
  assert.equal(response.ready,true);
});
await test('activation removes only this app scope’s old shell and never forces an update',async()=>{
  const w=worker();await w.fire('install');const prefix=w.run('PREFIX');
  w.stores.set(prefix+'old',new Map());w.stores.set('another-app-cache',new Map());
  await w.fire('activate');assert.equal(w.stores.has(prefix+'old'),false);assert.equal(w.stores.has('another-app-cache'),true);
  assert.equal(/skipWaiting\s*\(/.test(source),false);
});
console.log(`\n${passed} offline scenarios passed.`);
