"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog, Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/misc";
import { formatDate, formatPrice } from "@/lib/format";
import { slugify } from "@/lib/utils";
import { categoryFormSchema, colorFormSchema, couponFormSchema, sizeFormSchema } from "@/schemas/admin";
import {
  deleteCategoryAction,
  deleteColorAction,
  deleteCouponAction,
  deleteSizeAction,
  saveCategoryAction,
  saveColorAction,
  saveCouponAction,
  saveSizeAction,
} from "@/server/actions/admin";
import type { ActionResult } from "@/server/actions/result";
import { Panel, Table } from "./ui";

function useMutation() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<ActionResult<unknown>>, after?: () => void) =>
    start(async () => {
      const res = await fn();
      if (res.ok) {
        toast.success(res.message ?? "Salvo.");
        after?.();
        router.refresh();
      } else toast.error(res.error);
    });
  return { pending, run };
}

function DeleteLink({ label, description, onConfirm }: { label: string; description: string; onConfirm: () => Promise<ActionResult<unknown>> }) {
  const [open, setOpen] = useState(false);
  const { pending, run } = useMutation();
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="text-[13px] text-danger underline-offset-4 hover:underline">Excluir</button>
      <ConfirmDialog open={open} onOpenChange={setOpen} title={label} description={description} confirmLabel="Excluir" loading={pending} onConfirm={() => run(onConfirm, () => setOpen(false))} />
    </>
  );
}

/* ───────────── Categories ───────────── */

type Category = { id: string; name: string; slug: string; description: string | null; imageUrl: string | null; sortOrder: number; products: number };

export function CategoriesManager({ categories }: { categories: Category[] }) {
  const [editing, setEditing] = useState<Category | "new" | null>(null);
  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setEditing("new")}>Nova categoria</Button>
      </div>
      <Panel>
        <Table>
          <thead>
            <tr><th>Ordem</th><th>Nome</th><th>URL</th><th>Produtos</th><th className="text-right">Ações</th></tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id}>
                <td className="tabular-nums text-smoke">{c.sortOrder}</td>
                <td><p className="font-medium">{c.name}</p><p className="max-w-md truncate text-[12px] text-smoke">{c.description}</p></td>
                <td className="text-smoke">/shop/{c.slug}</td>
                <td className="tabular-nums">{c.products}</td>
                <td className="whitespace-nowrap text-right">
                  <button className="mr-4 text-[13px] hover:underline" onClick={() => setEditing(c)}>Editar</button>
                  <DeleteLink label="Excluir categoria?" description={`${c.products} produto(s) ficarão sem categoria. Eles continuam na loja.`} onConfirm={() => deleteCategoryAction(c.id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Panel>
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent title={editing === "new" ? "Nova categoria" : "Editar categoria"}>
          {editing && <CategoryForm category={editing === "new" ? null : editing} onDone={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>
    </>
  );
}

function CategoryForm({ category, onDone }: { category: Category | null; onDone: () => void }) {
  type In = z.input<typeof categoryFormSchema>;
  const { pending, run } = useMutation();
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<In>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: category
      ? { name: category.name, slug: category.slug, description: category.description ?? "", imageUrl: category.imageUrl ?? "", sortOrder: category.sortOrder }
      : { name: "", slug: "", description: "", imageUrl: "", sortOrder: 10 },
  });
  return (
    <form noValidate className="space-y-4" onSubmit={handleSubmit((d) => run(() => saveCategoryAction(d, category?.id), onDone))}>
      <Field label="Nome" htmlFor="c-name" error={errors.name?.message}>
        <Input id="c-name" {...register("name", { onChange: (e) => !category && setValue("slug", slugify(e.target.value)) })} />
      </Field>
      <Field label="URL" htmlFor="c-slug" error={errors.slug?.message}><Input id="c-slug" {...register("slug")} /></Field>
      <Field label="Descrição" htmlFor="c-desc" optional><Textarea id="c-desc" rows={3} {...register("description")} /></Field>
      <Field label="Imagem de capa (URL)" htmlFor="c-img" optional><Input id="c-img" {...register("imageUrl")} /></Field>
      <Field label="Ordem de exibição" htmlFor="c-order" error={errors.sortOrder?.message}><Input id="c-order" type="number" {...register("sortOrder")} /></Field>
      <Button type="submit" loading={pending} className="w-full">Salvar</Button>
    </form>
  );
}

/* ───────────── Sizes & colours ───────────── */

type Size = { id: string; label: string; sortOrder: number; used: number };
type Color = { id: string; name: string; hex: string; used: number };

export function AttributesManager({ sizes, colors }: { sizes: Size[]; colors: Color[] }) {
  const [size, setSize] = useState<Size | "new" | null>(null);
  const [color, setColor] = useState<Color | "new" | null>(null);
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Panel title="Tamanhos" action={<Button size="sm" onClick={() => setSize("new")}>Novo tamanho</Button>}>
        <Table>
          <thead><tr><th>Ordem</th><th>Tamanho</th><th>Em uso</th><th className="text-right">Ações</th></tr></thead>
          <tbody>
            {sizes.map((s) => (
              <tr key={s.id}>
                <td className="tabular-nums text-smoke">{s.sortOrder}</td>
                <td className="font-medium">{s.label}</td>
                <td className="tabular-nums">{s.used} variações</td>
                <td className="whitespace-nowrap text-right">
                  <button className="mr-4 text-[13px] hover:underline" onClick={() => setSize(s)}>Editar</button>
                  <DeleteLink label="Excluir tamanho?" description={s.used ? "Este tamanho está em uso e não pode ser excluído até sair dos produtos." : "O tamanho será removido."} onConfirm={() => deleteSizeAction(s.id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Panel>
      <Panel title="Cores" action={<Button size="sm" onClick={() => setColor("new")}>Nova cor</Button>}>
        <Table>
          <thead><tr><th>Cor</th><th>Hex</th><th>Em uso</th><th className="text-right">Ações</th></tr></thead>
          <tbody>
            {colors.map((c) => (
              <tr key={c.id}>
                <td><span className="inline-flex items-center gap-2 font-medium"><span className="size-4 rounded-full ring-1 ring-ink/20" style={{ backgroundColor: c.hex }} />{c.name}</span></td>
                <td className="font-mono text-[12px] text-smoke">{c.hex}</td>
                <td className="tabular-nums">{c.used} variações</td>
                <td className="whitespace-nowrap text-right">
                  <button className="mr-4 text-[13px] hover:underline" onClick={() => setColor(c)}>Editar</button>
                  <DeleteLink label="Excluir cor?" description={c.used ? "Esta cor está em uso e não pode ser excluída até sair dos produtos." : "A cor será removida."} onConfirm={() => deleteColorAction(c.id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Panel>

      <Dialog open={!!size} onOpenChange={(o) => !o && setSize(null)}>
        <DialogContent title={size === "new" ? "Novo tamanho" : "Editar tamanho"} className="max-w-sm">
          {size && <SizeForm size={size === "new" ? null : size} onDone={() => setSize(null)} />}
        </DialogContent>
      </Dialog>
      <Dialog open={!!color} onOpenChange={(o) => !o && setColor(null)}>
        <DialogContent title={color === "new" ? "Nova cor" : "Editar cor"} className="max-w-sm">
          {color && <ColorForm color={color === "new" ? null : color} onDone={() => setColor(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SizeForm({ size, onDone }: { size: Size | null; onDone: () => void }) {
  type In = z.input<typeof sizeFormSchema>;
  const { pending, run } = useMutation();
  const { register, handleSubmit, formState: { errors } } = useForm<In>({ resolver: zodResolver(sizeFormSchema), defaultValues: size ?? { label: "", sortOrder: 10 } });
  return (
    <form noValidate className="space-y-4" onSubmit={handleSubmit((d) => run(() => saveSizeAction(d, size?.id), onDone))}>
      <Field label="Tamanho" htmlFor="s-label" error={errors.label?.message}><Input id="s-label" placeholder="Ex.: 3XG" {...register("label")} /></Field>
      <Field label="Ordem" htmlFor="s-order" error={errors.sortOrder?.message} hint="Menor aparece primeiro."><Input id="s-order" type="number" {...register("sortOrder")} /></Field>
      <Button type="submit" loading={pending} className="w-full">Salvar</Button>
    </form>
  );
}

function ColorForm({ color, onDone }: { color: Color | null; onDone: () => void }) {
  type In = z.input<typeof colorFormSchema>;
  const { pending, run } = useMutation();
  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm<In>({ resolver: zodResolver(colorFormSchema), defaultValues: color ?? { name: "", hex: "#000000" } });
  const hex = useWatch({ control, name: "hex" });
  return (
    <form noValidate className="space-y-4" onSubmit={handleSubmit((d) => run(() => saveColorAction(d, color?.id), onDone))}>
      <Field label="Nome" htmlFor="co-name" error={errors.name?.message}><Input id="co-name" placeholder="Ex.: Washed Black" {...register("name")} /></Field>
      <Field label="Cor" htmlFor="co-hex" error={errors.hex?.message}>
        <div className="flex gap-2">
          <input type="color" aria-label="Seletor de cor" value={/^#[0-9a-f]{6}$/i.test(hex ?? "") ? hex : "#000000"} onChange={(e) => setValue("hex", e.target.value.toUpperCase(), { shouldValidate: true })} className="h-12 w-14 cursor-pointer border border-stone bg-paper p-1" />
          <Input id="co-hex" className="font-mono" {...register("hex")} />
        </div>
      </Field>
      <Button type="submit" loading={pending} className="w-full">Salvar</Button>
    </form>
  );
}

/* ───────────── Coupons ───────────── */

type Coupon = {
  id: string;
  code: string;
  description: string | null;
  type: "percent" | "fixed" | "free_shipping";
  value: number;
  minSubtotal: number;
  maxUses: number | null;
  usedCount: number;
  expiresAt: Date | null;
  isActive: boolean;
};

const couponValue = (c: Coupon) => (c.type === "percent" ? `${c.value}%` : c.type === "fixed" ? formatPrice(c.value) : "Frete grátis");

export function CouponsManager({ coupons }: { coupons: Coupon[] }) {
  const [editing, setEditing] = useState<Coupon | "new" | null>(null);
  return (
    <>
      <div className="mb-4 flex justify-end"><Button onClick={() => setEditing("new")}>Novo cupom</Button></div>
      <Panel>
        <Table>
          <thead><tr><th>Código</th><th>Benefício</th><th>Pedido mínimo</th><th>Usos</th><th>Validade</th><th>Status</th><th className="text-right">Ações</th></tr></thead>
          <tbody>
            {coupons.map((c) => {
              const expired = c.expiresAt && new Date(c.expiresAt).getTime() < Date.now();
              return (
                <tr key={c.id}>
                  <td><p className="font-mono font-semibold">{c.code}</p><p className="max-w-xs truncate text-[12px] text-smoke">{c.description}</p></td>
                  <td>{couponValue(c)}</td>
                  <td className="tabular-nums">{c.minSubtotal ? formatPrice(c.minSubtotal) : "—"}</td>
                  <td className="tabular-nums">{c.usedCount}{c.maxUses ? ` / ${c.maxUses}` : ""}</td>
                  <td>{c.expiresAt ? formatDate(c.expiresAt) : "Sem validade"}</td>
                  <td>{!c.isActive ? <Badge tone="outline">Inativo</Badge> : expired ? <Badge tone="danger">Expirado</Badge> : <Badge tone="success">Ativo</Badge>}</td>
                  <td className="whitespace-nowrap text-right">
                    <button className="mr-4 text-[13px] hover:underline" onClick={() => setEditing(c)}>Editar</button>
                    <DeleteLink label="Excluir cupom?" description={`O cupom ${c.code} deixará de funcionar imediatamente.`} onConfirm={() => deleteCouponAction(c.id)} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Panel>
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent title={editing === "new" ? "Novo cupom" : "Editar cupom"}>
          {editing && <CouponForm coupon={editing === "new" ? null : editing} onDone={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>
    </>
  );
}

function CouponForm({ coupon, onDone }: { coupon: Coupon | null; onDone: () => void }) {
  type In = z.input<typeof couponFormSchema>;
  const { pending, run } = useMutation();
  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm<In>({
    resolver: zodResolver(couponFormSchema),
    defaultValues: coupon
      ? {
          code: coupon.code,
          description: coupon.description ?? "",
          type: coupon.type,
          value: coupon.type === "fixed" ? coupon.value / 100 : coupon.value,
          minSubtotal: coupon.minSubtotal / 100,
          maxUses: coupon.maxUses ?? "",
          expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().slice(0, 10) : "",
          isActive: coupon.isActive,
        }
      : { code: "", description: "", type: "percent", value: 10, minSubtotal: 0, maxUses: "", expiresAt: "", isActive: true },
  });
  const type = useWatch({ control, name: "type" });
  const isActive = useWatch({ control, name: "isActive" });
  return (
    <form noValidate className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit((d) => run(() => saveCouponAction(d, coupon?.id), onDone))}>
      <Field label="Código" htmlFor="cp-code" error={errors.code?.message}><Input id="cp-code" className="font-mono uppercase" {...register("code")} /></Field>
      <Field label="Tipo" htmlFor="cp-type">
        <Select id="cp-type" {...register("type")}>
          <option value="percent">Percentual</option>
          <option value="fixed">Valor fixo</option>
          <option value="free_shipping">Frete grátis</option>
        </Select>
      </Field>
      {type !== "free_shipping" && (
        <Field label={type === "percent" ? "Desconto (%)" : "Desconto (R$)"} htmlFor="cp-value" error={errors.value?.message}>
          <Input id="cp-value" type="number" step="0.01" {...register("value")} />
        </Field>
      )}
      <Field label="Pedido mínimo (R$)" htmlFor="cp-min" error={errors.minSubtotal?.message}><Input id="cp-min" type="number" step="0.01" {...register("minSubtotal")} /></Field>
      <Field label="Limite de usos" htmlFor="cp-max" optional><Input id="cp-max" type="number" min={1} {...register("maxUses")} /></Field>
      <Field label="Válido até" htmlFor="cp-exp" optional><Input id="cp-exp" type="date" {...register("expiresAt")} /></Field>
      <Field label="Descrição" htmlFor="cp-desc" optional className="sm:col-span-2"><Input id="cp-desc" {...register("description")} /></Field>
      <label className="flex cursor-pointer items-center gap-3 text-[14px] sm:col-span-2">
        <Checkbox checked={Boolean(isActive)} onCheckedChange={(v) => setValue("isActive", Boolean(v))} /> Cupom ativo
      </label>
      <Button type="submit" loading={pending} className="sm:col-span-2">Salvar cupom</Button>
    </form>
  );
}
