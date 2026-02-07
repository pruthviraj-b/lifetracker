import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Bell, Plus, Trash2, Power, Home, Activity, Zap, Edit3 } from 'lucide-react';
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
import { YouTubeService } from '../services/youtube.service';
import { LearningService } from '../services/learning.service';
import { CourseService } from '../services/course.service';
import { useToast } from '../context/ToastContext';


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

import { ThemedCard } from '../components/ui/ThemedCard';

export default function RemindersPage() {
    const navigate = useNavigate();
    const { preferences } = useTheme();
    const { showToast } = useToast();
    const { refreshReminders, runDiagnostics, testNotifications, requestPermission: requestNativePermission, syncStatus } = useNotifications();
    const isWild = preferences.wild_mode;
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [habits, setHabits] = useState<{ id: string; title: string }[]>([]);
    const [videos, setVideos] = useState<{ id: string; title: string }[]>([]);
    const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
    const [resources, setResources] = useState<{ id: string; title: string }[]>([]);
    const [folders, setFolders] = useState<{ id: string; title: string }[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [hasPermission, setHasPermission] = useState(false);
    const [editingReminder, setEditingReminder] = useState<Reminder | undefined>(undefined);

    // Initial Load & Sync
    useEffect(() => {
        const loadData = async () => {
            try {
                const [remData, habData, vidData, couData, resData, folData] = await Promise.all([
                    ReminderService.getReminders(),
                    HabitService.getHabits(),
                    YouTubeService.getVideos(),
                    CourseService.getCourses(),
                    LearningService.getResources(),
                    LearningService.getFolders()
                ]);

                setReminders(remData);
                setHabits(habData.map(h => ({ id: h.id, title: h.title })));
                setVideos(vidData.map(v => ({ id: v.id, title: v.title })));
                setCourses(couData.map(c => ({ id: c.id, title: c.title })));
                setResources(resData.map(r => ({ id: r.id, title: r.title })));
                setFolders(folData.map((f: any) => ({ id: f.id, title: f.name })));
            } catch (error) {
                console.error("Failed to load reminders data:", error);
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
            // If the scheduled datetime is already in the past, roll it to next day
            if (targetDate <= now) {
                targetDate.setDate(targetDate.getDate() + 1);
            }
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
            let result: any = null;
            if (editingReminder) {
                await ReminderService.updateReminder(editingReminder.id, data);
                result = { ...editingReminder, ...data };
            } else {
                result = await ReminderService.createReminder({ ...data, isEnabled: true });
            }

            // Refresh local state and SW sync
            await refreshReminders();
            const updatedReminders = await ReminderService.getReminders();
            setReminders(updatedReminders);
            setEditingReminder(undefined);

            // Surface success feedback
            showToast(editingReminder ? "Reminder Updated" : "Reminder Set", "Your protocol node is active.", { type: 'success' });

            // Return created/updated reminder for caller
            return result;
        } catch (error: any) {
            console.error('Failed to save reminder:', error);
            throw error;
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
                if (r) NotificationManagerInstance.cancelNotification(id);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const deleteReminderAction = async (id: string, title: string) => {
        if (!confirm('Abort this protocol node?')) return;
        try {
            setReminders(prev => prev.filter(r => r.id !== id));
            await ReminderService.deleteReminder(id);
            await NotificationManagerInstance.cancelNotification(id);
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
        <div className="p-3 md:p-8 space-y-8 md:space-y-12 max-w-5xl mx-auto">
            <ReminderModal
                isOpen={isModalOpen || !!editingReminder}
                onClose={() => { setIsModalOpen(false); setEditingReminder(undefined); }}
                onSave={handleSave}
                initialData={editingReminder}
                habits={habits}
                videos={videos}
                courses={courses}
                resources={resources}
                folders={folders}
            />

            {/* Header */}
            <div className={`flex flex-col md:flex-row justify-between items-start md:items-end gap-6 ${isWild ? 'animate-reveal' : ''}`}>
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" className={`rounded-full w-10 h-10 p-0 ${isWild ? 'rounded-none border-2 border-primary/20' : ''}`} onClick={() => navigate('/')}>
                            <Home className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className={`text-xl md:text-3xl font-black uppercase tracking-tighter ${isWild ? 'animate-glitch' : ''}`}>Trigger Protocols</h1>
                            <p className="text-muted-foreground text-[7px] md:text-[8px] uppercase font-bold tracking-[0.3em] opacity-60">Temporal Alert Management</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Button
                        onClick={() => setIsModalOpen(true)}
                        className={`h-11 px-8 text-[11px] font-black uppercase tracking-widest flex-1 md:flex-none ${isWild ? 'rounded-none border-2 shadow-[0_0_15px_rgba(255,0,0,0.15)]' : 'rounded-xl'}`}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Inject Node
                    </Button>
                </div>
            </div>

            {/* Diagnostics & Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <ThemedCard className="space-y-6">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">System Matrix Status</h3>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <div className="text-[10px] uppercase font-bold text-muted-foreground opacity-40">Handshake</div>
                            <div className={`text-lg md:text-xl font-black ${hasPermission ? 'text-primary' : 'text-red-500'}`}>
                                {hasPermission ? 'SECURE' : 'BLOCKED'}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-[10px] uppercase font-bold text-muted-foreground opacity-40">Active Nodes</div>
                            <div className="text-lg md:text-xl font-black">{reminders.filter(r => r.isEnabled).length} / {reminders.length}</div>
                        </div>
                    </div>
                    {!hasPermission && (
                        <Button onClick={requestNativePermission} className={`w-full text-[10px] font-black tracking-widest uppercase ${isWild ? 'rounded-none border-2' : ''}`}>
                            Authorize Signal Uplink
                        </Button>
                    )}
                </ThemedCard>

                <ThemedCard className="space-y-6">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-60">Bulk Protocol Control</h3>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleToggleAll(true)} className={`text-[10px] font-black ${isWild ? 'rounded-none border-2' : ''}`}>
                            Enable Cluster
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleToggleAll(false)} className={`text-[10px] font-black ${isWild ? 'rounded-none border-2' : ''}`}>
                            Silence All
                        </Button>
                        <Button variant="destructive" size="sm" onClick={handleDeleteAll} className={`text-[10px] font-black ${isWild ? 'rounded-none' : ''}`}>
                            Full Abort
                        </Button>
                    </div>
                </ThemedCard>
            </div>

            {/* Main Reminders Display */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                        <Activity className="w-4 h-4 text-primary" />
                        Active Listeners
                    </h2>
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-30 font-mono">
                        {new Date().toLocaleTimeString()}
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {reminders.length === 0 ? (
                        <div className={`col-span-full py-24 bg-muted/5 border-2 border-dashed flex flex-col items-center justify-center gap-6 ${isWild ? 'rounded-none border-primary/20' : 'rounded-[2rem] border-border'}`}>
                            <Zap className="w-10 h-10 text-primary opacity-20" />
                            <div className="text-center space-y-1">
                                <h3 className="text-lg md:text-xl font-black uppercase tracking-tight">No trigger nodes found</h3>
                                <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest opacity-60">Initialize new protocol node</p>
                            </div>
                        </div>
                    ) : (
                        reminders.map(reminder => (
                            <ThemedCard
                                key={reminder.id}
                                className={`group relative transition-all duration-300 ${!reminder.isEnabled ? 'opacity-40 grayscale' : ''}`}
                            >
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-1.5 h-1.5 rounded-full ${reminder.isEnabled ? 'bg-primary animate-pulse' : 'bg-muted-foreground'}`} />
                                            <span className="text-xl md:text-2xl font-black tracking-tighter text-primary">{formatTime(reminder.time)}</span>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleReminder(reminder.id, reminder.isEnabled);
                                            }}
                                            className={`p-2 rounded-lg border transition-all ${reminder.isEnabled ? 'border-primary/30 text-primary bg-primary/5' : 'border-white/10 text-muted-foreground'} ${isWild ? 'rounded-none' : ''}`}
                                        >
                                            <Power className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        <h3 className="text-sm font-black uppercase tracking-widest truncate">{reminder.title}</h3>
                                        <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter opacity-60">
                                            {reminder.date
                                                ? `ON ${reminder.date}`
                                                : reminder.days.length === 7
                                                    ? 'CYCLE: EVERY 24H'
                                                    : reminder.days.length > 0
                                                        ? 'CYCLE: PARTIAL'
                                                        : 'CYCLE: SINGLE'
                                            }
                                        </div>
                                    </div>

                                    {reminder.isEnabled && (
                                        <div className="bg-primary/10 border border-primary/20 px-3 py-1.5 inline-flex items-center gap-2">
                                            <span className="text-[10px] font-black uppercase text-primary tracking-widest">
                                                {getTimeRemaining(reminder)}
                                            </span>
                                        </div>
                                    )}

                                    <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                        <button
                                            onClick={() => setEditingReminder(reminder)}
                                            className="p-2 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => deleteReminderAction(reminder.id, reminder.title)}
                                            className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </ThemedCard>
                        ))
                    )}
                </div>
            </div>

            {/* Footer Diagnostic Panel */}
            <ThemedCard className="border-t-2 border-primary/10 bg-primary/5 space-y-6">
                <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-black uppercase tracking-tight italic">Matrix Integrity Diagnostics</h2>
                </div>
                <div className="grid md:grid-cols-2 gap-8 items-center">
                    <p className="text-[10px] text-muted-foreground leading-relaxed font-bold uppercase tracking-widest opacity-60">
                        The temporal sync engine monitors all active protocols within the current cluster.
                        Persistent triggers rely on the Service Worker handshake and notification permissions.
                    </p>
                    <div className="flex flex-wrap gap-4 justify-end">
                        <button onClick={async () => {
                            const results = await runDiagnostics();
                            alert(`DIAGNOSIS:\nPlatform: ${results.isMobile ? 'Mobile' : 'Desktop'}\nPWA: ${results.isPWA}\nSecure: ${results.isSecure}\nSW: ${results.hasServiceWorker}\nPerm: ${results.permission}`);
                        }} className="text-[10px] font-black uppercase tracking-widest border-b-2 border-primary text-primary hover:bg-primary/10 px-1 py-1 transition-colors">
                            [Execute Diagnosis]
                        </button>
                        <button onClick={testNotifications} className="text-[10px] font-black uppercase tracking-widest border-b-2 border-foreground text-foreground hover:bg-muted/20 px-1 py-1 transition-colors">
                            [Pulse Test Signal]
                        </button>
                        <button onClick={async () => {
                            if (!confirm("PURGE SYSTEM CACHE? Matrix reconciliation required.")) return;
                            if ('serviceWorker' in navigator) {
                                const regs = await navigator.serviceWorker.getRegistrations();
                                for (let reg of regs) await reg.unregister();
                            }
                            const keys = await caches.keys();
                            for (let key of keys) await caches.delete(key);
                            window.location.reload();
                        }} className="text-[10px] font-black uppercase tracking-widest border-b-2 border-red-500 text-red-500 hover:bg-red-500/10 px-1 py-1 transition-colors">
                            [Purge & Re-sync]
                        </button>
                    </div>
                </div>
                <div className="text-[8px] opacity-30 uppercase font-black tracking-[0.4em] text-center pt-4">
                    Matrix Build Sequence: v3.0.0-RITUAL-PROTOCOL
                </div>
            </ThemedCard>
        </div>
    );
}
