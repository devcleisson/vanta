import "server-only";
import { and, asc, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { getDb, schema as s } from "@/server/db/client";
import { PAID_STATUSES } from "./dashboard";

const paidList = sql.raw(PAID_STATUSES.map((x) => `'${x}'`).join(","));

export async function listCustomers(filters: { q?: string; segment?: string; sort?: string }) {
  const db = await getDb();
  const ordersCount = sql<number>`(select count(*) from orders o where o.user_id = "profiles"."id")::int`;
  const spent = sql<number>`(select coalesce(sum(o.total),0) from orders o where o.user_id = "profiles"."id" and o.status in (${paidList}))::int`;
  const lastOrder = sql<Date | null>`(select max(o.created_at) from orders o where o.user_id = "profiles"."id")`;

  const where: SQL[] = [];
  if (filters.q) where.push(or(ilike(s.profiles.email, `%${filters.q}%`), ilike(s.profiles.fullName, `%${filters.q}%`))!);
  if (filters.segment === "buyers") where.push(sql`${ordersCount} > 0`);
  if (filters.segment === "no-orders") where.push(sql`${ordersCount} = 0`);
  if (filters.segment === "admins") where.push(eq(s.profiles.role, "admin"));

  const order =
    filters.sort === "spent" ? [desc(spent)] : filters.sort === "orders" ? [desc(ordersCount)] : filters.sort === "name" ? [asc(s.profiles.fullName)] : [desc(s.profiles.createdAt)];

  return db
    .select({
      id: s.profiles.id,
      email: s.profiles.email,
      fullName: s.profiles.fullName,
      role: s.profiles.role,
      createdAt: s.profiles.createdAt,
      orders: ordersCount,
      spent,
      lastOrder,
    })
    .from(s.profiles)
    .where(where.length ? and(...where) : undefined)
    .orderBy(...order)
    .limit(200);
}

export async function getCustomer(id: string) {
  const db = await getDb();
  const profile = await db.query.profiles.findFirst({
    where: eq(s.profiles.id, id),
    columns: { passwordHash: false },
    with: {
      addresses: true,
      orders: { orderBy: (o, { desc }) => [desc(o.createdAt)], with: { items: true } },
    },
  });
  if (!profile) return null;
  const paid = profile.orders.filter((o) => (PAID_STATUSES as readonly string[]).includes(o.status));
  const spent = paid.reduce((n, o) => n + o.total, 0);
  const itemsBought = paid.reduce((n, o) => n + o.items.reduce((m, i) => m + i.quantity, 0), 0);
  return { ...profile, stats: { spent, itemsBought, orders: profile.orders.length, avgTicket: paid.length ? Math.round(spent / paid.length) : 0 } };
}

export async function setCustomerRole(id: string, role: "customer" | "admin") {
  const db = await getDb();
  await db.update(s.profiles).set({ role }).where(eq(s.profiles.id, id));
}
