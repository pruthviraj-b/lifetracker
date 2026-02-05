import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Bell, Plus, Trash2, Power, Home, Activity, Zap } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { Reminder } from '../types/reminder';
import { ReminderModal } from '../components/tools/ReminderModal';
import { ReminderToast, ToastProps } from '../components/ui/ReminderToast';
import { NotificationService } from '../services/notification.service';
import { HabitService } from '../services/habit.service';
import { GoogleCalendarService } from '../services/googleCalendar.service';
import { ReminderService } from '../services/reminder.service';
import { NotificationManagerInstance } from '../utils/notificationManager';
import { useNotifications } from '../context/NotificationContext';


// Helper: Format 24h to 12h AM/PM with SECONDS
const formatTime = (time: string) => {
    const parts = time.split(':');
    const hours = parseInt(parts[0]);
    const minutes = parts[1];
    const seconds = parts[2] || '00';
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes}:${seconds} ${period}`;
};

// Helper: Calculate time remaining
const getTimeRemaining = (reminder: Reminder): string | null => {
    if (!reminder.isEnabled) return null;

    const now = new Date();
    const parts = reminder.time.split(':');
    const targetHours = parseInt(parts[0]);
    const targetMinutes = parseInt(parts[1]);
    const targetSeconds = parseInt(parts[2] || '0');

    let targetDate = new Date();
    targetDate.setHours(targetHours, targetMinutes, targetSeconds, 0);

    // Case 1: Specific Date
    if (reminder.date) {
        const [year, month, day] = reminder.date.split('-').map(Number);
        targetDate.setFullYear(year, month - 1, day);
        if (targetDate < now) return "Terminated";
    }
    // Case 2: Recurring
    else if (reminder.days.length > 0) {
        let found = false;
        for (let i = 0; i < 7; i++) {
            const checkDate = new Date();
            checkDate.setDate(now.getDate() + i);
            checkDate.setHours(targetHours, targetMinutes, targetSeconds, 0);

            if (i === 0 && checkDate <= now) continue;

            const dayOfWeek = checkDate.getDay();
            if (reminder.days.includes(dayOfWeek)) {
                targetDate = checkDate;
                found = true;
                break;
            }
        }
        if (!found) return "Offline";
    }
    // Case 3: One-time fallback
    else {
        if (targetDate <= now) {
            targetDate.setDate(targetDate.getDate() + 1);
        }
    }

    const diffMs = targetDate.getTime() - now.getTime();
    if (diffMs <= 0) return "Active Now";

    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const diffDays = Math.floor(diffHrs / 24);

    if (diffDays > 0) return `T-${diffDays}D ${diffHrs % 24}H`;
    if (diffHrs > 0) return `T-${diffHrs}H ${diffMins}M`;
    return `T-${diffMins}M`;
};

export default function RemindersPage() {
    const navigate = useNavigate();
    const { preferences } = useTheme();
    const { refreshReminders, runDiagnostics, testNotifications, requestPermission, syncStatus } = useNotifications();
    const isWild = preferences.wild_mode;
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [habits, setHabits] = useState<{ id: string; title: string }[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [hasPermission, setHasPermission] = useState(false);
    const [editingReminder, setEditingReminder] = useState<Reminder | undefined>(undefined);

    // Initial Load & Sync
    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await ReminderService.getReminders();
                setReminders(data);
                const habitsData = await HabitService.getHabits();
                setHabits(habitsData.map(h => ({ id: h.id, title: h.title })));
            } catch (error) {
                console.error("Failed to load reminders:", error);
            }
        };
        loadData();

        const checkPerm = async () => {
            const granted = await NotificationService.requestPermission();
            setHasPermission(granted);
        };
        checkPerm();
    }, []);

    const scheduleReminderInSW = async (reminder: Reminder) => {
        if (!reminder.isEnabled) return;
        const now = new Date();
        const [hours, minutes, seconds] = reminder.time.split(':').map(Number);
        let targetDate = new Date();
        targetDate.setHours(hours, minutes, seconds || 0, 0);

        if (reminder.date) {
            const [y, m, d] = reminder.date.split('-').map(Number);
            targetDate.setFullYear(y, m - 1, d);
            if (targetDate < now) return;
        } else if (reminder.days.length > 0) {
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
            if (!found) return;
        } else if (targetDate <= now) {
            targetDate.setDate(targetDate.getDate() + 1);
        }

        await NotificationManagerInstance.scheduleNotification(
            reminder.title,
            targetDate,
            {
                body: reminder.customMessage || "Protocol requirement active.",
                tag: reminder.id
            } as any
        );
    };

    const handleSave = async (data: any) => {
        try {
            if (editingReminder) {
                await ReminderService.updateReminder(editingReminder.id, data);
            } else {
                await ReminderService.createReminder({ ...data, isEnabled: true });
            }
            refreshReminders();
            const updatedReminders = await ReminderService.getReminders();
            setReminders(updatedReminders);
            setEditingReminder(undefined);
            setIsModalOpen(false);
        } catch (error: any) {
            alert(`Failed to save: ${error.message}`);
        }
    };

    const toggleReminder = async (id: string, currentStatus: boolean) => {
        const newState = !currentStatus;
        try {
            setReminders(prev => prev.map(r => r.id === id ? { ...r, isEnabled: newState } : r));
            await ReminderService.updateReminder(id, { isEnabled: newState });
            if (newState) {
                const r = reminders.find(item => item.id === id);
                if (r) scheduleReminderInSW({ ...r, isEnabled: true });
            } else {
                const r = reminders.find(item => item.id === id);
                if (r) NotificationManagerInstance.cancelNotification(r.title);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const deleteReminder = async (id: string, title: string) => {
        if (!confirm('Abort this protocol node?')) return;
        try {
            setReminders(prev => prev.filter(r => r.id !== id));
            await ReminderService.deleteReminder(id);
            await NotificationManagerInstance.cancelNotification(title);
        } catch (error) {
            console.error(error);
        }
    };

    const handleDeleteAll = async () => {
        if (!confirm('MASS PROTOCOL ABORT: Delete all active nodes?')) return;
        try {
            await ReminderService.deleteAllReminders();
            setReminders([]);
            refreshReminders(); // Centralized sync
            NotificationManagerInstance.cancelAllNotifications();
        } catch (error) {
            console.error(error);
        }
    };

    const handleToggleAll = async (isEnabled: boolean) => {
        try {
            await ReminderService.updateAllStatus(isEnabled);
            setReminders(prev => prev.map(r => ({ ...r, isEnabled })));
            refreshReminders();
            if (!isEnabled) {
                NotificationManagerInstance.cancelAllNotifications();
            } else {
                // Re-syncing handled by refreshReminders mostly, 
                // but for immediate SW sync we could loop here if needed.
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className={`min-h-screen bg-[#050505] text-white selection:bg-primary selection:text-black font-mono relative overflow-x-hidden`}>
            {/* Background elements */}
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(17,17,17,1)_0%,rgba(0,0,0,1)_100%)] z-0" />
            <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-0" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

            <ReminderModal
                isOpen={isModalOpen || !!editingReminder}
                onClose={() => { setIsModalOpen(false); setEditingReminder(undefined); }}
                onSave={handleSave}
                initialData={editingReminder}
                habits={habits}
            />

            <div className="relative z-10 max-w-5xl mx-auto px-4 py-4 md:py-6 space-y-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3 text-primary">
                            <Activity className="w-4 h-4 animate-pulse" />
                            <span className="text-[9px] font-black uppercase tracking-[0.4em]">System Status: Operational</span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-none italic">
                            Notification<br /><span className="text-primary not-italic">Matrix</span>
                        </h1>
                        <div className="flex items-center gap-2 mt-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${syncStatus === 'syncing' ? 'bg-yellow-500 animate-ping' : 'bg-green-500'}`} />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">
                                {syncStatus === 'syncing' ? 'Cloud Syncing...' : 'Live Cluster Active'}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/')}
                            className="h-12 w-12 border border-white/10 rounded-full flex items-center justify-center hover:bg-white/5 transition-all text-muted-foreground hover:text-white"
                        >
                            <Home className="w-5 h-5" />
                        </button>
                        <Button
                            onClick={() => setIsModalOpen(true)}
                            className="h-12 px-6 bg-primary text-black font-black uppercase text-[10px] tracking-widest rounded-none hover:translate-x-1 hover:-translate-y-1 transition-transform shadow-[4px_4px_0_rgba(var(--primary-rgb),0.3)]"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Inject Node
                        </Button>
                    </div>
                </div>

                {/* Status Bar & Bulk Actions */}
                <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white/5 border border-white/10 p-4 space-y-1">
                            <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Active Nodes</span>
                            <div className="text-2xl font-black">{reminders.filter(r => r.isEnabled).length} / {reminders.length}</div>
                        </div>
                        <div className="bg-white/5 border border-white/10 p-4 space-y-1">
                            <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Handshake</span>
                            <div className={`text-2xl font-black ${hasPermission ? 'text-green-500' : 'text-red-500'}`}>
                                {hasPermission ? 'SECURE' : 'BLOCKED'}
                            </div>
                        </div>
                        <div className="bg-white/5 border border-white/10 p-4 space-y-1 col-span-2">
                            <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Temporal Sync</span>
                            <div className="text-2xl font-black uppercase truncate">{new Date().toLocaleTimeString()}</div>
                        </div>
                    </div>

                    {/* Bulk Actions Mini Bar */}
                    {reminders.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 p-2 bg-white/[0.02] border border-white/5">
                            <span className="text-[10px] font-black uppercase tracking-widest px-2 opacity-40">Bulk Command:</span>
                            <button
                                onClick={() => handleToggleAll(true)}
                                className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border border-white/10 hover:border-primary/50 hover:bg-primary/10 transition-all"
                            >
                                [Enable All]
                            </button>
                            <button
                                onClick={() => handleToggleAll(false)}
                                className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border border-white/10 hover:border-white/30 hover:bg-white/5 transition-all"
                            >
                                [Disable All]
                            </button>
                            <button
                                onClick={handleDeleteAll}
                                className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border border-red-500/20 text-red-500/60 hover:border-red-500 hover:text-red-500 hover:bg-red-500/10 transition-all ml-auto"
                            >
                                [Abort All Nodes]
                            </button>
                        </div>
                    )}
                </div>

                {/* Nodes Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {reminders.length === 0 ? (
                        <div className="col-span-full py-32 border border-dashed border-white/10 flex flex-col items-center justify-center space-y-4 opacity-30">
                            <Zap className="w-12 h-12" />
                            <span className="text-[10px] font-black uppercase tracking-widest">No active ritual nodes detected in matrix</span>
                        </div>
                    ) : (
                        reminders.map(reminder => (
                            <div
                                key={reminder.id}
                                className={`
                                    relative border transition-all duration-300 group
                                    ${reminder.isEnabled
                                        ? 'bg-white/[0.03] border-white/10 hover:border-primary/50'
                                        : 'bg-black border-white/5 opacity-40 grayscale'}
                                `}
                            >
                                {/* Time Header */}
                                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${reminder.isEnabled ? 'bg-primary animate-pulse' : 'bg-muted-foreground'}`} />
                                        <span className="text-lg font-black tracking-tighter">{formatTime(reminder.time)}</span>
                                    </div>
                                    <button
                                        onClick={() => toggleReminder(reminder.id, reminder.isEnabled)}
                                        className={`p-1.5 rounded-none border transition-all ${reminder.isEnabled ? 'border-primary/30 text-primary bg-primary/5' : 'border-white/10 text-muted-foreground'}`}
                                    >
                                        <Power className="w-3 h-3" />
                                    </button>
                                </div>

                                {/* Body */}
                                <div className="p-4 space-y-4">
                                    <div>
                                        <h3 className="text-xs font-black uppercase tracking-widest mb-1 truncate group-hover:text-primary transition-colors">
                                            {reminder.title}
                                        </h3>
                                        <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                                            {reminder.date
                                                ? `ON ${reminder.date}`
                                                : reminder.days.length === 7
                                                    ? 'EVERY CYCLE'
                                                    : reminder.days.length > 0
                                                        ? 'PARTIAL CYCLES'
                                                        : 'SINGLE PULSE'
                                            }
                                        </div>
                                    </div>

                                    {reminder.isEnabled && (
                                        <div className="bg-primary/10 border border-primary/20 px-2 py-1 inline-flex items-center gap-2">
                                            <span className="text-[10px] font-black uppercase text-primary tracking-widest">{getTimeRemaining(reminder)}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Actions Toggle (Overlay on hover) */}
                                <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#0a0a0a]/90 backdrop-blur-sm border-l border-b border-white/10 flex items-center gap-1">
                                    <button
                                        onClick={() => setEditingReminder(reminder)}
                                        className="p-2 hover:text-primary transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
                                    </button>
                                    <button
                                        onClick={() => deleteReminder(reminder.id, reminder.title)}
                                        className="p-2 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer Diagnostic Panel */}
                <div className="pt-12 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Activity className="w-4 h-4 text-primary" />
                            <h2 className="text-sm font-black uppercase tracking-widest">Matrix Integrity</h2>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed font-bold uppercase tracking-tight opacity-60">
                            The temporal sync engine monitors all active protocols within the current session.
                            Background persistent notifications rely on the Service Worker handshake.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <button onClick={async () => {
                                const results = await runDiagnostics();
                                alert(`DIAGNOSIS:\nPlatform: ${results.isMobile ? 'Mobile' : 'Desktop'}\nPWA: ${results.isPWA}\nSecure: ${results.isSecure}\nSW: ${results.hasServiceWorker}\nPerm: ${results.permission}`);
                            }} className="text-[10px] font-black uppercase tracking-widest border-b border-primary text-primary hover:bg-primary/10 px-1 py-0.5">
                                [Run Diagnosis]
                            </button>
                            <button onClick={testNotifications} className="text-[10px] font-black uppercase tracking-widest border-b border-white text-white hover:bg-white/10 px-1 py-0.5">
                                [Send Test Pulse]
                            </button>
                            <button onClick={async () => {
                                if (!confirm("CLEAR SYSTEM CACHE? This will force a full reload and update.")) return;
                                if ('serviceWorker' in navigator) {
                                    const regs = await navigator.serviceWorker.getRegistrations();
                                    for (let reg of regs) await reg.unregister();
                                }
                                const keys = await caches.keys();
                                for (let key of keys) await caches.delete(key);
                                window.location.reload();
                            }} className="text-[10px] font-black uppercase tracking-widest border-b border-red-500 text-red-500 hover:bg-red-500/10 px-1 py-0.5">
                                [Kill Cache & Sync]
                            </button>
                        </div>
                        <div className="pt-2 text-[8px] opacity-30 uppercase font-black tracking-[0.2em]">
                            System Build: v2.1.0-MATRIX-3.6
                        </div>
                    </div>

                    {!hasPermission && (
                        <div className="bg-red-500/10 border border-red-500/30 p-6 space-y-3">
                            <div className="flex items-center gap-2 text-red-500">
                                <Zap className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Protocol Warning</span>
                            </div>
                            <p className="text-[10px] font-bold uppercase tracking-tight leading-relaxed">
                                External communication is restricted by host browser. Notifications will not leave the visual buffer.
                                <br />Please authorize the security handshake.
                            </p>
                            <Button
                                onClick={requestPermission}
                                className="w-full h-10 bg-red-500 text-black font-black uppercase text-[10px] tracking-widest rounded-none"
                            >
                                Authorize Synchronization
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
