"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { quoteCartAction } from "@/server/actions/cart";
import { useCart } from "@/stores/cart-store";
import type { CartQuote } from "@/types/cart";

/** Asks the server to price the current cart whenever its contents change. */
/**
 * Keeps the device cart honest with the server: drops variants that no longer
 * exist and lowers quantities to the available stock.
 */
function reconcile(quote: CartQuote) {
  const { items, remove, setQuantity } = useCart.getState();
  for (const item of items) {
    const line = quote.lines.find((l) => l.variantId === item.variantId);
    if (!line) remove(item.variantId);
    else if (line.issue === "reduced" && line.quantity > 0) setQuantity(item.variantId, line.quantity);
  }
}

export function useCartQuote(enabled = true) {
  const items = useCart((s) => s.items);
  const couponCode = useCart((s) => s.couponCode);
  const cep = useCart((s) => s.cep);
  const shippingMethod = useCart((s) => s.shippingMethod);
  const [quote, setQuote] = useState<CartQuote | null>(null);
  const [pending, startTransition] = useTransition();
  const requestId = useRef(0);

  const key = JSON.stringify({ items, couponCode, cep, shippingMethod });

  useEffect(() => {
    if (!enabled) return;
    const id = ++requestId.current;
    startTransition(async () => {
      const result = await quoteCartAction({ items, couponCode, cep, shippingMethod });
      if (id !== requestId.current) return;
      setQuote(result);
      if (result) reconcile(result);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);

  return { quote, loading: pending && !quote, refreshing: pending };
}
