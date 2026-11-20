import { z } from "zod";
import { addressSchema } from "./common";
import { isValidCpf } from "@/lib/validators";

export const profileSchema = z.object({
  fullName: z.string().trim().min(3, "Informe seu nome completo.").max(120),
  phone: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => v === "" || v.length === 10 || v.length === 11, "Informe um telefone com DDD."),
  cpf: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => v === "" || isValidCpf(v), "CPF inválido."),
});

export const savedAddressSchema = addressSchema.extend({
  label: z.string().trim().min(1, "Dê um nome ao endereço.").max(40),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  isDefault: z.boolean().optional(),
});

export type ProfileInput = z.input<typeof profileSchema>;
export type SavedAddressInput = z.input<typeof savedAddressSchema>;
