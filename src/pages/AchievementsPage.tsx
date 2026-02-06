import React, { useState, useEffect } from 'react';
import { Achievement, AchievementService } from '../services/achievement.service';
import { Button } from '../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import {
    Trophy, Medal, Star, Zap,
    Crown, Footprints, Moon, Sun, Sparkles,
    Lock, Share2, CheckCircle2, Home
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { ThemedCard } from '../components/ui/ThemedCard';

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
        <div className="p-4 md:p-8 space-y-12 max-w-7xl mx-auto">
            {/* Header Area */}
            <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-6 ${isWild ? 'animate-reveal' : ''}`}>
                <div className="flex items-center gap-4">
                    <Button variant="ghost" className={`rounded-full w-10 h-10 p-0 ${isWild ? 'rounded-none border-2 border-primary/20' : ''}`} onClick={() => navigate('/')}>
                        <Home className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className={`text-3xl font-black uppercase tracking-tighter ${isWild ? 'animate-glitch' : ''}`}>Achievement Hub</h1>
                        <p className="text-muted-foreground text-[8px] uppercase font-bold tracking-[0.3em] opacity-60">Milestone Verification Sequence</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className={`px-5 py-2.5 border-2 flex flex-col items-center min-w-[120px] ${isWild ? 'bg-black border-primary/20 rounded-none' : 'bg-card rounded-2xl shadow-sm'}`}>
                            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Unlocked</span>
                            <span className="text-xl font-black text-primary">{stats.unlocked}/{stats.total}</span>
                        </div>
                        <div className={`px-5 py-2.5 border-2 flex flex-col items-center min-w-[120px] ${isWild ? 'bg-black border-primary/20 rounded-none' : 'bg-card rounded-2xl shadow-sm'}`}>
                            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-40">System_Pts</span>
                            <span className="text-xl font-black text-primary">{stats.points}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation & Filters */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className={`flex p-1 w-full sm:w-fit border-2 ${isWild ? 'bg-black border-primary/20 rounded-none' : 'bg-muted/30 rounded-2xl'}`}>
                    {(['all', 'unlocked', 'locked'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`
                                flex-1 sm:flex-none px-8 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all
                                ${filter === f
                                    ? (isWild ? 'bg-primary text-black' : 'bg-primary text-primary-foreground shadow-lg rounded-xl')
                                    : (isWild ? 'text-primary/40 hover:text-primary' : 'hover:bg-muted/50 text-muted-foreground rounded-xl')}
                            `}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Achievement Matrix */}
            <div className="min-h-[400px]">
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <div key={i} className={`h-48 animate-pulse bg-muted/20 ${isWild ? 'rounded-none border-2 border-primary/10' : 'rounded-3xl'}`} />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filtered.map((achievement) => {
                            const Icon = iconMap[achievement.icon] || Trophy;
                            const isUnlocked = !!achievement.unlocked_at;

                            return (
                                <ThemedCard
                                    key={achievement.id}
                                    className={`relative group h-full flex flex-col ${!isUnlocked ? 'opacity-40 grayscale' : ''}`}
                                    interactive={isUnlocked}
                                >
                                    {!isUnlocked && <Lock className="absolute top-6 right-6 w-4 h-4 text-muted-foreground/30" />}
                                    {isUnlocked && <CheckCircle2 className={`absolute top-6 right-6 w-4 h-4 text-primary ${isWild ? '' : 'animate-pulse'}`} />}

                                    <div className="space-y-6 flex-1 flex flex-col">
                                        <div className={`
                                            w-14 h-14 flex items-center justify-center transition-transform group-hover:scale-110
                                            ${isWild ? 'rounded-none border-2 border-primary/20 text-primary' : 'rounded-2xl bg-primary/20 text-primary'}
                                            ${!isUnlocked ? 'text-muted-foreground border-muted/20' : ''}
                                        `}>
                                            <Icon className="w-7 h-7" />
                                        </div>

                                        <div className="space-y-1.5 flex-1">
                                            <h3 className={`font-black uppercase tracking-tight text-xl leading-tight ${isUnlocked && isWild ? 'text-primary' : ''}`}>
                                                {achievement.name}
                                            </h3>
                                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest leading-relaxed opacity-60">
                                                {achievement.description}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between pt-4 mt-auto border-t border-primary/5">
                                            <div className={`text-[10px] font-black px-3 py-1 bg-muted/30 uppercase tracking-widest flex items-center gap-2 ${isWild ? 'rounded-none border-l-4 border-primary text-primary' : 'rounded-lg'}`}>
                                                <Zap className="w-3.5 h-3.5" />
                                                {achievement.points} EX_PTS
                                            </div>
                                            {isUnlocked && (
                                                <button className="p-2 text-muted-foreground hover:text-primary transition-colors">
                                                    <Share2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {isUnlocked && achievement.unlocked_at && (
                                        <div className={`absolute -bottom-1 -right-1 px-2.5 py-1 text-[8px] font-black uppercase tracking-tighter shadow-lg ${isWild ? 'bg-primary text-black rounded-none' : 'bg-primary text-primary-foreground rounded-lg'}`}>
                                            Sync: {new Date(achievement.unlocked_at).toLocaleDateString()}
                                        </div>
                                    )}
                                </ThemedCard>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
