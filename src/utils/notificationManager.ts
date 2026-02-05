
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
                console.log('✅ RITU SYSTEM: Service Worker registered. Ready for protocols.');

                // Listen for messages from service worker
                navigator.serviceWorker.addEventListener('message', (event) => {
                    console.log('📩 RITU SYSTEM: Received message from deep-space (SW):', event.data);
                    this.handleNotificationMessage(event.data);
                });

                return registration;
            }
            console.warn('⚠️ RITU SYSTEM: Browser does not support service workers.');
            return false;
        } catch (error) {
            console.error('❌ RITU SYSTEM: Service Worker registration failed:', error);
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
            const uniqueTag = options.tag || notificationId; // Use unique tag to allow stacking

            // Store in IndexedDB for persistence
            await IndexedDBManagerInstance.addNotification({
                id: notificationId,
                habitName,
                scheduledTime: notificationTime.toISOString(),
                options: { ...options, tag: uniqueTag },
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
                            icon: '/pwa-512x512.png',
                            badge: '/pwa-192x192.png',
                            tag: uniqueTag, // UNIQUE TAG = MULTIPLE MESSAGES
                            renotify: true,
                            requireInteraction: true,
                            vibrate: [200, 100, 200],
                            data: {
                                habitId: (options as any).habitId || habitName,
                                url: (options as any).url || '/dashboard'
                            },
                            actions: [
                                { action: 'complete', title: '✅ Done' },
                                { action: 'open', title: '👁️ Open' }
                            ],
                            ...options
                        } as any,
                        delay: delay
                    });
                }
            }

            // Also set local timer (for when tab is open)
            this.setLocalNotificationTimer(habitName, delay, { ...options, tag: uniqueTag } as any);

            return true;
        } catch (error) {
            console.error('Error scheduling notification:', error);
            return false;
        }
    }

    // Specialized Course Reminder
    async scheduleCourseReminder(courseTitle: string, courseId: string, delayMs: number) {
        const scheduledTime = new Date(Date.now() + delayMs);
        return this.scheduleNotification(`COURSE: ${courseTitle}`, scheduledTime, {
            body: `Resume your neural training: ${courseTitle}`,
            url: `/courses/${courseId}`,
            tag: `course_${courseId}`, // Overwrites same course, but stacks with other courses/habits
            icon: '/pwa-512x512.png'
        } as any);
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
        this.vibrate();
        try {
            // 1. Check Permission
            if (Notification.permission === 'default') {
                await this.requestPermission();
            }

            if (Notification.permission === 'granted') {
                let registration = this.serviceWorkerRegistration;

                // If instance registration is missing, try to get it from the browser
                if (!registration && 'serviceWorker' in navigator) {
                    registration = await navigator.serviceWorker.ready;
                }

                if (registration && registration.showNotification) {
                    // ✅ Prefer SW notification as it handles background better
                    await registration.showNotification(title, {
                        icon: '/pwa-192x192.png',
                        badge: '/pwa-192x192.png',
                        body: options.body || 'Protocol requirement active.',
                        tag: options.tag || title,
                        requireInteraction: true,
                        vibrate: [200, 100, 200],
                        actions: (options as any).actions || [
                            { action: 'complete', title: '✅ Done' },
                            { action: 'snooze', title: '⏳ Snooze' },
                            { action: 'open', title: '👁️ View' }
                        ],
                        ...options,
                        data: {
                            ...(options as any).data,
                            url: (options as any).data?.url || '/'
                        }
                    } as any);
                } else {
                    // ✅ Fallback to browser Notification API directly
                    const n = new Notification(title, {
                        icon: '/pwa-192x192.png',
                        body: options.body || 'Time for your ritual.',
                        tag: options.tag || title,
                        ...options
                    });
                    n.onclick = () => {
                        window.focus();
                        n.close();
                        const url = (options as any).data?.url || '/';
                        if (url !== '/') window.location.href = url;
                    };
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
    }

    // MASS ABORT: Cancel everything
    async cancelAllNotifications() {
        this.notificationSchedules.forEach((timerId) => clearTimeout(timerId));
        this.notificationSchedules.clear();
        console.log('☣️ MASS ABORT: All local notification schedules purged.');
    }

    // Physical haptic feedback (Mobile)
    private vibrate() {
        if ('vibrate' in navigator) {
            navigator.vibrate([100, 50, 100]);
        }
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
