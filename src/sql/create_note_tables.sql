-- Run this in your Supabase SQL Editor to fix missing tables
-- This script is IDEMPOTENT (Safe to run multiple times)

-- 1. Create Note Folders Table
create table if not exists note_folders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  color text,
  icon text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Security for Folders
alter table note_folders enable row level security;

-- Policies for Note Folders (Safe checks)
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'note_folders' and policyname = 'Users can view their own folders') then
    create policy "Users can view their own folders" on note_folders for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'note_folders' and policyname = 'Users can insert their own folders') then
    create policy "Users can insert their own folders" on note_folders for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'note_folders' and policyname = 'Users can update their own folders') then
    create policy "Users can update their own folders" on note_folders for update using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'note_folders' and policyname = 'Users can delete their own folders') then
    create policy "Users can delete their own folders" on note_folders for delete using (auth.uid() = user_id);
  end if;
end $$;


-- 2. Ensure Notes Table Exists and has columns
create table if not exists notes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  folder_id uuid references note_folders(id) on delete set null,
  title text,
  content text,
  category text default 'general',
  color text default 'gray',
  is_pinned boolean default false,
  type text default 'standalone',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add missing columns to notes if table existed but columns didn't
do $$ begin
    if not exists (select 1 from information_schema.columns where table_name = 'notes' and column_name = 'folder_id') then
        alter table notes add column folder_id uuid references note_folders(id) on delete set null;
    end if;
    if not exists (select 1 from information_schema.columns where table_name = 'notes' and column_name = 'type') then
        alter table notes add column type text default 'standalone';
    end if;
end $$;

-- Enable Security for Notes
alter table notes enable row level security;

-- Policies for Notes (Safe checks)
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'notes' and policyname = 'Users can view their own notes') then
    create policy "Users can view their own notes" on notes for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'notes' and policyname = 'Users can manage their own notes') then
    create policy "Users can manage their own notes" on notes for all using (auth.uid() = user_id);
  end if;
end $$;
