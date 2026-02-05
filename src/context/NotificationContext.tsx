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
    testNotifications: () => Promise<void>;
    runDiagnostics: () => Promise<any>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [hasPermission, setHasPermission] = useState(false);
    const [reminders, setReminders] = useState<Reminder[]>([]);

    // iOS PWA Check and Guidance
    useEffect(() => {
        if (NotificationService.isIOS() && !NotificationService.isPWA()) {
            setTimeout(() => {
                showToast(
                    "📱 iOS Setup Required",
                    "To receive notifications on iPhone: Tap 'Share' (↑) then 'Add to Home Screen'. Open the app from your home screen icon.",
                    { type: 'info', duration: 15000 }
                );
            }, 3000);
        }
    }, [showToast]);

    const syncRemindersToSW = useCallback(async (remindersList: Reminder[]) => {
        if (!('serviceWorker' in navigator)) return;

        console.log(`[Sync] Queueing ${remindersList.length} reminders to Service Worker...`);

        for (const reminder of remindersList) {
            if (!reminder.isEnabled) continue;

            const now = new Date();
            const [hours, minutes, seconds] = reminder.time.split(':').map(Number);
            let targetDate = new Date();
            targetDate.setHours(hours, minutes, seconds || 0, 0);

            if (reminder.date) {
                const [y, m, d] = reminder.date.split('-').map(Number);
                targetDate.setFullYear(y, m - 1, d);
                if (targetDate < now) continue;
            } else if (reminder.days.length > 0) {
                // Find next occurrence in next 7 days
                let found = false;
                for (let i = 0; i < 7; i++) {
                    const d = new Date();
                    d.setDate(now.getDate() + i);
                    d.setHours(hours, minutes, seconds || 0, 0);
                    if (d > now && reminder.days.includes(d.getDay())) {
                        targetDate = d;
                        found = true;
                        break;
                    }
                }
                if (!found) continue;
            } else {
                if (targetDate <= now) targetDate.setDate(targetDate.getDate() + 1);
            }

            // Only schedule if it's in the next 24 hours to avoid clogging SW
            const delay = targetDate.getTime() - now.getTime();
            if (delay > 0 && delay < 86400000) {
                NotificationManagerInstance.scheduleNotification(
                    reminder.title,
                    targetDate,
                    {
                        body: reminder.customMessage || "Protocol requirement active.",
                        tag: reminder.id,
                        data: {
                            reminderId: reminder.id,
                            habitId: reminder.habitId,
                            url: reminder.habitId ? '/protocols' : '/reminders'
                        }
                    } as any
                );
            }
        }
    }, []);

    const loadReminders = useCallback(async () => {
        if (!user) return;
        try {
            const data = await ReminderService.getReminders();
            setReminders(data);
            syncRemindersToSW(data);
        } catch (e) {
            console.error('Failed to load reminders in context:', e);
        }
    }, [user, syncRemindersToSW]);

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
                            tag: reminder.id, // Tag by reminder ID to avoid duplicates
                            renotify: true,  // Overwrite existing notification with new alert
                            data: {
                                url: reminder.habitId ? `/protocols` : '/reminders',
                                reminderId: reminder.id,
                                habitId: reminder.habitId // Critical for SW completion action
                            },
                        } as any
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

    const testNotifications = async () => {
        await NotificationManagerInstance.showNotification("🧪 Test Successful", {
            body: "If you saw this, your ritual notification matrix is calibrated.",
            tag: `test-${Date.now()}`, // Unique tag allows stacking
            vibrate: [200, 100, 200, 100, 200],
            requireInteraction: true,
            renotify: true
        } as any);
        showToast("Test Triggered", "Check your system notifications.", { type: 'success' });
    };

    const runDiagnostics = async () => {
        return await NotificationService.diagnose();
    };

    return (
        <NotificationContext.Provider value={{
            hasPermission,
            requestPermission,
            refreshReminders,
            snoozeReminder,
            testNotifications,
            runDiagnostics
        }}>
            {children}
        </NotificationContext.Provider>
    );
};


export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
    return context;
};
