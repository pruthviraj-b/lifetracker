import { supabase } from '../lib/supabase';
import { Flashcard, CreateFlashcardInput, ReviewRating } from '../types/flashcard';

export const FlashcardService = {
    // --- SRS Algorithm (SM-2 Variant) ---
    calculateNextReview(current: Flashcard, rating: ReviewRating): Partial<Flashcard> {
        let newInterval = 0;
        let newEase = current.easeFactor;
        let newStreak = current.streak;

        if (rating === 1) {
            // Again (Fail)
            newInterval = 0; // Reset to 0 days (Review today/tomorrow)
            newStreak = 0;
            // Ease drops slightly to punish forgetting
            newEase = Math.max(1.3, newEase - 0.2);
        } else {
            // Success (Hard, Good, Easy)
            if (newStreak === 0) {
                newInterval = 1;
            } else if (newStreak === 1) {
                newInterval = 3; // Jump to 3 days
            } else {
                newInterval = Math.round(current.interval * newEase);
            }
            newStreak++;

            // Adjust Ease Factor
            // Standard SM-2 formula adjustment or simplified variant
            if (rating === 2) newEase -= 0.15; // Hard
            if (rating === 4) newEase += 0.15; // Easy (Bonus)
            // Rating 3 (Good) keeps ease mostly stable or slight adjust
        }

        // Calculate next date
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + newInterval);

        // If 'Again', we might want it effectively 'Now' or 'Tomorrow'
        // For simplicity, 0 interval = Tomorrow in this logic, or immediate?
        // Let's stick to Date math. If interval is 0, it means "Review Now" or "Tomorrow".
        // Usually review queues show anything where nextDate <= NOW.
        // If interval is 0, we set nextDate to NOW (so it stays in queue) or +1min?
        // Let's set it to NOW + 1 minute if Rating 1
        if (rating === 1) {
            nextDate.setTime(Date.now());
        }

        return {
            interval: newInterval,
            easeFactor: parseFloat(newEase.toFixed(2)),
            streak: newStreak,
            nextReview: nextDate.toISOString()
        };
    },

    // --- CRUD ---

    async getDueFlashcards(): Promise<Flashcard[]> {
        const now = new Date().toISOString();
        const { data, error } = await supabase
            .from('flashcards')
            .select('*')
            .lte('next_review', now)
            .order('next_review', { ascending: true })
            .limit(50); // Cap at 50 per session

        if (error) throw error;

        return (data || []).map(this.mapResponse);
    },

    async getAllFlashcards(): Promise<Flashcard[]> {
        const { data, error } = await supabase
            .from('flashcards')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []).map(this.mapResponse);
    },

    async createFlashcard(input: CreateFlashcardInput): Promise<Flashcard> {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) throw new Error('No user');

        const { data, error } = await supabase
            .from('flashcards')
            .insert({
                user_id: user.id,
                front: input.front,
                back: input.back,
                note_id: input.noteId,
                // Defaults are handled by DB but we can ensure them here too if strict
            })
            .select()
            .single();

        if (error) throw error;
        return this.mapResponse(data);
    },

    async reviewFlashcard(id: string, updates: Partial<Flashcard>): Promise<void> {
        const { error } = await supabase
            .from('flashcards')
            .update({
                next_review: updates.nextReview,
                interval: updates.interval,
                ease_factor: updates.easeFactor,
                streak: updates.streak,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) throw error;
    },

    async deleteFlashcard(id: string): Promise<void> {
        const { error } = await supabase.from('flashcards').delete().eq('id', id);
        if (error) throw error;
    },

    mapResponse(row: any): Flashcard {
        return {
            id: row.id,
            userId: row.user_id,
            noteId: row.note_id,
            front: row.front,
            back: row.back,
            nextReview: row.next_review,
            interval: row.interval,
            easeFactor: row.ease_factor,
            streak: row.streak,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }
};
