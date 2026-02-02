export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'anytime';
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday
export type HabitCategory = 'health' | 'work' | 'learning' | 'mindfulness' | 'social';
export type Mood = 'great' | 'good' | 'neutral' | 'tired' | 'stressed';

export type HabitLinkType = 'chain' | 'prerequisite' | 'synergy' | 'conflict';

export interface HabitLink {
    id: string;
    sourceHabitId: string;
    targetHabitId: string;
    type: HabitLinkType;
    metadata?: any;
}

export interface Habit {
    id: string;
    title: string;
    description?: string;
    category: HabitCategory;
    timeOfDay: TimeOfDay;
    frequency: DayOfWeek[];
    color?: string;
    archived?: boolean;
    priority?: 'high' | 'medium' | 'low';
    order?: number;
    type: 'habit' | 'goal';
    goalDuration?: number;
    goalProgress?: number;
    streak: number;
    completedToday: boolean;
    skippedToday?: boolean;
    completionRate?: number;
    totalCompletions?: number;
    createdAt?: string;
    // Relationships (Phase 10)
    links?: HabitLink[];
    isLocked?: boolean; // Prerequisite not met
    prerequisitesMet?: boolean;
}

export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string;
    unlockedAt?: string; // Date ISO
}

export interface DayLog {
    date: string; // YYYY-MM-DD
    mood?: Mood;
    journalEntry?: string;
    completedHabitIds: string[];
    skippedHabitIds?: string[]; // IDs of habits skipped with reason
    totalHabits: number; // For percentage calc
}

// Represents a single completion event
export interface CompletionLog {
    id: string;
    user_id: string;
    habit_id: string;
    date: string;
    note?: string;
    created_at?: string;
}

export interface UserStats {
    totalCompletions: number;
    currentStreak: number;
    longestStreak: number;
    level: number;
    xp: number;
}
