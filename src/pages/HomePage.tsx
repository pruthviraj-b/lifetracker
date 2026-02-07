
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Button } from '../components/ui/Button';
import {
    Activity, StickyNote, Bell,
    Youtube, Trophy, TrendingUp,
    GraduationCap, Network, Eye,
    Plus, ChevronRight, Globe, BookOpen, Search
} from 'lucide-react';
import { AdvancedSearch } from '../components/ui/AdvancedSearch';
import { WidgetGrid } from '../components/dashboard/WidgetGrid';
import { HabitService } from '../services/habit.service';
import { ReminderService } from '../services/reminder.service';
import { Reminder } from '../types/reminder';

// --- Standard Naming & Icons (Red Theme) ---
const HUB_MODULES = [
    {
        id: 'protocols',
        label: 'Daily Rituals',
        sub: 'Habits & Practice',
        icon: Activity,
        path: '/protocols',
    },
    {
        id: 'notes',
        label: 'Knowledge Base',
        sub: 'Notes & Resources',
        icon: StickyNote,
        path: '/notes',
    },
    {
        id: 'courses',
        label: 'Academy',
        sub: 'Learning Paths',
        icon: GraduationCap,
        path: '/courses',
    },
    {
        id: 'analytics',
        label: 'Insights',
        sub: 'Data & Trends',
        icon: TrendingUp,
        path: '/analytics',
    },
    {
        id: 'reminders',
        label: 'Schedule',
        sub: 'Daily Reminders',
        icon: Bell,
        path: '/reminders',
    },
    {
        id: 'youtube',
        label: 'Library',
        sub: 'Video Archive',
        icon: Youtube,
        path: '/youtube',
    },
    {
        id: 'achievements',
        label: 'Progress',
        sub: 'Milestones',
        icon: Trophy,
        path: '/achievements',
    },
    {
        id: 'network',
        label: 'Community',
        sub: 'Shared Journeys',
        icon: Network,
        path: '/network',
    }
];

import { ThemedCard } from '../components/ui/ThemedCard';



const CentralHub = ({ navigate, isWild, user }: { navigate: any, isWild: boolean, user: any }) => {
    const [habits, setHabits] = useState<any[]>([]);
    const [nextReminder, setNextReminder] = useState<{ title: string; time: string } | null>(null);
    const [allReminders, setAllReminders] = useState<Reminder[]>([]);
    const [stats, setStats] = useState({ percentage: 0, total: 0, completed: 0 });
    const [streakData, setStreakData] = useState<number[]>([]);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    // Removed: const [isChatOpen, setIsChatOpen] = useState(false);

    // Live clock update
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                const habitsData = await HabitService.getHabits();
                const completedCount = habitsData.filter(h => h.completedToday).length;
                setHabits(habitsData.map(h => ({ id: h.id, title: h.title, completed: h.completedToday })));
                setStats({ total: habitsData.length, completed: completedCount, percentage: habitsData.length > 0 ? Math.round((completedCount / habitsData.length) * 100) : 0 });
                const remindersData = await ReminderService.getReminders();
                const activeReminders = remindersData.filter((r: Reminder) => r.isEnabled);
                setAllReminders(activeReminders);
                if (activeReminders.length > 0) {
                    const sorted = [...activeReminders].sort((a, b) => a.time.localeCompare(b.time));
                    setNextReminder({ title: sorted[0].title, time: sorted[0].time });
                }
                setStreakData([1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 0, 1, 1, 1]);
            } catch (error) { console.error("Dashboard load failed:", error); }
        };
        loadDashboardData();
    }, []);

    const handleQuickLog = async (id: string) => {
        try {
            const today = new Date().toISOString().split('T')[0];
            await HabitService.toggleHabitCompletion(id, today, true);
            setHabits(prev => prev.map(h => h.id === id ? { ...h, completed: true } : h));
            setStats(prev => { const newCompleted = prev.completed + 1; return { ...prev, completed: newCompleted, percentage: Math.round((newCompleted / prev.total) * 100) }; });
        } catch (error) { console.error("Quick log failed:", error); }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-start pt-8 md:pt-20 px-4 md:px-8 space-y-6 md:space-y-12 max-w-5xl mx-auto animate-claude-in relative pb-24 md:pb-8">
            {isSearchOpen && <AdvancedSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />}
            {/* SmartChat removed - Use CMD+K for unified search */}

            {/* 1. Authentic RITU OS Header */}
            <div className="w-full flex flex-col items-start space-y-3 md:space-y-4">
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="px-3 py-1 bg-secondary/50 border border-border/50 rounded-md text-[8px] md:text-[9px] font-mono text-muted-foreground/70"
                >
                    {currentTime.toLocaleString('en-IN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false
                    })}
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                    className="flex items-center gap-2 md:gap-3"
                >
                    <div className="w-6 h-6 md:w-8 md:h-8 text-primary flex-shrink-0">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                            <path d="M12,2L14.4,9.5L22,12L14.4,14.5L12,22L9.6,14.5L2,12L9.6,9.5L12,2Z" />
                        </svg>
                    </div>
                    <h1 className="text-xl md:text-4xl font-bold font-serif text-foreground tracking-tight">
                        RITU OS
                    </h1>
                </motion.div>

                {/* Buttons removed: Use CMD+K for search */}
            </div>

            {/* 2. Authentic Large Input - matching Image 1 */}
            <div className="w-full max-w-3xl space-y-4">
                <div className="claude-input-container relative min-h-[100px] md:min-h-[160px] flex flex-col">
                    <textarea
                        className="w-full bg-transparent resize-none outline-none text-base md:text-lg text-foreground/80 placeholder:text-muted-foreground/60 p-2"
                        placeholder="How can I help you today?"
                        rows={2}
                        onClick={() => setIsSearchOpen(true)}
                        readOnly
                    />
                    <div className="mt-auto flex items-center justify-between">
                        <button className="p-1 md:p-2 hover:bg-secondary rounded-lg transition-colors overflow-hidden group">
                            <Plus className="w-5 h-5 md:w-6 md:h-6 text-foreground/40 group-hover:text-primary transition-colors" />
                        </button>
                        <div className="flex items-center gap-3 md:gap-4">
                            <div className="flex items-center gap-1.5 md:gap-2 text-[8px] md:text-[10px] font-bold text-primary px-2 md:px-3 py-1 md:py-1.5 bg-primary/5 border border-primary/10 rounded-lg cursor-default">
                                <span className="relative flex h-1.5 w-1.5 md:h-2 md:w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 md:h-2 md:w-2 bg-primary"></span>
                                </span>
                                RITU CORE
                            </div>
                            {/* Chat button removed - Use CMD+K */}
                        </div>
                    </div>
                </div>

                {/* 3. Authentic Action Pills - matching Image 1 */}
                <div className="flex items-center justify-start md:justify-center gap-2 overflow-x-auto pb-2 no-scrollbar px-1 md:px-0 scroll-smooth">
                    {[
                        { icon: <Globe className="w-3.5 h-3.5" />, label: 'Dashboard', path: '/dashboard' },
                        { icon: <BookOpen className="w-3.5 h-3.5" />, label: 'Learn', path: '/courses' },
                        { icon: <StickyNote className="w-3.5 h-3.5" />, label: 'Knowledge', path: '/notes' },
                        { icon: <TrendingUp className="w-3.5 h-3.5" />, label: 'Metrics', path: '/analytics' },
                        { icon: <Search className="w-3.5 h-3.5 text-primary" />, label: "Terminal", action: () => setIsSearchOpen(true) },
                    ].map((btn: any, i) => (
                        <button
                            key={i}
                            onClick={() => btn.action ? btn.action() : navigate(btn.path)}
                            className="flex items-center gap-1.5 px-4 py-2 bg-secondary/50 border border-border/50 rounded-xl text-xs font-medium text-foreground/70 hover:bg-secondary hover:text-foreground transition-all whitespace-nowrap"
                        >
                            {btn.icon}
                            {btn.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* 4. Automated Dashboard Metrics (WidgetGrid) */}
            <div className="w-full space-y-6 pt-12">
                <div className="flex items-center gap-4 text-muted-foreground/40">
                    <div className="flex-1 h-[1px] bg-border" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Activity Pattern</span>
                    <div className="flex-1 h-[1px] bg-border" />
                </div>

                <WidgetGrid
                    stats={stats}
                    nextReminder={nextReminder}
                    allReminders={allReminders}
                    streakData={streakData}
                    habits={habits}
                    onLog={handleQuickLog}
                />
            </div>


        </div>
    );
};

// --- Kinetic Landing Components (Unauthenticated) ---

// --- Zen Landing Components (Peaceful/Nature) ---

const ClaudeLanding = ({ navigate }: { navigate: any }) => {
    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background px-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="max-w-2xl w-full text-center space-y-12"
            >
                <div className="space-y-6">
                    <h1 className="text-4xl md:text-7xl font-bold tracking-tight text-foreground leading-[1.1]">
                        Focus on what matters.<br />
                        <span className="text-primary">Leave the rest to us.</span>
                    </h1>
                    <p className="text-base md:text-xl text-muted-foreground max-w-lg mx-auto leading-relaxed">
                        A helpful assistant for your daily rituals, knowledge, and growth.
                        Simple, intuitive, and human-centric.
                    </p>
                </div>
                beach
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button
                        onClick={() => navigate('/login')}
                        className="w-full sm:w-auto px-10 h-14 bg-primary text-white rounded-full text-lg font-medium hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                    >
                        Get Started
                    </Button>
                    <Button
                        onClick={() => navigate('/signup')}
                        variant="ghost"
                        className="w-full sm:w-auto px-10 h-14 rounded-full text-lg font-medium text-foreground hover:bg-secondary"
                    >
                        Create Account
                    </Button>
                </div>

                <div className="pt-12 grid grid-cols-1 sm:grid-cols-3 gap-8 opacity-40">
                    <div className="flex flex-col items-center gap-2">
                        <Activity className="w-5 h-5" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Habits</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <StickyNote className="w-5 h-5" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Notes</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Growth</span>
                    </div>
                </div>
            </motion.div>

            <div className="fixed bottom-8 text-[11px] text-muted-foreground/40 font-medium tracking-wide">
                Built for clarity and focus.
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
        return <ClaudeLanding navigate={navigate} />;
    }
}
