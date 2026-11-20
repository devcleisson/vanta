import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/auth-forms";
import { features } from "@/config/env";
import { getCurrentUser } from "@/server/auth/session";

export const metadata: Metadata = { title: "Nova senha", robots: { index: false } };

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  // Supabase: the e-mail link signs the user in through /auth/callback first.
  const valid = features.supabaseAuth ? Boolean(await getCurrentUser()) : Boolean(token);
  return (
    <>
      <h1 className="display text-[clamp(2.25rem,7vw,3.5rem)]">New password</h1>
      {valid ? (
        <>
          <p className="mb-8 mt-3 text-[15px] text-graphite">Escolha uma nova senha para sua conta.</p>
          <ResetPasswordForm token={token} />
        </>
      ) : (
        <p className="mt-4 text-[15px] text-graphite">
          Este link é inválido ou expirou.{" "}
          <Link href="/forgot-password" className="text-ink underline underline-offset-4">Solicite um novo</Link>.
        </p>
      )}
    </>
  );
}
