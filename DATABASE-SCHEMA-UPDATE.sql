-- Update database schema for OAuth and onboarding
-- Run this in Supabase SQL Editor

-- 1. Update users table
ALTER TABLE users
  -- Make phone optional (not required anymore)
  ALTER COLUMN phone_number DROP NOT NULL,
  
  -- Add avatar URL from OAuth
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  
  -- Add onboarding data (JSONB for flexibility)
  ADD COLUMN IF NOT EXISTS onboarding_data JSONB DEFAULT '{
    "completed": false,
    "use_case": null,
    "frequency": null,
    "completed_at": null
  }'::jsonb;

-- 2. Add index for faster onboarding queries
CREATE INDEX IF NOT EXISTS idx_users_onboarding 
  ON users ((onboarding_data->>'completed'));

-- 3. Update RLS policies (if needed)
-- Allow users to read their own onboarding data
CREATE POLICY "Users can read own onboarding data"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Allow users to update their own onboarding data
CREATE POLICY "Users can update own onboarding data"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Done! ✅
-- Users table now supports:
-- - OAuth login (email, name, avatar_url from Google/Apple)
-- - Optional phone (for reminders only)
-- - Payment methods (JSONB array)
-- - Onboarding preferences (use_case, frequency)
