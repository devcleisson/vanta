import type { Metadata } from "next";
import { eq, sql } from "drizzle-orm";
import { AdminSidebar } from "@/components/admin/sidebar";
import { requireAdmin } from "@/server/auth/session";
import { getDb, schema as s } from "@/server/db/client";

export const metadata: Metadata = { title: { default: "Admin", template: "%s — VANTA Admin" }, robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const db = await getDb();
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(s.orders).where(eq(s.orders.status, "payment_approved"));
  return (
    <div className="min-h-dvh bg-concrete/60">
      <AdminSidebar user={{ name: user.fullName ?? "Administrador", email: user.email }} counts={{ pendingOrders: n }} />
      <main id="main" className="lg:pl-60">
        <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-10 lg:py-10">{children}</div>
      </main>
    </div>
  );
}
