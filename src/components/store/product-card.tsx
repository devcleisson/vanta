"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useCart } from "@/stores/cart-store";
import { useQuickView } from "@/stores/quick-view-store";
import type { ProductCardData } from "@/types/catalog";
import { FavoriteButton } from "./favorite-button";
import { Price } from "./price";
import { ProductImage } from "./product-image";

export function ProductCard({ product, priority, className }: { product: ProductCardData; priority?: boolean; className?: string }) {
  const add = useCart((s) => s.add);
  const openCart = useCart((s) => s.open);
  const openQuickView = useQuickView((s) => s.show);

  const onQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!product.inStock) return;
    if (product.singleVariantId) {
      add(product.singleVariantId, 1);
      toast.success("Adicionado ao carrinho", {
        description: product.name,
        action: { label: "Ver carrinho", onClick: openCart },
      });
    } else {
      openQuickView(product.slug);
    }
  };

  return (
    <article className={cn("group relative", className)}>
      <Link href={`/products/${product.slug}`} className="block" aria-label={product.name}>
        <div className="relative aspect-[4/5] overflow-hidden bg-concrete">
          {product.image && (
            <ProductImage
              src={product.image.url}
              alt={product.image.alt}
              fill
              priority={priority}
              sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
              className={cn(
                "object-cover transition-[opacity,transform] duration-700 ease-out",
                product.hoverImage && "group-hover:opacity-0",
                !product.inStock && "opacity-60",
              )}
            />
          )}
          {product.hoverImage && (
            <ProductImage
              src={product.hoverImage.url}
              alt=""
              aria-hidden
              fill
              sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
              className="scale-[1.02] object-cover opacity-0 transition-[opacity,transform] duration-700 ease-out group-hover:scale-100 group-hover:opacity-100"
            />
          )}

          <div className="absolute left-3 top-3 flex flex-col items-start gap-1">
            {!product.inStock ? (
              <span className="bg-paper px-2 py-1 text-[11px] font-semibold">Esgotado</span>
            ) : product.isNew ? (
              <span className="bg-ink px-2 py-1 text-[11px] font-semibold text-paper">Novo</span>
            ) : null}
            {product.inStock && product.salePrice != null && product.salePrice < product.price && (
              <span className="bg-paper px-2 py-1 text-[11px] font-semibold">Promoção</span>
            )}
          </div>
        </div>
      </Link>

      <FavoriteButton
        productId={product.id}
        productName={product.name}
        className="absolute right-1.5 top-1.5 size-10 bg-transparent hover:bg-paper/70"
      />

      {product.inStock && (
        <button
          type="button"
          onClick={onQuickAdd}
          aria-label={product.singleVariantId ? `Adicionar ${product.name} ao carrinho` : `Escolher tamanho de ${product.name}`}
          className="absolute bottom-[5.125rem] right-2 inline-flex h-10 items-center gap-1.5 bg-paper px-3 text-[13px] font-medium shadow-sm transition-all duration-300 hover:bg-ink hover:text-paper md:translate-y-2 md:opacity-0 md:group-focus-within:translate-y-0 md:group-focus-within:opacity-100 md:group-hover:translate-y-0 md:group-hover:opacity-100"
        >
          <Plus className="size-4" />
          <span className="hidden sm:inline">Adicionar</span>
        </button>
      )}

      <div className="flex h-20 flex-col pt-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[14px] font-medium leading-snug">
            <Link href={`/products/${product.slug}`} className="link-underline">
              {product.name.replace(/^VANTA\s/, "")}
            </Link>
          </h3>
          {product.colors.length > 1 && (
            <div className="mt-1 flex shrink-0 gap-1" aria-label={`${product.colors.length} cores`}>
              {product.colors.slice(0, 4).map((c) => (
                <span key={c.id} title={c.name} className="size-2.5 rounded-full ring-1 ring-ink/15" style={{ backgroundColor: c.hex }} />
              ))}
            </div>
          )}
        </div>
        <Price price={product.price} salePrice={product.salePrice} className="mt-1" />
      </div>
    </article>
  );
}

export function ProductGrid({ products, className, priorityCount = 0 }: { products: ProductCardData[]; className?: string; priorityCount?: number }) {
  return (
    <div className={cn("grid grid-cols-2 gap-x-3 gap-y-6 sm:gap-x-4 md:grid-cols-3 xl:grid-cols-4", className)}>
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < priorityCount} />
      ))}
    </div>
  );
}
