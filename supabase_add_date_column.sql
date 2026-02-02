-- Add date column to reminders table
alter table public.reminders 
add column date text; -- Format YYYY-MM-DD

-- Notes:
-- If date is set, 'days' should likely be ignored or empty per new logic.
-- If date is NULL, it falls back to 'days' (recurring).
