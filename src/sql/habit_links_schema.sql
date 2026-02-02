-- Habit Links Table (Phase 10)
CREATE TABLE IF NOT EXISTS public.habit_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    source_habit_id UUID REFERENCES public.habits(id) ON DELETE CASCADE NOT NULL,
    target_habit_id UUID REFERENCES public.habits(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('chain', 'prerequisite', 'synergy', 'conflict')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    
    -- Prevent self-linking
    CONSTRAINT no_self_link CHECK (source_habit_id <> target_habit_id),
    -- Ensure unique relationships of the same type
    UNIQUE(user_id, source_habit_id, target_habit_id, type)
);

-- Enable RLS
ALTER TABLE public.habit_links ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own habit links"
    ON public.habit_links
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_habit_links_user ON public.habit_links(user_id);
CREATE INDEX idx_habit_links_source ON public.habit_links(source_habit_id);
CREATE INDEX idx_habit_links_target ON public.habit_links(target_habit_id);

COMMENT ON TABLE public.habit_links IS 'Stores relationships between habits: chains (A triggers B), prerequisites (A before B), synergies (A+B bonus), and conflicts (A vs B).';
