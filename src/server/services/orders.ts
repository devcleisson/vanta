import "server-only";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { and, desc, eq, gte, isNull, lt, or, sql } from "drizzle-orm";
import { ORDER_STATUS_LABEL, ORDER_TRANSITIONS } from "@/config/orders";
import type { Database } from "@/server/db/client";
import { getDb, schema as s } from "@/server/db/client";
import { startPayment } from "@/server/payments";
import { getStripe } from "@/server/payments/stripe";
import type { CheckoutData } from "@/schemas/checkout";
import type { OrderStatus } from "@/schemas/admin";
import { priceCart } from "./cart-pricing";

export class CheckoutError extends Error {
  constructor(message: string, public code: "empty" | "stock" | "coupon" | "payment" = "stock") {
    super(message);
  }
}

function orderNumber() {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = randomBytes(3).toString("hex").toUpperCase();
  return `VNT-${ymd}-${rand}`;
}

/**
 * Creates an order from the customer's cart.
 * Prices are recomputed from the database inside the transaction, stock is
 * decremented with a conditional UPDATE (never below zero, safe under
 * concurrency) and coupon usage is capped atomically.
 */
export async function createOrder(input: CheckoutData, userId: string | null) {
  const db = await getDb();

  const created = await db.transaction(async (tx) => {
    const quote = await priceCart(
      { items: input.items, couponCode: input.couponCode, cep: input.address.cep, shippingMethod: input.shippingMethod },
      tx as unknown as Database,
    );
    if (!quote.lines.length) throw new CheckoutError("Seu carrinho está vazio.", "empty");
    if (quote.hasIssues) {
      const problem = quote.lines.find((l) => l.issue);
      throw new CheckoutError(
        problem?.issue === "out_of_stock"
          ? `${problem.name} (${problem.sizeLabel}, ${problem.colorName}) esgotou. Remova o item para continuar.`
          : `Só temos ${problem?.stock} unidade(s) de ${problem?.name} (${problem?.sizeLabel}). Ajuste a quantidade.`,
        "stock",
      );
    }
    if (input.couponCode && !quote.coupon?.valid) {
      throw new CheckoutError(quote.coupon?.message ?? "Cupom inválido.", "coupon");
    }
    const shipping = quote.shipping.selected;
    if (!shipping) throw new CheckoutError("Informe um CEP válido para calcular o frete.", "stock");

    // Reserve stock atomically.
    for (const line of quote.lines) {
      const updated = await tx
        .update(s.productVariants)
        .set({ stock: sql`${s.productVariants.stock} - ${line.quantity}` })
        .where(and(eq(s.productVariants.id, line.variantId), gte(s.productVariants.stock, line.quantity)))
        .returning({ id: s.productVariants.id });
      if (!updated.length) {
        throw new CheckoutError(`${line.name} (${line.sizeLabel}) acabou de esgotar. Atualize o carrinho.`, "stock");
      }
    }

    if (quote.coupon?.valid) {
      const used = await tx
        .update(s.coupons)
        .set({ usedCount: sql`${s.coupons.usedCount} + 1` })
        .where(
          and(
            sql`upper(${s.coupons.code}) = ${quote.coupon.code.toUpperCase()}`,
            or(isNull(s.coupons.maxUses), lt(s.coupons.usedCount, s.coupons.maxUses)),
          ),
        )
        .returning({ id: s.coupons.id });
      if (!used.length) throw new CheckoutError("Este cupom atingiu o limite de usos.", "coupon");
    }

    const [order] = await tx
      .insert(s.orders)
      .values({
        number: orderNumber(),
        userId,
        accessToken: randomBytes(24).toString("base64url"),
        status: "pending",
        email: input.email,
        customerName: input.fullName,
        phone: input.phone,
        cpf: input.cpf,
        shippingAddress: {
          recipient: input.address.recipient,
          cep: input.address.cep,
          street: input.address.street,
          number: input.address.number,
          complement: input.address.complement || null,
          district: input.address.district,
          city: input.address.city,
          state: input.address.state,
        },
        shippingMethod: shipping.id,
        shippingDays: shipping.days,
        subtotal: quote.subtotal,
        discount: quote.discount,
        shippingCost: shipping.price,
        total: quote.total,
        couponCode: quote.coupon?.valid ? quote.coupon.code : null,
      })
      .returning();

    await tx.insert(s.orderItems).values(
      quote.lines.map((l) => ({
        orderId: order.id,
        productId: l.productId,
        variantId: l.variantId,
        productName: l.name,
        productSlug: l.slug,
        imageUrl: l.image,
        sizeLabel: l.sizeLabel,
        colorName: l.colorName,
        sku: l.sku,
        unitPrice: l.unitPrice,
        quantity: l.quantity,
        lineTotal: l.lineTotal,
      })),
    );
    await tx.insert(s.inventoryMovements).values(
      quote.lines.map((l) => ({ variantId: l.variantId, delta: -l.quantity, reason: "order" as const, orderId: order.id })),
    );
    for (const l of quote.lines) {
      await tx
        .update(s.products)
        .set({ salesCount: sql`${s.products.salesCount} + ${l.quantity}` })
        .where(eq(s.products.id, l.productId));
    }
    await tx.insert(s.orderStatusHistory).values({ orderId: order.id, status: "pending", note: "Pedido criado." });

    if (userId && input.saveAddress) {
      const existing = await tx.select({ id: s.addresses.id }).from(s.addresses).where(eq(s.addresses.userId, userId));
      await tx.insert(s.addresses).values({
        userId,
        label: existing.length ? `Endereço ${existing.length + 1}` : "Principal",
        recipient: input.address.recipient,
        phone: input.phone,
        cep: input.address.cep,
        street: input.address.street,
        number: input.address.number,
        complement: input.address.complement || null,
        district: input.address.district,
        city: input.address.city,
        state: input.address.state,
        isDefault: existing.length === 0,
      });
    }
    if (userId) {
      await tx
        .update(s.profiles)
        .set({ phone: input.phone, cpf: input.cpf, fullName: sql`coalesce(${s.profiles.fullName}, ${input.fullName})` })
        .where(eq(s.profiles.id, userId));
      // The purchased cart is emptied server-side as well.
      await tx.delete(s.carts).where(eq(s.carts.userId, userId));
    }

    return { order, lines: quote.lines };
  });

  const { order, lines } = created;

  // Payment happens after the stock is safely reserved.
  try {
    const payment = await startPayment({
      id: order.id,
      number: order.number,
      accessToken: order.accessToken,
      email: order.email,
      total: order.total,
      shippingCost: order.shippingCost,
      discount: order.discount,
      items: lines.map((l) => ({
        name: l.name,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        description: `${l.sizeLabel} · ${l.colorName}`,
        image: l.image,
      })),
    });

    if (payment.provider === "simulated") {
      await db.transaction(async (tx) => {
        await tx.insert(s.payments).values({
          orderId: order.id,
          provider: "simulated",
          status: "approved",
          amount: order.total,
          providerReference: payment.reference,
          isTest: true,
        });
        await tx.update(s.orders).set({ status: "payment_approved" }).where(eq(s.orders.id, order.id));
        await tx.insert(s.orderStatusHistory).values({
          orderId: order.id,
          status: "payment_approved",
          note: "Pagamento simulado (modo demonstração). Nenhuma cobrança foi realizada.",
        });
      });
      return { order, redirectUrl: null as string | null };
    }

    await db.insert(s.payments).values({
      orderId: order.id,
      provider: "stripe",
      status: "pending",
      amount: order.total,
      providerReference: payment.reference,
      isTest: true,
    });
    return { order, redirectUrl: payment.redirectUrl };
  } catch (error) {
    console.error("[checkout] payment start failed", error);
    await cancelOrder(order.id, "Falha ao iniciar o pagamento. Estoque liberado.");
    throw new CheckoutError("Não foi possível iniciar o pagamento. Nenhum valor foi cobrado — tente novamente.", "payment");
  }
}

/** Returns stock to inventory exactly once per order. */
async function releaseStock(tx: Database, orderId: string, note: string) {
  const [order] = await tx
    .update(s.orders)
    .set({ stockReleased: true })
    .where(and(eq(s.orders.id, orderId), eq(s.orders.stockReleased, false)))
    .returning({ id: s.orders.id, couponCode: s.orders.couponCode });
  if (!order) return;
  const items = await tx.select().from(s.orderItems).where(eq(s.orderItems.orderId, orderId));
  for (const item of items) {
    if (!item.variantId) continue;
    await tx
      .update(s.productVariants)
      .set({ stock: sql`${s.productVariants.stock} + ${item.quantity}` })
      .where(eq(s.productVariants.id, item.variantId));
    await tx.insert(s.inventoryMovements).values({ variantId: item.variantId, delta: item.quantity, reason: "cancel", orderId, note });
    if (item.productId) {
      await tx
        .update(s.products)
        .set({ salesCount: sql`greatest(${s.products.salesCount} - ${item.quantity}, 0)` })
        .where(eq(s.products.id, item.productId));
    }
  }
  if (order.couponCode) {
    await tx
      .update(s.coupons)
      .set({ usedCount: sql`greatest(${s.coupons.usedCount} - 1, 0)` })
      .where(sql`upper(${s.coupons.code}) = ${order.couponCode.toUpperCase()}`);
  }
}

export async function cancelOrder(orderId: string, note: string) {
  const db = await getDb();
  await db.transaction(async (tx) => {
    const t = tx as unknown as Database;
    await releaseStock(t, orderId, note);
    await tx.update(s.orders).set({ status: "cancelled" }).where(eq(s.orders.id, orderId));
    await tx.insert(s.orderStatusHistory).values({ orderId, status: "cancelled", note });
  });
}

/** Admin status change with transition rules and stock release on cancel. */
export async function changeOrderStatus(orderId: string, next: OrderStatus, note?: string) {
  const db = await getDb();
  const [order] = await db.select().from(s.orders).where(eq(s.orders.id, orderId));
  if (!order) throw new Error("Pedido não encontrado.");
  if (!ORDER_TRANSITIONS[order.status].includes(next)) {
    throw new Error(`Não é possível mudar de "${ORDER_STATUS_LABEL[order.status]}" para "${ORDER_STATUS_LABEL[next]}".`);
  }
  if (next === "cancelled") {
    await cancelOrder(orderId, note?.trim() || "Pedido cancelado pela loja.");
    return;
  }
  await db.transaction(async (tx) => {
    await tx.update(s.orders).set({ status: next }).where(eq(s.orders.id, orderId));
    await tx.insert(s.orderStatusHistory).values({ orderId, status: next, note: note?.trim() || null });
    if (next === "payment_approved") {
      await tx
        .update(s.payments)
        .set({ status: "approved" })
        .where(and(eq(s.payments.orderId, orderId), eq(s.payments.status, "pending")));
    }
  });
}

/* ───────────── Stripe reconciliation ───────────── */

export async function markStripePaid(orderId: string, sessionId: string) {
  const db = await getDb();
  await db.transaction(async (tx) => {
    const [payment] = await tx
      .update(s.payments)
      .set({ status: "approved" })
      .where(and(eq(s.payments.orderId, orderId), eq(s.payments.providerReference, sessionId), eq(s.payments.status, "pending")))
      .returning();
    if (!payment) return; // already processed
    const [order] = await tx
      .update(s.orders)
      .set({ status: "payment_approved" })
      .where(and(eq(s.orders.id, orderId), eq(s.orders.status, "pending")))
      .returning();
    if (order) {
      await tx.insert(s.orderStatusHistory).values({
        orderId,
        status: "payment_approved",
        note: "Pagamento confirmado pelo Stripe (modo de teste).",
      });
    }
  });
}

export async function markStripeExpired(orderId: string, sessionId: string) {
  const db = await getDb();
  const updated = await db
    .update(s.payments)
    .set({ status: "expired" })
    .where(and(eq(s.payments.orderId, orderId), eq(s.payments.providerReference, sessionId), eq(s.payments.status, "pending")))
    .returning();
  if (updated.length) await cancelOrder(orderId, "Sessão de pagamento expirada. Estoque liberado.");
}

/** Used on the confirmation page so local setups work without a webhook tunnel. */
export async function syncStripeSession(orderId: string, sessionId: string) {
  const stripe = getStripe();
  if (!stripe) return;
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.metadata?.orderId !== orderId) return;
    if (session.payment_status === "paid") await markStripePaid(orderId, sessionId);
    else if (session.status === "expired") await markStripeExpired(orderId, sessionId);
  } catch (e) {
    console.error("[stripe] session sync failed", e);
  }
}

/* ───────────── Reads ───────────── */

export async function getOrderByNumber(number: string) {
  const db = await getDb();
  return db.query.orders.findFirst({
    where: eq(s.orders.number, number),
    with: {
      items: true,
      history: { orderBy: (h, { asc }) => [asc(h.createdAt)] },
      payments: { orderBy: (p, { desc }) => [desc(p.createdAt)] },
    },
  });
}

export function canViewOrder(
  order: { userId: string | null; accessToken: string },
  viewer: { id: string; role: string } | null,
  token: string | null | undefined,
) {
  if (viewer?.role === "admin") return true;
  if (viewer && order.userId === viewer.id) return true;
  if (!token) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(order.accessToken);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function listOrdersForUser(userId: string) {
  const db = await getDb();
  return db.query.orders.findMany({
    where: eq(s.orders.userId, userId),
    orderBy: desc(s.orders.createdAt),
    with: { items: true },
  });
}
