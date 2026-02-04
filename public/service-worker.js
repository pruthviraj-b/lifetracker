// Advanced Service Worker with offline support and caching strategies

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
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(urlsToCache).catch(err => console.warn("Cache addAll failed", err));
        })
    );
});

// Activate Event
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Fetch Event
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    if (request.method !== 'GET') return;

    // API & Navigation - Network First
    if (url.pathname.startsWith('/api/') || request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    if (response.status === 200) {
                        const clonedResponse = response.clone();
                        caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clonedResponse));
                    }
                    return response;
                })
                .catch(() => caches.match(request) || (request.mode === 'navigate' ? caches.match('/index.html') : null))
        );
    }
    // Static Assets - Cache First
    else {
        event.respondWith(
            caches.match(request).then((cachedResponse) => {
                return cachedResponse || fetch(request).then((response) => {
                    if (response.status === 200) {
                        const clonedResponse = response.clone();
                        caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clonedResponse));
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
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'SCHEDULE_NOTIFICATION') {
        const { title, options, delay } = event.data;
        setTimeout(() => self.registration.showNotification(title, options), delay);
    }
});

// Push & Click
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
                if (url.pathname === '/' && 'focus' in client) return client.focus();
            }
            if (clients.openWindow) return clients.openWindow('/');
        })
    );
});

console.log('✅ Service Worker: Loaded successfully (Loop-Proof Version)');
