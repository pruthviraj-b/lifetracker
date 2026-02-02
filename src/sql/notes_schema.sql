-- Create a table for standalone notes
create table public.notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  content text,
  category text default 'general',
  color text default 'yellow',
  is_pinned boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.notes enable row level security;

-- Policies
create policy "Users can view their own notes" on public.notes
  for select using (auth.uid() = user_id);

create policy "Users can update their own notes" on public.notes
  for update using (auth.uid() = user_id);

create policy "Users can insert their own notes" on public.notes
  for insert with check (auth.uid() = user_id);

create policy "Users can delete their own notes" on public.notes
  for delete using (auth.uid() = user_id);

-- Trigger for updated_at
create trigger on_notes_updated
  before update on public.notes
  for each row execute procedure public.handle_updated_at();
