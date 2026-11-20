"use server";

import { revalidatePath } from "next/cache";
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema, changePasswordSchema } from "@/schemas/auth";
import * as auth from "@/server/auth/service";
import { fromZodError, type ActionResult } from "./result";

function safeNext(next: unknown) {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/account";
}

export async function loginAction(input: unknown, next?: string): Promise<ActionResult<{ redirectTo: string }>> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);
  const result = await auth.signIn(parsed.data);
  if (!result.ok) return result;
  revalidatePath("/", "layout");
  return { ok: true, data: { redirectTo: safeNext(next) } };
}

export async function registerAction(input: unknown, next?: string): Promise<ActionResult<{ redirectTo: string | null }>> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);
  const result = await auth.signUp(parsed.data);
  if (!result.ok) return result;
  revalidatePath("/", "layout");
  // When e-mail confirmation is required there is no session yet.
  return { ok: true, data: { redirectTo: result.message ? null : safeNext(next) }, message: result.message };
}

export async function logoutAction(): Promise<ActionResult> {
  await auth.signOut();
  revalidatePath("/", "layout");
  return { ok: true, data: undefined };
}

export async function forgotPasswordAction(input: unknown): Promise<ActionResult<{ resetLink?: string }>> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);
  const result = await auth.requestPasswordReset(parsed.data.email);
  if (!result.ok) return result;
  return { ok: true, data: { resetLink: result.resetLink }, message: result.message };
}

export async function resetPasswordAction(input: unknown): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);
  const result = await auth.resetPassword(parsed.data);
  if (!result.ok) return result;
  revalidatePath("/", "layout");
  return { ok: true, data: undefined };
}

export async function changePasswordAction(input: unknown): Promise<ActionResult> {
  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) return fromZodError(parsed.error);
  const result = await auth.changePassword(parsed.data);
  if (!result.ok) return result;
  return { ok: true, data: undefined, message: "Senha atualizada." };
}
