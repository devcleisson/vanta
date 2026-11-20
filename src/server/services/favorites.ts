import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb, schema as s } from "@/server/db/client";

export async function listFavoriteIds(userId: string) {
  const db = await getDb();
  const rows = await db
    .select({ productId: s.favorites.productId })
    .from(s.favorites)
    .where(eq(s.favorites.userId, userId))
    .orderBy(desc(s.favorites.createdAt));
  return rows.map((r) => r.productId);
}

export async function setFavorite(userId: string, productId: string, favorite: boolean) {
  const db = await getDb();
  if (favorite) {
    await db.insert(s.favorites).values({ userId, productId }).onConflictDoNothing();
  } else {
    await db.delete(s.favorites).where(and(eq(s.favorites.userId, userId), eq(s.favorites.productId, productId)));
  }
}

/** Merges guest favourites (from localStorage) into the account after sign-in. */
export async function mergeFavorites(userId: string, productIds: string[]) {
  const db = await getDb();
  const ids = productIds.filter((id) => /^[0-9a-f-]{36}$/i.test(id)).slice(0, 100);
  if (ids.length) {
    const existing = await db.select({ id: s.products.id }).from(s.products).where(inArray(s.products.id, ids));
    if (existing.length) {
      await db
        .insert(s.favorites)
        .values(existing.map((p) => ({ userId, productId: p.id })))
        .onConflictDoNothing();
    }
  }
  return listFavoriteIds(userId);
}
