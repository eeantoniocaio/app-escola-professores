// Service Worker bypass (Network First / Passthrough) for Portal de Evidências E.E. Antônio Caio
// This satisfies the PWA installability requirements while letting Vite and Vercel manage versioning and updates.

const CACHE_NAME = 'portal-evidencias-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass-through to network, satisfying installability checks
  event.respondWith(fetch(event.request));
});
