// 🛡️ RITU OS: Ultra-Stable Service Worker v3.0
// Features: Local Scheduling, Native Actions, Anti-Loop Protection

const CACHE_NAME = 'ritu-os-v3';
const RUNTIME_CACHE = 'ritu-runtime-v3';

const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    '/offline.html',
    '/favicon.ico',
    '/pwa-192x192.png',
    '/pwa-512x512.png'
];

// Install Event
self.addEventListener('install', (event) => {
    console.log('🔧 RITU SW: Installing v3 architecture...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
            .then(() => console.log('✓ RITU SW: Cache primed'))
    );
});

// Activate Event
self.addEventListener('activate', (event) => {
    console.log('🚀 RITU SW: Activating system protocols...');
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
    // No clients.claim() to prevent refresh loops
});

// Fetch Event
self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET') return;

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

// 🔔 Notification Scheduler & Action Handler
self.addEventListener('message', (event) => {
    if (!event.data) return;

    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data.type === 'SCHEDULE_NOTIFICATION') {
        const { title, options, delay } = event.data;

        // Native-like defaults
        const notificationOptions = {
            body: options.body || 'Protocol requirement detected.',
            icon: options.icon || '/pwa-192x192.png',
            badge: options.badge || '/pwa-192x192.png',
            tag: options.tag || 'ritu-protocol',
            renotify: true, // Corrected property name
            silent: false,
            vibrate: [200, 100, 200, 100, 200],
            requireInteraction: true,
            timestamp: Date.now() + delay,
            actions: [
                { action: 'complete', title: '✅ Complete' },
                { action: 'snooze', title: '⏳ Snooze' }
            ],
            data: {
                habitId: options.tag,
                scheduledTime: Date.now() + delay
            },
            ...options
        };

        console.log(`⏳ RITU SW: Scheduling [${title}] in ${Math.round(delay / 1000)}s`);

        // We use event.waitUntil to keep the worker alive as long as possible
        // Note: For long delays (>5 mins), this is still browser-dependent
        setTimeout(() => {
            self.registration.showNotification(title, notificationOptions);
        }, delay);
    }
});

// Native Action Processing
self.addEventListener('notificationclick', (event) => {
    const notification = event.notification;
    const action = event.action;

    notification.close();

    if (action === 'complete') {
        // Broadcast to app to mark as complete
        self.clients.matchAll().then(clients => {
            clients.forEach(client => client.postMessage({
                type: 'NOTIF_ACTION',
                action: 'complete',
                habitId: notification.data?.habitId
            }));
        });
    } else if (action === 'snooze') {
        // Reschedule for 10 mins later
        const snoozeDelay = 10 * 60 * 1000;
        setTimeout(() => {
            self.registration.showNotification(notification.title, {
                ...notification,
                timestamp: Date.now() + snoozeDelay
            });
        }, snoozeDelay);
    } else {
        // Default click: Open the app
        event.waitUntil(
            clients.matchAll({ type: 'window' }).then((clientList) => {
                for (const client of clientList) {
                    if (new URL(client.url).pathname === '/' && 'focus' in client) return client.focus();
                }
                if (clients.openWindow) return clients.openWindow('/');
            })
        );
    }
});

console.log('✅ RITU SW: Protocol 3.0 Ready (Native Action Support)');
