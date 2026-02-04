-- Add journaling columns to lesson_progress
ALTER TABLE lesson_progress 
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS resources JSONB DEFAULT '[]'::jsonb;

-- Ensure RLS allows updating these columns (usually implicit in UPDATE policies, but good to verify ownership)
-- (The existing policies typically allow "UPDATE if user_id = auth.uid()", so no change needed there usually.
-- But we can verify.)
