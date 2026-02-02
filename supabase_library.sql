
-- Library/Intelligence Database Recovery Script (Idempotent)
-- Run this to fix "Failed to load library data" errors.
-- It works even if tables already exist.

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Learning Folders
create table if not exists learning_folders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  color text,
  parent_id uuid references learning_folders(id) on delete set null,
  icon_name text,
  is_favorite boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table learning_folders enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'learning_folders' and policyname = 'Users can view their own folders') then
    create policy "Users can view their own folders" on learning_folders for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'learning_folders' and policyname = 'Users can insert their own folders') then
    create policy "Users can insert their own folders" on learning_folders for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'learning_folders' and policyname = 'Users can update their own folders') then
    create policy "Users can update their own folders" on learning_folders for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'learning_folders' and policyname = 'Users can delete their own folders') then
    create policy "Users can delete their own folders" on learning_folders for delete using (auth.uid() = user_id);
  end if;
end $$;

-- 2. Learning Courses
create table if not exists learning_courses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  folder_id uuid references learning_folders(id) on delete set null,
  title text not null,
  description text,
  difficulty text default 'intermediate',
  is_linear boolean default true,
  is_completed boolean default false,
  certificate_data jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table learning_courses enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'learning_courses' and policyname = 'Users can view their own courses') then
    create policy "Users can view their own courses" on learning_courses for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'learning_courses' and policyname = 'Users can manage their own courses') then
    create policy "Users can manage their own courses" on learning_courses for all using (auth.uid() = user_id);
  end if;
end $$;

-- 3. YouTube Videos
create table if not exists youtube_videos (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  url text not null,
  video_id text not null,
  title text not null,
  thumbnail_url text,
  habit_id uuid references habits(id) on delete set null,
  folder_id uuid references learning_folders(id) on delete set null,
  course_id uuid references learning_courses(id) on delete set null,
  task_id uuid,
  difficulty text default 'beginner',
  status text default 'unwatched',
  watch_progress integer default 0,
  duration_seconds integer default 0,
  sort_order integer default 0,
  rating integer,
  is_archived boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table youtube_videos enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'youtube_videos' and policyname = 'Users can view their own videos') then
    create policy "Users can view their own videos" on youtube_videos for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'youtube_videos' and policyname = 'Users can manage their own videos') then
    create policy "Users can manage their own videos" on youtube_videos for all using (auth.uid() = user_id);
  end if;
end $$;

-- 4. Learning Resources
create table if not exists learning_resources (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  folder_id uuid references learning_folders(id) on delete set null,
  habit_id uuid references habits(id) on delete set null,
  type text not null,
  title text not null,
  url text,
  content text,
  status text default 'unread',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table learning_resources enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'learning_resources' and policyname = 'Users can view their own resources') then
    create policy "Users can view their own resources" on learning_resources for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'learning_resources' and policyname = 'Users can manage their own resources') then
    create policy "Users can manage their own resources" on learning_resources for all using (auth.uid() = user_id);
  end if;
end $$;

-- 5. Video Notes & Prerequisites
create table if not exists video_notes (
  id uuid default uuid_generate_v4() primary key,
  video_id uuid references youtube_videos(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  timestamp_seconds integer not null,
  content text not null,
  tags text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists video_prerequisites (
  id uuid default uuid_generate_v4() primary key,
  video_id uuid references youtube_videos(id) on delete cascade not null,
  prerequisite_video_id uuid references youtube_videos(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table video_notes enable row level security;
alter table video_prerequisites enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'video_notes' and policyname = 'Users can manage their own notes') then
    create policy "Users can manage their own notes" on video_notes for all using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'video_prerequisites' and policyname = 'Users can manage their own prerequisites') then
    create policy "Users can manage their own prerequisites" on video_prerequisites for all using (exists (select 1 from youtube_videos where id = video_prerequisites.video_id and user_id = auth.uid()));
  end if;
end $$;
