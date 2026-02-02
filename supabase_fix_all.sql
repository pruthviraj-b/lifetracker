
-- Core Database Recovery Script (Idempotent Version)
-- Run this to fix "Failed to update ritual" errors safely.
-- It will skip items that already exist, so you won't get "already exists" errors.

-- 1. Profiles Table
create table if not exists profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  username text,
  level integer default 1,
  current_xp integer default 0,
  next_level_xp integer default 100,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table profiles enable row level security;

-- Safely create policies for profiles
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'profiles' and policyname = 'Users can view own profile') then
    create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'profiles' and policyname = 'Users can update own profile') then
    create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'profiles' and policyname = 'Users can insert own profile') then
    create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);
  end if;
end $$;

-- XP Function
create or replace function increment_xp(amount int)
returns void as $$
begin
  update profiles
  set current_xp = current_xp + amount
  where id = auth.uid();
end;
$$ language plpgsql security definer;

-- 2. Habit Links
create table if not exists habit_links (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  source_habit_id uuid references habits(id) on delete cascade not null,
  target_habit_id uuid references habits(id) on delete cascade not null,
  type text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table habit_links enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'habit_links' and policyname = 'Users can view own links') then
    create policy "Users can view own links" on habit_links for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'habit_links' and policyname = 'Users can manage own links') then
    create policy "Users can manage own links" on habit_links for all using (auth.uid() = user_id);
  end if;
end $$;

-- 3. Habit Logs
create table if not exists habit_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  habit_id uuid references habits(id) on delete cascade not null,
  date text not null,
  note text,
  mood text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, habit_id, date)
);

alter table habit_logs enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'habit_logs' and policyname = 'Users can view own logs') then
    create policy "Users can view own logs" on habit_logs for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'habit_logs' and policyname = 'Users can manage own logs') then
    create policy "Users can manage own logs" on habit_logs for all using (auth.uid() = user_id);
  end if;
end $$;

-- 4. Habit Skips
create table if not exists habit_skips (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  habit_id uuid references habits(id) on delete cascade not null,
  date text not null,
  reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, habit_id, date)
);

alter table habit_skips enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'habit_skips' and policyname = 'Users can view own skips') then
    create policy "Users can view own skips" on habit_skips for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'habit_skips' and policyname = 'Users can manage own skips') then
    create policy "Users can manage own skips" on habit_skips for all using (auth.uid() = user_id);
  end if;
end $$;

-- 5. Daily Reflections
create table if not exists daily_reflections (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  date text not null,
  mood text,
  note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, date)
);

alter table daily_reflections enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'daily_reflections' and policyname = 'Users can view own reflections') then
    create policy "Users can view own reflections" on daily_reflections for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'daily_reflections' and policyname = 'Users can manage own reflections') then
    create policy "Users can manage own reflections" on daily_reflections for all using (auth.uid() = user_id);
  end if;
end $$;

-- 6. Default Profile
insert into profiles (id, level, current_xp)
select id, 1, 0 from auth.users
on conflict (id) do nothing;
