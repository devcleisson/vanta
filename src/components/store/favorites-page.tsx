"use client";

import { Heart } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState, Skeleton } from "@/components/ui/misc";
import { useHydrated } from "@/hooks/use-hydrated";
import { getProductsByIdsAction } from "@/server/actions/favorites";
import { useFavorites } from "@/stores/favorites-store";
import type { ProductCardData } from "@/types/catalog";
import { ProductGrid } from "./product-card";

export function FavoritesClient({ signedIn }: { signedIn: boolean }) {
  const hydrated = useHydrated();
  const ids = useFavorites((s) => s.ids);
  const [products, setProducts] = useState<ProductCardData[] | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    let alive = true;
    getProductsByIdsAction(ids).then((p) => alive && setProducts(p));
    return () => {
      alive = false;
    };
  }, [hydrated, ids]);

  if (!hydrated || products === null) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[4/5]" />
        ))}
      </div>
    );
  }

  if (!products.length) {
    return (
      <EmptyState
        icon={<Heart strokeWidth={1.25} />}
        title="Nenhum favorito ainda"
        description="Toque no coração de qualquer produto para guardá-lo aqui."
        action={<Button asChild><Link href="/shop">Explorar a loja</Link></Button>}
        className="border border-stone"
      />
    );
  }

  return (
    <>
      {!signedIn && (
        <p className="mb-8 bg-concrete px-4 py-3 text-[14px]">
          Seus favoritos estão salvos neste dispositivo.{" "}
          <Link href="/login?next=/favorites" className="underline underline-offset-4">Entre</Link> para guardá-los na sua conta.
        </p>
      )}
      <ProductGrid products={products} />
    </>
  );
}
