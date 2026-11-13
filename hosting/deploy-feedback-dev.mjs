// Workers Builds supplies the encrypted build secret. Pass it to cf's supported
// secrets-file upload without printing it or placing it in process arguments.
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const project=fileURLToPath(new URL('./cloudflare-dev/',import.meta.url));
if(resolve(process.cwd())!==resolve(project))throw new Error('Run this command from hosting/cloudflare-dev.');
if(process.env.WRANGLER_CI_OVERRIDE_NAME&&process.env.WRANGLER_CI_OVERRIDE_NAME!=='strong-start-dev')throw new Error('This command deploys the dev Worker only.');
const token=process.env.GITHUB_FEEDBACK_TOKEN;
if(!token)throw new Error('The encrypted dev build secret GITHUB_FEEDBACK_TOKEN is required.');
const directory=await mkdtemp(join(tmpdir(),'strong-start-dev-secret-'));
try{
  const secretFile=join(directory,'secrets.json');
  await writeFile(secretFile,JSON.stringify({GITHUB_FEEDBACK_TOKEN:token}),{mode:0o600,flag:'wx'});
  const exitCode=await new Promise((done,reject)=>{
    const child=spawn(process.execPath,[join(project,'node_modules/cf/bin/cf'),'deploy','--prebuilt','--worker','strong-start-dev','--secrets-file',secretFile],{stdio:'inherit',shell:false});
    child.once('error',reject);child.once('exit',code=>done(code??1));
  });
  process.exitCode=exitCode;
}finally{await rm(directory,{recursive:true,force:true});}
