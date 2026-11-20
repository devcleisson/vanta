import "server-only";
import { and, desc, eq, gte, ilike, lte, or, sql, type SQL } from "drizzle-orm";
import { getDb, schema as s } from "@/server/db/client";
import type { OrderStatus } from "@/schemas/admin";

export async function listAdminOrders(filters: { q?: string; status?: string; from?: string; to?: string; page?: number }) {
  const db = await getDb();
  const where: SQL[] = [];
  if (filters.q) {
    const term = `%${filters.q.trim()}%`;
    where.push(or(ilike(s.orders.number, term), ilike(s.orders.email, term), ilike(s.orders.customerName, term))!);
  }
  if (filters.status) where.push(eq(s.orders.status, filters.status as OrderStatus));
  if (filters.from) where.push(gte(s.orders.createdAt, new Date(`${filters.from}T00:00:00-03:00`)));
  if (filters.to) where.push(lte(s.orders.createdAt, new Date(`${filters.to}T23:59:59-03:00`)));
  const condition = where.length ? and(...where) : undefined;
  const perPage = 25;
  const page = Math.max(1, filters.page ?? 1);

  const [rows, [{ total }], counts] = await Promise.all([
    db
      .select({
        id: s.orders.id,
        number: s.orders.number,
        status: s.orders.status,
        customerName: s.orders.customerName,
        email: s.orders.email,
        total: s.orders.total,
        createdAt: s.orders.createdAt,
        items: sql<number>`(select coalesce(sum(oi.quantity),0) from order_items oi where oi.order_id = "orders"."id")::int`,
        paymentProvider: sql<string | null>`(select p.provider from payments p where p.order_id = "orders"."id" order by p.created_at desc limit 1)`,
      })
      .from(s.orders)
      .where(condition)
      .orderBy(desc(s.orders.createdAt))
      .limit(perPage)
      .offset((page - 1) * perPage),
    db.select({ total: sql<number>`count(*)::int` }).from(s.orders).where(condition),
    db.select({ status: s.orders.status, n: sql<number>`count(*)::int` }).from(s.orders).groupBy(s.orders.status),
  ]);
  return { rows, total, page, pageCount: Math.max(1, Math.ceil(total / perPage)), counts };
}

export async function getAdminOrder(id: string) {
  const db = await getDb();
  return db.query.orders.findFirst({
    where: eq(s.orders.id, id),
    with: {
      items: true,
      history: { orderBy: (h, { asc }) => [asc(h.createdAt)] },
      payments: { orderBy: (p, { desc }) => [desc(p.createdAt)] },
      user: { columns: { id: true, email: true, fullName: true, createdAt: true } },
    },
  });
}
