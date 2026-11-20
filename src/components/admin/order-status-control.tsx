"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/input";
import { ORDER_STATUS_LABEL, ORDER_TRANSITIONS } from "@/config/orders";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/schemas/admin";
import { changeOrderStatusAction } from "@/server/actions/admin";

export function OrderStatusControl({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const router = useRouter();
  const next = ORDER_TRANSITIONS[status];
  const [selected, setSelected] = useState<OrderStatus | null>(next.find((s) => s !== "cancelled") ?? null);
  const [note, setNote] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [pending, start] = useTransition();

  if (!next.length) {
    return <p className="text-[14px] text-smoke">Este pedido está {status === "delivered" ? "concluído" : "cancelado"} e não admite novas mudanças de status.</p>;
  }

  const apply = (target: OrderStatus) =>
    start(async () => {
      const res = await changeOrderStatusAction(orderId, target, note);
      if (res.ok) {
        toast.success(`Status: ${ORDER_STATUS_LABEL[target]}`);
        setNote("");
        setConfirmCancel(false);
        router.refresh();
      } else toast.error(res.error);
    });

  return (
    <div className="space-y-4">
      <fieldset>
        <legend className="mb-2 text-[13px] text-smoke">Próximo status</legend>
        <div className="flex flex-wrap gap-1.5">
          {next.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={selected === s}
              onClick={() => setSelected(s)}
              className={cn(
                "h-10 border px-3 text-[13px] font-medium",
                selected === s ? (s === "cancelled" ? "border-danger bg-danger text-paper" : "border-ink bg-ink text-paper") : "border-stone hover:border-ink",
              )}
            >
              {ORDER_STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor="status-note" className="mb-1.5 block text-[13px] text-smoke">Observação (opcional, aparece no histórico)</label>
        <Textarea id="status-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex.: código de rastreio BR123456789" className="min-h-0" />
      </div>
      <Button
        className="w-full"
        variant={selected === "cancelled" ? "danger" : "primary"}
        disabled={!selected}
        loading={pending}
        onClick={() => (selected === "cancelled" ? setConfirmCancel(true) : selected && apply(selected))}
      >
        {selected ? `Marcar como ${ORDER_STATUS_LABEL[selected].toLowerCase()}` : "Selecione um status"}
      </Button>
      <ConfirmDialog
        open={confirmCancel}
        onOpenChange={setConfirmCancel}
        title="Cancelar pedido?"
        description="O estoque dos itens volta para a loja e o uso do cupom é estornado. Esta ação não pode ser desfeita."
        confirmLabel="Cancelar pedido"
        loading={pending}
        onConfirm={() => apply("cancelled")}
      />
    </div>
  );
}
