import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import {
    LogOut, Activity, StickyNote, Bell, AlertCircle,
    Settings, Youtube, Trophy, Share2, TrendingUp, Home
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function HomePage() {
    const { user, logout } = useAuth();
    const { preferences } = useTheme();
    const isWild = preferences.wild_mode;
    const navigate = useNavigate();

    const modules = [
        {
            title: 'Ritual Dashboard',
            description: 'Monitor your daily flow and maintain protocol streaks.',
            icon: <Activity className={`w-8 h-8 ${isWild ? 'text-primary' : 'text-green-500'}`} />,
            path: '/dashboard',
            status: 'Operational',
            meta: 'Day 12 Streak'
        },
        {
            title: 'Neural Notes',
            description: 'Capture thought sequences and daily cognitive reflections.',
            icon: <StickyNote className={`w-8 h-8 ${isWild ? 'text-primary' : 'text-yellow-500'}`} />,
            path: '/notes',
            status: 'Indexed',
            meta: '128 Entries'
        },
        {
            title: 'System Alerts',
            description: 'Stay synchronized with upcoming protocol deadlines.',
            icon: <Bell className={`w-8 h-8 ${isWild ? 'text-primary' : 'text-blue-500'}`} />,
            path: '/reminders',
            status: 'Active',
            meta: '3 Pending'
        },
        {
            title: 'System Arrears',
            description: 'Identify and acknowledge missed protocol check-ins.',
            icon: <AlertCircle className={`w-8 h-8 ${isWild ? 'text-primary' : 'text-red-500'}`} />,
            path: '/still-not-done',
            status: 'Critical',
            meta: '2 Unresolved'
        },
        {
            title: 'Learning Lab',
            description: 'Deep intelligence acquisition via visual protocols.',
            icon: <Youtube className={`w-8 h-8 ${isWild ? 'text-primary' : 'text-red-600'}`} />,
            path: '/youtube',
            status: 'Syncing',
            meta: '4 Courses'
        },
        {
            title: 'Advanced Analytics',
            description: 'Deep dive into habit patterns and mastery metrics.',
            icon: <TrendingUp className={`w-8 h-8 ${isWild ? 'text-primary' : 'text-purple-500'}`} />,
            path: '/analytics',
            status: 'Optimal',
            meta: '85% Efficacy'
        },
        {
            title: 'Achievement Hub',
            description: 'Review unlocked milestones and system badges.',
            icon: <Trophy className={`w-8 h-8 ${isWild ? 'text-primary' : 'text-orange-500'}`} />,
            path: '/achievements',
            status: 'Verified',
            meta: '12 Unlocked'
        },
        {
            title: 'Ritual Network',
            description: 'Visualize connections and synergy between protocols.',
            icon: <Share2 className={`w-8 h-8 ${isWild ? 'text-primary' : 'text-indigo-500'}`} />,
            path: '/network',
            status: 'Stable',
            meta: '5 Clusters'
        }
    ];

    return (
        <div className={`min-h-screen bg-background relative selection:bg-primary selection:text-black ${isWild ? 'wild font-mono' : 'font-sans'}`}>
            {isWild && <div className="vignette pointer-events-none" />}

            <div className="relative z-10 p-4 md:p-8 max-w-6xl mx-auto space-y-12">
                {/* Header */}
                <div className={`flex flex-col md:flex-row md:items-center justify-between gap-6 ${isWild ? 'animate-reveal' : ''}`}>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Home className={`w-6 h-6 ${isWild ? 'text-primary' : 'text-muted-foreground'}`} />
                            <h1 className="text-4xl md:text-5xl font-black tracking-tight uppercase">Central Hub</h1>
                        </div>
                        <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest opacity-70">
                            {isWild ? `Welcome, Auth_User: ${user?.name || 'UNKNOWN'} | System_Status: Nominal` : `Welcome back, ${user?.name || 'User'}`}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => navigate('/settings')} className={isWild ? 'rounded-none border-2' : ''}>
                            <Settings className="w-4 h-4 mr-2" /> Settings
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => logout()} className={isWild ? 'rounded-none border-2 hover:bg-primary hover:text-black' : ''}>
                            <LogOut className="w-4 h-4 mr-2" /> Sign out
                        </Button>
                    </div>
                </div>

                {/* Grid Overlay for Wild Mode */}
                {isWild && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-0.5 bg-primary/10 border-2 border-primary/20">
                        {modules.map((module) => (
                            <div
                                key={module.path}
                                onClick={() => navigate(module.path)}
                                className="group relative p-6 bg-black border border-primary/10 cursor-pointer overflow-hidden hover:bg-primary/5 transition-all"
                            >
                                <div className="absolute top-2 right-2 text-[8px] font-black text-primary/30 uppercase tracking-widest">{module.status}</div>
                                <div className="space-y-4">
                                    <div className="p-3 bg-white/5 border border-white/10 inline-block transition-transform group-hover:scale-110 group-hover:rotate-3">
                                        {module.icon}
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-black uppercase tracking-tight group-hover:text-primary transition-colors">{module.title}</h3>
                                        <p className="text-[10px] text-muted-foreground leading-tight line-clamp-2 opacity-60">{module.description}</p>
                                    </div>
                                    <div className="pt-2 flex items-center justify-between">
                                        <div className="text-[8px] font-black font-mono text-primary/50 tracking-widest">{module.meta}</div>
                                        <div className="text-primary translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">→</div>
                                    </div>
                                </div>
                                {/* Glitch Bar */}
                                <div className="absolute bottom-0 left-0 w-full h-[1px] bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
                            </div>
                        ))}
                    </div>
                )}

                {/* Standard Grid for Non-Wild Mode */}
                {!isWild && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {modules.map((module) => (
                            <div
                                key={module.path}
                                onClick={() => navigate(module.path)}
                                className="group p-8 rounded-3xl border bg-card cursor-pointer hover:shadow-2xl hover:border-primary/50 transition-all duration-500 hover:-translate-y-1"
                            >
                                <div className="flex flex-col gap-6">
                                    <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                        {module.icon}
                                    </div>
                                    <div className="space-y-2">
                                        <h2 className="text-2xl font-bold group-hover:text-primary transition-colors">{module.title}</h2>
                                        <p className="text-muted-foreground leading-relaxed">{module.description}</p>
                                    </div>
                                    <div className="pt-4 flex items-center text-sm font-bold text-primary opacity-0 group-hover:opacity-100 transition-all">
                                        Explore Protocol <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div >
    );
}
