import { supabase } from '../lib/supabase';
import { Reminder } from '../types/reminder';

export const ReminderService = {
    async getReminders(): Promise<Reminder[]> {
        const { data, error } = await supabase
            .from('reminders')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error fetching reminders:', error);
            // Fallback to local storage if DB fails (or table doesn't exist yet)
            // returning null/empty or handling gracefully
            throw error;
        }

        return (data || []).map((r: any) => ({
            id: r.id,
            title: r.title,
            time: r.time,
            days: r.days || [],
            date: r.date,
            habitId: r.habit_id,
            notificationType: r.notification_type || 'in-app',
            isEnabled: r.is_enabled,
            lastTriggered: r.last_triggered
        }));
    },

    async createReminder(reminder: Omit<Reminder, 'id' | 'lastTriggered'>) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No user logged in');

        const { data, error } = await supabase
            .from('reminders')
            .insert({
                user_id: user.id,
                title: reminder.title,
                time: reminder.time,
                days: reminder.days,
                date: reminder.date,
                habit_id: reminder.habitId,
                notification_type: reminder.notificationType,
                is_enabled: reminder.isEnabled
            })
            .select()
            .single();

        if (error) throw error;
        return {
            id: data.id,
            title: data.title,
            time: data.time,
            days: data.days,
            date: data.date,
            habitId: data.habit_id,
            notificationType: data.notification_type,
            isEnabled: data.is_enabled,
            lastTriggered: data.last_triggered
        };
    },

    async updateReminder(id: string, updates: Partial<Reminder>) {
        const payload: any = {};
        if (updates.title !== undefined) payload.title = updates.title;
        if (updates.time !== undefined) payload.time = updates.time;
        if (updates.days !== undefined) payload.days = updates.days;
        if (updates.date !== undefined) payload.date = updates.date;
        if (updates.habitId !== undefined) payload.habit_id = updates.habitId;
        if (updates.notificationType !== undefined) payload.notification_type = updates.notificationType;
        if (updates.isEnabled !== undefined) payload.is_enabled = updates.isEnabled;
        if (updates.lastTriggered !== undefined) payload.last_triggered = updates.lastTriggered;

        const { error } = await supabase
            .from('reminders')
            .update(payload)
            .eq('id', id);

        if (error) throw error;
    },

    async deleteReminder(id: string) {
        const { error } = await supabase
            .from('reminders')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
