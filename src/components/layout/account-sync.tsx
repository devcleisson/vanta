"use client";

import { useEffect, useRef } from "react";
import { syncCartAction } from "@/server/actions/cart";
import { syncFavoritesAction } from "@/server/actions/favorites";
import { useCart } from "@/stores/cart-store";
import { useFavorites } from "@/stores/favorites-store";

/**
 * Bridges device storage and the account:
 *  - on sign-in, merges the guest cart/favourites into the account and pulls saved ones;
 *  - while signed in, saves cart changes to the database (debounced);
 *  - on sign-out, clears this device so the next person starts fresh.
 */
export function AccountSync({ userId }: { userId: string | null }) {
  const previous = useRef<string | null | undefined>(undefined);
  const ready = useRef(false);

  useEffect(() => {
    const prev = previous.current;
    previous.current = userId;

    const run = async () => {
      // Wait for zustand to rehydrate from localStorage before merging.
      await Promise.all([useCart.persist.rehydrate(), useFavorites.persist.rehydrate()]);
      if (userId && prev !== userId) {
        ready.current = false;
        const [cart, favs] = await Promise.all([
          syncCartAction(useCart.getState().items, "merge"),
          syncFavoritesAction(useFavorites.getState().ids),
        ]);
        if (cart) useCart.getState().setItems(cart);
        if (favs) useFavorites.getState().set(favs);
        ready.current = true;
      } else if (!userId && prev) {
        ready.current = false;
        useCart.getState().clear();
        useFavorites.getState().clear();
      }
    };
    run().catch(() => {
      ready.current = Boolean(userId);
    });
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsub = useCart.subscribe((state, prevState) => {
      if (!ready.current || state.items === prevState.items) return;
      clearTimeout(timer);
      timer = setTimeout(() => {
        syncCartAction(useCart.getState().items, "replace").catch(() => {});
      }, 800);
    });
    return () => {
      unsub();
      clearTimeout(timer);
    };
  }, [userId]);

  return null;
}
