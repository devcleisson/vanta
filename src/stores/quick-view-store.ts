"use client";

import { create } from "zustand";

export const useQuickView = create<{ slug: string | null; show: (slug: string) => void; hide: () => void }>((set) => ({
  slug: null,
  show: (slug) => set({ slug }),
  hide: () => set({ slug: null }),
}));
