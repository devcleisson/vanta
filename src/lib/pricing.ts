/** Shared, side-effect-free price helpers (safe on client and server). */
export function effectivePrice(p: { price: number; salePrice: number | null }) {
  return p.salePrice != null && p.salePrice > 0 && p.salePrice < p.price ? p.salePrice : p.price;
}

export function isOnSale(p: { price: number; salePrice: number | null }) {
  return effectivePrice(p) < p.price;
}

export function discountPercent(p: { price: number; salePrice: number | null }) {
  if (!isOnSale(p)) return 0;
  return Math.round((1 - effectivePrice(p) / p.price) * 100);
}
