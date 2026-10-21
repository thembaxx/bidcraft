const CACHE_PREFIX = 'bidcraft-';
const CACHE_NAME = `${CACHE_PREFIX}v2`;
const ASSETS = ['/', '/icon.svg', '/manifest.webmanifest', '/brand/icon-192.png', '/brand/icon-512.png', '/brand/bidcraft-icon.webp'];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.allSettled(ASSETS.map((asset) => cache.add(asset)));
    // Include initial JS, styles and fonts so a first subsequent visit can work offline.
    const page = await cache.match('/');
    if (page) {
      const html = await page.text();
      const urls = [...html.matchAll(/(?:src|href)="(\/_next\/static\/[^"<>]+)"/g)].map((match) => match[1]);
      await Promise.allSettled([...new Set(urls)].map((url) => cache.add(url)));
    }
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => (key.startsWith(CACHE_PREFIX) || key.startsWith('quora-bid-architect-')) && key !== CACHE_NAME).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/') || request.headers.get('RSC') || url.searchParams.has('_rsc')) return;
  const cacheable = request.mode === 'navigate' || url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/brand/') || ASSETS.includes(url.pathname);
  if (!cacheable) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      const response = await fetch(request);
      if (response.ok && response.type === 'basic') {
        event.waitUntil(cache.put(request, response.clone()).catch(() => {}));
      }
      return response;
    } catch {
      const cached = await cache.match(request);
      if (cached) return cached;
      // HTML fallback is only meaningful for a document, never a missing JS/image request.
      if (request.mode === 'navigate') return (await cache.match('/')) || Response.error();
      return Response.error();
    }
  })());
});
