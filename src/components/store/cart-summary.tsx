"use client";

import { Check, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/input";
import { siteConfig } from "@/config/site";
import { formatCep, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useCart } from "@/stores/cart-store";
import type { CartQuote } from "@/types/cart";

export function CouponForm({ quote }: { quote: CartQuote | null }) {
  const couponCode = useCart((s) => s.couponCode);
  const setCoupon = useCart((s) => s.setCoupon);
  const [code, setCode] = useState("");
  const applied = quote?.coupon;
  const apply = () => {
    if (code.trim()) setCoupon(code.trim().toUpperCase());
    setCode("");
  };

  if (couponCode && applied) {
    return (
      <div className={cn("flex items-center justify-between gap-3 border px-3 py-2.5 text-[13px]", applied.valid ? "border-ink" : "border-danger/50")}>
        <div className="flex items-center gap-2">
          {applied.valid ? <Check className="size-4" /> : <X className="size-4 text-danger" />}
          <div>
            <p className="font-semibold">{applied.code}</p>
            <p className={cn(applied.valid ? "text-smoke" : "text-danger")}>{applied.valid ? applied.description : applied.message}</p>
          </div>
        </div>
        <button type="button" onClick={() => setCoupon(null)} className="text-[13px] underline underline-offset-4">
          Remover
        </button>
      </div>
    );
  }

  return (
    // Not a <form>: this control also lives inside the checkout form.
    <div className="flex gap-2" role="group" aria-label="Cupom de desconto">
      <label htmlFor="coupon" className="sr-only">Cupom de desconto</label>
      <input
        id="coupon"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="Cupom de desconto"
        className={cn(inputClass, "h-11 text-[14px] uppercase placeholder:normal-case")}
        autoComplete="off"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            apply();
          }
        }}
      />
      <Button type="button" variant="outline" className="h-11 shrink-0" disabled={!code.trim()} onClick={apply}>
        Aplicar
      </Button>
    </div>
  );
}

export function ShippingEstimator({ quote, compact }: { quote: CartQuote | null; compact?: boolean }) {
  const cep = useCart((s) => s.cep);
  const setCep = useCart((s) => s.setCep);
  const method = useCart((s) => s.shippingMethod);
  const setMethod = useCart((s) => s.setShippingMethod);
  const [value, setValue] = useState(cep ? formatCep(cep) : "");
  const options = quote?.shipping.options ?? [];

  return (
    <div>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const digits = value.replace(/\D/g, "");
          setCep(digits.length === 8 ? digits : null);
        }}
      >
        <label htmlFor="cep-estimate" className="sr-only">CEP para calcular o frete</label>
        <input
          id="cep-estimate"
          inputMode="numeric"
          value={value}
          onChange={(e) => setValue(formatCep(e.target.value))}
          placeholder="CEP para calcular o frete"
          className={cn(inputClass, "h-11 text-[14px]")}
          autoComplete="postal-code"
        />
        <Button type="submit" variant="outline" className="h-11 shrink-0" disabled={value.replace(/\D/g, "").length !== 8}>
          Calcular
        </Button>
      </form>
      {cep && options.length > 0 && (
        <fieldset className={cn("mt-3 space-y-1.5", compact && "text-[13px]")}>
          <legend className="sr-only">Opções de entrega</legend>
          {options.map((o) => {
            const selected = (method ?? options[0].id) === o.id;
            return (
              <label
                key={o.id}
                className={cn("flex cursor-pointer items-center justify-between gap-3 border px-3 py-2.5 text-[13px] transition-colors", selected ? "border-ink" : "border-stone hover:border-smoke")}
              >
                <span className="flex items-center gap-3">
                  <input type="radio" name="shipping-estimate" className="accent-ink" checked={selected} onChange={() => setMethod(o.id)} />
                  <span>
                    <span className="font-medium">{o.label}</span>
                    <span className="block text-smoke">{o.days}</span>
                  </span>
                </span>
                <span className="font-medium tabular-nums">{o.price === 0 ? "Grátis" : formatPrice(o.price)}</span>
              </label>
            );
          })}
        </fieldset>
      )}
      <p className="mt-2 text-[12px] text-smoke">Estimativa pela tabela de fretes da VANTA, confirmada no checkout.</p>
    </div>
  );
}

export function TotalsTable({ quote }: { quote: CartQuote }) {
  const remaining = siteConfig.freeShippingFrom - (quote.subtotal - quote.discount);
  return (
    <dl className="space-y-2 text-[14px] tabular-nums">
      <div className="flex justify-between">
        <dt>Subtotal</dt>
        <dd>{formatPrice(quote.subtotal)}</dd>
      </div>
      {quote.discount > 0 && (
        <div className="flex justify-between">
          <dt>Desconto {quote.coupon?.code && <span className="text-smoke">({quote.coupon.code})</span>}</dt>
          <dd>−{formatPrice(quote.discount)}</dd>
        </div>
      )}
      <div className="flex justify-between">
        <dt>Frete {quote.shipping.selected && <span className="text-smoke">({quote.shipping.selected.label})</span>}</dt>
        <dd>
          {quote.shipping.selected
            ? quote.shipping.selected.price === 0
              ? "Grátis"
              : formatPrice(quote.shipping.selected.price)
            : <span className="text-smoke">Informe o CEP</span>}
        </dd>
      </div>
      <div className="flex justify-between border-t border-stone pt-3 text-[16px] font-semibold">
        <dt>Total</dt>
        <dd>{formatPrice(quote.total)}</dd>
      </div>
      {remaining > 0 && quote.subtotal > 0 && (
        <p className="pt-1 text-[12px] text-smoke">
          Faltam {formatPrice(remaining)} para frete grátis na modalidade Econômica.
        </p>
      )}
    </dl>
  );
}
