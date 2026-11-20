import { z } from "zod";

const money = z.coerce
  .number({ message: "Informe um valor." })
  .min(0, "Valor inválido.")
  .max(1_000_000, "Valor muito alto.");

export const productFormSchema = z
  .object({
    name: z.string().trim().min(3, "Informe o nome.").max(120),
    slug: z
      .string()
      .trim()
      .min(3, "Informe a URL.")
      .max(120)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use apenas letras minúsculas, números e hífens."),
    description: z.string().trim().min(20, "Escreva uma descrição de pelo menos 20 caracteres.").max(4000),
    details: z.string().max(2000).optional(),
    categoryId: z.string().uuid("Selecione a categoria."),
    /** Reais, converted to cents on the server. */
    price: money.refine((v) => v > 0, "O preço deve ser maior que zero."),
    salePrice: z.union([z.literal(""), z.null(), money]).optional(),
    isActive: z.boolean(),
    isNew: z.boolean(),
    isBestSeller: z.boolean(),
    isFeatured: z.boolean(),
    variants: z
      .array(
        z.object({
          id: z.string().uuid().optional(),
          sizeId: z.string().uuid(),
          colorId: z.string().uuid(),
          sku: z.string().trim().min(3, "SKU obrigatório.").max(60),
          stock: z.coerce.number().int("Estoque deve ser inteiro.").min(0, "Estoque não pode ser negativo.").max(100000),
        }),
      )
      .min(1, "Selecione pelo menos um tamanho e uma cor."),
    images: z
      .array(
        z.object({
          url: z.string().trim().min(1),
          alt: z.string().trim().max(160).optional(),
          colorId: z.string().uuid().nullable().optional(),
        }),
      )
      .max(30),
  })
  .refine((d) => d.salePrice == null || d.salePrice === "" || Number(d.salePrice) < Number(d.price), {
    message: "O preço promocional deve ser menor que o preço normal.",
    path: ["salePrice"],
  })
  .refine((d) => new Set(d.variants.map((v) => `${v.sizeId}:${v.colorId}`)).size === d.variants.length, {
    message: "Há variantes duplicadas.",
    path: ["variants"],
  })
  .refine((d) => new Set(d.variants.map((v) => v.sku.toUpperCase())).size === d.variants.length, {
    message: "Cada variante precisa de um SKU único.",
    path: ["variants"],
  });

export type ProductFormInput = z.input<typeof productFormSchema>;
export type ProductFormData = z.output<typeof productFormSchema>;

export const categoryFormSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome.").max(60),
  slug: z.string().trim().min(2).max(60).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use letras minúsculas, números e hífens."),
  description: z.string().trim().max(300).optional(),
  imageUrl: z.string().trim().max(500).optional(),
  sortOrder: z.coerce.number().int().min(0).max(999),
});

export const sizeFormSchema = z.object({
  label: z.string().trim().min(1, "Informe o tamanho.").max(12),
  sortOrder: z.coerce.number().int().min(0).max(999),
});

export const colorFormSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome da cor.").max(40),
  hex: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "Use o formato #RRGGBB."),
});

export const couponFormSchema = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .min(3, "Mínimo de 3 caracteres.")
      .max(30)
      .regex(/^[A-Z0-9_-]+$/, "Use letras, números, _ ou -."),
    description: z.string().trim().max(160).optional(),
    type: z.enum(["percent", "fixed", "free_shipping"]),
    value: z.coerce.number().min(0).max(100000),
    minSubtotal: z.coerce.number().min(0).max(100000),
    maxUses: z.union([z.literal(""), z.null(), z.coerce.number().int().min(1, "Mínimo de 1 uso.")]).optional(),
    expiresAt: z.string().optional(),
    isActive: z.boolean(),
  })
  .refine((d) => d.type !== "percent" || (d.value >= 1 && d.value <= 100), {
    message: "Percentual entre 1 e 100.",
    path: ["value"],
  })
  .refine((d) => d.type !== "fixed" || d.value > 0, { message: "Informe o valor do desconto.", path: ["value"] });

export const orderStatusValues = ["pending", "payment_approved", "preparing", "shipped", "delivered", "cancelled"] as const;
export type OrderStatus = (typeof orderStatusValues)[number];
