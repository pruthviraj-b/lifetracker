

import { supabase } from '../lib/supabase';
import { HabitService } from './habit.service';
import { ReminderService } from './reminder.service';
import { NoteService } from './note.service';
import { TaskService } from './task.service';
import { ProtocolService } from './protocol.service';
import { ScheduleService } from './schedule.service';
import { RecallService } from './recall.service';
import { MetricsService } from './metrics.service';
import { LibraryService } from './library.service';
import { NetworkService } from './network.service';
import { Habit, DayLog } from '../types/habit';
import { Reminder } from '../types/reminder';
import { Note } from '../types/note';
import { Task } from '../types/task';
import { Protocol } from '../types/protocol';
import { ScheduleEvent } from '../types/schedule';
import { RecallEntry } from '../types/recall';
import { MetricLog } from '../types/metric';
import { LibraryItem } from '../types/library';
import { NetworkConnection } from '../types/network';

export interface BackupData {
    version: number;
    timestamp: string;
    habits: Habit[];
    logs: Record<string, DayLog>; // log keys (usually dates?) need to be careful with structure
    reminders: Reminder[];
    notes: Note[];
    tasks: Task[];
    protocols: Protocol[];
    scheduleEvents: ScheduleEvent[];
    recallEntries: RecallEntry[];
    metricLogs: MetricLog[];
    libraryItems: LibraryItem[];
    networkConnections: NetworkConnection[];
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
        // 5. Fetch remaining entities
        const [
            tasks,
            protocols,
            scheduleEvents,
            recallEntries,
            metricLogs,
            libraryItems,
            networkConnections
        ] = await Promise.all([
            TaskService.getTasks(),
            ProtocolService.getProtocols(),
            ScheduleService.getEvents(),
            RecallService.getEntries(),
            MetricsService.getLogs(),
            LibraryService.getItems(),
            NetworkService.getConnections()
        ]);

        return {
            version: 1,
            timestamp: new Date().toISOString(),
            habits: habits,
            logs: logsData as any, // casting for now, ideally Map
            reminders: reminders,
            notes: notes,
            tasks,
            protocols,
            scheduleEvents,
            recallEntries,
            metricLogs,
            libraryItems,
            networkConnections
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

        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
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

        // 5. Restore Tasks
        if ((data as any).tasks && Array.isArray((data as any).tasks)) {
            for (const task of (data as any).tasks) {
                try {
                    await supabase.from('tasks').upsert({
                        id: task.id,
                        user_id: user.id,
                        title: task.title,
                        due_date: task.dueDate,
                        priority: task.priority,
                        notes: task.notes,
                        status: task.status || 'open',
                        completed_at: task.completedAt
                    });
                } catch (e) { console.warn('Failed to import task', e); }
            }
        }

        // 6. Restore Protocols
        if ((data as any).protocols && Array.isArray((data as any).protocols)) {
            for (const protocol of (data as any).protocols) {
                try {
                    await supabase.from('protocols').upsert({
                        id: protocol.id,
                        user_id: user.id,
                        title: protocol.title,
                        steps: protocol.steps || [],
                        total_minutes: protocol.totalMinutes || 0
                    });
                } catch (e) { console.warn('Failed to import protocol', e); }
            }
        }

        // 7. Restore Schedule
        if ((data as any).scheduleEvents && Array.isArray((data as any).scheduleEvents)) {
            for (const event of (data as any).scheduleEvents) {
                try {
                    await supabase.from('schedule_events').upsert({
                        id: event.id,
                        user_id: user.id,
                        title: event.title,
                        event_date: event.eventDate,
                        event_time: event.eventTime,
                        time_label: event.timeLabel
                    });
                } catch (e) { console.warn('Failed to import event', e); }
            }
        }

        // 8. Restore Recall
        if ((data as any).recallEntries && Array.isArray((data as any).recallEntries)) {
            for (const entry of (data as any).recallEntries) {
                try {
                    await supabase.from('recall_entries').upsert({
                        id: entry.id,
                        user_id: user.id,
                        content: entry.content,
                        category: entry.category || 'general'
                    });
                } catch (e) { console.warn('Failed to import recall entry', e); }
            }
        }

        // 9. Restore Metrics
        if ((data as any).metricLogs && Array.isArray((data as any).metricLogs)) {
            for (const log of (data as any).metricLogs) {
                try {
                    await supabase.from('metric_logs').upsert({
                        id: log.id,
                        user_id: user.id,
                        metric: log.metric,
                        value: log.value,
                        unit: log.unit,
                        log_date: log.logDate
                    });
                } catch (e) { console.warn('Failed to import metric log', e); }
            }
        }

        // 10. Restore Library
        if ((data as any).libraryItems && Array.isArray((data as any).libraryItems)) {
            for (const item of (data as any).libraryItems) {
                try {
                    await supabase.from('library_items').upsert({
                        id: item.id,
                        user_id: user.id,
                        title: item.title,
                        url: item.url,
                        category: item.category || 'general'
                    });
                } catch (e) { console.warn('Failed to import library item', e); }
            }
        }

        // 11. Restore Network
        if ((data as any).networkConnections && Array.isArray((data as any).networkConnections)) {
            for (const connection of (data as any).networkConnections) {
                try {
                    await supabase.from('network_connections').upsert({
                        id: connection.id,
                        user_id: user.id,
                        name: connection.name,
                        relationship: connection.relationship,
                        shared_habits: connection.sharedHabits
                    });
                } catch (e) { console.warn('Failed to import network connection', e); }
            }
        }

        return true;
    },

    // --- Delete Account ---
    async deleteAccount() {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
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
        // 6. Additional tables
        await supabase.from('tasks').delete().eq('user_id', user.id);
        await supabase.from('protocols').delete().eq('user_id', user.id);
        await supabase.from('schedule_events').delete().eq('user_id', user.id);
        await supabase.from('recall_entries').delete().eq('user_id', user.id);
        await supabase.from('metric_logs').delete().eq('user_id', user.id);
        await supabase.from('library_items').delete().eq('user_id', user.id);
        await supabase.from('network_connections').delete().eq('user_id', user.id);
        // 6. Profiles
        await supabase.from('profiles').delete().eq('id', user.id);

        // Finally, sign out. We can't delete the Auth User from client side without Service Role.
        // We will just clear data and logout.
    },

    // --- Usage ---
    async getStorageUsage() {
        // Count rows
        const { count: hCount } = await supabase.from('habits').select('*', { count: 'exact', head: true });
        const { count: logCount } = await supabase.from('habit_logs').select('*', { count: 'exact', head: true });
        const { count: rCount } = await supabase.from('reminders').select('*', { count: 'exact', head: true });
        const { count: tCount } = await supabase.from('tasks').select('*', { count: 'exact', head: true });
        const { count: pCount } = await supabase.from('protocols').select('*', { count: 'exact', head: true });
        const { count: sCount } = await supabase.from('schedule_events').select('*', { count: 'exact', head: true });
        const { count: cCount } = await supabase.from('recall_entries').select('*', { count: 'exact', head: true });
        const { count: mCount } = await supabase.from('metric_logs').select('*', { count: 'exact', head: true });
        const { count: libCount } = await supabase.from('library_items').select('*', { count: 'exact', head: true });
        const { count: nCount } = await supabase.from('network_connections').select('*', { count: 'exact', head: true });

        const totalRows = (hCount || 0) + (logCount || 0) + (rCount || 0) + (tCount || 0) + (pCount || 0) + (sCount || 0) + (cCount || 0) + (mCount || 0) + (libCount || 0) + (nCount || 0);
        return {
            habits: hCount || 0,
            logs: logCount || 0,
            reminders: rCount || 0,
            tasks: tCount || 0,
            protocols: pCount || 0,
            schedule: sCount || 0,
            recall: cCount || 0,
            metrics: mCount || 0,
            library: libCount || 0,
            network: nCount || 0,
            estimatedSize: `${(totalRows * 0.5).toFixed(2)} KB` // Rough estimate
        };
    }
};
