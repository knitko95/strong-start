/* Private account data stays in IndexedDB. No account data enters the shell cache. */
(() => {
  'use strict';
  const clone=x=>structuredClone(x),request=r=>new Promise((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
  const median=a=>{a=a.slice().sort((x,y)=>x-y);const n=a.length;return n%2?a[n>>1]:(a[n/2-1]+a[n/2])/2;};
  const chronological=(a,b)=>+a.d-+b.d||String(a.id).localeCompare(String(b.id));
  const sample=(a,p)=>{a.push(p);if(a.length>600){const last=a.at(-1);a.splice(0,a.length,...a.filter((_,i)=>i%2===0));if(a.at(-1)!==last)a.push(last);}};
  function scan(store,range,direction,visit){return new Promise((resolve,reject)=>{
    const r=store.openCursor(range,direction);r.onerror=()=>reject(r.error);
    r.onsuccess=()=>{const c=r.result;if(!c){resolve();return;}Promise.resolve().then(()=>visit(c.value,c)).then(v=>{if(v===false)resolve();else c.continue();},reject);};
  });}
  class Store {
    constructor(name,options){this.name=name;this.options=options;this.version=0;this.tail=Promise.resolve();this.view=new Map();this.keys=this.view;this.legacy=null;try{this.legacy=localStorage.getItem(name);}catch{}}
    async tx(names,mode,fn){
      const t=this.db.transaction(names,mode),done=new Promise((resolve,reject)=>{t.oncomplete=resolve;t.onabort=t.onerror=()=>reject(t.error||Error('Device transaction failed'));});
      // Attach the rejection handler before any request can abort.
      done.catch(()=>{});
      try{const value=await fn(t);await done;return value;}catch(e){try{t.abort();}catch{}await done.catch(()=>{});throw e;}
    }
    serial(fn){const p=this.tail.catch(()=>{}).then(fn);this.tail=p;return p;}
    async check(t){const m=await request(t.objectStore('meta').get('active'));if((m?.version||0)!==this.version)throw Object.assign(Error('Another tab saved changes. Copy a backup and reload this tab.'),{code:'stale_device_copy'});return m;}
    putMeta(t,value){t.objectStore('meta').put({version:this.version+1,value},'active');}
    async deviceRecoveryAvailable(owner){
      let found=false;
      await this.tx(['meta'],'readonly',t=>scan(t.objectStore('meta'),IDBKeyRange.bound('device-recovery/','device-recovery/\uffff'),'next',r=>{if(r.owner===(owner||null)){found=true;return false;}}));
      return found;
    }
    archiveLegacy(raw){return this.serial(async()=>{
      if(localStorage.getItem(this.name)!==raw)throw Error('Another tab changed the older copy. Close other app tabs and reload before continuing.');
      await this.tx(['meta'],'readwrite',async t=>{
        const current=await this.check(t);
        t.objectStore('meta').put({owner:current.value.sync?.owner||null,raw,at:new Date().toISOString()},'device-recovery/'+crypto.randomUUID());
        this.putMeta(t,current.value);
      });this.version++;
      // Keep a later legacy write intact. The durable archive must commit first.
      if(localStorage.getItem(this.name)!==raw)throw Error('Another tab changed the older copy. Both copies are still preserved. Close other app tabs and reload.');
      localStorage.removeItem(this.name);this.legacy=null;
    });}
    async deviceRecoveryParts(legacyRaw=null,owner=null){
      const parts=['{"format":"strong-start-device-recovery-v1","indexed":'];
      await this.tx(['meta','logs','facts','pending','stage'],'readonly',async t=>{
        const active=await this.check(t),value=active.value;
        parts.push('{"state":'+JSON.stringify(value.state)+',"logs":[');let first=true;
        await scan(t.objectStore('logs'),IDBKeyRange.bound('local/','local/\uffff'),'next',r=>{if(r.data){parts.push((first?'':',')+JSON.stringify(r.data));first=false;}});
        parts.push(']},"legacy":',legacyRaw||'null',',"olderCopies":[');let firstOlder=true;
        await scan(t.objectStore('meta'),IDBKeyRange.bound('device-recovery/','device-recovery/\uffff'),'next',r=>{if(r.owner===(owner||null)){parts.push((firstOlder?'':',')+r.raw);firstOlder=false;}});
        parts.push('],"storage":{');
        // Preserve sync baselines, outbox, staged changes and off-page records too.
        for(const [i,name] of ['meta','logs','facts','pending','stage'].entries()){
          parts.push((i?',':'')+JSON.stringify(name)+':[');let firstRow=true;
          await scan(t.objectStore(name),null,'next',(value,c)=>{
            if(name==='meta'&&String(c.key).startsWith('device-recovery/')&&value.owner!==(owner||null))return;
            parts.push((firstRow?'':',')+JSON.stringify({key:c.key,value}));firstRow=false;
          });parts.push(']');
        }
        parts.push('}}');
      });return parts;
    }
    async clearDeviceRecoveries(t){await scan(t.objectStore('meta'),IDBKeyRange.bound('device-recovery/','device-recovery/\uffff'),'next',(_,c)=>c.delete());}
    async open(){
      this.db=await new Promise((resolve,reject)=>{
        const r=indexedDB.open(this.name+'_indexed',2);
        r.onupgradeneeded=()=>{const d=r.result;for(const n of ['meta','logs','pending','stage'])if(!d.objectStoreNames.contains(n))d.createObjectStore(n);
          if(!d.objectStoreNames.contains('facts')){const f=d.createObjectStore('facts');f.createIndex('timeline',['ms','id']);}}
        r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.onblocked=()=>reject(Error('Close the older app tabs and reload.'));
      });
      this.db.onversionchange=()=>{this.db.close();this.db=null;};
      let m=await this.tx(['meta'],'readonly',t=>request(t.objectStore('meta').get('active')));this.version=m?.version||0;
      if(!m?.value)return null;
      if(!m.value.paged){
        await this.tx(['meta','logs','facts','pending','stage'],'readwrite',async t=>{
          await this.check(t);const raw=t.objectStore('logs'),pending=t.objectStore('pending');
          await scan(raw,null,'next',async row=>{
            if(row.data&&!row.data.units){const slot=row.key.split('/')[0];row.data.units=(slot==='base'?m.value.sync.base?.state?.settings?.units:slot==='conflict'?m.value.sync.conflict?.state?.settings?.units:slot==='device'?m.value.sync.recovery?.device?.state?.settings?.units:slot==='account'?m.value.sync.recovery?.account?.state?.settings?.units:null)||m.value.state?.settings?.units||'lb';raw.put(row,row.key);}
            if(!row.key.startsWith('local/'))return;
            const id=row.data.id,b=await request(raw.get('base/'+id)),remote=await request(raw.get('conflict/'+id));
            t.objectStore('facts').put(this.options.fact(row.data,m.value.state?.settings?.units),id);
            if(!b||!this.options.same(row.data,b.data))pending.put({id,local:row.data,base:b?.data||null,remote:remote?.data,conflict:!!remote},id);
          });
          await scan(raw,IDBKeyRange.bound('base/','base/\uffff'),'next',async row=>{
            if(row.deleted||await request(raw.get('local/'+row.data.id)))return;
            const remote=await request(raw.get('conflict/'+row.data.id));pending.put({id:row.data.id,local:null,base:row.data,remote:remote?.data,conflict:!!remote},row.data.id);
          });
          if(m.value.sync.conflict){const c=m.value.sync.conflict,b=m.value.sync.base?.state,l=m.value.state;
            c.stateConflict=!this.options.same(l,c.state)&&!this.options.same(l,b)&&!this.options.same(c.state,b);c.recordCount=0;
            await scan(pending,null,'next',p=>{if(p.conflict)c.recordCount++;});}
          if(m.value.sync.conflict){const c=m.value.sync.conflict,token='migration-'+crypto.randomUUID();
            await scan(raw,IDBKeyRange.bound('conflict/','conflict/\uffff'),'next',r=>t.objectStore('stage').put({id:r.data.id,data:r.data,deleted:false},token+'/'+r.data.id));
            for(const id of c.deleted||[])t.objectStore('stage').put({id,deleted:true},token+'/'+id);
            m.value.sync.migration={token,state:c.state,revision:c.revision||m.value.sync.base?.revision||'0'};m.value.sync.conflict=null;
          }
          m.value.paged=true;m.value.logs=[];
          this.putMeta(t,m.value);
      });this.version++;
      }
      if(m.value.sync.migration)m={value:await this.finishMigration(m.value)};
      return {...m.value,logs:await this.page(null,30,null,m.value.state?.draft?.logId,m.value.state?.settings?.units)};
    }
    async facts(visit,direction='next',range=null){return this.tx(['facts'],'readonly',t=>scan(t.objectStore('facts').index('timeline'),range,direction,visit));}
    async page(before=null,limit=30,exercise=null,pin=null,units='lb'){
      const rows=[];const range=before?IDBKeyRange.upperBound(before,true):null;
      await this.facts(f=>{if(!exercise||f.entries.some(e=>e.ex===exercise)){rows.push(f);if(rows.length>=limit+1)return false;}},'prev',range);
      const more=rows.length>limit;rows.length=Math.min(rows.length,limit);
      this.pageMore=more;this.pageCursor=more&&rows.length?[rows.at(-1).ms,rows.at(-1).id]:null;
      const records=await this.tx(['logs'],'readonly',async t=>{const result=[];for(const f of rows){const r=await request(t.objectStore('logs').get('local/'+f.id));if(r)result.push(this.options.normalize(r.data,units));}
        if(pin&&!result.some(l=>l.id===pin)){const r=await request(t.objectStore('logs').get('local/'+pin));if(r)result.push(this.options.normalize(r.data,units));}return result;});
      this.track(records);return records;
    }
    track(records){this.view=new Map(records.map(l=>[l.id,this.options.signature(l)]));this.keys=this.view;this.pageGeneration=(this.pageGeneration||0)+1;}
    async get(id,units){return this.tx(['logs'],'readonly',async t=>{const r=await request(t.objectStore('logs').get('local/'+id));return r?this.options.normalize(r.data,units):null;});}
    async stageLocal(t,l,units){
      l=this.options.normalize(l,units||'lb');
      const raw=t.objectStore('logs'),p=t.objectStore('pending'),base=await request(raw.get('base/'+l.id));
      const existing=await request(p.get(l.id));
      raw.put({key:'local/'+l.id,data:l},'local/'+l.id);t.objectStore('facts').put(this.options.fact(l,units),l.id);
      if(base?.deleted)throw Error('Deleted workout IDs cannot be reused');
      if(base&&this.options.same(this.options.normalize(base.data,units),l))p.delete(l.id);
      else p.put({...existing,id:l.id,base:existing?.base??base?.data??null,local:l},l.id);
    }
    write(value){
      const captured=clone({...value,logs:[]}),generation=this.pageGeneration,changes=value.logs.filter(l=>this.view.get(l.id)!==this.options.signature(l)).map(clone);
      return this.serial(async()=>{
        await this.tx(['meta','logs','facts','pending'],'readwrite',async t=>{
          const prior=await this.check(t);
          if(prior?.value?.sync?.owner&&prior.value.sync.owner!==captured.sync.owner){this.historyVersion=(this.historyVersion||0)+1;for(const n of ['logs','facts','pending'])t.objectStore(n).clear();await this.clearDeviceRecoveries(t);}
          for(const l of changes)await this.stageLocal(t,l,captured.state?.settings?.units);
          captured.paged=true;this.putMeta(t,captured);
        });this.version++;
        if(changes.length)this.historyVersion=(this.historyVersion||0)+1;
        if(this.pageGeneration===generation){for(const l of changes)this.view.set(l.id,this.options.signature(l));while(this.view.size>31)this.view.delete(this.view.keys().next().value);}
      });
    }
    remove(id,value){return this.serial(async()=>{
      await this.tx(['meta','logs','facts','pending'],'readwrite',async t=>{
        await this.check(t);const raw=t.objectStore('logs'),p=t.objectStore('pending'),b=await request(raw.get('base/'+id)),old=await request(p.get(id));
        raw.delete('local/'+id);t.objectStore('facts').delete(id);
        if(b&&!b.deleted)p.put({id,base:old?.base??b.data,local:null},id);else p.delete(id);
        this.putMeta(t,{...clone(value),logs:[],paged:true});
      });this.version++;this.historyVersion=(this.historyVersion||0)+1;this.view.delete(id);
    });}
    clear(){return this.serial(async()=>{await this.tx(['meta','logs','facts','pending','stage'],'readwrite',async t=>{
      const m=await request(t.objectStore('meta').get('active'));this.version=m?.version||0;
      for(const n of ['logs','facts','pending','stage'])t.objectStore(n).clear();await this.clearDeviceRecoveries(t);this.putMeta(t,null);
    });this.version++;this.historyVersion=(this.historyVersion||0)+1;this.view.clear();});}
    beginIncoming(){this.stageToken??=crypto.randomUUID();const prefix=this.stageToken+'/';return this.serial(()=>this.tx(['stage'],'readwrite',t=>scan(t.objectStore('stage'),IDBKeyRange.bound(prefix,prefix+'\uffff'),'next',(_,c)=>c.delete())));}
    incoming(rows){const captured=clone(rows),prefix=this.stageToken+'/';return this.serial(()=>this.tx(['stage'],'readwrite',t=>{for(const r of captured)t.objectStore('stage').put(r,prefix+r.id);}));}
    async pending(limit=250,conflictsOnly=false){const rows=[];await this.tx(['pending'],'readonly',t=>scan(t.objectStore('pending'),null,'next',r=>{if(!conflictsOnly||r.conflict){rows.push(r);if(rows.length===limit)return false;}}));return rows;}
    async pendingCount(){return this.tx(['pending'],'readonly',t=>request(t.objectStore('pending').count()));}
    applyIncoming(remote,value){const snapshot=clone(value);return this.serial(async()=>{
      let next,mergedState,changed=0;
      await this.tx(['meta','logs','facts','pending','stage'],'readwrite',async t=>{
        await this.check(t);const raw=t.objectStore('logs'),pending=t.objectStore('pending');
        const merge=this.options.merge(snapshot.sync.base?.state,snapshot.state,remote.state);
        mergedState=merge.state;next={state:mergedState,logs:[],paged:true,sync:clone(snapshot.sync)};
        let conflicts=0;
        const prefix=this.stageToken+'/';
        await scan(t.objectStore('stage'),IDBKeyRange.bound(prefix,prefix+'\uffff'),'next',async row=>{
          changed++;
          const p=await request(pending.get(row.id));
          if(row.deleted){
            raw.delete('local/'+row.id);raw.put({key:'base/'+row.id,deleted:true},'base/'+row.id);t.objectStore('facts').delete(row.id);pending.delete(row.id);
            if(next.state?.draft?.logId===row.id){delete next.state.draft.logId;next.state.draft.partialSaved=false;}return;
          }
          if(!row.data.units)row.data.units=remote.state?.settings?.units||next.state?.settings?.units||'lb';
          const normalize=x=>x?this.options.normalize(x,next.state?.settings?.units):null;
          const r=normalize(row.data),b=normalize(p?.base),l=normalize(p?.local);
          raw.put({key:'base/'+row.id,data:row.data},'base/'+row.id);
          if(!p||this.options.same(l,r)||this.options.same(l,b)){
            raw.put({key:'local/'+row.id,data:row.data},'local/'+row.id);t.objectStore('facts').put(this.options.fact(row.data,next.state?.settings?.units),row.id);pending.delete(row.id);
          }else if(this.options.same(r,b)){
            // Its server copy did not change. Keep the pending edit/deletion.
            if(p.conflict)pending.put({...p,remote:undefined,conflict:false},row.id);
          }else pending.put({...p,remote:row.data,conflict:true},row.id);
        });
        await scan(pending,null,'next',p=>{if(p.conflict)conflicts++;});
        next.sync.base={state:merge.conflict?snapshot.sync.base?.state:remote.state,revision:remote.revision,logs:[],deleted:[]};
        next.sync.conflict=merge.conflict||conflicts?{state:remote.state,revision:remote.revision,logs:[],recordCount:conflicts,stateConflict:merge.conflict}:null;
        await scan(t.objectStore('stage'),IDBKeyRange.bound(prefix,prefix+'\uffff'),'next',(_,c)=>c.delete());delete next.sync.migration;this.putMeta(t,next);
      });this.version++;if(changed)this.historyVersion=(this.historyVersion||0)+1;return next;
    });}
    acknowledge(batch,response,value){const sent=clone(value);return this.serial(async()=>{
      let next;
      await this.tx(['meta','logs','facts','pending'],'readwrite',async t=>{
        const current=await this.check(t);next=current.value;
        const raw=t.objectStore('logs'),pending=t.objectStore('pending');
        for(const p of batch){
          const latest=await request(pending.get(p.id));
          if(p.local)raw.put({key:'base/'+p.id,data:p.local},'base/'+p.id);else raw.put({key:'base/'+p.id,deleted:true},'base/'+p.id);
          if(latest&&this.options.same(latest.local,p.local))pending.delete(p.id);
          else if(latest)pending.put({...latest,base:p.local},p.id);
        }
        const merge=this.options.merge(sent.state,next.state,response.state);
        next.state=merge.state;next.sync.base={state:response.state,revision:response.revision,logs:[],deleted:[]};
        if(merge.conflict)next.sync.conflict={state:response.state,revision:response.revision,logs:[],recordCount:0,stateConflict:true};
        this.putMeta(t,next);
      });this.version++;return next;
    });}
    resolve(choice,value){return this.serial(async()=>{
      let next=clone({...value,logs:[]});
      await this.tx(['meta','logs','facts','pending'],'readwrite',async t=>{
        await this.check(t);const raw=t.objectStore('logs');
        // Recovery is disk-backed. Never destroy either version when choosing.
        const recovery=t.objectStore('logs');
        for(const slot of ['device','account'])await scan(raw,IDBKeyRange.bound(slot+'/',slot+'/\uffff'),'next',(_,c)=>c.delete());
        for(const [from,to] of [['local','device'],['base','account']])await scan(raw,IDBKeyRange.bound(from+'/',from+'/\uffff'),'next',r=>{if(r.data)recovery.put({key:to+'/'+r.data.id,data:r.data},to+'/'+r.data.id);});
        await scan(t.objectStore('pending'),null,'next',p=>{
          if(!p.conflict)return;
          if(p.local)recovery.put({key:'device/'+p.id,data:p.local},'device/'+p.id);
          if(p.remote)recovery.put({key:'account/'+p.id,data:p.remote},'account/'+p.id);
          if(choice==='account'){
            raw.put({key:'local/'+p.id,data:p.remote},'local/'+p.id);t.objectStore('facts').put(this.options.fact(p.remote,next.state.settings.units),p.id);t.objectStore('pending').delete(p.id);
          }else t.objectStore('pending').put({id:p.id,local:p.local,base:p.remote},p.id);
        });
        const remote=next.sync.conflict;
        next.sync.recovery={device:{state:next.state,logs:[]},account:{state:remote.state,logs:[]},at:new Date().toISOString(),paged:true};
        if(choice==='account'&&remote.stateConflict)next.state=remote.state;
        next.sync.base={state:remote.state,revision:remote.revision,logs:[],deleted:[]};next.sync.conflict=null;this.putMeta(t,next);
      });this.version++;this.historyVersion=(this.historyVersion||0)+1;return next;
    });}
    async exportParts(state,slot='local',overrides=[]){const parts=['{"state":'+JSON.stringify(state)+',"logs":['],overlay=new Map(overrides.map(l=>[l.id,l]));let first=true;
      const add=l=>{parts.push((first?'':',')+JSON.stringify(l));first=false;};
      await this.tx(['logs'],'readonly',t=>scan(t.objectStore('logs'),IDBKeyRange.bound(slot+'/',slot+'/\uffff'),'next',r=>{if(r.data){add(overlay.get(r.data.id)||r.data);overlay.delete(r.data.id);}}));for(const l of overlay.values())add(l);parts.push(']}');return parts;}
    async finishMigration(value){
      const m=value.sync.migration;if(!m)return value;this.stageToken=m.token;
      const next=await this.applyIncoming({state:m.state,revision:String(m.revision)},value);
      if(this.importedLegacy)try{if(localStorage.getItem(this.name)===this.legacy)localStorage.removeItem(this.name);}catch{}return next;
    }
    importLegacy(value,compact){return this.serial(async()=>{
      await this.tx(['meta','logs','facts','pending','stage'],'readwrite',async t=>{
        await this.check(t);const raw=t.objectStore('logs'),pending=t.objectStore('pending'),base=new Map((value.sync.base?.logs||[]).map(l=>[l.id,l]));
        for(const l of value.sync.base?.logs||[]){if(!l.units)l.units=value.sync.base?.state?.settings?.units||value.state.settings.units;raw.put({key:'base/'+l.id,data:l},'base/'+l.id);}
        for(const l of value.logs){if(!l.units)l.units=value.state.settings.units;raw.put({key:'local/'+l.id,data:l},'local/'+l.id);t.objectStore('facts').put(this.options.fact(l,value.state.settings.units),l.id);if(!base.has(l.id)||!this.options.same(l,base.get(l.id)))pending.put({id:l.id,local:l,base:base.get(l.id)||null},l.id);base.delete(l.id);}
        for(const [id,l] of base)pending.put({id,local:null,base:l},id);
        const sync=compact(value.sync);
        if(value.sync.conflict){const c=value.sync.conflict,token='migration-'+crypto.randomUUID();
          for(const l of c.logs||[])t.objectStore('stage').put({id:l.id,data:l,deleted:false},token+'/'+l.id);
          for(const id of c.deleted||[])t.objectStore('stage').put({id,deleted:true},token+'/'+id);
          sync.migration={token,state:c.state,revision:c.revision||sync.base?.revision||'0'};sync.conflict=null;
        }
        this.putMeta(t,{state:value.state,logs:[],sync,paged:true});
      });this.version++;this.historyVersion=(this.historyVersion||0)+1;this.importedLegacy=true;
      const valueOnDisk=await this.tx(['meta'],'readonly',t=>request(t.objectStore('meta').get('active')));
      if(!valueOnDisk.value.sync.migration)try{if(localStorage.getItem(this.name)===this.legacy)localStorage.removeItem(this.name);}catch{}
      return valueOnDisk.value;
    });}
    replace(value){const backup=clone(value);return this.serial(async()=>{
      await this.tx(['meta','logs','facts','pending'],'readwrite',async t=>{
        await this.check(t);const raw=t.objectStore('logs'),pending=t.objectStore('pending');
        await scan(raw,null,'next',async r=>{if(!r.key.startsWith('local/'))return;const b=await request(raw.get('base/'+r.data.id));raw.delete(r.key);t.objectStore('facts').delete(r.data.id);if(b&&!b.deleted)pending.put({id:r.data.id,local:null,base:b.data},r.data.id);else pending.delete(r.data.id);});
        for(const l of backup.logs)await this.stageLocal(t,l,backup.state.settings.units);
        this.putMeta(t,{...backup,logs:[],paged:true});
      });this.version++;this.historyVersion=(this.historyVersion||0)+1;this.view.clear();
    });}
    async summary(context){
      const groups=new Map(),experience=new Map(),week=new Map(),partial=new Map();let count=0,last=null,hasBlock=false,today=null,next=null,intervals=0;
      const todayStart=new Date(context.now);todayStart.setHours(0,0,0,0);const ws=new Date(todayStart);ws.setDate(ws.getDate()-((ws.getDay()+6)%7));
      const newer=(f,old)=>!old||f.ms>old.ms||(f.ms===old.ms&&f.id.localeCompare(old.id)<0);
      const completedLater=(f,old)=>!old||Date.parse(f.completedAt||f.date)>Date.parse(old.completedAt||old.date)||(Date.parse(f.completedAt||f.date)===Date.parse(old.completedAt||old.date)&&newer(f,old));
      await this.facts(f=>{
        count++;if(!last||f.ms>last.ms||(f.ms===last.ms&&f.id.localeCompare(last.id)<0))last=f;
        const doneMs=Date.parse(f.completedAt||f.date),day=new Date(doneMs);day.setHours(0,0,0,0);
        if(f.block===context.block?.n){hasBlock=true;
          if(f.status==='partial'&&f.week>=0&&f.week<=context.blockLen+1){const key=f.week+'/'+f.key;if(newer(f,partial.get(key)))partial.set(key,f);}
          if(f.status!=='partial'){
            const key=f.week+'/'+f.key;if(f.week>=0&&f.week<=context.blockLen+1&&newer(f,week.get(key)))week.set(key,f);
            if(+day===+todayStart&&completedLater(f,today))today=f;
            if(f.orderAdvanced!==false&&context.keys.includes(f.key)&&(!context.block.sequenceResetAt||doneMs>Date.parse(context.block.sequenceResetAt))&&completedLater(f,next))next=f;
          }
        }
        if(f.cardio?.type==='intervals'&&f.ms>=+ws)intervals++;
        for(const e of f.entries){
          let x=experience.get(e.ex);if(!x){x={count:0,firstBlock:f.block,programs:1,top:[],earlier:0};experience.set(e.ex,x);}x.count++;if(f.block!==x.firstBlock)x.programs=2;
          const top=e.top*((f.units||context.units)===context.units?1:context.units==='lb'?1/0.45359237:0.45359237);x.top.push({d:f.ms,id:f.id,v:top});x.top.sort((a,b)=>a.d-b.d||b.id.localeCompare(a.id));if(x.top.length>3)x.earlier=Math.max(x.earlier,x.top.shift().v);
          if(!f.valid)continue;
          const key={d:f.ms,id:f.id};let g=groups.get(e.ex);if(!g){g={id:e.ex,name:e.name,area:e.area,count:0,lastDate:f.date,firstKey:key,types:{}};groups.set(e.ex,g);}g.count++;g.lastDate=f.date;if(chronological(key,g.firstKey)<0){g.firstKey=key;g.name=e.name;}
          if(e.metric&&f.status!=='partial'){
            const k=e.metric.kind;if(!g.kindKey||chronological(key,g.kindKey)>0){g.kind=k;g.kindKey=key;}let a=g.types[k];if(!a)a=g.types[k]={count:0,first:[],last:[],points:[]};
            const p={d:new Date(f.date),id:f.id,kind:k,v:e.metric.v};a.count++;a.first.push(p);a.first.sort(chronological);if(a.first.length>2)a.first.pop();a.last.push(p);a.last.sort(chronological);if(a.last.length>3)a.last.shift();sample(a.points,p);
          }
        }
      });
      const list=[...groups.values()].map(g=>{const a=g.types[g.kind];return {...g,types:undefined,records:[{l:{date:g.lastDate}}],points:(a?.points||[]).sort(chronological),ready:(a?.count||0)>=4,baseline:a?.count>=4?median(a.first.map(p=>p.v)):null,ratio:a?.count>=4?median(a.last.map(p=>p.v))/median(a.first.map(p=>p.v)):null,start:a?.first[1]?.d};}).sort((a,b)=>Date.parse(b.lastDate)-Date.parse(a.lastDate)||a.name.localeCompare(b.name));
      const graphs={};for(const area of ['overall','upper','lower']){
        const eligible=list.filter(g=>g.ready&&(area==='overall'||g.area===area));graphs[area]={eligible,points:[],totalPoints:0,score:null,start:eligible.length?Math.max(...eligible.map(g=>+g.start)):Infinity};
      }
      const rings=new Map(list.filter(g=>g.ready).map(g=>[g.id,{kind:g.kind,values:[]}])),areaIds=Object.fromEntries(Object.entries(graphs).map(([a,g])=>[a,new Set(g.eligible.map(e=>e.id))])),changed=new Set();let date=null;
      const emit=()=>{if(date===null)return;for(const [area,graph] of Object.entries(graphs))if(changed.has(area)&&date>=graph.start){const v=graph.eligible.reduce((n,g)=>n+median(rings.get(g.id).values.map(p=>p.v))/g.baseline*100,0)/graph.eligible.length;graph.totalPoints++;sample(graph.points,{d:new Date(date),v});graph.score=v;}changed.clear();};
      await this.facts(f=>{if(!f.valid||f.status==='partial')return;const relevant=f.entries.filter(e=>e.metric&&rings.get(e.ex)?.kind===e.metric.kind);if(!relevant.length)return;if(date!==null&&date!==f.ms)emit();date=f.ms;for(const e of relevant){const r=rings.get(e.ex);r.values.push({d:f.ms,id:f.id,v:e.metric.v});r.values.sort(chronological);if(r.values.length>3)r.values.shift();for(const area of Object.keys(graphs))if(areaIds[area].has(e.ex))changed.add(area);}});emit();
      return {count,last,blockN:context.block?.n,hasBlock,today,next,intervals,weeks:[...week.values()],partials:[...partial.values()],groups:list,experience:Object.fromEntries([...experience].map(([id,x])=>[id,{...x,top:x.top.map(p=>p.v)}])),graphs};
    }
  }
  globalThis.StrongStartHistory={Store};
})();
