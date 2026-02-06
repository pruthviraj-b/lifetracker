-- Multiverse Universal Linking Table
-- This table allows linking ANY internal entity to ANY other entity.
-- Supported Types: 'habit', 'course', 'video', 'note', 'achievement'

CREATE TABLE IF NOT EXISTS public.multiverse_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    source_type TEXT NOT NULL CHECK (source_type IN ('habit', 'course', 'video', 'note', 'achievement')),
    source_id UUID NOT NULL,
    
    target_type TEXT NOT NULL CHECK (target_type IN ('habit', 'course', 'video', 'note', 'achievement')),
    target_id UUID NOT NULL,
    
    relation_type TEXT NOT NULL CHECK (relation_type IN ('prerequisite', 'dependency', 'synergy', 'spawn', 'reference')),
    
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    
    -- Prevent self-linking of the exact same entity
    CONSTRAINT no_multiverse_self_link CHECK (NOT (source_id = target_id AND source_type = target_type)),
    -- Ensure uniqueness for the same relationship
    UNIQUE(user_id, source_id, source_type, target_id, target_type, relation_type)
);

-- Enable RLS
ALTER TABLE public.multiverse_links ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own multiverse links"
    ON public.multiverse_links
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Performance Indexes
CREATE INDEX idx_multiverse_user ON public.multiverse_links(user_id);
CREATE INDEX idx_multiverse_source ON public.multiverse_links(source_id, source_type);
CREATE INDEX idx_multiverse_target ON public.multiverse_links(target_id, target_type);

COMMENT ON TABLE public.multiverse_links IS 'A generalized graph edge table linking habits, courses, videos, and notes across the entire Ritual OS multiverse.';
