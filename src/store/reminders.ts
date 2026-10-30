import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Local reminder prefs — wire expo-notifications schedule later */
type RemindersStore = {
  enabled: boolean;
  hour: number; // 0–23 local
  setEnabled: (v: boolean) => void;
  setHour: (h: number) => void;
};

export const useRemindersStore = create<RemindersStore>()(
  persist(
    (set) => ({
      enabled: true,
      hour: 20,
      setEnabled: (v) => set({ enabled: v }),
      setHour: (h) => set({ hour: Math.min(23, Math.max(0, h)) }),
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
