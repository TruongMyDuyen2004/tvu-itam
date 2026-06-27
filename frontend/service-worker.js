/* ============================================================
   TVU-ITAM - Service Worker (PWA)
   ============================================================ */

const CACHE_NAME = 'tvu-itam-v17';

const PRECACHE_URLS = [
  '/?v=2',
  '/app.html',
  '/assets/css/main.css?v=15',
  '/assets/css/app.css?v=5',
  '/assets/css/login.css?v=2',
  '/assets/css/public-device.css',
  '/assets/images/logotvu.jpg',
  '/assets/images/pwa-icon-192.png',
  '/assets/images/pwa-icon-512.png',
  '/assets/images/pwa-icon.svg',
  '/assets/js/api.js?v=2',
  '/assets/js/pages/dashboard.js?v=17',
  '/assets/js/pages/devices.js?v=4',
  '/assets/js/pages/maintenance.js?v=5',
  '/assets/js/pages/incidents.js?v=4',
  '/assets/js/pages/notifications.js?v=5',
  '/assets/js/app.js?v=4',
  '/assets/js/login.js',
  '/assets/js/pages/settings.js?v=7',
  '/assets/js/public-device.js',
  '/assets/js/reset-password.js',
  '/manifest.json'
];

const PAGE_CACHE = 'tvu-itam-pages-v7';
const API_CACHE = 'tvu-itam-api-v7';
const STATIC_CACHE = 'tvu-itam-static-v7';

const API_BASE = '/api';

// Install: cache critical static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRECACHE_URLS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME && name !== PAGE_CACHE && name !== API_CACHE && name !== STATIC_CACHE)
          .map(name => caches.delete(name))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Helper: is API request
const isApiRequest = (url) => url.pathname.startsWith(API_BASE) && !url.pathname.startsWith('/api/public');

// Helper: is page navigation
const isNavigation = (request) => request.mode === 'navigate';

// Helper: is static asset
const isStaticAsset = (url) => {
  const ext = url.pathname.split('.').pop().toLowerCase();
  return ['css', 'js', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'woff', 'woff2', 'ttf', 'eot'].includes(ext);
};

// Helper: is public page (QR lookup)
const isPublicPage = (url) => {
  return /^\/(q|qr|device)\//.test(url.pathname);
};

// Helper: network-first strategy
async function networkFirst(request, cacheName, timeoutMs = 5000) {
  const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs));

  try {
    const response = await Promise.race([
      fetch(request),
      timeout
    ]);

    if (response && response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw err;
  }
}

// Helper: cache-first strategy
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    // If offline and not cached, return offline page
    if (request.mode === 'navigate') {
      return caches.match('/');
    }
    throw err;
  }
}

// Helper: stale-while-revalidate strategy
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then(response => {
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => cached);

  return cached || fetchPromise;
}

// Fetch: handle all requests
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // 1. API requests (authenticated) - network only, no cache (sensitive data)
  if (isApiRequest(url)) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(JSON.stringify({
          success: false,
          message: 'Không có kết nối mạng. Vui lòng kiểm tra lại.',
          offline: true
        }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // 2. Public API (QR lookup) - network first with cache fallback
  if (url.pathname.startsWith('/api/public')) {
    event.respondWith(networkFirst(event.request, API_CACHE));
    return;
  }

  // 3. Page navigations - network only, no cache (always show latest)
  if (isNavigation(event.request) || event.request.headers.get('Accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/'))
    );
    return;
  }

  // 4. Static assets (CSS, JS, images) - network only (always get latest)
  if (isStaticAsset(url)) {
    event.respondWith(networkFirst(event.request, STATIC_CACHE, 3000));
    return;
  }

  // 5. Everything else (manifest, etc.) - stale while revalidate
  event.respondWith(staleWhileRevalidate(event.request, CACHE_NAME));
});

// Message: handle skipWaiting from page
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Push notification listener (for future use)
self.addEventListener('push', event => {
  if (!event.data) return;

  try {
    const data = event.data.json();

    const options = {
      body: data.body || 'Thông báo từ hệ thống TVU-ITAM',
      icon: '/assets/images/pwa-icon-192.png',
      badge: '/assets/images/pwa-icon-192.png',
      vibrate: [200, 100, 200],
      data: {
        url: data.url || '/app.html',
        type: data.type || 'notification'
      },
      actions: [
        { action: 'view', title: 'Xem chi tiết' },
        { action: 'close', title: 'Đóng' }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(
        data.title || 'TVU-ITAM',
        options
      )
    );
  } catch (err) {
    console.error('Push notification error:', err);
  }
});

// Notification click: navigate to relevant page
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'close') return;

  const urlToOpen = event.notification.data?.url || '/app.html';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // Focus existing window if available
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      // Otherwise open new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
