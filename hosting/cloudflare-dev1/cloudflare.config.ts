import {defineConfig} from 'cf/config';
import {sharedWorker} from '../shared-worker.ts';
export default defineConfig({accountId:'04a90695aab9e16508a12ea9d139c427',worker:{...sharedWorker,compatibilityDate:'2026-11-13',name:'strong-start-dev1',entrypoint:'../preview-worker.mjs',assets:{...sharedWorker.assets,runWorkerFirst:['/api/feedback','/api/feedback/*']}}});
