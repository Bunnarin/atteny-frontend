const CACHE_NAME = 'atteny-cache-v1';
const urlsToCache = ['/'];

// Install event: Caching static assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Fetch event: Network-first, then cache fallback
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If the response is good, clone it and store it in the cache
        if (response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
        }
        return response;
      })
      .catch(() => caches.match(event.request).then((response) => response))
  );
});

// Activate event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete all caches that don't match the current CACHE_NAME
          if (cacheName !== CACHE_NAME) 
            return caches.delete(cacheName);
        })
      ).then(() => self.clients.claim());
    })
  );
});

// Listen for messages from the page
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') 
    self.skipWaiting();
});