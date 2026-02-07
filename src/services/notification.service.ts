import { Reminder } from '../types/reminder';
import { supabase } from '../lib/supabase';

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

    // 🚀 NEW: Web Push Subscription Logic
    subscribeToPush: async (): Promise<PushSubscription | null> => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.warn('Push protocol NOT supported by this hardware.');
            return null;
        }

        try {
            const registration = await navigator.serviceWorker.ready;

            // Generate/Replace your VAPID Public Key here
            // This is a generic public key for demo/initial setup
            const VAPID_PUBLIC_KEY = 'BCOp7Y8u_3_T_v0T7UeI9v_4-0bN_Q-Q7f8v-v0T7UeI9v_4-0bN_Q-Q7f8v';

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: NotificationService.urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });

            console.log('✅ Push Handshake Successful:', subscription);
            return subscription;
        } catch (error) {
            console.error('❌ Push Handshake Failed:', error);
            return null;
        }
    },

    savePushSubscription: async (subscription: PushSubscription) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
            if (!user) return;

            // Upsert subscription to avoid duplicates for the same device/user
            // We use 'endpoint' as a unique identifier for the device's push channel
            const { error } = await supabase
                .from('push_subscriptions')
                .upsert({
                    user_id: user.id,
                    endpoint: subscription.endpoint,
                    p256dh: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('p256dh')!) as any)),
                    auth: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('auth')!) as any)),
                    updated_at: new Date().toISOString()
                }, { onConflict: 'endpoint' });

            if (error) throw error;
            console.log('💾 Push Matrix Saved to Cloud.');
        } catch (error) {
            console.error('Failed to persist push matrix:', error);
        }
    },

    urlBase64ToUint8Array: (base64String: string) => {
        const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
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

        // 🚀 MULTI-DEVICE FIX: 
        // We only check if the current time is beyond the target time.
        // The actual deduplication (preventing loops) is handled by 'localTriggerHistory' 
        // in NotificationContext for the current session.
        if (now < targetTimeToday) return false;

        // If it was already triggered specifically within the LAST MINUTE (globally), 
        // we might still want to skip it to avoid overwhelming.
        // But to ensure all devices ring, we let the local device's history decide.

        return true;
    }
};

