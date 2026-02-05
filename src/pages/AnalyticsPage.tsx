import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Calendar, Trophy, Zap, TrendingUp, Home } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { AnalyticsService, AnalyticsSummary, TrendPoint, HabitStat } from '../services/analytics.service';
import { TrendChart } from '../components/analytics/TrendChart';
import { useTheme } from '../context/ThemeContext';

export default function AnalyticsPage() {
    const navigate = useNavigate();
    const { preferences } = useTheme();
    const isWild = preferences.wild_mode;
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<{
        summary: AnalyticsSummary;
        trend: TrendPoint[];
        habitStats: HabitStat[];
    } | null>(null);
    const [range, setRange] = useState<number>(30); // Days

    useEffect(() => {
        loadStats();
    }, [range]);

    const loadStats = async () => {
        setLoading(true);
        try {
            const data = await AnalyticsService.getDashboardStats(range);
            setStats(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !stats) {
        return <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-8">Loading Analytics...</div>;
    }

    return (
        <div className={`min-h-screen bg-background relative selection:bg-primary selection:text-black ${isWild ? 'wild font-mono' : 'font-sans'}`}>
            {isWild && <div className="vignette pointer-events-none" />}

            <div className="relative z-10 max-w-5xl mx-auto p-4 md:p-6 space-y-6">
                {/* Header */}
                <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${isWild ? 'animate-reveal' : ''}`}>
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" className={`rounded-full w-9 h-9 p-0 ${isWild ? 'rounded-none border-2' : ''}`} onClick={() => navigate('/')}>
                            <Home className="w-4 h-4" />
                        </Button>
                        <div>
                            <h1 className={`text-2xl font-black uppercase tracking-tighter ${isWild ? 'animate-glitch' : ''}`}>Analytics</h1>
                            <p className="text-muted-foreground text-[8px] uppercase font-bold tracking-widest opacity-60">Deep Metric Evaluation Sequence</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <select
                            className={`bg-muted text-xs px-2.5 py-1.5 focus:ring-1 focus:ring-primary h-9 ${isWild ? 'rounded-none border-2 border-primary/50' : 'rounded-md border-none'}`}
                            value={range}
                            onChange={(e) => setRange(Number(e.target.value))}
                        >
                            <option value="7">Last 7D</option>
                            <option value="30">Last 30D</option>
                            <option value="90">Last 3M</option>
                        </select>
                        <Button variant="outline" size="sm" onClick={() => AnalyticsService.exportToCSV()} className={`h-9 px-4 text-[10px] uppercase font-black tracking-widest ${isWild ? 'rounded-none border-2' : ''}`}>
                            <Download className="w-3.5 h-3.5 mr-2" />
                            Export
                        </Button>
                    </div>
                </div>

                {/* Overview Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className={`p-6 border-2 space-y-2 ${isWild ? 'bg-black border-primary rounded-none' : 'bg-card rounded-xl shadow-sm'}`}>
                        <div className="text-muted-foreground text-[10px] font-black uppercase tracking-widest opacity-60">Success_Rate</div>
                        <div className={`text-4xl font-black ${isWild ? 'text-primary' : 'text-primary'}`}>{stats.summary.completionRate}%</div>
                        <div className="text-[10px] text-muted-foreground uppercase opacity-40">Period: {range}D</div>
                    </div>
                    <div className={`p-6 border-2 space-y-2 ${isWild ? 'bg-black border-primary rounded-none' : 'bg-card rounded-xl shadow-sm'}`}>
                        <div className="text-muted-foreground text-[10px] font-black uppercase tracking-widest opacity-60">Total_Protocols</div>
                        <div className={`text-4xl font-black ${isWild ? 'text-primary' : 'text-blue-500'}`}>{stats.summary.totalCompletions}</div>
                        <div className="text-[10px] text-muted-foreground uppercase opacity-40">Verified Actions</div>
                    </div>
                    <div className={`p-6 border-2 space-y-2 ${isWild ? 'bg-black border-primary rounded-none' : 'bg-card rounded-xl shadow-sm'}`}>
                        <div className="text-muted-foreground text-[10px] font-black uppercase tracking-widest opacity-60">Max_Streak</div>
                        <div className={`text-4xl font-black flex items-center gap-2 ${isWild ? 'text-primary' : 'text-yellow-500'}`}>
                            {Math.max(...stats.habitStats.map(h => h.streak))} <Zap className="w-6 h-6" />
                        </div>
                        <div className="text-[10px] text-muted-foreground uppercase opacity-40">Chain Length</div>
                    </div>
                    <div className={`p-6 border-2 space-y-2 ${isWild ? 'bg-black border-primary rounded-none' : 'bg-card rounded-xl shadow-sm'}`}>
                        <div className="text-muted-foreground text-[10px] font-black uppercase tracking-widest opacity-60">Sync_Score</div>
                        <div className={`text-4xl font-black ${isWild ? 'text-primary' : 'text-purple-500'}`}>A+</div>
                        <div className="text-[10px] text-muted-foreground uppercase opacity-40">System Coherence</div>
                    </div>
                </div>

                {/* Main Curve Chart */}
                <div className={`p-8 border-2 space-y-8 ${isWild ? 'bg-black border-primary rounded-none' : 'bg-card border-border rounded-xl'}`}>
                    <div className="flex items-center justify-between">
                        <h3 className={`text-xl font-black uppercase tracking-tighter flex items-center gap-3 ${isWild ? 'animate-glitch' : ''}`}>
                            <TrendingUp className="w-6 h-6 text-primary" />
                            Performance Trend Protocol
                        </h3>
                    </div>
                    <div className="h-64 md:h-80 w-full opacity-80 hover:opacity-100 transition-opacity">
                        <TrendChart data={stats.trend} />
                    </div>
                </div>

                {/* Habit Comparison List */}
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-yellow-500" />
                            Top Performers
                        </h3>
                        <div className="bg-card border rounded-xl overflow-hidden">
                            {stats.habitStats.slice(0, 5).map((habit, i) => (
                                <div key={habit.id} className="flex items-center justify-between p-4 border-b last:border-0 hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i < 3 ? 'bg-yellow-500/20 text-yellow-500' : 'bg-muted text-muted-foreground'}`}>
                                            {i + 1}
                                        </div>
                                        <span className="font-medium">{habit.title}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm">
                                        <div className="flex flex-col items-end">
                                            <span className="font-bold text-primary">{habit.rate}%</span>
                                            <span className="text-xs text-muted-foreground">Success</span>
                                        </div>
                                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                            <div className="h-full bg-primary" style={{ width: `${habit.rate}%` }} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-blue-500" />
                            Consistency Check
                        </h3>
                        <div className="bg-card border rounded-xl p-4">
                            <p className="text-sm text-muted-foreground mb-4">
                                You have maintained a <span className="text-foreground font-bold">{Math.round(stats.summary.completionRate)}%</span> completion rate over the last {range} days.
                                Keep pushing to reach 80%+ for optimal habit formation!
                            </p>
                            {/* Placeholder for small heatmap or other metric if needed */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
