import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CurrencyCode } from '@/lib/currency';
import { DEFAULT_CURRENCY } from '@/lib/currency';
import type { PaymentMethod } from '@/lib/payments';
import { fromLegacyUpi } from '@/lib/payments';

/** UI auth — persist locally; swap to backend session later */
type AuthStore = {
  isLoggedIn: boolean;
  name: string;
  email: string;
  /** @deprecated prefer paymentMethods */
  upiId: string;
  phone: string;
  preferredCurrency: CurrencyCode;
  paymentMethods: PaymentMethod[];
  onboardingDone: boolean;
  questionsDone: boolean;
  login: (email: string, name?: string) => void;
  signup: (name: string, email: string) => void;
  logout: () => void;
  completeOnboarding: () => void;
  completeQuestions: () => void;
  updateProfile: (data: {
    name?: string;
    upiId?: string;
    phone?: string;
    email?: string;
    preferredCurrency?: CurrencyCode;
    paymentMethods?: PaymentMethod[];
  }) => void;
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      name: 'Vikas',
      email: '',
      upiId: '',
      phone: '',
      preferredCurrency: DEFAULT_CURRENCY,
      paymentMethods: [],
      onboardingDone: false,
      questionsDone: false,
      login: (email, name) =>
        set({
          isLoggedIn: true,
          email,
          name: name || email.split('@')[0] || 'Friend',
        }),
      signup: (name, email) =>
        set({
          isLoggedIn: true,
          name: name.trim() || 'Friend',
          email: email.trim(),
        }),
      logout: () => set({ isLoggedIn: false, email: '' }),
      completeOnboarding: () => set({ onboardingDone: true }),
      completeQuestions: () => set({ questionsDone: true }),
      updateProfile: (data) =>
        set((s) => {
          let paymentMethods = s.paymentMethods;
          let upiId = s.upiId;
          if (data.paymentMethods !== undefined) {
            paymentMethods = data.paymentMethods;
            upiId = data.paymentMethods.find((p) => p.rail === 'upi')?.handle ?? '';
          } else if (data.upiId !== undefined) {
            upiId = data.upiId.trim();
            paymentMethods = fromLegacyUpi(upiId);
          }
          return {
            name: data.name?.trim() || s.name,
            phone: data.phone !== undefined ? data.phone.trim() : s.phone,
            email: data.email !== undefined ? data.email.trim() : s.email,
            preferredCurrency: data.preferredCurrency ?? s.preferredCurrency,
            upiId,
            paymentMethods,
          };
        }),
    }),
    {
      name: 'fairpay-auth',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
