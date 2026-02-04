-- FIX YOUTUBE TRACKER SCHEMA AND PERMISSIONS (V2)

-- 1. Ensure `learning_folders` table exists
CREATE TABLE IF NOT EXISTS public.learning_folders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3B82F6',
    is_favorite BOOLEAN DEFAULT false,
    parent_id UUID REFERENCES public.learning_folders(id),
    icon_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Ensure `learning_resources` table exists (MISSING IN V1)
CREATE TABLE IF NOT EXISTS public.learning_resources (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    folder_id UUID REFERENCES public.learning_folders(id) ON DELETE SET NULL,
    habit_id UUID REFERENCES public.habits(id),
    type TEXT NOT NULL, -- link, article, document, other
    title TEXT NOT NULL,
    url TEXT,
    content TEXT,
    status TEXT DEFAULT 'unread',
    is_pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Ensure `youtube_videos` table exists
CREATE TABLE IF NOT EXISTS public.youtube_videos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    url TEXT NOT NULL,
    video_id TEXT NOT NULL,
    title TEXT NOT NULL,
    thumbnail_url TEXT,
    habit_id UUID REFERENCES public.habits(id),
    folder_id UUID REFERENCES public.learning_folders(id) ON DELETE SET NULL,
    course_id UUID REFERENCES public.courses(id), -- Linked to Academy Courses
    task_id UUID,
    status TEXT DEFAULT 'unwatched',
    watch_progress INTEGER DEFAULT 0,
    duration_seconds INTEGER DEFAULT 0,
    difficulty TEXT DEFAULT 'beginner',
    rating INTEGER,
    sort_order INTEGER DEFAULT 0,
    is_archived BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Ensure `video_notes` table exists
CREATE TABLE IF NOT EXISTS public.video_notes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    video_id UUID REFERENCES public.youtube_videos(id) ON DELETE CASCADE,
    timestamp_seconds INTEGER NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Enable RLS
ALTER TABLE public.learning_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.youtube_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_notes ENABLE ROW LEVEL SECURITY;

-- 6. Create Policies (Drop first to avoid errors)
DROP POLICY IF EXISTS "Users can manage their own folders" ON public.learning_folders;
CREATE POLICY "Users can manage their own folders" ON public.learning_folders
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own resources" ON public.learning_resources;
CREATE POLICY "Users can manage their own resources" ON public.learning_resources
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own videos" ON public.youtube_videos;
CREATE POLICY "Users can manage their own videos" ON public.youtube_videos
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own video notes" ON public.video_notes;
CREATE POLICY "Users can manage their own video notes" ON public.video_notes
    FOR ALL USING (auth.uid() = user_id);

-- 7. Grant Permissions
GRANT ALL ON public.learning_folders TO authenticated;
GRANT ALL ON public.learning_resources TO authenticated;
GRANT ALL ON public.youtube_videos TO authenticated;
GRANT ALL ON public.video_notes TO authenticated;
