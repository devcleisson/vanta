import { z } from "zod";
import { BR_STATES, isValidCpf } from "@/lib/validators";

export const emailSchema = z.string().trim().toLowerCase().email("Informe um e-mail válido.").max(160);
export const passwordSchema = z.string().min(8, "A senha precisa ter pelo menos 8 caracteres.").max(72);
export const phoneSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, ""))
  .refine((v) => v.length === 10 || v.length === 11, "Informe um telefone com DDD.");
export const cpfSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, ""))
  .refine(isValidCpf, "CPF inválido.");
export const cepSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, ""))
  .refine((v) => v.length === 8, "CEP deve ter 8 dígitos.");
export const stateSchema = z.enum(BR_STATES, { message: "Selecione o estado." });
export const uuidSchema = z.string().uuid();

export const addressSchema = z.object({
  recipient: z.string().trim().min(3, "Informe o nome de quem recebe.").max(120),
  cep: cepSchema,
  street: z.string().trim().min(3, "Informe o endereço.").max(160),
  number: z.string().trim().min(1, "Informe o número.").max(20),
  complement: z.string().trim().max(80).optional().or(z.literal("")),
  district: z.string().trim().min(2, "Informe o bairro.").max(80),
  city: z.string().trim().min(2, "Informe a cidade.").max(80),
  state: stateSchema,
});
export type AddressInput = z.input<typeof addressSchema>;
