import { z } from "zod";
import { addressSchema, cpfSchema, emailSchema, phoneSchema } from "./common";

export const cartItemsSchema = z
  .array(z.object({ variantId: z.string().uuid(), quantity: z.number().int().min(1).max(10) }))
  .max(50);

export const checkoutSchema = z.object({
  fullName: z.string().trim().min(3, "Informe seu nome completo.").max(120),
  email: emailSchema,
  phone: phoneSchema,
  cpf: cpfSchema,
  address: addressSchema,
  shippingMethod: z.enum(["standard", "express", "pickup"]),
  couponCode: z.string().trim().max(40).optional().or(z.literal("")),
  saveAddress: z.boolean().optional(),
  items: cartItemsSchema.min(1, "Seu carrinho está vazio."),
});

export type CheckoutInput = z.input<typeof checkoutSchema>;
export type CheckoutData = z.output<typeof checkoutSchema>;
