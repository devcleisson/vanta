"use client";

import { useEffect } from "react";
import { useCart } from "@/stores/cart-store";

/** Clears the cart after returning from the Stripe-hosted payment page. */
export function ClearCartOnConfirm({ orderNumber, paid }: { orderNumber: string; paid: boolean }) {
  useEffect(() => {
    if (!paid) return;
    if (sessionStorage.getItem("vanta-pending-order") === orderNumber) {
      useCart.getState().clear();
      sessionStorage.removeItem("vanta-pending-order");
    }
  }, [orderNumber, paid]);
  return null;
}
