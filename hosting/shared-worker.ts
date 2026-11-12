// Keep development and production asset routing/runtime settings identical.
export const sharedWorker = {
  compatibilityDate: '2026-11-11',
  workersDev: false,
  previewUrls: false,
  // Redirected index.html responses cannot be returned to offline navigation.
  assets: {htmlHandling: 'none' as const},
  observability: {enabled: true, traces: {enabled: true}}
};
