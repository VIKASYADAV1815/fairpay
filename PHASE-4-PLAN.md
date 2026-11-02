# Phase 4: Store Integration Plan

## 🎯 Goal:
Connect Zustand stores with Supabase APIs for cloud sync while maintaining local-first UX.

---

## ✅ Changes Completed:

### 1. Login Required for Groups
- ✅ "New" button checks authentication
- ✅ Shows alert: "Sign in Required" if not logged in
- ✅ Redirects to phone login

### 2. Blue Diamond Icon
- ✅ Changed from `c.accent` (neon green) to `#00A3FF` (blue)
- ✅ Only shows blue when user has Pro status

---

## 🔄 Next: Store Integration Strategy

### Hybrid Approach (Best UX):

```
Local First (Zustand)  ←→  Cloud Sync (Supabase)
     ↓                           ↓
AsyncStorage (persist)      PostgreSQL (backup)
```

**User Experience:**
1. **Create trip** → Saves locally immediately (instant)
2. **Background** → Syncs to Supabase (if logged in)
3. **Other device** → Pulls from Supabase
4. **Real-time** → Subscribes to changes

---

## 📦 Implementation Plan:

### Step 1: Update Trip Store (`src/store/trips.ts`)

**Add cloud sync functions:**
```typescript
// Existing (keep):
addTrip(name, purpose, currency) {
  // 1. Create trip locally (instant UI)
  const trip = { ...local data };
  set({ trips: [...trips, trip] });
  
  // 2. Sync to cloud (background)
  if (isCloudEnabled()) {
    syncTripToCloud(trip);
  }
}

// New (add):
async syncTripToCloud(trip: Trip) {
  const { error } = await createTrip({
    name: trip.name,
    purpose: trip.purpose,
    currency: trip.currency,
    userId: user.id,
  });
  
  if (error) {
    queueOperation('create_trip', trip);
  }
}
```

**Benefits:**
- ✅ Instant UI (no waiting for network)
- ✅ Works offline
- ✅ Syncs when online
- ✅ Queues operations if sync fails

---

### Step 2: Add Sync Manager (`src/lib/sync-manager.ts`)

**Responsibilities:**
- Monitor online/offline status
- Process offline queue when back online
- Handle sync conflicts
- Retry failed operations

**Example:**
```typescript
// When user comes back online
NetInfo.addEventListener(state => {
  if (state.isConnected) {
    processOfflineQueue();
    refreshFromCloud();
  }
});
```

---

### Step 3: Real-Time Subscriptions

**For each trip screen:**
```typescript
useEffect(() => {
  if (!isCloudEnabled()) return;
  
  // Subscribe to this trip's changes
  const sub = subscribeToTrip(tripId, (updatedTrip) => {
    // Update local store with cloud changes
    useTripStore.getState().updateTripFromCloud(updatedTrip);
  });
  
  return () => sub.unsubscribe();
}, [tripId]);
```

**Result:**
- Change on Device A → Instantly appears on Device B
- Multi-user editing works seamlessly

---

### Step 4: Data Migration

**For existing local users who sign up:**

```typescript
async function migrateLocalToCloud() {
  const trips = useTripStore.getState().trips;
  
  for (const trip of trips) {
    // Upload each trip to cloud
    await createTrip({ ...trip });
  }
  
  // Mark as migrated
  AsyncStorage.setItem('migrated-to-cloud', 'true');
}
```

**Triggered:**
- After user completes signup
- Shows progress: "Syncing your data... 3/5 trips"
- One-time operation

---

## 📊 Architecture Diagram:

```
┌──────────────────────────────────────────┐
│         User Interface (React)           │
└────────────────┬─────────────────────────┘
                 │
                 ↓
┌──────────────────────────────────────────┐
│      Zustand Store (Local State)         │
│  • Instant updates                       │
│  • Optimistic UI                         │
│  • Persisted to AsyncStorage             │
└────────────────┬─────────────────────────┘
                 │
                 ↓
┌──────────────────────────────────────────┐
│         Sync Manager (NEW)               │
│  • Online/offline detection              │
│  • Queue failed operations               │
│  • Process queue when online             │
│  • Conflict resolution                   │
└───┬──────────────────────────────────┬───┘
    │                                  │
    ↓ (when online)                    ↓ (when online)
┌───────────────────┐        ┌─────────────────────┐
│   API Layer       │        │   Real-Time Subs    │
│ (create, update,  │        │ (subscribeToTrip,   │
│  delete trips)    │        │  subscribeToExpense)│
└─────────┬─────────┘        └──────────┬──────────┘
          │                             │
          ↓                             ↓
    ┌─────────────────────────────────────┐
    │        Supabase (Cloud)             │
    │  • PostgreSQL database              │
    │  • Real-time broadcasting           │
    │  • Row Level Security (RLS)         │
    └─────────────────────────────────────┘
```

---

## 🔒 Security:

**Row Level Security (RLS):**
```sql
-- Users can only see trips they're members of
CREATE POLICY "Users see their own trips"
ON trips FOR SELECT
USING (
  id IN (
    SELECT trip_id FROM trip_members
    WHERE user_id = auth.uid()
  )
);
```

**Already in schema!** ✅ (from BACKEND-SETUP.md)

---

## 🎨 Loading States:

**Add to stores:**
```typescript
type TripStore = {
  trips: Trip[];
  loading: boolean;      // Initial load
  syncing: boolean;      // Background sync
  error: string | null;  // Last error
  // ... existing
}
```

**Show in UI:**
```typescript
{loading ? <Spinner /> : null}
{syncing ? <SyncingBadge /> : null}
{error ? <ErrorBanner error={error} onRetry={...} /> : null}
```

---

## 📱 User Flows:

### Flow 1: Local User (No Account)
```
1. User creates trip → Saved locally ✅
2. User adds expenses → Saved locally ✅
3. User tries to invite → Prompt: "Sign up to invite"
4. User signs up → Migrates data to cloud
5. Now can invite others ✅
```

### Flow 2: Logged-In User
```
1. User creates trip → Saved locally + synced to cloud ✅
2. Opens on Phone → Sees trip ✅
3. Opens on Tablet → Sees same trip ✅ (fetched from cloud)
4. Adds expense on Phone → Appears on Tablet instantly ✅ (real-time)
```

### Flow 3: Offline User
```
1. User goes offline (airplane mode)
2. User creates trip → Saved locally ✅
3. User adds expense → Saved locally ✅
4. Operations queued for sync
5. User comes back online → Queue processes ✅
6. All data synced to cloud ✅
```

---

## 🧪 Testing Plan:

### Local Mode:
- [ ] Create trip without login → Works
- [ ] Add expenses → Works
- [ ] Data persists → Works
- [ ] Try to invite → Shows signup prompt

### Logged-In Mode:
- [ ] Create trip → Appears in Supabase
- [ ] Add expense → Appears in Supabase
- [ ] Refresh page → Data loads from cloud
- [ ] Open on 2nd device → Sees same data

### Real-Time:
- [ ] Device A: Add expense
- [ ] Device B: See it appear (< 2 seconds)
- [ ] Device A: Mark as paid
- [ ] Device B: Status updates

### Offline:
- [ ] Turn off WiFi
- [ ] Create trip + expense
- [ ] Check queue (should have 2 operations)
- [ ] Turn on WiFi
- [ ] Queue processes
- [ ] Data appears in Supabase

---

## 🚀 Implementation Order:

1. ✅ **Login requirement for groups** (DONE)
2. ✅ **Blue diamond** (DONE)
3. **Add sync manager** (30 min)
4. **Update trip store** (1 hour)
5. **Add real-time subscriptions** (30 min)
6. **Add loading states** (30 min)
7. **Test flows** (1 hour)

**Total: ~3-4 hours**

---

## 📝 Files to Modify:

```
src/
├── lib/
│   ├── sync-manager.ts     ← NEW (online/offline, queue processing)
│   └── storage.ts          ← EXISTS (mode detection)
├── store/
│   └── trips.ts            ← MODIFY (add cloud sync)
├── app/
│   └── trip/[id].tsx       ← MODIFY (add real-time sub)
└── components/
    ├── SyncingBadge.tsx    ← NEW (shows "Syncing..." indicator)
    └── ErrorBanner.tsx     ← NEW (shows sync errors)
```

---

**Ready to implement? This will make FairPay a true cloud-synced app!** 🚀
