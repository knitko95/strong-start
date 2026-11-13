import {DurableObject} from 'cloudflare:workers';
import {FeedbackError,json,readJson,normalizeReport,authenticate,hash,githubIssue,githubFetch,sourceMarker,UUID} from './feedback-core.mjs';

// A namespace instance per authenticated account: independent rate limits and delivery state.
export class FeedbackOutbox extends DurableObject {
  busy=false;
  constructor(ctx,env){
    super(ctx,env);
    ctx.blockConcurrencyWhile(async()=>{
      ctx.storage.sql.exec(`CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY, digest TEXT NOT NULL, payload TEXT,
        state TEXT NOT NULL, created_at INTEGER NOT NULL, next_at INTEGER NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0, issue_number INTEGER, error TEXT);
        CREATE INDEX IF NOT EXISTS feedback_due ON reports(state,next_at);
        CREATE INDEX IF NOT EXISTS feedback_created ON reports(created_at);`);
    });
  }
  row(id){return this.ctx.storage.sql.exec('SELECT * FROM reports WHERE id = ?',id).toArray()[0];}
  receipt(row){return row?{id:row.id,status:row.state==='delivered'?'delivered':row.state==='uncertain'?'checking':'queued'}:null;}
  async submit(input){
    const report=normalizeReport(input),digest=await hash(JSON.stringify(report));
    let row=this.row(report.id);
    if(row&&row.digest!==digest)return {httpStatus:409,error:'submission-changed'};
    if(!row){
      const now=Date.now();
      const recent=this.ctx.storage.sql.exec('SELECT count(*) AS n FROM reports WHERE created_at > ?',now-3600000).one().n;
      const pending=this.ctx.storage.sql.exec("SELECT count(*) AS n FROM reports WHERE state <> 'delivered'").one().n;
      if(recent>=10||pending>=20)return {httpStatus:429,error:'too-many-reports'};
      this.ctx.storage.sql.exec("INSERT INTO reports(id,digest,payload,state,created_at,next_at) VALUES(?,?,?,'queued',?,?)",report.id,digest,JSON.stringify(report),now,now);
    }
    await this.schedule(); // Persist the retry before attempting external delivery.
    await this.deliver(report.id);
    row=this.row(report.id);
    return {httpStatus:row.state==='delivered'?200:202,...this.receipt(row)};
  }
  status(id){return this.receipt(this.row(id));}
  async schedule(){
    const due=this.ctx.storage.sql.exec("SELECT min(next_at) AS due FROM reports WHERE state <> 'delivered'").one().due;
    if(due===null)await this.ctx.storage.deleteAlarm();
    else await this.ctx.storage.setAlarm(Math.max(Date.now()+1000,due));
  }
  retry(id,code,uncertain=false,delay=60000){
    this.ctx.storage.sql.exec('UPDATE reports SET state=?,error=?,next_at=? WHERE id=?',uncertain?'uncertain':'queued',code,Date.now()+delay,id);
    // Never log report text, credentials, JWTs or account IDs.
    console.warn(JSON.stringify({event:uncertain?'feedback.delivery_uncertain':'feedback.delivery_retry',submission:id,code,outbox:this.ctx.id.toString()}));
  }
  complete(id,number){
    this.ctx.storage.sql.exec("UPDATE reports SET state='delivered',payload=NULL,error=NULL,issue_number=? WHERE id=?",number,id);
  }
  async reconcile(row){
    const marker=sourceMarker(this.env.FEEDBACK_ENVIRONMENT,row.id);
    // List is used rather than indexed search; compare the entire marker (2 must not match 29).
    for(let page=1;page<=10;page++){
      const response=await githubFetch(this.env,`/issues?state=all&sort=created&direction=desc&per_page=30&page=${page}`);
      if(!response.ok)throw new Error('reconcile-unavailable');
      const issues=await readJson(response,524288);
      if(!Array.isArray(issues))throw new Error('reconcile-invalid');
      const found=issues.find(i=>!i.pull_request&&typeof i.body==='string'&&i.body.includes(marker));
      if(found){this.complete(row.id,found.number);return;}
      if(issues.length<30||issues.some(i=>Date.parse(i.created_at)<row.created_at-600000))break;
    }
    // A lost create response is ambiguous. Never blindly create a second issue.
    this.retry(row.id,'needs-reconciliation',true,3600000);
  }
  async deliver(id){
    if(this.busy)return;
    let row=this.row(id);if(!row||row.state==='delivered'||row.next_at>Date.now())return;
    this.busy=true;
    try{
      if(row.state==='uncertain'||row.state==='creating'){await this.reconcile(row);return;}
      // Confirm the fixed destination remains private before sending any report text.
      const repoResponse=await githubFetch(this.env,'');
      if(!repoResponse.ok){this.retry(id,'tracker-unavailable',false,300000);return;}
      const repo=await readJson(repoResponse,65536);
      if(repo.private!==true||repo.full_name!=='knitko95/strong-start-feedback'){this.retry(id,'tracker-not-private',false,3600000);return;}
      this.ctx.storage.sql.exec("UPDATE reports SET state='creating',attempts=attempts+1,next_at=? WHERE id=?",Date.now()+60000,id);
      row=this.row(id);
      let response;
      try{response=await githubFetch(this.env,'/issues',{method:'POST',body:JSON.stringify(githubIssue(JSON.parse(row.payload),this.env.FEEDBACK_ENVIRONMENT,row.created_at))});}
      catch{this.retry(id,'create-response-unknown',true);return;}
      if(response.status===201){
        try{const issue=await readJson(response,65536);if(!Number.isInteger(issue.number))throw new Error();this.complete(id,issue.number);}
        catch{this.retry(id,'create-response-unknown',true);}
      }else if(response.status>=500){this.retry(id,'create-response-unknown',true);}
      else{const delay=Math.min(3600000,Math.max(60000,Number(response.headers.get('Retry-After')||0)*1000));this.retry(id,'github-'+response.status,false,delay);await response.body?.cancel();}
    }catch{this.retry(id,'delivery-unavailable',row?.state==='creating'||row?.state==='uncertain',300000);}
    finally{this.busy=false;await this.schedule();}
  }
  async alarm(){
    const due=this.ctx.storage.sql.exec("SELECT id FROM reports WHERE state <> 'delivered' AND next_at <= ? ORDER BY next_at LIMIT 3",Date.now()).toArray();
    for(const row of due)await this.deliver(row.id);
    await this.schedule();
  }
}

export default {
  async fetch(request,env,ctx){
    const url=new URL(request.url);
    if(!url.pathname.startsWith('/api/feedback'))return new Response('Not found',{status:404});
    try{
      const environment=env.FEEDBACK_ENVIRONMENT;
      if(!['development','production'].includes(environment)||!env.GITHUB_FEEDBACK_TOKEN)throw new FeedbackError(503,'not-configured');
      if(request.headers.get('Origin')&&request.headers.get('Origin')!==url.origin)throw new FeedbackError(403,'wrong-origin');
      if(request.method!=='POST'&&request.method!=='GET')throw new FeedbackError(405,'method-not-allowed');
      if(request.method==='POST'&&url.pathname!=='/api/feedback')throw new FeedbackError(404,'not-found');
      if(request.method==='POST'&&!/^application\/json(?:;|$)/i.test(request.headers.get('Content-Type')||''))throw new FeedbackError(415,'json-required');
      let report;
      if(request.method==='POST')report=normalizeReport(await readJson(request));
      else if(!UUID.test(url.pathname.slice('/api/feedback/'.length)))throw new FeedbackError(404,'not-found');
      const owner=await authenticate(request,environment);
      const outbox=ctx.exports.FeedbackOutbox.getByName(owner);
      if(request.method==='GET'){
        const receipt=await outbox.status(url.pathname.slice('/api/feedback/'.length));
        return receipt?json(receipt):json({error:'not-found'},404);
      }
      const result=await outbox.submit(report);
      const {httpStatus,...body}=result;return json(body,httpStatus);
    }catch(error){
      if(error instanceof FeedbackError)return json({error:error.code},error.status);
      console.warn(JSON.stringify({event:'feedback.request_failed'}));
      return json({error:'temporarily-unavailable'},503);
    }
  }
};
