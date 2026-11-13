'use strict';
/* Qiao service worker: shows message notifications and opens the right chat when one is tapped. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', ev => ev.waitUntil(self.clients.claim()));

self.addEventListener('push', ev => {
  let d = {};
  try { d = ev.data ? ev.data.json() : {}; } catch { d = { body: ev.data ? ev.data.text() : '' }; }
  ev.waitUntil(self.registration.showNotification(d.title || 'Qiao 桥', {
    body: d.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: d.conv || 'qiao',      // one notification per chat; a newer message replaces the older one
    renotify: true,
    data: { conv: d.conv || null }
  }));
});

self.addEventListener('notificationclick', ev => {
  ev.notification.close();
  const conv = ev.notification.data && ev.notification.data.conv;
  ev.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const w of wins) {
      if (new URL(w.url).origin !== self.location.origin) continue;
      await w.focus();
      if (conv) w.postMessage({ open: conv });
      return;
    }
    await self.clients.openWindow('/' + (conv ? '?c=' + encodeURIComponent(conv) : ''));
  })());
});
