"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { slugify } from "@/lib/utils";
import {
  categoryFormSchema,
  colorFormSchema,
  couponFormSchema,
  orderStatusValues,
  productFormSchema,
  sizeFormSchema,
} from "@/schemas/admin";
import { assertAdmin } from "@/server/auth/session";
import * as catalog from "@/server/services/admin/catalog-admin";
import { setCustomerRole } from "@/server/services/admin/customers-admin";
import { generateDemoOrders, removeDemoData } from "@/server/services/admin/demo-data";
import { changeOrderStatus } from "@/server/services/orders";
import { uploadProductImage } from "@/server/storage";
import { failure, fromZodError, type ActionResult } from "./result";

const id = z.string().uuid();

/** Every admin mutation re-checks the role on the server. */
async function guarded<T>(fn: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  try {
    await assertAdmin();
    return await fn();
  } catch (e) {
    return failure(e);
  }
}

const refreshStore = () => {
  revalidatePath("/", "layout");
};

/* Products */
export async function saveProductAction(input: unknown, productId?: string) {
  return guarded<{ id: string }>(async () => {
    if (productId && !id.safeParse(productId).success) return { ok: false, error: "Produto inválido." };
    const parsed = productFormSchema.safeParse(input);
    if (!parsed.success) return fromZodError(parsed.error);
    const saved = await catalog.saveProduct(parsed.data, productId);
    refreshStore();
    return { ok: true, data: { id: saved }, message: productId ? "Produto atualizado." : "Produto criado." };
  });
}

export async function deleteProductAction(productId: string) {
  return guarded<undefined>(async () => {
    if (!id.safeParse(productId).success) return { ok: false, error: "Produto inválido." };
    await catalog.deleteProduct(productId);
    refreshStore();
    return { ok: true, data: undefined, message: "Produto excluído." };
  });
}

export async function setProductFlagAction(productId: string, flag: "isActive" | "isNew" | "isBestSeller" | "isFeatured", value: boolean) {
  return guarded<undefined>(async () => {
    if (!id.safeParse(productId).success || !["isActive", "isNew", "isBestSeller", "isFeatured"].includes(flag)) {
      return { ok: false, error: "Dados inválidos." };
    }
    await catalog.setProductFlag(productId, flag, Boolean(value));
    refreshStore();
    return { ok: true, data: undefined };
  });
}

export async function uploadImageAction(formData: FormData) {
  return guarded<{ url: string }>(async () => {
    const file = formData.get("file");
    if (!(file instanceof File)) return { ok: false, error: "Selecione uma imagem." };
    const url = await uploadProductImage(file);
    return { ok: true, data: { url } };
  });
}

/* Categories */
export async function saveCategoryAction(input: unknown, categoryId?: string) {
  return guarded<undefined>(async () => {
    const parsed = categoryFormSchema.safeParse(input);
    if (!parsed.success) return fromZodError(parsed.error);
    await catalog.saveCategory(parsed.data, categoryId && id.parse(categoryId));
    refreshStore();
    return { ok: true, data: undefined, message: "Categoria salva." };
  });
}
export async function deleteCategoryAction(categoryId: string) {
  return guarded<undefined>(async () => {
    await catalog.deleteCategory(id.parse(categoryId));
    refreshStore();
    return { ok: true, data: undefined, message: "Categoria excluída. Os produtos ficaram sem categoria." };
  });
}

/* Sizes & colours */
export async function saveSizeAction(input: unknown, sizeId?: string) {
  return guarded<undefined>(async () => {
    const parsed = sizeFormSchema.safeParse(input);
    if (!parsed.success) return fromZodError(parsed.error);
    await catalog.saveSize(parsed.data, sizeId && id.parse(sizeId));
    refreshStore();
    return { ok: true, data: undefined, message: "Tamanho salvo." };
  });
}
export async function deleteSizeAction(sizeId: string) {
  return guarded<undefined>(async () => {
    await catalog.deleteSize(id.parse(sizeId));
    return { ok: true, data: undefined, message: "Tamanho excluído." };
  });
}
export async function saveColorAction(input: unknown, colorId?: string) {
  return guarded<undefined>(async () => {
    const parsed = colorFormSchema.safeParse(input);
    if (!parsed.success) return fromZodError(parsed.error);
    await catalog.saveColor({ ...parsed.data, hex: parsed.data.hex.toUpperCase(), slug: slugify(parsed.data.name) }, colorId && id.parse(colorId));
    refreshStore();
    return { ok: true, data: undefined, message: "Cor salva." };
  });
}
export async function deleteColorAction(colorId: string) {
  return guarded<undefined>(async () => {
    await catalog.deleteColor(id.parse(colorId));
    return { ok: true, data: undefined, message: "Cor excluída." };
  });
}

/* Coupons */
export async function saveCouponAction(input: unknown, couponId?: string) {
  return guarded<undefined>(async () => {
    const parsed = couponFormSchema.safeParse(input);
    if (!parsed.success) return fromZodError(parsed.error);
    await catalog.saveCoupon(parsed.data, couponId && id.parse(couponId));
    revalidatePath("/admin/coupons");
    return { ok: true, data: undefined, message: "Cupom salvo." };
  });
}
export async function deleteCouponAction(couponId: string) {
  return guarded<undefined>(async () => {
    await catalog.deleteCoupon(id.parse(couponId));
    revalidatePath("/admin/coupons");
    return { ok: true, data: undefined, message: "Cupom excluído." };
  });
}

/* Orders */
export async function changeOrderStatusAction(orderId: string, status: string, note?: string) {
  return guarded<undefined>(async () => {
    const parsedStatus = z.enum(orderStatusValues).safeParse(status);
    if (!id.safeParse(orderId).success || !parsedStatus.success) return { ok: false, error: "Dados inválidos." };
    await changeOrderStatus(orderId, parsedStatus.data, typeof note === "string" ? note.slice(0, 300) : undefined);
    revalidatePath("/admin", "layout");
    return { ok: true, data: undefined, message: "Status atualizado." };
  });
}

/* Customers */
export async function setCustomerRoleAction(customerId: string, role: "customer" | "admin") {
  return guarded<undefined>(async () => {
    const me = await assertAdmin();
    if (me.id === customerId) return { ok: false, error: "Você não pode alterar o seu próprio acesso." };
    await setCustomerRole(id.parse(customerId), role === "admin" ? "admin" : "customer");
    revalidatePath("/admin/customers", "layout");
    return { ok: true, data: undefined, message: role === "admin" ? "Acesso de administrador concedido." : "Acesso de administrador removido." };
  });
}

/* Demo data */
export async function generateDemoDataAction() {
  return guarded<{ orders: number }>(async () => {
    const res = await generateDemoOrders();
    revalidatePath("/admin", "layout");
    return { ok: true, data: { orders: res.orders }, message: `${res.orders} pedidos de demonstração criados.` };
  });
}
export async function removeDemoDataAction() {
  return guarded<undefined>(async () => {
    await removeDemoData();
    revalidatePath("/admin", "layout");
    return { ok: true, data: undefined, message: "Dados de demonstração removidos." };
  });
}
