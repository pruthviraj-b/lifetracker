-- FIX LESSON PROGRESS PERSISTENCE

-- 1. Check if 'notes' exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lesson_progress' AND column_name = 'notes') THEN
        ALTER TABLE public.lesson_progress ADD COLUMN notes TEXT;
    END IF;
END $$;

-- 2. Check if 'resources' exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lesson_progress' AND column_name = 'resources') THEN
        ALTER TABLE public.lesson_progress ADD COLUMN resources JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- 3. Verify RLS (Just to be safe)
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own lesson progress" ON public.lesson_progress;
CREATE POLICY "Users can manage their own lesson progress" ON public.lesson_progress
    FOR ALL USING (auth.uid() = user_id);

GRANT ALL ON public.lesson_progress TO authenticated;
