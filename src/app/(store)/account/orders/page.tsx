import { Package } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge, EmptyState } from "@/components/ui/misc";
import { ProductImage } from "@/components/store/product-image";
import { ORDER_STATUS_LABEL } from "@/config/orders";
import { formatDate, formatPrice } from "@/lib/format";
import { requireUser } from "@/server/auth/session";
import { listOrdersForUser } from "@/server/services/orders";

export const metadata: Metadata = { title: "Meus pedidos", robots: { index: false } };

export default async function OrdersPage() {
  const user = await requireUser("/account/orders");
  const orders = await listOrdersForUser(user.id);
  if (!orders.length) {
    return (
      <EmptyState
        icon={<Package strokeWidth={1.25} />}
        title="Você ainda não fez pedidos"
        description="Quando fizer, você acompanha o status de cada um por aqui."
        action={<Button asChild><Link href="/shop">Ir para a loja</Link></Button>}
        className="border border-stone"
      />
    );
  }
  return (
    <ul className="space-y-4">
      {orders.map((o) => (
        <li key={o.id}>
          <Link href={`/order/${o.number}`} className="block border border-stone p-5 transition-colors hover:border-ink">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{o.number}</p>
                <p className="text-[13px] text-smoke">
                  {formatDate(o.createdAt)} — {o.items.reduce((n, i) => n + i.quantity, 0)} itens
                </p>
              </div>
              <div className="text-right">
                <Badge tone={o.status === "cancelled" ? "danger" : o.status === "delivered" ? "success" : "neutral"}>{ORDER_STATUS_LABEL[o.status]}</Badge>
                <p className="mt-1 text-[15px] font-medium tabular-nums">{formatPrice(o.total)}</p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              {o.items.slice(0, 5).map((i) => (
                <div key={i.id} className="relative h-16 w-13 bg-concrete">
                  {i.imageUrl && <ProductImage src={i.imageUrl} alt={i.productName} fill sizes="52px" className="object-cover" />}
                </div>
              ))}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
