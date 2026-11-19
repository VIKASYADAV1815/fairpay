import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { CurrencyCode } from '@/lib/currency';
import { DEFAULT_CURRENCY } from '@/lib/currency';
import type { PaymentMethod } from '@/lib/payments';
import { fromLegacyUpi } from '@/lib/payments';

/** Auth store with Supabase OAuth integration */
type AuthStore = {
  // Supabase auth
  user: {
    id: string;
    email: string;
    name?: string;
    phone?: string;
    avatar?: string;
    paymentMethods?: PaymentMethod[];
  } | null;
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
  showWelcomeModal: boolean;
  
  // Actions
  setShowWelcomeModal: (show: boolean) => void;
  setUser: (user: {
    id: string;
    email: string;
    name?: string;
    phone?: string;
    avatar?: string;
    paymentMethods?: PaymentMethod[];
  } | null) => void;
  setSession: (session: Session | null) => void;
  setOnboardingDone: (done: boolean) => void;
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
  updatePaymentMethods: (methods: PaymentMethod[]) => void;
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
      showWelcomeModal: false,
      setShowWelcomeModal: (show) => set({ showWelcomeModal: show }),
      
      // Set Supabase user
      setUser: (user) =>
        set((s) => {
          const upi =
            user?.paymentMethods?.find((p) => p.rail === 'upi')?.handle || s.upiId;
          const payMethods =
            user?.paymentMethods && user.paymentMethods.length > 0
              ? user.paymentMethods
              : s.paymentMethods;
          return {
            user,
            isLoggedIn: !!user,
            name: user?.name || s.name,
            email: user?.email || s.email,
            paymentMethods: payMethods,
            upiId: upi,
          };
        }),
      
      // Set Supabase session
      setSession: (session) => set({ session }),
      
      // Set onboarding done
      setOnboardingDone: (done) => set({ onboardingDone: done }),
      
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
          showWelcomeModal: false,
          onboardingDone: false,
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
          const updatedName = data.name?.trim() || s.name;
          const updatedEmail = data.email !== undefined ? data.email.trim() : s.email;
          const updatedUser = s.user
            ? {
                ...s.user,
                name: updatedName,
                email: updatedEmail,
                paymentMethods,
              }
            : null;
          return {
            user: updatedUser,
            name: updatedName,
            phone: data.phone !== undefined ? data.phone.trim() : s.phone,
            email: updatedEmail,
            preferredCurrency: data.preferredCurrency ?? s.preferredCurrency,
            upiId,
            paymentMethods,
          };
        }),
      
      updatePaymentMethods: (methods) => set({ paymentMethods: methods }),
    }),
    {
      name: 'fairpay-auth',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

// Listen to auth state changes
if (__DEV__) {
  const { isSupabaseConfigured } = require('@/lib/supabase');
  if (isSupabaseConfigured()) {
    supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event);
      const store = useAuthStore.getState();
      store.setSession(session);
      
      if (session?.user) {
        // Extract user info from OAuth metadata
        const metadata = session.user.user_metadata;
        store.setUser({
          id: session.user.id,
          email: session.user.email!,
          name: metadata?.full_name || metadata?.name || metadata?.preferred_username || 'User',
          avatar: metadata?.avatar_url || metadata?.picture,
        });
      } else {
        store.setUser(null);
      }
    });
  }
} else {
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event);
    const store = useAuthStore.getState();
    store.setSession(session);
    
    if (session?.user) {
      const metadata = session.user.user_metadata;
      store.setUser({
        id: session.user.id,
        email: session.user.email!,
        name: metadata?.full_name || metadata?.name || metadata?.preferred_username || 'User',
        avatar: metadata?.avatar_url || metadata?.picture,
      });
    } else {
      store.setUser(null);
    }
  });
}
