-- Create a table to store user preferences
create table public.user_preferences (
  user_id uuid references auth.users not null primary key,
  theme text default 'dark',
  language text default 'en-US',
  timezone text default 'UTC',
  date_format text default 'MM/DD/YYYY',
  time_format text default '12-hour',
  
  -- Notification Preferences
  notify_push boolean default true,
  notify_email boolean default false,
  notify_sms boolean default false,
  quiet_hours_start time,
  quiet_hours_end time,
  
  -- Habit Preferences
  default_category text default 'General',
  default_reminder_time time default '09:00',
  auto_archive boolean default false,
  show_completed boolean default true,
  
  -- Theme Customization & Accessibility
  accent_color text default '142 71% 45%',
  high_contrast boolean default false,
  eye_strain_mode boolean default false,
  font_size text default 'md',
  theme_schedule_enabled boolean default false,
  theme_schedule_start time default '20:00',
  theme_schedule_end time default '07:00',
  brightness integer default 100,
  wild_mode boolean default false,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.user_preferences enable row level security;

-- Policies
create policy "Users can view their own preferences" on public.user_preferences
  for select using (auth.uid() = user_id);

create policy "Users can update their own preferences" on public.user_preferences
  for update using (auth.uid() = user_id);

create policy "Users can insert their own preferences" on public.user_preferences
  for insert with check (auth.uid() = user_id);

-- Trigger to handle updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_preferences_updated
  before update on public.user_preferences
  for each row execute procedure public.handle_updated_at();

-- Function to handle new user creation (auto-create preferences)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_preferences (user_id)
  values (new.id);
  return new;
end;
$$ language plpgsql;

-- Trigger for auto-creation (Optional, if you want default prefs on signup)
-- create trigger on_auth_user_created
--   after insert on auth.users
--   for each row execute procedure public.handle_new_user();
