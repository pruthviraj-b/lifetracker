-- FIX YOUTUBE TRACKER SCHEMA - ADD COURSE_ID

-- 1. Add 'course_id' column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'youtube_videos' AND column_name = 'course_id') THEN
        ALTER TABLE public.youtube_videos ADD COLUMN course_id UUID REFERENCES public.courses(id);
    END IF;
END $$;

-- 2. Force schema cache reload (Supabase sometimes caches schema)
NOTIFY pgrst, 'reload config';
