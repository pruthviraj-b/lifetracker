-- Create a table for storing reminders
create table public.reminders (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  title text not null,
  time text not null, -- Format "HH:mm"
  days integer[] default '{}'::integer[], -- Array of days (0-6)
  is_enabled boolean default true,
  last_triggered timestamptz,
  created_at timestamptz default now(),
  constraint reminders_pkey primary key (id),
  constraint reminders_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade
);

-- Enable RLS (Row Level Security)
alter table public.reminders enable row level security;

-- Create Policies for Security
create policy "Users can view their own reminders" on public.reminders
  for select using (auth.uid() = user_id);

create policy "Users can create their own reminders" on public.reminders
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own reminders" on public.reminders
  for update using (auth.uid() = user_id);

create policy "Users can delete their own reminders" on public.reminders
  for delete using (auth.uid() = user_id);
