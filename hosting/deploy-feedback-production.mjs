// Workers Builds supplies the encrypted build secret. Pass it to cf's supported
// secrets-file upload without printing it or placing it in process arguments.
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const project=fileURLToPath(new URL('./cloudflare/',import.meta.url));
if(resolve(process.cwd())!==resolve(project))throw new Error('Run this command from hosting/cloudflare.');
if(process.env.WRANGLER_CI_OVERRIDE_NAME&&process.env.WRANGLER_CI_OVERRIDE_NAME!=='strong-start')throw new Error('This command deploys the production Worker only.');
const token=process.env.GITHUB_FEEDBACK_TOKEN;
if(!token)throw new Error('The encrypted production build secret GITHUB_FEEDBACK_TOKEN is required.');
// Fail before publishing the form if its credential cannot reach the fixed
// private destination. This prints no report content, response body or secret.
const githubHeaders={Authorization:'Bearer '+token,Accept:'application/vnd.github+json','User-Agent':'StrongStart-Feedback-Release','X-GitHub-Api-Version':'2022-11-28'};
const repository='https://api.github.com/repos/knitko95/strong-start-feedback';
const repoResponse=await fetch(repository,{headers:githubHeaders,redirect:'manual',signal:AbortSignal.timeout(10000)});
if(!repoResponse.ok)throw new Error('Production feedback credential check failed: HTTP '+repoResponse.status);
const repo=await repoResponse.json();
if(repo.private!==true||repo.full_name!=='knitko95/strong-start-feedback')throw new Error('Feedback destination must be the intended private tracker.');
const issues=await fetch(repository+'/issues?per_page=1',{headers:githubHeaders,redirect:'manual',signal:AbortSignal.timeout(10000)});
if(!issues.ok)throw new Error('Production feedback Issues access check failed: HTTP '+issues.status);
await issues.body?.cancel();
console.log('Verified private feedback tracker and Issues read access.');
const directory=await mkdtemp(join(tmpdir(),'strong-start-secret-'));
try{
  const secretFile=join(directory,'secrets.json');
  await writeFile(secretFile,JSON.stringify({GITHUB_FEEDBACK_TOKEN:token}),{mode:0o600,flag:'wx'});
  const exitCode=await new Promise((done,reject)=>{
    const child=spawn(process.execPath,[join(project,'node_modules/cf/bin/cf'),'deploy','--prebuilt','--worker','strong-start','--secrets-file',secretFile],{stdio:'inherit',shell:false});
    child.once('error',reject);child.once('exit',code=>done(code??1));
  });
  process.exitCode=exitCode;
}finally{await rm(directory,{recursive:true,force:true});}
