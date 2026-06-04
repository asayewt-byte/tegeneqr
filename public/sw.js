const CACHE = 'tegeqr-images-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = request.url.toLowerCase();
  if (
    !url.match(/\.(jpg|jpeg|png|gif|webp|avif|svg)(\?|$)/) &&
    !url.includes('images.unsplash.com')
  ) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then((cache) => cache.put(request, clone));
        }
        return res;
      }).catch(() => new Response('', { status: 503 }));
    })
  );
});
