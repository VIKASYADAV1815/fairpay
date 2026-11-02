# 🎯 FairPay - Progressive Onboarding Flow

## Your Requirements

✅ **Login popup on install** (with Skip option)
✅ **If Skip → Direct to home** (use locally)
✅ **If Login → Profile setup screen** (name, UPI, etc.)
✅ **Then → Onboarding questions** (personalized!)

---

## 🔍 How Other Apps Do It

### Example 1: Duolingo
```
1. Open app → "Get Started"
2. Ask: "Why are you learning?" (goal setting)
   - For work
   - For travel
   - For family
   - Just for fun
3. Ask: "How much time can you spend?"
   - 5 min/day
   - 10 min/day
   - 15 min/day
4. Create account → Personalized lessons!
```

**Key:** Questions determine which lessons/content to show!

---

### Example 2: Notion
```
1. Open app → Login
2. Ask: "How will you use Notion?"
   - For myself
   - With my team
   - For school
3. Based on answer:
   - "Myself" → Personal templates
   - "Team" → Collaboration features
   - "School" → Study templates
4. Start using!
```

**Key:** Questions customize workspace/templates!

---

### Example 3: Spotify
```
1. Open app → Signup
2. Ask: "Choose 3+ genres you like"
   - Rock, Pop, Jazz, Hip-Hop...
3. Ask: "Choose 3+ artists"
   - Shows artists based on genres
4. Done → Personalized recommendations!
```

**Key:** Questions train recommendation algorithm!

---

### Example 4: Slack
```
1. Signup
2. Ask: "What's your company name?"
3. Ask: "What will your team use Slack for?"
   - Project management
   - Customer support
   - General communication
4. Create workspace with preset channels!
```

**Key:** Questions create relevant channels/structure!

---

## 🎯 FairPay's Flow (Best for Us!)

### Flow Diagram:

```
┌─────────────────────────────────────┐
│   USER OPENS APP (First Time)      │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│   [Login/Signup Popup]              │
│                                     │
│   🔵 Continue with Google           │
│   🍎 Continue with Apple            │
│   📧 Use Email                      │
│                                     │
│   [ Skip for now ]  ← Can skip!     │
└─────────────────────────────────────┘
         ↓              ↓
    [LOGIN]        [SKIP]
         ↓              ↓
         │              │
         │              └────→ [HOME] (Local mode)
         │
         ↓
┌─────────────────────────────────────┐
│   Profile Setup (Logged in users)   │
│                                     │
│   Welcome, John! 👋                 │
│                                     │
│   Let's set up your profile:        │
│                                     │
│   Name: [John Doe] ← From Google    │
│   Phone: [+91 ...] (optional)       │
│                                     │
│   Payment Method:                   │
│   🇮🇳 UPI ID: [yourname@paytm]      │
│   or                                │
│   🌍 PayPal: [you@gmail.com]        │
│                                     │
│   [ Skip ]            [ Continue ]  │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│   Personalization Questions         │
│   (1-3 questions max!)              │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│   Question 1:                       │
│   How will you split expenses?      │
│                                     │
│   🎒 With roommates                 │
│   ✈️  On trips                      │
│   👥 With groups                    │
│   💑 With partner                   │
│                                     │
│   (Each option = different flow)    │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│   Question 2 (Based on Q1):         │
│                                     │
│   If "Roommates" selected:          │
│   └─ "How many roommates?"          │
│      └─ Creates "Home" group        │
│                                     │
│   If "Trips" selected:              │
│   └─ "Planning a trip now?"         │
│      └─ Creates first trip          │
│                                     │
│   If "Groups" selected:             │
│   └─ "Name your first group"        │
│                                     │
│   If "Partner" selected:            │
│   └─ "Partner's name?"              │
│      └─ Creates couple group        │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│   Question 3:                       │
│   How often do you split?           │
│                                     │
│   📅 Daily (roommates)              │
│   📆 Weekly (regular groups)        │
│   🗓️  Monthly (occasional)          │
│   🎯 Only for trips                 │
│                                     │
│   (Sets reminder preferences)       │
└─────────────────────────────────────┘
         ↓
┌─────────────────────────────────────┐
│   [HOME SCREEN]                     │
│   - First group auto-created!       │
│   - Personalized tips               │
│   - Ready to use! ✅                │
└─────────────────────────────────────┘
```

---

## 📊 Question Logic (How It Works)

### Question 1: "How will you split expenses?"

| Answer | What Changes |
|--------|-------------|
| **🎒 Roommates** | • Creates "Home" group<br>• Shows utility/rent categories<br>• Sets daily reminders<br>• Suggests equal splits |
| **✈️ Trips** | • Creates trip template<br>• Shows travel categories<br>• Suggests date-based groups<br>• Enables location features |
| **👥 Groups** | • Creates generic group<br>• Shows all categories<br>• Flexible settings |
| **💑 Partner** | • Creates 2-person group<br>• Shows couple categories (dates, groceries)<br>• Simple 50/50 splits |

---

### Question 2: (Depends on Q1)

#### If "Roommates":
```
"How many roommates?"
→ 1-2: Simple 2-person split
→ 3-4: Medium group (common for students)
→ 5+: Large house (rent/utilities focus)

Auto-creates:
- Group name: "Home"
- Members: You + [X] placeholders
- Categories: Rent, Utilities, Groceries, Cleaning
```

#### If "Trips":
```
"Planning a trip now?"
→ Yes: Create trip group immediately
→ No: Show empty state with "Plan a Trip" CTA

If Yes, ask:
- "Where are you going?" (optional, just for fun)
- "With how many people?" 
```

#### If "Groups":
```
"Name your first group"
→ Free text input
→ Auto-creates group with that name
```

#### If "Partner":
```
"Partner's name?"
→ Creates 2-person group
→ Name: "You & [Partner]"
→ Categories: Dates, Groceries, Bills
```

---

### Question 3: "How often do you split?"

| Answer | What Changes |
|--------|-------------|
| **📅 Daily** | • Daily reminder: "Log today's expenses"<br>• Shows recent expenses first<br>• Quick-add shortcuts |
| **📆 Weekly** | • Weekly summary: "This week's total"<br>• Weekend reminder<br>• Group by week |
| **🗓️ Monthly** | • Monthly reminder: "Time to settle up"<br>• Shows monthly view<br>• Aggregate by month |
| **🎯 Only trips** | • No reminders (trip-based)<br>• Travel categories<br>• Date-range filters |

---

## 🎨 Screen Designs

### Screen 1: Initial Login Popup
```
┌─────────────────────────────────────┐
│                                     │
│         [FairPay Logo]              │
│                                     │
│   Split expenses with friends       │
│   Track IOUs · Settle up easily     │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  🔵 Continue with Google    │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  🍎 Continue with Apple     │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  📧 Use Email               │   │
│  └─────────────────────────────┘   │
│                                     │
│       [ Skip for now ]              │
│       Try locally first             │
└─────────────────────────────────────┘
```

---

### Screen 2: Profile Setup (After Login)
```
┌─────────────────────────────────────┐
│  ← Back                             │
│                                     │
│  Welcome, John! 👋                  │
│                                     │
│  Quick setup (1/2)                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                     │
│  Name                               │
│  ┌─────────────────────────────┐   │
│  │ John Doe                    │   │
│  └─────────────────────────────┘   │
│  ✓ From your Google account         │
│                                     │
│  Phone (optional)                   │
│  ┌─────────────────────────────┐   │
│  │ +91                         │   │
│  └─────────────────────────────┘   │
│  For payment reminders              │
│                                     │
│  Payment Method (India 🇮🇳)         │
│  ┌─────────────────────────────┐   │
│  │ UPI ID                      │   │
│  │ ┌─────────────────────────┐ │   │
│  │ │ john@paytm              │ │   │
│  │ └─────────────────────────┘ │   │
│  │ For receiving payments      │   │
│  └─────────────────────────────┘   │
│                                     │
│  [ Skip ]               [ Continue ]│
└─────────────────────────────────────┘
```

---

### Screen 3: Question 1
```
┌─────────────────────────────────────┐
│                                     │
│  Quick setup (2/2)                  │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                     │
│  How will you split expenses?       │
│  (We'll personalize your experience)│
│                                     │
│  ┌─────────────────────────────┐   │
│  │  🎒  With roommates          │   │
│  │  Rent, utilities, groceries  │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  ✈️   On trips               │   │
│  │  Travel, food, activities    │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  👥  With groups             │   │
│  │  Dinners, events, outings    │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  💑  With partner            │   │
│  │  Dates, bills, groceries     │   │
│  └─────────────────────────────┘   │
│                                     │
│  [ Skip ]                           │
└─────────────────────────────────────┘
```

---

### Screen 4: Question 2 (If "Roommates" selected)
```
┌─────────────────────────────────────┐
│  ← Back                             │
│                                     │
│  Perfect! Let's set up your home 🏠 │
│                                     │
│  How many roommates?                │
│  (Including you)                    │
│                                     │
│  ┌─────────────────────────────┐   │
│  │         2 people             │   │
│  │         ━━━━━━━━             │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │         3 people             │   │
│  │         ━━━━━━━━━━━━         │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │         4 people             │   │
│  │         ━━━━━━━━━━━━━━━━     │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │         5+ people            │   │
│  │         ━━━━━━━━━━━━━━━━━━━━ │   │
│  └─────────────────────────────┘   │
│                                     │
│  We'll create a "Home" group for    │
│  you with split-friendly categories │
│                                     │
│                      [ Continue ]   │
└─────────────────────────────────────┘
```

---

### Screen 5: Done! (Home with auto-created group)
```
┌─────────────────────────────────────┐
│  [FairPay Logo]        🔔  ⚙️        │
│                                     │
│  Good morning, John                 │
│  Your home expenses at a glance     │
│                                     │
│  🎉 Your "Home" group is ready!     │
│     Add your roommates to start     │
│                                     │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓   │
│  ┃ 🏠 Home                       ┃   │
│  ┃                               ┃   │
│  ┃ Total: ₹0                     ┃   │
│  ┃ 2 members · 0 expenses        ┃   │
│  ┃                               ┃   │
│  ┃ Quick actions:                ┃   │
│  ┃ • Add Roommate                ┃   │
│  ┃ • Log Rent                    ┃   │
│  ┃ • Add Expense                 ┃   │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛   │
│                                     │
│  💡 Tip: Tap "Add Roommate" to      │
│     invite your roommate!           │
│                                     │
│  [ + New Group ]                    │
└─────────────────────────────────────┘
```

---

## 💾 Data Storage (How Questions Affect App)

### After Onboarding, Store:
```typescript
{
  userId: "user-123",
  onboarding: {
    completed: true,
    useCase: "roommates",  // or "trips", "groups", "partner"
    frequency: "daily",     // or "weekly", "monthly", "trips-only"
    groupSize: 2,
    autoCreatedGroup: "group-456"
  },
  preferences: {
    // Based on answers:
    defaultCategories: ["Rent", "Utilities", "Groceries"],
    reminderFrequency: "daily",
    splitType: "equal",  // roommates usually split equally
    showTips: ["invite_roommates", "add_rent"]
  }
}
```

---

## 🎯 Benefits of This Flow

### 1. Skip Option = No Barrier
- Users can try app instantly
- No forced signup
- Local mode works immediately

### 2. Profile Setup = One-Time Only
- Collect essentials after login
- Payment info when relevant
- Pre-filled from OAuth (Google/Apple)

### 3. Questions = Personalization
- Different flow for each use case
- Auto-creates relevant groups
- Shows relevant tips/categories
- Sets up reminders automatically

### 4. Quick & Smart
- Total time: 30-60 seconds
- Only 2-3 questions max
- Each question has clear purpose
- Can skip each step

---

## 🔄 Complete User Journey

### Scenario A: User Skips
```
1. Open app
2. See login popup → Skip
3. Immediately at home screen
4. Can create groups locally
5. When they want to sync → Prompted to login
6. Login → Profile setup → Questions → Back to app
```

### Scenario B: User Logs In
```
1. Open app
2. See login popup → Continue with Google (5s)
3. Profile setup screen (name pre-filled from Google)
   - Add UPI ID (optional)
   - Add phone (optional)
   - Can skip this entire screen
4. Question 1: Use case (roommates/trips/groups/partner)
5. Question 2: Specific details (based on Q1)
6. Done! Home screen with auto-created group
```

**Time: 30-60 seconds total** ⚡

---

## 📊 Implementation Details

### Where Questions Are Different:

```typescript
// Question flow tree
const ONBOARDING_FLOWS = {
  roommates: {
    q1: "How many roommates?",
    q2: "How often do you split?",
    result: {
      createGroup: true,
      groupName: "Home",
      categories: ["Rent", "Utilities", "Groceries", "Cleaning"],
      splitType: "equal",
      reminders: true
    }
  },
  
  trips: {
    q1: "Planning a trip now?",
    q2: "How many people?",
    result: {
      createGroup: true,
      groupName: "Trip", // or user-entered
      categories: ["Transport", "Food", "Activities", "Accommodation"],
      splitType: "custom",
      reminders: false
    }
  },
  
  groups: {
    q1: "Name your first group",
    q2: "How often do you split?",
    result: {
      createGroup: true,
      groupName: "[user-entered]",
      categories: ["Food", "Entertainment", "Other"],
      splitType: "custom",
      reminders: true
    }
  },
  
  partner: {
    q1: "Partner's name?",
    q2: "How often do you split?",
    result: {
      createGroup: true,
      groupName: "You & [Partner]",
      categories: ["Dates", "Groceries", "Bills", "Gifts"],
      splitType: "equal",
      reminders: true
    }
  }
};
```

---

## ✅ Summary

**Your Flow:**
1. ✅ Login popup on app open (with Skip)
2. ✅ If Skip → Home (local mode)
3. ✅ If Login → Profile setup (name, UPI, phone)
4. ✅ Then → 2-3 personalization questions
5. ✅ Questions customize: groups, categories, reminders
6. ✅ Done → Home with auto-created group!

**How Questions Work:**
- Q1 determines use case (roommates/trips/groups/partner)
- Q2 is specific to Q1 answer
- Answers create appropriate group + settings
- Each user gets different experience!

**Time:** 30-60 seconds total
**Friction:** Very low (can skip everything)
**Result:** Personalized app ready to use!

---

**Ready to implement this flow?** 🚀

Let me know if you want me to start building it! 💪
