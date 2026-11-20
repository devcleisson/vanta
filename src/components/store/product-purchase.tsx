"use client";

import { Ruler } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { useCart } from "@/stores/cart-store";
import type { ProductDetailData } from "@/types/catalog";
import { FavoriteButton } from "./favorite-button";
import { QuantityStepper } from "./quantity-stepper";

export function useVariantSelection(product: ProductDetailData) {
  const firstAvailableColor =
    product.colors.find((c) => product.variants.some((v) => v.colorId === c.id && v.stock > 0)) ?? product.colors[0];
  const [colorId, setColorId] = useState(firstAvailableColor?.id ?? null);
  // Single-size products (e.g. accessories) don't need a size choice.
  const [sizeId, setSizeId] = useState<string | null>(product.sizes.length === 1 ? product.sizes[0].id : null);
  const variant = useMemo(
    () => product.variants.find((v) => v.colorId === colorId && v.sizeId === sizeId) ?? null,
    [product.variants, colorId, sizeId],
  );
  return { colorId, setColorId, sizeId, setSizeId, variant };
}

export function ProductPurchase({
  product,
  selection,
  onAdded,
  onOpenSizeGuide,
}: {
  product: ProductDetailData;
  selection: ReturnType<typeof useVariantSelection>;
  onAdded?: () => void;
  onOpenSizeGuide?: () => void;
}) {
  const { colorId, setColorId, sizeId, setSizeId, variant } = selection;
  const [quantity, setQuantity] = useState(1);
  const [sizeError, setSizeError] = useState(false);
  const add = useCart((s) => s.add);
  const openCart = useCart((s) => s.open);
  const inCart = useCart((s) => (variant ? s.items.find((i) => i.variantId === variant.id)?.quantity ?? 0 : 0));

  const color = product.colors.find((c) => c.id === colorId);
  const stockFor = (sid: string) => product.variants.find((v) => v.colorId === colorId && v.sizeId === sid)?.stock ?? 0;
  const maxQty = Math.max(0, Math.min((variant?.stock ?? 0) - inCart, siteConfig.maxQuantityPerItem - inCart));
  const needsSize = product.sizes.length > 1;

  const handleAdd = () => {
    if (!variant) {
      setSizeError(true);
      document.getElementById("size-picker")?.focus();
      return;
    }
    if (maxQty <= 0) {
      toast.error(
        variant.stock <= 0 ? "Esta combinação está esgotada." : "Você já tem no carrinho todas as unidades disponíveis.",
      );
      return;
    }
    const qty = Math.min(quantity, maxQty);
    add(variant.id, qty);
    setQuantity(1);
    const size = product.sizes.find((s) => s.id === variant.sizeId);
    toast.success("Adicionado ao carrinho", {
      description: `${product.name} — ${color?.name}${needsSize ? `, ${size?.label}` : ""}`,
      action: { label: "Ver carrinho", onClick: openCart },
    });
    onAdded?.();
  };

  return (
    <div className="space-y-7">
      {/* Colour */}
      <fieldset>
        <legend className="mb-3 text-[13px]">
          Cor <span className="font-semibold">{color?.name}</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {product.colors.map((c) => {
            const available = product.variants.some((v) => v.colorId === c.id && v.stock > 0);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setColorId(c.id);
                  setQuantity(1);
                }}
                aria-pressed={c.id === colorId}
                aria-label={`${c.name}${available ? "" : " (esgotada)"}`}
                className={cn(
                  "relative size-10 rounded-full p-[3px] ring-1 transition",
                  c.id === colorId ? "ring-ink" : "ring-transparent hover:ring-stone",
                )}
              >
                <span className="block size-full rounded-full ring-1 ring-ink/15" style={{ backgroundColor: c.hex }} />
                {!available && <span className="absolute left-1/2 top-1/2 h-px w-8 -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-ink" />}
              </button>
            );
          })}
        </div>
      </fieldset>

      {/* Size */}
      {needsSize && (
        <fieldset>
          <div className="mb-3 flex items-center justify-between">
            <legend className="text-[13px]">
              Tamanho {sizeId && <span className="font-semibold">{product.sizes.find((s) => s.id === sizeId)?.label}</span>}
            </legend>
            {onOpenSizeGuide && (
              <button type="button" onClick={onOpenSizeGuide} className="inline-flex items-center gap-1.5 text-[13px] underline underline-offset-4">
                <Ruler className="size-3.5" /> Guia de tamanhos
              </button>
            )}
          </div>
          <div id="size-picker" tabIndex={-1} className="grid grid-cols-6 gap-1.5 outline-none">
            {product.sizes.map((s) => {
              const stock = stockFor(s.id);
              const selected = s.id === sizeId;
              return (
                <button
                  key={s.id}
                  type="button"
                  disabled={stock <= 0}
                  onClick={() => {
                    setSizeId(s.id);
                    setSizeError(false);
                    setQuantity(1);
                  }}
                  aria-pressed={selected}
                  aria-label={`Tamanho ${s.label}${stock <= 0 ? " — esgotado" : ""}`}
                  className={cn(
                    "relative h-12 border text-[14px] font-medium transition-colors",
                    selected ? "border-ink bg-ink text-paper" : "border-stone hover:border-ink",
                    stock <= 0 && "cursor-not-allowed border-stone text-smoke/60 line-through hover:border-stone",
                    sizeError && !selected && stock > 0 && "border-danger/60",
                  )}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
          <p className="mt-2 min-h-5 text-[13px]" aria-live="polite">
            {sizeError ? (
              <span className="text-danger">Selecione um tamanho para continuar.</span>
            ) : variant && variant.stock > 0 && variant.stock <= siteConfig.lowStockThreshold ? (
              <span className="text-warning">Últimas {variant.stock} unidades neste tamanho.</span>
            ) : variant && variant.stock > 0 ? (
              <span className="text-success">Em estoque, pronto para envio.</span>
            ) : null}
          </p>
        </fieldset>
      )}
      {!needsSize && variant && (
        <p className="text-[13px]" aria-live="polite">
          {variant.stock <= 0 ? (
            <span className="text-danger">Esgotado nesta cor.</span>
          ) : variant.stock <= siteConfig.lowStockThreshold ? (
            <span className="text-warning">Últimas {variant.stock} unidades.</span>
          ) : (
            <span className="text-success">Em estoque, pronto para envio.</span>
          )}
        </p>
      )}

      {/* Quantity + actions */}
      <div className="flex items-stretch gap-2">
        <QuantityStepper value={quantity} onChange={setQuantity} max={Math.max(1, maxQty)} />
        <Button
          size="lg"
          className="h-12 min-w-0 flex-1 px-4"
          onClick={handleAdd}
          disabled={!product.inStock || (variant != null && variant.stock <= 0)}
        >
          {!product.inStock || (variant && variant.stock <= 0) ? "Esgotado" : "ADD TO CART"}
        </Button>
        <FavoriteButton productId={product.id} productName={product.name} className="h-12 w-12 shrink-0 border border-stone hover:border-ink" />
      </div>
      {inCart > 0 && (
        <p className="text-[13px] text-smoke">
          Você já tem {inCart} {inCart === 1 ? "unidade" : "unidades"} desta variação no carrinho.
        </p>
      )}
    </div>
  );
}
