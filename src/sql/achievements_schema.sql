-- Achievements Master Table
create table public.achievements (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  icon text, -- Lucide icon name
  points integer default 0,
  category text default 'general',
  criteria_type text not null, -- 'streak', 'total_completed', 'synergy', 'diversity', 'time_of_day'
  criteria_value integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- User Achievements (Unlocks)
create table public.user_achievements (
  user_id uuid references auth.users not null,
  achievement_id uuid references public.achievements not null,
  unlocked_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, achievement_id)
);

-- RLS
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;

create policy "Achievements are viewable by all" on public.achievements
  for select using (true);

create policy "Users can see their own unlocks" on public.user_achievements
  for select using (auth.uid() = user_id);

-- Seed Initial Achievements
insert into public.achievements (name, description, icon, points, criteria_type, criteria_value) values
('First Step', 'Complete your first habit.', 'Footprints', 10, 'total_completed', 1),
('Consistency King', 'Maintain a 7-day streak.', 'Crown', 50, 'streak', 7),
('Monthly Master', 'Maintain a 30-day streak.', 'Trophy', 200, 'streak', 30),
('Synergy Seeker', 'Achieve 10 synergy bonuses.', 'Zap', 100, 'synergy', 10),
('Night Owl', 'Complete a habit between 10 PM and 4 AM.', 'Moon', 30, 'time_of_day', 22),
('Early Bird', 'Complete a habit before 7 AM.', 'Sun', 30, 'time_of_day', 7),
('Polymath', 'Complete habits in 5 different categories.', 'Sparkles', 150, 'diversity', 5),
('Century Club', 'Complete 100 habits in total.', 'Star', 500, 'total_completed', 100);

-- Function to check and award achievements
create or replace function public.check_achievements()
returns trigger as $$
declare
    user_id uuid;
    total_completed integer;
    max_streak integer;
    synergy_count integer;
    category_count integer;
    current_hour integer;
begin
    user_id := new.user_id;
    
    -- 1. Total Completed
    select count(*) into total_completed from public.habit_logs where user_id = user_id;
    
    insert into public.user_achievements (user_id, achievement_id)
    select user_id, id from public.achievements
    where criteria_type = 'total_completed' 
    and criteria_value <= total_completed
    on conflict do nothing;

    -- 2. Max Streak
    select max(streak) into max_streak from public.habits where user_id = user_id;
    
    insert into public.user_achievements (user_id, achievement_id)
    select user_id, id from public.achievements
    where criteria_type = 'streak' 
    and criteria_value <= max_streak
    on conflict do nothing;

    -- 3. Time of Day (Based on record creation)
    current_hour := extract(hour from (new.created_at at time zone 'utc'));
    
    -- Night Owl (Hour >= 22 or Hour < 4)
    if current_hour >= 22 or current_hour < 4 then
        insert into public.user_achievements (user_id, achievement_id)
        select user_id, id from public.achievements
        where criteria_type = 'time_of_day' and criteria_value = 22
        on conflict do nothing;
    end if;
    
    -- Early Bird (Hour < 7)
    if current_hour < 7 then
        insert into public.user_achievements (user_id, achievement_id)
        select user_id, id from public.achievements
        where criteria_type = 'time_of_day' and criteria_value = 7
        on conflict do nothing;
    end if;

    return new;
end;
$$ language plpgsql security definer;

-- Trigger on habit_logs
create trigger tr_check_achievements
after insert on public.habit_logs
for each row execute function public.check_achievements();
