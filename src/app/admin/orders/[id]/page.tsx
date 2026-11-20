import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderStatusControl } from "@/components/admin/order-status-control";
import { OrderStatusBadge } from "@/components/admin/status-badge";
import { PageHeader, Panel } from "@/components/admin/ui";
import { OrderInfoGrid, OrderItemsAndTotals, OrderProgress, OrderTimeline } from "@/components/store/order-details";
import { PAYMENT_STATUS_LABEL } from "@/config/orders";
import { formatCpf, formatDateTime, formatPhone, formatPrice } from "@/lib/format";
import { getAdminOrder } from "@/server/services/admin/orders-admin";

export const metadata = { title: "Pedido" };

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const order = await getAdminOrder(id);
  if (!order) notFound();

  return (
    <>
      <Link href="/admin/orders" className="text-[13px] text-smoke hover:text-ink">Pedidos</Link>
      <PageHeader
        title={order.number}
        description={`Criado em ${formatDateTime(order.createdAt)} — atualizado em ${formatDateTime(order.updatedAt)}`}
        actions={<OrderStatusBadge status={order.status} />}
      />
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <Panel title="Andamento"><div className="p-5"><OrderProgress status={order.status} /></div></Panel>
          <Panel title="Produtos comprados"><div className="p-5"><OrderItemsAndTotals order={order} /></div></Panel>
          <Panel title="Entrega e pagamento"><div className="p-5"><OrderInfoGrid order={order} /></div></Panel>
          <Panel title="Pagamentos">
            <ul className="divide-y divide-stone text-[14px]">
              {order.payments.map((p) => (
                <li key={p.id} className="flex flex-wrap justify-between gap-2 px-5 py-3">
                  <span>
                    {p.provider === "stripe" ? "Stripe" : "Simulado"} {p.isTest && <span className="text-smoke">(teste)</span>} — {PAYMENT_STATUS_LABEL[p.status]}
                    <span className="block font-mono text-[12px] text-smoke">{p.providerReference}</span>
                  </span>
                  <span className="tabular-nums">{formatPrice(p.amount)}</span>
                </li>
              ))}
              {!order.payments.length && <li className="px-5 py-3 text-smoke">Nenhum pagamento registrado.</li>}
            </ul>
          </Panel>
        </div>
        <div className="space-y-4">
          <Panel title="Alterar status"><div className="p-5"><OrderStatusControl orderId={order.id} status={order.status} /></div></Panel>
          <Panel title="Cliente">
            <div className="space-y-1 p-5 text-[14px]">
              <p className="font-medium">{order.customerName}</p>
              <p>{order.email}</p>
              <p>{formatPhone(order.phone)}</p>
              {order.cpf && <p className="text-smoke">CPF {formatCpf(order.cpf)}</p>}
              {order.user ? (
                <Link href={`/admin/customers/${order.user.id}`} className="mt-3 inline-block underline underline-offset-4">Ver perfil do cliente</Link>
              ) : (
                <p className="mt-3 text-smoke">Compra como visitante.</p>
              )}
            </div>
          </Panel>
          <Panel title="Histórico"><div className="p-5"><OrderTimeline order={order} /></div></Panel>
        </div>
      </div>
    </>
  );
}
