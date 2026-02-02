-- Create a table for note folders
create table public.note_folders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  color text default 'gray',
  icon text default 'folder',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add folder_id to notes table
alter table public.notes add column folder_id uuid references public.note_folders(id);

-- Enable RLS for folders
alter table public.note_folders enable row level security;

-- Policies for folders
create policy "Users can view their own folders" on public.note_folders
  for select using (auth.uid() = user_id);

create policy "Users can insert their own folders" on public.note_folders
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own folders" on public.note_folders
  for update using (auth.uid() = user_id);

create policy "Users can delete their own folders" on public.note_folders
  for delete using (auth.uid() = user_id);
