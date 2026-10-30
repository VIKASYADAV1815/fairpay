import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Fairpay Pro — local unlock for UI.
 * Next: RevenueCat / Play Billing (see src/lib/billing.ts).
 */
type ProStore = {
  isPro: boolean;
  unlockPro: () => void;
  resetPro: () => void;
};

export const PRO_PRICE_LABEL = '₹399 / year';
export const PRO_FEATURES = [
  'Unlimited trip PDF reports',
  'WhatsApp settle batch (all debts in one go)',
  'Affiliate cashback tracking into group pot',
  'AI receipt scan → expense (roadmap · see AI.md)',
  'Flatmate recurring rent reminders',
] as const;

export const useProStore = create<ProStore>()(
  persist(
    (set) => ({
      isPro: false,
      unlockPro: () => set({ isPro: true }),
      resetPro: () => set({ isPro: false }),
    }),
    {
      name: 'fairpay-pro',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
