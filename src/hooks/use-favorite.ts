"use client";

import { toast } from "sonner";
import { toggleFavoriteAction } from "@/server/actions/favorites";
import { useFavorites } from "@/stores/favorites-store";
import { useHydrated } from "./use-hydrated";

export function useFavorite(productId: string, productName?: string) {
  const hydrated = useHydrated();
  const active = useFavorites((s) => s.ids.includes(productId));
  const toggleLocal = useFavorites((s) => s.toggle);

  const toggle = async () => {
    const next = toggleLocal(productId);
    toast(next ? "Adicionado aos favoritos" : "Removido dos favoritos", {
      description: productName,
      action: next ? { label: "Ver favoritos", onClick: () => (window.location.href = "/favorites") } : undefined,
    });
    try {
      await toggleFavoriteAction(productId, next);
    } catch {
      // Stays saved on this device; it syncs again on the next sign-in.
    }
  };

  return { active: hydrated && active, toggle };
}
