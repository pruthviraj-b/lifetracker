
import { IndexedDBManagerInstance } from './indexedDbManager';

// Notification Manager - Core notification logic

class NotificationManager {
    private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
    private notificationSchedules = new Map<string, NodeJS.Timeout>();

    // Initialize Service Worker
    async init(): Promise<ServiceWorkerRegistration | boolean> {
        if (this.serviceWorkerRegistration) return this.serviceWorkerRegistration;

        try {
            if ('serviceWorker' in navigator) {
                // Check if already registered to avoid redundant prompts
                const existing = await navigator.serviceWorker.getRegistration('/');
                if (existing) {
                    this.serviceWorkerRegistration = existing;
                    console.log('Using existing Service Worker registration');
                }

                const registration = await navigator.serviceWorker.register(
                    '/service-worker.js',
                    {
                        scope: '/',
                        updateViaCache: 'none'
                    }
                );
                this.serviceWorkerRegistration = registration;
                console.log('Service Worker registered successfully');

                // Listen for messages from service worker
                navigator.serviceWorker.addEventListener('message', (event) => {
                    this.handleNotificationMessage(event.data);
                });

                return registration;
            }
            return false;
        } catch (error) {
            console.error('Service Worker registration failed:', error);
            return false;
        }
    }

    // Request browser permission for notifications
    async requestPermission(): Promise<boolean> {
        try {
            if (!('Notification' in window)) {
                console.log('This browser does not support notifications');
                return false;
            }

            if (Notification.permission === 'granted') {
                return true;
            }

            if (Notification.permission !== 'denied') {
                const permission = await Notification.requestPermission();
                return permission === 'granted';
            }

            return false;
        } catch (error) {
            console.error('Permission request error:', error);
            return false;
        }
    }

    // Schedule notification at specific time
    async scheduleNotification(habitName: string, scheduledTime: Date | string, options: NotificationOptions = {}) {
        try {
            const now = new Date();
            const notificationTime = new Date(scheduledTime);
            const delay = notificationTime.getTime() - now.getTime();

            if (delay < 0) {
                console.error('Scheduled time is in the past');
                return false;
            }

            const notificationId = `${habitName}_${Date.now()}`;

            // Store in IndexedDB for persistence
            await IndexedDBManagerInstance.addNotification({
                id: notificationId,
                habitName,
                scheduledTime: notificationTime.toISOString(),
                options,
                createdAt: now.toISOString()
            });

            // Send to service worker with Premium Native options
            if (this.serviceWorkerRegistration && this.serviceWorkerRegistration.active) {
                const worker = this.serviceWorkerRegistration.active;
                if (worker) {
                    worker.postMessage({
                        type: 'SCHEDULE_NOTIFICATION',
                        title: habitName,
                        options: {
                            body: options.body || `Protocol initialization required: ${habitName}`,
                            icon: '/pwa-192x192.png',
                            badge: '/pwa-192x192.png',
                            tag: options.tag || habitName, // Group by habit name
                            requireInteraction: true,
                            vibrate: [200, 100, 200],
                            actions: [
                                { action: 'complete', title: '✅ Done' },
                                { action: 'snooze', title: '⏳ +10m' }
                            ],
                            ...options
                        },
                        delay: delay
                    });
                }
            }

            // Also set local timer (for when tab is open)
            this.setLocalNotificationTimer(habitName, delay, options);

            return true;
        } catch (error) {
            console.error('Error scheduling notification:', error);
            return false;
        }
    }

    // Local timer (works when tab is open)
    setLocalNotificationTimer(habitName: string, delay: number, options: NotificationOptions) {
        // Clear existing if any for same habit to prevent dupes (or use unique IDs)
        if (this.notificationSchedules.has(habitName)) {
            clearTimeout(this.notificationSchedules.get(habitName)!);
        }

        const timerId = setTimeout(() => {
            this.showNotification(habitName, options);
        }, delay);

        // Store timer ID for cancellation if needed
        this.notificationSchedules.set(habitName, timerId);
    }

    // Show notification immediately (with background fallback)
    async showNotification(title: string, options: NotificationOptions = {}) {
        try {
            // 1. Check Permission
            if (Notification.permission === 'default') {
                await this.requestPermission();
            }

            if (Notification.permission === 'granted') {
                // Feature detection for service worker notification
                if (this.serviceWorkerRegistration && this.serviceWorkerRegistration.active) {
                    // ✅ Prefer SW notification as it handles background better on some systems
                    this.serviceWorkerRegistration.showNotification(title, {
                        icon: '/pwa-192x192.png',
                        badge: '/pwa-192x192.png',
                        body: options.body || 'Protocol requirement: High Priority.',
                        tag: options.tag || title,
                        requireInteraction: true,
                        vibrate: [200, 100, 200],
                        actions: [
                            { action: 'complete', title: '✅ Complete' },
                            { action: 'snooze', title: '⏳ Snooze' }
                        ],
                        ...options
                    } as any);
                } else {
                    // ✅ Fallback to browser Notification API directly
                    new Notification(title, {
                        icon: options.icon || '/pwa-192x192.png',
                        body: options.body || 'Time for your ritual.',
                        tag: options.tag || title,
                        ...options
                    });
                }

                console.log('✅ Notification triggered:', title);
                return true;
            } else {
                console.warn('❌ Notification permission denied');
                return false;
            }
        } catch (error) {
            console.error('❌ Error showing notification:', error);
            return false;
        }
    }

    // Get all scheduled notifications from IndexedDB
    async getScheduledNotifications() {
        return IndexedDBManagerInstance.getAllNotifications();
    }

    // Cancel specific notification
    async cancelNotification(habitName: string) {
        const timerId = this.notificationSchedules.get(habitName);
        if (timerId) {
            clearTimeout(timerId);
            this.notificationSchedules.delete(habitName);
        }
        // Also remove from DB?
        // Implementation of removing from SW queue is complex (requires message to SW to clear timeout)
        // For now, we clear local and DB.
    }

    // Handle notification action (click, snooze, dismiss)
    handleNotificationMessage(data: any) {
        if (data.action === 'complete') {
            console.log('Habit marked as complete:', data.habitName);
        } else if (data.action === 'snooze') {
            console.log('Notification snoozed:', data.habitName);
        }
    }
}

export const NotificationManagerInstance = new NotificationManager();
