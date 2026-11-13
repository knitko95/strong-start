/* Only public application files belong here. Never cache Auth/API responses. */
const VERSION = '2026-11-13-private-feedback-1';
const BASE = new URL('./', self.location.href);
const PREFIX = 'strong-start-shell-' + encodeURIComponent(BASE.href) + '-';
const CACHE = PREFIX + VERSION;
const SDK = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
const FILES = ['index.html', 'offline.js', 'privacy.html', 'terms.html', 'manifest.webmanifest', 'manifest.dev.webmanifest',
  'icons/favicon-64.png', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png',
  'exercise-guides/guides.js', 'exercise-guides/guides.css', 'exercise-guides/registry.v1.json'];
const URLS = FILES.map(p => new URL(p, BASE).href).concat(SDK);
async function prepare() {
  const cache = await caches.open(CACHE);
  // Install succeeds only when the app and its SDK are both available offline.
  await Promise.all(URLS.map(async url => {
    if (await cache.match(url)) return;
    const response = await fetch(new Request(url, {cache:'reload', credentials:'omit'}));
    if (!response.ok || response.type === 'opaque') throw new Error('Offline download failed');
    await cache.put(url, response);
  }));
}
async function ready() {
  const cache = await caches.open(CACHE);
  return (await Promise.all(URLS.map(url => cache.match(url)))).every(Boolean);
}
self.addEventListener('install', event => event.waitUntil(prepare()));
// Let an update wait until old pages close; never reload an active workout.
self.addEventListener('activate', event => event.waitUntil((async () => {
  await Promise.all((await caches.keys()).filter(k => k.startsWith(PREFIX) && k !== CACHE).map(k => caches.delete(k)));
  await self.clients.claim();
})()));
async function publicFile(request, key) {
  const cache = await caches.open(CACHE);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  try {
    const response = await fetch(request, {signal:controller.signal});
    if (!response.ok) throw new Error('Network unavailable');
    // Do not store OAuth or invite navigation responses under any cache key.
    const url = new URL(request.url);
    if (!url.search && !response.redirected) await cache.put(key, response.clone());
    return response;
  } catch (error) {
    const saved = await cache.match(key);
    if (saved) return saved;
    throw error;
  } finally { clearTimeout(timeout); }
}
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const navigation = request.mode === 'navigate' && url.origin === BASE.origin &&
    [BASE.pathname, BASE.pathname + 'index.html'].includes(url.pathname);
  if (navigation) {
    event.respondWith(publicFile(request, new URL('index.html', BASE).href));
  } else if (URLS.includes(url.href)) {
    event.respondWith(publicFile(request, url.href));
  }
});
self.addEventListener('message', event => {
  if (!['OFFLINE_STATUS','PREPARE_OFFLINE'].includes(event.data?.type)) return;
  event.waitUntil((async () => {
    try {
      if (event.data.type === 'PREPARE_OFFLINE') await prepare();
      event.ports[0]?.postMessage({ready:await ready()});
    } catch (e) { event.ports[0]?.postMessage({ready:false}); }
  })());
});
