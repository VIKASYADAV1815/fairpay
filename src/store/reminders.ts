import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Local reminder prefs — wire expo-notifications schedule later */
type RemindersStore = {
  enabled: boolean;
  hour: number; // 0–23 local
  
  // Payment reminder settings
  paymentRemindersEnabled: boolean;
  paymentReminderHours: number; // How many hours after expense creation to remind (0 = disabled)
  
  setEnabled: (v: boolean) => void;
  setHour: (h: number) => void;
  setPaymentRemindersEnabled: (v: boolean) => void;
  setPaymentReminderHours: (h: number) => void;
};

export const useRemindersStore = create<RemindersStore>()(
  persist(
    (set) => ({
      enabled: true,
      hour: 20,
      
      // Default: remind after 24 hours
      paymentRemindersEnabled: true,
      paymentReminderHours: 24,
      
      setEnabled: (v) => set({ enabled: v }),
      setHour: (h) => set({ hour: Math.min(23, Math.max(0, h)) }),
      setPaymentRemindersEnabled: (v) => set({ paymentRemindersEnabled: v }),
      setPaymentReminderHours: (h) => set({ paymentReminderHours: h }),
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
  if (hours === 0) return 'Disabled';
  if (hours === 24) return 'After 24 hours';
  if (hours === 48) return 'After 2 days';
  if (hours === 72) return 'After 3 days';
  if (hours < 24) return `After ${hours} hours`;
  const days = Math.floor(hours / 24);
  return `After ${days} day${days > 1 ? 's' : ''}`;
}
