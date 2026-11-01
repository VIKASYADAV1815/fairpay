# FairPay Backend Setup Guide

## 🚀 Backend Architecture: Supabase

**Why Supabase?**
- ✅ Free tier (500MB database, 50K users)
- ✅ PostgreSQL (reliable, mature)
- ✅ Built-in authentication
- ✅ Real-time subscriptions
- ✅ Auto-generated REST API
- ✅ No custom backend code needed

---

## 📦 Step 1: Create Supabase Project (5 min)

1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up (GitHub/Google)
4. Create new project:
   - **Name:** fairpay-production
   - **Database Password:** (generate strong password - SAVE IT!)
   - **Region:** Choose closest to your users
   - Click "Create new project"

**Wait 2-3 minutes for database to provision...**

---

## 🗄️ Step 2: Database Schema (30 min)

Copy this SQL and run in Supabase SQL Editor:

```sql
-- ============================================
-- FAIRPAY DATABASE SCHEMA
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone_number TEXT UNIQUE,
  email TEXT UNIQUE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  payment_methods JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_users_email ON users(email);

-- ============================================
-- TRIPS (GROUPS) TABLE
-- ============================================
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  purpose TEXT,
  currency TEXT DEFAULT 'INR',
  invite_code TEXT UNIQUE NOT NULL,
  pot_cashback NUMERIC(10,2) DEFAULT 0,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for invite code lookups
CREATE INDEX idx_trips_invite_code ON trips(invite_code);
CREATE INDEX idx_trips_created_by ON trips(created_by);

-- ============================================
-- TRIP MEMBERS (JUNCTION TABLE)
-- ============================================
CREATE TABLE trip_members (
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member', -- 'admin' or 'member'
  payment_methods JSONB,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (trip_id, user_id)
);

-- Indexes
CREATE INDEX idx_trip_members_trip ON trip_members(trip_id);
CREATE INDEX idx_trip_members_user ON trip_members(user_id);

-- ============================================
-- EXPENSES TABLE
-- ============================================
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  paid_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  tag TEXT,
  receipt_url TEXT,
  recurring BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_expenses_trip ON expenses(trip_id);
CREATE INDEX idx_expenses_paid_by ON expenses(paid_by_id);
CREATE INDEX idx_expenses_created_at ON expenses(created_at DESC);

-- ============================================
-- EXPENSE SPLITS TABLE
-- ============================================
CREATE TABLE expense_splits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  is_paid BOOLEAN DEFAULT FALSE,
  paid_at TIMESTAMPTZ,
  confirmed_by_payer BOOLEAN DEFAULT FALSE,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(expense_id, user_id)
);

-- Indexes
CREATE INDEX idx_splits_expense ON expense_splits(expense_id);
CREATE INDEX idx_splits_user ON expense_splits(user_id);
CREATE INDEX idx_splits_is_paid ON expense_splits(is_paid);

-- ============================================
-- PAYMENT NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE payment_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
  from_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'rejected'
  seen BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_notifications_to_user ON payment_notifications(to_user_id);
CREATE INDEX idx_notifications_status ON payment_notifications(status);

-- ============================================
-- PAID TRANSFERS TABLE (Settlement tracking)
-- ============================================
CREATE TABLE paid_transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  from_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  paid_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_transfers_trip ON paid_transfers(trip_id);
CREATE INDEX idx_transfers_from_user ON paid_transfers(from_user_id);
CREATE INDEX idx_transfers_to_user ON paid_transfers(to_user_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE paid_transfers ENABLE ROW LEVEL SECURITY;

-- Users: Can only see themselves
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Trips: Can only see trips they're a member of
CREATE POLICY "Users can view trips they're in"
  ON trips FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = trips.id
      AND trip_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create trips"
  ON trips FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Trip admins can update trips"
  ON trips FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = trips.id
      AND trip_members.user_id = auth.uid()
      AND trip_members.role = 'admin'
    )
  );

-- Trip Members: Can see members of trips they're in
CREATE POLICY "Users can view trip members"
  ON trip_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trip_members tm
      WHERE tm.trip_id = trip_members.trip_id
      AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join trips"
  ON trip_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Expenses: Can see expenses in trips they're part of
CREATE POLICY "Users can view trip expenses"
  ON expenses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = expenses.trip_id
      AND trip_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create expenses in their trips"
  ON expenses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = trip_id
      AND trip_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update expenses they created"
  ON expenses FOR UPDATE
  USING (paid_by_id = auth.uid());

-- Expense Splits: Same as expenses
CREATE POLICY "Users can view splits"
  ON expense_splits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM expenses e
      JOIN trip_members tm ON tm.trip_id = e.trip_id
      WHERE e.id = expense_splits.expense_id
      AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own splits"
  ON expense_splits FOR UPDATE
  USING (user_id = auth.uid());

-- Notifications: Can only see notifications sent to them
CREATE POLICY "Users can view their notifications"
  ON payment_notifications FOR SELECT
  USING (to_user_id = auth.uid() OR from_user_id = auth.uid());

-- Paid Transfers: Can see transfers in their trips
CREATE POLICY "Users can view trip transfers"
  ON paid_transfers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = paid_transfers.trip_id
      AND trip_members.user_id = auth.uid()
    )
  );

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to generate unique invite codes
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  characters TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    code := code || substr(characters, floor(random() * length(characters) + 1)::int, 1);
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON trips
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON payment_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- View: Trip stats
CREATE OR REPLACE VIEW trip_stats AS
SELECT
  t.id AS trip_id,
  t.name,
  COUNT(DISTINCT tm.user_id) AS member_count,
  COUNT(DISTINCT e.id) AS expense_count,
  COALESCE(SUM(e.amount), 0) AS total_amount,
  t.currency
FROM trips t
LEFT JOIN trip_members tm ON tm.trip_id = t.id
LEFT JOIN expenses e ON e.trip_id = t.id
GROUP BY t.id, t.name, t.currency;

-- View: User balances per trip
CREATE OR REPLACE VIEW user_trip_balances AS
SELECT
  tm.trip_id,
  tm.user_id,
  u.name AS user_name,
  COALESCE(SUM(CASE WHEN e.paid_by_id = tm.user_id THEN e.amount ELSE 0 END), 0) AS total_paid,
  COALESCE(SUM(es.amount), 0) AS total_owed,
  COALESCE(SUM(CASE WHEN e.paid_by_id = tm.user_id THEN e.amount ELSE 0 END), 0) - 
  COALESCE(SUM(es.amount), 0) AS balance
FROM trip_members tm
JOIN users u ON u.id = tm.user_id
LEFT JOIN expenses e ON e.trip_id = tm.trip_id
LEFT JOIN expense_splits es ON es.user_id = tm.user_id AND es.expense_id = e.id
GROUP BY tm.trip_id, tm.user_id, u.name;

-- ============================================
-- SEED DATA (Optional - for testing)
-- ============================================

-- Create test users (passwords will be set via Supabase Auth UI)
-- Run this AFTER creating users via Supabase Auth Dashboard

```

---

## 🔑 Step 3: Enable Authentication (10 min)

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Enable **Phone** authentication:
   - Toggle ON "Enable Phone provider"
   - Choose SMS provider (Twilio recommended)
   - Add Twilio credentials (or use Supabase's test mode)

3. Enable **Email** authentication (backup):
   - Toggle ON "Enable Email provider"
   - Configure email templates (optional)

---

## 📱 Step 4: Install Supabase in App (5 min)

```bash
npx expo install @supabase/supabase-js
npx expo install @react-native-async-storage/async-storage
npx expo install react-native-url-polyfill
```

---

## 🔧 Step 5: Configure Supabase Client (10 min)

Create `src/lib/supabase.ts`:

```typescript
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'YOUR_SUPABASE_URL'; // From Supabase dashboard
const supabaseAnonKey = 'YOUR_ANON_KEY'; // From Supabase dashboard → Settings → API

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

---

## 📝 Next Steps

Once database is created:
1. Get API keys from Supabase Dashboard
2. Install Supabase client in app
3. Migrate Zustand store → Supabase queries
4. Add authentication screens
5. Test real-time sync
6. Deploy!

**Estimated total time: 2-3 days**

---

## 🆘 Need Help?

If you get stuck:
1. Check Supabase docs: https://supabase.com/docs
2. Ask me! I'll help debug any issues
3. Supabase Discord: https://discord.supabase.com

Let's do this! 🚀
