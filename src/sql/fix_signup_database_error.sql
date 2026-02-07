-- FIX FOR "Database error saving new user"
-- Run this in your Supabase SQL Editor

-- 1. Create a robust function that doesn't fail the transaction if profile creation errors
-- This allows the Authorization user to be created, and our App code will handle the profile creation if this fails.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public -- Run as admin, use public schema
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, avatar_url, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    -- Try to get name from metadata (Name or Full Name for Google), default to email prefix
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    -- Try to get avatar (for Google)
    new.raw_user_meta_data->>'avatar_url',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING; -- If user exists, do nothing (don't fail)
  
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- Swallow errors so Auth User creation doesn't fail
    -- Our app's manual insert in AuthService will pick this up and retry
    RAISE WARNING 'Trigger failed to create user profile: %', SQLERRM;
    RETURN new;
END;
$$;

-- 2. Re-bind the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Ensure users table exists and has correct permissions
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS but allow Service Role (and Trigger) to bypass
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow users to read/update their own data
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Allow insert if it matches ID (for the manual insert fallback)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
