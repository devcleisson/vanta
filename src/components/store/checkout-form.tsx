"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Lock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, Input, Select } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/misc";
import { useCartQuote } from "@/hooks/use-cart-quote";
import { useHydrated } from "@/hooks/use-hydrated";
import { formatCep, formatCpf, formatPhone, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { BR_STATES } from "@/lib/validators";
import { checkoutSchema } from "@/schemas/checkout";
import { placeOrderAction } from "@/server/actions/checkout";
import { useCart } from "@/stores/cart-store";
import { EmptyCart } from "./cart-drawer";
import { CouponForm, TotalsTable } from "./cart-summary";
import { ProductImage } from "./product-image";

const formSchema = checkoutSchema.omit({ items: true, couponCode: true });
type FormInput = z.input<typeof formSchema>;

export type CheckoutDefaults = {
  signedIn: boolean;
  email?: string;
  fullName?: string;
  phone?: string;
  cpf?: string;
  address?: Partial<FormInput["address"]>;
};

function Section({ step, title, children }: { step: number; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={`step-${step}`} className="border-t border-ink pt-6">
      <h2 id={`step-${step}`} className="mb-6 flex items-baseline gap-3 text-[17px] font-semibold">
        <span className="text-smoke tabular-nums">{step}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export function CheckoutForm({ defaults, paymentMode }: { defaults: CheckoutDefaults; paymentMode: "stripe" | "simulated" }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const items = useCart((s) => s.items);
  const couponCode = useCart((s) => s.couponCode);
  const storeCep = useCart((s) => s.cep);
  const setCep = useCart((s) => s.setCep);
  const shippingMethod = useCart((s) => s.shippingMethod);
  const setShippingMethod = useCart((s) => s.setShippingMethod);
  const clearCart = useCart((s) => s.clear);
  const { quote, refreshing } = useCartQuote(hydrated);
  const [serverError, setServerError] = useState<string | null>(null);
  const [cepLookup, setCepLookup] = useState<"idle" | "loading" | "error">("idle");
  const [placing, setPlacing] = useState(false);

  const form = useForm<FormInput>({
    resolver: zodResolver(formSchema),
    mode: "onTouched",
    defaultValues: {
      fullName: defaults.fullName ?? "",
      email: defaults.email ?? "",
      phone: defaults.phone ? formatPhone(defaults.phone) : "",
      cpf: defaults.cpf ? formatCpf(defaults.cpf) : "",
      address: {
        recipient: defaults.address?.recipient ?? defaults.fullName ?? "",
        cep: defaults.address?.cep ? formatCep(defaults.address.cep) : storeCep ? formatCep(storeCep) : "",
        street: defaults.address?.street ?? "",
        number: defaults.address?.number ?? "",
        complement: defaults.address?.complement ?? "",
        district: defaults.address?.district ?? "",
        city: defaults.address?.city ?? "",
        state: (defaults.address?.state as FormInput["address"]["state"]) ?? ("" as FormInput["address"]["state"]),
      },
      shippingMethod: (shippingMethod as FormInput["shippingMethod"]) ?? "standard",
      saveAddress: defaults.signedIn && !defaults.address,
    },
  });
  const { register, handleSubmit, setValue, formState, control } = form;
  const errors = formState.errors;
  const cep = useWatch({ control, name: "address.cep" });
  const method = useWatch({ control, name: "shippingMethod" });
  const saveAddress = useWatch({ control, name: "saveAddress" });

  // Keep the shared cart state (and therefore the server quote) in sync with the form.
  useEffect(() => {
    const digits = (cep ?? "").replace(/\D/g, "");
    setCep(digits.length === 8 ? digits : null);
  }, [cep, setCep]);
  useEffect(() => setShippingMethod(method ?? "standard"), [method, setShippingMethod]);

  // Address autofill via ViaCEP (public API, no credentials).
  useEffect(() => {
    const digits = (cep ?? "").replace(/\D/g, "");
    if (digits.length !== 8 || digits === defaults.address?.cep) return;
    const controller = new AbortController();
    setCepLookup("loading");
    fetch(`https://viacep.com.br/ws/${digits}/json/`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data: { erro?: boolean; logradouro?: string; bairro?: string; localidade?: string; uf?: string }) => {
        if (data.erro) {
          setCepLookup("error");
          return;
        }
        const opts = { shouldValidate: true, shouldDirty: true };
        if (data.logradouro) setValue("address.street", data.logradouro, opts);
        if (data.bairro) setValue("address.district", data.bairro, opts);
        if (data.localidade) setValue("address.city", data.localidade, opts);
        if (data.uf) setValue("address.state", data.uf as FormInput["address"]["state"], opts);
        setCepLookup("idle");
        document.getElementById("address.number")?.focus();
      })
      .catch((e) => {
        if (e?.name !== "AbortError") setCepLookup("error");
      });
    return () => controller.abort();
  }, [cep, setValue, defaults.address?.cep]);

  const onSubmit = handleSubmit(async (data) => {
    setServerError(null);
    setPlacing(true);
    const res = await placeOrderAction({ ...data, items, couponCode: couponCode ?? "" });
    if (!res.ok) {
      setPlacing(false);
      setServerError(res.error);
      if (res.fieldErrors) {
        for (const [k, v] of Object.entries(res.fieldErrors)) form.setError(k as keyof FormInput, { message: v });
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (res.data.redirectUrl) {
      // Stripe-hosted payment page (test mode). The cart is cleared after confirmation.
      sessionStorage.setItem("vanta-pending-order", res.data.orderNumber);
      window.location.href = res.data.redirectUrl;
      return;
    }
    clearCart();
    router.push(`/order/${res.data.orderNumber}?token=${res.data.token}`);
  });

  if (!hydrated || (items.length > 0 && !quote)) {
    return (
      <div className="grid gap-12 lg:grid-cols-[1fr_420px]">
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!items.length || !quote || !quote.lines.length) {
    return (
      <div className="border border-stone">
        <EmptyCart />
      </div>
    );
  }

  const e = (path: string) => {
    const parts = path.split(".");
    let cur: unknown = errors;
    for (const p of parts) cur = (cur as Record<string, unknown> | undefined)?.[p];
    return (cur as { message?: string } | undefined)?.message;
  };
  const inv = (path: string) => ({ "aria-invalid": Boolean(e(path)), "aria-describedby": e(path) ? `${path}-error` : undefined });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-12 lg:grid-cols-[1fr_420px] lg:gap-16">
      <div className="space-y-12">
        {serverError && (
          <div role="alert" className="border border-danger bg-danger/5 px-4 py-3 text-[14px] text-danger">
            {serverError}
          </div>
        )}

        <Section step={1} title="Identificação">
          {!defaults.signedIn && (
            <p className="-mt-2 mb-6 text-[14px] text-smoke">
              Já tem conta?{" "}
              <Link href="/login?next=/checkout" className="text-ink underline underline-offset-4">Entre</Link> para preencher seus dados e acompanhar o pedido.
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome completo" htmlFor="fullName" error={e("fullName")} className="sm:col-span-2">
              <Input id="fullName" autoComplete="name" {...register("fullName")} {...inv("fullName")} />
            </Field>
            <Field label="E-mail" htmlFor="email" error={e("email")} hint="Usado para contato sobre o pedido.">
              <Input id="email" type="email" autoComplete="email" {...register("email")} {...inv("email")} />
            </Field>
            <Field label="Telefone" htmlFor="phone" error={e("phone")}>
              <Input
                id="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel-national"
                placeholder="(11) 91234-5678"
                {...register("phone", { onChange: (ev) => (ev.target.value = formatPhone(ev.target.value)) })}
                {...inv("phone")}
              />
            </Field>
            <Field label="CPF" htmlFor="cpf" error={e("cpf")} hint="Necessário para a emissão da nota fiscal.">
              <Input
                id="cpf"
                inputMode="numeric"
                placeholder="000.000.000-00"
                {...register("cpf", { onChange: (ev) => (ev.target.value = formatCpf(ev.target.value)) })}
                {...inv("cpf")}
              />
            </Field>
          </div>
        </Section>

        <Section step={2} title="Endereço de entrega">
          <div className="grid gap-4 sm:grid-cols-6">
            <Field
              label="CEP"
              htmlFor="address.cep"
              error={e("address.cep") ?? (cepLookup === "error" ? "Não encontramos este CEP. Preencha o endereço manualmente." : undefined)}
              hint={cepLookup === "loading" ? "Buscando endereço…" : undefined}
              className="sm:col-span-2"
            >
              <Input
                id="address.cep"
                inputMode="numeric"
                autoComplete="postal-code"
                placeholder="00000-000"
                {...register("address.cep", { onChange: (ev) => (ev.target.value = formatCep(ev.target.value)) })}
                {...inv("address.cep")}
              />
            </Field>
            <div className="hidden sm:col-span-4 sm:flex sm:items-end sm:pb-3.5">
              <a href="https://buscacepinter.correios.com.br/" target="_blank" rel="noreferrer" className="text-[13px] underline underline-offset-4">
                Não sei meu CEP
              </a>
            </div>
            <Field label="Endereço" htmlFor="address.street" error={e("address.street")} className="sm:col-span-4">
              <Input id="address.street" autoComplete="address-line1" {...register("address.street")} {...inv("address.street")} />
            </Field>
            <Field label="Número" htmlFor="address.number" error={e("address.number")} className="sm:col-span-2">
              <Input id="address.number" inputMode="numeric" {...register("address.number")} {...inv("address.number")} />
            </Field>
            <Field label="Complemento" htmlFor="address.complement" optional className="sm:col-span-3">
              <Input id="address.complement" autoComplete="address-line2" placeholder="Apto, bloco, referência" {...register("address.complement")} />
            </Field>
            <Field label="Bairro" htmlFor="address.district" error={e("address.district")} className="sm:col-span-3">
              <Input id="address.district" {...register("address.district")} {...inv("address.district")} />
            </Field>
            <Field label="Cidade" htmlFor="address.city" error={e("address.city")} className="sm:col-span-4">
              <Input id="address.city" autoComplete="address-level2" {...register("address.city")} {...inv("address.city")} />
            </Field>
            <Field label="Estado" htmlFor="address.state" error={e("address.state")} className="sm:col-span-2">
              <Select id="address.state" autoComplete="address-level1" {...register("address.state")} {...inv("address.state")}>
                <option value="">UF</option>
                {BR_STATES.map((uf) => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </Select>
            </Field>
            <Field label="Quem vai receber" htmlFor="address.recipient" error={e("address.recipient")} className="sm:col-span-6">
              <Input id="address.recipient" {...register("address.recipient")} {...inv("address.recipient")} />
            </Field>
            {defaults.signedIn && (
              <label className="flex cursor-pointer items-center gap-3 text-[14px] sm:col-span-6">
                <Checkbox checked={Boolean(saveAddress)} onCheckedChange={(v) => setValue("saveAddress", Boolean(v))} />
                Salvar este endereço na minha conta
              </label>
            )}
          </div>
        </Section>

        <Section step={3} title="Entrega">
          {quote.shipping.options.length === 0 ? (
            <p className="text-[14px] text-smoke">Informe o CEP para ver as opções de entrega.</p>
          ) : (
            <fieldset className="space-y-2">
              <legend className="sr-only">Método de entrega</legend>
              {quote.shipping.options.map((o) => (
                <label
                  key={o.id}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-4 border px-4 py-4 transition-colors",
                    method === o.id ? "border-ink" : "border-stone hover:border-smoke",
                  )}
                >
                  <span className="flex items-center gap-4">
                    <input type="radio" value={o.id} className="size-4 accent-ink" {...register("shippingMethod")} />
                    <span>
                      <span className="block text-[15px] font-medium">{o.label}</span>
                      <span className="block text-[13px] text-smoke">
                        {o.days} — {o.description}
                      </span>
                    </span>
                  </span>
                  <span className="text-[15px] font-medium tabular-nums">{o.price === 0 ? "Grátis" : formatPrice(o.price)}</span>
                </label>
              ))}
            </fieldset>
          )}
        </Section>

        <Section step={4} title="Pagamento">
          {paymentMode === "stripe" ? (
            <div className="border border-stone p-5 text-[14px] leading-relaxed">
              <p className="font-medium">Cartão de crédito via Stripe (modo de teste)</p>
              <p className="mt-1 text-smoke">
                Você será levado à página segura do Stripe para pagar. Use o cartão de teste 4242 4242 4242 4242, qualquer data
                futura e qualquer CVC. Nenhum dado de cartão passa pelos servidores da VANTA.
              </p>
            </div>
          ) : (
            <div className="border border-warning/40 bg-warning/5 p-5 text-[14px] leading-relaxed">
              <p className="font-medium">Pagamento simulado — modo demonstração</p>
              <p className="mt-1 text-graphite">
                Esta loja ainda não tem um provedor de pagamento configurado. Ao finalizar, o pedido é registrado e marcado como
                pagamento de teste aprovado. Nenhuma cobrança é feita e nenhum dado de cartão é solicitado.
              </p>
            </div>
          )}
        </Section>
      </div>

      <aside aria-label="Resumo do pedido" className="lg:sticky lg:top-24 lg:self-start">
        <div className="bg-concrete p-6">
          <h2 className="text-[15px] font-semibold">
            Resumo do pedido <span className="font-normal text-smoke">({quote.itemCount})</span>
          </h2>
          <ul className="mt-4 max-h-80 divide-y divide-stone overflow-y-auto">
            {quote.lines.map((l) => (
              <li key={l.variantId} className="flex gap-3 py-3">
                <div className="relative h-20 w-16 shrink-0 bg-paper">
                  {l.image && <ProductImage src={l.image} alt={l.name} fill sizes="64px" className="object-cover" />}
                  <span className="absolute -right-2 -top-2 inline-flex size-5 items-center justify-center rounded-full bg-ink text-[11px] text-paper">
                    {l.quantity}
                  </span>
                </div>
                <div className="min-w-0 flex-1 text-[13px]">
                  <p className="font-medium">{l.name}</p>
                  <p className="text-smoke">
                    {l.colorName}
                    {l.sizeLabel !== "Único" && ` / ${l.sizeLabel}`}
                  </p>
                  {l.issue && <p className="text-danger">{l.issue === "out_of_stock" ? "Esgotado" : `Disponível: ${l.stock}`}</p>}
                </div>
                <p className="text-[13px] font-medium tabular-nums">{formatPrice(l.lineTotal)}</p>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-5 border-t border-stone pt-5">
            <CouponForm quote={quote} />
            <div className={cn("transition-opacity", refreshing && "opacity-60")} aria-live="polite">
              <TotalsTable quote={quote} />
            </div>
            <Button type="submit" size="lg" className="w-full" loading={placing || formState.isSubmitting} disabled={quote.hasIssues || refreshing}>
              <Lock className="size-4" />
              {paymentMode === "stripe" ? "Ir para o pagamento" : "Finalizar pedido"}
            </Button>
            {quote.hasIssues && (
              <p className="text-[13px] text-danger">
                Há itens indisponíveis. <Link href="/cart" className="underline">Revise o carrinho</Link>.
              </p>
            )}
            <p className="text-[12px] leading-relaxed text-smoke">
              Preços, descontos, frete e estoque são conferidos novamente no servidor no momento do pedido.
            </p>
          </div>
        </div>
      </aside>
    </form>
  );
}
