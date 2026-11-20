"use server";

import { z } from "zod";
import { cartItemsSchema } from "@/schemas/checkout";
import { getCurrentUser } from "@/server/auth/session";
import { priceCart } from "@/server/services/cart-pricing";
import { getSavedCart, mergeSavedCart, replaceSavedCart } from "@/server/services/saved-cart";
import type { CartItemInput, CartQuote } from "@/types/cart";

const quoteInput = z.object({
  items: cartItemsSchema,
  couponCode: z.string().max(40).nullish(),
  cep: z.string().max(10).nullish(),
  shippingMethod: z.string().max(20).nullish(),
});

/** Prices the cart on the server. The client only sends variant ids and quantities. */
export async function quoteCartAction(input: unknown): Promise<CartQuote | null> {
  const parsed = quoteInput.safeParse(input);
  if (!parsed.success) return null;
  return priceCart(parsed.data);
}

export async function syncCartAction(items: CartItemInput[], mode: "merge" | "replace"): Promise<CartItemInput[] | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const parsed = cartItemsSchema.safeParse(items);
  if (!parsed.success) return null;
  if (mode === "merge") return mergeSavedCart(user.id, parsed.data);
  await replaceSavedCart(user.id, parsed.data);
  return getSavedCart(user.id);
}
