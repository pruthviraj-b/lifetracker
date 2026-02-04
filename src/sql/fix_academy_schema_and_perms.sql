-- MASTER FIX SCRIPT FOR ACADEMICS
-- Run this in Supabase SQL Editor to enable all features.

-- 1. ENABLE JOURNALING (Add Columns)
ALTER TABLE lesson_progress 
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS resources JSONB DEFAULT '[]'::jsonb;

-- 2. FIX LESSON PROGRESS PERMISSIONS (Allow Users to Save their own data)
-- First, drop existing restrictive policies if any overlap, or just ensure a permissive one exists.
DROP POLICY IF EXISTS "Users can manage their own progress" ON lesson_progress;

CREATE POLICY "Users can manage their own progress" ON lesson_progress
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. FIX COURSE SEEDING PERMISSIONS (Allow "Install Course" to work)
-- This allows any authenticated user to insert courses/modules/lessons.
-- Required for the "Install" button to function.
DROP POLICY IF EXISTS "Authenticated users can manage courses" ON courses;
CREATE POLICY "Authenticated users can manage courses" ON courses
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can manage modules" ON modules;
CREATE POLICY "Authenticated users can manage modules" ON modules
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can manage lessons" ON lessons;
CREATE POLICY "Authenticated users can manage lessons" ON lessons
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 4. CONFIRMATION
SELECT 'FIXES APPLIED SUCCESSFULLY' as status;
