import { useEffect, useState } from 'react';
import { NotificationManagerInstance } from '../utils/notificationManager';

export const useNotifications = () => {
    const [permissionGranted, setPermissionGranted] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    // Simplified on mount - Assume global init already happened in App.tsx
    useEffect(() => {
        const checkStatus = async () => {
            if ('Notification' in window) {
                setPermissionGranted(Notification.permission === 'granted');
            }

            // Sync local timers from DB once
            try {
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
            } catch (err) {
                console.warn('Sync failed:', err);
            }
            setIsInitialized(true);
        };

        checkStatus();
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
