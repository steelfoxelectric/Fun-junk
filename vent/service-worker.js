// Vent or Seal? — service worker
// Caches the app shell so the tool opens offline. Lives in /vent/, so all
// shell paths are relative and the SW scope is /vent/ (its own folder).
// Live weather (Open-Meteo) is always network-only — we never try to fake it
// offline; the app handles fetch failures gracefully on its own.

const VERSION = 'v1';
const CACHE = `ventseal-shell-${VERSION}`;

// App shell — relative to the SW location (/vent/).
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k.startsWith('ventseal-shell-') && k !== CACHE)
            .map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Cross-origin (the weather/geocoding APIs) — let the network handle it.
  // No respondWith means default browser behavior; the app catches failures.
  if (url.origin !== self.location.origin) return;

  // Same-origin: cache-first for the shell, fall back to network, then to the
  // cached index.html for navigations when fully offline.
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((resp) => {
          // Cache successful same-origin GETs so new assets get picked up.
          if (resp && resp.ok && resp.type === 'basic') {
            const copy = resp.clone();
            caches.open(CACHE).then((cache) => cache.put(req, copy));
          }
          return resp;
        })
        .catch(() => {
          if (req.mode === 'navigate') return caches.match('./index.html');
          return Response.error();
        });
    })
  );
});
