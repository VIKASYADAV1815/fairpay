import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Expense, ExpenseSplit } from '@/store/trips';

export const PAYMENT_REMINDER_PRESETS = [6, 12, 24, 48, 72] as const;

type RemindersStore = {
  enabled: boolean;
  hour: number; // 0–23 local
  
  // Payment reminder settings
  paymentRemindersEnabled: boolean;
  paymentReminderHours: number; // How many hours after expense creation to remind (0 = disabled)
  dismissedExpenseNudgeIds: string[]; // Track dismissed expense nudges
  
  setEnabled: (v: boolean) => void;
  setHour: (h: number) => void;
  setPaymentRemindersEnabled: (v: boolean) => void;
  setPaymentReminderHours: (h: number) => void;
  dismissNudge: (expenseId: string) => void;
  resetDismissedNudges: () => void;
};

export const useRemindersStore = create<RemindersStore>()(
  persist(
    (set) => ({
      enabled: true,
      hour: 20,
      
      // Default: remind after 24 hours
      paymentRemindersEnabled: true,
      paymentReminderHours: 24,
      dismissedExpenseNudgeIds: [],
      
      setEnabled: (v) => set({ enabled: v }),
      setHour: (h) => set({ hour: Math.min(23, Math.max(0, h)) }),
      setPaymentRemindersEnabled: (v) => set({ paymentRemindersEnabled: v }),
      setPaymentReminderHours: (h) => set({ paymentReminderHours: Math.max(0, h) }),
      dismissNudge: (expenseId: string) =>
        set((s) => ({
          dismissedExpenseNudgeIds: s.dismissedExpenseNudgeIds.includes(expenseId)
            ? s.dismissedExpenseNudgeIds
            : [...s.dismissedExpenseNudgeIds, expenseId],
        })),
      resetDismissedNudges: () => set({ dismissedExpenseNudgeIds: [] }),
    }),
    {
      name: 'fairpay-reminders',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export function reminderLabel(hour: number) {
  const h12 = hour % 12 || 12;
  const ampm = hour < 12 ? 'AM' : 'PM';
  return `${h12}:00 ${ampm}`;
}

export function paymentReminderLabel(hours: number): string {
  if (hours <= 0) return 'Disabled';
  if (hours === 1) return 'After 1 hour';
  if (hours < 24) return `After ${hours} hours`;
  if (hours === 24) return 'After 24 hours';
  if (hours === 48) return 'After 2 days';
  if (hours === 72) return 'After 3 days';
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  if (remHours === 0) return `After ${days} day${days > 1 ? 's' : ''}`;
  return `After ${days}d ${remHours}h`;
}

export type OverdueExpenseItem = {
  expense: Expense;
  unpaidSplits: ExpenseSplit[];
  hoursAgo: number;
  totalUnpaidAmount: number;
};

/**
 * Filter expenses that have unpaid members and are older than reminderHours
 */
export function getOverdueExpenses(
  expenses: Expense[],
  reminderHours: number,
  dismissedIds: string[] = [],
  currentUserId?: string,
): OverdueExpenseItem[] {
  if (reminderHours <= 0) return [];

  const now = Date.now();
  const thresholdMs = reminderHours * 60 * 60 * 1000;
  const overdue: OverdueExpenseItem[] = [];

  for (const exp of expenses) {
    if (dismissedIds.includes(exp.id)) continue;
    
    // Only remind if the user is the payer (or payer not specified)
    if (currentUserId && exp.paidById && exp.paidById !== currentUserId) {
      continue;
    }

    const createdTime = new Date(exp.createdAt).getTime();
    const elapsed = now - createdTime;

    if (elapsed >= thresholdMs) {
      const unpaidSplits = (exp.splits || []).filter(
        (s) => !s.isPaid && s.memberId !== exp.paidById,
      );

      if (unpaidSplits.length > 0) {
        const totalUnpaidAmount = unpaidSplits.reduce((acc, s) => acc + (s.amount || 0), 0);
        overdue.push({
          expense: exp,
          unpaidSplits,
          hoursAgo: Math.floor(elapsed / (60 * 60 * 1000)),
          totalUnpaidAmount,
        });
      }
    }
  }

  return overdue;
}
