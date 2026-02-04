-- Create Flashcards Table
create table if not exists flashcards (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) not null,
  note_id uuid references notes(id) on delete set null,
  front text not null,
  back text not null,
  next_review timestamptz default now(),
  interval integer default 0, -- Interval in days
  ease_factor float default 2.5,
  streak integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table flashcards enable row level security;

-- Policies
create policy "Users can view their own flashcards"
  on flashcards for select
  using (auth.uid() = user_id);

create policy "Users can insert their own flashcards"
  on flashcards for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own flashcards"
  on flashcards for update
  using (auth.uid() = user_id);

create policy "Users can delete their own flashcards"
  on flashcards for delete
  using (auth.uid() = user_id);
