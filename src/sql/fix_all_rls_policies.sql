-- ==========================================
-- FIX ROW LEVEL SECURITY (RLS) POLICIES
-- Run this script in Supabase SQL Editor to fix "Not Saving" issues.
-- ==========================================

-- 0. Ensure user_id column exists on all tables (Fix for missing column errors)
ALTER TABLE IF EXISTS habits ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE IF EXISTS habit_logs ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE IF EXISTS notes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE IF EXISTS youtube_videos ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE IF EXISTS video_notes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE IF EXISTS learning_folders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE IF EXISTS learning_resources ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE IF EXISTS learning_channels ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE IF EXISTS courses ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE IF EXISTS enrollments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE IF EXISTS lesson_progress ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 1. Enable RLS on all tables
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS youtube_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS video_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS learning_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS learning_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS learning_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS lesson_progress ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to prevent conflicts (SAFE to run multiple times)
DROP POLICY IF EXISTS "Users can read their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can delete their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
DROP POLICY IF EXISTS "Users can manage their own profile" ON users;
DROP POLICY IF EXISTS "Users can manage their own habits" ON habits;
DROP POLICY IF EXISTS "Users can manage their own logs" ON habit_logs;
DROP POLICY IF EXISTS "Users can manage their own notes" ON notes;
DROP POLICY IF EXISTS "Users can manage their own videos" ON youtube_videos;
DROP POLICY IF EXISTS "Users can manage their own video notes" ON video_notes;
DROP POLICY IF EXISTS "Users can manage their own learning folders" ON learning_folders;
DROP POLICY IF EXISTS "Users can manage their own resources" ON learning_resources;
DROP POLICY IF EXISTS "Users can manage their own channels" ON learning_channels;
DROP POLICY IF EXISTS "Users can manage their own courses" ON courses;
DROP POLICY IF EXISTS "Read public courses" ON courses;
DROP POLICY IF EXISTS "Users can manage their own enrollments" ON enrollments;
DROP POLICY IF EXISTS "Users can manage their own progress" ON lesson_progress;

-- 3. Create Permissive Policies (CRUD)

-- USERS
CREATE POLICY "Users can read their own profile" ON users
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete their own profile" ON users
    FOR DELETE
    USING (auth.uid() = id);

-- Allow new users to insert their profile during signup
CREATE POLICY "Users can insert their own profile" ON users
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- HABITS
CREATE POLICY "Users can manage their own habits" ON habits
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- HABIT LOGS
CREATE POLICY "Users can manage their own logs" ON habit_logs
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- NOTES
CREATE POLICY "Users can manage their own notes" ON notes
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- YOUTUBE VIDEOS
CREATE POLICY "Users can manage their own videos" ON youtube_videos
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- VIDEO NOTES
CREATE POLICY "Users can manage their own video notes" ON video_notes
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- LEARNING FOLDERS
CREATE POLICY "Users can manage their own learning folders" ON learning_folders
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- LEARNING RESOURCES
CREATE POLICY "Users can manage their own resources" ON learning_resources
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- REMINDERS
CREATE POLICY "Users can manage their own reminders" ON reminders
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- LEARNING CHANNELS (Mentors)
CREATE POLICY "Users can manage their own channels" ON learning_channels
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- COURSES (Hybrid: Private + System)
CREATE POLICY "Users can manage their own courses" ON courses
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Read public courses" ON courses
    FOR SELECT
    USING (user_id IS NULL OR published = true);

-- MODULES & LESSONS (Inherit access generally, but for now open read for enrolled/created)
-- Simplified: If you can see the course, you can see modules
CREATE POLICY "Read public modules" ON modules
    FOR SELECT
    USING (true); -- Logic handled by Course visibility usually, or add course_id join logic if strict

CREATE POLICY "Read public lessons" ON lessons
    FOR SELECT
    USING (true);

-- ENROLLMENTS
CREATE POLICY "Users can manage their own enrollments" ON enrollments
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- LESSON PROGRESS
CREATE POLICY "Users can manage their own progress" ON lesson_progress
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Grant permissions just in case
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
