import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { env } from "@/config/env";
import { getStripe } from "@/server/payments/stripe";
import { markStripeExpired, markStripePaid } from "@/server/services/orders";

/**
 * Stripe webhook (test mode). Configure in the Stripe dashboard or with
 * `stripe listen --forward-to localhost:3000/api/stripe/webhook`.
 * Events are verified with STRIPE_WEBHOOK_SECRET before anything is trusted.
 */
export async function POST(request: Request) {
  const stripe = getStripe();
  if (!stripe || !env.stripeWebhookSecret) {
    return NextResponse.json({ error: "Stripe is not configured" }, { status: 501 });
  }
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, env.stripeWebhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const orderId = session.metadata?.orderId;
  if (orderId) {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      if (session.payment_status === "paid") await markStripePaid(orderId, session.id);
    } else if (event.type === "checkout.session.expired" || event.type === "checkout.session.async_payment_failed") {
      await markStripeExpired(orderId, session.id);
    }
  }
  return NextResponse.json({ received: true });
}
