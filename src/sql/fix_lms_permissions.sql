-- FIX: Allow Authenticated Users to Manage Course Content (Seed Data)
-- Currently, policies only allow SELECT. We need INSERT/UPDATE/DELETE permission.

-- 1. Courses Table Permissions
DROP POLICY IF EXISTS "Authenticated users can manage courses" ON courses;
CREATE POLICY "Authenticated users can manage courses" ON courses
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 2. Modules Table Permissions
DROP POLICY IF EXISTS "Authenticated users can manage modules" ON modules;
CREATE POLICY "Authenticated users can manage modules" ON modules
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 3. Lessons Table Permissions
DROP POLICY IF EXISTS "Authenticated users can manage lessons" ON lessons; 
CREATE POLICY "Authenticated users can manage lessons" ON lessons
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Note: This makes the LMS "Wiki-style" where any logged-in user can edit courses.
-- For a personal app, this is acceptable and required for the "Install Course" seeding feature.
no