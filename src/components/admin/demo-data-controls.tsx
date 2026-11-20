"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { generateDemoDataAction, removeDemoDataAction } from "@/server/actions/admin";

export function GenerateDemoButton({ label = "Gerar dados de demonstração" }: { label?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      loading={pending}
      onClick={() =>
        start(async () => {
          const res = await generateDemoDataAction();
          if (res.ok) {
            toast.success(res.message ?? "Dados criados.");
            router.refresh();
          } else toast.error(res.error);
        })
      }
    >
      {label}
    </Button>
  );
}

export function RemoveDemoButton({ count }: { count: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  if (!count) return null;
  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        Remover {count} pedidos de demonstração
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Remover dados de demonstração?"
        description="Pedidos e clientes fictícios (@demo.vanta.store) serão excluídos. Pedidos reais não são afetados."
        confirmLabel="Remover"
        loading={pending}
        onConfirm={() =>
          start(async () => {
            const res = await removeDemoDataAction();
            setOpen(false);
            if (res.ok) {
              toast.success(res.message ?? "Removido.");
              router.refresh();
            } else toast.error(res.error);
          })
        }
      />
    </>
  );
}
