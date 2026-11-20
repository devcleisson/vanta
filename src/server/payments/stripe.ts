import "server-only";
import Stripe from "stripe";
import { env, features } from "@/config/env";

let client: Stripe | null = null;

/** Stripe client — only ever created with a *test* secret key (see config/env.ts). */
export function getStripe() {
  if (!features.stripe) return null;
  client ??= new Stripe(env.stripeSecretKey!);
  return client;
}
