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
            throw error;
        }

        return (data || []).map((r: any) => this.mapReminder(r));
    },

    async createReminder(reminder: Omit<Reminder, 'id' | 'lastTriggered'>) {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) throw new Error('No user logged in');

        const payload: any = {
            user_id: user.id,
            title: reminder.title,
            time: reminder.time,
            days: reminder.days,
            date: reminder.date,
            is_enabled: reminder.isEnabled
        };

        // Validate habit_id as UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (reminder.habitId && uuidRegex.test(reminder.habitId)) {
            payload.habit_id = reminder.habitId;
        }
        if (reminder.videoId && uuidRegex.test(reminder.videoId)) {
            payload.video_id = reminder.videoId;
        }
        if (reminder.courseId && uuidRegex.test(reminder.courseId)) payload.course_id = reminder.courseId;
        if (reminder.resourceId && uuidRegex.test(reminder.resourceId)) {
            payload.resource_id = reminder.resourceId;
        }
        if (reminder.folderId && uuidRegex.test(reminder.folderId)) payload.folder_id = reminder.folderId;

        if (reminder.notificationType) {
            payload.notification_type = reminder.notificationType;
        }

        // Try to include optional columns, but fallback if they don't exist
        try {
            const { data, error } = await supabase
                .from('reminders')
                .insert(payload)
                .select()
                .single();

            if (error) {
                // If it's a "column missing" error, try again without those columns
                if (error.code === '42703') {
                    console.warn('Schema mismatch detected, falling back to basic insert');
                    const { data: retryData, error: retryError } = await supabase
                        .from('reminders')
                        .insert(payload)
                        .select()
                        .single();
                    if (retryError) throw retryError;
                    return this.mapReminder(retryData);
                }
                throw error;
            }
            return this.mapReminder(data);
        } catch (e: any) {
            console.error('Create reminder failed:', e);
            throw e;
        }
    },

    mapReminder(r: any): Reminder {
        return {
            id: r.id,
            title: r.title,
            time: r.time,
            days: r.days || [],
            date: r.date,
            habitId: r.habit_id,
            videoId: r.video_id,
            courseId: r.course_id,
            resourceId: r.resource_id,
            folderId: r.folder_id,
            notificationType: r.notification_type || 'in-app',
            isEnabled: r.is_enabled,
            lastTriggered: r.last_triggered
        };
    },

    async updateReminder(id: string, updates: Partial<Reminder>) {
        const payload: any = {};
        if (updates.title !== undefined) payload.title = updates.title;
        if (updates.time !== undefined) payload.time = updates.time;
        if (updates.days !== undefined) payload.days = updates.days;
        if (updates.date !== undefined) payload.date = updates.date;
        if (updates.notificationType !== undefined) payload.notification_type = updates.notificationType;
        if (updates.isEnabled !== undefined) payload.is_enabled = updates.isEnabled;
        if (updates.lastTriggered !== undefined) payload.last_triggered = updates.lastTriggered;

        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (updates.habitId !== undefined) {
            if (updates.habitId && uuidRegex.test(updates.habitId)) {
                payload.habit_id = updates.habitId;
            } else {
                payload.habit_id = null;
            }
        }
        if (updates.videoId !== undefined) {
            payload.video_id = (updates.videoId && uuidRegex.test(updates.videoId)) ? updates.videoId : null;
        }
        if (updates.courseId !== undefined) payload.course_id = (updates.courseId && uuidRegex.test(updates.courseId)) ? updates.courseId : null;
        if (updates.resourceId !== undefined) payload.resource_id = (updates.resourceId && uuidRegex.test(updates.resourceId)) ? updates.resourceId : null;
        if (updates.folderId !== undefined) payload.folder_id = (updates.folderId && uuidRegex.test(updates.folderId)) ? updates.folderId : null;

        try {
            const { error } = await supabase
                .from('reminders')
                .update(payload)
                .eq('id', id);

            if (error) {
                if (error.code === '42703') {
                    delete payload.habit_id;
                    delete payload.notification_type;
                    const { error: retryError } = await supabase
                        .from('reminders')
                        .update(payload)
                        .eq('id', id);
                    if (retryError) throw retryError;
                } else {
                    throw error;
                }
            }
        } catch (e) {
            console.error('Update reminder failed:', e);
            throw e;
        }
    },

    async deleteReminder(id: string) {
        const { error } = await supabase
            .from('reminders')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async deleteAllReminders() {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) throw new Error('No user logged in');

        const { error } = await supabase
            .from('reminders')
            .delete()
            .eq('user_id', user.id);

        if (error) throw error;
    },

    async updateAllStatus(isEnabled: boolean) {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) throw new Error('No user logged in');

        const { error } = await supabase
            .from('reminders')
            .update({ is_enabled: isEnabled })
            .eq('user_id', user.id);

        if (error) throw error;
    }
};
