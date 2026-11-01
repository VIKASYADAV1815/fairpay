# 🎯 FairPay Backend - Complete Checklist

Use this to track your progress from local-only app → production-ready backend.

---

## 📋 Phase 1: Supabase Setup (15-20 min)

### [ ] 1.1 Create Supabase Account
- [ ] Go to https://supabase.com
- [ ] Sign up with GitHub or Google account
- [ ] Verify email (if needed)

### [ ] 1.2 Create New Project
- [ ] Click "New Project"
- [ ] Name: `fairpay-production`
- [ ] Generate strong database password
- [ ] **IMPORTANT:** Save password in secure location (password manager)
- [ ] Choose region: _________________ (closest to your users)
- [ ] Click "Create new project"
- [ ] Wait 2-3 minutes for provisioning

### [ ] 1.3 Run Database Schema
- [ ] Open Supabase Dashboard → SQL Editor
- [ ] Click "New query"
- [ ] Open `BACKEND-SETUP.md` in your code editor
- [ ] Copy the ENTIRE SQL block (starts with `CREATE EXTENSION`)
- [ ] Paste into SQL Editor
- [ ] Click "Run" (or Ctrl+Enter)
- [ ] Verify: "Success. No rows returned" message appears
- [ ] Check: Tables created (Dashboard → Table Editor → should see 7 tables)

### [ ] 1.4 Get API Credentials
- [ ] Go to Settings → API (left sidebar)
- [ ] Copy **Project URL**: _______________________________
- [ ] Copy **anon/public key**: _______________________________
- [ ] Keep this window open (you'll need these values)

### [ ] 1.5 Configure Environment
- [ ] In your code editor, open project root
- [ ] Create new file: `.env`
- [ ] Copy template from `.env.example`
- [ ] Paste your Project URL and Anon Key
- [ ] Save file
- [ ] **VERIFY:** `.env` is in `.gitignore` (should already be there)

### [ ] 1.6 Enable Authentication
- [ ] Supabase Dashboard → Authentication → Providers
- [ ] Click **Phone** provider
- [ ] Toggle ON "Enable Phone provider"
- [ ] For now: Select "Use test mode" (for development)
- [ ] Click "Save"
- [ ] (Later: Add Twilio credentials for production SMS)

### [ ] 1.7 Test Connection
- [ ] Stop your Expo dev server (Ctrl+C)
- [ ] Restart: `npx expo start --clear`
- [ ] Check Metro logs for errors
- [ ] If no errors: ✅ Setup complete!

**⏱️ Estimated time: 15-20 minutes**

---

## 📋 Phase 2: Authentication Screens (3-4 hours)

### [ ] 2.1 Phone Login Screen
- [ ] Create `src/app/auth/phone.tsx`
- [ ] Phone number input with country code picker
- [ ] Validation (10 digits for India, varies by country)
- [ ] "Send OTP" button
- [ ] Call `supabase.auth.signInWithOtp({ phone })`
- [ ] Handle loading state
- [ ] Handle errors (invalid number, rate limit)
- [ ] Navigate to OTP screen on success

### [ ] 2.2 OTP Verification Screen
- [ ] Create `src/app/auth/verify.tsx`
- [ ] 6-digit OTP input (auto-focus)
- [ ] Countdown timer (60 seconds)
- [ ] "Resend OTP" button (after timer expires)
- [ ] Call `supabase.auth.verifyOtp({ phone, token })`
- [ ] Handle loading state
- [ ] Handle errors (wrong OTP, expired)
- [ ] On success: Check if user exists in `users` table

### [ ] 2.3 User Profile Creation
- [ ] Create `src/app/auth/profile.tsx`
- [ ] Name input (required)
- [ ] Optional: Avatar upload
- [ ] Insert into `users` table:
  ```sql
  INSERT INTO users (id, phone_number, name)
  VALUES (auth.uid(), phone, name)
  ```
- [ ] Handle errors (duplicate phone)
- [ ] Navigate to home on success

### [ ] 2.4 Session Management
- [ ] Update `src/store/auth.ts`:
  - [ ] Add `session` state
  - [ ] Add `user` state (from Supabase)
  - [ ] Add `signOut()` function
  - [ ] Persist session in AsyncStorage
- [ ] Listen to auth state changes:
  ```typescript
  supabase.auth.onAuthStateChange((event, session) => {
    // Update store
  })
  ```

### [ ] 2.5 Protected Routes
- [ ] Create `src/components/AuthGuard.tsx`
- [ ] Check if user is authenticated
- [ ] If not: Redirect to `/auth/phone`
- [ ] If yes: Allow access
- [ ] Wrap protected screens with AuthGuard

### [ ] 2.6 Update Existing Screens
- [ ] Update home screen to check auth
- [ ] Add logout button in settings
- [ ] Show user name/phone in profile
- [ ] Test full auth flow:
  - [ ] Login with phone
  - [ ] Verify OTP
  - [ ] Create profile
  - [ ] Access protected routes
  - [ ] Logout
  - [ ] Login again (should skip profile creation)

**⏱️ Estimated time: 3-4 hours**

---

## 📋 Phase 3: Cloud Storage Migration (5-6 hours)

### [ ] 3.1 Trip Functions
- [ ] Replace `addTrip()` in `src/store/trips.ts`:
  ```typescript
  const { data, error } = await supabase
    .from('trips')
    .insert({
      name,
      purpose,
      currency,
      invite_code: generateInviteCode(),
      created_by: user.id
    })
    .select()
    .single();
  ```
- [ ] Replace `removeTrip()`
- [ ] Replace `updateTrip()` (if exists)
- [ ] Test: Create, view, delete trip

### [ ] 3.2 Member Functions
- [ ] Replace `addMember()`:
  ```typescript
  // 1. Insert into trip_members
  await supabase.from('trip_members').insert({
    trip_id: tripId,
    user_id: userId,
    payment_methods: { ... }
  });
  ```
- [ ] Replace `updateMember()`
- [ ] Replace `removeMember()`
- [ ] Test: Add, edit, remove member

### [ ] 3.3 Expense Functions
- [ ] Replace `addExpense()`:
  ```typescript
  // 1. Insert expense
  const { data: expense } = await supabase
    .from('expenses')
    .insert({ ... })
    .select()
    .single();
  
  // 2. Insert splits
  await supabase.from('expense_splits').insert(
    splits.map(s => ({
      expense_id: expense.id,
      user_id: s.memberId,
      amount: s.amount,
      is_paid: s.isPaid
    }))
  );
  ```
- [ ] Replace `updateExpense()`
- [ ] Replace `removeExpense()`
- [ ] Replace `toggleExpenseSplit()`
- [ ] Test: Create, edit, delete expense

### [ ] 3.4 Real-time Sync
- [ ] Subscribe to trip changes:
  ```typescript
  supabase
    .channel('trips')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'trips'
    }, payload => {
      // Update local state
    })
    .subscribe();
  ```
- [ ] Subscribe to expense changes
- [ ] Subscribe to member changes
- [ ] Test: Update on Device A, see change on Device B

### [ ] 3.5 Optimistic Updates
- [ ] Update UI immediately (before server response)
- [ ] Revert on error
- [ ] Show loading spinners for slow operations
- [ ] Test: Poor network conditions

### [ ] 3.6 Offline Support
- [ ] Queue mutations when offline
- [ ] Retry when back online
- [ ] Show offline indicator
- [ ] Handle conflicts (last-write-wins or prompt user)
- [ ] Test: Turn off WiFi, create expense, turn on WiFi

**⏱️ Estimated time: 5-6 hours**

---

## 📋 Phase 4: Real-time Features (2-3 hours)

### [ ] 4.1 Push Notifications Setup
- [ ] Install Expo notifications:
  ```bash
  npx expo install expo-notifications
  ```
- [ ] Request notification permissions
- [ ] Get push token
- [ ] Store push token in `users` table
- [ ] Test: Send test notification

### [ ] 4.2 Notification Triggers
- [ ] New expense notification:
  - [ ] When expense created → notify all members
- [ ] Payment confirmation notification:
  - [ ] When split marked paid → notify payer
- [ ] Payment reminder:
  - [ ] Manual: Send reminder button
  - [ ] Auto: 24h/48h/72h after expense (settings)
- [ ] Test: Trigger each notification type

### [ ] 4.3 In-App Notifications
- [ ] Show badge count on home icon
- [ ] Notification panel in app
- [ ] Mark as read functionality
- [ ] Deep link to expense/trip on tap
- [ ] Test: Receive notification → tap → opens correct screen

### [ ] 4.4 Multi-Device Sync
- [ ] Test login on Device A
- [ ] Test login on Device B (same account)
- [ ] Create expense on A → verify appears on B
- [ ] Mark payment on B → verify updates on A
- [ ] Test: 3+ devices simultaneously

**⏱️ Estimated time: 2-3 hours**

---

## 📋 Phase 5: Testing & Deploy (2-3 hours)

### [ ] 5.1 Feature Testing
- [ ] Complete auth flow (login, logout, re-login)
- [ ] Create trip with 3+ members
- [ ] Add 10+ expenses with different splits
- [ ] Mark payments (partial, full)
- [ ] Send reminders
- [ ] Edit members
- [ ] Remove members (test validation)
- [ ] Delete expenses
- [ ] Delete trip
- [ ] Test search & filters
- [ ] Test date grouping
- [ ] Pull-to-refresh

### [ ] 5.2 Multi-User Testing
- [ ] Device A: Create trip, invite Device B
- [ ] Device B: Join trip
- [ ] A: Add expense
- [ ] B: Mark as paid
- [ ] A: Confirm payment
- [ ] Test conflict: Both edit same expense simultaneously

### [ ] 5.3 Edge Cases
- [ ] Poor network (slow 3G)
- [ ] No network (offline mode)
- [ ] Network interruption mid-operation
- [ ] Very long expense lists (100+ expenses)
- [ ] Special characters in names (emoji, unicode)
- [ ] Large amounts (₹1,00,00,000+)
- [ ] Decimal precision (₹123.45)

### [ ] 5.4 Security Audit
- [ ] RLS policies working (can't see other users' data)
- [ ] `.env` file in `.gitignore`
- [ ] No API keys in code
- [ ] Phone number validation
- [ ] Input sanitization

### [ ] 5.5 Performance Testing
- [ ] App launch time < 3 seconds
- [ ] Screen transitions smooth (60fps)
- [ ] Search/filter instant (< 200ms)
- [ ] Large list scrolling smooth
- [ ] Memory usage stable (no leaks)

### [ ] 5.6 Bug Fixes
- [ ] List all bugs found during testing
- [ ] Prioritize (critical, high, medium, low)
- [ ] Fix critical and high bugs
- [ ] Test fixes
- [ ] Document known low-priority issues

### [ ] 5.7 App Store Preparation
- [ ] Update app.json:
  - [ ] Version number
  - [ ] Bundle identifier
  - [ ] Permissions (notifications, camera for receipts)
  - [ ] Privacy policy URL
  - [ ] Terms of service URL
- [ ] Create app icons (all sizes)
- [ ] Create screenshots (iOS + Android)
- [ ] Write app description
- [ ] Prepare demo video (optional)

### [ ] 5.8 Build & Submit
- [ ] iOS:
  - [ ] `bunx eas-cli build --platform ios`
  - [ ] Test on TestFlight
  - [ ] Fix any issues
  - [ ] `bunx eas-cli submit --platform ios`
- [ ] Android:
  - [ ] `bunx eas-cli build --platform android`
  - [ ] Test on internal track
  - [ ] Fix any issues
  - [ ] `bunx eas-cli submit --platform android`

**⏱️ Estimated time: 2-3 hours**

---

## 🎉 Launch Checklist

### [ ] Pre-Launch
- [ ] All critical bugs fixed
- [ ] All phases above completed
- [ ] TestFlight/Internal track testing done
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] Support email setup
- [ ] Analytics configured (optional)

### [ ] Launch Day
- [ ] Submit to App Store
- [ ] Submit to Play Store
- [ ] Monitor Supabase logs
- [ ] Monitor crash reports
- [ ] Respond to early reviews
- [ ] Celebrate! 🎉

### [ ] Post-Launch (Week 1)
- [ ] Check daily active users
- [ ] Monitor database usage (Supabase dashboard)
- [ ] Fix any reported bugs (hotfix if critical)
- [ ] Respond to user feedback
- [ ] Plan next features

---

## 📊 Progress Tracker

**Current Status:**
- [ ] Phase 1: Supabase Setup (0% → 100%)
- [ ] Phase 2: Authentication (0% → 100%)
- [ ] Phase 3: Cloud Storage (0% → 100%)
- [ ] Phase 4: Real-time Features (0% → 100%)
- [ ] Phase 5: Testing & Deploy (0% → 100%)

**Overall Progress: _____ / 100%**

**Target Launch Date: _______________**

---

## 🆘 If You Get Stuck

### Common Issues:
1. **Supabase connection error:** Check `.env` file, verify URL/key
2. **RLS policy denying access:** Check user is authenticated, policy matches schema
3. **Real-time not working:** Check subscription code, verify triggers in Supabase
4. **Push notifications not received:** Check permissions, verify push token stored

### Resources:
- Supabase Docs: https://supabase.com/docs
- Expo Docs: https://docs.expo.dev
- Ask me! I'm here to help 🚀

---

**Let's build this! Start with Phase 1! 🔥**
