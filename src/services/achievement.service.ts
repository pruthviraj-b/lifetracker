import { supabase } from '../lib/supabase';

export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    points: number;
    category: string;
    criteria_type: string;
    criteria_value: number;
    unlocked_at?: string;
}

export const AchievementService = {
    async getAchievements(): Promise<Achievement[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        // Fetch all achievements
        const { data: allAchievements, error: allErr } = await supabase
            .from('achievements')
            .select('*')
            .order('points', { ascending: true });

        if (allErr) throw allErr;

        // Fetch user unlocks
        const { data: userUnlocks, error: unlockErr } = await supabase
            .from('user_achievements')
            .select('*')
            .eq('user_id', user.id);

        if (unlockErr) throw unlockErr;

        // Merge
        return allAchievements.map((a: any) => ({
            ...a,
            unlocked_at: userUnlocks.find((u: any) => u.achievement_id === a.id)?.unlocked_at
        }));
    },

    async getRecentUnlocks(limit = 5): Promise<Achievement[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('user_achievements')
            .select(`
                unlocked_at,
                achievements (*)
            `)
            .eq('user_id', user.id)
            .order('unlocked_at', { ascending: false })
            .limit(limit);

        if (error) throw error;

        return data.map((d: any) => ({
            ...d.achievements,
            unlocked_at: d.unlocked_at
        }));
    }
};
