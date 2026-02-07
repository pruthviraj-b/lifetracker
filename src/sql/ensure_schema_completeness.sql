-- ==========================================
-- ENSURE SCHEMA COMPLETENESS FOR LIBRARY
-- Run this to prevent "Column does not exist" errors
-- ==========================================

-- 1. COURSES: Add folder_id for organization
ALTER TABLE IF EXISTS courses ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES learning_folders(id);

-- 2. LEARNING RESOURCES: Add linking columns
ALTER TABLE IF EXISTS learning_resources ADD COLUMN IF NOT EXISTS habit_id UUID REFERENCES habits(id);
ALTER TABLE IF EXISTS learning_resources ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id);
ALTER TABLE IF EXISTS learning_resources ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES learning_folders(id);

-- 3. YOUTUBE VIDEOS: Ensure all linking columns exist
ALTER TABLE IF EXISTS youtube_videos ADD COLUMN IF NOT EXISTS habit_id UUID REFERENCES habits(id);
ALTER TABLE IF EXISTS youtube_videos ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id);
ALTER TABLE IF EXISTS youtube_videos ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES learning_folders(id);
ALTER TABLE IF EXISTS youtube_videos ADD COLUMN IF NOT EXISTS task_id UUID; -- For task linking if needed

-- 4. Enable RLS on these if not already (Updates existing policies if needed)
-- (Policies were handled in fix_all_rls_policies.sql, but ensuring columns exist is key)
