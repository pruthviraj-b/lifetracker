import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Heatmap } from '../components/analytics/Heatmap';
import { FocusTimer } from '../components/tools/FocusTimer';
import { DailyCheckin } from '../components/tools/DailyCheckin';
import { CreateHabitModal } from '../components/tools/CreateHabitModal';
import { DayDetailModal } from '../components/tools/DayDetailModal';
import { LevelUpModal } from '../components/gamification/LevelUpModal';
import { NoteModal } from '../components/tools/NoteModal';
import { Habit, DayLog, TimeOfDay, Mood } from '../types/habit';
import { Reminder } from '../types/reminder';
import { useNavigate } from 'react-router-dom';
import { HabitService } from '../services/habit.service';
import {
    Check, Sun, CloudSun, Moon, Timer, Plus, Trash2,
    Calendar as CalendarIcon, StickyNote, Trophy, Activity,
    Share2, TrendingUp, Target, Star, CalendarOff, Home, AlertCircle, BookOpen, Bell, Eye
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { SkipReasonModal } from '../components/tools/SkipReasonModal';
import { SmartFeed } from '../components/dashboard/SmartFeed';
import { NewAchievementModal } from '../components/gamification/NewAchievementModal';
import { Achievement } from '../services/achievement.service';
import { useTheme } from '../context/ThemeContext';
import { PWABanner } from '../components/layout/PWABanner';
import { HabitReminder } from '../components/HabitReminder';
import { ReminderService } from '../services/reminder.service';
import { NotificationManagerInstance } from '../utils/notificationManager';

export default function DashboardPage() {
    const { logout, user } = useAuth();
    const { showToast } = useToast();
    const { preferences } = useTheme();
    const isWild = preferences.wild_mode;
    const navigate = useNavigate();

    // UI State
    const [isFocusOpen, setIsFocusOpen] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [habitToEdit, setHabitToEdit] = useState<Habit | undefined>(undefined);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [confirmState, setConfirmState] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        isDestructive?: boolean;
    }>({ isOpen: false, title: '', message: '', onConfirm: () => { } });
    const [skipModal, setSkipModal] = useState<{ isOpen: boolean; habitId: string; title: string } | null>(null);
    const [noteModal, setNoteModal] = useState<{ isOpen: boolean; habitId: string; note?: string } | null>(null);
    const [reminderModal, setReminderModal] = useState<{ isOpen: boolean; habit: { id: string; name: string } } | null>(null);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    // Data State
    const [habits, setHabits] = useState<Habit[]>([]);
    const [logs, setLogs] = useState<Record<string, DayLog>>({});
    const [todayNotes, setTodayNotes] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [reminders, setReminders] = useState<Reminder[]>([]);

    // XP & Gamification
    const [xpStats, setXpStats] = useState({ level: 1, currentXP: 0, nextLevelXP: 100 });
    const [showLevelUp, setShowLevelUp] = useState(false);
    const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);
    const prevLevelRef = useRef(1);

    useEffect(() => {
        if (xpStats.level > prevLevelRef.current) setShowLevelUp(true);
        prevLevelRef.current = xpStats.level;
    }, [xpStats.level]);

    // Handle URL Actions (e.g. from Assistant or LMS)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const action = params.get('action');

        if (action === 'create') {
            setIsCreateOpen(true);
            window.history.replaceState({}, '', '/dashboard');
        } else if (action === 'achievement') {
            // Mock triggering an achievement for course completion
            setNewAchievement({
                id: 'course-complete-' + Date.now(),
                name: 'Neural Upgrade Complete',
                description: 'Course Protocol Assimilated. Knowledge base expanded.',
                icon: 'book-open',
                points: 500,
                category: 'learning',
                criteria_type: 'course_completion',
                criteria_value: 1,
                unlocked_at: new Date().toISOString()
            });
            window.history.replaceState({}, '', '/dashboard');
        }
    }, [window.location.search]);

    useEffect(() => {
        if (user) loadData();
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, [user]);

    const loadData = async () => {
        if (!user) return;

        // 1. Critical Data - Must load for dashboard to be useful
        try {
            setLoading(true);
            const fetchedHabits = await HabitService.getHabits(user.id);
            setHabits(fetchedHabits);
        } catch (error) {
            console.error("Critical error loading habits:", error);
            showToast("Error", "Failed to load rituals. Please refresh.", { type: 'error' });
            setLoading(false); // Stop loading if critical data fails
            return;
        }

        // 2. Secondary Data - Can fail individually without breaking the app
        const todayStr = new Date().toISOString().split('T')[0];
        const lastYearStr = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        // We run these in parallel but handle errors individually
        const loadSecondary = async () => {
            try {
                const [fetchedLogs, fetchedReflections, profile] = await Promise.all([
                    HabitService.getLogs(lastYearStr, todayStr, user.id).catch(e => { console.warn('Logs failed', e); return []; }),
                    HabitService.getReflections(lastYearStr, todayStr, user.id).catch(e => { console.warn('Reflections failed', e); return []; }),
                    HabitService.getProfile(user.id).catch(e => { console.warn('Profile failed', e); return null; }),
                ]);

                // Update UI with what we got
                if (profile) {
                    setXpStats({
                        level: profile.level,
                        currentXP: profile.current_xp,
                        nextLevelXP: profile.next_level_xp
                    });
                }

                // Process logs
                const logsMap: Record<string, DayLog> = {};
                const todaysCompletedIds = new Set<string>();
                const notesMap: Record<string, string> = {};

                fetchedLogs.forEach((log: any) => {
                    const date = log.date;
                    // Note: totalHabits is just a snapshot, might not match exactly if habits changed, but fine for heatmap
                    if (!logsMap[date]) logsMap[date] = { date, completedHabitIds: [], totalHabits: 0 };
                    logsMap[date].completedHabitIds.push(log.habit_id);
                    if (date === todayStr) {
                        todaysCompletedIds.add(log.habit_id);
                        if (log.note) notesMap[log.habit_id] = log.note;
                    }
                });

                fetchedReflections.forEach((ref: any) => {
                    const date = ref.date;
                    if (!logsMap[date]) logsMap[date] = { date, completedHabitIds: [], totalHabits: 0 };
                    logsMap[date].mood = ref.mood;
                    logsMap[date].journalEntry = ref.note;
                });

                setLogs(logsMap);
                setTodayNotes(notesMap);

                // Update habits completed state
                setHabits(prev => prev.map(h => ({
                    ...h,
                    completedToday: todaysCompletedIds.has(h.id)
                })));

            } catch (e) {
                console.warn("Secondary data warning:", e);
            }
        };

        const loadReminders = async () => {
            try {
                const fetchedReminders = await ReminderService.getReminders(user.id);
                setReminders(fetchedReminders);
            } catch (e) {
                console.warn("Reminders failed to load", e);
            }
        };

        const loadSkips = async () => {
            try {
                const fetchedSkips = await HabitService.getSkips(lastYearStr, todayStr);
                const todaySkips = new Set(fetchedSkips.filter(s => s.date === todayStr).map(s => s.habit_id));
                setHabits(prev => prev.map(h => ({
                    ...h,
                    skippedToday: todaySkips.has(h.id)
                })));
            } catch (e) {
                console.warn("Skips failed to load", e);
            }
        };

        // Fire off secondary loads without awaiting them to block the UI
        Promise.allSettled([loadSecondary(), loadReminders(), loadSkips()]).then(() => {
            // Optional: visual indicator that *everything* is done? 
            // For now, we just let the UI update progressively.
        });

        // Dashboard is usable now!
        setLoading(false);
    };

    const toggleHabit = async (id: string, note?: string) => {
        if (!user) return;
        const todayStr = new Date().toISOString().split('T')[0];
        const habitToToggle = habits.find(h => h.id === id);
        if (!habitToToggle) return;

        const isNowCompleted = !habitToToggle.completedToday;

        // Optimistic UI
        setHabits(prev => prev.map(h => h.id === id ? { ...h, completedToday: isNowCompleted } : h));

        try {
            const result = await HabitService.toggleHabitCompletion(id, todayStr, isNowCompleted, user.id, note);
            if (isNowCompleted) {
                showToast(
                    result?.synergyBonus ? "Synergy Bonus! ✨" : "Success",
                    `"${habitToToggle.title}" marked as done. +${result?.xpGained || 10} XP`,
                    { type: 'success' }
                );
                // Refresh data to update streaks/achievements
                loadData();
            }
        } catch (error) {
            console.error(error);
            showToast("Error", "Failed to update ritual", { type: 'error' });
            // Revert
            setHabits(prev => prev.map(h => h.id === id ? { ...h, completedToday: !isNowCompleted } : h));
        }
    };

    const handleArchiveHabit = async (id: string) => {
        setConfirmState({
            isOpen: true,
            title: "Archive Habit?",
            message: "This will hide the habit from your daily flow.",
            onConfirm: async () => {
                if (user) {
                    await HabitService.archiveHabit(id, user.id);
                    loadData();
                }
                setConfirmState(prev => ({ ...prev, isOpen: false }));
            },
            isDestructive: true
        });
    };

    const handleAddNote = (habitId: string) => {
        setNoteModal({ isOpen: true, habitId, note: todayNotes[habitId] });
    };

    const handleSaveNote = async (note: string) => {
        if (!noteModal) return;
        await toggleHabit(noteModal.habitId, note);
        setNoteModal(null);
    };

    const handleCreateHabit = async (data: any) => {
        try {
            if (!user) return;
            const newHabit = await HabitService.createHabit(data, user.id);
            showToast("Success", "Protocol Initiated", { type: 'success' });

            // Handle Auto-Reminder
            if (data.reminderTime) {
                try {
                    const reminder = await ReminderService.createReminder({
                        title: data.title,
                        time: data.reminderTime,
                        days: data.frequency || [0, 1, 2, 3, 4, 5, 6],
                        isEnabled: true,
                        habitId: newHabit.id
                    });

                    // Schedule in SW
                    // Calculate next occurrence logic or reuse helper?
                    // I'll duplicate the simple logic here for robustness or move it to a shared helper later.
                    // Simplified:
                    const now = new Date();
                    const [h, m] = data.reminderTime.split(':').map(Number);
                    let target = new Date();
                    target.setHours(h, m, 0, 0);
                    if (target <= now) target.setDate(target.getDate() + 1); // Simplest assumption: next occurrence is tomorrow if passed today (or today if future)

                    // Better recurring logic:
                    if (data.frequency && data.frequency.length > 0) {
                        // find next day
                        for (let i = 0; i < 7; i++) {
                            const d = new Date();
                            d.setDate(now.getDate() + i);
                            d.setHours(h, m, 0, 0);
                            if (d > now && data.frequency.includes(d.getDay())) {
                                target = d;
                                break;
                            }
                        }
                    }

                    await NotificationManagerInstance.scheduleNotification(newHabit.title, target, {
                        body: `Time for your habit: ${newHabit.title}`,
                        icon: '/vite.svg',
                        tag: newHabit.id,
                        id: newHabit.id
                    } as any);
                    showToast("Info", "Reminder Scheduled", { type: 'info' });

                } catch (remErr) {
                    console.error("Failed to auto-create reminder", remErr);
                }
            }

            loadData();
            // setIsCreateOpen(false); // Handled by Modal internally now
        } catch (error: any) {
            console.error("Create failed:", error);
            showToast("Error", `Initiation failed: ${error.message || 'System Error'}`, { type: 'error' });
        }
    };

    const handleUpdateHabit = async (data: any) => {
        if (!habitToEdit || !user) return;
        try {
            await HabitService.updateHabit(habitToEdit.id, data, user.id);
            showToast("Success", "Protocol Updated", { type: 'success' });
            loadData();
            setIsEditOpen(false);
        } catch (error: any) {
            console.error("Update failed:", error);
            showToast("Error", `Override failed: ${error.message || 'System Error'}`, { type: 'error' });
        }
    };

    const handleSaveReflection = async (mood: Mood, note: string) => {
        if (!user) return;
        const todayStr = new Date().toISOString().split('T')[0];
        await HabitService.saveReflection(todayStr, mood, note, user.id);
        loadData();
    };

    const openEditModal = (habit: Habit) => {
        setHabitToEdit(habit);
        setIsEditOpen(true);
    };

    const getHabitsByTime = (time: TimeOfDay) => habits.filter(h => h.timeOfDay === time && !h.archived);
    const getUncategorized = () => habits.filter(h => !h.timeOfDay && !h.archived);

    // Non-blocking loading state - we render the shell immediately
    // if (loading) { ... } removed to make app feel 10x faster


    return (
        <div className="p-4 md:p-8 animate-claude-in">
            <ConfirmModal {...confirmState} onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))} />
            <FocusTimer isOpen={isFocusOpen} onClose={() => setIsFocusOpen(false)} />
            <CreateHabitModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onSave={handleCreateHabit} mode="create" />
            <CreateHabitModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} onSave={handleUpdateHabit} initialData={habitToEdit} mode="edit" />
            <DayDetailModal isOpen={!!selectedDate} onClose={() => setSelectedDate(null)} date={selectedDate || ''} habits={habits} log={selectedDate ? logs[selectedDate] : ({} as any)} />
            <LevelUpModal isOpen={showLevelUp} onClose={() => setShowLevelUp(false)} level={xpStats.level} />
            {newAchievement && <NewAchievementModal isOpen={!!newAchievement} achievement={newAchievement} onClose={() => setNewAchievement(null)} />}
            {noteModal && noteModal.isOpen && <NoteModal isOpen={noteModal.isOpen} onClose={() => setNoteModal(null)} onSave={handleSaveNote} initialNote={noteModal.note} />}
            {skipModal && skipModal.isOpen && <SkipReasonModal isOpen={skipModal.isOpen} onClose={() => setSkipModal(null)} onConfirm={async (r) => { if (user) { await HabitService.skipHabit(skipModal!.habitId, new Date().toISOString().split('T')[0], r, user.id); loadData(); } setSkipModal(null); }} habitTitle={skipModal.title} />}

            {reminderModal && reminderModal.isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="relative w-full max-w-lg overflow-hidden translate-z-0">
                        <div className="p-8 md:p-10 bg-card border border-border shadow-2xl rounded-[3rem]">
                            <HabitReminder
                                habit={reminderModal.habit}
                                onClose={() => {
                                    setReminderModal(null);
                                    loadData();
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-4xl mx-auto space-y-4">
                {/* PWA Install Banner */}
                <PWABanner />

                {/* Header */}
                <div className="flex flex-col gap-4 animate-claude-in">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex-1">
                            <h1 className="text-4xl font-bold tracking-tight text-foreground mb-1">
                                Daily Rituals
                            </h1>
                            <div className="flex items-center gap-3 text-muted-foreground text-sm font-medium">
                                <span className="text-primary font-bold">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                <span className="opacity-20 text-foreground">|</span>
                                <span className="capitalize">{currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button onClick={() => setIsCreateOpen(true)} className="claude-button bg-primary text-white shadow-lg shadow-primary/20 h-11 px-8">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Ritual
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => setIsFocusOpen(true)} className="w-11 h-11 rounded-2xl border-border" title="Focus Timer">
                                <Timer className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                    <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(xpStats.currentXP / xpStats.nextLevelXP) * 100}%` }}
                            className="h-full bg-primary"
                        />
                    </div>
                </div>

                {/* Activity Pattern */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-xl font-bold tracking-tight text-foreground">Activity Pattern</h3>
                        <Button variant="ghost" size="sm" className="h-8 text-[11px] font-bold uppercase tracking-widest text-primary hover:bg-primary/5" onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}>
                            <CalendarIcon className="w-4 h-4 mr-2" />
                            History
                        </Button>
                    </div>
                    <div className="bg-card border border-border rounded-[2.5rem] p-8 shadow-sm">
                        <Heatmap logs={logs} daysMode="month" onDayClick={setSelectedDate} />
                    </div>
                </div>

                {/* Upcoming Quick View */}
                {reminders.filter(r => r.isEnabled).length > 0 && (
                    <div className="space-y-4 animate-claude-in">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground/50 flex items-center gap-2">
                                <Bell className="w-3.5 h-3.5 text-primary" />
                                Upcoming
                            </h3>
                            <Button variant="ghost" size="sm" onClick={() => navigate('/reminders')} className="text-[10px] font-bold uppercase tracking-widest text-primary/60 hover:text-primary">
                                Manage
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {reminders.filter(r => r.isEnabled).slice(0, 3).map(reminder => (
                                <div key={reminder.id} className="p-5 bg-card border border-border rounded-3xl flex items-center justify-between group hover:border-primary/30 transition-all shadow-sm">
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-foreground truncate">{reminder.title}</p>
                                        <p className="text-xs font-medium text-primary mt-1">{reminder.time}</p>
                                    </div>
                                    <div className="p-2 bg-secondary rounded-xl group-hover:bg-primary group-hover:text-white transition-all">
                                        <Bell className="w-4 h-4" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">
                    <div className="xl:col-span-2 space-y-8">
                        <SmartFeed />

                        {getUncategorized().length > 0 && (
                            <HabitSection title="Other Protocols" icon={<AlertCircle className="w-4 h-4 text-gray-500" />} habits={getUncategorized()} onToggle={toggleHabit} onDelete={handleArchiveHabit} onEdit={openEditModal} onNote={handleAddNote} onSkip={(h) => setSkipModal({ isOpen: true, habitId: h.id, title: h.title })} onReminder={(h) => setReminderModal({ isOpen: true, habit: { id: h.id, name: h.title } })} isWild={isWild} reminders={reminders} />
                        )}

                        {/* ZERO STATE / LOADING STATE */}
                        {loading ? (
                            <div className="space-y-6 animate-pulse">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="space-y-4">
                                        <div className="h-8 w-48 bg-secondary/50 rounded-lg" />
                                        <div className="space-y-3">
                                            <div className="h-24 w-full bg-card border border-border rounded-3xl" />
                                            <div className="h-24 w-full bg-card border border-border rounded-3xl" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : habits.length === 0 && (
                            <div className="p-16 bg-secondary/20 border-2 border-dashed border-border rounded-[3rem] text-center space-y-8 flex flex-col items-center justify-center min-h-[450px]">
                                <div className="w-20 h-20 rounded-[2rem] bg-background flex items-center justify-center shadow-xl">
                                    <Activity className="w-10 h-10 text-primary" />
                                </div>
                                <div className="space-y-3">
                                    <h2 className="text-3xl font-bold tracking-tight text-foreground">
                                        Your workspace is clear
                                    </h2>
                                    <p className="text-muted-foreground text-sm font-medium max-w-sm mx-auto leading-relaxed">
                                        Ready to begin your journey? Start by establishing your first ritual or exploring the academy.
                                    </p>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <Button
                                        size="lg"
                                        onClick={() => setIsCreateOpen(true)}
                                        className="claude-button bg-primary text-white shadow-xl shadow-primary/20 px-8"
                                    >
                                        <Plus className="w-5 h-5 mr-2" />
                                        Initialize Ritual
                                    </Button>
                                    <Button
                                        size="lg"
                                        variant="outline"
                                        onClick={() => navigate('/courses')}
                                        className="claude-button bg-background border-border px-8"
                                    >
                                        <BookOpen className="w-5 h-5 mr-2" />
                                        Visit Academy
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-12">
                            <HabitSection title="Morning Rituals" icon={<Sun className="w-6 h-6 text-amber-500" />} habits={getHabitsByTime('morning')} onToggle={toggleHabit} onDelete={handleArchiveHabit} onEdit={openEditModal} onNote={handleAddNote} onSkip={(h) => setSkipModal({ isOpen: true, habitId: h.id, title: h.title })} onReminder={(h) => setReminderModal({ isOpen: true, habit: { id: h.id, name: h.title } })} isWild={isWild} reminders={reminders} />
                            <HabitSection title="Afternoon Flow" icon={<CloudSun className="w-6 h-6 text-blue-500" />} habits={getHabitsByTime('afternoon')} onToggle={toggleHabit} onDelete={handleArchiveHabit} onEdit={openEditModal} onNote={handleAddNote} onSkip={(h) => setSkipModal({ isOpen: true, habitId: h.id, title: h.title })} onReminder={(h) => setReminderModal({ isOpen: true, habit: { id: h.id, name: h.title } })} isWild={isWild} reminders={reminders} />
                            <HabitSection title="Evening Cooldown" icon={<Moon className="w-6 h-6 text-indigo-500" />} habits={getHabitsByTime('evening')} onToggle={toggleHabit} onDelete={handleArchiveHabit} onEdit={openEditModal} onNote={handleAddNote} onSkip={(h) => setSkipModal({ isOpen: true, habitId: h.id, title: h.title })} onReminder={(h) => setReminderModal({ isOpen: true, habit: { id: h.id, name: h.title } })} isWild={isWild} reminders={reminders} />
                            <HabitSection title="Anytime" icon={<Star className="w-6 h-6 text-clay/60" />} habits={getHabitsByTime('anytime')} onToggle={toggleHabit} onDelete={handleArchiveHabit} onEdit={openEditModal} onNote={handleAddNote} onSkip={(h) => setSkipModal({ isOpen: true, habitId: h.id, title: h.title })} onReminder={(h) => setReminderModal({ isOpen: true, habit: { id: h.id, name: h.title } })} isWild={isWild} reminders={reminders} />
                        </div>
                    </div>
                </div>

                {/* Debug View (Hidden unless no habits show up in main sections) */}
                {habits.length > 0 && getHabitsByTime('morning').length === 0 && getHabitsByTime('afternoon').length === 0 && getHabitsByTime('evening').length === 0 && getHabitsByTime('anytime').length === 0 && getUncategorized().length === 0 && (
                    <div className="p-8 border-4 border-dashed border-primary/20 bg-primary/5">
                        <h2 className="text-xl font-black uppercase mb-4">Master Protocol List (Debug)</h2>
                        <p className="text-xs mb-4 opacity-70">If your habit is here but not above, it's a categorization error.</p>
                        <HabitSection title="All Detected Protocols" icon={<Activity className="w-5 h-5" />} habits={habits} onToggle={toggleHabit} onDelete={handleArchiveHabit} onEdit={openEditModal} onNote={handleAddNote} onSkip={(h) => setSkipModal({ isOpen: true, habitId: h.id, title: h.title })} onReminder={(h) => setReminderModal({ isOpen: true, habit: { id: h.id, name: h.title } })} isWild={isWild} reminders={reminders} />
                    </div>
                )}

                <div className="pt-12 border-t-2 border-primary/20">
                    <DailyCheckin onSave={handleSaveReflection} />
                </div>
            </div>
        </div>
    );
}

interface HabitSectionProps {
    title: string;
    icon: React.ReactNode;
    habits: Habit[];
    onToggle: (id: string, note?: string) => void;
    onDelete: (id: string) => void;
    onEdit: (habit: Habit) => void;
    onNote: (id: string) => void;
    onSkip: (habit: Habit) => void;
    onReminder: (habit: Habit) => void;
    isWild: boolean;
    reminders: Reminder[];
}

import { ThemedCard } from '../components/ui/ThemedCard';

function HabitSection({ title, icon, habits, onToggle, onDelete, onEdit, onNote, onSkip, onReminder, isWild, reminders }: HabitSectionProps) {
    const [isOpen, setIsOpen] = useState(false);

    if (habits.length === 0) return null;

    const visibleHabits = isOpen ? habits : habits.slice(0, 3);
    const hasMore = habits.length > 3;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between border-l-4 border-primary pl-4">
                <h2 className={`text-xl font-black uppercase tracking-tighter flex items-center gap-2 ${isWild ? 'animate-glitch' : ''}`}>
                    {icon} {title} <span className="text-xs opacity-50 ml-2">[{habits.length}]</span>
                </h2>
                {hasMore && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsOpen(!isOpen)}
                        className={`text-[10px] uppercase font-bold tracking-widest ${isWild ? 'rounded-none hover:bg-primary hover:text-black' : ''}`}
                    >
                        {isOpen ? 'Minimize' : 'Expand All'}
                    </Button>
                )}
            </div>

            <div className="grid gap-4">
                {visibleHabits.map(habit => (
                    <ThemedCard
                        key={habit.id}
                        hoverable={!habit.completedToday}
                        className={habit.completedToday ? 'opacity-40 grayscale pointer-events-none' : ''}
                        noPadding
                    >
                        <div className="flex items-center justify-between p-4">

                            <div className="flex items-center gap-4">
                                <button onClick={() => onToggle(habit.id)} className={`w-10 h-10 flex items-center justify-center transition-all rounded-xl border-2 ${habit.completedToday ? 'bg-primary border-primary text-white' : 'border-border hover:border-primary/50 text-transparent'}`}>
                                    <Check className="w-5 h-5" />
                                </button>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className={`text-xl font-bold tracking-tight ${habit.completedToday ? 'line-through opacity-40 text-foreground' : 'text-foreground'}`}>{habit.title}</h3>
                                        {habit.type === 'goal' && <Target className="w-4 h-4 text-primary" />}
                                    </div>
                                    <div className="flex items-center gap-4 text-[11px] font-bold uppercase tracking-widest text-foreground/80">
                                        <span className="flex items-center gap-1.5"><Activity className="w-3 h-3" /> {habit.streak} Day Streak</span>
                                        {reminders.find(r => r.habitId === habit.id && r.isEnabled) && (
                                            <span className="text-primary flex items-center gap-1.5">
                                                <Bell className="w-3 h-3" />
                                                {reminders.find(r => r.habitId === habit.id && r.isEnabled)?.time}
                                            </span>
                                        )}
                                        {habit.isLocked && <span className="text-amber-600">Locked</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => onReminder(habit)} className="w-10 h-10 flex items-center justify-center bg-secondary text-foreground/60 hover:bg-primary hover:text-white rounded-xl transition-all" title="Reminders"><Bell className="w-4 h-4" /></button>
                                <button onClick={() => onSkip(habit)} className="w-10 h-10 flex items-center justify-center hover:bg-secondary transition-all rounded-xl text-muted-foreground" title="Skip"><CalendarOff className="w-4 h-4" /></button>
                                <button onClick={() => onNote(habit.id)} className="w-10 h-10 flex items-center justify-center hover:bg-secondary transition-all rounded-xl text-muted-foreground" title="Note"><StickyNote className="w-4 h-4" /></button>
                                <button onClick={() => onEdit(habit)} className="w-10 h-10 flex items-center justify-center hover:bg-secondary transition-all rounded-xl text-muted-foreground" title="Edit"><Plus className="w-4 h-4 rotate-45" /></button>
                                <button onClick={() => onDelete(habit.id)} className="w-10 h-10 flex items-center justify-center hover:bg-red-50 text-red-400 rounded-xl transition-all" title="Archive"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>

                        {/* Goal Progress Bar */}
                        {habit.type === 'goal' && (
                            <div className="px-4 pb-3 space-y-1">
                                <div className="flex justify-between text-[7px] uppercase font-black opacity-50 tracking-widest">
                                    <span>Sync Progress</span>
                                    <span>{habit.goalProgress}/{habit.goalDuration}</span>
                                </div>
                                <div className="h-0.5 w-full bg-muted/20 overflow-hidden">
                                    <div className="h-full bg-primary" style={{ width: `${Math.min(100, ((habit.goalProgress || 0) / (habit.goalDuration || 1)) * 100)}%` }} />
                                </div>
                            </div>
                        )}
                    </ThemedCard>
                ))}
            </div>

            {hasMore && !isOpen && (
                <div
                    onClick={() => setIsOpen(true)}
                    className="text-center cursor-pointer p-2 border-b-2 border-dashed border-primary/20 hover:border-primary/50 text-[10px] uppercase font-black tracking-[0.2em] text-muted-foreground hover:text-primary transition-all"
                >
                    + {habits.length - 3} Hidden Protocols
                </div>
            )}
        </div>
    );
}
