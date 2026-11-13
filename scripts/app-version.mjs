import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

export function releasesFromHTML(html){
  const match=html.match(/const APP_RELEASES = (\[[\s\S]*?\n\]);/);
  assert(match,'App release history is required');
  const releases=JSON.parse(match[1]), seen=new Set();
  assert(releases.length,'At least one release is required');
  let previous=null;
  for(const r of releases){
    assert(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(r.version),'Use major.minor.patch versions');
    assert(!seen.has(r.version),'Duplicate app version'); seen.add(r.version);
    const parts=r.version.split('.').map(Number);
    if(previous){const i=parts.findIndex((n,i)=>n!==previous[i]);assert(i>=0&&parts[i]<previous[i],'Release history must be newest first');}
    previous=parts;
    assert(/^\d{4}-\d{2}-\d{2}$/.test(r.date)&&new Date(r.date).toISOString().slice(0,10)===r.date,'Release date required');
    assert(typeof r.title==='string'&&r.title.trim(),'Release title required');
    assert(Array.isArray(r.notes)&&r.notes.length&&r.notes.every(n=>typeof n==='string'&&n.trim()),'Every version needs release notes');
  }
  return releases;
}

export function stampApp(html,sw,root,{channel='dev',variant=process.env.STRONG_START_VARIANT||channel}={}){
  assert(['main','dev'].includes(channel),'Unknown build channel');
  assert(typeof variant==='string'&&variant.length<=32&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(variant),'Variant must be a lowercase name, up to 32 characters, using letters, digits and single hyphens');
  assert(channel!=='dev'||variant!=='main','The main variant is reserved for production builds');
  const releases=releasesFromHTML(html);
  // Git is the actual checked-out source, rather than a user-supplied version label.
  const commit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
  assert(/^[a-f0-9]{40}$/.test(commit),'Build requires a full source commit');
  const digest=createHash('sha256').update(html).update(sw).digest('hex').slice(0,12);
  const build={id:(variant==='main'?'':variant+'--')+commit.slice(0,12)+'-'+digest,commit,variant};
  assert(/const APP_BUILD = \{[^\n]*\};/.test(html),'Build stamp marker missing');
  html=html.replace(/const APP_BUILD = \{[^\n]*\};/,'const APP_BUILD = '+JSON.stringify(build)+';');
  sw=sw.replace(/const VERSION = '[^']+';/,`const VERSION = '${build.id}';`);
  return {html,sw,metadata:{version:releases[0].version,...build,releases}};
}
