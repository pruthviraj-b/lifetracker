import { HabitService } from './habit.service';
import { supabase } from '../lib/supabase';

export interface AnalyticsSummary {
    completionRate: number; // Overall %
    totalCompletions: number;
    currentStreak: number; // Day streak of "perfect" days (optional metric)
    bestStreak: number;
}

export interface TrendPoint {
    date: string;
    value: number; // percentage (0-100)
    total: number; // total habits that day
    completed: number;
}

export interface HabitStat {
    id: string;
    title: string;
    rate: number;
    streak: number;
    total: number;
}

export interface MultiverseStats {
    totalNodes: number;
    totalLinks: number;
    linkDensity: number;
}

export const AnalyticsService = {
    // Helper to get date range
    getDateRange(days: number) {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - days + 1);
        return {
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0]
        };
    },

    async getDashboardStats(rangeDays = 30): Promise<{
        summary: AnalyticsSummary;
        trend: TrendPoint[];
        habitStats: HabitStat[];
    }> {
        const { start, end } = this.getDateRange(rangeDays);
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        const userId = user?.id;

        // Parallel Fetch
        const [habits, logs] = await Promise.all([
            HabitService.getHabits(userId),
            HabitService.getLogs(start, end, userId)
        ]);

        // Process Logs into Map: date -> completedIDs[]
        const logsMap: Record<string, string[]> = {};
        logs.forEach((log: any) => {
            if (!logsMap[log.date]) logsMap[log.date] = [];
            logsMap[log.date].push(log.habit_id);
        });

        // 1. Calculate Trend (Daily %)
        const trend: TrendPoint[] = [];
        let totalCompletionsRange = 0;

        // Generate all dates in range
        const startDate = new Date(start);
        const endDate = new Date(end);

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            const completedIds = logsMap[dateStr] || [];

            // Filter active habits for that day (Simplified: assumes current habits were active)
            // Ideally we check creation date vs log date, but for MVP:
            const activeHabitsCount = habits.filter(h => !h.archived).length || 1;

            const rate = Math.round((completedIds.length / activeHabitsCount) * 100);

            trend.push({
                date: dateStr,
                value: rate > 100 ? 100 : rate,
                total: activeHabitsCount,
                completed: completedIds.length
            });

            totalCompletionsRange += completedIds.length;
        }

        // 2. Summary Stats
        // Avg Completion Rate
        const avgRate = Math.round(trend.reduce((acc, curr) => acc + curr.value, 0) / trend.length);

        // 3. Per-Habit Stats
        const habitStats: HabitStat[] = habits.map(h => {
            // Calculate completions in this range
            const completions = logs.filter((l: any) => l.habit_id === h.id).length;
            return {
                id: h.id,
                title: h.title,
                rate: Math.round((completions / rangeDays) * 100), // simplistic "daily" rate
                streak: h.streak, // absolute streak from DB
                total: h.totalCompletions || completions
            };
        }).sort((a, b) => b.rate - a.rate);

        return {
            summary: {
                completionRate: avgRate,
                totalCompletions: totalCompletionsRange,
                currentStreak: 0, // Todo: calculate global streak
                bestStreak: 0
            },
            trend,
            habitStats
        };
    },

    exportToCSV: async () => {
        const { start, end } = AnalyticsService.getDateRange(365); // 1 Year
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        const userId = user?.id;

        const [habits, logs] = await Promise.all([
            HabitService.getHabits(userId),
            HabitService.getLogs(start, end, userId)
        ]);

        // Header
        let csv = 'Date,Habit,Status,Note\n';

        // Rows
        logs.forEach((log: any) => {
            const habit = habits.find(h => h.id === log.habit_id);
            const habitName = habit ? habit.title : 'Unknown Habit';
            csv += `${log.date},"${habitName}",Completed,"${log.note || ''}"\n`;
        });

        // Trigger Download
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `habit-tracker-export-${end}.csv`;
        a.click();
    },

    async getMultiverseStats(): Promise<MultiverseStats> {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) return { totalNodes: 0, totalLinks: 0, linkDensity: 0 };

        const [habits, videos, courses, links] = await Promise.all([
            supabase.from('habits').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
            supabase.from('youtube_videos').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
            supabase.from('learning_courses').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
            supabase.from('multiverse_links').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
        ]);

        const totalNodes = (habits.count || 0) + (videos.count || 0) + (courses.count || 0);
        const totalLinks = links.count || 0;
        const linkDensity = totalNodes > 0 ? (totalLinks / totalNodes) * 100 : 0;

        return {
            totalNodes,
            totalLinks,
            linkDensity
        };
    }
};
