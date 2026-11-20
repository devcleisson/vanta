import { formatPrice } from "@/lib/format";
import { discountPercent, effectivePrice, isOnSale } from "@/lib/pricing";
import { cn } from "@/lib/utils";

export function Price({
  price,
  salePrice,
  className,
  size = "sm",
}: {
  price: number;
  salePrice: number | null;
  className?: string;
  size?: "sm" | "lg";
}) {
  const sale = isOnSale({ price, salePrice });
  return (
    <p className={cn("flex flex-wrap items-baseline gap-x-2 tabular-nums", size === "lg" ? "text-xl" : "text-[14px]", className)}>
      <span className={cn(sale && "font-semibold")}>{formatPrice(effectivePrice({ price, salePrice }))}</span>
      {sale && (
        <>
          <span className="text-smoke line-through decoration-1">
            <span className="sr-only">Preço original: </span>
            {formatPrice(price)}
          </span>
          <span className={cn("font-medium", size === "lg" ? "text-[15px]" : "text-[12px]")}>−{discountPercent({ price, salePrice })}%</span>
        </>
      )}
    </p>
  );
}
