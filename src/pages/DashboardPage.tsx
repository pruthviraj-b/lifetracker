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
import { useNavigate } from 'react-router-dom';
import { HabitService } from '../services/habit.service';
import {
    Check, Sun, CloudSun, Moon, Timer, Plus, Trash2,
    Calendar as CalendarIcon, StickyNote, Trophy, Activity,
    Share2, TrendingUp, Target, Star, CalendarOff, Home, AlertCircle
} from 'lucide-react';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { SkipReasonModal } from '../components/tools/SkipReasonModal';
import { SmartFeed } from '../components/dashboard/SmartFeed';
import { NewAchievementModal } from '../components/gamification/NewAchievementModal';
import { Achievement } from '../services/achievement.service';
import { useTheme } from '../context/ThemeContext';

export default function DashboardPage() {
    const { logout } = useAuth();
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
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    // Data State
    const [habits, setHabits] = useState<Habit[]>([]);
    const [logs, setLogs] = useState<Record<string, DayLog>>({});
    const [todayNotes, setTodayNotes] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    // XP & Gamification
    const [xpStats, setXpStats] = useState({ level: 1, currentXP: 0, nextLevelXP: 100 });
    const [showLevelUp, setShowLevelUp] = useState(false);
    const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);
    const prevLevelRef = useRef(1);

    useEffect(() => {
        if (xpStats.level > prevLevelRef.current) setShowLevelUp(true);
        prevLevelRef.current = xpStats.level;
    }, [xpStats.level]);

    useEffect(() => {
        loadData();
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const todayStr = new Date().toISOString().split('T')[0];
            const lastYearStr = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            const [fetchedHabits, fetchedLogs, fetchedReflections, profile] = await Promise.all([
                HabitService.getHabits(),
                HabitService.getLogs(lastYearStr, todayStr),
                HabitService.getReflections(lastYearStr, todayStr),
                HabitService.getProfile()
            ]);

            if (profile) {
                setXpStats({
                    level: profile.level,
                    currentXP: profile.current_xp,
                    nextLevelXP: profile.next_level_xp
                });
            }

            const logsMap: Record<string, DayLog> = {};
            const todaysCompletedIds = new Set<string>();
            const notesMap: Record<string, string> = {};

            fetchedLogs.forEach((log: any) => {
                const date = log.date;
                if (!logsMap[date]) logsMap[date] = { date, completedHabitIds: [], totalHabits: fetchedHabits.length };
                logsMap[date].completedHabitIds.push(log.habit_id);
                if (date === todayStr) {
                    todaysCompletedIds.add(log.habit_id);
                    if (log.note) notesMap[log.habit_id] = log.note;
                }
            });

            fetchedReflections.forEach((ref: any) => {
                const date = ref.date;
                if (!logsMap[date]) logsMap[date] = { date, completedHabitIds: [], totalHabits: fetchedHabits.length };
                logsMap[date].mood = ref.mood;
                logsMap[date].journalEntry = ref.note;
            });

            setLogs(logsMap);
            setTodayNotes(notesMap);

            const fetchedSkips = await HabitService.getSkips(lastYearStr, todayStr);
            const todaySkips = new Set(fetchedSkips.filter(s => s.date === todayStr).map(s => s.habit_id));

            setHabits(fetchedHabits.map(h => ({
                ...h,
                completedToday: todaysCompletedIds.has(h.id),
                skippedToday: todaySkips.has(h.id)
            })));
        } catch (error) {
            console.error("Failed to load dashboard:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleHabit = async (id: string, note?: string) => {
        const todayStr = new Date().toISOString().split('T')[0];
        const habitToToggle = habits.find(h => h.id === id);
        if (!habitToToggle) return;

        const isNowCompleted = !habitToToggle.completedToday;

        // Optimistic UI
        setHabits(prev => prev.map(h => h.id === id ? { ...h, completedToday: isNowCompleted } : h));

        try {
            const result = await HabitService.toggleHabitCompletion(id, todayStr, isNowCompleted, note);
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
                await HabitService.archiveHabit(id);
                loadData();
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
            await HabitService.createHabit(data);
            showToast("Success", "Protocol Initiated", { type: 'success' });
            loadData();
            setIsCreateOpen(false);
        } catch (error: any) {
            console.error("Create failed:", error);
            showToast("Error", `Initiation failed: ${error.message || 'System Error'}`, { type: 'error' });
        }
    };

    const handleUpdateHabit = async (data: any) => {
        if (!habitToEdit) return;
        try {
            await HabitService.updateHabit(habitToEdit.id, data);
            showToast("Success", "Protocol Updated", { type: 'success' });
            loadData();
            setIsEditOpen(false);
        } catch (error: any) {
            console.error("Update failed:", error);
            showToast("Error", `Override failed: ${error.message || 'System Error'}`, { type: 'error' });
        }
    };

    const handleSaveReflection = async (mood: Mood, note: string) => {
        const todayStr = new Date().toISOString().split('T')[0];
        await HabitService.saveReflection(todayStr, mood, note);
        loadData();
    };

    const openEditModal = (habit: Habit) => {
        setHabitToEdit(habit);
        setIsEditOpen(true);
    };

    const getHabitsByTime = (time: TimeOfDay) => habits.filter(h => h.timeOfDay === time && !h.archived);
    const getUncategorized = () => habits.filter(h => !h.timeOfDay && !h.archived);

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-8 animate-pulse">
                <div className="text-center space-y-4">
                    <div className="text-4xl md:text-6xl font-black italic tracking-tighter text-primary animate-glitch uppercase">Initializing Ritual OS...</div>
                    <div className="h-1 w-64 bg-primary mx-auto"></div>
                    <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Auth_Token: Verified | System_Check: Optimal</div>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen bg-background relative selection:bg-primary selection:text-black ${isWild ? 'wild font-mono' : ''}`}>
            {isWild && <div className="vignette pointer-events-none" />}

            <div className="relative z-10 p-4 md:p-8">
                <ConfirmModal {...confirmState} onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))} />
                <FocusTimer isOpen={isFocusOpen} onClose={() => setIsFocusOpen(false)} />
                <CreateHabitModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onSave={handleCreateHabit} mode="create" />
                <CreateHabitModal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} onSave={handleUpdateHabit} initialData={habitToEdit} mode="edit" />
                <DayDetailModal isOpen={!!selectedDate} onClose={() => setSelectedDate(null)} date={selectedDate || ''} habits={habits} log={selectedDate ? logs[selectedDate] : undefined} />
                <LevelUpModal isOpen={showLevelUp} onClose={() => setShowLevelUp(false)} level={xpStats.level} />
                {newAchievement && <NewAchievementModal isOpen={!!newAchievement} achievement={newAchievement} onClose={() => setNewAchievement(null)} />}
                {noteModal && <NoteModal isOpen={noteModal.isOpen} onClose={() => setNoteModal(null)} onSave={handleSaveNote} initialNote={noteModal.note} />}
                {skipModal && <SkipReasonModal isOpen={skipModal.isOpen} onClose={() => setSkipModal(null)} onConfirm={async (r) => { await HabitService.skipHabit(skipModal.habitId, new Date().toISOString().split('T')[0], r); loadData(); setSkipModal(null); }} habitTitle={skipModal.title} />}

                <div className="max-w-4xl mx-auto space-y-12">
                    {/* Header */}
                    <div className={`flex flex-col gap-6 ${isWild ? 'animate-reveal' : ''}`}>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h1 className={`text-4xl md:text-6xl font-black tracking-tighter uppercase ${isWild ? 'animate-glitch italic' : ''}`}>Ritual OS</h1>
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold border ${isWild ? 'bg-primary text-black border-primary line-through' : 'bg-primary text-primary-foreground border-primary'}`}>VER 2.0.4</span>
                                </div>
                                <div className="flex items-center gap-3 text-muted-foreground text-sm font-mono">
                                    <span className="text-primary">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    <span>|</span>
                                    <span className="uppercase">{currentTime.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button variant="outline" size="sm" onClick={() => navigate('/')} className={isWild ? 'rounded-none border-2' : ''} title="Home Center"><Home className="w-4 h-4 mr-2" />Hub</Button>
                                <Button variant="outline" size="icon" onClick={() => navigate('/achievements')} title="Achievements" className={isWild ? 'rounded-none border-2' : ''}><Trophy className="w-4 h-4" /></Button>
                                <Button variant="outline" size="icon" onClick={() => navigate('/network')} title="Habit Network" className={isWild ? 'rounded-none border-2' : ''}><Share2 className="w-4 h-4" /></Button>
                                <Button variant="outline" size="sm" onClick={() => setIsFocusOpen(true)} className={isWild ? 'rounded-none border-2' : ''}><Timer className="w-4 h-4 mr-2" />Focus</Button>
                                <Button variant="outline" size="sm" onClick={() => navigate('/analytics')} className={isWild ? 'rounded-none border-2' : ''}><TrendingUp className="w-4 h-4 mr-2" />Stats</Button>
                                <Button size="sm" onClick={() => setIsCreateOpen(true)} className={isWild ? 'rounded-none' : ''}><Plus className="w-4 h-4 mr-2" />New</Button>
                                <Button variant="ghost" size="sm" onClick={() => logout()} className={isWild ? 'rounded-none hover:bg-primary/20' : ''}>Sign out</Button>
                            </div>
                        </div>
                        <div className="w-full bg-muted/30 h-1 rounded-full overflow-hidden relative">
                            <div className="absolute top-0 left-0 h-full bg-primary transition-all duration-700" style={{ width: `${(xpStats.currentXP / xpStats.nextLevelXP) * 100}%` }} />
                        </div>
                        <div className="flex items-center gap-4 text-[8px] font-black uppercase tracking-[0.2em] opacity-50">
                            <span>Detected_Sequences: {habits.length}</span>
                            <span>|</span>
                            <span>Active_Logs: {Object.keys(logs).length}</span>
                            <span>|</span>
                            <span>System_Status: {habits.length > 0 ? 'NOMINAL' : 'AWAITING_DATA'}</span>
                        </div>
                    </div>

                    {/* Consistency Map */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className={`text-lg font-black uppercase tracking-tighter ${isWild ? 'animate-glitch' : ''}`}>Consistency Map</h3>
                            <Button variant="outline" size="sm" onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}><CalendarIcon className="w-4 h-4 mr-2" />History</Button>
                        </div>
                        <Heatmap logs={logs} onDayClick={setSelectedDate} />
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
                        <div className="xl:col-span-2 space-y-12">
                            <SmartFeed />

                            {getUncategorized().length > 0 && (
                                <HabitSection title="Uncategorized Protocols" icon={<AlertCircle className="w-5 h-5 text-gray-500" />} habits={getUncategorized()} onToggle={toggleHabit} onDelete={handleArchiveHabit} onEdit={openEditModal} onNote={handleAddNote} onSkip={(h) => setSkipModal({ isOpen: true, habitId: h.id, title: h.title })} isWild={isWild} />
                            )}

                            <div className="space-y-16">
                                <HabitSection title="Morning Flow" icon={<Sun className="w-5 h-5 text-orange-500" />} habits={getHabitsByTime('morning')} onToggle={toggleHabit} onDelete={handleArchiveHabit} onEdit={openEditModal} onNote={handleAddNote} onSkip={(h) => setSkipModal({ isOpen: true, habitId: h.id, title: h.title })} isWild={isWild} />
                                <HabitSection title="Afternoon High" icon={<CloudSun className="w-5 h-5 text-blue-500" />} habits={getHabitsByTime('afternoon')} onToggle={toggleHabit} onDelete={handleArchiveHabit} onEdit={openEditModal} onNote={handleAddNote} onSkip={(h) => setSkipModal({ isOpen: true, habitId: h.id, title: h.title })} isWild={isWild} />
                                <HabitSection title="Night Fall" icon={<Moon className="w-5 h-5 text-indigo-500" />} habits={getHabitsByTime('evening')} onToggle={toggleHabit} onDelete={handleArchiveHabit} onEdit={openEditModal} onNote={handleAddNote} onSkip={(h) => setSkipModal({ isOpen: true, habitId: h.id, title: h.title })} isWild={isWild} />
                                <HabitSection title="Anytime Protocols" icon={<Star className="w-5 h-5 text-purple-500" />} habits={getHabitsByTime('anytime')} onToggle={toggleHabit} onDelete={handleArchiveHabit} onEdit={openEditModal} onNote={handleAddNote} onSkip={(h) => setSkipModal({ isOpen: true, habitId: h.id, title: h.title })} isWild={isWild} />
                            </div>
                        </div>
                    </div>

                    {/* Debug View (Hidden unless no habits show up in main sections) */}
                    {habits.length > 0 && getHabitsByTime('morning').length === 0 && getHabitsByTime('afternoon').length === 0 && getHabitsByTime('evening').length === 0 && getHabitsByTime('anytime').length === 0 && getUncategorized().length === 0 && (
                        <div className="p-8 border-4 border-dashed border-primary/20 bg-primary/5">
                            <h2 className="text-xl font-black uppercase mb-4">Master Protocol List (Debug)</h2>
                            <p className="text-xs mb-4 opacity-70">If your habit is here but not above, it's a categorization error.</p>
                            <HabitSection title="All Detected Protocols" icon={<Activity className="w-5 h-5" />} habits={habits} onToggle={toggleHabit} onDelete={handleArchiveHabit} onEdit={openEditModal} onNote={handleAddNote} onSkip={(h) => setSkipModal({ isOpen: true, habitId: h.id, title: h.title })} isWild={isWild} />
                        </div>
                    )}

                    <div className="pt-12 border-t-2 border-primary/20">
                        <DailyCheckin onSave={handleSaveReflection} />
                    </div>
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
    isWild: boolean;
}

function HabitSection({ title, icon, habits, onToggle, onDelete, onEdit, onNote, onSkip, isWild }: HabitSectionProps) {
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
                    <div key={habit.id} className={`
                        relative group flex flex-col p-6 transition-all border-2
                        ${isWild ? 'rounded-none bg-black border-primary' : 'rounded-[2rem] bg-card border-border shadow-md'}
                        ${habit.completedToday ? 'opacity-40 grayscale pointer-events-none' : 'hover:border-primary'}
                    `}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <button onClick={() => onToggle(habit.id)} className={`w-8 h-8 flex items-center justify-center transition-all border-2 ${habit.completedToday ? 'bg-primary border-primary text-black' : 'border-primary text-transparent'}`}>
                                    <Check className="w-6 h-6" />
                                </button>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className={`text-lg font-black uppercase tracking-tight ${habit.completedToday ? 'line-through' : ''}`}>{habit.title}</h3>
                                        {habit.type === 'goal' && <Target className="w-3 h-3 text-primary" />}
                                    </div>
                                    <div className="flex items-center gap-4 text-[10px] font-bold uppercase opacity-60">
                                        <span>Streak: {habit.streak}D</span>
                                        <span>Priority: {habit.priority}</span>
                                        {habit.isLocked && <span className="text-primary animate-pulse">Locked</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => onSkip(habit)} className="p-2 hover:bg-primary hover:text-black transition-all" title="Skip Protocol"><CalendarOff className="w-4 h-4" /></button>
                                <button onClick={() => onNote(habit.id)} className="p-2 hover:bg-primary hover:text-black transition-all" title="Add Note"><StickyNote className="w-4 h-4" /></button>
                                <button onClick={() => onEdit(habit)} className="p-2 hover:bg-primary hover:text-black transition-all" title="Edit Sequence"><Plus className="w-4 h-4 rotate-45" /></button>
                                <button onClick={() => onDelete(habit.id)} className="p-2 hover:bg-primary hover:text-black transition-all" title="Archive"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>

                        {/* Goal Progress Bar */}
                        {habit.type === 'goal' && (
                            <div className="mt-4 space-y-1">
                                <div className="flex justify-between text-[8px] uppercase font-black opacity-50 tracking-widest">
                                    <span>Goal Progress</span>
                                    <span>{habit.goalProgress}/{habit.goalDuration} Units</span>
                                </div>
                                <div className="h-0.5 w-full bg-muted/20 overflow-hidden">
                                    <div className="h-full bg-primary" style={{ width: `${Math.min(100, ((habit.goalProgress || 0) / (habit.goalDuration || 1)) * 100)}%` }} />
                                </div>
                            </div>
                        )}
                    </div>
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
