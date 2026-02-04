// Advanced Service Worker with offline support and caching strategies

const CACHE_NAME = 'habit-tracker-v1';
const RUNTIME_CACHE = 'habit-tracker-runtime-v1';
const IMAGE_CACHE = 'habit-tracker-images-v1';

const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    '/offline.html',
    '/favicon.ico'
];

// Install Event - Cache essential files
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');

    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Service Worker: Caching essential files');
            // Use proper error handling for addAll which fails if any resource fails
            return cache.addAll(urlsToCache).catch(err => console.warn("Cache addAll failed", err));
        })
    );

    self.skipWaiting(); // Force activation
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME &&
                        cacheName !== RUNTIME_CACHE &&
                        cacheName !== IMAGE_CACHE) {
                        console.log('Service Worker: Deleting old cache', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );

    self.clients.claim(); // Take control immediately
});

// Fetch Event - Smart caching strategies
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Strategy 1: API requests - Network first, cache fallback
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Cache successful responses
                    if (response.status === 200) {
                        const clonedResponse = response.clone();
                        caches.open(RUNTIME_CACHE).then((cache) => {
                            cache.put(request, clonedResponse);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // Fall back to cache
                    return caches.match(request);
                })
        );
    }

    // Strategy 2: Images - Cache first, network fallback
    else if (url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp)$/)) {
        event.respondWith(
            caches.match(request).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(request).then((response) => {
                    // Cache successful image responses
                    if (response.status === 200) {
                        const clonedResponse = response.clone();
                        caches.open(IMAGE_CACHE).then((cache) => {
                            cache.put(request, clonedResponse);
                        });
                    }
                    return response;
                }).catch(() => {
                    return caches.match('/icons/icon-192x192.png'); // Fallback
                });
            })
        );
    }

    // Strategy 3: CSS/JS - Cache first, network fallback
    else if (url.pathname.match(/\.(css|js)$/)) {
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

    // Strategy 4: HTML - Network first, cache fallback
    else if (request.mode === 'navigate' || url.pathname.endsWith('.html')) {
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
                .catch(() => {
                    return caches.match(request).then((cachedResponse) => {
                        return cachedResponse || caches.match('/offline.html');
                    });
                })
        );
    }

    // Default strategy - Network first
    else {
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
                .catch(() => {
                    return caches.match(request);
                })
        );
    }
});

// Push Notifications
self.addEventListener('push', (event) => {
    console.log('Service Worker: Push notification received');

    const options = {
        body: event.data ? event.data.text() : 'New notification',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-192x192.png',
        vibrate: [200, 100, 200],
        tag: 'habit-notification',
        requireInteraction: true
    };

    event.waitUntil(
        self.registration.showNotification('Habit Tracker', options)
    );
});

// Notification Click
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if (client.url === '/' && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});

// Message Handler with SCHEDULE_NOTIFICATION support (Custom implementation merged with User Request)
self.addEventListener('message', (event) => {
    console.log('Service Worker: Message received', event.data);

    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'CLIENTS_CLAIM') {
        self.clients.claim();
    }

    if (event.data && event.data.type === 'CLEAR_CACHE') {
        caches.delete(event.data.cacheName);
    }

    // Custom Scheduling Handler
    if (event.data && event.data.type === 'SCHEDULE_NOTIFICATION') {
        const { title, options, delay } = event.data;
        setTimeout(() => {
            self.registration.showNotification(title, options);
        }, delay);
    }
});
