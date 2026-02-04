-- FIX DUPLICATE LESSON PROGRESS

-- 1. Remove duplicates (keeping latest)
WITH duplicates AS (
    SELECT id,
           ROW_NUMBER() OVER (
               PARTITION BY user_id, lesson_id 
               ORDER BY updated_at DESC
           ) as row_num
    FROM public.lesson_progress
)
DELETE FROM public.lesson_progress
WHERE id IN (
    SELECT id FROM duplicates WHERE row_num > 1
);

-- 2. Add Unique Constraint
ALTER TABLE public.lesson_progress 
DROP CONSTRAINT IF EXISTS lesson_progress_user_lesson_unique;

ALTER TABLE public.lesson_progress
ADD CONSTRAINT lesson_progress_user_lesson_unique UNIQUE (user_id, lesson_id);

-- 3. Verify Columns (Again, just to be sure)
-- This ensures the previous script didn't fail silently
COMMENT ON COLUMN public.lesson_progress.resources IS 'JSONB array of external resources';
