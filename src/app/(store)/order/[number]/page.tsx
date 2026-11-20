import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ClearCartOnConfirm } from "@/components/store/clear-cart-on-confirm";
import { OrderInfoGrid, OrderItemsAndTotals, OrderProgress, OrderSuccessMark, OrderTimeline } from "@/components/store/order-details";
import { ORDER_STATUS_LABEL } from "@/config/orders";
import { formatDateTime } from "@/lib/format";
import { getCurrentUser } from "@/server/auth/session";
import { canViewOrder, getOrderByNumber, syncStripeSession } from "@/server/services/orders";

export const metadata: Metadata = { title: "Pedido confirmado", robots: { index: false } };

type Props = {
  params: Promise<{ number: string }>;
  searchParams: Promise<{ token?: string; session_id?: string; cancelled?: string }>;
};

export default async function OrderPage({ params, searchParams }: Props) {
  const [{ number }, sp, user] = await Promise.all([params, searchParams, getCurrentUser()]);
  let order = await getOrderByNumber(number);
  if (!order || !canViewOrder(order, user, sp.token)) notFound();

  if (sp.session_id && order.status === "pending") {
    await syncStripeSession(order.id, sp.session_id);
    order = (await getOrderByNumber(number))!;
  }

  const paid = order.status !== "pending" && order.status !== "cancelled";
  const isSimulated = order.payments[0]?.provider === "simulated";

  return (
    <div className="container-x max-w-4xl pb-24 pt-12 md:pt-16">
      <ClearCartOnConfirm orderNumber={order.number} paid={paid} />
      <header className="mb-10">
        {paid && <OrderSuccessMark />}
        <h1 className="display mt-6 text-[clamp(2.25rem,6vw,4.5rem)]">
          {paid ? "Thank you" : order.status === "cancelled" ? "Order cancelled" : "Order received"}
        </h1>
        <p className="mt-4 text-[16px] text-graphite">
          {paid
            ? `Pedido ${order.number} confirmado. Usaremos ${order.email} para falar com você sobre a entrega.`
            : order.status === "cancelled"
              ? `O pedido ${order.number} foi cancelado e o estoque foi liberado.`
              : sp.cancelled
                ? `O pagamento do pedido ${order.number} não foi concluído. Os itens ficam reservados por 30 minutos.`
                : `Pedido ${order.number} registrado. Assim que o pagamento for confirmado, o status é atualizado aqui.`}
        </p>
        <p className="mt-1 text-[13px] text-smoke">
          Realizado em {formatDateTime(order.createdAt)} — status: {ORDER_STATUS_LABEL[order.status]}
        </p>
        {isSimulated && (
          <p className="mt-5 border border-warning/40 bg-warning/5 px-4 py-3 text-[13px] text-graphite">
            Pedido de demonstração: o pagamento foi simulado e nenhum valor foi cobrado.
          </p>
        )}
      </header>

      <div className="space-y-12">
        <OrderProgress status={order.status} />
        <OrderItemsAndTotals order={order} />
        <OrderInfoGrid order={order} />
        <section aria-labelledby="history-title">
          <h2 id="history-title" className="mb-5 text-[15px] font-semibold">Histórico</h2>
          <OrderTimeline order={order} />
        </section>
        <div className="flex flex-wrap gap-3 border-t border-stone pt-8">
          <Button asChild size="lg">
            <Link href="/shop">Continuar comprando</Link>
          </Button>
          {user ? (
            <Button asChild size="lg" variant="outline">
              <Link href="/account/orders">Meus pedidos</Link>
            </Button>
          ) : (
            <Button asChild size="lg" variant="outline">
              <Link href={`/register?next=/account/orders`}>Criar conta</Link>
            </Button>
          )}
        </div>
        {!user && (
          <p className="text-[13px] text-smoke">
            Guarde o link desta página: ele é o seu acesso ao acompanhamento do pedido.
          </p>
        )}
      </div>
    </div>
  );
}
