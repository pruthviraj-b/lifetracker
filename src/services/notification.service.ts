import { Reminder } from '../types/reminder';

export const NotificationService = {
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
            // Likely blocked by "Insecure Context" (http://IP)
            console.warn("Notification permission blocked (likely insecure context):", error);
            // We return false, but we can handle this in UI
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
                            vibrate: [200, 100, 200],
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

    // Check if a reminder should fire NOW
    shouldTrigger: (reminder: Reminder): boolean => {
        if (!reminder.isEnabled) return false;

        const now = new Date();
        const currentDay = now.getDay();
        const currentHours = now.getHours().toString().padStart(2, '0');
        const currentMinutes = now.getMinutes().toString().padStart(2, '0');
        const currentTime = `${currentHours}:${currentMinutes}`;

        // Check time match
        if (currentTime !== reminder.time) return false;

        // Check Date match (One-time)
        if (reminder.date) {
            const todayStr = now.toISOString().split('T')[0];
            if (reminder.date !== todayStr) return false;
        }
        // Check Day match (Recurring)
        else if (reminder.days.length > 0 && !reminder.days.includes(currentDay)) {
            return false;
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
