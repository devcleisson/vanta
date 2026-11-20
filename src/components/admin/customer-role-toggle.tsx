"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { setCustomerRoleAction } from "@/server/actions/admin";

export function CustomerRoleToggle({ customerId, role, disabled }: { customerId: string; role: "customer" | "admin"; disabled?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const target = role === "admin" ? "customer" : "admin";
  return (
    <>
      <Button variant="outline" size="sm" disabled={disabled} onClick={() => setOpen(true)}>
        {role === "admin" ? "Remover acesso admin" : "Tornar administrador"}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={role === "admin" ? "Remover acesso de administrador?" : "Conceder acesso de administrador?"}
        description={role === "admin" ? "A pessoa perde o acesso ao painel imediatamente." : "A pessoa poderá ver pedidos, clientes e editar o catálogo."}
        confirmLabel="Confirmar"
        loading={pending}
        onConfirm={() =>
          start(async () => {
            const res = await setCustomerRoleAction(customerId, target);
            setOpen(false);
            if (res.ok) {
              toast.success(res.message ?? "Atualizado.");
              router.refresh();
            } else toast.error(res.error);
          })
        }
      />
    </>
  );
}
