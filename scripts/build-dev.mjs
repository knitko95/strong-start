import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {stampApp} from './app-version.mjs';
import {assetHeaders, assetRedirects} from './hosting-assets.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = path.join(root, 'dist');
const target = process.env.STRONG_START_PREVIEW || 'dev';
if (!['dev','dev1','dev2'].includes(target)) throw new Error('Unknown test target');
if (target !== 'dev') process.env.STRONG_START_VARIANT = target;
const branch = process.env.WORKERS_CI_BRANCH || process.env.CF_PAGES_BRANCH;
if (branch && branch !== target) {
  throw new Error('This Cloudflare project deploys only the dev branch.');
}
mkdirSync(out, { recursive: true });
await import('./check-exercise-guides.mjs');
await import('./check-all-exercise-animations.mjs');
for (const file of ['index.html', 'privacy.html', 'terms.html', 'manifest.webmanifest', 'manifest.dev.webmanifest', '.nojekyll', 'icons', 'offline.js', 'sw.js', 'exercise-guides']) {
  cpSync(path.join(root, file), path.join(out, file), { recursive: true });
}
// A test deployment cannot connect to production even if served at another URL.
const html = readFileSync(path.join(out, 'index.html'), 'utf8')
  .replace(/const IS_PRODUCTION = [\s\S]*?;\r?\n/, 'const IS_PRODUCTION = false;\n')
  .replaceAll('https://aybtxqsneywuqxzjwoek.supabase.co', 'https://gvyfgqhgqnfmtoytqpeo.supabase.co')
  .replaceAll('sb_publishable_swpSGJwzyT_AvE_UR5XGLw_mLNhGdsl', 'sb_publishable_zODycrXJ-6wKpZiAR9qEHg_IP95lM49');
if (!html.includes('const IS_PRODUCTION = false;') || html.includes('aybtxqsneywuqxzjwoek')) {
  throw new Error('Development database isolation check failed.');
}
const stamped=stampApp(html,readFileSync(path.join(out,'sw.js'),'utf8'),root);
if(target !== 'dev'){
  stamped.html=stamped.html.replace('Strong Start \u00b7 Testing','Strong Start \u00b7 '+target.toUpperCase()).replace('TESTING \u00b7 Separate test accounts and data',target.toUpperCase()+' \u00b7 Shared test data');
  const manifest=JSON.parse(readFileSync(path.join(out,'manifest.dev.webmanifest'),'utf8'));
  manifest.name='Strong Start '+target.toUpperCase(); manifest.short_name='SS '+target.toUpperCase();
  writeFileSync(path.join(out,'manifest.dev.webmanifest'),JSON.stringify(manifest,null,2)+'\n');
}
writeFileSync(path.join(out, 'index.html'), stamped.html);
writeFileSync(path.join(out,'sw.js'),stamped.sw);
writeFileSync(path.join(out,'version.json'),JSON.stringify({...stamped.metadata,environment:'development'},null,2)+'\n');
writeFileSync(path.join(out, '_headers'), assetHeaders.replace('/*\n', '/*\n  X-Robots-Tag: noindex, nofollow\n'));
writeFileSync(path.join(out, '_redirects'), assetRedirects);
writeFileSync(path.join(out, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
console.log('Built isolated development site in dist/');
await import('./check-environments.mjs');
await import('./test-app-version.mjs');
await import('./test-persistence.mjs');
await import('./test-workout-demos.mjs');
await import('./test-offline.mjs');
