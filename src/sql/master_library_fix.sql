-- ==========================================
-- MASTER LIBRARY FIX SCRIPT
-- RUN THIS TO FIX "SAVING BUT NOT SHOWING" ISSUES
-- ==========================================

-- 1. FIX YOUTUBE VIDEOS VISIBILITY
-- Add default false to is_archived if missing
ALTER TABLE IF EXISTS youtube_videos ALTER COLUMN is_archived SET DEFAULT false;

-- Update any existing "invisible" NULL videos to be visible
UPDATE youtube_videos SET is_archived = false WHERE is_archived IS NULL;

-- 2. ENSURE ALL COLUMNS EXIST (Linking)
ALTER TABLE IF EXISTS courses ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES learning_folders(id);
ALTER TABLE IF EXISTS learning_resources ADD COLUMN IF NOT EXISTS habit_id UUID REFERENCES habits(id);
ALTER TABLE IF EXISTS learning_resources ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id);
ALTER TABLE IF EXISTS learning_resources ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES learning_folders(id);
ALTER TABLE IF EXISTS youtube_videos ADD COLUMN IF NOT EXISTS habit_id UUID REFERENCES habits(id);
ALTER TABLE IF EXISTS youtube_videos ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id);
ALTER TABLE IF EXISTS youtube_videos ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES learning_folders(id);

-- 3. ENSURE RLS POLICIES ARE CORRECT AND ENABLED
ALTER TABLE IF EXISTS youtube_videos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own videos" ON youtube_videos;
CREATE POLICY "Users can manage their own videos" ON youtube_videos
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

ALTER TABLE IF EXISTS learning_resources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own resources" ON learning_resources;
CREATE POLICY "Users can manage their own resources" ON learning_resources
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

ALTER TABLE IF EXISTS learning_folders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own learning folders" ON learning_folders;
CREATE POLICY "Users can manage their own learning folders" ON learning_folders
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

ALTER TABLE IF EXISTS courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own courses" ON courses;
CREATE POLICY "Users can manage their own courses" ON courses
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
    
-- Allow public read just in case
DROP POLICY IF EXISTS "Read public courses" ON courses;
CREATE POLICY "Read public courses" ON courses
    FOR SELECT
    USING (user_id IS NULL OR published = true);

-- 4. GRANT PERMISSIONS
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
