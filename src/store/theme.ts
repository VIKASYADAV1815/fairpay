import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { dark, light, type Palette } from '@/theme/palettes';

type ThemeStore = {
  darkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (v: boolean) => void;
  colors: Palette;
};

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      darkMode: false,
      colors: light,
      toggleDarkMode: () => {
        const next = !get().darkMode;
        set({ darkMode: next, colors: next ? dark : light });
      },
      setDarkMode: (v) => set({ darkMode: v, colors: v ? dark : light }),
    }),
    {
      name: 'fairpay-theme',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ darkMode: s.darkMode }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<ThemeStore>;
        const darkMode = !!p.darkMode;
        return {
          ...current,
          ...p,
          darkMode,
          colors: darkMode ? dark : light,
        };
      },
    },
  ),
);

export function useColors() {
  return useThemeStore((s) => s.colors);
}
