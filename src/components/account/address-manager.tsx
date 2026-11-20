"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog, Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/input";
import { Badge, EmptyState } from "@/components/ui/misc";
import { useViaCep } from "@/hooks/use-viacep";
import { formatCep, formatPhone } from "@/lib/format";
import { BR_STATES } from "@/lib/validators";
import { savedAddressSchema, type SavedAddressInput } from "@/schemas/account";
import { deleteAddressAction, saveAddressAction } from "@/server/actions/account";

export type AddressRow = {
  id: string;
  label: string;
  recipient: string;
  phone: string | null;
  cep: string;
  street: string;
  number: string;
  complement: string | null;
  district: string;
  city: string;
  state: string;
  isDefault: boolean;
};

export function AddressManager({ addresses }: { addresses: AddressRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<AddressRow | "new" | null>(null);
  const [deleting, setDeleting] = useState<AddressRow | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-[17px] font-semibold">Endereços salvos</h2>
        <Button onClick={() => setEditing("new")}>Adicionar endereço</Button>
      </div>
      {addresses.length === 0 ? (
        <EmptyState
          icon={<MapPin strokeWidth={1.25} />}
          title="Nenhum endereço salvo"
          description="Salve um endereço para finalizar compras mais rápido."
          className="border border-stone"
        />
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {addresses.map((a) => (
            <li key={a.id} className="flex flex-col border border-stone p-5 text-[14px] leading-relaxed">
              <div className="mb-2 flex items-center gap-2">
                <p className="font-semibold">{a.label}</p>
                {a.isDefault && <Badge tone="ink">Padrão</Badge>}
              </div>
              <p>{a.recipient}</p>
              <p>
                {a.street}, {a.number}
                {a.complement && ` — ${a.complement}`}
              </p>
              <p>
                {a.district}, {a.city}/{a.state}
              </p>
              <p>CEP {formatCep(a.cep)}</p>
              <div className="mt-4 flex gap-4 text-[13px]">
                <button className="underline underline-offset-4" onClick={() => setEditing(a)}>Editar</button>
                <button className="text-danger underline underline-offset-4" onClick={() => setDeleting(a)}>Excluir</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent title={editing === "new" ? "Novo endereço" : "Editar endereço"} className="max-w-2xl">
          {editing && (
            <AddressForm
              address={editing === "new" ? null : editing}
              onSaved={() => {
                setEditing(null);
                router.refresh();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Excluir endereço?"
        description={deleting ? `O endereço “${deleting.label}” será removido da sua conta.` : ""}
        confirmLabel="Excluir"
        loading={busy}
        onConfirm={async () => {
          if (!deleting) return;
          setBusy(true);
          const res = await deleteAddressAction(deleting.id);
          setBusy(false);
          setDeleting(null);
          if (res.ok) {
            toast.success("Endereço excluído");
            router.refresh();
          } else toast.error(res.error);
        }}
      />
    </div>
  );
}

function AddressForm({ address, onSaved }: { address: AddressRow | null; onSaved: () => void }) {
  const { register, handleSubmit, formState, setValue, control } = useForm<SavedAddressInput>({
    resolver: zodResolver(savedAddressSchema),
    defaultValues: address
      ? { ...address, cep: formatCep(address.cep), complement: address.complement ?? "", phone: address.phone ? formatPhone(address.phone) : "", state: address.state as SavedAddressInput["state"] }
      : { label: "Casa", isDefault: false },
  });
  const cep = useWatch({ control, name: "cep" });
  const isDefault = useWatch({ control, name: "isDefault" });
  const status = useViaCep(
    cep,
    (r) => {
      const o = { shouldValidate: true };
      if (r.street) setValue("street", r.street, o);
      if (r.district) setValue("district", r.district, o);
      if (r.city) setValue("city", r.city, o);
      if (r.state) setValue("state", r.state as SavedAddressInput["state"], o);
    },
    address?.cep,
  );
  const e = formState.errors;

  return (
    <form
      noValidate
      className="grid gap-4 sm:grid-cols-6"
      onSubmit={handleSubmit(async (data) => {
        const res = await saveAddressAction(data, address?.id);
        if (res.ok) {
          toast.success(res.message ?? "Endereço salvo");
          onSaved();
        } else toast.error(res.error);
      })}
    >
      <Field label="Nome do endereço" htmlFor="label" error={e.label?.message} className="sm:col-span-3">
        <Input id="label" placeholder="Casa, Trabalho…" {...register("label")} />
      </Field>
      <Field label="CEP" htmlFor="a-cep" error={e.cep?.message ?? (status === "error" ? "CEP não encontrado." : undefined)} hint={status === "loading" ? "Buscando…" : undefined} className="sm:col-span-3">
        <Input id="a-cep" inputMode="numeric" {...register("cep", { onChange: (ev) => (ev.target.value = formatCep(ev.target.value)) })} />
      </Field>
      <Field label="Endereço" htmlFor="a-street" error={e.street?.message} className="sm:col-span-4">
        <Input id="a-street" {...register("street")} />
      </Field>
      <Field label="Número" htmlFor="a-number" error={e.number?.message} className="sm:col-span-2">
        <Input id="a-number" {...register("number")} />
      </Field>
      <Field label="Complemento" htmlFor="a-complement" optional className="sm:col-span-3">
        <Input id="a-complement" {...register("complement")} />
      </Field>
      <Field label="Bairro" htmlFor="a-district" error={e.district?.message} className="sm:col-span-3">
        <Input id="a-district" {...register("district")} />
      </Field>
      <Field label="Cidade" htmlFor="a-city" error={e.city?.message} className="sm:col-span-4">
        <Input id="a-city" {...register("city")} />
      </Field>
      <Field label="Estado" htmlFor="a-state" error={e.state?.message} className="sm:col-span-2">
        <Select id="a-state" {...register("state")}>
          <option value="">UF</option>
          {BR_STATES.map((uf) => (
            <option key={uf} value={uf}>{uf}</option>
          ))}
        </Select>
      </Field>
      <Field label="Destinatário" htmlFor="a-recipient" error={e.recipient?.message} className="sm:col-span-3">
        <Input id="a-recipient" {...register("recipient")} />
      </Field>
      <Field label="Telefone" htmlFor="a-phone" optional className="sm:col-span-3">
        <Input id="a-phone" type="tel" {...register("phone", { onChange: (ev) => (ev.target.value = formatPhone(ev.target.value)) })} />
      </Field>
      <label className="flex cursor-pointer items-center gap-3 text-[14px] sm:col-span-6">
        <Checkbox checked={Boolean(isDefault)} onCheckedChange={(v) => setValue("isDefault", Boolean(v))} />
        Usar como endereço padrão
      </label>
      <div className="sm:col-span-6">
        <Button type="submit" loading={formState.isSubmitting} className="w-full sm:w-auto">Salvar endereço</Button>
      </div>
    </form>
  );
}
