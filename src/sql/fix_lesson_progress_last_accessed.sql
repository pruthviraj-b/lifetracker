-- FIX LESSON PROGRESS SCHEMA - ADD LAST_ACCESSED

-- 1. Add 'last_accessed' column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lesson_progress' AND column_name = 'last_accessed') THEN
        ALTER TABLE public.lesson_progress ADD COLUMN last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- 2. Force schema cache reload (Supabase sometimes caches schema)
NOTIFY pgrst, 'reload config';
