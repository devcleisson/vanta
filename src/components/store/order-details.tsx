import { Check } from "lucide-react";
import { ORDER_STATUS_FLOW, ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL, SHIPPING_METHOD_LABEL } from "@/config/orders";
import { formatCep, formatDateTime, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { getOrderByNumber } from "@/server/services/orders";
import { ProductImage } from "./product-image";

type Order = NonNullable<Awaited<ReturnType<typeof getOrderByNumber>>>;

export function OrderProgress({ status }: { status: Order["status"] }) {
  if (status === "cancelled") {
    return <p className="border border-danger/40 bg-danger/5 px-4 py-3 text-[14px] text-danger">Este pedido foi cancelado.</p>;
  }
  const current = ORDER_STATUS_FLOW.indexOf(status);
  return (
    <ol className="grid grid-cols-5 gap-1" aria-label="Andamento do pedido">
      {ORDER_STATUS_FLOW.map((s, i) => (
        <li key={s} aria-current={i === current ? "step" : undefined}>
          <span className={cn("block h-1", i <= current ? "bg-ink" : "bg-stone")} />
          <span className={cn("mt-2 block text-[11px] leading-tight sm:text-[12px]", i <= current ? "text-ink" : "text-smoke", i === current && "font-semibold")}>
            {ORDER_STATUS_LABEL[s]}
          </span>
        </li>
      ))}
    </ol>
  );
}

export function OrderItemsAndTotals({ order }: { order: Order }) {
  return (
    <div>
      <ul className="divide-y divide-stone border-y border-stone">
        {order.items.map((item) => (
          <li key={item.id} className="flex gap-4 py-4">
            <div className="relative h-24 w-20 shrink-0 bg-concrete">
              {item.imageUrl && <ProductImage src={item.imageUrl} alt={item.productName} fill sizes="80px" className="object-cover" />}
            </div>
            <div className="flex-1 text-[14px]">
              <p className="font-medium">{item.productName}</p>
              <p className="text-smoke">
                {item.colorName}
                {item.sizeLabel !== "Único" && ` / ${item.sizeLabel}`} — {item.quantity} × {formatPrice(item.unitPrice)}
              </p>
              <p className="mt-0.5 text-[12px] text-smoke">SKU {item.sku}</p>
            </div>
            <p className="text-[14px] font-medium tabular-nums">{formatPrice(item.lineTotal)}</p>
          </li>
        ))}
      </ul>
      <dl className="ml-auto mt-5 max-w-sm space-y-2 text-[14px] tabular-nums">
        <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatPrice(order.subtotal)}</dd></div>
        {order.discount > 0 && (
          <div className="flex justify-between"><dt>Desconto ({order.couponCode})</dt><dd>−{formatPrice(order.discount)}</dd></div>
        )}
        <div className="flex justify-between">
          <dt>Frete ({SHIPPING_METHOD_LABEL[order.shippingMethod] ?? order.shippingMethod})</dt>
          <dd>{order.shippingCost === 0 ? "Grátis" : formatPrice(order.shippingCost)}</dd>
        </div>
        <div className="flex justify-between border-t border-ink pt-3 text-[16px] font-semibold"><dt>Total</dt><dd>{formatPrice(order.total)}</dd></div>
      </dl>
    </div>
  );
}

export function OrderInfoGrid({ order }: { order: Order }) {
  const a = order.shippingAddress;
  const payment = order.payments[0];
  return (
    <div className="grid gap-8 text-[14px] leading-relaxed sm:grid-cols-3">
      <div>
        <h3 className="mb-2 text-[13px] text-smoke">Entrega</h3>
        <p className="font-medium">{a.recipient}</p>
        <p>
          {a.street}, {a.number}
          {a.complement && ` — ${a.complement}`}
        </p>
        <p>{a.district}</p>
        <p>
          {a.city}/{a.state} — CEP {formatCep(a.cep)}
        </p>
      </div>
      <div>
        <h3 className="mb-2 text-[13px] text-smoke">Envio</h3>
        <p className="font-medium">{SHIPPING_METHOD_LABEL[order.shippingMethod] ?? order.shippingMethod}</p>
        <p>{order.shippingDays}</p>
        <p className="mt-3 text-smoke">{order.email}</p>
      </div>
      <div>
        <h3 className="mb-2 text-[13px] text-smoke">Pagamento</h3>
        {payment ? (
          <>
            <p className="font-medium">
              {payment.provider === "stripe" ? "Cartão via Stripe" : "Pagamento simulado"} — {PAYMENT_STATUS_LABEL[payment.status]}
            </p>
            <p className="text-smoke">
              {payment.provider === "simulated"
                ? "Modo demonstração: nenhuma cobrança foi realizada."
                : "Ambiente de teste do Stripe: nenhuma cobrança real."}
            </p>
          </>
        ) : (
          <p className="text-smoke">Aguardando pagamento.</p>
        )}
      </div>
    </div>
  );
}

export function OrderTimeline({ order }: { order: Order }) {
  return (
    <ol className="space-y-4 border-l border-stone pl-5">
      {[...order.history].reverse().map((h) => (
        <li key={h.id} className="relative text-[14px]">
          <span className="absolute -left-[25px] top-1 inline-flex size-[9px] rounded-full bg-ink" aria-hidden />
          <p className="font-medium">{ORDER_STATUS_LABEL[h.status]}</p>
          {h.note && <p className="text-graphite">{h.note}</p>}
          <p className="text-[12px] text-smoke">{formatDateTime(h.createdAt)}</p>
        </li>
      ))}
    </ol>
  );
}

export function OrderSuccessMark() {
  return (
    <span className="inline-flex size-12 items-center justify-center rounded-full bg-ink text-paper">
      <Check className="size-6" />
    </span>
  );
}
