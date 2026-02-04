export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

export interface Course {
    id: string;
    created_at: string;
    title: string;
    description: string | null;
    thumbnail_url: string | null;
    difficulty_level: DifficultyLevel;
    duration_weeks: number;
    tags: string[];
    published: boolean;
    author_id?: string;
}

export interface CourseModule {
    id: string;
    course_id: string;
    title: string;
    description: string | null;
    order: number;
    lessons?: Lesson[]; // Hydrated
}

export type LessonType = 'text' | 'video' | 'quiz' | 'project';

export interface Lesson {
    id: string;
    module_id: string;
    title: string;
    content: string | null;
    type: LessonType;
    duration_minutes: number;
    order: number;
    is_optional: boolean;
    is_free?: boolean;
}

export interface Enrollment {
    id: string;
    user_id: string;
    course_id: string;
    started_at: string;
    completed_at: string | null;
    progress_percent: number;
}

export type LessonStatus = 'not_started' | 'in_progress' | 'completed';

export interface LessonProgress {
    id: string;
    user_id: string;
    lesson_id: string;
    status: LessonStatus;
    completed_at: string | null;
    notes?: string;
    resources?: any[];
}
