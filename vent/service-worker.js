// Vent or Seal? — service worker
// Caches the app shell so the tool opens offline. Lives in /vent/, so all
// shell paths are relative and the SW scope is /vent/ (its own folder).
// Live weather (Open-Meteo) is always network-only — we never try to fake it
// offline; the app handles fetch failures gracefully on its own.

// Keep this in step with APP_VERSION in index.html so each release gets a
// fresh cache and the activate handler clears the previous one.
const VERSION = 'v1.7.2';
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

  // Cross-origin (the weather/geocoding APIs, OCR CDN) — let the network
  // handle it. No respondWith means default browser behavior; the app
  // catches failures.
  if (url.origin !== self.location.origin) return;

  // Navigations — network-first so content updates show immediately when
  // online, falling back to the cached shell when offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((resp) => {
          if (resp && resp.ok && resp.type === 'basic') {
            const copy = resp.clone();
            caches.open(CACHE).then((cache) => cache.put('./index.html', copy));
          }
          return resp;
        })
        .catch(() => caches.match('./index.html').then((c) => c || caches.match('./')))
    );
    return;
  }

  // Other same-origin assets — cache-first with network fallback, caching
  // successful responses so new assets get picked up.
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((resp) => {
          if (resp && resp.ok && resp.type === 'basic') {
            const copy = resp.clone();
            caches.open(CACHE).then((cache) => cache.put(req, copy));
          }
          return resp;
        })
        .catch(() => Response.error());
    })
  );
});
