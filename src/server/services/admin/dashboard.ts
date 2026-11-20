import "server-only";
import { and, count, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { siteConfig } from "@/config/site";
import { getDb, schema as s } from "@/server/db/client";

export const PAID_STATUSES = ["payment_approved", "preparing", "shipped", "delivered"] as const;

export type DashboardData = Awaited<ReturnType<typeof getDashboard>>;

const DAY = 86_400_000;

export async function getDashboard(days: number) {
  const db = await getDb();
  const since = new Date(Date.now() - days * DAY);
  const prevSince = new Date(Date.now() - 2 * days * DAY);
  const paid = inArray(s.orders.status, [...PAID_STATUSES]);

  const periodTotals = (from: Date, to?: Date) =>
    db
      .select({
        revenue: sql<number>`coalesce(sum(${s.orders.total}), 0)::int`,
        orders: sql<number>`count(*)::int`,
      })
      .from(s.orders)
      .where(and(paid, gte(s.orders.createdAt, from), to ? lte(s.orders.createdAt, to) : undefined));

  const [
    [current],
    [previous],
    [itemsSold],
    [lowStock],
    [customers],
    [newCustomers],
    [allOrders],
    daily,
    topProducts,
    statusDist,
    monthly,
    lowStockList,
    recentOrders,
  ] = await Promise.all([
    periodTotals(since),
    periodTotals(prevSince, since),
    db
      .select({ value: sql<number>`coalesce(sum(${s.orderItems.quantity}), 0)::int` })
      .from(s.orderItems)
      .innerJoin(s.orders, eq(s.orders.id, s.orderItems.orderId))
      .where(and(paid, gte(s.orders.createdAt, since))),
    db
      .select({ value: count() })
      .from(s.productVariants)
      .innerJoin(s.products, eq(s.products.id, s.productVariants.productId))
      .where(and(eq(s.products.isActive, true), lte(s.productVariants.stock, siteConfig.lowStockThreshold))),
    db.select({ value: count() }).from(s.profiles).where(eq(s.profiles.role, "customer")),
    db.select({ value: count() }).from(s.profiles).where(and(eq(s.profiles.role, "customer"), gte(s.profiles.createdAt, since))),
    db.select({ value: count() }).from(s.orders),
    db
      .select({
        day: sql<string>`to_char(date_trunc('day', ${s.orders.createdAt} at time zone 'America/Sao_Paulo'), 'YYYY-MM-DD')`,
        revenue: sql<number>`coalesce(sum(${s.orders.total}), 0)::int`,
        orders: sql<number>`count(*)::int`,
      })
      .from(s.orders)
      .where(and(paid, gte(s.orders.createdAt, since)))
      .groupBy(sql`1`)
      .orderBy(sql`1`),
    db
      .select({
        name: s.orderItems.productName,
        quantity: sql<number>`sum(${s.orderItems.quantity})::int`,
        revenue: sql<number>`sum(${s.orderItems.lineTotal})::int`,
      })
      .from(s.orderItems)
      .innerJoin(s.orders, eq(s.orders.id, s.orderItems.orderId))
      .where(and(paid, gte(s.orders.createdAt, since)))
      .groupBy(s.orderItems.productName)
      .orderBy(desc(sql`sum(${s.orderItems.quantity})`))
      .limit(6),
    db
      .select({ status: s.orders.status, value: sql<number>`count(*)::int` })
      .from(s.orders)
      .where(gte(s.orders.createdAt, since))
      .groupBy(s.orders.status),
    db
      .select({
        month: sql<string>`to_char(date_trunc('month', ${s.orders.createdAt} at time zone 'America/Sao_Paulo'), 'YYYY-MM')`,
        revenue: sql<number>`coalesce(sum(${s.orders.total}), 0)::int`,
      })
      .from(s.orders)
      .where(and(paid, gte(s.orders.createdAt, new Date(Date.now() - 365 * DAY))))
      .groupBy(sql`1`)
      .orderBy(sql`1`),
    db
      .select({
        variantId: s.productVariants.id,
        productId: s.products.id,
        name: s.products.name,
        sku: s.productVariants.sku,
        stock: s.productVariants.stock,
      })
      .from(s.productVariants)
      .innerJoin(s.products, eq(s.products.id, s.productVariants.productId))
      .where(and(eq(s.products.isActive, true), lte(s.productVariants.stock, siteConfig.lowStockThreshold)))
      .orderBy(s.productVariants.stock, s.products.name)
      .limit(8),
    db.select().from(s.orders).orderBy(desc(s.orders.createdAt)).limit(6),
  ]);

  // Fill missing days so the time series is continuous.
  const series: { day: string; revenue: number; orders: number }[] = [];
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" });
  for (let i = days - 1; i >= 0; i--) {
    const key = fmt.format(new Date(Date.now() - i * DAY));
    const hit = daily.find((d) => d.day === key);
    series.push({ day: key, revenue: hit?.revenue ?? 0, orders: hit?.orders ?? 0 });
  }

  const avgTicket = current.orders ? Math.round(current.revenue / current.orders) : 0;
  const prevAvg = previous.orders ? Math.round(previous.revenue / previous.orders) : 0;
  const delta = (a: number, b: number) => (b === 0 ? null : (a - b) / b);

  return {
    days,
    hasData: allOrders.value > 0,
    kpis: {
      revenue: current.revenue,
      revenueDelta: delta(current.revenue, previous.revenue),
      orders: current.orders,
      ordersDelta: delta(current.orders, previous.orders),
      avgTicket,
      avgTicketDelta: delta(avgTicket, prevAvg),
      itemsSold: itemsSold.value,
      lowStock: lowStock.value,
      customers: customers.value,
      newCustomers: newCustomers.value,
    },
    series,
    topProducts,
    statusDist,
    monthly,
    lowStockList,
    recentOrders,
  };
}
