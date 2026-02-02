export interface Reminder {
    id: string;
    title: string;
    time: string; // HH:mm format (24h)
    days: number[]; // 0 = Sunday, 1 = Monday, etc. Empty = Once
    date?: string; // YYYY-MM-DD (Optional, for specific date)
    isEnabled: boolean;
    habitId?: string; // Optional link to a habit
    promptForNote?: boolean; // If linked, should we ask for a note?
    customMessage?: string; // Override default "Time for..." message
    notificationType?: 'in-app' | 'email' | 'push';
    lastTriggered?: string; // ISO Date to prevent double triggering
}

export const DAYS_OF_WEEK = [
    { id: 1, label: 'M' },
    { id: 2, label: 'T' },
    { id: 3, label: 'W' },
    { id: 4, label: 'T' },
    { id: 5, label: 'F' },
    { id: 6, label: 'S' },
    { id: 0, label: 'S' }
];
