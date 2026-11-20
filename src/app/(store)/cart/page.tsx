import type { Metadata } from "next";
import { CartPageClient } from "@/components/store/cart-page";

export const metadata: Metadata = { title: "Carrinho", robots: { index: false } };

export default function CartPage() {
  return (
    <div className="container-x pb-24 pt-10 md:pt-14">
      <h1 className="display mb-10 text-[clamp(2.5rem,7vw,5.5rem)]">Cart</h1>
      <CartPageClient />
    </div>
  );
}
