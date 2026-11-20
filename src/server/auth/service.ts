import "server-only";
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { and, eq, gt, isNull } from "drizzle-orm";
import { env, features } from "@/config/env";
import { getDb, schema as s } from "@/server/db/client";
import { createSupabaseServerClient } from "@/server/supabase/server";
import { createDemoSession, destroyDemoSession, findProfileByEmail, getCurrentUser } from "./session";

export type AuthResult = { ok: true; message?: string; resetLink?: string } | { ok: false; error: string };

const GENERIC_LOGIN_ERROR = "E-mail ou senha incorretos.";
const DUMMY_HASH = bcrypt.hashSync("vanta-timing-guard", 10);

export async function signUp(input: { fullName: string; email: string; password: string }): Promise<AuthResult> {
  if (features.supabaseAuth) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        data: { full_name: input.fullName },
        emailRedirectTo: `${env.siteUrl}/auth/callback?next=/account`,
      },
    });
    if (error) return { ok: false, error: translateSupabaseError(error.message) };
    if (data.user) {
      const db = await getDb();
      await db
        .insert(s.profiles)
        .values({ id: data.user.id, email: input.email, fullName: input.fullName })
        .onConflictDoUpdate({ target: s.profiles.id, set: { fullName: input.fullName } });
    }
    if (!data.session) {
      return { ok: true, message: "Conta criada. Confirme seu e-mail pelo link que enviamos para entrar." };
    }
    return { ok: true };
  }

  if (await findProfileByEmail(input.email)) {
    return { ok: false, error: "Já existe uma conta com este e-mail. Entre ou recupere sua senha." };
  }
  const db = await getDb();
  const [profile] = await db
    .insert(s.profiles)
    .values({ email: input.email, fullName: input.fullName, passwordHash: await bcrypt.hash(input.password, 10) })
    .returning();
  await createDemoSession(profile.id);
  return { ok: true };
}

export async function signIn(input: { email: string; password: string }): Promise<AuthResult> {
  if (features.supabaseAuth) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({ email: input.email, password: input.password });
    if (error) return { ok: false, error: translateSupabaseError(error.message) };
    return { ok: true };
  }
  const profile = await findProfileByEmail(input.email);
  // Always run bcrypt to keep timing similar for unknown e-mails.
  const hash = profile?.passwordHash ?? DUMMY_HASH;
  const valid = await bcrypt.compare(input.password, hash);
  if (!profile || !profile.passwordHash || !valid) return { ok: false, error: GENERIC_LOGIN_ERROR };
  await createDemoSession(profile.id);
  return { ok: true };
}

export async function signOut() {
  if (features.supabaseAuth) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  await destroyDemoSession();
}

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function requestPasswordReset(email: string): Promise<AuthResult> {
  const neutral = "Se houver uma conta com este e-mail, você receberá um link para criar uma nova senha.";
  if (features.supabaseAuth) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${env.siteUrl}/auth/callback?next=/reset-password`,
    });
    return { ok: true, message: neutral };
  }

  // Demo mode has no e-mail provider: the link is shown on screen and logged
  // to the server console so the flow can be tested end to end.
  const profile = await findProfileByEmail(email);
  if (!profile) return { ok: true, message: neutral };
  const token = randomBytes(32).toString("base64url");
  const db = await getDb();
  await db.insert(s.passwordResetTokens).values({
    userId: profile.id,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + 1000 * 60 * 30),
  });
  const resetLink = `/reset-password?token=${token}`;
  console.info(`[demo auth] Password reset link for ${email}: ${env.siteUrl}${resetLink}`);
  return { ok: true, message: neutral, resetLink };
}

export async function resetPassword(input: { token?: string; password: string }): Promise<AuthResult> {
  if (features.supabaseAuth) {
    // The /auth/callback route already exchanged the e-mail code for a session.
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.updateUser({ password: input.password });
    if (error) return { ok: false, error: "O link expirou. Solicite um novo e-mail de recuperação." };
    return { ok: true };
  }
  if (!input.token) return { ok: false, error: "Link inválido. Solicite uma nova recuperação de senha." };
  const db = await getDb();
  const [row] = await db
    .select()
    .from(s.passwordResetTokens)
    .where(
      and(
        eq(s.passwordResetTokens.tokenHash, hashToken(input.token)),
        isNull(s.passwordResetTokens.usedAt),
        gt(s.passwordResetTokens.expiresAt, new Date()),
      ),
    );
  if (!row) return { ok: false, error: "Este link expirou ou já foi usado. Solicite um novo." };
  await db.transaction(async (tx) => {
    await tx.update(s.passwordResetTokens).set({ usedAt: new Date() }).where(eq(s.passwordResetTokens.id, row.id));
    await tx
      .update(s.profiles)
      .set({ passwordHash: await bcrypt.hash(input.password, 10) })
      .where(eq(s.profiles.id, row.userId));
  });
  await createDemoSession(row.userId);
  return { ok: true };
}

export async function changePassword(input: { currentPassword?: string; password: string }): Promise<AuthResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Entre novamente para alterar a senha." };
  if (features.supabaseAuth) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.updateUser({ password: input.password });
    return error ? { ok: false, error: translateSupabaseError(error.message) } : { ok: true };
  }
  const profile = await findProfileByEmail(user.email);
  if (!profile?.passwordHash || !(await bcrypt.compare(input.currentPassword ?? "", profile.passwordHash))) {
    return { ok: false, error: "A senha atual está incorreta." };
  }
  const db = await getDb();
  await db
    .update(s.profiles)
    .set({ passwordHash: await bcrypt.hash(input.password, 10) })
    .where(eq(s.profiles.id, user.id));
  return { ok: true };
}

function translateSupabaseError(message: string) {
  const m = message.toLowerCase();
  if (m.includes("invalid login")) return GENERIC_LOGIN_ERROR;
  if (m.includes("already registered")) return "Já existe uma conta com este e-mail.";
  if (m.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar.";
  if (m.includes("password")) return "Senha fraca: use pelo menos 8 caracteres.";
  if (m.includes("rate limit")) return "Muitas tentativas. Aguarde alguns minutos.";
  return "Não foi possível concluir. Tente novamente.";
}
