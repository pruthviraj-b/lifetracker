

import { supabase } from '../lib/supabase';
import { HabitService } from './habit.service';
import { ReminderService } from './reminder.service';
import { NoteService } from './note.service';
import { Habit, DayLog } from '../types/habit';
import { Reminder } from '../types/reminder';
import { Note } from '../types/note';

export interface BackupData {
    version: number;
    timestamp: string;
    habits: Habit[];
    logs: Record<string, DayLog>; // log keys (usually dates?) need to be careful with structure
    reminders: Reminder[];
    notes: Note[];
}

export const DataService = {
    // --- Export ---
    async exportData(): Promise<BackupData> {
        // 1. Fetch all habits
        const habits = await HabitService.getHabits();

        // 2. Fetch all logs (we might need a "getAllLogs" in HabitService or raw query)
        // Since HabitService.getLogs takes a range, let's fetch 'all' time or just raw query here for efficiency
        const { data: logsData, error: logsError } = await supabase
            .from('habit_logs')
            .select('*');
        if (logsError) throw logsError;

        // Convert db logs to Record<date, DayLog> approximation or just keep array?
        // Let's keep it raw or close to our Service structure.
        // Actually, for restore, array is easier. But our type says Record.
        // Let's change BackupData to use arrays for simpler restoration.

        // 3. Fetch all reminders
        const reminders = await ReminderService.getReminders();

        // 4. Fetch all notes
        const notes = await NoteService.getNotes();

        return {
            version: 1,
            timestamp: new Date().toISOString(),
            habits: habits,
            logs: logsData as any, // casting for now, ideally Map
            reminders: reminders,
            notes: notes
        };
    },

    async downloadExport() {
        try {
            const data = await this.exportData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `habit-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Export failed:", error);
            throw error;
        }
    },

    // --- Import ---
    async importData(jsonData: string) {
        let data: BackupData;
        try {
            data = JSON.parse(jsonData);
        } catch (e) {
            throw new Error("Invalid JSON file");
        }

        if (!data.habits || !Array.isArray(data.habits)) throw new Error("Invalid backup format: Missing habits");

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not logged in");

        // Strategy: Upsert based on ID? OR Wipe and Replace?
        // "Import" usually implies "Add to existing" or "Restore". 
        // Safer to "Upsert" to avoid duplicate ID errors, but could duplicate if IDs changed.
        // Let's assume restoration involves overwriting if ID matches.

        // 1. Restore Habits
        for (const h of data.habits) {
            // Need to convert frontend Habit to DB columns
            // This suggests duplication of mapping logic from HabitService.createHabit.
            // Ideally HabitService exposes a 'rawInsert' or we use it here.
            // Let's map it manually or better: Use HabitService logic if possible, 
            // but createHabit generates new ID. We want to KEEP old ID?
            // If we want to keep history, we MUST keep IDs.

            const dbHabit = {
                id: h.id, // Explicitly keep ID
                user_id: user.id,
                title: h.title,
                category: h.category,
                time_of_day: h.timeOfDay,
                frequency: h.frequency,
                type: h.type || 'habit',
                goal_duration: h.goalDuration,
                goal_progress: h.goalProgress,
                priority: h.priority,
                order: h.order || 0,
                archived: h.archived || false,
                streak: h.streak // restore streak too? usually calculated. leave it.
            };

            const { error } = await supabase.from('habits').upsert(dbHabit);
            if (error) console.error(`Failed to import habit ${h.title}`, error);
        }

        // 2. Restore Reminders
        if (data.reminders) {
            for (const r of data.reminders) {
                const dbReminder = {
                    id: r.id,
                    user_id: user.id,
                    title: r.title,
                    time: r.time,
                    days: r.days,
                    date: r.date,
                    is_enabled: r.isEnabled,
                    notification_type: r.notificationType || 'in-app'
                };
                const { error } = await supabase.from('reminders').upsert(dbReminder);
                if (error) console.error(`Failed to import reminder ${r.title}`, error);
            }
        }

        // 3. Restore Logs (Critical for history)
        if (data.logs && Array.isArray(data.logs)) {
            for (const log of data.logs) {
                try {
                    const dbLog = {
                        user_id: user.id,
                        habit_id: log.habit_id,
                        date: log.date,
                        note: log.note,
                        // Ensure we don't pass ID if we want DB to auto-gen, or keep if we want exact
                        // Let's rely on composite key (user, habit, date) if possible, or just insert
                    };
                    // Use simple insert or upsert
                    await supabase.from('habit_logs').upsert(dbLog, { onConflict: 'user_id,habit_id,date' });
                } catch (e) {
                    console.warn("Failed to import log", e);
                }
            }
        } else if (data.logs && typeof data.logs === 'object') {
            // Handle if legacy format was Record<string, Log>
            // Convert to array
            const logArray = Object.values(data.logs);
            for (const log of logArray) {
                await supabase.from('habit_logs').upsert({ ...log, user_id: user.id });
            }
        }

        // 4. Restore Notes (New Feature)
        if ((data as any).notes && Array.isArray((data as any).notes)) {
            for (const note of (data as any).notes) {
                try {
                    const dbNote = {
                        id: note.id,
                        user_id: user.id,
                        title: note.title,
                        content: note.content,
                        category: note.category || 'general',
                        color: note.color || '#ffffff',
                        is_pinned: note.isPinned || false,
                        created_at: note.createdAt || new Date().toISOString(),
                        updated_at: note.updatedAt || new Date().toISOString(),
                        type: note.type || 'standalone'
                    };

                    // Upsert note
                    await supabase.from('notes').upsert(dbNote);
                } catch (e) {
                    console.warn("Failed to import note", e);
                }
            }
        }

        return true;
    },

    // --- Delete Account ---
    async deleteAccount() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("No user");

        // Client-side cascade delete (Not atomic, but works if no foreign key blocks)
        // 1. Logs
        await supabase.from('habit_logs').delete().eq('user_id', user.id);
        // 2. Notes
        await supabase.from('notes').delete().eq('user_id', user.id);
        // 3. Reflections
        await supabase.from('reflections').delete().eq('user_id', user.id);
        // 4. Reminders
        await supabase.from('reminders').delete().eq('user_id', user.id);
        // 5. Habits (Parent)
        await supabase.from('habits').delete().eq('user_id', user.id);
        // 6. Profiles
        await supabase.from('profiles').delete().eq('id', user.id);

        // Finally, sign out. We can't delete the Auth User from client side without Service Role.
        // We will just clear data and logout.
    },

    // --- Usage ---
    async getStorageUsage() {
        // Count rows
        const { count: hCount } = await supabase.from('habits').select('*', { count: 'exact', head: true });
        const { count: lCount } = await supabase.from('habit_logs').select('*', { count: 'exact', head: true });
        const { count: rCount } = await supabase.from('reminders').select('*', { count: 'exact', head: true });

        const totalRows = (hCount || 0) + (lCount || 0) + (rCount || 0);
        return {
            habits: hCount || 0,
            logs: lCount || 0,
            reminders: rCount || 0,
            estimatedSize: `${(totalRows * 0.5).toFixed(2)} KB` // Rough estimate
        };
    }
};
