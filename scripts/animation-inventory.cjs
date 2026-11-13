// Read the actual app catalogues without starting the app or contacting a backend.
const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const source=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes('function defaults()')).split('/* ---------------- Boot ---------------- */')[0];
const element=()=>({style:{},dataset:{},classList:{add(){},remove(){},toggle(){}},setAttribute(){},innerHTML:'',querySelector(){return null;},focus(){},insertBefore(){}});
const context=vm.createContext({console,URL,URLSearchParams,Date,Math,Promise,Map,Set,JSON,
 location:new URL('http://localhost:8731/'),history:{replaceState(){}},navigator:{onLine:true,userAgent:'Test'},matchMedia:()=>({matches:false,addEventListener(){}}),
 document:{body:element(),documentElement:element(),visibilityState:'visible',addEventListener(){},createElement:element,querySelector:element,getElementById:element},
 localStorage:{getItem:()=>null,setItem(){},removeItem(){}},window:{addEventListener(){},scrollTo(){},scrollBy(){}},setTimeout:()=>1,clearTimeout(){},setInterval:()=>1,clearInterval(){},fetch(){throw Error('Unexpected network');}});
vm.runInContext(source,context);
vm.runInContext("state=defaults();state.places=[{k:'gym',n:'Gym',eq:EQ_ALL}];state.curPlace='gym';",context);
const data=vm.runInContext(`({exercises:LIB.map(e=>({...e,muscles:EXM[e.id],steps:exHowTo(e)})),moves:Object.entries(MOVE_HOW).map(([name,steps])=>({id:slugify(name),name,steps})),warmups:WU_MOVES,extra:WU_EXTRA,cardio:typeof CARDIO!=='undefined'?CARDIO:null})`,context);
if(require.main===module){const out=process.argv[2];if(out){fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(data,null,2));}console.log(JSON.stringify({exercises:data.exercises.length,moves:data.moves.length}));}
module.exports=data;
