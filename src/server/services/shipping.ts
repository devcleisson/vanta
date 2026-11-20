import "server-only";
import { siteConfig } from "@/config/site";
import type { ShippingOption } from "@/types/cart";

/**
 * Shipping estimate by destination region (first CEP digit).
 * This is VANTA's own rate table — not a live carrier quote. To use real
 * carrier pricing, replace `quoteShipping` with a call to Correios/Melhor Envio:
 * every caller already goes through this function.
 */
const REGIONS: Record<string, { name: string; standard: [number, string]; express: [number, string] }> = {
  "0": { name: "Grande São Paulo", standard: [1990, "2 a 4 dias úteis"], express: [3490, "1 dia útil"] },
  "1": { name: "Interior de SP", standard: [2290, "3 a 5 dias úteis"], express: [3990, "1 a 2 dias úteis"] },
  "2": { name: "RJ e ES", standard: [2490, "4 a 6 dias úteis"], express: [4490, "2 a 3 dias úteis"] },
  "3": { name: "Minas Gerais", standard: [2490, "4 a 7 dias úteis"], express: [4490, "2 a 3 dias úteis"] },
  "4": { name: "Bahia e Sergipe", standard: [3290, "6 a 10 dias úteis"], express: [5990, "3 a 4 dias úteis"] },
  "5": { name: "PE, AL, PB e RN", standard: [3490, "7 a 11 dias úteis"], express: [6490, "3 a 5 dias úteis"] },
  "6": { name: "Norte e CE, PI, MA", standard: [3990, "8 a 14 dias úteis"], express: [6990, "4 a 6 dias úteis"] },
  "7": { name: "Centro-Oeste e TO, RO, AC", standard: [3290, "6 a 10 dias úteis"], express: [5990, "3 a 4 dias úteis"] },
  "8": { name: "Paraná e Santa Catarina", standard: [2690, "4 a 7 dias úteis"], express: [4790, "2 a 3 dias úteis"] },
  "9": { name: "Rio Grande do Sul", standard: [2890, "5 a 8 dias úteis"], express: [4990, "2 a 3 dias úteis"] },
};

export function normalizeCep(cep: string | null | undefined) {
  const digits = (cep ?? "").replace(/\D/g, "");
  return digits.length === 8 ? digits : null;
}

export function quoteShipping(cep: string | null, subtotalAfterDiscount: number, freeShipping = false): ShippingOption[] {
  const clean = normalizeCep(cep);
  if (!clean) return [];
  const region = REGIONS[clean[0]];
  const qualifiesFree = freeShipping || subtotalAfterDiscount >= siteConfig.freeShippingFrom;
  const options: ShippingOption[] = [
    {
      id: "standard",
      label: "Econômica",
      description: qualifiesFree ? `Frete grátis · ${region.name}` : region.name,
      price: qualifiesFree ? 0 : region.standard[0],
      days: region.standard[1],
    },
    {
      id: "express",
      label: "Expressa",
      description: region.name,
      price: freeShipping ? 0 : region.express[0],
      days: region.express[1],
    },
  ];
  options.push({
    id: "pickup",
    label: "Retirada na loja",
    description: "Rua Augusta, 1200 — São Paulo",
    price: 0,
    days: "Pronto em 1 dia útil",
  });
  return options;
}
