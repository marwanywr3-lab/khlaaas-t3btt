'use strict';
// Change this version when shipping a new app shell. Waiting updates activate
// after existing app windows close, avoiding a forced reload during an inquiry.
const CACHE = 'clue-me-in-shell-v10-case-rooms';
const ROOT = new URL('./', self.location.href);
const INDEX = new URL('index.html', ROOT).href;
const FILES = ['index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'reference-data.js', 'system-prompts.js', 'case-variety.js', 'case-rooms.js', 'case-rooms.css', 'assets/rooms/interrogation-desktop.jpg', 'assets/rooms/interrogation-mobile.jpg', 'assets/rooms/advisor-desktop.jpg', 'assets/rooms/advisor-mobile.jpg', 'assets/rooms/investigator-desktop.jpg', 'assets/rooms/investigator-mobile.jpg', 'assets/rooms/dossier-closed.png', 'assets/rooms/dossier-open.png'].map(file => new URL(file, ROOT).href);
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith('clue-me-in-shell-') && key !== CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  // API calls, private headers, and external resources are never cached.
  if (request.method !== 'GET' || url.origin !== ROOT.origin || request.headers.has('Authorization') || request.headers.has('x-goog-api-key')) return;
  const navigation = request.mode === 'navigate' && (url.pathname === ROOT.pathname || url.pathname === new URL(INDEX).pathname);
  if (!navigation && !FILES.includes(url.href)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const response = await fetch(request);
      if (response.ok) await cache.put(navigation ? INDEX : request, response.clone());
      if (!response.ok && navigation) {
        const offline = await cache.match(INDEX);
        if (offline) return offline;
      }
      return response;
    } catch (error) {
      const cached = await cache.match(navigation ? INDEX : request);
      if (cached) return cached;
      throw error;
    }
  })());
});
