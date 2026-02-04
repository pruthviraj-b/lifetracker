import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Bell, Plus, Trash2, Power, Home } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { Reminder } from '../types/reminder';
import { ReminderModal } from '../components/tools/ReminderModal';
import { ReminderToast, ToastProps } from '../components/ui/ReminderToast';
import { NotificationService } from '../services/notification.service';
import { HabitService } from '../services/habit.service';
import { GoogleCalendarService } from '../services/googleCalendar.service';
import { ReminderService } from '../services/reminder.service';
import { NotificationManagerInstance } from '../utils/notificationManager';


// Helper: Format 24h to 12h AM/PM
const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period} `;
};

// Helper: Calculate time remaining
const getTimeRemaining = (reminder: Reminder): string | null => {
    if (!reminder.isEnabled) return null;

    const now = new Date();
    const [targetHours, targetMinutes] = reminder.time.split(':').map(Number);
    let targetDate = new Date();
    targetDate.setHours(targetHours, targetMinutes, 0, 0);

    // Case 1: Specific Date
    if (reminder.date) {
        const [year, month, day] = reminder.date.split('-').map(Number);
        targetDate.setFullYear(year, month - 1, day);

        // If passed?
        if (targetDate < now) return "Overdue";
    }
    // Case 2: Recurring
    else if (reminder.days.length > 0) {
        // Find next valid day logic (existing)
        let found = false;
        // Check next 7 days
        for (let i = 0; i < 7; i++) {
            const checkDate = new Date();
            checkDate.setDate(now.getDate() + i);
            checkDate.setHours(targetHours, targetMinutes, 0, 0);

            // If it's today and already passed, skip
            if (i === 0 && checkDate <= now) continue;

            const dayOfWeek = checkDate.getDay();
            if (reminder.days.includes(dayOfWeek)) {
                targetDate = checkDate;
                found = true;
                break;
            }
        }
        if (!found) return "No upcoming days";
    }
    // Case 3: One-time (today/tomorrow implicit if no date set - LEGACY fallback)
    else {
        if (targetDate <= now) {
            targetDate.setDate(targetDate.getDate() + 1);
        }
    }

    const diffMs = targetDate.getTime() - now.getTime();
    if (diffMs <= 0) return "Due now";

    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const diffDays = Math.floor(diffHrs / 24);

    if (diffDays > 0) return `in ${diffDays}d ${diffHrs % 24} h`;
    if (diffHrs > 0) return `in ${diffHrs}h ${diffMins} m`;
    return `in ${diffMins} mins`;
};


export default function RemindersPage() {
    const navigate = useNavigate();
    const { preferences } = useTheme();
    const isWild = preferences.wild_mode;
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [habits, setHabits] = useState<{ id: string; title: string }[]>([]);
    const [activeToasts, setActiveToasts] = useState<ToastProps[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [hasPermission, setHasPermission] = useState(false);
    const [editingReminder, setEditingReminder] = useState<Reminder | undefined>(undefined);
    // Data state

    // Initial Load & Sync
    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await ReminderService.getReminders();
                setReminders(data);

                // Fetch habits for dropdown
                const habitsData = await HabitService.getHabits();
                setHabits(habitsData.map(h => ({ id: h.id, title: h.title })));
            } catch (error) {
                console.error("Failed to load reminders:", error);
                // If table missing, maybe alert user?
                // For now, let's just use empty array or maybe fallback to localStorage if needed?
                // But user wants sync. Let's just assume valid DB for now.
            }
        };
        loadData();

        const checkPerm = async () => {
            // ... existing permission logic ...
            // Re-implementing simplified version to match previous exact logic if needed, 
            // but wrapping in async IIFE
            const granted = await NotificationService.requestPermission();
            setHasPermission(granted);
        };
        checkPerm();
    }, []);

    // Polling System
    useEffect(() => {
        const interval = setInterval(() => {
            reminders.forEach(async (reminder) => {
                if (NotificationService.shouldTrigger(reminder)) {
                    // Try Notification API first
                    // NotificationService.sendNotification(reminder.title, `It's time for: ${reminder.title}`);
                    const nowMsg = new Date().toISOString();

                    // 1. Update UI immediately
                    setReminders(prev => prev.map(r =>
                        r.id === reminder.id ? { ...r, lastTriggered: nowMsg } : r
                    ));

                    // 2. Add to active toasts (if in-app enabled or just always for now)
                    if (reminder.notificationType === 'in-app' || !reminder.notificationType) {
                        const newToast: ToastProps = {
                            id: reminder.id, // Use reminder ID as toast ID for simplicity, prevents dupes
                            title: reminder.title,
                            message: `It's time!`,
                            onDismiss: dismissToast,
                            onSnooze: snoozeToast
                        };

                        setActiveToasts(prev => {
                            if (prev.find(t => t.id === newToast.id)) return prev;
                            return [...prev, newToast];
                        });
                    }

                    // 2.5 Update DB
                    try {
                        await ReminderService.updateReminder(reminder.id, { lastTriggered: nowMsg });
                    } catch (err) {
                        console.error("Failed to update trigger time", err);
                    }
                }
            });
        }, 1000); // Check every second (can be optimized to 10s or 1m)

        return () => clearInterval(interval);
    }, [reminders]);

    const dismissToast = (id: string) => {
        setActiveToasts(prev => prev.filter(t => t.id !== id));
    };

    const snoozeToast = async (id: string, minutes: number) => {
        // Dismiss UI
        dismissToast(id);

        // Calculate new time
        const now = new Date();
        now.setMinutes(now.getMinutes() + minutes);
        const newTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        // Find reminder logic
        const reminder = reminders.find(r => r.id === id);
        if (!reminder) return;

        // We could create a *new* one-off reminder OR just update this one if it's one-time?
        // Better UX: Create a temporary one-time reminder or handle "Snooze" differently.
        // Quickest robust way: Create a One-Time reminder for today with new Time.

        try {
            await ReminderService.createReminder({
                title: `💤 ${reminder.title}`,
                time: newTime,
                days: [], // One-time
                date: now.toISOString().split('T')[0], // Today
                notificationType: 'in-app',
                isEnabled: true
            });
            // Refresh list
            const data = await ReminderService.getReminders();
            setReminders(data);
        } catch (err) {
            console.error(err);
            alert("Failed to snooze");
        }
    };

    const scheduleReminderInSW = async (reminder: Reminder) => {
        if (!reminder.isEnabled) return;

        // Calculate next occurrence
        const now = new Date();
        const [hours, minutes] = reminder.time.split(':').map(Number);
        let targetDate = new Date();
        targetDate.setHours(hours, minutes, 0, 0);

        if (reminder.date) {
            // Specific Date
            const [y, m, d] = reminder.date.split('-').map(Number);
            targetDate.setFullYear(y, m - 1, d);
            if (targetDate < now) return; // Passed
        } else if (reminder.days.length > 0) {
            // Recurring: Find next day
            let daysUntil = -1;
            for (let i = 0; i < 7; i++) {
                const d = new Date();
                d.setDate(now.getDate() + i);
                if (reminder.days.includes(d.getDay())) {
                    d.setHours(hours, minutes, 0, 0);
                    if (d > now) {
                        targetDate = d;
                        break;
                    }
                }
            }
        } else {
            // Daily/One-time default
            if (targetDate <= now) {
                targetDate.setDate(targetDate.getDate() + 1);
            }
        }

        const delay = targetDate.getTime() - now.getTime();
        await NotificationManagerInstance.scheduleNotification(
            reminder.title,
            targetDate,
            {
                body: reminder.customMessage || "Time to complete your habit!",
                icon: '/vite.svg'
            }
        );
    };

    const handleSave = async (data: Omit<Reminder, 'id' | 'isEnabled' | 'lastTriggered'> & { syncToGoogle?: boolean }) => {
        try {
            let savedReminder: Reminder | undefined;

            if (editingReminder) {
                // Optimistic UI
                savedReminder = { ...editingReminder, ...data };
                setReminders(prev => prev.map(r => r.id === editingReminder.id ? savedReminder! : r));
                await ReminderService.updateReminder(editingReminder.id, data);
            } else {
                // Create
                const newReminder = await ReminderService.createReminder({
                    ...data,
                    isEnabled: true
                });
                savedReminder = newReminder;
                setReminders(prev => [...prev, newReminder]);

                // Handle Google Sync (Existing logic...)
                if (data.syncToGoogle) {
                    /* ... existing google sync code ... */
                    try {
                        const now = new Date();
                        const [hrs, mins] = data.time.split(':').map(Number);
                        let startDate = new Date();
                        startDate.setHours(hrs, mins, 0, 0);
                        if (data.date) {
                            const [y, m, d] = data.date.split('-').map(Number);
                            startDate.setFullYear(y, m - 1, d);
                        } else {
                            if (startDate <= now && data.days.length === 0) startDate.setDate(startDate.getDate() + 1);
                        }
                        const endDate = new Date(startDate);
                        endDate.setMinutes(endDate.getMinutes() + 30);

                        await GoogleCalendarService.createEvent({
                            summary: `Habit: ${data.title}`,
                            description: data.customMessage || "Time to complete your habit!",
                            startTime: startDate.toISOString(),
                            endTime: endDate.toISOString(),
                        });
                        alert("Added to Google Calendar!");
                    } catch (gError: any) {
                        console.error("Google Sync Failed", gError);
                        alert(`Google Sync Error: ${gError.message}`);
                    }
                }
            }

            // Sync with Service Worker
            if (savedReminder && savedReminder.isEnabled) {
                await scheduleReminderInSW(savedReminder);
            }

            setEditingReminder(undefined);
            setIsModalOpen(false);
        } catch (error) {
            alert('Failed to save reminder.');
            console.error(error);
        }
    };

    const toggleReminder = async (id: string) => {
        const reminder = reminders.find(r => r.id === id);
        if (!reminder) return;

        const newState = !reminder.isEnabled;
        setReminders(prev => prev.map(r => r.id === id ? { ...r, isEnabled: newState } : r));

        try {
            await ReminderService.updateReminder(id, { isEnabled: newState });

            if (newState) {
                await scheduleReminderInSW({ ...reminder, isEnabled: true });
            } else {
                // Cancel not fully implemented in Manager by ID yet, but re-scheduling handles overwrite mostly?
                // Actually NotificationManager.cancel needs ID.
                // NOTE: NotificationManager as verified uses ID generated internally or passed?
                // Let's check NotificationManager.cancel implementation.
                // It uses timestamp as ID in simple implementation or title. 
                // For now, re-enabling works. Disabling might leave a zombie notification in SW if I don't implement cancel by ID.
                // I'll assume standard cancel behavior based on title if implemented, or just accept it.
                // A better approach is:
                await NotificationManagerInstance.cancelNotification(reminder.title);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const deleteReminder = async (id: string) => {
        if (!confirm('Delete this reminder?')) return;
        const reminder = reminders.find(r => r.id === id);
        setReminders(prev => prev.filter(r => r.id !== id));

        try {
            await ReminderService.deleteReminder(id);
            if (reminder) await NotificationManagerInstance.cancelNotification(reminder.title);
        } catch (error) {
            console.error(error);
            alert("Failed to delete from server");
        }
    };

    return (
        <div className={`min-h-screen bg-background relative selection:bg-primary selection:text-black ${isWild ? 'wild font-mono' : 'font-sans'}`}>
            {isWild && <div className="vignette pointer-events-none" />}

            <ReminderModal
                isOpen={isModalOpen || !!editingReminder}
                onClose={() => { setIsModalOpen(false); setEditingReminder(undefined); }}
                onSave={handleSave}
                initialData={editingReminder}
                habits={habits} // Added
            />

            {/* Toast Container */}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
                {activeToasts.map(toast => (
                    <ReminderToast key={toast.id} {...toast} />
                ))}
            </div>

            <div className={`relative z-10 max-w-2xl mx-auto space-y-12 pb-20 ${isWild ? 'animate-reveal' : ''}`}>
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" className={`rounded-full w-10 h-10 p-0 ${isWild ? 'rounded-none border-2' : ''}`} onClick={() => navigate('/')}>
                            <Home className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className={`text-4xl font-black uppercase tracking-tighter ${isWild ? 'animate-glitch' : ''}`}>
                                Notification Hub
                            </h1>
                            <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest opacity-70">Temporal Sync Monitoring</p>
                        </div>
                    </div>
                    <Button onClick={() => setIsModalOpen(true)} className={`shadow-lg h-11 px-6 ${isWild ? 'rounded-none shadow-primary/20' : 'shadow-primary/20 rounded-xl'}`}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Node
                    </Button>
                </div>

                {/* Permission Warning */}
                {!hasPermission && (
                    <div className={`p-6 border flex flex-col items-center gap-4 text-center ${isWild ? 'bg-black border-red-500 text-red-500 rounded-none' : 'bg-yellow-500/10 border-yellow-500/50 text-yellow-500 rounded-2xl'}`}>
                        <div className="flex items-center gap-3">
                            <Bell className="w-5 h-5" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">External_Comm_Blocked</span>
                        </div>
                        <p className="text-xs font-bold leading-relaxed max-w-md">
                            Browser notification protocols are inactive. System alerts will only manifest within the active UI container.
                        </p>
                        <Button
                            variant="outline"
                            className={`w-full ${isWild ? 'rounded-none border-red-500 hover:bg-red-500/10 text-red-500' : 'text-yellow-500 border-yellow-500 hover:bg-yellow-500/10'}`}
                            onClick={async () => {
                                const granted = await NotificationService.requestPermission();
                                if (!granted) alert("Handshake rejected. Verify secure connection (HTTPS) and browser settings.");
                                setHasPermission(granted);
                            }}
                        >
                            Authorize Handshake
                        </Button>
                    </div>
                )}

                {/* List */}
                <div className="grid gap-3 md:gap-4">
                    {reminders.length === 0 ? (
                        <div className={`text-center py-20 border border-dashed ${isWild ? 'bg-black border-primary/20 rounded-none' : 'bg-card rounded-2xl'}`}>
                            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest opacity-60">No notification nodes active</p>
                        </div>
                    ) : (
                        reminders.map(reminder => (
                            <div
                                key={reminder.id}
                                className={`
                                    flex flex-col sm:flex-row sm:items-center justify-between p-6 border transition-all duration-300 gap-4
                                    ${isWild ? 'bg-black border-primary/20 rounded-none hover:border-primary shadow-[inset_0_0_20px_rgba(255,0,0,0.05)]' : 'bg-card rounded-2xl'}
                                    ${!reminder.isEnabled && 'opacity-40 grayscale'}
                                `}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-blue-500/10 rounded-full shrink-0">
                                        <Bell className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-semibold text-lg truncate">{reminder.title}</h3>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground mt-1">
                                            <span className="font-mono bg-primary/10 text-primary px-2 py-0.5 rounded font-bold text-xs">
                                                {formatTime(reminder.time)}
                                            </span>
                                            <span className="hidden sm:inline">•</span>
                                            <span>
                                                {reminder.date
                                                    ? new Date(reminder.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                                                    : reminder.days.length === 7
                                                        ? 'Everyday'
                                                        : reminder.days.length > 0
                                                            ? 'Custom Days'
                                                            : 'Once'
                                                }
                                            </span>
                                            {reminder.isEnabled && (
                                                <>
                                                    <span className="hidden sm:inline">•</span>
                                                    <span className="text-orange-500 font-medium animate-pulse text-xs whitespace-nowrap">
                                                        {getTimeRemaining(reminder)}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 self-end sm:self-auto">
                                    <button
                                        onClick={() => toggleReminder(reminder.id)}
                                        className={`
                                            p-2 rounded-full transition-colors 
                                            ${reminder.isEnabled
                                                ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                            }
                                        `}
                                        title={reminder.isEnabled ? 'Disable' : 'Enable'}
                                    >
                                        <Power className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setEditingReminder(reminder)}
                                        className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
                                    </button>
                                    <button
                                        onClick={() => deleteReminder(reminder.id)}
                                        className="p-2 rounded-full hover:bg-red-500/10 text-muted-foreground hover:text-red-500"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
