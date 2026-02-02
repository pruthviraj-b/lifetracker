import React, { useState, useEffect } from 'react';
import { Achievement, AchievementService } from '../services/achievement.service';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Trophy, Medal, Star, Zap,
    Crown, Footprints, Moon, Sun, Sparkles,
    Lock, Share2, CheckCircle2, Home
} from 'lucide-react';
import { Skeleton } from '../components/ui/Skeleton';
import { useTheme } from '../context/ThemeContext';

const iconMap: any = {
    'Trophy': Trophy,
    'Medal': Medal,
    'Star': Star,
    'Zap': Zap,
    'Crown': Crown,
    'Footprints': Footprints,
    'Moon': Moon,
    'Sun': Sun,
    'Sparkles': Sparkles
};

export default function AchievementsPage() {
    const navigate = useNavigate();
    const { preferences } = useTheme();
    const isWild = preferences.wild_mode;
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

    useEffect(() => {
        loadAchievements();
    }, []);

    const loadAchievements = async () => {
        try {
            setLoading(true);
            const data = await AchievementService.getAchievements();
            setAchievements(data);
        } catch (error) {
            console.error("Failed to load achievements:", error);
        } finally {
            setLoading(false);
        }
    };

    const filtered = achievements.filter(a => {
        if (filter === 'unlocked') return !!a.unlocked_at;
        if (filter === 'locked') return !a.unlocked_at;
        return true;
    });

    const stats = {
        total: achievements.length,
        unlocked: achievements.filter(a => !!a.unlocked_at).length,
        points: achievements.reduce((acc, a) => acc + (a.unlocked_at ? a.points : 0), 0)
    };

    return (
        <div className={`min-h-screen bg-background relative selection:bg-primary selection:text-black ${isWild ? 'wild font-mono' : 'font-sans'}`}>
            {isWild && <div className="vignette pointer-events-none" />}

            <div className="relative z-10 p-4 md:p-8 max-w-7xl mx-auto space-y-12">
                {/* Header */}
                <div className={`flex flex-col md:flex-row md:items-center justify-between gap-6 ${isWild ? 'animate-reveal' : ''}`}>
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" className={`rounded-full w-10 h-10 p-0 ${isWild ? 'rounded-none border-2' : ''}`} onClick={() => navigate('/')}>
                            <Home className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className={`text-4xl font-black uppercase tracking-tighter ${isWild ? 'animate-glitch' : ''}`}>Achievement Hub</h1>
                            <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest opacity-70">Milestone Verification Sequence</p>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className={`px-6 py-4 border-2 flex flex-col items-center min-w-[120px] ${isWild ? 'bg-black border-primary rounded-none' : 'bg-card rounded-2xl'}`}>
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Unlocked</span>
                            <span className="text-2xl font-black text-primary">{stats.unlocked}/{stats.total}</span>
                        </div>
                        <div className={`px-6 py-4 border-2 flex flex-col items-center min-w-[120px] ${isWild ? 'bg-black border-primary rounded-none' : 'bg-card rounded-2xl'}`}>
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">System_Pts</span>
                            <span className="text-2xl font-black text-primary">{stats.points}</span>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className={`flex p-1 w-fit border ${isWild ? 'bg-black border-primary rounded-none' : 'bg-muted/30 rounded-2xl'}`}>
                    {(['all', 'unlocked', 'locked'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`
                                px-6 py-2 text-xs font-black uppercase tracking-widest transition-all
                                ${filter === f
                                    ? (isWild ? 'bg-primary text-black' : 'bg-primary text-primary-foreground shadow-lg rounded-xl')
                                    : (isWild ? 'text-primary/40 hover:text-primary' : 'hover:bg-muted/50 text-muted-foreground rounded-xl')}
                            `}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <Skeleton key={i} className={`h-48 ${isWild ? 'rounded-none' : 'rounded-3xl'}`} />
                        ))}
                    </div>
                ) : (
                    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 ${isWild ? 'animate-reveal' : ''}`}>
                        {filtered.map((achievement) => {
                            const Icon = iconMap[achievement.icon] || Trophy;
                            const isUnlocked = !!achievement.unlocked_at;

                            return (
                                <div
                                    key={achievement.id}
                                    className={`
                                        relative group p-6 border transition-all duration-300
                                        ${isWild ? 'rounded-none border-primary/20 bg-black hover:border-primary shadow-[inset_0_0_20px_rgba(255,0,0,0.05)]' : 'rounded-3xl bg-card'}
                                        ${isUnlocked ? (isWild ? 'border-primary' : 'border-primary ring-1 ring-primary/20 hover:scale-[1.02] shadow-xl') : 'opacity-40 grayscale'}
                                    `}
                                >
                                    {!isUnlocked && <Lock className="absolute top-4 right-4 w-4 h-4 text-muted-foreground/30" />}
                                    {isUnlocked && <CheckCircle2 className={`absolute top-4 right-4 w-4 h-4 text-primary ${isWild ? '' : 'animate-pulse'}`} />}

                                    <div className="space-y-4">
                                        <div className={`
                                            w-12 h-12 flex items-center justify-center transition-transform group-hover:scale-110
                                            ${isWild ? 'rounded-none border-2 border-primary/20 text-primary' : 'rounded-2xl bg-primary/20 text-primary'}
                                            ${!isUnlocked ? 'text-muted-foreground border-muted/20' : ''}
                                        `}>
                                            <Icon className="w-6 h-6" />
                                        </div>

                                        <div>
                                            <h3 className={`font-black uppercase tracking-tighter text-lg ${isWild ? 'text-primary' : ''}`}>{achievement.name}</h3>
                                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest leading-tight mt-1 opacity-70">{achievement.description}</p>
                                        </div>

                                        <div className="flex items-center justify-between pt-2">
                                            <span className={`text-[10px] font-black px-2 py-1 bg-muted/20 uppercase tracking-widest ${isWild ? 'rounded-none border-l-2 border-primary text-primary' : 'rounded-lg'}`}>
                                                {achievement.points} pts
                                            </span>
                                            {isUnlocked && (
                                                <Button variant="ghost" size="icon" className={`h-8 w-8 ${isWild ? 'rounded-none hover:bg-primary/20 text-primary' : 'hover:bg-primary/10'}`}>
                                                    <Share2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {isUnlocked && achievement.unlocked_at && (
                                        <div className={`absolute -bottom-2 -right-2 px-2 py-1 text-[8px] font-black uppercase tracking-tighter shadow-lg ${isWild ? 'bg-primary text-black rounded-none' : 'bg-primary text-primary-foreground rounded'}`}>
                                            Unlocked {new Date(achievement.unlocked_at).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
