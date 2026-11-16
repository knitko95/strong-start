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
await import('./check-pose-guides.mjs');
await import('./check-pose-review.mjs');
await import('./test-pose-review-store.mjs');
await import('./check-all-exercise-animations.mjs');
for (const file of ['index.html', 'privacy.html', 'terms.html', 'manifest.webmanifest', 'manifest.dev.webmanifest', '.nojekyll', 'icons', 'analytics.js', 'history-store.js', 'offline.js', 'sw.js', 'exercise-guides']) {
  cpSync(path.join(root, file), path.join(out, file), { recursive: true });
}
// A test deployment cannot connect to production even if served at another URL.
if(!process.env.POSTHOG_DEV_PROJECT_TOKEN && process.loadEnvFile){try{process.loadEnvFile(path.join(root,'.env.analytics.local'));}catch{}}
const analytics={enabled:target==='dev',token:process.env.POSTHOG_DEV_PROJECT_TOKEN||'',host:process.env.POSTHOG_DEV_HOST||''};
if(analytics.token && (!/^phc_[A-Za-z0-9_-]+$/.test(analytics.token)||!['https://us.i.posthog.com','https://eu.i.posthog.com'].includes(analytics.host)))throw new Error('Invalid development PostHog destination');
const html = readFileSync(path.join(out, 'index.html'), 'utf8')
  .replace(/const USAGE_CONFIG = [^;]+;/,()=> 'const USAGE_CONFIG = '+JSON.stringify(analytics)+';')
  .replace('const DEV2_DEMO_BUILD = false;', `const DEV2_DEMO_BUILD = ${target === 'dev2'};`)
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
writeFileSync(path.join(out, '_redirects'), assetRedirects + '/exercise-guides/pose-review/ /exercise-guides/pose-review/index.html 200\n');
writeFileSync(path.join(out, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
console.log('Built isolated development site in dist/');
await import('./check-environments.mjs');
await import('./test-app-version.mjs');
await import('./test-persistence.mjs');
await import('./test-workout-demos.mjs');
await import('./test-offline.mjs');
