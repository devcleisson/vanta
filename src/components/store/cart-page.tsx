"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/misc";
import { useCartQuote } from "@/hooks/use-cart-quote";
import { useHydrated } from "@/hooks/use-hydrated";
import { useCart } from "@/stores/cart-store";
import { EmptyCart } from "./cart-drawer";
import { CartLine } from "./cart-line";
import { CouponForm, ShippingEstimator, TotalsTable } from "./cart-summary";

export function CartPageClient() {
  const router = useRouter();
  const hydrated = useHydrated();
  const hasItems = useCart((s) => s.items.length > 0);
  const { quote, refreshing } = useCartQuote(hydrated);

  if (!hydrated || (hasItems && !quote)) {
    return (
      <div className="grid gap-10 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          {[0, 1].map((i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-36 w-28" />
              <div className="flex-1 space-y-2 pt-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (!hasItems || !quote || quote.lines.length === 0) {
    return (
      <div className="border border-stone">
        <EmptyCart />
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_400px] lg:gap-16">
      <section aria-label="Itens do carrinho">
        <div className="hidden border-b border-ink pb-3 text-[13px] text-smoke sm:flex sm:justify-between">
          <span>Produto</span>
          <span>Total</span>
        </div>
        <ul className="divide-y divide-stone">
          {quote.lines.map((line) => (
            <CartLine key={line.variantId} line={line} />
          ))}
        </ul>
        <Link href="/shop" className="mt-6 inline-block text-[14px] underline underline-offset-4">
          Continuar comprando
        </Link>
      </section>

      <aside aria-label="Resumo do pedido" className="lg:sticky lg:top-24 lg:self-start">
        <div className="space-y-6 bg-concrete p-6">
          <h2 className="text-[15px] font-semibold">Resumo</h2>
          <CouponForm quote={quote} />
          <ShippingEstimator quote={quote} />
          <div className={refreshing ? "opacity-60 transition-opacity" : "transition-opacity"} aria-live="polite">
            <TotalsTable quote={quote} />
          </div>
          <Button size="lg" className="w-full" disabled={quote.hasIssues} onClick={() => router.push("/checkout")}>
            Finalizar compra
          </Button>
          {quote.hasIssues && <p className="text-[13px] text-danger">Há itens indisponíveis. Ajuste o carrinho para continuar.</p>}
        </div>
        <ul className="mt-5 space-y-1.5 text-[13px] text-smoke">
          <li>Pagamento seguro em ambiente de teste.</li>
          <li>Primeira troca grátis em até 30 dias.</li>
        </ul>
      </aside>
    </div>
  );
}
