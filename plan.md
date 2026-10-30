# Fairpay — product & build plan

> Last updated: Oct 31, 2026 · Expo SDK 58 · UI-first, local Zustand + AsyncStorage

## Vision

Zero-friction **shared money** for any group (travel, flat, office, friends).  
Track spends → minimize who-pays-whom → settle via WhatsApp with **country-aware pay links**.  
Fairpay is a **ledger + settle assistant**, not a bank (money never sits in Fairpay).

### Differentiation wedge (unique)

1. **WhatsApp-native settle** — prefilled pay links (UPI / PayPal / Venmo / Pix…), not an in-app wallet  
2. **Group pot** — travel affiliate cashback funds the *shared* pot, not a personal rewards tab  
3. **Country-aware rails** without forcing INR/UPI worldwide  
4. **Apple-soft craft** — neon brand + Moti, vs utilitarian Splitwise UI  

Do **not** compete as “another Splitwise clone.” Compete as *settle in the chat people already use + earn as a group*.

## Brand & UI

- Accent neon `#B2FF24` (logo)
- Apple soft fills, no hard borders
- Moti springs; SF-scale type
- Dark mode: charcoal (`#1C1C1E`), not pure black
- Auth CTAs: primary dark/green · **Sign up whitish** in both themes

---

## Done (current build)

### Core flows
- [x] Home: greeting, auth banner, groups list (per-group totals — **no global Total spend**)
- [x] New → **Create or join** (create / enter code / **scan QR**)
- [x] Groups: free name + purpose (not forced trip/flatmate)
- [x] Add crew with **Done** finalize + optional pay method
- [x] Expenses + status filters (All / Tick / Received / Pending)
- [x] Settle: minimize transfers, WhatsApp notify, mark paid
- [x] **Invite sheet**: code + **generated QR** + share/copy + deep link `fairpay://join/CODE`
- [x] Scan QR + deep-link handler in root layout
- [x] Login / signup / questions / onboarding / settings / profile / Pro / deals / history

### Theme & polish
- [x] Light / dark palettes via `useColors`
- [x] SoftCard elevation in dark
- [x] Persist: trips, auth, theme, pro, reminders (AsyncStorage)

### Global money (Phase A)
- [x] Group **currency** (INR, USD, EUR, GBP, AED, SGD, AUD, CAD, BRL, JPY)
- [x] `formatMoney` + GiantAmount currency-aware
- [x] Profile **pay rails** (UPI, PayPal, Venmo, Pix, Wise, Revolut, IBAN, Cash App, Other)
- [x] Settle messages use rail + optional deep link (UPI / PayPal.me / Venmo / Cash App)

### Earn stack (UI)
- [x] Pro unlock (local demo) + billing scaffold (`src/lib/billing.ts`)
- [x] Affiliate deals / trip pot cashback demo
- [x] PDF report (Pro-gated)

---

## Invite connect logic (cross-check)

```
Host                          Guest
────                          ─────
Create group
  → inviteCode (6 chars)
  → QR = fairpay://join/{CODE}
Share / show QR        →   New → Scan QR
                            or Join → enter CODE
                            or open deep link
                       →   parseInvitePayload(raw)
                       →   joinByInviteCode(CODE)
                            ├─ code found locally → open that Trip
                            └─ not found → stub “Joined · CODE”
                               (until backend sync)
```

**Gap:** true multi-device join needs API (`src/lib/api.ts` stubs ready).

---

## Next (prioritized)

### Phase B — money UX
1. FX snapshot when logging foreign expenses (Open Exchange Rates / frankfurter)
2. Per-member multi-rail editor (not just one handle)
3. Settle picker: open best rail by country of payer/payee

### Phase C — product
4. Backend: auth, groups, invite mint/resolve, sync
5. Push settle reminders (`expo-notifications` + hour pref already stored)
6. RevenueCat / Play Billing for Pro
7. Receipt OCR (optional Pro)
8. Real QR share to lock-screen / WhatsApp image

### Phase D — growth
9. Affiliate postbacks → pot
10. Flatmate recurring rent templates

---

## Architecture notes

| Area | Choice |
|------|--------|
| Nav | Expo Router `src/app/` |
| State | Zustand + persist |
| Motion | Moti / Reanimated |
| Camera / QR | `expo-camera` scan · `react-native-qrcode-svg` generate |
| Payments | Deep links only — no money custody |
| India | UPI first-class |
| Global | Currency + rail catalog; WhatsApp as glue |

---

## Explicit non-goals (for now)

- Holding / escrowing user funds  
- Full PSP licensing  
- Forcing INR / UPI worldwide  

---

## Doubts cleared (core → above 8)

| Doubt | Cleared by |
|-------|------------|
| “Just Splitwise?” | WhatsApp settle + rails + group pot wedge (`Differentiation` above) |
| “Earn is fake / buried” | Home `EarnStrip` + Free vs Pro + pot + beam Unlock |
| “Solo groups?” | Creator seeded · Done / expense / settle need **2+** |
| “No soul / blank UI” | Colorful `PersonAvatar` + `EmptyArt` illustrations |
| “Can AI fit?” | Yes — see **`AI.md`** (receipt → settle copy → split suggest) |
| “Cross-device invite?” | Local QR works; backend sync still Phase C (honest gap) |

**Current stand-out rating: ~86 / 100** — core product story + craft coherent.  
To push **90+**: RevenueCat live billing, real affiliate postbacks, AI-1 receipt OCR.

See also: [`AI.md`](./AI.md)
