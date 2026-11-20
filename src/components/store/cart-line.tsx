"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";
import { useCart } from "@/stores/cart-store";
import type { PricedCartLine } from "@/types/cart";
import { ProductImage } from "./product-image";
import { QuantityStepper } from "./quantity-stepper";

const selectClass = "h-8 border border-stone bg-paper pl-2 pr-6 text-[12px] outline-none hover:border-ink focus:border-ink";

export function CartLine({ line, onNavigate, compact }: { line: PricedCartLine; onNavigate?: () => void; compact?: boolean }) {
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);
  const replaceVariant = useCart((s) => s.replaceVariant);

  const sizes = [...new Map(line.options.map((o) => [o.sizeLabel, o])).values()];
  const colors = [...new Set(line.options.map((o) => o.colorName))];
  const findVariant = (size: string, color: string) => line.options.find((o) => o.sizeLabel === size && o.colorName === color);

  return (
    <li className={cn("flex gap-4 py-5", line.issue === "out_of_stock" && "opacity-70")}>
      <Link href={`/products/${line.slug}`} onClick={onNavigate} className={cn("relative shrink-0 bg-concrete", compact ? "h-[120px] w-24" : "h-36 w-28")}>
        {line.image && <ProductImage src={line.image} alt={line.name} fill sizes="112px" className="object-cover" />}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <Link href={`/products/${line.slug}`} onClick={onNavigate} className="text-[14px] font-medium leading-snug hover:underline">
            {line.name}
          </Link>
          <button
            type="button"
            onClick={() => remove(line.variantId)}
            className="-mr-2 -mt-1.5 inline-flex size-8 shrink-0 items-center justify-center text-smoke hover:text-ink"
            aria-label={`Remover ${line.name}`}
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {colors.length > 1 ? (
            <select
              aria-label="Cor"
              className={selectClass}
              value={line.colorName}
              onChange={(e) => {
                const target = findVariant(line.sizeLabel, e.target.value) ?? line.options.find((o) => o.colorName === e.target.value && o.stock > 0);
                if (target) replaceVariant(line.variantId, target.variantId);
              }}
            >
              {colors.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          ) : (
            <span className="text-[12px] text-smoke">{line.colorName}</span>
          )}
          {sizes.length > 1 && (
            <select
              aria-label="Tamanho"
              className={selectClass}
              value={line.sizeLabel}
              onChange={(e) => {
                const target = findVariant(e.target.value, line.colorName);
                if (target) replaceVariant(line.variantId, target.variantId);
              }}
            >
              {sizes.map((s) => {
                const v = findVariant(s.sizeLabel, line.colorName);
                return (
                  <option key={s.sizeLabel} value={s.sizeLabel} disabled={!v || v.stock <= 0}>
                    {s.sizeLabel}{!v || v.stock <= 0 ? " — esgotado" : ""}
                  </option>
                );
              })}
            </select>
          )}
        </div>

        {line.issue && (
          <p className="mt-2 text-[12px] font-medium text-danger" role="alert">
            {line.issue === "out_of_stock"
              ? "Esgotado. Remova o item ou troque a variação."
              : `Só restam ${line.stock}. Ajustamos a quantidade.`}
          </p>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 pt-3">
          {line.stock > 0 ? (
            <QuantityStepper
              size="sm"
              value={line.quantity}
              max={Math.min(line.stock, siteConfig.maxQuantityPerItem)}
              onChange={(n) => (n < 1 ? remove(line.variantId) : setQuantity(line.variantId, n))}
              label={`Quantidade de ${line.name}`}
            />
          ) : (
            <span />
          )}
          <div className="text-right tabular-nums">
            <p className="text-[14px] font-medium">{formatPrice(line.lineTotal)}</p>
            {line.compareAtPrice && line.quantity > 0 && (
              <p className="text-[12px] text-smoke line-through">{formatPrice(line.compareAtPrice * line.quantity)}</p>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}
