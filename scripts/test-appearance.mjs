import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const source=readFileSync(new URL('../appearance.js',import.meta.url),'utf8');
const built=readFileSync(new URL('../dist/appearance.js',import.meta.url),'utf8');
function run(script,url,{denied=false,values={}}={}){
  const data=new Map(Object.entries(values)),dataset={},listeners={};
  const context={URL,JSON,history:{length:1},document:{currentScript:{src:new URL('appearance.js',url).href},documentElement:{dataset,classList:{contains:()=>true}},addEventListener(){},referrer:''},window:{addEventListener(k,fn){listeners[k]=fn;}},localStorage:{getItem(k){if(denied)throw Error('blocked');return data.get(k)||null;},setItem(k,v){if(denied)throw Error('blocked');data.set(k,v);}}};
  vm.runInNewContext(script,context);return {data,dataset,listeners,appearance:context.window.StrongStartAppearance};
}
const prod='strongstart_appearance_v1',dev='dev_'+prod,demo='dev2_demo_'+prod;
const buildEnv=built.match(/const BUILD_ENV = '(dev|demo)';/)?.[1];
assert(buildEnv,'Development build must force isolated display preferences');
const values={[prod]:JSON.stringify({color:'blue',theme:'dark'}),[dev]:JSON.stringify({color:'green',theme:'light'}),[demo]:JSON.stringify({color:'noir',theme:'dark'})};
for(const url of ['https://strongstart.app/privacy.html','https://knitko95.github.io/strong-start/terms.html']){
  const a=run(source,url,{values});assert.deepEqual(a.dataset,{color:'blue',theme:'dark'});
  const b=run(built,url,{values});assert.deepEqual(b.dataset,buildEnv==='demo'?{color:'noir',theme:'dark'}:{color:'green',theme:'light'},'test builds stay isolated at production host');
}
for(const url of ['https://dev.strongstart.app/privacy.html','https://strongstart.app/dev/privacy.html','http://localhost:8731/terms.html','https://strongstart.app.evil.example/privacy.html'])assert.deepEqual(run(source,url,{values}).dataset,{color:'green',theme:'light'});
const a=run(source,'http://localhost:8731/privacy.html');a.appearance.set({color:'noir',theme:'dark',name:'not saved',account:'not saved'});assert.deepEqual(JSON.parse(a.data.get(dev)),{theme:'dark',color:'noir'});
a.appearance.set({color:'blue',theme:'light'},false);assert.deepEqual(JSON.parse(a.data.get(dev)),{theme:'dark',color:'noir'},'coach preview never persists its display choice');
a.appearance.set({color:'<invalid>',theme:'invalid'});assert.deepEqual(a.dataset,{});assert.deepEqual(JSON.parse(a.data.get(dev)),{theme:'auto',color:'blush'});
assert.deepEqual(run(source,'http://localhost:8731/privacy.html',{denied:true}).dataset,{});
assert.deepEqual(run(source,'http://localhost:8731/privacy.html',{values:{[dev]:'{invalid'}}).dataset,{});
const d=run(source.replace("const BUILD_ENV = 'auto';","const BUILD_ENV = 'demo';"),'https://dev2.strongstart.app/privacy.html');d.appearance.set({color:'green',theme:'dark'});assert(d.data.has(demo));assert(!d.data.has(dev));
a.data.set(dev,JSON.stringify({theme:'dark',color:'green'}));a.listeners.storage({key:dev});assert.deepEqual(a.dataset,{theme:'dark',color:'green'});
a.data.delete(dev);a.listeners.pageshow();assert.deepEqual(a.dataset,{});
// Style-only policy work must preserve the reviewed headings/body copy.
for(const [file,expected] of [['privacy.html','8248f03c7e1b6493f77c8a408ef5ed73e9e43eec2df034070186a30acf43cacc'],['terms.html','b59240f74f06551433a134e5ce64786fdb05abb577e5d2a10fd88222283ba514']]){
  const html=readFileSync(new URL('../'+file,import.meta.url),'utf8');
  const text=[...html.matchAll(/<(h1|h2|p|li)(?:\s[^>]*)?>[\s\S]*?<\/\1>/g)].map(m=>m[0].replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim());
  assert.equal(createHash('sha256').update(JSON.stringify(text)).digest('hex'),expected,file+' policy wording changed');
}
console.log('PASS appearance sanitization, display-only storage, preview non-persistence, blocked/corrupt storage and environment isolation');
