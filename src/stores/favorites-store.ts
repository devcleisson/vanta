"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type FavoritesState = {
  ids: string[];
  has: (id: string) => boolean;
  set: (ids: string[]) => void;
  toggle: (id: string) => boolean;
  clear: () => void;
};

export const useFavorites = create<FavoritesState>()(
  persist(
    (set, get) => ({
      ids: [],
      has: (id) => get().ids.includes(id),
      set: (ids) => set({ ids }),
      toggle: (id) => {
        const next = !get().ids.includes(id);
        set((s) => ({ ids: next ? [id, ...s.ids] : s.ids.filter((x) => x !== id) }));
        return next;
      },
      clear: () => set({ ids: [] }),
    }),
    { name: "vanta-favorites", version: 1, storage: createJSONStorage(() => localStorage) },
  ),
);
