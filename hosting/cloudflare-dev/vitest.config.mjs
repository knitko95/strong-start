import {cloudflareTest} from '@cloudflare/vitest-plugin';
import {defineConfig} from 'vitest/config';
export default defineConfig({
  plugins:[cloudflareTest({wrangler:{configPath:'./feedback.test.wrangler.jsonc'}})],
  test:{include:['test/**/*.test.mjs'],testTimeout:20000}
});
