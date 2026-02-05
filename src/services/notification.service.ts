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

    // Check if a reminder should fire (Supports catch-up for missed minutes)
    shouldTrigger: (reminder: Reminder): boolean => {
        if (!reminder.isEnabled) return false;

        const now = new Date();
        const [targetHours, targetMinutes, targetSeconds] = reminder.time.split(':').map(Number);

        // Create a date object for the reminder time TODAY
        const targetTimeToday = new Date();
        targetTimeToday.setHours(targetHours, targetMinutes, targetSeconds || 0, 0);

        // Check if it's the right day
        if (reminder.date) {
            const [y, m, d] = reminder.date.split('-').map(Number);
            const reminderDate = new Date(y, m - 1, d);
            if (reminderDate.toDateString() !== now.toDateString()) return false;
        } else if (reminder.days.length > 0) {
            if (!reminder.days.includes(now.getDay())) return false;
        }

        // Logic: 
        // 1. Current time must be >= target time
        // 2. HAS NOT been triggered today (or ever for one-time)

        if (now < targetTimeToday) return false;

        if (reminder.lastTriggered) {
            const last = new Date(reminder.lastTriggered);

            // If triggered today at any time, don't trigger again
            if (last.toDateString() === now.toDateString()) {
                return false;
            }
        }

        return true;
    }
};

