import "server-only";
import { asc, inArray } from "drizzle-orm";
import { siteConfig } from "@/config/site";
import type { Database } from "@/server/db/client";
import { getDb, schema as s } from "@/server/db/client";
import { effectivePrice } from "@/lib/pricing";
import type { CartItemInput, CartQuote, PricedCartLine } from "@/types/cart";
import { evaluateCoupon, findCoupon } from "./coupons";
import { normalizeCep, quoteShipping } from "./shipping";

/**
 * The single source of truth for money. Every price, discount and stock
 * figure shown in the cart or charged at checkout is computed here from the
 * database. Values sent by the browser are only used as *identifiers*.
 */
export async function priceCart(
  input: { items: CartItemInput[]; couponCode?: string | null; cep?: string | null; shippingMethod?: string | null },
  db?: Database,
): Promise<CartQuote> {
  const conn = db ?? (await getDb());

  // Merge duplicates and sanitise quantities.
  const merged = new Map<string, number>();
  for (const item of input.items.slice(0, 50)) {
    if (!/^[0-9a-f-]{36}$/i.test(item.variantId)) continue;
    const qty = Math.floor(Number(item.quantity));
    if (!Number.isFinite(qty) || qty < 1) continue;
    merged.set(item.variantId, Math.min((merged.get(item.variantId) ?? 0) + qty, siteConfig.maxQuantityPerItem));
  }
  const ids = [...merged.keys()];

  const variants = ids.length
    ? await conn.query.productVariants.findMany({
        where: inArray(s.productVariants.id, ids),
        with: {
          size: true,
          color: true,
          product: {
            with: {
              images: { orderBy: asc(s.productImages.sortOrder) },
              variants: { with: { size: true, color: true } },
            },
          },
        },
      })
    : [];

  const lines: PricedCartLine[] = [];
  for (const variantId of ids) {
    const requested = merged.get(variantId)!;
    const v = variants.find((x) => x.id === variantId);
    if (!v || !v.product.isActive) continue; // silently drop deleted products
    const unitPrice = effectivePrice(v.product);
    const quantity = Math.min(requested, Math.max(v.stock, 0));
    const image = v.product.images.find((i) => i.colorId === v.colorId) ?? v.product.images[0];
    lines.push({
      variantId,
      productId: v.productId,
      slug: v.product.slug,
      name: v.product.name,
      image: image?.url ?? null,
      sizeLabel: v.size.label,
      colorName: v.color.name,
      colorHex: v.color.hex,
      sku: v.sku,
      unitPrice,
      compareAtPrice: unitPrice < v.product.price ? v.product.price : null,
      requestedQuantity: requested,
      quantity,
      stock: v.stock,
      lineTotal: unitPrice * quantity,
      issue: v.stock <= 0 ? "out_of_stock" : quantity < requested ? "reduced" : null,
      options: v.product.variants
        .map((o) => ({ variantId: o.id, sizeLabel: o.size.label, sizeOrder: o.size.sortOrder, colorName: o.color.name, stock: o.stock }))
        .sort((a, b) => a.sizeOrder - b.sizeOrder),
    });
  }

  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);

  let coupon: CartQuote["coupon"] = null;
  let discount = 0;
  let freeShipping = false;
  if (input.couponCode?.trim()) {
    const result = evaluateCoupon(await findCoupon(input.couponCode, conn), input.couponCode, subtotal);
    coupon = { code: result.code, valid: result.valid, message: result.message, description: result.description, type: result.type };
    if (result.valid) {
      discount = result.discount;
      freeShipping = result.freeShipping;
    }
  }

  const cep = normalizeCep(input.cep);
  const options = itemCount > 0 ? quoteShipping(cep, subtotal - discount, freeShipping) : [];
  const selected = options.find((o) => o.id === input.shippingMethod) ?? options[0] ?? null;
  const total = Math.max(subtotal - discount, 0) + (selected?.price ?? 0);

  return {
    lines,
    itemCount,
    subtotal,
    discount,
    shipping: { options, selected, cep },
    total,
    coupon,
    hasIssues: lines.some((l) => l.issue !== null),
  };
}
