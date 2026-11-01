# Fairpay

Zero-friction shared money for any group. Track spends, settle on WhatsApp with country-aware pay links, earn into a group pot.

**Status:** 🎨 Frontend 95% complete | 🚧 Backend ready to build

---

## 📊 Project Status

### ✅ Completed (Frontend - 95% UX Quality)
- Beautiful, polished UI with professional design
- Expense tracking with status badges & timestamps
- Search & filter (by name, person, payment status)
- Date grouping (Today, Yesterday, This Week, Earlier)
- Member management (add, edit, remove with validation)
- Pull-to-refresh on all lists
- Empty states with helpful examples
- WhatsApp deep links for notifications
- Local storage (Zustand + AsyncStorage)

### 🚧 In Progress (Backend)
- Supabase setup ready
- Database schema designed (PostgreSQL)
- Authentication flow pending (phone OTP)
- Cloud sync pending
- Real-time updates pending
- Push notifications pending

**⏱️ Estimated time to production: 2-3 days**

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 20.x or higher
- Expo CLI
- iOS Simulator or Android Emulator (or physical device with Expo Go)

### Installation

```bash
# Install dependencies
npm install

# Start dev server
npx expo start
```

### Run on Device
- **iOS:** Press `i` in terminal or scan QR with Camera app
- **Android:** Press `a` in terminal or scan QR with Expo Go app
- **Web:** Press `w` in terminal (limited functionality)

---

## 📂 Project Structure

```
fairpay/
├── src/
│   ├── app/              # Expo Router screens
│   │   ├── index.tsx     # Home screen
│   │   ├── trip/[id].tsx # Trip detail screen
│   │   ├── people/[id].tsx # Member management
│   │   └── settle/[id].tsx # Settlement screen
│   ├── components/       # Reusable UI components
│   │   ├── ExpenseStatusBadge.tsx
│   │   ├── ExpenseFilters.tsx
│   │   ├── EditMemberSheet.tsx
│   │   └── EmptyState.tsx
│   ├── store/           # Zustand state management
│   │   ├── trips.ts     # Groups & expenses
│   │   ├── auth.ts      # Authentication (local)
│   │   └── notifications.ts # Payment notifications
│   ├── lib/             # Utilities
│   │   ├── supabase.ts  # Supabase client (NEW)
│   │   ├── settle.ts    # Balance calculations
│   │   ├── payments.ts  # UPI/payment handling
│   │   └── time.ts      # Date formatting & grouping
│   └── theme/           # Design tokens
├── assets/              # Images, fonts
├── BACKEND-SETUP.md     # 🔥 Backend setup guide
├── NEXT-STEPS.md        # 🔥 Action items
└── README-BACKEND.md    # 🔥 Backend overview
```

---

## 🎯 Next Steps (Build Backend)

### Phase 1: Setup Supabase (YOU DO THIS - 15 min)
1. Create account at https://supabase.com
2. Create new project: "fairpay-production"
3. Run SQL schema from `BACKEND-SETUP.md`
4. Get API keys (Settings → API)
5. Create `.env` file with keys

**See `README-BACKEND.md` for detailed guide!**

### Phase 2: Authentication (3-4 hours)
- Phone OTP login screen
- User account creation
- Session management
- Protected routes

### Phase 3: Cloud Storage (5-6 hours)
- Migrate Zustand → Supabase queries
- Real-time subscriptions
- Optimistic UI updates
- Offline support

### Phase 4: Real-time Features (2-3 hours)
- Push notifications
- Live expense updates
- Multi-device sync

### Phase 5: Testing & Deploy (2-3 hours)
- Multi-device testing
- Bug fixes
- App Store submission

**Total: 2-3 days to production** 🚀

---

## Stack

- **Framework:** Expo SDK 58 · Expo Router · React Native
- **State:** Zustand + AsyncStorage (migrating to Supabase)
- **Backend:** Supabase (PostgreSQL + Auth + Real-time)
- **Animations:** Moti / Reanimated
- **UI:** Custom components with native feel

---

## 📚 Documentation

### Getting Started
- [`README-BACKEND.md`](./README-BACKEND.md) — **START HERE for backend!** 🔥
- [`NEXT-STEPS.md`](./NEXT-STEPS.md) — Step-by-step action items
- [`BACKEND-SETUP.md`](./BACKEND-SETUP.md) — Database schema + setup

### Design & Planning
- [`plan.md`](./plan.md) — Product & build plan  
- [`AI.md`](./AI.md) — Where AI fits  
- [`AGENTS.md`](./AGENTS.md) — Agent / Expo conventions
- [`UX-IMPROVEMENTS.md`](./UX-IMPROVEMENTS.md) — UX roadmap (89% → 95%)

### Achievements
- [`ACHIEVEMENT-SUMMARY.md`](./ACHIEVEMENT-SUMMARY.md) — Frontend completion summary

---

## 🎨 Features

### Current (Local-Only)
✅ Create groups for any occasion  
✅ Add members with UPI/payment details  
✅ Track expenses with per-person splits  
✅ Payment status tracking (paid/unpaid/partial)  
✅ Search & filter expenses  
✅ Date grouping for easy scanning  
✅ Settlement calculations  
✅ WhatsApp deep links for reminders  
✅ Pull-to-refresh  
✅ Dark mode support  

### Coming Soon (Backend Required)
🚧 Phone authentication (OTP)  
🚧 Multi-device sync  
🚧 Real-time updates  
🚧 Push notifications  
🚧 Cloud backup  
🚧 Invite by phone number  

---

## 🛠️ Development

### Run Development Server
```bash
npx expo start
```

### Typecheck
```bash
npx tsc --noEmit
```

### Clear Cache
```bash
npx expo start --clear
```

### Update Dependencies
```bash
npx expo install --check
npx expo install --fix
```

---

## 🚀 Deployment (Coming Soon)

Once backend is built:

### iOS (App Store)
```bash
bunx eas-cli build --platform ios
bunx eas-cli submit --platform ios
```

### Android (Play Store)
```bash
bunx eas-cli build --platform android
bunx eas-cli submit --platform android
```

---

## 🤝 Contributing

This is a private project. If you're the owner:

1. **Setup Supabase first** (see `README-BACKEND.md`)
2. Build authentication screens
3. Migrate store to Supabase
4. Test multi-device sync
5. Deploy!

---

## 📄 License

Private project - All rights reserved

---

## 🆘 Need Help?

### Frontend Issues
- Check `UX-IMPROVEMENTS.md` for completed features
- All core UI features are working locally

### Backend Setup
- **START HERE:** `README-BACKEND.md`
- Follow `NEXT-STEPS.md` step-by-step
- Database schema: `BACKEND-SETUP.md`

### Questions?
Open an issue or contact the team!

---

**Ready to build the backend? Start with `README-BACKEND.md`! 🔥**
