"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/misc";
import { getQuickViewAction } from "@/server/actions/catalog";
import { useCart } from "@/stores/cart-store";
import { useQuickView } from "@/stores/quick-view-store";
import type { ProductDetailData } from "@/types/catalog";
import { Price } from "./price";
import { ProductImage } from "./product-image";
import { ProductPurchase, useVariantSelection } from "./product-purchase";

export function QuickView() {
  const slug = useQuickView((s) => s.slug);
  const hide = useQuickView((s) => s.hide);
  const [product, setProduct] = useState<ProductDetailData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let alive = true;
    setProduct(null);
    setError(false);
    getQuickViewAction(slug)
      .then((p) => alive && (p ? setProduct(p) : setError(true)))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, [slug]);

  return (
    <Dialog open={!!slug} onOpenChange={(o) => !o && hide()}>
      <DialogContent title={product?.name ?? "Produto"} hideHeader className="max-w-4xl p-0">
        {error ? (
          <p className="p-10 text-center text-[15px]">Não foi possível carregar este produto. Feche e tente novamente.</p>
        ) : !product ? (
          <div className="grid gap-6 p-6 sm:grid-cols-2">
            <Skeleton className="aspect-[4/5]" />
            <div className="space-y-4 pt-6">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="mt-8 h-10 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        ) : (
          <QuickViewBody product={product} onDone={hide} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function QuickViewBody({ product, onDone }: { product: ProductDetailData; onDone: () => void }) {
  const selection = useVariantSelection(product);
  const openCart = useCart((s) => s.open);
  const img = product.images.find((i) => i.colorId === selection.colorId) ?? product.images[0];
  return (
    <div className="grid sm:grid-cols-2">
      <div className="relative aspect-[4/5] bg-concrete">
        {img && <ProductImage src={img.url} alt={img.alt} fill sizes="(min-width: 640px) 450px, 100vw" className="object-cover" />}
      </div>
      <div className="flex flex-col p-6 sm:p-8">
        <h2 className="display-tight pr-8 text-[26px] leading-[0.95]">{product.name}</h2>
        <Price price={product.price} salePrice={product.salePrice} size="lg" className="mt-3" />
        <div className="mt-7">
          <ProductPurchase
            product={product}
            selection={selection}
            onAdded={() => {
              onDone();
              openCart();
            }}
          />
        </div>
        <Link href={`/products/${product.slug}`} onClick={onDone} className="mt-6 text-[13px] underline underline-offset-4">
          Ver detalhes completos
        </Link>
      </div>
    </div>
  );
}
