"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { profileSchema, savedAddressSchema } from "@/schemas/account";
import { getCurrentUser } from "@/server/auth/session";
import { deleteAddress, saveAddress, updateProfile } from "@/server/services/account";
import { failure, fromZodError, type ActionResult } from "./result";

export async function updateProfileAction(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sua sessão expirou. Entre novamente." };
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);
  await updateProfile(user.id, parsed.data);
  revalidatePath("/account");
  return { ok: true, data: undefined, message: "Dados salvos." };
}

export async function saveAddressAction(input: unknown, id?: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sua sessão expirou. Entre novamente." };
  const parsed = savedAddressSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);
  if (id && !z.string().uuid().safeParse(id).success) return { ok: false, error: "Endereço inválido." };
  try {
    const d = parsed.data;
    await saveAddress(
      user.id,
      { ...d, complement: d.complement || null, phone: d.phone || null, isDefault: Boolean(d.isDefault) },
      id,
    );
    revalidatePath("/account/addresses");
    return { ok: true, data: undefined, message: "Endereço salvo." };
  } catch (e) {
    return failure(e);
  }
}

export async function deleteAddressAction(id: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sua sessão expirou. Entre novamente." };
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: "Endereço inválido." };
  await deleteAddress(user.id, id);
  revalidatePath("/account/addresses");
  return { ok: true, data: undefined, message: "Endereço removido." };
}
