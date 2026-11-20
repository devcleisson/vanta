"use client";

import { Heart } from "lucide-react";
import { useFavorite } from "@/hooks/use-favorite";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  productId,
  productName,
  className,
  withLabel,
}: {
  productId: string;
  productName: string;
  className?: string;
  withLabel?: boolean;
}) {
  const { active, toggle } = useFavorite(productId, productName);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle();
      }}
      aria-pressed={active}
      aria-label={active ? `Remover ${productName} dos favoritos` : `Adicionar ${productName} aos favoritos`}
      className={cn("inline-flex items-center justify-center gap-2", className)}
    >
      <Heart
        key={String(active)}
        className={cn("size-[18px] transition-colors", active && "animate-pop fill-current")}
        strokeWidth={1.5}
      />
      {withLabel && <span className="text-sm font-medium">{active ? "Nos favoritos" : "Favoritar"}</span>}
    </button>
  );
}
