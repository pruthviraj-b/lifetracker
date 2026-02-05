import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { NotificationService } from '../services/notification.service';
import { ReminderService } from '../services/reminder.service';
import { Reminder } from '../types/reminder';
import { NotificationManagerInstance } from '../utils/notificationManager';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { supabase } from '../lib/supabase';

interface NotificationContextType {
    hasPermission: boolean;
    requestPermission: () => Promise<boolean>;
    refreshReminders: () => Promise<void>;
    snoozeReminder: (id: string, minutes: number) => Promise<void>;
    testNotifications: () => Promise<void>;
    runDiagnostics: () => Promise<any>;
    syncStatus: 'idle' | 'syncing' | 'error';
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

            // Only schedule if it's in the next 7 days to ensure cross-device persistence
            const delay = targetDate.getTime() - now.getTime();
            if (delay > 0 && delay < 7 * 24 * 60 * 60 * 1000) {
                // Clear existing sync for this ID first to avoid duplicates
                NotificationManagerInstance.cancelNotification(reminder.id);

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

    const [localTriggerHistory, setLocalTriggerHistory] = useState<Record<string, string>>({});

    const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');

    useEffect(() => {
        if (!user) return;
        loadReminders();

        console.log("🛰️ [Cluster] Initializing Pulse Matrix for User:", user.id);

        // 🚀 BROAD PULSE: Listen for ANY changes to the reminders cluster
        const channel = supabase
            .channel('global-pulse')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'reminders'
                    // Filter removed to ensure broad detection across nodes
                },
                (payload) => {
                    // Only process if it belongs to this user (extra safety)
                    const data = payload.new as any || payload.old as any;
                    if (data && data.user_id === user.id) {
                        console.log('⚡ [Pulse] Remote trigger detected. Synchronizing...');
                        setSyncStatus('syncing');
                        loadReminders().then(() => setSyncStatus('idle'));
                    }
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('✅ [Pulse] Connected to Cloud Relay.');
                }
            });

        const refreshInterval = setInterval(loadReminders, 2 * 60 * 1000); // 2 min refresh
        return () => {
            supabase.removeChannel(channel);
            clearInterval(refreshInterval);
        };
    }, [user, loadReminders]);

    useEffect(() => {
        if (!user || reminders.length === 0) return;

        const pollInterval = setInterval(() => {
            const now = new Date();
            const nowIsoMin = now.toISOString().slice(0, 16); // e.g. "2024-01-01T12:00"

            reminders.forEach(async (reminder) => {
                // 🚀 CROSS-DEVICE TRIGGER FIX:
                // We check 'localTriggerHistory' so this device rings even if DB update is fast.
                const hasTriggeredLocally = localTriggerHistory[reminder.id] === nowIsoMin;

                if (!hasTriggeredLocally && NotificationService.shouldTrigger(reminder)) {
                    // Record local trigger immediately to prevent double-firing on THIS device
                    setLocalTriggerHistory(prev => ({ ...prev, [reminder.id]: nowIsoMin }));

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

                    // 3. Update State Locally
                    setReminders(prev => prev.map(r =>
                        r.id === reminder.id ? { ...r, lastTriggered: now.toISOString() } : r
                    ));

                    // 4. Persistence (Supabase) - Heartbeat for other devices
                    try {
                        await ReminderService.updateReminder(reminder.id, {
                            lastTriggered: now.toISOString()
                        });
                    } catch (e) {
                        console.error('Failed to update trigger in DB:', e);
                    }
                }
            });
        }, 5000); // Check every 5 seconds for better resolution

        return () => clearInterval(pollInterval);
    }, [user, reminders, showToast, localTriggerHistory]);

    const requestPermission = async () => {
        const granted = await NotificationService.requestPermission();
        setHasPermission(granted);

        if (granted) {
            // 🚀 INITIALIZE PUSH MATIX: Secure device channel for cloud-to-device pulses
            const subscription = await NotificationService.subscribeToPush();
            if (subscription) {
                await NotificationService.savePushSubscription(subscription);
                showToast("Push Matrix Active", "This device is now bound to the cloud notification relay.", { type: 'success' });
            }
        }

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
            runDiagnostics,
            syncStatus
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
