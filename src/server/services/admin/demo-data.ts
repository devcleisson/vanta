import "server-only";
import { randomBytes } from "node:crypto";
import { inArray, like, sql } from "drizzle-orm";
import { getDb, schema as s } from "@/server/db/client";

/**
 * Generates realistic historical orders so the dashboard can be explored.
 * Every generated record uses the @demo.vanta.store domain and can be removed
 * in one click. Historical orders do not touch current stock.
 */
const DEMO_DOMAIN = "demo.vanta.store";
const FIRST = ["Ana", "Bruno", "Camila", "Diego", "Elisa", "Felipe", "Gabriela", "Heitor", "Isabela", "João", "Larissa", "Marcos", "Natália", "Otávio", "Paula", "Rafael", "Sofia", "Thiago", "Valentina", "Yuri"];
const LAST = ["Almeida", "Barros", "Carvalho", "Duarte", "Ferraz", "Gomes", "Lima", "Moraes", "Nogueira", "Pires", "Queiroz", "Ribeiro", "Santos", "Teixeira", "Vieira"];
const CITIES = [
  ["São Paulo", "SP", "01310100"], ["Rio de Janeiro", "RJ", "22041001"], ["Belo Horizonte", "MG", "30130010"],
  ["Curitiba", "PR", "80020010"], ["Porto Alegre", "RS", "90010150"], ["Salvador", "BA", "40020000"],
  ["Recife", "PE", "50030230"], ["Brasília", "DF", "70040010"], ["Campinas", "SP", "13010001"], ["Florianópolis", "SC", "88010000"],
] as const;

function rng(seed: number) {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export async function generateDemoOrders() {
  const db = await getDb();
  const rand = rng(Date.now() % 100000);
  const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];

  const variants = await db.query.productVariants.findMany({
    with: { size: true, color: true, product: { with: { images: true } } },
  });
  const active = variants.filter((v) => v.product.isActive);
  if (!active.length) throw new Error("Cadastre produtos antes de gerar pedidos de demonstração.");

  const customers = await db
    .insert(s.profiles)
    .values(
      Array.from({ length: 28 }, (_, i) => {
        const first = FIRST[i % FIRST.length];
        const last = pick(LAST);
        return {
          email: `${first.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")}.${last.toLowerCase()}${i}@${DEMO_DOMAIN}`,
          fullName: `${first} ${last}`,
          phone: `119${String(Math.floor(rand() * 1e8)).padStart(8, "0")}`,
          createdAt: new Date(Date.now() - Math.floor(rand() * 160) * 86_400_000),
        };
      }),
    )
    .onConflictDoNothing()
    .returning();

  let created = 0;
  for (let i = 0; i < 160; i++) {
    const daysAgo = Math.floor(Math.pow(rand(), 1.4) * 150);
    const createdAt = new Date(Date.now() - daysAgo * 86_400_000 - Math.floor(rand() * 86_400_000));
    const customer = rand() < 0.85 && customers.length ? pick(customers) : null;
    const [city, state, cep] = pick(CITIES);
    const lineCount = 1 + Math.floor(rand() * 3);
    const lines = Array.from({ length: lineCount }, () => {
      const v = pick(active);
      const unit = v.product.salePrice && v.product.salePrice < v.product.price ? v.product.salePrice : v.product.price;
      const qty = rand() < 0.8 ? 1 : 2;
      return { v, unit, qty };
    });
    const subtotal = lines.reduce((n, l) => n + l.unit * l.qty, 0);
    const discount = rand() < 0.2 ? Math.round(subtotal * 0.1) : 0;
    const shippingCost = subtotal - discount >= 49900 ? 0 : pick([1990, 2490, 3290]);
    const r = rand();
    const status =
      daysAgo > 14
        ? r < 0.88 ? "delivered" : "cancelled"
        : daysAgo > 5
          ? r < 0.5 ? "shipped" : r < 0.85 ? "delivered" : "cancelled"
          : r < 0.3 ? "pending" : r < 0.6 ? "payment_approved" : r < 0.85 ? "preparing" : "shipped";
    const name = customer?.fullName ?? `${pick(FIRST)} ${pick(LAST)}`;

    await db.transaction(async (tx) => {
      const [order] = await tx
        .insert(s.orders)
        .values({
          number: `VNT-D${String(createdAt.getTime()).slice(-6)}-${randomBytes(2).toString("hex").toUpperCase()}`,
          userId: customer?.id ?? null,
          accessToken: randomBytes(24).toString("base64url"),
          status: status as typeof s.orders.$inferInsert.status,
          email: customer?.email ?? `convidado${i}@${DEMO_DOMAIN}`,
          customerName: name,
          phone: customer?.phone ?? "11999990000",
          shippingAddress: { recipient: name, cep, street: "Rua Exemplo", number: String(10 + i), district: "Centro", city, state },
          shippingMethod: shippingCost === 0 ? "standard" : pick(["standard", "express"]),
          shippingDays: "3 a 5 dias úteis",
          subtotal,
          discount,
          shippingCost,
          total: subtotal - discount + shippingCost,
          couponCode: discount ? "VANTA10" : null,
          stockReleased: true,
          createdAt,
          updatedAt: createdAt,
        })
        .returning();
      await tx.insert(s.orderItems).values(
        lines.map((l) => ({
          orderId: order.id,
          productId: l.v.productId,
          variantId: l.v.id,
          productName: l.v.product.name,
          productSlug: l.v.product.slug,
          imageUrl: l.v.product.images.find((im) => im.colorId === l.v.colorId)?.url ?? null,
          sizeLabel: l.v.size.label,
          colorName: l.v.color.name,
          sku: l.v.sku,
          unitPrice: l.unit,
          quantity: l.qty,
          lineTotal: l.unit * l.qty,
        })),
      );
      await tx.insert(s.orderStatusHistory).values({ orderId: order.id, status: order.status, note: "Pedido de demonstração gerado pelo painel.", createdAt });
      await tx.insert(s.payments).values({
        orderId: order.id,
        provider: "simulated",
        status: status === "pending" ? "pending" : status === "cancelled" ? "refunded" : "approved",
        amount: order.total,
        providerReference: `SIM-${order.number}`,
        isTest: true,
        createdAt,
      });
    });
    created++;
  }
  return { orders: created, customers: customers.length };
}

export async function removeDemoData() {
  const db = await getDb();
  await db.transaction(async (tx) => {
    await tx.delete(s.orders).where(like(s.orders.email, `%@${DEMO_DOMAIN}`));
    const demoProfiles = await tx.select({ id: s.profiles.id }).from(s.profiles).where(like(s.profiles.email, `%@${DEMO_DOMAIN}`));
    if (demoProfiles.length) {
      await tx.delete(s.orders).where(inArray(s.orders.userId, demoProfiles.map((p) => p.id)));
      await tx.delete(s.profiles).where(inArray(s.profiles.id, demoProfiles.map((p) => p.id)));
    }
  });
}

export async function countDemoOrders() {
  const db = await getDb();
  const [row] = await db.select({ n: sql<number>`count(*)::int` }).from(s.orders).where(like(s.orders.email, `%@${DEMO_DOMAIN}`));
  return row.n;
}

