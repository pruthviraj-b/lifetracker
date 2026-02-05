import { Reminder } from '../types/reminder';

export const NotificationService = {
    isMobile: () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    isIOS: () => /iPhone|iPad|iPod/i.test(navigator.userAgent),
    isPWA: () => window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true,

    requestPermission: async (): Promise<boolean> => {
        if (!('Notification' in window)) {
            console.error('This browser does not support desktop notification');
            return false;
        }

        try {
            if (Notification.permission === 'granted') {
                return true;
            }

            if (Notification.permission !== 'denied') {
                const permission = await Notification.requestPermission();
                return permission === 'granted';
            }
        } catch (error) {
            console.warn("Notification permission blocked:", error);
            return false;
        }

        return false;
    },

    sendNotification: async (title: string, body?: string, data?: any) => {
        if (Notification.permission === 'granted') {
            // Try Service Worker first (Better for PWA/Mobile)
            if ('serviceWorker' in navigator) {
                try {
                    const registration = await navigator.serviceWorker.ready;
                    if (registration) {
                        return registration.showNotification(title, {
                            body,
                            icon: '/pwa-192x192.png',
                            badge: '/pwa-192x192.png',
                            requireInteraction: true,
                            vibrate: [200, 100, 200, 100, 200], // More pronounced for mobile
                            data: {
                                ...data,
                                url: data?.url || '/'
                            }
                        } as any);
                    }
                } catch (e) {
                    console.warn('SW notification failed, falling back to window:', e);
                }
            }

            // Standard fallback
            try {
                const n = new Notification(title, {
                    body,
                    icon: '/pwa-192x192.png',
                    requireInteraction: true,
                    data
                });
                n.onclick = () => {
                    window.focus();
                    n.close();
                    if (data?.url) {
                        window.location.href = data.url;
                    }
                };
            } catch (fallbackErr) {
                console.error('All notification methods failed:', fallbackErr);
            }
        } else {
            console.warn('Notification permission NOT granted.');
        }
    },

    diagnose: async () => {
        const diagnostics = {
            hasNotification: 'Notification' in window,
            hasServiceWorker: 'serviceWorker' in navigator,
            permission: Notification.permission,
            isSecure: window.location.protocol === 'https:' || window.location.hostname === 'localhost',
            isIOS: NotificationService.isIOS(),
            isPWA: NotificationService.isPWA(),
            isMobile: NotificationService.isMobile()
        };

        console.table(diagnostics);
        return diagnostics;
    },

    // Check if a reminder should fire NOW
    shouldTrigger: (reminder: Reminder): boolean => {
        if (!reminder.isEnabled) return false;

        const now = new Date();
        const currentHours = now.getHours().toString().padStart(2, '0');
        const currentMinutes = now.getMinutes().toString().padStart(2, '0');
        const currentTime = `${currentHours}:${currentMinutes}`;

        // Check time match
        if (currentTime !== reminder.time) return false;

        // Check Date match (One-time) using LOCAL date
        if (reminder.date) {
            const year = now.getFullYear();
            const month = (now.getMonth() + 1).toString().padStart(2, '0');
            const day = now.getDate().toString().padStart(2, '0');
            const localDateStr = `${year}-${month}-${day}`;
            if (reminder.date !== localDateStr) return false;
        }
        // Check Day match (Recurring)
        else if (reminder.days.length > 0) {
            const currentDay = now.getDay();
            if (!reminder.days.includes(currentDay)) return false;
        }

        // Debounce: Verify it hasn't triggered in the last 60 seconds
        if (reminder.lastTriggered) {
            const last = new Date(reminder.lastTriggered);
            if (now.getTime() - last.getTime() < 60000) {
                return false;
            }
        }

        return true;
    }
};

