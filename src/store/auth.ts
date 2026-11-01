import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { CurrencyCode } from '@/lib/currency';
import { DEFAULT_CURRENCY } from '@/lib/currency';
import type { PaymentMethod } from '@/lib/payments';
import { fromLegacyUpi } from '@/lib/payments';

/** Auth store with Supabase integration */
type AuthStore = {
  // Supabase auth
  user: User | null;
  session: Session | null;
  isLoggedIn: boolean;
  
  // User profile (from database)
  name: string;
  email: string;
  phone: string;
  
  // Legacy fields (keep for compatibility)
  /** @deprecated prefer paymentMethods */
  upiId: string;
  preferredCurrency: CurrencyCode;
  paymentMethods: PaymentMethod[];
  onboardingDone: boolean;
  questionsDone: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  login: (email: string, name?: string) => void;
  signup: (name: string, email: string) => void;
  logout: () => Promise<void>;
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
      // Supabase auth state
      user: null,
      session: null,
      isLoggedIn: false,
      
      // User profile
      name: 'Vikas', // Default for dev
      email: '',
      phone: '',
      upiId: '',
      preferredCurrency: DEFAULT_CURRENCY,
      paymentMethods: [],
      onboardingDone: false,
      questionsDone: false,
      
      // Set Supabase user
      setUser: (user) => set({ 
        user,
        isLoggedIn: !!user,
        phone: user?.phone || '',
      }),
      
      // Set Supabase session
      setSession: (session) => set({ session }),
      
      // Legacy login (keep for compatibility)
      login: (email, name) =>
        set({
          isLoggedIn: true,
          email,
          name: name || email.split('@')[0] || 'Friend',
        }),
      
      // Legacy signup (keep for compatibility)
      signup: (name, email) =>
        set({
          isLoggedIn: true,
          name: name.trim() || 'Friend',
          email: email.trim(),
        }),
      
      // Supabase logout
      logout: async () => {
        await supabase.auth.signOut();
        set({ 
          user: null,
          session: null,
          isLoggedIn: false,
          email: '',
          phone: '',
        });
      },
      
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

// Listen to auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth state changed:', event);
  useAuthStore.getState().setSession(session);
  useAuthStore.getState().setUser(session?.user || null);
});
