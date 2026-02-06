-- SQL Migration: Add Content Links to Reminders
ALTER TABLE public.reminders ADD COLUMN IF NOT EXISTS video_id UUID REFERENCES public.youtube_videos(id) ON DELETE CASCADE;
ALTER TABLE public.reminders ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE;
ALTER TABLE public.reminders ADD COLUMN IF NOT EXISTS resource_id UUID REFERENCES public.learning_resources(id) ON DELETE CASCADE;
ALTER TABLE public.reminders ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES public.learning_folders(id) ON DELETE CASCADE;

-- Add helpful comments to column
COMMENT ON COLUMN public.reminders.video_id IS 'Link to specific YouTube video in content library';
COMMENT ON COLUMN public.reminders.course_id IS 'Link to specific course in Academy';
COMMENT ON COLUMN public.reminders.resource_id IS 'Link to specific resource (file/link) in content library';
COMMENT ON COLUMN public.reminders.folder_id IS 'Link to specific folder in content library';

-- Update RLS if needed (usually managed by user_id check already)
-- Authenticated users should have access to these columns via existing GRANT ALL
GRANT ALL ON public.reminders TO authenticated;
