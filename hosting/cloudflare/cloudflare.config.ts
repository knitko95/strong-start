import {defineConfig} from 'cf/config';

// No custom domain, route, Git release trigger or production binding is
// installed by this configuration. Connect strongstart.app only after review.
export default defineConfig({
  accountId: '04a90695aab9e16508a12ea9d139c427',
  worker: {
    name: 'strong-start',
    compatibilityDate: '2026-11-11',
    workersDev: false,
    previewUrls: false,
    // Keep index.html directly fetchable: redirected precache responses cannot
    // be returned to offline navigation requests by the existing service worker.
    assets: {htmlHandling:'none'},
    observability: {enabled:true, traces:{enabled:true}}
  }
});
