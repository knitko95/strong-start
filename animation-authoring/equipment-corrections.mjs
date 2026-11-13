import {V,Q,M,rad} from './rig.mjs';
// Shared components, with exercise-specific attachment and support geometry.
export function refineEquipment(e,setups){
 const s=e.spec,n=s.name.toLowerCase(),f=s.family,eq=new Set(s.eq),r=e.rig;
 const keep=fn=>{const map=new Map(),props=[];e.props.forEach((p,i)=>{if(fn(p)){map.set(i,props.length);props.push(p);}});e.dynamic=e.dynamic.filter(d=>map.has(d.i)).map(d=>({...d,i:map.get(d.i)}));e.props=props;};
 const remove=re=>keep(p=>!re.test(p.name));
 const grip=ss=>e.socket(ss),center=()=>grip('l').add(grip('r')).multiplyScalar(.5),each=fn=>[['l',1],['r',-1]].forEach(([ss,k])=>{if(!s.unilateral||ss==='l')fn(ss,k);});
 const box=(name,p,size,kind='metal',angle=0)=>e.box(name,p,size,kind,angle);
 const moving=(name,shape,size,kind,fn,rot=()=>Q())=>{const i=e.add(name,shape,V(),size,kind);e.animate(i,(m,t)=>M().compose(fn(m,t),rot(m,t),size));return i;};
 const line=(name,a,b,radius=.02,kind='metal')=>e.line(name,V(),V(0,1,0),radius,kind,(m,t)=>[a(m,t),b(m,t)]);
 const roller=(name,fn,width=.48,radius=.06)=>moving(name,'cylinder',V(radius,width,radius),'pad',fn,()=>Q().setFromAxisAngle(V(0,0,1),Math.PI/2));
 const post=(x,z,height=2.14)=>{box('Rated station post',V(x,height/2,z),V(.055,height,.055));box('Station stabilizer',V(x,.03,z),V(.40,.06,.50));};
 const pad=(name,p,size,angle=0)=>box(name,p,size,'pad',angle);
 const dumbbell=(position,rotation=()=>Q())=>{moving('Rigid dumbbell shaft','cylinder',V(.014,.17,.014),'chrome',position,(m,t)=>rotation(m,t).clone().multiply(Q().setFromAxisAngle(V(0,0,1),Math.PI/2)));for(const k of [-1,1])moving('Rigid dumbbell head','cylinder',V(.065,.065,.065),'rubber',(m,t)=>position(m,t).add(V(k*.105,0,0).applyQuaternion(rotation(m,t))),rotation);};
 // Benches use one correctly oriented load surface rather than a reversed slab.
 if(f==='inclinePress'){remove(/Reusable bench pad|Bench frame|Bench floor foot/);pad('Incline seat',V(0,.43,.10),V(.30,.07,.32));pad('Incline backrest',V(0,.61,-.42),V(.30,.07,.94),30);for(const z of [.08,-.63])box('Bench support',V(0,.22,z),V(.08,.44,.08));}
 if(e.meta.wallPlane!==undefined){remove(/Open support wall|Support wall rail/);const z=e.meta.wallPlane,side=e.meta.wallAxis==='x',i=box('Support wall contact panel',side?V(z,.95,0):V(0,.95,z),side?V(.025,1.9,1.10):V(1.10,1.9,.025),'pad');const mat=e.props[i].parts[0].material;mat.alphaMode='BLEND';mat.pbrMetallicRoughness.baseColorFactor=[.35,.44,.43,.20];}
 if(e.meta.supportPost){remove(/Support rail/);const p=e.meta.supportPost;post(p.x,p.z,1.42);}
 if(e.meta.rearSupport){remove(/Reusable bench pad|Bench frame|Bench floor foot|Reusable step box/);const m=e.meta.rearSupport;if(m.box)box('Rear foot support box',V(0,m.height/2,m.z),V(.56,m.height,.48),'wood');else{pad('Rear foot bench',V(0,m.height,m.z),V(.65,.07,.30));box('Rear bench support',V(0,m.height/2,m.z),V(.5,m.height,.18));}}
 if(e.meta.heelWedge){for(const k of [-1,1])box('Stable heel wedge',V(k*.23,.025,-.06),V(.15,.05,.18),'rubber');}
 if(e.meta.benchDip){remove(/Reusable bench pad|Bench frame|Bench floor foot/);pad('Bench dip front-edge support',V(0,.44,-.25),V(.65,.07,.36));for(const k of [-1,1])box('Dip bench leg',V(k*.23,.22,-.25),V(.05,.44,.28));}
 if(f==='bridge'&&/thrust|glute drive/.test(n)){remove(/Reusable bench pad|Bench frame|Bench floor foot/);pad('Hip-thrust upper-back support',V(0,.44,-.52),V(.80,.07,.30));for(const k of [-1,1])box('Hip-thrust bench support',V(k*.27,.22,-.52),V(.06,.44,.28));}
 if(e.meta.declineBench){remove(/Reusable bench pad|Bench frame|Bench floor foot/);pad('Decline sit-up bench',V(0,.44,-.13),V(.34,.07,1.5),-15);roller('Decline ankle restraint',()=>V(0,.61,.64));}
 if(e.meta.depthBox||e.meta.lateralBox){remove(/Reusable step box/);box('Jump landing box',V(e.meta.lateralBox?.42:0,.17,e.meta.depthBox?-.45:.025),V(.55,.34,.5),'wood');}
 if(e.meta.armPad){remove(/Preacher arm support/);pad('Fitted upper-arm pad',e.meta.armPad.position,V(.52,.06,.30),e.meta.armPad.angle);}
 if(e.meta.kneePad)pad('Rear knee target',e.meta.kneePad,V(.32,.05,.26));
 if(eq.has('cb')){
  remove(/Shared station|Station foot|Station top|Weight stack|^Cable$|Cable handle/);
  const rear=/press|bayesian|pull-through|kickback/.test(n)&&!/pallof/.test(n),side=/pallof|rotation|woodchop|woodchop|lift|hip ab|hip ad/.test(n),high=/pulldown|pushdown|crunch|high.to.low|overhead.*triceps/.test(n),low=/curl|lateral raise|low.to.high|pull-through|glute kick|hip ab|hip ad/.test(n);
  const z=rear?-.85:side?.10:.95,height=high?1.95:low?.12:1.22,one=/rope|face pull|woodchop|lift|pallof|crunch|pull-through|triceps extension|trunk rotation|lat pulldown/.test(n)||s.unilateral;
  const anchors=one?[V(side?.76:0,height,z)]:[V(.55,height,z),V(-.55,height,z)];
  for(const anchor of anchors){post(anchor.x,anchor.z);e.add('Working cable pulley','torus',anchor,V(.055,.055,.055),'chrome',Q().setFromAxisAngle(V(0,1,0),Math.PI/2));box('Cable weight stack',V(anchor.x,.55,anchor.z+.13),V(.20,.90,.18),'rubber');line('Stack return cable',()=>anchor,()=>V(anchor.x,.90,anchor.z+.13),.004,'chrome');}
  const cuff=/leg curl|hip abduction|hip adduction|glute kickback/.test(n);
  const endpoint=()=>cuff?r.point('foot_l').add(V(0,.04,0)):one?center():grip('l');
  if(one){line('Working cable',()=>anchors[0],endpoint,.004,'chrome');}
  else each((ss,k)=>line('Working cable',()=>anchors[k>0?0:1],()=>grip(ss),.004,'chrome'));
  if(cuff){moving('Fitted ankle cuff','torus',V(.055,.055,.055),'pad',endpoint,()=>r.rotation('foot_l'));}
  else if(/rope|face pull|overhead.*triceps|pull-through|crunch/.test(n)){
   const junction=()=>center().add(V(0,.10,0));line('Rope attachment lead',()=>anchors[0],junction,.004,'chrome');each(ss=>{line('Split rope attachment',junction,()=>grip(ss),.013,'rubber');moving('Rope end stop','sphere',V(.024,.024,.024),'rubber',()=>grip(ss));});
  }else if(/lat pulldown/.test(n)&&!s.unilateral){line('Pulldown attachment bar',()=>grip('l'),()=>grip('r'),.016,'chrome');roller('Pulldown thigh restraint',()=>V(0,.59,.25));}
  else each(ss=>{moving('Fitted cable grip','cylinder',V(.014,.12,.014),'rubber',()=>grip(ss),m=>Q().setFromUnitVectors(V(0,1,0),m[ss].axis));});
 }
 if(/smith/.test(n)){
  remove(/Smith guide rail|Reusable barbell/);const z=/bench/.test(n)?-.47:/split/.test(n)?-.065:-.04;
  for(const k of [-1,1]){post(k*.70,z);box('Smith guide rail',V(k*.70,1.05,z),V(.025,2.05,.025),'chrome');box('Smith safety stop',V(k*.70,/bench/.test(n)?.65:.55,z),V(.12,.07,.15),'rubber');}
  const p=()=>center().setZ(z);line('Guided Smith shaft',()=>p().add(V(-.83,0,0)),()=>p().add(V(.83,0,0)),.014,'chrome');
  for(const k of [-1,1]){moving('Smith rail carriage','box',V(.07,.12,.08),'chrome',()=>V(k*.70,p().y,z));moving('Smith hook','box',V(.09,.025,.08),'chrome',()=>V(k*.70,p().y-.04,z+.03));roller('Smith load plate',()=>p().add(V(k*.78,0,0)),.045,.18);}
 }
 if(eq.has('lm')){
  remove(/Landmine/);const lm=e.meta.landmine;box('Anchored landmine base',lm.pivot.clone().setY(.025),V(.26,.05,.26),'rubber');
  const end=m=>m.landmine.end,p=m=>m.landmine.pivot,dir=m=>end(m).clone().sub(p(m)).normalize();line('Rigid landmine shaft',p,end,.019,'chrome');
  moving('Landmine load plate','cylinder',V(.17,.055,.17),'rubber',m=>end(m).clone().addScaledVector(dir(m),-.23),m=>Q().setFromUnitVectors(V(0,1,0),dir(m)));
 }
 if(e.meta.bodyBar){remove(/Reusable barbell/);line('Body-supported squat shaft',m=>m.bodyBar.clone().add(V(-.90,0,0)),m=>m.bodyBar.clone().add(V(.90,0,0)),.014,'chrome');for(const k of [-1,1])roller('Squat load plate',m=>m.bodyBar.clone().add(V(k*.72,0,0)),.045,.18);}
 if(eq.has('mc')&&!/smith/.test(n)){
  remove(/Machine frame|Machine upright|Machine moving lever|Machine shin roller|Hip machine knee pad/);
  const seated=!/hack|calf raise machine|glute-ham|back extension|glute drive|lying/.test(n)&&f!=='legPress';
  box('Machine floor frame',V(0,.035,-.05),V(.90,.07,1.05));post(-.50,-.30,1.7);post(.50,-.30,1.7);
  if(e.meta.levers){for(const ss of Object.keys(e.meta.levers)){
   const pivot=m=>m.levers[ss].pivot,end=m=>m.levers[ss].end;
   line('Rigid pivoting machine arm',pivot,end,.027,'metal');moving('Lever bearing','sphere',V(.06,.06,.06),'chrome',pivot);line('Machine handle',m=>end(m).clone().add(V(-.055,0,0)),m=>end(m).clone().add(V(.055,0,0)),.016,'rubber');
   moving('Lever resistance plate','cylinder',V(.16,.04,.16),'rubber',m=>pivot(m).clone().lerp(end(m),.22),()=>Q().setFromAxisAngle(V(0,0,1),Math.PI/2));
  }}
  if(f==='pulldown'){roller('Lever pulldown thigh restraint',()=>V(0,.59,.25));pad('Lever pulldown chest support',V(0,.90,.16),V(.28,.28,.08));}
  if(f==='legPress'){
   remove(/Shared seat|Shared back|Seat frame|Leg press/);pad('Leg press seat',V(0,.33,-.26),V(.42,.08,.36));pad('Leg press supported back',V(0,.65,-.39),V(.42,.72,.07),-25);
   const footplate=m=>m.pressPlate;moving('Moving sled footplate','box',V(.70,.055,.52),'rubber',footplate,()=>Q().setFromAxisAngle(V(1,0,0),rad(-45)));
   for(const k of [-1,1]){e.line('Sled guide rail',V(k*.44,.48,.18),V(k*.44,1.25,.95),.028,'chrome');moving('Sled carriage','box',V(.075,.10,.10),'chrome',m=>footplate(m).clone().add(V(k*.44,-.05,0)));}
  }
  if(e.meta.hack){pad('Hack footplate',V(0,.04,.12),V(.72,.08,.58));moving('Hack sled back pad','box',V(.36,.62,.07),'pad',m=>m.hip.clone().add(V(0,.21,-.12)),()=>Q().setFromAxisAngle(V(1,0,0),rad(-22)));for(const k of [-1,1]){e.line('Hack sled rail',V(k*.40,.30,-.25),V(k*.40,1.65,.29),.03,'chrome');moving('Hack shoulder pad','box',V(.13,.10,.27),'pad',m=>m.hip.clone().add(V(k*.22,.45,.05)));}}
  if(['legCurl','legExtension'].includes(f)){
   if(/seated/.test(n))roller('Thigh hold-down',()=>V(0,.59,.22));
   each((ss,k)=>{const pivot=m=>m.kneePivots?.[ss]?.clone().setX(k*.28)||r.point('calf_'+ss),ankle=m=>(m.kneePivots?.[ss]?.clone()||r.point('calf_'+ss)).lerp(r.point('foot_'+ss),.90).setX(k*.28);line('Rigid knee machine lever',pivot,ankle,.025,'metal');roller('Fitted lower-leg roller',ankle,s.unilateral?.24:.28,.055);});
  }
  if(f==='hipMachine')each((ss,k)=>{const inside=/adduction/.test(n)?-1:1;moving('Fitted knee contact pad','box',V(.065,.16,.13),'pad',()=>r.point('calf_'+ss).add(V(k*.065*inside,0,0)));line('Hip pad swing arm',()=>r.point('thigh_'+ss),()=>r.point('calf_'+ss),.024);moving('Hip machine foot support','box',V(.19,.025,.18),'rubber',()=>r.point('foot_'+ss).add(V(0,-.06,0)));});
  if(/calf raise machine/.test(n)){pad('Calf forefoot platform',V(0,.025,.15),V(.55,.05,.16));for(const k of [-1,1])moving('Loaded calf shoulder pad','box',V(.15,.10,.27),'pad',m=>m.hip.clone().add(V(k*.20,.47,0)));}
  if(e.meta.ghd){remove(/Knee support|Heel anchor/);pad('GHD rounded knee pad',V(0,.60,.05),V(.53,.24,.40));pad('GHD footplate',V(0,.65,-.55),V(.50,.42,.07));roller('GHD ankle restraint',()=>V(0,.60,-.46));}
  if(/glute drive/.test(n)){pad('Glute drive foot platform',V(0,.025,.57),V(.64,.05,.50));line('Glute-drive belt',()=>r.point('pelvis').add(V(-.25,.07,0)),()=>r.point('pelvis').add(V(.25,.07,0)),.04,'band');line('Glute drive lever',()=>V(.42,.24,-.37),()=>r.point('pelvis').add(V(.42,.07,0)),.028);}
  if(f==='russian'){roller('Pelvis restraint',()=>V(0,.60,.18));line('Rotating torso yoke',()=>grip('l'),()=>grip('r'),.024,'rubber');moving('Rotation shaft','cylinder',V(.025,.50,.025),'chrome',()=>V(0,.64,0));}
  if(f==='crunch'){roller('Crunch thigh restraint',()=>V(0,.59,.24));moving('Crunch chest pad','box',V(.38,.12,.12),'pad',()=>r.point('spine_03').add(V(0,.10,.15)),()=>r.rotation('spine_03'));each(ss=>moving('Crunch hand grip','cylinder',V(.016,.12,.016),'rubber',()=>grip(ss),()=>r.rotation('hand_'+ss)));line('Crunch resistance cable',()=>V(0,1.35,-.30),()=>r.point('spine_03').add(V(0,.10,.15)),.004,'chrome');box('Crunch weight stack',V(.56,.55,-.30),V(.2,.9,.2),'rubber');}
 }
 if(eq.has('kb')){
  remove(/Shared .*kettlebell/);
  const shared=/goblet|halo|swing/.test(n),around=/around-the-world/.test(n),list=shared||around?['l']:s.unilateral||/windmill/.test(n)?['l']:['l','r'];
  for(const ss of list){const pos=(m,t)=>around?grip(Math.cos(2*Math.PI*t)>=0?'l':'r'):shared?center():grip(ss),direction=(m,t)=>/bottoms-up/.test(n)?V(0,1,0):/rack|overhead|press|windmill|snatch/.test(n)?V(ss==='l'?.45:-.45,-.30,-.84).normalize():f==='swing'?V(0,-Math.cos(rad(80*phase(t))),Math.sin(rad(80*phase(t)))):V(0,-1,0),rotation=(m,t)=>Q().setFromUnitVectors(V(0,-1,0),direction(m,t));
   moving('Rigid kettlebell handle','torus',V(.065,.065,.065),'chrome',(m,t)=>pos(m,t).addScaledVector(direction(m,t),.015),rotation);
   moving('Rigid kettlebell body','sphere',V(.085,.085,.085),'rubber',(m,t)=>pos(m,t).addScaledVector(direction(m,t),.12),rotation);
  }
 }
 if(eq.has('pl')){
  remove(/Shared grip plate/);const pinch=/pinch/.test(n),sides=pinch?['l','r']:['l'];
  for(const ss of sides){const p=()=>pinch?grip(ss).add(V(0,-.16,0)):center();moving('Rigid rim-gripped plate','cylinder',V(.18,.035,.18),'rubber',p,()=>Q().setFromAxisAngle(V(1,0,0),Math.PI/2));}
 }
 if(eq.has('db')&&/pullover|russian twist|overhead triceps|hip thrust|glute bridge/.test(n)){
  remove(/Dumbbell |Two-hand dumbbell|Hip dumbbell/);const endHeld=/pullover|overhead triceps/.test(n);dumbbell(()=>/hip thrust|glute bridge/.test(n)?r.point('pelvis').add(V(0,.10,0)):center().add(V(0,endHeld?-.10:0,0)),()=>endHeld?Q().setFromAxisAngle(V(0,0,1),Math.PI/2):Q());
 }
 if(f==='bridge'&&(eq.has('bb')||eq.has('db')))moving('Hip load cushion','box',V(.42,.075,.15),'pad',()=>r.point('pelvis').add(V(0,.055,0)));
 if(eq.has('trx')){
  remove(/Reusable suspension|Suspension handle/);post(-.7,.67,2.14);post(.7,.67,2.14);e.line('Suspension anchor beam',V(-.7,2.14,.67),V(.7,2.14,.67),.028);
  for(const ss of Object.keys(e.meta.suspension||{})){const a=m=>m.suspension[ss].anchor,endpoint=m=>a(m).clone().add((m.suspension[ss].feet?r.point('foot_'+ss):grip(ss)).clone().sub(a(m)).setLength(m.suspension[ss].length));
   line('Fixed-length suspension strap',a,endpoint,.008,'band');if(e.meta.suspension[ss].feet){moving('Suspension foot cradle','torus',V(.075,.035,.10),'band',endpoint,()=>r.rotation('foot_'+ss));}else line('Suspension hand grip',m=>endpoint(m).clone().add(V(-.055,0,0)),m=>endpoint(m).clone().add(V(.055,0,0)),.014,'rubber');
  }
 }
 if(n==='inverted row'){
  remove(/Reusable suspension|Suspension handle/);for(const k of [-1,1])post(k*.6,.36,1.05);e.line('Fixed inverted-row bar',V(-.6,1.05,.36),V(.6,1.05,.36),.016,'chrome');
 }
 if(n==='neutral-grip pull-up')for(const k of [-1,1])e.line('Parallel neutral handle',V(k*.34,1.91,-.04),V(k*.34,1.91,.17),.016,'rubber');
 if(eq.has('abwheel')||n==='barbell rollout'){
  remove(/Reusable rollout|Ab wheel handle/);const radius=.12,p=()=>center().setY(radius),positions=n==='barbell rollout'?[-.5,.5]:[0];
  for(const x of positions)roller('Ground-contact rolling plate',()=>p().add(V(x,0,0)),.055,radius);line('Rollout axle',()=>p().add(V(-.60,0,0)),()=>p().add(V(.60,0,0)),.014,'chrome');
 }
 if(eq.has('sb')){
  remove(/Reusable stability ball/);const squeeze=/squeeze/.test(n),radius=squeeze?.10:.30;
  moving('Contact-fitted stability ball','sphere',V(radius,radius,radius),'ball',m=>squeeze?r.point('calf_l').add(r.point('calf_r')).multiplyScalar(.5):m.ball==='feet'?r.point('foot_l').clone().setX(0).add(V(0,-.33,0)):m.ball==='back'?V(0,.30,-.30):/rollout|stir/.test(n)?r.point('lowerarm_l').add(r.point('hand_l')).multiplyScalar(.5).setX(0).add(V(0,-.28,0)):V(0,.30,.20));
 }
 if(eq.has('bs')&&/side plank/.test(n)){remove(/Reusable BOSU dome|BOSU base/);const p=r.point('lowerarm_r');e.add('Forearm-supported BOSU dome','dome',V(p.x,.025,p.z),V(.33,.23,.33),'ball');box('BOSU stable base',V(p.x,.02,p.z),V(.64,.04,.64),'rubber');}
 if(n==='medicine ball russian twist'){remove(/Reusable stability ball/);}
 if(e.meta.ballPath){remove(/Reusable medicine ball/);moving('Released or held medicine ball','sphere',V(.125,.125,.125),'ball',m=>m.ballPath.clone());for(const p of e.props.filter(p=>/Medicine ball target wall/.test(p.name))){const mat=p.parts[0].material;mat.alphaMode='BLEND';mat.pbrMetallicRoughness.baseColorFactor=[.35,.44,.43,.18];}}
 if(/broomstick|towel/.test(n))line('Two-hand pass-through stick',()=>grip('l'),()=>grip('r'),.014,'wood');
 if(eq.has('bd')&&/band/.test(n)&&!/mini.band|lateral walk|lateral band|monster|pull.apart|dislocate|clamshell|overhead press|good morning|glute bridge|assisted/.test(n)){
  const high=/face|lat|pushdown/.test(n),side=/pallof|woodchop/.test(n),anchor=V(side?.75:0,high?1.80:side?1.22:.08,.80);post(anchor.x,anchor.z,Math.max(1.3,anchor.y+.05));
  remove(/^Resistance band$/);each(ss=>line('Anchored resistance band',()=>anchor,()=>/prone|assisted/.test(n)?r.point('foot_l'):grip(ss),.009,'band'));
 }
 if(e.meta.airBike){remove(/Bike handlebar|Bike flywheel/);const hub=V(0,.25,.36);e.add('Air-bike fan shroud','torus',hub,V(.24,.24,.24),'metal',Q().setFromAxisAngle(V(0,1,0),Math.PI/2));for(let j=0;j<10;j++){const a=j/10*Math.PI*2;e.line('Fan vane',hub,hub.clone().add(V(0,.20*Math.sin(a),.20*Math.cos(a))),.012,'rubber');}for(const k of [-1,1]){const ss=k>0?'l':'r';line('Linked air-bike arm',()=>V(k*.27,.38,.40),()=>grip(ss),.022);line('Air-bike pedal crank',()=>V(k*.16,.34,.23),()=>r.point('foot_'+ss),.018,'chrome');moving('Air-bike pedal','box',V(.18,.025,.12),'rubber',()=>r.point('foot_'+ss).add(V(0,-.045,0)));}}
}
const phase=t=>{const u=t<.5?t*2:(1-t)*2;return u*u*(3-2*u);};
