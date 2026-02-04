
import { IndexedDBManagerInstance } from './indexedDbManager';

// Notification Manager - Core notification logic

class NotificationManager {
    private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
    private notificationSchedules = new Map<string, NodeJS.Timeout>();

    // Initialize Service Worker
    async init(): Promise<ServiceWorkerRegistration | boolean> {
        try {
            if ('serviceWorker' in navigator) {
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

            // Send to service worker
            if (this.serviceWorkerRegistration && this.serviceWorkerRegistration.active) {
                const worker = this.serviceWorkerRegistration.active;
                if (worker) {
                    worker.postMessage({
                        type: 'SCHEDULE_NOTIFICATION',
                        title: habitName,
                        options: {
                            body: options.body || `Time to do: ${habitName}`,
                            icon: options.icon || '/habit-icon.png',
                            badge: options.badge || '/badge.png',
                            tag: notificationId,
                            requireInteraction: true,
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

    // Show notification immediately
    async showNotification(title: string, options: NotificationOptions = {}) {
        try {
            // Request permission if not granted
            if (Notification.permission === 'default') {
                await this.requestPermission();
            }

            if (Notification.permission === 'granted') {
                // Use browser Notification API directly (SW is disabled)
                const notification = new Notification(title, {
                    icon: options.icon || '/icons/icon-192x192.png',
                    badge: options.badge || '/icons/icon-192x192.png',
                    body: options.body || 'Time for your habit!',
                    tag: options.tag || title,
                    requireInteraction: true,
                    ...options
                });

                // Auto-close after 10 seconds
                setTimeout(() => notification.close(), 10000);

                console.log('Notification shown:', title);
            } else {
                console.warn('Notification permission not granted');
            }
        } catch (error) {
            console.error('Error showing notification:', error);
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
