import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { useTheme } from '../context/ThemeContext';
import {
    Activity, StickyNote, Bell, AlertCircle,
    Youtube, Trophy, Share2, TrendingUp, BookOpen,
    Eye, Fingerprint, Compass, Zap, Layers, Boxes, Hexagon,
    LayoutDashboard, Library, GraduationCap, Network
} from 'lucide-react';
import { NotificationTestPanel } from '../components/NotificationTestPanel';

// --- Standard Naming & Icons (Red Theme) ---
const HUB_MODULES = [
    {
        id: 'protocols',
        label: 'Protocols',
        sub: 'Daily Habits',
        icon: Activity,
        path: '/protocols',
        color: 'text-red-500',
        bg: 'bg-red-500/10',
        border: 'group-hover:border-red-500/50'
    },
    {
        id: 'notes',
        label: 'Notes',
        sub: 'Journal & Ideas',
        icon: StickyNote,
        path: '/notes',
        color: 'text-red-500',
        bg: 'bg-red-500/10',
        border: 'group-hover:border-red-500/50'
    },
    {
        id: 'courses',
        label: 'Academy',
        sub: 'Courses & Skills',
        icon: GraduationCap,
        path: '/courses',
        color: 'text-red-500',
        bg: 'bg-red-500/10',
        border: 'group-hover:border-red-500/50'
    },
    {
        id: 'analytics',
        label: 'Analytics',
        sub: 'Stats & Trends',
        icon: TrendingUp,
        path: '/analytics',
        color: 'text-red-500',
        bg: 'bg-red-500/10',
        border: 'group-hover:border-red-500/50'
    },
    {
        id: 'reminders',
        label: 'Reminders',
        sub: 'Alerts & Notifications',
        icon: Bell,
        path: '/reminders',
        color: 'text-red-500',
        bg: 'bg-red-500/10',
        border: 'group-hover:border-red-500/50'
    },
    {
        id: 'youtube',
        label: 'Library',
        sub: 'Saved Videos',
        icon: Youtube,
        path: '/youtube',
        color: 'text-red-500',
        bg: 'bg-red-500/10',
        border: 'group-hover:border-red-500/50'
    },
    {
        id: 'achievements',
        label: 'Trophies',
        sub: 'Milestones',
        icon: Trophy,
        path: '/achievements',
        color: 'text-red-500',
        bg: 'bg-red-500/10',
        border: 'group-hover:border-red-500/50'
    },
    {
        id: 'network',
        label: 'Network',
        sub: 'Connections',
        icon: Network,
        path: '/network',
        color: 'text-red-500',
        bg: 'bg-red-500/10',
        border: 'group-hover:border-red-500/50'
    }
];

// --- Kinetic Landing Components (Unauthenticated) ---

const KineticLanding = ({ navigate, isWild }: { navigate: any, isWild: boolean }) => {
    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#0a0000] overflow-hidden relative selection:bg-red-500 selection:text-white">
            {/* Background Grid - Dark Red */}
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
                        onClick={() => navigate('/dashboard')}
                        className="group relative px-8 py-3 bg-red-600 text-white font-bold uppercase tracking-widest hover:bg-red-700 transition-colors rounded-none overflow-hidden"
                    >
                        <span className="relative z-10">Initiate Sequence</span>
                    </Button>
                </motion.div>
            </div>
        </div>
    );
};

// --- Central Hub Components (Authenticated) ---

const CentralHub = ({ navigate, isWild, user }: { navigate: any, isWild: boolean, user: any }) => {
    return (
        <div className={`min-h-screen bg-[#0a0000] p-6 md:p-12 ${isWild ? 'wild' : ''}`}>
            {isWild && <div className="vignette fixed inset-0 pointer-events-none z-50 opacity-50 bg-red-500/5 mix-blend-overlay" />}

            <div className="max-w-6xl mx-auto space-y-12">
                <header className="text-center space-y-4 pt-8">
                    <motion.h1
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="text-4xl md:text-5xl font-black text-red-600 tracking-tight uppercase"
                    >
                        Central Hub
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-sm font-mono text-red-900/60 uppercase tracking-widest"
                    >
                        Welcome Back, {user?.name || 'Operator'}
                    </motion.p>
                </header>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {HUB_MODULES.map((mod, i) => {
                        return (
                            <motion.div
                                key={mod.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3, delay: i * 0.05 }}
                                onClick={() => navigate(mod.path)}
                                className={`
                                    group relative aspect-square flex flex-col items-center justify-center gap-4
                                    bg-[#110505] border border-red-900/20 rounded-3xl cursor-pointer
                                    hover:border-red-500/50 hover:bg-[#1a0505] transition-all duration-300
                                `}
                            >
                                <div className={`
                                    w-16 h-16 rounded-2xl flex items-center justify-center
                                    ${mod.bg} ${mod.color}
                                    transition-transform duration-300 group-hover:scale-105
                                `}>
                                    <mod.icon strokeWidth={1.5} className="w-8 h-8" />
                                </div>

                                <div className="text-center space-y-1">
                                    <h2 className="text-lg font-bold text-gray-200 group-hover:text-white transition-colors">
                                        {mod.label}
                                    </h2>
                                    <p className="text-[10px] text-red-900/60 uppercase tracking-wider font-medium">
                                        {mod.sub}
                                    </p>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
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
