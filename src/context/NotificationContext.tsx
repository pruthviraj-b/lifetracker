import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { NotificationService } from '../services/notification.service';
import { ReminderService } from '../services/reminder.service';
import { Reminder } from '../types/reminder';
import { NotificationManagerInstance } from '../utils/notificationManager';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

interface NotificationContextType {
    hasPermission: boolean;
    requestPermission: () => Promise<boolean>;
    refreshReminders: () => Promise<void>;
    snoozeReminder: (id: string, minutes: number) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [hasPermission, setHasPermission] = useState(false);
    const [reminders, setReminders] = useState<Reminder[]>([]);

    const loadReminders = useCallback(async () => {
        if (!user) return;
        try {
            const data = await ReminderService.getReminders();
            setReminders(data);
        } catch (e) {
            console.error('Failed to load reminders in context:', e);
        }
    }, [user]);

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
        loadReminders();
        // Refresh reminders every 2 minutes for high reliability
        const refreshInterval = setInterval(loadReminders, 2 * 60 * 1000);
        return () => clearInterval(refreshInterval);
    }, [user, loadReminders]);

    useEffect(() => {
        if (!user || reminders.length === 0) return;

        const pollInterval = setInterval(() => {
            const now = new Date();
            const nowIso = now.toISOString();

            reminders.forEach(async (reminder) => {
                if (NotificationService.shouldTrigger(reminder)) {
                    // Triggering reminder: reminder.title

                    // 1. Browser Notification (Native Push)
                    NotificationManagerInstance.showNotification(
                        reminder.title,
                        {
                            body: reminder.customMessage || `Protocol requirement: ${reminder.title}`,
                            tag: reminder.id, // Tag by reminder ID to avoid duplicates if they fire fast
                            data: {
                                url: reminder.habitId ? `/protocols` : '/reminders',
                                reminderId: reminder.id,
                                habitId: reminder.habitId // Critical for SW completion action
                            },
                        }
                    );

                    // 2. In-App Toast
                    showToast(
                        reminder.title,
                        reminder.customMessage || "It's time for your protocol.",
                        {
                            type: 'info',
                            duration: 10000,
                            onSnooze: (mins: number) => snoozeReminder(reminder.id, mins)
                        }
                    );

                    // 3. Update State Locally to prevent double-firing in the same minute
                    setReminders(prev => prev.map(r =>
                        r.id === reminder.id ? { ...r, lastTriggered: nowIso } : r
                    ));

                    // 4. Persistence (Supabase)
                    try {
                        await ReminderService.updateReminder(reminder.id, {
                            lastTriggered: nowIso
                        });
                    } catch (e) {
                        console.error('Failed to update trigger in DB:', e);
                    }
                }
            });
        }, 5000); // Check every 5 seconds for better resolution

        return () => clearInterval(pollInterval);
    }, [user, reminders, showToast]);

    const requestPermission = async () => {
        const granted = await NotificationService.requestPermission();
        setHasPermission(granted);
        return granted;
    };

    const refreshReminders = async () => {
        await loadReminders();
    };

    const snoozeReminder = useCallback(async (id: string, minutes: number) => {
        const reminder = reminders.find(r => r.id === id);
        if (!reminder) return;

        const now = new Date();
        now.setMinutes(now.getMinutes() + minutes);
        const newTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        try {
            await ReminderService.createReminder({
                title: `💤 ${reminder.title}`,
                time: newTime,
                days: [], // One-time
                date: now.toISOString().split('T')[0], // Today
                notificationType: reminder.notificationType,
                isEnabled: true,
                habitId: reminder.habitId
            });
            await loadReminders();
        } catch (e) {
            console.error('Failed to snooze reminder:', e);
        }
    }, [reminders, loadReminders]);

    // External listener for SW actions
    useEffect(() => {
        const handleExternalSnooze = (e: any) => {
            const { reminderId, minutes } = e.detail;
            if (reminderId) snoozeReminder(reminderId, minutes || 15);
        };
        window.addEventListener('reminder-snooze-external', handleExternalSnooze);
        return () => window.removeEventListener('reminder-snooze-external', handleExternalSnooze);
    }, [snoozeReminder]);

    return (
        <NotificationContext.Provider value={{ hasPermission, requestPermission, refreshReminders, snoozeReminder }}>
            {children}
        </NotificationContext.Provider>
    );
};


export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
    return context;
};
