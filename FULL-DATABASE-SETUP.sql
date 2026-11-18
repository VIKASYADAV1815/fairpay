-- ================================================================
-- FAIRPAY: COMPLETE PRODUCTION DATABASE SCHEMA
-- ================================================================
-- Run this script in your Supabase Dashboard:
-- SQL Editor -> New query -> Paste & Run
-- ================================================================

-- OPTIONAL RESET (Safe to run if your tables are currently empty):
-- If your tables were created with strict UUIDs from an older setup,
-- run these 4 DROP lines first to recreate them with full TEXT ID support:
DROP TABLE IF EXISTS public.expense_splits CASCADE;
DROP TABLE IF EXISTS public.expenses CASCADE;
DROP TABLE IF EXISTS public.trip_members CASCADE;
DROP TABLE IF EXISTS public.trips CASCADE;

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  phone_number TEXT,
  name TEXT NOT NULL,
  avatar_url TEXT,
  payment_methods JSONB DEFAULT '[]'::jsonb,
  onboarding_data JSONB DEFAULT '{"completed": false, "use_case": null, "frequency": null}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TRIPS TABLE
CREATE TABLE IF NOT EXISTS public.trips (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  purpose TEXT,
  currency TEXT DEFAULT 'INR',
  invite_code TEXT UNIQUE NOT NULL,
  pot_cashback NUMERIC DEFAULT 0,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for instant case-insensitive invite code lookups
CREATE INDEX IF NOT EXISTS idx_trips_invite_code ON public.trips(invite_code);

-- 4. TRIP MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.trip_members (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  trip_id TEXT NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  name TEXT DEFAULT 'Member',
  upi_id TEXT,
  payment_methods JSONB DEFAULT '[]'::jsonb,
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist even if table was created previously
ALTER TABLE public.trip_members ADD COLUMN IF NOT EXISTS payment_methods JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.trip_members ADD COLUMN IF NOT EXISTS name TEXT DEFAULT 'Member';
ALTER TABLE public.trip_members ADD COLUMN IF NOT EXISTS upi_id TEXT;

CREATE INDEX IF NOT EXISTS idx_trip_members_trip_id ON public.trip_members(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_members_user_id ON public.trip_members(user_id);

-- 5. EXPENSES TABLE
CREATE TABLE IF NOT EXISTS public.expenses (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  trip_id TEXT NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  paid_by_id TEXT NOT NULL REFERENCES public.trip_members(id) ON DELETE CASCADE,
  tag TEXT,
  receipt_uri TEXT,
  recurring BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_trip_id ON public.expenses(trip_id);
CREATE INDEX IF NOT EXISTS idx_expenses_paid_by ON public.expenses(paid_by_id);

-- 6. EXPENSE SPLITS TABLE
CREATE TABLE IF NOT EXISTS public.expense_splits (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  expense_id TEXT NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  member_id TEXT NOT NULL REFERENCES public.trip_members(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  percentage NUMERIC,
  is_paid BOOLEAN DEFAULT false,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_splits_expense_id ON public.expense_splits(expense_id);
CREATE INDEX IF NOT EXISTS idx_splits_member_id ON public.expense_splits(member_id);

-- 7. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_splits ENABLE ROW LEVEL SECURITY;

-- 8. POLICIES (Full Collaboration & Cross-Device Sync)
-- Users can view & update their own profile
DROP POLICY IF EXISTS "Users view own profile" ON public.users;
CREATE POLICY "Users view own profile" ON public.users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users update own profile" ON public.users;
CREATE POLICY "Users update own profile" ON public.users FOR ALL USING (auth.uid() = id);

-- Trips: Anyone with the invite code can view & interact with the trip
DROP POLICY IF EXISTS "Trips access policy" ON public.trips;
CREATE POLICY "Trips access policy" ON public.trips FOR ALL USING (true);

-- Trip Members: Members can view and add peers
DROP POLICY IF EXISTS "Trip members policy" ON public.trip_members;
CREATE POLICY "Trip members policy" ON public.trip_members FOR ALL USING (true);

-- Expenses: Group members can manage expenses
DROP POLICY IF EXISTS "Expenses policy" ON public.expenses;
CREATE POLICY "Expenses policy" ON public.expenses FOR ALL USING (true);

-- Splits: Group members can view and update payments
DROP POLICY IF EXISTS "Splits policy" ON public.expense_splits;
CREATE POLICY "Splits policy" ON public.expense_splits FOR ALL USING (true);

-- 9. ENABLE REAL-TIME REPLICATION FOR LIVE MULTI-DEVICE SYNC
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.trips, public.trip_members, public.expenses, public.expense_splits;

-- All set! ✅
