// 🚀 RITU OS: Ultra-Stable Service Worker v3.5
// Optimized for: Multi-Device Sync, Background Stability, & Temporal Reliability

const CACHE_NAME = 'ritu-os-v3.6';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/offline.html',
    '/pwa-192x192.png',
    '/pwa-512x512.png'
];

// In-memory cache of scheduled timers
const activeTimers = new Map();

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            caches.keys().then(keys => Promise.all(
                keys.map(k => k !== CACHE_NAME && caches.delete(k))
            )),
            self.clients.claim()
        ])
    );
});

// Sync Strategy: Network First, Fallback to Cache
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    event.respondWith(
        fetch(event.request)
            .catch(() => caches.match(event.request))
    );
});

// 🔔 ADVANCED PROTOCOL SCHEDULING
self.addEventListener('message', (event) => {
    if (!event.data) return;

    if (event.data.type === 'SCHEDULE_NOTIFICATION') {
        const { title, options, delay } = event.data;
        const tag = options.tag || `ritu-${Date.now()}`;

        // Clear existing timer if any
        if (activeTimers.has(tag)) {
            clearTimeout(activeTimers.get(tag));
        }

        if (delay <= 0) {
            triggerNotification(title, options);
        } else {
            console.log(`[SW] Protocol Queued: ${title} in ${delay}ms`);
            const timer = setTimeout(() => {
                triggerNotification(title, options);
                activeTimers.delete(tag);
            }, delay);
            activeTimers.set(tag, timer);
        }
    }

    if (event.data.type === 'CANCEL_NOTIFICATION') {
        const { tag } = event.data;
        if (activeTimers.has(tag)) {
            clearTimeout(activeTimers.get(tag));
            activeTimers.delete(tag);
            console.log(`[SW] Protocol Aborted: ${tag}`);
        }
    }
});

async function triggerNotification(title, options) {
    const notificationOptions = {
        body: options.body || 'Protocol requirement active.',
        icon: '/pwa-512x512.png',
        badge: '/pwa-192x192.png',
        tag: options.tag,
        renotify: true,
        vibrate: [200, 100, 200],
        requireInteraction: true,
        data: {
            ...options.data,
            timestamp: Date.now()
        },
        actions: options.actions || [
            { action: 'complete', title: '✅ Done' },
            { action: 'snooze', title: '⏳ Snooze' },
            { action: 'open', title: '👁️ View' }
        ],
        ...options
    };

    return self.registration.showNotification(title, notificationOptions);
}

// 🔔 SERVER-SIDE PUSH HANDLING
self.addEventListener('push', (event) => {
    let data = { title: 'RITU OS Update', body: 'System protocol pulse received.', tag: 'ritu-push' };

    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data.body = event.data.text();
        }
    }

    event.waitUntil(
        triggerNotification(data.title, data)
    );
});

// Click Interaction Handling
self.addEventListener('notificationclick', (event) => {
    const notification = event.notification;
    const action = event.action;

    notification.close();

    // Broadcast action to all app instances for cross-device state update
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            const hasOpenTab = clientList.length > 0;

            // Send message to open tabs
            clientList.forEach(client => {
                client.postMessage({
                    type: 'NOTIF_ACTION',
                    action: action,
                    reminderId: notification.data?.reminderId,
                    habitId: notification.data?.habitId
                });
            });

            // If no tab is open or if user clicked 'open', launch the app
            if (action === 'open' || !hasOpenTab) {
                const targetUrl = new URL(notification.data?.url || '/', self.location.origin).href;
                for (const client of clientList) {
                    if (client.url === targetUrl && 'focus' in client) {
                        return client.focus();
                    }
                }
                if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
            }
        })
    );
});
