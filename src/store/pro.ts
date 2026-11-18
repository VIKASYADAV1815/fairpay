import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Fairpay Monetization Engine:
 * - Trip Pass: ₹49 one-time micro-pass for single trip/group
 * - Fairpay Pro: ₹399/year unlimited for all trips + AI line-item split + GST exports
 */
type ProStore = {
  isPro: boolean;
  unlockedTripIds: string[];
  unlockPro: () => void;
  resetPro: () => void;
  unlockTrip: (tripId: string) => void;
  isTripUnlocked: (tripId?: string) => boolean;
};

export const TRIP_PASS_PRICE_LABEL = '₹49 / trip';
export const PRO_PRICE_LABEL = '₹399 / year';

export const TRIP_PASS_FEATURES = [
  'Unlimited branded PDF reports for this trip',
  'WhatsApp batch settle (notify all unpaid friends in 1-tap)',
  'AI receipt scanner for group cafe/restaurant bills',
  'Automated WhatsApp payment reminders',
] as const;

export const PRO_FEATURES = [
  'All Trip Pass features across UNLIMITED trips',
  'AI receipt scan → line-item split per friend',
  'Corporate GST / reimbursement invoice PDF generator',
  'Cashback tracking directly into group pots',
  'Priority custom WhatsApp message templates',
] as const;

export const useProStore = create<ProStore>()(
  persist(
    (set, get) => ({
      isPro: false,
      unlockedTripIds: [],
      unlockPro: () => set({ isPro: true }),
      resetPro: () => set({ isPro: false, unlockedTripIds: [] }),
      unlockTrip: (tripId: string) =>
        set((s) => ({
          unlockedTripIds: s.unlockedTripIds.includes(tripId)
            ? s.unlockedTripIds
            : [...s.unlockedTripIds, tripId],
        })),
      isTripUnlocked: (tripId?: string) => {
        if (get().isPro) return true;
        if (!tripId) return false;
        return get().unlockedTripIds.includes(tripId);
      },
    }),
    {
      name: 'fairpay-pro',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
