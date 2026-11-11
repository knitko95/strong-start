import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const built = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
for (const html of [source, built]) {
  for (const [i, match] of [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].entries()) {
    if (match[1].trim()) new vm.Script(match[1], { filename: `inline-${i}.js` });
  }
}
function config(html, url) {
  const context = {
    location: new URL(url),
    document: { createElement: () => ({ style: {}, setAttribute() {} }),
      body: { insertBefore() {} }, querySelector: () => ({}) }
  };
  vm.createContext(context);
  const environment = html.split('/* Environment:')[1].split('/* ---------------- Exercise library')[0];
  const database = html.match(/const SB_URL =[\s\S]*?const SITE_URL=/)[0].split('const SITE_URL=')[0];
  vm.runInContext('/* Environment:' + environment + database + '\nresult={APP_ENV,SB_URL,SB_KEY,stateKey:storageKey("strongstart_state_v3"),accountKey:storageKey("strongstart_acct")};', context);
  return context.result;
}
for (const path of ['/strong-start/', '/strong-start/index.html']) {
  const result = config(source, 'https://knitko95.github.io' + path);
  assert.equal(result.APP_ENV, 'production');
  assert.match(result.SB_URL, /aybtxqsneywuqxzjwoek/);
  assert.equal(result.stateKey, 'strongstart_state_v3');
  assert.equal(result.accountKey, 'strongstart_acct');
}
for (const url of ['https://strong-start-dev.pages.dev/', 'https://preview.strong-start-dev.pages.dev/', 'http://localhost:8731/', 'https://knitko95.github.io/strong-start/dev/', 'https://knitko95.github.io/strong-start-dev/']) {
  const result = config(source, url);
  assert.equal(result.APP_ENV, 'development');
  assert.match(result.SB_URL, /gvyfgqhgqnfmtoytqpeo/);
  assert.equal(result.stateKey, 'dev_strongstart_state_v3');
  assert.equal(result.accountKey, 'dev_strongstart_acct');
}
assert.equal(config(built, 'https://knitko95.github.io/strong-start/').APP_ENV, 'development');
assert.ok(!built.includes('aybtxqsneywuqxzjwoek'));
assert.ok(!built.includes('sb_publishable_swpSGJwzyT_AvE_UR5XGLw_mLNhGdsl'));
console.log('Inline scripts and environment isolation checks passed.');
