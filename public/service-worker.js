const CACHE_NAME = 'static-cache-v2';
const DATA_CACHE_NAME = 'data-cache-v1';
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/style.css',
  '/index.js',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/',
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(DATA_CACHE_NAME).then((cache) => cache.add('/api/transaction'))
  );

  e.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(FILES_TO_CACHE))
      .catch((err) => console.log(err))
  );

  self.skipWaiting();
});

// activate
self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
            console.log('Removing old cache data', key);
            return caches.delete(key);
          }
        })
      );
    })
  );

  self.clients.claim();
});

// fetch
self.addEventListener('fetch', function (e) {
  if (e.request.url.includes('/api/')) {
    e.respondWith(
      caches
        .open(DATA_CACHE_NAME)
        .then((cache) => {
          return fetch(e.request)
            .then((response) => {
              // If the response was good, clone it and store it in the cache.
              if (response.status === 200) {
                cache.put(e.request.url, response.clone());
              }

              return response;
            })
            .catch((err) => {
              // Network request failed, try to get it from the cache.
              return cache.match(e.request);
            });
        })
        .catch((err) => console.log(err))
    );

    return;
  }

  e.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(e.request).then((response) => {
        return response || fetch(e.request);
      });
    })
  );
});
