"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { siteConfig } from "@/config/site";
import type { CartItemInput } from "@/types/cart";

/**
 * Device cart. Stores only variant ids and quantities — never prices.
 * Prices/stock are always resolved by the server (`quoteCartAction`).
 */
type CartState = {
  items: CartItemInput[];
  couponCode: string | null;
  cep: string | null;
  shippingMethod: string | null;
  isOpen: boolean;
  /** Bumped whenever an item is added, to trigger header feedback. */
  lastAddedAt: number;
  add: (variantId: string, quantity?: number) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  replaceVariant: (from: string, to: string) => void;
  remove: (variantId: string) => void;
  setItems: (items: CartItemInput[]) => void;
  clear: () => void;
  setCoupon: (code: string | null) => void;
  setCep: (cep: string | null) => void;
  setShippingMethod: (id: string | null) => void;
  open: () => void;
  close: () => void;
  setOpen: (open: boolean) => void;
};

const cap = (n: number) => Math.max(1, Math.min(Math.floor(n), siteConfig.maxQuantityPerItem));

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      couponCode: null,
      cep: null,
      shippingMethod: null,
      isOpen: false,
      lastAddedAt: 0,
      add: (variantId, quantity = 1) =>
        set((s) => {
          const existing = s.items.find((i) => i.variantId === variantId);
          const items = existing
            ? s.items.map((i) => (i.variantId === variantId ? { ...i, quantity: cap(i.quantity + quantity) } : i))
            : [...s.items, { variantId, quantity: cap(quantity) }];
          return { items, lastAddedAt: Date.now() };
        }),
      setQuantity: (variantId, quantity) =>
        set((s) => ({
          items:
            quantity <= 0
              ? s.items.filter((i) => i.variantId !== variantId)
              : s.items.map((i) => (i.variantId === variantId ? { ...i, quantity: cap(quantity) } : i)),
        })),
      replaceVariant: (from, to) =>
        set((s) => {
          if (from === to) return s;
          const source = s.items.find((i) => i.variantId === from);
          if (!source) return s;
          const target = s.items.find((i) => i.variantId === to);
          const rest = s.items.filter((i) => i.variantId !== from && i.variantId !== to);
          return { items: [...rest, { variantId: to, quantity: cap(source.quantity + (target?.quantity ?? 0)) }] };
        }),
      remove: (variantId) => set((s) => ({ items: s.items.filter((i) => i.variantId !== variantId) })),
      setItems: (items) => set({ items }),
      clear: () => set({ items: [], couponCode: null }),
      setCoupon: (couponCode) => set({ couponCode }),
      setCep: (cep) => set({ cep }),
      setShippingMethod: (shippingMethod) => set({ shippingMethod }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      setOpen: (isOpen) => set({ isOpen }),
    }),
    {
      name: "vanta-cart",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ items: s.items, couponCode: s.couponCode, cep: s.cep, shippingMethod: s.shippingMethod }),
    },
  ),
);

export const selectCartCount = (s: CartState) => s.items.reduce((n, i) => n + i.quantity, 0);
