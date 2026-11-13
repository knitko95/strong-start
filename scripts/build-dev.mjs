import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {stampApp} from './app-version.mjs';
import {assetHeaders, assetRedirects} from './hosting-assets.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = path.join(root, 'dist');
if (process.env.CF_PAGES_BRANCH && process.env.CF_PAGES_BRANCH !== 'dev') {
  throw new Error('This Cloudflare project deploys only the dev branch.');
}
mkdirSync(out, { recursive: true });
await import('./check-exercise-guides.mjs');
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
writeFileSync(path.join(out, 'index.html'), stamped.html);
writeFileSync(path.join(out,'sw.js'),stamped.sw);
writeFileSync(path.join(out,'version.json'),JSON.stringify({...stamped.metadata,environment:'development'},null,2)+'\n');
writeFileSync(path.join(out, '_headers'), assetHeaders.replace('/*\n', '/*\n  X-Robots-Tag: noindex, nofollow\n'));
writeFileSync(path.join(out, '_redirects'), assetRedirects);
writeFileSync(path.join(out, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
console.log('Built isolated development site in dist/');
await import('./check-environments.mjs');
await import('./test-persistence.mjs');
await import('./test-workout-demos.mjs');
await import('./test-offline.mjs');
