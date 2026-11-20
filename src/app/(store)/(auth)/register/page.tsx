import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/auth/auth-forms";
import { getCurrentUser } from "@/server/auth/session";

export const metadata: Metadata = { title: "Criar conta", robots: { index: false } };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  if (await getCurrentUser()) redirect("/account");
  return (
    <>
      <h1 className="display text-[clamp(2.5rem,8vw,4rem)]">Join VANTA</h1>
      <p className="mb-8 mt-3 text-[15px] text-graphite">
        Acompanhe pedidos, salve endereços e leve seus favoritos para qualquer dispositivo. Já tem conta?{" "}
        <Link href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-ink underline underline-offset-4">Entrar</Link>
      </p>
      <RegisterForm next={next} />
    </>
  );
}
