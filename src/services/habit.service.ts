import { supabase } from '../lib/supabase';
import { Habit, TimeOfDay, HabitCategory, DayOfWeek, HabitLink } from '../types/habit';
import { MultiverseService } from './multiverse.service';

export const HabitService = {
    // --- Habits ---
    async getHabits(userId?: string): Promise<Habit[]> {
        const uid = userId || (await supabase.auth.getUser()).data.user?.id;
        if (!uid) return [];

        const today = new Date().toISOString().split('T')[0];

        // Parallel Fetch: Habits, Links, Logs
        const [habitsResult, linksResult, logs] = await Promise.all([
            supabase
                .from('habits')
                .select('*')
                .eq('user_id', uid)
                .order('created_at', { ascending: true }),
            supabase
                .from('habit_links')
                .select('*')
                .eq('user_id', uid),
            this.getLogs(today, today, uid)
        ]);

        const habitsData = habitsResult.data || [];
        if (habitsResult.error) throw habitsResult.error;

        // Process Links (Handle missing table gracefully)
        const linksData = linksResult.error ? [] : (linksResult.data || []);

        const links = linksData.map((l: any) => ({
            id: l.id,
            sourceHabitId: l.source_habit_id,
            targetHabitId: l.target_habit_id,
            type: l.type,
            metadata: l.metadata
        }));

        // Map DB types to frontend types
        const habits = habitsData.map((h: any) => {
            const habitLinks = links.filter(l => l.sourceHabitId === h.id || l.targetHabitId === h.id);

            // Check prerequisites
            const prerequisites = links.filter(l => l.targetHabitId === h.id && l.type === 'prerequisite');
            const allPrereqsMet = prerequisites.length === 0 || prerequisites.every(p =>
                logs.some(log => log.habit_id === p.sourceHabitId)
            );

            return {
                id: h.id,
                title: h.title,
                category: h.category as HabitCategory,
                timeOfDay: h.time_of_day as TimeOfDay,
                frequency: h.frequency as DayOfWeek[],
                streak: h.streak || 0,
                completedToday: logs.some(l => l.habit_id === h.id),
                type: h.type || 'habit',
                goalDuration: h.goal_duration,
                goalProgress: h.goal_progress || 0,
                archived: h.archived || false,
                priority: h.priority || 'medium',
                order: h.order || 0,
                createdAt: h.created_at,
                links: habitLinks,
                isLocked: !allPrereqsMet
            };
        });

        return habits;
    },

    async createHabit(habit: Omit<Habit, 'id' | 'streak' | 'completedToday'>) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user logged in');

        const payload: any = {
            user_id: user.id,
            title: habit.title,
            category: habit.category,
            time_of_day: habit.timeOfDay,
            frequency: habit.frequency,
            type: habit.type,
            goal_duration: habit.goalDuration,
            goal_progress: habit.goalProgress,
        };

        // These columns might be missing in older schemas
        if (habit.priority) payload.priority = habit.priority;
        if (habit.order !== undefined) payload.order = habit.order;
        payload.archived = false;

        const { data, error } = await supabase
            .from('habits')
            .insert(payload)
            .select()
            .single();

        if (error) throw error;

        // Save links if any (Resilient)
        if (habit.links && habit.links.length > 0) {
            try {
                const linksToInsert = habit.links.map(l => ({
                    user_id: user.id,
                    source_habit_id: data.id,
                    target_habit_id: l.targetHabitId,
                    type: l.type,
                    metadata: l.metadata || {}
                }));
                await supabase.from('habit_links').insert(linksToInsert);

                // --- 🌌 MULTIVERSE SYNC ---
                for (const l of habit.links) {
                    await MultiverseService.createLink({
                        sourceType: 'habit',
                        sourceId: data.id,
                        targetType: 'habit',
                        targetId: l.targetHabitId,
                        relationType: l.type as any === 'synergy' ? 'synergy' : 'prerequisite'
                    });
                }
            } catch (linkError) {
                console.warn("Failed to save habit links (table might be missing):", linkError);
            }
        }

        return data;
    },

    async updateHabit(id: string, updates: Partial<Habit>) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user');

        const payload: any = {};
        if (updates.title) payload.title = updates.title;
        if (updates.category) payload.category = updates.category;
        if (updates.timeOfDay) payload.time_of_day = updates.timeOfDay;
        if (updates.frequency) payload.frequency = updates.frequency;
        if (updates.priority) payload.priority = updates.priority;
        if (updates.archived !== undefined) payload.archived = updates.archived;
        if (updates.order !== undefined) payload.order = updates.order;
        if (updates.goalDuration) payload.goal_duration = updates.goalDuration;

        const { error } = await supabase
            .from('habits')
            .update(payload)
            .eq('id', id);

        if (error) throw error;

        // Update links (Sync approach: delete old, insert new)
        if (updates.links) {
            await supabase.from('habit_links').delete().eq('source_habit_id', id);

            if (updates.links.length > 0) {
                const linksToInsert = updates.links.map(l => ({
                    user_id: user.id,
                    source_habit_id: id,
                    target_habit_id: l.targetHabitId,
                    type: l.type,
                    metadata: l.metadata || {}
                }));
                await supabase.from('habit_links').insert(linksToInsert);

                // --- 🌌 MULTIVERSE SYNC ---
                // For simplified logic, we just add new links. 
                // A better approach would be to reconciliate, but for now we follow the same pattern.
                for (const l of updates.links) {
                    await MultiverseService.createLink({
                        sourceType: 'habit',
                        sourceId: id,
                        targetType: 'habit',
                        targetId: l.targetHabitId,
                        relationType: l.type as any === 'synergy' ? 'synergy' : 'prerequisite'
                    });
                }
            }
        }
    },

    async deleteHabit(id: string) {
        // Hard delete for now, or we can just use archive
        const { error } = await supabase.from('habits').delete().eq('id', id);
        if (error) throw error;
    },

    async archiveHabit(id: string) {
        return this.updateHabit(id, { archived: true });
    },

    // --- Habit Links ---
    async getHabitLinks(userId?: string): Promise<HabitLink[]> {
        const uid = userId || (await supabase.auth.getUser()).data.user?.id;
        if (!uid) return [];
        const { data, error } = await supabase
            .from('habit_links')
            .select('*')
            .eq('user_id', uid);
        if (error) throw error;
        return (data || []).map((l: any) => ({
            id: l.id,
            sourceHabitId: l.source_habit_id,
            targetHabitId: l.target_habit_id,
            type: l.type,
            metadata: l.metadata
        }));
    },

    async createHabitLink(link: Omit<HabitLink, 'id'>) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user');

        const { data, error } = await supabase
            .from('habit_links')
            .insert({
                user_id: user.id,
                source_habit_id: link.sourceHabitId,
                target_habit_id: link.targetHabitId,
                type: link.type,
                metadata: link.metadata || {}
            })
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async deleteHabitLink(id: string) {
        const { error } = await supabase
            .from('habit_links')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    // --- XP System ---
    async getProfile() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from('profiles')
            .select('level, current_xp, next_level_xp')
            .eq('id', user.id)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // Ignore no rows (handled by RPC)
        return data;
    },

    async incrementXP(amount: number) {
        const { error } = await supabase.rpc('increment_xp', { amount });
        if (error) throw error;
    },

    // --- Logs (Completions) ---
    async getLogs(startDate: string, endDate: string, userId?: string) {
        // Fetch logs for heatmap & today
        try {
            const uid = userId || (await supabase.auth.getUser()).data.user?.id;
            if (!uid) return [];

            const { data, error } = await supabase
                .from('habit_logs')
                .select('*')
                .eq('user_id', uid)
                .gte('date', startDate)
                .lte('date', endDate);

            if (error) {
                console.warn("Failed to fetch logs (possibly table missing):", error);
                return [];
            }
            return data || [];
        } catch (e) {
            return [];
        }
    },

    async getSkips(startDate: string, endDate: string, userId?: string) {
        const uid = userId || (await supabase.auth.getUser()).data.user?.id;
        if (!uid) return [];
        const { data, error } = await supabase
            .from('habit_skips')
            .select('*')
            .eq('user_id', uid)
            .gte('date', startDate)
            .lte('date', endDate);
        // If error (table missing), return empty
        if (error) return [];
        return data || [];
    },

    async toggleHabitCompletion(habitId: string, date: string, isCompleted: boolean, note?: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user');

        if (isCompleted) {
            // Insert log
            const { error } = await supabase
                .from('habit_logs')
                .insert({
                    user_id: user.id,
                    habit_id: habitId,
                    date: date,
                    note: note
                });
            if (error && error.code !== '23505') throw error; // Ignore duplicate key

            // Base XP
            let xpToAward = 10;
            let synergyBonus = false;

            // Phase 10: Synergy Bonus
            const links = await this.getHabitLinks(user.id);
            const habitLinks = links.filter(l => (l.sourceHabitId === habitId || l.targetHabitId === habitId) && l.type === 'synergy');

            if (habitLinks.length > 0) {
                // Check if any synergized habit is also completed today
                const logs = await this.getLogs(date, date);
                for (const link of habitLinks) {
                    const otherId = link.sourceHabitId === habitId ? link.targetHabitId : link.sourceHabitId;
                    if (logs.some(log => log.habit_id === otherId)) {
                        xpToAward += 5; // Synergy Bonus!
                        synergyBonus = true;
                        break;
                    }
                }
            }

            await this.incrementXP(xpToAward);

            // Auto-remove skip if exists
            this.undoSkip(habitId, date);

            return { xpGained: xpToAward, synergyBonus };
        } else {
            // Delete log
            const { error } = await supabase
                .from('habit_logs')
                .delete()
                .match({ habit_id: habitId, date: date });
            if (error) throw error;

            // Deduct XP
            await this.incrementXP(-10);
            return { xpGained: -10, synergyBonus: false };
        }
    },

    async skipHabit(habitId: string, date: string, reason: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user');

        const { error } = await supabase
            .from('habit_skips')
            .insert({
                user_id: user.id,
                habit_id: habitId,
                date: date,
                reason: reason
            });

        if (error && error.code !== '23505') throw error;
    },

    async undoSkip(habitId: string, date: string) {
        try {
            await supabase.from('habit_skips').delete().match({ habit_id: habitId, date: date });
        } catch (e) { /* ignore */ }
    },

    // --- Goals ---
    async updateGoalProgress(habitId: string, progress: number) {
        const { error } = await supabase
            .from('habits')
            .update({ goal_progress: progress })
            .eq('id', habitId);
        if (error) throw error;
    },

    // --- Reflections ---
    async getReflections(startDate: string, endDate: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('daily_reflections')
            .select('*')
            .eq('user_id', user.id)
            .gte('date', startDate)
            .lte('date', endDate);

        if (error) throw error;
        return data || [];
    },

    async saveReflection(date: string, mood: string, note: string) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user');

        const { error } = await supabase
            .from('daily_reflections')
            .upsert({
                user_id: user.id,
                date: date,
                mood: mood,
                note: note
            }, { onConflict: 'user_id, date' });

        if (error) throw error;
    },

    // --- Arrears ---
    async getArrears() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];
        const uid = user.id;

        const now = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        const startDate = thirtyDaysAgo.toISOString().split('T')[0];
        const endDate = now.toISOString().split('T')[0];

        // Parallel fetch for calculation data
        const [habits, logs, skips] = await Promise.all([
            this.getHabits(uid),
            this.getLogs(startDate, endDate, uid),
            this.getSkips(startDate, endDate, uid)
        ]);

        const arrears: any[] = [];

        habits.forEach(habit => {
            if (habit.archived) return;

            // Start from 30 days ago or habit creation, whichever is newer
            let checkDate = new Date(thirtyDaysAgo);
            if (habit.createdAt) {
                const createdDate = new Date(habit.createdAt);
                if (createdDate > checkDate) {
                    checkDate = new Date(createdDate);
                }
            }

            // Set time to noon to avoid timezone shift issues during date calculation
            checkDate.setHours(12, 0, 0, 0);

            while (checkDate < now) {
                const dateStr = checkDate.toISOString().split('T')[0];
                const dayOfWeek = checkDate.getDay();

                const isScheduled = habit.frequency.includes(dayOfWeek as any);

                if (isScheduled) {
                    const isDone = logs.some(l => l.habit_id === habit.id && l.date === dateStr);
                    const isSkipped = skips.some(s => s.habit_id === habit.id && s.date === dateStr);

                    // yesterday or older
                    if (!isDone && !isSkipped && dateStr !== endDate) {
                        arrears.push({
                            habitId: habit.id,
                            title: habit.title,
                            date: dateStr,
                            priority: habit.priority
                        });
                    }
                }

                checkDate.setDate(checkDate.getDate() + 1);
            }
        });

        // Sort by date descending (newest arrears first)
        return arrears.sort((a, b) => b.date.localeCompare(a.date));
    },

    async resetAccount() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user');

        // Delete all data for this user
        // Note: The order matters if there are foreign key constraints, 
        // but typically 'cascade' might handle it. 
        // If not, delete children first.

        const tables = [
            'habit_logs',
            'habit_skips',
            'habit_links',
            'daily_reflections',
            'notes', // Assuming this table exists, if not it will just fail/ignore
            'habits'
        ];

        for (const table of tables) {
            try {
                await supabase.from(table).delete().eq('user_id', user.id);
            } catch (e) {
                console.warn(`Failed to clear table ${table}`, e);
            }
        }

        // Also clear profiles/XP if desired? 
        // Usually "reset account" might imply keeping the login but clearing data.
        // Let's reset XP too.
        try {
            await supabase.from('profiles').update({
                level: 1,
                current_xp: 0,
                next_level_xp: 100
            }).eq('id', user.id);
        } catch (e) { /* ignore */ }
    }
};
