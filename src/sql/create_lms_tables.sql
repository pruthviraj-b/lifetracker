-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- 1. COURSES TABLE
-- The root container for a learning path.
create table if not exists courses (
    id uuid default uuid_generate_v4() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    title text not null,
    description text,
    thumbnail_url text, -- Banner image
    difficulty_level text check (difficulty_level in ('Beginner', 'Intermediate', 'Advanced', 'Expert')),
    duration_weeks integer default 4,
    tags text[], -- Array of strings e.g. ['python', 'backend']
    published boolean default false,
    author_id uuid references auth.users(id) -- Optional: if we have multiple creators
);

-- 2. MODULES TABLE
-- Sections within a course (e.g. "Phase 1: Basics")
create table if not exists modules (
    id uuid default uuid_generate_v4() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    course_id uuid references courses(id) on delete cascade not null,
    title text not null,
    description text,
    "order" integer not null default 0 -- To sequence modules (0, 1, 2...)
);

-- 3. LESSONS TABLE
-- The actual content units.
create table if not exists lessons (
    id uuid default uuid_generate_v4() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    module_id uuid references modules(id) on delete cascade not null,
    title text not null,
    content text, -- Markdown content, or video URL
    type text default 'text' check (type in ('text', 'video', 'quiz', 'project')),
    duration_minutes integer default 15,
    "order" integer not null default 0,
    is_optional boolean default false
);

-- 4. ENROLLMENTS (User Course Progress)
-- Tracks which users are taking which courses.
create table if not exists enrollments (
    id uuid default uuid_generate_v4() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    user_id uuid references auth.users(id) not null,
    course_id uuid references courses(id) on delete cascade not null,
    started_at timestamp with time zone default timezone('utc'::text, now()),
    completed_at timestamp with time zone,
    progress_percent integer default 0,
    unique(user_id, course_id)
);

-- 5. LESSON PROGRESS
-- Granular tracking of each lesson.
create table if not exists lesson_progress (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users(id) not null,
    lesson_id uuid references lessons(id) on delete cascade not null,
    status text default 'not_started' check (status in ('not_started', 'in_progress', 'completed')),
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    completed_at timestamp with time zone,
    unique(user_id, lesson_id)
);

-- RLS POLICIES (Row Level Security)
-- Ensure users can read published courses, but only modify their own progress.

alter table courses enable row level security;
alter table modules enable row level security;
alter table lessons enable row level security;
alter table enrollments enable row level security;
alter table lesson_progress enable row level security;

-- Public Read Access for Courses/Content
create policy "Public courses are viewable by everyone" on courses
  for select using (true);

create policy "Modules are viewable by everyone" on modules
  for select using (true);

create policy "Lessons are viewable by everyone" on lessons
  for select using (true);

-- User Progress Access (Only their own)
create policy "Users can manage their own enrollments" on enrollments
  for all using (auth.uid() = user_id);

create policy "Users can manage their own lesson progress" on lesson_progress
  for all using (auth.uid() = user_id);
