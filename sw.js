// Service Worker para MIS COCHECITOS (PWA Offline)
const CACHE_STATIC = 'cochecitos-static-v2.9';
const CACHE_IMAGES = 'cochecitos-images-v1';

const STATIC_ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './data/cars.json',
  './data/cars.js',
  './data/special_collections.json',
  './data/special_collections.js',
  './manifest.json',
  './images/logo.png',
  './images/icon-192.png',
  './images/icon-512.png'
];

// Instalación: Precarga de archivos estructurales y base de datos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activación: Limpieza de versiones obsoletas de caché
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_STATIC && key !== CACHE_IMAGES) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Interceptación de peticiones de red
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Manejo de Fotografías (Cache-First + Guardado en memoria privada)
  const isImage = url.pathname.includes('/images/') || 
                  url.pathname.endsWith('.png') || 
                  url.pathname.endsWith('.jpg') || 
                  url.pathname.endsWith('.jpeg') || 
                  url.pathname.endsWith('.webp') ||
                  request.destination === 'image';

  if (isImage) {
    event.respondWith(
      caches.open(CACHE_IMAGES).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }

        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (err) {
          // Si está sin conexión y la imagen no se llegó a descargar
          return cachedResponse || new Response(
            '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
            { headers: { 'Content-Type': 'image/svg+xml' } }
          );
        }
      })
    );
    return;
  }

  // Manejo de Código, Estilos y Base de Datos (Stale-While-Revalidate)
  event.respondWith(
    caches.open(CACHE_STATIC).then(async (cache) => {
      const cachedResponse = await cache.match(request);

      const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      }).catch(() => {
        return cachedResponse;
      });

      return cachedResponse || fetchPromise;
    })
  );
});
