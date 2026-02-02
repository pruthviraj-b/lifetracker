-- Create a table for YouTube videos
create table public.youtube_videos (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  url text not null,
  video_id text not null,
  title text not null,
  duration_seconds integer default 0,
  thumbnail_url text,
  habit_id uuid references public.habits(id) on delete set null,
  task_id uuid default null, -- Placeholder for future task integration
  status text default 'unwatched' check (status in ('unwatched', 'in_progress', 'watched')),
  watch_progress integer default 0,
  difficulty text default 'beginner' check (difficulty in ('beginner', 'intermediate', 'advanced')),
  rating integer check (rating >= 1 and rating <= 5),
  is_archived boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Table for timestamped notes linked to videos
create table public.video_notes (
  id uuid default gen_random_uuid() primary key,
  video_id uuid references public.youtube_videos(id) on delete cascade not null,
  user_id uuid references auth.users not null,
  timestamp_seconds integer not null,
  content text not null,
  tags text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.youtube_videos enable row level security;
alter table public.video_notes enable row level security;

-- Policies for youtube_videos
create policy "Users can view their own videos" on public.youtube_videos
  for select using (auth.uid() = user_id);
create policy "Users can insert their own videos" on public.youtube_videos
  for insert with check (auth.uid() = user_id);
create policy "Users can update their own videos" on public.youtube_videos
  for update using (auth.uid() = user_id);
create policy "Users can delete their own videos" on public.youtube_videos
  for delete using (auth.uid() = user_id);

-- Policies for video_notes
create policy "Users can view their own video notes" on public.video_notes
  for select using (auth.uid() = user_id);
create policy "Users can insert their own video notes" on public.video_notes
  for insert with check (auth.uid() = user_id);
create policy "Users can update their own video notes" on public.video_notes
  for update using (auth.uid() = user_id);
create policy "Users can delete their own video notes" on public.video_notes
  for delete using (auth.uid() = user_id);

-- Trigger for youtube_videos updated_at
create trigger on_youtube_videos_updated
  before update on public.youtube_videos
  for each row execute procedure public.handle_updated_at();

-- Learning Folders (Nested folders for organization)
CREATE TABLE IF NOT EXISTS public.learning_folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3B82F6', -- Default blue
    parent_id UUID REFERENCES public.learning_folders(id) ON DELETE CASCADE,
    icon_name TEXT, -- Lucide icon name
    is_favorite BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- General Learning Resources (Links, Articles, Documents)
CREATE TABLE IF NOT EXISTS public.learning_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    folder_id UUID REFERENCES public.learning_folders(id) ON DELETE SET NULL,
    habit_id UUID REFERENCES public.habits(id) ON DELETE SET NULL,
    type TEXT DEFAULT 'link' CHECK (type in ('link', 'article', 'document', 'other')),
    title TEXT NOT NULL,
    url TEXT,
    content TEXT, -- For notes or article snippets
    status TEXT DEFAULT 'unread' CHECK (status in ('unread', 'reading', 'read')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Update youtube_videos to support folders
ALTER TABLE public.youtube_videos ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES public.learning_folders(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.learning_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_resources ENABLE ROW LEVEL SECURITY;

-- Policies for Learning Folders
CREATE POLICY "Users can manage their own learning folders" ON public.learning_folders
    FOR ALL USING (auth.uid() = user_id);

-- Policies for Learning Resources
CREATE POLICY "Users can manage their own learning resources" ON public.learning_resources
    FOR ALL USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE TRIGGER update_learning_folders_updated_at
    BEFORE UPDATE ON public.learning_folders
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE OR REPLACE TRIGGER update_learning_resources_updated_at
    BEFORE UPDATE ON public.learning_resources
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
