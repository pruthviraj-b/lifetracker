-- FIX LEARNING STORE SCHEMA (Comprehensive V3)

-- 1. Ensure `learning_folders` table exists
CREATE TABLE IF NOT EXISTS public.learning_folders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3B82F6',
    is_favorite BOOLEAN DEFAULT false,
    parent_id UUID REFERENCES public.learning_folders(id) ON DELETE CASCADE,
    icon_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Ensure `youtube_videos` has all required columns
-- Commonly missing: course_id, folder_id, task_id
ALTER TABLE public.youtube_videos ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES public.learning_folders(id) ON DELETE SET NULL;
ALTER TABLE public.youtube_videos ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL; -- Link to Academy
ALTER TABLE public.youtube_videos ADD COLUMN IF NOT EXISTS task_id UUID;
ALTER TABLE public.youtube_videos ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'beginner';

-- 3. Ensure `courses` has folder support
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES public.learning_folders(id) ON DELETE SET NULL;

-- 4. Ensure `learning_resources` table exists
CREATE TABLE IF NOT EXISTS public.learning_resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    folder_id UUID REFERENCES public.learning_folders(id) ON DELETE SET NULL,
    habit_id UUID REFERENCES public.habits(id) ON DELETE SET NULL,
    course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL, -- Link resource to course
    type TEXT DEFAULT 'link', -- link, article, document, other
    title TEXT NOT NULL,
    url TEXT,
    content TEXT,
    status TEXT DEFAULT 'unread',
    is_pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4b. Ensure `video_notes` table exists
CREATE TABLE IF NOT EXISTS public.video_notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    video_id UUID REFERENCES public.youtube_videos(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    timestamp_seconds INTEGER DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Enable RLS on all tables
ALTER TABLE public.learning_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.youtube_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_notes ENABLE ROW LEVEL SECURITY;

-- 6. Refresh Policies (Drop & Recreate to be safe)

-- Folders
DROP POLICY IF EXISTS "Users can manage their own folders" ON public.learning_folders;
CREATE POLICY "Users can manage their own folders" ON public.learning_folders FOR ALL USING (auth.uid() = user_id);

-- Resources
DROP POLICY IF EXISTS "Users can manage their own resources" ON public.learning_resources;
CREATE POLICY "Users can manage their own resources" ON public.learning_resources FOR ALL USING (auth.uid() = user_id);

-- YouTube Videos
DROP POLICY IF EXISTS "Users can manage their own videos" ON public.youtube_videos;
CREATE POLICY "Users can manage their own videos" ON public.youtube_videos FOR ALL USING (auth.uid() = user_id);
-- Also ensure specific policies exist if the generic one fails or isn't enough in some setups
DROP POLICY IF EXISTS "Users can insert their own videos" ON public.youtube_videos;
CREATE POLICY "Users can insert their own videos" ON public.youtube_videos FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Video Notes
DROP POLICY IF EXISTS "Users can manage their own notes" ON public.video_notes;
CREATE POLICY "Users can manage their own notes" ON public.video_notes FOR ALL USING (auth.uid() = user_id);

-- 7. Grant Permissions
GRANT ALL ON public.learning_folders TO authenticated;
GRANT ALL ON public.learning_resources TO authenticated;
GRANT ALL ON public.youtube_videos TO authenticated;
GRANT ALL ON public.video_notes TO authenticated;
GRANT ALL ON public.courses TO authenticated;
