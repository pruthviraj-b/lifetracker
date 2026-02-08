-- Chat automation entities (Tasks, Protocols, Schedule, Recall, Metrics, Library, Network)

-- TASKS
create table if not exists public.tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  due_date date,
  priority text default 'medium',
  notes text,
  status text default 'open',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone
);

alter table public.tasks enable row level security;

create policy "Users can view their own tasks" on public.tasks
  for select using (auth.uid() = user_id);
create policy "Users can insert their own tasks" on public.tasks
  for insert with check (auth.uid() = user_id);
create policy "Users can update their own tasks" on public.tasks
  for update using (auth.uid() = user_id);
create policy "Users can delete their own tasks" on public.tasks
  for delete using (auth.uid() = user_id);

create trigger on_tasks_updated
  before update on public.tasks
  for each row execute procedure public.handle_updated_at();

-- PROTOCOLS
create table if not exists public.protocols (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  steps jsonb default '[]'::jsonb,
  total_minutes integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.protocols enable row level security;

create policy "Users can view their own protocols" on public.protocols
  for select using (auth.uid() = user_id);
create policy "Users can insert their own protocols" on public.protocols
  for insert with check (auth.uid() = user_id);
create policy "Users can update their own protocols" on public.protocols
  for update using (auth.uid() = user_id);
create policy "Users can delete their own protocols" on public.protocols
  for delete using (auth.uid() = user_id);

create trigger on_protocols_updated
  before update on public.protocols
  for each row execute procedure public.handle_updated_at();

-- SCHEDULE EVENTS
create table if not exists public.schedule_events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  event_date date,
  event_time time,
  time_label text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.schedule_events enable row level security;

create policy "Users can view their own schedule events" on public.schedule_events
  for select using (auth.uid() = user_id);
create policy "Users can insert their own schedule events" on public.schedule_events
  for insert with check (auth.uid() = user_id);
create policy "Users can update their own schedule events" on public.schedule_events
  for update using (auth.uid() = user_id);
create policy "Users can delete their own schedule events" on public.schedule_events
  for delete using (auth.uid() = user_id);

create trigger on_schedule_events_updated
  before update on public.schedule_events
  for each row execute procedure public.handle_updated_at();

-- RECALL (MEMORIES / JOURNAL)
create table if not exists public.recall_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  content text not null,
  category text default 'general',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.recall_entries enable row level security;

create policy "Users can view their own recall entries" on public.recall_entries
  for select using (auth.uid() = user_id);
create policy "Users can insert their own recall entries" on public.recall_entries
  for insert with check (auth.uid() = user_id);
create policy "Users can delete their own recall entries" on public.recall_entries
  for delete using (auth.uid() = user_id);

-- METRICS
create table if not exists public.metric_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  metric text not null,
  value numeric,
  unit text,
  log_date date default (now()::date),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.metric_logs enable row level security;

create policy "Users can view their own metric logs" on public.metric_logs
  for select using (auth.uid() = user_id);
create policy "Users can insert their own metric logs" on public.metric_logs
  for insert with check (auth.uid() = user_id);
create policy "Users can delete their own metric logs" on public.metric_logs
  for delete using (auth.uid() = user_id);

-- LIBRARY
create table if not exists public.library_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  url text,
  category text default 'general',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.library_items enable row level security;

create policy "Users can view their own library items" on public.library_items
  for select using (auth.uid() = user_id);
create policy "Users can insert their own library items" on public.library_items
  for insert with check (auth.uid() = user_id);
create policy "Users can delete their own library items" on public.library_items
  for delete using (auth.uid() = user_id);

-- NETWORK CONNECTIONS
create table if not exists public.network_connections (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  name text not null,
  relationship text default 'friend',
  shared_habits text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.network_connections enable row level security;

create policy "Users can view their own network connections" on public.network_connections
  for select using (auth.uid() = user_id);
create policy "Users can insert their own network connections" on public.network_connections
  for insert with check (auth.uid() = user_id);
create policy "Users can delete their own network connections" on public.network_connections
  for delete using (auth.uid() = user_id);
