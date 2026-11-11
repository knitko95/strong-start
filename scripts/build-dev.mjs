import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const out = path.join(root, 'dist');
if (process.env.CF_PAGES_BRANCH && process.env.CF_PAGES_BRANCH !== 'dev') {
  throw new Error('This Cloudflare project deploys only the dev branch.');
}
mkdirSync(out, { recursive: true });
for (const file of ['index.html', 'privacy.html', 'manifest.webmanifest', 'manifest.dev.webmanifest', '.nojekyll', 'icons']) {
  cpSync(path.join(root, file), path.join(out, file), { recursive: true });
}
// A test deployment cannot connect to production even if served at another URL.
const html = readFileSync(path.join(out, 'index.html'), 'utf8')
  .replace(/const IS_PRODUCTION = location\.origin[\s\S]*?;\r?\n/, 'const IS_PRODUCTION = false;\n')
  .replaceAll('https://aybtxqsneywuqxzjwoek.supabase.co', 'https://gvyfgqhgqnfmtoytqpeo.supabase.co')
  .replaceAll('sb_publishable_swpSGJwzyT_AvE_UR5XGLw_mLNhGdsl', 'sb_publishable_zODycrXJ-6wKpZiAR9qEHg_IP95lM49');
if (!html.includes('const IS_PRODUCTION = false;') || html.includes('aybtxqsneywuqxzjwoek')) {
  throw new Error('Development database isolation check failed.');
}
writeFileSync(path.join(out, 'index.html'), html);
writeFileSync(path.join(out, '_headers'), '/*\n  X-Robots-Tag: noindex, nofollow\n  Cache-Control: no-store\n');
writeFileSync(path.join(out, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
console.log('Built isolated development site in dist/');
await import('./check-environments.mjs');
