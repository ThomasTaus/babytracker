const CACHE = 'hello-world-v2';
const FILES = ['index.html', 'manifest.json', 'icon.svg'];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Bypass the browser's HTTP cache for our own same-origin files, since GitHub
  // Pages serves them with Cache-Control: max-age=600 — without this, a plain
  // fetch() can silently return a stale response for up to 10 minutes even
  // though this handler is meant to always go to the network first.
  const sameOrigin = new URL(event.request.url).origin === location.origin;
  const request = sameOrigin ? new Request(event.request, { cache: 'no-store' }) : event.request;

  event.respondWith(
    fetch(request)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
