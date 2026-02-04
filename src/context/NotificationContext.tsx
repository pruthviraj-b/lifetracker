import React, { createContext, useContext, useEffect, useState } from 'react';
import { NotificationService } from '../services/notification.service';
import { ReminderService } from '../services/reminder.service';
import { Reminder } from '../types/reminder';
import { useAuth } from './AuthContext';

interface NotificationContextType {
    hasPermission: boolean;
    requestPermission: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [hasPermission, setHasPermission] = useState(false);
    const [reminders, setReminders] = useState<Reminder[]>([]);

    useEffect(() => {
        const checkPermission = async () => {
            if ('Notification' in window) {
                setHasPermission(Notification.permission === 'granted');
            }
        };
        checkPermission();
    }, []);

    useEffect(() => {
        if (!user) return;

        const loadReminders = async () => {
            try {
                const data = await ReminderService.getReminders();
                setReminders(data);
            } catch (e) {
                console.error(e);
            }
        };

        loadReminders();
        // Refresh reminders every 5 minutes
        const refreshInterval = setInterval(loadReminders, 5 * 60 * 1000);
        return () => clearInterval(refreshInterval);
    }, [user]);

    useEffect(() => {
        if (!user || reminders.length === 0) return;

        const pollInterval = setInterval(() => {
            reminders.forEach(async (reminder) => {
                if (NotificationService.shouldTrigger(reminder)) {
                    NotificationService.sendNotification(
                        reminder.title,
                        reminder.customMessage || `Time for ritual: ${reminder.title}`
                    );

                    // Update last triggered locally to avoid double notifications
                    setReminders(prev => prev.map(r =>
                        r.id === reminder.id ? { ...r, lastTriggered: new Date().toISOString() } : r
                    ));

                    // Update DB
                    try {
                        await ReminderService.updateReminder(reminder.id, {
                            lastTriggered: new Date().toISOString()
                        });
                    } catch (e) {
                        console.error(e);
                    }
                }
            });
        }, 10000); // Check every 10 seconds for efficiency

        return () => clearInterval(pollInterval);
    }, [user, reminders]);

    const requestPermission = async () => {
        const granted = await NotificationService.requestPermission();
        setHasPermission(granted);
        return granted;
    };

    return (
        <NotificationContext.Provider value={{ hasPermission, requestPermission }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
    return context;
};
