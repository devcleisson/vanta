import "server-only";
import { sql } from "drizzle-orm";
import type { Database } from "@/server/db/client";
import { getDb, schema as s } from "@/server/db/client";
import { formatPrice } from "@/lib/format";
import type { CouponResult } from "@/types/cart";

export type CouponRow = typeof s.coupons.$inferSelect;

export async function findCoupon(code: string, db?: Database) {
  const conn = db ?? (await getDb());
  const [row] = await conn
    .select()
    .from(s.coupons)
    .where(sql`upper(${s.coupons.code}) = ${code.trim().toUpperCase()}`);
  return row ?? null;
}

/** Validates a coupon against the server-computed subtotal. */
export function evaluateCoupon(coupon: CouponRow | null, code: string, subtotal: number): CouponResult & { discount: number; freeShipping: boolean } {
  const base = { code: code.trim().toUpperCase(), discount: 0, freeShipping: false };
  if (!coupon || !coupon.isActive) return { ...base, valid: false, message: "Cupom não encontrado." };
  if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) return { ...base, valid: false, message: "Este cupom expirou." };
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) return { ...base, valid: false, message: "Este cupom atingiu o limite de usos." };
  if (subtotal < coupon.minSubtotal)
    return { ...base, valid: false, message: `Válido para compras a partir de ${formatPrice(coupon.minSubtotal)}.` };

  let discount = 0;
  if (coupon.type === "percent") discount = Math.round((subtotal * Math.min(coupon.value, 100)) / 100);
  if (coupon.type === "fixed") discount = Math.min(coupon.value, subtotal);
  return {
    ...base,
    code: coupon.code,
    valid: true,
    message: "Cupom aplicado.",
    description: coupon.description,
    type: coupon.type,
    discount,
    freeShipping: coupon.type === "free_shipping",
  };
}
