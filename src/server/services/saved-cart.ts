import "server-only";
import { eq, inArray } from "drizzle-orm";
import { siteConfig } from "@/config/site";
import { getDb, schema as s } from "@/server/db/client";
import type { CartItemInput } from "@/types/cart";

/** Persists a signed-in customer's cart so it follows them across devices. */
export async function getSavedCart(userId: string): Promise<CartItemInput[]> {
  const db = await getDb();
  const [cart] = await db.select().from(s.carts).where(eq(s.carts.userId, userId));
  if (!cart) return [];
  const items = await db.select().from(s.cartItems).where(eq(s.cartItems.cartId, cart.id));
  return items.map((i) => ({ variantId: i.variantId, quantity: i.quantity }));
}

export async function replaceSavedCart(userId: string, items: CartItemInput[]) {
  const db = await getDb();
  const clean = new Map<string, number>();
  for (const i of items.slice(0, 50)) {
    if (/^[0-9a-f-]{36}$/i.test(i.variantId) && i.quantity > 0) {
      clean.set(i.variantId, Math.min(Math.floor(i.quantity), siteConfig.maxQuantityPerItem));
    }
  }
  await db.transaction(async (tx) => {
    const [cart] = await tx
      .insert(s.carts)
      .values({ userId })
      .onConflictDoUpdate({ target: s.carts.userId, set: { updatedAt: new Date() } })
      .returning();
    await tx.delete(s.cartItems).where(eq(s.cartItems.cartId, cart.id));
    const ids = [...clean.keys()];
    if (!ids.length) return;
    const valid = await tx.select({ id: s.productVariants.id }).from(s.productVariants).where(inArray(s.productVariants.id, ids));
    if (valid.length) {
      await tx.insert(s.cartItems).values(valid.map((v) => ({ cartId: cart.id, variantId: v.id, quantity: clean.get(v.id)! })));
    }
  });
}

/** Union of the device cart and the saved cart (max quantity wins). */
export async function mergeSavedCart(userId: string, local: CartItemInput[]) {
  const saved = await getSavedCart(userId);
  const merged = new Map<string, number>();
  for (const i of [...saved, ...local]) merged.set(i.variantId, Math.max(merged.get(i.variantId) ?? 0, i.quantity));
  const items = [...merged.entries()].map(([variantId, quantity]) => ({ variantId, quantity }));
  await replaceSavedCart(userId, items);
  return getSavedCart(userId);
}
