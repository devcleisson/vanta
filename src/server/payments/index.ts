import "server-only";
import { features } from "@/config/env";
import { siteConfig } from "@/config/site";
import { getStripe } from "./stripe";

export type PaymentOrder = {
  id: string;
  number: string;
  accessToken: string;
  email: string;
  total: number;
  shippingCost: number;
  discount: number;
  items: { name: string; quantity: number; unitPrice: number; description: string; image: string | null }[];
};

export type PaymentStart =
  | { provider: "stripe"; reference: string; redirectUrl: string }
  | { provider: "simulated"; reference: string };

export const activePaymentProvider = (): "stripe" | "simulated" => (features.stripe ? "stripe" : "simulated");

/**
 * Starts the payment for an order that was already validated and persisted.
 * Stripe (test mode): creates a hosted Checkout Session — card data never
 * touches this server. Simulated: no money moves; the order is flagged as a
 * demonstration payment everywhere it is displayed.
 */
export async function startPayment(order: PaymentOrder): Promise<PaymentStart> {
  const stripe = getStripe();
  if (!stripe) {
    return { provider: "simulated", reference: `SIM-${order.number}` };
  }

  const base = siteConfig.url.replace(/\/$/, "");
  const returnUrl = `${base}/order/${order.number}?token=${order.accessToken}`;

  // Discounts are folded into a single line so the charged total matches the
  // server-computed order total exactly.
  const lineItems =
    order.discount > 0
      ? [
          {
            quantity: 1,
            price_data: {
              currency: "brl",
              unit_amount: order.total - order.shippingCost,
              product_data: {
                name: `Pedido ${order.number}`,
                description: order.items.map((i) => `${i.quantity}× ${i.name} (${i.description})`).join(", ").slice(0, 500),
              },
            },
          },
        ]
      : order.items.map((i) => ({
          quantity: i.quantity,
          price_data: {
            currency: "brl",
            unit_amount: i.unitPrice,
            product_data: { name: i.name, description: i.description },
          },
        }));

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: order.email,
    client_reference_id: order.id,
    metadata: { orderId: order.id, orderNumber: order.number },
    line_items: lineItems,
    shipping_options:
      order.shippingCost > 0
        ? [{ shipping_rate_data: { display_name: "Frete", type: "fixed_amount", fixed_amount: { amount: order.shippingCost, currency: "brl" } } }]
        : undefined,
    success_url: `${returnUrl}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${returnUrl}&cancelled=1`,
    expires_at: Math.floor(Date.now() / 1000) + 60 * 30,
  });

  return { provider: "stripe", reference: session.id, redirectUrl: session.url! };
}
