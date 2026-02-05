// 🛡️ RITU OS: Ultra-Stable Service Worker v3.1
// Optimized for: Background Stability, Logic Sync, & Multiple Notifications

const CACHE_NAME = 'ritu-os-v3.1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/pwa-192x192.png',
    '/pwa-512x512.png',
    '/offline.html'
];

self.addEventListener('install', (event) => {
    self.skipWaiting(); // Force activation
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.map(k => k !== CACHE_NAME && caches.delete(k))
        ))
    );
    // Note: We avoid self.clients.claim() here to prevent the App.tsx refresh loop
    // BUT we ensure the worker is ready for messages.
});

// Fetch with Network-First Strategy
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    event.respondWith(
        fetch(event.request)
            .catch(() => caches.match(event.request))
    );
});

// 🔔 Advanced Notification Logic
const pendingNotifications = new Map();

self.addEventListener('message', (event) => {
    if (!event.data) return;

    if (event.data.type === 'SCHEDULE_NOTIFICATION') {
        const { title, options, delay } = event.data;
        const tag = options.tag || `ritu-${Date.now()}`;

        console.log(`[SW] Scheduling: ${title} in ${delay}ms (Tag: ${tag})`);

        // Clear existing timer for same tag if any
        if (pendingNotifications.has(tag)) {
            clearTimeout(pendingNotifications.get(tag).timer);
        }

        const show = () => {
            self.registration.showNotification(title, {
                body: options.body || 'Protocol requirement active.',
                icon: '/pwa-512x512.png',
                badge: '/pwa-192x192.png',
                tag: tag,
                renotify: true,
                vibrate: [200, 100, 200, 100, 200],
                requireInteraction: true,
                data: {
                    habitId: options.habitId,
                    url: options.url || '/'
                },
                actions: [
                    { action: 'complete', title: '✅ Done' },
                    { action: 'snooze', title: '⏳ Snooze' },
                    { action: 'open', title: '👁️ View' }
                ],
                ...options
            });
            pendingNotifications.delete(tag);
        };

        if (delay <= 0) {
            show();
        } else {
            // Keep SW alive as long as possible (browsers may still kill it after a few mins)
            const promise = new Promise((resolve) => {
                const timer = setTimeout(() => {
                    show();
                    resolve();
                }, delay);
                pendingNotifications.set(tag, { timer, resolve });
            });

            // If the message event supports waitUntil (it does in many browsers)
            if (event.waitUntil) {
                event.waitUntil(promise);
            }
        }
    }
});

// Click Interaction
self.addEventListener('notificationclick', (event) => {
    const notification = event.notification;
    const action = event.action;

    notification.close();

    if (action === 'complete' || action === 'snooze') {
        // Broadcast action to all open tabs
        event.waitUntil(
            self.clients.matchAll().then(clients => {
                clients.forEach(client => client.postMessage({
                    type: 'NOTIF_ACTION',
                    action: action,
                    habitId: notification.data?.habitId,
                    reminderId: notification.data?.reminderId
                }));
            })
        );
    } else {
        // Default: Open the specified URL or just the app
        const targetUrl = new URL(notification.data?.url || '/', self.location.origin).href;
        event.waitUntil(
            self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
                for (const client of clientList) {
                    if (client.url === targetUrl && 'focus' in client) {
                        return client.focus();
                    }
                }
                if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
            })
        );
    }
});
