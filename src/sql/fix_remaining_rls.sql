-- ==========================================
-- FINAL RLS FIX: REMAINING TABLES
-- Run this to complete the security overhaul.
-- ==========================================

-- 1. HABIT LINKS
ALTER TABLE IF EXISTS habit_links ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE IF EXISTS habit_links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own links" ON habit_links;
CREATE POLICY "Users can manage their own links" ON habit_links
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2. HABIT SKIPS
ALTER TABLE IF EXISTS habit_skips ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE IF EXISTS habit_skips ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own skips" ON habit_skips;
CREATE POLICY "Users can manage their own skips" ON habit_skips
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. DAILY REFLECTIONS
ALTER TABLE IF EXISTS daily_reflections ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE IF EXISTS daily_reflections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own reflections" ON daily_reflections;
CREATE POLICY "Users can manage their own reflections" ON daily_reflections
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 4. MULTIVERSE LINKS (The Graph)
ALTER TABLE IF EXISTS multiverse_links ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE IF EXISTS multiverse_links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own graph" ON multiverse_links;
CREATE POLICY "Users can manage their own graph" ON multiverse_links
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. NOTIFICATIONS
ALTER TABLE IF EXISTS notifications ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE IF EXISTS notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own notifications" ON notifications;
CREATE POLICY "Users can manage their own notifications" ON notifications
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 6. PROFILES (XP & Settings)
-- Note: Profiles usually links id -> auth.users.id directly
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own profile" ON profiles;
-- Allow users to insert their own profile (trigger might handle this, but safe to allow)
CREATE POLICY "Users can manage their own profile" ON profiles
    FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 7. Grant Permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
