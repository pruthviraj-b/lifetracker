// ✅ FIXED Service Worker - No Infinite Update Loop

const CACHE_NAME = 'habit-tracker-v1';
const RUNTIME_CACHE = 'habit-tracker-runtime-v1';

const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    '/offline.html',
    '/favicon.ico'
];

// Install Event
self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker: Installing...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('✓ Service Worker: Essential files cached');
                return cache.addAll(urlsToCache);
            })
            .catch((error) => {
                console.error('✗ Service Worker: Cache failed', error);
            })
    );

    // self.skipWaiting(); // Removed to allow manual user update via prompt
});

// Activate Event
self.addEventListener('activate', (event) => {
    console.log('🚀 Service Worker: Activating...');

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
                        console.log('🗑️ Service Worker: Deleting old cache -', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );

    self.clients.claim();
});

// Fetch Event - Smart Caching
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    if (request.method !== 'GET') {
        return;
    }

    // API & Navigation - Network First
    if (url.pathname.startsWith('/api/') || request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response.status === 200) {
                        const clonedResponse = response.clone();
                        caches.open(RUNTIME_CACHE).then((cache) => {
                            cache.put(request, clonedResponse);
                        });
                    }
                    return response;
                })
                .catch(() => caches.match(request) || (request.mode === 'navigate' ? caches.match('/index.html') : null))
        );
    }

    // Static Assets (Images, CSS, JS) - Cache First
    else {
        event.respondWith(
            caches.match(request).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(request).then((response) => {
                    if (response.status === 200) {
                        const clonedResponse = response.clone();
                        caches.open(RUNTIME_CACHE).then((cache) => {
                            cache.put(request, clonedResponse);
                        });
                    }
                    return response;
                });
            })
        );
    }
});

// Message Handler
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        console.log('⚡ Service Worker: Skipping waiting and activating...');
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'SCHEDULE_NOTIFICATION') {
        const { title, options, delay } = event.data;
        setTimeout(() => self.registration.showNotification(title, options), delay);
    }
});

// Push & Click Handlers
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : 'Temporal Notification',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        tag: 'habit-notification',
        requireInteraction: true
    };
    event.waitUntil(self.registration.showNotification('RITU OS', options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
            for (const client of clientList) {
                if (new URL(client.url).pathname === '/' && 'focus' in client) return client.focus();
            }
            if (clients.openWindow) return clients.openWindow('/');
        })
    );
});

console.log('✅ Service Worker: Loaded successfully (Fixed Loop-Proof Version)');
