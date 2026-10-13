/* Offline assets are scoped to this app's own GitHub Pages directory. */
const CACHE_NAME = 'study-three-pwa-v1';
const ASSETS = [
  './', './index.html', './app.js', './styles.css', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png',
  './icons/apple-touch-icon.png', './icons/favicon-32.png'
];
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((names) => Promise.all(names.filter((name) => name.startsWith('study-three-pwa-') && name !== CACHE_NAME).map((name) => caches.delete(name)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith(new URL('./', self.location.href).pathname)) return;
  event.respondWith(fetch(event.request).then((response) => {
    if (response.ok) {
      const copy = response.clone();
      event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)));
    }
    return response;
  }).catch(() => caches.match(event.request).then((cached) => cached || (event.request.mode === 'navigate' ? caches.match('./index.html') : Response.error()))));
});
