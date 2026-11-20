import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Recuperar senha", robots: { index: false } };

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="display text-[clamp(2.25rem,7vw,3.5rem)]">Reset password</h1>
      <p className="mb-8 mt-3 text-[15px] text-graphite">Informe o e-mail da conta e enviaremos um link para criar uma nova senha.</p>
      <ForgotPasswordForm />
      <Link href="/login" className="mt-6 inline-block text-[14px] underline underline-offset-4">Voltar para o login</Link>
    </>
  );
}
