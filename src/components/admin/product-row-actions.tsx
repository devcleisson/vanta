"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { deleteProductAction, setProductFlagAction } from "@/server/actions/admin";

type Flag = "isActive" | "isNew" | "isBestSeller" | "isFeatured";

export function FlagToggle({ productId, flag, value, label }: { productId: string; flag: Flag; value: boolean; label: string }) {
  const router = useRouter();
  const [optimistic, setOptimistic] = useState(value);
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={optimistic}
      aria-label={label}
      title={label}
      disabled={pending}
      onClick={() =>
        start(async () => {
          setOptimistic(!optimistic);
          const res = await setProductFlagAction(productId, flag, !optimistic);
          if (!res.ok) {
            setOptimistic(optimistic);
            toast.error(res.error);
          } else router.refresh();
        })
      }
      className={cn("relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors", optimistic ? "bg-ink" : "bg-stone")}
    >
      <span className={cn("absolute top-0.5 size-4 rounded-full bg-paper shadow transition-transform", optimistic ? "translate-x-[18px]" : "translate-x-0.5")} />
    </button>
  );
}

export function DeleteProductButton({ productId, name, redirectTo }: { productId: string; name: string; redirectTo?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="text-[13px] text-danger underline-offset-4 hover:underline">
        Excluir
      </button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Excluir produto?"
        description={`“${name}” e todas as suas variações serão excluídos. Pedidos antigos mantêm o histórico. Para apenas tirar da loja, desative o produto.`}
        confirmLabel="Excluir produto"
        loading={pending}
        onConfirm={() =>
          start(async () => {
            const res = await deleteProductAction(productId);
            setOpen(false);
            if (res.ok) {
              toast.success(res.message ?? "Excluído.");
              if (redirectTo) router.push(redirectTo);
              router.refresh();
            } else toast.error(res.error);
          })
        }
      />
    </>
  );
}
