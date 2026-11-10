// Build replaces the version with a hash of all app assets.
const VERSION = 'ziwei-development-v1';
const PREFIX = `ziwei:${self.registration.scope}:`;
const CACHE = PREFIX + VERSION;
const FILES = ['./', './index.html', './styles.css', './app.js', './core.js', './calendar.js', './explanation.js', './worker.js', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(
    FILES.map(path => new Request(new URL(path, self.registration.scope), { cache: 'reload' }))
  )));
});
self.addEventListener('message', event => { if (event.data === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (request.mode === 'navigate') {
      // Keep the shell and modules on one version until the user accepts an update.
      return (await cache.match('./index.html')) || fetch(request);
    }
    return (await cache.match(request)) || fetch(request);
  })());
});
