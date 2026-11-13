import {V,Q,M,T,rad,clone} from './rig.mjs';
import {refineEquipment} from './equipment-corrections.mjs';
const colors={metal:[.20,.23,.26,1],chrome:[.42,.46,.49,1],rubber:[.045,.052,.06,1],pad:[.12,.16,.16,1],band:[.30,.56,.45,1],ball:[.26,.42,.42,1],mat:[.14,.20,.20,1],wood:[.48,.37,.26,1]};
export function material(kind='metal'){return {name:kind,doubleSided:true,pbrMetallicRoughness:{baseColorFactor:colors[kind]||colors.metal,roughnessFactor:kind==='chrome'?.35:.72,metallicFactor:['metal','chrome'].includes(kind)?.55:0}};}
export class Equipment{
 constructor(spec,rig,meta,geometries,setups){this.spec=spec;this.rig=rig;this.geometry=geometries;this.props=[];this.dynamic=[];this.meta=meta;this.build(setups);refineEquipment(this,setups);}
 add(name,shape,position,size,kind='metal',rotation=Q(),parent=null){
  const i=this.props.length;this.props.push({name,matrix:M().compose(position,rotation,size).toArray(),parts:[{geometry:this.geometry[shape],material:material(kind)}],...(parent?{parent}:{})});return i;
 }
 box(name,p,size,kind='metal',rx=0){return this.add(name,'box',p,size,kind,Q().setFromAxisAngle(V(1,0,0),rad(rx)));}
 sphere(name,p,size,kind='ball'){return this.add(name,'sphere',p,size,kind);}
 line(name,a,b,radius=.025,kind='metal',dynamic=null){const d=b.clone().sub(a);const i=this.add(name,'cylinder',a.clone().add(b).multiplyScalar(.5),V(radius,d.length(),radius),kind,Q().setFromUnitVectors(V(0,1,0),d.normalize()));if(dynamic)this.dynamic.push({i,fn:dynamic,type:'line',radius});return i;}
 animate(i,fn){this.dynamic.push({i,fn,type:'matrix'});}
 socket(side){return this.rig.palmPoint(side);}
 build(setups){
  const s=this.spec,n=s.name.toLowerCase(),f=s.family,m=this.meta,eq=new Set(s.eq);const both=fn=>{for(const [side,sign]of [['l',1],['r',-1]])if(!s.unilateral||side==='l')fn(side,sign);};
  const grip=side=>this.socket(side),center=()=>grip('l').add(grip('r')).multiplyScalar(.5);
  const dynamicBox=(name,shape,size,kind,fn)=>{const i=this.add(name,shape,V(),size,kind);this.animate(i,(meta,t)=>M().compose(fn(meta,t),Q(),size));return i;};
  const pad=(name,p,size,rx=0)=>this.box(name,p,size,'pad',rx);
  const bench=(height=.44,z=-.20,angle=0)=>{
   pad('Reusable bench pad',V(0,height,z),V(.34,.07,1.10),angle);for(const zz of [z-.36,z+.36]){this.box('Bench frame',V(0,height/2,zz),V(.065,height,.065));this.box('Bench floor foot',V(0,.025,zz),V(.54,.05,.14));}
  };
  if(m.floor)this.box('Exercise mat',V(0,-.013,0),V(.80,.024,2.10),'mat');
  if(m.bench){
   if(f==='step'||/bulgarian|incline push/.test(n))bench(.44,f==='step'?.30:/bulgarian/.test(n)?-.44:.63);
   else if(f==='bridge')bench(.44,-.41);
   else if(f==='sidePlank')bench(.44,-.78);
   else if(m.prone)bench(/seal/.test(n)?.74:f==='legCurl'?.49:.62,.05,/seal/.test(n)||f==='legCurl'?0:-32);
   else if(m.seated){pad('Shared seat',V(0,m.hip.y-.10,-.03),V(.38,.08,.35));pad('Shared back support',V(0,m.hip.y+.20,-.17),V(.34,.55,.07));this.box('Seat frame',V(0,.22,-.07),V(.12,.44,.12));}
   else bench(/floor/.test(n)?.10:.44,-.19,f==='inclinePress'?-30:0);
  }
  if(m.wall){const z=/stretch|push|ankle/.test(n)?.63:-.25;for(const x of [-.53,.53])this.box('Open support wall post',V(x,1.0,z),V(.065,2,.065),'pad');this.box('Support wall rail',V(0,1.85,z),V(1.12,.065,.065),'pad');}
  if(m.post)this.box('Support rail',V(-.47,.8,.16),V(.055,1.60,.055));
  if(eq.has('db')&&!/dumbbell leg curl|hip thrust|glute bridge|dumbbell overhead triceps extension/.test(n)){
   const clip=setups.templates['hammer-curl'].clip;
   both((side)=>{for(const node of clip.nodes.filter(x=>x.name?.startsWith('Dumbbell ')&&new RegExp(' '+side+'(?:\\.|$)').test(x.name))){const copy=clone(node);delete copy.children;copy.parent='hand_'+side;this.props.push(copy);}});
  }
  const handheldSphere=(side,kind='kb')=>{
   const size=kind==='kb'?.076:.12,origin=grip(side),axis=m[side].axis;
   const sphere=this.sphere(kind==='kb'?'Shared kettlebell body':'Shared medicine ball',origin,V(size,size,size),kind==='kb'?'rubber':'ball');
   this.animate(sphere,(meta)=>{const p=grip(side);if(kind==='kb')p.y+=/bottoms-up/.test(n)?.115:-.115;return M().compose(p,Q(),V(size,size,size));});
   if(kind==='kb'){
    const ring=this.add('Shared kettlebell handle','torus',origin,V(.055,.055,.055),'chrome');this.animate(ring,()=>M().compose(grip(side).add(V(0,/bottoms-up/.test(n)?.035:-.035,.0)),Q().setFromUnitVectors(V(0,0,1),axis),V(.055,.055,.055)));
   }
  };
  if(eq.has('kb')&&!/goblet|halo|hammer curl|around-the-world|windmill/.test(n))both(side=>handheldSphere(side));
  if(eq.has('kb')&&/goblet|halo|hammer curl|around-the-world/.test(n)){
   const ball=this.sphere('Shared two-hand kettlebell body',center(),V(.085,.085,.085),'rubber');this.animate(ball,()=>M().compose(center().add(V(0,-.10,0)),Q(),V(.085,.085,.085)));
   const ring=this.add('Shared two-hand kettlebell handle','torus',center(),V(.062,.062,.062),'chrome');this.animate(ring,()=>M().compose(center().add(V(0,-.02,0)),Q(),V(.062,.062,.062)));
  }
  if(eq.has('kb')&&/windmill/.test(n))handheldSphere('l');
  const bar=(back=false)=>{
   const position=()=>/thrust/.test(n)?this.rig.point('pelvis').add(V(0,.10,0)):center();
   const width=/close-grip/.test(n)?1.45:1.80;
   this.line('Reusable barbell shaft',V(-width/2,0,0),V(width/2,0,0),.014,'chrome',()=>{const p=position();return [p.clone().add(V(-width/2,0,0)),p.clone().add(V(width/2,0,0))];});
   for(const sign of [-1,1]){
    const plate=this.add('Reusable barbell plate','cylinder',V(),V(.18,.055,.18),'rubber',Q().setFromAxisAngle(V(0,0,1),Math.PI/2));this.animate(plate,()=>M().compose(position().add(V(sign*.68,0,0)),Q().setFromAxisAngle(V(0,0,1),Math.PI/2),V(.18,.055,.18)));
   }
  };
  if(eq.has('bb')&&!eq.has('lm')&&!/inverted|rollout|trap bar/.test(n))bar();
  if(/smith/.test(n)){
   for(const x of [-.70,.70])this.box('Smith guide rail',V(x,1.05,0),V(.05,2.10,.05),'chrome');if(!eq.has('bb'))bar();
  }
  if(/trap bar/.test(n)){
   for(const z of [-.25,.25])this.line('Trap bar end',V(-.46,.50,z),V(.46,.50,z),.025,'chrome',()=>{const p=center();return [p.clone().add(V(-.46,0,z)),p.clone().add(V(.46,0,z))];});
   for(const x of [-.46,.46])this.line('Trap bar side',V(x,.50,-.25),V(x,.50,.25),.025,'chrome',()=>{const p=center();return [p.clone().add(V(x,0,-.25)),p.clone().add(V(x,0,.25))];});
  }
  if(eq.has('lm')){
   this.sphere('Landmine pivot',V(0,.04,1.34),V(.09,.04,.09),'rubber');this.line('Landmine bar',V(0,.05,1.34),center(),.019,'chrome',()=>[V(0,.05,1.34),s.unilateral?grip('l'):center()]);
   const plate=this.add('Landmine plate','cylinder',center(),V(.17,.055,.17),'rubber');this.animate(plate,()=>M().compose((s.unilateral?grip('l'):center()).lerp(V(0,.05,1.34),.15),Q().setFromUnitVectors(V(0,1,0),center().sub(V(0,.05,1.34)).normalize()),V(.17,.055,.17)));
  }
  if(eq.has('pl')){
   const plate=this.add('Shared grip plate','cylinder',center(),V(.18,.035,.18),'rubber',Q().setFromAxisAngle(V(1,0,0),Math.PI/2));this.animate(plate,()=>M().compose(center(),Q().setFromAxisAngle(V(1,0,0),Math.PI/2),V(.18,.035,.18)));
  }
  if(/weighted push-up|weighted pull-up|weighted dip|weighted back extension|weighted decline/.test(n)){
   const i=this.add('Reusable added-weight plate','cylinder',V(),V(.17,.035,.17),'rubber');this.animate(i,()=>{const p=/push-up/.test(n)?this.rig.point('spine_03').add(V(0,.10,0)):/pull-up|dip/.test(n)?this.rig.point('pelvis').add(V(0,-.17,.08)):center();return M().compose(p,/push-up/.test(n)?Q():Q().setFromAxisAngle(V(1,0,0),Math.PI/2),V(.17,.035,.17));});
  }
  if(/dumbbell overhead triceps extension/.test(n)){
   this.line('Two-hand dumbbell handle',center().add(V(0,-.08,0)),center().add(V(0,.08,0)),.014,'chrome',()=>[center().add(V(0,-.08,0)),center().add(V(0,.08,0))]);for(const sign of [-1,1])dynamicBox('Two-hand dumbbell head','cylinder',V(.065,.045,.065),'rubber',()=>center().add(V(0,sign*.095,0)));
  }
  if(/hip thrust|glute bridge/.test(n)&&eq.has('db'))dynamicBox('Hip dumbbell','cylinder',V(.10,.28,.10),'rubber',()=>this.rig.point('pelvis').add(V(0,.10,0)));
  if(/dumbbell leg curl/.test(n))dynamicBox('Foot-held dumbbell','cylinder',V(.07,.19,.07),'rubber',()=>this.rig.point('foot_l').add(this.rig.point('foot_r')).multiplyScalar(.5));
  const station=(kind='cable')=>{
   const z=-.72;
   for(const x of [-.58,.58]){this.box('Shared station upright',V(x,1.10,z),V(.065,2.20,.065));this.box('Station foot',V(x,.035,z),V(.32,.07,.60));}
   this.box('Station top crossbar',V(0,2.17,z),V(1.23,.07,.07));this.box('Weight stack',V(-.72,.60,z),V(.18,1.05,.18),'rubber');
  };
  if(eq.has('cb')){
   const rear=/press|bayesian|pull-through|kickback/.test(n)&&!/pallof/.test(n),high=/pulldown|pushdown|crunch|woodchop high/.test(n),low=/curl|lateral raise|lift|low to high|pull-through|half-kneeling single-arm cable press/.test(n),side=/pallof|external rotation|abduction|adduction/.test(n);
   station(rear?'rear':'cable');both((ss,sign)=>{const anchor=V(side?.62:sign*.45,high?2.0:low?.12:1.20,rear?-.72:.88),end=()=>/leg curl|hip abduction|hip adduction|glute kickback/.test(n)?this.rig.point('foot_l'):grip(ss);this.line('Cable',anchor,end(),.004,'chrome',()=>[anchor,end()]);
    const h=this.add('Cable handle','torus',grip(ss),V(.045,.045,.045),'rubber');this.animate(h,()=>M().compose(end(),Q().setFromAxisAngle(V(1,0,0),Math.PI/2),V(.045,.045,.045)));
   });
  }
  if(eq.has('mc')&&!/smith/.test(n)){
   if(/pull-up/.test(n)){station();dynamicBox('Assistance knee pad','box',V(.42,.08,.35),'pad',()=>this.rig.point('calf_l').add(this.rig.point('calf_r')).multiplyScalar(.5).add(V(0,-.065,0)));}
   else if(/dip/.test(n)){dynamicBox('Assistance pad','box',V(.43,.08,.34),'pad',()=>this.rig.point('calf_l').add(this.rig.point('calf_r')).multiplyScalar(.5).add(V(0,-.065,0)));}
   else if(f==='legPress'){
    pad('Leg press backrest',V(0,.55,-.35),V(.42,.70,.08),-30);this.box('Leg press platform',V(0,1.03,.68),V(.70,.08,.50),'rubber',-45);for(const x of [-.38,.38])this.line('Leg press rail',V(x,.20,.10),V(x,1.25,.94),.03,'chrome');
   }
   else{
    this.box('Machine frame',V(0,.035,-.20),V(.82,.07,.95));for(const x of [-.39,.39])this.box('Machine upright',V(x,.66,-.27),V(.06,1.25,.06));
    if(m.seated&&!m.bench){pad('Machine seat',V(0,.43,-.03),V(.40,.08,.38));pad('Machine backrest',V(0,.77,-.21),V(.37,.62,.08));}
    if(/preacher/.test(n))pad('Preacher arm support',V(0,.85,.27),V(.52,.08,.34),-25);
    if(/leg curl|leg extension/.test(n)){const roller=this.add('Machine shin roller','cylinder',V(0,.17,.35),V(.07,.50,.07),'pad',Q().setFromAxisAngle(V(0,0,1),Math.PI/2));this.animate(roller,()=>M().compose(this.rig.point('foot_l').add(this.rig.point('foot_r')).multiplyScalar(.5).add(V(0,.05,0)),Q().setFromAxisAngle(V(0,0,1),Math.PI/2),V(.07,.50,.07)));}
    else if(/hip adduction|hip abduction/.test(n))for(const ss of ['l','r'])dynamicBox('Hip machine knee pad','box',V(.10,.18,.15),'pad',()=>this.rig.point('calf_'+ss));
    else if(!/calf|glute drive|hack|back extension|glute-ham/.test(n))both((ss)=>this.line('Machine moving lever',V(ss==='l'?.39:-.39,1.2,-.27),grip(ss),.024,'metal',()=>[V(ss==='l'?.39:-.39,1.2,-.27),grip(ss)]));
   }
  }
  if(eq.has('pu')||f==='pullup'||f==='hanging'){
   this.line('Pull-up bar',V(-.63,1.96,.04),V(.63,1.96,.04),.019,'chrome');for(const x of [-.65,.65])this.box('Pull-up upright',V(x,1.02,.04),V(.055,2.04,.055));
   if(/monkey/.test(n))for(const z of [-.18,.25,.48])this.line('Traverse rung',V(-.6,1.96,z),V(.6,1.96,z),.019,'chrome');
  }
  if(eq.has('dp')||f==='dip'&&!/bench/.test(n))for(const sign of [-1,1]){this.line('Parallel dip bar',V(sign*.33,1,-.25),V(sign*.33,1,.25),.025,'rubber');this.box('Dip support',V(sign*.33,.5,0),V(.045,1,.045));}
  if(eq.has('trx')||f==='suspensionPress'||f==='suspensionRow'){
   both((ss,sign)=>{const feet=/body saw|pike|hamstring/.test(n),anchor=V(sign*.12,2.14,.67),endpoint=()=>feet?this.rig.point('foot_'+ss):grip(ss);this.line('Reusable suspension strap',anchor,endpoint(),.009,'band',()=>[anchor,endpoint()]);const handle=this.add('Suspension handle','torus',endpoint(),V(.06,.06,.06),'rubber');this.animate(handle,()=>M().compose(endpoint(),Q(),V(.06,.06,.06)));});
  }
  if(eq.has('bd')){
   if(/mini-band|banded lateral|lateral band|monster|clamshell|glute bridge/.test(n)){
    this.line('Loop band front',this.rig.point('calf_l'),this.rig.point('calf_r'),.018,'band',()=>{const p=this.rig.point('thigh_l').lerp(this.rig.point('calf_l'),.72),v=this.rig.point('thigh_r').lerp(this.rig.point('calf_r'),.72);return[p.add(V(0,0,.05)),v.add(V(0,0,.05))];});
    this.line('Loop band back',V(),V(.1,0,0),.018,'band',()=>[this.rig.point('thigh_l').lerp(this.rig.point('calf_l'),.72).add(V(0,0,-.05)),this.rig.point('thigh_r').lerp(this.rig.point('calf_r'),.72).add(V(0,0,-.05))]);
   }
   else if(/pull-apart|dislocate/.test(n))this.line('Resistance band',grip('l'),grip('r'),.009,'band',()=>[grip('l'),grip('r')]);
   else both((ss,sign)=>{
    const anchor=/assisted/.test(n)?V(0,1.96,.04):/pushdown|lat/.test(n)?V(0,2.05,.73):/face|row|chest press|pallof|woodchop/.test(n)?V(/pallof/.test(n)?.75:sign*.20,/woodchop/.test(n)?1.80:1.18,/press/.test(n)?-.65:.80):V(sign*.17,.04,.03);
    const endpoint=()=>/prone band|assisted/.test(n)?this.rig.point('foot_l'):/good morning/.test(n)?this.rig.point('spine_03'):grip(ss);this.line('Resistance band',anchor,endpoint(),.009,'band',()=>[anchor,endpoint()]);
   });
  }
  if(eq.has('sb')||m.ball){
   const location=(meta)=>meta.ball==='feet'?this.rig.point('foot_l').add(this.rig.point('foot_r')).multiplyScalar(.5).add(V(0,-.21,0)):meta.ball==='back'?V(0,.32,-.30):/rollout|stir/.test(n)?grip('l').add(grip('r')).multiplyScalar(.5).add(V(0,-.22,0)):/feet-on|pike|jackknife/.test(n)?this.rig.point('foot_l').add(this.rig.point('foot_r')).multiplyScalar(.5).add(V(0,-.24,0)):V(0,.31,.20);
   const ball=this.sphere('Reusable stability ball',location(m),V(.30,.30,.30),'ball');this.animate(ball,meta=>{const p=location(meta);p.y=Math.max(.30,p.y);return M().compose(p,Q(),V(.30,.30,.30));});
  }
  if(eq.has('bs')){
   const yy=/side plank|push-up|mountain/.test(n)?.12:.025,zz=/push-up|mountain/.test(n)?.59:0;this.add('Reusable BOSU dome','dome',V(0,yy,zz),V(.33,.23,.33),'ball',/push-up|mountain/.test(n)?Q().setFromAxisAngle(V(1,0,0),Math.PI):Q());this.add('BOSU base','cylinder',V(0,/push-up|mountain/.test(n)?.24:.025,zz),V(.34,.045,.34),'rubber');
  }
  if(eq.has('bx')||m.stepHeight&&!eq.has('bs')){
   const h=m.stepHeight||.34;this.box('Reusable step box',V(/lateral|crossover/.test(n)?.27:0,h/2,/jump/.test(n)?.50:.28),V(.62,h,.55),'wood');
  }
  if(eq.has('mb')){
   const ball=this.sphere('Reusable medicine ball',center(),V(.125,.125,.125),'ball');this.animate(ball,(meta,t)=>{const p=center();if(meta.release){if(/slam/.test(n)){p.y=Math.max(.13,p.y-1.3*meta.release);p.z+=.45*meta.release;}else if(/vertical/.test(n))p.y+=1.2*meta.release;else p.z+=1.05*meta.release;}return M().compose(p,Q(),V(.125,.125,.125));});
   if(/wall|scoop|shot put|chest pass/.test(n))this.box('Medicine ball target wall',V(0,1,1.65),V(1.6,2,.05),'pad');
  }
  if(eq.has('rp'))both((ss,sign)=>{for(let j=0;j<12;j++)this.line('Reusable battle rope segment',V(),V(.01,0,0),.016,'rubber',(meta,t)=>{
   const start=grip(ss),point=u=>V(sign*.18,Math.max(.025,start.y*(1-u)**2+.10*Math.sin(t*Math.PI*6-u*14+(ss==='l'?0:Math.PI))*(1-u)),start.z+(2-start.z)*u);return[point(j/12),point((j+1)/12)];
  });});
  if(eq.has('sled')){this.box('Reusable sled base',V(0,.10,.83),V(.65,.15,.75),'rubber');for(const x of [-.28,.28])this.box('Sled push post',V(x,.62,.64),V(.04,1.16,.04));if(/pull/.test(n))both(ss=>this.line('Sled strap',V(ss==='l'?.25:-.25,.20,.60),grip(ss),.009,'band',()=>[V(ss==='l'?.25:-.25,.20,.60),grip(ss)]));}
  if(eq.has('sandbag'))dynamicBox('Reusable sandbag','sphere',V(.28,.20,.15),'wood',()=>center().add(V(0,-.03,-.015)));
  if(eq.has('abwheel')||/barbell rollout/.test(n)){
   const wheel=this.add('Reusable rollout wheel','cylinder',center(),V(.12,.055,.12),'rubber',Q().setFromAxisAngle(V(0,0,1),Math.PI/2));this.animate(wheel,()=>M().compose(center(),Q().setFromAxisAngle(V(0,0,1),Math.PI/2),V(.12,.055,.12)));this.line('Ab wheel handle',center().add(V(-.22,0,0)),center().add(V(.22,0,0)),.014,'chrome',()=>[center().add(V(-.22,0,0)),center().add(V(.22,0,0))]);
  }
  if(eq.has('ankle')){const i=this.add('Reusable ankle cuff','cylinder',this.rig.point('foot_l'),V(.06,.08,.06),'pad');this.animate(i,()=>M().compose(this.rig.point('foot_l').add(V(0,.04,0)),Q(),V(.06,.08,.06)));}
  if(m.extensionPad){pad('Back extension hip pad',V(0,.74,.0),V(.42,.13,.28),-35);this.line('Extension frame',V(0,.03,-.40),V(0,.72,.02),.05);this.line('Ankle support',V(-.26,.18,-.55),V(.26,.18,-.55),.075,'pad');}
  if(f==='nordic'){this.line('Heel anchor pad',V(-.30,.12,-.47),V(.30,.12,-.47),.075,'pad');pad('Knee support pad',V(0,.075,.01),V(.46,.10,.24));}
  if(m.cycle){this.box('Exercise bike frame',V(0,.30,.10),V(.12,.52,.70));pad('Bicycle saddle',V(0,.62,-.03),V(.27,.06,.24));this.line('Bike handlebar',V(-.28,1.11,.49),V(.28,1.11,.49),.025,'rubber');this.add('Bike flywheel','cylinder',V(0,.25,.36),V(.23,.12,.23),'rubber',Q().setFromAxisAngle(V(0,0,1),Math.PI/2));}
  if(m.rowErg){this.box('Rower rail',V(0,.12,-.08),V(.16,.12,1.46));this.box('Rower footplate',V(0,.16,.48),V(.43,.08,.22));this.sphere('Rower flywheel housing',V(0,.27,.73),V(.23,.26,.18),'rubber');dynamicBox('Rower sliding seat','box',V(.35,.06,.26),'pad',meta=>meta.hip.clone().add(V(0,-.08,0)));this.line('Rower handle',center().add(V(-.22,0,0)),center().add(V(.22,0,0)),.015,'rubber',()=>[center().add(V(-.22,0,0)),center().add(V(.22,0,0))]);this.line('Rower chain',V(0,.34,.65),center(),.004,'chrome',()=>[V(0,.34,.65),center()]);}
  if(f==='elliptical')for(const ss of ['l','r']){dynamicBox('Elliptical pedal','box',V(.18,.06,.36),'rubber',()=>this.rig.point('foot_'+ss).add(V(0,-.055,0)));this.line('Elliptical arm',V(ss==='l'?.30:-.30,.15,.42),grip(ss),.022,'metal',()=>[V(ss==='l'?.30:-.30,.15,.42),grip(ss)]);}
  if(f==='jumpRope')for(let j=0;j<18;j++)this.line('Jump rope segment',V(),V(.01,0,0),.004,'band',(meta,t)=>{const point=u=>{const theta=2*Math.PI*t;return V(.30*Math.cos(Math.PI*u),1.0-.82*Math.sin(Math.PI*u)*Math.cos(theta),.05+.82*Math.sin(Math.PI*u)*Math.sin(theta));};return[point(j/18),point((j+1)/18)];});
  if(m.recovery){const ball=s.tool==='Massage ball',p=/quads|inner thighs/.test(s.area)?V(0,.15,.25):/calves/.test(s.area)?V(0,.09,.58):/hamstrings/.test(s.area)?V(0,.12,.35):/upper back/.test(s.area)?V(0,.15,-.38):/glutes/.test(s.area)?V(0,.12,.0):/lats/.test(s.area)?V(0,.12,.24):V(0,1.25,.55);this.add(ball?'Massage ball':'Shared foam roller',ball?'sphere':'cylinder',p,ball?V(.045,.045,.045):V(.09,.45,.09),'pad',Q().setFromAxisAngle(V(0,0,1),Math.PI/2));}
 }
 sample(meta,t){for(const d of this.dynamic){let mat;if(d.type==='line'){const [a,b]=d.fn(meta,t),v=b.clone().sub(a);mat=M().compose(a.clone().add(b).multiplyScalar(.5),Q().setFromUnitVectors(V(0,1,0),v.normalize()),V(d.radius,Math.max(.0001,a.distanceTo(b)),d.radius));}else mat=d.fn(meta,t);this.props[d.i].matrix=mat.toArray();}return this.props;}
}
