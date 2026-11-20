"use server";

import { revalidatePath } from "next/cache";
import { checkoutSchema } from "@/schemas/checkout";
import { getCurrentUser } from "@/server/auth/session";
import { CheckoutError, createOrder } from "@/server/services/orders";
import { failure, fromZodError, type ActionResult } from "./result";

export async function placeOrderAction(
  input: unknown,
): Promise<ActionResult<{ orderNumber: string; token: string; redirectUrl: string | null }>> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);
  const user = await getCurrentUser();
  try {
    const { order, redirectUrl } = await createOrder(parsed.data, user?.id ?? null);
    revalidatePath("/admin");
    return { ok: true, data: { orderNumber: order.number, token: order.accessToken, redirectUrl } };
  } catch (error) {
    if (error instanceof CheckoutError) return { ok: false, error: error.message };
    return failure(error, "Não foi possível finalizar o pedido. Nenhum valor foi cobrado.");
  }
}
