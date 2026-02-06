import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Calendar, Trophy, Zap, TrendingUp, Home, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/Button';
import { AnalyticsService, AnalyticsSummary, TrendPoint, HabitStat } from '../services/analytics.service';
import { TrendChart } from '../components/analytics/TrendChart';
import { useTheme } from '../context/ThemeContext';
import { ThemedCard } from '../components/ui/ThemedCard';

export default function AnalyticsPage() {
    const navigate = useNavigate();
    const { preferences } = useTheme();
    const isWild = preferences.wild_mode;
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<{
        summary: AnalyticsSummary;
        trend: TrendPoint[];
        habitStats: HabitStat[];
        multiverse: any;
    } | null>(null);
    const [range, setRange] = useState<number>(30); // Days

    useEffect(() => {
        loadStats();
    }, [range]);

    const loadStats = async () => {
        setLoading(true);
        try {
            const [data, mv] = await Promise.all([
                AnalyticsService.getDashboardStats(range),
                AnalyticsService.getMultiverseStats()
            ]);
            setStats({ ...data, multiverse: mv });
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !stats) {
        return (
            <div className="min-h-screen flex items-center justify-center p-8 animate-pulse">
                <div className="text-sm font-bold uppercase tracking-widest text-primary">Calculating your progress...</div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-12 max-w-7xl mx-auto animate-claude-in">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-primary/10 rounded-[1.5rem]">
                        <TrendingUp className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight text-foreground">
                            Growth Analytics
                        </h1>
                        <p className="text-muted-foreground text-sm font-medium">Track your progress and consistency over time.</p>
                    </div>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <select
                        className="claude-input h-14 px-6 text-sm font-bold bg-card border-border min-w-[160px]"
                        value={range}
                        onChange={(e) => setRange(Number(e.target.value))}
                    >
                        <option value="7">Last 7 Days</option>
                        <option value="30">Last 30 Days</option>
                        <option value="90">Last 90 Days</option>
                    </select>
                    <Button variant="outline" size="sm" onClick={() => AnalyticsService.exportToCSV()} className="claude-button h-14 px-8 bg-background border-border text-sm font-bold">
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                    </Button>
                </div>
            </div>

            {/* Overview Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                    { label: 'Consistency', value: `${stats.summary.completionRate}%`, sub: 'Adherence rate', icon: Activity },
                    { label: 'Total Rituals', value: stats.summary.totalCompletions, sub: 'All-time logs', icon: Calendar },
                    { label: 'Best Streak', value: Math.max(0, ...stats.habitStats.map(h => h.streak)), sub: 'Longest run', icon: Zap },
                    { label: 'Global Progress', value: `${Math.round(stats.multiverse.linkDensity)}%`, sub: 'Habit connectivity', icon: TrendingUp }
                ].map((stat, i) => (
                    <ThemedCard key={i} className="p-8 space-y-4 group">
                        <div className="p-3 bg-secondary rounded-2xl w-fit group-hover:bg-primary group-hover:text-white transition-all">
                            <stat.icon className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
                                {stat.label}
                            </div>
                            <div className="text-4xl font-bold text-foreground tracking-tight">
                                {stat.value}
                            </div>
                            <div className="text-xs text-muted-foreground font-medium">
                                {stat.sub}
                            </div>
                        </div>
                    </ThemedCard>
                ))}
            </div>

            {/* Performance Curve */}
            <ThemedCard className="p-8 space-y-8">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        <TrendingUp className="w-6 h-6 text-primary" />
                        Performance Trends
                    </h3>
                </div>
                <div className="h-[350px] w-full">
                    <TrendChart data={stats.trend} />
                </div>
            </ThemedCard>

            {/* Comparison Grid */}
            <div className="grid lg:grid-cols-2 gap-12 pb-12">
                <ThemedCard className="p-8 space-y-8">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 text-muted-foreground/60">
                        <Trophy className="w-4 h-4 text-primary" /> Most Consistent Rituals
                    </h3>
                    <div className="space-y-2">
                        {stats.habitStats.slice(0, 5).map((habit, i) => (
                            <div key={habit.id} className="flex items-center justify-between p-4 transition-all rounded-2xl hover:bg-secondary group">
                                <div className="flex items-center gap-4">
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${i < 3 ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-secondary text-muted-foreground'}`}>
                                        {i + 1}
                                    </div>
                                    <span className="text-sm font-bold text-foreground">{habit.title}</span>
                                </div>
                                <div className="flex items-center gap-6">
                                    <span className="text-base font-bold text-primary">{habit.rate}%</span>
                                    <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden hidden sm:block">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${habit.rate}%` }}
                                            className="h-full bg-primary"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </ThemedCard>

                <ThemedCard className="p-8 space-y-8">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 text-muted-foreground/60">
                        <Calendar className="w-4 h-4 text-primary" /> Progress Insights
                    </h3>
                    <div className="space-y-6">
                        <div className="p-6 bg-primary/5 rounded-[2rem] space-y-2">
                            <p className="text-sm font-medium text-foreground leading-relaxed">
                                Your current reliability index is <span className="text-primary font-bold">{Math.round(stats.summary.completionRate)}%</span>.
                                Maintaining an 80% or higher completion rate is the optimal threshold for long-term consistency.
                            </p>
                        </div>

                        <div className="p-8 bg-secondary border border-border rounded-[2.5rem] space-y-4 group transition-all duration-500">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-xl shadow-sm">
                                    <Activity className="w-5 h-5 text-primary" />
                                </div>
                                <div className="text-xs font-bold uppercase tracking-widest text-foreground">Weekly Overview</div>
                            </div>
                            <div className="text-sm font-medium leading-relaxed text-muted-foreground">
                                Your activity pattern is stabilizing. You've shown peak performance in your morning rituals this week. Keep focus on maintaining your evening wind-down consistency.
                            </div>
                        </div>
                    </div>
                </ThemedCard>
            </div>
        </div>
    );
}
