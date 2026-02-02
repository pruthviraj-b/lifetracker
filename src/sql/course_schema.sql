-- Video Series & Courses Extension

-- 1. Courses Table
CREATE TABLE IF NOT EXISTS public.learning_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    folder_id UUID REFERENCES public.learning_folders(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    difficulty TEXT DEFAULT 'intermediate' CHECK (difficulty in ('beginner', 'intermediate', 'advanced')),
    is_linear BOOLEAN DEFAULT true, -- If true, enforces prerequisites
    is_completed BOOLEAN DEFAULT false,
    certificate_data JSONB, -- Stores info for the generated certificate
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Video Prerequisites
CREATE TABLE IF NOT EXISTS public.video_prerequisites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID NOT NULL REFERENCES public.youtube_videos(id) ON DELETE CASCADE,
    prerequisite_video_id UUID NOT NULL REFERENCES public.youtube_videos(id) ON DELETE CASCADE,
    CHECK (video_id <> prerequisite_video_id)
);

-- 3. Link Videos to Courses
ALTER TABLE public.youtube_videos ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES public.learning_courses(id) ON DELETE SET NULL;
ALTER TABLE public.youtube_videos ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Enable RLS
ALTER TABLE public.learning_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_prerequisites ENABLE ROW LEVEL SECURITY;

-- Policies for Learning Courses
DROP POLICY IF EXISTS "Users can manage their own courses" ON public.learning_courses;
CREATE POLICY "Users can manage their own courses" ON public.learning_courses FOR ALL USING (auth.uid() = user_id);

-- Policies for Prerequisites
DROP POLICY IF EXISTS "Users can manage their own video prerequisites" ON public.video_prerequisites;
CREATE POLICY "Users can manage their own video prerequisites" ON public.video_prerequisites 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.youtube_videos 
            WHERE id = public.video_prerequisites.video_id 
            AND user_id = auth.uid()
        )
    );

-- Trigger for updated_at
CREATE OR REPLACE TRIGGER update_learning_courses_updated_at
    BEFORE UPDATE ON public.learning_courses
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
