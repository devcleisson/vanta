"use client";

import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useCartQuote } from "@/hooks/use-cart-quote";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/stores/cart-store";
import { CartLine } from "./cart-line";
import { CouponForm } from "./cart-summary";

export function CartDrawer() {
  const router = useRouter();
  const isOpen = useCart((s) => s.isOpen);
  const setOpen = useCart((s) => s.setOpen);
  const hasItems = useCart((s) => s.items.length > 0);
  const { quote, loading } = useCartQuote(isOpen);
  const close = () => setOpen(false);

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent title={quote ? `Carrinho (${quote.itemCount})` : "Carrinho"}>
        {!hasItems ? (
          <EmptyCart onNavigate={close} />
        ) : loading || !quote ? (
          <div className="space-y-6 p-5">
            {[0, 1].map((i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-[120px] w-24" />
                <div className="flex-1 space-y-2 pt-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-stone overflow-y-auto px-5">
              {quote.lines.map((line) => (
                <CartLine key={line.variantId} line={line} onNavigate={close} compact />
              ))}
            </ul>
            <div className="space-y-4 border-t border-stone bg-paper p-5">
              <CouponForm quote={quote} />
              <dl className="space-y-1.5 text-[14px] tabular-nums">
                {quote.discount > 0 && (
                  <div className="flex justify-between text-smoke">
                    <dt>Desconto</dt>
                    <dd>−{formatPrice(quote.discount)}</dd>
                  </div>
                )}
                <div className="flex justify-between text-[16px] font-semibold">
                  <dt>Subtotal</dt>
                  <dd>{formatPrice(quote.subtotal - quote.discount)}</dd>
                </div>
              </dl>
              <p className="text-[12px] text-smoke">Frete calculado no carrinho ou no checkout.</p>
              <div className="grid gap-2">
                <Button
                  size="lg"
                  disabled={quote.hasIssues || quote.itemCount === 0}
                  onClick={() => {
                    close();
                    router.push("/checkout");
                  }}
                >
                  Finalizar compra
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/cart" onClick={close}>Ver carrinho e frete</Link>
                </Button>
              </div>
              {quote.hasIssues && <p className="text-[12px] text-danger">Ajuste os itens indisponíveis para continuar.</p>}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

export function EmptyCart({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <EmptyState
      className="flex-1 justify-center"
      icon={<ShoppingBag strokeWidth={1.25} />}
      title="Seu carrinho está vazio"
      description="Comece pelos lançamentos da semana ou pelas peças que mais saem."
      action={
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/shop?sort=newest&new=1" onClick={onNavigate}>Ver lançamentos</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/shop?sort=best-sellers" onClick={onNavigate}>Mais vendidos</Link>
          </Button>
        </div>
      }
    />
  );
}
