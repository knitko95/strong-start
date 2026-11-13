// Test media ownership/lifecycle with real loader code and synthetic DOM/model APIs.
// This does not replace WebGL, browser layout or physical-device verification.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const registry=JSON.parse(readFileSync(new URL('../exercise-guides/registry.v1.json',import.meta.url)));
const source=readFileSync(new URL('../exercise-guides/guides.js',import.meta.url),'utf8');
class Element {
  constructor(tag='div'){this.tag=tag;this.dataset={};this.attrs={};this.children=[];this.events={};this.parts=new Map();this.isConnected=true;this.hidden=false;this.paused=true;this.clientWidth=390;this.updateComplete=Promise.resolve();const classes=new Set();this.classList={add:c=>classes.add(c),remove:c=>classes.delete(c),toggle:c=>{if(classes.has(c)){classes.delete(c);return false;}classes.add(c);return true;}};}
  set innerHTML(s){this.markup=s;this.parts.clear();}get innerHTML(){return this.markup||'';}
  querySelector(s){const name=s.slice(1);if(!this.markup?.includes(name))return null;if(!this.parts.has(s))this.parts.set(s,new Element(s));return this.parts.get(s);}
  querySelectorAll(s){if(s!=='[data-eg-angle]'||!this.markup?.includes('data-eg-angle'))return [];return ['0','-90','180'].map(a=>{const key='angle'+a;if(!this.parts.has(key)){const e=new Element();e.dataset.egAngle=a;this.parts.set(key,e);}return this.parts.get(key);});}
  setAttribute(k,v){this.attrs[k]=v;}addEventListener(n,f,options={}){(this.events[n]||=[]).push({f,signal:options.signal});}
  async emit(n,detail={}){for(const e of this.events[n]||[])if(!e.signal?.aborted)await e.f({detail,currentTarget:this,stopPropagation(){}});}
  append(e){this.children.push(e);e.parentElement=this;}replaceChildren(...a){this.children=a;for(const e of a)e.parentElement=this;}remove(){this.removed=true;this.isConnected=false;}
  play(){this.paused=false;}pause(){this.paused=true;}jumpCameraToGoal(){}
}
const document=new Element('document');document.currentScript={src:'https://test.invalid/exercise-guides/guides.js'};document.body=new Element('body');document.createElement=t=>new Element(t);document.dispatchEvent=()=>{};
let fetches=0;
const context={window:{},document,URL,AbortController,Event,MutationObserver:class{observe(){}disconnect(){}},navigator:{onLine:true},matchMedia:()=>({matches:false}),setTimeout:()=>1,clearTimeout(){},fetch:async()=>{fetches++;return {ok:true,json:async()=>registry};}};
// Only replace the heavy third-party/WebGL import. Registry validation and all loader logic run unchanged.
const tested=source.replace(/function viewer\(\)\{[\s\S]*?\n  \}/,'function viewer(){return Promise.resolve();}');
vm.runInNewContext(tested,context);const guides=context.window.StrongStartExerciseGuides;
const mount=()=>{const m=new Element();m.parentElement=new Element();return m;};
const card=m=>m.children[0],model=m=>card(m).querySelector('.eg-view').children[0];
const workout=mount();await guides.attach({exerciseId:'goblet-squat',mount:workout,environment:'development',mode:'workout'});const w=model(workout);await w.emit('load');
assert.equal(w.paused,false);assert.equal(w.attrs['shadow-intensity'],'0');assert(w.src.endsWith(registry.animations['goblet-squat'].variants['instructor-rose-v1'].asset));
guides.suspendWorkout(true);assert.equal(w.paused,true);
const modal=mount();await guides.attach({exerciseId:'plank',mount:modal,environment:'development'});const m=model(modal);await m.emit('load');assert.equal(m.paused,false);assert.equal(w.removed,undefined);
await card(modal).querySelector('.eg-play').emit('click');assert.equal(m.paused,true);
guides.dispose('modal');assert.equal(m.removed,true);assert.equal(w.removed,undefined);guides.suspendWorkout(false);assert.equal(w.paused,false);
await card(workout).querySelector('.eg-play').emit('click');guides.suspendWorkout(true);guides.suspendWorkout(false);assert.equal(w.paused,true,'Covering a demo must not erase the user’s pause choice');
await card(workout).querySelector('.eg-expand').emit('click');assert.equal(card(workout).querySelector('.eg-expand').attrs['aria-expanded'],'true');
const next=mount();await guides.attach({exerciseId:'hammer-curl',mount:next,environment:'development',mode:'workout'});assert.equal(w.removed,true);assert.equal(workout.children.length,0);await model(next).emit('load');
await model(next).emit('error');assert.equal(card(next).dataset.guideStatus,'error');assert.equal(card(next).querySelector('.eg-controls').hidden,true);
const excluded=mount();await guides.attach({exerciseId:'goblet-squat',mount:excluded,environment:'production',mode:'workout'});assert.equal(excluded.hidden,true);assert.equal(excluded.children.length,0);
const absent=mount();await guides.attach({exerciseId:'machine-chest-press',mount:absent,environment:'development',mode:'workout'});assert.equal(absent.hidden,true);
const late=mount(),pending=guides.attach({exerciseId:'plank',mount:late,environment:'development',mode:'workout'});guides.dispose('workout');await pending;assert.equal(late.children.length,0,'A cancelled attach cannot create a stale model');
assert.equal(fetches,1,'Registry is shared by both media surfaces');
console.log('PASS workout/modal ownership, cover/resume, user pause, expansion, replacement cleanup, error/text fallback, environment gate and cancelled load');
