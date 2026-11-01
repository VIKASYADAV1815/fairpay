import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type PaymentConfirmation = {
  id: string;
  tripId: string;
  expenseId: string;
  memberId: string;
  memberName: string;
  amount: number;
  expenseTitle: string;
  markedAt: string;
  seen: boolean;
};

type NotificationStore = {
  pendingConfirmations: PaymentConfirmation[];
  
  addConfirmation: (data: Omit<PaymentConfirmation, 'id' | 'markedAt' | 'seen'>) => void;
  removeConfirmation: (id: string) => void;
  markSeen: (id: string) => void;
  clearForExpense: (tripId: string, expenseId: string) => void;
  getUnseenCount: () => number;
  getForTrip: (tripId: string) => PaymentConfirmation[];
};

const uid = () => `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      pendingConfirmations: [],

      addConfirmation: (data) => {
        const notification: PaymentConfirmation = {
          ...data,
          id: uid(),
          markedAt: new Date().toISOString(),
          seen: false,
        };
        set((state) => ({
          pendingConfirmations: [notification, ...state.pendingConfirmations],
        }));
      },

      removeConfirmation: (id) => {
        set((state) => ({
          pendingConfirmations: state.pendingConfirmations.filter((n) => n.id !== id),
        }));
      },

      markSeen: (id) => {
        set((state) => ({
          pendingConfirmations: state.pendingConfirmations.map((n) =>
            n.id === id ? { ...n, seen: true } : n,
          ),
        }));
      },

      clearForExpense: (tripId, expenseId) => {
        set((state) => ({
          pendingConfirmations: state.pendingConfirmations.filter(
            (n) => !(n.tripId === tripId && n.expenseId === expenseId),
          ),
        }));
      },

      getUnseenCount: () => {
        return get().pendingConfirmations.filter((n) => !n.seen).length;
      },

      getForTrip: (tripId) => {
        return get().pendingConfirmations.filter((n) => n.tripId === tripId);
      },
    }),
    {
      name: 'fairpay-notifications',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ pendingConfirmations: state.pendingConfirmations }),
    },
  ),
);
