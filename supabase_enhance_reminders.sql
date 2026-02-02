-- Add new columns for enhanced reminders
alter table public.reminders 
add column habit_id uuid references public.habits(id) on delete set null,
add column notification_type text default 'in-app';

-- Note: habit_id is nullable (reminders can be standalone)
