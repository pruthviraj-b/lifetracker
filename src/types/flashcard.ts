export interface Flashcard {
    id: string;
    userId: string;
    noteId?: string;
    front: string;
    back: string;
    nextReview: string; // ISO Date
    interval: number; // Days
    easeFactor: number;
    streak: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreateFlashcardInput {
    front: string;
    back: string;
    noteId?: string;
}

export type ReviewRating = 1 | 2 | 3 | 4;
// 1: Again (Fail) -> Reset
// 2: Hard -> x1.2
// 3: Good -> x2.5
// 4: Easy -> x3.5 OR Bonus
