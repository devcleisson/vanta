"use server";

import { z } from "zod";
import { getProductBySlug } from "@/server/services/catalog";
import { subscribeNewsletter } from "@/server/services/account";
import { emailSchema } from "@/schemas/common";
import type { ActionResult } from "./result";

export async function getQuickViewAction(slug: string) {
  if (!z.string().max(120).safeParse(slug).success) return null;
  return getProductBySlug(slug);
}

export async function subscribeNewsletterAction(email: unknown): Promise<ActionResult> {
  const parsed = emailSchema.safeParse(email);
  if (!parsed.success) return { ok: false, error: "Informe um e-mail válido." };
  const created = await subscribeNewsletter(parsed.data);
  return {
    ok: true,
    data: undefined,
    message: created ? "Inscrição confirmada. Você recebe os lançamentos antes de todo mundo." : "Este e-mail já está na lista.",
  };
}

export async function searchSuggestAction(q: string) {
  const term = typeof q === "string" ? q.trim().slice(0, 60) : "";
  if (term.length < 2) return [];
  const { searchProducts } = await import("@/server/services/catalog");
  const result = await searchProducts({ q: term, perPage: 5, sort: "best-sellers" });
  return result.items;
}
