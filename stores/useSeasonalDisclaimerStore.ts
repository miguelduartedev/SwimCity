import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type SeasonalDisclaimerState = {
  dismissedOffSeasonDisclaimerFor?: string;
  hasHydrated: boolean;
  dismissFor: (offSeasonId: string) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
};

export const useSeasonalDisclaimerStore = create<SeasonalDisclaimerState>()(
  persist(
    (set) => ({
      dismissedOffSeasonDisclaimerFor: undefined,
      hasHydrated: false,
      dismissFor: (offSeasonId) =>
        set({ dismissedOffSeasonDisclaimerFor: offSeasonId }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: 'swimcity-seasonal-disclaimer',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        dismissedOffSeasonDisclaimerFor:
          state.dismissedOffSeasonDisclaimerFor,
      }),
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    },
  ),
);
