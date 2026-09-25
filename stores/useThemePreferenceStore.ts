import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemeMode = 'dark' | 'light';

type ThemePreferenceState = {
  mode: ThemeMode;
  toggleMode: () => void;
};

export const useThemePreferenceStore = create<ThemePreferenceState>()(
  persist(
    (set) => ({
      mode: 'dark',
      toggleMode: () =>
        set((state) => ({ mode: state.mode === 'dark' ? 'light' : 'dark' })),
    }),
    {
      name: 'swimcity-theme',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ mode: state.mode }),
    },
  ),
);
