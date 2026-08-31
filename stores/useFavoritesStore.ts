import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type FavoritesState = { favoriteIds: string[]; toggleFavorite: (id: string) => void; isFavorite: (id: string) => boolean };
export const useFavoritesStore = create<FavoritesState>()(persist((set, get) => ({
  favoriteIds: [],
  toggleFavorite: (id) => set((state) => ({ favoriteIds: state.favoriteIds.includes(id) ? state.favoriteIds.filter((item) => item !== id) : [...state.favoriteIds, id] })),
  isFavorite: (id) => get().favoriteIds.includes(id),
}), { name: 'swimcity-favorites', storage: createJSONStorage(() => AsyncStorage) }));
