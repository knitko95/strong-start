// Package only public runtime files. Never deploy the repository root.
// Building is safe on dev; publication is a separately approved operation.
import {cpSync, mkdirSync, readFileSync, writeFileSync, rmSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import {stampApp} from './app-version.mjs';
import {assetHeaders, assetRedirects} from './hosting-assets.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const out = path.join(root, 'dist-production');
// The resolved target must be this checkout's dedicated generated directory.
assert.equal(path.resolve(out), path.resolve(root, 'dist-production'));
assert.equal(path.dirname(out), path.resolve(root));
rmSync(out, {recursive:true, force:true});
mkdirSync(out, {recursive:true});
await import('./check-exercise-guides.mjs');
for (const file of ['index.html', 'privacy.html', 'terms.html', 'manifest.webmanifest', 'manifest.dev.webmanifest',
  'icons', 'offline.js', 'sw.js', '.nojekyll', 'exercise-guides']) {
  cpSync(path.join(root,file), path.join(out,file), {recursive:true});
}
const html = readFileSync(path.join(out,'index.html'),'utf8');
assert.ok(html.includes("location.origin === 'https://strongstart.app'"));
assert.ok(!html.includes('const IS_PRODUCTION = false;'), 'Do not publish the isolated dev build');
const stamped=stampApp(html,readFileSync(path.join(out,'sw.js'),'utf8'),root,{channel:'main'});
writeFileSync(path.join(out,'index.html'),stamped.html);
writeFileSync(path.join(out,'sw.js'),stamped.sw);
writeFileSync(path.join(out,'version.json'),JSON.stringify({...stamped.metadata,environment:'production'},null,2)+'\n');
// Revalidate mutable shell files while retaining deliberate offline caches.
writeFileSync(path.join(out,'_headers'), assetHeaders);
// Internal root rewrite, with no browser redirect or change to invite/Auth URLs.
writeFileSync(path.join(out,'_redirects'), assetRedirects);
console.log('Packaged public production files in dist-production/; nothing deployed.');
