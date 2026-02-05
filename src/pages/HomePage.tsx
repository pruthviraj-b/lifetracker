
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/ui/Button';
import {
    Activity, StickyNote, Bell,
    Youtube, Trophy, TrendingUp,
    GraduationCap, Network
} from 'lucide-react';
import { WidgetGrid } from '../components/dashboard/WidgetGrid';
import { HabitService } from '../services/habit.service';
import { ReminderService } from '../services/reminder.service';
import { Reminder } from '../types/reminder';

// --- Standard Naming & Icons (Red Theme) ---
const HUB_MODULES = [
    {
        id: 'protocols',
        label: 'Protocols',
        sub: 'Daily Habits',
        icon: Activity,
        path: '/protocols',
        color: 'text-red-500',
        bg: 'bg-red-500/10'
    },
    {
        id: 'notes',
        label: 'Notes',
        sub: 'Journal & Ideas',
        icon: StickyNote,
        path: '/notes',
        color: 'text-red-500',
        bg: 'bg-red-500/10'
    },
    {
        id: 'courses',
        label: 'Academy',
        sub: 'Courses & Skills',
        icon: GraduationCap,
        path: '/courses',
        color: 'text-red-500',
        bg: 'bg-red-500/10'
    },
    {
        id: 'analytics',
        label: 'Analytics',
        sub: 'Stats & Trends',
        icon: TrendingUp,
        path: '/analytics',
        color: 'text-red-500',
        bg: 'bg-red-500/10'
    },
    {
        id: 'reminders',
        label: 'Reminders',
        sub: 'Alerts & Notifications',
        icon: Bell,
        path: '/reminders',
        color: 'text-red-500',
        bg: 'bg-red-500/10'
    },
    {
        id: 'youtube',
        label: 'Library',
        sub: 'Saved Videos',
        icon: Youtube,
        path: '/youtube',
        color: 'text-red-500',
        bg: 'bg-red-500/10'
    },
    {
        id: 'achievements',
        label: 'Trophies',
        sub: 'Milestones',
        icon: Trophy,
        path: '/achievements',
        color: 'text-red-500',
        bg: 'bg-red-500/10'
    },
    {
        id: 'network',
        label: 'Network',
        sub: 'Connections',
        icon: Network,
        path: '/network',
        color: 'text-red-500',
        bg: 'bg-red-500/10'
    }
];

// --- Central Hub Components (Authenticated) ---

const CentralHub = ({ navigate, isWild, user }: { navigate: any, isWild: boolean, user: any }) => {
    const [habits, setHabits] = useState<any[]>([]);
    const [nextReminder, setNextReminder] = useState<{ title: string; time: string } | null>(null);
    const [stats, setStats] = useState({ percentage: 0, total: 0, completed: 0 });
    const [streakData, setStreakData] = useState<number[]>([]);

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                // 1. Load Habits & Stats
                const habitsData = await HabitService.getHabits();
                const completedCount = habitsData.filter(h => h.completedToday).length;

                setHabits(habitsData.map(h => ({
                    id: h.id,
                    title: h.title,
                    completed: h.completedToday
                })));

                setStats({
                    total: habitsData.length,
                    completed: completedCount,
                    percentage: habitsData.length > 0 ? Math.round((completedCount / habitsData.length) * 100) : 0
                });

                // 2. Load Next Reminder
                const reminders = await ReminderService.getReminders();
                const activeReminders = reminders.filter((r: Reminder) => r.isEnabled);
                if (activeReminders.length > 0) {
                    const sorted = activeReminders.sort((a, b) => a.time.localeCompare(b.time));
                    setNextReminder({ title: sorted[0].title, time: sorted[0].time });
                }

                // 3. Mock Streak Data
                setStreakData([1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1]);

            } catch (error) {
                console.error("Dashboard load failed:", error);
            }
        };

        loadDashboardData();
    }, []);

    const handleQuickLog = async (id: string) => {
        try {
            const today = new Date().toISOString().split('T')[0];
            await HabitService.toggleHabitCompletion(id, today, true);
            setHabits(prev => prev.map(h => h.id === id ? { ...h, completed: true } : h));
            setStats(prev => {
                const newCompleted = prev.completed + 1;
                return {
                    ...prev,
                    completed: newCompleted,
                    percentage: Math.round((newCompleted / prev.total) * 100)
                };
            });
        } catch (error) {
            console.error("Quick log failed:", error);
        }
    };

    return (
        <div className={`min-h-screen bg-[#0a0000] p-4 md:p-8 ${isWild ? 'wild' : ''}`}>
            {isWild && <div className="vignette fixed inset-0 pointer-events-none z-50 opacity-50 bg-red-500/5 mix-blend-overlay" />}

            <div className="max-w-6xl mx-auto space-y-8">
                <header className="flex items-center justify-between border-b border-white/5 pb-6">
                    <div className="space-y-1">
                        <motion.h1
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className="text-2xl font-black text-red-600 tracking-tighter uppercase italic"
                        >
                            Central Hub
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-[9px] font-mono text-red-900/60 uppercase tracking-[0.4em]"
                        >
                            Operator: {user?.name || 'Unknown'} // Status: Optimal
                        </motion.p>
                    </div>
                </header>

                <WidgetGrid
                    stats={stats}
                    nextReminder={nextReminder}
                    streakData={streakData}
                    habits={habits}
                    onLog={handleQuickLog}
                />

                <div className="space-y-4">
                    <div className="flex items-center gap-2 px-2 border-l-2 border-red-600">
                        <span className="text-[10px] font-black uppercase tracking-widest text-red-900/80">Manual Override Modules</span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {HUB_MODULES.map((mod, i) => {
                            return (
                                <motion.div
                                    key={mod.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.3, delay: i * 0.05 }}
                                    onClick={() => navigate(mod.path)}
                                    className={`
                                        group relative py-6 flex flex-col items-center justify-center gap-3
                                        bg-[#050505] border border-white/5 rounded-2xl cursor-pointer
                                        hover:border-red-500/30 hover:bg-white/[0.02] transition-all duration-300
                                    `}
                                >
                                    <div className={`
                                        w-12 h-12 rounded-xl flex items-center justify-center
                                        ${mod.bg} ${mod.color}
                                        transition-transform duration-300 group-hover:scale-105
                                    `}>
                                        <mod.icon strokeWidth={1.5} className="w-6 h-6" />
                                    </div>

                                    <div className="text-center">
                                        <h2 className="text-xs font-black text-gray-200 group-hover:text-white uppercase tracking-wider transition-colors">
                                            {mod.label}
                                        </h2>
                                        <p className="text-[8px] text-red-900/40 uppercase tracking-widest font-bold">
                                            {mod.sub}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Kinetic Landing Components (Unauthenticated) ---

const KineticLanding = ({ navigate, isWild }: { navigate: any, isWild: boolean }) => {
    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#0a0000] overflow-hidden relative selection:bg-red-500 selection:text-white">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(220,38,38,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(220,38,38,0.05)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_100%)] pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 1 }}
                    className="relative"
                >
                    <h1 className="text-[12vw] md:text-[150px] font-black tracking-tighter leading-[0.8] text-red-600 select-none drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]">
                        AWAKEN
                    </h1>
                </motion.div>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="mt-8 flex flex-col items-center gap-6"
                >
                    <p className="text-sm md:text-base font-mono uppercase tracking-[0.5em] text-red-900/60 text-center max-w-md leading-relaxed">
                        The Habit Is Not The Goal.<br />
                        <span className="text-red-500">Consciousness Is.</span>
                    </p>

                    <Button
                        onClick={() => navigate('/login')}
                        className="group relative px-8 py-3 bg-red-600 text-white font-bold uppercase tracking-widest hover:bg-red-700 transition-colors rounded-none overflow-hidden"
                    >
                        <span className="relative z-10">Initiate Sequence</span>
                    </Button>
                </motion.div>
            </div>
        </div>
    );
};

export default function HomePage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { preferences } = useTheme();
    const isWild = preferences.wild_mode;

    if (user) {
        return <CentralHub navigate={navigate} isWild={isWild} user={user} />;
    } else {
        return <KineticLanding navigate={navigate} isWild={isWild} />;
    }
}
