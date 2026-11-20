"use server";

import { z } from "zod";
import { getCurrentUser } from "@/server/auth/session";
import { getProductsByIds } from "@/server/services/catalog";
import { listFavoriteIds, mergeFavorites, setFavorite } from "@/server/services/favorites";

export async function toggleFavoriteAction(productId: string, favorite: boolean) {
  const user = await getCurrentUser();
  if (!user) return { persisted: false };
  if (!z.string().uuid().safeParse(productId).success) return { persisted: false };
  await setFavorite(user.id, productId, favorite);
  return { persisted: true };
}

export async function syncFavoritesAction(localIds: string[]) {
  const user = await getCurrentUser();
  if (!user) return null;
  return mergeFavorites(user.id, Array.isArray(localIds) ? localIds : []);
}

export async function getFavoriteIdsAction() {
  const user = await getCurrentUser();
  if (!user) return null;
  return listFavoriteIds(user.id);
}

export async function getProductsByIdsAction(ids: string[]) {
  return getProductsByIds(Array.isArray(ids) ? ids : []);
}
