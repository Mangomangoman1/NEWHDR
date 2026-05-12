// Hailey Device Repair — service worker retirement shim
// Updated: 2026-05-12
//
// The site is a static marketing/service site. A stale service worker was
// adding cache uncertainty to page transitions and JS/CSS updates, so this
// shim unregisters itself and clears old HDR caches for returning visitors.

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('hdr-')).map(key => caches.delete(key)));
    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clients) client.navigate(client.url);
  })());
});

self.addEventListener('fetch', () => {
  // No-op: let the browser/network handle every request.
});
