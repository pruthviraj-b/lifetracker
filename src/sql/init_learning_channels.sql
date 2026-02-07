-- Create the update_modified_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create learning_channels table
CREATE TABLE IF NOT EXISTS public.learning_channels (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    channel_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    custom_url TEXT,
    is_favorite BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.learning_channels ENABLE ROW LEVEL SECURITY;

-- Create Policies
DROP POLICY IF EXISTS "Users can view own channels" ON public.learning_channels;
CREATE POLICY "Users can view own channels" ON public.learning_channels
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own channels" ON public.learning_channels;
CREATE POLICY "Users can create own channels" ON public.learning_channels
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own channels" ON public.learning_channels;
CREATE POLICY "Users can delete own channels" ON public.learning_channels
    FOR DELETE USING (auth.uid() = user_id);

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_learning_channels_modtime ON public.learning_channels;
CREATE TRIGGER update_learning_channels_modtime
    BEFORE UPDATE ON public.learning_channels
    FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
