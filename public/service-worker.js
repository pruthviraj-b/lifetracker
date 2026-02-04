// Loop-Proof Service Worker

const CACHE_NAME = 'habit-tracker-v2'; // Incremented to force fresh install
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
    console.log('🔧 Service Worker: Installing Version 2...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
            .catch((error) => console.error('✗ Service Worker: Cache failed', error))
    );
    // We explicitly NOT call skipWaiting here. We wait for the message from the UI.
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

    // 🛑 Removed self.clients.claim() - This is the primary driver of auto-reload loops
    // By not claiming, the SW only takes over on the next manual reload.
    console.log('✓ Service Worker: Active. (No claim to avoid loops)');
});

// Fetch Event
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    if (request.method !== 'GET') return;

    // Faster strategy for dev: Network first for everything, cache fallback
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
});

// Message Handler
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        console.log('⚡ Service Worker: Skip Waiting requested. Activating...');
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
                if (new URL(client.url).pathname === '/' && 'focus' in client) return client.focus();
            }
            if (clients.openWindow) return clients.openWindow('/');
        })
    );
});

console.log('✅ Service Worker: Loaded successfully (Loop-Proof Version 2.0)');
