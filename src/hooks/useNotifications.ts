import { useEffect, useState } from 'react';
import { NotificationManagerInstance } from '../utils/notificationManager';

export const useNotifications = () => {
    const [permissionGranted, setPermissionGranted] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    // Initialize on mount
    useEffect(() => {
        const initializeNotifications = async () => {
            // Initialize service worker
            const workerReady = await NotificationManagerInstance.init();

            if (workerReady) {
                // Request permission
                const hasPermission = await NotificationManagerInstance.requestPermission();
                setPermissionGranted(hasPermission);

                // Restore previous schedules from IndexedDB
                const scheduled = await NotificationManagerInstance.getScheduledNotifications();
                scheduled.forEach(notification => {
                    const now = new Date().getTime();
                    const scheduledTime = new Date(notification.scheduledTime).getTime();
                    const delay = scheduledTime - now;

                    if (delay > 0) {
                        NotificationManagerInstance.setLocalNotificationTimer(
                            notification.habitName,
                            delay,
                            notification.options
                        );
                    }
                });
            }

            setIsInitialized(true);
        };

        initializeNotifications();
    }, []);

    const scheduleReminder = async (habitName: string, time: Date | string, options: NotificationOptions = {}) => {
        if (!permissionGranted) {
            const granted = await NotificationManagerInstance.requestPermission();
            if (!granted) {
                alert('Please enable notifications in browser settings');
                return false;
            }
        }

        return await NotificationManagerInstance.scheduleNotification(habitName, time, options);
    };

    const cancelReminder = (habitName: string) => {
        NotificationManagerInstance.cancelNotification(habitName);
    };

    const showImmediateNotification = async (title: string, options: NotificationOptions) => {
        return await NotificationManagerInstance.showNotification(title, options);
    };

    return {
        permissionGranted,
        isInitialized,
        scheduleReminder,
        cancelReminder,
        showImmediateNotification
    };
};
